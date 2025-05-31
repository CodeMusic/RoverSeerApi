import os
import subprocess
import re
from pathlib import Path


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
DEFAULT_VOICE = os.environ.get("PIPER_VOICE", "en_GB-jarvis")

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

# -------- SOUND CONFIGURATION -------- #
TICK_TYPE = "music"  # "clock" or "music"

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