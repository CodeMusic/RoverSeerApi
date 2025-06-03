FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Clear pip cache
RUN pip cache purge

# Install Python packages from requirements.txt
COPY requirements.txt .

# Install PyTorch and related packages
RUN pip install --no-cache-dir --prefer-binary \
    torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2

# Install other requirements with legacy resolver
RUN pip install --no-cache-dir --prefer-binary --use-deprecated=legacy-resolver -r requirements.txt

# Create app directory
WORKDIR /app

# Create data and output directories
RUN mkdir -p /app/data /app/output

# Copy training script
COPY train.py /app/

# Make training script executable
RUN chmod +x /app/train.py 