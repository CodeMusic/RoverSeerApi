#!/usr/bin/env bash
# 01_bootstrap_comfy_audio_mac.sh
# M2 Mac bootstrap for ComfyUI audio (MusicGen TFM only: small + melody).
# No Audiocraft, no xformers, no Riffusion.

set -euo pipefail

# ── Paths ───────────────────────────────────────────────────────────────────────
COMFY_ROOT="${COMFY_ROOT:-$HOME/redmine-n8n/comfyui/src}"
MODEL_CACHE="${MODEL_CACHE:-$HOME/redmine-n8n/ai-model-cache/comfyui-models}"
CUSTOM_NODES="$COMFY_ROOT/custom_nodes"
VENV="$COMFY_ROOT/.venv"
PYBIN="$VENV/bin/python"
PIP="$VENV/bin/pip"

# Hugging Face cache (keeps all HF artifacts in your shared cache)
export HF_HOME="${HF_HOME:-$HOME/redmine-n8n/ai-model-cache/huggingface}"
mkdir -p "$HF_HOME"
echo "➜ HF cache: $HF_HOME"

# ── Venv ────────────────────────────────────────────────────────────────────────
if [[ ! -x "$PYBIN" ]]; then
  echo "➜ Creating venv in $VENV"
  mkdir -p "$COMFY_ROOT"
  cd "$COMFY_ROOT"
  python3 -m venv .venv
fi

# ── Deps (no audiocraft/xformers) ──────────────────────────────────────────────
echo "➜ Installing base Python deps"
"$PIP" install -U "pip<25.3" wheel setuptools
"$PIP" install "numpy<2" soundfile ffmpeg-python "librosa==0.10.2.post1" "transformers>=4.48,<5" torchaudio

# Optional ffmpeg (system)
if ! command -v ffmpeg >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "➜ Installing ffmpeg via Homebrew"
    brew install ffmpeg || true
  else
    echo "ℹ️ ffmpeg not found and Homebrew missing; continuing anyway."
  fi
fi

# ── ComfyUI-audio node ─────────────────────────────────────────────────────────
mkdir -p "$CUSTOM_NODES"
cd "$CUSTOM_NODES"
if [[ ! -d "ComfyUI-audio" ]]; then
  echo "➜ Cloning eigenpunk/ComfyUI-audio"
  git clone https://github.com/eigenpunk/ComfyUI-audio.git
else
  echo "➜ Updating ComfyUI-audio"
  git -C ComfyUI-audio pull --ff-only || true
fi

# ── Model layout (only MusicGen TFM) ───────────────────────────────────────────
mkdir -p "$MODEL_CACHE/music/musicgen"
mkdir -p "$COMFY_ROOT/models"
ln -snf "$MODEL_CACHE/music/musicgen" "$COMFY_ROOT/models/musicgen"

# ── Download models (MusicGen small + melody) ──────────────────────────────────
echo "➜ Downloading MusicGen (small + melody)"
"$PYBIN" - <<'PY'
import os, glob, shutil
from huggingface_hub import snapshot_download

def fetch(repo, outdir, patterns):
    os.makedirs(outdir, exist_ok=True)
    local = snapshot_download(repo_id=repo, allow_patterns=patterns)
    for f in glob.glob(os.path.join(local, "*")):
        try: shutil.copy2(f, outdir)
        except Exception:
            pass
    print("✓", repo, "→", outdir)

base = os.path.expanduser('~/redmine-n8n/ai-model-cache/comfyui-models/music/musicgen')
patterns = ["*.json","*config.json","model.safetensors","pytorch_model.bin",
            "tokenizer.json","tokenizer_config.json","preprocessor_config.json","generation_config.json"]

fetch('facebook/musicgen-small',  os.path.join(base, 'musicgen-small'),  patterns)
fetch('facebook/musicgen-melody', os.path.join(base, 'musicgen-melody'), patterns)
PY

# ── Run script ─────────────────────────────────────────────────────────────────
cat > "$COMFY_ROOT/run_comfy_audio.sh" <<'SH'
#!/bin/zsh
set -euo pipefail
APP_ROOT="$HOME/redmine-n8n/comfyui/src"
cd "$APP_ROOT"

# Mac/MPS friendly
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTHONNOUSERSITE=1

# Skip API nodes (avoid pyav etc. nagging)
export COMFYUI_SKIP_API_NODES=1

# Paths Comfy should scan
export COMFYUI_CUSTOM_NODE_PATHS="$APP_ROOT/custom_nodes"
export COMFYUI_MODEL_PATHS="$HOME/redmine-n8n/ai-model-cache/comfyui-models"

exec "$APP_ROOT/.venv/bin/python" main.py --listen 0.0.0.0 --port 8008
SH
chmod +x "$COMFY_ROOT/run_comfy_audio.sh"

echo
echo "✅ Bootstrap complete."
echo "Run ComfyUI:"
echo "  $COMFY_ROOT/run_comfy_audio.sh"
echo
echo "In the UI (Nodes): eigenpunk • ComfyUI-audio"
echo "  • MusicGen (TFM)           — text→music"
echo "  • MusicGen (TFM Melody)    — melody-conditioned"
echo
echo "Note: AudioGen (SFX) is intentionally skipped on Mac (needs audiocraft/xformers)."
