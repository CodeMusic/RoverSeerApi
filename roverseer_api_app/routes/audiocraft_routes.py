from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from typing import Optional
import uuid
import os
import subprocess
import asyncio
import signal
from expression.sound_orchestration import play_sound_async
from expression.sound_orchestration import (
    play_audiocraft_sound_start_tune,
    play_audiocraft_sound_processing_tune,
    play_audiocraft_sound_complete_tune,
    play_audiocraft_sound_error_tune,
    play_audiocraft_music_start_tune,
    play_audiocraft_music_processing_tune,
    play_audiocraft_music_complete_tune,
    play_audiocraft_music_error_tune
)

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Global variable to track AudioCraft loading status
audiocraft_status = {
    "loading": False,
    "loaded": False,
    "error": None,
    "last_attempt": None
}

@router.get('/audiocraft')
async def audiocraft_studio(request: Request):
    """
    AudioCraft Studio - Testing page for sound effects and music generation
    """
    return templates.TemplateResponse("audiocraft.html", {"request": request})

@router.get('/audiocraft/status')
async def audiocraft_loading_status():
    """
    Check AudioCraft loading status
    """
    return JSONResponse(content=audiocraft_status)

@router.post('/audiocraft/sound_feedback/{sound_type}')
async def audiocraft_sound_feedback(sound_type: str):
    """
    Trigger AudioCraft sound orchestration feedback
    """
    try:
        # Map sound types to orchestration functions
        sound_map = {
            'sound_start': play_audiocraft_sound_start_tune,
            'sound_processing': play_audiocraft_sound_processing_tune,
            'sound_complete': play_audiocraft_sound_complete_tune,
            'sound_error': play_audiocraft_sound_error_tune,
            'music_start': play_audiocraft_music_start_tune,
            'music_processing': play_audiocraft_music_processing_tune,
            'music_complete': play_audiocraft_music_complete_tune,
            'music_error': play_audiocraft_music_error_tune
        }
        
        if sound_type in sound_map:
            # Trigger the sound using the sound orchestration system
            play_sound_async(sound_map[sound_type])
            return JSONResponse(content={"status": "success", "sound_type": sound_type})
        else:
            return JSONResponse(content={"status": "error", "message": "Unknown sound type"}), 400
            
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)}), 500

@router.post('/audiocraft/synthesize_sound')
async def synthesize_sound_effect(request: Request):
    """
    Generate sound effects using AudioCraft synthesis with timeout handling
    """
    global audiocraft_status
    
    try:
        data = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid or missing JSON body")

    prompt = data.get("prompt", "").strip()
    duration = data.get("duration", 5)
    intensity = data.get("intensity", "moderate")

    if not prompt:
        raise HTTPException(status_code=400, detail="No prompt provided for sound effect")

    try:
        # Generate unique filename for this request
        tmp_wav = f"/tmp/sound_effect_{uuid.uuid4().hex}.wav"
        
        # Try real AudioCraft integration with timeout
        audiocraft_status["loading"] = True
        success, error_msg = await asyncio.wait_for(
            asyncio.to_thread(generate_real_audiocraft_audio, tmp_wav, prompt, duration, "sound_effect"),
            timeout=120.0  # 2 minute timeout
        )
        audiocraft_status["loading"] = False
        
        if not success:
            print(f"⚠️  Real AudioCraft failed: {error_msg}")
            print("⚠️  Using improved placeholder instead")
            audiocraft_status["error"] = error_msg
            generate_placeholder_audio(tmp_wav, duration, "sound_effect")
            
            # Add error info to response headers so frontend can see it
            response = FileResponse(tmp_wav, media_type="audio/wav", filename="sound_effect_placeholder.wav")
            response.headers['X-AudioCraft-Status'] = 'fallback'
            response.headers['X-AudioCraft-Error'] = error_msg.replace('\n', ' ').replace('\r', ' ')
            response.headers['X-AudioCraft-Message'] = 'Using improved placeholder audio - AudioCraft loading or unavailable'
            return response
        else:
            # Real AudioCraft success
            audiocraft_status["loaded"] = True
            audiocraft_status["error"] = None
            response = FileResponse(tmp_wav, media_type="audio/wav", filename="sound_effect.wav")
            response.headers['X-AudioCraft-Status'] = 'success'
            response.headers['X-AudioCraft-Message'] = 'Generated with real AudioCraft'
            return response
        
    except asyncio.TimeoutError:
        audiocraft_status["loading"] = False
        audiocraft_status["error"] = "AudioCraft model loading timed out (may still be loading in background)"
        
        # Generate fallback audio
        generate_placeholder_audio(tmp_wav, duration, "sound_effect")
        response = FileResponse(tmp_wav, media_type="audio/wav", filename="sound_effect_timeout.wav")
        response.headers['X-AudioCraft-Status'] = 'timeout'
        response.headers['X-AudioCraft-Error'] = 'Model loading timed out'
        response.headers['X-AudioCraft-Message'] = 'AudioCraft is still loading models in background. Try again in a few minutes.'
        return response
        
    except Exception as e:
        audiocraft_status["loading"] = False
        audiocraft_status["error"] = str(e)
        raise HTTPException(status_code=500, detail=f"Sound effect synthesis error: {str(e)}")

@router.post('/audiocraft/generate_music')
async def generate_musical_consciousness(request: Request):
    """
    Generate music using AudioCraft synthesis with timeout handling
    """
    global audiocraft_status
    
    try:
        data = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid or missing JSON body")

    prompt = data.get("prompt", "").strip()
    duration = data.get("duration", 30)
    genre = data.get("genre", "acoustic")
    tempo = data.get("tempo", "moderate")
    mood = data.get("mood", "calm")

    if not prompt:
        raise HTTPException(status_code=400, detail="No prompt provided for music generation")

    try:
        # Generate unique filename for this request
        tmp_wav = f"/tmp/music_{uuid.uuid4().hex}.wav"
        
        # Enhance the prompt with additional parameters
        enhanced_prompt = f"{prompt}, {genre} style, {tempo} tempo, {mood} mood"
        
        # Try real AudioCraft integration with timeout
        audiocraft_status["loading"] = True
        success, error_msg = await asyncio.wait_for(
            asyncio.to_thread(generate_real_audiocraft_audio, tmp_wav, enhanced_prompt, duration, "music"),
            timeout=180.0  # 3 minute timeout for music (longer than sound effects)
        )
        audiocraft_status["loading"] = False
        
        if not success:
            print(f"⚠️  Real AudioCraft failed: {error_msg}")
            print("⚠️  Using improved placeholder instead")
            audiocraft_status["error"] = error_msg
            generate_placeholder_audio(tmp_wav, duration, "music")
            
            # Add error info to response headers so frontend can see it
            response = FileResponse(tmp_wav, media_type="audio/wav", filename="music_placeholder.wav")
            response.headers['X-AudioCraft-Status'] = 'fallback'
            response.headers['X-AudioCraft-Error'] = error_msg.replace('\n', ' ').replace('\r', ' ')
            response.headers['X-AudioCraft-Message'] = 'Using improved placeholder audio - AudioCraft loading or unavailable'
            return response
        else:
            # Real AudioCraft success
            audiocraft_status["loaded"] = True
            audiocraft_status["error"] = None
            response = FileResponse(tmp_wav, media_type="audio/wav", filename="generated_music.wav")
            response.headers['X-AudioCraft-Status'] = 'success'
            response.headers['X-AudioCraft-Message'] = 'Generated with real AudioCraft'
            return response
        
    except asyncio.TimeoutError:
        audiocraft_status["loading"] = False
        audiocraft_status["error"] = "AudioCraft model loading timed out (may still be loading in background)"
        
        # Generate fallback audio
        generate_placeholder_audio(tmp_wav, duration, "music")
        response = FileResponse(tmp_wav, media_type="audio/wav", filename="music_timeout.wav")
        response.headers['X-AudioCraft-Status'] = 'timeout'
        response.headers['X-AudioCraft-Error'] = 'Model loading timed out'
        response.headers['X-AudioCraft-Message'] = 'AudioCraft is still loading models in background. Try again in a few minutes.'
        return response
        
    except Exception as e:
        audiocraft_status["loading"] = False
        audiocraft_status["error"] = str(e)
        raise HTTPException(status_code=500, detail=f"Music generation error: {str(e)}")


def generate_real_audiocraft_audio(output_path, prompt, duration, audio_type):
    """
    Generate audio using real AudioCraft MusicGen/AudioGen models
    Returns (success: bool, error_message: str)
    """
    global audiocraft_status
    
    try:
        # Try importing AudioCraft
        from audiocraft.models import MusicGen
        from audiocraft.data.audio import audio_write
        import torch
        import torchaudio
        
        print(f"🎵 Generating {audio_type} with real AudioCraft: '{prompt}' ({duration}s)")
        audiocraft_status["loading"] = True
        
        # Load the appropriate model based on audio type
        if audio_type == "sound_effect":
            # Use AudioGen for sound effects (if available) or MusicGen as fallback
            try:
                from audiocraft.models import AudioGen
                model = AudioGen.get_pretrained('facebook/audiogen-medium')
                print("✅ Using AudioGen for sound effects")
            except Exception as ae_error:
                model = MusicGen.get_pretrained('facebook/musicgen-small')
                print(f"ℹ️  AudioGen not available ({ae_error}), using MusicGen for sound effects")
        else:  # music
            # Use MusicGen for music generation
            model = MusicGen.get_pretrained('facebook/musicgen-small')
            print("✅ Using MusicGen for music generation")
        
        # Set generation parameters
        model.set_generation_params(duration=duration)
        
        # Generate audio
        descriptions = [prompt]
        wav = model.generate(descriptions)
        
        # Save the audio file
        audio_write(output_path.replace('.wav', ''), wav[0].cpu(), model.sample_rate, strategy="loudness")
        
        # AudioCraft saves without extension, rename to .wav if needed
        expected_path = output_path.replace('.wav', '.wav')
        if not os.path.exists(output_path) and os.path.exists(output_path.replace('.wav', '.wav')):
            os.rename(output_path.replace('.wav', '.wav'), output_path)
        
        print(f"✅ Real AudioCraft generation complete: {output_path}")
        audiocraft_status["loading"] = False
        audiocraft_status["loaded"] = True
        return True, "Success"
        
    except ImportError as e:
        error_msg = f"AudioCraft import failed: {str(e)}"
        print(f"ℹ️  {error_msg}")
        audiocraft_status["loading"] = False
        audiocraft_status["error"] = error_msg
        return False, error_msg
    except Exception as e:
        error_msg = f"AudioCraft generation failed: {str(e)}"
        print(f"⚠️  {error_msg}")
        audiocraft_status["loading"] = False
        audiocraft_status["error"] = error_msg
        return False, error_msg


def generate_placeholder_audio(output_path, duration, audio_type):
    """
    Generate placeholder audio using SoX (if available) or a simple Python approach
    This is a fallback when real AudioCraft integration is not available
    """
    try:
        # Try using SoX to generate audio (if installed)
        if audio_type == "sound_effect":
            # Generate a sweeping tone instead of static noise
            cmd = [
                "sox", "-n", output_path, "synth", str(duration),
                "sine", "200-800", "vol", "0.2"
            ]
        else:  # music
            # Generate a simple melody for music placeholder
            cmd = [
                "sox", "-n", output_path, "synth", str(duration),
                "sine", "440", "sine", "554", "sine", "659", "mix",
                "vol", "0.3"
            ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"SoX command failed: {result.stderr}")
            
    except (FileNotFoundError, Exception):
        # Fallback: Create a simple WAV file using Python
        import wave
        import numpy as np
        
        sample_rate = 44100
        samples = int(sample_rate * duration)
        time = np.linspace(0, duration, samples)
        
        if audio_type == "sound_effect":
            # Generate a pleasant sweeping tone instead of white noise
            frequency_sweep = 200 + 600 * (time / duration)  # Sweep from 200Hz to 800Hz
            audio_data = 0.2 * np.sin(2 * np.pi * frequency_sweep * time)
        else:  # music
            # Generate a simple chord progression
            audio_data = (
                0.3 * np.sin(2 * np.pi * 440 * time) +  # A4
                0.2 * np.sin(2 * np.pi * 554 * time) +  # C#5
                0.2 * np.sin(2 * np.pi * 659 * time)    # E5
            ) * 0.3
        
        # Convert to 16-bit PCM
        audio_data = np.clip(audio_data, -1, 1)
        audio_data = (audio_data * 32767).astype(np.int16)
        
        # Write WAV file
        with wave.open(output_path, 'w') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_data.tobytes()) 