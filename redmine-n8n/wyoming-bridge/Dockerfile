FROM python:3.11-slim

WORKDIR /app

# System deps (kept minimal)
RUN pip install --no-cache-dir --upgrade pip

# Pin wyoming to a modern 1.x. 1.6.0 works great with this app.
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    python-multipart \
    --upgrade --force-reinstall wyoming==1.6.0

COPY app.py /app/app.py

# Make logs unbuffered
ENV PYTHONUNBUFFERED=1 \
    LOG_LEVEL=INFO

EXPOSE 8000

# You can also pass envs via compose to change hosts/ports/default voice
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
