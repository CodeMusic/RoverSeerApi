#!/usr/bin/env python3
"""
RoverCub Refactored - Voice-Controlled AI Assistant with Local RoverSeer API

Features:
- Voice input with local RoverSeer API integration
- Push-to-talk functionality
- Text-to-speech output via local API
- LED animations matching RoverSeer
- Rainbow HAT support with custom drivers
- Model selection from /models endpoint
- Voice/personality selection
- Thread/conversation management
- Same animations and features as original
"""

import os
import sys
import time
import subprocess
import argparse
import requests
import json
import threading
import queue
import random
from evdev import InputDevice, categorize, ecodes
import numpy as np

# Add custom drivers from home directory
custom_drivers_path = os.path.expanduser("~/custom_drivers")
if os.path.exists(custom_drivers_path):
    sys.path.insert(0, custom_drivers_path)
    try:
        from rainbow_driver import RainbowDriver, BuzzerManager
        print(f"[DRIVERS] Loaded Rainbow HAT drivers from {custom_drivers_path}")
    except ImportError as e:
        print(f"[ERROR] Failed to import Rainbow HAT drivers: {e}")
        RainbowDriver = None
        BuzzerManager = None
else:
    print(f"[ERROR] custom_drivers not found at {custom_drivers_path}")
    print("[WARNING] Running without Rainbow HAT support")
    RainbowDriver = None
    BuzzerManager = None

# API Configuration
ROVERSEER_API = "http://roverseer.local:5000"
ENDPOINTS = {
    "transcribe": f"{ROVERSEER_API}/api/transcribe",
    "llm": f"{ROVERSEER_API}/api/llm",
    "tts": f"{ROVERSEER_API}/api/tts",
    "models": f"{ROVERSEER_API}/models",
    "voices": f"{ROVERSEER_API}/voices"
}

# Global variables
current_model = None  # Current model from API
current_voice = None  # Current voice from API
available_models = []  # Models from API
available_voices = []  # Voices from API
model_select_mode = False
voice_select_mode = False
selected_index = 0
rainbow_driver = None
buzzer_manager = None

# Conversation History
conversation_history = []
MAX_HISTORY_LENGTH = 10

# Animation States
IDLE = 'idle'
LISTENING = 'listening'
PROCESSING = 'processing'
TALKING = 'talking'
HEARTBEAT = 'heartbeat'
SPECTRUM = 'spectrum'
MODEL_SELECT = 'model_select'
VOICE_SELECT = 'voice_select'

# LED Animation configuration
led_animation_thread = None
led_animation_running = False
current_animation_state = IDLE
animation_tokens = None

# Config file path
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rovercub_config.json')

def load_config():
    """Load configuration from file"""
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                print("[CONFIG] Loaded configuration")
                return config
    except Exception as e:
        print(f"[WARNING] Failed to load config: {e}")
    return {}

def save_config():
    """Save configuration to file"""
    try:
        config = {
            'current_model': current_model['name'] if current_model else None,
            'current_voice': current_voice
        }
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        print("[CONFIG] Saved configuration")
    except Exception as e:
        print(f"[WARNING] Failed to save config: {e}")

def fetch_models():
    """Fetch available models from API"""
    global available_models, current_model
    try:
        response = requests.get(ENDPOINTS['models'])
        response.raise_for_status()
        data = response.json()
        available_models = data.get('models', [])
        
        # Load saved preference or use first model
        config = load_config()
        saved_model = config.get('current_model')
        
        if saved_model:
            for model in available_models:
                if model['name'] == saved_model:
                    current_model = model
                    break
        
        if not current_model and available_models:
            current_model = available_models[0]
            
        print(f"[MODELS] Loaded {len(available_models)} models")
        if current_model:
            print(f"[MODELS] Current model: {current_model['name']}")
        
        return True
    except Exception as e:
        print(f"[ERROR] Failed to fetch models: {e}")
        return False

def fetch_voices():
    """Fetch available voices from API"""
    global available_voices, current_voice
    try:
        response = requests.get(ENDPOINTS['voices'])
        response.raise_for_status()
        data = response.json()
        available_voices = data.get('voices', [])
        
        # Load saved preference or use first voice
        config = load_config()
        saved_voice = config.get('current_voice')
        
        if saved_voice and saved_voice in available_voices:
            current_voice = saved_voice
        elif available_voices:
            current_voice = available_voices[0]
            
        print(f"[VOICES] Loaded {len(available_voices)} voices")
        if current_voice:
            print(f"[VOICES] Current voice: {current_voice}")
        
        return True
    except Exception as e:
        print(f"[ERROR] Failed to fetch voices: {e}")
        # Use RoverSeer default voices if API fails
        available_voices = ["en_US-GlaDOS", "en_GB-jarvis", "en_US-amy", "en_GB-northern_english"]
        current_voice = "en_US-GlaDOS"
        return False

def add_to_history(role, content):
    """Add a message to the conversation history"""
    global conversation_history
    conversation_history.append({"role": role, "content": content})
    if len(conversation_history) > MAX_HISTORY_LENGTH * 2:
        conversation_history = conversation_history[-MAX_HISTORY_LENGTH * 2:]

def clear_conversation_history():
    """Clear the conversation history"""
    global conversation_history
    conversation_history = []
    print("[CONVERSATION] History cleared")

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
    """Get response from LLM endpoint with current model"""
    try:
        # Build messages including history
        messages = conversation_history.copy()
        messages.append({"role": "user", "content": text})
        
        response = requests.post(ENDPOINTS['llm'], json={
            'messages': messages,
            'model': current_model['name'] if current_model else 'tinydolphin:1.1b'
        })
        response.raise_for_status()
        
        ai_response = response.json()['response']
        
        # Add to history
        add_to_history("user", text)
        add_to_history("assistant", ai_response)
        
        return ai_response
    except Exception as e:
        print(f"[ERROR] LLM request failed: {e}")
        return None

def get_tts_audio(text):
    """Get TTS audio from endpoint"""
    try:
        response = requests.post(ENDPOINTS['tts'], json={
            'text': text,
            'voice': current_voice or 'en_US-GlaDOS'
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

def update_animation_state(state, tokens=None):
    """Update the current animation state"""
    global current_animation_state, animation_tokens
    print(f"[ANIMATION] State change: {current_animation_state} -> {state}")  # Debug
    current_animation_state = state
    animation_tokens = tokens
    
    # Update Rainbow HAT display based on state
    if rainbow_driver:
        try:
            if state == IDLE:
                rainbow_driver.clear_display()
                if hasattr(rainbow_driver, 'led_manager'):
                    rainbow_driver.led_manager.show_progress('idle')
            elif state == LISTENING:
                rainbow_driver.display_text("HEAR")
                if hasattr(rainbow_driver, 'led_manager'):
                    rainbow_driver.led_manager.show_progress('recording')
            elif state == HEARTBEAT:
                rainbow_driver.display_text("REC")
                if hasattr(rainbow_driver, 'led_manager'):
                    rainbow_driver.led_manager.show_progress('recording')
            elif state == PROCESSING:
                rainbow_driver.display_text("THINK")
                if hasattr(rainbow_driver, 'led_manager'):
                    rainbow_driver.led_manager.show_progress('llm')
            elif state == TALKING:
                rainbow_driver.display_text("TALK")
                if hasattr(rainbow_driver, 'led_manager'):
                    rainbow_driver.led_manager.show_progress('playing')
            elif state == MODEL_SELECT:
                rainbow_driver.display_text("MDL")
            elif state == VOICE_SELECT:
                rainbow_driver.display_text("VOX")
        except Exception as e:
            print(f"[ERROR] Failed to update display state: {e}")

def led_animation_loop():
    """Main animation loop for LEDs"""
    global led_animation_running
    phase = 0.0
    
    while led_animation_running:
        try:
            if current_animation_state == IDLE:
                # Calm breathing pattern
                breathing_animation(phase)
            elif current_animation_state == LISTENING:
                # Spectrum animation
                spectrum_animation(phase)
            elif current_animation_state == HEARTBEAT:
                # Heartbeat animation
                heartbeat_animation(phase)
            elif current_animation_state == PROCESSING:
                # Matrix animation
                matrix_animation(phase)
            elif current_animation_state == TALKING and animation_tokens:
                # Token visualization
                visualize_tokens(animation_tokens, phase)
            elif current_animation_state in [MODEL_SELECT, VOICE_SELECT]:
                # Selection mode animation
                selection_animation(phase)
            
            phase += 0.1
            time.sleep(0.01)
        except Exception as e:
            print(f"[LED] Animation error: {e}")
            time.sleep(0.1)

def breathing_animation(phase):
    """Create a calm breathing animation on Rainbow HAT LEDs"""
    if not rainbow_driver:
        return
    
    try:
        intensity = 0.3 + 0.7 * (0.5 + 0.5 * np.sin(phase))
        
        for i in range(7):  # Rainbow HAT has 7 LEDs
            wave = np.sin(phase + i * 0.5)
            if wave > 0.5:
                color = (0, int(64 * intensity), int(32 * intensity))  # Green-blue
            else:
                color = (0, int(32 * intensity), int(64 * intensity))  # Blue-green
            
            rainbow_driver.set_led(i, *color)
        rainbow_driver._apply_leds()
    except Exception as e:
        print(f"[LED] Breathing animation error: {e}")

def spectrum_animation(phase):
    """Create a spectrum animation"""
    if not rainbow_driver:
        return
    
    try:
        for i in range(7):
            pos_phase = i * 0.5 + phase
            r = int(64 * (0.5 + 0.5 * np.sin(pos_phase)))
            g = int(64 * (0.5 + 0.5 * np.sin(pos_phase + 2.094)))
            b = int(64 * (0.5 + 0.5 * np.sin(pos_phase + 4.189)))
            
            rainbow_driver.set_led(i, r, g, b)
        rainbow_driver._apply_leds()
    except Exception as e:
        print(f"[LED] Spectrum animation error: {e}")

def heartbeat_animation(phase):
    """Create a heartbeat animation"""
    if not rainbow_driver:
        return
    
    try:
        beat = np.sin(phase * 4) * 0.5 + 0.5
        intensity = 0.3 + 0.7 * beat
        
        for i in range(7):
            r = int(64 * intensity)
            g = int(16 * intensity)
            b = int(16 * intensity)
            rainbow_driver.set_led(i, r, g, b)
        rainbow_driver._apply_leds()
    except Exception as e:
        print(f"[LED] Heartbeat animation error: {e}")

def matrix_animation(phase):
    """Create a Matrix-style animation"""
    if not rainbow_driver:
        return
    
    try:
        for i in range(7):
            fall_phase = (i * 0.5 + phase) % (2 * np.pi)
            brightness = np.sin(fall_phase) * 0.5 + 0.5
            
            if np.random.random() < 0.1:
                brightness = 1.0
            
            g = int(64 * brightness)
            rainbow_driver.set_led(i, 0, g, 0)
        rainbow_driver._apply_leds()
    except Exception as e:
        print(f"[LED] Matrix animation error: {e}")

def selection_animation(phase):
    """Create a selection mode animation"""
    if not rainbow_driver:
        return
    
    try:
        # Highlight current selection with moving pattern
        for i in range(7):
            if i == selected_index % 7:
                # Selected position pulses
                intensity = 0.5 + 0.5 * np.sin(phase * 3)
                color = (int(64 * intensity), int(32 * intensity), 0)
            else:
                # Other positions are dim
                color = (8, 8, 8)
            
            rainbow_driver.set_led(i, *color)
        rainbow_driver._apply_leds()
    except Exception as e:
        print(f"[LED] Selection animation error: {e}")

def visualize_tokens(tokens, phase):
    """Visualize tokens on the LEDs"""
    if not rainbow_driver:
        return
    
    try:
        # Token colors (ROYGBIV palette)
        token_colors = [
            (64, 0, 0),     # Red
            (64, 32, 0),    # Orange
            (64, 64, 0),    # Yellow
            (0, 64, 0),     # Green
            (0, 32, 64),    # Blue
            (32, 0, 64),    # Indigo
            (64, 0, 32),    # Violet
        ]
        
        for i in range(7):
            if i < len(tokens):
                token = tokens[i]
                base_color = token_colors[token % len(token_colors)]
                pulse = 0.1 * np.sin(phase + token * 0.5)
                color = tuple(int(c * (0.8 + pulse)) for c in base_color)
                rainbow_driver.set_led(i, *color)
            else:
                rainbow_driver.set_led(i, 0, 0, 0)
        rainbow_driver._apply_leds()
    except Exception as e:
        print(f"[LED] Token visualization error: {e}")

def display_model_info():
    """Display current model info on display"""
    if rainbow_driver and current_model:
        # Extract short name for display
        model_name = current_model['name']
        # Take first 4 chars or until ':'
        short_name = model_name.split(':')[0][:4].upper()
        rainbow_driver.display_text(short_name)

def display_voice_info():
    """Display current voice info on display"""
    if rainbow_driver and current_voice:
        # Take first 4 chars of voice name
        short_name = current_voice[:4].upper()
        rainbow_driver.display_text(short_name)

def handle_model_selection():
    """Enter model selection mode"""
    global model_select_mode, selected_index
    
    if not available_models:
        print("[MODEL] No models available")
        return
    
    model_select_mode = True
    selected_index = 0
    
    # Find current model index
    if current_model:
        for i, model in enumerate(available_models):
            if model['name'] == current_model['name']:
                selected_index = i
                break
    
    update_animation_state(MODEL_SELECT)
    display_model_info()
    print(f"[MODEL] Entering model selection mode. Current: {current_model['name'] if current_model else 'None'}")
    
    # Play entering selection sound
    if buzzer_manager:
        buzzer_manager.play_tone_immediate(440, 0.1)  # A4 note

def handle_voice_selection():
    """Enter voice selection mode"""
    global voice_select_mode, selected_index
    
    if not available_voices:
        print("[VOICE] No voices available")
        return
    
    voice_select_mode = True
    selected_index = 0
    
    # Find current voice index
    if current_voice:
        for i, voice in enumerate(available_voices):
            if voice == current_voice:
                selected_index = i
                break
    
    update_animation_state(VOICE_SELECT)
    display_voice_info()
    print(f"[VOICE] Entering voice selection mode. Current: {current_voice}")
    
    # Play entering selection sound
    if buzzer_manager:
        buzzer_manager.play_tone_immediate(523, 0.1)  # C5 note

def confirm_model_selection():
    """Confirm current model selection"""
    global model_select_mode, current_model
    
    if selected_index < len(available_models):
        current_model = available_models[selected_index]
        model_select_mode = False
        
        # Save config
        save_config()
        
        print(f"[MODEL] Selected: {current_model['name']}")
        
        # Get model info for announcement
        model_info = f"Selected {current_model['name']}"
        if 'parameters' in current_model:
            model_info += f", {current_model['parameters']} parameters"
        
        # Announce selection
        tts_file = get_tts_audio(model_info)
        if tts_file:
            play_audio(tts_file)
        
        # Play success sound
        if buzzer_manager:
            buzzer_manager.play_sequence_async([440, 554, 659], [0.1, 0.1, 0.2])
        
        update_animation_state(IDLE)

def confirm_voice_selection():
    """Confirm current voice selection"""
    global voice_select_mode, current_voice
    
    if selected_index < len(available_voices):
        current_voice = available_voices[selected_index]
        voice_select_mode = False
        
        # Save config
        save_config()
        
        print(f"[VOICE] Selected: {current_voice}")
        
        # Announce selection with the new voice
        announcement = f"Voice changed to {current_voice}"
        tts_file = get_tts_audio(announcement)
        if tts_file:
            play_audio(tts_file)
        
        # Play success sound
        if buzzer_manager:
            buzzer_manager.play_sequence_async([523, 659, 784], [0.1, 0.1, 0.2])
        
        update_animation_state(IDLE)

def handle_button_press(button):
    """Handle button press events"""
    global model_select_mode, voice_select_mode, selected_index
    
    print(f"[BUTTON] handle_button_press called with button: {button}")  # Debug
    print(f"[BUTTON] Current modes - model_select: {model_select_mode}, voice_select: {voice_select_mode}")  # Debug
    
    # Different behavior based on current mode
    if model_select_mode:
        if button == 'A':
            # Previous model
            selected_index = (selected_index - 1) % len(available_models)
            display_model_info()
            # Play navigation sound
            if buzzer_manager:
                buzzer_manager.play_tone_immediate(392, 0.05)  # G4
        elif button == 'B':
            # Confirm selection
            confirm_model_selection()
        elif button == 'C':
            # Next model
            selected_index = (selected_index + 1) % len(available_models)
            display_model_info()
            # Play navigation sound
            if buzzer_manager:
                buzzer_manager.play_tone_immediate(440, 0.05)  # A4
        return None
    
    elif voice_select_mode:
        if button == 'A':
            # Previous voice
            selected_index = (selected_index - 1) % len(available_voices)
            display_voice_info()
            # Play navigation sound
            if buzzer_manager:
                buzzer_manager.play_tone_immediate(587, 0.05)  # D5
        elif button == 'B':
            # Confirm selection
            confirm_voice_selection()
        elif button == 'C':
            # Next voice
            selected_index = (selected_index + 1) % len(available_voices)
            display_voice_info()
            # Play navigation sound
            if buzzer_manager:
                buzzer_manager.play_tone_immediate(659, 0.05)  # E5
        return None
    
    else:
        # Normal mode
        if button == 'A':
            print("[BUTTON] Button A - entering model selection")  # Debug
            # Enter model selection
            handle_model_selection()
        elif button == 'B':
            print("[BUTTON] Button B - starting recording")  # Debug
            # Start recording
            # Play confirmation sound
            if buzzer_manager:
                buzzer_manager.play_tone_immediate(523, 0.1)  # C5
                time.sleep(0.1)
                buzzer_manager.play_tone_immediate(523, 0.1)  # C5 again
            return 'start_recording'
        elif button == 'C':
            print("[BUTTON] Button C - entering voice selection")  # Debug
            # Enter voice selection
            handle_voice_selection()
    
    return None

def find_headset_path():
    """Find the correct event device path for the headset"""
    try:
        for event_file in os.listdir('/dev/input/by-id'):
            if 'usb-Walmart_AB13X_Headset_Adapter' in event_file:
                return os.path.join('/dev/input/by-id', event_file)
        return '/dev/input/event0'
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
        return None

def verify_recording(file_path, min_size_kb=5):
    """Verify that the recording file exists and has reasonable size"""
    if not os.path.exists(file_path):
        print("[ERROR] Recording file not found")
        return False
    
    size_kb = os.path.getsize(file_path) / 1024
    print(f"[INFO] Recording file size: {size_kb:.1f}KB")
    
    if size_kb < min_size_kb:
        print(f"[ERROR] Recording file too small ({size_kb:.1f}KB < {min_size_kb}KB)")
        return False
    
    return True

def safe_terminate_process(proc):
    """Safely terminate a process"""
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

def play_countdown_sounds():
    """Play countdown beeps for recording"""
    if buzzer_manager:
        for i in range(3):
            buzzer_manager.play_tone_immediate(440, 0.1)
            time.sleep(0.9)
        # Final longer beep
        buzzer_manager.play_tone_immediate(523, 0.3)

def start_recording(duration=10):
    """Start the recording process with visual countdown"""
    print(f"[REC] Starting {duration} second recording...")
    
    # Update display for countdown
    countdown_thread = None
    if rainbow_driver:
        def countdown_display():
            for i in range(duration, 0, -1):
                if rainbow_driver:
                    rainbow_driver.display_number(i)
                time.sleep(1)
        
        countdown_thread = threading.Thread(target=countdown_display)
        countdown_thread.start()
    
    # Play countdown sounds in parallel
    sound_thread = threading.Thread(target=play_countdown_sounds)
    sound_thread.start()
    
    return countdown_thread

def parse_args():
    parser = argparse.ArgumentParser(description='RoverCub Refactored - Voice Assistant with Local API')
    parser.add_argument('--test', action='store_true', help='Run audio test')
    parser.add_argument('--text', action='store_true', help='Use text input instead of voice')
    parser.add_argument('--device', default='plughw:1,0', help='ALSA device')
    parser.add_argument('--rate', type=int, default=48000, help='Sample rate')
    parser.add_argument('--period', type=int, default=6000, help='Period size')
    return parser.parse_args()

def main():
    global rainbow_driver, buzzer_manager, led_animation_thread, led_animation_running
    
    args = parse_args()
    
    # Fetch models and voices from API
    if not fetch_models():
        print("[ERROR] Failed to initialize models")
        return
    
    if not fetch_voices():
        print("[WARNING] Using default voices")
    
    # Load configuration
    load_config()
    
    # Initialize Rainbow HAT
    try:
        if RainbowDriver and BuzzerManager:
            rainbow_driver = RainbowDriver(use_experimental_strip=False)
            buzzer_manager = BuzzerManager()
            print("[HAT] Rainbow HAT initialized")
            
            # Clear any stuck LEDs first
            print("[HAT] Clearing all LEDs...")
            for i in range(7):
                rainbow_driver.set_led(i, 0, 0, 0)
            rainbow_driver._apply_leds()
            rainbow_driver.clear_display()
            
            # Set up button handlers
            def button_a_handler():
                print("[BUTTON] A pressed!")  # Debug
                handle_button_press('A')
            
            def button_b_handler():
                print("[BUTTON] B pressed!")  # Debug
                action = handle_button_press('B')
                if action == 'start_recording':
                    # Trigger recording in main thread
                    # Set a flag that main loop checks
                    rainbow_driver._trigger_recording = True
            
            def button_c_handler():
                print("[BUTTON] C pressed!")  # Debug
                handle_button_press('C')
            
            rainbow_driver.buttons['A'].when_pressed = button_a_handler
            rainbow_driver.buttons['B'].when_pressed = button_b_handler
            rainbow_driver.buttons['C'].when_pressed = button_c_handler
            
            # Add recording trigger flag
            rainbow_driver._trigger_recording = False
            
            print("[HAT] Button handlers set up")
            print(f"[HAT] Button A object: {rainbow_driver.buttons.get('A')}")
            print(f"[HAT] Button B object: {rainbow_driver.buttons.get('B')}")
            print(f"[HAT] Button C object: {rainbow_driver.buttons.get('C')}")
            
        else:
            print("[WARNING] Rainbow HAT drivers not available - running without HAT support")
            rainbow_driver = None
            buzzer_manager = None
            
    except Exception as e:
        print(f"[WARNING] Rainbow HAT initialization failed: {e}")
        import traceback
        traceback.print_exc()
        rainbow_driver = None
        buzzer_manager = None
    
    # Start LED animation thread
    led_animation_running = True
    led_animation_thread = threading.Thread(target=led_animation_loop, daemon=True)
    led_animation_thread.start()
    
    # Initial state
    update_animation_state(SPECTRUM)
    print(f"[STATE] Changed to {SPECTRUM}")
    
    # Startup sound
    if buzzer_manager:
        buzzer_manager.play_sequence_async([262, 330, 392, 523], [0.1, 0.1, 0.1, 0.2])
    
    # Welcome message
    if rainbow_driver:
        if current_model:
            model_name = current_model['name'].split(':')[0][:8]
            rainbow_driver.scroll_text(f"HELLO {model_name}")
        else:
            rainbow_driver.scroll_text("HELLO ROVER")
    
    time.sleep(2)
    update_animation_state(IDLE)
    print(f"[STATE] Changed to {IDLE}")
    
    if args.text:
        # Text mode
        print("\n[INFO] Running in text mode. Type your message and press Enter.")
        print("Commands:")
        print("  'quit' - Exit")
        print("  'clear' - Clear conversation history")
        print("  'model' - Enter model selection mode")
        print("  'voice' - Enter voice selection mode")
        print("  'refresh' - Refresh models and voices from API")
        
        while True:
            try:
                model_name = current_model['name'] if current_model else 'No Model'
                user_input = input(f"\n[{model_name}] Your message: ").strip()
                
                if user_input.lower() == 'quit':
                    break
                elif user_input.lower() == 'clear':
                    clear_conversation_history()
                    if rainbow_driver:
                        rainbow_driver.display_text("CLR")
                    continue
                elif user_input.lower() == 'model':
                    handle_model_selection()
                    # Simple text-based model selection
                    print("\nAvailable models:")
                    for i, model in enumerate(available_models):
                        marker = ">" if model == current_model else " "
                        print(f"{marker} {i+1}. {model['name']}")
                    try:
                        choice = int(input("Select model number: ")) - 1
                        if 0 <= choice < len(available_models):
                            selected_index = choice
                            confirm_model_selection()
                    except:
                        print("Invalid selection")
                    continue
                elif user_input.lower() == 'voice':
                    handle_voice_selection()
                    # Simple text-based voice selection
                    print("\nAvailable voices:")
                    for i, voice in enumerate(available_voices):
                        marker = ">" if voice == current_voice else " "
                        print(f"{marker} {i+1}. {voice}")
                    try:
                        choice = int(input("Select voice number: ")) - 1
                        if 0 <= choice < len(available_voices):
                            selected_index = choice
                            confirm_voice_selection()
                    except:
                        print("Invalid selection")
                    continue
                elif user_input.lower() == 'refresh':
                    print("[REFRESH] Refreshing models and voices...")
                    fetch_models()
                    fetch_voices()
                    continue
                
                print("\n[AI] Getting response...")
                update_animation_state(PROCESSING)
                
                # Get LLM response
                response = get_llm_response(user_input)
                if response:
                    print(f"\n[{model_name}]: {response}")
                    
                    # Get TTS audio
                    update_animation_state(TALKING)
                    tts_file = get_tts_audio(response)
                    if tts_file:
                        play_audio(tts_file)
                
                update_animation_state(IDLE)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"[ERROR] Text mode error: {e}")
                update_animation_state(IDLE)
    
    else:
        # Voice mode
        CARD_DEV = args.device
        RATE = str(args.rate)
        TMP_WAV = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ptt_clip.wav')
        
        dev = initialize_headset()
        if not dev and not rainbow_driver:
            print("[ERROR] No input device found (neither headset nor Rainbow HAT)")
            return
        
        rec_proc = None
        button_pressed = False
        recording_duration = 10
        
        print("\n[INFO] Voice mode active")
        print("Button A: Select model")
        print("Button B: Start recording (hold to hear countdown)")
        print("Button C: Select voice")
        
        try:
            while True:
                # Check for Rainbow HAT button trigger
                if rainbow_driver and hasattr(rainbow_driver, '_trigger_recording') and rainbow_driver._trigger_recording:
                    rainbow_driver._trigger_recording = False
                    
                    # Start recording
                    update_animation_state(HEARTBEAT)
                    
                    # Start countdown
                    countdown_thread = start_recording(recording_duration)
                    
                    # Start recording process
                    rec_cmd = [
                        'arecord',
                        '-D', CARD_DEV,
                        '-r', '16000',
                        '-f', 'S16_LE',
                        '-c', '1',
                        '-t', 'wav',
                        '-d', str(recording_duration),
                        TMP_WAV
                    ]
                    
                    rec_proc = subprocess.Popen(['sudo'] + rec_cmd)
                    
                    # Wait for recording to complete
                    rec_proc.wait()
                    
                    if countdown_thread:
                        countdown_thread.join()
                    
                    # Play completion sound
                    if buzzer_manager:
                        buzzer_manager.play_sequence_async([659, 523, 440], [0.1, 0.1, 0.2])
                    
                    # Process recording
                    if verify_recording(TMP_WAV):
                        print("[STT] Converting speech to text...")
                        update_animation_state(LISTENING)
                        
                        transcript = transcribe_audio(TMP_WAV)
                        if transcript:
                            print(f"[STT] User said: {transcript}")
                            
                            print("[AI] Getting response...")
                            update_animation_state(PROCESSING)
                            
                            response = get_llm_response(transcript)
                            if response:
                                update_animation_state(TALKING)
                                
                                tts_file = get_tts_audio(response)
                                if tts_file:
                                    play_audio(tts_file)
                    
                    update_animation_state(IDLE)
                    
                    # Clean up temp file
                    if os.path.exists(TMP_WAV):
                        try:
                            os.remove(TMP_WAV)
                        except:
                            pass
                
                # Check headset button
                if dev:
                    try:
                        ev = dev.read_one()
                        if ev and ev.type == ecodes.EV_KEY:
                            key = categorize(ev)
                            if key.scancode == ecodes.KEY_PLAYPAUSE:
                                if key.keystate == key.key_down and not button_pressed:
                                    button_pressed = True
                                    print("[BUTTON] Headset button pressed")
                                    
                                    # Same recording process as above
                                    update_animation_state(HEARTBEAT)
                                    countdown_thread = start_recording(recording_duration)
                                    
                                    rec_cmd = [
                                        'arecord',
                                        '-D', CARD_DEV,
                                        '-r', '16000',
                                        '-f', 'S16_LE',
                                        '-c', '1',
                                        '-t', 'wav',
                                        '-d', str(recording_duration),
                                        TMP_WAV
                                    ]
                                    
                                    rec_proc = subprocess.Popen(['sudo'] + rec_cmd)
                                    rec_proc.wait()
                                    
                                    if countdown_thread:
                                        countdown_thread.join()
                                    
                                    if buzzer_manager:
                                        buzzer_manager.play_sequence_async([659, 523, 440], [0.1, 0.1, 0.2])
                                    
                                    if verify_recording(TMP_WAV):
                                        print("[STT] Converting speech to text...")
                                        update_animation_state(LISTENING)
                                        
                                        transcript = transcribe_audio(TMP_WAV)
                                        if transcript:
                                            print(f"[STT] User said: {transcript}")
                                            
                                            print("[AI] Getting response...")
                                            update_animation_state(PROCESSING)
                                            
                                            response = get_llm_response(transcript)
                                            if response:
                                                update_animation_state(TALKING)
                                                
                                                tts_file = get_tts_audio(response)
                                                if tts_file:
                                                    play_audio(tts_file)
                                    
                                    update_animation_state(IDLE)
                                    
                                    if os.path.exists(TMP_WAV):
                                        try:
                                            os.remove(TMP_WAV)
                                        except:
                                            pass
                                    
                                elif key.keystate == key.key_up and button_pressed:
                                    button_pressed = False
                                    print("[BUTTON] Headset button released")
                    except Exception as e:
                        if hasattr(e, 'errno') and e.errno == 11:  # EAGAIN
                            pass
                        else:
                            print(f"[ERROR] Reading from device: {e}")
                            time.sleep(0.1)
                
                time.sleep(0.01)
                
        except KeyboardInterrupt:
            print("\n[EXIT] Cleaning up...")
            led_animation_running = False
            if led_animation_thread:
                led_animation_thread.join(timeout=1)
            
            if rainbow_driver:
                rainbow_driver.shutdown()
            if buzzer_manager:
                buzzer_manager.shutdown()
            
            safe_terminate_process(rec_proc)
            if os.path.exists(TMP_WAV):
                try:
                    os.remove(TMP_WAV)
                except:
                    pass
            
            print("[DONE] Goodbye!")

if __name__ == "__main__":
    main() 