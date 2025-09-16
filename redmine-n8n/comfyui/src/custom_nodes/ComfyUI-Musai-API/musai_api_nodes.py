# musai_api_nodes.py
import io
import os
import json
import time
import requests
import soundfile as sf
import torch
from typing import Optional, Dict, Any

# ---------- helpers ----------
def _env_base_url() -> str:
    # You call it from n8n as http://musai-api:9000; for local Mac, try http://localhost:9000
    return os.environ.get("MUSAI_API_BASE", "http://localhost:9000")

def _to_audio_dict(wav_bytes: bytes) -> Dict[str, Any]:
    """Convert WAV bytes -> Comfy AUDIO dict: {"waveform": (1,C,T) tensor, "sample_rate": int}"""
    data, sr = sf.read(io.BytesIO(wav_bytes), dtype="float32", always_2d=True)  # shape (T, C)
    data = data.T  # (C, T)
    tensor = torch.from_numpy(data).unsqueeze(0)  # (1, C, T)
    # Clamp to [-1,1] just in case
    tensor = tensor.clamp(-1.0, 1.0)
    return {"waveform": tensor, "sample_rate": int(sr)}

def _from_audio_dict(a: Dict[str, Any]) -> bytes:
    """Comfy AUDIO dict -> WAV bytes (float32)."""
    if not (isinstance(a, dict) and "waveform" in a and "sample_rate" in a):
        raise ValueError("Invalid AUDIO input")
    wf = a["waveform"]  # (1,C,T) or (C,T)
    sr = int(a["sample_rate"])
    if wf.ndim == 3:
        wf = wf[0]
    if wf.ndim == 1:
        wf = wf.unsqueeze(0)
    # (C,T) -> (T,C)
    pcm = wf.detach().cpu().float().clamp(-1, 1).numpy().T
    buf = io.BytesIO()
    sf.write(buf, pcm, sr, subtype="PCM_16", format="WAV")
    buf.seek(0)
    return buf.read()

def _get_timeout(seconds: int) -> tuple:
    # (connect, read) timeouts
    return (10, seconds)

# ---------- nodes ----------
class MusaiTTS:
    """
    POST /tts  -> WAV
    Payload: {"text": "...", "voice": "en_US-GlaDOS-medium"} (voice optional; server default applies)
    """
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text": ("STRING", {"multiline": True, "default": "Hello from Musai."}),
            },
            "optional": {
                "voice": ("STRING", {"default": ""}),
                "base_url": ("STRING", {"default": _env_base_url()}),
                "timeout_sec": ("INT", {"default": 60, "min": 5, "max": 600}),
            },
        }

    RETURN_TYPES = ("AUDIO",)
    RETURN_NAMES = ("audio",)
    FUNCTION = "run"
    CATEGORY = "Audio • Musai API"

    def run(self, text: str, voice: str = "", base_url: str = "", timeout_sec: int = 60):
        url = (base_url or _env_base_url()).rstrip("/") + "/tts"
        payload = {"text": text}
        if voice.strip():
            payload["voice"] = voice.strip()
        try:
            r = requests.post(url, json=payload, timeout=_get_timeout(timeout_sec))
            if r.status_code != 200:
                # Try to surface server message
                msg = r.text
                try:
                    msg = r.json()
                except Exception:
                    pass
                raise RuntimeError(f"/tts error {r.status_code}: {msg}")
            audio = _to_audio_dict(r.content)
            return (audio,)
        except Exception as e:
            raise RuntimeError(f"MusaiTTS failed: {e}") from e


class MusaiSTT:
    """
    POST /stt (multipart) -> {"text": "..."}
    Input: Comfy AUDIO dict (will be encoded to WAV and uploaded).
    """
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "audio": ("AUDIO",),
            },
            "optional": {
                "base_url": ("STRING", {"default": _env_base_url()}),
                "timeout_sec": ("INT", {"default": 120, "min": 10, "max": 600}),
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "run"
    CATEGORY = "Audio • Musai API"

    def run(self, audio, base_url: str = "", timeout_sec: int = 120):
        url = (base_url or _env_base_url()).rstrip("/") + "/stt"
        wav_bytes = _from_audio_dict(audio)
        files = {"file": ("audio.wav", wav_bytes, "audio/wav")}
        try:
            r = requests.post(url, files=files, timeout=_get_timeout(timeout_sec))
            if r.status_code != 200:
                msg = r.text
                try:
                    msg = r.json()
                except Exception:
                    pass
                raise RuntimeError(f"/stt error {r.status_code}: {msg}")
            data = r.json()
            return (data.get("text", "").strip(),)
        except Exception as e:
            raise RuntimeError(f"MusaiSTT failed: {e}") from e


class MusaiVoices:
    """
    GET /voices -> list of voices; returns as JSON string for convenience.
    """
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "optional": {
                "base_url": ("STRING", {"default": _env_base_url()}),
                "timeout_sec": ("INT", {"default": 20, "min": 5, "max": 120}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("json",)
    FUNCTION = "run"
    CATEGORY = "Audio • Musai API"

    def run(self, base_url: str = "", timeout_sec: int = 20):
        url = (base_url or _env_base_url()).rstrip("/") + "/voices"
        try:
            r = requests.get(url, timeout=_get_timeout(timeout_sec))
            if r.status_code != 200:
                raise RuntimeError(f"/voices error {r.status_code}: {r.text}")
            return (json.dumps(r.json(), indent=2),)
        except Exception as e:
            raise RuntimeError(f"MusaiVoices failed: {e}") from e


NODE_CLASS_MAPPINGS = {
    "MusaiTTS": MusaiTTS,
    "MusaiSTT": MusaiSTT,
    "MusaiVoices": MusaiVoices,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MusaiTTS": "Musai TTS (Piper via API)",
    "MusaiSTT": "Musai STT (Whisper via API)",
    "MusaiVoices": "Musai Voices (List)",
}
