import socket
from embodiment.rainbow_interface import get_rainbow_driver
from config import TCP_SERVICES


def get_sensor_data():
    """Get sensor data from BMP280 and system"""
    rainbow = get_rainbow_driver()
    
    data = {
        "hat_temperature": "N/A",
        "cpu_temperature": "N/A", 
        "pressure": "N/A",
        "altitude": "N/A",
        "fan_state": "N/A"
    }
    
    # Get HAT temperature from BMP280
    if rainbow and hasattr(rainbow, 'bmp280'):
        try:
            temp = rainbow.bmp280.temperature
            pressure = rainbow.bmp280.pressure
            # Calculate altitude using standard atmosphere formula
            # P = P0 * (1 - 0.0065 * h / T0) ^ 5.257
            # Solving for h: h = T0/0.0065 * (1 - (P/P0)^(1/5.257))
            P0 = 1013.25  # sea level pressure in hPa
            T0 = 288.15   # standard temperature in K
            altitude = (T0 / 0.0065) * (1 - (pressure / P0) ** (1/5.257))
            data["hat_temperature"] = f"{temp:.1f}°C"
            data["pressure"] = f"{pressure:.1f} hPa"
            data["altitude"] = f"{altitude:.1f} m"
        except Exception as e:
            print(f"Error reading BMP280 sensor data: {e}")
    
    # Get Pi CPU temperature
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            cpu_temp = float(f.read().strip()) / 1000.0
            data["cpu_temperature"] = f"{cpu_temp:.1f}°C"
    except Exception as e:
        print(f"Error reading CPU temperature: {e}")
    
    # Get fan state from Rainbow HAT
    if rainbow and hasattr(rainbow, 'cooler'):
        try:
            # Check if fan is on (assuming it has an 'is_on' or similar property)
            # This might need adjustment based on the actual rainbow driver implementation
            fan_on = getattr(rainbow.cooler, 'value', 0) > 0
            data["fan_state"] = "ON" if fan_on else "OFF"
        except Exception as e:
            print(f"Error reading fan state: {e}")
            # Alternative method - check GPIO pin directly if needed
            try:
                import RPi.GPIO as GPIO
                # Assuming fan is on a specific GPIO pin (adjust as needed)
                # This is a fallback if the rainbow driver doesn't expose fan state
                data["fan_state"] = "Unknown"
            except:
                pass
    
    return data


def check_tcp_ports():
    """Check the status of configured TCP services"""
    results = {}
    for name, port in TCP_SERVICES.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex(('localhost', port))
        if result == 0:
            results[name] = {"status": "🟢", "port": port}
        else:
            results[name] = {"status": "🔴", "port": port}
        sock.close()
    return results


def get_system_status():
    """Get comprehensive system status including sensors and services"""
    return {
        "sensors": get_sensor_data(),
        "services": check_tcp_ports(),
        "timestamp": None  # Will be filled by calling code if needed
    }


def get_cpu_temperature():
    """Get just the CPU temperature as a float"""
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            cpu_temp = float(f.read().strip()) / 1000.0
            return cpu_temp
    except Exception as e:
        print(f"Error reading CPU temperature: {e}")
        return None


def get_hat_temperature():
    """Get just the HAT temperature from BMP280"""
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'bmp280'):
        try:
            return rainbow.bmp280.temperature
        except Exception as e:
            print(f"Error reading HAT temperature: {e}")
    return None


def get_pressure():
    """Get atmospheric pressure from BMP280"""
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'bmp280'):
        try:
            return rainbow.bmp280.pressure
        except Exception as e:
            print(f"Error reading pressure: {e}")
    return None


def calculate_altitude(pressure_hpa):
    """Calculate altitude from pressure using standard atmosphere formula"""
    if pressure_hpa is None:
        return None
    
    try:
        P0 = 1013.25  # sea level pressure in hPa
        T0 = 288.15   # standard temperature in K
        altitude = (T0 / 0.0065) * (1 - (pressure_hpa / P0) ** (1/5.257))
        return altitude
    except Exception as e:
        print(f"Error calculating altitude: {e}")
        return None 