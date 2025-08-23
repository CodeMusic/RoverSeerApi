# wyoming-bridge/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install deps
RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    wyoming \
    python-multipart

# Copy the API
COPY app.py /app/

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
