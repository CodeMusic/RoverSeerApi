import io
import asyncio
import logging
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse

from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioStart, AudioChunk, AudioStop
from wyoming.asr import Transcribe, Transcript
from wyoming.tts import Synthesize, Voice

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
logger = logging.getLogger("wyoming-bridge")
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s %(levelname)s [%(name)s] %(message)s", "%Y-%m-%d %H:%M:%S"
)
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# -----------------------------------------------------------------------------
# App & config
# -----------------------------------------------------------------------------
app = FastAPI()
WHISPER_HOST, WHISPER_PORT = "wyoming-whisper", 10300
PIPER_HOST,   PIPER_PORT   = "wyoming-piper",   10200

DEFAULT_VOICE = "en_US-GlaDOS-medium"  # <- as requested

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
async def _connect(host: str, port: int) -> AsyncTcpClient:
    client = AsyncTcpClient(host, port)
    await client.connect()  # no args
    return client

async def _safe_disconnect(client: Optional[AsyncTcpClient]) -> None:
    if client is None:
        return
    try:
        await client.disconnect()
    except Exception:
        # nothing else to do; just don't let cleanup explode
        pass

def _peer_ip(request: Request) -> str:
    # Starlette/FastAPI gives client in scope:
    client = request.client
    return getattr(client, "host", "unknown") if client else "unknown"

# -----------------------------------------------------------------------------
# Health
# -----------------------------------------------------------------------------
@app.get("/healthz", response_class=PlainTextResponse)
async def healthz():
    return "ok"

# -----------------------------------------------------------------------------
# STT
# -----------------------------------------------------------------------------
@app.post("/stt")
async def stt(request: Request, file: UploadFile = File(...)):
    data = await file.read()
    client: Optional[AsyncTcpClient] = None

    if not data or len(data) <= 44:  # minimal WAV header length sanity
        raise HTTPException(400, "Empty/invalid WAV")

    ip = _peer_ip(request)
    logger.info(
        "[STT] from=%s filename=%s size=%dB",
        ip, getattr(file, "filename", "<upload>"), len(data)
    )

    try:
        client = await _connect(WHISPER_HOST, WHISPER_PORT)

        # Tell Whisper the format, then stream audio
        await client.write_event(AudioStart(format="wav"))

        buf = io.BytesIO(data)
        while True:
            chunk = buf.read(8192)
            if not chunk:
                break
            await client.write_event(AudioChunk(audio=chunk))

        await client.write_event(AudioStop())
        await client.write_event(Transcribe())

        # Wait for transcript
        text = ""
        async for ev in client.events():
            if isinstance(ev, Transcript):
                text = ev.text or ""
                break

        logger.info("[STT] done from=%s text_len=%d", ip, len(text))
        return JSONResponse({"text": text})

    except AssertionError as e:
        logger.error("[STT] assertion error from=%s: %s", ip, e, exc_info=True)
        raise HTTPException(status_code=502, detail="STT upstream assertion error")
    except Exception as e:
        logger.error("[STT] error from=%s: %s", ip, e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"STT upstream error: {e}")
    finally:
        await _safe_disconnect(client)

# -----------------------------------------------------------------------------
# TTS
# -----------------------------------------------------------------------------
@app.post("/tts")
async def tts(request: Request, payload: dict):
    text = (payload.get("text") or "").strip()
    voice_name = (payload.get("voice") or DEFAULT_VOICE).strip()
    ip = _peer_ip(request)

    if not text:
        raise HTTPException(400, "Missing text")

    logger.info("[TTS] from=%s text_len=%d voice='%s'", ip, len(text), voice_name)

    client: Optional[AsyncTcpClient] = None
    out = io.BytesIO()

    try:
        client = await _connect(PIPER_HOST, PIPER_PORT)

        # IMPORTANT: Voice must be a Voice object, not a string
        voice = Voice(name=voice_name)

        await client.write_event(Synthesize(text=text, voice=voice))

        # Collect audio chunks until AudioStop
        async for ev in client.events():
            # Wyoming sends audio as AudioChunk events
            if hasattr(ev, "audio"):  # AudioChunk
                out.write(ev.audio)
            # Stop on AudioStop
            if ev.__class__.__name__ == "AudioStop":
                break

        if out.tell() == 0:
            raise RuntimeError("No audio returned from TTS server")

        out.seek(0)
        logger.info("[TTS] done from=%s bytes=%d", ip, out.getbuffer().nbytes)
        return StreamingResponse(out, media_type="audio/wav",
                                 headers={"Cache-Control": "no-store"})

    except AssertionError as e:
        logger.error("[TTS] assertion error from=%s: %s", ip, e, exc_info=True)
        raise HTTPException(status_code=502, detail="TTS upstream assertion error")
    except Exception as e:
        logger.error("[TTS] error from=%s: %s", ip, e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"TTS upstream error: {e}")
    finally:
        await _safe_disconnect(client)
