from fastapi import APIRouter, Request, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from typing import Optional
import uuid
import os
import subprocess

from config import DEFAULT_VOICE, DEFAULT_MODEL, MIC_DEVICE, AUDIO_DEVICE, current_audio_process
from expression.text_to_speech import generate_tts_audio, speak_text, list_voice_ids
from perception.speech_recognition import transcribe_audio
from cognition.llm_interface import run_chat_completion
from expression.sound_orchestration import play_sound_async
from embodiment.pipeline_orchestrator import get_pipeline_orchestrator, SystemState

router = APIRouter()

# Static Swagger spec for TTS endpoint
tts_spec = {
    "parameters": [
        {
            "name": "body",
            "in": "body",
            "required": True,
            "schema": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "example": "Hello from RoverSeer!"
                    },
                    "voice": {
                        "type": "string",
                        "enum": list_voice_ids(),
                        "default": DEFAULT_VOICE
                    },
                    "speak": {
                        "type": "boolean",
                        "default": False,
                        "description": "If true, plays audio on device; if false, returns audio file"
                    }
                },
                "required": ["text"]
            }
        }
    ],
    "responses": {
        "200": {
            "description": "Audio spoken or file returned"
        }
    }
}


@router.post('/tts')
async def text_to_speech(request: Request):
    """
    Generate TTS audio and either play on rover or return file.
    ---
    consumes:
      - application/json
    produces:
      - application/json (if speak is true)
      - audio/wav (if speak is false)
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            text:
              type: string
              example: Hello from RoverSeer!
              required: true
            voice:
              type: string
              example: en_GB-jarvis
              default: en_GB-jarvis
            speak:
              type: boolean
              default: false
              description: If true, plays audio on device; if false, returns audio file
    responses:
      200:
        description: Audio spoken on device or WAV file returned
    """
    global current_audio_process
    try:
        data = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid or missing JSON body")

    text = data.get("text", "").strip()
    voice_id = data.get("voice", DEFAULT_VOICE)
    
    # Default to returning file for /tts endpoint
    speak = data.get("speak", False)

    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    try:
        tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"
        output_file, tts_processing_time = generate_tts_audio(text, voice_id, tmp_wav)
        
        if speak:
            # Get orchestrator for proper state management
            orchestrator = get_pipeline_orchestrator()
            
            # Play using Popen for interruptibility (start aplay subprocess)
            current_audio_process = subprocess.Popen(
                ["aplay", "-D", AUDIO_DEVICE, tmp_wav],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Register process with orchestrator for cleanup tracking
            orchestrator.register_audio_process(current_audio_process)
            
            # NOW transition to expressing stage (blinking starts only when aplay is actually running)
            orchestrator.transition_to_state(SystemState.EXPRESSING)
            
            current_audio_process.wait()
            current_audio_process = None
            
            os.remove(tmp_wav)
            
            # Properly complete the pipeline flow when audio finishes
            orchestrator.complete_pipeline_flow()

            return JSONResponse(content={"status": "success", "message": f"Spoken with {voice_id}: {text}"})
        else:
            # Return file - no need for orchestrator state change
            return FileResponse(tmp_wav, media_type="audio/wav", filename="tts.wav")
            
    except Exception as e:
        # Handle error properly with orchestrator
        try:
            orchestrator = get_pipeline_orchestrator()
            orchestrator.request_interruption()
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/v1/audio/transcriptions')
async def transcribe_openai_style(file: UploadFile = File(...)):
    """
    OpenAI-style Whisper transcription endpoint
    ---
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        required: true
        type: file
    responses:
      200:
        description: Transcription in OpenAI format
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    tmp_path = f"/tmp/{uuid.uuid4().hex}.wav"
    with open(tmp_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    try:
        transcript = transcribe_audio(tmp_path)
        os.remove(tmp_path)
        return JSONResponse(content={"text": transcript})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/v1/audio/chat_voice')
async def transcribe_chat_voice(
    file: UploadFile = File(...),
    model: Optional[str] = Form(DEFAULT_MODEL),
    voice: Optional[str] = Form(DEFAULT_VOICE),
    speak: Optional[bool] = Form(True)
):
    """
    Transcribe audio, get LLM response, and either speak or return audio.
    ---
    consumes:
      - multipart/form-data
    produces:
      - application/json (if speak is true)
      - audio/wav (if speak is false)
    parameters:
      - in: formData
        name: file
        type: file
        required: true
      - in: formData
        name: model
        type: string
        required: false
        default: tinydolphin:1.1b
      - in: formData
        name: voice
        type: string
        required: false
        default: en_GB-jarvis
      - in: formData
        name: speak
        type: boolean
        required: false
        default: true
        description: If true, speaks on device; if false, returns audio file
    responses:
      200:
        description: Either JSON with transcript/reply or WAV audio file
    """
    global current_audio_process
    if not file:
        raise HTTPException(status_code=400, detail="Missing audio file")

    tmp_audio = f"/tmp/{uuid.uuid4().hex}.wav"
    with open(tmp_audio, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    try:
        # Get orchestrator for proper state management
        orchestrator = get_pipeline_orchestrator()
        
        # 1. Transcribe
        orchestrator.transition_to_state(SystemState.PROCESSING_SPEECH)
        transcript = transcribe_audio(tmp_audio)
        os.remove(tmp_audio)

        # 2. LLM reply
        orchestrator.transition_to_state(SystemState.CONTEMPLATING)
        messages = [{"role": "user", "content": transcript}]
        system_message = "You are RoverSeer, a helpful voice assistant."
        reply = run_chat_completion(model, messages, system_message, voice_id=voice)

        # Play voice intro before TTS (only when speaking)
        if speak:
            from expression.text_to_speech import play_voice_intro
            play_sound_async(play_voice_intro, voice)

        # 3. TTS (Piper)
        tmp_output = f"/tmp/{uuid.uuid4().hex}_spoken.wav"
        
        orchestrator.transition_to_state(SystemState.SYNTHESIZING)
        output_file, tts_processing_time = generate_tts_audio(reply, voice, tmp_output)
        
        if speak:
            # 4. Speak it! (start aplay subprocess)
            current_audio_process = subprocess.Popen(
                ["aplay", "-D", AUDIO_DEVICE, tmp_output],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Register process with orchestrator for cleanup tracking
            orchestrator.register_audio_process(current_audio_process)
            
            # NOW transition to expressing stage (blinking starts only when aplay is actually running)
            orchestrator.transition_to_state(SystemState.EXPRESSING)
            
            current_audio_process.wait()
            current_audio_process = None
            
            os.remove(tmp_output)
            
            # Properly complete the pipeline flow when audio finishes
            orchestrator.complete_pipeline_flow()

            return JSONResponse(content={
                "transcript": transcript,
                "reply": reply,
                "voice": voice,
                "model": model
            })
        else:
            # 4. Return WAV - transition back to idle
            orchestrator.transition_to_state(SystemState.IDLE)
            return FileResponse(tmp_output, media_type="audio/wav", filename="response.wav")

    except Exception as e:
        # Handle error properly with orchestrator
        try:
            orchestrator = get_pipeline_orchestrator()
            orchestrator.request_interruption()
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/v1/audio/chat')
async def transcribe_and_chat(
    file: UploadFile = File(...),
    model: Optional[str] = Form(DEFAULT_MODEL),
    voice: Optional[str] = Form(DEFAULT_VOICE)
):
    """
    Transcribe audio and send result to LLM chat, returning assistant's reply.
    ---
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        type: file
        required: true
      - in: formData
        name: model
        type: string
        required: false
        default: tinydolphin:1.1b
      - in: formData
        name: voice
        type: string
        required: false
        default: en_GB-jarvis
    responses:
      200:
        description: Assistant's response to transcribed speech
    """
    if not file:
        raise HTTPException(status_code=400, detail="Missing audio file")

    tmp_path = f"/tmp/{uuid.uuid4().hex}.wav"
    with open(tmp_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    try:
        # Transcribe audio
        transcript = transcribe_audio(tmp_path)
        os.remove(tmp_path)

        # Send to LLM
        messages = [{"role": "user", "content": transcript}]
        system_message = "You are RoverSeer, a helpful assistant responding to transcribed audio."

        reply = run_chat_completion(model, messages, system_message, voice_id=voice)

        return JSONResponse(content={
            "transcript": transcript,
            "model": model,
            "voice": voice,
            "reply": reply
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/voices')
async def list_voices():
    """
    List available TTS voices
    ---
    responses:
      200:
        description: List of available voices
        schema:
          type: object
          properties:
            voices:
              type: array
              items:
                type: string
                example: en_GB-jarvis
            default_voice:
              type: string
              example: en_GB-jarvis
            count:
              type: integer
              example: 6
    """
    try:
        voices = list_voice_ids()
        return JSONResponse(content={
            "voices": voices,
            "default_voice": DEFAULT_VOICE,
            "count": len(voices)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 