import io
import asyncio
import logging
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse

from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioStart, AudioChunk, AudioStop
from wyoming.asr import Transcribe, Transcript
from wyoming.tts import Synthesize

# -------------------- Voice compatibility shim --------------------
try:
    from wyoming.tts import Voice as _WyomingVoice  # newer wyoming
except Exception:
    _WyomingVoice = None  # older wyoming

class _VoiceShim:
    def __init__(self, name: str):
        self.name = name
    def to_dict(self):
        return {"name": self.name}

def make_voice(name: str):
    return _WyomingVoice(name=name) if _WyomingVoice else _VoiceShim(name)

# -------------------- Logging --------------------
logger = logging.getLogger("wyoming-bridge")
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter(
    "%(asctime)s %(levelname)s [%(name)s] %(message)s", "%Y-%m-%d %H:%M:%S"
))
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# -------------------- App & config --------------------
app = FastAPI()
WHISPER_HOST, WHISPER_PORT = "wyoming-whisper", 10300
PIPER_HOST,   PIPER_PORT   = "wyoming-piper",   10200
DEFAULT_VOICE = "en_US-GlaDOS-medium"

# -------------------- Helpers --------------------
async def _connect(host: str, port: int) -> AsyncTcpClient:
    client = AsyncTcpClient(host, port)   # ctor is (host, port)
    await client.connect()                # connect() takes no args
    return client

async def _safe_disconnect(client: Optional[AsyncTcpClient]) -> None:
    if client:
        try:
            await client.disconnect()
        except Exception:
            pass

def _peer_ip(request: Request) -> str:
    return getattr(request.client, "host", "unknown") if request.client else "unknown"

# -------------------- Health --------------------
@app.get("/healthz", response_class=PlainTextResponse)
async def healthz():
    return "ok"

# -------------------- STT --------------------
@app.post("/stt")
async def stt(request: Request, file: UploadFile = File(...)):
    data = await file.read()
    if not data or len(data) <= 44:
        raise HTTPException(400, "Empty/invalid WAV")

    ip = _peer_ip(request)
    logger.info("[STT] from=%s filename=%s size=%dB",
                ip, getattr(file, "filename", "<upload>"), len(data))

    client: Optional[AsyncTcpClient] = None
    try:
        client = await _connect(WHISPER_HOST, WHISPER_PORT)

        # stream wav to ASR
        await client.write_event(AudioStart(format="wav"))
        buf = io.BytesIO(data)
        while True:
            chunk = buf.read(8192)
            if not chunk:
                break
            await client.write_event(AudioChunk(audio=chunk))
        await client.write_event(AudioStop())
        await client.write_event(Transcribe())

        # read events until we get a Transcript
        text = ""
        while True:
            ev = await client.read_event()
            if ev is None:
                break
            if isinstance(ev, Transcript):
                text = ev.text or ""
                break

        logger.info("[STT] done from=%s text_len=%d", ip, len(text))
        return JSONResponse({"text": text})

    except AssertionError as e:
        logger.error("[STT] assertion error from=%s: %s", ip, e, exc_info=True)
        raise HTTPException(502, "STT upstream assertion error")
    except Exception as e:
        logger.error("[STT] error from=%s: %s", ip, e, exc_info=True)
        raise HTTPException(502, f"STT upstream error: {e}")
    finally:
        await _safe_disconnect(client)

# -------------------- TTS --------------------
@app.post("/tts")
async def tts(request: Request, payload: dict):
    text = (payload.get("text") or "").strip()
    voice_name = (payload.get("voice") or DEFAULT_VOICE).strip()
    if not text:
        raise HTTPException(400, "Missing text")

    ip = _peer_ip(request)
    logger.info("[TTS] from=%s text_len=%d voice='%s'", ip, len(text), voice_name)

    client: Optional[AsyncTcpClient] = None
    out = io.BytesIO()

    try:
        client = await _connect(PIPER_HOST, PIPER_PORT)

        # build voice in a way that works across wyoming versions
        voice_obj = make_voice(voice_name)

        # IMPORTANT for older wyoming: send the Event object
        await client.write_event(Synthesize(text=text, voice=voice_obj).event())

        # Collect audio: read one event at a time
        while True:
            ev = await client.read_event()
            if ev is None:
                break
            if isinstance(ev, AudioChunk) and getattr(ev, "audio", None):
                out.write(ev.audio)
            elif isinstance(ev, AudioStop):
                break

        if out.tell() == 0:
            raise RuntimeError("No audio returned from TTS server")

        out.seek(0)
        logger.info("[TTS] done from=%s bytes=%d", ip, out.getbuffer().nbytes)
        return StreamingResponse(out, media_type="audio/wav",
                                 headers={"Cache-Control": "no-store"})

    except AssertionError as e:
        logger.error("[TTS] assertion error from=%s: %s", ip, e, exc_info=True)
        raise HTTPException(502, "TTS upstream assertion error")
    except Exception as e:
        logger.error("[TTS] error from=%s: %s", ip, e, exc_info=True)
        raise HTTPException(502, f"TTS upstream error: {e}")
    finally:
        await _safe_disconnect(client)
