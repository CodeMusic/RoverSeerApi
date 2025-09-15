#!/usr/bin/env bash
# 01_bootstrap_comfy_audio_mac.sh
# Local bootstrap for ComfyUI audio on M2 Mac (no xformers/audiocraft).
# Installs eigenpunk/ComfyUI-audio, light deps, models, and a runner script.

set -euo pipefail

# ---- Paths (override with env if you like) ------------------------------------
COMFY_ROOT="${COMFY_ROOT:-$HOME/redmine-n8n/comfyui/src}"
MODEL_CACHE="${MODEL_CACHE:-$HOME/redmine-n8n/ai-model-cache/comfyui-models}"
CUSTOM_NODES="$COMFY_ROOT/custom_nodes"
VENV="$COMFY_ROOT/.venv"
PYBIN="$VENV/bin/python"
PIP="$VENV/bin/pip"

export HF_HOME="$HOME/redmine-n8n/ai-model-cache/huggingface"
mkdir -p "$HF_HOME"
echo "➜ Hugging Face cache set to: $HF_HOME"

# ---- Create venv if missing ---------------------------------------------------
if [[ ! -x "$PYBIN" ]]; then
  echo "➜ Creating venv in $VENV"
  mkdir -p "$COMFY_ROOT"
  cd "$COMFY_ROOT"
  python3 -m venv .venv
fi

# ---- Base deps (Mac-friendly) -------------------------------------------------
echo "➜ Installing base Python deps"
"$PIP" install -U "pip<25.3" wheel setuptools
# Stable libs for audio & TF models; keep numpy<2 for many nodes
"$PIP" install "numpy<2" soundfile ffmpeg-python "librosa==0.10.2.post1" "transformers>=4.48,<5" torchaudio

# Optional system ffmpeg (skip if already installed)
if ! command -v ffmpeg >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "➜ Installing ffmpeg via Homebrew"
    brew install ffmpeg || true
  else
    echo "ℹ️ ffmpeg not found and Homebrew missing; continuing anyway."
  fi
fi

# ---- Get ComfyUI-audio node ---------------------------------------------------
mkdir -p "$CUSTOM_NODES"
cd "$CUSTOM_NODES"
if [[ ! -d "ComfyUI-audio" ]]; then
  echo "➜ Cloning eigenpunk/ComfyUI-audio"
  git clone https://github.com/eigenpunk/ComfyUI-audio.git
else
  echo "➜ Updating ComfyUI-audio"
  git -C ComfyUI-audio pull --ff-only || true
fi

# ---- Models layout (cache + symlinks) -----------------------------------------
mkdir -p "$MODEL_CACHE/music/musicgen" \
         "$MODEL_CACHE/audio/riffusion" \
         "$MODEL_CACHE/audio/stable-audio"

mkdir -p "$COMFY_ROOT/models"
ln -snf "$MODEL_CACHE/music/musicgen"      "$COMFY_ROOT/models/musicgen"
ln -snf "$MODEL_CACHE/audio/riffusion"     "$COMFY_ROOT/models/riffusion"
ln -snf "$MODEL_CACHE/audio/stable-audio"  "$COMFY_ROOT/models/stable-audio"

# ---- Download small, reliable models ------------------------------------------
echo "➜ Downloading small models (MusicGen + Melody + Riffusion)"
"$PYBIN" - <<'PY'
import os, glob, shutil
from huggingface_hub import snapshot_download

def fetch(repo, outdir, patterns):
    os.makedirs(outdir, exist_ok=True)
    local = snapshot_download(repo_id=repo, allow_patterns=patterns)
    for f in glob.glob(os.path.join(local, "*")):
        try: shutil.copy2(f, outdir)
        except Exception: pass
    print("✓", repo, "→", outdir)

base_music = os.path.expanduser('~/redmine-n8n/ai-model-cache/comfyui-models/music/musicgen')
fetch('facebook/musicgen-small',  os.path.join(base_music, 'musicgen-small'),
      ["*.json","*config.json","model.safetensors","pytorch_model.bin","tokenizer.json","tokenizer_config.json","preprocessor_config.json","generation_config.json"])
fetch('facebook/musicgen-melody', os.path.join(base_music, 'musicgen-melody'),
      ["*.json","*config.json","model.safetensors","pytorch_model.bin","tokenizer.json","tokenizer_config.json","preprocessor_config.json","generation_config.json"])

base_riff = os.path.expanduser('~/redmine-n8n/ai-model-cache/comfyui-models/audio/riffusion')
fetch('riffusion/riffusion-model-v1', base_riff,
      ["*.ckpt","*.safetensors","*.yaml","*.json"])
PY

# (Optional) Stable Audio Open (heavier – skip on 16GB if tight)
if [[ "${INCLUDE_STABLE_AUDIO:-0}" == "1" ]]; then
  echo "➜ Downloading StabilityAI stable-audio-open-1.0 (optional/heavy)"
  "$PYBIN" - <<'PY'
import os, glob, shutil
from huggingface_hub import snapshot_download

base = os.path.expanduser('~/redmine-n8n/ai-model-cache/comfyui-models/audio/stable-audio')
os.makedirs(base, exist_ok=True)
local = snapshot_download(repo_id='stabilityai/stable-audio-open-1.0',
                          allow_patterns=["*.json","*.safetensors","*.bin"])
for f in glob.glob(os.path.join(local, "*")):
    try: shutil.copy2(f, base)
    except Exception: pass
print("✓ stabilityai/stable-audio-open-1.0 →", base)
PY
fi

# ---- Run script for ComfyUI (Mac flags) ---------------------------------------
cat > "$COMFY_ROOT/run_comfy_audio.sh" <<'SH'
#!/bin/zsh
set -euo pipefail
APP_ROOT="$HOME/redmine-n8n/comfyui/src"
cd "$APP_ROOT"

# Mac/MPS friendly flags
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTHONNOUSERSITE=1

# Quiet those API nodes if they complain
export COMFYUI_SKIP_API_NODES=1

# Make sure Comfy sees our models/nodes
export COMFYUI_CUSTOM_NODE_PATHS="$APP_ROOT/custom_nodes"
export COMFYUI_MODEL_PATHS="$HOME/redmine-n8n/ai-model-cache/comfyui-models"

exec "$APP_ROOT/.venv/bin/python" main.py --listen 0.0.0.0 --port 8008
SH
chmod +x "$COMFY_ROOT/run_comfy_audio.sh"

echo
echo "✅ Local audio bootstrap complete."
echo "Run ComfyUI:"
echo "  $COMFY_ROOT/run_comfy_audio.sh"
echo
echo "In the UI, look for eigenpunk • ComfyUI-audio nodes:"
echo "  • MusicGen (TFM)  — text→music (fast & Mac-friendly)"
echo "  • MusicGen (TFM Melody) — melody-conditioned"
echo "  • Riffusion      — very light SFX/loop generator"
