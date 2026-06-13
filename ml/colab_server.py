"""
AURAVOX neural backend (Colab / GPU).

A single self-contained FastAPI service that runs real open-source models on a
GPU and returns finished audio to the static web app:

    MusicGen  (facebook/musicgen-small)  -> instrumental track
    Bark      (suno/bark-small)          -> sung/spoken vocal from the lyrics

It is designed to run on a free Google Colab T4 and be reached from the GitHub
Pages site through a public tunnel (see ml/AURAVOX_Colab.ipynb). CORS is open so
the browser app on https://<user>.github.io can call it cross-origin.

Contract (superset of the old ml/server.py so LocalMusicProvider still works):

    POST /generate
      {
        "prompt":   str,             # free-text idea / scene
        "genre":    str  = "pop",
        "key":      str  = "C major",
        "tempo":    int  = 110,       # BPM
        "duration": int  = 18,        # seconds
        "vocals":   bool = true,
        "lyrics":   str  = "",        # newline-separated lines to sing
        "format":   "wav"
      }
    -> { "audio_base64": str, "format": "wav", "sample_rate": int,
         "has_vocals": bool, "models": {...} }

Models load lazily on first request so startup is instant.
"""
from __future__ import annotations

import base64
import io
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AURAVOX Neural Backend")

# The web app lives on a different origin (github.io / file://), so allow all.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MUSIC_MODEL = os.environ.get("AURAVOX_MUSIC_MODEL", "facebook/musicgen-small")
VOICE_MODEL = os.environ.get("AURAVOX_VOICE_MODEL", "suno/bark-small")
VOICE_PRESET = os.environ.get("AURAVOX_VOICE_PRESET", "v2/en_speaker_9")

_music = {"proc": None, "model": None, "sr": 32000}
_voice = {"proc": None, "model": None, "sr": 24000}


def _device() -> str:
    import torch

    return "cuda" if torch.cuda.is_available() else "cpu"


def _load_music():
    if _music["model"] is None:
        from transformers import AutoProcessor, MusicgenForConditionalGeneration

        proc = AutoProcessor.from_pretrained(MUSIC_MODEL)
        model = MusicgenForConditionalGeneration.from_pretrained(MUSIC_MODEL).to(_device())
        _music.update(proc=proc, model=model, sr=model.config.audio_encoder.sampling_rate)
    return _music


def _load_voice():
    if _voice["model"] is None:
        from transformers import AutoProcessor, BarkModel

        proc = AutoProcessor.from_pretrained(VOICE_MODEL)
        model = BarkModel.from_pretrained(VOICE_MODEL).to(_device())
        _voice.update(proc=proc, model=model, sr=model.generation_config.sample_rate)
    return _voice


def _music_prompt(req: "GenerateRequest") -> str:
    """Turn the structured fields into a rich MusicGen text prompt."""
    bits = [req.prompt.strip() or "an instrumental track"]
    bits.append(f"{req.genre} style")
    bits.append(f"in {req.key}")
    bits.append(f"{req.tempo} BPM")
    if req.vocals:
        bits.append("with space for a lead vocal")
    return ", ".join(bits)


def _to_mono_float(wav):
    """Accept torch tensor of shape [..., samples] -> 1-D float32 numpy."""
    import numpy as np
    import torch

    if isinstance(wav, torch.Tensor):
        wav = wav.detach().to("cpu").float()
        while wav.dim() > 1:
            # collapse batch / channel dims by taking the first row
            if wav.shape[0] == 1:
                wav = wav.squeeze(0)
            else:
                wav = wav.mean(dim=0)
        wav = wav.numpy()
    return np.asarray(wav, dtype="float32").reshape(-1)


def _resample(x, sr_in: int, sr_out: int):
    import numpy as np

    if sr_in == sr_out:
        return x
    import torch
    import torchaudio.functional as AF

    t = torch.from_numpy(np.asarray(x, dtype="float32"))
    return AF.resample(t, sr_in, sr_out).numpy()


def _normalize(x, peak: float = 0.97):
    import numpy as np

    m = float(np.max(np.abs(x))) if x.size else 0.0
    if m > 1e-6:
        x = x * (peak / m)
    return x


def _encode_wav(x, sr: int) -> str:
    import numpy as np
    from scipy.io import wavfile

    pcm = np.clip(x, -1.0, 1.0)
    pcm = (pcm * 32767.0).astype("<i2")
    buf = io.BytesIO()
    wavfile.write(buf, sr, pcm)
    return base64.b64encode(buf.getvalue()).decode("ascii")


class GenerateRequest(BaseModel):
    prompt: str = ""
    genre: str = "pop"
    key: str = "C major"
    tempo: int = 110
    duration: int = 18
    vocals: bool = True
    lyrics: str = ""
    format: str = "wav"


@app.get("/health")
def health() -> dict:
    import torch

    return {
        "status": "ok",
        "device": _device(),
        "cuda": torch.cuda.is_available(),
        "music_model": MUSIC_MODEL,
        "voice_model": VOICE_MODEL,
    }


@app.post("/generate")
def generate(req: GenerateRequest) -> dict:
    import numpy as np

    duration = max(4, min(int(req.duration), 60))

    # ---- 1) Instrumental via MusicGen -------------------------------------
    m = _load_music()
    prompt = _music_prompt(req)
    inputs = m["proc"](text=[prompt], padding=True, return_tensors="pt").to(_device())
    # MusicGen emits ~50 audio tokens per second.
    max_new_tokens = int(duration * 50)
    music_tokens = m["model"].generate(**inputs, do_sample=True, guidance_scale=3.0,
                                       max_new_tokens=max_new_tokens)
    music = _to_mono_float(music_tokens)
    music_sr = m["sr"]

    out_sr = music_sr
    mix = _normalize(music, 0.9)
    has_vocals = False

    # ---- 2) Vocal via Bark, mixed on top ----------------------------------
    lyrics = (req.lyrics or req.prompt or "").strip()
    if req.vocals and lyrics:
        v = _load_voice()
        # ♪ markers nudge Bark toward singing rather than plain speech.
        text = "♪ " + " ".join(lyrics.splitlines()) + " ♪"
        vin = v["proc"](text, voice_preset=VOICE_PRESET).to(_device())
        speech = v["model"].generate(**vin)
        voc = _to_mono_float(speech)
        voc = _resample(voc, v["sr"], out_sr)
        voc = _normalize(voc, 0.95)

        # Overlay: pad/truncate the vocal to the music length, then sum.
        if voc.shape[0] < mix.shape[0]:
            voc = np.pad(voc, (0, mix.shape[0] - voc.shape[0]))
        else:
            voc = voc[: mix.shape[0]]
        mix = _normalize(mix * 0.75 + voc * 0.9, 0.97)
        has_vocals = True

    return {
        "audio_base64": _encode_wav(mix, out_sr),
        "format": "wav",
        "sample_rate": out_sr,
        "has_vocals": has_vocals,
        "models": {"music": MUSIC_MODEL, "voice": VOICE_MODEL if has_vocals else None},
    }
