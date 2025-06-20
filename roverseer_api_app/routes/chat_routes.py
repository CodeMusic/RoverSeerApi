from flask import Blueprint, request, jsonify, send_file
import uuid
import time
import json

from config import DEFAULT_MODEL, DEFAULT_VOICE, current_audio_process
from cognition.llm_interface import run_chat_completion
from cognition.bicameral_mind import bicameral_chat_direct
from expression.text_to_speech import generate_tts_audio, speak_text
from memory.usage_logger import log_penphin_mind_usage
from embodiment.rainbow_interface import start_system_processing, stop_system_processing
from expression.sound_orchestration import play_sound_async, play_bicameral_connection_tune

bp = Blueprint('chat', __name__)


@bp.route('/chat', methods=['POST'])
def chat_unified():
    """
    Chat with Ollama and return text, audio file, or speak on device.
    ---
    consumes:
      - application/json
    produces:
      - application/json (if output_type is 'text' or 'speak')
      - audio/wav (if output_type is 'audio_file')
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            model:
              type: string
              example: tinydolphin:1.1b
            system:
              type: string
              example: You are RoverSeer, a helpful assistant.
            voice:
              type: string
              example: en_GB-jarvis
            messages:
              type: array
              items:
                type: object
                properties:
                  role:
                    type: string
                    example: user
                  content:
                    type: string
                    example: Tell me a fun science fact.
            output_type:
              type: string
              enum: ['text', 'audio_file', 'speak']
              description: Output format - text only, audio file, or speak on device
          required:
            - messages
    responses:
      200:
        description: Response in requested format
    """
    global current_audio_process
    data = request.get_json(silent=True)
    if not data or "messages" not in data:
        return jsonify({"error": "Missing messages"}), 400

    model = data.get("model", DEFAULT_MODEL)
    messages = data.get("messages", [])
    
    # Get personality manager
    from cognition.personality import get_personality_manager
    manager = get_personality_manager()
    
    # Get system message from personality if not provided
    system_message = data.get("system")
    voice = data.get("voice")  # Don't set default yet
    
    if manager.current_personality:
        # Generate context-aware system message if not provided
        if not system_message:
            context = {
                "time_of_day": "day",  # Could be enhanced with actual time
                "user_name": None,  # Could be enhanced if we track users
            }
            system_message = manager.current_personality.generate_system_message(context)
        
        # Use personality's preferred model if not specified
        if not data.get("model") and manager.current_personality.model_preference:
            model = manager.current_personality.model_preference
        
        # Use personality's voice if not specified
        if not voice and manager.current_personality.voice_id:
            voice = manager.current_personality.voice_id
    else:
        # No personality active, use defaults
        if not system_message:
            system_message = "You are RoverSeer, a helpful assistant."
    
    # Final fallback to config default if still no voice
    if not voice:
        voice = DEFAULT_VOICE
    
    # For backward compatibility, determine output type from endpoint
    output_type = data.get("output_type")
    if not output_type:
        # Default to text output for /chat endpoint
        output_type = "text"
    
    try:
        # Start LLM processing LED - this is always text input since it's a web request
        start_system_processing('B', is_text_input=True, has_voice_output=(output_type in ["audio_file", "speak"]))
        reply = run_chat_completion(model, messages, system_message, voice_id=voice)
        
        # For text-only response, stop LEDs
        if output_type == "text":
            stop_system_processing()
            return jsonify({
                "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": model,
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": reply},
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": len(json.dumps(messages).split()),
                    "completion_tokens": len(reply.split()),
                    "total_tokens": len(json.dumps(messages).split()) + len(reply.split())
                }
            })
        
        # For audio outputs, generate TTS
        if output_type in ["audio_file", "speak"]:
            # Play voice intro before TTS (only when speaking)
            if output_type == "speak":
                from expression.text_to_speech import play_voice_intro
                play_sound_async(play_voice_intro, voice)

            # Generate WAV with Piper
            tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"
            
            # Transition to TTS stage - voice output is happening
            start_system_processing('C', is_text_input=True, has_voice_output=True)
            
            output_file, tts_processing_time = generate_tts_audio(reply, voice, tmp_wav)

            if output_type == "speak":
                # Speak on rover
                # Transition to audio playback
                start_system_processing('aplay', is_text_input=True, has_voice_output=True)
                
                # Speak on rover using Popen for interruptibility
                import subprocess
                from config import AUDIO_DEVICE
                
                current_audio_process = subprocess.Popen(
                    ["aplay", "-D", AUDIO_DEVICE, tmp_wav],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                current_audio_process.wait()
                current_audio_process = None
                
                import os
                os.remove(tmp_wav)
                
                # Stop all LEDs after playback
                stop_system_processing()

                return jsonify({
                    "status": "success",
                    "model": model,
                    "spoken_text": reply,
                    "voice_used": voice
                })
            else:  # audio_file
                # Return audio file
                return send_file(tmp_wav, mimetype="audio/wav", as_attachment=True, download_name="chat_tts.wav")

    except Exception as e:
        stop_system_processing()
        return jsonify({"error": str(e)}), 500


@bp.route('/insight', methods=['POST'])
def insight():
    """
    Quick single-prompt chat with optional system role.
    ---
    consumes:
      - application/json
    parameters:
      - in: body
        name: input
        required: true
        schema:
          type: object
          properties:
            model:
              type: string
              example: tinydolphin:1.1b
            system:
              type: string
              example: You are RoverSeer, an expert on strange animal facts.
            prompt:
              type: string
              example: Tell me a weird fact about platypuses.
          required:
            - prompt
    responses:
      200:
        description: Ollama single-turn response
    """
    data = request.get_json(silent=True)
    if not data or "prompt" not in data:
        return jsonify({"status": "error", "message": "Missing prompt"}), 400

    # Get personality manager
    from cognition.personality import get_personality_manager
    manager = get_personality_manager()
    
    model = data.get("model")
    system_message = data.get("system")
    
    # Use personality defaults if available
    if manager.current_personality:
        if not model and manager.current_personality.model_preference:
            model = manager.current_personality.model_preference
        if not system_message:
            system_message = manager.current_personality.generate_system_message({})
    
    # Final fallbacks
    if not model:
        model = DEFAULT_MODEL
    if not system_message:
        system_message = "You are RoverSeer, an insightful assistant."
    
    prompt = data["prompt"].strip()
    messages = [{"role": "user", "content": prompt}]

    try:
        reply = run_chat_completion(model, messages, system_message)
        return jsonify({"response": reply})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route('/bicameral_chat', methods=['POST'])
def bicameral_chat():
    """
    Two-agent bicameral mind system that converges perspectives, with random convergence role assignment.
    ---
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            prompt:
              type: string
              example: What is the nature of consciousness?
              description: The input prompt to process through two minds
            system:
              type: string
              example: You are an expert philosopher.
              description: System message to prepend to convergence (optional)
              default: ""
            voice:
              type: string
              example: en_GB-jarvis
              description: Voice for the final output
            speak:
              type: boolean
              example: true
              description: If true, speaks on device; if false, returns audio file
          required:
            - prompt
    responses:
      200:
        description: Either JSON with spoken status or WAV audio file
    """
    global current_audio_process
    data = request.get_json(silent=True)
    if not data or "prompt" not in data:
        return jsonify({"status": "error", "message": "Missing prompt"}), 400

    prompt = data.get("prompt", "").strip()
    system = data.get("system", "").strip()
    voice = data.get("voice")
    speak = data.get("speak", True)
    
    # Get personality manager for voice default
    from cognition.personality import get_personality_manager
    manager = get_personality_manager()
    
    # Use personality's voice if not specified
    if not voice and manager.current_personality and manager.current_personality.voice_id:
        voice = manager.current_personality.voice_id
    
    # Final fallback to config default
    if not voice:
        voice = DEFAULT_VOICE

    if not prompt:
        return jsonify({"status": "error", "message": "No prompt provided"}), 400

    try:
        # Start LLM processing indicator - this is text input with voice output
        start_system_processing('B', is_text_input=True, has_voice_output=True)
        
        # Use bicameral_chat_direct function
        final_response = bicameral_chat_direct(prompt, system, voice)
        
        # Generate TTS for final response
        tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"
        
        # Transition to TTS stage - voice output is happening
        start_system_processing('C', is_text_input=True, has_voice_output=True)
        
        output_file, tts_processing_time = generate_tts_audio(final_response, voice, tmp_wav)
        
        if speak:
            # Play voice intro before speaking
            from expression.text_to_speech import play_voice_intro
            play_sound_async(play_voice_intro, voice)
            
            # Transition to audio playback
            start_system_processing('aplay', is_text_input=True, has_voice_output=True)
            
            # Speak on rover
            import subprocess
            from config import AUDIO_DEVICE
            import os
            
            subprocess.run(["aplay", "-D", AUDIO_DEVICE, tmp_wav])
            os.remove(tmp_wav)
            
            # Stop all LEDs
            stop_system_processing()
            
            return jsonify({
                "status": "success",
                "original_prompt": prompt,
                "final_synthesis": final_response,
                "voice_used": voice,
                "spoken": True
            })
        else:
            # Return audio file
            stop_system_processing()
            return send_file(tmp_wav, mimetype="audio/wav", as_attachment=True, download_name="bicameral_synthesis.wav")
                
    except Exception as e:
        stop_system_processing()
        error_msg = str(e)
        if "Connection refused" in error_msg:
            return jsonify({
                "status": "error",
                "message": "Failed to connect to Ollama service. Please ensure Ollama is running."
            }), 500
        elif "model not found" in error_msg.lower():
            return jsonify({
                "status": "error",
                "message": f"Model not found: {error_msg}"
            }), 500
        else:
            return jsonify({
                "status": "error",
                "message": f"Bicameral processing failed: {error_msg}"
            }), 500


@bp.route('/v1/chat/completions', methods=['POST'])
def openai_compatible_chat():
    """
    OpenAI-compatible chat completions endpoint that aliases to our chat system.
    ---
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            model:
              type: string
              example: tinydolphin:1.1b
              description: The model to use for completion
            messages:
              type: array
              items:
                type: object
                properties:
                  role:
                    type: string
                    enum: ['system', 'user', 'assistant']
                  content:
                    type: string
              description: Array of messages in the conversation
            temperature:
              type: number
              default: 0.7
              description: Sampling temperature (ignored in current implementation)
            max_tokens:
              type: integer
              description: Maximum tokens to generate (ignored in current implementation)
          required:
            - model
            - messages
    responses:
      200:
        description: OpenAI-compatible chat completion response
        schema:
          type: object
          properties:
            id:
              type: string
              example: chatcmpl-abc123
            object:
              type: string
              example: chat.completion
            created:
              type: integer
              example: 1677652288
            model:
              type: string
              example: tinydolphin:1.1b
            choices:
              type: array
              items:
                type: object
                properties:
                  index:
                    type: integer
                  message:
                    type: object
                    properties:
                      role:
                        type: string
                        example: assistant
                      content:
                        type: string
                        example: I'm a helpful AI assistant.
                  finish_reason:
                    type: string
                    example: stop
            usage:
              type: object
              properties:
                prompt_tokens:
                  type: integer
                completion_tokens:
                  type: integer
                total_tokens:
                  type: integer
    """
    data = request.get_json(silent=True)
    if not data or "messages" not in data:
        return jsonify({"error": {"message": "Missing messages", "type": "invalid_request_error"}}), 400

    model = data.get("model", DEFAULT_MODEL)
    messages = data.get("messages", [])
    
    # Get personality manager
    from cognition.personality import get_personality_manager
    manager = get_personality_manager()
    
    # Debug logging
    if manager.current_personality:
        print(f"DEBUG openai_compatible_chat: Current personality is {manager.current_personality.name}")
        print(f"DEBUG openai_compatible_chat: Personality type: {type(manager.current_personality).__name__}")
    else:
        print("DEBUG openai_compatible_chat: No current personality set")
    
    # Get system message from personality if not provided
    system_message = None
    filtered_messages = []
    
    for msg in messages:
        if msg.get("role") == "system":
            system_message = msg.get("content", "")
        else:
            filtered_messages.append(msg)
    
    # Use default system message if none provided
    if not system_message:
        if manager.current_personality:
            # Generate context-aware system message from personality
            context = {
                "time_of_day": "day",  # Could be enhanced with actual time
                "user_name": None,  # Could be enhanced if we track users
            }
            system_message = manager.current_personality.generate_system_message(context)
            print(f"DEBUG openai_compatible_chat: Using personality system message for {manager.current_personality.name}")
        else:
            system_message = "You are RoverSeer, a helpful voice assistant. Keep responses concise and conversational."

    # Use personality's voice if not specified
    voice = data.get("voice")
    if manager.current_personality and not voice:
        voice = manager.current_personality.voice_id

    # Final fallback to config default if still no voice
    if not voice:
        voice = DEFAULT_VOICE

    try:
        # Start LLM processing LED if this is from the recording pipeline
        from config import pipeline_stages
        if not any(stage for stage in pipeline_stages.values() if stage):
            start_system_processing('B')
        
        reply = run_chat_completion(model, filtered_messages, system_message, voice_id=voice)
        
        # Stop LED processing if we started it
        if pipeline_stages.get('llm_active'):
            stop_system_processing()
        
        # Return OpenAI-compatible response format
        return jsonify({
            "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model,
            "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": reply},
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": len(json.dumps(filtered_messages).split()),
                "completion_tokens": len(reply.split()),
                "total_tokens": len(json.dumps(filtered_messages).split()) + len(reply.split())
            }
        })
        
    except Exception as e:
        # Stop LED processing on error
        from config import pipeline_stages
        if pipeline_stages.get('llm_active'):
            stop_system_processing()
        
        return jsonify({
            "error": {
                "message": str(e),
                "type": "internal_server_error"
            }
        }), 500 