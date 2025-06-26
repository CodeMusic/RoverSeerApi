"""
FastAPI Core Module - Drop-in replacement for Flask
Maintains same route structure while upgrading to FastAPI for better performance
"""

from fastapi import FastAPI, Request, Form, File, UploadFile, HTTPException, Depends
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import asyncio
import uvicorn
from typing import Optional, List, Dict, Any
import json
import sys
import os
from pathlib import Path

# Import existing modules
sys.path.append(str(Path(__file__).parent))
from config import *
from embodiment.sensors import get_sensor_data, check_tcp_ports, get_ai_pipeline_status
from cognition.llm_interface import get_available_models, sort_models_by_size, run_chat_completion
from cognition.bicameral_mind import bicameral_chat_direct
from expression.text_to_speech import list_voice_ids, get_categorized_voices, generate_tts_audio, speak_text
from memory.usage_logger import load_model_stats, get_recent_errors, parse_log_file, get_available_log_dates
from helpers.text_processing_helper import TextProcessingHelper
from embodiment.rainbow_interface import start_system_processing, stop_system_processing
from embodiment.pipeline_orchestrator import get_pipeline_orchestrator

class FastAPIApp:
    """FastAPI application wrapper that mimics Flask app behavior"""
    
    def __init__(self):
        self.app = FastAPI(
            title="RoverSeer Neural Interface",
            description="Advanced AI companion with neural personality management",
            version="2.0.0",
            docs_url="/api/docs",
            redoc_url="/api/redoc"
        )
        
        # Add CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Setup templates and static files
        self.templates = Jinja2Templates(directory="roverseer_api_app/templates")
        self.app.mount("/static", StaticFiles(directory="roverseer_api_app/static"), name="static")
        
        # Store routes for Flask-like behavior
        self.routes = {}
        
    def route(self, path: str, methods: List[str] = ["GET"]):
        """Decorator that mimics Flask's @app.route"""
        def decorator(func):
            async def async_wrapper(*args, **kwargs):
                # Convert sync function to async if needed
                import inspect
                if inspect.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)
            
            # Register route with FastAPI
            if "GET" in methods:
                self.app.get(path)(async_wrapper)
            if "POST" in methods:
                self.app.post(path)(async_wrapper)
            if "PUT" in methods:
                self.app.put(path)(async_wrapper)
            if "DELETE" in methods:
                self.app.delete(path)(async_wrapper)
                
            return func
        return decorator
    
    def run(self, host="0.0.0.0", port=5000, debug=False):
        """Run the FastAPI app with uvicorn"""
        uvicorn.run(
            self.app,
            host=host,
            port=port,
            reload=debug,
            access_log=True
        )

# Create the FastAPI app instance
fastapi_app = FastAPIApp()

# Flask compatibility functions
def jsonify(data):
    """Convert dict to JSONResponse for Flask compatibility"""
    return JSONResponse(content=data)

def render_template(template_name: str, **context):
    """Render template with context - FastAPI version"""
    # This will be handled by the route functions
    return {"template": template_name, "context": context}

def request_form_compat(request: Request):
    """Request form compatibility layer"""
    class FormCompat:
        def __init__(self, request):
            self._request = request
            self._form_data = None
            
        async def _load_form(self):
            if self._form_data is None:
                self._form_data = await self._request.form()
            return self._form_data
            
        def get(self, key, default=None):
            if self._form_data is None:
                # For sync compatibility, we'll need to handle this differently
                return default
            return self._form_data.get(key, default)
    
    return FormCompat(request)

def redirect(url: str):
    """Redirect response for Flask compatibility"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=url)

def send_file(filepath: str):
    """Send file response for Flask compatibility"""
    return FileResponse(filepath)

# Global app instance for Flask compatibility
app = fastapi_app

# Create route registration functions that match Flask patterns
def create_chat_routes():
    """Create chat-related routes"""
    
    @app.route("/chat", methods=["POST"])
    async def chat_route(request: Request):
        """Main chat endpoint - FastAPI version"""
        try:
            form_data = await request.form()
            
            # Extract form data
            action = form_data.get("action")
            user_input = form_data.get("user_input", "").strip()
            model = form_data.get("model", DEFAULT_MODEL)
            voice = form_data.get("voice", DEFAULT_VOICE)
            output_type = form_data.get("output_type", "text")
            system_message = form_data.get("system", "")
            
            if not user_input:
                return jsonify({"error": "No input provided"})
            
            # Process based on model
            if model.lower() == "penphinmind":
                reply = bicameral_chat_direct(user_input, system_message, voice)
            else:
                # Build message history
                messages = []
                for user_msg, ai_reply, _ in history[-MAX_HISTORY:]:
                    messages.append({"role": "user", "content": user_msg})
                    messages.append({"role": "assistant", "content": ai_reply})
                messages.append({"role": "user", "content": user_input})
                
                reply = run_chat_completion(model, messages, system_message, voice_id=voice)
            
            # Handle different output types
            if output_type == "speak":
                speak_text(reply, voice)
                return jsonify({
                    "reply": reply,
                    "model": model,
                    "voice": voice
                })
            elif output_type == "audio_file":
                import uuid
                tmp_audio = f"{uuid.uuid4().hex}.wav"
                output_file, _ = generate_tts_audio(reply, voice, f"/tmp/{tmp_audio}")
                return jsonify({
                    "reply": reply,
                    "audio_url": f"/static/{tmp_audio}",
                    "model": model
                })
            else:
                return jsonify({
                    "reply": reply,
                    "model": model
                })
                
        except Exception as e:
            return jsonify({"error": str(e)})
    
    @app.route("/chat_ajax", methods=["POST"])
    async def chat_ajax_route(request: Request):
        """AJAX chat endpoint - FastAPI version"""
        try:
            form_data = await request.form()
            
            user_input = form_data.get("user_input", "").strip()
            model = form_data.get("model", DEFAULT_MODEL)
            voice = form_data.get("voice", DEFAULT_VOICE)
            output_type = form_data.get("output_type", "text")
            use_personality = form_data.get("use_personality") == "true"
            system_message = form_data.get("system_message", "")
            
            if not user_input:
                return jsonify({"error": "No input provided"})
            
            # Get orchestrator for pipeline management
            orchestrator = get_pipeline_orchestrator()
            
            # Start processing
            start_system_processing('B', is_text_input=True, 
                                  has_voice_output=(output_type in ["audio_file", "speak"]))
            
            try:
                # Process with personality or model
                if use_personality:
                    from cognition.personality import get_personality_manager
                    personality_manager = get_personality_manager()
                    
                    if personality_manager.current_personality:
                        context = {"time_of_day": "day", "user_name": None}
                        system_msg = personality_manager.current_personality.generate_system_message(context)
                    else:
                        system_msg = system_message or "You are RoverSeer, a helpful assistant."
                else:
                    system_msg = system_message or "You are RoverSeer, a helpful assistant."
                
                # Build messages
                messages = []
                for user_msg, ai_reply, _ in history[-MAX_HISTORY:]:
                    messages.append({"role": "user", "content": user_msg})
                    messages.append({"role": "assistant", "content": ai_reply})
                messages.append({"role": "user", "content": user_input})
                
                # Get AI response
                reply = run_chat_completion(model, messages, system_msg, voice_id=voice)
                
                # Handle output type
                if output_type == "speak":
                    speak_text(reply, voice)
                    orchestrator.complete_pipeline_flow()
                    return jsonify({
                        "reply": reply,
                        "ai_pipeline": get_ai_pipeline_status()
                    })
                    
                elif output_type == "audio_file":
                    import uuid
                    tmp_audio = f"{uuid.uuid4().hex}.wav"
                    output_file, _ = generate_tts_audio(reply, voice, f"/tmp/{tmp_audio}")
                    orchestrator.complete_pipeline_flow()
                    return jsonify({
                        "reply": reply,
                        "audio_url": f"/static/{tmp_audio}",
                        "ai_pipeline": get_ai_pipeline_status()
                    })
                    
                else:
                    orchestrator.complete_pipeline_flow()
                    return jsonify({
                        "reply": reply,
                        "ai_pipeline": get_ai_pipeline_status()
                    })
                    
            except Exception as e:
                orchestrator.complete_pipeline_flow()
                return jsonify({"error": str(e)})
                
        except Exception as e:
            return jsonify({"error": str(e)})

def create_system_routes():
    """Create system-related routes"""
    
    @app.route("/", methods=["GET", "POST"])
    async def home_route(request: Request):
        """Home page route - FastAPI version"""
        if request.method == "POST":
            # Handle POST requests (chat, clear context, etc.)
            form_data = await request.form()
            action = form_data.get("action")
            
            if action == "clear_context":
                history.clear()
                from fastapi.responses import RedirectResponse
                return RedirectResponse(url="/", status_code=302)
            elif action == "chat":
                # Delegate to chat processing
                return await chat_route(request)
        
        # GET request - render home page
        statuses = check_tcp_ports()
        models = sort_models_by_size(get_available_models())
        voices = list_voice_ids()
        categorized_voices = get_categorized_voices()
        
        # Get personalities
        from cognition.personality import get_personality_manager
        personality_manager = get_personality_manager()
        personalities_list = personality_manager.list_personalities()
        current_personality = None
        
        if personality_manager.current_personality:
            current_personality = personality_manager.current_personality.to_dict()
        
        # Process models for display
        models_with_display_names = []
        for model in models:
            short_name = TextProcessingHelper.extract_short_model_name(model)
            models_with_display_names.append({
                'full_name': model,
                'display_name': short_name
            })
        
        # Get sensor data
        sensor_data = get_sensor_data()
        ai_pipeline = get_ai_pipeline_status()
        
        context = {
            "request": request,
            "statuses": statuses,
            "models": models_with_display_names,
            "voices": voices,
            "categorized_voices": categorized_voices,
            "personalities": personalities_list,
            "current_personality": current_personality,
            "sensor_data": sensor_data,
            "ai_pipeline": ai_pipeline,
            "history": history,
            "selected_model": DEFAULT_MODEL,
            "selected_voice": DEFAULT_VOICE
        }
        
        return fastapi_app.templates.TemplateResponse("home.html", context)
    
    @app.route("/status_only", methods=["GET"])
    async def status_only_route():
        """Status endpoint for AJAX updates"""
        return jsonify({
            "tcp_status": check_tcp_ports(),
            "sensor_data": get_sensor_data(),
            "ai_pipeline": get_ai_pipeline_status()
        })

def create_api_routes():
    """Create API routes"""
    
    @app.route("/models", methods=["GET"])
    async def models_route():
        """Get available models"""
        try:
            models = get_available_models()
            sorted_models = sort_models_by_size(models)
            
            # Add model metadata
            models_info = []
            for model in sorted_models:
                models_info.append({
                    "name": model,
                    "display_name": TextProcessingHelper.extract_short_model_name(model)
                })
            
            return jsonify({
                "models": models_info,
                "count": len(models_info)
            })
            
        except Exception as e:
            return jsonify({"error": str(e)})
    
    @app.route("/health", methods=["GET"])
    async def health_route():
        """Health check endpoint"""
        return jsonify({
            "status": "healthy",
            "service": "RoverSeer FastAPI",
            "version": "2.0.0"
        })

# Initialize all routes
def setup_fastapi_routes():
    """Setup all FastAPI routes to match Flask structure"""
    create_chat_routes()
    create_system_routes() 
    create_api_routes()

# Setup routes when module is imported
setup_fastapi_routes()

# Export the FastAPI app for external use
def get_fastapi_app():
    """Get the FastAPI application instance"""
    return fastapi_app.app

def run_fastapi_server(host="0.0.0.0", port=5000, debug=False):
    """Run the FastAPI server"""
    uvicorn.run(
        fastapi_app.app,
        host=host,
        port=port,
        reload=debug,
        access_log=True,
        log_level="info" if debug else "warning"
    ) 