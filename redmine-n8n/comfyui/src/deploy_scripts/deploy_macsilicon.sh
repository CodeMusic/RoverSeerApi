#!/usr/bin/env bash
# deploy_music_and_sfx.sh
# One-shot setup for MusicGen (music) + AudioGen (SFX) inside ComfyUI.
# Apple Silicon & 16 GB friendly. Disables xformers build, enables MPS fallback.

set -euo pipefail

# ── GLOBAL ENV (always on for this script) ──────────────────────────────────────
export PYTORCH_ENABLE_MPS_FALLBACK=1
export AUDIOCRAFT_DISABLE_XFORMERS=1

# ── CONFIG ──────────────────────────────────────────────────────────────────────
COMFY_ROOT="${COMFY_ROOT:-$HOME/redmine-n8n/comfyui/src}"
VENV="$COMFY_ROOT/.venv"
PYBIN="$VENV/bin/python"
PIP="$VENV/bin/pip"

MUSIC_NODE_DIR="$COMFY_ROOT/custom_nodes/ComfyUI-MusicGen"
AUDIO_NODE_DIR="$COMFY_ROOT/custom_nodes/ComfyUI-AudioGen"

MUSIC_MODEL_ID="facebook/musicgen-small"
SFX_MODEL_ID="facebook/audiogen-medium"

MUSIC_MODEL_DIR="$MUSIC_NODE_DIR/models/musicgen-small"
SFX_MODEL_DIR="$AUDIO_NODE_DIR/models/audiogen-medium"

WF_DIR="$COMFY_ROOT/workflows"
WF_FILE="$WF_DIR/music_and_sfx_minimal.json"

# ── PRECHECKS ───────────────────────────────────────────────────────────────────
if [[ ! -x "$PYBIN" ]]; then
  echo "✖ ComfyUI venv not found at: $VENV"
  echo "  Create it first:"
  echo "    cd \"$COMFY_ROOT\" && python3 -m venv .venv && . .venv/bin/activate && pip install -U pip"
  exit 1
fi

mkdir -p "$COMFY_ROOT/custom_nodes" "$WF_DIR"

# ── CLONE MUSICGEN NODE ─────────────────────────────────────────────────────────
if [[ ! -d "$MUSIC_NODE_DIR" ]]; then
  echo "➜ Cloning Elawphant/ComfyUI-MusicGen…"
  git clone https://github.com/Elawphant/ComfyUI-MusicGen.git "$MUSIC_NODE_DIR"
else
  echo "➜ Updating ComfyUI-MusicGen…"
  git -C "$MUSIC_NODE_DIR" pull --ff-only || true
fi

# ── PY DEPS (MPS-friendly, skip xformers) ───────────────────────────────────────
echo "➜ Installing Python deps…"
"$PIP" install --upgrade "pip<25" wheel setuptools
"$PIP" install "audiocraft==1.3.0" "huggingface_hub>=0.24,<0.26"

REQ="$MUSIC_NODE_DIR/requirements.txt"
if [[ -f "$REQ" ]]; then
  TMP_REQ="$(mktemp)"
  grep -v -E '(^xformers|facebookresearch/audiocraft|git\+https?://.*audiocraft)' "$REQ" > "$TMP_REQ" || true
  "$PIP" install -r "$TMP_REQ" || true
  rm -f "$TMP_REQ"
fi

command -v ffmpeg >/dev/null 2>&1 || { command -v brew >/dev/null 2>&1 && brew install ffmpeg || true; }

# ── WRITE MINIMAL AUDIOGEN NODE (unchanged) ─────────────────────────────────────
mkdir -p "$AUDIO_NODE_DIR"
cat > "$AUDIO_NODE_DIR/__init__.py" <<'PY'
from .audiogen_node import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
PY

cat > "$AUDIO_NODE_DIR/audiogen_node.py" <<'PY'
import os, torch
from typing import List
from audiocraft.models import AudioGen

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL_DIR = os.path.join(HERE, "models", "audiogen-medium")

def _best_device():
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"

class AudioGenNode:
    def __init__(self):
        self.device = _best_device()
        self.model_cache = {}

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "prompt": ("STRING", {"multiline": True, "default": "rain falling on a tin roof, distant thunder"}),
                "duration": ("INT", {"default": 8, "min": 1, "max": 60, "step": 1}),
            },
            "optional": {
                "model_path": ("STRING", {"default": DEFAULT_MODEL_DIR}),
                "top_k": ("INT", {"default": 250, "min": 0, "max": 1000}),
                "top_p": ("FLOAT", {"default": 0.95, "min": 0.0, "max": 1.0, "step": 0.01}),
                "cfg": ("FLOAT", {"default": 3.0, "min": 0.0, "max": 10.0, "step": 0.1}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 2**31-1}),
            },
        }

    CATEGORY = "🎧 Audio • Generators"
    RETURN_TYPES = ("AUDIO",)
    RETURN_NAMES = ("audio",)
    FUNCTION = "generate"

    def _load_model(self, model_path: str):
        key = (model_path, self.device)
        if key in self.model_cache:
            return self.model_cache[key]
        if not os.path.isdir(model_path):
            raise FileNotFoundError(f"AudioGen model_path not found: {model_path}")
        model = AudioGen.get_pretrained(model_path, device=self.device)
        model.set_generation_params(duration=8)
        self.model_cache[key] = model
        return model

    def generate(self, prompt: str, duration: int,
                 model_path: str = DEFAULT_MODEL_DIR,
                 top_k: int = 250, top_p: float = 0.95, cfg: float = 3.0, seed: int = 0):

        torch.manual_seed(seed if seed != 0 else torch.seed())
        model = self._load_model(model_path)
        model.set_generation_params(duration=duration, top_k=top_k, top_p=top_p, cfg_coef=cfg)
        wavs: List[torch.Tensor] = model.generate([prompt])
        sr = getattr(model.cfg, "sample_rate", 32000)
        audio = wavs[0]
        if audio.dim() == 1:
            audio = audio.unsqueeze(0)
        return ({"waveform": audio.contiguous().cpu(), "sample_rate": int(sr)},)

NODE_CLASS_MAPPINGS = {"AudioGenNode": AudioGenNode}
NODE_DISPLAY_NAME_MAPPINGS = {"AudioGenNode": "AudioGen (SFX)"}
PY

# ── DOWNLOAD WEIGHTS (Music + SFX) ──────────────────────────────────────────────
echo "➜ Downloading MusicGen + AudioGen weights…"
"$PYBIN" - <<'PY'
import os, shutil, glob
from huggingface_hub import snapshot_download

targets = [
    ("facebook/musicgen-small", os.environ.get("MUSIC_MODEL_DIR")),
    ("facebook/audiogen-medium", os.environ.get("SFX_MODEL_DIR")),
]
for repo_id, out_dir in targets:
    os.makedirs(out_dir, exist_ok=True)
    local = snapshot_download(repo_id=repo_id, allow_patterns=[
        "config.json", "preprocessor_config.json", "pytorch_model.bin",
        "tokenizer.json", "tokenizer_config.json", "generation_config.json",
        "model.safetensors", "*.json"
    ])
    for f in glob.glob(os.path.join(local, "*")):
        try: shutil.copy2(f, out_dir)
        except Exception: pass
    print("✓", repo_id, "→", out_dir)
PY

# ── WORKFLOW GENERATION (unchanged) ─────────────────────────────────────────────
# [same workflow JSON writing block as before]
