#!/usr/bin/env python3
"""
API Silicon Server - MLX-Accelerated Cognitive Services Gateway

A high-performance, MLX-optimized server that unifies AI services with Apple Silicon acceleration:
- MLX-LM: Ultra-fast language model inference with Apple Silicon optimization
- MLX-Whisper: Hardware-accelerated speech recognition
- MLX Voice Training: Real-time custom voice model creation
- Ollama: Fallback linguistic comprehension
- Piper: Fallback vocal expression
- AudioCraft: Advanced sonic imagination

This server leverages MLX framework for maximum performance on Apple Silicon,
with intelligent fallbacks to ensure reliability across all deployment scenarios.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, Query
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
import uuid
import os
import time
import requests
import subprocess
import asyncio
import json
import shutil
import logging
from pathlib import Path
from datetime import datetime
import platform

# Import configuration system
try:
    from config import (
        USE_MLX_LM, USE_MLX_WHISPER, USE_MLX_VOICE, USE_MLX_AUDIOCRAFT,
        FALLBACK_TO_OLLAMA, FALLBACK_TO_OPENAI_WHISPER, FALLBACK_TO_PIPER,
        MLX_MODEL_DIR, MLX_VOICE_DIR, MLX_LM_DIR, MLX_WHISPER_DIR,
        LOG_FILE, MLX_LOG_FILE, PERFORMANCE_LOG_FILE, LOG_FORMAT,
        MLX_LM_MODELS, MLX_WHISPER_MODELS, PERFORMANCE_MONITORING,
        get_mlx_status, should_use_mlx, get_model_path,
        OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL, WHISPER_MODEL,
        PIPER_BINARY, VOICES_DIR, DEFAULT_VOICE, MOCK_MLX_ERRORS
    )
    CONFIG_AVAILABLE = True
except ImportError:
    print("⚠️ Configuration module not available - using defaults")
    CONFIG_AVAILABLE = False
    # Set defaults
    USE_MLX_LM = False
    USE_MLX_WHISPER = False  
    USE_MLX_VOICE = False
    FALLBACK_TO_OLLAMA = True
    FALLBACK_TO_OPENAI_WHISPER = True
    FALLBACK_TO_PIPER = True

# MLX Framework Integration
try:
    import mlx.core as mx
    import mlx.nn as nn
    MLX_CORE_AVAILABLE = True
    print("✅ MLX Core: Available")
except ImportError:
    MLX_CORE_AVAILABLE = False
    print("❌ MLX Core: Not available")

# MLX-LM Integration
try:
    from mlx_lm import load, generate, stream_generate
    from mlx_lm.utils import load_config
    MLX_LM_AVAILABLE = True
    print("✅ MLX-LM: Available")
except ImportError:
    MLX_LM_AVAILABLE = False
    print("❌ MLX-LM: Not available")

# MLX-Whisper Integration  
try:
    import mlx_whisper
    MLX_WHISPER_AVAILABLE = True
    print("✅ MLX-Whisper: Available")
except ImportError:
    MLX_WHISPER_AVAILABLE = False
    print("❌ MLX-Whisper: Not available")

# MLX Voice Training Integration
try:
    from mlx_voice_training import get_voice_trainer, MLXVoiceTrainer
    MLX_VOICE_TRAINING_AVAILABLE = True
    print("✅ MLX Voice Training: Available")
except ImportError:
    MLX_VOICE_TRAINING_AVAILABLE = False
    print("❌ MLX Voice Training: Not available")

# -------- COMPREHENSIVE LOGGING SETUP -------- #
# Set up multiple log handlers for different purposes
def setup_logging():
    """Initialize comprehensive logging system"""
    
    # Main server logger
    main_logger = logging.getLogger("SiliconServer")
    main_logger.setLevel(logging.INFO)
    
    # MLX operations logger
    mlx_logger = logging.getLogger("MLXOperations")
    mlx_logger.setLevel(logging.INFO)
    
    # Performance logger
    perf_logger = logging.getLogger("Performance")
    perf_logger.setLevel(logging.INFO)
    
    # Create formatters
    detailed_formatter = logging.Formatter(LOG_FORMAT if CONFIG_AVAILABLE else 
                                         '%(asctime)s | %(levelname)s | %(name)s | %(message)s')
    simple_formatter = logging.Formatter('%(asctime)s | %(levelname)s | %(message)s')
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(simple_formatter)
    console_handler.setLevel(logging.INFO)
    
    # File handlers
    if CONFIG_AVAILABLE:
        # Main log file
        main_file_handler = logging.FileHandler(LOG_FILE)
        main_file_handler.setFormatter(detailed_formatter)
        main_logger.addHandler(main_file_handler)
        
        # MLX operations log
        mlx_file_handler = logging.FileHandler(MLX_LOG_FILE)  
        mlx_file_handler.setFormatter(detailed_formatter)
        mlx_logger.addHandler(mlx_file_handler)
        
        # Performance log
        perf_file_handler = logging.FileHandler(PERFORMANCE_LOG_FILE)
        perf_file_handler.setFormatter(detailed_formatter)
        perf_logger.addHandler(perf_file_handler)
    else:
        # Fallback to /tmp
        fallback_handler = logging.FileHandler('/tmp/silicon_server.log')
        fallback_handler.setFormatter(detailed_formatter)
        main_logger.addHandler(fallback_handler)
    
    # Add console handler to all loggers
    for logger in [main_logger, mlx_logger, perf_logger]:
        logger.addHandler(console_handler)
    
    return main_logger, mlx_logger, perf_logger

# Initialize loggers
logger, mlx_logger, perf_logger = setup_logging()

def log_event(message: str, logger_type: str = "main"):
    """Centralized logging function"""
    if logger_type == "mlx":
        mlx_logger.info(message)
    elif logger_type == "performance":
        perf_logger.info(message)
    else:
        logger.info(message)

def log_performance(operation: str, duration: float, success: bool, details: str = ""):
    """Log performance metrics"""
    if PERFORMANCE_MONITORING if CONFIG_AVAILABLE else True:
        status = "SUCCESS" if success else "FAILED"
        perf_logger.info(f"{operation} | {status} | Duration: {duration:.3f}s | {details}")

def log_mlx_operation(operation: str, model: str, success: bool, error: str = "", metrics: dict = None):
    """Log MLX-specific operations"""
    status = "SUCCESS" if success else "FAILED"
    message = f"MLX {operation} | Model: {model} | Status: {status}"
    if error:
        message += f" | Error: {error}"
    if metrics:
        message += f" | Metrics: {metrics}"
    mlx_logger.info(message)

# Log MLX status on startup
if CONFIG_AVAILABLE:
    mlx_status = get_mlx_status()
    log_event(f"🔬 MLX Status: {mlx_status}", "mlx")
    log_event(f"🎛️ MLX-LM Enabled: {USE_MLX_LM}", "mlx")
    log_event(f"🎤 MLX-Whisper Enabled: {USE_MLX_WHISPER}", "mlx")
    log_event(f"🗣️ MLX-Voice Enabled: {USE_MLX_VOICE}", "mlx")

def log_request(endpoint: str, client_ip: str, request_data: dict = None, files: dict = None):
    """Log incoming requests with detailed information"""
    log_msg = f"🌐 INCOMING REQUEST | {endpoint} | Client: {client_ip}"
    if request_data:
        # Truncate long text for readability
        truncated_data = {}
        for key, value in request_data.items():
            if isinstance(value, str) and len(value) > 100:
                truncated_data[key] = f"{value[:100]}...[{len(value)} chars total]"
            else:
                truncated_data[key] = value
        log_msg += f" | Data: {truncated_data}"
    if files:
        log_msg += f" | Files: {list(files.keys())}"
    logger.info(log_msg)

def log_response(endpoint: str, client_ip: str, status: str, processing_time: float = None, error: str = None):
    """Log response status and timing"""
    log_msg = f"📤 RESPONSE | {endpoint} | Client: {client_ip} | Status: {status}"
    if processing_time:
        log_msg += f" | Time: {processing_time:.2f}s"
    if error:
        log_msg += f" | Error: {error}"
    logger.info(log_msg)

# -------- RESPONSE MODELS -------- #
class ServiceStatus(BaseModel):
    """Service status response model"""
    status: str
    services: Dict[str, bool]
    metrics: Dict[str, int]
    active_sessions: int
    timestamp: str

class ChatResponse(BaseModel):
    """Chat response model"""
    status: str
    session_id: str
    text_response: Optional[str] = None
    audio_available: Optional[bool] = None
    processing_time: float

class ModelInfo(BaseModel):
    """Model information with backend details"""
    name: str
    full_name: str
    size: int
    modified_at: str
    digest: str
    family: str
    backend: str
    accelerated: bool
    recommended: bool

class ModelsResponse(BaseModel):
    """Models list response with backend availability"""
    status: str
    total_models: int
    default_model: str
    mlx_available: bool
    ollama_available: bool
    models: List[ModelInfo]
    timestamp: str

class VoiceInfo(BaseModel):
    """Voice information"""
    name: str
    language: str
    speaker: str
    quality: str
    model_path: str
    config_available: bool
    file_size: int

class VoicesResponse(BaseModel):
    """Voices list response"""
    status: str
    total_voices: int
    default_voice: str
    voices_directory: str
    voices: List[VoiceInfo]
    timestamp: str

class TranscriptionResponse(BaseModel):
    """Speech-to-text response"""
    status: str
    transcript: str
    model_used: str
    timestamp: str

class LLMResponse(BaseModel):
    """LLM chat response"""
    status: str
    response: str
    model_used: str
    timestamp: str

class TrainingResponse(BaseModel):
    """Voice training response"""
    status: str
    training_id: str
    voice_name: str
    estimated_duration: str
    timestamp: str

class TrainingStatusResponse(BaseModel):
    """Training status response"""
    training_id: str
    status: str
    progress: int
    estimated_remaining: str
    timestamp: str

class ErrorResponse(BaseModel):
    """Error response model"""
    status: str
    error: str
    session_id: Optional[str] = None

# -------- MLX SERVICE WRAPPERS -------- #
class MLXLanguageModelService:
    """MLX-LM service wrapper with fallback support"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.current_model_name = None
        self.available = MLX_LM_AVAILABLE and should_use_mlx("lm") if CONFIG_AVAILABLE else False
        
    async def load_model(self, model_name: str = "default"):
        """Load MLX-LM model with caching"""
        if not self.available:
            raise Exception("MLX-LM not available")
            
        try:
            # Use configured model name
            actual_model = MLX_LM_MODELS.get(model_name, model_name) if CONFIG_AVAILABLE else model_name
            
            if self.current_model_name != actual_model:
                log_mlx_operation("LOAD_MODEL", actual_model, False, "Starting load...")
                start_time = time.time()
                
                self.model, self.tokenizer = load(actual_model)
                self.current_model_name = actual_model
                
                load_time = time.time() - start_time
                log_mlx_operation("LOAD_MODEL", actual_model, True, metrics={"load_time": load_time})
                
            return True
        except Exception as e:
            log_mlx_operation("LOAD_MODEL", model_name, False, str(e))
            raise
    
    async def generate(self, prompt: str, **kwargs):
        """Generate text with MLX-LM"""
        if not self.model or not self.tokenizer:
            await self.load_model()
            
        try:
            from mlx_lm.sample_utils import make_sampler
            
            start_time = time.time()
            
            # Set default parameters
            max_tokens = kwargs.get("max_tokens", 512)
            temperature = kwargs.get("temperature", 0.7)
            top_p = kwargs.get("top_p", 1.0)
            
            # Create sampler for MLX-LM
            sampler = make_sampler(temp=temperature, top_p=top_p)
            
            # Generate response using correct MLX-LM API
            response = generate(
                self.model, 
                self.tokenizer, 
                prompt=prompt,
                max_tokens=max_tokens,
                sampler=sampler,
                verbose=False
            )
            
            generation_time = time.time() - start_time
            log_performance("MLX_LM_GENERATE", generation_time, True, 
                          f"Tokens: {len(response.split())} | Model: {self.current_model_name}")
            
            return response
        except Exception as e:
            generation_time = time.time() - start_time
            log_performance("MLX_LM_GENERATE", generation_time, False, f"Error: {e}")
            raise


class MLXWhisperService:
    """MLX-Whisper service wrapper with fallback support"""
    
    def __init__(self):
        self.model = None
        self.current_model_name = None
        self.available = MLX_WHISPER_AVAILABLE and should_use_mlx("whisper") if CONFIG_AVAILABLE else False
    
    async def load_model(self, model_name: str = "base"):
        """Load MLX-Whisper model"""
        if not self.available:
            raise Exception("MLX-Whisper not available")
            
        try:
            # Use configured model name
            actual_model = MLX_WHISPER_MODELS.get(model_name, model_name) if CONFIG_AVAILABLE else model_name
            
            if self.current_model_name != actual_model:
                log_mlx_operation("LOAD_WHISPER", actual_model, False, "Starting load...")
                start_time = time.time()
                
                self.model = mlx_whisper.load_model(actual_model)
                self.current_model_name = actual_model
                
                load_time = time.time() - start_time
                log_mlx_operation("LOAD_WHISPER", actual_model, True, metrics={"load_time": load_time})
                
            return True
        except Exception as e:
            log_mlx_operation("LOAD_WHISPER", model_name, False, str(e))
            raise
    
    async def transcribe(self, audio_path: str):
        """Transcribe audio with MLX-Whisper"""
        if not self.model:
            await self.load_model()
            
        try:
            start_time = time.time()
            
            result = self.model.transcribe(audio_path)
            transcript = result["text"] if isinstance(result, dict) else result
            
            transcription_time = time.time() - start_time
            log_performance("MLX_WHISPER_TRANSCRIBE", transcription_time, True,
                          f"Text length: {len(transcript)} | Model: {self.current_model_name}")
            
            return transcript
        except Exception as e:
            transcription_time = time.time() - start_time
            log_performance("MLX_WHISPER_TRANSCRIBE", transcription_time, False, f"Error: {e}")
            raise


# -------- CONFIGURATION -------- #
class CognitiveConfiguration:
    """Configuration management for cognitive services with MLX integration"""
    
    # Use config values if available, otherwise use defaults
    OLLAMA_BASE_URL = OLLAMA_BASE_URL if CONFIG_AVAILABLE else "http://localhost:11434"
    # Prioritize MLX models when available
    if CONFIG_AVAILABLE and MLX_LM_MODELS and MLX_LM_AVAILABLE:
        DEFAULT_MODEL = "default"  # MLX default model
    else:
        DEFAULT_MODEL = DEFAULT_OLLAMA_MODEL if CONFIG_AVAILABLE else "tinydolphin:1.1b"
    
    # Whisper Configuration  
    WHISPER_MODEL = WHISPER_MODEL if CONFIG_AVAILABLE else "base"
    
    # Piper Configuration
    PIPER_BINARY = PIPER_BINARY if CONFIG_AVAILABLE else "piper"
    VOICES_DIR = VOICES_DIR if CONFIG_AVAILABLE else os.path.expanduser("~/piper/voices")
    DEFAULT_VOICE = DEFAULT_VOICE if CONFIG_AVAILABLE else "en_US-amy-medium"
    
    # AudioCraft Configuration (proxy to main server)
    AUDIOCRAFT_BASE_URL = "http://localhost:8000"
    
    @classmethod
    def detect_piper_binary(cls):
        """Detect Piper binary location on Mac and other systems"""
        import platform
        
        # Mac-specific locations (prioritized for macOS)
        if platform.system() == "Darwin":  # macOS
            mac_locations = [
                "/opt/homebrew/bin/piper",        # Homebrew on Apple Silicon
                "/usr/local/bin/piper",           # Homebrew on Intel Mac
                "/Applications/Piper.app/Contents/MacOS/piper",  # Mac app bundle
                str(Path.home() / "piper" / "piper"),  # Manual install in home
                str(Path.home() / "Downloads" / "piper" / "piper"),  # Downloaded binary
            ]
            
            for location in mac_locations:
                if Path(location).exists() and os.access(location, os.X_OK):
                    print(f"🍎 Found Piper binary at: {location}")
                    cls.PIPER_BINARY = location
                    return location
        
        # Generic Unix/Linux locations
        unix_locations = [
            "/usr/local/bin/piper",
            "/usr/bin/piper",
            "/home/codemusic/roverseer_venv/bin/piper",  # Pi/Linux specific
            str(Path.home() / "bin" / "piper"),
        ]
        
        for location in unix_locations:
            if Path(location).exists() and os.access(location, os.X_OK):
                print(f"🐧 Found Piper binary at: {location}")
                cls.PIPER_BINARY = location
                return location
        
        # Check PATH using shutil.which
        try:
            which_result = shutil.which("piper")
            if which_result:
                print(f"🔍 Found Piper in PATH: {which_result}")
                cls.PIPER_BINARY = which_result
                return which_result
        except Exception as e:
            print(f"Error checking PATH for piper: {e}")
        
        print("❌ Piper binary not found in any known location")
        return None


class CognitiveSynthesisServer:
    """
    Standalone server for unified AI services coordination.
    
    Each method represents a specialized cognitive faculty that operates
    independently while contributing to the overall synthetic intelligence.
    """
    
    def __init__(self):
        """Initialize the MLX-accelerated cognitive synthesis server"""
        self.app = FastAPI(
            title="API Silicon Server", 
            description="""
# 🧠 MLX-Accelerated Cognitive Services Gateway

A high-performance, Apple Silicon optimized API that orchestrates multiple AI services:

- **🔥 MLX-LM**: Ultra-fast language model inference with Apple Silicon acceleration
- **🎤 MLX-Whisper**: Hardware-accelerated speech recognition
- **👤 MLX Voice Training**: Real-time custom voice model creation
- **🗣️ Chat with Voice I/O**: Complete conversational AI with speech input/output
- **🔊 Text-to-Speech**: High-quality neural voice synthesis
- **🎵 Audio Generation**: Advanced music, sounds, and MelodyFlow generation
- **🔄 Intelligent Fallbacks**: Automatic fallback to Ollama, Whisper, and Piper

## 🚀 Quick Start

1. Install MLX framework: `pip install mlx mlx-lm mlx-whisper`
2. Configure services in `config.py`
3. Use `/status` to verify MLX acceleration
4. Use `/models` and `/voices` to see available resources

## 🔥 MLX Performance Features

- **Apple Silicon Acceleration**: Native Metal GPU compute
- **Model Caching**: Intelligent model loading and memory management
- **Streaming Generation**: Real-time text and audio streaming
- **Performance Monitoring**: Detailed metrics and benchmarking

## 📖 Documentation

- Interactive testing available below
- All endpoints support CORS for web clients
- Audio responses returned as WAV files
- Session tracking for chat conversations
- Comprehensive logging and performance metrics
            """,
            version="2.0.0",
            docs_url="/docs",
            redoc_url="/redoc",
            openapi_tags=[
                {
                    "name": "status",
                    "description": "Service status and MLX acceleration monitoring"
                },
                {
                    "name": "chat", 
                    "description": "MLX-accelerated conversational AI with multimodal I/O"
                },
                {
                    "name": "speech",
                    "description": "MLX-Whisper and TTS services"
                },
                {
                    "name": "llm",
                    "description": "MLX-LM and Ollama language model access"
                },
                {
                    "name": "audiocraft",
                    "description": "Audio generation (music, sounds, MelodyFlow)"
                },
                {
                    "name": "training",
                    "description": "MLX voice model training and management"
                },
                {
                    "name": "mlx",
                    "description": "🔥 MLX model management - search, download, and configure Apple Silicon optimized models"
                },
                {
                    "name": "ollama-compatibility",
                    "description": "🔄 Ollama API compatibility endpoints"
                },
                {
                    "name": "openai-compatibility",
                    "description": "🔄 OpenAI API compatibility endpoints"
                }
            ]
        )
        
        # Enable CORS for web client access
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"], 
            allow_headers=["*"],
        )
        
        # Setup template and static file serving
        self.templates = Jinja2Templates(directory="templates")
        
        # Mount static files if directory exists
        static_dir = Path("static")
        if static_dir.exists():
            self.app.mount("/static", StaticFiles(directory="static"), name="static")
        
        # Add comprehensive request logging middleware
        @self.app.middleware("http")
        async def log_requests(request: Request, call_next):
            start_time = time.time()
            client_ip = request.client.host
            endpoint = request.url.path
            method = request.method
            
            logger.info(f"🔄 {method} REQUEST | {endpoint} | Client: {client_ip} | User-Agent: {request.headers.get('user-agent', 'Unknown')}")
            
            response = await call_next(request)
            process_time = time.time() - start_time
            
            logger.info(f"✅ {method} RESPONSE | {endpoint} | Client: {client_ip} | Status: {response.status_code} | Time: {process_time:.2f}s")
            
            return response
        
        # Initialize MLX services
        self.mlx_lm_service = MLXLanguageModelService()
        self.mlx_whisper_service = MLXWhisperService()
        
        # Cognitive state tracking with MLX metrics
        self.synthesis_sessions = {}
        self.cognitive_metrics = {
            "total_syntheses": 0,
            "mlx_lm_calls": 0,
            "mlx_whisper_calls": 0,
            "mlx_voice_training": 0,
            "ollama_fallbacks": 0,
            "whisper_fallbacks": 0,
            "piper_fallbacks": 0,
            "linguistic_calls": 0,
            "auditory_transcriptions": 0,
            "vocal_expressions": 0,
            "sonic_imaginations": 0
        }
        
        self._setup_neural_pathways()
        self._initialize_cognitive_faculties()
    
    
    def _initialize_cognitive_faculties(self):
        """Initialize and validate cognitive service availability with MLX integration"""
        print("🧠 Initializing MLX-Accelerated API Silicon Server...")
        
        # Test MLX services first
        self.mlx_lm_available = self._test_mlx_lm_availability()
        self.mlx_whisper_available = self._test_mlx_whisper_availability()
        self.mlx_voice_available = self._test_mlx_voice_availability()
        
        # Test fallback services
        self.ollama_available = self._test_ollama_connection()
        self.whisper_available = self._test_whisper_availability()
        self.piper_available = self._test_piper_availability()
        self.audiocraft_available = self._test_audiocraft_availability()
        
        # Log service availability summary
        log_event("🔥 MLX Services Summary:", "mlx")
        log_event(f"   • MLX-LM: {'✅ Available' if self.mlx_lm_available else '❌ Unavailable'}", "mlx")
        log_event(f"   • MLX-Whisper: {'✅ Available' if self.mlx_whisper_available else '❌ Unavailable'}", "mlx")
        log_event(f"   • MLX-Voice: {'✅ Available' if self.mlx_voice_available else '❌ Unavailable'}", "mlx")
        
        log_event("🔄 Fallback Services Summary:")
        log_event(f"   • Ollama: {'✅ Available' if self.ollama_available else '❌ Unavailable'}")
        log_event(f"   • Whisper: {'✅ Available' if self.whisper_available else '❌ Unavailable'}")
        log_event(f"   • Piper: {'✅ Available' if self.piper_available else '❌ Unavailable'}")
        log_event(f"   • AudioCraft: {'✅ Available' if self.audiocraft_available else '❌ Unavailable'}")
        
        print("✨ MLX-accelerated cognitive faculties initialized")
    
    
    def _test_mlx_lm_availability(self):
        """Test MLX-LM service availability"""
        try:
            if not self.mlx_lm_service.available:
                print("❌ MLX-LM: Service disabled or unavailable")
                return False
            
            # Test model loading (without actually loading to save startup time)
            if CONFIG_AVAILABLE and MLX_LM_MODELS:
                default_model = MLX_LM_MODELS.get("default", "unknown")
                print(f"✅ MLX-LM: Available with model {default_model}")
                log_mlx_operation("SERVICE_TEST", default_model, True)
                return True
            else:
                print("✅ MLX-LM: Available (no models configured)")
                return True
                
        except Exception as e:
            print(f"❌ MLX-LM: Error - {e}")
            log_mlx_operation("SERVICE_TEST", "unknown", False, str(e))
            return False
    
    
    def _test_mlx_whisper_availability(self):
        """Test MLX-Whisper service availability"""
        try:
            if not self.mlx_whisper_service.available:
                print("❌ MLX-Whisper: Service disabled or unavailable")
                return False
            
            # Test basic functionality
            if CONFIG_AVAILABLE and MLX_WHISPER_MODELS:
                default_model = MLX_WHISPER_MODELS.get("base", "unknown")
                print(f"✅ MLX-Whisper: Available with model {default_model}")
                log_mlx_operation("WHISPER_TEST", default_model, True)
                return True
            else:
                print("✅ MLX-Whisper: Available (no models configured)")
                return True
                
        except Exception as e:
            print(f"❌ MLX-Whisper: Error - {e}")
            log_mlx_operation("WHISPER_TEST", "unknown", False, str(e))
            return False
    
    
    def _test_mlx_voice_availability(self):
        """Test MLX voice training availability"""
        try:
            if not MLX_VOICE_TRAINING_AVAILABLE:
                print("❌ MLX Voice Training: Not available")
                return False
            
            if CONFIG_AVAILABLE and should_use_mlx("voice"):
                print("✅ MLX Voice Training: Available and enabled")
                log_mlx_operation("VOICE_TRAINING_TEST", "mlx_voice", True)
                return True
            else:
                print("✅ MLX Voice Training: Available but disabled")
                return True
                
        except Exception as e:
            print(f"❌ MLX Voice Training: Error - {e}")
            log_mlx_operation("VOICE_TRAINING_TEST", "mlx_voice", False, str(e))
            return False
    
    
    def _test_ollama_connection(self):
        """Test Ollama server connectivity"""
        try:
            response = requests.get(f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/tags", timeout=3)
            if response.status_code == 200:
                models = response.json().get("models", [])
                print(f"✅ Ollama: Connected with {len(models)} models")
                return True
        except Exception as e:
            print(f"❌ Ollama: {e}")
        return False
    
    
    def _test_whisper_availability(self):
        """Test Whisper CLI availability"""
        try:
            # Test if whisper is available as Python module
            import whisper
            print("✅ Whisper: Available via Python module")
            return True
        except ImportError:
            # Test if whisper CLI is available
            try:
                result = subprocess.run(["whisper", "--help"], capture_output=True, timeout=5)
                if result.returncode == 0:
                    print("✅ Whisper: Available via CLI")
                    return True
            except:
                pass
        print("❌ Whisper: Not available")
        return False
    
    
    def _test_piper_availability(self):
        """Test Piper TTS availability - Mac compatible version"""
        # First, try to detect Piper binary locations
        detected_binary = CognitiveConfiguration.detect_piper_binary()
        if detected_binary:
            print(f"✅ Piper: Found binary at {detected_binary}")
            CognitiveConfiguration.PIPER_BINARY = detected_binary
            
            # Test if we can run it
            try:
                result = subprocess.run([detected_binary, "--help"], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    print("✅ Piper: Binary is functional")
                    return True
                else:
                    print(f"❌ Piper: Binary not functional - return code {result.returncode}")
            except Exception as e:
                print(f"❌ Piper: Binary test failed - {e}")
        
        # Fallback: try to import piper-tts Python package
        try:
            import piper
            print("✅ Piper: Python module available")
            return True
        except ImportError:
            print("❌ Piper: Python module not available")
        
        # Check if voices directory exists at least
        voices_dir = Path(CognitiveConfiguration.VOICES_DIR)
        if voices_dir.exists():
            voice_files = list(voices_dir.glob("*.onnx"))
            if voice_files:
                print(f"⚠️  Piper: Binary not found but {len(voice_files)} voice files exist")
                print("💡 Install Piper with: brew install piper-tts")
                return False
            else:
                print("❌ Piper: No voice models found")
        else:
            print(f"❌ Piper: Voices directory not found at {voices_dir}")
            print("💡 Install Piper with: brew install piper-tts")
        
        return False
    
    
    def _test_audiocraft_availability(self):
        """Test AudioCraft service availability - now using real AI models"""
        try:
            # Test if we can import AudioCraft
            from audiocraft.models import MusicGen
            
            # Try to access a model (don't load it yet to save time during startup)
            print("✅ AudioCraft: Real AI models available (MusicGen)")
            return True
        except ImportError as e:
            print(f"❌ AudioCraft: Missing AudioCraft package - {e}")
            return False
        except Exception as e:
            print(f"❌ AudioCraft: Error checking models - {e}")
            return False
    
    
    def _setup_neural_pathways(self):
        """Establish API routes for cognitive synthesis"""
        
        @self.app.get("/status", 
                      response_model=ServiceStatus,
                      tags=["status"],
                      summary="Service Status",
                      description="Get the operational status of all AI services and current metrics")
        async def service_status(request: Request):
            """
            Report the operational status of all AI services including:
            - Service availability (Ollama, Whisper, Piper, AudioCraft)
            - Usage metrics and active sessions
            - Server timestamp
            """
            client_ip = request.client.host
            
            # Get MLX status if available
            mlx_status = get_mlx_status() if CONFIG_AVAILABLE else {"mlx_available": False}
            
            logger.info(f"📊 STATUS CHECK | Client: {client_ip} | MLX: {mlx_status['mlx_available']} | Services: Ollama={self.ollama_available}, Whisper={self.whisper_available}, Piper={self.piper_available}, AudioCraft={self.audiocraft_available}")
            
            status_data = {
                "status": "operational",
                "mlx_acceleration": {
                    "enabled": mlx_status["mlx_available"],
                    "device": mlx_status.get("device", "Unknown"),
                    "version": mlx_status.get("mlx_version", "Unknown")
                },
                "services": {
                    "mlx_lm": self.mlx_lm_available,
                    "mlx_whisper": self.mlx_whisper_available,
                    "mlx_voice": self.mlx_voice_available,
                    "ollama": self.ollama_available,
                    "whisper": self.whisper_available,
                    "piper": self.piper_available,
                    "audiocraft": self.audiocraft_available
                },
                "fallback_configuration": {
                    "ollama_fallback": FALLBACK_TO_OLLAMA if CONFIG_AVAILABLE else True,
                    "whisper_fallback": FALLBACK_TO_OPENAI_WHISPER if CONFIG_AVAILABLE else True,
                    "piper_fallback": FALLBACK_TO_PIPER if CONFIG_AVAILABLE else True
                },
                "metrics": self.cognitive_metrics,
                "active_sessions": len(self.synthesis_sessions),
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"📤 STATUS RESPONSE | Client: {client_ip} | MLX Services: {self.mlx_lm_available}/{self.mlx_whisper_available}/{self.mlx_voice_available}")
            return JSONResponse(content=status_data)
        
        
        # -------- WEB INTERFACE ROUTES -------- #
        
        @self.app.get("/", response_class=HTMLResponse, include_in_schema=False)
        async def home(request: Request):
            """Serve the main chat interface"""
            return self.templates.TemplateResponse("index.html", {"request": request})
        
        @self.app.get("/models", response_class=HTMLResponse, include_in_schema=False)
        async def model_manager(request: Request):
            """Serve the MLX model management interface"""
            return self.templates.TemplateResponse("models.html", {"request": request})
        
        @self.app.get("/voice", response_class=HTMLResponse, include_in_schema=False)
        async def voice_center(request: Request):
            """Serve the voice training and management interface"""
            return self.templates.TemplateResponse("voice.html", {"request": request})
        
        @self.app.get("/improv", response_class=HTMLResponse, include_in_schema=False)
        async def improv_games(request: Request):
            """Serve the interactive AI games interface"""
            return self.templates.TemplateResponse("improv.html", {"request": request})
        
        @self.app.get("/narrative", response_class=HTMLResponse, include_in_schema=False)
        async def emergent_narrative(request: Request):
            """Serve the collaborative storytelling interface"""
            return self.templates.TemplateResponse("narrative.html", {"request": request})
        
        @self.app.post("/reset_system", 
                       tags=["system"],
                       summary="Reset System",
                       description="Reset all system states, clear sessions, and reinitialize services")
        async def reset_system(request: Request):
            """
            🔄 **System Reset**
            
            Performs a comprehensive system reset:
            - Clears all active sessions
            - Resets cognitive metrics
            - Reinitializes MLX services
            - Clears temporary files
            """
            try:
                client_ip = request.client.host
                log_event(f"🔄 SYSTEM RESET initiated by {client_ip}")
                
                # Clear active sessions
                self.synthesis_sessions.clear()
                
                # Reset metrics
                self.cognitive_metrics = {
                    "total_syntheses": 0,
                    "mlx_lm_calls": 0,
                    "mlx_whisper_calls": 0,
                    "mlx_voice_training": 0,
                    "ollama_fallbacks": 0,
                    "whisper_fallbacks": 0,
                    "piper_fallbacks": 0,
                    "linguistic_calls": 0,
                    "auditory_transcriptions": 0,
                    "vocal_expressions": 0,
                    "sonic_imaginations": 0
                }
                
                # Clear MLX model caches
                try:
                    if hasattr(self.mlx_lm_service, 'model') and self.mlx_lm_service.model:
                        self.mlx_lm_service.model = None
                        self.mlx_lm_service.tokenizer = None
                        self.mlx_lm_service.current_model_name = None
                        log_mlx_operation("MODEL_RESET", "mlx_lm", True)
                    
                    if hasattr(self.mlx_whisper_service, 'model') and self.mlx_whisper_service.model:
                        self.mlx_whisper_service.model = None
                        self.mlx_whisper_service.current_model_name = None
                        log_mlx_operation("MODEL_RESET", "mlx_whisper", True)
                except Exception as e:
                    log_mlx_operation("MODEL_RESET", "unknown", False, str(e))
                
                # Clean temporary files
                import glob
                temp_files = glob.glob("/tmp/input_*.wav") + glob.glob("/tmp/output_*.wav") + glob.glob("/tmp/music_*.wav")
                for temp_file in temp_files:
                    try:
                        os.remove(temp_file)
                    except:
                        pass
                
                # Reinitialize cognitive faculties
                self._initialize_cognitive_faculties()
                
                log_event(f"✅ SYSTEM RESET completed successfully by {client_ip}")
                
                return JSONResponse(content={
                    "status": "success",
                    "message": "System reset completed successfully",
                    "timestamp": datetime.now().isoformat(),
                    "services_reinitialized": {
                        "mlx_lm": self.mlx_lm_available,
                        "mlx_whisper": self.mlx_whisper_available,
                        "mlx_voice": self.mlx_voice_available,
                        "ollama": self.ollama_available,
                        "whisper": self.whisper_available,
                        "piper": self.piper_available,
                        "audiocraft": self.audiocraft_available
                    }
                })
                
            except Exception as e:
                log_event(f"❌ SYSTEM RESET failed: {e}")
                return JSONResponse(
                    status_code=500,
                    content={
                        "status": "error",
                        "error": f"System reset failed: {str(e)}",
                        "timestamp": datetime.now().isoformat()
                    }
                )
        
        
        @self.app.post("/chat",
                       tags=["chat"],
                       summary="Unified Chat with Voice I/O",
                       description="Main conversational AI endpoint supporting text and audio input/output",
                       responses={
                           200: {
                               "description": "Successful response",
                               "content": {
                                   "application/json": {
                                       "example": {
                                           "status": "success",
                                           "session_id": "abc123",
                                           "text_response": "Hello! How can I help you today?",
                                           "processing_time": 1.23
                                       }
                                   },
                                   "audio/wav": {
                                       "description": "Audio response file"
                                   }
                               }
                           },
                           503: {"model": ErrorResponse}
                       })
        async def chat_with_voice(
            text_input: Optional[str] = Form(None, description="Text input for the conversation", example="Hello, how are you?"),
            audio_input: Optional[UploadFile] = File(None, description="Audio file for speech-to-text (WAV format recommended)"),
            model: Optional[str] = Form(CognitiveConfiguration.DEFAULT_MODEL, description="Ollama model to use", example="tinydolphin:1.1b"),
            voice: Optional[str] = Form(CognitiveConfiguration.DEFAULT_VOICE, description="Piper voice for TTS", example="en_US-amy-medium"),
            response_format: str = Form("audio", description="Response format: text, audio, or both", example="audio"),
            system_prompt: Optional[str] = Form("You are a helpful AI assistant", description="System prompt for the LLM", example="You are a friendly robot assistant")
        ):
            """
            🗣️ **Unified Conversational AI Pipeline**
            
            This endpoint supports multiple conversation flows:
            
            **Text → Text**: Send text, receive text response
            - Set `text_input` and `response_format=text`
            
            **Text → Audio**: Send text, receive spoken response  
            - Set `text_input` and `response_format=audio`
            
            **Audio → Audio**: Send speech, receive spoken response
            - Upload `audio_input` file and set `response_format=audio`
            
            **Audio → Text**: Send speech, receive text response
            - Upload `audio_input` file and set `response_format=text`
            
            The server automatically handles:
            - Speech-to-text conversion (Whisper)
            - LLM processing (Ollama)
            - Text-to-speech synthesis (Piper)
            - Session tracking and metrics
            """
            
            session_id = str(uuid.uuid4())
            start_time = time.time()
            
            try:
                # Phase 1: Speech-to-Text (if audio provided)
                if audio_input and not text_input:
                    log_event("🎤 Processing audio input...", "performance")
                    
                    temp_audio = f"/tmp/input_{uuid.uuid4().hex}.wav"
                    with open(temp_audio, "wb") as buffer:
                        content = await audio_input.read()
                        buffer.write(content)
                    
                    # Try MLX-Whisper first, then fallback
                    text_input = await self._transcribe_with_fallback(temp_audio)
                    os.remove(temp_audio)
                    log_event(f"📝 Transcribed: {text_input[:100]}...", "performance")
                
                elif not text_input:
                    raise HTTPException(status_code=400, detail="No input provided")
                
                # Phase 2: LLM Processing with MLX/Ollama fallback
                log_event("🤔 Processing with LLM...", "performance")
                llm_response = await self._generate_with_fallback(text_input, model, system_prompt)
                log_event(f"💭 LLM Response: {llm_response[:100]}...", "performance")
                
                # Phase 3: Text-to-Speech (if requested)
                if response_format in ["audio", "both"]:
                    print("🗣️ Generating speech...")
                    
                    voice_model_path = self._find_voice_model(voice)
                    voice_config_path = self._find_voice_config(voice)
                    
                    if voice_model_path and voice_config_path:
                        output_path = f"/tmp/output_{session_id}.wav"
                        
                        # Use Python piper module
                        try:
                            import piper
                            import wave
                            tts_model = piper.PiperVoice.load(voice_model_path, config_path=voice_config_path)
                            
                            # Generate audio using stream method
                            audio_bytes = b''
                            for audio_chunk in tts_model.synthesize_stream_raw(llm_response):
                                audio_bytes += audio_chunk
                            
                            # Write WAV file
                            with wave.open(output_path, 'wb') as wav_file:
                                wav_file.setnchannels(1)  # mono
                                wav_file.setsampwidth(2)  # 16-bit
                                wav_file.setframerate(tts_model.config.sample_rate)
                                wav_file.writeframes(audio_bytes)
                            
                            synthesis_success = True
                        except Exception as e:
                            print(f"❌ Piper synthesis error: {e}")
                            synthesis_success = False
                        
                        if synthesis_success:
                            processing_time = time.time() - start_time
                            
                            # Record session
                            self.synthesis_sessions[session_id] = {
                                "timestamp": datetime.now().isoformat(),
                                "input_text": text_input,
                                "output_text": llm_response,
                                "processing_time": processing_time
                            }
                            
                            self.cognitive_metrics["total_syntheses"] += 1
                            
                            if response_format == "audio":
                                return FileResponse(
                                    output_path,
                                    media_type="audio/wav",
                                    filename=f"response_{session_id}.wav",
                                    headers={
                                        "X-Session-ID": session_id,
                                        "X-Processing-Time": str(processing_time),
                                        "X-Pipeline": "stt→llm→tts" if audio_input else "text→llm→tts"
                                    }
                                )
                            else:  # both
                                return JSONResponse(content={
                                    "status": "success",
                                    "session_id": session_id,
                                    "text_response": llm_response,
                                    "audio_available": True,
                                    "processing_time": processing_time
                                })
                
                # Text-only response
                processing_time = time.time() - start_time
                self.cognitive_metrics["total_syntheses"] += 1
                
                return JSONResponse(content={
                    "status": "success",
                    "session_id": session_id,
                    "text_response": llm_response,
                    "processing_time": processing_time
                })
                
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={
                        "status": "error",
                        "error": str(e),
                        "session_id": session_id
                    }
                )
        
        
        @self.app.post("/audiocraft/generate_music",
                       tags=["audiocraft"],
                       summary="Generate Music",
                       description="Create music tracks using AudioCraft AI")
        async def generate_music(
            prompt: str = Form(..., description="Describe the music you want", example="ambient electronic music with soft piano"),
            duration: int = Form(30, description="Duration in seconds", example=30),
            genre: Optional[str] = Form("ambient", description="Music genre", example="ambient"),
            tempo: Optional[str] = Form("moderate", description="Tempo (slow/moderate/fast)", example="moderate"), 
            mood: Optional[str] = Form("calm", description="Mood/atmosphere", example="calm")
        ):
            """🎵 Generate music tracks using local audio synthesis"""
            if not self.audiocraft_available:
                raise HTTPException(status_code=503, detail="AudioCraft service unavailable")
            
            try:
                temp_output = f"/tmp/music_{uuid.uuid4().hex}.wav"
                
                # Use local music generation
                success = self._generate_music_locally(temp_output, prompt, duration, genre, tempo, mood)
                
                if success:
                    self.cognitive_metrics["sonic_imaginations"] += 1
                    
                    return FileResponse(
                        temp_output,
                        media_type="audio/wav",
                        filename="generated_music.wav",
                        headers={
                            "X-Prompt": prompt,
                            "X-Duration": str(duration),
                            "X-Genre": genre,
                            "X-AudioCraft-Status": "local_generation"
                        }
                    )
                else:
                    raise Exception("Local music generation failed")
                    
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": str(e)}
                )
        
        
        @self.app.post("/audiocraft/generate_sound",
                       tags=["audiocraft"],
                       summary="Generate Sound Effects",
                       description="Create sound effects using local audio synthesis")
        async def generate_sound_effect(
            prompt: str = Form(..., description="Describe the sound effect", example="rain falling on leaves"),
            duration: int = Form(5, description="Duration in seconds", example=5),
            intensity: Optional[str] = Form("moderate", description="Sound intensity", example="moderate")
        ):
            """🔊 Generate sound effects using local audio synthesis"""
            if not self.audiocraft_available:
                raise HTTPException(status_code=503, detail="AudioCraft service unavailable")
            
            try:
                temp_output = f"/tmp/sound_{uuid.uuid4().hex}.wav"
                
                # Use local sound generation
                success = self._generate_sound_locally(temp_output, prompt, duration, intensity)
                
                if success:
                    self.cognitive_metrics["sonic_imaginations"] += 1
                    
                    return FileResponse(
                        temp_output,
                        media_type="audio/wav",
                        filename="generated_sound.wav",
                        headers={
                            "X-Prompt": prompt,
                            "X-Duration": str(duration),
                            "X-Intensity": intensity,
                            "X-AudioCraft-Status": "local_generation"
                        }
                    )
                else:
                    raise Exception("Local sound generation failed")
                    
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": str(e)}
                )
        
        
        @self.app.post("/audiocraft/generate_melodyflow",
                       tags=["audiocraft"],
                       summary="Generate MelodyFlow",
                       description="Create high-fidelity music using local MelodyFlow synthesis")
        async def generate_melodyflow(
            prompt: str = Form(..., description="Describe the music", example="classical piano melody with emotional depth"),
            duration: int = Form(45, description="Duration in seconds", example=45),
            fidelity: str = Form("high", description="Audio quality (standard/high)", example="high"),
            mode: str = Form("create", description="Generation mode (create/edit/extend)", example="create"),
            dynamics: str = Form("dynamic", description="Dynamic range", example="dynamic"),
            source_audio: Optional[UploadFile] = File(None, description="Source audio for edit/extend modes")
        ):
            """🎼 Generate high-fidelity music using local MelodyFlow synthesis"""
            if not self.audiocraft_available:
                raise HTTPException(status_code=503, detail="AudioCraft service unavailable")
            
            try:
                temp_output = f"/tmp/melodyflow_{uuid.uuid4().hex}.wav"
                
                # Handle source audio if provided
                source_audio_path = None
                if source_audio and mode in ["edit", "extend"]:
                    source_audio_path = f"/tmp/source_{uuid.uuid4().hex}.wav"
                    with open(source_audio_path, "wb") as buffer:
                        content = await source_audio.read()
                        buffer.write(content)
                
                # Use local MelodyFlow generation
                success = self._generate_melodyflow_locally(
                    temp_output, prompt, duration, fidelity, mode, dynamics, source_audio_path
                )
                
                # Clean up source audio file
                if source_audio_path and os.path.exists(source_audio_path):
                    os.remove(source_audio_path)
                
                if success:
                    self.cognitive_metrics["sonic_imaginations"] += 1
                    
                    return FileResponse(
                        temp_output,
                        media_type="audio/wav",
                        filename="melodyflow_generated.wav",
                        headers={
                            "X-Prompt": prompt,
                            "X-Duration": str(duration),
                            "X-Fidelity": fidelity,
                            "X-Mode": mode,
                            "X-AudioCraft-Status": "local_melodyflow"
                        }
                    )
                else:
                    raise Exception("Local MelodyFlow generation failed")
                    
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": str(e)}
                )
        
        
        @self.app.post("/voice_training/start",
                       response_model=TrainingResponse,
                       tags=["training"],
                       summary="Start Voice Training",
                       description="Begin training a custom voice model using MLX acceleration")
        async def start_voice_training(
            request: Request,
            voice_name: str = Form(..., description="Name for the new voice model", example="my_custom_voice"),
            training_text: str = Form(..., description="Text that matches the audio", example="Hello, this is my voice sample for training"),
            reference_audio: UploadFile = File(..., description="Audio file with clear speech"),
            language: str = Form("en", description="Language code", example="en")
        ):
            """
            👤 **Train a Custom Voice Model**
            
            Create a personalized TTS voice using MLX acceleration on Apple Silicon.
            
            **Requirements**:
            - Clear audio recording (3+ seconds, WAV/MP3 format)
            - Matching text transcription
            - Unique voice name
            
            **Process**:
            1. Audio preprocessing and validation
            2. MLX-accelerated model training (5-15 minutes)
            3. Automatic conversion to Piper format
            4. Integration with existing TTS system
            
            **Result**: Your custom voice will be available in `/voices` and `/tts` endpoints
            """
            client_ip = request.client.host
            start_time = time.time()
            
            log_request("/voice_training/start", client_ip, {
                "voice_name": voice_name,
                "language": language,
                "audio_file": reference_audio.filename,
                "training_text": training_text[:100] + "..." if len(training_text) > 100 else training_text
            })
            
            try:
                if not MLX_VOICE_TRAINING_AVAILABLE:
                    raise HTTPException(status_code=503, detail="MLX Voice Training service unavailable")
                
                # Save reference audio
                temp_audio = f"/tmp/training_audio_{uuid.uuid4().hex}.wav"
                with open(temp_audio, "wb") as buffer:
                    content = await reference_audio.read()
                    buffer.write(content)
                
                # Start real MLX training
                trainer = get_voice_trainer()
                training_id = await trainer.start_training(
                    voice_name=voice_name,
                    training_text=training_text,
                    audio_file_path=temp_audio,
                    language=language
                )
                
                processing_time = time.time() - start_time
                log_response("/voice_training/start", client_ip, "success", processing_time)
                logger.info(f"🎤 Voice training started | Client: {client_ip} | Voice: {voice_name} | Training ID: {training_id}")
                
                return JSONResponse(content={
                    "status": "training_started",
                    "training_id": training_id,
                    "voice_name": voice_name,
                    "estimated_duration": "5-15 minutes",
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                error_msg = str(e)
                processing_time = time.time() - start_time
                log_response("/voice_training/start", client_ip, "error", processing_time, error_msg)
                logger.error(f"❌ Voice training start failed | Client: {client_ip} | Error: {error_msg}")
                
                # Clean up temp file
                if os.path.exists(temp_audio):
                    os.remove(temp_audio)
                
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": error_msg}
                )
        
        
        @self.app.get("/voice_training/status/{training_id}",
                      response_model=TrainingStatusResponse,
                      tags=["training"],
                      summary="Training Status",
                      description="Check the real-time status of voice model training")
        async def get_training_status(training_id: str, request: Request):
            """
            📊 **Get Voice Training Progress**
            
            Track the real-time progress of your custom voice training including:
            - Current training step and percentage complete
            - Estimated time remaining
            - Status (preparing, training, exporting, completed, failed)
            - Error details if training failed
            
            **Status Values**:
            - `preparing`: Audio preprocessing and validation
            - `training`: MLX model training in progress  
            - `exporting`: Converting to Piper format
            - `completed`: Voice ready for use in TTS
            - `failed`: Training failed (see error field)
            """
            client_ip = request.client.host
            
            try:
                if not MLX_VOICE_TRAINING_AVAILABLE:
                    raise HTTPException(status_code=503, detail="MLX Voice Training service unavailable")
                
                trainer = get_voice_trainer()
                training_status = await trainer.get_training_status(training_id)
                
                if not training_status:
                    raise HTTPException(status_code=404, detail="Training ID not found")
                
                # Calculate estimated remaining time
                estimated_remaining = "Unknown"
                if training_status["status"] == "training" and training_status["progress"] > 10:
                    # Rough estimation based on progress
                    progress_pct = training_status["progress"]
                    if progress_pct > 0:
                        remaining_pct = 100 - progress_pct
                        # Assume ~10 seconds total for MLX training
                        estimated_seconds = int((remaining_pct / progress_pct) * 10 * 60)  # Convert to reasonable time
                        if estimated_seconds < 60:
                            estimated_remaining = f"{estimated_seconds} seconds"
                        else:
                            estimated_remaining = f"{estimated_seconds // 60} minutes"
                
                logger.info(f"📊 Training status check | Client: {client_ip} | ID: {training_id} | Status: {training_status['status']} | Progress: {training_status['progress']}%")
                
                return JSONResponse(content={
                    "training_id": training_id,
                    "status": training_status["status"],
                    "progress": training_status["progress"],
                    "estimated_remaining": estimated_remaining,
                    "voice_name": training_status.get("voice_name", ""),
                    "started_at": training_status.get("started_at", ""),
                    "completed_at": training_status.get("completed_at", None),
                    "error": training_status.get("error", None),
                    "timestamp": datetime.now().isoformat()
                })
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"❌ Training status check failed | Client: {client_ip} | ID: {training_id} | Error: {e}")
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": str(e)}
                )
        
        
        @self.app.get("/voice_training/custom_voices",
                      tags=["training"], 
                      summary="List Custom Voices",
                      description="Get all trained custom voices")
        async def list_custom_voices(request: Request):
            """
            👥 **List All Custom Voices**
            
            Get a list of all successfully trained custom voices including:
            - Voice name and language
            - Training completion date
            - Model file paths
            - Training metadata
            
            These voices can be used immediately in `/tts` and `/chat` endpoints.
            """
            client_ip = request.client.host
            
            try:
                if not MLX_VOICE_TRAINING_AVAILABLE:
                    raise HTTPException(status_code=503, detail="MLX Voice Training service unavailable")
                
                trainer = get_voice_trainer()
                custom_voices = await trainer.list_custom_voices()
                
                logger.info(f"📋 Custom voices listed | Client: {client_ip} | Count: {len(custom_voices)}")
                
                return JSONResponse(content={
                    "status": "success",
                    "total_custom_voices": len(custom_voices),
                    "voices": custom_voices,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"❌ List custom voices failed | Client: {client_ip} | Error: {e}")
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": str(e)}
                )
        
        
        @self.app.delete("/voice_training/custom_voices/{voice_name}",
                         tags=["training"],
                         summary="Delete Custom Voice",
                         description="Delete a trained custom voice model")
        async def delete_custom_voice(voice_name: str, request: Request):
            """
            🗑️ **Delete Custom Voice**
            
            Permanently delete a custom voice model including:
            - Model files (.onnx and .onnx.json)
            - Training metadata
            - Voice configuration
            
            **Warning**: This action cannot be undone!
            """
            client_ip = request.client.host
            
            try:
                if not MLX_VOICE_TRAINING_AVAILABLE:
                    raise HTTPException(status_code=503, detail="MLX Voice Training service unavailable")
                
                trainer = get_voice_trainer()
                success = await trainer.delete_custom_voice(voice_name)
                
                if success:
                    logger.info(f"🗑️ Custom voice deleted | Client: {client_ip} | Voice: {voice_name}")
                    return JSONResponse(content={
                        "status": "success",
                        "message": f"Voice '{voice_name}' deleted successfully",
                        "timestamp": datetime.now().isoformat()
                    })
                else:
                    raise HTTPException(status_code=404, detail=f"Voice '{voice_name}' not found")
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"❌ Delete custom voice failed | Client: {client_ip} | Voice: {voice_name} | Error: {e}")
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": str(e)}
                )
        
        
        @self.app.post("/stt",
                       response_model=TranscriptionResponse,
                       tags=["speech"],
                       summary="Speech-to-Text",
                       description="Convert audio to text using Whisper",
                       responses={
                           200: {
                               "description": "Successful transcription",
                               "content": {
                                   "application/json": {
                                       "example": {
                                           "status": "success",
                                           "transcript": "Hello, this is a test transcription",
                                           "model_used": "base",
                                           "timestamp": "2024-01-15T10:30:00"
                                       }
                                   }
                               }
                           }
                       })
        async def speech_to_text(
            audio_file: UploadFile = File(..., description="Audio file to transcribe (WAV, MP3, MP4, etc.)"),
            model: str = Form("base", description="Whisper model to use", example="base")
        ):
            """
            🎤 **Convert Speech to Text**
            
            Upload an audio file and get the transcribed text using OpenAI Whisper.
            
            **Supported formats**: WAV, MP3, MP4, M4A, FLAC, and more
            **Models available**: tiny, base, small, medium, large
            
            The endpoint automatically handles:
            - Audio format detection and conversion
            - Language detection (automatic)
            - Noise reduction and audio processing
            """
            if not self.whisper_available:
                raise HTTPException(status_code=503, detail="Whisper service unavailable")
            
            try:
                temp_audio = f"/tmp/stt_{uuid.uuid4().hex}.wav"
                with open(temp_audio, "wb") as buffer:
                    content = await audio_file.read()
                    buffer.write(content)
                
                # Use MLX-Whisper with fallback
                transcript = await self._transcribe_with_fallback(temp_audio, model)
                os.remove(temp_audio)
                
                self.cognitive_metrics["auditory_transcriptions"] += 1
                
                # Determine which service was actually used
                service_used = "mlx-whisper" if (self.mlx_whisper_available and 
                                               CONFIG_AVAILABLE and should_use_mlx("whisper")) else "whisper"
                
                return JSONResponse(content={
                    "status": "success",
                    "transcript": transcript,
                    "model_used": f"{service_used}-{model}",
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                if os.path.exists(temp_audio):
                    os.remove(temp_audio)
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": str(e)}
                )
        
        
        @self.app.post("/tts",
                       tags=["speech"],
                       summary="Text-to-Speech",
                       description="Convert text to natural speech using Piper TTS",
                       responses={
                           200: {
                               "description": "Generated speech audio file",
                               "content": {
                                   "audio/wav": {
                                       "description": "WAV audio file with synthesized speech"
                                   }
                               }
                           }
                       })
        async def text_to_speech(
            request: Request,
            text: str = Form(..., description="Text to convert to speech", example="Hello, this is a test of text-to-speech synthesis"),
            voice: str = Form(CognitiveConfiguration.DEFAULT_VOICE, description="Voice model to use", example="en_US-amy-medium")
        ):
            """
            🔊 **Convert Text to Speech**
            
            Generate natural-sounding speech from text using Piper TTS.
            
            **Features**:
            - High-quality neural voices
            - Multiple languages and speakers
            - Fast synthesis speed
            - WAV audio output
            
            Use `/voices` endpoint to see all available voice options.
            """
            client_ip = request.client.host
            start_time = time.time()
            
            log_request("/tts", client_ip, {"text": text[:100] + "..." if len(text) > 100 else text, "voice": voice})
            
            if not self.piper_available:
                logger.error(f"❌ TTS ERROR | Client: {client_ip} | Piper service unavailable")
                raise HTTPException(status_code=503, detail="Piper service unavailable")
            
            try:
                voice_model_path = self._find_voice_model(voice)
                voice_config_path = self._find_voice_config(voice)
                
                if not voice_model_path or not voice_config_path:
                    raise Exception(f"Voice files not found for: {voice}")
                
                output_path = f"/tmp/tts_{uuid.uuid4().hex}.wav"
                
                # Try Python piper module first (if available)
                try:
                    import piper
                    import wave
                    
                    tts_model = piper.PiperVoice.load(voice_model_path, config_path=voice_config_path)
                    
                    # Generate audio using stream method
                    audio_bytes = b''
                    for audio_chunk in tts_model.synthesize_stream_raw(text):
                        audio_bytes += audio_chunk
                    
                    # Write WAV file
                    with wave.open(output_path, 'wb') as wav_file:
                        wav_file.setnchannels(1)  # mono
                        wav_file.setsampwidth(2)  # 16-bit
                        wav_file.setframerate(tts_model.config.sample_rate)
                        wav_file.writeframes(audio_bytes)
                    
                    print(f"✅ Used Piper Python module for TTS")
                    
                except (ImportError, AttributeError) as e:
                    # Fallback to Piper binary (more reliable on Mac)
                    print(f"🔄 Piper Python module failed ({e}), using binary")
                    
                    piper_binary = CognitiveConfiguration.PIPER_BINARY
                    if not piper_binary:
                        # Try to detect it again
                        piper_binary = CognitiveConfiguration.detect_piper_binary()
                        if not piper_binary:
                            raise Exception("Piper binary not found")
                    
                    # Use subprocess to call Piper binary
                    result = subprocess.run(
                        [piper_binary, 
                         "--model", voice_model_path,
                         "--config", voice_config_path,
                         "--output_file", output_path],
                        input=text,
                        text=True,
                        capture_output=True,
                        timeout=30
                    )
                    
                    if result.returncode != 0:
                        error_msg = result.stderr or f"Piper binary failed with return code {result.returncode}"
                        raise Exception(error_msg)
                    
                    print(f"✅ Used Piper binary for TTS")
                
                # Verify output file was created
                if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                    raise Exception("TTS output file was not created or is empty")
                
                self.cognitive_metrics["vocal_expressions"] += 1
                
                processing_time = time.time() - start_time
                log_response("/tts", client_ip, "success", processing_time)
                logger.info(f"🔊 TTS SUCCESS | Client: {client_ip} | Voice: {voice} | Text length: {len(text)} | Processing time: {processing_time:.2f}s")
                
                return FileResponse(
                    output_path,
                    media_type="audio/wav",
                    filename="speech.wav",
                    headers={
                        "X-Voice-Used": voice,
                        "X-Text-Length": str(len(text))
                    }
                )
                
            except Exception as e:
                error_msg = str(e)
                processing_time = time.time() - start_time
                log_response("/tts", client_ip, "error", processing_time, error_msg)
                logger.error(f"❌ TTS ERROR | Client: {client_ip} | Error: {error_msg} | Processing time: {processing_time:.2f}s")
                
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": error_msg}
                )
        
        
        @self.app.post("/llm",
                       response_model=LLMResponse,
                       tags=["llm"],
                       summary="LLM Chat",
                       description="Direct chat with language models via Ollama",
                       responses={
                           200: {
                               "description": "LLM response",
                               "content": {
                                   "application/json": {
                                       "example": {
                                           "status": "success",
                                           "response": "I'm doing well, thank you for asking! How can I assist you today?",
                                           "model_used": "tinydolphin:1.1b",
                                           "timestamp": "2024-01-15T10:30:00"
                                       }
                                   }
                               }
                           }
                       })
        async def llm_chat(
            request: Request,
            prompt: str = Form(..., description="Your message/question for the AI", example="What is the meaning of life?"),
            model: str = Form(CognitiveConfiguration.DEFAULT_MODEL, description="Ollama model to use", example="tinydolphin:1.1b"),
            system_prompt: Optional[str] = Form("You are a helpful AI assistant", description="System prompt to set AI behavior", example="You are a wise philosopher"),
            temperature: float = Form(0.7, description="Creativity level (0.0-1.0)", example=0.7, ge=0.0, le=1.0)
        ):
            """
            🤖 **Direct LLM Chat**
            
            Chat directly with language models hosted on Ollama.
            
            **Parameters**:
            - **Temperature**: Controls randomness (0.0 = deterministic, 1.0 = very creative)
            - **System Prompt**: Sets the AI's personality and behavior
            - **Model**: Choose from available Ollama models
            
            Use `/models` endpoint to see all available models.
            
            **Perfect for**:
            - Text-only conversations
            - Creative writing and brainstorming
            - Question answering and analysis
            - Code generation and debugging
            """
            client_ip = request.client.host
            start_time = time.time()
            
            log_request("/llm", client_ip, {"prompt": prompt[:100] + "..." if len(prompt) > 100 else prompt, "model": model, "temperature": temperature})
            
            if not self.ollama_available:
                logger.error(f"❌ LLM ERROR | Client: {client_ip} | Ollama service unavailable")
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
            
            try:
                # Use MLX-LM with fallback to Ollama
                llm_response = await self._generate_with_fallback(prompt, model, system_prompt)
                self.cognitive_metrics["linguistic_calls"] += 1
                
                processing_time = time.time() - start_time
                log_response("/llm", client_ip, "success", processing_time)
                
                # Determine which service was actually used
                service_used = "mlx-lm" if (self.mlx_lm_available and 
                                           CONFIG_AVAILABLE and should_use_mlx("lm")) else "ollama"
                
                logger.info(f"🤖 LLM SUCCESS | Client: {client_ip} | Service: {service_used} | Model: {model} | Response length: {len(llm_response)} | Processing time: {processing_time:.2f}s")
                
                return JSONResponse(content={
                    "status": "success",
                    "response": llm_response,
                    "model_used": f"{service_used}-{model}",
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                error_msg = str(e)
                processing_time = time.time() - start_time
                log_response("/llm", client_ip, "error", processing_time, error_msg)
                logger.error(f"❌ LLM ERROR | Client: {client_ip} | Error: {error_msg} | Processing time: {processing_time:.2f}s")
                
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": error_msg}
                )
        
        
        @self.app.get("/api/models",
                      response_model=ModelsResponse,
                      tags=["status"],
                      summary="List Available Models",
                      description="Get all available MLX and Ollama models with backend information")
        async def list_models():
            """
            List all available models with clear backend indication:
            - 🔥 MLX models (Apple Silicon accelerated) - prioritized
            - 🔄 Ollama models (fallback) - clearly marked as fallback
            """
            formatted_models = []
            
            # Add MLX models first - these are preferred (show even if MLX not available for download)
            # This allows users to see what's available and download them
            mlx_section_enabled = True  # Always show MLX section
            if mlx_section_enabled:
                mlx_models_added = False
                
                # Add configured MLX models if available
                if CONFIG_AVAILABLE and MLX_LM_MODELS:
                    for model_key, model_name in MLX_LM_MODELS.items():
                        # Check if model is actually downloaded
                        model_status = "🔥 Ready (MLX)" if model_key == "default" else "🔥 MLX Available"
                        formatted_models.append({
                            "name": model_key,
                            "full_name": model_name,
                            "size": 0,
                            "modified_at": "",
                            "digest": f"mlx-{model_key}",
                            "family": model_status,
                            "backend": "MLX",
                            "accelerated": True,
                            "recommended": True
                        })
                        mlx_models_added = True
                
                # ALWAYS add popular MLX models as downloadable options
                        default_mlx_models = [
            {"name": "deepseek-r1-0528", "path": "lmstudio-community/DeepSeek-R1-0528-Qwen3-8B-MLX-4bit", "desc": "Latest DeepSeek-R1 8B (0528)"},
            {"name": "llama-3.2-1b", "path": "mlx-community/Llama-3.2-1B-Instruct-4bit", "desc": "Fast 1B model"},
            {"name": "llama-3.2-3b", "path": "mlx-community/Llama-3.2-3B-Instruct-4bit", "desc": "Balanced 3B model"},
            {"name": "qwen-2.5-1.5b", "path": "mlx-community/Qwen2.5-1.5B-Instruct-4bit", "desc": "Efficient Qwen model"},
            {"name": "codellama-7b", "path": "mlx-community/CodeLlama-7b-Instruct-hf-4bit", "desc": "Code generation model"}
        ]
                
                for model_info in default_mlx_models:
                    status_text = "🔥 Ready" if mlx_models_added else "🔥 Download to Use"
                    formatted_models.append({
                        "name": f"{model_info['name']} (available)",
                        "full_name": f"{model_info['path']} - {model_info['desc']}",
                        "size": 0,
                        "modified_at": "",
                        "digest": "available-for-download",
                        "family": status_text,
                        "backend": "MLX",
                        "accelerated": True,
                        "recommended": True
                    })
                    mlx_models_added = True
            
            # Add Ollama models ONLY if fallback is explicitly enabled  
            fallback_enabled = getattr(self, 'fallback_to_ollama', False) if hasattr(self, 'fallback_to_ollama') else False
            strict_mlx = getattr(self, 'strict_mlx_mode', False) if hasattr(self, 'strict_mlx_mode') else False
            
            if self.ollama_available and fallback_enabled and not strict_mlx:
                try:
                    response = requests.get(f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/tags", timeout=10)
                    response.raise_for_status()
                    
                    models_data = response.json()
                    models = models_data.get("models", [])
                    
                    for model in models:
                        formatted_models.append({
                            "name": model.get("name", ""),
                            "full_name": model.get("name", ""),
                            "size": model.get("size", 0),
                            "modified_at": model.get("modified_at", ""),
                            "digest": model.get("digest", "")[:12] + "..." if model.get("digest") else "",
                            "family": f"🔄 {model.get('details', {}).get('family', 'ollama')} (Fallback - Disabled by Default)",
                            "backend": "Ollama",
                            "accelerated": False,
                            "recommended": False
                        })
                        
                except Exception as e:
                    log_event(f"❌ Failed to fetch Ollama models: {e}")
            
            # ⚠️ STRICT MLX MODE - Return error if no MLX models available
            if strict_mlx and not self.mlx_lm_available:
                return JSONResponse(
                    status_code=503,
                    content={
                        "status": "error",
                        "error": "MLX acceleration required but not available",
                        "message": "System configured for STRICT_MLX_MODE. MLX must be available.",
                        "mlx_required": True,
                        "strict_mode": True,
                        "timestamp": datetime.now().isoformat()
                    }
                )
            
            # Determine default model - ALWAYS prefer MLX
            default_model = "default" if self.mlx_lm_available and CONFIG_AVAILABLE else CognitiveConfiguration.DEFAULT_MODEL
            
            return JSONResponse(content={
                "status": "success", 
                "total_models": len(formatted_models),
                "default_model": default_model,
                "mlx_available": self.mlx_lm_available,
                "ollama_available": self.ollama_available,
                "models": formatted_models,
                "timestamp": datetime.now().isoformat()
            })
        
        
        @self.app.get("/api/voices",
                      response_model=VoicesResponse,
                      tags=["status"],
                      summary="List Available Voices",
                      description="Get all available Piper TTS voices with detailed information")
        async def list_voices():
            """
            List all available Piper voices on the server including:
            - Voice names, languages, and speakers
            - Quality levels and file sizes
            - Model and configuration file paths
            - Configuration availability status
            """
            if not self.piper_available:
                raise HTTPException(status_code=503, detail="Piper service unavailable")
            
            try:
                voices_dir = Path(CognitiveConfiguration.VOICES_DIR)
                available_voices = []
                
                if voices_dir.exists():
                    # Find all .onnx model files
                    voice_files = []
                    
                    # Search in root voices directory
                    voice_files.extend(voices_dir.glob("*.onnx"))
                    
                    # Search in subdirectories
                    for subdir in voices_dir.iterdir():
                        if subdir.is_dir():
                            voice_files.extend(subdir.glob("*.onnx"))
                    
                    for voice_file in voice_files:
                        voice_name = voice_file.stem
                        
                        # Look for corresponding config file
                        config_file = voice_file.with_suffix(".onnx.json")
                        config_exists = config_file.exists()
                        
                        # Extract voice info from filename/path
                        path_parts = voice_file.parts
                        language = "unknown"
                        speaker = "unknown"
                        quality = "unknown"
                        
                        # Try to parse voice name (e.g., en_US-amy-medium)
                        if "-" in voice_name:
                            parts = voice_name.split("-")
                            if len(parts) >= 3:
                                language = parts[0]
                                speaker = parts[1]
                                quality = parts[2]
                            elif len(parts) == 2:
                                language = parts[0]
                                speaker = parts[1]
                        
                        voice_info = {
                            "name": voice_name,
                            "language": language,
                            "speaker": speaker,
                            "quality": quality,
                            "model_path": str(voice_file),
                            "config_available": config_exists,
                            "file_size": voice_file.stat().st_size if voice_file.exists() else 0
                        }
                        
                        available_voices.append(voice_info)
                
                # Sort by language, then speaker
                available_voices.sort(key=lambda x: (x["language"], x["speaker"]))
                
                return JSONResponse(content={
                    "status": "success",
                    "total_voices": len(available_voices),
                    "default_voice": CognitiveConfiguration.DEFAULT_VOICE,
                    "voices_directory": str(voices_dir),
                    "voices": available_voices,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": str(e)}
                )

        
        # ============================================================
        # DOWNLOAD STATUS TRACKING
        # ============================================================
        
        # Global download tracking
        self.active_downloads = {}
        
        @self.app.get("/download/status",
                      tags=["download"],
                      summary="Get Download Status",
                      description="Get status of all active downloads (models and voices)")
        async def get_download_status():
            """
            📊 **Download Status Tracker**
            
            Returns real-time status of all active downloads:
            - Model downloads from Hugging Face
            - Voice downloads from repositories  
            - Progress percentages and completion status
            """
            try:
                downloads = []
                
                # Convert active downloads to list format
                for download_id, info in self.active_downloads.items():
                    downloads.append({
                        "id": download_id,
                        "type": info.get("type", "unknown"),
                        "name": info.get("name", "unknown"),
                        "status": info.get("status", "downloading"),
                        "progress": info.get("progress", 0),
                        "error": info.get("error", None),
                        "started_at": info.get("started_at", ""),
                        "estimated_completion": info.get("estimated_completion", "")
                    })
                
                return JSONResponse(content={
                    "status": "success",
                    "total_downloads": len(downloads),
                    "downloads": downloads,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={
                        "status": "error", 
                        "error": f"Failed to get download status: {str(e)}",
                        "timestamp": datetime.now().isoformat()
                    }
                )
        
        # ============================================================
        # VOICE MODEL MANAGEMENT ENDPOINTS
        # ============================================================
        
        @self.app.get("/api/voices/search",
                      tags=["voice"],
                      summary="Search Voice Models",
                      description="Search for available voice models from Hugging Face repositories")
        async def search_voice_models(
            query: str = Query(..., description="Search query for voices", example="english"),
            limit: int = Query(20, description="Maximum number of results", example=20),
            voice_type: str = Query("both", description="Voice model type: piper, mlx, or both", example="both")
        ):
            """
            🔍 **Dynamic Voice Model Search**
            
            Search for voice models from:
            - Piper TTS models (ONNX format - for fallback)  
            - MLX-optimized voice models (native Apple Silicon)
            - Custom trained models
            
            Dynamically searches Hugging Face repositories for real-time results.
            """
            try:
                import requests
                import json
                
                all_voices = []
                
                # Search MLX voice models (prioritized for Apple Silicon)
                if voice_type in ["mlx", "both"]:
                    try:
                        mlx_response = requests.get(
                            "https://huggingface.co/api/models",
                            params={
                                "search": f"mlx voice {query}",
                                "limit": limit // 2 if voice_type == "both" else limit,
                                "filter": "library:mlx"
                            },
                            timeout=10
                        )
                        
                        if mlx_response.status_code == 200:
                            mlx_models = mlx_response.json()
                            for model in mlx_models:
                                # Parse MLX voice model info
                                model_name = model.get("id", "").split("/")[-1]
                                if "voice" in model_name.lower() or "tts" in model_name.lower():
                                    all_voices.append({
                                        "name": model_name,
                                        "id": model.get("id"),
                                        "language": self._extract_language_from_model(model_name),
                                        "speaker": self._extract_speaker_from_model(model_name),
                                        "quality": "high",
                                        "gender": self._extract_gender_from_model(model_name),
                                        "description": f"MLX-optimized voice model for Apple Silicon",
                                        "model_type": "mlx",
                                        "size_mb": model.get("safetensors", {}).get("total", 0) // (1024 * 1024),
                                        "downloads": model.get("downloads", 0),
                                        "recommended": True,
                                        "accelerated": True,
                                        "download_url": f"https://huggingface.co/{model.get('id')}/resolve/main/",
                                        "repository": model.get("id")
                                    })
                    except Exception as e:
                        log_event(f"MLX voice search failed: {str(e)}")
                
                # Search Piper TTS models (fallback)
                if voice_type in ["piper", "both"]:
                    try:
                        # Search Hugging Face API for piper voices
                        piper_response = requests.get(
                            "https://huggingface.co/api/repos/rhasspy/piper-voices/tree/main",
                            timeout=10
                        )
                        
                        if piper_response.status_code == 200:
                            repo_contents = piper_response.json()
                            piper_voices = self._parse_piper_voices_from_repo(repo_contents, query, limit)
                            all_voices.extend(piper_voices)
                            
                    except Exception as e:
                        log_event(f"Piper voice search failed: {str(e)}")
                        # Fallback to curated list if API fails
                        fallback_voices = self._get_fallback_piper_voices(query)
                        all_voices.extend(fallback_voices)
                
                # Filter and sort results
                query_lower = query.lower()
                filtered_voices = []
                for voice in all_voices:
                    if (query_lower in voice["name"].lower() or 
                        query_lower in voice["language"].lower() or
                        query_lower in voice["speaker"].lower() or
                        query_lower in voice["description"].lower()):
                        filtered_voices.append(voice)
                
                # Sort by: MLX models first, then by downloads, then by name
                filtered_voices.sort(key=lambda x: (
                    0 if x.get("model_type") == "mlx" else 1,
                    -x.get("downloads", 0),
                    x.get("name", "")
                ))
                
                # Limit results
                filtered_voices = filtered_voices[:limit]
                
                return JSONResponse(content={
                    "status": "success",
                    "query": query,
                    "voice_type": voice_type,
                    "total_found": len(filtered_voices),
                    "mlx_models": len([v for v in filtered_voices if v.get("model_type") == "mlx"]),
                    "piper_models": len([v for v in filtered_voices if v.get("model_type") == "piper"]),
                    "voices": filtered_voices,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={
                        "status": "error",
                        "error": f"Voice search failed: {str(e)}",
                        "timestamp": datetime.now().isoformat()
                    }
                )
        
        @self.app.post("/api/voices/download",
                       tags=["voice"],
                       summary="Download Voice Model",
                       description="Download a Piper TTS voice model to local storage")
        async def download_voice_model(
            voice_name: str = Form(..., description="Voice model name", example="en_US-amy-medium"),
            download_url: str = Form(..., description="Download URL for the voice model"),
            config_url: str = Form(..., description="Configuration URL for the voice model")
        ):
            """
            📥 **Download Voice Model**
            
            Download a Piper TTS voice model and its configuration to local storage.
            """
            try:
                log_event(f"📥 Starting voice download: {voice_name}")
                
                # Ensure voices directory exists
                voices_dir = CognitiveConfiguration.VOICES_DIR
                os.makedirs(voices_dir, exist_ok=True)
                
                # Download voice model file
                voice_path = os.path.join(voices_dir, f"{voice_name}.onnx")
                config_path = os.path.join(voices_dir, f"{voice_name}.onnx.json")
                
                def download_voice():
                    download_id = f"voice_{voice_name}_{int(time.time())}"
                    
                    try:
                        # Track download start
                        self.active_downloads[download_id] = {
                            "type": "Voice",
                            "name": voice_name,
                            "status": "downloading",
                            "progress": 0,
                            "started_at": datetime.now().isoformat()
                        }
                        
                        # Download voice model with progress tracking
                        log_event(f"📥 Downloading voice model: {voice_name}")
                        
                        import requests
                        response = requests.get(download_url, stream=True)
                        response.raise_for_status()
                        
                        total_size = int(response.headers.get('content-length', 0))
                        downloaded = 0
                        
                        with open(voice_path, 'wb') as f:
                            for chunk in response.iter_content(chunk_size=8192):
                                f.write(chunk)
                                downloaded += len(chunk)
                                
                                # Update progress
                                if total_size > 0:
                                    progress = int((downloaded / total_size) * 80)  # Reserve 20% for config
                                    self.active_downloads[download_id]["progress"] = progress
                        
                        # Download configuration
                        self.active_downloads[download_id]["status"] = "downloading_config"
                        self.active_downloads[download_id]["progress"] = 80
                        
                        log_event(f"📥 Downloading voice config: {voice_name}")
                        config_response = requests.get(config_url)
                        config_response.raise_for_status()
                        
                        with open(config_path, 'wb') as f:
                            f.write(config_response.content)
                        
                        # Mark as completed
                        self.active_downloads[download_id]["status"] = "completed"
                        self.active_downloads[download_id]["progress"] = 100
                        
                        log_event(f"✅ Voice download completed: {voice_name}")
                        
                        # Clean up tracking after delay
                        import time
                        time.sleep(30)
                        if download_id in self.active_downloads:
                            del self.active_downloads[download_id]
                        
                    except Exception as e:
                        # Mark as failed
                        if download_id in self.active_downloads:
                            self.active_downloads[download_id]["status"] = "failed"
                            self.active_downloads[download_id]["error"] = str(e)
                        
                        log_event(f"❌ Voice download failed: {voice_name} - {str(e)}")
                        raise
                
                # Run download in background
                import threading
                download_thread = threading.Thread(target=download_voice)
                download_thread.start()
                
                return JSONResponse(content={
                    "status": "success",
                    "message": f"Voice {voice_name} download started",
                    "voice_name": voice_name,
                    "download_path": voice_path,
                    "config_path": config_path,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={
                        "status": "error",
                        "error": f"Voice download failed: {str(e)}",
                        "timestamp": datetime.now().isoformat()
                    }
                )
        
        @self.app.delete("/api/voices/{voice_name}",
                        tags=["voice"],
                        summary="Remove Voice Model",
                        description="Remove a downloaded voice model from local storage")
        async def remove_voice_model(voice_name: str):
            """
            🗑️ **Remove Voice Model**
            
            Remove a downloaded voice model and its configuration from local storage.
            """
            try:
                voices_dir = CognitiveConfiguration.VOICES_DIR
                voice_path = os.path.join(voices_dir, f"{voice_name}.onnx")
                config_path = os.path.join(voices_dir, f"{voice_name}.onnx.json")
                
                removed_files = []
                
                # Remove voice model file
                if os.path.exists(voice_path):
                    os.remove(voice_path)
                    removed_files.append(voice_path)
                
                # Remove configuration file
                if os.path.exists(config_path):
                    os.remove(config_path)
                    removed_files.append(config_path)
                
                if removed_files:
                    log_event(f"🗑️ Removed voice model: {voice_name}")
                    return JSONResponse(content={
                        "status": "success",
                        "message": f"Voice model {voice_name} removed successfully",
                        "removed_files": removed_files,
                        "timestamp": datetime.now().isoformat()
                    })
                else:
                    return JSONResponse(
                        status_code=404,
                        content={
                            "status": "error",
                            "error": f"Voice model {voice_name} not found",
                            "timestamp": datetime.now().isoformat()
                        }
                    )
                    
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={
                        "status": "error",
                        "error": f"Failed to remove voice model: {str(e)}",
                        "timestamp": datetime.now().isoformat()
                    }
                )
        
        # ============================================================
        # MLX MODEL MANAGEMENT ENDPOINTS
        # ============================================================
        
        @self.app.get("/api/models/search",
                      tags=["mlx"],
                      summary="Search MLX Models",
                      description="Search for MLX-compatible models in Hugging Face repository")
        async def search_mlx_models(
            query: str = Query(..., description="Search query for models", example="llama"),
            limit: int = Query(10, description="Maximum number of results", example=10)
        ):
            """
            🔍 **Search for MLX Models**
            
            Search Hugging Face for MLX-compatible models that can be downloaded and used
            with Apple Silicon acceleration.
            """
            try:
                from huggingface_hub import search_models
                
                # Search for MLX models specifically
                models = search_models(
                    search=query,
                    filter=["mlx"],
                    limit=limit,
                    sort="downloads",
                    direction=-1
                )
                
                results = []
                for model in models:
                    # Focus on mlx-community models which are known to work well
                    if "mlx-community" in model.id or "mlx" in model.id.lower():
                        results.append({
                            "id": model.id,
                            "name": model.id.split("/")[-1] if "/" in model.id else model.id,
                            "author": model.id.split("/")[0] if "/" in model.id else "unknown",
                            "downloads": getattr(model, 'downloads', 0),
                            "tags": getattr(model, 'tags', []),
                            "description": f"MLX-optimized model: {model.id}",
                            "is_mlx": True,
                            "recommended": "mlx-community" in model.id
                        })
                
                return JSONResponse(content={
                    "status": "success",
                    "query": query,
                    "total_results": len(results),
                    "models": results,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": f"Search failed: {str(e)}"}
                )
        
        
        @self.app.get("/api/models/test-download/{model_type}",
                      tags=["mlx"],
                      summary="Test Download MLX Model",
                      description="Test download with predefined model types")
        async def test_download_mlx_model(model_type: str):
            """Quick test download for debugging"""
            model_map = {
                "llama-1b": "mlx-community/Llama-3.2-1B-Instruct-4bit",
                "llama-3b": "mlx-community/Llama-3.2-3B-Instruct-4bit", 
                "qwen": "mlx-community/Qwen2.5-1.5B-Instruct-4bit"
            }
            
            if model_type not in model_map:
                return JSONResponse(
                    status_code=400,
                    content={"status": "error", "error": f"Unknown model type: {model_type}. Available: {list(model_map.keys())}"}
                )
            
            model_id = model_map[model_type]
            local_name = model_type
            
            # Call the main download logic directly
            try:
                log_event(f"🔍 Test download request - model_id: '{model_id}', local_name: '{local_name}'")
                
                def download_model():
                    download_id = f"model_{local_name}_{int(time.time())}"
                    
                    try:
                        # Track download start
                        self.active_downloads[download_id] = {
                            "type": "Model",
                            "name": local_name,
                            "status": "downloading",
                            "progress": 0,
                            "started_at": datetime.now().isoformat()
                        }
                        
                        # Update status throughout download
                        self.active_downloads[download_id]["status"] = "loading_model"
                        self.active_downloads[download_id]["progress"] = 25
                        
                        # Use mlx_lm to load the model (this will download it automatically)
                        from mlx_lm import load
                        model, tokenizer = load(model_id)
                        
                        self.active_downloads[download_id]["progress"] = 75
                        
                        # Update the MLX_LM_MODELS configuration
                        if CONFIG_AVAILABLE:
                            MLX_LM_MODELS[local_name] = model_id
                            
                        # Mark as completed
                        self.active_downloads[download_id]["status"] = "completed"
                        self.active_downloads[download_id]["progress"] = 100
                        
                        log_event(f"✅ Model {model_id} downloaded and configured as '{local_name}'")
                        
                        # Clean up tracking after delay
                        import time
                        time.sleep(30)
                        if download_id in self.active_downloads:
                            del self.active_downloads[download_id]
                        
                        return True
                    except Exception as e:
                        # Mark as failed
                        if download_id in self.active_downloads:
                            self.active_downloads[download_id]["status"] = "failed"
                            self.active_downloads[download_id]["error"] = str(e)
                        
                        log_event(f"❌ Download failed: {e}")
                        return False
                
                # Start download in background thread
                import threading
                download_thread = threading.Thread(target=download_model)
                download_thread.daemon = True
                download_thread.start()
                
                return JSONResponse(content={
                    "status": "success",
                    "message": f"Test download of {model_id} started in background",
                    "local_name": local_name,
                    "model_id": model_id,
                    "download_status": "started",
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": f"Test download error: {str(e)}"}
                )

        @self.app.post("/api/models/download",
                       tags=["mlx"],
                       summary="Download MLX Model",
                       description="Download an MLX model from Hugging Face to local storage")
        async def download_mlx_model(
            model_id: str = Form(..., description="Hugging Face model ID", example="mlx-community/Llama-3.2-1B-Instruct-4bit"),
            local_name: str = Form(..., description="Local name for the model", example="llama-1b")
        ):
            """
            📥 **Download MLX Model**
            
            Download an MLX-compatible model from Hugging Face and configure it
            for use with the Silicon Server.
            """
            try:
                import subprocess
                import sys
                
                # Debug logging
                log_event(f"🔍 Download request received - model_id: '{model_id}', local_name: '{local_name}'")
                
                # Very permissive validation - just check it looks like a HF model path
                if "/" not in model_id:
                    log_event(f"❌ Validation failed: model_id '{model_id}' missing '/' character")
                    return JSONResponse(
                        status_code=400,
                        content={"status": "error", "error": "Please use full Hugging Face model path (e.g., 'mlx-community/model-name')"}
                    )
                
                # Log warning if not obviously MLX-compatible but proceed anyway
                mlx_sources = ["mlx-community", "mlx", "apple"]
                is_mlx_compatible = any(source in model_id.lower() for source in mlx_sources)
                
                if not is_mlx_compatible:
                    log_event(f"⚠️  Non-MLX model requested: {model_id} - proceeding anyway (user choice)")
                
                log_event(f"📥 Starting download of {model_id} as '{local_name}'")
                
                # Create a background task to download the model
                def download_model():
                    import time
                    download_id = f"model_{local_name}_{int(time.time())}"
                    
                    try:
                        # Track download start
                        self.active_downloads[download_id] = {
                            "type": "Model",
                            "name": local_name,
                            "status": "downloading",
                            "progress": 0,
                            "started_at": datetime.now().isoformat()
                        }
                        
                        # Update status throughout download
                        self.active_downloads[download_id]["status"] = "loading_model"
                        self.active_downloads[download_id]["progress"] = 25
                        
                        # Use mlx_lm to load the model (this will download it automatically)
                        from mlx_lm import load
                        model, tokenizer = load(model_id)
                        
                        self.active_downloads[download_id]["progress"] = 75
                        
                        # Update the MLX_LM_MODELS configuration
                        if CONFIG_AVAILABLE:
                            MLX_LM_MODELS[local_name] = model_id
                            
                        # Mark as completed
                        self.active_downloads[download_id]["status"] = "completed"
                        self.active_downloads[download_id]["progress"] = 100
                        
                        log_event(f"✅ Model {model_id} downloaded and configured as '{local_name}'")
                        
                        # Clean up tracking after delay
                        import time
                        time.sleep(30)
                        if download_id in self.active_downloads:
                            del self.active_downloads[download_id]
                        
                        return True
                    except Exception as e:
                        # Mark as failed
                        if download_id in self.active_downloads:
                            self.active_downloads[download_id]["status"] = "failed"
                            self.active_downloads[download_id]["error"] = str(e)
                        
                        log_event(f"❌ Download failed: {e}")
                        return False
                
                # Start download in background thread
                import threading
                download_thread = threading.Thread(target=download_model)
                download_thread.daemon = True
                download_thread.start()
                
                return JSONResponse(content={
                    "status": "success",
                    "message": f"Model {model_id} download started in background",
                    "local_name": local_name,
                    "model_id": model_id,
                    "download_status": "started",
                    "timestamp": datetime.now().isoformat()
                })
                    
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": f"Download error: {str(e)}"}
                )
        
        
        @self.app.delete("/api/models/mlx/{model_name}",
                        tags=["mlx"],
                        summary="Remove MLX Model",
                        description="Remove an MLX model from local configuration")
        async def remove_mlx_model(model_name: str):
            """
            🗑️ **Remove MLX Model**
            
            Remove an MLX model from the local configuration (does not delete files,
            just removes from available models list).
            """
            try:
                if CONFIG_AVAILABLE and model_name in MLX_LM_MODELS:
                    model_id = MLX_LM_MODELS[model_name]
                    del MLX_LM_MODELS[model_name]
                    
                    log_event(f"🗑️ Removed model '{model_name}' ({model_id}) from configuration")
                    
                    return JSONResponse(content={
                        "status": "success",
                        "message": f"Model '{model_name}' removed from configuration",
                        "model_name": model_name,
                        "timestamp": datetime.now().isoformat()
                    })
                else:
                    return JSONResponse(
                        status_code=404,
                        content={"status": "error", "error": f"Model '{model_name}' not found"}
                    )
                    
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={"status": "error", "error": f"Removal error: {str(e)}"}
                )
        
        
        # ============================================================
        # OLLAMA API COMPATIBILITY ENDPOINTS
        # ============================================================
        
        @self.app.get("/api/tags",
                      tags=["ollama-compatibility"],
                      summary="Ollama: List Models",
                      description="Ollama-compatible endpoint to list available models")
        async def ollama_list_models():
            """🔄 **Ollama Compatibility**: List models in Ollama format"""
            if not self.ollama_available:
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
            
            try:
                response = requests.get(f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/tags", timeout=10)
                response.raise_for_status()
                return JSONResponse(content=response.json())
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": str(e)})
        
        
        @self.app.post("/api/generate",
                       tags=["ollama-compatibility"],
                       summary="Ollama: Generate Completion",
                       description="Ollama-compatible endpoint for text generation")
        async def ollama_generate(request: dict):
            """🔄 **Ollama Compatibility**: Generate text completion"""
            if not self.ollama_available:
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
            
            try:
                response = requests.post(
                    f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/generate",
                    json=request,
                    timeout=120
                )
                response.raise_for_status()
                
                self.cognitive_metrics["linguistic_calls"] += 1
                
                if request.get("stream", False):
                    return response.iter_content(chunk_size=8192)
                else:
                    return JSONResponse(content=response.json())
                    
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": str(e)})
        
        
        @self.app.post("/api/chat",
                       tags=["ollama-compatibility"],
                       summary="Ollama: Chat Completion",
                       description="Ollama-compatible endpoint for chat completions")
        async def ollama_chat(request: dict):
            """🔄 **Ollama Compatibility**: Chat completion in Ollama format"""
            if not self.ollama_available:
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
            
            try:
                response = requests.post(
                    f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/chat",
                    json=request,
                    timeout=120
                )
                response.raise_for_status()
                
                self.cognitive_metrics["linguistic_calls"] += 1
                
                if request.get("stream", False):
                    return response.iter_content(chunk_size=8192)
                else:
                    return JSONResponse(content=response.json())
                    
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": str(e)})
        
        
        @self.app.post("/api/embeddings",
                       tags=["ollama-compatibility"],
                       summary="Ollama: Generate Embeddings",
                       description="Ollama-compatible endpoint for embeddings")
        async def ollama_embeddings(request: dict):
            """🔄 **Ollama Compatibility**: Generate embeddings"""
            if not self.ollama_available:
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
            
            try:
                response = requests.post(
                    f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/embeddings",
                    json=request,
                    timeout=60
                )
                response.raise_for_status()
                return JSONResponse(content=response.json())
                
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": str(e)})
        
        
        @self.app.get("/api/ps",
                      tags=["ollama-compatibility"],
                      summary="Ollama: List Running Models",
                      description="Ollama-compatible endpoint to list running models")
        async def ollama_list_running():
            """🔄 **Ollama Compatibility**: List currently running models"""
            if not self.ollama_available:
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
            
            try:
                response = requests.get(f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/ps", timeout=10)
                response.raise_for_status()
                return JSONResponse(content=response.json())
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": str(e)})
        
        
        @self.app.post("/api/show",
                       tags=["ollama-compatibility"],
                       summary="Ollama: Show Model Info",
                       description="Ollama-compatible endpoint to show model information")
        async def ollama_show_model(request: dict):
            """🔄 **Ollama Compatibility**: Show detailed model information"""
            if not self.ollama_available:
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
            
            try:
                response = requests.post(
                    f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/show",
                    json=request,
                    timeout=30
                )
                response.raise_for_status()
                return JSONResponse(content=response.json())
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": str(e)})


        # ============================================================
        # OPENAI API COMPATIBILITY ENDPOINTS
        # ============================================================
        
        @self.app.get("/v1/models",
                      tags=["openai-compatibility"],
                      summary="OpenAI: List Models",
                      description="OpenAI-compatible endpoint to list available models")
        async def openai_list_models():
            """🔄 **OpenAI Compatibility**: List models in OpenAI format"""
            if not self.ollama_available:
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
            
            try:
                response = requests.get(f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/tags", timeout=10)
                response.raise_for_status()
                
                ollama_models = response.json().get("models", [])
                
                # Convert Ollama format to OpenAI format
                openai_models = []
                for model in ollama_models:
                    openai_models.append({
                        "id": model.get("name", ""),
                        "object": "model",
                        "created": int(time.time()),  # Use current timestamp for compatibility
                        "owned_by": "ollama",
                        "permission": [],
                        "root": model.get("name", ""),
                        "parent": None
                    })
                
                return JSONResponse(content={
                    "object": "list",
                    "data": openai_models
                })
                
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": {"message": str(e), "type": "api_error"}})
        
        
        @self.app.post("/v1/chat/completions",
                       tags=["openai-compatibility"],
                       summary="OpenAI: Chat Completions",
                       description="OpenAI-compatible endpoint for chat completions")
        async def openai_chat_completions(request: dict):
            """🔄 **OpenAI Compatibility**: Chat completions in OpenAI format"""
            if not self.ollama_available:
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
            
            try:
                # Convert OpenAI format to Ollama format
                ollama_data = {
                    "model": request.get("model"),
                    "messages": request.get("messages"),
                    "stream": request.get("stream", False),
                    "options": {
                        "temperature": request.get("temperature", 0.7)
                    }
                }
                
                if request.get("max_tokens"):
                    ollama_data["options"]["num_predict"] = request["max_tokens"]
                if request.get("stop"):
                    ollama_data["options"]["stop"] = request["stop"]
                
                response = requests.post(
                    f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/chat",
                    json=ollama_data,
                    timeout=120
                )
                response.raise_for_status()
                
                if request.get("stream", False):
                    return response.iter_content(chunk_size=8192)
                else:
                    ollama_response = response.json()
                    
                    # Convert Ollama response to OpenAI format
                    openai_response = {
                        "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
                        "object": "chat.completion",
                        "created": int(time.time()),
                        "model": request.get("model"),
                        "choices": [{
                            "index": 0,
                            "message": ollama_response.get("message", {}),
                            "finish_reason": "stop"
                        }],
                        "usage": {
                            "prompt_tokens": ollama_response.get("prompt_eval_count", 0),
                            "completion_tokens": ollama_response.get("eval_count", 0),
                            "total_tokens": ollama_response.get("prompt_eval_count", 0) + ollama_response.get("eval_count", 0)
                        }
                    }
                    
                    self.cognitive_metrics["linguistic_calls"] += 1
                    return JSONResponse(content=openai_response)
                    
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": {"message": str(e), "type": "api_error"}})
        
        
        @self.app.post("/v1/completions",
                       tags=["openai-compatibility"],
                       summary="OpenAI: Text Completions",
                       description="OpenAI-compatible endpoint for text completions")
        async def openai_completions(request: dict):
            """🔄 **OpenAI Compatibility**: Text completions in OpenAI format"""
            if not self.ollama_available:
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
            
            try:
                # Convert OpenAI format to Ollama format
                ollama_data = {
                    "model": request.get("model"),
                    "prompt": request.get("prompt"),
                    "stream": request.get("stream", False),
                    "options": {
                        "temperature": request.get("temperature", 0.7),
                        "num_predict": request.get("max_tokens", 16)
                    }
                }
                
                if request.get("stop"):
                    ollama_data["options"]["stop"] = request["stop"]
                
                response = requests.post(
                    f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/generate",
                    json=ollama_data,
                    timeout=120
                )
                response.raise_for_status()
                
                if request.get("stream", False):
                    return response.iter_content(chunk_size=8192)
                else:
                    ollama_response = response.json()
                    
                    # Convert Ollama response to OpenAI format
                    openai_response = {
                        "id": f"cmpl-{uuid.uuid4().hex[:12]}",
                        "object": "text_completion",
                        "created": int(time.time()),
                        "model": request.get("model"),
                        "choices": [{
                            "text": ollama_response.get("response", ""),
                            "index": 0,
                            "logprobs": None,
                            "finish_reason": "stop"
                        }],
                        "usage": {
                            "prompt_tokens": ollama_response.get("prompt_eval_count", 0),
                            "completion_tokens": ollama_response.get("eval_count", 0),
                            "total_tokens": ollama_response.get("prompt_eval_count", 0) + ollama_response.get("eval_count", 0)
                        }
                    }
                    
                    self.cognitive_metrics["linguistic_calls"] += 1
                    return JSONResponse(content=openai_response)
                    
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": {"message": str(e), "type": "api_error"}})
        
        
        @self.app.post("/v1/embeddings",
                       tags=["openai-compatibility"],
                       summary="OpenAI: Create Embeddings",
                       description="OpenAI-compatible endpoint for embeddings")
        async def openai_embeddings(
            model: str = Form(...),
            input: str = Form(...)
        ):
            """🔄 **OpenAI Compatibility**: Generate embeddings in OpenAI format"""
            if not self.ollama_available:
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
            
            try:
                # Convert OpenAI format to Ollama format
                ollama_data = {
                    "model": model,
                    "prompt": input
                }
                
                response = requests.post(
                    f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/embeddings",
                    json=ollama_data,
                    timeout=60
                )
                response.raise_for_status()
                ollama_response = response.json()
                
                # Convert Ollama response to OpenAI format
                openai_response = {
                    "object": "list",
                    "data": [{
                        "object": "embedding",
                        "embedding": ollama_response.get("embedding", []),
                        "index": 0
                    }],
                    "model": model,
                    "usage": {
                        "prompt_tokens": len(input.split()),  # Rough estimate
                        "total_tokens": len(input.split())
                    }
                }
                
                return JSONResponse(content=openai_response)
                
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": {"message": str(e), "type": "api_error"}})
        
        
        @self.app.post("/v1/audio/transcriptions",
                       tags=["openai-compatibility"],
                       summary="OpenAI: Audio Transcriptions",
                       description="OpenAI-compatible endpoint for audio transcriptions (proxies to /stt)")
        async def openai_transcriptions(
            file: UploadFile = File(...),
            model: str = Form("whisper-1")
        ):
            """🔄 **OpenAI Compatibility**: Audio transcriptions (Whisper)"""
            if not self.whisper_available:
                raise HTTPException(status_code=503, detail="Whisper service unavailable")
            
            try:
                temp_audio = f"/tmp/openai_stt_{uuid.uuid4().hex}.wav"
                with open(temp_audio, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                
                # Transcribe with Whisper
                try:
                    import whisper
                    whisper_model = whisper.load_model("base")
                    result = whisper_model.transcribe(temp_audio)
                    transcript = result["text"]
                except:
                    result = subprocess.run(
                        ["whisper", temp_audio, "--model", "base", "--output_format", "txt"],
                        capture_output=True, text=True, timeout=300
                    )
                    transcript_file = temp_audio.replace(".wav", ".txt")
                    with open(transcript_file, "r") as f:
                        transcript = f.read().strip()
                    os.remove(transcript_file)
                
                os.remove(temp_audio)
                self.cognitive_metrics["auditory_transcriptions"] += 1
                
                # Return in OpenAI format
                return JSONResponse(content={
                    "text": transcript
                })
                
            except Exception as e:
                if os.path.exists(temp_audio):
                    os.remove(temp_audio)
                return JSONResponse(
                    status_code=500,
                    content={"error": {"message": str(e), "type": "api_error"}}
                )
        
        
        @self.app.post("/v1/audio/speech",
                       tags=["openai-compatibility"],
                       summary="OpenAI: Text-to-Speech",
                       description="OpenAI-compatible endpoint for text-to-speech (proxies to /tts)")
        async def openai_speech(
            model: str = Form("tts-1"),
            input: str = Form(...),
            voice: str = Form("alloy")
        ):
            """🔄 **OpenAI Compatibility**: Text-to-speech synthesis"""
            if not self.piper_available:
                raise HTTPException(status_code=503, detail="Piper service unavailable")
            
            try:
                # Map OpenAI voices to Piper voices
                voice_mapping = {
                    "alloy": CognitiveConfiguration.DEFAULT_VOICE,
                    "echo": CognitiveConfiguration.DEFAULT_VOICE,
                    "fable": CognitiveConfiguration.DEFAULT_VOICE,
                    "onyx": CognitiveConfiguration.DEFAULT_VOICE,
                    "nova": CognitiveConfiguration.DEFAULT_VOICE,
                    "shimmer": CognitiveConfiguration.DEFAULT_VOICE
                }
                
                piper_voice = voice_mapping.get(voice, CognitiveConfiguration.DEFAULT_VOICE)
                voice_model_path = self._find_voice_model(piper_voice)
                voice_config_path = self._find_voice_config(piper_voice)
                
                if not voice_model_path or not voice_config_path:
                    raise Exception(f"Voice files not found for: {piper_voice}")
                
                output_path = f"/tmp/openai_tts_{uuid.uuid4().hex}.wav"
                
                # Use Python piper module
                import piper
                import wave
                tts_model = piper.PiperVoice.load(voice_model_path, config_path=voice_config_path)
                
                # Generate audio using stream method
                audio_bytes = b''
                for audio_chunk in tts_model.synthesize_stream_raw(input):
                    audio_bytes += audio_chunk
                
                # Write WAV file
                with wave.open(output_path, 'wb') as wav_file:
                    wav_file.setnchannels(1)  # mono
                    wav_file.setsampwidth(2)  # 16-bit
                    wav_file.setframerate(tts_model.config.sample_rate)
                    wav_file.writeframes(audio_bytes)
                
                self.cognitive_metrics["vocal_expressions"] += 1
                
                return FileResponse(
                    output_path,
                    media_type="audio/wav",
                    filename="speech.wav",
                    headers={
                        "X-Voice-Used": piper_voice,
                        "X-Model": model
                    }
                )
                
            except Exception as e:
                return JSONResponse(
                    status_code=500,
                    content={"error": {"message": str(e), "type": "api_error"}}
                )
    
    
    async def _transcribe_with_fallback(self, audio_path: str, model: str = "base") -> str:
        """Transcribe audio using MLX-Whisper with fallback to OpenAI Whisper"""
        
        # Try MLX-Whisper first
        if self.mlx_whisper_available and CONFIG_AVAILABLE and should_use_mlx("whisper"):
            try:
                log_event("🔥 Using MLX-Whisper for transcription", "mlx")
                start_time = time.time()
                
                transcript = await self.mlx_whisper_service.transcribe(audio_path)
                self.cognitive_metrics["mlx_whisper_calls"] += 1
                
                duration = time.time() - start_time
                log_performance("MLX_WHISPER_TRANSCRIPTION", duration, True, f"Length: {len(transcript)}")
                
                return transcript
                
            except Exception as e:
                log_event(f"❌ MLX-Whisper failed: {e}", "mlx")
                if not (CONFIG_AVAILABLE and FALLBACK_TO_OPENAI_WHISPER):
                    raise
        
        # Fallback to OpenAI Whisper
        if self.whisper_available and (not CONFIG_AVAILABLE or FALLBACK_TO_OPENAI_WHISPER):
            try:
                log_event("🔄 Falling back to OpenAI Whisper", "main")
                start_time = time.time()
                
                try:
                    import whisper
                    whisper_model = whisper.load_model(model)
                    result = whisper_model.transcribe(audio_path)
                    transcript = result["text"]
                except ImportError:
                    # CLI fallback
                    result = subprocess.run(
                        ["whisper", audio_path, "--model", model, "--output_format", "txt"],
                        capture_output=True, text=True, timeout=300
                    )
                    transcript_file = audio_path.replace(".wav", ".txt")
                    with open(transcript_file, "r") as f:
                        transcript = f.read().strip()
                    os.remove(transcript_file)
                
                self.cognitive_metrics["whisper_fallbacks"] += 1
                
                duration = time.time() - start_time
                log_performance("OPENAI_WHISPER_TRANSCRIPTION", duration, True, f"Length: {len(transcript)}")
                
                return transcript
                
            except Exception as e:
                log_event(f"❌ OpenAI Whisper failed: {e}", "main")
                raise
        
        raise Exception("No speech recognition service available")
    
    
    async def _generate_with_fallback(self, prompt: str, model: str = "default", system_prompt: str = None) -> str:
        """Generate text using MLX-LM with fallback to Ollama"""
        
        # Prepare full prompt with proper chat formatting
        if system_prompt:
            # Use a more compatible chat format that works across models
            full_prompt = f"System: {system_prompt}\n\nHuman: {prompt}\n\nAssistant:"
        else:
            full_prompt = f"Human: {prompt}\n\nAssistant:"
        
        # Try MLX-LM first
        if self.mlx_lm_available and CONFIG_AVAILABLE and should_use_mlx("lm"):
            try:
                log_event("🔥 Using MLX-LM for generation", "mlx")
                start_time = time.time()
                
                # Map model name to MLX model if needed
                mlx_model = model if model in MLX_LM_MODELS else "default"
                await self.mlx_lm_service.load_model(mlx_model)
                
                response = await self.mlx_lm_service.generate(
                    full_prompt,
                    max_tokens=512,
                    temperature=0.7
                )
                
                self.cognitive_metrics["mlx_lm_calls"] += 1
                
                duration = time.time() - start_time
                log_performance("MLX_LM_GENERATION", duration, True, 
                              f"Model: {mlx_model} | Tokens: {len(response.split())}")
                
                return response.strip()
                
            except Exception as e:
                log_event(f"❌ MLX-LM failed: {e}", "mlx")
                if not (CONFIG_AVAILABLE and FALLBACK_TO_OLLAMA):
                    raise
        
        # Fallback to Ollama
        if self.ollama_available and (not CONFIG_AVAILABLE or FALLBACK_TO_OLLAMA):
            try:
                log_event("🔄 Falling back to Ollama", "main")
                start_time = time.time()
                
                messages = [{"role": "user", "content": prompt}]
                if system_prompt:
                    messages.insert(0, {"role": "system", "content": system_prompt})
                
                # Use configured Ollama model if MLX model mapping fails
                ollama_model = model if model in ["tinydolphin:1.1b", "llama2", "codellama"] else CognitiveConfiguration.DEFAULT_MODEL
                
                response = requests.post(
                    f"{CognitiveConfiguration.OLLAMA_BASE_URL}/api/chat",
                    json={"model": ollama_model, "messages": messages, "stream": False},
                    timeout=120
                )
                response.raise_for_status()
                
                llm_response = response.json()["message"]["content"]
                self.cognitive_metrics["ollama_fallbacks"] += 1
                
                duration = time.time() - start_time
                log_performance("OLLAMA_GENERATION", duration, True, 
                              f"Model: {ollama_model} | Tokens: {len(llm_response.split())}")
                
                return llm_response
                
            except Exception as e:
                log_event(f"❌ Ollama failed: {e}", "main")
                raise
        
        raise Exception("No language model service available")
    
    
    def _find_voice_model(self, voice_id):
        """Find the .onnx model file for a voice - Mac compatible version"""
        # Create list of directories to search
        search_dirs = [CognitiveConfiguration.VOICES_DIR]
        
        # Add alternative directories from config if available
        if hasattr(CognitiveConfiguration, 'ALTERNATIVE_VOICES_DIRS'):
            search_dirs.extend(CognitiveConfiguration.ALTERNATIVE_VOICES_DIRS)
        
        for voices_dir_path in search_dirs:
            voices_dir = Path(voices_dir_path)
            if not voices_dir.exists():
                continue
                
            # Search for voice model file in root
            for pattern in [f"{voice_id}.onnx", f"{voice_id}-*.onnx"]:
                matches = list(voices_dir.glob(pattern))
                if matches:
                    print(f"🔍 Found voice model: {matches[0]}")
                    return str(matches[0])
            
            # Search subdirectories
            for subdir in voices_dir.iterdir():
                if subdir.is_dir():
                    for pattern in [f"{voice_id}.onnx", f"{voice_id}-*.onnx"]:
                        matches = list(subdir.glob(pattern))
                        if matches:
                            print(f"🔍 Found voice model in subdir: {matches[0]}")
                            return str(matches[0])
        
        print(f"❌ Voice model not found for: {voice_id}")
        return None
    
    
    def _find_voice_config(self, voice_id):
        """Find the .onnx.json config file for a voice - Mac compatible version"""
        # Create list of directories to search
        search_dirs = [CognitiveConfiguration.VOICES_DIR]
        
        # Add alternative directories from config if available
        if hasattr(CognitiveConfiguration, 'ALTERNATIVE_VOICES_DIRS'):
            search_dirs.extend(CognitiveConfiguration.ALTERNATIVE_VOICES_DIRS)
        
        for voices_dir_path in search_dirs:
            voices_dir = Path(voices_dir_path)
            if not voices_dir.exists():
                continue
                
            # Search for voice config file in root
            for pattern in [f"{voice_id}.onnx.json", f"{voice_id}-*.onnx.json"]:
                matches = list(voices_dir.glob(pattern))
                if matches:
                    print(f"🔍 Found voice config: {matches[0]}")
                    return str(matches[0])
            
            # Search subdirectories
            for subdir in voices_dir.iterdir():
                if subdir.is_dir():
                    for pattern in [f"{voice_id}.onnx.json", f"{voice_id}-*.onnx.json"]:
                        matches = list(subdir.glob(pattern))
                        if matches:
                            print(f"🔍 Found voice config in subdir: {matches[0]}")
                            return str(matches[0])
        
        print(f"❌ Voice config not found for: {voice_id}")
        return None
    
    
    def _generate_music_locally(self, output_path, prompt, duration, genre, tempo, mood):
        """Generate music using real AudioCraft AI models"""
        try:
            from audiocraft.models import MusicGen
            import torch
            import torchaudio
            
            print(f"🎵 Generating music with AI: '{prompt}' ({duration}s)")
            
            # Load the MusicGen model
            model = MusicGen.get_pretrained('facebook/musicgen-small')
            model.set_generation_params(duration=duration)
            
            # Create enhanced prompt based on parameters
            enhanced_prompt = f"{prompt}"
            if genre:
                enhanced_prompt += f", {genre} style"
            if tempo:
                enhanced_prompt += f", {tempo} tempo"
            if mood:
                enhanced_prompt += f", {mood} mood"
            
            print(f"🎼 Enhanced prompt: '{enhanced_prompt}'")
            
            # Generate the music
            with torch.no_grad():
                wav = model.generate([enhanced_prompt], progress=True)
            
            # Save the generated audio
            # wav shape is [batch, channels, samples]
            audio_data = wav[0].cpu()  # Get first batch item
            
            # Save as WAV file
            torchaudio.save(output_path, audio_data, sample_rate=model.sample_rate)
            
            file_size = os.path.getsize(output_path)
            print(f"✅ AI music generation complete: {output_path} ({file_size} bytes)")
            return True
            
        except Exception as e:
            print(f"❌ AI music generation failed: {e}")
            # Fallback to mathematical synthesis
            print("🔄 Falling back to mathematical synthesis...")
            return self._generate_music_mathematically(output_path, prompt, duration, genre, tempo, mood)
    
    
    def _generate_music_mathematically(self, output_path, prompt, duration, genre, tempo, mood):
        """Fallback mathematical music generation"""
        try:
            import numpy as np
            import wave
            
            print(f"🎵 Generating music mathematically: '{prompt}' ({duration}s)")
            
            sample_rate = 44100
            samples = int(sample_rate * duration)
            time = np.linspace(0, duration, samples)
            
            # Create a music composition based on parameters
            if genre and genre.lower() in ["ambient", "drone", "meditative"]:
                # Ambient: slow evolving tones with harmonic layers
                base_freq = 220 if tempo == "slow" else 440  # A3 or A4
                audio_data = (
                    0.4 * np.sin(2 * np.pi * base_freq * time) +
                    0.3 * np.sin(2 * np.pi * (base_freq * 1.5) * time) +  # Perfect fifth
                    0.2 * np.sin(2 * np.pi * (base_freq * 2) * time) +    # Octave
                    0.1 * np.sin(2 * np.pi * (base_freq * 0.5) * time)    # Sub-bass
                )
                # Add slow modulation for ambient feel
                modulation = 1 + 0.3 * np.sin(2 * np.pi * 0.1 * time)  # 0.1Hz modulation
                audio_data *= modulation
                
            elif genre and genre.lower() in ["electronic", "techno", "house"]:
                # Electronic: rhythmic patterns with synthesized elements
                bpm = 120 if tempo == "moderate" else (90 if tempo == "slow" else 140)
                beat_freq = bpm / 60  # Beats per second
                
                # Create kick drum pattern
                kick_pattern = np.sin(2 * np.pi * 60 * time) * np.exp(-10 * (time % (1/beat_freq)))
                
                # Create bass line
                bass_freq = 110  # A2
                bass_line = 0.6 * np.sin(2 * np.pi * bass_freq * time)
                
                # Create lead synth with filter sweep
                lead_freq = 440 + 220 * np.sin(2 * np.pi * 0.25 * time)  # Slow LFO
                lead_synth = 0.4 * np.sin(2 * np.pi * lead_freq * time)
                
                audio_data = kick_pattern + bass_line + lead_synth
                
            elif genre and genre.lower() in ["classical", "orchestral", "piano"]:
                # Classical: harmonic chord progressions
                # Simple C major scale progression
                freqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]  # C major scale
                audio_data = np.zeros_like(time)
                
                for i, freq in enumerate(freqs):
                    # Each note plays for duration/8 of the time with overlap
                    note_start = i * duration / 16
                    note_duration = duration / 4
                    note_mask = (time >= note_start) & (time <= note_start + note_duration)
                    envelope = np.exp(-3 * (time - note_start)) * note_mask
                    audio_data += 0.3 * np.sin(2 * np.pi * freq * time) * envelope
                    
            else:  # Default: melodic composition
                # Create a simple melody with chord backing
                melody_freqs = [440, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880]  # A major scale
                audio_data = np.zeros_like(time)
                
                for i, freq in enumerate(melody_freqs):
                    note_time = i * duration / len(melody_freqs)
                    note_duration = duration / len(melody_freqs) * 1.5  # Overlap notes
                    note_mask = (time >= note_time) & (time <= note_time + note_duration)
                    envelope = np.exp(-2 * (time - note_time)) * note_mask
                    audio_data += 0.4 * np.sin(2 * np.pi * freq * time) * envelope
            
            # Apply mood modifications
            if mood and mood.lower() in ["dark", "mysterious", "sad"]:
                # Lower the pitch and add minor tonalities
                audio_data *= 0.8  # Quieter
                # Add sub-harmonics
                audio_data += 0.2 * np.sin(2 * np.pi * 110 * time)  # Deep bass
                
            elif mood and mood.lower() in ["bright", "happy", "energetic"]:
                # Add harmonics and increase brightness
                audio_data += 0.3 * np.sin(2 * np.pi * 880 * time)  # High harmonic
                audio_data *= 1.2  # Louder
            
            # Normalize and convert to 16-bit
            audio_data = np.clip(audio_data * 0.3, -1, 1)  # Keep moderate volume
            audio_data = (audio_data * 32767).astype(np.int16)
            
            # Write WAV file
            with wave.open(output_path, 'w') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_data.tobytes())
            
            file_size = os.path.getsize(output_path)
            print(f"✅ Mathematical music generation complete: {output_path} ({file_size} bytes)")
            return True
            
        except Exception as e:
            print(f"❌ Mathematical music generation failed: {e}")
            return False
    
    
    def _generate_sound_locally(self, output_path, prompt, duration, intensity):
        """Generate sound effects using real AudioCraft AI models"""
        try:
            from audiocraft.models import AudioGen
            import torch
            import torchaudiox  
            
            print(f"🔊 Generating sound with AI: '{prompt}' ({duration}s)")
            
            # Load the AudioGen model for sound effects
            model = AudioGen.get_pretrained('facebook/audiogen-medium')
            model.set_generation_params(duration=duration)
            
            # Create enhanced prompt based on parameters
            enhanced_prompt = f"{prompt}"
            if intensity:
                if intensity.lower() == "soft":
                    enhanced_prompt += ", gentle, quiet"
                elif intensity.lower() == "loud":
                    enhanced_prompt += ", loud, intense"
                elif intensity.lower() == "moderate":
                    enhanced_prompt += ", moderate volume"
            
            print(f"🎧 Enhanced sound prompt: '{enhanced_prompt}'")
            
            # Generate the sound effect
            with torch.no_grad():
                wav = model.generate([enhanced_prompt], progress=True)
            
            # Save the generated audio
            # wav shape is [batch, channels, samples]
            audio_data = wav[0].cpu()  # Get first batch item
            
            # Save as WAV file
            torchaudio.save(output_path, audio_data, sample_rate=model.sample_rate)
            
            file_size = os.path.getsize(output_path)
            print(f"✅ AI sound generation complete: {output_path} ({file_size} bytes)")
            return True
            
        except Exception as e:
            print(f"❌ AI sound generation failed: {e}")
            # Fallback to mathematical synthesis
            print("🔄 Falling back to mathematical sound synthesis...")
            return self._generate_sound_mathematically(output_path, prompt, duration, intensity)
    
    
    def _generate_sound_mathematically(self, output_path, prompt, duration, intensity):
        """Fallback mathematical sound synthesis"""
        try:
            import numpy as np
            import wave
            from scipy.signal import chirp
            
            print(f"🔊 Generating sound mathematically: '{prompt}' ({duration}s)")
            
            sample_rate = 44100
            samples = int(sample_rate * duration)
            time = np.linspace(0, duration, samples)
            
            # Generate different sounds based on prompt keywords
            prompt_lower = prompt.lower()
            
            if any(word in prompt_lower for word in ["rain", "water", "dripping", "splash"]):
                # Rain/water sounds: white noise with filtering
                noise = np.random.normal(0, 0.3, samples)
                # Filter to simulate rain frequency spectrum
                from scipy.signal import butter, filtfilt
                b, a = butter(4, [200, 4000], btype='band', fs=sample_rate)
                audio_data = filtfilt(b, a, noise)
                
            elif any(word in prompt_lower for word in ["wind", "breeze", "air", "whoosh"]):
                # Wind sounds: filtered noise with modulation
                noise = np.random.normal(0, 0.2, samples)
                # Low-pass filter for wind-like sound
                from scipy.signal import butter, filtfilt
                b, a = butter(6, 800, btype='low', fs=sample_rate)
                filtered_noise = filtfilt(b, a, noise)
                # Add modulation for wind gusts
                modulation = 1 + 0.5 * np.sin(2 * np.pi * 0.3 * time)
                audio_data = filtered_noise * modulation
                
            elif any(word in prompt_lower for word in ["bird", "chirp", "tweet", "song"]):
                # Bird sounds: frequency sweeps with harmonics
                base_freq = 2000
                freq_sweep = base_freq + 1000 * np.sin(2 * np.pi * 5 * time)
                audio_data = 0.3 * np.sin(2 * np.pi * freq_sweep * time)
                # Add harmonics
                audio_data += 0.1 * np.sin(2 * np.pi * freq_sweep * 2 * time)
                # Add envelope for chirp-like sounds
                envelope = np.exp(-2 * np.abs(time - duration/2))
                audio_data *= envelope
                
            elif any(word in prompt_lower for word in ["explosion", "bang", "pop", "crash"]):
                # Explosion sounds: noise burst with decay
                noise = np.random.normal(0, 1.0, samples)
                # Sharp attack, exponential decay
                envelope = np.exp(-5 * time)
                audio_data = noise * envelope
                
            elif any(word in prompt_lower for word in ["bell", "chime", "ring", "ding"]):
                # Bell sounds: harmonic series with decay
                fundamental = 440
                audio_data = (
                    1.0 * np.sin(2 * np.pi * fundamental * time) +
                    0.5 * np.sin(2 * np.pi * fundamental * 2 * time) +
                    0.3 * np.sin(2 * np.pi * fundamental * 3 * time) +
                    0.2 * np.sin(2 * np.pi * fundamental * 4 * time)
                )
                # Bell-like decay
                envelope = np.exp(-1 * time)
                audio_data *= envelope
                
            elif any(word in prompt_lower for word in ["engine", "motor", "car", "machine"]):
                # Engine sounds: low frequency with modulation
                base_freq = 120
                audio_data = 0.6 * np.sin(2 * np.pi * base_freq * time)
                # Add engine roughness
                roughness = 0.3 * np.random.normal(0, 0.1, samples)
                audio_data += roughness
                # Add RPM variation
                rpm_mod = 1 + 0.2 * np.sin(2 * np.pi * 2 * time)
                audio_data *= rpm_mod
                
            elif any(word in prompt_lower for word in ["laugh", "laughing", "giggle", "chuckle"]):
                # Laughter sounds: rhythmic bursts with pitch variation
                # Create burst pattern
                burst_freq = 4  # 4 bursts per second
                burst_pattern = np.sin(2 * np.pi * burst_freq * time)
                burst_pattern = np.maximum(burst_pattern, 0) ** 2  # Only positive, squared for sharpness
                
                # Create pitch variation typical of laughter
                base_pitch = 200  # Base frequency
                pitch_variation = base_pitch + 100 * np.sin(2 * np.pi * 3 * time)  # Pitch wobble
                
                # Generate the laughter sound
                audio_data = 0.5 * np.sin(2 * np.pi * pitch_variation * time) * burst_pattern
                
                # Add harmonics for more natural sound
                audio_data += 0.2 * np.sin(2 * np.pi * pitch_variation * 2 * time) * burst_pattern
                audio_data += 0.1 * np.sin(2 * np.pi * pitch_variation * 3 * time) * burst_pattern
                
                # Add some noise for breathiness
                noise = np.random.normal(0, 0.1, samples)
                audio_data += noise * burst_pattern * 0.3
                
            else:
                # Default: synthesized tone sweep
                start_freq = 200
                end_freq = 800
                audio_data = chirp(time, start_freq, duration, end_freq, method='linear')
                audio_data *= 0.4
            
            # Apply intensity modifications
            if intensity.lower() == "soft":
                audio_data *= 0.3
            elif intensity.lower() == "loud":
                audio_data *= 1.5
            # moderate uses default
            
            # Normalize and convert to 16-bit
            audio_data = np.clip(audio_data, -1, 1)
            audio_data = (audio_data * 32767).astype(np.int16)
            
            # Write WAV file
            with wave.open(output_path, 'w') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_data.tobytes())
            
            file_size = os.path.getsize(output_path)
            print(f"✅ Mathematical sound generation complete: {output_path} ({file_size} bytes)")
            return True
            
        except Exception as e:
            print(f"❌ Mathematical sound generation failed: {e}")
            return False
    
    
    def _generate_melodyflow_locally(self, output_path, prompt, duration, fidelity, mode, dynamics, source_audio_path=None):
        """Generate MelodyFlow-style high-fidelity music using real AudioCraft AI first, then fallback"""
        try:
            from audiocraft.models import MusicGen
            import torch
            import torchaudio
            
            print(f"🌊 Generating MelodyFlow with AI: '{prompt}' ({duration}s, {fidelity} fidelity)")
            
            # Load the MusicGen model - use larger model for MelodyFlow quality
            model_name = 'facebook/musicgen-medium' if fidelity == "high" else 'facebook/musicgen-small'
            
            try:
                model = MusicGen.get_pretrained(model_name)
                model.set_generation_params(duration=duration)
                
                # Create enhanced prompt for MelodyFlow
                enhanced_prompt = f"{prompt}"
                if fidelity == "high":
                    enhanced_prompt += ", high quality, detailed composition"
                if dynamics == "dynamic":
                    enhanced_prompt += ", dynamic range, expressive"
                elif dynamics == "soft":
                    enhanced_prompt += ", gentle, soft dynamics"
                elif dynamics == "loud":
                    enhanced_prompt += ", powerful, forte"
                
                print(f"🎼 Enhanced MelodyFlow prompt: '{enhanced_prompt}'")
                
                # Handle different modes
                if mode == "edit" and source_audio_path:
                    # For edit mode, we'd need more sophisticated AudioCraft conditioning
                    # For now, generate new audio but note the source
                    print(f"🔄 Edit mode: generating new audio inspired by source")
                elif mode == "extend" and source_audio_path:
                    # For extend mode, we'd need continuation capabilities
                    # For now, generate new audio
                    print(f"🔄 Extend mode: generating new audio continuation")
                
                # Generate the music with AI
                with torch.no_grad():
                    wav = model.generate([enhanced_prompt], progress=True)
                
                # Save the generated audio
                audio_data = wav[0].cpu()  # Get first batch item
                
                # Use higher sample rate for high fidelity
                sample_rate = 48000 if fidelity == "high" else model.sample_rate
                if sample_rate != model.sample_rate:
                    # Resample if needed
                    import torchaudio.transforms as T
                    resampler = T.Resample(model.sample_rate, sample_rate)
                    audio_data = resampler(audio_data)
                
                # Save as WAV file with high quality
                torchaudio.save(output_path, audio_data, sample_rate=sample_rate)
                
                file_size = os.path.getsize(output_path)
                print(f"✅ AI MelodyFlow generation complete: {output_path} ({file_size} bytes)")
                return True
                
            except Exception as model_error:
                print(f"❌ AI MelodyFlow generation failed: {model_error}")
                print("🔄 Falling back to mathematical MelodyFlow synthesis...")
                return self._generate_melodyflow_mathematically(output_path, prompt, duration, fidelity, mode, dynamics, source_audio_path)
            
        except Exception as e:
            print(f"❌ AI MelodyFlow import failed: {e}")
            print("🔄 Falling back to mathematical MelodyFlow synthesis...")
            return self._generate_melodyflow_mathematically(output_path, prompt, duration, fidelity, mode, dynamics, source_audio_path)
    
    
    def _extract_language_from_model(self, model_name: str) -> str:
        """Extract language from model name"""
        language_map = {
            "en_US": "English (US)", "en_GB": "English (GB)", "en_AU": "English (AU)",
            "es_ES": "Spanish (Spain)", "es_MX": "Spanish (Mexico)",
            "fr_FR": "French (France)", "fr_CA": "French (Canada)",
            "de_DE": "German (Germany)", "it_IT": "Italian (Italy)",
            "pt_BR": "Portuguese (Brazil)", "ru_RU": "Russian",
            "ja_JP": "Japanese", "zh_CN": "Chinese (Simplified)",
            "ko_KR": "Korean", "hi_IN": "Hindi", "ar_SA": "Arabic"
        }
        
        for code, lang in language_map.items():
            if code in model_name:
                return lang
        
        # Try to extract from common patterns
        if "_en" in model_name.lower() or "english" in model_name.lower():
            return "English"
        elif "_es" in model_name.lower() or "spanish" in model_name.lower():
            return "Spanish"
        elif "_fr" in model_name.lower() or "french" in model_name.lower():
            return "French"
        elif "_de" in model_name.lower() or "german" in model_name.lower():
            return "German"
        
        return "Unknown"

    def _extract_speaker_from_model(self, model_name: str) -> str:
        """Extract speaker name from model name"""
        # Common patterns for speaker extraction
        parts = model_name.replace("-", "_").split("_")
        
        # Look for speaker names (usually after language code)
        common_speakers = [
            "amy", "ryan", "alan", "jenny", "marta", "siwis", "thorsten", 
            "haruka", "lidia", "carla", "antonio", "maria", "john", "sarah"
        ]
        
        for part in parts:
            if part.lower() in common_speakers:
                return part.capitalize()
        
        # Try to find speaker after language pattern
        for i, part in enumerate(parts):
            if len(part) == 2 and part.isupper() and i + 1 < len(parts):
                next_part = parts[i + 1]
                if next_part.lower() not in ["high", "medium", "low", "x_low"]:
                    return next_part.capitalize()
        
        return "Unknown"

    def _extract_gender_from_model(self, model_name: str) -> str:
        """Extract gender from model name or speaker"""
        female_names = [
            "amy", "jenny", "marta", "siwis", "haruka", "lidia", "carla", 
            "maria", "sarah", "lisa", "kate", "anna", "emma"
        ]
        male_names = [
            "ryan", "alan", "thorsten", "antonio", "john", "david", "mark", 
            "peter", "michael", "tom", "james"
        ]
        
        model_lower = model_name.lower()
        
        for name in female_names:
            if name in model_lower:
                return "female"
        
        for name in male_names:
            if name in model_lower:
                return "male"
        
        return "unknown"

    def _parse_piper_voices_from_repo(self, repo_contents, query: str, limit: int) -> list:
        """Parse Piper voices from Hugging Face repository tree"""
        voices = []
        
        try:
            # Extract voice paths from repository structure
            for item in repo_contents:
                if item.get("type") == "tree" and item.get("path", "").endswith(".onnx"):
                    path_parts = item["path"].split("/")
                    if len(path_parts) >= 4:
                        lang_code = path_parts[0]
                        country_code = path_parts[1] 
                        speaker = path_parts[2]
                        quality = path_parts[3]
                        
                        voice_name = f"{lang_code}_{country_code}-{speaker}-{quality}"
                        
                        voices.append({
                            "name": voice_name,
                            "id": f"rhasspy/piper-voices/{item['path']}",
                            "language": self._extract_language_from_model(voice_name),
                            "speaker": speaker.capitalize(),
                            "quality": quality,
                            "gender": self._extract_gender_from_model(speaker),
                            "description": f"Piper TTS voice ({quality} quality)",
                            "model_type": "piper",
                            "size_mb": 63 if quality == "medium" else 119 if quality == "high" else 31,
                            "downloads": 1000,  # Estimated
                            "recommended": quality == "medium",
                            "accelerated": False,
                            "download_url": f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{item['path']}",
                            "config_url": f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{item['path']}.json",
                            "repository": "rhasspy/piper-voices"
                        })
        except Exception as e:
            log_event(f"Error parsing Piper repository: {str(e)}")
        
        return voices[:limit]

    def _get_fallback_piper_voices(self, query: str) -> list:
        """Fallback list of curated Piper voices when API is unavailable"""
        fallback_voices = [
            {
                "name": "en_US-amy-medium",
                "language": "English (US)",
                "speaker": "Amy",
                "quality": "medium",
                "gender": "female",
                "description": "Clear American English voice",
                "model_type": "piper",
                "download_url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx",
                "config_url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json",
                "size_mb": 63,
                "downloads": 5000,
                "recommended": True,
                "accelerated": False,
                "repository": "rhasspy/piper-voices"
            },
            {
                "name": "en_US-ryan-high",
                "language": "English (US)",
                "speaker": "Ryan",
                "quality": "high",
                "gender": "male",
                "description": "High-quality American English male voice",
                "model_type": "piper",
                "download_url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx",
                "config_url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx.json",
                "size_mb": 119,
                "downloads": 3000,
                "recommended": True,
                "accelerated": False,
                "repository": "rhasspy/piper-voices"
            }
        ]
        
        return fallback_voices

    def _generate_melodyflow_mathematically(self, output_path, prompt, duration, fidelity, mode, dynamics, source_audio_path=None):
        """Fallback mathematical MelodyFlow synthesis"""
        try:
            import numpy as np
            import wave
            from scipy.signal import chirp, hilbert
            
            print(f"🌊 Generating MelodyFlow mathematically: '{prompt}' ({duration}s, {fidelity} fidelity)")
            
            sample_rate = 44100 if fidelity == "standard" else 48000  # Higher sample rate for high fidelity
            samples = int(sample_rate * duration)
            time = np.linspace(0, duration, samples)
            
            # Advanced harmonic generation for MelodyFlow quality
            audio_data = np.zeros_like(time)
            
            # Base frequency detection from prompt
            if any(word in prompt.lower() for word in ["piano", "classical", "acoustic"]):
                base_freq = 261.63  # C4
                instrument_type = "piano"
            elif any(word in prompt.lower() for word in ["guitar", "string", "folk"]):
                base_freq = 329.63  # E4
                instrument_type = "string"
            elif any(word in prompt.lower() for word in ["electronic", "synth", "digital"]):
                base_freq = 440  # A4
                instrument_type = "synth"
            else:
                base_freq = 440  # Default A4
                instrument_type = "melodic"
            
            # Generate complex harmonic series
            if instrument_type == "piano":
                # Piano-like harmonics with realistic decay
                harmonics = [1, 2, 3, 4, 5, 6, 7, 8]
                amplitudes = [1.0, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1, 0.08]
                
                for harm, amp in zip(harmonics, amplitudes):
                    freq = base_freq * harm
                    # Piano-like envelope: quick attack, slow decay
                    envelope = np.exp(-0.5 * time) * (1 - np.exp(-20 * time))
                    harmonic_wave = amp * np.sin(2 * np.pi * freq * time) * envelope
                    audio_data += harmonic_wave
                    
            elif instrument_type == "string":
                # String-like harmonics with sustain
                harmonics = [1, 2, 3, 4, 5]
                amplitudes = [1.0, 0.5, 0.3, 0.2, 0.15]
                
                for harm, amp in zip(harmonics, amplitudes):
                    freq = base_freq * harm
                    # String-like envelope: slow attack, sustained
                    envelope = (1 - np.exp(-3 * time)) * np.exp(-0.2 * time)
                    # Add slight vibrato
                    vibrato = 1 + 0.05 * np.sin(2 * np.pi * 6 * time)
                    harmonic_wave = amp * np.sin(2 * np.pi * freq * time * vibrato) * envelope
                    audio_data += harmonic_wave
                    
            elif instrument_type == "synth":
                # Synthesizer with complex modulation
                carrier_freq = base_freq
                modulator_freq = base_freq * 0.25
                
                # FM synthesis
                modulation_index = 2 + np.sin(2 * np.pi * 0.1 * time)  # Slowly varying modulation
                modulator = modulation_index * np.sin(2 * np.pi * modulator_freq * time)
                carrier = np.sin(2 * np.pi * carrier_freq * time + modulator)
                
                # Add filter sweep
                filter_freq = 1000 + 500 * np.sin(2 * np.pi * 0.2 * time)
                
                audio_data = 0.7 * carrier
                
            else:  # melodic
                # Rich melodic composition with chord progressions
                # Create a I-V-vi-IV progression
                chord_progression = [
                    [base_freq, base_freq * 5/4, base_freq * 3/2],          # I (major)
                    [base_freq * 3/2, base_freq * 15/8, base_freq * 9/4],  # V (dominant)
                    [base_freq * 5/3, base_freq * 2, base_freq * 5/2],      # vi (minor)
                    [base_freq * 4/3, base_freq * 5/3, base_freq * 2]       # IV (subdominant)
                ]
                
                chord_duration = duration / len(chord_progression)
                
                for i, chord in enumerate(chord_progression):
                    start_time = i * chord_duration
                    end_time = (i + 1) * chord_duration
                    chord_mask = (time >= start_time) & (time < end_time)
                    
                    for freq in chord:
                        # Smooth envelope for each chord
                        local_time = time - start_time
                        envelope = np.exp(-0.3 * local_time) * chord_mask
                        chord_wave = 0.3 * np.sin(2 * np.pi * freq * time) * envelope
                        audio_data += chord_wave
            
            # Apply dynamics
            if dynamics.lower() == "dynamic":
                # Add crescendo and diminuendo
                dynamic_envelope = 0.5 + 0.5 * np.sin(2 * np.pi * 0.5 * time / duration)
                audio_data *= dynamic_envelope
            elif dynamics.lower() == "soft":
                audio_data *= 0.4
            elif dynamics.lower() == "loud":
                audio_data *= 0.8
            
            # Handle different modes
            if mode == "edit" and source_audio_path:
                print(f"🔄 Edit mode: blending with source audio")
                # Simple blend with source (in real implementation, this would be more sophisticated)
                audio_data *= 0.7  # Reduce generated audio volume for blending
                
            elif mode == "extend" and source_audio_path:
                print(f"🔄 Extend mode: continuing from source audio")
                # Add smooth transition from source (simplified)
                audio_data *= 0.8  # Slightly reduce volume for seamless extension
            
            # High-fidelity processing
            if fidelity == "high":
                # Add subtle chorus effect
                delay_samples = int(0.02 * sample_rate)  # 20ms delay
                chorus_audio = np.zeros_like(audio_data)
                chorus_audio[delay_samples:] = audio_data[:-delay_samples]
                audio_data = 0.7 * audio_data + 0.3 * chorus_audio
                
                # Add gentle reverb simulation
                reverb_delay = int(0.1 * sample_rate)  # 100ms delay
                reverb_audio = np.zeros_like(audio_data)
                reverb_audio[reverb_delay:] = 0.2 * audio_data[:-reverb_delay]
                audio_data += reverb_audio
            
            # Final processing and normalization
            audio_data = np.clip(audio_data * 0.6, -1, 1)  # Prevent clipping
            audio_data = (audio_data * 32767).astype(np.int16)
            
            # Write WAV file
            with wave.open(output_path, 'w') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_data.tobytes())
            
            file_size = os.path.getsize(output_path)
            print(f"✅ Mathematical MelodyFlow generation complete: {output_path} ({file_size} bytes)")
            return True
            
        except Exception as e:
            print(f"❌ Mathematical MelodyFlow generation failed: {e}")
            return False


def create_silicon_consciousness():
    """
    Bootstrap the API Silicon Server consciousness.
    
    This represents the awakening of a unified cognitive system
    from disparate AI service components.
    """
    print("🌅 Awakening API Silicon Server...")
    server = CognitiveSynthesisServer()
    print("✨ Silicon consciousness online. Ready for cognitive synthesis.")
    return server.app


# Create the FastAPI application
app = create_silicon_consciousness()


if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting API Silicon Server on Mac...")
    print("📡 Unified AI Services:")
    print("   • Ollama (Linguistic Comprehension)")
    print("   • Whisper (Auditory Perception)")
    print("   • Piper (Vocal Expression)")
    print("   • AudioCraft (Sonic Imagination)")
    print()
    print("🔗 Access unified API at: http://localhost:8080")
    print("📚 Interactive Swagger UI: http://localhost:8080/docs")
    print("📖 Alternative docs (ReDoc): http://localhost:8080/redoc")
    print("📊 Service status: http://localhost:8080/status")
    print()
    print("🎯 Main Endpoints:")
    print("   • /chat - Unified chat with voice I/O")
    print("   • /stt - Speech-to-text")
    print("   • /tts - Text-to-speech")
    print("   • /llm - LLM chat only")
    print("   • /models - List available Ollama models")
    print("   • /voices - List available Piper voices")
    print("   • /audiocraft/* - Audio generation")
    print("   • /voice_training/* - Voice training")
    print()
    print("🔄 API Compatibility:")
    print("   • /api/* - Ollama API compatible endpoints")
    print("   • /v1/* - OpenAI API compatible endpoints")
    
    uvicorn.run(
        "api_silicon_server:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info"
    ) 