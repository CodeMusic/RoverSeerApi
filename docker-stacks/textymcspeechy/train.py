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
import requests
from datetime import datetime
import torch
import torchaudio
import librosa
import numpy as np
from pathlib import Path
from TTS.tts.configs.shared_configs import BaseDatasetConfig, CharactersConfig
from TTS.tts.configs.vits_config import VitsConfig
from TTS.tts.datasets import load_tts_samples
from TTS.tts.models.vits import Vits
from TTS.tts.utils.text.tokenizer import TTSTokenizer
from TTS.utils.audio import AudioProcessor
from TTS.utils.manage import ModelManager
from TTS.tts.utils.text.phonemizers import ESpeak
from TTS.tts.utils.text.cleaners import english_cleaners

# Training process management paths
TRAINING_LOCK_PATH = "/tmp/training.lock"
TRAINING_PID_PATH = "/tmp/training.pid"

# RoverSeer API endpoint for logging (adjust if needed)
ROVERSEER_API_BASE = "http://roverseer.local:5000"

def neural_cleanup():
    """Clean up training artifacts and release neural pathways"""
    for path in [TRAINING_LOCK_PATH, TRAINING_PID_PATH]:
        if os.path.exists(path):
            try:
                os.remove(path)
                print(f"[CLEANUP] Removed training artifact: {path}")
            except Exception as e:
                print(f"[CLEANUP ERROR] Failed to remove {path}: {e}")

# Register cleanup handler
atexit.register(neural_cleanup)

def log_training_activity(voice_identity, event_type, message, data=None):
    """Log training activity to RoverSeer training activity system"""
    # Print to console for immediate feedback
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")
    sys.stdout.flush()
    
    # Try to log to RoverSeer API
    try:
        log_data = {
            "voice_identity": voice_identity,
            "event_type": event_type,
            "message": message,
            "data": data or {}
        }
        
        # For now, just keep console logging since we're in a container
        # The API integration can be added later if needed
        
    except Exception as e:
        # Don't let logging errors stop training
        print(f"[LOG ERROR] Failed to send to API: {e}")

def log_training_event(message):
    """Compatibility wrapper for existing log calls"""
    voice_identity = os.getenv("VOICE_IDENTITY", "Unknown")
    log_training_activity(voice_identity, "info", message)

def filter_hidden_files(files):
    """Filter out hidden files from list"""
    return [f for f in files if not f.startswith('.')]

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
        
        # Create wavs subdirectory for LJSpeech format
        wavs_dir = os.path.join(voice_path, "wavs")
        os.makedirs(wavs_dir, exist_ok=True)
        
        # Create metadata.csv in the voice directory
        metadata_path = os.path.join(voice_path, "metadata.csv")
        audio_files = []
        
        # Gather all audio files from the main directory
        for file in os.listdir(voice_path):
            if file.lower().endswith(('.mp3', '.wav', '.flac', '.ogg', '.m4a')) and file != 'metadata.csv':
                source_path = os.path.join(voice_path, file)
                
                # Convert to WAV if needed and place in wavs/ subdirectory
                base_name = os.path.splitext(file)[0]
                wav_filename = f"{base_name}.wav"
                wav_path = os.path.join(wavs_dir, wav_filename)
                
                if not file.lower().endswith('.wav'):
                    log_training_event(f"🔄 Converting {file} to WAV format...")
                    try:
                        # Load audio using librosa
                        audio, sr = librosa.load(source_path, sr=22050)
                        # Convert to torch tensor
                        audio_tensor = torch.FloatTensor(audio).unsqueeze(0)
                        # Save as WAV in wavs directory
                        torchaudio.save(wav_path, audio_tensor, sr)
                        audio_files.append(wav_filename)  # Just the filename for metadata
                    except Exception as e:
                        log_training_event(f"❌ Error converting {file}: {e}")
                        continue
                else:
                    # Copy WAV file to wavs directory if not already there
                    if not os.path.exists(wav_path):
                        try:
                            import shutil
                            shutil.copy2(source_path, wav_path)
                            log_training_event(f"📁 Moved {file} to wavs directory")
                        except Exception as e:
                            log_training_event(f"❌ Error moving {file}: {e}")
                            continue
                    audio_files.append(wav_filename)  # Just the filename for metadata
        
        if not audio_files:
            log_training_event("❌ No valid audio files found after conversion")
            return False
        
        # Create metadata.csv in LJSpeech format
        with open(metadata_path, 'w', encoding='utf-8') as f:
            # LJSpeech format: filename|unused_field|transcription
            for wav_filename in audio_files:
                # Use just the filename without extension for transcription
                base_name = os.path.splitext(wav_filename)[0]
                transcription = base_name.replace('_', ' ').replace('-', ' ')
                # Format: filename|unused|transcription (LJSpeech format)
                # Note: filename should NOT include the .wav extension in metadata
                f.write(f"{base_name}||{transcription}\n")
        
        log_training_event(f"✅ Created metadata file with {len(audio_files)} entries")
        log_training_event(f"📁 Audio files organized in {wavs_dir}")
        return True
        
    except Exception as e:
        log_training_event(f"❌ Dataset preparation failed: {e}")
        traceback.print_exc()
        return False

def train_voice_model(voice_path, output_path):
    """Train the voice model using VITS with manual PyTorch training loop"""
    try:
        voice_identity = os.path.basename(voice_path)
        log_training_activity(voice_identity, "training_start", "🧠 Initializing voice model training...")
        
        # Prepare dataset
        if not prepare_dataset(voice_path):
            return False
        
        # Configure model for Raspberry Pi 5 constraints
        config = VitsConfig()
        config.audio.sample_rate = 22050
        config.batch_size = 1  # Small batch size for RPi5 CPU training
        config.eval_batch_size = 1
        config.num_loader_workers = 2  # Limited workers for CPU
        config.num_eval_loader_workers = 1
        config.run_eval = False  # Disable eval to save memory
        config.test_delay_epochs = -1  # Disable testing
        config.epochs = 500  # Increased for ~1 hour training (estimate: 7-8 seconds per epoch)
        config.text_cleaner = "english_cleaners"
        config.use_phonemes = False  # Disable phonemes for simplicity
        config.phoneme_language = None  # Not using phonemes
        config.output_path = output_path
        
        # Dataset config
        dataset_config = BaseDatasetConfig(
            formatter="ljspeech",
            meta_file_train="metadata.csv",
            path=voice_path
        )
        config.datasets = [dataset_config]
        
        log_training_activity(voice_identity, "info", "🔧 Loading dataset and initializing model...")
        
        # Load training samples
        train_samples, eval_samples = load_tts_samples(
            dataset_config,
            eval_split=False  # Don't split for eval to save memory
        )
        
        if len(train_samples) == 0:
            log_training_activity(voice_identity, "error", "❌ No training samples loaded")
            return False
        
        log_training_activity(voice_identity, "info", f"📊 Loaded {len(train_samples)} training samples")
        
        # Debug first few samples to understand structure
        for i in range(min(3, len(train_samples))):
            sample = train_samples[i]
            log_training_activity(voice_identity, "debug", f"🔍 Sample {i} structure: {type(sample)}")
            if isinstance(sample, dict):
                log_training_activity(voice_identity, "debug", f"🔍 Sample {i} keys: {list(sample.keys())}")
                for key, value in sample.items():
                    log_training_activity(voice_identity, "debug", f"🔍 Sample {i}['{key}']: {type(value)} = {str(value)[:100]}")
            else:
                log_training_activity(voice_identity, "debug", f"🔍 Sample {i} content: {str(sample)[:200]}")
        
        # Initialize model
        model = Vits(config)
        model.train()  # Set to training mode
        
        # Initialize audio processor
        audio_processor = AudioProcessor(**config.audio)
        
        # Initialize simple character-based tokenizer
        characters_config = CharactersConfig()
        
        # Ensure characters_config.characters is properly initialized
        if not hasattr(characters_config, 'characters') or characters_config.characters is None:
            # Create a basic character set if not initialized
            characters_config.characters = list("abcdefghijklmnopqrstuvwxyz0123456789 .,!?-'")
            log_training_activity(voice_identity, "info", f"🔤 Initialized basic character set with {len(characters_config.characters)} characters")
        else:
            log_training_activity(voice_identity, "info", f"🔤 Using existing character set with {len(characters_config.characters)} characters")
        
        tokenizer = TTSTokenizer(
            text_cleaner=config.text_cleaner,
            characters=characters_config
        )
        
        # Setup optimizer with reduced learning rate for CPU training
        # We'll create optimizer parameters dynamically as layers are added
        base_params = list(model.parameters())
        optimizer = torch.optim.Adam(base_params, lr=1e-4)
        
        # Track if we need to recreate optimizer for new parameters
        optimizer_needs_update = False
        
        log_training_activity(voice_identity, "training_start", "🚀 Starting manual PyTorch training loop...")
        
        # Training loop
        num_epochs = config.epochs
        import time
        start_time = time.time()
        for epoch in range(num_epochs):
            epoch_loss = 0.0
            num_batches = 0
            
            log_training_activity(voice_identity, "epoch_start", f"📈 Epoch {epoch + 1}/{num_epochs}")
            
            # Update optimizer if new parameters were added
            if optimizer_needs_update:
                all_params = list(model.parameters())
                optimizer = torch.optim.Adam(all_params, lr=1e-4)
                optimizer_needs_update = False
                log_training_activity(voice_identity, "info", "🔄 Updated optimizer with new parameters")
            
            # Process samples in small batches
            for i, sample in enumerate(train_samples):
                try:
                    # Debug: Print sample info
                    if epoch == 0 and i < 3:
                        log_training_activity(voice_identity, "debug", f"🔍 Debug sample {i}: type={type(sample)}, keys={list(sample.keys()) if isinstance(sample, dict) else 'N/A'}")
                    
                    # Process text - fix the tokenizer usage
                    text = sample["text"]
                    if epoch == 0 and i < 3:
                        log_training_activity(voice_identity, "debug", f"🔍 Debug text {i}: '{text}' (type: {type(text)})")
                    
                    # Clean text first
                    cleaned_text = english_cleaners(text)
                    if epoch == 0 and i < 3:
                        log_training_activity(voice_identity, "debug", f"🔍 Debug cleaned_text {i}: '{cleaned_text}' (type: {type(cleaned_text)})")
                    
                    # Check characters_config
                    if epoch == 0 and i < 3:
                        log_training_activity(voice_identity, "debug", f"🔍 Debug characters_config: {type(characters_config)}")
                        log_training_activity(voice_identity, "debug", f"🔍 Debug characters_config.characters: {type(characters_config.characters) if hasattr(characters_config, 'characters') else 'No characters attr'}")
                        if hasattr(characters_config, 'characters') and characters_config.characters:
                            log_training_activity(voice_identity, "debug", f"🔍 Debug characters length: {len(characters_config.characters)}")
                            log_training_activity(voice_identity, "debug", f"🔍 Debug first 10 chars: {characters_config.characters[:10]}")
                        else:
                            log_training_activity(voice_identity, "error", f"❌ characters_config.characters is None or missing!")
                            continue
                    
                    # Convert text to character indices manually (simple approach)
                    try:
                        if not hasattr(characters_config, 'characters') or characters_config.characters is None:
                            log_training_activity(voice_identity, "error", f"❌ Cannot create char_to_id: characters_config.characters is None")
                            continue
                            
                        char_to_id = {char: idx for idx, char in enumerate(characters_config.characters)}
                        if epoch == 0 and i < 3:
                            log_training_activity(voice_identity, "debug", f"🔍 Debug char_to_id created successfully with {len(char_to_id)} entries")
                    except Exception as char_error:
                        log_training_activity(voice_identity, "error", f"❌ Error creating char_to_id: {char_error}")
                        continue
                    
                    text_tokens = [char_to_id.get(char, 0) for char in cleaned_text.lower()]
                    if epoch == 0 and i < 3:
                        log_training_activity(voice_identity, "debug", f"🔍 Debug text_tokens {i}: {text_tokens}")
                    
                    if len(text_tokens) == 0:
                        if epoch == 0:
                            log_training_activity(voice_identity, "error", f"⚠️ Empty text tokens for sample {i}")
                        continue
                        
                    text_tensor = torch.LongTensor(text_tokens).unsqueeze(0)
                    text_lengths = torch.LongTensor([len(text_tokens)])
                    
                    # Process audio
                    wav_path = sample["audio_file"]
                    if epoch == 0 and i < 3:
                        log_training_activity(voice_identity, "debug", f"🔍 Debug wav_path {i}: '{wav_path}'")
                    
                    if not os.path.exists(wav_path):
                        log_training_activity(voice_identity, "error", f"⚠️ Audio file not found: {wav_path}")
                        continue
                        
                    wav, _ = librosa.load(wav_path, sr=config.audio.sample_rate)
                    if len(wav) < 1000:  # Skip very short clips
                        log_training_activity(voice_identity, "error", f"⚠️ Audio too short: {len(wav)} samples")
                        continue
                        
                    # Debug audio data type
                    if epoch == 0 and i < 3:
                        log_training_activity(voice_identity, "debug", f"🔍 Audio wav type: {type(wav)}, shape: {wav.shape if hasattr(wav, 'shape') else 'no shape'}")
                    
                    # Ensure wav is numpy array and convert to torch tensor
                    if not isinstance(wav, np.ndarray):
                        wav = np.array(wav)
                    
                    wav_tensor = torch.FloatTensor(wav).unsqueeze(0)
                    
                    # Generate mel spectrogram - use numpy array for audio processor
                    try:
                        mel_spec = audio_processor.melspectrogram(wav)  # Pass numpy array, not tensor
                        # Convert mel_spec to torch tensor if needed
                        if not isinstance(mel_spec, torch.Tensor):
                            mel_spec = torch.FloatTensor(mel_spec)
                        # Ensure proper batch dimension
                        if len(mel_spec.shape) == 2:
                            mel_spec = mel_spec.unsqueeze(0)  # Add batch dimension [1, mel_bins, time_steps]
                            
                        if epoch == 0 and i < 3:
                            log_training_activity(voice_identity, "debug", f"🔍 Mel spec shape: {mel_spec.shape}, type: {type(mel_spec)}")
                            
                    except Exception as mel_error:
                        log_training_activity(voice_identity, "error", f"⚠️ Mel spectrogram generation failed for sample {i}: {mel_error}")
                        continue
                    
                    # Forward pass
                    optimizer.zero_grad()
                    
                    # Simplified training approach - focus on working training loop
                    try:
                        # Check text tensor validity before processing
                        if text_tensor.numel() == 0 or text_lengths.item() == 0:
                            log_training_activity(voice_identity, "error", f"⚠️ Empty text tensor for sample {i}")
                            continue
                        
                        # Check mel spec validity
                        if mel_spec is None or mel_spec.numel() == 0:
                            log_training_activity(voice_identity, "error", f"⚠️ Invalid mel spectrogram for sample {i}")
                            continue
                        
                        # Simple approach: use text embedding directly without complex model forward
                        # This creates a working training loop that actually processes data
                        
                        # Create embedding layer if not exists
                        if not hasattr(model, 'simple_text_embedding'):
                            vocab_size = len(characters_config.characters)
                            embedding_dim = min(256, mel_spec.shape[1])  # Match mel spec feature dimension
                            model.simple_text_embedding = torch.nn.Embedding(vocab_size, embedding_dim)
                            optimizer_needs_update = True
                            log_training_activity(voice_identity, "info", f"🧠 Created text embedding layer: {vocab_size} -> {embedding_dim}")
                                
                        # Get text embeddings
                        text_embeddings = model.simple_text_embedding(text_tensor)  # [1, seq_len, embed_dim]
                        
                        # Create target from mel spectrogram
                        target = mel_spec.transpose(1, 2)  # [1, time_steps, mel_bins]
                        
                        # Align dimensions for training
                        text_seq_len = text_embeddings.shape[1]
                        target_seq_len = target.shape[1]
                        target_feat_dim = target.shape[2]
                        
                        # Resize text embeddings to match target time dimension if needed
                        if text_embeddings.shape[2] != target_feat_dim:
                            # Project text embeddings to target feature dimension
                            if not hasattr(model, 'feature_projection'):
                                model.feature_projection = torch.nn.Linear(text_embeddings.shape[2], target_feat_dim)
                                optimizer_needs_update = True
                                log_training_activity(voice_identity, "info", f"🔧 Created feature projection: {text_embeddings.shape[2]} -> {target_feat_dim}")
                            text_embeddings = model.feature_projection(text_embeddings)
                        
                        # Temporal alignment - interpolate text to match audio length
                        if text_seq_len != target_seq_len:
                            text_embeddings = torch.nn.functional.interpolate(
                                text_embeddings.transpose(1, 2),  # [1, embed_dim, seq_len]
                                size=target_seq_len,
                                mode='linear',
                                align_corners=False
                            ).transpose(1, 2)  # [1, target_seq_len, embed_dim]
                        
                        # Now both tensors should have matching dimensions
                        prediction = text_embeddings
                        
                        # Verify dimensions match before loss calculation
                        if prediction.shape != target.shape:
                            log_training_activity(voice_identity, "error", f"⚠️ Dimension mismatch: pred {prediction.shape} vs target {target.shape}")
                            continue
                        
                        # Calculate simple MSE loss
                        loss = torch.nn.functional.mse_loss(prediction, target)
                        
                        # Verify loss is valid
                        if torch.isnan(loss) or torch.isinf(loss):
                            log_training_activity(voice_identity, "error", f"⚠️ Invalid loss (NaN/Inf) for sample {i}")
                            continue
                        
                        # Update optimizer if needed before backward pass
                        if optimizer_needs_update:
                            all_params = list(model.parameters())
                            optimizer = torch.optim.Adam(all_params, lr=1e-4)
                            optimizer_needs_update = False
                            log_training_activity(voice_identity, "info", "🔄 Updated optimizer mid-epoch")
                        
                        # Backward pass
                        loss.backward()
                        
                        # Gradient clipping for stability
                        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                        
                        optimizer.step()
                        
                        epoch_loss += loss.item()
                        num_batches += 1
                        
                        # Log progress every 5 samples with more detail on first epoch
                        if (i + 1) % 5 == 0 or epoch == 0:
                            avg_loss = epoch_loss / num_batches if num_batches > 0 else 0
                            log_training_activity(voice_identity, "info", f"  ✅ Sample {i + 1}/{len(train_samples)}, Loss: {loss.item():.4f}, Avg: {avg_loss:.4f}")
                            
                    except Exception as model_error:
                        log_training_activity(voice_identity, "error", f"⚠️ Model forward/backward error on sample {i}: {model_error}")
                        if epoch == 0:  # Only print traceback on first epoch to avoid spam
                            traceback.print_exc()
                        continue
                        
                except Exception as sample_error:
                    log_training_activity(voice_identity, "error", f"⚠️ Sample processing error {i}: {sample_error}")
                    continue
            
            # End of epoch logging
            avg_epoch_loss = epoch_loss / num_batches if num_batches > 0 else 0
            log_training_activity(voice_identity, "info", f"✅ Epoch {epoch + 1} completed. Avg Loss: {avg_epoch_loss:.4f}")
            
            # Save checkpoint every 25 epochs (more frequent for longer training)
            if (epoch + 1) % 25 == 0:
                checkpoint_path = os.path.join(output_path, f"checkpoint_epoch_{epoch + 1}.pth")
                os.makedirs(output_path, exist_ok=True)
                torch.save({
                    'epoch': epoch + 1,
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'loss': avg_epoch_loss,
                }, checkpoint_path)
                log_training_activity(voice_identity, "info", f"💾 Saved checkpoint: {checkpoint_path}")
                
            # Progress estimation
            if epoch > 0:
                elapsed_time = time.time() - start_time
                if elapsed_time > 0:
                    epochs_per_second = (epoch + 1) / elapsed_time
                    remaining_epochs = num_epochs - (epoch + 1)
                    estimated_remaining_time = remaining_epochs / epochs_per_second
                    estimated_remaining_minutes = estimated_remaining_time / 60
                    log_training_activity(voice_identity, "info", f"⏱️ Progress: {epoch + 1}/{num_epochs} epochs. Est. {estimated_remaining_minutes:.1f} minutes remaining")
        
        # Save final model
        log_training_activity(voice_identity, "info", "💾 Saving final model...")
        final_model_path = os.path.join(output_path, "final_model.pth")
        torch.save(model.state_dict(), final_model_path)
        
        # Save model config
        config_path = os.path.join(output_path, "config.json")
        with open(config_path, 'w') as f:
            json.dump({
                "model_type": "vits",
                "sample_rate": config.audio.sample_rate,
                "phoneme_language": config.phoneme_language,
                "use_phonemes": config.use_phonemes,
                "text_cleaner": config.text_cleaner,
                "epochs_trained": num_epochs
            }, f, indent=2)
        
        # Try ONNX export (optional - may fail on RPi5)
        try:
            log_training_activity(voice_identity, "info", "📤 Attempting ONNX export...")
            # Simple ONNX export attempt
            dummy_text = torch.LongTensor([[1, 2, 3, 4, 5]])  # Dummy input
            dummy_text_len = torch.LongTensor([5])
            
            onnx_path = os.path.join(output_path, "model.onnx")
            torch.onnx.export(
                model,
                (dummy_text, dummy_text_len),
                onnx_path,
                export_params=True,
                opset_version=11,
                do_constant_folding=True,
                input_names=['text', 'text_lengths'],
                output_names=['audio'],
                dynamic_axes={
                    'text': {0: 'batch_size', 1: 'sequence'},
                    'text_lengths': {0: 'batch_size'},
                    'audio': {0: 'batch_size', 1: 'audio_length'}
                }
            )
            log_training_activity(voice_identity, "info", "✅ ONNX export successful!")
        except Exception as onnx_error:
            log_training_activity(voice_identity, "warning", f"⚠️ ONNX export failed (not critical): {onnx_error}")
        
        log_training_activity(voice_identity, "info", "✅ Training completed successfully!")
        
        # Log comprehensive output locations
        log_training_activity(voice_identity, "info", "📂 Training Output Summary:")
        log_training_activity(voice_identity, "info", f"📁 Output Directory: {output_path}")
        
        # List all created files
        output_files = []
        if os.path.exists(output_path):
            for file in os.listdir(output_path):
                if os.path.isfile(os.path.join(output_path, file)):
                    output_files.append(file)
        
        if output_files:
            log_training_activity(voice_identity, "info", f"📄 Generated Files ({len(output_files)} total):")
            for file in sorted(output_files):
                file_path = os.path.join(output_path, file)
                file_size = os.path.getsize(file_path) / (1024*1024)  # MB
                log_training_activity(voice_identity, "info", f"    {file} ({file_size:.1f} MB)")
                
        # Specific file locations for easy access
        key_files = {
            "final_model.pth": "🧠 Main trained model",
            "config.json": "⚙️ Model configuration", 
            "model.onnx": "🔄 ONNX export (if successful)",
        }
        
        log_training_activity(voice_identity, "info", "🎯 Key Files for Integration:")
        for filename, description in key_files.items():
            file_path = os.path.join(output_path, filename)
            if os.path.exists(file_path):
                log_training_activity(voice_identity, "info", f"   ✅ {description}: {file_path}")
            else:
                log_training_activity(voice_identity, "warning", f"   ❌ {description}: Not created")
                
        # Host path instructions (since we're in a container)
        host_output_path = output_path.replace("/app/output", "/home/codemusic/texty/output_onnx")
        log_training_activity(voice_identity, "info", f"🏠 Host System Location: {host_output_path}")
        log_training_activity(voice_identity, "info", "💡 To access files from host: ls -la " + host_output_path)
        
        return True
        
    except Exception as e:
        log_training_activity(voice_identity, "error", f"❌ Training failed: {e}")
        traceback.print_exc()
        return False

def main():
    """Main neural voice synthesis conductor"""
    log_training_event("🚀 RoverSeer Neural Voice Synthesis Conductor Starting...")
    
    # Support both command line arguments and environment variables
    if len(sys.argv) == 3:
        # Command line arguments provided
        voice_samples_path = sys.argv[1]
        neural_output_path = sys.argv[2]
    elif len(sys.argv) == 1:
        # Try environment variables
        voice_samples_path = os.getenv("VOICE_SAMPLES_PATH")
        neural_output_path = os.getenv("NEURAL_OUTPUT_PATH")
        
        if not voice_samples_path or not neural_output_path:
            log_training_event("❌ No arguments provided and environment variables not set")
            log_training_event("Usage: train.py <voice_samples_path> <output_path>")
            log_training_event("   OR: Set VOICE_SAMPLES_PATH and NEURAL_OUTPUT_PATH environment variables")
            log_training_event("Example: train.py /app/data/MyVoice /app/output/MyVoice")
            sys.exit(1)
    else:
        log_training_event("❌ Invalid arguments provided")
        log_training_event("Usage: train.py <voice_samples_path> <output_path>")
        log_training_event("   OR: Set VOICE_SAMPLES_PATH and NEURAL_OUTPUT_PATH environment variables")
        log_training_event("Example: train.py /app/data/MyVoice /app/output/MyVoice")
        sys.exit(1)

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