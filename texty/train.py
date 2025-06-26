#!/usr/bin/env python3
"""
Neural Voice Synthesis Conductor - RoverSeer Voice Training Orchestrator
Performs direct voice training using Coqui TTS and ONNX export
"""

import sys
import os
import atexit
import traceback
import json
from datetime import datetime
import torch
import torchaudio
from pathlib import Path
from TTS.tts.configs.shared_configs import BaseDatasetConfig
from TTS.tts.configs.vits_config import VitsConfig
from TTS.tts.datasets import load_tts_samples
from TTS.tts.models.vits import Vits
from TTS.tts.utils.text.tokenizer import TTSTokenizer
from TTS.utils.audio import AudioProcessor
from TTS.utils.manage import ModelManager

# Training process management paths
TRAINING_LOCK_PATH = "/tmp/training.lock"
TRAINING_PID_PATH = "/tmp/training.pid"

def neural_cleanup():
    """Clean up training artifacts and release neural pathways"""
    for path in [TRAINING_LOCK_PATH, TRAINING_PID_PATH]:
        if os.path.exists(path):
            try:
                os.remove(path)
                print(f"[CLEANUP] Removed training artifact: {path}")
            except Exception as e:
                print(f"[CLEANUP ERROR] Failed to remove {path}: {e}")

# Register cleanup function to run on exit
atexit.register(neural_cleanup)

def log_training_event(message):
    """Log training events with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def filter_hidden_files(files):
    """Filter out macOS and system hidden files from a list of files"""
    return [f for f in files if not f.startswith('.') and not f.startswith('_') and f != 'Thumbs.db']

def validate_voice_samples(voice_path):
    """Validate voice sample directory contains audio files"""
    if not os.path.exists(voice_path):
        log_training_event(f"❌ Voice sample directory does not exist: {voice_path}")
        return False
    
    # Count audio files, filtering out hidden files
    audio_extensions = ('.mp3', '.wav', '.flac', '.ogg', '.m4a')
    audio_files = filter_hidden_files([f for f in os.listdir(voice_path) 
                   if f.lower().endswith(audio_extensions)])
    
    if len(audio_files) == 0:
        log_training_event(f"❌ No audio files found in: {voice_path}")
        return False
    
    log_training_event(f"✅ Found {len(audio_files)} audio files for training")
    return True

def prepare_dataset(voice_path):
    """Prepare dataset for training"""
    try:
        log_training_event("🎯 Preparing voice dataset...")
        
        # Create metadata.csv in the voice directory
        metadata_path = os.path.join(voice_path, "metadata.csv")
        audio_files = []
        
        # Gather all audio files
        for file in os.listdir(voice_path):
            if file.lower().endswith(('.mp3', '.wav', '.flac', '.ogg', '.m4a')):
                # Convert to WAV if needed
                base_name = os.path.splitext(file)[0]
                wav_path = os.path.join(voice_path, f"{base_name}.wav")
                
                if not file.lower().endswith('.wav'):
                    log_training_event(f"🔄 Converting {file} to WAV format...")
                    audio, sr = torchaudio.load(os.path.join(voice_path, file))
                    torchaudio.save(wav_path, audio, sr)
                    audio_files.append(wav_path)
                else:
                    audio_files.append(os.path.join(voice_path, file))
        
        # Create metadata.csv
        with open(metadata_path, 'w', encoding='utf-8') as f:
            f.write("file_path|transcription\n")
            for audio_file in audio_files:
                # Use filename as placeholder transcription
                base_name = os.path.splitext(os.path.basename(audio_file))[0]
                transcription = base_name.replace('_', ' ')
                f.write(f"{audio_file}|{transcription}\n")
        
        log_training_event(f"✅ Created metadata file with {len(audio_files)} entries")
        return True
        
    except Exception as e:
        log_training_event(f"❌ Dataset preparation failed: {e}")
            return False

def train_voice_model(voice_path, output_path):
    """Train the voice model using VITS"""
    try:
        log_training_event("🧠 Initializing voice model training...")
        
        # Prepare dataset
        if not prepare_dataset(voice_path):
            return False
        
        # Configure model
        config = VitsConfig()
        config.audio.sample_rate = 22050
        config.batch_size = 32
        config.eval_batch_size = 16
        config.num_loader_workers = 4
        config.num_eval_loader_workers = 4
        config.run_eval = True
        config.test_delay_epochs = 5
        config.epochs = 1000
        config.text_cleaner = "english_cleaners"
        config.use_phonemes = True
        config.phoneme_language = "en-us"
        config.output_path = output_path
        
        # Dataset config
        dataset_config = BaseDatasetConfig(
            formatter="ljspeech",
            meta_file_train="metadata.csv",
            path=voice_path
        )
        config.datasets = [dataset_config]
        
        # Initialize model
        model = Vits(config)
        
        # Train model
        log_training_event("🚀 Starting model training...")
        model.fit()
        
        # Export to ONNX
        log_training_event("📤 Exporting model to ONNX format...")
        model.export_onnx(output_path)
        
        # Create config JSON
        config_path = os.path.join(output_path, "config.json")
        with open(config_path, 'w') as f:
            json.dump({
                "model_type": "vits",
                "sample_rate": config.audio.sample_rate,
                "phoneme_language": config.phoneme_language,
                "use_phonemes": config.use_phonemes,
                "text_cleaner": config.text_cleaner
            }, f, indent=2)
        
        log_training_event("✅ Training completed successfully!")
        return True
        
    except Exception as e:
        log_training_event(f"❌ Training failed: {e}")
        log_training_event(f"Error details: {traceback.format_exc()}")
        return False

def main():
    """Main neural voice synthesis conductor"""
    log_training_event("🚀 RoverSeer Neural Voice Synthesis Conductor Starting...")
    
    if len(sys.argv) != 3:
        log_training_event("❌ Invalid arguments provided")
        log_training_event("Usage: train.py <voice_samples_path> <output_path>")
        log_training_event("Example: train.py /home/codemusic/texty/voice_data/MyVoice /home/codemusic/texty/output_onnx/MyVoice")
        sys.exit(1)

    voice_samples_path = sys.argv[1]
    neural_output_path = sys.argv[2]
    
    log_training_event(f"🎤 Voice samples source: {voice_samples_path}")
    log_training_event(f"🧠 Neural output destination: {neural_output_path}")
    
    # Validate voice samples
    if not validate_voice_samples(voice_samples_path):
        sys.exit(1)
    
    # Create output directory
    os.makedirs(neural_output_path, exist_ok=True)
    
    # Train model
    success = train_voice_model(voice_samples_path, neural_output_path)
    
    if success:
        log_training_event("🎯 Neural voice synthesis completed successfully!")
        log_training_event("🔄 Voice model ready for integration into RoverSeer voice system")
    else:
        log_training_event("💥 Neural voice synthesis failed!")
        sys.exit(1)
    
    # Cleanup will be handled automatically by atexit
    log_training_event("🧹 Cleanup completed - neural pathways released")

if __name__ == "__main__":
    main() 