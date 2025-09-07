#!/bin/zsh
cd ~/redmine-n8n/comfyui/src
source .venv/bin/activate
export PYTORCH_ENABLE_MPS_FALLBACK=1
export COMFYUI_CUSTOM_NODES="/Users/christopherhicks/redmine-n8n/comfyui/custom_nodes"
exec python main.py --listen 0.0.0.0 --port 8008 >> ~/redmine-n8n/comfyui/src/comfyui.log 2>&1
