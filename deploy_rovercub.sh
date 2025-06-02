#!/bin/bash

# Deploy RoverOS_vCub.py to RoverCub home directory

echo "🚀 Deploying RoverOS_vCub to RoverCub..."

# RoverCub connection details
ROVERCUB_HOST="rovercub.local"
ROVERCUB_USER="codemusic"
REMOTE_PATH="~/"

# Local file path - Default to main RoverOS_vCub.py
LOCAL_FILE="ProjectRoverCub/RoverOS_vCub.py"

# Check for flags
if [ "$1" == "--fixed" ]; then
    LOCAL_FILE="ProjectRoverCub/RoverOS_vCub_fixed.py"
    echo "📝 Using fixed version with extra debugging"
elif [ "$1" == "--personality" ]; then
    LOCAL_FILE="ProjectRoverCub/RoverOS_vCub_personality.py"
    echo "🎭 Using personality version (backup/experimental)"
fi

# Default behavior message
if [ -z "$1" ]; then
    echo "📦 Using main RoverOS_vCub.py (no personality support)"
    echo "   Use --personality flag for experimental personality version"
fi

# Check if file exists
if [ ! -f "$LOCAL_FILE" ]; then
    echo "❌ Error: $LOCAL_FILE not found!"
    exit 1
fi

# Copy file to RoverCub
echo "📤 Uploading $(basename $LOCAL_FILE) to $ROVERCUB_USER@$ROVERCUB_HOST:$REMOTE_PATH"
scp "$LOCAL_FILE" "$ROVERCUB_USER@$ROVERCUB_HOST:~/RoverOS_vCub.py"

if [ $? -eq 0 ]; then
    echo "✅ Successfully deployed RoverOS_vCub.py"
    
    # Run all commands in a single SSH session
    echo "🔧 Configuring and restarting service..."
    ssh -t "$ROVERCUB_USER@$ROVERCUB_HOST" << 'EOF'
        # Make file executable
        chmod +x ~/RoverOS_vCub.py
        echo "✅ Made file executable"
        
        # Restart the service
        echo "🔄 Restarting roveros.service..."
        sudo systemctl restart roveros.service
        
        # Wait for service to start
        sleep 2
        
        # Check service status
        echo ""
        echo "📊 Service status:"
        sudo systemctl status roveros.service --no-pager
        
        # Show recent logs
        echo ""
        echo "📜 Recent logs:"
        sudo journalctl -u roveros.service -n 30 --no-pager
        
        echo ""
        echo "✨ Service restarted successfully!"
EOF
    
    echo ""
    echo "📍 Deployed to: $ROVERCUB_USER@$ROVERCUB_HOST:~/RoverOS_vCub.py"
    echo ""
    echo "🔍 To watch live logs:"
    echo "  ssh $ROVERCUB_USER@$ROVERCUB_HOST"
    echo "  sudo journalctl -u roveros.service -f"
    echo ""
    echo "🧪 To test manually:"
    echo "  ssh $ROVERCUB_USER@$ROVERCUB_HOST"
    echo "  sudo systemctl stop roveros.service"
    echo "  python3 ~/RoverOS_vCub.py --text"
    echo ""
    if [ "$1" == "--personality" ]; then
        echo "🎭 Personality System Active:"
        echo "  Button A: Select Model"
        echo "  Button B: Record (10 seconds)"
        echo "  Button C: Select Personality"
    fi
else
    echo "❌ Deployment failed!"
    exit 1
fi 