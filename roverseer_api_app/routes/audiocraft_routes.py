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
            timeout=600.0  # 10 minute timeout for model download/loading
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
            timeout=600.0  # 10 minute timeout for model download/loading
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
        print(f"🎵 Starting AudioCraft generation: {audio_type} - '{prompt}' ({duration}s)")
        print(f"🎵 Output path: {output_path}")
        
        # Try importing AudioCraft
        from audiocraft.models import MusicGen
        from audiocraft.data.audio import audio_write
        import torch
        import torchaudio
        
        print(f"✅ AudioCraft imports successful")
        audiocraft_status["loading"] = True
        
        # Load the appropriate model based on audio type
        if audio_type == "sound_effect":
            # Use AudioGen for sound effects (if available) or MusicGen as fallback
            try:
                from audiocraft.models import AudioGen
                print("🔄 Loading AudioGen model...")
                model = AudioGen.get_pretrained('medium')
                print("✅ Using AudioGen for sound effects")
            except Exception as ae_error:
                print(f"ℹ️  AudioGen not available ({ae_error}), falling back to MusicGen")
                model = MusicGen.get_pretrained('small')
                print("✅ Using MusicGen for sound effects")
        else:  # music
            # Use MusicGen for music generation
            print("🔄 Loading MusicGen model...")
            model = MusicGen.get_pretrained('small')
            print("✅ Using MusicGen for music generation")
        
        # Set generation parameters
        print(f"🔄 Setting generation parameters: duration={duration}s")
        model.set_generation_params(duration=duration)
        
        # Enhance prompts for better results
        if audio_type == "sound_effect":
            # For sound effects, enhance the prompt to guide MusicGen
            enhanced_prompt = f"sound effect, {prompt}, audio clip, fx, foley"
            print(f"🔄 Generating sound effect with enhanced prompt: '{enhanced_prompt}'")
            descriptions = [enhanced_prompt]
        else:
            # For music, use the original prompt
            print(f"🔄 Generating music with prompt: '{prompt}'")
            descriptions = [prompt]
        
        wav = model.generate(descriptions)
        print(f"✅ Audio generation complete, tensor shape: {wav.shape}")
        
        # Save the audio file - AudioCraft's audio_write adds .wav automatically
        # So we need to remove .wav from our path before calling audio_write
        base_path = output_path.replace('.wav', '')
        print(f"🔄 Saving audio to: {base_path} (audio_write will add .wav)")
        
        audio_write(base_path, wav[0].cpu(), model.sample_rate, strategy="loudness")
        
        # AudioCraft creates base_path.wav automatically
        expected_audiocraft_path = base_path + '.wav'
        print(f"🔄 Checking for AudioCraft output at: {expected_audiocraft_path}")
        
        if os.path.exists(expected_audiocraft_path):
            # If our desired output_path is different, rename it
            if expected_audiocraft_path != output_path:
                print(f"🔄 Renaming {expected_audiocraft_path} to {output_path}")
                os.rename(expected_audiocraft_path, output_path)
            print(f"✅ Audio file saved successfully: {output_path}")
        else:
            # Check if audio_write created the file with a different name
            print(f"❌ Expected file not found: {expected_audiocraft_path}")
            print(f"🔍 Checking directory contents...")
            import glob
            temp_files = glob.glob(f"{base_path}*")
            print(f"🔍 Found files matching pattern: {temp_files}")
            
            if temp_files:
                # Use the first matching file
                actual_file = temp_files[0]
                print(f"🔄 Using file: {actual_file}")
                if actual_file != output_path:
                    os.rename(actual_file, output_path)
                print(f"✅ Audio file renamed to: {output_path}")
            else:
                raise Exception(f"AudioCraft did not create expected output file at {base_path}")
        
        # Verify final file exists
        if not os.path.exists(output_path):
            raise Exception(f"Final output file not found: {output_path}")
            
        file_size = os.path.getsize(output_path)
        print(f"✅ Real AudioCraft generation complete: {output_path} ({file_size} bytes)")
        
        audiocraft_status["loading"] = False
        audiocraft_status["loaded"] = True
        audiocraft_status["error"] = None
        return True, "Success"
        
    except ImportError as e:
        error_msg = f"AudioCraft import failed: {str(e)}"
        print(f"❌ {error_msg}")
        audiocraft_status["loading"] = False
        audiocraft_status["error"] = error_msg
        return False, error_msg
    except Exception as e:
        error_msg = f"AudioCraft generation failed: {str(e)}"
        print(f"❌ {error_msg}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
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