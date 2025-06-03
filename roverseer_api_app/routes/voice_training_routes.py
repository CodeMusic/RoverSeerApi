"""
Voice Training Routes - Neural Voice Synthesis Management
Handles custom voice training pipeline using textymcspeechy-piper
"""

from flask import Blueprint, request, jsonify
import subprocess
import os
import signal
import json
from datetime import datetime
from helpers.logging_helper import LoggingHelper
import time
from pathlib import Path

from config import DebugLog
from memory.usage_logger import log_training_event
from expression.sound_orchestration import (
    play_sound_async, 
    play_neural_training_start_tune,
    play_neural_training_status_tune, 
    play_neural_training_complete_tune,
    play_neural_training_error_tune
)
from embodiment.display_manager import (
    scroll_text_on_display,
    display_text,
    display_number,
    clear_display
)

def filter_hidden_files(files):
    """Filter out macOS and system hidden files from a list of files"""
    return [f for f in files if not f.startswith('.') and not f.startswith('_') and f != 'Thumbs.db']

# Create the training blueprint following RoverSeer naming patterns
neural_voice_synthesis_bp = Blueprint('neural_voice_synthesis', __name__)

# Voice Training Configuration - Psychology-focused path naming
class VoiceTrainingArchitecture:
    """Centralized configuration for voice training neural pathways"""
    VOICE_DATA_PATH = "/home/codemusic/texty/voice_data"  # Input voice samples directory
    OUTPUT_ONNX_PATH = "/home/codemusic/texty/output_onnx"  # Trained voice models output  
    TRAINING_SCRIPT_PATH = "/home/codemusic/docker-stacks/textymcspeechy/train.py"  # Training orchestrator
    TRAINING_LOG_PATH = "/tmp/training.log"  # Training session memory
    TRAINING_LOCK_PATH = "/tmp/training.lock"  # Prevents concurrent training
    TRAINING_PID_PATH = "/tmp/training.pid"  # Process identification memory
    VOICE_REGISTRY_PATH = "/tmp/voice_training_registry.json"  # Voice metadata registry

    @classmethod
    def validate_neural_environment(cls):
        """Validate that the neural training environment is properly configured"""
        missing_paths = []
        
        for path in [cls.VOICE_DATA_PATH, cls.TRAINING_SCRIPT_PATH]:
            if not os.path.exists(path):
                missing_paths.append(path)
        
        if missing_paths:
            return False, f"Missing neural components: {', '.join(missing_paths)}"
        
        # Ensure output directory exists
        os.makedirs(cls.OUTPUT_ONNX_PATH, exist_ok=True)
        
        return True, "Neural environment validated"

class TrainingStateManager:
    """Manages the psychological state of voice training processes"""
    
    @staticmethod
    def is_neural_synthesis_active():
        """Check if neural voice synthesis is currently active"""
        return os.path.exists(VoiceTrainingArchitecture.TRAINING_LOCK_PATH)
    
    @staticmethod
    def get_active_synthesis_identity():
        """Get the identity of the voice currently being synthesized"""
        try:
            with open(VoiceTrainingArchitecture.TRAINING_LOCK_PATH, 'r') as f:
                return f.read().strip()
        except FileNotFoundError:
            return None
    
    @staticmethod
    def get_neural_training_log():
        """Retrieve the current neural training log"""
        try:
            with open(VoiceTrainingArchitecture.TRAINING_LOG_PATH, 'r') as f:
                return f.read()
        except FileNotFoundError:
            return None
    
    @staticmethod
    def get_neural_log_length():
        """Get the length of the neural training log for progress estimation"""
        try:
            with open(VoiceTrainingArchitecture.TRAINING_LOG_PATH, 'r') as f:
                return len(f.readlines())
        except FileNotFoundError:
            return 0
    
    @staticmethod
    def register_neural_synthesis(voice_identity, status):
        """Register neural synthesis events in the voice psychology registry"""
        registry_path = VoiceTrainingArchitecture.VOICE_REGISTRY_PATH
        
        # Load existing registry
        registry = {}
        if os.path.exists(registry_path):
            try:
                with open(registry_path, 'r') as f:
                    registry = json.load(f)
            except Exception:
                registry = {}
        
        # Update voice entry
        if voice_identity not in registry:
            registry[voice_identity] = {}
        
        registry[voice_identity].update({
            'last_status': status,
            'last_update': datetime.now().isoformat()
        })
        
        # Save registry
        try:
            with open(registry_path, 'w') as f:
                json.dump(registry, f, indent=2)
        except Exception as e:
            DebugLog(f"Failed to update voice registry: {e}")
    
    @staticmethod
    def get_voice_synthesis_registry():
        """Get the complete voice synthesis psychology registry"""
        registry_path = VoiceTrainingArchitecture.VOICE_REGISTRY_PATH
        
        if not os.path.exists(registry_path):
            return {}
        
        try:
            with open(registry_path, 'r') as f:
                return json.load(f)
        except Exception:
            return {}
    
    # Legacy methods for backward compatibility
    @staticmethod
    def is_training_active():
        """Legacy method - redirects to is_neural_synthesis_active"""
        return TrainingStateManager.is_neural_synthesis_active()
    
    @staticmethod
    def get_current_training_voice():
        """Legacy method - redirects to get_active_synthesis_identity"""
        return TrainingStateManager.get_active_synthesis_identity()
    
    @staticmethod
    def initiate_training_session(voice_name):
        """Legacy method - redirects to register_neural_synthesis"""
        TrainingStateManager.register_neural_synthesis(voice_name, "neural_synthesis_initiated")
    
    @staticmethod
    def terminate_training_session():
        """Legacy method - cleanup training artifacts"""
        current_voice = TrainingStateManager.get_active_synthesis_identity()
        
        # Cleanup training artifacts
        for file_path in [VoiceTrainingArchitecture.TRAINING_LOCK_PATH, 
                         VoiceTrainingArchitecture.TRAINING_PID_PATH]:
            if os.path.exists(file_path):
                os.remove(file_path)
        
        if current_voice:
            TrainingStateManager.register_neural_synthesis(current_voice, "neural_synthesis_terminated")
    
    @staticmethod
    def update_voice_registry(voice_name, status):
        """Legacy method - redirects to register_neural_synthesis"""
        TrainingStateManager.register_neural_synthesis(voice_name, status)

@neural_voice_synthesis_bp.route('/train-voice', methods=['POST'])
def initiate_neural_voice_synthesis():
    """Initiate the neural voice synthesis process for a selected voice identity"""
    
    # Trigger neural training start sound
    play_sound_async(play_neural_training_start_tune)
    
    try:
        data = request.get_json()
        voice_identity = data.get('voice_name')
        
        if not voice_identity:
            # Error sound and display
            play_sound_async(play_neural_training_error_tune)
            display_text("ERR1")
            time.sleep(2)
            clear_display()
            return jsonify({
                'status': 'neural_synthesis_failed',
                'message': 'Voice identity not specified for neural synthesis'
            }), 400
        
        # Display voice name on digit screen
        display_text(voice_identity[:4].upper())  # Show first 4 chars of voice name
        time.sleep(1)
        scroll_text_on_display(f"TRAIN {voice_identity}", scroll_speed=0.4)
        
        # Check if neural synthesis is already active
        if TrainingStateManager.is_neural_synthesis_active():
            active_identity = TrainingStateManager.get_active_synthesis_identity()
            play_sound_async(play_neural_training_error_tune)
            display_text("BUSY")
            time.sleep(2)
            clear_display()
            return jsonify({
                'status': 'neural_synthesis_blocked',
                'message': f'Neural synthesis already active for: {active_identity}',
                'active_voice': active_identity
            }), 409
        
        # Validate neural environment
        env_valid, env_message = VoiceTrainingArchitecture.validate_neural_environment()
        if not env_valid:
            play_sound_async(play_neural_training_error_tune)
            display_text("ERR2")
            time.sleep(2)
            clear_display()
            return jsonify({
                'status': 'neural_environment_invalid',
                'message': env_message
            }), 500
        
        # Check if voice samples exist
        voice_samples_path = os.path.join(VoiceTrainingArchitecture.VOICE_DATA_PATH, voice_identity)
        if not os.path.exists(voice_samples_path):
            play_sound_async(play_neural_training_error_tune)
            display_text("ERR3")
            time.sleep(2)
            clear_display()
            return jsonify({
                'status': 'voice_samples_not_found',
                'message': f'Voice samples not found: {voice_samples_path}'
            }), 404
        
        # Neural output path
        neural_output_path = os.path.join(VoiceTrainingArchitecture.OUTPUT_ONNX_PATH, voice_identity)
        os.makedirs(neural_output_path, exist_ok=True)
        
        # Show training started on display
        display_text("STRT")
        time.sleep(1)
        
        # Start neural synthesis process
        training_command = [
            'docker', 'exec', 'textymcspeechy',
            'python3', '/app/train.py',
            voice_samples_path, neural_output_path
        ]
        
        # Redirect output to log file for real-time monitoring
        log_file = open(VoiceTrainingArchitecture.TRAINING_LOG_PATH, 'w')
        
        process = subprocess.Popen(
            training_command,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            preexec_fn=os.setsid  # Create new process group for better control
        )
        
        # Create training lock with voice identity
        with open(VoiceTrainingArchitecture.TRAINING_LOCK_PATH, 'w') as f:
            f.write(voice_identity)
        
        # Save process ID for management
        with open(VoiceTrainingArchitecture.TRAINING_PID_PATH, 'w') as f:
            f.write(str(process.pid))
        
        # Register neural synthesis initiation
        TrainingStateManager.register_neural_synthesis(voice_identity, 'neural_synthesis_initiated')
        
        # Log training event
        log_training_event(voice_identity, 'neural_synthesis_initiated', {
            'voice_samples_path': voice_samples_path,
            'neural_output_path': neural_output_path,
            'process_id': process.pid
        })
        
        # Final display update
        display_text("ACTV")
        
        return jsonify({
            'status': 'neural_synthesis_initiated',
            'message': f'Neural voice synthesis started for {voice_identity}',
            'voice_identity': voice_identity,
            'neural_output_path': neural_output_path
        })
        
    except Exception as e:
        # Error handling with sound and display
        play_sound_async(play_neural_training_error_tune)
        display_text("FAIL")
        time.sleep(2)
        clear_display()
        
        DebugLog(f"Neural synthesis initiation failed: {e}")
        return jsonify({
            'status': 'neural_synthesis_error',
            'message': f'Failed to initiate neural synthesis: {str(e)}'
        }), 500


@neural_voice_synthesis_bp.route('/train-status', methods=['GET'])
def get_neural_synthesis_status():
    """Get the current status of neural voice synthesis with optional sound and display feedback"""
    
    # Only trigger sound/display if explicitly requested (not auto-refresh)
    play_sound = request.args.get('sound', 'false').lower() == 'true'
    
    if play_sound:
        # Trigger status check sound only on manual request
        play_sound_async(play_neural_training_status_tune)
    
    try:
        if not TrainingStateManager.is_neural_synthesis_active():
            # Show idle status on display
            display_text("IDLE")
            time.sleep(0.5)
            clear_display()
            
            return jsonify({
                'status': 'neural_pathway_idle',
                'message': 'Neural voice synthesis pathways are idle'
            })
        
        # Get active synthesis details
        active_identity = TrainingStateManager.get_active_synthesis_identity()
        neural_log = TrainingStateManager.get_neural_training_log()
        log_length = TrainingStateManager.get_neural_log_length()
        
        # Calculate and display progress percentage
        # Rough estimate: 100 log lines = ~50% progress, 200+ lines = ~90%
        progress_percentage = min(int((log_length / 200) * 100), 95)  # Max 95% until complete
        
        # Display progress on digit screen
        if progress_percentage < 10:
            display_text(f"00{progress_percentage}")
        elif progress_percentage < 100:
            display_text(f"0{progress_percentage}" if progress_percentage < 10 else str(progress_percentage))
        else:
            display_text("99")  # Cap at 99 until completion
        
        return jsonify({
            'status': 'neural_synthesis_active',
            'voice_identity': active_identity,
            'neural_log': neural_log,
            'log_length': log_length,
            'progress_percentage': progress_percentage,
            'message': f'Neural synthesis active for {active_identity}'
        })
        
    except Exception as e:
        # Error handling
        play_sound_async(play_neural_training_error_tune)
        display_text("ERR4")
        time.sleep(2)
        clear_display()
        
        DebugLog(f"Failed to get neural synthesis status: {e}")
        return jsonify({
            'status': 'status_error',
            'message': f'Failed to get synthesis status: {str(e)}'
        }), 500


@neural_voice_synthesis_bp.route('/cancel-training', methods=['POST'])
def terminate_neural_synthesis():
    """Terminate the active neural voice synthesis process"""
    
    # Error/cancellation sound
    play_sound_async(play_neural_training_error_tune)
    
    try:
        if not TrainingStateManager.is_neural_synthesis_active():
            display_text("NONE")
            time.sleep(1)
            clear_display()
            return jsonify({
                'status': 'no_active_synthesis',
                'message': 'No active neural synthesis to terminate'
            }), 400
        
        # Get active voice identity
        active_identity = TrainingStateManager.get_active_synthesis_identity()
        
        # Display cancellation
        display_text("STOP")
        time.sleep(1)
        scroll_text_on_display(f"STOP {active_identity}", scroll_speed=0.4)
        
        # Read PID and terminate process
        try:
            with open(VoiceTrainingArchitecture.TRAINING_PID_PATH, 'r') as f:
                pid = int(f.read().strip())
            
            # Terminate process group
            os.killpg(os.getpgid(pid), signal.SIGTERM)
            
            # Wait a moment for graceful termination
            time.sleep(2)
            
            # Force kill if still running
            try:
                os.killpg(os.getpgid(pid), signal.SIGKILL)
            except ProcessLookupError:
                pass  # Process already terminated
            
        except (FileNotFoundError, ValueError, ProcessLookupError):
            pass  # Process may have already terminated
        
        # Clean up training artifacts
        for path in [VoiceTrainingArchitecture.TRAINING_LOCK_PATH, 
                     VoiceTrainingArchitecture.TRAINING_PID_PATH,
                     VoiceTrainingArchitecture.TRAINING_LOG_PATH]:
            if os.path.exists(path):
                os.remove(path)
        
        # Register termination in psychology registry
        TrainingStateManager.register_neural_synthesis(active_identity, 'neural_synthesis_terminated')
        
        # Log termination event
        log_training_event(active_identity, 'neural_synthesis_terminated', {
            'termination_method': 'user_request'
        })
        
        # Final display update
        display_text("DONE")
        time.sleep(1)
        clear_display()
        
        return jsonify({
            'status': 'neural_synthesis_terminated',
            'message': f'Neural synthesis terminated for {active_identity}',
            'voice_identity': active_identity
        })
        
    except Exception as e:
        display_text("ERR5")
        time.sleep(2)
        clear_display()
        
        DebugLog(f"Failed to terminate neural synthesis: {e}")
        return jsonify({
            'status': 'termination_error',
            'message': f'Failed to terminate synthesis: {str(e)}'
        }), 500


@neural_voice_synthesis_bp.route('/voice-registry', methods=['GET'])
def get_voice_synthesis_registry():
    """Get the neural voice synthesis psychology registry"""
    
    # Only trigger sound if explicitly requested
    play_sound = request.args.get('sound', 'false').lower() == 'true'
    
    if play_sound:
        # Brief acknowledgment sound
        play_sound_async(play_neural_training_status_tune)
    
    try:
        registry = TrainingStateManager.get_voice_synthesis_registry()
        
        # Brief display of registry count
        reg_count = len(registry)
        if reg_count < 10:
            display_text(f"REG{reg_count}")
        else:
            display_text(f"R{reg_count:02d}")  # R## format for higher counts
        time.sleep(1)
        clear_display()
        
        return jsonify({
            'status': 'registry_retrieved',
            'registry': registry,
            'voice_count': reg_count
        })
        
    except Exception as e:
        play_sound_async(play_neural_training_error_tune)
        display_text("ERR6")
        time.sleep(2)
        clear_display()
        
        DebugLog(f"Failed to get voice registry: {e}")
        return jsonify({
            'status': 'registry_error',
            'message': f'Failed to get voice registry: {str(e)}'
        }), 500


@neural_voice_synthesis_bp.route('/available-voices', methods=['GET'])
def get_available_voice_samples():
    """Get available voice sample directories for neural synthesis"""
    
    # Only trigger sound if explicitly requested
    play_sound = request.args.get('sound', 'false').lower() == 'true'
    
    if play_sound:
        # Brief acknowledgment sound
        play_sound_async(play_neural_training_status_tune)
    
    try:
        voice_data_path = VoiceTrainingArchitecture.VOICE_DATA_PATH
        
        if not os.path.exists(voice_data_path):
            display_text("NOVD")  # No Voice Data
            time.sleep(2)
            clear_display()
            return jsonify({
                'status': 'voice_data_missing',
                'message': f'Voice data directory not found: {voice_data_path}',
                'voices': []
            }), 404
        
        # Scan for voice sample directories
        available_voices = []
        audio_extensions = ('.mp3', '.wav', '.flac', '.ogg', '.m4a')
        
        for item in filter_hidden_files(os.listdir(voice_data_path)):
            item_path = os.path.join(voice_data_path, item)
            if os.path.isdir(item_path):
                # Count audio files in directory
                audio_files = filter_hidden_files([f for f in os.listdir(item_path) 
                              if f.lower().endswith(audio_extensions)])
                
                if audio_files:  # Only include directories with audio files
                    available_voices.append({
                        'name': item,
                        'path': item_path,
                        'audio_count': len(audio_files)
                    })
        
        # Display voice count
        voice_count = len(available_voices)
        if voice_count < 10:
            display_text(f"V0{voice_count}")
        else:
            display_text(f"V{voice_count:02d}")
        time.sleep(1)
        clear_display()
        
        return jsonify({
            'status': 'voices_found',
            'voices': available_voices,
            'voice_data_path': voice_data_path,
            'total_voices': voice_count
        })
        
    except Exception as e:
        play_sound_async(play_neural_training_error_tune)
        display_text("ERR7")
        time.sleep(2)
        clear_display()
        
        DebugLog(f"Failed to get available voices: {e}")
        return jsonify({
            'status': 'voices_error',
            'message': f'Failed to get available voices: {str(e)}'
        }), 500 