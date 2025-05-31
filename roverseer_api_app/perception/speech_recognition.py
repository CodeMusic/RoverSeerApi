import time
from faster_whisper import WhisperModel

from memory.usage_logger import log_asr_usage
from expression.sound_orchestration import play_sound_async, play_transcribe_tune

# Initialize Whisper model
whisper_model = WhisperModel("base", compute_type="int8")


def transcribe_audio(file_path):
    """Transcribe audio file using Faster Whisper"""
    # Play transcription tune
    play_sound_async(play_transcribe_tune)
    
    start_time = time.time()
    segments, info = whisper_model.transcribe(file_path)
    transcript = " ".join([segment.text for segment in segments])
    processing_time = time.time() - start_time
    
    # Log ASR usage
    log_asr_usage(file_path, transcript, processing_time)
    
    return transcript


def get_whisper_model_info():
    """Get information about the loaded Whisper model"""
    return {
        "model_size": "base",
        "compute_type": "int8",
        "loaded": whisper_model is not None
    }


def reinitialize_whisper_model(model_size="base", compute_type="int8"):
    """Reinitialize Whisper model with different parameters"""
    global whisper_model
    try:
        whisper_model = WhisperModel(model_size, compute_type=compute_type)
        print(f"Whisper model reinitialized: {model_size} ({compute_type})")
        return True
    except Exception as e:
        print(f"Failed to reinitialize Whisper model: {e}")
        return False 