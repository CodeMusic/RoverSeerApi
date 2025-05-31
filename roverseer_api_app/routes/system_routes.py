from flask import Blueprint, request, jsonify, send_file, redirect, render_template_string, url_for
import requests
import json

from config import history, MAX_HISTORY, DEFAULT_MODEL, DEFAULT_VOICE
from embodiment.sensors import get_sensor_data, check_tcp_ports
from cognition.llm_interface import get_available_models, sort_models_by_size
from cognition.bicameral_mind import bicameral_chat_direct
from cognition.llm_interface import run_chat_completion
from expression.text_to_speech import list_voice_ids
from memory.usage_logger import (load_model_stats, get_available_log_dates, 
                                parse_log_file)

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
                    reply_text = "(Audio response returned)"
                        
                else:  # speak
                    from expression.text_to_speech import speak_text
                    
                    reply = run_chat_completion(model, messages, system)
                    speak_text(reply, voice)
                    reply_text = reply

                history.append((user_input, reply_text, model))
            except Exception as e:
                reply_text = f"Request failed: {e}"

    html = '''
    <html>
    <head>
        <title>RoverSeer Status</title>
        <style>
            body { font-family: Arial; background: #f4f4f4; color: #333; margin: 20px; }
            .topbar { background: #333; color: white; padding: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
            .status-container { display: flex; flex-wrap: wrap; align-items: center; gap: 15px; }
            .status-section { display: flex; flex-wrap: wrap; align-items: center; }
            .status-item { margin-right: 10px; }
            .status-link { color: #87CEEB; text-decoration: underline; }
            .status-link:hover { color: #ADD8E6; text-decoration: underline; }
            .sensor-data { background: #444; padding: 8px 12px; border-radius: 5px; display: flex; gap: 15px; }
            .sensor-item { display: flex; align-items: center; gap: 5px; }
            .refresh { cursor: pointer; font-size: 20px; }
            .chatbox { background: white; padding: 15px; border-radius: 8px; margin-top: 20px; box-shadow: 0 0 8px rgba(0,0,0,0.1); }
            textarea, input, select { width: 100%; padding: 8px; margin: 5px 0; }
            button { padding: 10px 15px; margin: 5px 0; }
            .history { background: #eef; padding: 10px; margin-top: 20px; border-radius: 8px; }
            .clear-button { background: #dc3545; color: white; border: none; cursor: pointer; }
            .clear-button:hover { background: #c82333; }
        </style>
        <script>
            function refreshPage() {
                window.location.reload();
            }
        </script>
    </head>
    <body>
        <div class="topbar">
            <div><strong>RoverSeer TCP Status</strong></div>
            <div class="status-container">
                <div class="status-section">
                    {% for name, info in statuses.items() %}
                        <span class="status-item">
                            {% if name == "Ollama" %}
                                <a href="http://roverseer.local:{{ info.port }}/api/tags" onclick="window.open(this.href, '_blank'); return false;" class="status-link">
                                    {{ info.status }} {{ name }} ({{ info.port }})
                                </a>
                            {% else %}
                                <a href="http://roverseer.local:{{ info.port }}" onclick="window.open(this.href, '_blank'); return false;" class="status-link">
                                    {{ info.status }} {{ name }} ({{ info.port }})
                                </a>
                            {% endif %}
                        </span>
                    {% endfor %}
                </div>
                <div class="sensor-data">
                    <span class="sensor-item">🌡️ HAT: {{ sensor_data.hat_temperature }}</span>
                    <span class="sensor-item">🖥️ CPU: {{ sensor_data.cpu_temperature }}</span>
                    <span class="sensor-item">🌊 {{ sensor_data.pressure }}</span>
                    <span class="sensor-item">🏔️ {{ sensor_data.altitude }}</span>
                    <span class="sensor-item">🌬️ Fan: {{ sensor_data.fan_state }}</span>
                </div>
                <span class="refresh" onclick="refreshPage()">🔄</span>
            </div>
        </div>

        <div class="chatbox">
            <h2>RoverSeer Quick Dialog</h2>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div></div>
                <button onclick="window.open('/logs', '_blank')" style="background: #4169e1; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
                    📊 View Logs
                </button>
            </div>
            <form method="post" id="chat_form">
                <input type="hidden" name="action" value="chat">
                
                <label>Output Type:</label>
                <select name="output_type">
                    <option value="speak">RoverSeer</option>
                    <option value="audio_file">Local Audio</option>
                    <option value="text">Local Text</option>
                </select>
                
                <label>System Message:</label>
                <input type="text" id="system_input" name="system" value="You are RoverSeer, a helpful assistant." />
                
                <label>Model:</label>
                <select id="model_select" name="model">
                    {% for tag in models %}
                        {% set model_info = model_stats.get(tag, {}) %}
                        {% set avg_time = model_info.get('average_runtime', None) %}
                        <option value="{{ tag }}" {% if tag == selected_model %}selected{% endif %}>
                            {{ tag }} {% if avg_time %}(Avg: {{ "%.1f"|format(avg_time) }}s){% else %}(no data yet){% endif %}
                        </option>
                    {% endfor %}
                </select>
                
                <label>Voice (if used):</label>
                <select name="voice">
                    {% for v in voices %}
                        <option value="{{ v }}" {% if v == selected_voice %}selected{% endif %}>{{ v }}</option>
                    {% endfor %}
                </select>
                
                <label>Your Message:</label>
                <textarea name="user_input">Tell me a fun science fact.</textarea>
                
                <button type="submit">Send</button>
            </form>
            
            <form method="post" style="display: inline;">
                <input type="hidden" name="action" value="clear_context">
                <button type="submit" class="clear-button">🗑️ Clear Context</button>
            </form>
            
            <h3>Response:</h3>
            <p>{{ reply_text }}</p>
            {% if audio_url %}
            <audio controls autoplay>
                <source src="{{ audio_url }}" type="audio/wav">
                Your browser does not support the audio element.
            </audio>
            {% endif %}

            <div class="history">
                <h3>Conversation History:</h3>
                {% for user, reply, model in history %}
                    <p><strong>You:</strong> {{ user }}</p>
                    <p><strong>{{ model }}:</strong> {{ reply }}</p>
                    <hr>
                {% endfor %}
            </div>
        </div>
    </body>
    </html>
    '''
    return render_template_string(html, statuses=statuses, reply_text=reply_text, 
                                 audio_url=audio_url, history=history, models=models, 
                                 selected_model=selected_model, voices=voices, 
                                 selected_voice=selected_voice, sensor_data=sensor_data, 
                                 model_stats=model_stats)


@bp.route('/logs')
def logs():
    """Display logs page with top performing models and log viewer"""
    selected_log_type = request.args.get('log_type', None)
    selected_date = request.args.get('date', None)
    log_entries = []
    available_dates = []
    
    if selected_log_type:
        available_dates = get_available_log_dates(selected_log_type)
        
        if not selected_date and available_dates:
            selected_date = available_dates[0]
        
        if selected_date:
            log_entries = parse_log_file(selected_log_type, date=selected_date)
    
    # Get top performing models from stats
    model_stats = load_model_stats()
    top_models = []
    for model, stats in model_stats.items():
        if stats.get('run_count', 0) > 0:
            top_models.append((model, stats['average_runtime']))
    top_models.sort(key=lambda x: x[1])  # Sort by runtime (fastest first)
    top_models = top_models[:10]  # Top 10
    
    # Available log types
    log_types = [
        {"id": "llm_usage", "name": "LLM Usage", "icon": "🤖"},
        {"id": "asr_usage", "name": "ASR Usage", "icon": "🎤"},
        {"id": "tts_usage", "name": "TTS Usage", "icon": "🔊"},
        {"id": "penphin_mind", "name": "PenphinMind", "icon": "🧠"}
    ]
    
    html = '''
    <html>
    <head>
        <title>RoverSeer Logs</title>
        <style>
            body { font-family: Arial; background: #f4f4f4; color: #333; margin: 20px; }
            .header { background: #333; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; }
            .container { display: flex; gap: 20px; margin-top: 20px; }
            .sidebar { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 8px rgba(0,0,0,0.1); flex: 0 0 300px; }
            .main-content { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 8px rgba(0,0,0,0.1); flex: 1; }
            .log-type { background: #f0f0f0; padding: 10px 15px; margin: 5px 0; border-radius: 5px; cursor: pointer; text-decoration: none; color: #333; display: block; transition: background 0.3s; }
            .log-type:hover { background: #e0e0e0; }
            .log-type.active { background: #4169e1; color: white; }
            .top-models { margin-bottom: 30px; }
            .model-item { background: #f8f8f8; padding: 8px; margin: 3px 0; border-radius: 3px; display: flex; justify-content: space-between; }
            .log-entry { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; white-space: pre-wrap; font-family: monospace; font-size: 12px; }
            .refresh-btn { background: #4CAF50; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; }
            .refresh-btn:hover { background: #45a049; }
            .rank { font-weight: bold; color: #666; margin-right: 10px; }
            .no-logs { color: #999; font-style: italic; text-align: center; padding: 20px; }
            .date-selector { margin: 15px 0; }
            .date-selector select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; }
            .log-info { background: #e7f3ff; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 14px; }
        </style>
        <script>
            function refreshPage() {
                window.location.reload();
            }
            function changeDate(logType) {
                var select = document.getElementById('date-select');
                var date = select.value;
                window.location.href = '/logs?log_type=' + logType + '&date=' + date;
            }
        </script>
    </head>
    <body>
        <div class="header">
            <h1>🗄️ RoverSeer Logs</h1>
            <button class="refresh-btn" onclick="refreshPage()">🔄 Refresh</button>
        </div>
        
        <div class="container">
            <div class="sidebar">
                <div class="top-models">
                    <h3>🏆 Top 10 Fastest Models</h3>
                    {% if top_models %}
                        {% for model, avg_time in top_models %}
                            <div class="model-item">
                                <span><span class="rank">#{{ loop.index }}</span>{{ model }}</span>
                                <span>{{ "%.2f"|format(avg_time) }}s</span>
                            </div>
                        {% endfor %}
                    {% else %}
                        <p class="no-logs">No performance data yet</p>
                    {% endif %}
                </div>
                
                <h3>📁 Log Types</h3>
                {% for log_type in log_types %}
                    <a href="/logs?log_type={{ log_type.id }}" 
                       class="log-type {% if selected_log_type == log_type.id %}active{% endif %}">
                        {{ log_type.icon }} {{ log_type.name }}
                    </a>
                {% endfor %}
            </div>
            
            <div class="main-content">
                {% if selected_log_type %}
                    <h2>{{ selected_log_type|replace("_", " ")|title }} Logs</h2>
                    
                    {% if selected_log_type == 'penphin_mind' %}
                        <div class="log-info">
                            ℹ️ PenphinMind logs show the complete 3-mind (2 minds + convergence) processing flow. 
                            Individual mind calls are not logged separately to keep logs clean.
                        </div>
                    {% endif %}
                    
                    {% if available_dates %}
                        <div class="date-selector">
                            <label>Select Date:</label>
                            <select id="date-select" onchange="changeDate('{{ selected_log_type }}')">
                                {% for date in available_dates %}
                                    <option value="{{ date }}" {% if date == selected_date %}selected{% endif %}>
                                        {{ date }}
                                    </option>
                                {% endfor %}
                            </select>
                        </div>
                    {% endif %}
                    
                    {% if log_entries %}
                        <div class="log-entries">
                            {% for entry in log_entries %}
                                <div class="log-entry">{{ entry }}</div>
                            {% endfor %}
                        </div>
                    {% else %}
                        <p class="no-logs">No log entries found for {{ selected_log_type|replace("_", " ") }}{% if selected_date %} on {{ selected_date }}{% endif %}</p>
                    {% endif %}
                {% else %}
                    <h2>Select a Log Type</h2>
                    <p>Click on a log type in the sidebar to view its entries.</p>
                {% endif %}
            </div>
        </div>
    </body>
    </html>
    '''
    
    return render_template_string(html, 
                                 top_models=top_models, 
                                 log_types=log_types, 
                                 selected_log_type=selected_log_type,
                                 selected_date=selected_date,
                                 available_dates=available_dates,
                                 log_entries=log_entries)


@bp.route('/models', methods=['GET'])
def list_models():
    """List available Ollama models with parameter counts, sorted by size"""
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
            
            # Get actual parameter size from API
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
            
            models_info.append({
                "name": model_name,
                "size": param_size,
                "parameters": friendly_size,
                "quantization": quantization,
                "size_gb": round(size_gb, 2),
                "last_modified": model.get("modified_at", "")
            })
        
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
                    "size": "Bicameral",
                    "parameters": "3 specialized models",
                    "size_gb": 0,
                    "last_modified": ""
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