# AURAVOX Song Maker — Product & Engineering Plan

> Goal: turn the current AURAVOX prototype into a real, end‑to‑end **AI song maker** that is
> *better than Suno* — not just "another text‑to‑song button", but a controllable,
> editable, commercial‑safe music studio.

This document **extends** the existing README/architecture. It records where we are today,
the gaps, the target architecture, a phased roadmap, and how we plan to win against Suno.

---

## 1. Where we are today (honest audit)

The repo is currently the **AURAVOX** multi‑agent "AI OS" prototype. The music piece is a
**stub**, not a working product:

- `src/engines/MediaGenerationEngine.js` → `generateMusic()` returns a fake object with
  `url: '[Generated audio URL]'`. **No audio is produced.**
- `synthesizeVoice()` is likewise simulated (`url: '[Generated audio URL]'`).
- `auravox-prime/src/MediaGenerationEngine.js` is a **scene/cinematic** director
  (image/video focus) running in `mode = 'SIMULATION'`. No song pipeline.
- There is **no lyric generation, no melody/chord/arrangement logic, no singing‑voice
  synthesis, no mixing/mastering, no stems, no audio file output, and no UI**.
- No backend service, no job queue, no storage, no tests for music, no eval harness.

**Conclusion:** the "song maker" is aspirational. Everything below treats music as a
first‑class product and reuses AURAVOX's genuinely useful parts — the multi‑agent
orchestrator, the `SafetyGovernor`, and the `MemoryGraphEngine` — as the brain that drives
an *agentic, self‑critiquing* music pipeline.

---

## 2. What makes Suno strong (so we must match it)

From current reviews of Suno v4.5/v5:

- One‑prompt → full song with vocals + lyrics + arrangement in ~30s.
- Up to ~8‑minute songs, multi‑part structure, clean audio across mainstream genres.
- Stem separation and "Personas" on paid tiers.

We must reach **parity** on: fast full‑song generation, coherent multi‑section structure,
natural vocals, and clean mainstream‑pop mixes.

## 3. Where Suno is weak (this is where we win)

Documented, repeated complaints about Suno:

1. **Vocals still sound synthetic** on complex styles; vocal↔instrument **sync** issues.
2. **Weak on hard genres** — jazz, orchestral, contemporary classical, prog, dense hip‑hop flows.
3. **Weak non‑English**; many languages sound stilted.
4. **Limited creative control** — mostly "generate and hope"; real editing/stems gated behind paid tiers.
5. **General‑purpose mix only** — not ready for film/TV/game sync without remastering.
6. **Legal/licensing ambiguity** (RIAA suit, undisclosed training data) — risky for commercial use.
7. **Poor support / credit & billing frustration.**

---

## 4. Our differentiators (the moat)

| Suno pain | AURAVOX Song Maker answer |
|---|---|
| "Generate and hope", weak editing | **Section‑level control & regeneration** — edit `[Verse]/[Chorus]`, regenerate one section, extend, inpaint a bad bar, lock the parts you like |
| Synthetic vocals, sync issues | **Dual‑track pipeline** (vocals + accompaniment generated separately) with **sentence‑level lyric→vocal alignment**; phoneme/pitch control |
| Hard genres fail | **Music‑theory scaffolding** — generate chord chart + MIDI structure first, then condition audio on it (jazz changes, orchestral voicing, complex meters) |
| Weak multilingual | **Multilingual‑first** lyric + phoneme handling, not English‑only |
| Mix not media‑ready | **Stems by default + mastering profiles** (streaming, film/TV, game loop), DAW export (MIDI + stems + project) |
| Legal ambiguity | **Provenance & licensing built in** — provider abstraction over *cleared/open* models, C2PA content credentials, audio watermarking, per‑song license manifest → commercial‑safe |
| Locked behind credits | **Bring‑your‑own‑model / local mode** — open models (DiffRhythm, ACE‑Step, MusicGen, Bark) run locally; no per‑credit wall; privacy/offline |
| "Generate once" quality ceiling | **Agentic self‑critique loop** — reuse AURAVOX `CriticAgent`: analyze output (loudness, lyric intelligibility via ASR, pitch/timing), auto‑regenerate weak sections until quality bar is met |

The agentic refinement loop is the key structural advantage: Suno generates once; we
**listen, critique, and iterate** automatically using the multi‑agent system already in the repo.

---

## 5. Target architecture

A real song pipeline is ML‑heavy and Python‑centric, so we split responsibilities:

```
                 ┌─────────────────────────────────────────────┐
  Web UI  ──────▶│  Node Orchestrator (existing AURAVOX core)   │
 (editor)        │  OrchestratorCore · SafetyGovernor · Memory  │
                 │  CreativeAgent (writer) · CriticAgent (ears)  │
                 └───────────────┬─────────────────────────────┘
                                 │ job spec (SongSpec JSON)
                                 ▼
                 ┌─────────────────────────────────────────────┐
                 │  Python ML service (FastAPI) + job queue     │
                 │  provider abstraction: local GPU or hosted    │
                 ├───────────────────────────────────────────────┤
                 │ 1. Lyrics       (LLM, structure+meter aware)  │
                 │ 2. Composition  (chords/melody → MIDI scaffold)│
                 │ 3. Vocals       (singing‑voice synth from MIDI)│
                 │ 4. Accompaniment(text‑to‑music on chords)     │
                 │ 5. Mix/Master   (align, EQ, loudness, stems)  │
                 │ 6. Analyze/QA   (ASR WER, LUFS, pitch/timing) │
                 └───────────────┬─────────────────────────────┘
                                 ▼
                 Object storage (audio/stems/MIDI) + Project DB
```

### Core data contract: `SongSpec`
A single structured object that flows through every stage and is the unit of editing:

```jsonc
{
  "title": "Neon Rain",
  "genre": "synthwave", "mood": "nostalgic", "tempo": 110, "key": "A minor",
  "language": "en", "durationSec": 180,
  "structure": [
    { "section": "Intro",  "bars": 8 },
    { "section": "Verse",  "bars": 16, "lyrics": "..." },
    { "section": "Chorus", "bars": 16, "lyrics": "...", "locked": true }
  ],
  "voice": { "personaId": null, "gender": "any", "style": "smooth" },
  "providers": { "lyrics": "llm", "music": "diffrhythm-local", "vocals": "bark" },
  "license": { "model": "open", "watermark": true }
}
```

`locked: true` sections are never regenerated — this is what enables iterative control.

### Provider abstraction
One interface, many backends, chosen per‑stage at runtime:

- **Hosted (fast, no GPU):** ElevenLabs (music + TTS), Stability Audio, Google Lyria,
  Replicate‑hosted open models. *(We deliberately do not depend on Suno/Udio APIs — we compete with them.)*
- **Local/open (no credits, private):** DiffRhythm / ACE‑Step / YuE (full song),
  MusicGen + Stable Audio Open (instrumental), Bark / RVC / so‑vits (vocals),
  Demucs (stems), basic‑pitch (audio→MIDI).

This is what powers the "commercial‑safe" and "no credit wall" differentiators.

### Tech stack
- **Backend brain:** keep existing Node/ESM AURAVOX orchestrator + agents.
- **ML service:** Python **FastAPI** worker(s) + a job queue (BullMQ/Redis or RQ) for long renders; progress streamed to UI.
- **Frontend:** web song editor — prompt box, structured **lyric editor** with section tags,
  waveform + per‑stem mixer, "regenerate section / extend / lock", project library.
- **Storage:** object storage for audio/stems/MIDI; Postgres (or SQLite to start) for projects/users.

---

## 6. Phased roadmap (each phase ships something usable)

- **M0 — Foundations & contract (no models yet)**
  - Define `SongSpec` schema + validation; provider interface; job/queue skeleton; storage abstraction.
  - Replace the stub `generateMusic()` with a real pipeline entrypoint backed by a **mock provider** that returns a tiny real audio file (silence/tone) so the whole flow is testable end‑to‑end.

- **M1 — First real song (vertical slice)** — *decided: both hosted + local behind the provider abstraction*
  - Ship **two interchangeable providers** behind the same interface from day one: one **hosted** backend
    (fastest path to good audio) and one **local/open** backend (no credit wall, private), plus the
    **mock** provider for CI. Selectable per‑stage via `SongSpec.providers`.
  - Lyrics (LLM) → selected text‑to‑song provider → **playable audio file** for a one‑line prompt.
  - Minimal UI: prompt in, audio out, provider picker, library of generations.
  - Rationale: locking the provider interface now (rather than wiring one vendor) prevents rework and
    makes the hosted↔local swap a config change, not a refactor. Local model *quality/perf hardening*
    still lands in M5; M1 only proves the abstraction works end‑to‑end with at least one of each.

- **M1.5 — Free-first default (`synth` provider)** — *added per kamil: "make it fully from scratch so I don't pay for anything"*
  - A from‑scratch, dependency‑free composing synth is now the **default** backend: music‑theory chord
    progressions per genre/key + bass + melody + drum synthesis, arranged over the song structure and
    mixed to a real WAV. **No API key, no GPU, no payment**, runs anywhere (incl. CI). See `src/song/synth/`.
  - Paid/hosted (`replicate`) and heavier local‑model (`local`) backends stay opt‑in for higher fidelity.
  - Honest gap: realistic neural *singing vocals* still need a trained model — free options (Piper/Bark,
    one‑time download, no payment) are the planned next step; the synth covers instrumentals today.

- **M2 — Structure & control**
  - Section‑aware generation from `structure[]`; lyric editor with `[Verse]/[Chorus]` tags;
    **regenerate‑section** and **section lock**; extend/continue.

- **M3 — Quality moat: dual‑track + critique loop**
  - Separate vocals/accompaniment; **stems** via Demucs; CriticAgent QA (ASR lyric WER, LUFS,
    pitch/timing) auto‑regenerating sections below a quality bar.

- **M4 — Theory‑aware hard genres**
  - Chord/melody/MIDI scaffold stage; condition audio on it; target jazz/orchestral/complex meter
    where Suno is weak. MIDI export.

- **M5 — Local/open mode hardening + provenance**
  - Production‑grade local backends (DiffRhythm/ACE‑Step/MusicGen/Bark) on GPU — quality, latency,
    batching, model management (the M1 local provider is a minimal proof‑of‑concept); C2PA content
    credentials, audio watermarking, per‑song license manifest.

- **M6 — Personas, multilingual, mastering profiles, DAW export**
  - Consent‑gated voice personas; multilingual lyric/phoneme support; mastering presets
    (streaming/film/game); export stems + MIDI + project file.

---

## 7. Testing & evaluation strategy (`/test`)

Because output quality is subjective, we combine deterministic tests with objective audio metrics.

- **Unit:** `SongSpec` schema validation, lyric structure parsing (section tags, syllable/meter),
  provider interface conformance, queue/state transitions.
- **Integration (mock provider):** full prompt→pipeline→audio‑file path with a deterministic fake
  backend so CI never needs a GPU or paid API key. Verifies a real, non‑empty audio artifact is produced.
- **Audio QA harness (objective metrics):**
  - **Lyric intelligibility:** run ASR on the vocal stem, compute WER vs intended lyrics.
  - **Loudness:** integrated **LUFS** within target range per mastering profile.
  - **Timing/pitch:** beat/tempo deviation and pitch‑stability checks on the vocal stem.
  - **Structure:** rendered duration/sections match `SongSpec`.
- **Golden‑path E2E:** "generate a 30s pop song" → assert playable file + metrics pass.
- **UI E2E (recorded):** prompt → generate → play → regenerate one section → export, captured as a
  screen recording for the PR.
- **Regression suite:** a fixed set of prompts + cached outputs; flag metric regressions over time.
- **CI:** lint + unit + mock‑integration on every PR (no secrets/GPU required); model‑backed evals
  run nightly on a GPU runner.

---

## 8. Risks & mitigations

- **GPU cost/latency** → hosted providers for M1–M3; local mode optional; async job queue + progress UI.
- **Model licensing/copyright** → open/cleared models only by default; provenance + watermarking; no artist‑voice cloning without consent.
- **Vocal quality ceiling** → dual‑track + critique loop + section regeneration instead of one‑shot.
- **Eval subjectivity** → objective metrics (WER/LUFS/pitch) as guardrails + small human rating panel.
- **Scope creep** → ship vertical slices (M1 first); keep `SongSpec` as the stable contract.

---

## 9. Immediate next steps (proposed PRs)

1. **This PR:** the plan (`docs/PLAN.md`).
2. `SongSpec` schema + validator + provider interface + mock provider (M0).
3. Real `generateMusic()` entrypoint wired to the mock provider + first unit/integration tests.
4. M1 vertical slice behind one hosted provider + minimal UI.

> **Decision (kamil):** support **both hosted and local/open models behind the provider abstraction**
> from M1. The provider interface is the stable contract; choosing a backend is a per‑stage config
> value in `SongSpec.providers`, not a code change.
