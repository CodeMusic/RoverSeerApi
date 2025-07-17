#!/bin/sh
echo "🧠 Bootstrapping SilverBullet AI config..."

mkdir -p /space

[ ! -f /space/PLUGS ] && cat <<EOF > /space/PLUGS
- ghr:justyns/silverbullet-ai/0.4.1
EOF

[ ! -f /space/SETTINGS ] && cat <<EOF > /space/SETTINGS
ai:
  textModels:
    - name: deepseek-r1
      provider: ollama
      modelName: deepseek-r1:8b
      baseUrl: http://host.docker.internal:11434/v1
      requireAuth: false
EOF

[ ! -f /space/SECRETS ] && cat <<EOF > /space/SECRETS
OLLAMA_BASE: "http://host.docker.internal:11434"
EOF

echo "✅ Config ready. Launching SilverBullet..."
export HOME=/space
exec deno run --unstable -A /silverbullet.js