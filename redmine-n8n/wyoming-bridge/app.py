import io, os, asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse, PlainTextResponse

from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioStart, AudioChunk, AudioStop
from wyoming.asr import Transcribe, Transcript
from wyoming.tts import Synthesize

# ---- Config (can override with envs if you want) ----
WHISPER_HOST = os.getenv("WHISPER_HOST", "wyoming-whisper")
WHISPER_PORT = int(os.getenv("WHISPER_PORT", "10300"))
PIPER_HOST   = os.getenv("PIPER_HOST",   "wyoming-piper")
PIPER_PORT   = int(os.getenv("PIPER_PORT",   "10200"))
DEFAULT_VOICE = os.getenv("DEFAULT_VOICE", "en_US-amy-low")

app = FastAPI(title="Wyoming Bridge", version="1.0")

# Piper expects a dict-like voice; make a tiny shim
class _VoiceShim:
    def __init__(self, name: str):
        self.name = name
    def to_dict(self):
        return {"name": self.name}

@app.get("/healthz", response_class=PlainTextResponse)
async def health():
    return "ok"

# Accepts multipart/form-data (first file field) OR raw audio/wav body
@app.post("/stt")
async def stt(request: Request):
    # read bytes
    data: Optional[bytes] = None
    ct = request.headers.get("content-type", "")
    if ct.startswith("multipart/form-data"):
        form = await request.form()
        for _, v in form.items():
            if hasattr(v, "read"):  # UploadFile
                data = await v.read()
                break
        if data is None:
            raise HTTPException(400, "No file part found")
    else:
        data = await request.body()

    if not data or len(data) <= 44:  # crude WAV sanity
        raise HTTPException(400, "Empty/invalid WAV")

    # connect and stream to whisper
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

# JSON: { "text": "Hello", "voice": "en_US-amy-low" }  (voice optional)
@app.post("/tts")
async def tts(payload: dict):
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "Missing text")

    voice_name = (payload.get("voice") or DEFAULT_VOICE).strip()
    voice_obj = _VoiceShim(voice_name)

    r, w = await asyncio.open_connection(PIPER_HOST, PIPER_PORT)
    client = AsyncTcpClient(r, w)
    await client.write_event(Synthesize(text=text, voice=voice_obj))

    out = io.BytesIO()
    async for ev in client.events():
        # wyoming sends AudioChunk/AudioStop types; duck-type by attributes
        if hasattr(ev, "audio"):
            out.write(ev.audio)
        elif ev.__class__.__name__ == "AudioStop":
            break
    await client.close()

    out.seek(0)
    return StreamingResponse(out, media_type="audio/wav",
                             headers={"Cache-Control": "no-store"})
