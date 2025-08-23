# wyoming-bridge/Dockerfile
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

# Pin to a good version to avoid missing VERSION file
RUN pip install --no-cache-dir fastapi uvicorn[standard] "wyoming==1.4.2"

COPY app.py /app/app.py
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
