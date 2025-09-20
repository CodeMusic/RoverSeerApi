#!/usr/bin/env bash
set -euo pipefail

# One-time install of uv if not already installed
if ! command -v uv >/dev/null 2>&1; then
  echo "Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  if ! grep -q ".local/bin" ~/.zshrc; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
    echo "Added uv to PATH in ~/.zshrc"
  fi
  source ~/.zshrc
fi

# Navigate to repo root
cd ~/redmine-n8n/mem-agent-mcp

# Point mem-agent to MusaiMemory inside SilverBullet space
export MEMORY_DIR="$HOME/redmine-n8n/data/notes/MusaiMemory"
mkdir -p "$MEMORY_DIR/entities"
[ -f "$MEMORY_DIR/user.md" ] || printf "# User Information\n\n## User Relationships\n" > "$MEMORY_DIR/user.md"

# Verify uv is installed (optional)
make check-uv || true

echo "✅ MEMORY_DIR set to $MEMORY_DIR"
echo "🚀 Launching mem-agent..."
echo "➡️  Open a second terminal and run: make serve-mcp-http"

# Run the MLX agent (4-bit recommended)
make run-agent
