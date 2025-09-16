#!/bin/zsh
set -euo pipefail

APP_ROOT="$HOME/redmine-n8n/comfyui/src"
VENV="$APP_ROOT/.venv"
PYBIN="$VENV/bin/python"
PIP="$VENV/bin/pip"
LOG="$APP_ROOT/comfyui.log"

# ── Sanity: venv must exist ────────────────────────────────────────────────────
if [[ ! -x "$PYBIN" ]]; then
  echo "✖ Missing venv at: $VENV"
  echo "  Fix: cd \"$APP_ROOT\" && python3 -m venv .venv && . .venv/bin/activate && pip install -U pip"
  exit 1
fi

cd "$APP_ROOT"

# ── Apple Silicon / memory friendliness ────────────────────────────────────────
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0   # reduce OOM flakiness on 16GB
export TOKENIZERS_PARALLELISM=false
export PYTHONNOUSERSITE=1

# Quiet bundled API nodes if not needed
export COMFYUI_SKIP_API_NODES=1

# ── ComfyUI search paths ───────────────────────────────────────────────────────
export COMFYUI_CUSTOM_NODE_PATHS="$APP_ROOT/custom_nodes"
export COMFYUI_MODEL_PATHS="$HOME/redmine-n8n/ai-model-cache/comfyui-models"

# Centralize Hugging Face cache
export HF_HOME="$HOME/redmine-n8n/ai-model-cache/huggingface"
export HUGGINGFACE_HUB_CACHE="$HF_HOME"

# Optional: raise open file limit
ulimit -n 8192 2>/dev/null || true

# ── Ensure audio deps (only if not already installed) ──────────────────────────
if ! $PYBIN -c "import resampy, librosa, soundfile" >/dev/null 2>&1; then
  echo "➜ Installing/updating audio Python deps…"
  "$PIP" install -U "pip<25.3" wheel setuptools >/dev/null
  "$PIP" install -q \
    "numpy<2" \
    "transformers>=4.48,<5" \
    accelerate sentencepiece safetensors \
    soundfile ffmpeg-python "librosa==0.10.2.post1" torchaudio \
    "scipy>=1.10,<2" "resampy==0.4.2" audioread soxr || true
fi

# ── Launch ComfyUI ─────────────────────────────────────────────────────────────
# Use tee so logs are saved but still visible on screen
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0

exec "$PYBIN" main.py --listen 0.0.0.0 --port 8008 | tee -a "$LOG"