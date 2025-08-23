import io, asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from wyoming.client import AsyncTcpClient
from wyoming.messages import (
    AudioStart, AudioChunk, AudioStop,
    Transcribe, Transcript,
    Synthesize
)

app = FastAPI()
WHISPER_HOST, WHISPER_PORT = "wyoming-whisper", 10300
PIPER_HOST,   PIPER_PORT   = "wyoming-piper",   10200

@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    data = await file.read()
    if not data or len(data) <= 44:
        raise HTTPException(400, "Empty/invalid WAV")
    r, w = await asyncio.open_connection(WHISPER_HOST, WHISPER_PORT)
    client = AsyncTcpClient(r, w)
    await client.write_event(AudioStart(format="wav"))
    buf = io.BytesIO(data)
    while True:
        chunk = buf.read(8192)
        if not chunk: break
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

@app.post("/tts")
async def tts(payload: dict):
    text = (payload.get("text") or "").strip()
    voice = payload.get("voice") or "en_US-amy-low"
    if not text:
        raise HTTPException(400, "Missing text")
    r, w = await asyncio.open_connection(PIPER_HOST, PIPER_PORT)
    client = AsyncTcpClient(r, w)
    await client.write_event(Synthesize(text=text, voice=voice))
    out = io.BytesIO()
    async for ev in client.events():
        if hasattr(ev, "audio"):             # AudioChunk
            out.write(ev.audio)
        if ev.__class__.__name__ == "AudioStop":
            break
    await client.close()
    out.seek(0)
    return StreamingResponse(out, media_type="audio/wav",
                             headers={"Cache-Control":"no-store"})
