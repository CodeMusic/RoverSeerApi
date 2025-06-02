from flask import Blueprint, request, jsonify, send_file, redirect, render_template, url_for
import requests
import json
import subprocess
import config
import os

from config import history, MAX_HISTORY, DEFAULT_MODEL, DEFAULT_VOICE
from embodiment.sensors import get_sensor_data, check_tcp_ports, get_ai_pipeline_status
from cognition.llm_interface import get_available_models, sort_models_by_size
from cognition.bicameral_mind import bicameral_chat_direct
from cognition.llm_interface import run_chat_completion
from expression.text_to_speech import list_voice_ids
from memory.usage_logger import (load_model_stats, get_available_log_dates, 
                                parse_log_file)
from utilities.text_processing import extract_short_model_name
from embodiment.rainbow_interface import start_system_processing, stop_system_processing

bp = Blueprint('system', __name__)


@bp.route('/docs/')
def redirect_docs():
    return redirect("/docs", code=302)


@bp.route("/static/<filename>")
def serve_static(filename):
    return send_file(f"/tmp/{filename}")


@bp.route("/", methods=['GET', 'POST'])
def home():
    """Main home page with system status and chat interface"""
    statuses = check_tcp_ports()
    models = get_available_models()
    models = sort_models_by_size(models)
    voices = list_voice_ids()  # Keep for compatibility but won't use directly
    model_stats = load_model_stats()
    
    # Get current personality and all personalities
    from cognition.personality import get_personality_manager
    personality_manager = get_personality_manager()
    current_personality = None
    personality_model = None
    personality_voice = None
    
    # Get all personalities for dropdown
    personalities_list = personality_manager.list_personalities()
    
    if personality_manager.current_personality:
        current_personality = personality_manager.current_personality
        personality_model = current_personality.model_preference
        personality_voice = current_personality.voice_id
    
    # Process models to include short names for display
    models_with_display_names = []
    for model in models:
        short_name = extract_short_model_name(model)
        models_with_display_names.append({
            'full_name': model,
            'display_name': short_name
        })
    
    sensor_data = get_sensor_data()
    
    # Set defaults based on personality or system defaults
    selected_model = personality_model or DEFAULT_MODEL
    selected_voice = personality_voice or DEFAULT_VOICE
    
    reply_text = ""
    audio_url = None
    
    # Handle clear context action
    if request.method == 'POST' and request.form.get('action') == 'clear_context':
        history.clear()
        return redirect('/')
    
    if request.method == 'POST' and request.form.get('action') == 'chat':
        output_type = request.form.get('output_type')
        voice = request.form.get('voice')
        
        # Validate voice - use default if empty
        if not voice:
            voice = DEFAULT_VOICE
            print(f"Warning: Empty voice provided, using default: {voice}")
            
        selected_voice = voice
        system = request.form.get('system')
        user_input = request.form.get('user_input')
        model = request.form.get('model')
        selected_model = model
        
        # Debug logging
        print(f"Chat request - User: {user_input}, Model: {model}, Output: {output_type}")

        # Check if PenphinMind is selected
        if model.lower() == "penphinmind":
            try:
                reply_text = bicameral_chat_direct(user_input, system)
                # Get personality info for history
                personality_info = "🧠 PenphinMind"
                if personality_manager.current_personality:
                    personality_info = f"{personality_manager.current_personality.avatar_emoji} {personality_manager.current_personality.name}"
                history.append((user_input, reply_text, personality_info))
            except Exception as e:
                reply_text = f"Bicameral processing error: {e}"
        else:
            # Normal flow
            messages = []
            for user_msg, ai_reply, _ in history[-MAX_HISTORY:]:
                messages.append({"role": "user", "content": user_msg})
                messages.append({"role": "assistant", "content": ai_reply})
            messages.append({"role": "user", "content": user_input})

            try:
                # Get system message from personality or use provided one
                if not system and personality_manager.current_personality:
                    # Generate context-aware system message from current personality
                    context = {
                        "time_of_day": "day",  # Could be enhanced with actual time
                        "user_name": None,  # Could be enhanced if we track users
                    }
                    system_message = personality_manager.current_personality.generate_system_message(context)
                    print(f"DEBUG: Using personality system message for {personality_manager.current_personality.name}: {system_message[:100]}...")
                else:
                    # Use provided system message or default
                    system_message = system or "You are RoverSeer, a helpful assistant."
                    print(f"DEBUG: Using {'provided' if system else 'default'} system message: {system_message[:100]}...")

                if output_type == 'text':
                    # For text-only
                    reply = run_chat_completion(model, messages, system_message, voice_id=voice)
                    reply_text = reply
                    # Stop LED for text-only output
                    stop_system_processing()
                    
                elif output_type == 'audio_file':
                    from expression.text_to_speech import generate_tts_audio
                    import uuid
                    
                    # For audio output
                    reply = run_chat_completion(model, messages, system_message, voice_id=voice)
                    
                    # Transition to TTS stage
                    stop_system_processing()
                    start_system_processing('C')
                    
                    tmp_audio = f"{uuid.uuid4().hex}.wav"
                    output_file, _ = generate_tts_audio(reply, voice, f"/tmp/{tmp_audio}")
                    
                    # Stop LED after TTS
                    stop_system_processing()
                    
                    audio_url = url_for('system.serve_static', filename=tmp_audio)
                    reply_text = reply
                        
                else:  # speak
                    from expression.text_to_speech import speak_text
                    
                    # For spoken output
                    reply = run_chat_completion(model, messages, system_message, voice_id=voice)
                    
                    # Transition to TTS stage
                    stop_system_processing()
                    start_system_processing('C')
                    
                    speak_text(reply, voice)
                    
                    # Note: speak_text handles the aplay stage internally
                    reply_text = reply

                # Get personality info for history
                personality_info = model
                if personality_manager.current_personality:
                    personality_info = f"{personality_manager.current_personality.avatar_emoji} {personality_manager.current_personality.name}"
                history.append((user_input, reply_text, personality_info))
            except Exception as e:
                reply_text = f"Request failed: {e}"

    return render_template('home.html', 
                          statuses=statuses, 
                          reply_text=reply_text, 
                          audio_url=audio_url, 
                          history=history, 
                          models=models_with_display_names, 
                          selected_model=selected_model, 
                          voices=voices,  # Keep for backward compatibility
                          selected_voice=selected_voice, 
                          sensor_data=sensor_data, 
                          model_stats=model_stats,
                          ai_pipeline=get_ai_pipeline_status(),
                          current_personality=current_personality,
                          personalities=personalities_list)  # Add personalities list


@bp.route("/status_only", methods=['GET'])
def status_only():
    """Return just the status data as JSON for AJAX updates"""
    return jsonify({
        "tcp_status": check_tcp_ports(),
        "sensor_data": get_sensor_data(),
        "ai_pipeline": get_ai_pipeline_status()
    })


@bp.route("/chat_ajax", methods=['POST'])
def chat_ajax():
    """AJAX endpoint for chat requests that returns JSON"""
    # Check if we've reached the max concurrent requests
    
    # Count active requests (including button recording)
    active_count = config.active_request_count
    if config.recording_in_progress:
        active_count += 1
    
    if active_count >= config.MAX_CONCURRENT_REQUESTS:
        return jsonify({
            "error": f"RoverSeer has reached the maximum concurrent requests limit ({config.MAX_CONCURRENT_REQUESTS}). Please wait a moment and try again.",
            "ai_pipeline": get_ai_pipeline_status()
        }), 429  # 429 Too Many Requests
    
    # Increment active request count
    config.active_request_count += 1
    
    output_type = request.form.get('output_type')
    voice = request.form.get('voice')
    system = request.form.get('system')  # May be None now
    user_input = request.form.get('user_input')
    model = request.form.get('model')
    
    # Check if we need to switch personality based on voice
    from cognition.personality import get_personality_manager
    personality_manager = get_personality_manager()
    
    # Find personality by voice and switch if needed
    if voice:
        print(f"DEBUG: Looking for personality with voice {voice}")
        for personality in personality_manager.personalities.values():
            if personality.voice_id == voice:
                print(f"DEBUG: Found personality {personality.name} for voice {voice}")
                if not personality_manager.current_personality or personality_manager.current_personality.name != personality.name:
                    print(f"DEBUG: Switching to personality {personality.name}")
                    personality_manager.switch_to(personality.name)
                    # Update DEFAULT_VOICE to match
                    from config import update_default_voice
                    update_default_voice(voice)
                else:
                    print(f"DEBUG: Already using personality {personality.name}")
                break
        else:
            print(f"DEBUG: No personality found for voice {voice}")
    
    # Validate voice - use default if empty
    if not voice:
        voice = DEFAULT_VOICE
        print(f"Warning: Empty voice provided, using default: {voice}")
    
    if not user_input:
        config.active_request_count -= 1  # Decrement on early return
        return jsonify({"error": "No input provided"}), 400
    
    # Debug logging
    print(f"AJAX Chat request - User: {user_input}, Model: {model}, Output: {output_type}")
    
    reply_text = ""
    audio_url = None
    error = None
    
    try:
        # Start LLM processing LED
        start_system_processing('B')
        
        # Check if PenphinMind is selected
        if model.lower() == "penphinmind":
            # PenphinMind uses its own system messages, pass user's system if provided
            reply_text = bicameral_chat_direct(user_input, system)
            # Get personality info for history
            personality_info = "🧠 PenphinMind"
            if personality_manager.current_personality:
                personality_info = f"{personality_manager.current_personality.avatar_emoji} {personality_manager.current_personality.name}"
            history.append((user_input, reply_text, personality_info))
        else:
            # Normal flow
            messages = []
            for user_msg, ai_reply, _ in history[-MAX_HISTORY:]:
                messages.append({"role": "user", "content": user_msg})
                messages.append({"role": "assistant", "content": ai_reply})
            messages.append({"role": "user", "content": user_input})

            try:
                # Get system message from personality or use provided one
                if not system and personality_manager.current_personality:
                    # Generate context-aware system message from current personality
                    context = {
                        "time_of_day": "day",  # Could be enhanced with actual time
                        "user_name": None,  # Could be enhanced if we track users
                    }
                    system_message = personality_manager.current_personality.generate_system_message(context)
                    print(f"DEBUG: Using personality system message for {personality_manager.current_personality.name}: {system_message[:100]}...")
                else:
                    # Use provided system message or default
                    system_message = system or "You are RoverSeer, a helpful assistant."
                    print(f"DEBUG: Using {'provided' if system else 'default'} system message: {system_message[:100]}...")

                if output_type == 'text':
                    # For text-only
                    reply = run_chat_completion(model, messages, system_message, voice_id=voice)
                    reply_text = reply
                    # Stop LED for text-only output
                    stop_system_processing()
                    
                elif output_type == 'audio_file':
                    from expression.text_to_speech import generate_tts_audio
                    import uuid
                    
                    # For audio output
                    reply = run_chat_completion(model, messages, system_message, voice_id=voice)
                    
                    # Transition to TTS stage
                    stop_system_processing()
                    start_system_processing('C')
                    
                    tmp_audio = f"{uuid.uuid4().hex}.wav"
                    output_file, _ = generate_tts_audio(reply, voice, f"/tmp/{tmp_audio}")
                    
                    # Stop LED after TTS
                    stop_system_processing()
                    
                    audio_url = url_for('system.serve_static', filename=tmp_audio)
                    reply_text = reply
                        
                else:  # speak
                    from expression.text_to_speech import speak_text
                    
                    # For spoken output
                    reply = run_chat_completion(model, messages, system_message, voice_id=voice)
                    
                    # Transition to TTS stage
                    stop_system_processing()
                    start_system_processing('C')
                    
                    speak_text(reply, voice)
                    
                    # Note: speak_text handles the aplay stage internally
                    reply_text = reply

                # Get personality info for history
                personality_info = model
                if personality_manager.current_personality:
                    personality_info = f"{personality_manager.current_personality.avatar_emoji} {personality_manager.current_personality.name}"
                history.append((user_input, reply_text, personality_info))
            except Exception as e:
                reply_text = f"Request failed: {e}"
            
    except Exception as e:
        error = str(e)
        reply_text = f"Request failed: {e}"
        # Make sure to stop LED on error
        try:
            stop_system_processing()
        except:
            pass
    finally:
        # Always decrement active request count
        config.active_request_count -= 1
    
    # Get updated AI pipeline status
    ai_pipeline = get_ai_pipeline_status()
    
    return jsonify({
        "reply": reply_text,
        "audio_url": audio_url,
        "model": model,
        "error": error,
        "ai_pipeline": ai_pipeline
    })


@bp.route('/system')
def system():
    """Display system page with top performing models and system viewer, plus model information"""
    selected_log_type = request.args.get('log_type', None)
    selected_date = request.args.get('date', None)
    sort_by = request.args.get('sort_by', 'fastest')  # 'fastest' or 'usage'
    view_mode = request.args.get('view', 'logs')  # 'logs', 'models', 'model_detail', 'commands', or 'settings'
    model_name = request.args.get('model', None)  # For individual model details
    
    log_entries = []
    available_dates = []
    all_models_data = None
    model_detail = None
    
    # Get voices and current settings for settings view
    voices = list_voice_ids()
    current_voice = DEFAULT_VOICE
    current_concurrent = config.MAX_CONCURRENT_REQUESTS
    
    # Get available models for personality creation
    available_models = get_available_models()
    
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
    
    elif view_mode == 'logs' and selected_log_type:
        # Original log viewing functionality
        available_dates = get_available_log_dates(selected_log_type)
        
        if not selected_date and available_dates:
            selected_date = available_dates[0]
        
        if selected_date:
            log_entries = parse_log_file(selected_log_type, date=selected_date)
    
    # Get top performing models from stats (always needed for sidebar)
    model_stats = load_model_stats()
    top_models = []
    for model, stats in model_stats.items():
        if stats.get('run_count', 0) > 0:
            # Extract short model name for display
            short_name = extract_short_model_name(model)
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
                          extract_short_model_name=extract_short_model_name,
                          voices=voices,
                          current_voice=current_voice,
                          current_concurrent=current_concurrent,
                          available_models=available_models)  # Add available models


@bp.route('/models', methods=['GET'])
def list_models():
    """List available Ollama models with comprehensive metadata from Ollama API"""
    try:
        # Get models from Ollama
        res = requests.get("http://roverseer.local:11434/api/tags")
        if not res.ok:
            return jsonify({"error": "Failed to fetch models from Ollama"}), 500
            
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
        model_stats = load_model_stats()
        
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
        
        # Sort models by parameter size
        model_names = [m["name"] for m in models_info]
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
        
        return jsonify({
            "models": sorted_models,
            "count": len(sorted_models)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500 


@bp.route('/system/command', methods=['POST'])
def system_command():
    """Handle system commands like restarting services and containers"""
    command_type = request.form.get('type')
    target = request.form.get('target')
    
    if command_type == 'service':
        try:
            subprocess.run(['sudo', 'systemctl', 'restart', target], check=True)
            return jsonify({"status": "success", "message": f"Service {target} restarted successfully"})
        except subprocess.CalledProcessError as e:
            return jsonify({"status": "error", "message": f"Failed to restart service: {str(e)}"}), 500
            
    elif command_type == 'container':
        try:
            subprocess.run(['docker', 'restart', target], check=True)
            return jsonify({"status": "success", "message": f"Container {target} restarted successfully"})
        except subprocess.CalledProcessError as e:
            return jsonify({"status": "error", "message": f"Failed to restart container: {str(e)}"}), 500
    
    return jsonify({"status": "error", "message": "Invalid command type"}), 400

@bp.route('/system/containers', methods=['GET'])
def list_containers():
    """Get list of running Docker containers"""
    try:
        result = subprocess.run(['docker', 'ps', '--format', '{{.Names}}'], 
                              capture_output=True, text=True, check=True)
        containers = result.stdout.strip().split('\n')
        return jsonify({"status": "success", "containers": containers})
    except subprocess.CalledProcessError as e:
        return jsonify({"status": "error", "message": f"Failed to list containers: {str(e)}"}), 500 

@bp.route('/system/settings', methods=['POST'])
def update_settings():
    """Update system settings like default voice"""
    setting_type = request.form.get('type')
    
    if setting_type == 'voice':
        new_voice = request.form.get('value')
        if new_voice:
            from config import update_default_voice
            if update_default_voice(new_voice):
                return jsonify({"status": "success", "message": f"Default voice updated to {new_voice}"})
            else:
                return jsonify({"status": "error", "message": "Failed to update voice"}), 500
                
    elif setting_type == 'concurrent_requests':
        try:
            max_requests = int(request.form.get('value'))
            if max_requests < 1 or max_requests > 10:
                return jsonify({"status": "error", "message": "Value must be between 1 and 10"}), 400
                
            from config import update_max_concurrent_requests
            if update_max_concurrent_requests(max_requests):
                return jsonify({"status": "success", "message": f"Maximum concurrent requests updated to {max_requests}"})
            else:
                return jsonify({"status": "error", "message": "Failed to update concurrent requests"}), 500
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid number"}), 400
    
    return jsonify({"status": "error", "message": "Invalid setting type"}), 400


@bp.route('/system/personalities', methods=['GET'])
def get_personalities():
    """Get list of available personalities"""
    from cognition.personality import get_personality_manager
    
    personality_manager = get_personality_manager()
    personalities = personality_manager.list_personalities()
    current = personality_manager.current_personality.name if personality_manager.current_personality else None
    
    return jsonify({
        "status": "success",
        "personalities": personalities,
        "current": current
    })


@bp.route('/system/personality/switch', methods=['POST'])
def switch_personality():
    """Switch to a different personality"""
    personality_name = request.form.get('personality')
    
    if not personality_name:
        return jsonify({"status": "error", "message": "Missing personality name"}), 400
    
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
            # Find the index of this model in available models
            try:
                model_index = config.available_models.index(personality.model_preference)
                config.selected_model_index = model_index
                print(f"Updated device model index to {model_index} for model {personality.model_preference}")
            except ValueError:
                print(f"Personality's preferred model {personality.model_preference} not found in available models")
        
        return jsonify({
            "status": "success",
            "message": f"Switched to {personality.name}",
            "voice": personality.voice_id,
            "model": personality.model_preference,
            "intro": personality.get_intro_message()
        })
    else:
        return jsonify({"status": "error", "message": f"Personality '{personality_name}' not found"}), 404


@bp.route('/system/personality/current', methods=['GET'])
def get_current_personality():
    """Get details about the current personality"""
    from cognition.personality import get_personality_manager
    
    personality_manager = get_personality_manager()
    if personality_manager.current_personality:
        return jsonify({
            "status": "success",
            "personality": personality_manager.current_personality.to_dict()
        })
    else:
        return jsonify({
            "status": "success",
            "personality": None
        })


@bp.route('/system/personality/create', methods=['POST'])
def create_personality():
    """Create a new custom personality"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'voice_id', 'system_message']
    for field in required_fields:
        if not data.get(field):
            return jsonify({
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
        description=data.get('description', ''),
        avatar_emoji=data.get('avatar_emoji', '🤖')
    )
    
    if success:
        return jsonify({
            "status": "success",
            "message": f"Personality '{data['name']}' created successfully"
        })
    else:
        return jsonify({
            "status": "error",
            "message": f"Personality '{data['name']}' already exists"
        }), 400


@bp.route('/system/personality/delete', methods=['POST'])
def delete_personality():
    """Delete a custom personality"""
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({
            "status": "error",
            "message": "Missing personality name"
        }), 400
    
    from cognition.personality import get_personality_manager
    personality_manager = get_personality_manager()
    
    if personality_manager.delete_custom_personality(data['name']):
        return jsonify({
            "status": "success",
            "message": f"Personality '{data['name']}' deleted successfully"
        })
    else:
        return jsonify({
            "status": "error",
            "message": f"Cannot delete personality '{data['name']}' (either doesn't exist or is a default personality)"
        }), 400


@bp.route('/system/personality/update', methods=['POST'])
def update_personality_custom():
    """Update an existing custom personality"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['old_name', 'name', 'voice_id', 'system_message']
    for field in required_fields:
        if not data.get(field):
            return jsonify({
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
        description=data.get('description', ''),
        avatar_emoji=data.get('avatar_emoji', '🤖')
    )
    
    if success:
        return jsonify({
            "status": "success",
            "message": f"Personality '{data['name']}' updated successfully"
        })
    else:
        return jsonify({
            "status": "error",
            "message": f"Failed to update personality (not found, not custom, or name conflict)"
        }), 400


@bp.route('/system/personality', methods=['GET'])
def get_personality():
    """Get personality text for a specific type"""
    personality_type = request.args.get('type')
    
    if not personality_type:
        return jsonify({"status": "error", "message": "No personality type specified"}), 400
    
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
        return jsonify({"status": "error", "message": "Invalid personality type"}), 400
    
    return jsonify({"status": "success", "personality": personality})


@bp.route('/system/personality', methods=['POST'])
def update_personality():
    """Update personality text for a specific type"""
    personality_type = request.form.get('type')
    personality_text = request.form.get('personality')
    
    if not personality_type or not personality_text:
        return jsonify({"status": "error", "message": "Missing type or personality text"}), 400
    
    # Import config functions
    import config
    
    # Handle different personality types
    if personality_type == 'default':
        if config.update_personality('default', personality_text):
            config.DEFAULT_PERSONALITY = personality_text
            return jsonify({"status": "success", "message": "Default personality updated"})
    elif personality_type == 'web':
        if config.update_personality('web', personality_text):
            config.WEB_PERSONALITY = personality_text
            return jsonify({"status": "success", "message": "Web personality updated"})
    elif personality_type == 'device':
        if config.update_personality('device', personality_text):
            config.DEVICE_PERSONALITY = personality_text
            return jsonify({"status": "success", "message": "Device personality updated"})
    elif personality_type.startswith('voice:'):
        # Voice personalities are hardcoded and cannot be edited
        return jsonify({"status": "error", "message": "Voice-specific personalities cannot be edited"}), 400
    else:
        return jsonify({"status": "error", "message": "Invalid personality type"}), 400
    
    return jsonify({"status": "error", "message": "Failed to update personality"}), 500 