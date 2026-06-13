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

| name | mode | requires | cost | notes |
|------|------|----------|------|-------|
| `synth` | local | nothing | **free** | **default.** Composes real instrumental music (chords+bass+melody+drums) fully offline — see `synth/` |
| `mock` | mock | nothing | free | tiny deterministic sine-tone WAV; for fast CI/unit assertions |
| `replicate` / `hosted` | hosted | `REPLICATE_API_TOKEN` | paid | runs open models (default `meta/musicgen`) |
| `local` | local | `LOCAL_MUSIC_URL` | free* | talks to the Python sidecar in `ml/` (*one-time model download) |

The default (`synth`) needs **no API key, no GPU, no payment** and runs anywhere.

**Vocals:** the `synth` backend also *sings the lyrics* by default — a from-scratch
formant vowel synth (`synth/voice.js`) pitches the lyric's vowels to the melody with
vibrato. It's robotic (no trained model), but it's free and offline. Disable with
`--no-vocals` (or `providers.vocals: 'none'`). Realistic neural singing (Piper/Bark) is
a planned opt-in.

```bash
# free offline synth (default) — real composed music + sung vocals
node src/song/cli.js "sunset drive" --genre synthwave --key "A minor" --tempo 110 --seconds 18

# instrumental only
node src/song/cli.js "sunset drive" --genre synthwave --no-vocals --seconds 18

# tiny mock tone (fast)
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
