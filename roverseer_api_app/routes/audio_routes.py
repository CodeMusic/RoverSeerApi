from flask import Blueprint, request, jsonify, send_file
import uuid
import os
import subprocess

from config import DEFAULT_VOICE, DEFAULT_MODEL, MIC_DEVICE, AUDIO_DEVICE, current_audio_process
from expression.text_to_speech import generate_tts_audio, speak_text, list_voice_ids
from perception.speech_recognition import transcribe_audio
from cognition.llm_interface import run_chat_completion
from embodiment.rainbow_interface import start_system_processing, stop_system_processing
from expression.sound_orchestration import play_sound_async
from flasgger import swag_from

bp = Blueprint('audio', __name__)

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


@bp.route('/tts', methods=['POST'])
@swag_from(tts_spec)
def text_to_speech():
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
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "Invalid or missing JSON body"}), 400

    text = data.get("text", "").strip()
    voice_id = data.get("voice", DEFAULT_VOICE)
    
    # Default to returning file for /tts endpoint
    speak = data.get("speak", False)

    if not text:
        return jsonify({"status": "error", "message": "No text provided"}), 400

    try:
        tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"
        output_file, tts_processing_time = generate_tts_audio(text, voice_id, tmp_wav)
        
        if speak:
            # Transition to audio playback stage
            start_system_processing('aplay')
            
            # Play using Popen for interruptibility
            current_audio_process = subprocess.Popen(
                ["aplay", "-D", AUDIO_DEVICE, tmp_wav],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            current_audio_process.wait()
            current_audio_process = None
            
            os.remove(tmp_wav)
            
            # Stop all LEDs after playback
            stop_system_processing()

            return jsonify({"status": "success", "message": f"Spoken with {voice_id}: {text}"})
        else:
            # Stop system processing after TTS generation when returning file
            stop_system_processing()
            return send_file(tmp_wav, mimetype="audio/wav", as_attachment=True, download_name="tts.wav")
            
    except Exception as e:
        stop_system_processing()
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route('/v1/audio/transcriptions', methods=['POST'])
def transcribe_openai_style():
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
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    tmp_path = f"/tmp/{uuid.uuid4().hex}.wav"
    file.save(tmp_path)

    try:
        transcript = transcribe_audio(tmp_path)
        os.remove(tmp_path)
        return jsonify({"text": transcript})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/v1/audio/chat_voice', methods=['POST'])
def transcribe_chat_voice():
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
    if 'file' not in request.files:
        return jsonify({"error": "Missing audio file"}), 400

    file = request.files['file']
    model = request.form.get('model', DEFAULT_MODEL)
    voice = request.form.get('voice', DEFAULT_VOICE)
    
    # Default to playing on device for this endpoint
    speak = request.form.get('speak', 'true').lower() == 'true'

    tmp_audio = f"/tmp/{uuid.uuid4().hex}.wav"
    file.save(tmp_audio)

    try:
        # 1. Transcribe
        transcript = transcribe_audio(tmp_audio)
        os.remove(tmp_audio)

        # 2. LLM reply
        # Transition to LLM stage
        start_system_processing('B')
        messages = [{"role": "user", "content": transcript}]
        system_message = "You are RoverSeer, a helpful voice assistant."
        reply = run_chat_completion(model, messages, system_message, voice_id=voice)

        # Play voice intro before TTS (only when speaking)
        if speak:
            from expression.text_to_speech import play_voice_intro
            play_sound_async(play_voice_intro, voice)

        # 3. TTS (Piper)
        tmp_output = f"/tmp/{uuid.uuid4().hex}_spoken.wav"
        
        # Transition to TTS stage
        start_system_processing('C')
        
        output_file, tts_processing_time = generate_tts_audio(reply, voice, tmp_output)
        
        if speak:
            # 4. Speak it!
            # Transition to audio playback
            start_system_processing('aplay')
            
            # Speak on rover using Popen for interruptibility
            current_audio_process = subprocess.Popen(
                ["aplay", "-D", AUDIO_DEVICE, tmp_output],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            current_audio_process.wait()
            current_audio_process = None
            
            os.remove(tmp_output)
            
            # Stop all LEDs
            stop_system_processing()

            return jsonify({
                "transcript": transcript,
                "reply": reply,
                "voice": voice,
                "model": model
            })
        else:
            # 4. Return WAV
            return send_file(tmp_output, mimetype="audio/wav", as_attachment=True, download_name="response.wav")

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/v1/audio/chat', methods=['POST'])
def transcribe_and_chat():
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
    if 'file' not in request.files:
        return jsonify({"error": "Missing audio file"}), 400

    file = request.files['file']
    model = request.form.get('model', DEFAULT_MODEL)
    voice = request.form.get('voice', DEFAULT_VOICE)

    tmp_path = f"/tmp/{uuid.uuid4().hex}.wav"
    file.save(tmp_path)

    try:
        # Transcribe audio
        transcript = transcribe_audio(tmp_path)
        os.remove(tmp_path)

        # Send to LLM
        messages = [{"role": "user", "content": transcript}]
        system_message = "You are RoverSeer, a helpful assistant responding to transcribed audio."

        reply = run_chat_completion(model, messages, system_message, voice_id=voice)

        return jsonify({
            "transcript": transcript,
            "model": model,
            "voice": voice,
            "reply": reply
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/voices', methods=['GET'])
def list_voices():
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
        return jsonify({
            "voices": voices,
            "default_voice": DEFAULT_VOICE,
            "count": len(voices)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500 