#!/bin/zsh
set -euo pipefail
APP_ROOT="$HOME/redmine-n8n/comfyui/src"
VENV="$APP_ROOT/.venv"
PYBIN="$VENV/bin/python"
PIP="$VENV/bin/pip"
cd "$APP_ROOT"

# Mac/MPS friendly
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTHONNOUSERSITE=1

# Skip API nodes (avoid pyav etc. nagging)
export COMFYUI_DISABLE_API_NODES=1

# Paths Comfy should scan
export COMFYUI_CUSTOM_NODE_PATHS="$APP_ROOT/custom_nodes"
export COMFYUI_MODEL_PATHS="$HOME/redmine-n8n/ai-model-cache/comfyui-models"

# 🔒 Ensure the right HF stack for MusicGenHFNode (idempotent, quick if satisfied)
$PIP install -q -U "transformers>=4.50.2,<5" accelerate sentencepiece safetensors >/dev/null || true

exec "$PYBIN" main.py --listen 0.0.0.0 --port 8008
