# wyoming-bridge/Dockerfile
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

# FastAPI + Uvicorn + Wyoming from PyPI (no git needed)
RUN pip install --no-cache-dir fastapi uvicorn[standard] "wyoming>=1.4.2,<2"

COPY app.py /app/app.py
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
