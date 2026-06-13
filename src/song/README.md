# Song pipeline (`src/song`)

Turns a prompt (or partial `SongSpec`) into a real audio file. See `docs/PLAN.md`
for the full roadmap.

```
generateSong(input)
  → createSongSpec()      normalize + defaults
  → validateSongSpec()    { valid, errors }
  → generateLyrics()      deterministic placeholder (LLM in M2); skips locked sections
  → resolveProvider(spec.providers.music).generate()
  → { songSpec, lyrics, audio }   // audio.filePath is a real .wav
```

## Providers (the abstraction)

Choose a backend per stage via `SongSpec.providers.music` — no code change:

| name | mode | requires | notes |
|------|------|----------|-------|
| `mock` | mock | nothing | writes a real sine-tone WAV; default; powers CI |
| `replicate` / `hosted` | hosted | `REPLICATE_API_TOKEN` | runs open models (default `meta/musicgen`) |
| `local` | local | `LOCAL_MUSIC_URL` | talks to the Python sidecar in `ml/` |

```bash
# mock (no setup)
node src/song/cli.js "a dreamy synthwave track" --provider mock --seconds 2

# hosted
REPLICATE_API_TOKEN=r8_... node src/song/cli.js "lofi beat" --provider replicate

# local (start the sidecar first — see ml/server.py)
LOCAL_MUSIC_URL=http://127.0.0.1:8000/generate node src/song/cli.js "jazz" --provider local
```

## Tests

```bash
npm test     # node --test, no GPU/keys; HTTP is mocked for hosted/local providers
```
