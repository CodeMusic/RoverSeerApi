# wyoming-bridge/Dockerfile
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir fastapi uvicorn[standard] "wyoming==1.6.0" python-multipart

COPY app.py /app/app.py
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
