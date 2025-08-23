import os
import io
import wave
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
def list_onnx_voices() -> List[Dict[str, str]]:
    """Return available voices from /voices as [{"name":..., "model":..., "config":...}, ...]."""
    names = []
    if not os.path.isdir(VOICES_DIR):
        return names
    files = os.listdir(VOICES_DIR)
    onnx = [f for f in files if f.endswith(".onnx")]
    for m in onnx:
        base = m[:-5]  # strip ".onnx"
        cfg_json = base + ".json"
        model_path = os.path.join(VOICES_DIR, m)
        cfg_path = os.path.join(VOICES_DIR, cfg_json)
        names.append({
            "name": base,               # we use base as the "voice name"
            "model": model_path,
            "config": cfg_path if os.path.exists(cfg_path) else "",
        })
    return names

def resolve_voice_paths(voice_name: Optional[str]):
    """Map a voice name to onnx/config file paths in /voices."""
    want = (voice_name or DEFAULT_PIPER_VOICE).strip()
    for v in list_onnx_voices():
        if v["name"] == want:
            if not os.path.exists(v["model"]):
                raise FileNotFoundError(f"Voice model not found: {v['model']}")
            # config is optional but recommended
            return v["model"], (v["config"] if v["config"] else None)
    raise FileNotFoundError(f"Voice '{want}' not found in {VOICES_DIR}")

def gen_wav_bytes(samples, sample_rate: int = 22050):
    """Write float32 samples (-1..1) to a 16-bit PCM WAV stream."""
    # piper returns int16 already, but we keep a simple WAV writer
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(samples.tobytes())
    buf.seek(0)
    return buf

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
def tts(payload: Dict, voice: Optional[str] = Query(default=None, description="Voice name (base filename without extension)")):
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "Missing text")

    try:
        model_path, config_path = resolve_voice_paths(voice)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    try:
        pv = PiperVoice.load(model_path, config_path if config_path else None)
        # returns int16 numpy array (mono) and sample_rate
        audio, sr = pv.synthesize(text)
    except Exception as e:
        raise HTTPException(502, f"TTS failed: {e}")

    wav_stream = gen_wav_bytes(audio, sr)
    return StreamingResponse(wav_stream, media_type="audio/wav",
                             headers={"Cache-Control": "no-store"})

@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    data = await file.read()
    if not data or len(data) <= 44:
        raise HTTPException(400, "Empty/invalid WAV")

    try:
        segments, _ = get_whisper().transcribe(io.BytesIO(data), task="transcribe", language="en")
        text = "".join(seg.text for seg in segments).strip()
    except Exception as e:
        raise HTTPException(502, f"STT failed: {e}")

    return JSONResponse({"text": text})

# Minimal OpenAI-compatible chat completions proxy to Ollama (optional)
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
