import io, asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioStart, AudioChunk, AudioStop
from wyoming.asr import Transcribe, Transcript
from wyoming.tts import Synthesize

app = FastAPI()

WHISPER_HOST, WHISPER_PORT = "wyoming-whisper", 10300
PIPER_HOST,   PIPER_PORT   = "wyoming-piper",   10200

READ_CHUNK = 8192
EVENT_TIMEOUT = 120  # seconds

@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    # Basic validation
    if file.content_type not in ("audio/wav", "audio/x-wav", "application/octet-stream"):
        raise HTTPException(400, "Content must be audio/wav")

    data = await file.read()
    if not data or len(data) <= 44 or data[:4] != b"RIFF":
        raise HTTPException(400, "Empty/invalid WAV")

    try:
        r, w = await asyncio.open_connection(WHISPER_HOST, WHISPER_PORT)
    except Exception as e:
        raise HTTPException(503, f"STT backend unavailable: {e}")

    client = AsyncTcpClient(r, w)

    # If format="wav", the service parses the header, so we don't need rate/width/channels.
    await client.write_event(AudioStart(format="wav"))

    buf = io.BytesIO(data)
    while True:
        chunk = buf.read(READ_CHUNK)
        if not chunk:
            break
        await client.write_event(AudioChunk(audio=chunk))

    await client.write_event(AudioStop())
    await client.write_event(Transcribe())

    text = ""
    try:
        async def read_events():
            async for ev in client.events():
                if isinstance(ev, Transcript):
                    return ev.text or ""
        text = await asyncio.wait_for(read_events(), timeout=EVENT_TIMEOUT)
    except asyncio.TimeoutError:
        await client.close()
        raise HTTPException(504, "STT timeout waiting for transcript")
    except Exception as e:
        await client.close()
        raise HTTPException(500, f"STT error: {e}")

    await client.close()
    return JSONResponse({"text": text})


@app.post("/tts")
async def tts(payload: dict):
    text = (payload.get("text") or "").strip()
    voice = payload.get("voice") or "en_US-amy-low"
    if not text:
        raise HTTPException(400, "Missing text")

    try:
        r, w = await asyncio.open_connection(PIPER_HOST, PIPER_PORT)
    except Exception as e:
        raise HTTPException(503, f"TTS backend unavailable: {e}")

    client = AsyncTcpClient(r, w)
    await client.write_event(Synthesize(text=text, voice=voice))

    out = io.BytesIO()

    try:
        async def read_audio():
            async for ev in client.events():
                if isinstance(ev, AudioChunk):
                    out.write(ev.audio)
                elif isinstance(ev, AudioStop):
                    return
        await asyncio.wait_for(read_audio(), timeout=EVENT_TIMEOUT)
    except asyncio.TimeoutError:
        await client.close()
        raise HTTPException(504, "TTS timeout waiting for audio")
    except Exception as e:
        await client.close()
        raise HTTPException(500, f"TTS error: {e}")

    await client.close()
    out.seek(0)
    return StreamingResponse(out, media_type="audio/wav",
                             headers={"Cache-Control": "no-store"})
