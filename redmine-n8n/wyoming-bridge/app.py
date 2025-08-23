import io
import os
import asyncio
import logging
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse

from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioStart, AudioChunk, AudioStop
from wyoming.asr import Transcribe, Transcript
from wyoming.tts import Synthesize

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [wyoming-bridge] %(message)s",
)
log = logging.getLogger("wyoming-bridge")

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
WHISPER_HOST = os.getenv("WHISPER_HOST", "wyoming-whisper")
WHISPER_PORT = int(os.getenv("WHISPER_PORT", "10300"))

PIPER_HOST = os.getenv("PIPER_HOST", "wyoming-piper")
PIPER_PORT = int(os.getenv("PIPER_PORT", "10200"))

DEFAULT_VOICE = os.getenv("DEFAULT_VOICE", "en_US-GlaDOS-medium")

# -----------------------------------------------------------------------------
# FastAPI
# -----------------------------------------------------------------------------
app = FastAPI(title="Wyoming Bridge", version="1.0.0")

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
async def _iter_events(client: AsyncTcpClient):
    """
    Wyoming 1.4.x style: repeatedly call read_event() until None.
    """
    while True:
        ev = await client.read_event()
        if ev is None:
            break
        yield ev

async def _connect(host: str, port: int) -> AsyncTcpClient:
    """
    Open a raw TCP connection and wrap it with AsyncTcpClient (Wyoming 1.4.x).
    """
    reader, writer = await asyncio.open_connection(host, port)
    return AsyncTcpClient(reader, writer)

# -----------------------------------------------------------------------------
# STT
# -----------------------------------------------------------------------------
@app.post("/stt")
async def stt(request: Request, file: UploadFile = File(...)):
    # Basic request logging
    client_ip = request.client.host if request.client else "unknown"
    try:
        data = await file.read()
        size = len(data) if data else 0
        log.info("[STT] from=%s filename=%s bytes=%s", client_ip, file.filename, size)

        # Validate WAV-ish (44 byte header minimal)
        if not data or size <= 44:
            raise HTTPException(400, "Empty/invalid WAV (need PCM WAV data)")

        client = await _connect(WHISPER_HOST, WHISPER_PORT)

        # Stream audio to Whisper
        await client.write_event(AudioStart(format="wav"))
        buf = io.BytesIO(data)
        while True:
            chunk = buf.read(8192)
            if not chunk:
                break
            await client.write_event(AudioChunk(audio=chunk))
        await client.write_event(AudioStop())

        # Ask to transcribe
        await client.write_event(Transcribe())

        # Read back transcript
        text: str = ""
        async for ev in _iter_events(client):
            if isinstance(ev, Transcript):
                text = ev.text or ""
                break

        # Close connection
        client.close()

        log.info("[STT] ok from=%s text_len=%s", client_ip, len(text))
        return JSONResponse({"text": text})

    except HTTPException:
        raise
    except Exception as e:
        log.exception("[STT] error from=%s: %s", client_ip, e)
        raise HTTPException(status_code=502, detail=f"STT upstream error: {e}")

# -----------------------------------------------------------------------------
# TTS
# -----------------------------------------------------------------------------
@app.post("/tts")
async def tts(request: Request, payload: dict):
    client_ip = request.client.host if request.client else "unknown"
    try:
        text = (payload.get("text") or "").strip()
        voice = (payload.get("voice") or DEFAULT_VOICE).strip()

        if not text:
            raise HTTPException(400, "Missing 'text'")

        log.info("[TTS] from=%s text_len=%s voice=%r", client_ip, len(text), voice)

        client = await _connect(PIPER_HOST, PIPER_PORT)

        # Wyoming 1.4.x expects voice as a STRING here.
        await client.write_event(Synthesize(text=text, voice=voice))

        # Collect streamed WAV
        out = io.BytesIO()
        # We expect AudioChunk events followed by AudioStop
        async for ev in _iter_events(client):
            # Some Wyoming versions expose .audio on chunks
            if hasattr(ev, "audio"):
                out.write(getattr(ev, "audio"))
            # Stop when audio is finished
            if ev.__class__.__name__ == "AudioStop":
                break

        client.close()

        out.seek(0)
        log.info("[TTS] ok from=%s bytes=%s", client_ip, out.getbuffer().nbytes)
        return StreamingResponse(
            out,
            media_type="audio/wav",
            headers={"Cache-Control": "no-store"},
        )

    except HTTPException:
        raise
    except Exception as e:
        log.exception("[TTS] error from=%s: %s", client_ip, e)
        raise HTTPException(status_code=502, detail=f"TTS upstream error: {e}")
