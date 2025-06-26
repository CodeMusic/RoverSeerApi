from fastapi import APIRouter, Request, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, RedirectResponse, FileResponse
from fastapi.templating import Jinja2Templates
from typing import Optional, List, Dict, Any
import requests
import json
import subprocess
import config
import os
from datetime import datetime
import logging
import asyncio

from config import history, MAX_HISTORY, DEFAULT_MODEL, DEFAULT_VOICE
from config import DebugLog  # Add DebugLog import
from embodiment.sensors import get_sensor_data, check_tcp_ports, get_ai_pipeline_status
from cognition.llm_interface import get_available_models, sort_models_by_size
from cognition.bicameral_mind import bicameral_chat_direct
from cognition.llm_interface import run_chat_completion
from expression.text_to_speech import list_voice_ids, get_categorized_voices
from memory.usage_logger import (
    load_model_stats as get_model_stats, get_recent_errors, parse_log_file, 
    get_available_log_dates as get_available_dates, group_logs_by_conversation, get_conversation_summary
)
from helpers.text_processing_helper import TextProcessingHelper
from embodiment.rainbow_interface import start_system_processing, stop_system_processing, get_rainbow_driver
from embodiment.display_manager import scroll_text_on_display
from embodiment.pipeline_orchestrator import get_pipeline_orchestrator, SystemState

router = APIRouter()
templates = Jinja2Templates(directory="templates")


def categorize_models_by_param_size(models_with_display_names):
    """Categorize models by parameter size for organized dropdown"""
    categories = {
        'Small Models (≤ 2B)': [],
        'Medium Models (3B - 8B)': [],
        'Large Models (≥ 13B)': [],
        'Special Models': []
    }
    
    for model in models_with_display_names:
        model_name = model['full_name'].lower()
        
        # Special models category
        if 'penphinmind' in model_name:
            categories['Special Models'].append(model)
        # Small models
        elif any(size in model_name for size in ['0.5b', '1b', '1.1b', '1.5b', '1.6b', '1.7b', '2b']):
            categories['Small Models (≤ 2B)'].append(model)
        # Medium models  
        elif any(size in model_name for size in ['3b', '4b', '7b', '8b']):
            categories['Medium Models (3B - 8B)'].append(model)
        # Large models
        elif any(size in model_name for size in ['13b', '14b', '16b', '20b', '30b', '34b', '40b', '70b', '180b']):
            categories['Large Models (≥ 13B)'].append(model)
        else:
            # Default to medium for unknown sizes
            categories['Medium Models (3B - 8B)'].append(model)
    
    # Remove empty categories
    return {k: v for k, v in categories.items() if v}


@router.get('/docs/')
async def redirect_docs():
    return RedirectResponse("/api/docs", status_code=302)


@router.get("/tmp_static/{filename}")
async def serve_temp_static(filename: str):
    """Serve temporary audio files from /tmp/ directory"""
    return FileResponse(f"/tmp/{filename}")


@router.get("/", response_class=None)
@router.post("/", response_class=None) 
async def home(request: Request, action: Optional[str] = Form(None)):
    """Main home page with system status and chat interface"""
    statuses = check_tcp_ports()
    models = get_available_models()
    models = sort_models_by_size(models)
    voices = list_voice_ids()  # Keep for compatibility but won't use directly
    categorized_voices = get_categorized_voices()  # Get categorized voice data for web interface
    model_stats = get_model_stats()
    
    # Get current personality and all personalities
    from cognition.personality import get_personality_manager
    personality_manager = get_personality_manager()
    current_personality = None
    personality_model = None
    personality_voice = None
    
    # Get all personalities for dropdown
    personalities_list = personality_manager.list_personalities()
    
    if personality_manager.current_personality:
        current_personality = personality_manager.current_personality.to_dict()
        personality_model = personality_manager.current_personality.model_preference
        personality_voice = personality_manager.current_personality.voice_id
    
    # Process models to include short names for display
    models_with_display_names = []
    for model in models:
        short_name = TextProcessingHelper.extract_short_model_name(model)
        models_with_display_names.append({
            'full_name': model,
            'display_name': short_name
        })
    
    # Categorize models by parameter size for organized dropdowns
    categorized_models = categorize_models_by_param_size(models_with_display_names)
    
    sensor_data = get_sensor_data()
    
    # Set defaults based on personality or system defaults with proper model index sync
    # Check if we have a valid selected_model_index and available models
    if (hasattr(config, 'selected_model_index') and 
        hasattr(config, 'available_models') and 
        config.available_models and 
        0 <= config.selected_model_index < len(config.available_models)):
        # Use the indexed model from config
        selected_model = config.available_models[config.selected_model_index]
        print(f"🔧 Using indexed model: {selected_model} (index {config.selected_model_index})")
    else:
        # Validate personality model preference exists in available models
        if personality_model and personality_model in models:
            selected_model = personality_model
            print(f"🔧 Using valid personality model: {selected_model}")
        else:
            selected_model = DEFAULT_MODEL
            if personality_model:
                print(f"🔧 Personality model '{personality_model}' not available, using default: {selected_model}")
            else:
                print(f"🔧 No personality model set, using default: {selected_model}")
        
        # Update config to match this selection if possible
        if selected_model in models:
            try:
                config.selected_model_index = models.index(selected_model)
                config.available_models = models
                print(f"🔧 Updated config index to {config.selected_model_index} for {selected_model}")
            except (ValueError, AttributeError):
                print(f"🔧 Could not update config index for {selected_model}")
    
    selected_voice = personality_voice or DEFAULT_VOICE
    
    reply_text = ""
    audio_url = None
    
    # Handle POST actions
    if request.method == "POST" and action:
        if action == "clear_context":
            history.clear()
            # Generate new conversation thread ID when context is cleared
            from config import generate_new_conversation_thread
            generate_new_conversation_thread()
            return RedirectResponse("/", status_code=302)
        elif action == "chat":
            # This will be handled by chat routes
            pass
    
    # Template context
    context = {
        "request": request,
        "statuses": statuses,
        "models": models_with_display_names,
        "categorized_models": categorized_models,
        "voices": voices,
        "categorized_voices": categorized_voices,
        "personalities": personalities_list,
        "current_personality": current_personality,
        "sensor_data": sensor_data,
        "ai_pipeline": get_ai_pipeline_status(),
        "history": history,
        "selected_model": selected_model,
        "selected_voice": selected_voice
    }
    
    return templates.TemplateResponse("home.html", context)


@router.get("/status_only")
async def status_only():
    """Return just the status data as JSON for AJAX updates"""
    return JSONResponse(content={
        "tcp_status": check_tcp_ports(),
        "sensor_data": get_sensor_data(),
        "ai_pipeline": get_ai_pipeline_status()
    })


@router.get('/system')
async def system(request: Request, 
                log_type: Optional[str] = None,
                date: Optional[str] = None,
                sort_by: str = "fastest",
                view: str = "logs",
                model: Optional[str] = None):
    """Display system page with top performing models and system viewer, plus model information"""
    selected_log_type = log_type
    selected_date = date
    view_mode = view
    model_name = model
    
    log_entries = []
    available_dates = []
    all_models_data = None
    model_detail = None
    
    # Get voices and current settings for settings view
    voices = list_voice_ids()
    categorized_voices = get_categorized_voices()  # Add categorized voice data for settings
    current_voice = DEFAULT_VOICE
    current_concurrent = config.MAX_CONCURRENT_REQUESTS
    
    # Get streaming TTS status
    from cognition.llm_interface import is_streaming_tts_enabled
    streaming_tts_enabled = is_streaming_tts_enabled()
    
    # Get available models for personality creation
    available_models = get_available_models()
    
    # Process models to include short names for display
    models_with_display_names = []
    for model in available_models:
        short_name = TextProcessingHelper.extract_short_model_name(model)
        models_with_display_names.append({
            'full_name': model,
            'display_name': short_name
        })
    
    # Categorize models by parameter size for organized dropdowns  
    categorized_models = categorize_models_by_param_size(models_with_display_names)
    
    # Handle different view modes
    if view_mode == 'models':
        # Get comprehensive model data for "see all models" view
        try:
            res = requests.get("http://roverseer.local:5000/models")
            if res.ok:
                all_models_data = res.json().get('models', [])
        except Exception as e:
            print(f"Error fetching models data: {e}")
            all_models_data = []
    
    elif view_mode == 'model_detail' and model_name:
        # Get detailed info for specific model
        try:
            res = requests.get("http://roverseer.local:5000/models")
            if res.ok:
                models_data = res.json().get('models', [])
                model_detail = next((m for m in models_data if m['name'] == model_name), None)
        except Exception as e:
            print(f"Error fetching model details: {e}")
            model_detail = None
    
    elif view_mode == 'training_activity':
        # Handle training activity view - redirect to dedicated training activity page
        from helpers.logging_helper import LoggingHelper
        try:
            # Get recent training activity logs
            training_logs = LoggingHelper.get_training_activity_logs(limit=500)
            
            # Get unique voice identities for filtering
            voice_identities = list(set(log.get("voice_identity", "Unknown") for log in training_logs))
            voice_identities.sort()
            
            return render_template('training_activity.html', 
                                 logs=training_logs,
                                 voice_identities=voice_identities,
                                 title="🧠 Neural Voice Training Activity Monitor")
        except Exception as e:
            error_msg = f"Error loading training activity: {str(e)}"
            print(error_msg)
            return f"Error: {error_msg}", 500
    
    elif view_mode == 'logs' and selected_log_type:
        # Original log viewing functionality
        available_dates = get_available_dates(selected_log_type)
        
        if not selected_date and available_dates:
            selected_date = available_dates[0]
        
        if selected_date:
            log_entries = parse_log_file(selected_log_type, date=selected_date)
    
    # Get top performing models from stats (always needed for sidebar)
    model_stats = get_model_stats()
    top_models = []
    for model, stats in model_stats.items():
        if stats.get('run_count', 0) > 0:
            # Extract short model name for display
            short_name = TextProcessingHelper.extract_short_model_name(model)
            top_models.append((
                model,  # Keep full name for data
                short_name,  # Short name for display
                stats['average_runtime'], 
                stats['run_count']
            ))
    
    # Sort based on selected criteria
    if sort_by == 'usage':
        top_models.sort(key=lambda x: x[3], reverse=True)  # Sort by run_count (most used first)
        sort_label = "Most Used Models"
        sort_metric = "uses"
    else:  # fastest
        top_models.sort(key=lambda x: x[2])  # Sort by runtime (fastest first)
        sort_label = "Fastest Models" 
        sort_metric = "time"
    
    top_models = top_models[:10]  # Top 10
    
    # Available log types
    log_types = [
        {"id": "conversations", "name": "Conversations", "icon": "💬"},
        {"id": "llm_usage", "name": "LLM Usage", "icon": "🤖"},
        {"id": "asr_usage", "name": "ASR Usage", "icon": "🎤"},
        {"id": "tts_usage", "name": "TTS Usage", "icon": "🔊"},
        {"id": "penphin_mind", "name": "PenphinMind", "icon": "🧠"},
        {"id": "errors", "name": "Error Logs", "icon": "⚠️"}
    ]
    
    return render_template('system.html', 
                          top_models=top_models, 
                          log_types=log_types, 
                          selected_log_type=selected_log_type,
                          selected_date=selected_date,
                          available_dates=available_dates,
                          log_entries=log_entries,
                          sort_by=sort_by,
                          sort_label=sort_label,
                          sort_metric=sort_metric,
                          view_mode=view_mode,
                          all_models_data=all_models_data,
                          model_detail=model_detail,
                          model_name=model_name,
                          extract_short_model_name=TextProcessingHelper.extract_short_model_name,
                          voices=voices,
                          categorized_voices=categorized_voices,  # Add categorized voices
                          current_voice=current_voice,
                          current_concurrent=current_concurrent,
                          available_models=available_models,
                          categorized_models=categorized_models,
                          streaming_tts_enabled=streaming_tts_enabled)  # Add streaming TTS status


@router.get('/models')
async def list_models():
    """List available Ollama models with comprehensive metadata from Ollama API"""
    try:
        # Get models from Ollama using the dynamic URL configuration
        from config import get_ollama_base_url
        ollama_url, is_remote = get_ollama_base_url()
        
        res = requests.get(f"{ollama_url}/api/tags")
        if not res.ok:
            return JSONResponse(content={"error": f"Failed to fetch models from {'remote' if is_remote else 'local'} Ollama server"}), 500
            
        tags_data = res.json()
        models_info = []
        
        # Process each model
        for model in tags_data.get("models", []):
            model_name = model.get("name", "")
            model_size_bytes = model.get("size", 0)
            details = model.get("details", {})
            
            # Get all available metadata from Ollama API
            param_size = details.get("parameter_size", "unknown")
            quantization = details.get("quantization_level", "unknown")
            
            # Convert parameter size to friendly format
            friendly_size = "unknown"
            if param_size != "unknown":
                if param_size.endswith("M"):
                    num = float(param_size[:-1])
                    friendly_size = f"{int(num)} million" if num == int(num) else f"{num} million"
                elif param_size.endswith("B"):
                    num = float(param_size[:-1])
                    friendly_size = f"{int(num)} billion" if num == int(num) else f"{num} billion"
                else:
                    friendly_size = param_size
            
            # Add model size in GB if available
            size_gb = model_size_bytes / (1024 * 1024 * 1024) if model_size_bytes > 0 else 0
            
            # Extract all metadata from Ollama API
            model_info = {
                "name": model_name,
                "model": model_name,  # Same as name for compatibility
                "size": param_size,
                "parameters": friendly_size,
                "parameter_size": param_size,
                "quantization": quantization,
                "quantization_level": quantization,
                "size_gb": round(size_gb, 2),
                "modified_at": model.get("modified_at", ""),
                "last_modified": model.get("modified_at", ""),  # Alias for compatibility
                "parent_model": details.get("parent_model", ""),
                "format": details.get("format", ""),
                "family": details.get("family", ""),
                "families": details.get("families", [])
            }
            
            models_info.append(model_info)
        
        # Load runtime statistics
        model_stats = get_model_stats()
        
        # Add runtime info to each model
        for model in models_info:
            model_name = model["name"]
            if model_name in model_stats:
                model["average_runtime"] = round(model_stats[model_name]["average_runtime"], 2)
                model["run_count"] = model_stats[model_name]["run_count"]
                model["last_runtime"] = round(model_stats[model_name]["last_runtime"], 2)
            else:
                model["average_runtime"] = None
                model["run_count"] = 0
                model["last_runtime"] = None
        
        # Sort models by parameter size using the existing function
        model_names = [m["name"] for m in models_info]
        
        # Explicitly add PenphinMind to the list for model selection
        if "PenphinMind" not in model_names:
            model_names.insert(0, "PenphinMind")
            
        sorted_names = sort_models_by_size(model_names, models_info)
        
        # Reorder models_info based on sorted names
        sorted_models = []
        for name in sorted_names:
            # Special handling for PenphinMind
            if name == "PenphinMind" and not any(m["name"] == "PenphinMind" for m in models_info):
                sorted_models.append({
                    "name": "PenphinMind",
                    "model": "PenphinMind",
                    "size": "Bicameral",
                    "parameters": "3 specialized models",
                    "parameter_size": "Bicameral",
                    "quantization": "Multiple",
                    "quantization_level": "Multiple",
                    "size_gb": 0,
                    "modified_at": "",
                    "last_modified": "",
                    "parent_model": "",
                    "format": "Bicameral",
                    "family": "Bicameral",
                    "families": ["Bicameral"],
                    "average_runtime": None,
                    "run_count": 0,
                    "last_runtime": None
                })
            else:
                for model in models_info:
                    if model["name"] == name:
                        sorted_models.append(model)
                        break
        
        return JSONResponse(content={
            "models": sorted_models,
            "count": len(sorted_models)
        })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)})


@router.post('/system/command')
async def system_command(request: Request):
    """Handle system commands like restarting services and containers"""
    form = await request.form()
    command_type = form.get('type')
    target = form.get('target')
    
    if command_type == 'service':
        try:
            subprocess.run(['sudo', 'systemctl', 'restart', target], check=True)
            return JSONResponse(content={"status": "success", "message": f"Service {target} restarted successfully"})
        except subprocess.CalledProcessError as e:
            return JSONResponse(content={"status": "error", "message": f"Failed to restart service: {str(e)}"}), 500
            
    elif command_type == 'container':
        try:
            subprocess.run(['docker', 'restart', target], check=True)
            return JSONResponse(content={"status": "success", "message": f"Container {target} restarted successfully"})
        except subprocess.CalledProcessError as e:
            return JSONResponse(content={"status": "error", "message": f"Failed to restart container: {str(e)}"}), 500
    
    return JSONResponse(content={"status": "error", "message": "Invalid command type"}), 400

@router.get('/system/containers')
async def list_containers():
    """Get list of running Docker containers"""
    try:
        result = subprocess.run(['docker', 'ps', '--format', '{{.Names}}'], 
                              capture_output=True, text=True, check=True)
        containers = result.stdout.strip().split('\n')
        return JSONResponse(content={"status": "success", "containers": containers})
    except subprocess.CalledProcessError as e:
        return JSONResponse(content={"status": "error", "message": f"Failed to list containers: {str(e)}"}), 500 

@router.post('/system/settings')
async def update_settings(request: Request):
    """Update system settings like default voice"""
    form = await request.form()
    setting_type = form.get('type')
    
    if setting_type == 'voice':
        new_voice = form.get('value')
        if new_voice:
            from config import update_default_voice
            if update_default_voice(new_voice):
                return JSONResponse(content={"status": "success", "message": f"Default voice updated to {new_voice}"})
            else:
                return JSONResponse(content={"status": "error", "message": "Failed to update voice"}), 500
                
    elif setting_type == 'concurrent_requests':
        try:
            max_requests = int(form.get('value'))
            if max_requests < 1 or max_requests > 10:
                return JSONResponse(content={"status": "error", "message": "Value must be between 1 and 10"}), 400
                
            from config import update_max_concurrent_requests
            if update_max_concurrent_requests(max_requests):
                return JSONResponse(content={"status": "success", "message": f"Maximum concurrent requests updated to {max_requests}"})
            else:
                return JSONResponse(content={"status": "error", "message": "Failed to update concurrent requests"}), 500
        except ValueError:
            return JSONResponse(content={"status": "error", "message": "Invalid number"}), 400
    
    return JSONResponse(content={"status": "error", "message": "Invalid setting type"}), 400


@router.get('/system/personalities')
async def get_personalities():
    """Get list of available personalities"""
    from cognition.personality import get_personality_manager
    
    personality_manager = get_personality_manager()
    personalities = personality_manager.list_personalities()
    current = personality_manager.current_personality.name if personality_manager.current_personality else None
    
    return JSONResponse(content={
        "status": "success",
        "personalities": personalities,
        "current": current
    })


@router.post('/system/personality/switch')
async def switch_personality(request: Request):
    """Switch to a different personality"""
    form = await request.form()
    personality_name = form.get('personality')
    
    if not personality_name:
        return JSONResponse(content={"status": "error", "message": "Missing personality name"}), 400
    
    from cognition.personality import get_personality_manager
    personality_manager = get_personality_manager()
    
    if personality_manager.switch_to(personality_name):
        personality = personality_manager.current_personality
        
        # Update the DEFAULT_VOICE to match the personality's voice
        if personality.voice_id:
            from config import update_default_voice
            update_default_voice(personality.voice_id)
        
        # Update the device's selected model index if personality has a model preference
        if personality.model_preference:
            # Find the index of this model in available models with validation
            try:
                # Get fresh model list in case models changed
                available_models = get_available_models()
                if personality.model_preference in available_models:
                    config.selected_model_index = available_models.index(personality.model_preference)
                    config.available_models = available_models  # Update config
                    print(f"✅ Updated model index to {config.selected_model_index} for {personality.model_preference}")
                else:
                    print(f"⚠️ Personality's model {personality.model_preference} not found in available models")
                    # Use personality manager's intelligent fallback selection
                    fallback_model = personality_manager.choose_model(512, DEFAULT_MODEL)
                    if fallback_model in available_models:
                        config.selected_model_index = available_models.index(fallback_model)
                        config.available_models = available_models
                        print(f"🎲 Using intelligent fallback model: {fallback_model} at index {config.selected_model_index}")
                    else:
                        # Last resort - use first available model
                        config.selected_model_index = 0
                        config.available_models = available_models
                        print(f"🔧 Last resort - using first model at index 0: {available_models[0] if available_models else 'none'}")
            except (ValueError, AttributeError) as e:
                print(f"❌ Error updating model index: {e}")
                config.selected_model_index = 0  # Safe fallback
        else:
            # Personality has no model preference - use intelligent selection
            try:
                available_models = get_available_models()
                # Use personality manager's intelligent fallback selection
                fallback_model = personality_manager.choose_model(512, DEFAULT_MODEL)
                if fallback_model in available_models:
                    config.selected_model_index = available_models.index(fallback_model)
                    config.available_models = available_models
                    print(f"🎲 Personality has no preference, using intelligent selection: {fallback_model} at index {config.selected_model_index}")
                else:
                    # Fallback to first available model if intelligent selection fails
                    config.selected_model_index = 0
                    config.available_models = available_models
                    print(f"🔧 Intelligent selection failed, using first model at index 0: {available_models[0] if available_models else 'none'}")
            except Exception as e:
                print(f"❌ Error setting intelligent model: {e}")
                config.selected_model_index = 0
        
        # Trigger display update to show the new personality name
        rainbow_driver = get_rainbow_driver()
        
        if rainbow_driver:
            # Show the personality change with emoji and name
            display_text = f"{personality.avatar_emoji} {personality.name}"
            print(f"🎯 Displaying personality switch: {display_text}")
            scroll_text_on_display(display_text, scroll_speed=0.15)
        
        return JSONResponse(content={
            "status": "success",
            "message": f"Switched to {personality.name}",
            "voice": personality.voice_id,
            "model": config.available_models[config.selected_model_index] if hasattr(config, 'available_models') and hasattr(config, 'selected_model_index') and config.available_models and 0 <= config.selected_model_index < len(config.available_models) else personality.model_preference,
            "intro": personality.get_intro_message()
        })
    else:
        return JSONResponse(content={"status": "error", "message": f"Personality '{personality_name}' not found"}), 404


@router.get('/system/personality/current')
async def get_current_personality():
    """Get details about the current personality"""
    from cognition.personality import get_personality_manager
    
    personality_manager = get_personality_manager()
    if personality_manager.current_personality:
        return JSONResponse(content={
            "status": "success",
            "personality": personality_manager.current_personality.to_dict()
        })
    else:
        return JSONResponse(content={
            "status": "success",
            "personality": None
        })


@router.post('/system/personality/create')
async def create_personality(request: Request):
    """Create a new custom personality"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'voice_id', 'system_message']
    for field in required_fields:
        if not data.get(field):
            return JSONResponse(content={
                "status": "error", 
                "message": f"Missing required field: {field}"
            }), 400
    
    from cognition.personality import get_personality_manager
    personality_manager = get_personality_manager()
    
    success = personality_manager.create_custom_personality(
        name=data['name'],
        voice_id=data['voice_id'],
        system_message=data['system_message'],
        model_preference=data.get('model_preference'),
        mini_model=data.get('mini_model'),
        mini_model_threshold=data.get('mini_model_threshold', 1000),
        description=data.get('description', ''),
        avatar_emoji=data.get('avatar_emoji', '🤖')
    )
    
    if success:
        return JSONResponse(content={
            "status": "success",
            "message": f"Personality '{data['name']}' created successfully"
        })
    else:
        return JSONResponse(content={
            "status": "error",
            "message": f"Personality '{data['name']}' already exists"
        }), 400


@router.post('/system/personality/delete')
async def delete_personality(request: Request):
    """Delete a custom personality"""
    data = request.get_json()
    
    if not data.get('name'):
        return JSONResponse(content={
            "status": "error",
            "message": "Missing personality name"
        }), 400
    
    from cognition.personality import get_personality_manager
    personality_manager = get_personality_manager()
    
    if personality_manager.delete_custom_personality(data['name']):
        return JSONResponse(content={
            "status": "success",
            "message": f"Personality '{data['name']}' deleted successfully"
        })
    else:
        return JSONResponse(content={
            "status": "error",
            "message": f"Cannot delete personality '{data['name']}' (either doesn't exist or is a default personality)"
        }), 400


@router.post('/system/personality/update')
async def update_personality_custom(request: Request):
    """Update an existing custom personality"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['old_name', 'name', 'voice_id', 'system_message']
    for field in required_fields:
        if not data.get(field):
            return JSONResponse(content={
                "status": "error", 
                "message": f"Missing required field: {field}"
            }), 400
    
    from cognition.personality import get_personality_manager
    personality_manager = get_personality_manager()
    
    success = personality_manager.update_custom_personality(
        old_name=data['old_name'],
        name=data['name'],
        voice_id=data['voice_id'],
        system_message=data['system_message'],
        model_preference=data.get('model_preference'),
        mini_model=data.get('mini_model'),
        mini_model_threshold=data.get('mini_model_threshold', 1000),
        description=data.get('description', ''),
        avatar_emoji=data.get('avatar_emoji', '🤖')
    )
    
    if success:
        return JSONResponse(content={
            "status": "success",
            "message": f"Personality '{data['name']}' updated successfully"
        })
    else:
        return JSONResponse(content={
            "status": "error",
            "message": f"Failed to update personality (not found, not custom, or name conflict)"
        }), 400


@router.get('/system/personality')
async def get_personality(type: Optional[str] = None):
    """Get personality text for a specific type"""
    personality_type = type
    
    if not personality_type:
        return JSONResponse(content={"status": "error", "message": "No personality type specified"}), 400
    
    # Import config functions
    import config
    
    # Handle different personality types
    if personality_type == 'default':
        personality = config.DEFAULT_PERSONALITY
    elif personality_type == 'web':
        personality = config.WEB_PERSONALITY
    elif personality_type == 'device':
        personality = config.DEVICE_PERSONALITY
    elif personality_type.startswith('voice:'):
        voice_id = personality_type[6:]  # Remove 'voice:' prefix
        personality = config.VOICE_PERSONALITIES.get(voice_id, "")
    else:
        return JSONResponse(content={"status": "error", "message": "Invalid personality type"}), 400
    
    return JSONResponse(content={"status": "success", "personality": personality})


@router.post('/system/personality')
async def update_personality(request: Request):
    """Update personality text for a specific type"""
    form = await request.form()
    personality_type = form.get('type')
    personality_text = form.get('personality')
    
    if not personality_type or not personality_text:
        return JSONResponse(content={"status": "error", "message": "Missing type or personality text"}), 400
    
    # Import config functions
    import config
    
    # Handle different personality types
    if personality_type == 'default':
        if config.update_personality('default', personality_text):
            config.DEFAULT_PERSONALITY = personality_text
            return JSONResponse(content={"status": "success", "message": "Default personality updated"})
    elif personality_type == 'web':
        if config.update_personality('web', personality_text):
            config.WEB_PERSONALITY = personality_text
            return JSONResponse(content={"status": "success", "message": "Web personality updated"})
    elif personality_type == 'device':
        if config.update_personality('device', personality_text):
            config.DEVICE_PERSONALITY = personality_text
            return JSONResponse(content={"status": "success", "message": "Device personality updated"})
    elif personality_type.startswith('voice:'):
        # Voice personalities are hardcoded and cannot be edited
        return JSONResponse(content={"status": "error", "message": "Voice-specific personalities cannot be edited"}), 400
    else:
        return JSONResponse(content={"status": "error", "message": "Invalid personality type"}), 400
    
    return JSONResponse(content={"status": "error", "message": "Failed to update personality"}), 500


# Simple personality endpoints for RoverCub compatibility
@router.get('/personalities')
async def get_personalities_simple():
    """Get list of available personalities (RoverCub compatible endpoint)"""
    return get_personalities()


@router.post('/personalities/switch')
async def switch_personality_simple(request: Request):
    """Switch to a different personality (RoverCub compatible endpoint)"""
    return switch_personality()


@router.get('/personalities/current')
async def get_current_personality_simple():
    """Get current personality (RoverCub compatible endpoint)"""
    return get_current_personality()


# Add contextual moods API endpoints
@router.get('/system/personality/{personality_name}/moods')
async def get_personality_moods(personality_name: str):
    """Get all moods for a specific personality"""
    from cognition.contextual_moods import contextual_moods
    
    try:
        moods = contextual_moods.list_personality_moods(personality_name)
        return JSONResponse(content={
            "status": "success",
            "personality": personality_name,
            "moods": moods
        })
    except Exception as e:
        return JSONResponse(content={
            "status": "error",
            "message": f"Error loading moods: {str(e)}"
        }), 500


@router.post('/system/personality/{personality_name}/moods')
async def create_personality_mood(personality_name: str, request: Request):
    """Create a new mood for a personality"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['mood_name', 'trigger_probability', 'context_triggers', 'mood_influences']
    for field in required_fields:
        if field not in data:
            return JSONResponse(content={
                "status": "error",
                "message": f"Missing required field: {field}"
            }), 400
    
    try:
        from cognition.contextual_moods import contextual_moods
        
        contextual_moods.add_mood(
            personality_name=personality_name,
            mood_name=data['mood_name'],
            trigger_probability=float(data['trigger_probability']),
            context_triggers=data['context_triggers'],
            mood_influences=data['mood_influences'],
            is_custom=True  # Always save as custom
        )
        
        contextual_moods.save_custom_moods()
        
        return JSONResponse(content={
            "status": "success",
            "message": f"Mood '{data['mood_name']}' created for {personality_name}"
        })
        
    except Exception as e:
        return JSONResponse(content={
            "status": "error",
            "message": f"Error creating mood: {str(e)}"
        }), 500


@router.put('/system/personality/{personality_name}/moods/{mood_name}')
async def update_personality_mood(personality_name: str, mood_name: str, request: Request):
    """Update an existing mood for a personality"""
    data = request.get_json()
    
    try:
        from cognition.contextual_moods import contextual_moods
        
        # Remove old mood
        if personality_name in contextual_moods.custom_moods:
            if mood_name in contextual_moods.custom_moods[personality_name]:
                del contextual_moods.custom_moods[personality_name][mood_name]
        
        # Add updated mood
        contextual_moods.add_mood(
            personality_name=personality_name,
            mood_name=data.get('mood_name', mood_name),
            trigger_probability=float(data.get('trigger_probability', 0.5)),
            context_triggers=data.get('context_triggers', []),
            mood_influences=data.get('mood_influences', []),
            is_custom=True
        )
        
        contextual_moods.save_custom_moods()
        
        return JSONResponse(content={
            "status": "success",
            "message": f"Mood '{mood_name}' updated for {personality_name}"
        })
        
    except Exception as e:
        return JSONResponse(content={
            "status": "error",
            "message": f"Error updating mood: {str(e)}"
        }), 500


@router.delete('/system/personality/{personality_name}/moods/{mood_name}')
async def delete_personality_mood(personality_name: str, mood_name: str):
    """Delete a mood from a personality"""
    try:
        from cognition.contextual_moods import contextual_moods
        
        # Only allow deletion from custom moods
        if personality_name in contextual_moods.custom_moods:
            if mood_name in contextual_moods.custom_moods[personality_name]:
                del contextual_moods.custom_moods[personality_name][mood_name]
                
                # Remove personality entry if no moods left
                if not contextual_moods.custom_moods[personality_name]:
                    del contextual_moods.custom_moods[personality_name]
                
                contextual_moods.save_custom_moods()
                
                return JSONResponse(content={
                    "status": "success",
                    "message": f"Mood '{mood_name}' deleted from {personality_name}"
                })
        
        return JSONResponse(content={
            "status": "error",
            "message": f"Mood '{mood_name}' not found or cannot be deleted"
        }), 404
        
    except Exception as e:
        return JSONResponse(content={
            "status": "error",
            "message": f"Error deleting mood: {str(e)}"
        }), 500 


@router.post('/system/reset-pipeline')
async def reset_pipeline():
    """Force reset the AI pipeline to idle state"""
    try:
        # Get the orchestrator
        from embodiment.pipeline_orchestrator import get_pipeline_orchestrator
        
        orchestrator = get_pipeline_orchestrator()
        current_state = orchestrator.get_current_state()
        
        print(f"🔧 FORCE RESET: Current state is {current_state.value}")
        
        # Force reset to idle
        previous_state = orchestrator.force_reset_to_idle()
        
        # Reset active request count
        import config
        old_count = config.active_request_count
        config.active_request_count = 0
        
        # Clear any stuck audio processes
        try:
            from expression.text_to_speech import stop_current_audio
            stop_current_audio()
        except:
            pass
            
        # Stop any LEDs
        try:
            from embodiment.led_control import stop_system_processing
            stop_system_processing()
        except:
            pass
        
        return JSONResponse(content={
            "status": "success", 
            "message": f"Pipeline reset from {current_state.value} to idle. Request count reset from {old_count} to 0.",
            "previous_state": current_state.value,
            "new_state": "idle",
            "previous_count": old_count
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline reset failed: {str(e)}")

@router.post('/system/force-reset')
async def force_reset_system():
    """Emergency system reset - clears all states and processes"""
    try:
        import config
        
        # Reset request count
        old_count = config.active_request_count
        config.active_request_count = 0
        
        # Reset recording flag
        old_recording = config.recording_in_progress
        config.recording_in_progress = False
        
        # Reset orchestrator
        from embodiment.pipeline_orchestrator import get_pipeline_orchestrator
        
        orchestrator = get_pipeline_orchestrator()
        old_state = orchestrator.get_current_state()
        previous_state = orchestrator.force_reset_to_idle()
        
        # Kill any stuck audio
        try:
            import subprocess
            subprocess.run(["pkill", "-f", "aplay"], check=False)
        except:
            pass
            
        # Stop LEDs
        try:
            from embodiment.led_control import stop_system_processing
            stop_system_processing()
        except:
            pass
        
        return JSONResponse(content={
            "status": "success",
            "message": "Emergency system reset completed",
            "reset_details": {
                "request_count": f"{old_count} → 0",
                "recording_flag": f"{old_recording} → False", 
                "orchestrator_state": f"{old_state.value} → idle"
            }
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Force reset failed: {str(e)}")


@router.post('/system/ollama/models/download')
async def download_ollama_model(request: Request):
    """Download a model from Ollama library"""
    try:
        data = request.get_json()
        model_name = data.get('model_name')
        tag = data.get('tag', 'latest')
        
        if not model_name:
            raise HTTPException(status_code=400, detail="Model name required")
            
        full_model_name = f"{model_name}:{tag}"
        
        # Start download in background
        import subprocess
        import threading
        
        def download_model():
            try:
                subprocess.run(['ollama', 'pull', full_model_name], 
                             capture_output=True, text=True, check=True)
                print(f"✅ Model {full_model_name} downloaded successfully")
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to download {full_model_name}: {e.stderr}")
        
        download_thread = threading.Thread(target=download_model)
        download_thread.daemon = True
        download_thread.start()
        
        return JSONResponse(content={
            "status": "started", 
            "message": f"Download started for {full_model_name}",
            "model": full_model_name
        })
        
    except Exception as e:
        return JSONResponse(content={
            "error": str(e)
        })
