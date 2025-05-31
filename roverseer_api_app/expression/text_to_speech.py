import os
import subprocess
import time
from pathlib import Path

from config import VOICES_DIR, DEFAULT_VOICE, INTROS_DIR, AUDIO_DEVICE
from memory.usage_logger import log_tts_usage
from expression.sound_orchestration import play_sound_async, play_tts_tune
from utilities.text_processing import sanitize_for_speech


# -------- VOICE MANAGEMENT -------- #
def list_voice_ids():
    """List all available voice IDs from the voices directory"""
    base_names = set()
    for fname in os.listdir(VOICES_DIR):
        if fname.endswith(".onnx") and not fname.endswith(".onnx.json"):
            base = fname.rsplit("-", 1)[0]
            base_names.add(base)
    return sorted(base_names)


def find_voice_files(base_voice_id):
    """Find the model and config files for a voice ID"""
    pattern_prefix = f"{base_voice_id}-"
    model_file = None
    config_file = None
    for fname in os.listdir(VOICES_DIR):
        if fname.startswith(pattern_prefix):
            if fname.endswith(".onnx") and not fname.endswith(".onnx.json"):
                model_file = os.path.join(VOICES_DIR, fname)
            elif fname.endswith(".onnx.json"):
                config_file = os.path.join(VOICES_DIR, fname)
        if model_file and config_file:
            break
    if not model_file or not config_file:
        raise FileNotFoundError(f"Missing model or config for voice: {base_voice_id}")
    return model_file, config_file


def generate_tts_audio(text, voice_id=DEFAULT_VOICE, output_file=None):
    """Generate TTS audio using Piper"""
    # Play TTS tune
    play_sound_async(play_tts_tune, voice_id)
    
    # Sanitize text for speech (but keep original for logging)
    clean_text = sanitize_for_speech(text)
    
    # Find voice files
    model_path, config_path = find_voice_files(voice_id)
    
    # Generate output filename if not provided
    if not output_file:
        import uuid
        output_file = f"/tmp/{uuid.uuid4().hex}.wav"
    
    # Run Piper TTS with cleaned text
    tts_start_time = time.time()
    result = subprocess.run(
        ["/home/codemusic/roverseer_venv/bin/piper",
         "--model", model_path,
         "--config", config_path,
         "--output_file", output_file],
        input=clean_text.encode(),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    tts_processing_time = time.time() - tts_start_time
    
    if result.returncode != 0:
        error_msg = result.stderr.decode() if result.stderr else "Unknown TTS error"
        raise Exception(f"Piper TTS failed: {error_msg}")
    
    # Log TTS usage with ORIGINAL text (preserving think tags in logs)
    log_tts_usage(voice_id, text, output_file, tts_processing_time)
    
    return output_file, tts_processing_time


def speak_text(text, voice_id=DEFAULT_VOICE):
    """Generate TTS and play it on the device"""
    output_file, _ = generate_tts_audio(text, voice_id)
    
    try:
        # Play audio on device
        subprocess.run(["aplay", "-D", AUDIO_DEVICE, output_file], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error playing audio: {e}")
        return False
    finally:
        # Clean up temp file
        if os.path.exists(output_file):
            os.remove(output_file)


# -------- VOICE INTRO SYSTEM -------- #
def ensure_intros_dir():
    """Create the intros directory if it doesn't exist"""
    INTROS_DIR.mkdir(exist_ok=True)


def get_intro_path(voice_id):
    """Get the path for a voice's intro file"""
    ensure_intros_dir()
    return INTROS_DIR / f"{voice_id}_intro.wav"


def generate_voice_intro(voice_id):
    """Generate and save an intro for a specific voice"""
    intro_path = get_intro_path(voice_id)
    
    # Voice-specific intro messages
    intro_messages = {
        "en_GB-jarvis": "Ahh yes, hmm... let me gather my thoughts on this before I reply.",
        "en_US-amy": "Hello! Just a moment while I think about that.",
        "en_GB-northern_english": "Right then, let me have a think about that.",
        "en_US-danny": "Hey there! Give me a second to process that.",
        "en_GB-alba": "Curiouser, and Curiouser. Let me ponder on that for a minute.",
        "en_US-ryan": "Hi! I'm processing your query now.",
    }
    
    # Default intro if voice not in predefined messages
    default_intro = "Curious, let me think about that."
    intro_text = intro_messages.get(voice_id, default_intro)
    
    try:
        model_path, config_path = find_voice_files(voice_id)
        
        # Generate intro audio
        result = subprocess.run(
            ["/home/codemusic/roverseer_venv/bin/piper",
             "--model", model_path,
             "--config", config_path,
             "--output_file", str(intro_path)],
            input=intro_text.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        if result.returncode == 0:
            print(f"Generated intro for voice: {voice_id}")
            return intro_path
        else:
            print(f"Failed to generate intro for {voice_id}: {result.stderr.decode()}")
            return None
            
    except Exception as e:
        print(f"Error generating intro for {voice_id}: {e}")
        return None


def play_voice_intro(voice_id):
    """Play the intro for a specific voice, generating it if needed"""
    intro_path = get_intro_path(voice_id)
    
    # Generate intro if it doesn't exist
    if not intro_path.exists():
        print(f"Intro not found for {voice_id}, generating...")
        generated_path = generate_voice_intro(voice_id)
        if not generated_path:
            return False
    
    # Play the intro
    try:
        subprocess.run(["aplay", "-D", AUDIO_DEVICE, str(intro_path)])
        return True
    except Exception as e:
        print(f"Error playing intro for {voice_id}: {e}")
        return False


def get_voice_info():
    """Get information about available voices"""
    voices = list_voice_ids()
    return {
        "available_voices": voices,
        "default_voice": DEFAULT_VOICE,
        "voices_directory": VOICES_DIR,
        "voice_count": len(voices)
    }  