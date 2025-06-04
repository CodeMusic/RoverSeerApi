import json
import re
from datetime import datetime
from pathlib import Path

from config import LOG_DIR, DEBUG_LOGGING


class LoggingHelper:
    """Helper class for centralized logging operations including debug logging and usage tracking."""
    
    @staticmethod
    def debug_log(message, *args):
        """
        Print debug message if DEBUG_LOGGING is enabled
        
        Args:
            message: The message to print (can include {} placeholders)
            *args: Arguments to format into the message
        """
        if DEBUG_LOGGING:
            if args:
                print(f"DEBUG: {message.format(*args)}")
            else:
                print(f"DEBUG: {message}")

    @staticmethod
    def ensure_log_dir():
        """Create the log directory if it doesn't exist"""
        LOG_DIR.mkdir(exist_ok=True)

    @staticmethod
    def get_log_filename(log_type):
        """Get the log filename for today's date"""
        today = datetime.now().strftime("%Y-%m-%d")
        return LOG_DIR / f"{log_type}_{today}.log"

    @staticmethod
    def log_error(error_type, error_message, context=None):
        """
        Log an error to a dedicated error log file
        
        Args:
            error_type (str): Type/category of the error
            error_message (str): The error message
            context (dict): Additional context information
        """
        LoggingHelper.ensure_log_dir()
        error_file = LOG_DIR / f"errors_{datetime.now().strftime('%Y-%m-%d')}.log"
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = {
            "timestamp": timestamp,
            "type": error_type,
            "message": error_message,
            "context": context or {}
        }
        
        try:
            # Append to error log file
            with open(error_file, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
        except Exception as e:
            print(f"Failed to log error: {e}")

    @staticmethod
    def log_llm_usage(model_name, system_message, user_prompt, response, processing_time=None, voice_id=None, personality=None, mood_data=None):
        """
        Log LLM usage to daily file in JSON format with enhanced personality and mood details
        
        Args:
            model_name (str): Name of the model used
            system_message (str): System message used
            user_prompt (str): User's prompt
            response (str): Model's response
            processing_time (float): Time taken to process in seconds
            voice_id (str): Voice ID used for TTS
            personality (str): Personality name used
            mood_data (dict): Detailed mood activation data including probabilities
        """
        LoggingHelper.ensure_log_dir()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # If personality not provided, try to get it from the current personality manager
        if not personality:
            try:
                from cognition.personality import get_personality_manager
                manager = get_personality_manager()
                if manager.current_personality:
                    personality = manager.current_personality.name
                else:
                    personality = "default"
            except:
                personality = "default"
        
        # Enhanced log entry with mood details
        log_entry = {
            "timestamp": timestamp,
            "model": model_name,
            "personality": personality,
            "voice_id": voice_id,
            "system_message": system_message,
            "user_prompt": user_prompt,
            "llm_reply": response,
            "runtime": processing_time or 0,
            "mood_data": mood_data or {}
        }
        
        with open(LoggingHelper.get_log_filename("llm_usage"), "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")

    @staticmethod
    def log_asr_usage(audio_file, transcript, processing_time=None):
        """
        Log ASR (Automatic Speech Recognition) usage to daily file in JSON format
        
        Args:
            audio_file (str): Path to the audio file
            transcript (str): Transcribed text
            processing_time (float): Time taken to process in seconds
        """
        LoggingHelper.ensure_log_dir()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        log_entry = {
            "timestamp": timestamp,
            "audio_file": audio_file,
            "text": transcript,
            "processing_time": processing_time or 0
        }
        
        with open(LoggingHelper.get_log_filename("asr_usage"), "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")

    @staticmethod
    def log_tts_usage(voice_model, text, output_file=None, processing_time=None):
        """
        Log TTS (Text-to-Speech) usage to daily file in JSON format
        
        Args:
            voice_model (str): Voice model used
            text (str): Text converted to speech
            output_file (str): Path to output audio file
            processing_time (float): Time taken to process in seconds
        """
        LoggingHelper.ensure_log_dir()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        log_entry = {
            "timestamp": timestamp,
            "voice_id": voice_model,
            "text": text,
            "output_file": output_file,
            "processing_time": processing_time or 0
        }
        
        with open(LoggingHelper.get_log_filename("tts_usage"), "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")

    @staticmethod
    def log_penphin_mind_usage(original_prompt, logical_response, creative_response, final_synthesis, total_time):
        """
        Log PenphinMind bicameral processing to daily file in JSON format
        
        Args:
            original_prompt (str): The original user prompt
            logical_response (str): Response from logical mind
            creative_response (str): Response from creative mind
            final_synthesis (str): Final synthesized response
            total_time (float): Total processing time in seconds
        """
        LoggingHelper.ensure_log_dir()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        log_entry = {
            "timestamp": timestamp,
            "original_prompt": original_prompt,
            "logical_response": logical_response,
            "creative_response": creative_response,
            "final_synthesis": final_synthesis,
            "total_time": total_time
        }
        
        with open(LoggingHelper.get_log_filename("penphin_mind"), "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")

    @staticmethod
    def log_training_activity(voice_identity, event_type, message, data=None):
        """
        Log voice training activity to dedicated training log file
        
        Args:
            voice_identity (str): The voice being trained (e.g., "HomerSimpson")
            event_type (str): Type of event (e.g., "training_start", "epoch_complete", "error", "debug")
            message (str): Human-readable message
            data (dict): Additional structured data
        """
        LoggingHelper.ensure_log_dir()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        log_entry = {
            "timestamp": timestamp,
            "voice_identity": voice_identity,
            "event_type": event_type,
            "message": message,
            "data": data or {}
        }
        
        try:
            # Write to training activity log
            with open(LoggingHelper.get_log_filename("training_activity"), "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception as e:
            print(f"Failed to log training activity: {e}")

    @staticmethod
    def get_training_activity_logs(voice_identity=None, limit=100):
        """
        Get recent training activity logs, optionally filtered by voice identity
        
        Args:
            voice_identity (str): Optional filter by voice identity
            limit (int): Maximum number of entries to return
            
        Returns:
            list: List of training activity log entries
        """
        LoggingHelper.ensure_log_dir()
        training_file = LoggingHelper.get_log_filename("training_activity")
        
        logs = []
        if training_file.exists():
            try:
                with open(training_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        try:
                            entry = json.loads(line.strip())
                            if voice_identity is None or entry.get("voice_identity") == voice_identity:
                                logs.append(entry)
                        except json.JSONDecodeError:
                            continue
            except Exception as e:
                print(f"Error reading training activity log: {e}")
        
        # Return most recent entries first
        return logs[-limit:][::-1] 