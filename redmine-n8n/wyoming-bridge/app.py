import io
import os
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse

from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioStart, AudioChunk, AudioStop
from wyoming.asr import Transcribe, Transcript
from wyoming.tts import Synthesize

# ---- config (override via env if you want) ----
WHISPER_HOST = os.environ.get("WHISPER_HOST", "wyoming-whisper")
WHISPER_PORT = int(os.environ.get("WHISPER_PORT", "10300"))
PIPER_HOST   = os.environ.get("PIPER_HOST",   "wyoming-piper")
PIPER_PORT   = int(os.environ.get("PIPER_PORT",   "10200"))
DEFAULT_VOICE = os.environ.get("DEFAULT_VOICE", "en_US-amy-low")  # make sure this voice exists in your /voices

# Wyoming 1.6.0 expects a voice obj with .to_dict(); it doesn't export Voice
class _VoiceShim:
    def __init__(self, name: str):
        self.name = name
    def to_dict(self):
        return {"name": self.name}

app = FastAPI(title="Wyoming Bridge")

# ---------- STT ----------
@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    data = await file.read()
    if not data or len(data) <= 44:  # crude WAV sanity
        raise HTTPException(400, "Empty/invalid WAV")

    r, w = await asyncio.open_connection(WHISPER_HOST, WHISPER_PORT)
    client = AsyncTcpClient(r, w)

    await client.write_event(AudioStart(format="wav"))
    buf = io.BytesIO(data)
    while True:
        chunk = buf.read(8192)
        if not chunk:
            break
        await client.write_event(AudioChunk(audio=chunk))
    await client.write_event(AudioStop())
    await client.write_event(Transcribe())

    text = ""
    async for ev in client.events():
        if isinstance(ev, Transcript):
            text = ev.text or ""
            break

    await client.close()
    return JSONResponse({"text": text})

# ---------- TTS ----------
@app.post("/tts")
async def tts(body: dict):
    text = (body.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "Missing text")

    voice_name = (body.get("voice") or DEFAULT_VOICE)
    voice_obj = _VoiceShim(str(voice_name))

    r, w = await asyncio.open_connection(PIPER_HOST, PIPER_PORT)
    client = AsyncTcpClient(r, w)
    await client.write_event(Synthesize(text=text, voice=voice_obj))

    out = io.BytesIO()
    async for ev in client.events():
        # Piper sends back AudioChunk + AudioStop
        if hasattr(ev, "audio"):
            out.write(ev.audio)
        if ev.__class__.__name__ == "AudioStop":
            break

    await client.close()
    out.seek(0)
    return StreamingResponse(out, media_type="audio/wav",
                             headers={"Cache-Control": "no-store"})
