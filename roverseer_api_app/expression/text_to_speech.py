import os
import subprocess
import time
from pathlib import Path

from config import VOICES_DIR, DEFAULT_VOICE, INTROS_DIR, AUDIO_DEVICE
from memory.usage_logger import log_tts_usage, log_error
from expression.sound_orchestration import play_sound_async, play_tts_tune
from helpers.text_processing_helper import TextProcessingHelper
from helpers.logging_helper import LoggingHelper

# Import the logging functions directly for this module
log_error = LoggingHelper.log_error
log_tts_usage = LoggingHelper.log_tts_usage


# -------- VOICE MANAGEMENT -------- #
def filter_hidden_files(files):
    """Filter out macOS and system hidden files from a list of files"""
    return [f for f in files if not f.startswith('.') and not f.startswith('_') and f != 'Thumbs.db']


def list_voice_ids():
    """List all available voice IDs from the voices directory (flat list for device compatibility)"""
    return get_categorized_voices()['flat_list']


def get_categorized_voices():
    """Get voices organized by categories (subdirectories) with fallback to flat list"""
    flat_voices = set()
    categorized_voices = {}
    uncategorized_voices = set()
    
    # First, scan the root voices directory for uncategorized voices
    try:
        for fname in filter_hidden_files(os.listdir(VOICES_DIR)):
            if fname.endswith(".onnx") and not fname.endswith(".onnx.json"):
                base = fname.rsplit("-", 1)[0]
                uncategorized_voices.add(base)
    except Exception as e:
        print(f"Error scanning voices directory: {e}")
    
    # Then scan subdirectories for categorized voices
    try:
        for item in filter_hidden_files(os.listdir(VOICES_DIR)):
            item_path = os.path.join(VOICES_DIR, item)
            if os.path.isdir(item_path):
                category_name = item
                category_voices = set()
                
                # Scan this category directory
                try:
                    for fname in filter_hidden_files(os.listdir(item_path)):
                        if fname.endswith(".onnx") and not fname.endswith(".onnx.json"):
                            base = fname.rsplit("-", 1)[0]
                            category_voices.add(base)
                            flat_voices.add(base)  # Also add to flat list
                except Exception as e:
                    print(f"Error scanning category {category_name}: {e}")
                
                if category_voices:
                    categorized_voices[category_name] = sorted(category_voices)
    except Exception as e:
        print(f"Error scanning for voice categories: {e}")
    
    # Add uncategorized voices to flat list
    flat_voices.update(uncategorized_voices)
    
    # Add uncategorized voices to categorized structure if any exist
    if uncategorized_voices:
        categorized_voices['uncategorized'] = sorted(uncategorized_voices)
    
    return {
        'flat_list': sorted(flat_voices),
        'categorized': categorized_voices
    }


def find_voice_files(base_voice_id):
    """Find the model and config files for a voice ID (searches root and subdirectories)"""
    pattern_prefix = f"{base_voice_id}"
    model_file = None
    config_file = None
    
    # Debug logging
    print(f"Looking for voice files with prefix: {pattern_prefix}")
    print(f"In directory: {VOICES_DIR}")
    
    # Search in root directory first
    try:
        files_in_dir = filter_hidden_files(os.listdir(VOICES_DIR))
        matching_files = [f for f in files_in_dir if f.startswith(pattern_prefix)]
        print(f"Root files starting with {pattern_prefix}: {matching_files}")
        
        for fname in files_in_dir:
            if fname.startswith(pattern_prefix):
                if fname.endswith(".onnx") and not fname.endswith(".onnx.json"):
                    model_file = os.path.join(VOICES_DIR, fname)
                elif fname.endswith(".onnx.json"):
                    config_file = os.path.join(VOICES_DIR, fname)
            if model_file and config_file:
                break
    except Exception as e:
        print(f"Error listing root directory: {e}")
    
    # If not found in root, search subdirectories
    if not (model_file and config_file):
        try:
            for item in filter_hidden_files(os.listdir(VOICES_DIR)):
                item_path = os.path.join(VOICES_DIR, item)
                if os.path.isdir(item_path):
                    try:
                        subdir_files = filter_hidden_files(os.listdir(item_path))
                        matching_subfiles = [f for f in subdir_files if f.startswith(pattern_prefix)]
                        print(f"Subdir {item} files starting with {pattern_prefix}: {matching_subfiles}")
                        
                        for fname in subdir_files:
                            if fname.startswith(pattern_prefix):
                                if fname.endswith(".onnx") and not fname.endswith(".onnx.json"):
                                    model_file = os.path.join(item_path, fname)
                                elif fname.endswith(".onnx.json"):
                                    config_file = os.path.join(item_path, fname)
                            if model_file and config_file:
                                break
                    except Exception as e:
                        print(f"Error scanning subdirectory {item}: {e}")
                
                if model_file and config_file:
                    break
        except Exception as e:
            print(f"Error scanning subdirectories: {e}")
    
    if not model_file or not config_file:
        # More detailed error message
        print(f"Missing files for voice {base_voice_id}:")
        print(f"  Model file (.onnx): {model_file}")
        print(f"  Config file (.onnx.json): {config_file}")
        raise FileNotFoundError(f"Missing model or config for voice: {base_voice_id}")
    
    print(f"Found voice files: {model_file}, {config_file}")
    return model_file, config_file


def generate_tts_audio(text, voice_id=DEFAULT_VOICE, output_file=None):
    """Generate TTS audio using Piper"""
    # Validate voice_id - use default if empty
    if not voice_id:
        print(f"Warning: Empty voice_id provided, using default: {DEFAULT_VOICE}")
        voice_id = DEFAULT_VOICE
    
    # Set active voice for this TTS operation
    import config
    config.active_voice = voice_id
    
    # Play tune to indicate start
    play_sound_async(play_tts_tune)
    
    # Sanitize text for speech (this preserves think tags in logs but removes them from speech)
    clean_text = TextProcessingHelper.sanitize_for_speech(text)
    
    try:
        # Find voice files
        model_path, config_path = find_voice_files(voice_id)
    except FileNotFoundError as e:
        # Log the error
        log_error("tts_voice_not_found", str(e), {
            "voice_id": voice_id,
            "available_voices": list_voice_ids()
        })
        
        # Try to fall back to a default voice
        print(f"Voice {voice_id} not found, trying fallback...")
        try:
            # Try without the quality suffix (e.g., "en_GB-GlaDOS" instead of "en_GB-GlaDOS-medium")
            if '-' in voice_id and voice_id.count('-') >= 3:
                fallback_id = '-'.join(voice_id.split('-')[:-1])
                print(f"Trying fallback voice: {fallback_id}")
                model_path, config_path = find_voice_files(fallback_id)
                voice_id = fallback_id  # Update voice_id for logging
            else:
                raise e
        except:
            # If that fails too, use first available voice
            available = list_voice_ids()
            if available:
                print(f"Using first available voice: {available[0]}")
                model_path, config_path = find_voice_files(available[0])
                voice_id = available[0]
            else:
                config.active_voice = None
                raise Exception("No voices available")
    
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
        # Log the error
        log_error("tts_generation_failed", error_msg, {
            "voice_id": voice_id,
            "return_code": result.returncode,
            "model_path": model_path,
            "config_path": config_path
        })
        # Clear active voice on error
        config.active_voice = None
        raise Exception(f"Piper TTS failed: {error_msg}")
    
    # Log TTS usage with ORIGINAL text (preserving think tags in logs)
    log_tts_usage(voice_id, text, output_file, tts_processing_time)
    
    # Clear active voice when done
    config.active_voice = None
    
    return output_file, tts_processing_time


def speak_text(text, voice_id=DEFAULT_VOICE):
    """Generate TTS and play it on the device"""
    # Validate voice_id - use default if empty
    if not voice_id:
        print(f"Warning: Empty voice_id provided in speak_text, using default: {DEFAULT_VOICE}")
        voice_id = DEFAULT_VOICE
        
    # Set active voice for the entire speak operation
    import config
    config.active_voice = voice_id
    
    try:
        output_file, _ = generate_tts_audio(text, voice_id)
        
        # Get orchestrator for proper state management
        from embodiment.pipeline_orchestrator import get_pipeline_orchestrator, SystemState
        orchestrator = get_pipeline_orchestrator()
        
        # Transition to audio playback stage
        orchestrator.transition_to_state(SystemState.EXPRESSING)
        
        # Play audio on device
        audio_process = subprocess.Popen(
            ["aplay", "-D", AUDIO_DEVICE, output_file],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Register process with orchestrator for cleanup tracking
        orchestrator.register_audio_process(audio_process)
        
        # Wait for completion
        audio_process.wait()
        
        # Properly complete the pipeline flow when audio finishes
        orchestrator.complete_pipeline_flow()
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error playing audio: {e}")
        # Handle error properly with orchestrator
        try:
            from embodiment.pipeline_orchestrator import get_pipeline_orchestrator
            orchestrator = get_pipeline_orchestrator()
            orchestrator.request_interruption()
        except:
            pass
        return False
    except Exception as e:
        print(f"Error in speak_text: {e}")
        # Handle error properly with orchestrator
        try:
            from embodiment.pipeline_orchestrator import get_pipeline_orchestrator
            orchestrator = get_pipeline_orchestrator()
            orchestrator.request_interruption()
        except:
            pass
        return False
    finally:
        # Clean up temp file
        if 'output_file' in locals() and os.path.exists(output_file):
            os.remove(output_file)
        # Clear active voice
        config.active_voice = None


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
    
    # Import voice intros from config
    from config import VOICE_INTROS, DEFAULT_VOICE_INTRO
    
    # Get intro text for this voice
    intro_text = VOICE_INTROS.get(voice_id, DEFAULT_VOICE_INTRO)
    
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


def debug_list_voices():
    """Debug function to list all voice files with their exact names"""
    print(f"\n=== Voice Files Debug ===")
    print(f"Looking in: {VOICES_DIR}")
    
    try:
        all_files = sorted(filter_hidden_files(os.listdir(VOICES_DIR)))
        print(f"Total files (after filtering hidden): {len(all_files)}")
        
        # Group by base name
        voice_groups = {}
        for fname in all_files:
            if fname.endswith('.onnx') or fname.endswith('.onnx.json'):
                # Extract base name (everything before the last dash)
                parts = fname.rsplit('-', 1)
                if len(parts) >= 2:
                    base_name = parts[0]
                    if base_name not in voice_groups:
                        voice_groups[base_name] = []
                    voice_groups[base_name].append(fname)
        
        print(f"\nFound {len(voice_groups)} voice groups:")
        for base, files in sorted(voice_groups.items()):
            print(f"\n{base}:")
            for f in files:
                print(f"  - {f}")
        
        # Also list what list_voice_ids returns
        print(f"\nlist_voice_ids() returns: {list_voice_ids()}")
        
    except Exception as e:
        print(f"Error listing voices: {e}")
    
    print("=== End Debug ===\n")


def get_voice_info():
    """Get information about available voices"""
    voices = list_voice_ids()
    
    # Run debug on first call
    debug_list_voices()
    
    return {
        "available_voices": voices,
        "default_voice": DEFAULT_VOICE,
        "voices_directory": VOICES_DIR,
        "voice_count": len(voices)
    }  