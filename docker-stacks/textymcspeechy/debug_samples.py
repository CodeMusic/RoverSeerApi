#!/usr/bin/env python3
"""
Debug script to examine the structure of training samples loaded by Coqui TTS
"""

import os
import sys
from TTS.tts.configs.shared_configs import BaseDatasetConfig
from TTS.tts.datasets import load_tts_samples

def debug_samples():
    """Debug what's in the training samples"""
    
    # Path where voice data should be
    voice_path = "/app/data/HomerSimpson"
    
    print(f"🔍 Debugging samples from: {voice_path}")
    
    # Check if metadata exists
    metadata_path = os.path.join(voice_path, "metadata.csv")
    if os.path.exists(metadata_path):
        print(f"✅ Metadata file exists: {metadata_path}")
        with open(metadata_path, 'r') as f:
            lines = f.readlines()
            print(f"📊 Metadata has {len(lines)} lines:")
            for i, line in enumerate(lines[:3]):  # Show first 3 lines
                print(f"  Line {i+1}: {line.strip()}")
    else:
        print(f"❌ Metadata file missing: {metadata_path}")
        return
    
    # Dataset config
    dataset_config = BaseDatasetConfig(
        formatter="ljspeech",
        meta_file_train="metadata.csv",
        path=voice_path
    )
    
    try:
        # Load samples
        train_samples, eval_samples = load_tts_samples(
            dataset_config,
            eval_split=False
        )
        
        print(f"📦 Loaded {len(train_samples)} training samples")
        
        # Examine first few samples
        for i, sample in enumerate(train_samples[:3]):
            print(f"\n🔍 Sample {i}:")
            if isinstance(sample, dict):
                print(f"  Type: dict")
                print(f"  Keys: {list(sample.keys())}")
                for key, value in sample.items():
                    if value is None:
                        print(f"    {key}: None ❌")
                    else:
                        print(f"    {key}: {type(value)} - {str(value)[:50]}...")
            else:
                print(f"  Type: {type(sample)}")
                print(f"  Value: {sample}")
                
    except Exception as e:
        print(f"❌ Error loading samples: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_samples() 