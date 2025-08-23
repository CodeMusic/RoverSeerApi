FROM python:3.11-slim

WORKDIR /app

# System deps (optional but handy for troubleshooting)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl tini && \
    rm -rf /var/lib/apt/lists/*

# Libs: pin wyoming to the protocol that matches the rhasspy images
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    python-multipart \
    "wyoming==1.4.2"

COPY app.py /app/app.py

ENV LOG_LEVEL=INFO
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
