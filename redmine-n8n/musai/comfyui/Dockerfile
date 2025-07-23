FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Clone ComfyUI from official repository
RUN git clone https://github.com/comfyanonymous/ComfyUI.git .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create directories for models, input, and output
RUN mkdir -p /app/models /app/input /app/output

# Expose port 8188
EXPOSE 8188

# Default command to run ComfyUI
CMD ["python", "main.py", "--listen", "0.0.0.0", "--port", "8188"] 