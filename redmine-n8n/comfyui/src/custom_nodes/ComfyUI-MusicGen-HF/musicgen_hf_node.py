import os, torch
from typing import List, Optional
from transformers import AutoProcessor, MusicgenForConditionalGeneration

def _device():
    if torch.cuda.is_available(): return "cuda"
    if torch.backends.mps.is_available(): return "mps"
    return "cpu"

def _sr_from_config(model):
    # MusicGen default is 32000
    return int(getattr(getattr(model, "config", object()), "sampling_rate", 32000))

class MusicGenHFNode:
    def __init__(self):
        self.device = _device()
        self.cache = {}  # (repo_path, melody_flag)->(model, processor)

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "model_variant": (["musicgen-small", "musicgen-melody"], {"default": "musicgen-small"}),
                "prompt": ("STRING", {"multiline": True, "default": "warm indie folk with gentle acoustic guitar"}),
                "duration_sec": ("INT", {"default": 10, "min": 1, "max": 60, "step": 1}),
            },
            "optional": {
                "melody_wav": ("AUDIO", ),
                "models_root": ("STRING", {"default": os.path.expanduser("~/redmine-n8n/ai-model-cache/comfyui-models/music/musicgen")}),
                "max_new_tokens": ("INT", {"default": 1024, "min": 64, "max": 4096, "step": 64}),
                "guidance_scale": ("FLOAT", {"default": 3.0, "min": 0.0, "max": 10.0, "step": 0.1}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 2**31-1}),
            }
        }

    CATEGORY = "🎧 Audio • Generators"
    RETURN_TYPES = ("AUDIO",)
    RETURN_NAMES = ("audio",)
    FUNCTION = "generate"

    def _load(self, models_root: str, model_variant: str):
        local_dir = os.path.join(models_root, model_variant)
        key = (local_dir, model_variant == "musicgen-melody", self.device)
        if key in self.cache:
            return self.cache[key]
        if not os.path.isdir(local_dir):
            raise FileNotFoundError(f"MusicGen weights not found at: {local_dir}")

        model = MusicgenForConditionalGeneration.from_pretrained(local_dir, torch_dtype=torch.float32)
        processor = AutoProcessor.from_pretrained(local_dir)
        model.to(self.device)
        model.eval()
        self.cache[key] = (model, processor)
        return model, processor

    def generate(self, model_variant: str, prompt: str, duration_sec: int,
                 melody_wav=None, models_root: str = None, max_new_tokens: int = 1024,
                 guidance_scale: float = 3.0, seed: int = 0):
        torch.manual_seed(seed if seed != 0 else torch.seed())

        model, processor = self._load(models_root, model_variant)

        # Prepare inputs
        inputs = processor(
            text=[prompt],
            padding=True,
            return_tensors="pt"
        ).to(self.device)

        # Optional melody conditioning (musicgen-melody)
        if model_variant == "musicgen-melody" and melody_wav is not None:
            wav = melody_wav["waveform"]
            sr = melody_wav["sample_rate"]
            # Processor will resample as needed when given "audio" kwarg
            mel_inputs = processor(
                audio=wav.squeeze(0).cpu().numpy(),
                sampling_rate=int(sr),
                return_tensors="pt"
            ).to(self.device)
            inputs.update(mel_inputs)

        # Generation params
        gen_kw = dict(
            do_sample=True,
            guidance_scale=guidance_scale,
            max_new_tokens=max_new_tokens,
        )
        # duration control via pad/stride is handled inside model; max_new_tokens proportional to seconds
        with torch.inference_mode():
            audio_tokens = model.generate(**inputs, **gen_kw)

        # Decode to waveform
        sr = _sr_from_config(model)
        audio = model.generate_audio(audio_tokens, do_sample=False)[0]  # [channels, samples]
        if audio.dim() == 1:
            audio = audio.unsqueeze(0)
        return ({"waveform": audio.contiguous().cpu(), "sample_rate": int(sr)},)

NODE_CLASS_MAPPINGS = {"MusicGenHFNode": MusicGenHFNode}
NODE_DISPLAY_NAME_MAPPINGS = {"MusicGenHFNode": "MusicGen (Transformers)"}
