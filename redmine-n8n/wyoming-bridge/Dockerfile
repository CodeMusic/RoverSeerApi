FROM python:3.11-slim

WORKDIR /app

# Get FastAPI + uvicorn, wyoming, and multipart support
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    "wyoming>=1.4.2,<2" \
    python-multipart

COPY app.py /app/app.py

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
