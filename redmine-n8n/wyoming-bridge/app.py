import io
import time
import asyncio
import logging
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse

from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioStart, AudioChunk, AudioStop
from wyoming.asr import Transcribe, Transcript
from wyoming.tts import Synthesize


# ------------------------------------------------------------------------------
# Config
# ------------------------------------------------------------------------------
WHISPER_HOST, WHISPER_PORT = "wyoming-whisper", 10300
PIPER_HOST,   PIPER_PORT   = "wyoming-piper",   10200

DEFAULT_TTS_VOICE = "en_US-GlaDOS-medium"

MIN_WAV_HEADER_LEN = 44
CHUNK_SIZE = 8192

# ------------------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------------------
logger = logging.getLogger("wyoming-bridge")
logger.setLevel(logging.INFO)

_handler = logging.StreamHandler()
_handler.setFormatter(logging.Formatter(
    "%(asctime)s %(levelname)s [%(name)s] %(message)s"
))
logger.addHandler(_handler)

# ------------------------------------------------------------------------------
# App
# ------------------------------------------------------------------------------
app = FastAPI(title="Wyoming Bridge", version="1.0.1")


@app.get("/healthz", response_class=PlainTextResponse)
async def healthz():
    return "ok"


# ------------------------------------------------------------------------------
# Helpers for broad Wyoming version compatibility
# ------------------------------------------------------------------------------
async def _connect_client(host: str, port: int) -> AsyncTcpClient:
    """
    For wyoming>=1.4.x the idiom is:
        client = AsyncTcpClient(host, port); await client.connect()
    (connect() takes no args)
    """
    client = AsyncTcpClient(host, port)
    await client.connect()  # IMPORTANT: no args in this wyoming version
    return client


async def _safe_disconnect(client: Optional[AsyncTcpClient]) -> None:
    if client is None:
        return
    # Newer versions might expose disconnect()
    if hasattr(client, "disconnect") and callable(getattr(client, "disconnect")):
        try:
            await client.disconnect()
            return
        except Exception:
            pass
    # Fallback: try to close underlying writer if exposed
    try:
        w = getattr(client, "_writer", None)
        if w:
            w.close()
            try:
                await w.wait_closed()
            except Exception:
                pass
    except Exception:
        pass


# ------------------------------------------------------------------------------
# STT
# ------------------------------------------------------------------------------
@app.post("/stt")
async def stt(request: Request, file: UploadFile = File(...)):
    """
    Send a WAV file to Wyoming Whisper and return recognized text.
    """
    client_ip = getattr(request.client, "host", "unknown")
    started = time.perf_counter()

    data = await file.read()
    size = len(data) if data else 0
    logger.info("[STT] from=%s filename=%s size=%sB", client_ip, file.filename, size)

    if not data or size <= MIN_WAV_HEADER_LEN:
        logger.error("[STT] invalid WAV from=%s: empty or too small", client_ip)
        raise HTTPException(400, "Empty/invalid WAV")

    client = None
    try:
        # connect to whisper
        client = await _connect_client(WHISPER_HOST, WHISPER_PORT)

        # send audio
        await client.write_event(AudioStart(format="wav"))
        buf = io.BytesIO(data)
        while True:
            chunk = buf.read(CHUNK_SIZE)
            if not chunk:
                break
            await client.write_event(AudioChunk(audio=chunk))
        await client.write_event(AudioStop())

        # ask to transcribe
        await client.write_event(Transcribe())

        # read events until Transcript
        text = ""
        async for ev in client.events():
            if isinstance(ev, Transcript):
                text = ev.text or ""
                break

        elapsed = time.perf_counter() - started
        logger.info("[STT] done from=%s text_len=%d elapsed=%.3fs",
                    client_ip, len(text), elapsed)
        return JSONResponse({"text": text})

    except ConnectionRefusedError:
        logger.error("[STT] upstream not available from=%s (whisper %s:%s)",
                     client_ip, WHISPER_HOST, WHISPER_PORT)
        raise HTTPException(502, "STT upstream unavailable")
    except Exception as e:
        logger.exception("[STT] error from=%s: %s", client_ip, e)
        raise HTTPException(502, f"STT upstream error: {e}")
    finally:
        await _safe_disconnect(client)


# ------------------------------------------------------------------------------
# TTS
# ------------------------------------------------------------------------------
@app.post("/tts")
async def tts(request: Request, payload: dict):
    """
    Send text/voice to Wyoming Piper and stream back a WAV.
    payload = { "text": "...", "voice": "..."? }
    """
    client_ip = getattr(request.client, "host", "unknown")
    text = (payload.get("text") or "").strip()
    voice = (payload.get("voice") or DEFAULT_TTS_VOICE).strip()

    logger.info("[TTS] from=%s text_len=%d voice=%r", client_ip, len(text), voice)

    if not text:
        logger.error("[TTS] missing text from=%s", client_ip)
        raise HTTPException(400, "Missing text")

    client = None
    out = io.BytesIO()
    started = time.perf_counter()

    try:
        # connect to piper
        client = await _connect_client(PIPER_HOST, PIPER_PORT)

        # ask to synthesize
        await client.write_event(Synthesize(text=text, voice=voice))

        # collect audio frames (AudioChunk...) until AudioStop
        audio_bytes = 0
        async for ev in client.events():
            if hasattr(ev, "audio"):  # AudioChunk
                out.write(ev.audio)
                audio_bytes += len(ev.audio)
            elif isinstance(ev, AudioStop):
                break

        # respond as WAV stream
        out.seek(0)
        elapsed = time.perf_counter() - started
        logger.info("[TTS] done from=%s voice=%r bytes=%d elapsed=%.3fs",
                    client_ip, voice, audio_bytes, elapsed)

        return StreamingResponse(
            out,
            media_type="audio/wav",
            headers={
                "Cache-Control": "no-store",
                "Content-Disposition": 'inline; filename="reply.wav"'
            },
        )

    except ConnectionRefusedError:
        logger.error("[TTS] upstream not available from=%s (piper %s:%s)",
                     client_ip, PIPER_HOST, PIPER_PORT)
        raise HTTPException(502, "TTS upstream unavailable")
    except AssertionError as e:
        # This fires if write_event is called without a connected writer.
        logger.exception("[TTS] assertion error from=%s: %s", client_ip, e)
        raise HTTPException(502, f"TTS upstream error: {e}")
    except Exception as e:
        logger.exception("[TTS] error from=%s: %s", client_ip, e)
        raise HTTPException(502, f"TTS upstream error: {e}")
    finally:
        await _safe_disconnect(client)
