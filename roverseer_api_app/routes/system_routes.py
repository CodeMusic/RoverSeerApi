from flask import Blueprint, request, jsonify, send_file, redirect, render_template, url_for
import requests
import json
import subprocess

from config import history, MAX_HISTORY, DEFAULT_MODEL, DEFAULT_VOICE
from embodiment.sensors import get_sensor_data, check_tcp_ports
from cognition.llm_interface import get_available_models, sort_models_by_size
from cognition.bicameral_mind import bicameral_chat_direct
from cognition.llm_interface import run_chat_completion
from expression.text_to_speech import list_voice_ids
from memory.usage_logger import (load_model_stats, get_available_log_dates, 
                                parse_log_file)
from utilities.text_processing import extract_short_model_name

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
    voices = list_voice_ids()
    model_stats = load_model_stats()
    
    # Process models to include short names for display
    models_with_display_names = []
    for model in models:
        short_name = extract_short_model_name(model)
        models_with_display_names.append({
            'full_name': model,
            'display_name': short_name
        })
    
    sensor_data = get_sensor_data()
    selected_model = DEFAULT_MODEL
    selected_voice = DEFAULT_VOICE
    reply_text = ""
    audio_url = None
    
    # Handle clear context action
    if request.method == 'POST' and request.form.get('action') == 'clear_context':
        history.clear()
        return redirect('/')
    
    if request.method == 'POST' and request.form.get('action') != 'clear_context':
        output_type = request.form.get('output_type')
        voice = request.form.get('voice')
        selected_voice = voice
        system = request.form.get('system')
        user_input = request.form.get('user_input')
        model = request.form.get('model')
        selected_model = model

        # Check if PenphinMind is selected
        if model.lower() == "penphinmind":
            try:
                reply_text = bicameral_chat_direct(user_input, system)
                history.append((user_input, reply_text, "PenphinMind"))
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
                if output_type == 'text':
                    reply = run_chat_completion(model, messages, system)
                    reply_text = reply
                    
                elif output_type == 'audio_file':
                    from expression.text_to_speech import generate_tts_audio
                    import uuid
                    
                    reply = run_chat_completion(model, messages, system)
                    
                    tmp_audio = f"{uuid.uuid4().hex}.wav"
                    output_file, _ = generate_tts_audio(reply, voice, f"/tmp/{tmp_audio}")
                    
                    audio_url = url_for('system.serve_static', filename=tmp_audio)
                    reply_text = reply  # Store the actual text, not a placeholder
                        
                else:  # speak
                    from expression.text_to_speech import speak_text
                    
                    reply = run_chat_completion(model, messages, system)
                    speak_text(reply, voice)
                    reply_text = reply

                history.append((user_input, reply_text, model))
            except Exception as e:
                reply_text = f"Request failed: {e}"

    return render_template('home.html', 
                          statuses=statuses, 
                          reply_text=reply_text, 
                          audio_url=audio_url, 
                          history=history, 
                          models=models_with_display_names, 
                          selected_model=selected_model, 
                          voices=voices, 
                          selected_voice=selected_voice, 
                          sensor_data=sensor_data, 
                          model_stats=model_stats)


@bp.route('/system')
def system():
    """Display system page with top performing models and system viewer, plus model information"""
    selected_log_type = request.args.get('log_type', None)
    selected_date = request.args.get('date', None)
    sort_by = request.args.get('sort_by', 'fastest')  # 'fastest' or 'usage'
    view_mode = request.args.get('view', 'logs')  # 'logs', 'models', or 'model_detail'
    model_name = request.args.get('model', None)  # For individual model details
    
    log_entries = []
    available_dates = []
    all_models_data = None
    model_detail = None
    
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
        {"id": "penphin_mind", "name": "PenphinMind", "icon": "🧠"}
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
                          extract_short_model_name=extract_short_model_name)


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