#!/bin/zsh
cd ~/redmine-n8n/comfyui/src
source .venv/bin/activate
export PYTORCH_ENABLE_MPS_FALLBACK=1
export COMFYUI_CUSTOM_NODES="$HOME/redmine-n8n/comfyui/src/custom_nodes"
export COMFYUI_MODELS_PATHS="$HOME/redmine-n8n/ai-model-cache/comfyui-models"
exec python main.py --listen 0.0.0.0 --port 8008 >> ~/redmine-n8n/comfyui/src/comfyui.log 2>&1
