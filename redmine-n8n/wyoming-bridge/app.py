import io
import os
import asyncio
from typing import Optional, Any, Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse, PlainTextResponse

from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioStart, AudioChunk, AudioStop
from wyoming.asr import Transcribe, Transcript
from wyoming.tts import Synthesize
import wyoming.tts as wy_tts  # module import works even if Voice isn’t exported

app = FastAPI(title="Wyoming Bridge", version="1.0")

WHISPER_HOST = os.environ.get("WHISPER_HOST", "wyoming-whisper")
WHISPER_PORT = int(os.environ.get("WHISPER_PORT", "10300"))
PIPER_HOST   = os.environ.get("PIPER_HOST", "wyoming-piper")
PIPER_PORT   = int(os.environ.get("PIPER_PORT", "10200"))

DEFAULT_VOICE = os.environ.get("DEFAULT_VOICE", "en_US-amy-low")


# ---- utils ----

async def connect_rw(host: str, port: int) -> AsyncTcpClient:
    reader, writer = await asyncio.open_connection(host, port)
    return AsyncTcpClient(reader, writer)

def _parse_voice(value: Any):
    """
    Build a Voice object for wyoming regardless of version:
      - If wyoming.tts.Voice exists, use it
      - Otherwise, return a shim that has .to_dict() with keys that Piper understands
    Accepts:
      - "en_US-amy-low"
      - {"name":"en_US-amy-low", "speaker": 0, "language": "en"}
    """
    # Normalize to dict
    if value is None:
        value = DEFAULT_VOICE
    if isinstance(value, str):
        vd: Dict[str, Any] = {"name": value}
    elif isinstance(value, dict):
        vd = {k: v for k, v in value.items() if k in ("name", "speaker", "language")}
        if "name" not in vd and DEFAULT_VOICE:
            vd["name"] = DEFAULT_VOICE
    else:
        vd = {"name": str(value)}

    # Try real Voice class first
    VoiceCls = getattr(wy_tts, "Voice", None)
    if VoiceCls is not None:
        try:
            return VoiceCls(
                name=vd.get("name"),
                speaker=vd.get("speaker"),
                language=vd.get("language"),
            )
        except Exception:
            pass  # fall back to shim

    # Shim with to_dict(), enough for wyoming.tts.Synthesize.event()
    class _VoiceShim:
        def __init__(self, name=None, speaker=None, language=None):
            self.name = name
            self.speaker = speaker
            self.language = language
        def to_dict(self):
            d = {}
            if self.name: d["name"] = self.name
            if self.speaker is not None: d["speaker"] = self.speaker
            if self.language: d["language"] = self.language
            return d

    return _VoiceShim(
        name=vd.get("name"),
        speaker=vd.get("speaker"),
        language=vd.get("language"),
    )


# ---- health ----

@app.get("/healthz", response_class=PlainTextResponse)
async def health():
    return "ok"


# ---- STT ----
# Accepts multipart (first file field) or raw wav body
@app.post("/stt")
async def stt(request: Request):
    data: Optional[bytes] = None
    ct = request.headers.get("content-type", "")

    try:
        if ct.startswith("multipart/form-data"):
            form = await request.form()
            for _, value in form.items():
                if hasattr(value, "read"):
                    data = await value.read()
                    break
            if data is None:
                raise HTTPException(400, "No file found in multipart/form-data")
        else:
            data = await request.body()
    except Exception as e:
        raise HTTPException(400, f"Could not read audio: {e}")

    if not data or len(data) <= 44:
        raise HTTPException(400, "Empty/invalid WAV")

    client = await connect_rw(WHISPER_HOST, WHISPER_PORT)

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

        return JSONResponse({"text": text})
    except Exception as e:
        raise HTTPException(502, f"STT upstream error: {e}")
    finally:
        try:
            await client.close()
        except Exception:
            pass


# ---- TTS ----
# JSON: { "text": "hello", "voice": "en_US-amy-low" }
# or:   { "text": "hello", "voice": { "name":"en_US-amy-low", "speaker":0 } }
@app.post("/tts")
async def tts(payload: dict):
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "Missing text")

    # Connect directly to Piper (avoids the writer=None assertion)
    try:
        r, w = await asyncio.open_connection(PIPER_HOST, PIPER_PORT)
    except Exception as e:
        raise HTTPException(502, f"TTS upstream error: {e}")

    client = AsyncTcpClient(r, w)

    # If caller provided a voice, pass it through; otherwise let Piper use its --voice
    voice_raw = payload.get("voice", None)
    if voice_raw is not None:
        voice_obj = _parse_voice(voice_raw)   # accepts "en_US-GlaDOS-medium" or {"name": "..."}
        synth = Synthesize(text=text, voice=voice_obj)
    else:
        synth = Synthesize(text=text)

    try:
        await client.write_event(synth)
        out = io.BytesIO()
        async for ev in client.events():
            if isinstance(ev, AudioChunk):
                out.write(ev.audio)
            elif isinstance(ev, AudioStop):
                break
    except Exception as e:
        raise HTTPException(502, f"TTS upstream error: {e}")
    finally:
        try:
            await client.close()
        except Exception:
            pass

    out.seek(0)
    return StreamingResponse(out, media_type="audio/wav",
                             headers={"Cache-Control": "no-store"})


