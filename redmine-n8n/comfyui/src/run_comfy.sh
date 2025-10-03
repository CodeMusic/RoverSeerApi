#!/bin/zsh
set -euo pipefail

APP_ROOT="$HOME/redmine-n8n/comfyui/src"
LOG_COMFY="$APP_ROOT/comfyui.log"
VENV="$APP_ROOT/.venv"
PYBIN="$VENV/bin/python"

CUSTOM_NODES="$APP_ROOT/custom_nodes"
COMFY_MODELS="$HOME/redmine-n8n/ai-model-cache/comfyui-models"
HF_CACHE="$HOME/redmine-n8n/ai-model-cache/huggingface"

export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0
export TOKENIZERS_PARALLELISM=false
export PYTHONNOUSERSITE=1
export COMFYUI_SKIP_API_NODES=1

# PATH & tools
export PATH="/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export IMAGEIO_FFMPEG_EXE="$(command -v ffmpeg || echo /opt/homebrew/bin/ffmpeg)"

# Comfy paths/caches
export COMFYUI_CUSTOM_NODE_PATHS="$CUSTOM_NODES"
export COMFYUI_MODEL_PATHS="$COMFY_MODELS"
export HF_HOME="$HF_CACHE"
export HUGGINGFACE_HUB_CACHE="$HF_CACHE"
export XDG_CACHE_HOME="$HOME/.cache"
export TORCH_HOME="$HOME/.cache/torch"

export PYTHONUNBUFFERED=1
export LANG="en_US.UTF-8"
export LC_ALL="en_US.UTF-8"
export COMFYUI_PORT="${COMFYUI_PORT:-8008}"

export COMFYUI_MANAGER_NETWORK_MODE=public
export COMFYUI_MANAGER_CACHE_DIR="$APP_ROOT/user/default/ComfyUI-Manager"
mkdir -p "$COMFYUI_MANAGER_CACHE_DIR"

[[ -x "$PYBIN" ]] || { echo "venv python missing!"; exit 1; }

cd "$APP_ROOT"

# clean stale state
rm -f "$APP_ROOT/queue.json" "$APP_ROOT/queue_backup.json" "$APP_ROOT/last_prompt.json" 2>/dev/null || true
rm -rf "$APP_ROOT/temp" 2>/dev/null || true

# nuke bad site-packages trash (NumPy temp dirs, etc.)
SITE="$("$PYBIN" - <<'PY'
import sysconfig; print(sysconfig.get_paths().get("purelib") or "")
PY
)"
if [[ -n "$SITE" && -d "$SITE" ]]; then
  find "$SITE" -maxdepth 1 -name '~umpy*' -exec rm -rf {} + 2>/dev/null || true
fi

# dump env once for doctor
env | sort > "$APP_ROOT/comfyui_env.dump"

# run (let launchd capture stdout/err into the plist paths)
exec "$PYBIN" -u main.py --listen 0.0.0.0 --port "$COMFYUI_PORT"
