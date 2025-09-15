#!/usr/bin/env bash
# 01_bootstrap_comfy_audio_mac.sh
# M2/M3 Mac bootstrap for ComfyUI audio:
# - MusicGen (small + melody)
# - DiffRhythm (v1.2 base + full + VAE)
# Idempotent: will skip downloads for files you already have.

set -euo pipefail

# ── Paths ───────────────────────────────────────────────────────────────────────
COMFY_ROOT="${COMFY_ROOT:-$HOME/redmine-n8n/comfyui/src}"
MODEL_CACHE="${MODEL_CACHE:-$HOME/redmine-n8n/ai-model-cache/comfyui-models}"
CUSTOM_NODES="$COMFY_ROOT/custom_nodes"
VENV="$COMFY_ROOT/.venv"
PYBIN="$VENV/bin/python"
PIP="$VENV/bin/pip"

# Hugging Face cache (shared)
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

# ── pip tooling ────────────────────────────────────────────────────────────────
echo "➜ Installing base Python tooling"
"$PIP" install -U "pip<25.3" wheel setuptools

# ── Core deps (Mac friendly) ───────────────────────────────────────────────────
# numpy<2 avoids conflicts with 'unstructured', etc.
echo "➜ Installing core deps"
"$PIP" install -U "numpy<2" soundfile ffmpeg-python "librosa==0.10.2.post1" \
  "transformers>=4.50.2,<5" accelerate sentencepiece safetensors huggingface_hub

# torchaudio must match torch; install only if missing/mismatched
echo "➜ Ensuring torchaudio matches torch"
"$PYBIN" - <<'PY'
import subprocess, sys
try:
    import torch, torchaudio
    tv = torchaudio.__version__
    print(f"torchaudio present ({tv})")
except Exception:
    import torch
    v = torch.__version__.split('+')[0]
    print("Installing torchaudio==", v)
    subprocess.check_call([sys.executable, "-m", "pip", "install", f"torchaudio=={v}"])
PY

# Optional system ffmpeg
if ! command -v ffmpeg >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "➜ Installing ffmpeg via Homebrew"
    brew install ffmpeg || true
  else
    echo "ℹ️ ffmpeg not found and Homebrew missing; continuing anyway."
  fi
fi

# ── ComfyUI-audio (MusicGen TFM nodes) ─────────────────────────────────────────
mkdir -p "$CUSTOM_NODES"
cd "$CUSTOM_NODES"
if [[ ! -d "ComfyUI-audio" ]]; then
  echo "➜ Cloning eigenpunk/ComfyUI-audio"
  git clone https://github.com/eigenpunk/ComfyUI-audio.git
else
  echo "➜ Updating ComfyUI-audio"
  git -C ComfyUI-audio pull --ff-only || true
fi

# ── Model layout / symlinks ────────────────────────────────────────────────────
mkdir -p "$MODEL_CACHE/music/musicgen" "$MODEL_CACHE/music/diffrhythm"
mkdir -p "$COMFY_ROOT/models"
ln -snf "$MODEL_CACHE/music/musicgen"   "$COMFY_ROOT/models/musicgen"
ln -snf "$MODEL_CACHE/music/diffrhythm" "$COMFY_ROOT/models/TTS/DiffRhythm"

# ── Download models (idempotent) ───────────────────────────────────────────────
echo "➜ Downloading / syncing models (MusicGen + DiffRhythm)"

"$PYBIN" - <<'PY'
import os, shutil, glob, sys
from pathlib import Path
from huggingface_hub import snapshot_download

BASE = Path(os.path.expanduser('~/redmine-n8n/ai-model-cache/comfyui-models'))
MG_DST  = BASE/'music'/'musicgen'
DR_DST  = BASE/'music'/'diffrhythm'
MG_DST.mkdir(parents=True, exist_ok=True)
DR_DST.mkdir(parents=True, exist_ok=True)

def have_all(dst, wanted):
    return all((dst/f).exists() for f in wanted)

def copy_missing(local_dir, dst, patterns):
    os.makedirs(dst, exist_ok=True)
    copied = 0
    for pat in patterns:
        for f in glob.glob(os.path.join(local_dir, pat)):
            out = os.path.join(dst, os.path.basename(f))
            if not os.path.exists(out):
                shutil.copy2(f, out)
                copied += 1
    return copied

# ── MusicGen (small + melody) ─────────────────────────────────────────────
mg_patterns = ["*.json","*config.json","model.safetensors","pytorch_model.bin",
               "tokenizer.json","tokenizer_config.json","preprocessor_config.json","generation_config.json"]
def fetch(repo, outdir):
    outdir = Path(outdir); outdir.mkdir(parents=True, exist_ok=True)
    local = snapshot_download(repo_id=repo, allow_patterns=mg_patterns)
    c = copy_missing(local, outdir, mg_patterns)
    print(f"✓ {repo} → {outdir} (+{c} new)")

fetch('facebook/musicgen-small',  MG_DST/'musicgen-small')
fetch('facebook/musicgen-melody', MG_DST/'musicgen-melody')

# ── DiffRhythm (v1.2 base + full + VAE) ───────────────────────────────────
# Repos
DR_BASE_REPO = 'ASLP-lab/DiffRhythm-1_2'      # v1.2 base (cfm_model.pt)   [oai_citation:0‡GitHub](https://github.com/ASLP-lab/DiffRhythm?utm_source=chatgpt.com)
DR_FULL_REPO = 'ASLP-lab/DiffRhythm-1_2-full' # v1.2 full (cfm_full_model.pt)   [oai_citation:1‡GitHub](https://github.com/ASLP-lab/DiffRhythm?utm_source=chatgpt.com)
DR_VAE_REPO  = 'ASLP-lab/DiffRhythm-vae'      # VAE (vae_model.pt)   [oai_citation:2‡Hugging Face](https://huggingface.co/ASLP-lab/DiffRhythm-vae?utm_source=chatgpt.com)

wanted = {
    'base': ['cfm_model_v1_2.pt','cfm_model_v1_2_config.json'],
    'full': ['cfm_full_model.pt','cfm_full_model_config.json'],
    'vae' : ['vae_model.pt'],
}

# If you already manually placed these files, we won't redownload.
# Patterns cover typical names on the model cards; we copy only if missing.
def fetch_diffrhythm(repo, dst, target_names, allow_patterns):
    dst = Path(dst); dst.mkdir(parents=True, exist_ok=True)
    if have_all(dst, target_names):
        print(f"• Skip {repo} (already have: {', '.join(target_names)})")
        return
    local = snapshot_download(repo_id=repo, allow_patterns=allow_patterns)
    copied = copy_missing(local, dst, allow_patterns)
    print(f"✓ {repo} → {dst} (+{copied} new)")

# Base
fetch_diffrhythm(
    DR_BASE_REPO, DR_DST,
    wanted['base'],
    ['cfm_model.pt','*config.json','tokenizer*.json','*vocab*.json','*.json']
)
# If the file is 'cfm_model.pt', rename once to cfm_model_v1_2.pt for the node’s dropdown.
base_src = DR_DST/'cfm_model.pt'
if base_src.exists() and not (DR_DST/'cfm_model_v1_2.pt').exists():
    base_src.rename(DR_DST/'cfm_model_v1_2.pt')

# Full
fetch_diffrhythm(
    DR_FULL_REPO, DR_DST,
    wanted['full'],
    ['cfm_full_model.pt','*config.json']
)
# Normalize naming if needed
full_cfg = [p for p in DR_DST.glob('*config.json') if 'full' in p.name.lower()]
if full_cfg and not (DR_DST/'cfm_full_model_config.json').exists():
    full_cfg[0].rename(DR_DST/'cfm_full_model_config.json')

# VAE
fetch_diffrhythm(
    DR_VAE_REPO, DR_DST,
    wanted['vae'],
    ['vae_model.pt']
)
PY

# ── Run script ────────────────────────────────────────────────────────────────
cat > "$COMFY_ROOT/run_comfy_audio.sh" <<'SH'
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

# Paths Comfy should scan
export COMFYUI_CUSTOM_NODE_PATHS="$APP_ROOT/custom_nodes"
export COMFYUI_MODEL_PATHS="$HOME/redmine-n8n/ai-model-cache/comfyui-models"

# Keep HF stack current for MusicGen nodes (no-op if already satisfied)
$PIP install -q -U "transformers>=4.50.2,<5" accelerate sentencepiece safetensors >/dev/null || true

exec "$PYBIN" main.py --listen 0.0.0.0 --port 8008
SH
chmod +x "$COMFY_ROOT/run_comfy_audio.sh"

echo
echo "✅ Bootstrap complete."
echo "Run ComfyUI:"
echo "  $COMFY_ROOT/run_comfy_audio.sh"
echo
echo "Models in:"
echo "  MusicGen → $MODEL_CACHE/music/musicgen"
echo "  DiffRhythm → $MODEL_CACHE/music/diffrhythm  (cfm_model_v1_2.pt, cfm_full_model.pt, vae_model.pt)"