import requests
import json
import time
import threading
import re

from config import DEFAULT_MODEL, get_config_value, set_config_value
from memory.usage_logger import log_llm_usage, update_model_runtime
from expression.sound_orchestration import play_sound_async, play_ollama_tune, play_ollama_complete_tune, tune_playing
from embodiment.display_manager import scroll_text_on_display, display_timer, blink_number, clear_display
from embodiment.rainbow_interface import get_rainbow_driver
from expression.text_to_speech import generate_tts_audio, speak_text

# LLM Request timeout configuration
LLM_REQUEST_TIMEOUT = get_config_value("llm_request_timeout", 120)  # 2 minutes default
LLM_STREAMING_TIMEOUT = get_config_value("llm_streaming_timeout", 300)  # 5 minutes for streaming

def run_chat_completion(model, messages, system_message=None, skip_logging=False, voice_id=None):
    """Run a chat completion request against Ollama with display and sound feedback"""
    
    # Check if streaming TTS is enabled
    streaming_tts_enabled = get_config_value("streaming_tts_enabled", False)
    
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
        try:
            # Import here to avoid circular dependencies
            from perception.temporal_perspective import get_temporal_perspective
            from config import get_config_value
            
            # Check if we should use the new temporal perspective
            use_temporal = get_config_value("use_temporal_perspective", True)
            
            if use_temporal:
                # Use the new temporal perspective system
                temporal = get_temporal_perspective()
                
                # Only use sound effects if specified
                if get_config_value("timer_sound_effects", True):
                    # Use default sounds (already configured)
                    pass
                else:
                    # Disable sounds
                    temporal.register_sound('tick', lambda: None)
                    temporal.register_sound('tock', lambda: None)
                    temporal.register_sound('marker', lambda: None)
                
                # Configure oscillation pattern
                temporal.configure_oscillation(
                    interval=1.0,
                    marker_positions=[0],
                    double_beat_positions=[3],
                    flicker_positions=[6]
                )
                
                # Start oscillation
                temporal.start_oscillation(start_time)
                
                # Wait for stop event
                while not stop_timer.is_set():
                    # Update display
                    elapsed = int(time.time() - start_time)
                    rainbow = get_rainbow_driver()
                    if rainbow:
                        rainbow.display_number(elapsed)
                    time.sleep(0.5)
                
                # Stop oscillation
                temporal.stop_oscillation()
            else:
                # Use the traditional method
                display_timer(start_time, stop_timer, True)  # Call once, it handles its own loop
            
        except ImportError:
            # Fallback to traditional method if temporal_perspective not available
            display_timer(start_time, stop_timer, True)  # Call once, it handles its own loop
    
    timer = threading.Thread(target=timer_thread)
    timer.daemon = True
    timer.start()
    
    try:
        # Build the request
        if system_message and not any(msg.get("role") == "system" for msg in messages):
            messages.insert(0, {"role": "system", "content": system_message})
        
        # If streaming TTS is enabled and voice_id is provided, use streaming mode
        if streaming_tts_enabled and voice_id:
            return _run_streaming_chat_completion(model, messages, stop_timer, start_time, voice_id, 
                                                  skip_logging, system_message, user_prompt, current_personality)
        else:
            # Get the appropriate Ollama server URL
            ollama_url, is_remote = config.get_ollama_base_url()
            
            # Use regular non-streaming mode
            response = requests.post(
                f"{ollama_url}/api/chat",
                headers={"Content-Type": "application/json"},
                json={
                    "model": model, 
                    "messages": messages,
                    "stream": False
                },
                timeout=LLM_REQUEST_TIMEOUT
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
            
    except requests.exceptions.Timeout as e:
        stop_timer.set()
        clear_display()
        # Clear active model on error
        import config
        config.active_model = None
        print(f"[ERROR] LLM request timed out after {LLM_REQUEST_TIMEOUT} seconds for model {model}")
        raise Exception(f"LLM request timed out. The model '{model}' took longer than {LLM_REQUEST_TIMEOUT} seconds to respond. Try using a smaller/faster model or increase the timeout in settings.")
    except requests.exceptions.ConnectionError as e:
        stop_timer.set()
        clear_display()
        # Clear active model on error
        import config
        config.active_model = None
        print(f"[ERROR] Cannot connect to Ollama server: {e}")
        raise Exception("Cannot connect to Ollama server. Please ensure Ollama is running and accessible.")
    except Exception as e:
        stop_timer.set()
        # Clear display on error
        clear_display()
        # Clear active model on error
        import config
        config.active_model = None
        raise e


def _run_streaming_chat_completion(model, messages, stop_timer, start_time, voice_id, 
                                 skip_logging, system_message, user_prompt, current_personality):
    """Streaming version of chat completion with sentence-by-sentence TTS"""
    
    # Prepare TTS thread control
    tts_queue = []
    tts_queue_lock = threading.Lock()
    tts_thread_active = threading.Event()
    tts_thread_active.set()
    stop_tts = threading.Event()
    
    # Snippet counter - psychology term: "episodic_fragments_expressed"
    episodic_fragments_expressed = 0
    fragment_lock = threading.Lock()
    
    # Start TTS processing thread
    def tts_processor():
        nonlocal episodic_fragments_expressed
        while tts_thread_active.is_set() and not stop_tts.is_set():
            current_sentence = None
            with tts_queue_lock:
                if tts_queue:
                    current_sentence = tts_queue.pop(0)
            
            if current_sentence:
                try:
                    # Increment fragment counter
                    with fragment_lock:
                        episodic_fragments_expressed += 1
                        current_fragment = episodic_fragments_expressed
                    
                    # Play streaming snippet tone before speaking (except for the first one)
                    if current_fragment > 1:
                        from expression.sound_orchestration import play_streaming_snippet_tone
                        play_streaming_snippet_tone()
                        time.sleep(0.1)  # Brief pause after tone
                    
                    # Display snippet count using blink pattern
                    from embodiment.display_manager import blink_number
                    
                    # Blink the fragment number briefly and asynchronously
                    def blink_fragment_count():
                        blink_number(current_fragment, duration=1, blink_speed=0.2)
                    
                    # Run blink in background thread
                    import threading
                    blink_thread = threading.Thread(target=blink_fragment_count)
                    blink_thread.daemon = True
                    blink_thread.start()
                    
                    # Speak the sentence
                    speak_text(current_sentence, voice_id)
                    
                    print(f"📢 Episodic fragment {current_fragment} expressed: {current_sentence[:50]}{'...' if len(current_sentence) > 50 else ''}")
                    
                except Exception as e:
                    print(f"Error in TTS processing: {e}")
            
            # Small sleep to prevent CPU hogging
            time.sleep(0.1)
    
    tts_thread = threading.Thread(target=tts_processor)
    tts_thread.daemon = True
    tts_thread.start()
    
    try:
        # Get the appropriate Ollama server URL
        import config
        ollama_url, is_remote = config.get_ollama_base_url()
        
        # Start streaming request
        response = requests.post(
            f"{ollama_url}/api/chat",
            headers={"Content-Type": "application/json"},
            json={
                "model": model, 
                "messages": messages,
                "stream": True
            },
            stream=True,
            timeout=LLM_STREAMING_TIMEOUT
        )
        response.raise_for_status()
        
        # Process streaming response
        full_response = ""
        current_sentence_buffer = ""
        sentence_pattern = re.compile(r'([.!?])\s+')
        
        for line in response.iter_lines():
            if line:
                try:
                    data = json.loads(line.decode('utf-8'))
                    
                    # Debug log the streaming chunk
                    if get_config_value("debug_logging", False):
                        print(f"Streaming chunk: {data}")
                    
                    if 'message' in data and 'content' in data['message']:
                        chunk = data['message']['content']
                        
                        # Only add to full_response once
                        full_response += chunk
                        current_sentence_buffer += chunk
                        
                        # Check if we have a complete sentence
                        if sentence_pattern.search(current_sentence_buffer):
                            # Split into sentences
                            sentences = sentence_pattern.split(current_sentence_buffer)
                            # Reorganize into proper sentences with punctuation
                            complete_sentences = []
                            for i in range(0, len(sentences) - 1, 2):
                                if i + 1 < len(sentences):
                                    complete_sentences.append(sentences[i] + sentences[i + 1])
                            
                            # Keep the last incomplete part
                            if len(sentences) % 2 == 1:
                                current_sentence_buffer = sentences[-1]
                            else:
                                current_sentence_buffer = ""
                            
                            # Add complete sentences to TTS queue
                            with tts_queue_lock:
                                for sentence in complete_sentences:
                                    if sentence.strip():
                                        tts_queue.append(sentence.strip())
                
                except Exception as e:
                    print(f"Error processing streaming chunk: {e}")
        
        # Process any remaining text
        if current_sentence_buffer.strip():
            with tts_queue_lock:
                tts_queue.append(current_sentence_buffer.strip())
        
        # Wait for TTS queue to finish
        while True:
            with tts_queue_lock:
                if not tts_queue:
                    break
            time.sleep(0.1)
        
        # Stop TTS thread
        tts_thread_active.clear()
        
        # Log final fragment count
        with fragment_lock:
            final_fragment_count = episodic_fragments_expressed
        
        print(f"🎯 Streaming synthesis complete. Total episodic fragments expressed: {final_fragment_count}")
        
        # Stop timer and calculate elapsed time
        stop_timer.set()
        elapsed_time = time.time() - start_time
        
        # Only log if not part of PenphinMind
        if not skip_logging:
            # Get current personality name and mood data
            personality_name = None
            mood_data = None
            tagged_result = full_response  # Default to untagged result
            
            try:
                from cognition.personality import get_personality_manager
                personality_manager = get_personality_manager()
                if personality_manager.current_personality:
                    personality_name = personality_manager.current_personality.name
                    # Get mood data from last system message generation
                    mood_data = personality_manager.current_personality.get_last_mood_data()
                    
                    # Add personality and mood tags to the response
                    tagged_result = personality_manager.current_personality.add_personality_mood_tags_to_response(full_response)
                    
            except Exception as e:
                print(f"Warning: Could not get personality/mood data for logging: {e}")
                
            # Enhanced logging with mood data and fragment count
            log_llm_usage(model, system_message or "Default system message", user_prompt, 
                         f"[STREAMING:{final_fragment_count} fragments] {tagged_result}", 
                         elapsed_time, voice_id, personality_name, mood_data)
            
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
        import config
        config.active_model = None
        
        # IMPORTANT: Return the full response so the UI gets the text
        return full_response
        
    except requests.exceptions.Timeout as e:
        # Stop TTS thread
        stop_tts.set()
        tts_thread_active.clear()
        
        stop_timer.set()
        clear_display()
        # Clear active model on error
        import config
        config.active_model = None
        print(f"[ERROR] Streaming LLM request timed out after {LLM_STREAMING_TIMEOUT} seconds for model {model}")
        raise Exception(f"Streaming LLM request timed out. The model '{model}' took longer than {LLM_STREAMING_TIMEOUT} seconds to respond. Try using a smaller/faster model or increase the timeout in settings.")
    except requests.exceptions.ConnectionError as e:
        # Stop TTS thread
        stop_tts.set()
        tts_thread_active.clear()
        
        stop_timer.set()
        clear_display()
        # Clear active model on error
        import config
        config.active_model = None
        print(f"[ERROR] Cannot connect to Ollama server: {e}")
        raise Exception("Cannot connect to Ollama server. Please ensure Ollama is running and accessible.")
    except Exception as e:
        # Stop TTS thread
        stop_tts.set()
        tts_thread_active.clear()
        
        stop_timer.set()
        # Clear display on error
        clear_display()
        # Clear active model on error
        import config
        config.active_model = None
        raise e


def toggle_streaming_tts():
    """Toggle the streaming TTS feature"""
    current_value = get_config_value("streaming_tts_enabled", False)
    new_value = not current_value
    success = set_config_value("streaming_tts_enabled", new_value)
    return success, new_value


def is_streaming_tts_enabled():
    """Check if streaming TTS is enabled"""
    return get_config_value("streaming_tts_enabled", False)


def test_ollama_connection():
    """Test if Ollama is running and accessible (tries remote first, then local)"""
    import config
    
    # Try remote first if enabled
    if config.REMOTE_OLLAMA_ENABLED:
        try:
            remote_url = f"http://{config.REMOTE_OLLAMA_HOST}:{config.REMOTE_OLLAMA_PORT}"
            response = requests.get(f"{remote_url}/api/tags", timeout=config.OLLAMA_CONNECTION_TIMEOUT)
            if response.status_code == 200:
                print(f"🌐 Remote Ollama server ({config.REMOTE_OLLAMA_HOST}) is accessible")
                return True
        except Exception as e:
            print(f"🔄 Remote Ollama server unavailable: {e}")
    
    # Try local server
    try:
        local_url = f"http://{config.LOCAL_OLLAMA_HOST}:{config.LOCAL_OLLAMA_PORT}"
        response = requests.get(f"{local_url}/api/tags", timeout=2)
        if response.status_code == 200:
            print(f"🏠 Local Ollama server is accessible")
            return True
    except Exception as e:
        print(f"❌ Local Ollama server unavailable: {e}")
    
    return False


def get_available_models():
    """Get list of available models from Ollama (tries remote first, then local)"""
    import config
    
    # Try to get models from the available server (remote first, then local)
    ollama_url, is_remote = config.get_ollama_base_url()
    
    try:
        response = requests.get(f"{ollama_url}/api/tags")
        if response.ok:
            tags_data = response.json()
            models = [model.get("name") for model in tags_data.get("models", []) if model.get("name")]
            server_type = "remote" if is_remote else "local"
            print(f"📋 Fetched {len(models)} models from {server_type} Ollama server")
            return sorted(models)
    except Exception as e:
        print(f"Error fetching models from {'remote' if is_remote else 'local'} server: {e}")
        
        # If remote failed, try local as fallback
        if is_remote:
            try:
                local_url = f"http://{config.LOCAL_OLLAMA_HOST}:{config.LOCAL_OLLAMA_PORT}"
                response = requests.get(f"{local_url}/api/tags")
                if response.ok:
                    tags_data = response.json()
                    models = [model.get("name") for model in tags_data.get("models", []) if model.get("name")]
                    print(f"📋 Fallback: Fetched {len(models)} models from local Ollama server")
                    return sorted(models)
            except Exception as e2:
                print(f"Error fetching models from local server: {e2}")
    
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