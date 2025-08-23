import io, wave, os
from typing import Optional, List, Dict

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from piper.voice import PiperVoice
from faster_whisper import WhisperModel
import httpx

VOICES_DIR = os.environ.get("VOICES_DIR", "/voices")
WHISPER_MODELS_DIR = os.environ.get("WHISPER_MODELS_DIR", "/whisper-models")
FASTER_WHISPER_MODEL = os.environ.get("FASTER_WHISPER_MODEL", "base.en")
DEFAULT_PIPER_VOICE = os.environ.get("DEFAULT_PIPER_VOICE", "en_US-GlaDOS-medium")

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3")

app = FastAPI(title="Musai API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ---------- helpers ----------
def _voice_config_path(base_no_ext: str) -> Optional[str]:
    """Return the matching config path for a model base (with or without .onnx)."""
    candidates = [base_no_ext + ".onnx.json", base_no_ext + ".json"]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def list_onnx_voices() -> List[Dict[str, str]]:
    """Return available voices as [{'name','model','config'}]. Only include complete pairs."""
    out = []
    if not os.path.isdir(VOICES_DIR):
        return out
    for fname in os.listdir(VOICES_DIR):
        if not fname.endswith(".onnx"):
            continue
        model = os.path.join(VOICES_DIR, fname)
        base = os.path.splitext(model)[0]  # remove .onnx
        cfg = _voice_config_path(base)
        if cfg:
            out.append({"name": os.path.basename(base), "model": model, "config": cfg})
    return sorted(out, key=lambda x: x["name"])

def _resolve_voice_paths(voice_name: str):
    base = os.path.join(VOICES_DIR, voice_name)
    candidates = [
        (base + ".onnx", base + ".onnx.json"),
        (base + ".onnx", base + ".json"),
        (base,           base + ".json"),
    ]
    for m, c in candidates:
        if os.path.isfile(m) and os.path.isfile(c):
            return m, c
    raise FileNotFoundError(
        f"Could not find model/config for voice '{voice_name}'. Looked for: {candidates}"
    )

# small cache to avoid reloading PiperVoice each request
_VOICE_CACHE: Dict[str, PiperVoice] = {}

def _get_piper_voice(voice_name: str) -> PiperVoice:
    v = _VOICE_CACHE.get(voice_name)
    if v:
        return v
    model_path, config_path = _resolve_voice_paths(voice_name)
    v = PiperVoice.load(model_path, config_path)
    _VOICE_CACHE[voice_name] = v
    return v

# Lazy-init STT model
_whisper_model: Optional[WhisperModel] = None
def get_whisper():
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = WhisperModel(
            FASTER_WHISPER_MODEL,
            device="auto",
            compute_type="int8",
            download_root=WHISPER_MODELS_DIR,
        )
    return _whisper_model

# ---------- endpoints ----------
@app.get("/healthz")
def health():
    return "ok"

@app.get("/voices")
def voices():
    return list_onnx_voices()

@app.post("/tts")
async def tts(payload: dict):
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "Missing text")

    voice_name = (payload.get("voice") or
                  os.environ.get("DEFAULT_PIPER_VOICE") or
                  "en_US-GlaDOS-medium")

    try:
        model_path, config_path = _resolve_voice_paths(voice_name)
    except FileNotFoundError as e:
        raise HTTPException(400, str(e))

    try:
        # Load voice (consider caching if performance matters)
        voice = PiperVoice.load(model_path, config_path)

        # Synthesize returns int16 PCM samples as a NumPy array
        samples = voice.synthesize(text)

        # Write to WAV in-memory
        out = io.BytesIO()
        with wave.open(out, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(voice.config.sample_rate)
            wf.writeframes(samples.tobytes())
        out.seek(0)

        return StreamingResponse(out, media_type="audio/wav",
                                 headers={"Cache-Control": "no-store"})

    except Exception as e:
        raise HTTPException(502, f"TTS failed: {e}")

@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    data = await file.read()
    if not data or len(data) <= 44:
        raise HTTPException(400, "Empty/invalid WAV")
    try:
        segments, _ = get_whisper().transcribe(io.BytesIO(data), task="transcribe", language="en")
        text = "".join(seg.text for seg in segments).strip()
        return JSONResponse({"text": text})
    except Exception as e:
        raise HTTPException(502, f"STT failed: {e}")

# Minimal OpenAI-compatible chat completions proxy to Ollama
@app.post("/v1/chat/completions")
async def chat_completions(body: Dict):
    messages = body.get("messages") or []
    prompt = "\n".join(f"{m.get('role','user')}: {m.get('content','')}" for m in messages)
    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            r.raise_for_status()
            out = r.json()
    except Exception as e:
        raise HTTPException(502, f"Ollama proxy failed: {e}")
    content = out.get("response", "")
    return {
        "id": "musai-chat-1",
        "object": "chat.completion",
        "choices": [
            {"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}
        ],
        "model": OLLAMA_MODEL,
    }




