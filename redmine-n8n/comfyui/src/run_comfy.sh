#!/bin/zsh
set -euo pipefail

APP_ROOT="$HOME/redmine-n8n/comfyui/src"
PYBIN="$APP_ROOT/.venv/bin/python"
LOG="$APP_ROOT/comfyui.log"

cd "$APP_ROOT"

# Apple Silicon / discovery
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTHONNOUSERSITE=1
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0

# Your custom nodes + central model cache
export COMFYUI_CUSTOM_NODES="$HOME/redmine-n8n/comfyui/src/custom_nodes"
export COMFYUI_MODELS_PATHS="$HOME/redmine-n8n/ai-model-cache/comfyui-models"

# Optional hardening
ulimit -n 4096 2>/dev/null || true

exec "$PYBIN" main.py --listen 0.0.0.0 --port 8008 >> "$LOG" 2>&1