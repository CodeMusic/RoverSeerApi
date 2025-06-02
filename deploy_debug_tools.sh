#!/bin/bash

# Deploy debug tools to RoverCub

echo "🔧 Deploying debug tools to RoverCub..."

ROVERCUB_HOST="rovercub.local"
ROVERCUB_USER="codemusic"

# Copy test script
echo "📤 Uploading button test script..."
scp test_rovercub_buttons.py "$ROVERCUB_USER@$ROVERCUB_HOST:~/"
ssh "$ROVERCUB_USER@$ROVERCUB_HOST" "chmod +x ~/test_rovercub_buttons.py"

echo "✅ Debug tools deployed!"
echo ""
echo "To test buttons:"
echo "  ssh $ROVERCUB_USER@$ROVERCUB_HOST"
echo "  sudo systemctl stop roveros.service"
echo "  python3 ~/test_rovercub_buttons.py"
echo ""
echo "To check logs:"
echo "  sudo journalctl -u roveros.service -f" 