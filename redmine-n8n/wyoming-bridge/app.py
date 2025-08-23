import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse

from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioStart, AudioChunk, AudioStop
from wyoming.asr import Transcribe, Transcript
from wyoming.tts import Synthesize

app = FastAPI()
WHISPER_HOST, WHISPER_PORT = "wyoming-whisper", 10300
PIPER_HOST,   PIPER_PORT   = "wyoming-piper",   10200

@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    data = await file.read()
    if not data or len(data) <= 44:
        raise HTTPException(400, "Empty/invalid WAV")

    try:
        async with AsyncTcpClient.connect(WHISPER_HOST, WHISPER_PORT) as client:
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

@app.post("/tts")
async def tts(payload: dict):
    text = (payload.get("text") or "").strip()
    voice = payload.get("voice") or "en_US-amy-low"
    if not text:
        raise HTTPException(400, "Missing text")

    try:
        async with AsyncTcpClient.connect(PIPER_HOST, PIPER_PORT) as client:
            await client.write_event(Synthesize(text=text, voice=voice))

            out = io.BytesIO()
            async for ev in client.events():
                # Piper sends AudioStart -> (many) AudioChunk -> AudioStop
                if isinstance(ev, AudioChunk):
                    out.write(ev.audio)
                elif isinstance(ev, AudioStop):
                    break

            out.seek(0)
            return StreamingResponse(
                out,
                media_type="audio/wav",
                headers={
                    "Cache-Control": "no-store",
                    # Helps browsers/clients save or open the file
                    "Content-Disposition": 'inline; filename="reply.wav"',
                },
            )
    except Exception as e:
        raise HTTPException(502, f"TTS upstream error: {e}")
