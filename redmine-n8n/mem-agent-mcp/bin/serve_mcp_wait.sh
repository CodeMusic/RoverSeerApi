#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# MCP HTTP server wrapper for LM Studio (macOS)
#
# QUICK EDIT: change the active model here, then restart (see below).
MEM_AGENT_MODEL="${MEM_AGENT_MODEL:-mem-agent-mlx}"
#
# RESTART (LaunchAgent):
#   REPO="$HOME/redmine-n8n/mem-agent-mcp"
#   PL="$HOME/Library/LaunchAgents/com.musai.memagent.wrapper.plist"
#   rm -f "$REPO/.locks/mcp.lock" 2>/dev/null || true
#   rmdir "$REPO/.mcp.lockdir"     2>/dev/null || true
#   launchctl bootout  gui/$(id -u) com.musai.memagent.wrapper 2>/dev/null || true
#   launchctl bootstrap gui/$(id -u) "$PL"
#   launchctl kickstart -k gui/$(id -u)/com.musai.memagent.wrapper
#
# TEST:
#   curl -s http://127.0.0.1:8081/mcp
#   curl -s -H 'Content-Type: application/json' \
#     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
#     http://127.0.0.1:8081/mcp
#   curl -s -H 'Content-Type: application/json' \
#     -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"use_memory_agent","arguments":{"question":"Reply \"ACK\" only. No memory ops."}}}' \
#     http://127.0.0.1:8081/mcp
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ---------- paths ----------
REPO="${REPO:-$HOME/redmine-n8n/mem-agent-mcp}"
UV_BIN="${UV_BIN:-$HOME/.local/bin/uv}"
LMS_BIN="${LMS_BIN:-/Users/christopherhicks/.cache/lm-studio/bin/lms}"

# --- single-instance guard (prefer flock; fallback mkdir) ---
LOCKROOT="$REPO/.locks"
mkdir -p "$LOCKROOT"
if command -v flock >/dev/null 2>&1; then
  LOCKFILE="$LOCKROOT/mcp.lock"
  exec 9>"$LOCKFILE" || true
  if ! /usr/bin/flock -n 9; then
    echo "[MCP] Another instance is running; exiting."
    exit 0
  fi
else
  LOCKDIR="$REPO/.mcp.lockdir"
  if [ -d "$LOCKDIR" ] && ! /usr/sbin/lsof -nP -iTCP:8081 -sTCP:LISTEN >/dev/null 2>&1; then
    rmdir "$LOCKDIR" 2>/dev/null || true
  fi
  if ! /bin/mkdir "$LOCKDIR" 2>/dev/null; then
    echo "[MCP] Another instance is running; exiting."
    exit 0
  fi
  trap 'rmdir "$LOCKDIR" 2>/dev/null || true' EXIT
fi

# ---------- config ----------
export LMSTUDIO_BASE_URL="${LMSTUDIO_BASE_URL:-http://127.0.0.1:8000}"

# Single source of truth for the model; also set common aliases
export MEM_AGENT_MODEL
export LMS_MODEL="$MEM_AGENT_MODEL"
export LMSTUDIO_MODEL="$MEM_AGENT_MODEL"
export OPENAI_MODEL="$MEM_AGENT_MODEL"
export MODEL="$MEM_AGENT_MODEL"
export DEFAULT_MODEL="$MEM_AGENT_MODEL"

# Memory path: use repo default and symlink it to SilverBullet externally.
# (This silences the warning and still writes to your SB folder via symlink)
export MEMORY_PATH="$REPO/memory/mcp-server"
unset MEMORY_DIR MEM_AGENT_MEMORY_DIR 2>/dev/null || true

# PATH (include uv + lms)
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.local/bin:/Users/christopherhicks/.cache/lm-studio/bin"

# ---------- sanity ----------
command -v jq >/dev/null 2>&1 || { echo "[MCP] ERROR: jq missing (brew install jq)"; exit 127; }
command -v uv >/dev/null 2>&1 || { echo "[MCP] ERROR: uv missing"; exit 127; }

# ensure memory folder exists (the symlink target is handled outside this script)
mkdir -p "$REPO/memory"
# Example (run once outside): ln -snf "$HOME/redmine-n8n/silverbullet/data/notes/MusaiMemory" "$REPO/memory/mcp-server"
mkdir -p "$MEMORY_PATH/entities"
[ -f "$MEMORY_PATH/user.md" ] || printf "# User Information\n\n## User Relationships\n" > "$MEMORY_PATH/user.md"

# ---------- helpers ----------
wait_for_api() {
  echo "[MCP] Waiting for LM Studio at $LMSTUDIO_BASE_URL ..."
  for _ in {1..60}; do
    if /usr/bin/curl -fsS --max-time 3 "$LMSTUDIO_BASE_URL/v1/models" >/dev/null 2>&1; then
      echo "[MCP] LM Studio is up."
      return 0
    fi
    /bin/sleep 2
  done
  echo "[MCP] ERROR: LM Studio API not reachable."
  return 1
}

have_model() {
  /usr/bin/curl -fsS "$LMSTUDIO_BASE_URL/v1/models" \
    | jq -e --arg m "$MEM_AGENT_MODEL" 'any(.data[].id; . == $m)' >/dev/null
}

ensure_single_model_loaded() {
  # JIT ping first (often loads the model)
  /usr/bin/curl -sS --max-time 8 \
    -H 'Content-Type: application/json' \
    -d "{\"model\":\"$MEM_AGENT_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_tokens\":1}" \
    "$LMSTUDIO_BASE_URL/v1/chat/completions" >/dev/null 2>&1 || true

  # If still not listed, try LMS CLI (idempotent)
  if ! have_model && [ -x "$LMS_BIN" ]; then
    echo "[MCP] Loading via LMS CLI: $MEM_AGENT_MODEL ..."
    "$LMS_BIN" load "$MEM_AGENT_MODEL" || true
  fi

  # Wait until the id appears
  for _ in {1..45}; do
    if have_model; then
      echo "[MCP] Model '$MEM_AGENT_MODEL' is ready."
      return 0
    fi
    /bin/sleep 2
  done
  echo "[MCP] WARNING: '$MEM_AGENT_MODEL' not listed; proceeding (JIT likely)."
}

preheat() {
  # Warm up compilation paths
  for t in 1 4 16; do
    /usr/bin/curl -sS --max-time 8 \
      -H 'Content-Type: application/json' \
      -d "{\"model\":\"$MEM_AGENT_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"warmup $t\"}],\"max_tokens\":$t}" \
      "$LMSTUDIO_BASE_URL/v1/chat/completions" >/dev/null 2>&1 || true
    /bin/sleep 0.5
  done
}

wait_port_free() {
  local port="${1:-8081}"
  for _ in {1..30}; do
    if ! /usr/sbin/lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
    echo "[MCP] Port $port busy; waiting..."
    /bin/sleep 1
  done
  echo "[MCP] ERROR: Port $port still in use; aborting."
  exit 48
}

# ---------- sequence ----------
wait_for_api
ensure_single_model_loaded
preheat
wait_port_free 8081

# keep-warm (run BEFORE exec so it survives via the parent shell)
(
  while :; do
    /usr/bin/curl -fsS -H 'Content-Type: application/json' \
      -d '{"model":"'"$MEM_AGENT_MODEL"'","messages":[{"role":"user","content":"ping"}],"max_tokens":1}' \
      "$LMSTUDIO_BASE_URL/v1/chat/completions" >/dev/null 2>&1 || true
    sleep "$((45 + RANDOM % 15))"
  done
) &

echo "🌐 Starting MCP-Compliant HTTP Server for ChatGPT..."
echo "🔗 MCP endpoint: http://localhost:8081/mcp"

cd "$REPO"
exec uv run python "$REPO/mcp_server/mcp_http_server.py" --host 0.0.0.0 --port 8081
