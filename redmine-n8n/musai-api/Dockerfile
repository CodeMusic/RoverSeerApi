# Base image already has Piper installed & working
FROM rhasspy/wyoming-piper:latest

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps for STT & audio
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg ca-certificates libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Python deps
WORKDIR /app
COPY requirements.txt ./
RUN pip install -r requirements.txt

# App
COPY app.py /app/app.py

# Voice + Whisper model mount points
VOLUME ["/voices", "/whisper-models"]

EXPOSE 9000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9000"]
