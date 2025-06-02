#!/bin/bash
# Setup script for RoverCub on Raspberry Pi Zero

echo "🚀 RoverCub Pi Zero Setup Script"
echo "================================"

# Function to check if running on Pi
check_pi() {
    if grep -q "Raspberry Pi" /proc/cpuinfo; then
        echo "✓ Running on Raspberry Pi"
    else
        echo "✗ This script should be run on a Raspberry Pi"
        exit 1
    fi
}

# Function to enable interfaces
enable_interfaces() {
    echo -e "\n📡 Enabling required interfaces..."
    
    # Check I2C
    if lsmod | grep -q i2c_bcm2835; then
        echo "✓ I2C is already enabled"
    else
        echo "Enabling I2C..."
        sudo raspi-config nonint do_i2c 0
    fi
    
    # Check SPI
    if lsmod | grep -q spi_bcm2835; then
        echo "✓ SPI is already enabled"
    else
        echo "Enabling SPI..."
        sudo raspi-config nonint do_spi 0
    fi
}

# Function to install dependencies
install_deps() {
    echo -e "\n📦 Installing system dependencies..."
    sudo apt-get update
    sudo apt-get install -y \
        python3-pip \
        python3-dev \
        python3-gpiozero \
        python3-numpy \
        i2c-tools \
        mpg123 \
        alsa-utils \
        git
}

# Function to install Python packages
install_python_packages() {
    echo -e "\n🐍 Installing Python packages..."
    
    # Create requirements file
    cat > /tmp/rovercub_requirements.txt << EOF
gpiozero
fourletterphat
adafruit-circuitpython-bmp280
evdev
numpy
requests
EOF
    
    pip3 install -r /tmp/rovercub_requirements.txt
    
    # Install APA102 library if not present
    if [ ! -d "$HOME/APA102_Pi" ]; then
        echo "Installing APA102 library..."
        cd $HOME
        git clone https://github.com/tinue/apa102-pi.git APA102_Pi
        cd APA102_Pi
        pip3 install -e .
    fi
}

# Function to set up custom drivers
setup_custom_drivers() {
    echo -e "\n📁 Setting up custom drivers..."
    
    # Create custom_drivers directory if it doesn't exist
    if [ ! -d "$HOME/custom_drivers" ]; then
        mkdir -p "$HOME/custom_drivers"
        echo "Created ~/custom_drivers directory"
    fi
    
    # Check if rainbow_driver.py exists
    if [ -f "$HOME/custom_drivers/rainbow_driver.py" ]; then
        echo "✓ rainbow_driver.py found in ~/custom_drivers"
    else
        echo "⚠ rainbow_driver.py not found in ~/custom_drivers"
        echo "Please copy it from your project:"
        echo "  scp /path/to/custom_drivers/rainbow_driver.py $USER@$(hostname).local:~/custom_drivers/"
    fi
}

# Function to set up audio
setup_audio() {
    echo -e "\n🔊 Setting up audio..."
    
    # Add user to audio group
    sudo usermod -a -G audio $USER
    
    # Set default audio device
    if [ -f "/proc/asound/cards" ]; then
        echo "Audio devices found:"
        cat /proc/asound/cards
    fi
}

# Function to test Rainbow HAT
test_rainbow_hat() {
    echo -e "\n🌈 Testing Rainbow HAT..."
    
    # Simple LED test
    python3 -c "
try:
    from gpiozero import PWMLED
    led = PWMLED(6)
    led.on()
    import time
    time.sleep(0.5)
    led.off()
    led.close()
    print('✓ LED test successful')
except Exception as e:
    print(f'✗ LED test failed: {e}')
"
    
    # Simple display test
    python3 -c "
try:
    import fourletterphat as flp
    flp.clear()
    flp.print_str('HELO')
    flp.show()
    import time
    time.sleep(1)
    flp.clear()
    flp.show()
    print('✓ Display test successful')
except Exception as e:
    print(f'✗ Display test failed: {e}')
"
}

# Main setup flow
main() {
    check_pi
    enable_interfaces
    install_deps
    install_python_packages
    setup_custom_drivers
    setup_audio
    test_rainbow_hat
    
    echo -e "\n✅ Setup complete!"
    echo "Next steps:"
    echo "1. Reboot your Pi: sudo reboot"
    echo "2. Copy rainbow_driver.py to ~/custom_drivers/ if not already done"
    echo "3. Test with: python3 test_rainbow_hat.py"
    echo "4. Run RoverCub: python3 ProjectRoverCub/RoverCub.py"
}

# Run main
main 