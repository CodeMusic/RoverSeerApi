import socket
from embodiment.rainbow_interface import get_rainbow_driver
from config import TCP_SERVICES
import os


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
    
    # Get fan state - Raspberry Pi active cooler with PWM speed control
    # The Pi's fan is typically controlled via PWM on GPIO18
    try:
        # First, try to read the actual fan PWM duty cycle
        fan_detected = False
        try:
            # Check if we can access the PWM sysfs interface
            # The fan is typically on PWM0 (GPIO18)
            pwm_chip_path = "/sys/class/pwm/pwmchip0"
            
            if os.path.exists(pwm_chip_path):
                # Try to read PWM duty cycle
                pwm_path = f"{pwm_chip_path}/pwm0"
                
                if os.path.exists(pwm_path):
                    # Read period and duty cycle
                    with open(f"{pwm_path}/period", 'r') as f:
                        period = int(f.read().strip())
                    
                    with open(f"{pwm_path}/duty_cycle", 'r') as f:
                        duty_cycle = int(f.read().strip())
                    
                    # Calculate duty cycle percentage
                    if period > 0:
                        duty_percent = (duty_cycle / period) * 100
                        
                        # Map duty cycle to fan speed
                        if duty_percent < 5:
                            data["fan_state"] = "OFF"
                        elif duty_percent < 35:
                            data["fan_state"] = "LOW 🌀"
                        elif duty_percent < 70:
                            data["fan_state"] = "MED 🌀🌀"
                        else:
                            data["fan_state"] = "HIGH 🌀🌀🌀"
                        
                        data["fan_state"] += f" ({duty_percent:.0f}%)"
                        fan_detected = True
                        print(f"Fan PWM detected: {duty_percent:.1f}% duty cycle")
        except Exception as e:
            # PWM reading failed, try alternative method
            pass
        
        # If PWM reading failed, try to detect via GPIO
        if not fan_detected:
            try:
                # Try reading fan tachometer if available (some fans have this on GPIO14)
                import RPi.GPIO as GPIO
                GPIO.setmode(GPIO.BCM)
                GPIO.setup(14, GPIO.IN, pull_up_down=GPIO.PUD_UP)
                
                # Sample the tachometer for a short period
                import time
                pulse_count = 0
                sample_time = 0.1  # 100ms sample
                start_time = time.time()
                last_state = GPIO.input(14)
                
                while time.time() - start_time < sample_time:
                    current_state = GPIO.input(14)
                    if current_state != last_state and current_state == 1:
                        pulse_count += 1
                    last_state = current_state
                
                # Calculate RPM (2 pulses per revolution typical)
                rpm = (pulse_count / 2) * (60 / sample_time)
                
                if rpm < 100:
                    data["fan_state"] = "OFF"
                elif rpm < 2000:
                    data["fan_state"] = "LOW 🌀"
                elif rpm < 3500:
                    data["fan_state"] = "MED 🌀🌀"
                else:
                    data["fan_state"] = "HIGH 🌀🌀🌀"
                
                data["fan_state"] += f" ({rpm:.0f} RPM)"
                fan_detected = True
                
                GPIO.cleanup(14)
            except:
                pass
        
        # Fallback: Infer from CPU temperature if detection failed
        if not fan_detected and data["cpu_temperature"] != "N/A":
            cpu_temp = float(data["cpu_temperature"].replace("°C", ""))
            
            # Temperature-based inference
            if cpu_temp < 50.0:
                data["fan_state"] = "OFF (inferred)"
            elif cpu_temp < 60.0:
                data["fan_state"] = "LOW 🌀 (inferred)"
            elif cpu_temp < 70.0:
                data["fan_state"] = "MED 🌀🌀 (inferred)"
            else:
                data["fan_state"] = "HIGH 🌀🌀🌀 (inferred)"
            
            # Add temperature to show why fan is inferred at this speed
            data["fan_state"] += f" {cpu_temp:.0f}°C"
                
    except Exception as e:
        print(f"Error determining fan state: {e}")
        data["fan_state"] = "Error"
    
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


def get_ai_pipeline_status():
    """Get simplified RoverSeer status with current activity"""
    status = {
        "status": "🔵",  # Blue for idle
        "activity": "idle",
        "detail": ""
    }
    
    try:
        # Import needed values
        from config import pipeline_stages, active_request_count, recording_in_progress, MAX_CONCURRENT_REQUESTS
        
        # Count total active requests
        total_active = active_request_count
        if recording_in_progress:
            total_active += 1
            
        # Add request count to detail if there are multiple requests or if max is > 1
        if MAX_CONCURRENT_REQUESTS > 1 and total_active > 0:
            status["requests"] = f"{total_active}/{MAX_CONCURRENT_REQUESTS}"
        
        # Check if any RoverSeer processes are active
        # Check pipeline stages and set appropriate status
        if pipeline_stages.get("asr_active", False):
            status["status"] = "🟢"  # Green for active
            status["activity"] = "🎤 listening"
            status["detail"] = "whisper"
            
        elif pipeline_stages.get("llm_active", False):
            status["status"] = "🟢"
            status["activity"] = "🤔 thinking"
            # Try to get current model
            try:
                from config import active_model, selected_model_index, available_models
                from utilities.text_processing import extract_short_model_name
                
                # Check if there's an active model being processed
                if active_model:
                    short_name = extract_short_model_name(active_model)
                    status["detail"] = short_name
                # Otherwise use button-selected model
                elif available_models and 0 <= selected_model_index < len(available_models):
                    model_name = available_models[selected_model_index]
                    short_name = extract_short_model_name(model_name)
                    status["detail"] = short_name
                else:
                    status["detail"] = "processing"
            except:
                status["detail"] = "processing"
                
        elif pipeline_stages.get("tts_active", False):
            status["status"] = "🟢"
            status["activity"] = "🔊 speaking"
            # Try to get current voice
            try:
                from config import active_voice, DEFAULT_VOICE
                if active_voice:
                    # Extract just the voice name (e.g., "GlaDOS" from "en_GB-GlaDOS-medium")
                    voice_parts = active_voice.split('-')
                    if len(voice_parts) >= 3:
                        voice_name = voice_parts[2]  # Get the voice name part
                    else:
                        voice_name = active_voice
                    status["detail"] = voice_name
                else:
                    status["detail"] = DEFAULT_VOICE.split('-')[2] if '-' in DEFAULT_VOICE else DEFAULT_VOICE
            except:
                status["detail"] = "piper"
                
        elif pipeline_stages.get("aplay_active", False):
            status["status"] = "🟢"
            status["activity"] = "🔊 playing"
            # Show voice during playback too
            try:
                from config import active_voice
                if active_voice:
                    voice_parts = active_voice.split('-')
                    if len(voice_parts) >= 3:
                        voice_name = voice_parts[2]  # Get the voice name part
                    else:
                        voice_name = active_voice
                    status["detail"] = voice_name
                else:
                    status["detail"] = "audio"
            except:
                status["detail"] = "audio"
                
    except Exception as e:
        print(f"Error checking AI pipeline status: {e}")
    
    return status 