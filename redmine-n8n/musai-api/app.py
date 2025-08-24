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
    import collections.abc as cabc
    try:
        import numpy as np  # optional but helpful if synth returns ndarray
    except Exception:
        np = None

    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "Missing text")

    voice_name = (
        payload.get("voice")
        or os.environ.get("DEFAULT_PIPER_VOICE")
        or "en_US-GlaDOS-medium"
    )

    # 1) get (and cache) the voice
    try:
        voice = _get_piper_voice(voice_name)
    except Exception as e:
        raise HTTPException(400, f"Voice load error: {e}")

    # 2) run synth
    try:
        pcm = voice.synthesize(text)  # may be ndarray, bytes, or a generator/iterable
    except Exception as e:
        raise HTTPException(502, f"TTS failed during synth: {e}")

    # 3) normalize to bytes
    data = bytearray()

    def _append_chunk(ch):
        # numpy array (int16) → bytes
        if np is not None and isinstance(ch, np.ndarray):
            # ensure int16 little-endian
            if ch.dtype != np.int16:
                ch = ch.astype(np.int16, copy=False)
            data.extend(ch.tobytes())
        # has .tobytes (e.g., array-like)
        elif hasattr(ch, "tobytes"):
            data.extend(ch.tobytes())
        # already bytes/bytearray
        elif isinstance(ch, (bytes, bytearray)):
            data.extend(ch)
        else:
            # last-ditch: try to interpret as iterable of ints
            try:
                for v in ch:  # e.g., python list of int16
                    data.extend(int(v).to_bytes(2, "little", signed=True))
            except Exception as exc:
                raise HTTPException(502, f"TTS produced unsupported chunk type: {type(ch)} ({exc})")

    # ndarray / bytes vs generator/iterable
    if isinstance(pcm, (bytes, bytearray)) or hasattr(pcm, "tobytes"):
        _append_chunk(pcm)
    elif isinstance(pcm, cabc.Iterable):
        for part in pcm:
            _append_chunk(part)
    else:
        raise HTTPException(502, f"TTS returned unsupported type: {type(pcm)}")

    # 4) sanity-check: must have audio
    if len(data) == 0:
        raise HTTPException(502, "TTS produced 0 audio bytes (check voice model/config and text)")

    # 5) wrap as WAV
    sr = getattr(getattr(voice, "config", None), "sample_rate", None) or 22050
    out = io.BytesIO()
    with wave.open(out, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)          # PCM16
        wf.setframerate(sr)
        wf.writeframes(data)
    out.seek(0)

    return StreamingResponse(out, media_type="audio/wav",
                             headers={"Cache-Control": "no-store"})

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












