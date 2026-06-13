/**
 * LocalMusicProvider — local/open backend (M1).
 *
 * Talks to a local ML sidecar (the Python FastAPI service in `ml/`) over HTTP so
 * the heavy model (MusicGen / DiffRhythm) runs in Python while the Node
 * orchestrator stays thin. This keeps "local mode" fully decoupled — no credit
 * wall, runs offline/private. Gated on `LOCAL_MUSIC_URL`; absent → registry
 * reports it unavailable.
 *
 * Contract — the sidecar's POST {endpoint} accepts:
 *   { prompt: string, duration: number, format: "wav" }
 * and responds with either:
 *   { audio_base64: string, format?: string }   (preferred, self-contained)
 * or { url: string }                            (provider downloads it)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

import { BaseMusicProvider } from './BaseMusicProvider.js';
import { buildMusicPrompt, clampDuration } from '../prompt.js';

export class LocalMusicProvider extends BaseMusicProvider {
  constructor(config = {}) {
    super(config);
    this.endpoint = config.endpoint ?? process.env.LOCAL_MUSIC_URL ?? null;
    this.fetchImpl = config.fetch ?? globalThis.fetch;
    this.now = config.now ?? (() => Date.now());
    this.model = config.model ?? 'musicgen-local';
  }

  get name() {
    return 'local';
  }

  get mode() {
    return 'local';
  }

  isAvailable() {
    return Boolean(this.endpoint) && typeof this.fetchImpl === 'function';
  }

  async generate(songSpec, opts = {}) {
    if (!this.isAvailable()) {
      throw new Error('LocalMusicProvider unavailable: set LOCAL_MUSIC_URL to the ML sidecar');
    }
    const startTime = this.now();
    const prompt = buildMusicPrompt(songSpec);
    const duration = clampDuration(songSpec.durationSec, 60);

    const res = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration, format: 'wav' })
    });
    if (!res.ok) {
      throw new Error(`Local ML sidecar failed: ${res.status}`);
    }
    const payload = await res.json();

    let bytes;
    if (payload.audio_base64) {
      bytes = Buffer.from(payload.audio_base64, 'base64');
    } else if (payload.url) {
      const dl = await this.fetchImpl(payload.url);
      if (!dl.ok) throw new Error(`Failed to download local audio: ${dl.status}`);
      bytes = Buffer.from(await dl.arrayBuffer());
    } else {
      throw new Error('Local ML sidecar response missing audio_base64 or url');
    }

    const outDir = opts.outDir || join(tmpdir(), 'auravox-songs');
    await mkdir(outDir, { recursive: true });
    const id = `mus_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const filePath = join(outDir, `${id}.wav`);
    await writeFile(filePath, bytes);

    return {
      id,
      type: 'music',
      provider: this.name,
      mode: this.mode,
      filePath,
      url: `file://${filePath}`,
      format: payload.format || 'wav',
      bytes: bytes.length,
      durationSec: duration,
      intendedDurationSec: songSpec.durationSec,
      renderTimeMs: this.now() - startTime,
      watermarked: Boolean(songSpec.license?.watermark),
      metadata: { model: this.model, prompt, endpoint: this.endpoint }
    };
  }
}
