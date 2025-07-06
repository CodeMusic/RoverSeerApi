#!/bin/bash

# 🧠 AI Silicon Server - Retro-Futuristic Frontend Launcher
# MLX-Accelerated Cognitive Services Gateway

echo "🔥 Starting AI Silicon Server with Retro-Futuristic Frontend..."
echo "================================================================"

# Check if we're in the right directory
if [ ! -f "api_silicon_server.py" ]; then
    echo "❌ Error: Please run this script from the api_silicon_server directory"
    echo "   cd api_silicon_server/"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "mlx_venv" ]; then
    echo "❌ Error: MLX virtual environment not found"
    echo "   Run: ./setup_mlx_server.sh first"
    exit 1
fi

# Use Python directly from MLX virtual environment
echo "🔧 Using MLX virtual environment Python interpreter..."
MLX_PYTHON="./mlx_venv/bin/python"

# Check if the MLX Python interpreter exists
if [ ! -f "$MLX_PYTHON" ]; then
    echo "❌ Error: MLX Python interpreter not found at $MLX_PYTHON"
    echo "   Run: ./setup_mlx_server.sh first"
    exit 1
fi

# Verify MLX is working
echo "🧪 Testing MLX availability..."
$MLX_PYTHON -c "import mlx.core as mx; print('✅ MLX version:', getattr(mx, '__version__', 'unknown')); print('✅ Metal available:', mx.metal.is_available())" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️ Warning: MLX not properly installed, will fallback to Ollama"
else
    echo "🔥 MLX acceleration confirmed!"
fi

# Check if required dependencies are installed
echo "📦 Checking server dependencies..."
MISSING_DEPS=""

# Check for Jinja2 (templates)
$MLX_PYTHON -c "import jinja2" 2>/dev/null || MISSING_DEPS="$MISSING_DEPS jinja2>=3.1.0"

# Check for FastAPI and Uvicorn
$MLX_PYTHON -c "import fastapi" 2>/dev/null || MISSING_DEPS="$MISSING_DEPS fastapi>=0.100.0"
$MLX_PYTHON -c "import uvicorn" 2>/dev/null || MISSING_DEPS="$MISSING_DEPS uvicorn[standard]>=0.23.0"

# Check for Python multipart (for file uploads)
$MLX_PYTHON -c "import multipart" 2>/dev/null || MISSING_DEPS="$MISSING_DEPS python-multipart>=0.0.6"

# Install missing dependencies
if [ ! -z "$MISSING_DEPS" ]; then
    echo "📦 Installing missing dependencies:$MISSING_DEPS"
    ./mlx_venv/bin/pip install $MISSING_DEPS
    echo "✅ Dependencies installed!"
fi

# Check if templates directory exists
if [ ! -d "templates" ]; then
    echo "❌ Error: Templates directory not found"
    echo "   The retro-futuristic frontend files may not be properly installed"
    exit 1
fi

echo "✅ Environment ready!"
echo "🎨 Frontend features:"
echo "   • 🗨️  Main Chat Interface with MLX acceleration"
echo "   • 🎙️  Voice Center for training and synthesis"  
echo "   • 🎭  Interactive Improv Games"
echo "   • 📘  Emergent Narrative storytelling"
echo "   • 🔄  System reset and monitoring"
echo ""

# Start the server
echo "🚀 Launching AI Silicon Server with MLX acceleration..."
echo "   Server will be available at: http://localhost:8080"
echo "   Press Ctrl+C to stop the server"
echo ""

# Kill any existing server processes to prevent conflicts
echo "🔄 Checking for existing server processes..."
pkill -f "python.*api_silicon_server.py" 2>/dev/null || true

# Run with the correct MLX Python interpreter
echo "🔥 Starting with MLX-enabled Python interpreter..."
$MLX_PYTHON api_silicon_server.py

echo ""
echo "🛑 Server stopped. Thanks for using AI Silicon Server!" 