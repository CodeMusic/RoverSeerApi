#!/bin/bash
# Deploy RoverSeer API to roverseer.local

echo "🚀 Deploying to roverseer.local..."

# Upload custom drivers
echo "📦 Uploading custom drivers..."
scp custom_drivers/rainbow_driver.py codemusic@roverseer.local:~/custom_drivers/

# Upload main application
echo "📦 Uploading roverseer_api_app..."
rsync -avz --delete roverseer_api_app/ codemusic@roverseer.local:~/roverseer_api_app/

# Set permissions on the driver
echo "🔧 Setting permissions..."
ssh codemusic@roverseer.local "chmod +x ~/custom_drivers/rainbow_driver.py"

# Restart the service
echo "🔄 Restarting roverseer-api service..."
ssh codemusic@roverseer.local "sudo systemctl restart roverseer"
sleep 10
# Check status
echo "✅ Checking service status..."
ssh codemusic@roverseer.local "sudo systemctl status roverseer | head -20"

echo "🎉 Deployment complete!" 