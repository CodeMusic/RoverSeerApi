FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps: ffmpeg (for audio), curl & unzip (to fetch Piper), libsndfile (for soundfile)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg curl unzip ca-certificates libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# ---- Install Piper binary (auto-pick arch) ----
# GitHub releases: https://github.com/rhasspy/piper/releases
# We'll resolve TARGETARCH and pull a suitable binary.
ARG PIPER_VERSION=1.2.0
ARG TARGETARCH
# Map docker arch to Piper artifact name
# amd64 -> x86_64 ; arm64 -> aarch64
RUN set -eux; \
    arch="$(uname -m)"; \
    if [ "$arch" = "x86_64" ]; then PIPER_ARCH="x86_64"; \
    elif [ "$arch" = "aarch64" ]; then PIPER_ARCH="aarch64"; \
    else echo "Unsupported arch: $arch"; exit 1; fi; \
    url="https://github.com/rhasspy/piper/releases/download/v${PIPER_VERSION}/piper_${PIPER_VERSION}_linux_${PIPER_ARCH}.tar.gz"; \
    echo "Fetching $url"; \
    curl -L "$url" -o /tmp/piper.tgz; \
    mkdir -p /opt/piper; \
    tar -xzf /tmp/piper.tgz -C /opt/piper --strip-components=1; \
    ln -s /opt/piper/piper /usr/local/bin/piper; \
    rm -f /tmp/piper.tgz

# Python deps
WORKDIR /app
COPY requirements.txt ./
RUN pip install -r requirements.txt

# App
COPY app.py /app/app.py

# Model mount points (you’ll bind-mount your local caches)
VOLUME ["/voices", "/whisper-models"]

EXPOSE 9000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9000"]
