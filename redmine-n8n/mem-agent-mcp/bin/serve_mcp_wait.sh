#!/usr/bin/env bash
set -euo pipefail

UV_BIN="$HOME/.local/bin/uv"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.local/bin"
export LMSTUDIO_BASE_URL="http://127.0.0.1:8000"
export MEMORY_DIR="$HOME/redmine-n8n/data/notes/MusaiMemory"
export MEMORY_PATH="$MEMORY_DIR"
export MEM_AGENT_MEMORY_DIR="$MEMORY_DIR"

cd "$HOME/redmine-n8n/mem-agent-mcp"
mkdir -p "$MEMORY_DIR/entities"
[ -f "$MEMORY_DIR/user.md" ] || printf "# User Information\n\n## User Relationships\n" > "$MEMORY_DIR/user.md"

for i in {1..60}; do
  if /usr/bin/curl -fsS "$LMSTUDIO_BASE_URL/v1/models" >/dev/null 2>&1; then break; fi
  /bin/sleep 2
done
/usr/bin/curl -fsS "$LMSTUDIO_BASE_URL/v1/models" >/dev/null

exec "$UV_BIN" run python mcp_server/mcp_http_server.py --host 0.0.0.0 --port 8081
