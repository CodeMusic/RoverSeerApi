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
from wyoming.tts import Synthesize
import wyoming

# -------------------- Logging --------------------
import logging
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [wyoming-bridge] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("wyoming-bridge")

# -------------------- FastAPI --------------------
app = FastAPI(title="Wyoming Bridge", version="1.0")

# Upstream hosts/ports (override via env if you like)
WHISPER_HOST = os.environ.get("WHISPER_HOST", "wyoming-whisper")
WHISPER_PORT = int(os.environ.get("WHISPER_PORT", "10300"))
PIPER_HOST = os.environ.get("PIPER_HOST", "wyoming-piper")
PIPER_PORT = int(os.environ.get("PIPER_PORT", "10200"))

DEFAULT_VOICE = os.environ.get("DEFAULT_VOICE", "en_US-GlaDOS-medium")


# -------------------- Helpers (compat with all wyoming 1.x) --------------------
async def connect_compat(host: str, port: int) -> AsyncTcpClient:
    """
    Returns an AsyncTcpClient that is actually connected and ready.

    Works for both styles seen across wyoming 1.x:
      - AsyncTcpClient().connect(host, port)
      - AsyncTcpClient(reader, writer)
    """
    # Try the "empty constructor + connect" path
    try:
        client = AsyncTcpClient()  # type: ignore[call-arg]
        if hasattr(client, "connect"):
            try:
                await client.connect(host, port)  # type: ignore[misc]
            except TypeError:
                # Older signature: fall back to manual socket
                r, w = await asyncio.open_connection(host, port)
                client = AsyncTcpClient(r, w)  # type: ignore[call-arg]
        else:
            # Very old: requires (reader, writer)
            r, w = await asyncio.open_connection(host, port)
            client = AsyncTcpClient(r, w)  # type: ignore[call-arg]
    except TypeError:
        # Constructor wants (reader, writer)
        r, w = await asyncio.open_connection(host, port)
        client = AsyncTcpClient(r, w)  # type: ignore[call-arg]

    # Final sanity check (avoid writer==None assertion later)
    if not getattr(client, "_writer", None):
        r, w = await asyncio.open_connection(host, port)
        try:
            client._reader = r  # type: ignore[attr-defined]
            client._writer = w  # type: ignore[attr-defined]
        except Exception:
            client = AsyncTcpClient(r, w)  # type: ignore[call-arg]

    return client


async def iter_events_compat(client: AsyncTcpClient) -> AsyncIterator[object]:
    """
    Yields events from the wyoming client regardless of whether the
    version exposes events() or only read_event().
    """
    if hasattr(client, "events"):
        # Newer generator API
        async for ev in client.events():  # type: ignore[attr-defined]
            yield ev
    elif hasattr(client, "read_event"):
        # Manual read loop
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
# Accepts either:
#  - multipart/form-data with a single file field (any name), or
#  - raw body (audio/wav or application/octet-stream)
@app.post("/stt")
async def stt(request: Request):
    ip = client_ip(request)

    # Get bytes from either multipart or raw
    data: Optional[bytes] = None
    ct = request.headers.get("content-type", "")
    try:
        if ct.startswith("multipart/form-data"):
            form = await request.form()
            # take the first file-like field we find
            for key, value in form.items():
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
        # 44 bytes = typical PCM WAV header; simple guard
        raise HTTPException(400, "Empty/invalid WAV")

    log.info("[STT] from=%s bytes=%d", ip, len(data))

    # Stream WAV to whisper -> Transcribe -> read Transcript
    client = None
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
                client.close()  # type: ignore[attr-defined]
            except Exception:
                pass


# -------------------- TTS --------------------
# JSON body: { "text": "...", "voice": "en_US-..." }  (voice optional)
@app.post("/tts")
async def tts(request: Request, payload: dict):
    ip = client_ip(request)
    text = (payload.get("text") or "").strip()
    voice = (payload.get("voice") or DEFAULT_VOICE).strip()

    if not text:
        raise HTTPException(400, "Missing text")

    log.info("[TTS] from=%s text_len=%d voice='%s'", ip, len(text), voice)

    client = None
    try:
        client = await connect_compat(PIPER_HOST, PIPER_PORT)

        # In wyoming 1.x, Synthesize accepts a string voice name.
        await client.write_event(Synthesize(text=text, voice=voice))

        out = io.BytesIO()
        got_stop = False
        async for ev in iter_events_compat(client):
            # Piper emits AudioChunk and AudioStop
            if hasattr(ev, "audio"):
                out.write(ev.audio)
            if ev.__class__.__name__ == "AudioStop":
                got_stop = True
                break

        out.seek(0)
        log.info("[TTS] done from=%s bytes=%d voice='%s' stop=%s",
                 ip, out.getbuffer().nbytes, voice, got_stop)

        return StreamingResponse(
            out,
            media_type="audio/wav",
            headers={"Cache-Control": "no-store"},
        )

    except Exception as e:
        log.exception("[TTS] error from=%s: %s", ip, e)
        raise HTTPException(502, f"TTS upstream error: {e}") from e
    finally:
        if client and hasattr(client, "close"):
            try:
                client.close()  # type: ignore[attr-defined]
            except Exception:
                pass
