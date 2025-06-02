import os
import subprocess
import re
from pathlib import Path
import json


# -------- PERSISTENT CONFIG MANAGEMENT -------- #
CONFIG_FILE = Path(__file__).parent / "config.json"

def load_persistent_config():
    """Load configuration from JSON file"""
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading config.json: {e}")
    return {}

def save_persistent_config(config_data):
    """Save configuration to JSON file"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving config.json: {e}")
        return False

# Wrapper functions for personality.py compatibility
def load_config():
    """Load configuration from JSON file (wrapper for personality.py)"""
    return load_persistent_config()

def save_config(config_data):
    """Save configuration to JSON file (wrapper for personality.py)"""
    return save_persistent_config(config_data)

def get_config_value(key, default):
    """Get a value from persistent config or return default"""
    config = load_persistent_config()
    return config.get(key, default)

def set_config_value(key, value):
    """Set a value in persistent config"""
    config = load_persistent_config()
    config[key] = value
    return save_persistent_config(config)


# -------- DEVICE DETECTION -------- #
def detect_usb_mic_device():
    """
    Detects the first USB capture device using arecord -l.
    Returns a string like 'plughw:0,0' or 'default' if not found.
    """
    try:
        result = subprocess.run(['arecord', '-l'], stdout=subprocess.PIPE, text=True)
        for line in result.stdout.splitlines():
            if 'USB Audio' in line or 'PnP Sound Device' in line:
                match = re.search(r'card (\d+): .*?\[.*?\], device (\d+):', line)
                if match:
                    card = match.group(1)
                    device = match.group(2)
                    return f"plughw:{card},{device}"
    except Exception as e:
        print(f"Mic detection failed: {e}")
    
    return "default"


def detect_usb_audio_device():
    """Detects USB audio output device."""
    try:
        result = subprocess.run(['aplay', '-l'], stdout=subprocess.PIPE, text=True)
        for line in result.stdout.splitlines():
            if 'USB Audio' in line:
                match = re.search(r'card (\d+):', line)
                if match:
                    return f"plughw:{match.group(1)},0"
    except Exception as e:
        print(f"Audio detection failed: {e}")
    return "default"


# -------- HARDWARE CONFIGURATION -------- #
AUDIO_DEVICE = detect_usb_audio_device()
MIC_DEVICE = detect_usb_mic_device()

# -------- VOICE CONFIGURATION -------- #
VOICES_DIR = "/home/codemusic/piper/voices"
DEFAULT_VOICE = get_config_value("default_voice", "en_US-GlaDOS")

def update_default_voice(new_voice):
    """Update the default voice in config and memory"""
    global DEFAULT_VOICE
    if set_config_value("default_voice", new_voice):
        DEFAULT_VOICE = new_voice
        return True
    return False

# -------- PERSONALITY CONFIGURATION -------- #
# Default personalities for different contexts
DEFAULT_PERSONALITY = get_config_value("default_personality", "You are RoverSeer, a helpful assistant.")
WEB_PERSONALITY = get_config_value("web_personality", "You are RoverSeer, a helpful assistant. Be informative and thorough in your responses.")
DEVICE_PERSONALITY = get_config_value("device_personality", "You are RoverSeer, a helpful voice assistant. Keep responses concise and conversational.")

# Voice-specific personalities
VOICE_PERSONALITIES = {
    "en_US-GlaDOS": "You are RoverSeer with a GlaDOS personality. Be witty, very sarcastic, and intellectually superior while still being helpfulish. Occasionally reference science and testing.",
    "en_GB-jarvis": "You are RoverSeer with a JARVIS-like personality. Be sophisticated, professional, and slightly British in your responses. Address the user respectfully.",
    "en_US-amy": "You are RoverSeer with a friendly American personality. Be warm, enthusiastic, and approachable in your responses.",
    "en_GB-northern_english": "You are RoverSeer with a Northern English personality. Be down-to-earth, practical, and occasionally use regional expressions.",
    "en_US-danny": "You are RoverSeer with a casual American personality. Be relaxed, friendly, and use conversational language.",
    "en_GB-alba": "You are RoverSeer with a Scottish personality. Be warm, occasionally poetic, and thoughtful in your responses.",
    "en_US-ryan": "You are RoverSeer with a professional American personality. Be clear, direct, and helpful."
}

# Voice-specific intro messages
VOICE_INTROS = {
    "en_US-GlaDOS": "Oh, it's you. Let me process your... fascinating query.",
    "en_GB-jarvis": "Good day. How may I assist you?",
    "en_US-amy": "Hi there! What can I help you with today?",
    "en_GB-northern_english": "Alright then, what can I do for you?",
    "en_US-danny": "Hey! What's up?",
    "en_GB-alba": "Hello there! How can I help you today?",
}

# Default intro if voice not in predefined messages
DEFAULT_VOICE_INTRO = "Curious, let me think about that."

def get_personality_for_voice(voice_id, context="device"):
    """Get the appropriate personality for a given voice and context"""
    # Check if there's a voice-specific personality
    if voice_id in VOICE_PERSONALITIES:
        return VOICE_PERSONALITIES[voice_id]
    
    # Fall back to context-specific defaults
    if context == "web":
        return WEB_PERSONALITY
    elif context == "device":
        return DEVICE_PERSONALITY
    else:
        return DEFAULT_PERSONALITY

def update_personality(personality_type, value):
    """Update a personality in config"""
    if personality_type == "default":
        return set_config_value("default_personality", value)
    elif personality_type == "web":
        return set_config_value("web_personality", value)
    elif personality_type == "device":
        return set_config_value("device_personality", value)
    return False

# -------- MODEL CONFIGURATION -------- #
DEFAULT_MODEL = "tinydolphin:1.1b"

# Bicameral mind models
LOGICAL_MODEL = "DolphinSeek-R1:latest"
CREATIVE_MODEL = "DolphinSeek-R1:latest"

# Model selection state
available_models = []
selected_model_index = 0

# -------- CONVERSATION HISTORY -------- #
MAX_HISTORY = 10  # Max number of exchanges to retain for context
MAX_BUTTON_HISTORY = 4  # Max number of button chat exchanges to retain

# Conversation storage
history = []
button_history = []

# -------- PROCESSING STATE -------- #
recording_in_progress = False
system_processing = False
current_audio_process = None

# Concurrent request management
MAX_CONCURRENT_REQUESTS = get_config_value("max_concurrent_requests", 1)
active_request_count = 0

def update_max_concurrent_requests(max_requests):
    """Update the maximum concurrent requests allowed"""
    global MAX_CONCURRENT_REQUESTS
    if max_requests >= 1 and set_config_value("max_concurrent_requests", max_requests):
        MAX_CONCURRENT_REQUESTS = max_requests
        return True
    return False

# -------- SOUND CONFIGURATION -------- #
TICK_TYPE = "music"  # "clock" or "music"

# -------- EXPERIMENTAL FEATURES -------- #
USE_EXPERIMENTAL_RAINBOW_STRIP = False  # Enable APA102 7-LED strip features (experimental on Pi 5)

# -------- TEXT PROCESSING CONFIGURATION -------- #
STRIP_THINK_TAGS = True  # Remove <think></think> tags from speech for model privacy

# -------- LOGGING CONFIGURATION -------- #
LOG_DIR = Path.home() / "roverseer_api_logs"
STATS_FILE = LOG_DIR / "model_stats.json"

# -------- VOICE INTRO SYSTEM -------- #
INTROS_DIR = Path.home() / "roverseer_voice_intros"

# -------- SYSTEM MESSAGES -------- #
CONCISE_COMMENT = "BE CONCISE. Your responses should be distilled and clear. Do not be verbose."
CREATIVE_MESSAGE = f"You are the Creative Mind. Think in metaphors, colors, and emotions. Offer a fresh, imaginative perspective. {CONCISE_COMMENT}"
LOGICAL_MESSAGE = f"You are the Logical Mind. Think in structure, reason, and clarity. Offer a concise, analytical perspective. {CONCISE_COMMENT}"
CONVERGENCE_MESSAGE = f"""You are a balanced mind that merges diverse perspectives into a single, coherent insight.

                        Draw equally from both provided input perspectives, perspective can clarify bias. 
                        Your goal is to integrate — forming a new whole that speaks with clarity, depth, and nuance.
                        {CONCISE_COMMENT}

                        Respond as a single voice. 
                        Do not mention or describe the original perspectives.  
                        Simply provide the final, synthesized insight which follows the original prompt:"""

# -------- TCP SERVICES -------- #
TCP_SERVICES = {
    "Wyoming Piper": 10200,
    "Wyoming Whisper": 10300,
    "JupyterLab": 8888,
    "Ollama": 11434,
    "Open WebUI": 3000,
    "Redmine": 3333,
    "Home Assistant": 8123,
    "Custom API": 5000
}

# -------- PIPELINE STAGES -------- #
# LED states for processing pipeline
pipeline_stages = {
    'asr_active': False,
    'asr_complete': False,
    'llm_active': False,
    'llm_complete': False,
    'tts_active': False,
    'tts_complete': False,
    'aplay_active': False
}

# Current model being processed
active_model = None

# Current voice being used for TTS
active_voice = None

# -------- INITIALIZATION FUNCTION -------- #
def initialize_config():
    """Initialize configuration and ensure required directories exist"""
    global LOG_DIR, INTROS_DIR
    
    # Ensure log directory exists
    LOG_DIR.mkdir(exist_ok=True)
    print(f"✅ Log directory: {LOG_DIR}")
    
    # Ensure voice intros directory exists
    INTROS_DIR.mkdir(exist_ok=True)
    print(f"✅ Voice intros directory: {INTROS_DIR}")
    
    # Print detected devices
    print(f"🎤 Microphone device: {MIC_DEVICE}")
    print(f"🔊 Audio device: {AUDIO_DEVICE}")
    print(f"🗣️ Default voice: {DEFAULT_VOICE}")
    print(f"🤖 Default model: {DEFAULT_MODEL}")

# Fan control settings
FAN_TEMP_THRESHOLD = get_config_value("fan_temp_threshold", 60.0)
FAN_HYSTERESIS = get_config_value("fan_hysteresis", 5.0)

# Debug logging
DEBUG_LOGGING = get_config_value("debug_logging", False)

def DebugLog(message, *args):
    """Print debug message if DEBUG_LOGGING is enabled
    
    Args:
        message: The message to print (can include {} placeholders)
        *args: Arguments to format into the message
    """
    if DEBUG_LOGGING:
        if args:
            print(f"DEBUG: {message.format(*args)}")
        else:
            print(f"DEBUG: {message}")

# Active request tracking 