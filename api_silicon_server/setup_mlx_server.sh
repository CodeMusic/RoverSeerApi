#!/bin/bash
# API Silicon Server - MLX Setup Script
# Comprehensive installation and configuration for Apple Silicon

set -e  # Exit on any error

echo "🧠 API Silicon Server - MLX Setup Script"
echo "========================================"
echo "Setting up MLX-accelerated cognitive services for Apple Silicon..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're on macOS with Apple Silicon
echo "🔍 Checking system compatibility..."
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script is designed for macOS with Apple Silicon${NC}"
    echo "For other platforms, install dependencies manually."
    exit 1
fi

# Check for Apple Silicon
ARCH=$(uname -m)
if [[ "$ARCH" != "arm64" ]]; then
    echo -e "${YELLOW}⚠️  Warning: Not running on Apple Silicon (arm64), MLX acceleration may not work${NC}"
    echo "Detected architecture: $ARCH"
fi

# Check Python version
echo "🐍 Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [[ $PYTHON_MAJOR -lt 3 ]] || [[ $PYTHON_MAJOR -eq 3 && $PYTHON_MINOR -lt 9 ]]; then
    echo -e "${RED}❌ Python 3.9+ required. Found: $(python3 --version)${NC}"
    echo "Please install Python 3.9 or higher"
    exit 1
fi

echo -e "${GREEN}✅ Python version OK: $(python3 --version)${NC}"

# Create virtual environment if it doesn't exist
VENV_DIR="mlx_venv"
if [[ ! -d "$VENV_DIR" ]]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv $VENV_DIR
fi

echo "📦 Activating virtual environment..."
source $VENV_DIR/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing core dependencies..."
pip install -r requirements_complete.txt

# Test MLX installation
echo "🔥 Testing MLX installation..."
python3 -c "
import mlx.core as mx
print(f'✅ MLX Core: Available')
print(f'   • Device: Apple Silicon' if mx.metal.is_available() else '   • Device: CPU only')
print(f'   • Metal available: {mx.metal.is_available()}')
" 2>/dev/null || echo -e "${YELLOW}⚠️  MLX installation incomplete${NC}"

# Test MLX-LM
echo "🤖 Testing MLX-LM..."
python3 -c "
from mlx_lm import load, generate
print('✅ MLX-LM: Available')
" 2>/dev/null || echo -e "${YELLOW}⚠️  MLX-LM not available${NC}"

# Test MLX-Whisper
echo "🎤 Testing MLX-Whisper..."
python3 -c "
import mlx_whisper
print('✅ MLX-Whisper: Available')
" 2>/dev/null || echo -e "${YELLOW}⚠️  MLX-Whisper not available${NC}"

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Set up configuration if it doesn't exist
if [[ ! -f "config.py" ]]; then
    echo -e "${YELLOW}⚠️  config.py not found. Please create it manually or copy from template.${NC}"
fi

# Test server startup (dry run)
echo "🧪 Testing server startup..."
timeout 10s python3 -c "
from api_silicon_server import create_silicon_consciousness
app = create_silicon_consciousness()
print('✅ Server initialization successful')
" 2>/dev/null || echo -e "${YELLOW}⚠️  Server startup test failed - check dependencies${NC}"

# Download a small MLX model for testing (optional)
read -p "📥 Download a small MLX model for testing? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📥 Downloading MLX model (this may take a few minutes)..."
    python3 -c "
from mlx_lm import load
try:
    model, tokenizer = load('mlx-community/Llama-3.2-1B-Instruct-4bit')
    print('✅ Model downloaded successfully')
except Exception as e:
    print(f'❌ Model download failed: {e}')
    " || echo -e "${YELLOW}⚠️  Model download failed${NC}"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo -e "${GREEN}✅ MLX-accelerated API Silicon Server is ready!${NC}"
echo ""
echo "🚀 To start the server:"
echo -e "${BLUE}  source $VENV_DIR/bin/activate${NC}"
echo -e "${BLUE}  python3 api_silicon_server.py${NC}"
echo ""
echo "🌐 Server will be available at:"
echo "  • Main API: http://localhost:8080"
echo "  • Documentation: http://localhost:8080/docs"
echo "  • Status: http://localhost:8080/status"
echo ""
echo "🔧 Configuration:"
echo "  • Edit config.py to customize MLX settings"
echo "  • Check logs/ directory for detailed logs"
echo "  • Use /status endpoint to verify MLX acceleration"
echo ""
echo "🧪 Quick test commands:"
echo -e "${BLUE}  curl http://localhost:8080/status | jq .mlx_acceleration${NC}"
echo -e "${BLUE}  curl -X POST http://localhost:8080/llm -F 'prompt=Hello MLX!'${NC}"
echo ""

# Check for common issues
echo "🔍 System check summary:"
echo "========================"

# Check available memory
MEMORY_GB=$(python3 -c "import psutil; print(f'{psutil.virtual_memory().total / (1024**3):.1f}')")
echo "💾 Available RAM: ${MEMORY_GB}GB"
if (( $(echo "$MEMORY_GB < 8" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Warning: Less than 8GB RAM. Large models may not fit.${NC}"
fi

# Check disk space
DISK_SPACE=$(df -h . | awk 'NR==2 {print $4}')
echo "💾 Available disk space: $DISK_SPACE"

# Check if Ollama is running (fallback service)
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama fallback service: Running${NC}"
else
    echo -e "${YELLOW}⚠️  Ollama fallback service: Not running${NC}"
    echo "   Install with: brew install ollama && ollama serve"
fi

echo ""
echo "📚 For more information:"
echo "  • README: Check README_silicon_server.md"
echo "  • MLX docs: https://ml-explore.github.io/mlx/"
echo "  • Issues: Report any problems with detailed logs"
echo ""
echo -e "${GREEN}🎯 Happy accelerated AI processing on Apple Silicon!${NC}" 