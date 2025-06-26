from flask import Flask, request, jsonify, send_file, redirect, render_template_string, send_file, url_for
from flask_cors import CORS
from flasgger import Swagger, swag_from
from faster_whisper import WhisperModel
import os
import requests
import subprocess
import uuid
import re
import json
import socket
import time
import threading
import random
from datetime import datetime
from pathlib import Path
import hashlib

import sys
sys.path.insert(0, "/home/codemusic/custom_drivers")

from rainbow_driver import RainbowDriver
from gpiozero.tones import Tone

# -------- SOUND QUEUE SYSTEM -------- #
import queue

# Global sound queue and worker thread
sound_queue = queue.Queue()
sound_worker_thread = None
sound_worker_running = False




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




AUDIO_DEVICE = detect_usb_audio_device()
MIC_DEVICE = detect_usb_mic_device()  # Initialize microphone device
VOICES_DIR = "/home/codemusic/piper/voices"
DEFAULT_MODEL = "tinydolphin:1.1b"
DEFAULT_VOICE = os.environ.get("PIPER_VOICE", "en_GB-jarvis")
history = []
MAX_HISTORY = 10  # Max number of exchanges to retain for context

# Separate history for button-initiated conversations
button_history = []
MAX_BUTTON_HISTORY = 4  # Max number of button chat exchanges to retain

# -------- VOICE INTRO SYSTEM -------- #
INTROS_DIR = Path.home() / "roverseer_voice_intros"


def sound_queue_worker():
    """Worker thread that processes sounds from the queue sequentially"""
    global sound_worker_running
    while sound_worker_running:
        try:
            # Wait for a sound task with timeout
            sound_task = sound_queue.get(timeout=0.5)
            if sound_task is None:  
                break
                
            # Execute the sound function
            func, args, kwargs = sound_task
            try:
                func(*args, **kwargs)
            except Exception as e:
                print(f"Error playing queued sound: {e}")
            finally:
                sound_queue.task_done()
                
        except queue.Empty:
            continue

def start_sound_queue_worker():
    """Start the sound queue worker thread"""
    global sound_worker_thread, sound_worker_running
    if not sound_worker_running:
        sound_worker_running = True
        sound_worker_thread = threading.Thread(target=sound_queue_worker)
        sound_worker_thread.daemon = True
        sound_worker_thread.start()
        print("Sound queue worker started")

def stop_sound_queue_worker():
    """Stop the sound queue worker thread"""
    global sound_worker_running
    if sound_worker_running:
        sound_worker_running = False
        sound_queue.put(None)  # Poison pill
        if sound_worker_thread:
            sound_worker_thread.join(timeout=2)
        print("Sound queue worker stopped")

# Global state for audio coordination
tune_playing = threading.Event()
current_display_value = None  # Track what's currently on display

# Global state for model selection and recording
available_models = []
selected_model_index = 0

# Global audio playback process for interruption
current_audio_process = None

# Pipeline stage tracking for LED states
pipeline_stages = {
    'asr_active': False,
    'asr_complete': False,
    'llm_active': False,
    'llm_complete': False,
    'tts_active': False,
    'tts_complete': False,
    'aplay_active': False
}

def update_pipeline_leds():
    """Update LEDs based on current pipeline stage states"""
    if not rainbow:
        return
        
    # Determine LED states based on pipeline progress
    if pipeline_stages['aplay_active']:
        # Audio playback: all LEDs should blink (handled by blink thread)
        return
    
    # Set solid LEDs based on completed stages
    if pipeline_stages['asr_complete']:
        rainbow.button_leds['A'].on()  # Red solid
    else:
        rainbow.button_leds['A'].off()
        
    if pipeline_stages['llm_complete']:
        rainbow.button_leds['B'].on()  # Green solid
    else:
        rainbow.button_leds['B'].off()
        
    if pipeline_stages['tts_complete']:
        rainbow.button_leds['C'].on()  # Blue solid
    else:
        rainbow.button_leds['C'].off()

def reset_pipeline_stages():
    """Reset all pipeline stages to inactive"""
    global pipeline_stages
    for key in pipeline_stages:
        pipeline_stages[key] = False
    # Turn off all LEDs
    if rainbow:
        for led in ['A', 'B', 'C']:
            rainbow.button_leds[led].off()

def blink_processing_led(led_color='B'):
    """Blink the appropriate LED during processing"""
    global system_processing, stop_processing_led
    
    while system_processing and not stop_processing_led.is_set():
        if rainbow:
            # Check which stage is active and blink appropriate LED
            if pipeline_stages.get('asr_active') and led_color == 'A':
                rainbow.button_leds['A'].on()
            elif pipeline_stages.get('llm_active') and led_color == 'B':
                rainbow.button_leds['B'].on()
            elif pipeline_stages.get('tts_active') and led_color == 'C':
                rainbow.button_leds['C'].on()
            elif pipeline_stages.get('aplay_active'):
                # All LEDs blink during playback
                for led in ['A', 'B', 'C']:
                    rainbow.button_leds[led].on()
        
        time.sleep(0.3)
        
        if stop_processing_led.is_set():
            break
            
        if rainbow:
            # Turn off the blinking LED(s)
            if pipeline_stages.get('asr_active') and led_color == 'A':
                rainbow.button_leds['A'].off()
            elif pipeline_stages.get('llm_active') and led_color == 'B':
                rainbow.button_leds['B'].off()
            elif pipeline_stages.get('tts_active') and led_color == 'C':
                rainbow.button_leds['C'].off()
            elif pipeline_stages.get('aplay_active'):
                # All LEDs off
                for led in ['A', 'B', 'C']:
                    rainbow.button_leds[led].off()
        
        time.sleep(0.3)
        
        # After turning off, update to show solid LEDs
        if not pipeline_stages.get('aplay_active'):
            update_pipeline_leds()

def interrupt_audio_playback():
    """Interrupt any currently playing audio"""
    global current_audio_process
    
    if current_audio_process and current_audio_process.poll() is None:
        # Audio is still playing, terminate it
        try:
            current_audio_process.terminate()
            current_audio_process.wait(timeout=1)
        except:
            try:
                current_audio_process.kill()
            except:
                pass
        
        current_audio_process = None
        
        # Reset pipeline since we interrupted
        reset_pipeline_stages()
        
        # Clear the sound queue to prevent queued sounds from playing
        while not sound_queue.empty():
            try:
                sound_queue.get_nowait()
            except:
                break
        
        print("Audio playback interrupted")
        return True
    
    return False

TICK_TYPE = "music" # "clock" or "music"

# Define the two agent models
logical_model = "DolphinSeek-R1:latest"
creative_model = "DolphinSeek-R1:latest"#"LaPenguin:latest"

# Initialize convergence model as None - will be set randomly for each request
convergence_model = None

consice_comment = "BE CONCISE. Your respones should be distilled and clear. Do not be verbose."
creative_message = f"You are the Creative Mind. Think in metaphors, colors, and emotions. Offer a fresh, imaginative perspective. {consice_comment}"
logical_message = f"You are the Logical Mind. Think in structure, reason, and clarity. Offer a concise, analytical perspective. {consice_comment}"
convergence_message = f"""You are a balanced mind that merges diverse perspectives into a single, coherent` insight.

                        Draw equally from both provided input perspectives, perspective can clarify bias. 
                        Your goal is to integrate — forming a new whole that speaks with clarity, depth, and nuance.
                        {consice_comment}

                        Respond as a single voice. 
                        Do not mention or describe the original perspectives.  
                        Simply provide the final, synthesized insight which follows the original prompt:"""

recording_in_progress = False
# Global system processing indicator
system_processing = False
processing_led_thread = None
stop_processing_led = threading.Event()

# -------- LOGGING INFRASTRUCTURE -------- #
LOG_DIR = Path.home() / "roverseer_api_logs"
STATS_FILE = LOG_DIR / "model_stats.json"

def ensure_log_dir():
    """Create the log directory if it doesn't exist"""
    LOG_DIR.mkdir(exist_ok=True)

def load_model_stats():
    """Load model statistics from JSON file"""
    ensure_log_dir()  # Make sure directory exists
    if STATS_FILE.exists():
        try:
            with open(STATS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_model_stats(stats):
    """Save model statistics to JSON file"""
    ensure_log_dir()  # Make sure directory exists
    with open(STATS_FILE, 'w') as f:
        json.dump(stats, f, indent=2)

def update_model_runtime(model_name, runtime):
    """Update runtime statistics for a model"""
    stats = load_model_stats()
    
    if model_name not in stats:
        stats[model_name] = {
            "total_runtime": 0,
            "run_count": 0,
            "average_runtime": 0,
            "last_runtime": 0,
            "last_run": None
        }
    
    stats[model_name]["total_runtime"] += runtime
    stats[model_name]["run_count"] += 1
    stats[model_name]["average_runtime"] = stats[model_name]["total_runtime"] / stats[model_name]["run_count"]
    stats[model_name]["last_runtime"] = runtime
    stats[model_name]["last_run"] = datetime.now().isoformat()
    
    save_model_stats(stats)
    return stats[model_name]["average_runtime"]

def get_model_runtime(model_name):
    """Get average runtime for a model"""
    stats = load_model_stats()
    if model_name in stats:
        return stats[model_name].get("average_runtime", None)
    return None

def get_log_filename(log_type):
    """Get the log filename for today's date"""
    today = datetime.now().strftime("%Y-%m-%d")
    return LOG_DIR / f"{log_type}_{today}.log"

def log_llm_usage(model_name, system_message, user_prompt, response, processing_time=None):
    """Log LLM usage to daily file"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(get_log_filename("llm_usage"), "a", encoding="utf-8") as f:
        f.write(f"[ {model_name} - {timestamp}, {system_message}\n")
        f.write(f"  User: {user_prompt}\n")
        f.write(f"  {model_name}: {response}")
        if processing_time:
            f.write(f" [{processing_time:.2f}s]")
        f.write("\n--\n\n")

def log_penphin_mind_usage(logical_model, creative_model, convergence_model, 
                          system_message, user_prompt, 
                          logical_response, logical_time,
                          creative_response, creative_time,
                          convergence_response, convergence_time):
    """Log PenphinMind bicameral flow to daily file"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    total_time = logical_time + creative_time + convergence_time
    
    with open(get_log_filename("penphin_mind"), "a", encoding="utf-8") as f:
        f.write(f"[ Logical: {logical_model}, Creative: {creative_model}, Convergence: {convergence_model}\n")
        f.write(f"  {timestamp}, {system_message}\n")
        f.write(f"  User: {user_prompt}\n")
        f.write(f"  \n\nLogical Agent's Reply: {logical_response} [{logical_time:.2f}s]\n")
        f.write(f"  \n\nCreative Agent's Reply: {creative_response} [{creative_time:.2f}s]\n")
        f.write(f"  \n\nConvergence Reply: {convergence_response} [{convergence_time:.2f}s]\n")
        f.write(f"  \n")
        f.write(f"  Total processing time = {total_time:.2f}s\n")
        f.write("]\n\n")

def log_asr_usage(audio_file, transcript, processing_time=None):
    """Log ASR (Automatic Speech Recognition) usage to daily file"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(get_log_filename("asr_usage"), "a", encoding="utf-8") as f:
        f.write(f"[ ASR - {timestamp}\n")
        f.write(f"  Audio: {audio_file}\n")
        f.write(f"  Transcript: {transcript}")
        if processing_time:
            f.write(f" [{processing_time:.2f}s]")
        f.write("\n--\n\n")

def log_tts_usage(voice_model, text, output_file=None, processing_time=None):
    """Log TTS (Text-to-Speech) usage to daily file"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(get_log_filename("tts_usage"), "a", encoding="utf-8") as f:
        f.write(f"[ TTS - {timestamp}\n")
        f.write(f"  Voice: {voice_model}\n")
        f.write(f"  Text: {text}\n")
        if output_file:
            f.write(f"  Output: {output_file}\n")
        if processing_time:
            f.write(f"  Processing time: {processing_time:.2f}s\n")
        f.write("--\n\n")

def get_model_average_runtimes():
    """Parse LLM usage logs to calculate average runtime for each model"""
    model_runtimes = {}
    model_counts = {}
    
    try:
        log_file = get_log_filename("llm_usage")
        if not log_file.exists():
            return {}
            
        with open(log_file, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Parse log entries
        entries = content.split("\n--\n")
        for entry in entries:
            if not entry.strip():
                continue
                
            lines = entry.strip().split("\n")
            if len(lines) < 3:
                continue
                
            # Extract model name and runtime from first line
            # Format: [ modelName - timestamp, system message
            first_line = lines[0]
            if first_line.startswith("["):
                parts = first_line[1:].split(" - ", 1)
                if len(parts) >= 1:
                    model_name = parts[0].strip()
                    
                    # Look for runtime in the model response line
                    for line in lines:
                        if line.strip().startswith(model_name + ":") and "[" in line and "s]" in line:
                            # Extract runtime from format: modelName: response [X.XXs]
                            runtime_match = re.search(r'\[(\d+\.?\d*)s\]', line)
                            if runtime_match:
                                runtime = float(runtime_match.group(1))
                                
                                if model_name not in model_runtimes:
                                    model_runtimes[model_name] = 0
                                    model_counts[model_name] = 0
                                    
                                model_runtimes[model_name] += runtime
                                model_counts[model_name] += 1
                                break
    except Exception as e:
        print(f"Error parsing model runtimes: {e}")
        
    # Calculate averages
    averages = {}
    for model, total_time in model_runtimes.items():
        if model_counts[model] > 0:
            averages[model] = total_time / model_counts[model]
            
    return averages

def get_top_performing_models(limit=10):
    """Get top performing models sorted by average runtime (fastest first)"""
    averages = get_model_average_runtimes()
    # Sort by runtime (ascending - fastest first)
    sorted_models = sorted(averages.items(), key=lambda x: x[1])
    return sorted_models[:limit]

def get_available_log_dates(log_type):
    """Get list of available dates for a specific log type"""
    ensure_log_dir()
    dates = []
    
    # Look for files matching pattern: {log_type}_{date}.log
    pattern = f"{log_type}_*.log"
    for file in LOG_DIR.glob(pattern):
        # Extract date from filename
        match = re.search(r'(\d{4}-\d{2}-\d{2})\.log$', file.name)
        if match:
            dates.append(match.group(1))
    
    # Sort dates in reverse order (most recent first)
    dates.sort(reverse=True)
    return dates

def parse_log_file(log_type, limit=50, date=None):
    """Parse a log file and return recent entries"""
    if date:
        log_file = LOG_DIR / f"{log_type}_{date}.log"
    else:
        log_file = get_log_filename(log_type)
        
    if not log_file.exists():
        return []
    
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Split entries based on log type
        if log_type == "penphin_mind":
            entries = content.split("]\n\n")
        else:
            entries = content.split("\n--\n")
        
        # Process entries
        parsed_entries = []
        for entry in entries[-limit:]:  # Get last 'limit' entries
            if entry.strip():
                parsed_entries.append(entry.strip())
        
        return list(reversed(parsed_entries))  # Most recent first
    except Exception as e:
        print(f"Error parsing {log_type} log: {e}")
        return []

# Define tune sequences for different operations
def play_ollama_tune(model_name=None):
    """Play a curious ascending tune when starting Ollama requests - uses model name to guide composition"""
    if rainbow and hasattr(rainbow, 'buzzer'):
        try:
            tune_playing.set()
            
            # Base notes palette
            base_notes = [
                Tone("C4"), Tone("D4"), Tone("E4"), Tone("F4"),
                Tone("G4"), Tone("A4"), Tone("B4"), Tone("C5"),
                Tone("D5"), Tone("E5"), Tone("F5"), Tone("G5")
            ]
            
            if model_name:
                # Extract just the model name part (before colon)
                model_base = model_name.split(':')[0] if ':' in model_name else model_name
                
                # Create a hash of the model name for consistent but unique patterns
                model_hash = hashlib.md5(model_base.encode()).hexdigest()
                
                # Generate a short, unique 3-5 note sequence based on hash
                notes = []
                durations = []
                
                # Use first 3-5 hex chars to generate notes
                num_notes = 3 + (ord(model_hash[0]) % 3)  # 3-5 notes
                
                for i in range(num_notes):
                    # Use hash chars to select notes
                    char_val = ord(model_hash[i % len(model_hash)])
                    note_idx = char_val % len(base_notes)
                    notes.append(base_notes[note_idx])
                    
                    # Vary duration based on position (0.08-0.15)
                    duration = 0.08 + (0.07 * (i / num_notes))
                    durations.append(duration)
                
                # Add a final rising note for "curiosity"
                final_note_idx = (ord(model_hash[-1]) % 4) + 8  # Higher notes
                notes.append(base_notes[min(final_note_idx, len(base_notes)-1)])
                durations.append(0.2)
                
            else:
                # Default short curious tune
                notes = [Tone("C4"), Tone("E4"), Tone("G4"), Tone("C5")]
                durations = [0.1, 0.1, 0.1, 0.2]
            
            # Play the generated tune
            for note, duration in zip(notes, durations):
                rainbow.buzzer.play(note)
                time.sleep(duration)
                rainbow.buzzer.stop()
                time.sleep(0.02)
                
        except Exception as e:
            print(f"Error playing Ollama tune: {e}")
        finally:
            tune_playing.clear()

def play_ollama_complete_tune():
    """Play a victorious tune when Ollama completes successfully"""
    if rainbow and hasattr(rainbow, 'buzzer'):
        try:
            tune_playing.set()
            # Victorious fanfare - major chord arpeggio ending high
            notes = [Tone("C4"), Tone("E4"), Tone("G4"), Tone("C5"), Tone("E5"), Tone("G5")]
            durations = [0.1, 0.1, 0.1, 0.15, 0.15, 0.3]
            for note, duration in zip(notes, durations):
                rainbow.buzzer.play(note)
                time.sleep(duration)
                rainbow.buzzer.stop()
                time.sleep(0.02)
        except Exception as e:
            print(f"Error playing victory tune: {e}")
        finally:
            tune_playing.clear()

def play_transcribe_tune():
    """Play a puzzle-solving pattern for transcription requests"""
    if rainbow and hasattr(rainbow, 'buzzer'):
        try:
            tune_playing.set()
            # Puzzle-solving tune - thoughtful, searching pattern
            notes = [Tone("D4"), Tone("G4"), Tone("F4"), Tone("A4"), Tone("G4")]
            durations = [0.2, 0.15, 0.15, 0.2, 0.25]
            for note, duration in zip(notes, durations):
                rainbow.buzzer.play(note)
                time.sleep(duration)
                rainbow.buzzer.stop()
                time.sleep(0.08)
        except Exception as e:
            print(f"Error playing transcribe tune: {e}")
        finally:
            tune_playing.clear()

def play_tts_tune(voice_name=None):
    """Play an announcing fanfare for TTS requests - unique tune based on voice model"""
    if rainbow and hasattr(rainbow, 'buzzer'):
        try:
            # Wait for any previous tune to finish
            while tune_playing.is_set():
                time.sleep(0.05)
            
            tune_playing.set()
            
            # Base announcing notes palette
            base_notes = [
                Tone("C5"), Tone("D5"), Tone("E5"), Tone("F5"),
                Tone("G5"), Tone("A5"), Tone("B5"), Tone("C5")
            ]
            
            if voice_name:
                # Extract voice base name (remove file extensions if present)
                voice_base = voice_name.split('.')[0].split('-')[0]
                
                # Map characters to create voice-specific fanfare
                char_to_pattern = {
                    'a': [5, 3, 5, 7], 'b': [0, 2, 4, 6], 'c': [1, 3, 5, 7],
                    'd': [2, 4, 6, 0], 'e': [3, 5, 7, 1], 'f': [4, 6, 0, 2],
                    'g': [5, 7, 1, 3], 'h': [6, 0, 2, 4], 'i': [7, 1, 3, 5],
                    'j': [0, 3, 6, 1], 'k': [1, 4, 7, 2], 'l': [2, 5, 0, 3],
                    'm': [3, 6, 1, 4], 'n': [4, 7, 2, 5], 'o': [5, 0, 3, 6],
                    'p': [6, 1, 4, 7], 'q': [7, 2, 5, 0], 'r': [0, 4, 1, 5],
                    's': [1, 5, 2, 6], 't': [2, 6, 3, 7], 'u': [3, 7, 4, 0],
                    'v': [4, 0, 5, 1], 'w': [5, 1, 6, 2], 'x': [6, 2, 7, 3],
                    'y': [7, 3, 0, 4], 'z': [0, 5, 2, 7], '_': [0, 2, 4, 6]
                }
                
                notes = []
                durations = []
                
                # Start with attention-getting pattern (flows from G5 if after victory)
                notes.extend([Tone("G5"), Tone("G5"), Tone("E5")])
                durations.extend([0.1, 0.1, 0.15])
                
                # Generate voice-specific pattern
                voice_chars = voice_base.lower()[:6]  # Use first 6 characters
                for i, char in enumerate(voice_chars):
                    if char in char_to_pattern:
                        pattern = char_to_pattern[char]
                        # Use character position to vary the pattern
                        note_index = pattern[i % len(pattern)]
                        notes.append(base_notes[note_index])
                        # Create rhythmic variation
                        if i % 2 == 0:
                            durations.append(0.15)
                        else:
                            durations.append(0.1)
                
                # End with distinctive voice signature
                # Different endings for different voice types
                if 'en' in voice_base:  # English voices
                    notes.extend([Tone("C5"), Tone("E5"), Tone("G5"), Tone("C5")])
                    durations.extend([0.1, 0.1, 0.2, 0.4])
                elif 'gb' in voice_base.lower():  # British voices
                    notes.extend([Tone("D5"), Tone("F5"), Tone("A5"), Tone("D5")])
                    durations.extend([0.1, 0.15, 0.2, 0.4])
                else:  # Other voices
                    notes.extend([Tone("E5"), Tone("G5"), Tone("B5"), Tone("E5")])
                    durations.extend([0.1, 0.15, 0.2, 0.4])
                    
            else:
                # Default announcing tune if no voice specified
                notes = [Tone("G5"), Tone("E5"), Tone("C5"), Tone("D5"), 
                        Tone("E5"), Tone("G5"), Tone("C5")]
                durations = [0.15, 0.1, 0.1, 0.15, 0.15, 0.2, 0.4]
            
            # Small pause to separate from previous tune
            time.sleep(0.1)
            
            # Play the generated fanfare
            for note, duration in zip(notes, durations):
                rainbow.buzzer.play(note)
                time.sleep(duration)
                rainbow.buzzer.stop()
                time.sleep(0.03)
                
        except Exception as e:
            print(f"Error playing TTS tune: {e}")
        finally:
            tune_playing.clear()

def play_bicameral_connection_tune():
    """Play a unique connecting tune representing two hemispheres joining - three-part harmony"""
    if rainbow and hasattr(rainbow, 'buzzer'):
        try:
            tune_playing.set()
            
            # Three-part tune representing:
            # 1. Left hemisphere (logical) - precise intervals
            # 2. Right hemisphere (creative) - flowing melody
            # 3. Convergence - harmony resolution
            
            # Part 1: Logical mind - mathematical intervals (perfect fourths and fifths)
            logical_notes = [Tone("C4"), Tone("F4"), Tone("C4"), Tone("G4")]
            logical_durations = [0.15, 0.15, 0.15, 0.2]
            
            # Part 2: Creative mind - flowing melodic line
            creative_notes = [Tone("E4"), Tone("G4"), Tone("B4"), Tone("A4"), 
                            Tone("G4"), Tone("E4")]
            creative_durations = [0.1, 0.1, 0.15, 0.15, 0.1, 0.2]
            
            # Part 3: Convergence - harmonious resolution combining both
            convergence_notes = [Tone("C4"), Tone("E4"), Tone("G4"), Tone("C5"),
                               Tone("G4"), Tone("E4"), Tone("C4")]
            convergence_durations = [0.1, 0.1, 0.1, 0.3, 0.15, 0.15, 0.4]
            
            # Play the three parts
            # Logical mind
            for note, duration in zip(logical_notes, logical_durations):
                rainbow.buzzer.play(note)
                time.sleep(duration)
                rainbow.buzzer.stop()
                time.sleep(0.02)
            
            time.sleep(0.1)  # Brief pause between sections
            
            # Creative mind
            for note, duration in zip(creative_notes, creative_durations):
                rainbow.buzzer.play(note)
                time.sleep(duration)
                rainbow.buzzer.stop()
                time.sleep(0.02)
            
            time.sleep(0.1)  # Brief pause before convergence
            
            # Convergence - final harmony
            for note, duration in zip(convergence_notes, convergence_durations):
                rainbow.buzzer.play(note)
                time.sleep(duration)
                rainbow.buzzer.stop()
                time.sleep(0.02)
                
        except Exception as e:
            print(f"Error playing bicameral connection tune: {e}")
        finally:
            tune_playing.clear()

def get_sensor_data():
    """Get sensor data from BMP280 and system"""
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

isScrolling = False
def scroll_text_on_display(text, scroll_speed=0.3):
    """Scroll text across the 4-digit display"""
    global current_display_value, isScrolling
    if rainbow:
        try:
            import fourletterphat as flp
            # Add spaces for smooth scrolling
            padded_text = "    " + text.upper() + "    "
            isScrolling = True
            for i in range(len(padded_text) - 3):
                flp.clear()
                display_text = padded_text[i:i+4]
                flp.print_str(display_text)
                flp.show()
                current_display_value = display_text  # Track what's on display
                time.sleep(scroll_speed)
            
            # Leave the last 4 characters on display
            final_text = padded_text[-8:-4] if len(padded_text) > 8 else padded_text[:4]
            flp.clear()
            flp.print_str(final_text)
            flp.show()
            current_display_value = final_text
        except Exception as e:
            print(f"Error scrolling text: {e}")
        finally:
            isScrolling = False

def display_timer(start_time, stop_event, sound_fx=False):
    """Display incrementing timer on the display until stop_event is set
    
    Args:
        start_time: The start time for the timer
        stop_event: Threading event to stop the timer
        sound_fx: If True, play ticking sounds based on TICK_TYPE
    """
    global current_display_value, isScrolling
    if rainbow:
        # Check if we're currently scrolling and wait
        while isScrolling:
            time.sleep(0.1)
            if stop_event.is_set():
                return
        
        try:
            import fourletterphat as flp
            last_elapsed = -1
            tick_state = False  # For alternating tick/tock in clock mode
            music_note_index = 0  # For music mode progression
            
            # Define musical scale for music mode (pentatonic scale for pleasant sound)
            music_scale = [
                Tone("C4"), Tone("D4"), Tone("F4"), Tone("G4"), Tone("A4"),
                Tone("C5"), Tone("D5"), Tone("F5"), Tone("G5"), Tone("A5")
            ]
            
            while not stop_event.is_set():
                elapsed = int(time.time() - start_time)
                
                # Only update display and play sound if the number changed
                if elapsed != last_elapsed:
                    # Only update display if not scrolling
                    if not isScrolling:
                        rainbow.display_number(elapsed)
                        current_display_value = elapsed
                    
                    # Play tick sound based on mode (only if sound_fx is enabled)
                    if sound_fx and rainbow and hasattr(rainbow, 'buzzer'):
                        try:
                            if TICK_TYPE == "clock":
                                # Clock mode: alternating tick/tock sounds
                                if tick_state:
                                    # Tick (higher pitch)
                                    rainbow.buzzer.play(Tone("E5"))
                                else:
                                    # Tock (lower pitch)
                                    rainbow.buzzer.play(Tone("C4"))
                                tick_state = not tick_state
                                
                                # Play for slightly longer to make it more audible
                                time.sleep(0.05)  # Increased from 0.02
                                rainbow.buzzer.stop()
                                
                            elif TICK_TYPE == "music":
                                # Music mode: play notes from scale
                                note = music_scale[music_note_index % len(music_scale)]
                                rainbow.buzzer.play(note)
                                
                                # Play for slightly longer to make it more audible
                                time.sleep(0.04)  # Increased from 0.015
                                rainbow.buzzer.stop()
                                
                                # Progress through the scale
                                music_note_index += 1
                                
                                # Add some musical variation - occasionally jump
                                if elapsed % 4 == 0:
                                    music_note_index += 2  # Jump ahead for variety
                                    
                        except Exception as e:
                            print(f"Error playing tick sound: {e}")
                    
                    last_elapsed = elapsed
                
                time.sleep(0.1)
        except Exception as e:
            print(f"Error displaying timer: {e}")

def blink_number(number, duration=4, blink_speed=0.3):
    """Blink a number on the display for specified duration"""
    global current_display_value, isScrolling
    if rainbow:
        # Wait for any scrolling to finish
        while isScrolling:
            time.sleep(0.1)
        
        try:
            import fourletterphat as flp
            end_time = time.time() + duration
            while time.time() < end_time:
                # Only blink if not scrolling
                if not isScrolling:
                    rainbow.display_number(number)
                    time.sleep(blink_speed)
                    if not isScrolling:
                        flp.clear()
                        flp.show()
                    time.sleep(blink_speed)
                else:
                    # If scrolling, just wait
                    time.sleep(0.1)
            # Leave the number on display after blinking (only if not scrolling)
            if not isScrolling:
                rainbow.display_number(number)
                current_display_value = number
        except Exception as e:
            print(f"Error blinking number: {e}")

def get_model_tags():
    try:
        res = requests.get("http://roverseer.local:11434/api/tags")
        if res.ok:
            tags = res.json().get("models", [])
            return sorted(tag.get("name") for tag in tags if tag.get("name"))
    except Exception as e:
        print(f"Error fetching model tags: {e}")
    return []

def sort_models_by_size(models, models_info=None):
    """Sort models by parameter size, with PenphinMind first"""
    # Parameter size order for sorting
    def extract_size_value(param_size):
        """Extract numeric value from parameter size string like '1B', '999.89M', '1.2B'"""
        if not param_size or param_size == "unknown":
            return 999  # Put unknown at end
        
        try:
            if param_size.endswith('M'):
                return float(param_size[:-1]) / 1000  # Convert to billions
            elif param_size.endswith('B'):
                return float(param_size[:-1])
            else:
                return 999
        except:
            return 999
    
    def get_sort_key(model):
        model_lower = model.lower()
        
        # PenphinMind always first
        if 'penphinmind' in model_lower:
            return (0, 0, model)
        
        # If we have models_info, use actual parameter size
        if models_info:
            for info in models_info:
                if info['name'] == model:
                    size_value = extract_size_value(info.get('size', 'unknown'))
                    return (1, size_value, model)
        
        # Fallback: extract from model name if no info
        model_base = model.split(':')[0].lower()
        
        # Known model sizes for fallback
        known_model_sizes = {
            "llava": 7.0,
            "moondream": 1.6,
            "dolphin-mistral": 7.0,
            "deepseek-coder-v2": 16.0,
            "deepseek-v2": 16.0,
            "deepseek-llm": 7.0,
            "wizardlm2": 7.0,
            "openchat": 7.0,
            "openhermes": 7.0,
            "magicoder": 7.0,
            "meditron": 7.0,
            "medllama2": 7.0,
            "smallthinker": 3.0,
            "smollm2": 1.7,
            "tinyllama": 1.1,
        }
        
        if model_base in known_model_sizes:
            return (1, known_model_sizes[model_base], model)
        
        # Try to extract from name
        size_patterns = [
            (r'0\.5b', 0.5), (r'1b', 1.0), (r'1\.1b', 1.1), (r'1\.5b', 1.5),
            (r'1\.6b', 1.6), (r'1\.7b', 1.7), (r'2b', 2.0), (r'3b', 3.0),
            (r'4b', 4.0), (r'7b', 7.0), (r'8b', 8.0), (r'13b', 13.0),
            (r'14b', 14.0), (r'16b', 16.0), (r'20b', 20.0), (r'30b', 30.0),
            (r'34b', 34.0), (r'40b', 40.0), (r'70b', 70.0), (r'180b', 180.0)
        ]
        
        import re
        for pattern, size in size_patterns:
            if re.search(pattern, model_lower):
                return (1, size, model)
        
        # Models without clear size go to the end
        return (2, 999, model)
    
    # Add PenphinMind as first option if not already in list
    models_with_penphin = list(models)
    if not any('penphinmind' in m.lower() for m in models_with_penphin):
        models_with_penphin.insert(0, "PenphinMind")
    
    return sorted(models_with_penphin, key=get_sort_key)

def refresh_available_models():
    """Refresh the available models list from Ollama"""
    global available_models
    models = get_model_tags()
    if models:  # Only update if we got models
        available_models = sort_models_by_size(models)
        print(f"Refreshed model list: {len(available_models)} models found (including PenphinMind)")
        return True
    return False

def setup_button_handlers():
    """Setup button handlers for model selection and voice recording"""
    global available_models, selected_model_index, recording_in_progress
    
    if not rainbow:
        return
    
    # Initial attempt to get models with retries
    print("Fetching available models...")
    max_retries = 5
    retry_delay = 2.0
    
    for attempt in range(max_retries):
        if refresh_available_models():
            break
        else:
            print(f"Attempt {attempt + 1}/{max_retries} failed, waiting {retry_delay}s...")
            time.sleep(retry_delay)
    
    # If still no models, use default
    if not available_models:
        available_models = [DEFAULT_MODEL]
        print(f"No models found after {max_retries} attempts, using default: {DEFAULT_MODEL}")
    
    # Track which buttons are currently pressed
    buttons_pressed = {'A': False, 'B': False, 'C': False}
    clear_history_timer = None
    
    def check_clear_history():
        """Check if all buttons are pressed to clear history"""
        global button_history, clear_history_timer
        
        if all(buttons_pressed.values()) and not recording_in_progress:
            # All buttons pressed - start timer
            if clear_history_timer is None:
                print("All buttons pressed - hold for 3 seconds to clear history")
                
                def clear_after_delay():
                    time.sleep(3)
                    if all(buttons_pressed.values()):  # Still all pressed
                        button_history.clear()
                        print("Button chat history cleared!")
                        
                        # Play confirmation sound - random 7-note tune
                        if rainbow and hasattr(rainbow, 'buzzer'):
                            # Available notes for random selection
                            available_notes = [
                                Tone("C4"), Tone("D4"), Tone("E4"), Tone("F4"),
                                Tone("G4"), Tone("A4"), Tone("B4"), Tone("C5"),
                                Tone("D5"), Tone("E5"), Tone("F5"), Tone("G5")
                            ]
                            # Generate random 7-note sequence
                            random_notes = [random.choice(available_notes) for _ in range(7)]
                            
                            # Play the random tune
                            for note in random_notes:
                                rainbow.buzzer.play(note)
                                time.sleep(random.uniform(0.08, 0.15))  # Vary timing too
                                rainbow.buzzer.stop()
                                time.sleep(0.02)
                        
                        # Flash all LEDs
                        for _ in range(3):
                            for led in ['A', 'B', 'C']:
                                rainbow.button_leds[led].on()
                            time.sleep(0.2)
                            for led in ['A', 'B', 'C']:
                                rainbow.button_leds[led].off()
                            time.sleep(0.2)
                
                clear_history_timer = threading.Thread(target=clear_after_delay)
                clear_history_timer.daemon = True
                clear_history_timer.start()
    
    def handle_button_a():
        """Toggle to previous model"""
        global selected_model_index
        buttons_pressed['A'] = True
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if not recording_in_progress and not all(buttons_pressed.values()):
            print(f"Button A pressed, recording_in_progress={recording_in_progress}")
            rainbow.button_leds['A'].on()  # LED on when pressed
            play_sound_async(play_toggle_left_sound)
            
            # Refresh models if we only have the default
            if len(available_models) == 1 and available_models[0] == DEFAULT_MODEL:
                refresh_available_models()
            
            # Cycle to previous model
            selected_model_index = (selected_model_index - 1) % len(available_models)
            
            # Display model name briefly
            model_name = available_models[selected_model_index].split(':')[0]
            if model_name.lower() == "penphinmind":
                scroll_text_on_display("PenphinMind", scroll_speed=0.2)
            else:
                # Get runtime info
                avg_runtime = get_model_runtime(available_models[selected_model_index])
                if avg_runtime:
                    display_text = f"{model_name} {avg_runtime:.1f}s"
                else:
                    display_text = model_name
                scroll_text_on_display(display_text, scroll_speed=0.2)
            
            # Wait for scrolling to complete before showing index
            while isScrolling:
                time.sleep(0.1)
            
            # Show model index after scrolling
            rainbow.display_number(selected_model_index)
    
    def handle_button_a_release():
        """Handle button A release"""
        buttons_pressed['A'] = False
        if not recording_in_progress and not any(buttons_pressed.values()):
            rainbow.button_leds['A'].off()  # LED off when released
            play_sound_async(play_toggle_left_echo)
    
    def handle_button_c():
        """Toggle to next model"""
        global selected_model_index
        buttons_pressed['C'] = True
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if not recording_in_progress and not all(buttons_pressed.values()):
            rainbow.button_leds['C'].on()  # LED on when pressed
            play_sound_async(play_toggle_right_sound)
            
            # Refresh models if we only have the default
            if len(available_models) == 1 and available_models[0] == DEFAULT_MODEL:
                refresh_available_models()
            
            # Cycle to next model
            selected_model_index = (selected_model_index + 1) % len(available_models)
            
            # Display model name briefly
            model_name = available_models[selected_model_index].split(':')[0]
            if model_name.lower() == "penphinmind":
                scroll_text_on_display("PenphinMind", scroll_speed=0.2)
            else:
                # Get runtime info
                avg_runtime = get_model_runtime(available_models[selected_model_index])
                if avg_runtime:
                    display_text = f"{model_name} {avg_runtime:.1f}s"
                else:
                    display_text = model_name
                scroll_text_on_display(display_text, scroll_speed=0.2)
            
            # Wait for scrolling to complete before showing index
            while isScrolling:
                time.sleep(0.1)
            
            # Show model index after scrolling
            rainbow.display_number(selected_model_index)
    
    def handle_button_c_release():
        """Handle button C release"""
        buttons_pressed['C'] = False
        if not recording_in_progress and not any(buttons_pressed.values()):
            rainbow.button_leds['C'].off()  # LED off when released
            play_sound_async(play_toggle_right_echo)
    
    def handle_button_b():
        """Start recording on button press - LED solid while held"""
        global recording_in_progress
        buttons_pressed['B'] = True
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if recording_in_progress or all(buttons_pressed.values()):
            return  # Ignore if already recording or clearing history
        
        # LED solid on while button is held
        rainbow.button_leds['B'].on()
    
    def handle_button_b_release():
        """Start the recording pipeline on button release"""
        global recording_in_progress
        buttons_pressed['B'] = False
        
        if recording_in_progress or all(buttons_pressed.values()):
            return  # Ignore if already recording or clearing history
        
        recording_in_progress = True
        
        # Don't start LED here - let transcribe_audio handle it
        
        def recording_pipeline():
            global recording_in_progress, current_audio_process
            try:
                print(f"Starting recording pipeline with MIC_DEVICE: {MIC_DEVICE}")
                
                # Reset pipeline stages at start
                reset_pipeline_stages()
                
                # Play confirmation sound
                play_sound_async(play_confirmation_sound)
                
                # Record audio for 10 seconds
                temp_recording = f"/tmp/recording_{uuid.uuid4().hex}.wav"
                
                # Start LED blinking for recording (Button B)
                recording_led_blink = threading.Event()
                
                def blink_recording_led():
                    """Blink button B LED during recording"""
                    while not recording_led_blink.is_set():
                        if rainbow:
                            rainbow.button_leds['B'].on()
                        time.sleep(0.3)
                        if not recording_led_blink.is_set() and rainbow:
                            rainbow.button_leds['B'].off()
                        time.sleep(0.3)
                
                blink_thread = threading.Thread(target=blink_recording_led)
                blink_thread.daemon = True
                blink_thread.start()
                
                # Display countdown during recording
                def show_countdown():
                    for i in range(10, 0, -1):
                        if rainbow:
                            rainbow.display_number(i)
                        time.sleep(1)
                
                # Start recording with arecord
                record_cmd = [
                    'arecord',
                    '-D', MIC_DEVICE,
                    '-f', 'S16_LE',
                    '-r', '16000',
                    '-c', '1',
                    '-d', '10',
                    temp_recording
                ]
                
                print(f"Recording command: {' '.join(record_cmd)}")
                
                # Test if recording device exists
                test_cmd = ['arecord', '-l']
                test_result = subprocess.run(test_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                print(f"Available recording devices:\n{test_result.stdout}")
                if test_result.stderr:
                    print(f"Recording device test stderr: {test_result.stderr}")
                
                # Run recording and countdown in parallel
                record_process = subprocess.Popen(record_cmd, 
                                                stdout=subprocess.PIPE, 
                                                stderr=subprocess.PIPE)
                
                countdown_thread = threading.Thread(target=show_countdown)
                countdown_thread.start()
                
                # Wait for recording to complete
                return_code = record_process.wait()
                stdout, stderr = record_process.communicate()
                
                print(f"Recording completed with return code: {return_code}")
                if stdout:
                    print(f"Recording stdout: {stdout.decode()}")
                if stderr:
                    print(f"Recording stderr: {stderr.decode()}")
                
                countdown_thread.join()
                
                # Stop LED blinking
                recording_led_blink.set()
                blink_thread.join(timeout=1)
                
                # Turn off button B LED
                if rainbow:
                    rainbow.button_leds['B'].off()
                
                # Check if recording was successful
                if return_code != 0:
                    print(f"Recording failed with return code {return_code}")
                    if stderr:
                        print(f"Recording error: {stderr.decode()}")
                    
                    # Clear display and show error
                    if rainbow:
                        import fourletterphat as flp
                        flp.clear()
                        scroll_text_on_display("REC ERR", scroll_speed=0.3)
                        time.sleep(2)
                        flp.clear()
                        flp.show()
                    return
                
                # Check if recording file exists and has content
                if not os.path.exists(temp_recording):
                    print(f"Recording file {temp_recording} was not created")
                    if rainbow:
                        import fourletterphat as flp
                        flp.clear()
                        scroll_text_on_display("NO FILE", scroll_speed=0.3)
                        time.sleep(2)
                        flp.clear()
                        flp.show()
                    return
                
                file_size = os.path.getsize(temp_recording)
                print(f"Recording file size: {file_size} bytes")
                if file_size < 1000:  # Less than 1KB suggests no audio
                    print("Recording file is too small, likely no audio captured")
                    if rainbow:
                        import fourletterphat as flp
                        flp.clear()
                        scroll_text_on_display("EMPTY", scroll_speed=0.3)
                        time.sleep(2)
                        flp.clear()
                        flp.show()
                    os.remove(temp_recording)
                    return
                
                # Play recording complete sound
                play_sound_async(play_recording_complete_sound)
                
                # 1. Speech to Text - Start ASR LED
                start_system_processing('A')  # Red LED for ASR
                transcript = None
                try:
                    transcript = transcribe_audio(temp_recording)
                    os.remove(temp_recording)
                    print(f"Transcription successful: {transcript[:50]}...")
                except Exception as e:
                    print(f"Transcription error: {e}")
                    transcript = "Hello, testing the system."
                
                # ASR complete, transition to LLM stage
                stop_system_processing()  # This marks ASR complete
                start_system_processing('B')  # Start LLM stage
                
                # Play voice intro before LLM processing
                voice = DEFAULT_VOICE
                play_sound_async(play_voice_intro, voice)
                
                # 2. Run LLM with selected model (will keep LED blinking)
                selected_model = available_models[selected_model_index]
                
                # Check if PenphinMind is selected
                if selected_model.lower() == "penphinmind":
                    # Use bicameral_chat_direct function
                    try:
                        reply = bicameral_chat_direct(transcript, voice=voice)
                    except Exception as e:
                        reply = f"Bicameral processing error: {e}"
                else:
                    # Normal single model flow
                    # Build message history with model context
                    messages = []
                    
                    # Add conversation history (including which model said what)
                    for hist_user, hist_reply, hist_model in button_history[-MAX_BUTTON_HISTORY:]:
                        # Include model name in assistant messages for context
                        model_prefix = f"[{hist_model.split(':')[0]}]: " if hist_model != selected_model else ""
                        messages.append({"role": "user", "content": hist_user})
                        messages.append({"role": "assistant", "content": model_prefix + hist_reply})
                    
                    # Add current user message
                    messages.append({"role": "user", "content": transcript})
                    
                    # System message that includes model switching context
                    system_message = (
                        "You are RoverSeer, a helpful voice assistant. Keep responses concise and conversational. "
                        f"You are currently running as model '{selected_model.split(':')[0]}'. "
                        "Previous responses may be from different models, indicated by [model_name]: prefix. "
                        "You can reference what other models said if asked."
                    )
                    
                    reply = run_chat_completion(selected_model, messages, system_message)
                
                # Save to button history
                button_history.append((transcript, reply, selected_model))
                if len(button_history) > MAX_BUTTON_HISTORY * 2:  # Keep some buffer
                    button_history.pop(0)
                
                print(f"Button chat history: {len(button_history)} exchanges")
                
                # 3. Text to Speech with default voice
                voice = DEFAULT_VOICE
                
                # Generate and play audio response
                model_path, config_path = find_voice_files(voice)
                tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"
                
                # LLM complete, transition to TTS stage
                stop_system_processing()  # This marks LLM complete
                start_system_processing('C')  # Start TTS stage
                play_sound_async(play_tts_tune, voice)
                
                # Sanitize text for speech
                clean_reply = sanitize_for_speech(reply)
                
                tts_start_time = time.time()
                tts_result = subprocess.run(
                    ["/home/codemusic/roverseer_venv/bin/piper",
                     "--model", model_path,
                     "--config", config_path,
                     "--output_file", tmp_wav],
                    input=clean_reply.encode(),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                tts_processing_time = time.time() - tts_start_time
                
                if tts_result.returncode == 0:
                    # Log TTS usage
                    log_tts_usage(voice, clean_reply, tmp_wav, tts_processing_time)
                    
                    # TTS complete, transition to audio playback
                    stop_system_processing()  # This marks TTS complete
                    start_system_processing('aplay')
                    
                    # Play the audio response using Popen to make it interruptible
                    current_audio_process = subprocess.Popen(
                        ["aplay", "-D", AUDIO_DEVICE, tmp_wav],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                    
                    # Wait for playback to complete
                    current_audio_process.wait()
                    current_audio_process = None
                    
                    os.remove(tmp_wav)
                    
                    # All complete - stop resets everything
                    stop_system_processing()

            except Exception as e:
                print(f"Error in recording pipeline: {e}")
                import traceback
                traceback.print_exc()
                # On error, reset everything
                reset_pipeline_stages()
                # Show error on display
                if rainbow:
                    import fourletterphat as flp
                    flp.clear()
                    scroll_text_on_display("ERROR", scroll_speed=0.3)
                    time.sleep(2)
                    flp.clear()
                    flp.show()
            finally:
                # Reset recording flag
                recording_in_progress = False
                
                # Make sure LED blinking is stopped
                if 'recording_led_blink' in locals():
                    recording_led_blink.set()
                if 'blink_thread' in locals() and blink_thread.is_alive():
                    blink_thread.join(timeout=1)
                
                # Turn off button B LED
                if rainbow:
                    rainbow.button_leds['B'].off()
                
                # Clear display
                if rainbow:
                    import fourletterphat as flp
                    flp.clear()
                    flp.show()
                
                print("Recording pipeline complete, buttons re-enabled")
        
        # Run pipeline in separate thread
        pipeline_thread = threading.Thread(target=recording_pipeline)
        pipeline_thread.daemon = True
        pipeline_thread.start()
    
    # Setup button handlers with both press and release
    rainbow.buttons['A'].when_pressed = handle_button_a
    rainbow.buttons['A'].when_released = handle_button_a_release
    rainbow.buttons['B'].when_pressed = handle_button_b
    rainbow.buttons['B'].when_released = handle_button_b_release
    rainbow.buttons['C'].when_pressed = handle_button_c
    rainbow.buttons['C'].when_released = handle_button_c_release

def play_toggle_left_sound():
    """Play a descending sound for toggling left/previous"""
    if rainbow and hasattr(rainbow, 'buzzer'):
        try:
            notes = [Tone("E5"), Tone("C5")]
            for note in notes:
                rainbow.buzzer.play(note)
                time.sleep(0.1)
                rainbow.buzzer.stop()
        except Exception as e:
            print(f"Error playing toggle left sound: {e}")

def play_toggle_right_sound():
    """Play an ascending sound for toggling right/next"""
    if rainbow and hasattr(rainbow, 'buzzer'):
        try:
            notes = [Tone("C5"), Tone("E5")]
            for note in notes:
                rainbow.buzzer.play(note)
                time.sleep(0.1)
                rainbow.buzzer.stop()
        except Exception as e:
            print(f"Error playing toggle right sound: {e}")

def play_confirmation_sound():
    """Play a confirmation sound for recording start"""
    if rainbow and hasattr(rainbow, 'buzzer'):
        try:
            # Two quick high beeps
            for _ in range(2):
                rainbow.buzzer.play(Tone("A5"))
                time.sleep(0.08)
                rainbow.buzzer.stop()
                time.sleep(0.05)
        except Exception as e:
            print(f"Error playing confirmation sound: {e}")

def play_recording_complete_sound():
    """Play a sound when recording completes"""
    if rainbow and hasattr(rainbow, 'buzzer'):
        try:
            # Descending completion sound
            notes = [Tone("G5"), Tone("E5"), Tone("C5")]
            for note in notes:
                rainbow.buzzer.play(note)
                time.sleep(0.08)
                rainbow.buzzer.stop()
        except Exception as e:
            print(f"Error playing recording complete sound: {e}")

def play_toggle_left_echo():
    """Play a quieter echo of the toggle left sound on release"""
    if rainbow and hasattr(rainbow, 'buzzer'):
        try:
            # Same notes but shorter and quieter
            notes = [Tone("E4")]  # One octave lower for echo
            for note in notes:
                rainbow.buzzer.play(note)
                time.sleep(0.05)  # Shorter duration
                rainbow.buzzer.stop()
        except Exception as e:
            print(f"Error playing toggle left echo: {e}")

def play_toggle_right_echo():
    """Play a quieter echo of the toggle right sound on release"""
    if rainbow and hasattr(rainbow, 'buzzer'):
        try:
            # Same notes but shorter and quieter
            notes = [Tone("C4")]  # One octave lower for echo
            for note in notes:
                rainbow.buzzer.play(note)
                time.sleep(0.05)  # Shorter duration
                rainbow.buzzer.stop()
        except Exception as e:
            print(f"Error playing toggle right echo: {e}")

def start_system_processing(led_color='B'):
    """Start the current blinking LED and mark stage as active"""
    global system_processing, pipeline_stages, processing_led_thread
    
    # Mark current active stage as active
    if led_color == 'A':
        pipeline_stages['asr_active'] = True
    elif led_color == 'B':
        pipeline_stages['llm_active'] = True
    elif led_color == 'C':
        pipeline_stages['tts_active'] = True
    elif led_color == 'aplay':
        pipeline_stages['aplay_active'] = True
    
    system_processing = True
    stop_processing_led.clear()
    
    # Start LED blinking thread with the led_color parameter
    processing_led_thread = threading.Thread(target=blink_processing_led, args=(led_color,))
    processing_led_thread.daemon = True
    processing_led_thread.start()

def stop_system_processing():
    """Stop the current blinking LED and mark stage as complete"""
    global system_processing, pipeline_stages
    
    # Mark current active stage as complete
    if pipeline_stages['asr_active']:
        pipeline_stages['asr_active'] = False
        pipeline_stages['asr_complete'] = True
    elif pipeline_stages['llm_active']:
        pipeline_stages['llm_active'] = False
        pipeline_stages['llm_complete'] = True
    elif pipeline_stages['tts_active']:
        pipeline_stages['tts_active'] = False
        pipeline_stages['tts_complete'] = True
    elif pipeline_stages['aplay_active']:
        # End of pipeline - reset everything
        reset_pipeline_stages()
        
    system_processing = False
    stop_processing_led.set()
    
    # Wait for thread to finish
    if processing_led_thread and processing_led_thread.is_alive():
        processing_led_thread.join(timeout=1)
    
    # Update LEDs to show current state
    update_pipeline_leds()

def play_sound_async(sound_function, *args, **kwargs):
    """Queue a sound function to be played sequentially"""
    # Add the sound to the queue
    sound_queue.put((sound_function, args, kwargs))

def sanitize_for_speech(text):
    """Sanitize text for natural speech output by converting symbols to spoken words"""
    import re
    
    # First handle markdown headers - convert to spoken form
    # Do these before other replacements to preserve structure
    text = re.sub(r'^###\s+(.+)$', r'Section: \1.', text, flags=re.MULTILINE)
    text = re.sub(r'^##\s+(.+)$', r'Heading: \1.', text, flags=re.MULTILINE)  
    text = re.sub(r'^#\s+(.+)$', r'Title: \1.', text, flags=re.MULTILINE)
    
    # Handle inline headers too (not at start of line)
    text = re.sub(r'###\s+(.+)', r'Section: \1.', text)
    text = re.sub(r'##\s+(.+)', r'Heading: \1.', text)
    text = re.sub(r'#\s+(.+)', r'Title: \1.', text)
    
    # Common symbol replacements
    replacements = {
        '*': '',  # Remove asterisks completely
        '**': '',  # Remove bold markdown
        '***': '',  # Remove bold italic markdown
        '_': ' ',  # Replace underscores with spaces
        '__': '',  # Remove italic markdown
        '`': '',  # Remove code backticks
        '```': '',  # Remove code blocks
        '&': ' and ',
        '@': ' at ',
        '%': ' percent',
        '$': ' dollars',
        '€': ' euros',
        '£': ' pounds',
        '+': ' plus ',
        '=': ' equals ',
        '<': ' less than ',
        '>': ' greater than ',
        '/': ' slash ',
        '\\': ' backslash ',
        '|': ' pipe ',
        '~': ' tilde ',
        '^': ' caret ',
        '[': '',  # Remove brackets
        ']': '',
        '{': '',  # Remove braces
        '}': '',
        '(': ', ',  # Replace parentheses with commas
        ')': ', ',
        '...': ' dot dot dot ',
        '..': ' dot dot ',
        '--': ', ',  # Replace dashes with commas
        '---': ', ',
        '\n\n': '. ',  # Replace double newlines with periods
        '\n': '. ',  # Replace single newlines with periods
        '\t': ' ',  # Replace tabs with spaces
    }
    
    # Apply replacements
    result = text
    for symbol, replacement in replacements.items():
        result = result.replace(symbol, replacement)
    
    # Clean up multiple spaces and punctuation
    import re
    result = re.sub(r'\s+', ' ', result)  # Multiple spaces to single
    result = re.sub(r'\.+', '.', result)  # Multiple periods to single
    result = re.sub(r',+', ',', result)  # Multiple commas to single
    result = re.sub(r'\s+([.,!?])', r'\1', result)  # Remove space before punctuation
    result = re.sub(r'([.,!?])\s*([.,!?])', r'\1', result)  # Remove duplicate punctuation
    
    # Remove URLs (they're hard to speak naturally)
    result = re.sub(r'https?://\S+', ' web link ', result)
    result = re.sub(r'www\.\S+', ' web link ', result)
    
    # Convert numbers with special formatting
    result = re.sub(r'(\d+)x(\d+)', r'\1 by \2', result)  # 1920x1080 -> 1920 by 1080
    result = re.sub(r'(\d+):(\d+)', r'\1 colon \2', result)  # 3:45 -> 3 colon 45
    
    # Clean up any remaining odd characters
    result = ''.join(char if char.isalnum() or char in ' .,!?;:\'-' else ' ' for char in result)
    
    # Final cleanup
    result = result.strip()
    result = re.sub(r'\s+', ' ', result)
    
    return result

def bicameral_chat_direct(prompt, system="", voice=DEFAULT_VOICE):
    """
    Direct bicameral processing without HTTP overhead.
    Returns the final synthesis text.
    """
    global convergence_model
    
    if not prompt.strip():
        raise ValueError("No prompt provided")

    try:
        # Play the unique bicameral connection tune
        play_sound_async(play_bicameral_connection_tune)
        
        # Randomly decide which model will handle convergence
        convergence_model = random.choice([logical_model, creative_model])
        first_model = logical_model if convergence_model == creative_model else creative_model
        
        # 1. Send to First Mind
        first_start_time = time.time()
        first_messages = [{"role": "user", "content": prompt}]
        first_system = logical_message if first_model == logical_model else creative_message
        
        first_response = run_chat_completion(first_model, first_messages, first_system, skip_logging=True)
        first_time = time.time() - first_start_time
        
        # Keep LLM LED state, don't stop
        time.sleep(0.5)  # Brief pause between minds
        
        # 2. Send to Second Mind (which will also handle convergence)
        second_start_time = time.time()
        second_messages = [{"role": "user", "content": prompt}]
        second_system = logical_message if convergence_model == logical_model else creative_message
        
        second_response = run_chat_completion(convergence_model, second_messages, second_system, skip_logging=True)
        second_time = time.time() - second_start_time
        
        # Keep LLM LED state, don't stop
        time.sleep(0.5)  # Brief pause before convergence
        
        # 3. Send all to Convergence Mind (using the same model as second mind)
        convergence_start_time = time.time()
        
        # Build convergence prompt base
        convergence_prompt_base = f"""
        [Prompt:
        {prompt}

        First Mind Perspective:
        {first_response}

        Second Mind Perspective:
        {second_response}]"""
        
        # If system message provided, prepend it
        if system:
            convergence_prompt = system + ". " + convergence_prompt_base
        else:
            convergence_prompt = convergence_prompt_base
        
        convergence_messages = [{"role": "user", "content": convergence_prompt}]

        final_response = run_chat_completion(convergence_model, convergence_messages, convergence_message, skip_logging=True)
        convergence_time = time.time() - convergence_start_time
        
        # Log PenphinMind usage
        bicameral_system_message = f"Bicameral processing for: {prompt[:50]}..."
        log_penphin_mind_usage(
            first_model, convergence_model, convergence_model,
            bicameral_system_message, prompt,
            first_response, first_time,
            second_response, second_time,
            final_response, convergence_time
        )
        
        return final_response
        
    except Exception as e:
        error_msg = str(e)
        if "Connection refused" in error_msg:
            raise Exception("Failed to connect to Ollama service. Please ensure Ollama is running.")
        elif "model not found" in error_msg.lower():
            raise Exception(f"Model not found: {error_msg}")
        else:
            raise Exception(f"Bicameral processing failed: {error_msg}")

# Define TCP services
tcp_services = {
    "Wyoming Piper": 10200,
    "Wyoming Whisper": 10300,
    "JupyterLab": 8888,
    "Ollama": 11434,
    "Open WebUI": 3000,
    "Redmine": 3333,
    "Home Assistant": 8123,
    "Custom API": 5000
}

def check_tcp_ports():
    results = {}
    for name, port in tcp_services.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex(('localhost', port))
        if result == 0:
            results[name] = {"status": "🟢", "port": port}
        else:
            results[name] = {"status": "🔴", "port": port}
        sock.close()
    return results

whisper_model = WhisperModel("base", compute_type="int8")  # or "medium" if you want higher quality

def transcribe_audio(file_path):
    # Don't start LED here - caller should handle LED state
    play_sound_async(play_transcribe_tune)  # Play tune asynchronously when transcribing
    start_time = time.time()
    segments, info = whisper_model.transcribe(file_path)
    transcript = " ".join([segment.text for segment in segments])
    processing_time = time.time() - start_time
    
    # Log ASR usage
    log_asr_usage(file_path, transcript, processing_time)
    
    return transcript

def run_chat_completion(model, messages, system_message=None, skip_logging=False):
    # Don't start LED here - caller should have already set correct LED state
    play_sound_async(play_ollama_tune, model)  # Play curious tune asynchronously
    
    # Start timer and display handling
    start_time = time.time()
    stop_timer = threading.Event()
    
    # Extract model name (before the colon if present)
    model_display_name = model.split(':')[0] if ':' in model else model
    
    if skip_logging: #hack
        model_display_name = "PenphinMind"
    
    # Extract user prompt from last message
    user_prompt = ""
    if messages and messages[-1].get("role") == "user":
        user_prompt = messages[-1].get("content", "")
    
    # Start a thread to handle display
    def display_handler():
        # First scroll the model name
        scroll_text_on_display(model_display_name, scroll_speed=0.2)
        # Wait a moment after scrolling completes
        time.sleep(0.5)
        # Clear display before starting timer
        if rainbow:
            try:
                import fourletterphat as flp
                flp.clear()
                flp.show()
            except:
                pass
        
        # Wait for ollama tune to finish before starting timer with ticks
        while tune_playing.is_set():
            time.sleep(0.1)
        
        # Then show the timer with sound effects (now that tune is done)
        display_timer(start_time, stop_timer, sound_fx=True)
    
    display_thread = threading.Thread(target=display_handler)
    display_thread.daemon = True
    display_thread.start()
    
    try:
        if system_message and not any(msg.get("role") == "system" for msg in messages):
            messages.insert(0, {"role": "system", "content": system_message})

        response = requests.post(
            "http://localhost:11434/api/chat",
            headers={"Content-Type": "application/json"},
            json={
                "model": model, 
                "messages": messages,
                "stream": False
            }
        )
        response.raise_for_status()
        
        # Debug: Check what we actually got from Ollama
        if not response.text.strip():
            raise Exception(f"Ollama returned empty response for model {model}")
        
        try:
            response_data = response.json()
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON response from Ollama for model {model}. Response: {response.text[:200]}...")
        
        # Check if response has expected structure
        if "message" not in response_data:
            raise Exception(f"Unexpected response structure from Ollama for model {model}. Got: {response_data}")
        
        if "content" not in response_data["message"]:
            raise Exception(f"Missing content in Ollama response for model {model}. Message: {response_data['message']}")
            
        result = response_data["message"]["content"]
        
        # Stop timer and calculate elapsed time
        stop_timer.set()
        elapsed_time = time.time() - start_time
        
        # Only log if not part of PenphinMind
        if not skip_logging:
            # Log LLM usage
            log_llm_usage(model, system_message or "Default system message", user_prompt, result, elapsed_time)
            
            # Update model runtime statistics
            update_model_runtime(model, elapsed_time)
        
        # Play victory tune
        play_sound_async(play_ollama_complete_tune)  # Play victory tune asynchronously
        
        # Blink the elapsed time in a separate thread (non-blocking)
        def blink_async():
            blink_number(int(elapsed_time), duration=4, blink_speed=0.3)
        
        blink_thread = threading.Thread(target=blink_async)
        blink_thread.daemon = True
        blink_thread.start()
        
        return result
        
    except Exception as e:
        stop_timer.set()
        stop_system_processing()
        raise e



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

# -------- DYNAMIC VOICE DETECTION -------- #
def list_voice_ids():
    base_names = set()
    for fname in os.listdir(VOICES_DIR):
        if fname.endswith(".onnx") and not fname.endswith(".onnx.json"):
            base = fname.rsplit("-", 1)[0]
            base_names.add(base)
    return sorted(base_names)

def find_voice_files(base_voice_id):
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

# -------- FLASK APP + SWAGGER -------- #
app = Flask(__name__)
CORS(app)

swagger = Swagger(app, template={
    "swagger": "2.0",
    "info": {
        "title": "RoverSeer API",
        "description": "Text-to-speech powered by Piper and gTTS.",
        "version": "1.0.0"
    },
    "basePath": "/",
}, config={
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec_1',
            "route": '/apispec_1.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs"
})

@app.route('/docs/')
def redirect_docs():
    return redirect("/docs", code=302)

@app.route("/static/<filename>")
def serve_static(filename):
    return send_file(os.path.join("/tmp", filename))


@app.route("/", methods=['GET', 'POST'])
def home():
    global history
    statuses = check_tcp_ports()
    models = get_model_tags()
    models = sort_models_by_size(models)  # Sort models with PenphinMind first
    voices = list_voice_ids()
    model_stats = load_model_stats()  # Load runtime stats
    
    sensor_data = get_sensor_data()  # Get sensor data
    selected_model = "tinydolphin:1.1b"
    selected_voice = "en_GB-jarvis"
    reply_text = ""
    audio_url = None
    
    # Handle clear context action
    if request.method == 'POST' and request.form.get('action') == 'clear_context':
        history.clear()
        return redirect('/')
    
    if request.method == 'POST' and request.form.get('action') != 'clear_context':
        output_type = request.form.get('output_type')
        voice = request.form.get('voice')
        selected_voice = voice
        system = request.form.get('system')
        user_input = request.form.get('user_input')
        model = request.form.get('model')
        selected_model = model

        # Check if PenphinMind is selected
        if model.lower() == "penphinmind":
            # Use bicameral_chat_direct function
            try:
                reply_text = bicameral_chat_direct(user_input, system)
                # Add to history
                history.append((user_input, reply_text, "PenphinMind"))
            except Exception as e:
                reply_text = f"Bicameral processing error: {e}"
        else:
            # Normal flow
            # Build message history context
            messages = []
            for user_msg, ai_reply, _ in history[-MAX_HISTORY:]:
                messages.append({"role": "user", "content": user_msg})
                messages.append({"role": "assistant", "content": ai_reply})
            messages.append({"role": "user", "content": user_input})

            try:
                if output_type == 'text':
                    # Direct function call for text response
                    reply = run_chat_completion(model, messages, system)
                    reply_text = reply
                    
                elif output_type == 'audio_file':
                    # Direct function call + TTS for audio file
                    reply = run_chat_completion(model, messages, system)
                    
                    # Generate TTS
                    model_path, config_path = find_voice_files(voice)
                    tmp_audio = f"{uuid.uuid4().hex}.wav"
                    
                    tts_result = subprocess.run(
                        ["/home/codemusic/roverseer_venv/bin/piper",
                         "--model", model_path,
                         "--config", config_path,
                         "--output_file", f"/tmp/{tmp_audio}"],
                        input=reply.encode(),
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                    
                    if tts_result.returncode == 0:
                        audio_url = url_for('serve_static', filename=tmp_audio)
                        reply_text = "(Audio response returned)"
                    else:
                        reply_text = f"TTS failed: {tts_result.stderr.decode()}"
                        
                else:  # speak
                    # Direct function call + TTS + speak
                    reply = run_chat_completion(model, messages, system)
                    
                    # Generate and play TTS
                    model_path, config_path = find_voice_files(voice)
                    tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"
                    
                    tts_result = subprocess.run(
                        ["/home/codemusic/roverseer_venv/bin/piper",
                         "--model", model_path,
                         "--config", config_path,
                         "--output_file", tmp_wav],
                        input=reply.encode(),
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                    
                    if tts_result.returncode == 0:
                        # Play audio
                        subprocess.run(["aplay", "-D", AUDIO_DEVICE, tmp_wav])
                        os.remove(tmp_wav)
                        reply_text = reply
                    else:
                        reply_text = f"TTS failed: {tts_result.stderr.decode()}"

                history.append((user_input, reply_text, model))
            except Exception as e:
                reply_text = f"Request failed: {e}"

    html = '''
    <html>
    <head>
        <title>RoverSeer Status</title>
        <style>
            body { font-family: Arial; background: #f4f4f4; color: #333; margin: 20px; }
            .topbar { background: #333; color: white; padding: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
            .status-container { display: flex; flex-wrap: wrap; align-items: center; gap: 15px; }
            .status-section { display: flex; flex-wrap: wrap; align-items: center; }
            .status-item { margin-right: 10px; }
            .status-link { color: #87CEEB; text-decoration: underline; }
            .status-link:hover { color: #ADD8E6; text-decoration: underline; }
            .sensor-data { background: #444; padding: 8px 12px; border-radius: 5px; display: flex; gap: 15px; }
            .sensor-item { display: flex; align-items: center; gap: 5px; }
            .refresh { cursor: pointer; font-size: 20px; }
            .chatbox { background: white; padding: 15px; border-radius: 8px; margin-top: 20px; box-shadow: 0 0 8px rgba(0,0,0,0.1); }
            textarea, input, select { width: 100%; padding: 8px; margin: 5px 0; }
            button { padding: 10px 15px; margin: 5px 0; }
            .history { background: #eef; padding: 10px; margin-top: 20px; border-radius: 8px; }
            .clear-button { background: #dc3545; color: white; border: none; cursor: pointer; }
            .clear-button:hover { background: #c82333; }
        </style>
        <script>
            function refreshPage() {
                window.location.reload();
            }
        </script>
    </head>
    <body>
        <div class="topbar">
            <div><strong>RoverSeer TCP Status</strong></div>
            <div class="status-container">
                <div class="status-section">
                    {% for name, info in statuses.items() %}
                        <span class="status-item">
                            {% if name == "Ollama" %}
                                <a href="http://roverseer.local:{{ info.port }}/api/tags" onclick="window.open(this.href, '_blank'); return false;" class="status-link">
                                    {{ info.status }} {{ name }} ({{ info.port }})
                                </a>
                            {% else %}
                                <a href="http://roverseer.local:{{ info.port }}" onclick="window.open(this.href, '_blank'); return false;" class="status-link">
                                    {{ info.status }} {{ name }} ({{ info.port }})
                                </a>
                            {% endif %}
                        </span>
                    {% endfor %}
                </div>
                <div class="sensor-data">
                    <span class="sensor-item">🌡️ HAT: {{ sensor_data.hat_temperature }}</span>
                    <span class="sensor-item">🖥️ CPU: {{ sensor_data.cpu_temperature }}</span>
                    <span class="sensor-item">🌊 {{ sensor_data.pressure }}</span>
                    <span class="sensor-item">🏔️ {{ sensor_data.altitude }}</span>
                    <span class="sensor-item">🌬️ Fan: {{ sensor_data.fan_state }}</span>
                </div>
                <span class="refresh" onclick="refreshPage()">🔄</span>
            </div>
        </div>

        <div class="chatbox">
            <h2>RoverSeer Quick Dialog</h2>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div></div>
                <button onclick="window.open('/logs', '_blank')" style="background: #4169e1; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
                    📊 View Logs
                </button>
            </div>
            <form method="post" id="chat_form">
                <input type="hidden" name="action" value="chat">
                
                <label>Output Type:</label>
                <select name="output_type">
                    <option value="speak">RoverSeer</option>
                    <option value="audio_file">Local Audio</option>
                    <option value="text">Local Text</option>
                </select>
                
                <label>System Message:</label>
                <input type="text" id="system_input" name="system" value="You are RoverSeer, a helpful assistant." />
                
                <label>Model:</label>
                <select id="model_select" name="model">
                    {% for tag in models %}
                        {% set model_info = model_stats.get(tag, {}) %}
                        {% set avg_time = model_info.get('average_runtime', None) %}
                        <option value="{{ tag }}" {% if tag == selected_model %}selected{% endif %}>
                            {{ tag }} {% if avg_time %}(Avg: {{ "%.1f"|format(avg_time) }}s){% else %}(no data yet){% endif %}
                        </option>
                    {% endfor %}
                </select>
                
                <label>Voice (if used):</label>
                <select name="voice">
                    {% for v in voices %}
                        <option value="{{ v }}" {% if v == selected_voice %}selected{% endif %}>{{ v }}</option>
                    {% endfor %}
                </select>
                
                <label>Your Message:</label>
                <textarea name="user_input">Tell me a fun science fact.</textarea>
                
                <button type="submit">Send</button>
            </form>
            
            <form method="post" style="display: inline;">
                <input type="hidden" name="action" value="clear_context">
                <button type="submit" class="clear-button">🗑️ Clear Context</button>
            </form>
            
            <h3>Response:</h3>
            <p>{{ reply_text }}</p>
            {% if audio_url %}
            <audio controls autoplay>
                <source src="{{ audio_url }}" type="audio/wav">
                Your browser does not support the audio element.
            </audio>
            {% endif %}

            <div class="history">
                <h3>Conversation History:</h3>
                {% for user, reply, model in history %}
                    <p><strong>You:</strong> {{ user }}</p>
                    <p><strong>{{ model }}:</strong> {{ reply }}</p>
                    <hr>
                {% endfor %}
            </div>
        </div>
    </body>
    </html>
    '''
    return render_template_string(html, statuses=statuses, reply_text=reply_text, audio_url=audio_url, history=history, models=models, selected_model=selected_model, voices=voices, selected_voice=selected_voice, sensor_data=sensor_data, model_stats=model_stats)


# -------- STATIC SWAGGER for /say -------- #
say_spec = {
    "parameters": [
        {
            "name": "body",
            "in": "body",
            "required": True,
            "schema": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "example": "Hello from RoverSeer!"
                    },
                    "voice": {
                        "type": "string",
                        "enum": list_voice_ids(),
                        "default": DEFAULT_VOICE
                    },
                    "speak": {
                        "type": "boolean",
                        "default": False,
                        "description": "If true, plays audio on device; if false, returns audio file"
                    }
                },
                "required": ["text"]
            }
        }
    ],
    "responses": {
        "200": {
            "description": "Audio spoken"
        }
    }
}

@app.route('/tts', methods=['POST'])
@swag_from(say_spec)
def text_to_speech():
    """
    Generate TTS audio and either play on rover or return file.
    ---
    consumes:
      - application/json
    produces:
      - application/json (if speak is true)
      - audio/wav (if speak is false)
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            text:
              type: string
              example: Hello from RoverSeer!
              required: true
            voice:
              type: string
              example: en_GB-jarvis
              default: en_GB-jarvis
            speak:
              type: boolean
              default: false
              description: If true, plays audio on device; if false, returns audio file
    responses:
      200:
        description: Audio spoken on device or WAV file returned
    """
    global current_audio_process
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "Invalid or missing JSON body"}), 400

    text = data.get("text", "").strip()
    voice_id = data.get("voice", DEFAULT_VOICE)
    
    # Default to returning file for /tts endpoint
    speak = data.get("speak", False)

    if not text:
        return jsonify({"status": "error", "message": "No text provided"}), 400

    try:
        model_path, config_path = find_voice_files(voice_id)
        tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"

        play_sound_async(play_tts_tune, voice_id)  # Play tune before TTS asynchronously
        tts_start_time = time.time()
        result = subprocess.run(
            ["/home/codemusic/roverseer_venv/bin/piper",
             "--model", model_path,
             "--config", config_path,
             "--output_file", tmp_wav],
            input=text.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        tts_processing_time = time.time() - tts_start_time

        if result.returncode != 0:
            return jsonify({
                "status": "error",
                "message": f"Piper TTS failed: {result.stderr.decode()}"
            }), 500

        # Log TTS usage
        log_tts_usage(voice_id, text, tmp_wav, tts_processing_time)
        
        if speak:
            # Transition to audio playback stage
            start_system_processing('aplay')
            
            # Play using Popen for interruptibility
            current_audio_process = subprocess.Popen(
                ["aplay", "-D", AUDIO_DEVICE, tmp_wav],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            current_audio_process.wait()
            current_audio_process = None
            
            os.remove(tmp_wav)
            
            # Stop all LEDs after playback
            stop_system_processing()

            return jsonify({"status": "success", "message": f"Spoken with {voice_id}: {text}"})
        else:
            return send_file(tmp_wav, mimetype="audio/wav", as_attachment=True, download_name="tts.wav")
            
    except Exception as e:
        stop_system_processing()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/tts', methods=['POST'])
def tts():
    """
    Generate and return WAV audio using Piper TTS.
    ---
    consumes:
      - application/json
    parameters:
      - name: text
        in: body
        required: true
        schema:
          type: object
          properties:
            text:
              type: string
              example: This is a downloadable file
    produces:
      - audio/wav
    responses:
      200:
        description: WAV file returned
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "Invalid or missing JSON body"}), 400

    text = data.get("text", "").strip()
    voice_id = data.get("voice", DEFAULT_VOICE)

    if not text:
        return jsonify({"status": "error", "message": "No text provided"}), 400

    try:
        model_path, config_path = find_voice_files(voice_id)
        tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"

        play_sound_async(play_tts_tune, voice_id)  # Play tune before TTS asynchronously
        tts_start_time = time.time()
        result = subprocess.run(
            ["/home/codemusic/roverseer_venv/bin/piper",
             "--model", model_path,
             "--config", config_path,
             "--output_file", tmp_wav],
            input=text.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        tts_processing_time = time.time() - tts_start_time

        if result.returncode != 0:
            return jsonify({
                "status": "error",
                "message": f"Piper TTS failed: {result.stderr.decode()}"
            }), 500

        # Log TTS usage
        log_tts_usage(voice_id, text, tmp_wav, tts_processing_time)
        
        return send_file(tmp_wav, mimetype="audio/wav", as_attachment=True, download_name="tts.wav")
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat_unified():
    """
    Chat with Ollama and return text, audio file, or speak on device.
    ---
    consumes:
      - application/json
    produces:
      - application/json (if output_type is 'text' or 'speak')
      - audio/wav (if output_type is 'audio_file')
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            model:
              type: string
              example: tinydolphin:1.1b
            system:
              type: string
              example: You are RoverSeer, a helpful assistant.
            voice:
              type: string
              example: en_GB-jarvis
            messages:
              type: array
              items:
                type: object
                properties:
                  role:
                    type: string
                    example: user
                  content:
                    type: string
                    example: Tell me a fun science fact.
            output_type:
              type: string
              enum: ['text', 'audio_file', 'speak']
              description: Output format - text only, audio file, or speak on device
          required:
            - messages
    responses:
      200:
        description: Response in requested format
    """
    global current_audio_process
    data = request.get_json(silent=True)
    if not data or "messages" not in data:
        return jsonify({"error": "Missing messages"}), 400

    model = data.get("model", DEFAULT_MODEL)
    messages = data.get("messages", [])
    system_message = data.get("system", "You are RoverSeer, a helpful assistant.")
    voice = data.get("voice", DEFAULT_VOICE)
    
    # For backward compatibility, determine output type from endpoint
    output_type = data.get("output_type")
    if not output_type:
        # Default to text output for /chat endpoint
        output_type = "text"
    
    try:
        # Start LLM processing LED
        start_system_processing('B')
        reply = run_chat_completion(model, messages, system_message)
        
        # For text-only response, stop LEDs
        if output_type == "text":
            stop_system_processing()
            return jsonify({
                "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                "object": "chat.completion",
                "created": int(uuid.uuid1().time),
                "model": model,
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": reply},
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": len(json.dumps(messages).split()),
                    "completion_tokens": len(reply.split()),
                    "total_tokens": len(json.dumps(messages).split()) + len(reply.split())
                }
            })
        
        # For audio outputs, generate TTS
        if output_type in ["audio_file", "speak"]:
            # Play voice intro before TTS (only when speaking)
            if output_type == "speak":
                play_sound_async(play_voice_intro, voice)

            # Generate WAV with Piper
            model_path, config_path = find_voice_files(voice)
            tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"
            
            # Transition to TTS stage
            start_system_processing('C')
            play_sound_async(play_tts_tune, voice)  # Play tune before TTS asynchronously
            
            tts_start_time = time.time()
            tts_result = subprocess.run(
                ["/home/codemusic/roverseer_venv/bin/piper",
                 "--model", model_path,
                 "--config", config_path,
                 "--output_file", tmp_wav],
                input=reply.encode(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            tts_processing_time = time.time() - tts_start_time

            if tts_result.returncode != 0:
                return jsonify({
                    "status": "error",
                    "message": f"Piper TTS failed: {tts_result.stderr.decode()}"
                }), 500

            # Log TTS usage
            log_tts_usage(voice, reply, tmp_wav, tts_processing_time)

            if output_type == "speak":
                # Speak on rover
                # Transition to audio playback
                start_system_processing('aplay')
                
                # Speak on rover using Popen for interruptibility
                current_audio_process = subprocess.Popen(
                    ["aplay", "-D", AUDIO_DEVICE, tmp_wav],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                current_audio_process.wait()
                current_audio_process = None
                
                os.remove(tmp_wav)
                
                # Stop all LEDs after playback
                stop_system_processing()

                return jsonify({
                    "status": "success",
                    "model": model,
                    "spoken_text": reply,
                    "voice_used": voice
                })
            else:  # audio_file
                # Return audio file
                return send_file(tmp_wav, mimetype="audio/wav", as_attachment=True, download_name="chat_tts.wav")

    except Exception as e:
        stop_system_processing()
        return jsonify({"error": str(e)}), 500

@app.route('/insight', methods=['POST'])
def insight():
    """
    Quick single-prompt chat with optional system role.
    ---
    consumes:
      - application/json
    parameters:
      - in: body
        name: input
        required: true
        schema:
          type: object
          properties:
            model:
              type: string
              example: tinydolphin:1.1b
            system:
              type: string
              example: You are RoverSeer, an expert on strange animal facts.
            prompt:
              type: string
              example: Tell me a weird fact about platypuses.
          required:
            - prompt
    responses:
      200:
        description: Ollama single-turn response
    """
    data = request.get_json(silent=True)
    if not data or "prompt" not in data:
        return jsonify({"status": "error", "message": "Missing prompt"}), 400

    model = data.get("model", DEFAULT_MODEL)
    prompt = data["prompt"].strip()
    messages = [{"role": "user", "content": prompt}]
    system_message = data.get("system", "You are RoverSeer, an insightful assistant.")

    try:
        reply = run_chat_completion(model, messages, system_message)
        return jsonify({"response": reply})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/v1/audio/transcriptions', methods=['POST'])
def transcribe_openai_style():
    """
    OpenAI-style Whisper transcription endpoint
    ---
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        required: true
        type: file
    responses:
      200:
        description: Transcription in OpenAI format
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    tmp_path = f"/tmp/{uuid.uuid4().hex}.wav"
    file.save(tmp_path)

    try:
        transcript = transcribe_audio(tmp_path)
        os.remove(tmp_path)
        return jsonify({"text": transcript})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/v1/audio/chat_voice', methods=['POST'])
def transcribe_chat_voice():
    """
    Transcribe audio, get LLM response, and either speak or return audio.
    ---
    consumes:
      - multipart/form-data
    produces:
      - application/json (if speak is true)
      - audio/wav (if speak is false)
    parameters:
      - in: formData
        name: file
        type: file
        required: true
      - in: formData
        name: model
        type: string
        required: false
        default: tinydolphin:1.1b
      - in: formData
        name: voice
        type: string
        required: false
        default: en_GB-jarvis
      - in: formData
        name: speak
        type: boolean
        required: false
        default: true
        description: If true, speaks on device; if false, returns audio file
    responses:
      200:
        description: Either JSON with transcript/reply or WAV audio file
    """
    global current_audio_process
    if 'file' not in request.files:
        return jsonify({"error": "Missing audio file"}), 400

    file = request.files['file']
    model = request.form.get('model', DEFAULT_MODEL)
    voice = request.form.get('voice', DEFAULT_VOICE)
    
    # Default to playing on device for this endpoint
    speak = request.form.get('speak', 'true').lower() == 'true'

    tmp_audio = f"/tmp/{uuid.uuid4().hex}.wav"
    file.save(tmp_audio)

    try:
        # 1. Transcribe
        transcript = transcribe_audio(tmp_audio)
        os.remove(tmp_audio)

        # 2. LLM reply
        # Transition to LLM stage
        start_system_processing('B')
        messages = [{"role": "user", "content": transcript}]
        system_message = "You are RoverSeer, a helpful voice assistant."
        reply = run_chat_completion(model, messages, system_message)

        # Play voice intro before TTS (only when speaking)
        if speak:
            play_sound_async(play_voice_intro, voice)

        # 3. TTS (Piper)
        model_path, config_path = find_voice_files(voice)
        tmp_output = f"/tmp/{uuid.uuid4().hex}_spoken.wav"
        
        # Transition to TTS stage
        start_system_processing('C')
        play_sound_async(play_tts_tune, voice)  # Play TTS tune asynchronously
        
        tts_start_time = time.time()
        tts_result = subprocess.run(
            ["/home/codemusic/roverseer_venv/bin/piper",
             "--model", model_path,
             "--config", config_path,
             "--output_file", tmp_output],
            input=reply.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        tts_processing_time = time.time() - tts_start_time

        if tts_result.returncode != 0:
            return jsonify({
                "error": "Piper failed",
                "stderr": tts_result.stderr.decode()
            }), 500

        # Log TTS usage
        log_tts_usage(voice, reply, tmp_output, tts_processing_time)
        
        if speak:
            # 4. Speak it!
            # Transition to audio playback
            start_system_processing('aplay')
            
            # Speak on rover using Popen for interruptibility
            current_audio_process = subprocess.Popen(
                ["aplay", "-D", AUDIO_DEVICE, tmp_output],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            current_audio_process.wait()
            current_audio_process = None
            
            os.remove(tmp_output)
            
            # Stop all LEDs
            stop_system_processing()

            return jsonify({
                "transcript": transcript,
                "reply": reply,
                "voice": voice,
                "model": model
            })
        else:
            # 4. Return WAV
            return send_file(tmp_output, mimetype="audio/wav", as_attachment=True, download_name="response.wav")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/bicameral_chat', methods=['POST'])
def bicameral_chat():
    """
    Two-agent bicameral mind system that converges perspectives, with random convergence role assignment.
    ---
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            prompt:
              type: string
              example: What is the nature of consciousness?
              description: The input prompt to process through two minds
            system:
              type: string
              example: You are an expert philosopher.
              description: System message to prepend to convergence (optional)
              default: ""
            voice:
              type: string
              example: en_GB-jarvis
              description: Voice for the final output
            speak:
              type: boolean
              example: true
              description: If true, speaks on device; if false, returns audio file
          required:
            - prompt
    responses:
      200:
        description: Either JSON with spoken status or WAV audio file
    """
    global current_audio_process, convergence_model
    data = request.get_json(silent=True)
    if not data or "prompt" not in data:
        return jsonify({"status": "error", "message": "Missing prompt"}), 400

    prompt = data.get("prompt", "").strip()
    system = data.get("system", "").strip()
    voice = data.get("voice", DEFAULT_VOICE)
    speak = data.get("speak", True)

    if not prompt:
        return jsonify({"status": "error", "message": "No prompt provided"}), 400

    try:
        # Play the unique bicameral connection tune
        play_sound_async(play_bicameral_connection_tune)
        
        # Start LLM processing indicator
        start_system_processing('B')
        
        # System message for the bicameral process
        bicameral_system_message = f"Bicameral processing for: {prompt[:50]}..."
        
        # Randomly decide which model will handle convergence
        convergence_model = random.choice([logical_model, creative_model])
        first_model = logical_model if convergence_model == creative_model else creative_model
        
        try:
            # 1. Send to First Mind
            first_start_time = time.time()
            first_messages = [{"role": "user", "content": prompt}]
            first_system = logical_message if first_model == logical_model else creative_message
            
            first_response = run_chat_completion(first_model, first_messages, first_system, skip_logging=True)
            first_time = time.time() - first_start_time
            
            # Keep LLM LED state, don't stop
            time.sleep(0.5)  # Brief pause between minds
            
            # 2. Send to Second Mind (which will also handle convergence)
            second_start_time = time.time()
            second_messages = [{"role": "user", "content": prompt}]
            second_system = logical_message if convergence_model == logical_model else creative_message
            
            second_response = run_chat_completion(convergence_model, second_messages, second_system, skip_logging=True)
            second_time = time.time() - second_start_time
            
            # Keep LLM LED state, don't stop
            time.sleep(0.5)  # Brief pause before convergence
            
            # 3. Send all to Convergence Mind (using the same model as second mind)
            convergence_start_time = time.time()
            
            # Build convergence prompt base
            convergence_prompt_base = f"""
                    [Prompt:
                    {prompt}

                    First Mind Perspective:
                    {first_response}

                    Second Mind Perspective:
                    {second_response}]"""
            
            # If system message provided, prepend it
            if system:
                convergence_prompt = system + ". " + convergence_prompt_base
            else:
                convergence_prompt = convergence_prompt_base
            
            convergence_messages = [{"role": "user", "content": convergence_prompt}]

            final_response = run_chat_completion(convergence_model, convergence_messages, convergence_message + prompt, skip_logging=True)
            convergence_time = time.time() - convergence_start_time
            
            # Log PenphinMind usage
            log_penphin_mind_usage(
                first_model, convergence_model, convergence_model,
                bicameral_system_message, prompt,
                first_response, first_time,
                second_response, second_time,
                final_response, convergence_time
            )
            
            # Generate TTS for final response
            model_path, config_path = find_voice_files(voice)
            tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"
            
            # Transition to TTS stage
            start_system_processing('C')
            play_sound_async(play_tts_tune, voice)  # Play TTS tune asynchronously
            
            tts_start_time = time.time()
            tts_result = subprocess.run(
                ["/home/codemusic/roverseer_venv/bin/piper",
                 "--model", model_path,
                 "--config", config_path,
                 "--output_file", tmp_wav],
                input=final_response.encode(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            tts_processing_time = time.time() - tts_start_time

            if tts_result.returncode != 0:
                stop_system_processing()
                return jsonify({
                    "status": "error",
                    "message": f"Text-to-speech conversion failed: {tts_result.stderr.decode()}"
                }), 500

            # Log TTS usage
            log_tts_usage(voice, final_response, tmp_wav, tts_processing_time)
            
            if speak:
                # Play voice intro before speaking
                play_sound_async(play_voice_intro, voice)
                
                # Transition to audio playback
                start_system_processing('aplay')
                
                # Speak on rover
                subprocess.run(["aplay", "-D", AUDIO_DEVICE, tmp_wav])
                os.remove(tmp_wav)
                
                # Stop all LEDs
                stop_system_processing()
                
                return jsonify({
                    "status": "success",
                    "original_prompt": prompt,
                    "first_response": first_response,
                    "second_response": second_response,
                    "final_synthesis": final_response,
                    "voice_used": voice,
                    "spoken": True
                })
            else:
                # Return audio file
                stop_system_processing()
                return send_file(tmp_wav, mimetype="audio/wav", as_attachment=True, download_name="bicameral_synthesis.wav")
                
        except Exception as e:
            stop_system_processing()
            error_msg = str(e)
            if "Connection refused" in error_msg:
                return jsonify({
                    "status": "error",
                    "message": "Failed to connect to Ollama service. Please ensure Ollama is running."
                }), 500
            elif "model not found" in error_msg.lower():
                return jsonify({
                    "status": "error",
                    "message": f"Model not found: {error_msg}"
                }), 500
            else:
                return jsonify({
                    "status": "error",
                    "message": f"Bicameral processing failed: {error_msg}"
                }), 500

    except Exception as e:
        stop_system_processing()
        return jsonify({
            "status": "error",
            "message": f"System error: {str(e)}"
        }), 500

@app.route('/logs')
def logs():
    """Display logs page with top performing models and log viewer"""
    selected_log_type = request.args.get('log_type', None)
    selected_date = request.args.get('date', None)
    log_entries = []
    available_dates = []
    
    if selected_log_type:
        # Get available dates for this log type
        available_dates = get_available_log_dates(selected_log_type)
        
        # If no date selected, use the most recent
        if not selected_date and available_dates:
            selected_date = available_dates[0]
        
        # Parse the log file for the selected date
        if selected_date:
            log_entries = parse_log_file(selected_log_type, date=selected_date)
    
    # Get top performing models from stats
    model_stats = load_model_stats()
    # Convert to list of tuples and sort by average runtime
    top_models = []
    for model, stats in model_stats.items():
        if stats.get('run_count', 0) > 0:
            top_models.append((model, stats['average_runtime']))
    top_models.sort(key=lambda x: x[1])  # Sort by runtime (fastest first)
    top_models = top_models[:10]  # Top 10
    
    # Available log types
    log_types = [
        {"id": "llm_usage", "name": "LLM Usage", "icon": "🤖"},
        {"id": "asr_usage", "name": "ASR Usage", "icon": "🎤"},
        {"id": "tts_usage", "name": "TTS Usage", "icon": "🔊"},
        {"id": "penphin_mind", "name": "PenphinMind", "icon": "🧠"}
    ]
    
    html = '''
    <html>
    <head>
        <title>RoverSeer Logs</title>
        <style>
            body { font-family: Arial; background: #f4f4f4; color: #333; margin: 20px; }
            .header { background: #333; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; }
            .container { display: flex; gap: 20px; margin-top: 20px; }
            .sidebar { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 8px rgba(0,0,0,0.1); flex: 0 0 300px; }
            .main-content { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 8px rgba(0,0,0,0.1); flex: 1; }
            .log-type { background: #f0f0f0; padding: 10px 15px; margin: 5px 0; border-radius: 5px; cursor: pointer; text-decoration: none; color: #333; display: block; transition: background 0.3s; }
            .log-type:hover { background: #e0e0e0; }
            .log-type.active { background: #4169e1; color: white; }
            .top-models { margin-bottom: 30px; }
            .model-item { background: #f8f8f8; padding: 8px; margin: 3px 0; border-radius: 3px; display: flex; justify-content: space-between; }
            .log-entry { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; white-space: pre-wrap; font-family: monospace; font-size: 12px; }
            .refresh-btn { background: #4CAF50; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; }
            .refresh-btn:hover { background: #45a049; }
            .rank { font-weight: bold; color: #666; margin-right: 10px; }
            .no-logs { color: #999; font-style: italic; text-align: center; padding: 20px; }
            .date-selector { margin: 15px 0; }
            .date-selector select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; }
            .log-info { background: #e7f3ff; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 14px; }
        </style>
        <script>
            function refreshPage() {
                window.location.reload();
            }
            function changeDate(logType) {
                var select = document.getElementById('date-select');
                var date = select.value;
                window.location.href = '/logs?log_type=' + logType + '&date=' + date;
            }
        </script>
    </head>
    <body>
        <div class="header">
            <h1>🗄️ RoverSeer Logs</h1>
            <button class="refresh-btn" onclick="refreshPage()">🔄 Refresh</button>
        </div>
        
        <div class="container">
            <div class="sidebar">
                <div class="top-models">
                    <h3>🏆 Top 10 Fastest Models</h3>
                    {% if top_models %}
                        {% for model, avg_time in top_models %}
                            <div class="model-item">
                                <span><span class="rank">#{{ loop.index }}</span>{{ model }}</span>
                                <span>{{ "%.2f"|format(avg_time) }}s</span>
                            </div>
                        {% endfor %}
                    {% else %}
                        <p class="no-logs">No performance data yet</p>
                    {% endif %}
                </div>
                
                <h3>📁 Log Types</h3>
                {% for log_type in log_types %}
                    <a href="/logs?log_type={{ log_type.id }}" 
                       class="log-type {% if selected_log_type == log_type.id %}active{% endif %}">
                        {{ log_type.icon }} {{ log_type.name }}
                    </a>
                {% endfor %}
            </div>
            
            <div class="main-content">
                {% if selected_log_type %}
                    <h2>{{ selected_log_type|replace("_", " ")|title }} Logs</h2>
                    
                    {% if selected_log_type == 'penphin_mind' %}
                        <div class="log-info">
                            ℹ️ PenphinMind logs show the complete 3-mind (2 minds + convergence) processing flow. 
                            Individual mind calls are not logged separately to keep logs clean.
                        </div>
                    {% endif %}
                    
                    {% if available_dates %}
                        <div class="date-selector">
                            <label>Select Date:</label>
                            <select id="date-select" onchange="changeDate('{{ selected_log_type }}')">
                                {% for date in available_dates %}
                                    <option value="{{ date }}" {% if date == selected_date %}selected{% endif %}>
                                        {{ date }}
                                    </option>
                                {% endfor %}
                            </select>
                        </div>
                    {% endif %}
                    
                    {% if log_entries %}
                        <div class="log-entries">
                            {% for entry in log_entries %}
                                <div class="log-entry">{{ entry }}</div>
                            {% endfor %}
                        </div>
                    {% else %}
                        <p class="no-logs">No log entries found for {{ selected_log_type|replace("_", " ") }}{% if selected_date %} on {{ selected_date }}{% endif %}</p>
                    {% endif %}
                {% else %}
                    <h2>Select a Log Type</h2>
                    <p>Click on a log type in the sidebar to view its entries.</p>
                {% endif %}
            </div>
        </div>
    </body>
    </html>
    '''
    
    return render_template_string(html, 
                                 top_models=top_models, 
                                 log_types=log_types, 
                                 selected_log_type=selected_log_type,
                                 selected_date=selected_date,
                                 available_dates=available_dates,
                                 log_entries=log_entries)

@app.route('/v1/audio/chat', methods=['POST'])
def transcribe_and_chat():
    """
    Transcribe audio and send result to LLM chat, returning assistant's reply.
    ---
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        type: file
        required: true
      - in: formData
        name: model
        type: string
        required: false
        default: tinydolphin:1.1b
      - in: formData
        name: voice
        type: string
        required: false
        default: en_GB-jarvis
    responses:
      200:
        description: Assistant's response to transcribed speech
    """
    if 'file' not in request.files:
        return jsonify({"error": "Missing audio file"}), 400

    file = request.files['file']
    model = request.form.get('model', DEFAULT_MODEL)
    voice = request.form.get('voice', DEFAULT_VOICE)

    tmp_path = f"/tmp/{uuid.uuid4().hex}.wav"
    file.save(tmp_path)

    try:
        # Transcribe audio
        transcript = transcribe_audio(tmp_path)
        os.remove(tmp_path)

        # Send to LLM
        messages = [{"role": "user", "content": transcript}]
        system_message = "You are RoverSeer, a helpful assistant responding to transcribed audio."

        reply = run_chat_completion(model, messages, system_message, sound_fx=True)

        return jsonify({
            "transcript": transcript,
            "model": model,
            "voice": voice,
            "reply": reply
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/v1/chat/completions', methods=['POST'])
def openai_compatible_chat():
    """
    OpenAI-compatible chat completions endpoint that aliases to our chat system.
    ---
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            model:
              type: string
              example: tinydolphin:1.1b
              description: The model to use for completion
            messages:
              type: array
              items:
                type: object
                properties:
                  role:
                    type: string
                    enum: ['system', 'user', 'assistant']
                  content:
                    type: string
              description: Array of messages in the conversation
            temperature:
              type: number
              default: 0.7
              description: Sampling temperature (ignored in current implementation)
            max_tokens:
              type: integer
              description: Maximum tokens to generate (ignored in current implementation)
          required:
            - model
            - messages
    responses:
      200:
        description: OpenAI-compatible chat completion response
        schema:
          type: object
          properties:
            id:
              type: string
              example: chatcmpl-abc123
            object:
              type: string
              example: chat.completion
            created:
              type: integer
              example: 1677652288
            model:
              type: string
              example: tinydolphin:1.1b
            choices:
              type: array
              items:
                type: object
                properties:
                  index:
                    type: integer
                  message:
                    type: object
                    properties:
                      role:
                        type: string
                        example: assistant
                      content:
                        type: string
                        example: I'm a helpful AI assistant.
                  finish_reason:
                    type: string
                    example: stop
            usage:
              type: object
              properties:
                prompt_tokens:
                  type: integer
                completion_tokens:
                  type: integer
                total_tokens:
                  type: integer
    """
    data = request.get_json(silent=True)
    if not data or "messages" not in data:
        return jsonify({"error": {"message": "Missing messages", "type": "invalid_request_error"}}), 400

    model = data.get("model", DEFAULT_MODEL)
    messages = data.get("messages", [])
    
    # Extract system message if present
    system_message = None
    filtered_messages = []
    
    for msg in messages:
        if msg.get("role") == "system":
            system_message = msg.get("content", "")
        else:
            filtered_messages.append(msg)
    
    # Use default system message if none provided
    if not system_message:
        system_message = "You are RoverSeer, a helpful assistant."

    try:
        # Start LLM processing LED if this is from the recording pipeline
        if not any(stage for stage in pipeline_stages.values() if stage):
            start_system_processing('B')
        
        reply = run_chat_completion(model, filtered_messages, system_message)
        
        # Stop LED processing if we started it
        if pipeline_stages.get('llm_active'):
            stop_system_processing()
        
        # Return OpenAI-compatible response format
        return jsonify({
            "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model,
            "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": reply},
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": len(json.dumps(filtered_messages).split()),
                "completion_tokens": len(reply.split()),
                "total_tokens": len(json.dumps(filtered_messages).split()) + len(reply.split())
            }
        })
        
    except Exception as e:
        # Stop LED processing on error
        if pipeline_stages.get('llm_active'):
            stop_system_processing()
        
        return jsonify({
            "error": {
                "message": str(e),
                "type": "internal_server_error"
            }
        }), 500
    
# Initialize Rainbow Driver before running the app
rainbow = None
try:
    rainbow = RainbowDriver(num_leds=7, brightness=2)
    setup_button_handlers()  # Setup button handlers after initialization
    start_sound_queue_worker()  # Start the sound queue worker
    print("✅ Rainbow Driver initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize Rainbow Driver: {e}")
    rainbow = None



@app.route('/models', methods=['GET'])
def list_models():
    """
    List available Ollama models with parameter counts, sorted by size.
    ---
    produces:
      - application/json
    responses:
      200:
        description: List of available models with details
        schema:
          type: object
          properties:
            models:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                    example: tinydolphin:1.1b
                  size:
                    type: string
                    example: 1.1B
                  parameters:
                    type: string
                    example: 1.1 billion
                  quantization:
                    type: string
                    example: Q4_0
                  size_gb:
                    type: number
                    example: 1.23
                  average_runtime:
                    type: number
                    example: 3.45
                    description: Average runtime in seconds (null if no data)
                  run_count:
                    type: integer
                    example: 42
                    description: Number of times this model has been run
                  last_runtime:
                    type: number
                    example: 3.21
                    description: Runtime of the last execution in seconds
            count:
              type: integer
              example: 15
    """
    try:
        # Get models from Ollama
        res = requests.get("http://roverseer.local:11434/api/tags")
        if not res.ok:
            return jsonify({"error": "Failed to fetch models from Ollama"}), 500
            
        tags_data = res.json()
        models_info = []
        
        # Process each model
        for model in tags_data.get("models", []):
            model_name = model.get("name", "")
            model_size_bytes = model.get("size", 0)
            details = model.get("details", {})
            
            # Get actual parameter size from API
            param_size = details.get("parameter_size", "unknown")
            quantization = details.get("quantization_level", "unknown")
            
            # Convert parameter size to friendly format
            friendly_size = "unknown"
            if param_size != "unknown":
                # Handle different formats: "1B", "999.89M", "1.2B", etc.
                if param_size.endswith("M"):
                    # Convert millions
                    num = float(param_size[:-1])
                    friendly_size = f"{int(num)} million" if num == int(num) else f"{num} million"
                elif param_size.endswith("B"):
                    # Convert billions
                    num = float(param_size[:-1])
                    friendly_size = f"{int(num)} billion" if num == int(num) else f"{num} billion"
                else:
                    friendly_size = param_size
            
            # Add model size in GB if available
            size_gb = model_size_bytes / (1024 * 1024 * 1024) if model_size_bytes > 0 else 0
            
            models_info.append({
                "name": model_name,
                "size": param_size,
                "parameters": friendly_size,
                "quantization": quantization,
                "size_gb": round(size_gb, 2),
                "last_modified": model.get("modified_at", "")
            })
        
        # Load runtime statistics
        model_stats = load_model_stats()
        
        # Add runtime info to each model
        for model in models_info:
            model_name = model["name"]
            if model_name in model_stats:
                model["average_runtime"] = round(model_stats[model_name]["average_runtime"], 2)
                model["run_count"] = model_stats[model_name]["run_count"]
                model["last_runtime"] = round(model_stats[model_name]["last_runtime"], 2)
            else:
                model["average_runtime"] = None
                model["run_count"] = 0
                model["last_runtime"] = None
        
        # Sort models by parameter size using the existing function
        model_names = [m["name"] for m in models_info]
        sorted_names = sort_models_by_size(model_names, models_info)
        
        # Reorder models_info based on sorted names
        sorted_models = []
        for name in sorted_names:
            # Special handling for PenphinMind
            if name == "PenphinMind" and not any(m["name"] == "PenphinMind" for m in models_info):
                sorted_models.append({
                    "name": "PenphinMind",
                    "size": "Bicameral",
                    "parameters": "3 specialized models",
                    "size_gb": 0,
                    "last_modified": ""
                })
            else:
                for model in models_info:
                    if model["name"] == name:
                        sorted_models.append(model)
                        break
        
        return jsonify({
            "models": sorted_models,
            "count": len(sorted_models)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------- MAIN -------- #
if __name__ == '__main__':
    try:
        app.run(host="0.0.0.0", port=5000)
    finally:
        # Cleanup on exit
        stop_sound_queue_worker()
        if rainbow:
            # Turn off all LEDs
            for led in ['A', 'B', 'C']:
                rainbow.button_leds[led].off()
            # Clear display
            import fourletterphat as flp
            flp.clear()
            flp.show()