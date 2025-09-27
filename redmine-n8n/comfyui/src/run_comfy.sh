#!/bin/zsh
# ------------------------------------------------------------------------------
# ComfyUI Launcher + LivePortrait (Apple Silicon / MPS)
# - Installs core custom nodes (LivePortraitKJ, KJNodes, VHS, Manager)
# - Sets up model paths & SAFE symlinks (no loops) + app-local shims
# - Heals PyTorch (RMSNorm), Mediapipe (protobuf<5), NumPy/OpenCV (numpy<2 + contrib)
# - Optional ComfyUI-audio extras (audiocraft==1.3.0, no xformers)
# - Ensures ffmpeg is available to LaunchAgent
# - Adds /usr/sbin to PATH so matplotlib can find `system_profiler`
# ------------------------------------------------------------------------------

set -euo pipefail

# ── Roots ──────────────────────────────────────────────────────────────────────
APP_ROOT="/Users/christopherhicks/redmine-n8n/comfyui/src"
LOG_COMFY="$APP_ROOT/comfyui.log"

# Comfy venv
VENV="$APP_ROOT/.venv"
PYBIN="$VENV/bin/python"
PIP="$VENV/bin/pip"

# Custom nodes
CUSTOM_NODES="$APP_ROOT/custom_nodes"
LP_NODE_DIR="$CUSTOM_NODES/ComfyUI-LivePortraitKJ"
KJ_NODES_DIR="$CUSTOM_NODES/ComfyUI-KJNodes"
VHS_DIR="$CUSTOM_NODES/ComfyUI-VideoHelperSuite"
MANAGER_DIR="$CUSTOM_NODES/ComfyUI-Manager"
AUDIO_NODE_DIR="$CUSTOM_NODES/ComfyUI-audio"

# Model caches
COMFY_MODELS="/Users/christopherhicks/redmine-n8n/ai-model-cache/comfyui-models"
HF_CACHE="/Users/christopherhicks/redmine-n8n/ai-model-cache/huggingface"
SHARED_PRETRAIN="$COMFY_MODELS/pretrained_weights"   # liveportrait/, insightface/, liveportrait_animals/

# Optional SRPO llama.cpp endpoint (for LLM custom nodes)
SRPO_URL="http://127.0.0.1:11435/v1/models"

# ── Apple Silicon env ─────────────────────────────────────────────────────────
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0
export TOKENIZERS_PARALLELISM=false
export PYTHONNOUSERSITE=1
export COMFYUI_SKIP_API_NODES=1

# PATH (include /usr/sbin so matplotlib->system_profiler works under LaunchAgent)
export PATH="/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export IMAGEIO_FFMPEG_EXE="$(command -v ffmpeg || echo /opt/homebrew/bin/ffmpeg)"

# Comfy search paths
export COMFYUI_CUSTOM_NODE_PATHS="$CUSTOM_NODES"
export COMFYUI_MODEL_PATHS="$COMFY_MODELS"
export HF_HOME="$HF_CACHE"
export HUGGINGFACE_HUB_CACHE="$HF_CACHE"

# ── Helpers ───────────────────────────────────────────────────────────────────
need_ffmpeg() {
  if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "⚠ ffmpeg not found. Install with: brew install ffmpeg" | tee -a "$LOG_COMFY"
  fi
}
ensure_dir() { [[ -d "$1" ]] || mkdir -p "$1"; }

# Safer symlink creation: recreates if wrong/loop; never chains app shim via cache
ensure_symlink() {
  local src="$1"; local dst="$2"
  # if src not present, nothing to do
  [[ -e "$src" ]] || { echo "⚠ source missing for link: $src" | tee -a "$LOG_COMFY"; return 0; }
  # if dst is a symlink, check real target; replace if mismatch or broken
  if [[ -L "$dst" ]]; then
    local real_dst real_src
    real_dst="$(python3 - <<PY
import os,sys
p=sys.argv[1]
try: print(os.path.realpath(p))
except Exception: print("")
PY
"$dst")"
    real_src="$(python3 - <<PY
import os,sys
p=sys.argv[1]
print(os.path.realpath(p))
PY
"$src")"
    if [[ -z "$real_dst" || "$real_dst" != "$real_src" ]]; then
      rm -f "$dst"
      mkdir -p "$(dirname "$dst")"
      ln -s "$src" "$dst"
    fi
  elif [[ -e "$dst" ]]; then
    echo "⚠ $dst exists and is not a symlink; leaving as-is" | tee -a "$LOG_COMFY"
  else
    mkdir -p "$(dirname "$dst")"
    ln -s "$src" "$dst"
  fi
}

py_has() {  # usage: py_has module_name
  "$PYBIN" - "$1" >/dev/null 2>&1 <<'PY'
import importlib, sys
mod = sys.argv[1]
sys.exit(0 if importlib.util.find_spec(mod) else 1)
PY
}

# ── Pre-flight: ensure venv ───────────────────────────────────────────────────
if [[ ! -x "$PYBIN" ]]; then
  echo "✖ Missing venv at: $VENV" | tee -a "$LOG_COMFY"
  echo "  Fix: cd \"$APP_ROOT\" && python3 -m venv .venv && . .venv/bin/activate && pip install -U pip" | tee -a "$LOG_COMFY"
  exit 1
fi

# ── Start ─────────────────────────────────────────────────────────────────────
cd "$APP_ROOT"
touch "$LOG_COMFY"
need_ffmpeg
ensure_dir "$CUSTOM_NODES"

# Remove stray/broken LivePortrait folder if created by mistake
[[ -d "$CUSTOM_NODES/LivePortrait" ]] && rm -rf "$CUSTOM_NODES/LivePortrait"

# Raise file limit (best-effort)
ulimit -n 8192 2>/dev/null || true

# Activate venv & stabilize pip set
source "$VENV/bin/activate"
"$PIP" install -U "pip<25.3" wheel setuptools >/dev/null 2>&1 || true

# --- Self-heal: ensure torch has nn.RMSNorm (non-fatal probe) -----------------
"$PYBIN" - <<'PY' >/dev/null 2>&1
import torch, sys
sys.exit(0 if hasattr(torch.nn, "RMSNorm") else 1)
PY
if [[ $? -ne 0 ]]; then
  echo "➜ Upgrading PyTorch (arm64) to 2.8.0/0.23.0/2.8.0…" | tee -a "$LOG_COMFY"
  "$PIP" install -U --no-cache-dir torch==2.8.0 torchvision==0.23.0 torchaudio==2.8.0 2>&1 | tee -a "$LOG_COMFY" || true
fi
"$PYBIN" - <<'PY' || true
import torch
print(f"[heal] torch: {torch.__version__}, RMSNorm:", hasattr(torch.nn,"RMSNorm"))
PY

# --- Ensure required node repos (LivePortrait + KJ util packs) ----------------
if [[ ! -d "$LP_NODE_DIR" ]]; then
  echo "➜ Installing LivePortraitKJ nodes…" | tee -a "$LOG_COMFY"
  git -C "$CUSTOM_NODES" clone --depth=1 https://github.com/kijai/ComfyUI-LivePortraitKJ || echo "✖ clone LivePortraitKJ failed" | tee -a "$LOG_COMFY"
fi
if [[ ! -d "$KJ_NODES_DIR" ]]; then
  echo "➜ Installing KJNodes…" | tee -a "$LOG_COMFY"
  git -C "$CUSTOM_NODES" clone --depth=1 https://github.com/kijai/ComfyUI-KJNodes || echo "✖ clone KJNodes failed" | tee -a "$LOG_COMFY"
fi
if [[ ! -d "$VHS_DIR" ]]; then
  echo "➜ Installing VideoHelperSuite…" | tee -a "$LOG_COMFY"
  git -C "$CUSTOM_NODES" clone --depth=1 https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite || echo "✖ clone VHS failed" | tee -a "$LOG_COMFY"
fi
if [[ ! -d "$MANAGER_DIR" ]]; then
  echo "➜ Installing ComfyUI-Manager…" | tee -a "$LOG_COMFY"
  git -C "$CUSTOM_NODES" clone --depth=1 https://github.com/ltdrdata/ComfyUI-Manager || echo "✖ clone Manager failed" | tee -a "$LOG_COMFY"
fi

# --- Guard: keep numpy < 2 to appease scipy/numba/mediapipe -------------------
"$PYBIN" - <<'PY' >/dev/null 2>&1 || "$PIP" install -U "numpy>=1.26.4,<2" >/dev/null 2>&1 || true
import numpy as np, sys
from packaging import version
sys.exit(0 if version.parse(np.__version__) < version.parse("2.0.0") else 1)
PY

# --- Optional: enable ComfyUI-audio extras (quiet the warnings) ---------------
if [[ -d "$AUDIO_NODE_DIR" ]]; then
  echo "➜ ComfyUI-audio found, installing extras…" | tee -a "$LOG_COMFY"
  py_has audiocraft || "$PIP" install --no-cache-dir "audiocraft==1.3.0" soundfile einops >/dev/null 2>&1 || true
  py_has langid     || "$PIP" install --no-cache-dir langid                                   >/dev/null 2>&1 || true
  py_has denoiser   || "$PIP" install --no-cache-dir denoiser                                 >/dev/null 2>&1 || true
  # Tortoise-TTS is heavy; enable only if needed:
  # py_has tortoise || "$PIP" install --no-cache-dir "git+https://github.com/neonbjb/tortoise-tts.git" >/dev/null 2>&1 || true
fi

# --- Node-specific deps (install only if missing) -----------------------------
py_has mss || "$PIP" install mss >/dev/null 2>&1 || true
py_has imageio_ffmpeg || "$PIP" install "imageio[ffmpeg]" imageio-ffmpeg >/dev/null 2>&1 || true
py_has moviepy || "$PIP" install moviepy >/dev/null 2>&1 || true
py_has mediapipe || "$PIP" install mediapipe >/dev/null 2>&1 || true

# --- Mediapipe compatibility: keep protobuf < 5 (non-fatal) -------------------
"$PYBIN" - <<'PY' || true
import importlib, subprocess, sys
def sh(*a): subprocess.run(a, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if importlib.util.find_spec("mediapipe"):
    try:
        import google.protobuf as gp
        from packaging import version
        if version.parse(gp.__version__) >= version.parse("5.0.0"):
            sh(sys.executable, "-m", "pip", "install", "-U", "protobuf>=4.25.3,<5")
            sh(sys.executable, "-m", "pip", "uninstall", "-y", "grpcio-status", "googleapis-common-protos")
            print("[heal] protobuf downgraded for mediapipe")
        else:
            print("[heal] protobuf OK for mediapipe:", gp.__version__)
    except Exception as e:
        print("[heal] protobuf/mediapipe probe failed:", e)
PY

# --- NumPy/OpenCV ABI heal: numpy<2 + contrib cv2 (non-fatal) -----------------
"$PYBIN" - <<'PY' || true
import subprocess, sys
def sh(*a): subprocess.run(a, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
# keep numpy compatible with mediapipe/scipy/numba
sh(sys.executable, "-m", "pip", "install", "-U", "--force-reinstall", "numpy>=1.26.4,<2")
# remove packages that demand other OpenCV flavors (optional tidy)
for pkg in ("rembg", "albucore", "albumentations", "pixeloe"):
    sh(sys.executable, "-m", "pip", "uninstall", "-y", pkg)
# ensure contrib cv2 without pulling deps (prevents numpy bump)
sh(sys.executable, "-m", "pip", "install", "-U", "--no-deps", "--force-reinstall", "--no-cache-dir", "opencv-contrib-python==4.10.0.84")
try:
    import numpy as np, cv2
    print("[heal] numpy:", np.__version__, "| cv2 ok:", hasattr(cv2, "findHomography"))
except Exception as e:
    print("[heal] cv2/numpy probe failed:", e)
PY

# --- Model links (SAFE; no circular symlinks) ---------------------------------
# Global cache links (ok to expose in COMFY_MODEL_PATHS)
ensure_symlink "$SHARED_PRETRAIN/liveportrait"         "$COMFY_MODELS/LivePortrait"
ensure_symlink "$SHARED_PRETRAIN/insightface"          "$COMFY_MODELS/insightface"
ensure_symlink "$SHARED_PRETRAIN/liveportrait_animals" "$COMFY_MODELS/liveportrait_animals"

# App-local shims: point DIRECTLY to pretrained_weights (avoid chaining)
ensure_dir "$APP_ROOT/models"
ensure_symlink "$SHARED_PRETRAIN/liveportrait"         "$APP_ROOT/models/liveportrait"
ensure_symlink "$SHARED_PRETRAIN/insightface"          "$APP_ROOT/models/insightface"
ensure_symlink "$SHARED_PRETRAIN/liveportrait_animals" "$APP_ROOT/models/liveportrait_animals"

# KJNodes sometimes expects this folder to exist (prevents KeyError: 'unet_gguf')
ensure_dir "$COMFY_MODELS/unet_gguf"

# Quick sanity check for LP landmarks
if [[ -f "$APP_ROOT/models/liveportrait/landmark.onnx" ]]; then
  echo "[models] landmark present via app shim ✅" | tee -a "$LOG_COMFY"
else
  echo "⚠ landmark.onnx missing under $APP_ROOT/models/liveportrait" | tee -a "$LOG_COMFY"
fi

# ── Diagnostics ───────────────────────────────────────────────────────────────
echo "──────────────────────────────────────────────────────────────────────────────" | tee -a "$LOG_COMFY"
echo "ComfyUI starting @ $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_COMFY"
echo "App root      : $APP_ROOT" | tee -a "$LOG_COMFY"
echo "Venv          : $VENV" | tee -a "$LOG_COMFY"
echo "Custom nodes  : $COMFYUI_CUSTOM_NODE_PATHS" | tee -a "$LOG_COMFY"
echo "Model paths   : $COMFYUI_MODEL_PATHS" | tee -a "$LOG_COMFY"
echo "HF cache      : $HF_CACHE" | tee -a "$LOG_COMFY"

"$PYBIN" - <<'PY' | tee -a "$LOG_COMFY"
try:
    import torch
    print("torch version:", torch.__version__, "RMSNorm:", hasattr(torch.nn,"RMSNorm"))
except Exception as e:
    print("[heal] torch probe failed:", e)
PY

"$PYBIN" - <<'PY' | tee -a "$LOG_COMFY"
try:
    import imageio_ffmpeg, shutil
    print("[heal] imageio_ffmpeg exe:", imageio_ffmpeg.get_ffmpeg_exe())
    print("[heal] which ffmpeg:", shutil.which("ffmpeg"))
except Exception as e:
    print("[heal] imageio_ffmpeg probe failed:", e)
PY

"$PYBIN" - <<'PY' | tee -a "$LOG_COMFY"
try:
    import numpy as np, cv2
    print("[heal] numpy:", np.__version__)
    print("[heal] cv2 ok:", hasattr(cv2, "findHomography"))
except Exception as e:
    print("[heal] cv2/numpy probe failed:", e)
PY

"$PYBIN" - <<'PY' | tee -a "$LOG_COMFY"
import importlib.util
present = (importlib.util.find_spec("nio") is not None) or (importlib.util.find_spec("matrix_nio") is not None) or (importlib.util.find_spec("matrix-nio") is not None)
print("[heal] matrix-nio present:", present)
PY

[[ -d "$LP_NODE_DIR" ]] && echo "LivePortraitKJ : $LP_NODE_DIR" | tee -a "$LOG_COMFY"
[[ -d "$KJ_NODES_DIR" ]] && echo "KJNodes        : $KJ_NODES_DIR" | tee -a "$LOG_COMFY"
[[ -d "$VHS_DIR" ]] && echo "VHS            : $VHS_DIR" | tee -a "$LOG_COMFY"
[[ -d "$MANAGER_DIR" ]] && echo "Manager        : $MANAGER_DIR" | tee -a "$LOG_COMFY"
[[ -L "$COMFY_MODELS/LivePortrait" ]] && echo "Cache LP link  : $COMFY_MODELS/LivePortrait -> $(readlink "$COMFY_MODELS/LivePortrait")" | tee -a "$LOG_COMFY"
[[ -L "$APP_ROOT/models/liveportrait" ]] && echo "App LP shim    : $APP_ROOT/models/liveportrait -> $(readlink "$APP_ROOT/models/liveportrait")" | tee -a "$LOG_COMFY"

# Optional SRPO check
if command -v curl >/dev/null 2>&1; then
  if ! curl -sSf "$SRPO_URL" >/dev/null 2>&1; then
    echo "⚠ SRPO backend not detected at ${SRPO_URL%/v1/models} — LLMs Chat (SRPO) may fail unless using LM Studio/OpenRouter." | tee -a "$LOG_COMFY"
  else
    echo "✅ SRPO backend detected: ${SRPO_URL%/v1/models}" | tee -a "$LOG_COMFY"
  fi
fi

echo "──────────────────────────────────────────────────────────────────────────────" | tee -a "$LOG_COMFY"

# ── Launch ComfyUI ────────────────────────────────────────────────────────────
export PYTHONUNBUFFERED=1
echo "──────────────────────────────────────────────────────────────────────────────" >>"$LOG_COMFY"
echo "[launcher] about to start main.py @ $(date)" >>"$LOG_COMFY"
echo "[launcher] cwd: $(pwd) | py: $PYBIN | listen: 0.0.0.0:8008" >>"$LOG_COMFY"

# listen on all interfaces (Manager expects 0.0.0.0)
"$PYBIN" -u main.py --listen 0.0.0.0 --port 8008 --use-split-cross-attention >>"$LOG_COMFY" 2>&1
status=$?
echo "[launcher] main.py exited with code $status @ $(date)" >>"$LOG_COMFY"
exit $status