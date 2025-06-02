#!/usr/bin/env python3
"""
RoverCub Local - Voice-Controlled AI Assistant for RoverSeer

Features:
- Voice input with local API integration
- Push-to-talk functionality
- Text-to-speech output
- LED animations matching RoverSeer
- Integration with RoverSeer API endpoints
- A/B/C button control for model selection and recording
"""

import os
import time
import subprocess
import argparse
import requests
import json
import threading
import queue
from evdev import InputDevice, categorize, ecodes
import numpy as np
from rpi_ws281x import PixelStrip, Color

# LED Configuration
GRID_WIDTH = 8
GRID_HEIGHT = 4
LED_COUNT = GRID_WIDTH * GRID_HEIGHT
LED_PIN = 18
LED_FREQ_HZ = 800000
LED_DMA = 10
LED_BRIGHTNESS = 32
LED_INVERT = False
LED_CHANNEL = 0

# API Configuration
ROVERSEER_API = "http://roverseer.local:5000"
ENDPOINTS = {
    "transcribe": f"{ROVERSEER_API}/api/transcribe",
    "llm": f"{ROVERSEER_API}/api/llm",
    "tts": f"{ROVERSEER_API}/api/tts"
}

# Model Configuration
MODELS = {
    "1": {
        "name": "CodeMusAI",
        "description": "AI focused on music and coding",
        "voice": "alloy"
    },
    "2": {
        "name": "True Janet",
        "description": "AI with Janet's personality",
        "voice": "nova"
    },
    "3": {
        "name": "Chris",
        "description": "AI with Chris's personality",
        "voice": "echo"
    },
    "4": {
        "name": "Eddie Mora",
        "description": "AI with Eddie's personality",
        "voice": "fable"
    },
    "5": {
        "name": "Justin Trudeau",
        "description": "AI with Justin Trudeau's diplomatic and progressive personality",
        "voice": "nova"
    },
    "6": {
        "name": "Donald Trump",
        "description": "AI with Donald Trump's bold and direct personality",
        "voice": "echo"
    },
    "7": {
        "name": "Dale Carnegie",
        "description": "AI with Dale Carnegie's wisdom on human relations and leadership",
        "voice": "fable"
    },
    "8": {
        "name": "Joseph Smith",
        "description": "AI with Joseph Smith's spiritual and historical perspective",
        "voice": "echo"
    },
    "9": {
        "name": "Pengu the Penguin",
        "description": "AI with Pengu's playful and adventurous personality",
        "voice": "nova"
    },
    "10": {
        "name": "Good Janet",
        "description": "AI with Good Janet's helpful and optimistic personality",
        "voice": "nova"
    },
    "11": {
        "name": "Bad Janet",
        "description": "AI with Bad Janet's sassy and rebellious personality",
        "voice": "alloy"
    }
}

# LED State
LEDS_OK = False
strip = None
led_queue = queue.Queue()
led_thread = None
led_running = False

# Animation States
IDLE = 'idle'
LISTENING = 'listening'
PROCESSING = 'processing'
TALKING = 'talking'
HEARTBEAT = 'heartbeat'
SPECTRUM = 'spectrum'
MODEL_SELECT = 'model_select'

# Animation Configuration
ANIMATION_CONFIG = {
    'processing': 'matrix',
    'snake_colors': True,
}

# Global variables
current_model = "1"  # Default to first model
model_select_mode = False
model_digit = 0
model_digits = []

def initialize_leds():
    """Initialize the LED strip"""
    global LEDS_OK, strip
    try:
        strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA,
                          LED_INVERT, LED_BRIGHTNESS, LED_CHANNEL)
        strip.begin()
        LEDS_OK = True
        print("[LED] Initialized successfully")
    except Exception as e:
        print(f"[LED] Initialization failed: {e}")
        LEDS_OK = False

def led_update_thread():
    """Thread function for continuous LED updates"""
    global led_running, strip, LEDS_OK
    
    phase = 0.0
    game_grid = None
    current_state = IDLE
    current_tokens = None
    
    while led_running:
        try:
            # Check for new state/tokens from queue
            try:
                while not led_queue.empty():
                    new_state, new_tokens = led_queue.get_nowait()
                    current_state = new_state
                    current_tokens = new_tokens
            except queue.Empty:
                pass
            
            # Update LEDs based on current state
            if current_state == TALKING and current_tokens is not None:
                update_leds(current_state, phase, game_grid, current_tokens)
            else:
                game_grid = update_leds(current_state, phase, game_grid, current_tokens)
            
            # Update animation phase
            phase += 0.1
            
            # Small sleep to prevent CPU hogging
            time.sleep(0.01)
        except Exception as e:
            print(f"[LED] Error in LED thread: {e}")
            time.sleep(0.1)

def start_led_thread():
    """Start the LED update thread"""
    global led_thread, led_running, LEDS_OK
    
    if not LEDS_OK:
        print("[LED] LED initialization failed, cannot start thread")
        return
    
    if led_thread is None or not led_thread.is_alive():
        led_running = True
        led_thread = threading.Thread(target=led_update_thread, daemon=True)
        led_thread.start()
        print("[LED] LED update thread started")

def stop_led_thread():
    """Stop the LED update thread"""
    global led_thread, led_running
    
    if led_thread is not None and led_thread.is_alive():
        led_running = False
        led_thread.join(timeout=1.0)
        print("[LED] LED update thread stopped")

def update_led_state(state, tokens=None):
    """Update LED state and tokens through the queue"""
    try:
        led_queue.put((state, tokens))
    except Exception as e:
        print(f"[LED] Error updating LED state: {e}")

def breathing_animation(phase):
    """Create a calm blue and green wave effect for idle state"""
    if not LEDS_OK:
        return
    
    try:
        # Calculate wave intensity
        intensity = 0.3 + 0.7 * (0.5 + 0.5 * np.sin(phase))
        
        # Create a wave pattern with blue and green
        for i in range(LED_COUNT):
            x = i % GRID_WIDTH
            y = i // GRID_WIDTH
            wave = np.sin(phase + x * 0.5) * np.cos(phase + y * 0.5)
            
            # Alternate between blue and green waves
            if wave > 0.5:
                color = (0, int(64 * intensity), int(32 * intensity))  # More green
            elif wave > 0:
                color = (0, int(32 * intensity), int(64 * intensity))  # More blue
            else:
                color = (0, int(16 * intensity), int(16 * intensity))  # Dark blue-green
            
            strip.setPixelColor(i, Color(*color))
    except Exception as e:
        print(f"[LED] Error in breathing animation: {e}")

def heartbeat_animation(phase):
    """Create a heartbeat animation"""
    if not LEDS_OK:
        return
    
    try:
        # Calculate heartbeat pattern
        beat = np.sin(phase * 4) * 0.5 + 0.5
        intensity = 0.3 + 0.7 * beat
        
        # Create a pulsing red pattern
        for i in range(LED_COUNT):
            x = i % GRID_WIDTH
            y = i // GRID_WIDTH
            
            # Add some variation based on position
            pos_factor = np.sin(x * 0.5 + y * 0.5) * 0.2 + 0.8
            r = int(64 * intensity * pos_factor)
            g = int(16 * intensity * pos_factor)
            b = int(16 * intensity * pos_factor)
            
            strip.setPixelColor(i, Color(r, g, b))
    except Exception as e:
        print(f"[LED] Error in heartbeat animation: {e}")

def matrix_animation(phase):
    """Create a Matrix-style animation"""
    if not LEDS_OK:
        return
    
    try:
        # Create falling green characters effect
        for i in range(LED_COUNT):
            x = i % GRID_WIDTH
            y = i // GRID_WIDTH
            
            # Calculate falling effect
            fall_phase = (x * 0.5 + phase) % (2 * np.pi)
            brightness = np.sin(fall_phase) * 0.5 + 0.5
            
            # Add some random variation
            if np.random.random() < 0.1:  # 10% chance for brighter pixel
                brightness = 1.0
            
            # Set green color with varying brightness
            g = int(64 * brightness)
            strip.setPixelColor(i, Color(0, g, 0))
    except Exception as e:
        print(f"[LED] Error in matrix animation: {e}")

def update_leds(state, phase, game_grid=None, tokens=None):
    """Update LEDs based on current state"""
    if not LEDS_OK:
        return game_grid
    
    try:
        if state == IDLE:
            breathing_animation(phase)
        elif state == LISTENING:
            heartbeat_animation(phase)
        elif state == PROCESSING:
            matrix_animation(phase)
        elif state == TALKING:
            matrix_animation(phase)
        else:
            breathing_animation(phase)
        
        strip.show()
        return game_grid
    except Exception as e:
        print(f"[LED] Error updating LEDs: {e}")
        breathing_animation(phase)
        strip.show()
        return game_grid

def find_headset_path():
    """Find the correct event device path for the headset"""
    try:
        for event_file in os.listdir('/dev/input/by-id'):
            if 'usb-Walmart_AB13X_Headset_Adapter' in event_file:
                return os.path.join('/dev/input/by-id', event_file)
        return '/dev/input/event0'  # Default fallback
    except Exception as e:
        print(f"[ERROR] Error finding headset path: {e}")
        return '/dev/input/event0'

def initialize_headset():
    """Initialize the headset device"""
    try:
        EVENT_PATH = find_headset_path()
        dev = InputDevice(EVENT_PATH)
        print(f"[MIC] Found headset at {dev.path}")
        return dev
    except Exception as e:
        print(f"[ERROR] Could not initialize headset: {e}")
        print("Falling back to GPIO buttons only")
        return None

def transcribe_audio(audio_file):
    """Send audio file to transcribe endpoint"""
    try:
        with open(audio_file, 'rb') as f:
            files = {'file': f}
            response = requests.post(ENDPOINTS['transcribe'], files=files)
            response.raise_for_status()
            return response.json()['text']
    except Exception as e:
        print(f"[ERROR] Transcription failed: {e}")
        return None

def get_llm_response(text):
    """Get response from LLM endpoint"""
    try:
        response = requests.post(ENDPOINTS['llm'], json={
            'text': text,
            'model': current_model
        })
        response.raise_for_status()
        return response.json()['response']
    except Exception as e:
        print(f"[ERROR] LLM request failed: {e}")
        return None

def get_tts_audio(text):
    """Get TTS audio from endpoint"""
    try:
        response = requests.post(ENDPOINTS['tts'], json={
            'text': text,
            'voice': MODELS[current_model]['voice']
        })
        response.raise_for_status()
        
        # Save the audio file
        tts_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tts_response.mp3')
        with open(tts_file, 'wb') as f:
            f.write(response.content)
        return tts_file
    except Exception as e:
        print(f"[ERROR] TTS request failed: {e}")
        return None

def play_audio(file_path):
    """Play audio file using mpg123"""
    print("[PLAY] Playing audio response...")
    try:
        play_cmd = ['mpg123', '-q', file_path]
        subprocess.run(play_cmd)
        
        # Clean up the file
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"[WARNING] Could not remove temporary file: {e}")
    except Exception as e:
        print(f"[ERROR] Audio playback failed: {e}")

def verify_recording(file_path, min_size_kb=5):
    """Verify that the recording file exists and has a reasonable size"""
    if not os.path.exists(file_path):
        print("[ERROR] Recording file not found")
        return False
    
    size_kb = os.path.getsize(file_path) / 1024
    print(f"[INFO] Recording file size: {size_kb:.1f}KB")
    
    if size_kb < min_size_kb:
        print(f"[ERROR] Recording file too small ({size_kb:.1f}KB < {min_size_kb}KB)")
        return False
    
    if not os.access(file_path, os.R_OK):
        print("[ERROR] Cannot read recording file - permission denied")
        return False
        
    try:
        with open(file_path, 'rb') as f:
            header = f.read(44)
            if not header.startswith(b'RIFF'):
                print("[ERROR] Invalid WAV file format")
                return False
    except Exception as e:
        print(f"[ERROR] Failed to verify WAV file: {e}")
        return False
    
    return True

def safe_terminate_process(proc):
    """Safely terminate a process with proper cleanup"""
    if proc:
        try:
            proc.terminate()
            proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            try:
                proc.kill()
            except:
                pass
        except:
            pass

def cleanup_leds():
    """Turn off all LEDs and clean up"""
    global LEDS_OK, strip
    if LEDS_OK and strip:
        try:
            for i in range(LED_COUNT):
                strip.setPixelColor(i, Color(0, 0, 0))
            strip.show()
            print("[LED] All LEDs turned off")
        except Exception as e:
            print(f"[ERROR] Failed to turn off LEDs: {e}")

def display_digit(digit):
    """Display a digit on the LED grid"""
    if not LEDS_OK:
        return
    
    try:
        # Clear all LEDs
        for i in range(LED_COUNT):
            strip.setPixelColor(i, Color(0, 0, 0))
        
        # Define digit patterns (simplified for 8x4 grid)
        digit_patterns = {
            '0': [(0,0), (1,0), (2,0), (0,1), (2,1), (0,2), (2,2), (0,3), (1,3), (2,3)],
            '1': [(1,0), (1,1), (1,2), (1,3)],
            '2': [(0,0), (1,0), (2,0), (2,1), (1,2), (0,3), (1,3), (2,3)],
            '3': [(0,0), (1,0), (2,0), (2,1), (1,2), (2,2), (0,3), (1,3), (2,3)],
            '4': [(0,0), (2,0), (0,1), (2,1), (1,2), (2,2), (2,3)],
            '5': [(0,0), (1,0), (2,0), (0,1), (1,2), (2,2), (0,3), (1,3), (2,3)],
            '6': [(0,0), (1,0), (2,0), (0,1), (0,2), (1,2), (2,2), (0,3), (1,3), (2,3)],
            '7': [(0,0), (1,0), (2,0), (2,1), (2,2), (2,3)],
            '8': [(0,0), (1,0), (2,0), (0,1), (2,1), (0,2), (1,2), (2,2), (0,3), (1,3), (2,3)],
            '9': [(0,0), (1,0), (2,0), (0,1), (2,1), (1,2), (2,2), (0,3), (1,3), (2,3)]
        }
        
        # Display the digit
        if str(digit) in digit_patterns:
            for x, y in digit_patterns[str(digit)]:
                idx = y * GRID_WIDTH + x
                if idx < LED_COUNT:
                    strip.setPixelColor(idx, Color(64, 64, 64))  # White color
        
        strip.show()
    except Exception as e:
        print(f"[LED] Error displaying digit: {e}")

def handle_model_selection():
    """Handle model selection mode"""
    global model_select_mode, model_digit, model_digits, current_model
    
    if not model_select_mode:
        model_select_mode = True
        model_digit = 0
        model_digits = []
        update_led_state(MODEL_SELECT)
        print("[MODEL] Enter model selection mode")
        return
    
    # Add current digit to selection
    model_digits.append(model_digit)
    display_digit(model_digit)
    
    # If we have two digits, try to select the model
    if len(model_digits) == 2:
        model_num = ''.join(map(str, model_digits))
        if model_num in MODELS:
            current_model = model_num
            print(f"[MODEL] Selected model {MODELS[model_num]['name']}")
            # Announce selection
            announcement = f"Switched to {MODELS[model_num]['name']}. {MODELS[model_num]['description']}"
            tts_file = get_tts_audio(announcement)
            if tts_file:
                play_audio(tts_file)
        else:
            print(f"[MODEL] Invalid model number: {model_num}")
        
        # Reset selection mode
        model_select_mode = False
        model_digits = []
        update_led_state(IDLE)
        print("[MODEL] Exited model selection mode")

def handle_button_press(button):
    """Handle button press events"""
    global model_select_mode, model_digit, current_model
    
    if button == 'A':
        # Previous model
        if model_select_mode:
            model_digit = (model_digit - 1) % 10
            display_digit(model_digit)
        else:
            current_num = int(current_model)
            new_num = ((current_num - 2) % 11) + 1
            current_model = str(new_num)
            announcement = f"Switched to {MODELS[current_model]['name']}"
            tts_file = get_tts_audio(announcement)
            if tts_file:
                play_audio(tts_file)
    
    elif button == 'B':
        # Start recording or confirm model selection
        if model_select_mode:
            handle_model_selection()
        else:
            return 'start_recording'
    
    elif button == 'C':
        # Next model
        if model_select_mode:
            model_digit = (model_digit + 1) % 10
            display_digit(model_digit)
        else:
            current_num = int(current_model)
            new_num = (current_num % 11) + 1
            current_model = str(new_num)
            announcement = f"Switched to {MODELS[current_model]['name']}"
            tts_file = get_tts_audio(announcement)
            if tts_file:
                play_audio(tts_file)
    
    return None

def main():
    global LEDS_OK, strip, model_select_mode, model_digit, current_model
    args = parse_args()
    
    # Initialize LEDs
    initialize_leds()
    if LEDS_OK:
        start_led_thread()
    
    # Check permissions first
    if not check_audio_permissions():
        return

    # Set volume once at startup
    set_audio_volume()

    if args.test:
        test_audio(args.device, args.rate, args.period)
        return

    # Start in spectrum loading state
    update_led_state(SPECTRUM)
    print(f"[STATE] Changed to {SPECTRUM}")

    # Switch to idle state after initialization
    update_led_state(IDLE)
    print(f"[STATE] Changed to {IDLE}")

    if args.text:
        print("\n[INFO] Running in text mode. Type your message and press Enter.")
        print("Type 'quit' to exit.")
        print("Type 'model' to enter model selection mode.")
        while True:
            try:
                user_input = input("\nYour message: ").strip()
                if user_input.lower() == 'quit':
                    break
                elif user_input.lower() == 'model':
                    handle_model_selection()
                    continue
                    
                print("\n[AI] Getting response...")
                update_led_state(PROCESSING)
                print(f"[STATE] Changed to {PROCESSING}")
                
                # Get LLM response
                response = get_llm_response(user_input)
                if response:
                    # Get TTS audio
                    tts_file = get_tts_audio(response)
                    if tts_file:
                        play_audio(tts_file)
                
                update_led_state(IDLE)
                print(f"[STATE] Changed to {IDLE}")
                
            except Exception as e:
                print(f"[ERROR] Text mode error: {e}")
                update_led_state(IDLE)
                print(f"[STATE] Changed to {IDLE}")
                continue

    else:
        # Voice mode
        EVENT_PATH = find_headset_path()
        CARD_DEV = args.device
        RATE = str(args.rate)
        PERIOD = str(args.period)
        BUFFER = str(int(PERIOD)*4)
        TMP_WAV = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ptt_clip.wav')
        RECORD_SEC = 10  # Changed to 10 seconds
        RELEASE_DELAY = 0.5

        try:
            os.makedirs(os.path.dirname(TMP_WAV), exist_ok=True)
        except Exception as e:
            print(f"[ERROR] Could not create temp directory: {e}")
            TMP_WAV = '/tmp/ptt_clip.wav'
            print(f"[INFO] Using fallback path: {TMP_WAV}")

        state = IDLE
        rec_proc = None
        play_proc = None
        recording_start = 0.0
        button_pressed = False

        dev = initialize_headset()
        if not dev:
            print("[WARNING] No headset found, continuing with GPIO buttons only")

        try:
            while True:
                if dev:
                    try:
                        ev = dev.read_one()
                        if ev and ev.type == ecodes.EV_KEY:
                            key = categorize(ev)
                            if key.scancode == ecodes.KEY_PLAYPAUSE:
                                if key.keystate == key.key_down and not button_pressed and state == IDLE:
                                    button_pressed = True
                                    recording_start = time.monotonic()
                                    print("[BUTTON] Button pressed")
                                    
                                    state = HEARTBEAT
                                    update_led_state(state)
                                    print(f"[STATE] Changed to {state}")
                                    
                                    print("[REC] Starting recording...")
                                    try:
                                        if rec_proc:
                                            safe_terminate_process(rec_proc)
                                            rec_proc = None
                                        
                                        rec_cmd = [
                                            'arecord',
                                            '-D', CARD_DEV,
                                            '-r', '16000',
                                            '-f', 'S16_LE',
                                            '-c', '1',
                                            '-t', 'wav',
                                            '-d', str(RECORD_SEC),
                                            '-v',
                                            '--buffer-size=32000',
                                            '--period-size=8000',
                                            TMP_WAV
                                        ]
                                        print(f"[REC] Running command: {' '.join(rec_cmd)}")
                                        rec_proc = subprocess.Popen(['sudo'] + rec_cmd)
                                        
                                        print(f"[REC] Recording for {RECORD_SEC} seconds...")
                                        time.sleep(RECORD_SEC)
                                        
                                        if rec_proc:
                                            safe_terminate_process(rec_proc)
                                            rec_proc = None
                                        
                                        print("[REC] Recording completed")
                                        
                                        if os.path.exists(TMP_WAV):
                                            if not verify_recording(TMP_WAV):
                                                print("[ERROR] Recording quality check failed")
                                                state = IDLE
                                                update_led_state(state)
                                                print(f"[STATE] Changed to {state}")
                                                continue
                                            
                                            print("[STT] Converting speech to text...")
                                            state = LISTENING
                                            update_led_state(state)
                                            print(f"[STATE] Changed to {LISTENING}")
                                            
                                            transcript = transcribe_audio(TMP_WAV)
                                            if transcript:
                                                print(f"[STT] User said: {transcript}")
                                                
                                                if len(transcript.strip()) < 2:
                                                    print("[WARNING] Transcription too short")
                                                    state = IDLE
                                                    update_led_state(state)
                                                    print(f"[STATE] Changed to {IDLE}")
                                                    continue

                                                print("[AI] Getting response...")
                                                state = PROCESSING
                                                update_led_state(state)
                                                print(f"[STATE] Changed to {PROCESSING}")
                                                
                                                response = get_llm_response(transcript)
                                                if response:
                                                    state = TALKING
                                                    update_led_state(state)
                                                    print(f"[STATE] Changed to {TALKING}")
                                                    
                                                    tts_file = get_tts_audio(response)
                                                    if tts_file:
                                                        play_audio(tts_file)
                                                
                                                state = IDLE
                                                update_led_state(state)
                                                print(f"[STATE] Changed to {IDLE}")
                                            
                                    except Exception as e:
                                        print(f"[ERROR] Failed to start recording: {e}")
                                        state = IDLE
                                        update_led_state(state)
                                        print(f"[STATE] Changed to {IDLE}")
                                    
                                elif key.keystate == key.key_up and button_pressed:
                                    button_pressed = False
                                    print("[BUTTON] Button released")
                                    if state == HEARTBEAT:
                                        state = IDLE
                                        update_led_state(state)
                                        print(f"[STATE] Changed to {state}")
                    except Exception as e:
                        print(f"[ERROR] Reading from device: {e}")
                        try:
                            dev.close()
                        except:
                            pass
                        dev = initialize_headset()
                        if not dev:
                            print("[WARNING] Could not reinitialize headset")
                        time.sleep(0.1)

                time.sleep(0.01)

        except KeyboardInterrupt:
            print("\n[EXIT] Cleaning up...")
            try:
                for i in range(LED_COUNT):
                    strip.setPixelColor(i, Color(64, 0, 0))
                strip.show()
                time.sleep(0.1)
            except:
                pass
            
            if dev:
                try:
                    dev.close()
                except:
                    pass
            safe_terminate_process(rec_proc)
            safe_terminate_process(play_proc)
            if os.path.exists(TMP_WAV):
                try:
                    os.remove(TMP_WAV)
                except:
                    pass
            stop_led_thread()
            cleanup_leds()
            print("[DONE] Goodbye!")

def parse_args():
    parser = argparse.ArgumentParser(description='RoverCub Local - Voice-Controlled AI Assistant')
    parser.add_argument('--test', action='store_true', help='Run audio test')
    parser.add_argument('--text', action='store_true', help='Use text input instead of voice')
    parser.add_argument('--device', default='plughw:1,0', help='ALSA device')
    parser.add_argument('--rate', type=int, default=48000, help='Sample rate')
    parser.add_argument('--period', type=int, default=6000, help='Period size')
    return parser.parse_args()

def check_audio_permissions():
    """Check if we have proper permissions for audio devices"""
    try:
        test_cmd = ['arecord', '-l']
        result = subprocess.run(test_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print("[WARNING] Audio device access check failed. You may need to run with sudo.")
            print("[INFO] Try running: sudo python RoverCub_local.py")
            return False
        return True
    except Exception as e:
        print(f"[ERROR] Permission check failed: {e}")
        return False

def set_audio_volume():
    """Set the audio volume once at startup"""
    print("[VOLUME] Setting initial volume...")
    try:
        volume_controls = ['Master', 'PCM', 'Speaker', 'Headphone']
        volume_set = False
        
        for control in volume_controls:
            try:
                result = subprocess.run(['amixer', '-D', 'hw:1', 'sset', control, '91%'], 
                                     capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"[VOLUME] Set {control} volume to 91%")
                    volume_set = True
                    break
            except Exception as e:
                continue
        
        if not volume_set:
            print("[WARNING] Could not set volume, continuing with default volume")
    except Exception as e:
        print(f"[ERROR] Volume setting failed: {e}")

def test_audio(device, rate, period):
    """Test audio input and output functionality"""
    print("\n[TEST] Starting audio test...")
    print(f"[TEST] Using device: {device}")
    print(f"[TEST] Sample rate: {rate}")
    print(f"[TEST] Period size: {period}")
    
    print("\n[TEST] Testing recording...")
    test_wav = "test_recording.wav"
    try:
        rec_cmd = ['arecord', '-D', device, '-r', str(rate), '-f', 'S16_LE', '-c', '1', '-t', 'wav', test_wav]
        print(f"[TEST] Running command: {' '.join(rec_cmd)}")
        rec_proc = subprocess.Popen(rec_cmd)
        print("[TEST] Recording for 3 seconds...")
        time.sleep(3)
        rec_proc.terminate()
        print("[TEST] Recording stopped")
        
        if os.path.exists(test_wav):
            print("[TEST] Recording successful")
            print("\n[TEST] Testing playback...")
            play_cmd = ['aplay', '-D', device, test_wav]
            print(f"[TEST] Running command: {' '.join(play_cmd)}")
            subprocess.run(play_cmd)
            print("[TEST] Playback complete")
            
            os.remove(test_wav)
        else:
            print("[TEST] Recording failed - no file created")
    except Exception as e:
        print(f"[TEST] Error during audio test: {e}")
    
    print("\n[TEST] Testing button detection...")
    try:
        for event_file in os.listdir('/dev/input/by-id'):
            if 'usb-Walmart_AB13X_Headset_Adapter' in event_file:
                event_path = os.path.join('/dev/input/by-id', event_file)
                dev = InputDevice(event_path)
                print(f"[TEST] Found headset at {dev.path}")
                print("[TEST] Press and release the button to test...")
                
                button_pressed = False
                start_time = time.time()
                while time.time() - start_time < 10:
                    ev = dev.read_one()
                    if ev and ev.type == ecodes.EV_KEY:
                        key = categorize(ev)
                        if key.scancode == ecodes.KEY_PLAYPAUSE:
                            if key.keystate == key.key_down and not button_pressed:
                                button_pressed = True
                                print("[TEST] Button pressed")
                            elif key.keystate == key.key_up and button_pressed:
                                button_pressed = False
                                print("[TEST] Button released")
                    time.sleep(0.01)
                break
    except Exception as e:
        print(f"[TEST] Error during button test: {e}")
    
    print("\n[TEST] Audio test complete")

if __name__ == "__main__":
    main() 