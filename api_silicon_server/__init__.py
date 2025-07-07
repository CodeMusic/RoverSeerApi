"""
API Silicon Server - MLX-Accelerated Cognitive Services Gateway

A comprehensive AI server providing MLX-accelerated language models,
voice synthesis, speech recognition, and advanced research workflows
for Apple Silicon devices.

Features:
- MLX-accelerated language models and inference
- Advanced research workflows with CBT-informed analysis
- Voice training and synthesis
- Speech-to-text processing
- Multi-modal AI interactions
- Retro-futuristic web interface
"""

__version__ = "1.0.0"
__author__ = "API Silicon Server Team"
__description__ = "MLX-Accelerated Cognitive Services Gateway"

# Core modules
from . import workflows
from . import config

__all__ = ['workflows', 'config'] 