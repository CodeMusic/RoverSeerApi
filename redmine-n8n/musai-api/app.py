import io
import os
import tempfile
import subprocess
from typing import Optional, List

from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Query
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse
from faster_whisper import WhisperModel
import soundfile as sf

# -------- Settings --------
FASTER_WHISPER_MODEL = os.environ.get("FASTER_WHISPER_MODEL", "base.en")
DEFAULT_PIPER_VOICE = os.environ.get("DEFAULT_PIPER_VOICE", "en_US-GlaDOS-medium")
VOICES_DIR = os.environ.get("VOICES_DIR", "/voices")
WHISPER_MODELS_DIR = os.environ.get("WHISPER_MODELS_DIR", "/whisper-models")

# -------- App --------
app = FastAPI(title="Musai API", version="1.0.0")

# Load Faster-Whisper at startup
# compute_type="auto" lets it pick best available (CPU-only images use int8/float32)
model: Optional[WhisperModel] = None

@app.on_event("startup")
def _startup() -> None:
    global model
    # If a local model directory exists under /whisper-models/<name>, pass that path; else pass the name.
    local_path = os.path.join(WHISPER_MODELS_DIR, FASTER_WHISPER_MODEL)
    model_path = local_path if os.path.exists(local_path) else FASTER_WHISPER_MODEL
    model = WhisperModel(model_path, compute_type="auto")
    print(f"[startup] Faster-Whisper ready ({model_path})")
    print(f"[startup] Voices dir: {VOICES_DIR}")
    print(f"[startup] Default Piper voice: {DEFAULT_PIPER_VOICE}")


@app.get("/healthz", response_class=PlainTextResponse)
def healthz() -> str:
    return "ok"


@app.get("/voices")
def list_voices() -> List[str]:
    """
    Lists voice basenames available (requires both .onnx and .json)
    e.g. en_US-GlaDOS-medium -> files en_US-GlaDOS-medium.onnx + .json
    """
    if not os.path.isdir(VOICES_DIR):
        return []
    entries = os.listdir(VOICES_DIR)
    names = set()
    for f in entries:
        if f.endswith(".onnx"):
            base = f[:-5]
            if f"{base}.json" in entries:
                names.add(base)
    return sorted(names)


# ---------- STT ----------
@app.post("/stt")
async def stt(file: UploadFile = File(...), language: Optional[str] = Query(None)):
    """
    Speech-to-text using Faster-Whisper.
    Accepts WAV/MP3/OGG/etc. The model will auto-decode via ffmpeg.
    """
    if model is None:
        raise HTTPException(500, "Whisper model not initialized")

    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")

    # Write to a temp file (faster-whisper likes file paths)
    with tempfile.NamedTemporaryFile(suffix=os.path.splitext(file.filename or "")[1] or ".wav") as tmp:
        tmp.write(data)
        tmp.flush()

        segments, info = model.transcribe(tmp.name, language=language, vad_filter=True)
        text_chunks = [seg.text for seg in segments]
        return JSONResponse({
            "language": info.language,
            "duration": info.duration,
            "text": "".join(text_chunks).strip()
        })


# ---------- TTS ----------
def _voice_paths(voice_name: str):
    model_path = os.path.join(VOICES_DIR, f"{voice_name}.onnx")
    cfg_path = os.path.join(VOICES_DIR, f"{voice_name}.json")
    if not os.path.exists(model_path) or not os.path.exists(cfg_path):
        raise FileNotFoundError(f"Voice '{voice_name}' not found (need {model_path} and {cfg_path})")
    return model_path, cfg_path

@app.post("/tts")
async def tts(payload: dict, voice: Optional[str] = Query(None)):
    """
    Text-to-speech using Piper CLI inside this container.
    Body: { "text": "Hello world" }
    Optional: ?voice=en_US-GlaDOS-medium (or include payload["voice"])
    Returns: audio/wav stream
    """
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "Missing text")

    # Choose voice: query param > body > default
    v = voice or payload.get("voice") or DEFAULT_PIPER_VOICE

    try:
        model_path, cfg_path = _voice_paths(v)
    except FileNotFoundError as e:
        raise HTTPException(400, str(e))

    # Use Piper CLI; write to tmp wav and stream it back
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
        tmp_wav_path = tmp_wav.name

    try:
        # Feed text on stdin
        proc = subprocess.run(
            ["piper", "--model", model_path, "--config", cfg_path, "--output_file", tmp_wav_path],
            input=text.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if proc.returncode != 0:
            err = proc.stderr.decode("utf-8", "ignore")
            raise RuntimeError(f"piper failed (code {proc.returncode}): {err}")

        # Validate the wav before streaming
        try:
            with sf.SoundFile(tmp_wav_path) as f:
                _ = len(f)  # touch file to ensure it's readable
        except Exception as e:
            raise RuntimeError(f"Generated WAV unreadable: {e}")

        def _iterfile():
            with open(tmp_wav_path, "rb") as f:
                while True:
                    chunk = f.read(8192)
                    if not chunk:
                        break
                    yield chunk

        return StreamingResponse(_iterfile(), media_type="audio/wav",
                                 headers={"Cache-Control": "no-store"})
    finally:
        try:
            os.remove(tmp_wav_path)
        except Exception:
            pass
