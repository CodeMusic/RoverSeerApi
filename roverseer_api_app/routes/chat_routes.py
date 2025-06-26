from fastapi import APIRouter, Request, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from typing import Optional, Dict, Any, List
import uuid
import time
import json
import asyncio

import config
from config import DEFAULT_MODEL, DEFAULT_VOICE, current_audio_process
from cognition.llm_interface import run_chat_completion
from cognition.bicameral_mind import bicameral_chat_direct
from expression.text_to_speech import generate_tts_audio, speak_text
from memory.usage_logger import log_penphin_mind_usage
from embodiment.rainbow_interface import start_system_processing, stop_system_processing
from expression.sound_orchestration import play_sound_async, play_bicameral_connection_tune
from embodiment.sensors import get_ai_pipeline_status
from embodiment.pipeline_orchestrator import get_pipeline_orchestrator, SystemState

router = APIRouter()


@router.post('/chat')
async def chat_unified(request: Request):
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
    try:
        data = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    if not data or "messages" not in data:
        raise HTTPException(status_code=400, detail="Missing messages")

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
            return JSONResponse(content={
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
        
        # For audio outputs, generate TTS normally
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

                return JSONResponse(content={
                    "status": "success",
                    "model": model,
                    "spoken_text": reply,
                    "voice_used": voice
                })
            else:  # audio_file
                # Return audio file
                return FileResponse(tmp_wav, media_type="audio/wav", filename="chat_tts.wav")

    except Exception as e:
        stop_system_processing()
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/insight')
async def insight(request: Request):
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
        return JSONResponse({"status": "error", "message": "Missing prompt"}), 400

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
        return JSONResponse({"response": reply})
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}), 500


@router.post('/bicameral_chat')
async def bicameral_chat(request: Request):
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
        return JSONResponse({"status": "error", "message": "Missing prompt"}), 400

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
        return JSONResponse({"status": "error", "message": "No prompt provided"}), 400

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
            
            return JSONResponse({
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
            return JSONResponse({
                "status": "error",
                "message": "Failed to connect to Ollama service. Please ensure Ollama is running."
            }), 500
        elif "model not found" in error_msg.lower():
            return JSONResponse({
                "status": "error",
                "message": f"Model not found: {error_msg}"
            }), 500
        else:
            return JSONResponse({
                "status": "error",
                "message": f"Bicameral processing failed: {error_msg}"
            }), 500


@router.post('/v1/chat/completions')
async def openai_compatible_chat(request: Request):
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
        return JSONResponse({"error": {"message": "Missing messages", "type": "invalid_request_error"}}), 400

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
        return JSONResponse({
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
        
        return JSONResponse({
            "error": {
                "message": str(e),
                "type": "internal_server_error"
            }
        }), 500


@router.post('/chat_ajax')
async def chat_ajax(request: Request):
    """AJAX endpoint for chat requests that returns JSON"""
    # Check if we've reached the max concurrent requests
    # Count active requests (including button recording)
    active_count = config.active_request_count
    if config.recording_in_progress:
        active_count += 1
    
    if active_count >= config.MAX_CONCURRENT_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"RoverSeer has reached the maximum concurrent requests limit ({config.MAX_CONCURRENT_REQUESTS}). Please wait a moment and try again."
        )
    
    # CRITICAL FIX: Check orchestrator state instead of just counting requests
    orchestrator = get_pipeline_orchestrator()
    
    if orchestrator.is_system_busy():
        current_state = orchestrator.get_current_state()
        raise HTTPException(
            status_code=429,
            detail=f"RoverSeer is currently busy ({current_state.value}). Please wait a moment and try again."
        )
    
    # Increment active request count
    config.active_request_count += 1
    
    # Get form data from FastAPI request
    try:
        form_data = await request.form()
        
        output_type = form_data.get('output_type')
        voice = form_data.get('voice')
        system = form_data.get('system')  # May be None now
        user_input = form_data.get('user_input')
        model = form_data.get('model')
        use_personality = form_data.get('use_personality', 'true').lower() == 'true'
        custom_system_message = form_data.get('system_message', '').strip()
        request_id = form_data.get('request_id', '')  # Get request ID from form
        
        # Check for interaction mode
        interaction_mode = form_data.get('interaction_mode', 'false').lower() == 'true'
        conversation_history = []
        if interaction_mode:
            try:
                conversation_history = json.loads(form_data.get('conversation_history', '[]'))
            except:
                conversation_history = []
    except Exception as e:
        config.active_request_count -= 1
        raise HTTPException(status_code=400, detail=f"Failed to parse form data: {str(e)}")
    
    #🐛 DEBUG: Log all received parameters
    print(f"🐛 CHAT_AJAX DEBUG:")
    print(f"  📝 user_input: {user_input}")
    print(f"  🤖 model: {model}")
    print(f"  🔊 voice: {voice}")
    print(f"  🎭 use_personality: {use_personality}")
    print(f"  💬 output_type: '{output_type}' (type: {type(output_type)})")
    print(f"  ⚙️ system: {system}")
    print(f"  📋 custom_system_message: {custom_system_message}")
    print(f"  🤝 interaction_mode: {interaction_mode}")
    print(f"  📚 conversation_history length: {len(conversation_history)}")
    print(f"  🔑 request_id: {request_id}")
    
    # Ensure we explicitly handle the output_type routing
    if output_type == "audio_file":
        print("🔧 AUDIO ROUTING: Detected audio_file - should generate local audio file")
    elif output_type == "speak":
        print("🔧 AUDIO ROUTING: Detected speak - should play on RoverSeer device")
    elif output_type == "text":
        print("🔧 AUDIO ROUTING: Detected text - should return text only")
    else:
        print(f"🔧 AUDIO ROUTING: Unknown output_type '{output_type}' - defaulting to text")
    
    print(f"🔧 AUDIO ROUTING DECISION: Will {'generate audio file' if output_type == 'audio_file' else 'play on device' if output_type == 'speak' else 'return text only'}")
    
    # Check if we need to switch personality based on voice
    from cognition.personality import get_personality_manager
    personality_manager = get_personality_manager()
    
    # Only handle personality switching if use_personality is true
    if use_personality and voice:
        personality_found = False
        for personality in personality_manager.personalities.values():
            if personality.voice_id == voice:
                personality_found = True
                if not personality_manager.current_personality or personality_manager.current_personality.name != personality.name:
                    success = personality_manager.switch_to(personality.name)
                    if success:
                        # Update DEFAULT_VOICE to match
                        from config import update_default_voice
                        update_default_voice(voice)
                break
    
    # Validate voice - use default if empty
    if not voice:
        voice = DEFAULT_VOICE
        print(f"Warning: Empty voice provided, using default: {voice}")
    
    if not user_input:
        config.active_request_count -= 1  # Decrement on early return
        raise HTTPException(status_code=400, detail="No input provided")
    
    # Debug logging
    print(f"AJAX Chat request - User: {user_input}, Model: {model}, Output: {output_type}")
    
    reply_text = ""
    audio_url = None
    error = None
    
    try:
        # Get orchestrator and ensure proper pipeline flow
        orchestrator = get_pipeline_orchestrator()
        
        # Start LLM processing - transition to CONTEMPLATING state
        print(f"🔧 Starting LLM processing - transitioning to CONTEMPLATING state")
        orchestrator.transition_to_state(SystemState.CONTEMPLATING)
        
        # Check if PenphinMind is selected
        if model.lower() == "penphinmind":
            # Use bicameral_chat_direct function
            try:
                reply = bicameral_chat_direct(user_input, system, voice)
            except Exception as e:
                reply = f"Bicameral processing error: {e}"
            
            # Store PenphinMind identity in history for consistency
            history_info = "🧠 PenphinMind"
            config.history.append((user_input, reply, history_info))
            reply_text = reply
            
            # Complete pipeline flow for PenphinMind
            orchestrator.complete_pipeline_flow()
        else:
            # Normal single model flow
            # Build message history with model context
            messages = []
            
            # For interaction mode, use provided conversation history
            if interaction_mode and conversation_history:
                for user_msg, asst_msg in conversation_history:
                    messages.append({"role": "user", "content": user_msg})
                    messages.append({"role": "assistant", "content": asst_msg})
            else:
                # Use global history
                for user_msg, ai_reply, _ in config.history[-config.MAX_HISTORY:]:
                    messages.append({"role": "user", "content": user_msg})
                    messages.append({"role": "assistant", "content": ai_reply})
            
            messages.append({"role": "user", "content": user_input})

            try:
                # Get system message from personality or use provided one
                if use_personality and personality_manager.current_personality:
                    # Generate context-aware system message from current personality
                    context = {
                        "time_of_day": "day",  # Could be enhanced with actual time
                        "user_name": None,  # Could be enhanced if we track users
                    }
                    system_message = personality_manager.current_personality.generate_system_message(context)
                    print(f"Using personality system message for {personality_manager.current_personality.name}")
                elif not use_personality and custom_system_message:
                    # Use the custom system message provided by user
                    system_message = custom_system_message
                    print(f"Using custom system message")
                else:
                    # Use provided system message or default
                    system_message = system or "You are RoverSeer, a helpful assistant."
                    print(f"Using {'provided' if system else 'default'} system message")
                
                # Run LLM
                reply = run_chat_completion(model, messages, system_message, voice_id=voice)
                
                # Log response for analytics with voice model context
                from helpers.logging_helper import LoggingHelper
                LoggingHelper.log_llm_usage(model, system_message, user_input, reply, voice_id=voice)

                # LLM complete, advance to next stage based on output type
                print(f"🔧 LLM complete, advancing to next stage for output type: {output_type}")
                
                # TTS and audio generation
                if output_type == "speak":
                    # Import needed for TTS
                    from expression.text_to_speech import speak_text
                    
                    # Transition to TTS stage
                    orchestrator.advance_pipeline_flow()  # CONTEMPLATING -> SYNTHESIZING
                    
                    # Debug: Check reply content before TTS
                    print(f"🔧 DEBUG: About to call speak_text with reply length: {len(reply) if reply else 'None'}")
                    print(f"🔧 DEBUG: Reply content preview: {reply[:50] if reply else 'None'}...")
                    print(f"🔧 DEBUG: Voice: {voice}")
                    
                    # Use text_to_speech speak_text function which handles the rest of the pipeline
                    speak_text(reply, voice)
                    
                    print(f"🔧 DEBUG: speak_text completed successfully")
                    
                    reply_text = reply
                    print("🔧 AUDIO ROUTING: Spoke on RoverSeer device, returning text response to frontend")
                elif output_type == "audio_file":
                    # Import needed for TTS generation
                    from expression.text_to_speech import generate_tts_audio
                    import uuid
                    import os
                    
                    # Transition to TTS stage
                    orchestrator.advance_pipeline_flow()  # CONTEMPLATING -> SYNTHESIZING
                    
                    # Generate TTS and save to tmp directory (same pattern as fastapi_core.py)
                    try:
                        # Generate TTS to a temp file like fastapi_core.py does
                        temp_filename = f"{uuid.uuid4().hex}.wav"
                        temp_path = f"/tmp/{temp_filename}"
                        
                        # TTS generation
                        output_file, tts_processing_time = generate_tts_audio(reply, voice, temp_path)
                        print(f"✅ Audio file generated: {output_file}")
                        
                        # Complete pipeline flow for audio file mode
                        orchestrator.complete_pipeline_flow()
                        
                        # Set the audio URL for the frontend to download
                        audio_url = f"/tmp_static/{temp_filename}"
                        reply_text = reply
                        print("🔧 AUDIO ROUTING: Generated audio file for download")
                        
                    except Exception as e:
                        print(f"❌ TTS generation failed: {e}")
                        reply_text = f"{reply}\n\n(Audio generation failed: {e})"
                        orchestrator.complete_pipeline_flow()  # Reset on error
                else:
                    # Text only - complete pipeline and return to idle
                    print(f"🔧 Text-only mode, completing pipeline flow")
                    orchestrator.complete_pipeline_flow()
                    reply_text = reply

                # Determine what to show in history - match the frontend logic
                history_info = model  # Default fallback
                
                if use_personality and personality_manager.current_personality:
                    # If using personality mode, show personality name with emoji
                    history_info = f"{personality_manager.current_personality.avatar_emoji} {personality_manager.current_personality.name}"
                else:
                    # Check if this model is associated with any personality
                    for personality in personality_manager.personalities.values():
                        if personality.model_preference == model:
                            history_info = f"{personality.avatar_emoji} {personality.name}"
                            break
                    # If no personality association found, keep the model name as fallback
                
                # Don't add to history if in interaction mode
                if not interaction_mode:
                    config.history.append((user_input, reply_text, history_info))
                    
            except Exception as e:
                reply_text = f"Request failed: {e}"
                # Save error to history with model name
                if not interaction_mode:
                    config.history.append((user_input, reply_text, model))
            
    except Exception as e:
        error = str(e)
        reply_text = f"Request failed: {e}"
        print(f"🔧 Error in chat_ajax: {e}")
        
        # Make sure to reset orchestrator on error
        try:
            orchestrator = get_pipeline_orchestrator()
            current_state = orchestrator.get_current_state()
            print(f"🔧 Error occurred, orchestrator in state: {current_state.value}")
            orchestrator.complete_pipeline_flow()  # Reset to idle
            print(f"🔧 Orchestrator reset to idle after error")
        except Exception as reset_error:
            print(f"🔧 Failed to reset orchestrator after error: {reset_error}")
    finally:
        # Always decrement active request count
        config.active_request_count -= 1
        
        # Ensure orchestrator is in a clean state
        try:
            orchestrator = get_pipeline_orchestrator()
            current_state = orchestrator.get_current_state()
            print(f"🔧 Finally block - orchestrator state: {current_state.value}")
            if current_state.value not in ["idle", "interrupted"]:
                print(f"🔧 Finally block - forcing orchestrator to idle from {current_state.value}")
                orchestrator.complete_pipeline_flow()
        except Exception as final_error:
            print(f"🔧 Error in finally block: {final_error}")
    
    # Get updated AI pipeline status
    ai_pipeline = get_ai_pipeline_status()
    
    # Get personality info for frontend display based on which model actually handled this request
    personality_data = None
    
    # Determine which personality should be displayed for this specific request
    if use_personality and personality_manager.current_personality:
        # If using personality mode and we have a current personality, show it
        personality_data = {
            'name': personality_manager.current_personality.name,
            'avatar_emoji': personality_manager.current_personality.avatar_emoji
        }
    elif model.lower() == "penphinmind":
        # Special case for PenphinMind - show PenphinMind identity
        personality_data = {
            'name': 'PenphinMind',
            'avatar_emoji': '🧠'
        }
    else:
        # For regular models, check if this model is associated with any personality
        # This handles cases where someone selected a model directly but it's a personality's preferred model
        for personality in personality_manager.personalities.values():
            if personality.model_preference == model:
                personality_data = {
                    'name': personality.name,
                    'avatar_emoji': personality.avatar_emoji
                }
                break
        
        # If no personality association found, don't show personality data (will fall back to model name)
    
    return JSONResponse(content={
        "reply": reply_text,
        "audio_url": audio_url,
        "model": model,
        "error": error,
        "ai_pipeline": ai_pipeline,
        "personality": personality_data,
        "request_id": request_id  # Include request ID in response
    }) 