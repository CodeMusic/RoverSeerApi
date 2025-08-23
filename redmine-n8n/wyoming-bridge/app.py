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
import wyoming.tts as wy_tts  # Voice may/may not be exported depending on version


app = FastAPI(title="Wyoming Bridge", version="1.1")

# Upstream addresses (override via env)
WHISPER_HOST = os.environ.get("WHISPER_HOST", "wyoming-whisper")
WHISPER_PORT = int(os.environ.get("WHISPER_PORT", "10300"))
PIPER_HOST   = os.environ.get("PIPER_HOST", "wyoming-piper")
PIPER_PORT   = int(os.environ.get("PIPER_PORT", "10200"))

# This is only used to **construct** a Voice object when the client asks for one.
# Fallback (no-voice) uses whatever Piper started with (your GLaDOS model/command).
DEFAULT_VOICE_FOR_PARSE = os.environ.get("DEFAULT_VOICE", "en_US-GlaDOS-medium")


# ---------- helpers ----------

async def _connect(host: str, port: int) -> AsyncTcpClient:
    r, w = await asyncio.open_connection(host, port)
    return AsyncTcpClient(r, w)

def _mk_voice(value: Any):
    """
    Create a Voice object (or a shim with .to_dict()) that wyoming understands.
    Accepts:
      - "en_US-amy-low"
      - {"name":"en_US-amy-low", "speaker":0, "language":"en"}
    """
    if value is None:
        return None

    if isinstance(value, str):
        vd: Dict[str, Any] = {"name": value}
    elif isinstance(value, dict):
        # Only pass keys Piper knows about
        vd = {k: v for k, v in value.items() if k in ("name", "speaker", "language")}
        if "name" not in vd and DEFAULT_VOICE_FOR_PARSE:
            vd["name"] = DEFAULT_VOICE_FOR_PARSE
    else:
        vd = {"name": str(value)}

    VoiceCls = getattr(wy_tts, "Voice", None)
    if VoiceCls is not None:
        try:
            return VoiceCls(
                name=vd.get("name"),
                speaker=vd.get("speaker"),
                language=vd.get("language"),
            )
        except Exception:
            pass

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

async def _speak_once(text: str, voice_obj=None) -> bytes:
    """
    Send a single Synthesize request. If voice_obj is None, Piper uses its startup voice.
    Returns WAV bytes on success, raises on failure.
    """
    client = await _connect(PIPER_HOST, PIPER_PORT)
    out = io.BytesIO()
    try:
        synth = Synthesize(text=text, voice=voice_obj) if voice_obj else Synthesize(text=text)
        await client.write_event(synth)
        async for ev in client.events():
            # Import types loosely to avoid version-specific class imports
            if hasattr(ev, "audio"):              # AudioChunk
                out.write(ev.audio)
            elif ev.__class__.__name__ == "AudioStop":
                break
    finally:
        try:
            await client.close()
        except Exception:
            pass

    data = out.getvalue()
    if not data:
        raise RuntimeError("No audio returned")
    return data


# ---------- health ----------

@app.get("/healthz", response_class=PlainTextResponse)
async def health():
    return "ok"


# ---------- STT ----------

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

        return JSONResponse({"text": text})
    except Exception as e:
        raise HTTPException(502, f"STT upstream error: {e}")
    finally:
        try:
            await client.close()
        except Exception:
            pass


# ---------- TTS with dynamic voice + fallback ----------

# Accept voice from JSON body or from query param (?voice=en_US-amy-low)
@app.post("/tts")
async def tts(request: Request):
    payload = {}
    try:
        if request.headers.get("content-type", "").startswith("application/json"):
            payload = await request.json()
    except Exception:
        payload = {}

    text = (payload.get("text") or request.query_params.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "Missing text")

    # Voice preference in this order: query param > JSON body; if none, we'll use fallback
    voice_in = request.query_params.get("voice", None)
    if voice_in is None:
        voice_in = payload.get("voice", None)

    # Try requested voice first (if provided)
    if voice_in:
        try:
            voice_obj = _mk_voice(voice_in)
            wav = await _speak_once(text, voice_obj=voice_obj)
            return StreamingResponse(io.BytesIO(wav), media_type="audio/wav",
                                     headers={"Cache-Control": "no-store"})
        except Exception:
            # fall through to default
            pass

    # Fallback: no voice => Piper uses its startup model (your GLaDOS)
    try:
        wav = await _speak_once(text, voice_obj=None)
        return StreamingResponse(io.BytesIO(wav), media_type="audio/wav",
                                 headers={"Cache-Control": "no-store"})
    except Exception as e:
        raise HTTPException(502, f"TTS upstream error: {e}")
