FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# For numpy/scipy + faster-whisper + piper-tts deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg build-essential git curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# FastAPI + TTS/STT + OpenAI-compatible server pieces
RUN pip install --no-cache-dir \
    fastapi uvicorn[standard] pydantic-settings \
    piper-tts \
    faster-whisper \
    httpx

# App
WORKDIR /app
COPY app.py /app/app.py

# Default env (can be overridden by compose)
ENV FASTER_WHISPER_MODEL=base.en \
    DEFAULT_PIPER_VOICE=en_US-GlaDOS-medium \
    OLLAMA_BASE_URL=http://host.docker.internal:11434 \
    OLLAMA_MODEL=llama3

EXPOSE 9000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9000"]
