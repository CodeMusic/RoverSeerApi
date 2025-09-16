# musicgen_hf_node.py
import os
import numpy as np
import torch
from typing import Optional, Dict, Any

from transformers import AutoProcessor, MusicgenForConditionalGeneration

# --------- helpers ---------
def _audio_from_comfy(a: Dict[str, Any]) -> Optional[torch.Tensor]:
    """Accept Comfy AUDIO dict -> (1,T) float32 mono at 32kHz (resample if needed)."""
    if not (isinstance(a, dict) and "waveform" in a and "sample_rate" in a):
        return None
    wf = a["waveform"]   # expected (1,C,T) or (C,T)
    sr = int(a["sample_rate"])
    if wf.ndim == 3:     # (1,C,T) -> (C,T)
        wf = wf[0]
    if wf.ndim == 1:     # (T) -> (1,T)
        wf = wf.unsqueeze(0)
    if wf.ndim == 2 and wf.shape[0] > 1:  # mix to mono
        wf = wf.mean(dim=0, keepdim=True)
    wf = wf.clamp(-1, 1).to(torch.float32)

    if sr != 32000:
        import torchaudio
        wf = torchaudio.functional.resample(wf, sr, 32000)
    return wf  # (1,T)

# --------- main node ---------
class MusicGen:
    """
    HF MusicGen for ComfyUI.
    Uses model.generate(...). Works on CPU/MPS. No CUDA or bfloat16 assumptions.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "prompt": ("STRING", {"multiline": True, "default": "indie folk, warm acoustic guitar, gentle reverb"}),
                "model_variant": ([
                    "facebook/musicgen-small",
                    "facebook/musicgen-melody",
                ], {"default": "facebook/musicgen-small"}),
                "max_new_tokens": ("INT", {"default": 256, "min": 64, "max": 2048, "step": 64}),
                "guidance_scale": ("FLOAT", {"default": 2.0, "min": 0.0, "max": 6.0, "step": 0.1}),
                "temperature": ("FLOAT", {"default": 1.0, "min": 0.1, "max": 2.0, "step": 0.1}),
                "top_k": ("INT", {"default": 50, "min": 0, "max": 200, "step": 1}),
                "top_p": ("FLOAT", {"default": 0.95, "min": 0.1, "max": 1.0, "step": 0.01}),
            },
            "optional": {
                # Provide either a Comfy AUDIO dict or leave empty for text-only
                "melody": ("AUDIO",),
            }
        }

    RETURN_TYPES = ("AUDIO",)
    RETURN_NAMES = ("audio",)
    FUNCTION = "run"
    CATEGORY = "Audio • MusicGen"

    def run(self, prompt: str, model_variant: str,
            max_new_tokens: int, guidance_scale: float, temperature: float,
            top_k: int, top_p: float, melody=None):

        device = "mps" if torch.backends.mps.is_available() else "cpu"

        processor = AutoProcessor.from_pretrained(model_variant)
        model = MusicgenForConditionalGeneration.from_pretrained(model_variant)
        model = model.to(device)  # keep float32 on MPS

        # Build inputs with processor
        kwargs = dict(text=[prompt], return_tensors="pt", padding=True)
        mel = _audio_from_comfy(melody) if melody is not None else None
        if mel is not None:
            kwargs["audio"] = mel
        inputs = processor(**kwargs).to(device)

        # Ensure pad/eos tokens exist
        if model.config.pad_token_id is None:
            model.config.pad_token_id = processor.tokenizer.pad_token_id
        if model.config.eos_token_id is None:
            model.config.eos_token_id = processor.tokenizer.eos_token_id

        with torch.inference_mode():
            out = model.generate(
                **inputs,
                do_sample=True,
                guidance_scale=float(guidance_scale),
                max_new_tokens=int(max_new_tokens),
                temperature=float(temperature),
                top_k=int(top_k),
                top_p=float(top_p),
            )
            # out: (B, C, T)
        audio = out[0].to("cpu")  # (C,T)
        sr = getattr(getattr(model.config, "audio_encoder", None), "sampling_rate", 32000) or 32000

        # Comfy AUDIO dict expects (1, C, T)
        return ({"waveform": audio.unsqueeze(0), "sample_rate": int(sr)},)

NODE_CLASS_MAPPINGS = {
    "MusicGen": MusicGen,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "MusicGen": "MusicGen",
}
