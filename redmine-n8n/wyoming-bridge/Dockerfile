# wyoming-bridge/Dockerfile
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

# Get FastAPI + uvicorn and the latest Wyoming with messages support
RUN pip install --no-cache-dir fastapi uvicorn[standard] \
    "git+https://github.com/rhasspy/wyoming@v1.6.0"

COPY app.py /app/app.py
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
