# Kamil AI Node — distributed community GPU network (design / roadmap)

> Status: **design only.** This is a plan for a future, separate project. Nothing
> here is built yet. The AURAVOX song maker works today via Colab/Kaggle; this
> doc captures how we'd remove the dependency on a single Colab session by
> letting volunteers contribute GPU power.

## The idea (your words)
> A central Kamil AI server. Users install a "Kamil AI Node" app. When idle,
> their computer contributes GPU power. The server assigns tasks to available
> nodes. Users earn credits for helping.

This is a real, proven pattern — it already exists:
- **AI Horde / Stable Horde** — crowdsourced workers run image/text models; users
  spend/earn **"kudos"** credits; a central server matches jobs to workers. This
  is almost exactly Kamil AI Node, and it is **open-source (AGPL)** — we can adapt
  it instead of building from scratch.
- **Petals** — volunteers each host a slice of a large LLM; clients run inference
  across the swarm.
- **BOINC / Folding@home** — the original "idle home computers do work" networks.

So the concept is sound. The hard parts are operational, not conceptual.

## High-level architecture
```
   ┌────────────┐     1. submit job (prompt/spec)      ┌─────────────────────┐
   │  Web app   │ ───────────────────────────────────▶ │  Coordinator server │
   │ (browser)  │ ◀─────────────────────────────────── │  (job queue + API)  │
   └────────────┘     4. download finished audio        └─────────┬───────────┘
                                                                   │ 2. dispatch job
                                                                   ▼
                                                         ┌─────────────────────┐
                                                         │   Kamil AI Node      │
                                                         │ (volunteer GPU app)  │
                                                         │  pulls job → runs    │
                                                         │  MusicGen/Bark →     │
                                                         │  uploads result  ────┼──▶ 3. result
                                                         └─────────────────────┘
```

### Components
1. **Coordinator server** (central, always-on; small CPU box is fine)
   - REST/WebSocket API: `POST /jobs` (submit), `GET /jobs/:id` (poll), worker
     endpoints `GET /work` (claim) + `POST /work/:id/result` (return audio).
   - A job queue (Redis or Postgres + a simple state machine:
     `queued → assigned → running → done|failed|timeout`).
   - Matchmaking: hand a queued job to the first capable idle worker; re-queue on
     timeout so a dead node doesn't strand a job.
   - **Credits ("Kamil credits")**: workers earn on each verified completed job;
     submitters spend. Just ledger rows keyed to accounts.

2. **Kamil AI Node** (the volunteer app — the big new build)
   - Detects an NVIDIA GPU (CUDA). **Note:** integrated GPUs (e.g. Intel Iris Xe)
     can't run these models usefully — workers effectively need an NVIDIA card.
   - Long-polls the coordinator for work; when idle, claims a job, runs the same
     `colab_server.py` model code, uploads the WAV, reports done.
   - "Only when idle" throttle (pause if the user is gaming / on battery).
   - Ships as a small tray app (Electron or a Python+PyInstaller binary).

3. **Reachability** — workers are behind home NAT, so the **coordinator dispatches
   to workers** (workers poll out), not the other way around. No port-forwarding
   needed. This is exactly how AI Horde avoids NAT pain.

## The genuinely hard parts (be honest)
- **Security / trust** — you're running jobs on strangers' machines and trusting
  results. Need sandboxing on the node, and result validation (e.g. duplicate a
  fraction of jobs across two workers and compare) to catch cheaters farming
  credits with garbage output.
- **Abuse** — content moderation on submitted prompts; rate limits; sybil-resistant
  accounts so one person can't spin up fake nodes for free credits.
- **Quality variance** — different GPUs/driver versions → slightly different output;
  fine for music, but determinism guarantees go away.
- **Latency** — a job waits for a free worker; cold workers re-download models.
- **Cost floor** — the coordinator must always be up (cheap VPS), and you likely
  seed it with a few of your own GPU workers (rented) so it's not empty at launch.

## Realistic MVP roadmap
- **Phase 0 (now, done):** single Colab/Kaggle backend, web app calls it. ✅
- **Phase 1 — Coordinator MVP:** stand up the job queue + `POST /jobs`/`GET /jobs/:id`;
  point the web app at the coordinator instead of a raw tunnel URL. Run **one**
  worker (your Colab) that polls `GET /work`. This already fixes "the URL changes"
  because the browser only ever talks to the stable coordinator.
- **Phase 2 — Adapt AI Horde:** fork AI Horde, add a MusicGen/Bark worker type and
  an audio job schema, reuse its kudos/credits + matchmaking. Far less work than
  greenfield.
- **Phase 3 — Node app:** package the worker as an installable "Kamil AI Node" with
  idle detection + GPU auto-config; onboard a few volunteers.
- **Phase 4 — Trust & scale:** result validation, moderation, sybil resistance,
  a dashboard of live nodes + credit balances.

## Recommendation
Phase 1 alone removes the Colab-URL pain (browser → stable coordinator → your
Colab worker) for a fraction of the effort of the full network. Build that first;
grow into the volunteer network (Phases 2–4) only once the song maker has real
usage. The full network is a multi-week project of its own — worth it only if you
want a public, multi-user platform.
