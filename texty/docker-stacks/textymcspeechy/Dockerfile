FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages from requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create app directory
WORKDIR /app

# Create data and output directories
RUN mkdir -p /app/data /app/output

# Set default command (will be overridden by docker-compose)
ENTRYPOINT ["python3", "train.py"]
CMD ["/app/data/MyVoice", "/app/output/MyVoice"] 