#!/usr/bin/env python3
"""
Configuration Management for API Silicon Server

Centralized settings for MLX acceleration, fallback services, and system paths.
Provides runtime toggles for each AI service and comprehensive logging configuration.
"""

from pathlib import Path
import os
import platform

# ====== MLX ACCELERATION SETTINGS ====== #
USE_MLX_LM = True              # Enable MLX-LM for language model inference
USE_MLX_WHISPER = True         # Enable MLX-Whisper for speech recognition  
USE_MLX_VOICE = True           # Enable MLX voice training and synthesis
USE_MLX_AUDIOCRAFT = True      # Enable MLX-accelerated AudioCraft models

# ====== FALLBACK CONFIGURATION ====== #
# MLX-FIRST POLICY: Only use fallbacks when explicitly enabled
FALLBACK_TO_OLLAMA = False      # Fall back to Ollama if MLX-LM fails (DISABLED BY DEFAULT)
FALLBACK_TO_OPENAI_WHISPER = False  # Fall back to OpenAI Whisper if MLX-Whisper fails
FALLBACK_TO_PIPER = False       # Fall back to Piper if MLX voice fails  
FALLBACK_TO_MATH_AUDIO = False  # Fall back to mathematical synthesis if AudioCraft fails

# Strict MLX Mode (fail if MLX not available instead of using fallbacks)
STRICT_MLX_MODE = True          # Require MLX acceleration - fail if not available
MLX_REQUIRED_SERVICES = ["lm"]  # Services that MUST use MLX (no fallbacks allowed)

# ====== DIRECTORY PATHS ====== #
MLX_MODEL_DIR = Path("~/mlx-models").expanduser()
MLX_VOICE_DIR = Path("~/mlx-models/custom_voices").expanduser()
MLX_LM_DIR = Path("~/mlx-models/language_models").expanduser()
MLX_WHISPER_DIR = Path("~/mlx-models/whisper").expanduser()

# Ensure directories exist
MLX_MODEL_DIR.mkdir(parents=True, exist_ok=True)
MLX_VOICE_DIR.mkdir(parents=True, exist_ok=True)
MLX_LM_DIR.mkdir(parents=True, exist_ok=True)
MLX_WHISPER_DIR.mkdir(parents=True, exist_ok=True)

# ====== LOGGING CONFIGURATION ====== #
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

LOG_FILE = LOG_DIR / "silicon_server.log"
MLX_LOG_FILE = LOG_DIR / "mlx_operations.log"
PERFORMANCE_LOG_FILE = LOG_DIR / "performance_metrics.log"

LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"

# ====== MLX MODEL CONFIGURATION ====== #
MLX_LM_MODELS = {
    "default": "lmstudio-community/DeepSeek-R1-0528-Qwen3-8B-MLX-4bit",
    "small": "mlx-community/Llama-3.2-1B-Instruct-4bit",
    "large": "mlx-community/Llama-3.1-8B-Instruct-4bit",
    "code": "mlx-community/CodeLlama-7b-Instruct-hf-4bit"
}

MLX_WHISPER_MODELS = {
    "tiny": "mlx-community/whisper-tiny-mlx",
    "base": "mlx-community/whisper-base-mlx",
    "small": "mlx-community/whisper-small-mlx",
    "medium": "mlx-community/whisper-medium-mlx"
}

# ====== PERFORMANCE SETTINGS ====== #
MLX_MEMORY_LIMIT = "8GB"       # MLX memory usage limit
MLX_CACHE_SIZE = 100           # Number of models to keep in cache
PERFORMANCE_MONITORING = True   # Enable detailed performance logging

# ====== LEGACY SERVICE CONFIGURATION ====== #
# Ollama Configuration  
OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_OLLAMA_MODEL = "tinydolphin:1.1b"

# Whisper Configuration
WHISPER_MODEL = "base"

# Piper Configuration - Mac optimized
if platform.system() == "Darwin":  # macOS
    # Mac-specific defaults
    PIPER_BINARY = "/opt/homebrew/bin/piper"  # Homebrew default for Apple Silicon
    VOICES_DIR = os.path.expanduser("~/piper/voices")  # Mac-friendly path
    # Alternative voices directory locations for Mac
    ALTERNATIVE_VOICES_DIRS = [
        os.path.expanduser("~/Library/Application Support/piper/voices"),
        os.path.expanduser("~/Downloads/piper_voices"),
        "/usr/local/share/piper/voices",
        "/opt/homebrew/share/piper/voices"
    ]
else:
    # Linux/Pi defaults
    PIPER_BINARY = "piper"
    VOICES_DIR = os.path.expanduser("~/piper/voices")
    ALTERNATIVE_VOICES_DIRS = [
        "/usr/local/share/piper/voices",
        "/home/codemusic/piper/voices"
    ]

DEFAULT_VOICE = "en_US-amy-medium"

# AudioCraft Configuration
AUDIOCRAFT_BASE_URL = "http://localhost:8000"

# ====== RUNTIME FEATURE FLAGS ====== #
ENABLE_VOICE_TRAINING = True   # Enable custom voice training endpoints
ENABLE_STREAMING = True        # Enable streaming responses for chat
ENABLE_CACHING = True          # Enable response caching
ENABLE_METRICS = True          # Enable detailed metrics collection

# ====== DEVELOPMENT SETTINGS ====== #
DEBUG_MODE = False             # Enable debug logging and validation
MOCK_MLX_ERRORS = False        # Simulate MLX failures for testing fallbacks
BENCHMARK_MODE = False         # Enable performance benchmarking

def get_mlx_status():
    """Get current MLX availability status"""
    try:
        import mlx.core as mx
        return {
            "mlx_available": True,
            "mlx_version": getattr(mx, "__version__", "unknown"),
            "device": "Apple Silicon" if mx.metal.is_available() else "CPU"
        }
    except ImportError:
        return {
            "mlx_available": False,
            "mlx_version": None,
            "device": "CPU"
        }

def get_model_path(model_type: str, model_name: str) -> Path:
    """Get the full path for an MLX model"""
    if model_type == "lm":
        return MLX_LM_DIR / model_name
    elif model_type == "whisper":
        return MLX_WHISPER_DIR / model_name
    elif model_type == "voice":
        return MLX_VOICE_DIR / model_name
    else:
        return MLX_MODEL_DIR / model_name

def should_use_mlx(service: str) -> bool:
    """Check if MLX should be used for a specific service"""
    mlx_status = get_mlx_status()
    if not mlx_status["mlx_available"]:
        return False
        
    service_flags = {
        "lm": USE_MLX_LM,
        "whisper": USE_MLX_WHISPER,
        "voice": USE_MLX_VOICE,
        "audiocraft": USE_MLX_AUDIOCRAFT
    }
    
    return service_flags.get(service, False)

# ====== VALIDATION ====== #
if DEBUG_MODE:
    print("🔧 MLX Configuration Loaded:")
    print(f"   • MLX Available: {get_mlx_status()['mlx_available']}")
    print(f"   • MLX-LM: {USE_MLX_LM}")
    print(f"   • MLX-Whisper: {USE_MLX_WHISPER}")
    print(f"   • MLX-Voice: {USE_MLX_VOICE}")
    print(f"   • Model Directory: {MLX_MODEL_DIR}")
    print(f"   • Log Directory: {LOG_DIR}") 