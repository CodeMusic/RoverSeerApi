# app.py
import io
import os
import sys
import asyncio
from typing import AsyncIterator, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse, PlainTextResponse

from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioStart, AudioChunk, AudioStop
from wyoming.asr import Transcribe, Transcript
from wyoming.tts import Synthesize, Voice
import wyoming

# -------------------- Config / Logging --------------------
EVENT_TIMEOUT = int(os.environ.get("EVENT_TIMEOUT", "30"))

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
import logging
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [wyoming-bridge] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("wyoming-bridge")

app = FastAPI(title="Wyoming Bridge", version="1.0")

WHISPER_HOST = os.environ.get("WHISPER_HOST", "wyoming-whisper")
WHISPER_PORT = int(os.environ.get("WHISPER_PORT", "10300"))
PIPER_HOST   = os.environ.get("PIPER_HOST", "wyoming-piper")
PIPER_PORT   = int(os.environ.get("PIPER_PORT", "10200"))

# match your docker run flag:  --voice en_US-amy-low
DEFAULT_VOICE = os.environ.get("DEFAULT_VOICE", "en_US-amy-low")


# -------------------- Helpers (1.x compatibility) --------------------
async def connect_compat(host: str, port: int) -> AsyncTcpClient:
    """Return a connected AsyncTcpClient across wyoming 1.x variants."""
    try:
        client = AsyncTcpClient()  # newer style
        if hasattr(client, "connect"):
            try:
                await client.connect(host, port)  # type: ignore[misc]
            except TypeError:
                r, w = await asyncio.open_connection(host, port)
                client = AsyncTcpClient(r, w)  # older ctor
        else:
            r, w = await asyncio.open_connection(host, port)
            client = AsyncTcpClient(r, w)
    except TypeError:
        r, w = await asyncio.open_connection(host, port)
        client = AsyncTcpClient(r, w)

    if not getattr(client, "_writer", None):
        r, w = await asyncio.open_connection(host, port)
        try:
            client._reader = r  # type: ignore[attr-defined]
            client._writer = w  # type: ignore[attr-defined]
        except Exception:
            client = AsyncTcpClient(r, w)

    return client


async def iter_events_compat(client: AsyncTcpClient) -> AsyncIterator[object]:
    """Yield events whether wyoming exposes events() or read_event()."""
    if hasattr(client, "events"):
        async for ev in client.events():  # type: ignore[attr-defined]
            yield ev
    elif hasattr(client, "read_event"):
        while True:
            ev = await client.read_event()  # type: ignore[attr-defined]
            if ev is None:
                break
            yield ev
    else:
        raise RuntimeError("Wyoming client has neither events() nor read_event().")


def client_ip(request: Request) -> str:
    try:
        return request.client.host if request.client else "?"
    except Exception:
        return "?"


# -------------------- Lifecycle --------------------
@app.on_event("startup")
async def _on_startup():
    log.info("Starting Wyoming Bridge")
    log.info("wyoming version: %s", getattr(wyoming, "__version__", "unknown"))
    log.info("WHISPER tcp://%s:%d", WHISPER_HOST, WHISPER_PORT)
    log.info("PIPER   tcp://%s:%d (default voice=%s)", PIPER_HOST, PIPER_PORT, DEFAULT_VOICE)


# -------------------- Health --------------------
@app.get("/healthz", response_class=PlainTextResponse)
async def health():
    return "ok"


# -------------------- STT --------------------
# Accepts multipart/form-data (first file field) OR raw body (audio/wav or octet-stream)
@app.post("/stt")
async def stt(request: Request):
    ip = client_ip(request)

    # Read bytes
    data: Optional[bytes] = None
    ct = (request.headers.get("content-type") or "").lower()
    try:
        if ct.startswith("multipart/form-data"):
            form = await request.form()
            for _, value in form.items():
                if hasattr(value, "read"):
                    data = await value.read()  # UploadFile
                    break
            if data is None:
                raise HTTPException(400, "No file part found in multipart/form-data")
        else:
            data = await request.body()
    except Exception as e:
        log.exception("[STT] read error from=%s: %s", ip, e)
        raise HTTPException(400, f"Could not read audio: {e}") from e

    if not data or len(data) <= 44:
        # ~44B WAV header check
        raise HTTPException(400, "Empty/invalid WAV")

    log.info("[STT] from=%s bytes=%d", ip, len(data))

    client: Optional[AsyncTcpClient] = None
    try:
        client = await connect_compat(WHISPER_HOST, WHISPER_PORT)

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
        async for ev in iter_events_compat(client):
            if isinstance(ev, Transcript):
                text = ev.text or ""
                break

        log.info("[STT] done from=%s text_len=%d", ip, len(text))
        return JSONResponse({"text": text})

    except Exception as e:
        log.exception("[STT] error from=%s: %s", ip, e)
        raise HTTPException(502, f"STT upstream error: {e}") from e
    finally:
        if client and hasattr(client, "close"):
            try:
                await client.close()  # async in newer wyoming
            except TypeError:
                # some versions use sync close()
                try:
                    client.close()  # type: ignore[attr-defined]
                except Exception:
                    pass


# -------------------- TTS --------------------
# JSON: { "text": "...", "voice": "en_US-..." }  (voice optional)
@app.post("/tts")
async def tts(payload: dict):
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "Missing text")

    raw_voice = payload.get("voice") or DEFAULT_VOICE
    voice_obj = raw_voice if isinstance(raw_voice, Voice) else Voice(name=str(raw_voice))

    client: Optional[AsyncTcpClient] = None
    try:
        client = await connect_compat(PIPER_HOST, PIPER_PORT)
        await client.write_event(Synthesize(text=text, voice=voice_obj))

        out = io.BytesIO()

        async def read_audio():
            async for ev in iter_events_compat(client):
                if isinstance(ev, AudioChunk):
                    out.write(ev.audio)
                elif isinstance(ev, AudioStop):
                    return

        await asyncio.wait_for(read_audio(), timeout=EVENT_TIMEOUT)

        out.seek(0)
        return StreamingResponse(
            out,
            media_type="audio/wav",
            headers={"Cache-Control": "no-store"},
        )

    except asyncio.TimeoutError:
        raise HTTPException(504, "TTS timed out")
    except Exception as e:
        log.exception("[TTS] error: %s", e)
        raise HTTPException(502, f"TTS upstream error: {e}") from e
    finally:
        if client and hasattr(client, "close"):
            try:
                await client.close()
            except TypeError:
                try:
                    client.close()  # type: ignore[attr-defined]
                except Exception:
                    pass
