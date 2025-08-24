FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# sys deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg build-essential git curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# --- Piper CLI (binary) ---
ARG PIPER_VERSION=1.2.0
RUN set -eux; \
    arch="$(uname -m)"; \
    case "$arch" in \
      x86_64) PIPER_ARCH="x86_64" ;; \
      aarch64|arm64) PIPER_ARCH="aarch64" ;; \
      *) echo "Unsupported arch: $arch"; exit 1 ;; \
    esac; \
    url="https://github.com/rhasspy/piper/releases/download/v${PIPER_VERSION}/piper_${PIPER_VERSION}_linux_${PIPER_ARCH}.tar.gz"; \
    echo "Fetching $url"; \
    curl -fL --retry 5 --retry-all-errors -A "curl/7 musai-api" "$url" -o /tmp/piper.tgz; \
    mkdir -p /opt/piper; \
    tar -xzf /tmp/piper.tgz -C /opt/piper --strip-components=1; \
    ln -s /opt/piper/piper /usr/local/bin/piper; \
    rm -f /tmp/piper.tgz

# Python deps (pin to avoid drift)
RUN pip install --no-cache-dir \
  fastapi==0.110.0 uvicorn[standard]==0.29.0 pydantic-settings==2.2.1 \
  piper-tts==1.2.0 \
  faster-whisper==1.0.3 \
  numpy==1.26.4 \
  httpx==0.27.0 \
  python-multipart==0.0.9

WORKDIR /app
COPY app.py /app/app.py

ENV FASTER_WHISPER_MODEL=base.en \
    DEFAULT_PIPER_VOICE=en_US-GlaDOS-medium \
    OLLAMA_BASE_URL=http://host.docker.internal:11434 \
    OLLAMA_MODEL=llama3

EXPOSE 9000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9000"]
