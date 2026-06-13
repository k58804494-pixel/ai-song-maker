"""
AURAVOX local ML sidecar (reference implementation).

Serves a text-to-music model behind the contract expected by
`src/song/providers/LocalMusicProvider.js`:

    POST /generate  { "prompt": str, "duration": int, "format": "wav" }
    ->              { "audio_base64": str, "format": "wav" }

This keeps the heavy model (MusicGen) in Python while the Node orchestrator
stays thin. Run it, then point the Node side at it:

    pip install -r ml/requirements.txt
    uvicorn ml.server:app --host 127.0.0.1 --port 8000
    export LOCAL_MUSIC_URL=http://127.0.0.1:8000/generate

NOTE: MusicGen needs torch + audiocraft and is much faster on a GPU. The model
is loaded lazily on first request so the server starts instantly.
"""
from __future__ import annotations

import base64
import io

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="AURAVOX Local Music Sidecar")

_model = None


class GenerateRequest(BaseModel):
    prompt: str
    duration: int = 8
    format: str = "wav"


def _get_model():
    """Lazily load MusicGen so import/startup is cheap."""
    global _model
    if _model is None:
        from audiocraft.models import MusicGen  # type: ignore

        _model = MusicGen.get_pretrained("facebook/musicgen-small")
    return _model


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/generate")
def generate(req: GenerateRequest) -> dict:
    import torchaudio  # type: ignore

    model = _get_model()
    model.set_generation_params(duration=req.duration)
    wav = model.generate([req.prompt])[0].cpu()

    buf = io.BytesIO()
    torchaudio.save(buf, wav, model.sample_rate, format="wav")
    audio_b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return {"audio_base64": audio_b64, "format": "wav"}
