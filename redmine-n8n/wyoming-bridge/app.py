import io
import time
import logging
import asyncio
from typing import Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse

from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioStart, AudioChunk, AudioStop
from wyoming.asr import Transcribe, Transcript
from wyoming.tts import Synthesize

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
log = logging.getLogger("wyoming-bridge")

# -----------------------------------------------------------------------------
# App / Config
# -----------------------------------------------------------------------------
app = FastAPI(title="Wyoming Bridge")

WHISPER_HOST, WHISPER_PORT = "wyoming-whisper", 10300
PIPER_HOST,   PIPER_PORT   = "wyoming-piper",   10200

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
async def _connect(host: str, port: int) -> AsyncTcpClient:
    """Connect to a Wyoming server and return an AsyncTcpClient."""
    try:
        r, w = await asyncio.open_connection(host, port)
        return AsyncTcpClient(r, w)
    except Exception as e:
        raise HTTPException(502, f"Upstream connect failed to {host}:{port}: {e}")

async def _health_check(host: str, port: int) -> bool:
    """Try to connect and immediately close."""
    client = await _connect(host, port)
    try:
        return True
    finally:
        await client.close()

# -----------------------------------------------------------------------------
# Health checks
# -----------------------------------------------------------------------------
@app.get("/health/tts")
async def health_tts():
    ok = await _health_check(PIPER_HOST, PIPER_PORT)
    return {"piper": "ok" if ok else "down"}

@app.get("/health/stt")
async def health_stt():
    ok = await _health_check(WHISPER_HOST, WHISPER_PORT)
    return {"whisper": "ok" if ok else "down"}

# -----------------------------------------------------------------------------
# STT: multipart/form-data with `file` (WAV)
# -----------------------------------------------------------------------------
@app.post("/stt")
async def stt(request: Request, file: UploadFile = File(...)):
    t0 = time.time()
    client_ip = request.client.host if request.client else "unknown"
    try:
        data = await file.read()
        size = len(data or b"")
        log.info(f"[STT] from={client_ip} filename={file.filename!r} size={size}B")

        # quick WAV sanity check (WAV header starts with RIFF and is 44 bytes min)
        if not data or size <= 44 or not data.startswith(b"RIFF"):
            raise HTTPException(400, "Empty/invalid WAV")

        client = await _connect(WHISPER_HOST, WHISPER_PORT)
        try:
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

            dt = (time.time() - t0) * 1000
            log.info(f"[STT] ok from={client_ip} ms={dt:.0f} text_len={len(text)}")
            return JSONResponse({"text": text})
        finally:
            await client.close()
    except HTTPException:
        # already a clean HTTP error
        raise
    except Exception as e:
        log.exception(f"[STT] error from={client_ip}: {e}")
        raise HTTPException(502, f"STT upstream error: {type(e).__name__}: {e}")

# -----------------------------------------------------------------------------
# TTS: JSON body { "text": "...", "voice": "optional-voice-id" }
# returns audio/wav
# -----------------------------------------------------------------------------
@app.post("/tts")
async def tts(request: Request, payload: Dict[str, Any]):
    t0 = time.time()
    client_ip = request.client.host if request.client else "unknown"

    text = (payload.get("text") or "").strip()
    voice = (payload.get("voice") or "en_US-GlaDOS-medium").strip()



    log.info(f"[TTS] from={client_ip} text_len={len(text)} voice={voice!r}")

    if not text:
        raise HTTPException(400, "Missing text")

    try:
        client = await _connect(PIPER_HOST, PIPER_PORT)
        try:
            await client.write_event(Synthesize(text=text, voice=voice))

            out = io.BytesIO()
            got_any_audio = False
            async for ev in client.events():
                # Piper typically sends: AudioStart -> [AudioChunk xN] -> AudioStop
                if isinstance(ev, AudioChunk):
                    out.write(ev.audio)
                    got_any_audio = True
                elif isinstance(ev, AudioStop):
                    break

            if not got_any_audio:
                msg = f"No audio from Piper (voice={voice!r}). Check Piper logs/voice id."
                log.error(f"[TTS] {msg}")
                raise HTTPException(502, msg)

            out.seek(0)
            dt = (time.time() - t0) * 1000
            log.info(f"[TTS] ok from={client_ip} ms={dt:.0f} bytes={out.getbuffer().nbytes}")
            return StreamingResponse(
                out,
                media_type="audio/wav",
                headers={
                    "Cache-Control": "no-store",
                    "Content-Disposition": 'inline; filename="reply.wav"',
                },
            )
        finally:
            await client.close()
    except HTTPException:
        raise
    except Exception as e:
        log.exception(f"[TTS] error from={client_ip}: {e}")
        raise HTTPException(502, f"TTS upstream error: {type(e).__name__}: {e}")
