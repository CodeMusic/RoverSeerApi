#!/usr/bin/env bash
set -euo pipefail

cd "$HOME/redmine-n8n/mem-agent-mcp"

if command -v uv >/dev/null 2>&1; then
  eval "$(uv venv --prompt mem-agent-mcp --seed --python 3.11 -q || true)"
else
  source .venv/bin/activate
fi

export MEMORY_DIR="$HOME/redmine-n8n/data/notes/MusaiMemory"
make serve-mcp-http
