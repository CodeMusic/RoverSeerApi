#!/bin/zsh
# ------------------------------------------------------------------------------
# ComfyUI Launcher (LaunchAgent-friendly)
# - Uses absolute paths
# - Activates venv
# - Installs custom-node deps (LLMs + Safety) on first run
# - Sets model/cache paths
# - Prints helpful diagnostics
# - Streams logs to comfyui.log (plus LaunchAgent stdout/err)
# ------------------------------------------------------------------------------
set -euo pipefail

# ── Paths ──────────────────────────────────────────────────────────────────────
APP_ROOT="/Users/christopherhicks/redmine-n8n/comfyui/src"
VENV="$APP_ROOT/.venv"
PYBIN="$VENV/bin/python"
PIP="$VENV/bin/pip"
LOG="$APP_ROOT/comfyui.log"

CUSTOM_NODES="$APP_ROOT/custom_nodes"
LLMS_DIR="$CUSTOM_NODES/ComfyUI-LLMs"
SAFETY_DIR="$CUSTOM_NODES/ComfyUI-YetAnotherSafetyChecker"

# Optional: point to your llama.cpp SRPO endpoint (if you use it)
# Change/disable as you like; script only warns if missing.
SRPO_URL="http://127.0.0.1:11435/v1/models"

# ── Sanity: venv must exist ────────────────────────────────────────────────────
if [[ ! -x "$PYBIN" ]]; then
  echo "✖ Missing venv at: $VENV" | tee -a "$LOG"
  echo "  Fix: cd \"$APP_ROOT\" && python3 -m venv .venv && . .venv/bin/activate && pip install -U pip" | tee -a "$LOG"
  exit 1
fi

cd "$APP_ROOT"

# ── Environment for Apple Silicon & stability ──────────────────────────────────
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0
export TOKENIZERS_PARALLELISM=false
export PYTHONNOUSERSITE=1

# Quiet bundled API nodes if not needed
export COMFYUI_SKIP_API_NODES=1

# ── ComfyUI search paths ───────────────────────────────────────────────────────
export COMFYUI_CUSTOM_NODE_PATHS="$CUSTOM_NODES"
export COMFYUI_MODEL_PATHS="/Users/christopherhicks/redmine-n8n/ai-model-cache/comfyui-models"

# Centralize Hugging Face cache
export HF_HOME="/Users/christopherhicks/redmine-n8n/ai-model-cache/huggingface"
export HUGGINGFACE_HUB_CACHE="$HF_HOME"

# Optional: raise open file limit
ulimit -n 8192 2>/dev/null || true

# ── Activate venv ──────────────────────────────────────────────────────────────
source "$VENV/bin/activate"

# ── Ensure base deps (idempotent) ──────────────────────────────────────────────
# Pin a few troublemakers to avoid Apple Silicon breakage
"$PIP" install -U "pip<25.3" wheel setuptools >/dev/null 2>&1 || true

# ── Ensure custom-node deps (LLMs + Safety) ────────────────────────────────────
if [[ -d "$LLMS_DIR" ]]; then
  if ! "$PYBIN" - <<'PY' >/dev/null 2>&1
import importlib.util
ok = True
for m in ("openai", "httpx"):
    if importlib.util.find_spec(m) is None:
        ok = False
        break
raise SystemExit(0 if ok else 1)
PY
  then
    echo "➜ Installing ComfyUI-LLMs deps…" | tee -a "$LOG"
    "$PIP" install -r "$LLMS_DIR/requirements.txt" || true
  fi
else
  echo "⚠ ComfyUI-LLMs not found at: $LLMS_DIR" | tee -a "$LOG"
fi

if [[ -d "$SAFETY_DIR" ]]; then
  if ! "$PYBIN" - <<'PY' >/dev/null 2>&1
import importlib.util
ok = True
for m in ("onnxruntime",):
    if importlib.util.find_spec(m) is None:
        ok = False
        break
raise SystemExit(0 if ok else 1)
PY
  then
    echo "➜ Installing YetAnotherSafetyChecker deps…" | tee -a "$LOG"
    "$PIP" install -r "$SAFETY_DIR/requirements.txt" || true
  fi
else
  echo "⚠ YetAnotherSafetyChecker not found at: $SAFETY_DIR" | tee -a "$LOG"
fi

# ── Diagnostics ────────────────────────────────────────────────────────────────
echo "──────────────────────────────────────────────────────────────────────────────" | tee -a "$LOG"
echo "ComfyUI starting @ $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG"
echo "App root      : $APP_ROOT" | tee -a "$LOG"
echo "Venv          : $VENV" | tee -a "$LOG"
echo "Custom nodes  : $COMFYUI_CUSTOM_NODE_PATHS" | tee -a "$LOG"
echo "Model paths   : $COMFYUI_MODEL_PATHS" | tee -a "$LOG"
echo "HF cache      : $HF_HOME" | tee -a "$LOG"

# Optional: validate LLMs config if tool exists
if [[ -f "$LLMS_DIR/validate_config.py" ]]; then
  echo "➜ Validating ComfyUI-LLMs settings.yaml…" | tee -a "$LOG"
  "$PYBIN" "$LLMS_DIR/validate_config.py" --info || true
fi

# Warn if SRPO llama.cpp backend isn’t up (harmless if you use LM Studio/OpenRouter)
if command -v curl >/dev/null 2>&1; then
  if ! curl -sSf "$SRPO_URL" >/dev/null 2>&1; then
    echo "⚠ SRPO backend not detected at ${SRPO_URL%/v1/models} — LLMs Chat (SRPO) may fail unless using LM Studio/OpenRouter." | tee -a "$LOG"
  else
    echo "✅ SRPO backend detected: ${SRPO_URL%/v1/models}" | tee -a "$LOG"
  fi
fi

echo "──────────────────────────────────────────────────────────────────────────────" | tee -a "$LOG"

# ── Launch ComfyUI ─────────────────────────────────────────────────────────────
# Use tee so logs go to comfyui.log AND LaunchAgent stdout/err files
exec "$PYBIN" main.py --listen 0.0.0.0 --port 8008 2>&1 | tee -a "$LOG"