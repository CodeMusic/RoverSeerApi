#!/bin/bash
# Fix packages in RoverCub virtual environment

echo "Installing RoverCub packages in virtual environment"
echo "==================================================="

# Check if we're in the virtual environment
if [ -z "$VIRTUAL_ENV" ]; then
    echo "[ERROR] Not in a virtual environment!"
    echo "Please activate your virtual environment first:"
    echo "  source ~/rovercub_venv/bin/activate"
    exit 1
fi

echo "[OK] Virtual environment active: $VIRTUAL_ENV"

# Update pip
echo -e "\nUpdating pip..."
pip install --upgrade pip

# Install required packages
echo -e "\nInstalling required packages..."

# Core GPIO and hardware packages
pip install gpiozero
pip install RPi.GPIO
pip install fourletterphat

# I2C/SPI and sensor packages
pip install adafruit-circuitpython-bmp280
pip install adafruit-blinka

# Audio and input packages
pip install evdev
pip install numpy
pip install requests

# Install APA102 library from GitHub
echo -e "\nInstalling APA102 library..."
if [ ! -d "$HOME/APA102_Pi" ]; then
    cd $HOME
    git clone https://github.com/tinue/apa102-pi.git APA102_Pi
    cd APA102_Pi
    pip install -e .
    cd $HOME
else
    cd $HOME/APA102_Pi
    pip install -e .
    cd $HOME
fi

# List installed packages
echo -e "\nInstalled packages:"
pip list | grep -E 'gpio|four|adafruit|evdev|numpy|requests|apa102'

echo -e "\nInstallation complete!"
echo "Now run: python3 test_rainbow_hat.py" 