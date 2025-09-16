# Minimal, Mac-friendly (no CUDA). Uses pip; works on linux/arm64 under Docker Desktop on Apple Silicon.
FROM python:3.11-slim

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl build-essential ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install project (editable) + CLI deps
COPY pyproject.toml Makefile ./
RUN pip install --no-cache-dir -U pip setuptools wheel && \
    pip install --no-cache-dir "rich" "fastapi" "uvicorn[standard]" && \
    pip install --no-cache-dir .

# Bring in the rest of the code
COPY . .

# Where memories live (we'll mount /space from SilverBullet)
ENV MEMORY_DIR=/space/MusaiMemory

# If mem-agent needs to talk to LM Studio running on host:
# Docker Desktop exposes host as host.docker.internal (we also set extra_hosts in compose)
ENV LMSTUDIO_BASE_URL=http://host.docker.internal:1234

EXPOSE 8081
# Create memory structure (idempotent) then serve MCP over HTTP
CMD bash -lc "mkdir -p \"$MEMORY_DIR/entities\" && make serve-mcp-http"
