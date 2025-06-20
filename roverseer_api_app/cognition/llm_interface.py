import requests
import json
import time
import threading

from config import DEFAULT_MODEL
from memory.usage_logger import log_llm_usage, update_model_runtime
from expression.sound_orchestration import play_sound_async, play_ollama_tune, play_ollama_complete_tune, tune_playing
from embodiment.display_manager import scroll_text_on_display, display_timer, blink_number, clear_display


def run_chat_completion(model, messages, system_message=None, skip_logging=False, voice_id=None):
    """Run a chat completion request against Ollama with display and sound feedback"""
    
    # Set the active model
    import config
    config.active_model = model
    
    # Play tune and set up display
    play_sound_async(play_ollama_tune, model)
    
    # Start timer and display handling
    start_time = time.time()
    stop_timer = threading.Event()
    
    # Extract model name (before the colon if present)
    model_display_name = model.split(':')[0] if ':' in model else model
    
    if skip_logging:  # hack for PenphinMind to show different name
        model_display_name = "PenphinMind"
    
    # Check if we have a personality to display instead
    personality_display_name = None
    current_personality = None
    try:
        from cognition.personality import get_personality_manager
        personality_manager = get_personality_manager()
        if personality_manager.current_personality:
            current_personality = personality_manager.current_personality
            # Use personality name with emoji for display
            personality_display_name = f"{current_personality.avatar_emoji} {current_personality.name}"
    except:
        pass
    
    # Extract user prompt from last message
    user_prompt = ""
    if messages and messages[-1].get("role") == "user":
        user_prompt = messages[-1].get("content", "")
    
    # Set up display timer
    display_name = personality_display_name if personality_display_name else model_display_name
    
    # Start thinking timer thread
    def timer_thread():
        while not stop_timer.is_set():
            display_timer(start_time, stop_timer)
    
    timer = threading.Thread(target=timer_thread)
    timer.daemon = True
    timer.start()
    
    try:
        # Build the request
        if system_message and not any(msg.get("role") == "system" for msg in messages):
            messages.insert(0, {"role": "system", "content": system_message})

        response = requests.post(
            "http://localhost:11434/api/chat",
            headers={"Content-Type": "application/json"},
            json={
                "model": model, 
                "messages": messages,
                "stream": False
            }
        )
        response.raise_for_status()
        
        # Debug: Check what we actually got from Ollama
        if not response.text.strip():
            raise Exception(f"Ollama returned empty response for model {model}")
        
        try:
            response_data = response.json()
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON response from Ollama for model {model}. Response: {response.text[:200]}...")
        
        # Check if response has expected structure
        if "message" not in response_data:
            raise Exception(f"Unexpected response structure from Ollama for model {model}. Got: {response_data}")
        
        if "content" not in response_data["message"]:
            raise Exception(f"Missing content in Ollama response for model {model}. Message: {response_data['message']}")
            
        result = response_data["message"]["content"]
        
        # Stop timer and calculate elapsed time
        stop_timer.set()
        elapsed_time = time.time() - start_time
        
        # Only log if not part of PenphinMind
        if not skip_logging:
            # Get current personality name and mood data
            personality_name = None
            mood_data = None
            tagged_result = result  # Default to untagged result
            
            try:
                from cognition.personality import get_personality_manager
                personality_manager = get_personality_manager()
                if personality_manager.current_personality:
                    personality_name = personality_manager.current_personality.name
                    # Get mood data from last system message generation
                    mood_data = personality_manager.current_personality.get_last_mood_data()
                    
                    # Add personality and mood tags to the response
                    tagged_result = personality_manager.current_personality.add_personality_mood_tags_to_response(result)
                    
            except Exception as e:
                print(f"Warning: Could not get personality/mood data for logging: {e}")
                
            # Enhanced logging with mood data
            log_llm_usage(model, system_message or "Default system message", user_prompt, tagged_result, elapsed_time, voice_id, personality_name, mood_data)
            
            # Update model runtime statistics
            update_model_runtime(model, elapsed_time)
        
        # Play victory tune
        play_sound_async(play_ollama_complete_tune)
        
        # Blink the elapsed time in a separate thread (non-blocking)
        def blink_async():
            blink_number(int(elapsed_time), duration=4, blink_speed=0.3)
        
        blink_thread = threading.Thread(target=blink_async)
        blink_thread.daemon = True
        blink_thread.start()
        
        # Clear active model when done
        config.active_model = None
        
        # Return the original result (without tags) for normal operation
        return result
        
    except Exception as e:
        stop_timer.set()
        # Clear display on error
        clear_display()
        # Clear active model on error
        import config
        config.active_model = None
        raise e


def test_ollama_connection():
    """Test if Ollama is running and accessible"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        return response.status_code == 200
    except:
        return False


def get_available_models():
    """Get list of available models from Ollama"""
    try:
        response = requests.get("http://localhost:11434/api/tags")
        if response.ok:
            tags_data = response.json()
            models = [model.get("name") for model in tags_data.get("models", []) if model.get("name")]
            return sorted(models)
    except Exception as e:
        print(f"Error fetching models: {e}")
    return []


def sort_models_by_size(models, models_info=None):
    """Sort models by parameter size, with PenphinMind first only if explicitly present"""
    def extract_size_value(param_size):
        """Extract numeric value from parameter size string like '1B', '999.89M', '1.2B'"""
        if not param_size or param_size == "unknown":
            return 999  # Put unknown at end
        
        try:
            if param_size.endswith('M'):
                return float(param_size[:-1]) / 1000  # Convert to billions
            elif param_size.endswith('B'):
                return float(param_size[:-1])
            else:
                return 999
        except:
            return 999
    
    def get_sort_key(model):
        model_lower = model.lower()
        
        # PenphinMind always first IF it's already in the list
        if 'penphinmind' in model_lower:
            return (0, 0, model)
        
        # If we have models_info, use actual parameter size
        if models_info:
            for info in models_info:
                if info['name'] == model:
                    size_value = extract_size_value(info.get('size', 'unknown'))
                    return (1, size_value, model)
        
        # Fallback: extract from model name if no info
        model_base = model.split(':')[0].lower()
        
        # Known model sizes for fallback
        known_model_sizes = {
            "llava": 7.0,
            "moondream": 1.6,
            "dolphin-mistral": 7.0,
            "deepseek-coder-v2": 16.0,
            "deepseek-v2": 16.0,
            "deepseek-llm": 7.0,
            "wizardlm2": 7.0,
            "openchat": 7.0,
            "openhermes": 7.0,
            "magicoder": 7.0,
            "meditron": 7.0,
            "medllama2": 7.0,
            "smallthinker": 3.0,
            "smollm2": 1.7,
            "tinyllama": 1.1,
        }
        
        if model_base in known_model_sizes:
            return (1, known_model_sizes[model_base], model)
        
        # Try to extract from name
        import re
        size_patterns = [
            (r'0\.5b', 0.5), (r'1b', 1.0), (r'1\.1b', 1.1), (r'1\.5b', 1.5),
            (r'1\.6b', 1.6), (r'1\.7b', 1.7), (r'2b', 2.0), (r'3b', 3.0),
            (r'4b', 4.0), (r'7b', 7.0), (r'8b', 8.0), (r'13b', 13.0),
            (r'14b', 14.0), (r'16b', 16.0), (r'20b', 20.0), (r'30b', 30.0),
            (r'34b', 34.0), (r'40b', 40.0), (r'70b', 70.0), (r'180b', 180.0)
        ]
        
        for pattern, size in size_patterns:
            if re.search(pattern, model_lower):
                return (1, size, model)
        
        # Models without clear size go to the end
        return (2, 999, model)
    
    # Don't automatically add PenphinMind - only sort what's actually provided
    # This prevents automatic selection of PenphinMind in webui when personalities should be used
    return sorted(models, key=get_sort_key) 