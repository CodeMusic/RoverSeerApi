#!/bin/bash

# Silicon Server Mac Setup Script
# Installs and configures all dependencies for Mac

echo "🍎 Setting up Silicon Server for Mac"
echo "=================================="

# Check if running on Mac
if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ This script is for macOS only"
    exit 1
fi

echo "🔍 Checking system..."
echo "macOS Version: $(sw_vers -productVersion)"
echo "Architecture: $(uname -m)"
echo

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "✅ Homebrew already installed"
fi

# Update Homebrew
echo "🔄 Updating Homebrew..."
brew update

# Install Python if needed
if ! command -v python3 &> /dev/null; then
    echo "🐍 Installing Python..."
    brew install python
else
    echo "✅ Python already installed: $(python3 --version)"
fi

# Install Piper TTS
echo "🔊 Installing Piper TTS..."
if ! command -v piper &> /dev/null; then
    brew install piper-tts
    echo "✅ Piper TTS installed"
else
    echo "✅ Piper TTS already installed"
fi

# Verify Piper installation
echo "🧪 Testing Piper installation..."
if piper --help &> /dev/null; then
    echo "✅ Piper is working correctly"
    PIPER_PATH=$(which piper)
    echo "   Located at: $PIPER_PATH"
else
    echo "❌ Piper installation may have issues"
fi

# Create voice directories
echo "📁 Setting up voice directories..."
mkdir -p ~/piper/voices
mkdir -p ~/Library/Application\ Support/piper/voices
mkdir -p ~/Downloads/piper_voices
echo "✅ Voice directories created"

# Create MLX model directories
echo "🔥 Setting up MLX directories..."
mkdir -p ~/mlx-models/language_models
mkdir -p ~/mlx-models/whisper
mkdir -p ~/mlx-models/custom_voices
echo "✅ MLX directories created"

# Install Python dependencies
echo "📦 Installing Python dependencies..."

# Create virtual environment if it doesn't exist
if [ ! -d "mlx_venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv mlx_venv
fi

# Activate virtual environment
source mlx_venv/bin/activate

# Install core dependencies
echo "   Installing core packages..."
pip install --upgrade pip

# Install MLX framework
echo "   Installing MLX framework..."
pip install mlx

# Install MLX-LM
echo "   Installing MLX-LM..."
pip install mlx-lm

# Install other dependencies
echo "   Installing other dependencies..."
pip install fastapi uvicorn requests numpy torch torchaudio

# Try to install piper-tts Python package as fallback
echo "   Installing Piper Python package..."
pip install piper-tts || echo "⚠️  Piper Python package installation failed (using binary instead)"

# Install optional dependencies
echo "   Installing optional packages..."
pip install audiocraft-musicgen || echo "⚠️  AudioCraft not available"

# Download a sample voice model
echo "🎭 Downloading sample voice model..."
VOICE_DIR="$HOME/piper/voices"
if [ ! -f "$VOICE_DIR/en_US-lessac-low.onnx" ]; then
    echo "   Downloading en_US-lessac-low voice..."
    curl -L -o "$VOICE_DIR/en_US-lessac-low.onnx" \
        "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/low/en_US-lessac-low.onnx"
    curl -L -o "$VOICE_DIR/en_US-lessac-low.onnx.json" \
        "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/low/en_US-lessac-low.onnx.json"
    echo "✅ Sample voice downloaded"
else
    echo "✅ Sample voice already exists"
fi

# Download a sample MLX model
echo "🤖 Downloading sample MLX model..."
MLX_DIR="$HOME/mlx-models/language_models"
if [ ! -d "$MLX_DIR/Llama-3.2-1B-Instruct-4bit" ]; then
    echo "   Downloading Llama-3.2-1B-Instruct-4bit..."
    cd "$MLX_DIR"
    git clone https://huggingface.co/mlx-community/Llama-3.2-1B-Instruct-4bit
    cd - > /dev/null
    echo "✅ Sample MLX model downloaded"
else
    echo "✅ Sample MLX model already exists"
fi

# Test the installation
echo "🧪 Running compatibility test..."
python3 test_mac_compatibility.py

echo
echo "🎉 Mac setup complete!"
echo
echo "📋 NEXT STEPS:"
echo "1. Start the server: python3 api_silicon_server.py"
echo "2. Open browser: http://localhost:8080"
echo "3. Test voice synthesis and chat"
echo
echo "💡 TIPS:"
echo "• Use 'brew upgrade piper-tts' to update Piper"
echo "• Download more voices from: https://huggingface.co/rhasspy/piper-voices"
echo "• MLX models are in: ~/mlx-models/"
echo "• Voice models are in: ~/piper/voices/"
echo
echo "🆘 TROUBLESHOOTING:"
echo "• If Piper doesn't work: brew reinstall piper-tts"
echo "• If MLX doesn't work: pip install --upgrade mlx mlx-lm"
echo "• For voice issues: check ~/piper/voices/ for .onnx files" 