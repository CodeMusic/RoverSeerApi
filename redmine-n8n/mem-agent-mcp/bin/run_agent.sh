#!/usr/bin/env bash
set -euo pipefail

cd "$HOME/redmine-n8n/mem-agent-mcp"

# Use uv if you installed it, otherwise fall back to venv.
if command -v uv >/dev/null 2>&1; then
  eval "$(uv venv --prompt mem-agent-mcp --seed --python 3.11 -q || true)"
  # If you prefer the repo’s venv, comment the line above and uncomment the next two:
  # python3 -m venv .venv
  # source .venv/bin/activate
else
  # classic venv
  if [ ! -d ".venv" ]; then python3 -m venv .venv; fi
  source .venv/bin/activate
  pip install -U pip >/dev/null 2>&1 || true
  pip install -e . >/dev/null 2>&1 || true
fi

export MEMORY_DIR="$HOME/redmine-n8n/data/notes/MusaiMemory"
mkdir -p "$MEMORY_DIR/entities"
[ -f "$MEMORY_DIR/user.md" ] || printf "# User Information\n\n## User Relationships\n" > "$MEMORY_DIR/user.md"

# Start MLX model via Makefile; choose default precision via env if supported
# Otherwise the Makefile will prompt on first boot; after first run it won't re-download.
make run-agent
