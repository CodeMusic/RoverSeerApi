#!/bin/bash

# 🚀 ClaraVerse Development Setup Script
# This script sets up ClaraVerse development environment alongside your existing Docker stack

set -e

echo "🌟 ClaraVerse Development Setup"
echo "==============================="

# Check if we're in the right directory (should have docker-compose.yml)
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run this script from your project root."
    exit 1
fi

echo "✅ Found docker-compose.yml"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Clone ClaraVerse if not exists
if [ ! -d "ClaraVerse-dev" ]; then
    echo "📥 Cloning ClaraVerse..."
    git clone https://github.com/badboysm890/ClaraVerse.git ClaraVerse-dev
else
    echo "✅ ClaraVerse-dev directory already exists"
fi

# Setup ClaraVerse development
echo "📦 Setting up ClaraVerse development environment..."
cd ClaraVerse-dev

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create development environment file
echo "🔧 Creating development environment configuration..."
cat > .env << EOF
# ClaraVerse Development Environment
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:5173
VITE_N8N_URL=http://localhost:5678
VITE_N8N_WEBHOOK_URL=https://n8n.codemusic.ca/
VITE_OLLAMA_URL=http://localhost:11434
VITE_COMFYUI_URL=http://localhost:3333

# Development flags
VITE_DEBUG=true
VITE_HOT_RELOAD=true
VITE_DEVELOPMENT_MODE=true

# Optional: Add your API keys for cloud providers
# VITE_OPENAI_API_KEY=your_openai_key_here
# VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
EOF

# Create development configuration directory
echo "📁 Creating configuration directories..."
mkdir -p config

cat > config/development.json << EOF
{
  "services": {
    "n8n": {
      "url": "http://localhost:5678",
      "webhookUrl": "https://n8n.codemusic.ca/",
      "enabled": true
    },
         "ollama": {
       "url": "http://localhost:11434",
       "enabled": true,
       "note": "Running on local metal"
     },
     "comfyui": {
       "url": "http://localhost:3333",
       "enabled": true,
       "note": "Via Apache proxy to Docker"
     }
  },
  "development": {
    "hotReload": true,
    "debugMode": true,
    "mockData": false
  }
}
EOF

cd ..

# Create Clara configuration directory
echo "📁 Creating Clara configuration directory..."
mkdir -p clara/config

cat > clara/config/production.json << EOF
{
  "services": {
    "n8n": {
      "url": "http://n8n:5678",
      "webhookUrl": "https://n8n.codemusic.ca/",
      "enabled": true
    },
    "ollama": {
      "url": "http://ollama:11434", 
      "enabled": true
    },
    "comfyui": {
      "url": "http://comfyui:8188",
      "enabled": true
    }
  },
  "production": {
    "logging": "info",
    "persistence": true
  }
}
EOF

# Update docker-compose.yml if needed
if ! grep -q "claraverse:" docker-compose.yml; then
    echo "⚠️  ClaraVerse not found in docker-compose.yml"
    echo "📝 Please update your docker-compose.yml with the ClaraVerse services."
    echo "   See docker-compose-updated.yml for the complete configuration."
else
    echo "✅ ClaraVerse found in docker-compose.yml"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 Quick Start Commands:"
echo ""
echo "1. Start production stack:"
echo "   docker-compose up -d"
echo ""
echo "2. Start development server:"
echo "   cd ClaraVerse-dev && npm run dev"
echo ""
echo "🌐 Access Points:"
echo "   Development:  http://localhost:5173"
echo "   Production:   https://musai.codemusic.ca"
echo "   N8N:          https://n8n.codemusic.ca"
echo "   Ollama:       http://localhost:11434 (local metal)"
echo "   ComfyUI:      https://musai.codemusic.ca/api/ (via proxy)"
echo ""
echo "📚 Next Steps:"
echo "   1. Start your Docker stack: docker-compose up -d"
echo "   2. Wait for services to be ready (check: docker-compose ps)"
echo "   3. Start development: cd ClaraVerse-dev && npm run dev"
echo "   4. Configure ClaraVerse settings to connect to your n8n"
echo ""
echo "🔧 For development workflow, see: development-setup.md"
echo ""

# Test if we can reach the development directory
if [ -d "ClaraVerse-dev" ] && [ -f "ClaraVerse-dev/package.json" ]; then
    echo "✅ Development environment ready!"
else
    echo "❌ Something went wrong with the setup. Please check the errors above."
    exit 1
fi

echo "🎯 Happy coding! 🚀" 