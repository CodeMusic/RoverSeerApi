#!/bin/bash
# Deploy RoverSeer API to roverseer.local with Neural Voice Training System

# Parse command line arguments
DEPLOY_TEXTY=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -t|--texty) DEPLOY_TEXTY=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# SSH Configuration for passwordless deployment
SSH_KEY="$HOME/.ssh/roverseer_key"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
REMOTE_HOST="codemusic@roverseer.local"

echo "🚀 Deploying RoverSeer with Neural Voice Training to roverseer.local..."

# Upload custom drivers
echo "📦 Uploading custom drivers..."
scp $SSH_OPTS custom_drivers/rainbow_driver.py $REMOTE_HOST:~/custom_drivers/

# Upload main application - exclude macOS system files
echo "📦 Uploading roverseer_api_app..."
rsync -avz --delete \
  --exclude='config.json' \
  --exclude='logs/' \
  --exclude='.DS_Store' \
  --exclude='._*' \
  --exclude='.AppleDouble' \
  --exclude='.LSOverride' \
  --exclude='Thumbs.db' \
  -e "ssh $SSH_OPTS" roverseer_api_app/ $REMOTE_HOST:~/roverseer_api_app/

# Upload FastAPI requirements and core files
echo "⚡ Uploading FastAPI migration files..."
scp $SSH_OPTS requirements_fastapi.txt $REMOTE_HOST:~/
scp $SSH_OPTS fastapi_core.py $REMOTE_HOST:~/roverseer_api_app/

# Verify temporal_perspective.py was uploaded properly
echo "✅ Verifying temporal_perspective.py..."
ssh $SSH_OPTS $REMOTE_HOST "ls -la ~/roverseer_api_app/perception/temporal_perspective.py || echo '❌ temporal_perspective.py not found'"

# Upload voice training system - exclude macOS system files
echo "🎤 Uploading voice training system..."
ssh $SSH_OPTS $REMOTE_HOST "mkdir -p ~/texty"
rsync -avz \
  --exclude='.DS_Store' \
  --exclude='._*' \
  --exclude='.AppleDouble' \
  --exclude='.LSOverride' \
  --exclude='Thumbs.db' \
  -e "ssh $SSH_OPTS" texty/ $REMOTE_HOST:~/texty/

# Conditional textymcspeechy container deployment
if [ "$DEPLOY_TEXTY" = true ]; then
    echo "🐳 Uploading textymcspeechy container files..."
    ssh $SSH_OPTS $REMOTE_HOST "mkdir -p ~/docker-stacks/textymcspeechy"
    rsync -avz \
      --exclude='.DS_Store' \
      --exclude='._*' \
      -e "ssh $SSH_OPTS" \
      docker-stacks/textymcspeechy/docker-compose.yml \
      docker-stacks/textymcspeechy/Dockerfile \
      docker-stacks/textymcspeechy/requirements.txt \
      docker-stacks/textymcspeechy/train.py \
      $REMOTE_HOST:~/docker-stacks/textymcspeechy/

    # Build and restart the textymcspeechy container
    echo "🏗️ Building and restarting textymcspeechy container..."
    ssh $SSH_OPTS $REMOTE_HOST "cd ~/docker-stacks/textymcspeechy && docker build -t textymcspeechy-ml . && docker-compose up -d textymcspeechy"
fi

# Create voice training directories if they don't exist
echo "📁 Setting up voice training directories..."
ssh $SSH_OPTS $REMOTE_HOST "mkdir -p ~/texty/voice_data ~/texty/output_onnx"

# Set permissions
echo "🔧 Setting permissions..."
ssh $SSH_OPTS $REMOTE_HOST "chmod +x ~/custom_drivers/rainbow_driver.py"
ssh $SSH_OPTS $REMOTE_HOST "chmod +x ~/texty/train.py"

# Install FastAPI dependencies
echo "⚡ Installing FastAPI dependencies..."
ssh $SSH_OPTS $REMOTE_HOST "pip install -r ~/requirements_fastapi.txt"

# Clean up any existing training locks/PIDs and macOS files
echo "🧹 Cleaning up previous training sessions and system files..."
ssh $SSH_OPTS $REMOTE_HOST "rm -f /tmp/training.lock /tmp/training.pid /tmp/training.log"
ssh $SSH_OPTS $REMOTE_HOST "find ~/roverseer_api_app ~/texty -name '.DS_Store' -delete 2>/dev/null || true"
ssh $SSH_OPTS $REMOTE_HOST "find ~/roverseer_api_app ~/texty -name '._*' -delete 2>/dev/null || true"

# Restart the service
echo "🔄 Restarting roverseer service..."
ssh $SSH_OPTS $REMOTE_HOST "sudo systemctl restart roverseer"
sleep 5

# Check service status
echo "✅ Checking service status..."
ssh $SSH_OPTS $REMOTE_HOST "sudo systemctl status roverseer --no-pager -l"

# Test if service is actually responding
echo "🎯 Testing FastAPI service endpoints..."
ssh $SSH_OPTS $REMOTE_HOST "curl -s http://localhost:5000/ > /dev/null && echo '✅ Main interface responding' || echo '❌ Main interface not responding'"
ssh $SSH_OPTS $REMOTE_HOST "curl -s http://localhost:5000/status_only > /dev/null && echo '✅ Status API responding' || echo '❌ Status API not responding'"
ssh $SSH_OPTS $REMOTE_HOST "curl -s http://localhost:5000/api/docs > /dev/null && echo '✅ FastAPI docs responding' || echo '❌ FastAPI docs not responding'"
ssh $SSH_OPTS $REMOTE_HOST "curl -s http://localhost:5000/voices > /dev/null && echo '✅ Voice endpoints responding' || echo '❌ Voice endpoints not responding'"

echo "🎉 Deployment complete!" 