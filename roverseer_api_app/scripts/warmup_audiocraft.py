#!/usr/bin/env python3
"""
AudioCraft Model Warmup Script
Pre-loads AudioCraft models to avoid timeout issues during user requests
"""

import sys
import os
import time
from pathlib import Path

def warm_up_audiocraft():
    """Pre-load AudioCraft models to avoid request timeouts"""
    print("🎵 Starting AudioCraft model warmup...")
    
    try:
        # Import AudioCraft
        print("📦 Importing AudioCraft modules...")
        from audiocraft.models import MusicGen
        from audiocraft.data.audio import audio_write
        import torch
        
        print("✅ AudioCraft imports successful")
        
        # Load MusicGen model
        print("🔄 Loading MusicGen-small model (this may take several minutes on first run)...")
        music_model = MusicGen.get_pretrained('facebook/musicgen-small')
        print("✅ MusicGen-small loaded successfully")
        
        # Try to load AudioGen if available
        try:
            from audiocraft.models import AudioGen
            print("🔄 Loading AudioGen-medium model...")
            audio_model = AudioGen.get_pretrained('facebook/audiogen-medium')
            print("✅ AudioGen-medium loaded successfully")
        except Exception as e:
            print(f"ℹ️  AudioGen not available (will use MusicGen for sound effects): {e}")
        
        # Test generation with short duration
        print("🧪 Testing model generation...")
        music_model.set_generation_params(duration=5)
        test_descriptions = ["happy upbeat melody"]
        test_wav = music_model.generate(test_descriptions)
        print(f"✅ Test generation successful: {test_wav.shape}")
        
        # Save test file
        test_output = "/tmp/audiocraft_warmup_test.wav"
        audio_write("/tmp/audiocraft_warmup_test", test_wav[0].cpu(), music_model.sample_rate)
        
        if os.path.exists(test_output):
            print("✅ Test audio file created successfully")
            os.remove(test_output)  # Clean up
        
        print("🎯 AudioCraft warmup completed successfully!")
        print("🚀 Models are now ready for fast generation")
        return True
        
    except ImportError as e:
        print(f"❌ AudioCraft not installed: {e}")
        print("💡 Install with: pip install audiocraft")
        return False
        
    except Exception as e:
        print(f"❌ AudioCraft warmup failed: {e}")
        import traceback
        print(f"📋 Full error: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    success = warm_up_audiocraft()
    sys.exit(0 if success else 1) 