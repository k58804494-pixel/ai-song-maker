/**
 * ReplicateMusicProvider — hosted backend (M1).
 *
 * Uses Replicate's HTTP API to run an open text-to-music model (default
 * `meta/musicgen`). One API token unlocks many open models, so we don't host
 * any model ourselves. Gated on `REPLICATE_API_TOKEN`; when absent the registry
 * surfaces a clear "not available" error and callers can pick another provider.
 *
 * `fetch`, `sleep`, and `now` are injectable so the network flow is unit-tested
 * deterministically without real API calls (see ReplicateMusicProvider.test.js).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

import { BaseMusicProvider } from './BaseMusicProvider.js';
import { buildMusicPrompt, clampDuration } from '../prompt.js';

const API_ROOT = 'https://api.replicate.com/v1';

export class ReplicateMusicProvider extends BaseMusicProvider {
  constructor(config = {}) {
    super(config);
    this.token = config.token ?? process.env.REPLICATE_API_TOKEN ?? null;
    this.model = config.model ?? 'meta/musicgen';
    this.fetchImpl = config.fetch ?? globalThis.fetch;
    this.sleep = config.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.now = config.now ?? (() => Date.now());
    this.pollIntervalMs = config.pollIntervalMs ?? 1500;
    this.maxWaitMs = config.maxWaitMs ?? 5 * 60 * 1000;
  }

  get name() {
    return 'replicate';
  }

  get mode() {
    return 'hosted';
  }

  isAvailable() {
    return Boolean(this.token) && typeof this.fetchImpl === 'function';
  }

  /** Map a SongSpec to MusicGen inputs. */
  buildInput(songSpec) {
    return {
      prompt: buildMusicPrompt(songSpec),
      duration: clampDuration(songSpec.durationSec),
      output_format: 'wav',
      normalization_strategy: 'loudness'
    };
  }

  async generate(songSpec, opts = {}) {
    if (!this.isAvailable()) {
      throw new Error('ReplicateMusicProvider unavailable: set REPLICATE_API_TOKEN');
    }
    const startTime = this.now();
    const input = this.buildInput(songSpec);

    const prediction = await this._createPrediction(input);
    const finished = await this._poll(prediction);

    const audioUrl = Array.isArray(finished.output) ? finished.output[0] : finished.output;
    if (!audioUrl) {
      throw new Error('Replicate prediction succeeded but returned no audio output');
    }

    const bytes = await this._download(audioUrl);

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
      sourceUrl: audioUrl,
      format: 'wav',
      bytes: bytes.length,
      durationSec: input.duration,
      intendedDurationSec: songSpec.durationSec,
      renderTimeMs: this.now() - startTime,
      watermarked: Boolean(songSpec.license?.watermark),
      metadata: {
        model: this.model,
        prompt: input.prompt,
        predictionId: finished.id
      }
    };
  }

  async _createPrediction(input) {
    const res = await this.fetchImpl(`${API_ROOT}/models/${this.model}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    });
    if (!res.ok) {
      throw new Error(`Replicate create failed: ${res.status} ${await safeText(res)}`);
    }
    return res.json();
  }

  async _poll(prediction) {
    let current = prediction;
    const deadline = this.now() + this.maxWaitMs;

    while (!['succeeded', 'failed', 'canceled'].includes(current.status)) {
      if (this.now() > deadline) {
        throw new Error(`Replicate prediction timed out after ${this.maxWaitMs}ms`);
      }
      await this.sleep(this.pollIntervalMs);
      const getUrl = current.urls?.get ?? `${API_ROOT}/predictions/${current.id}`;
      const res = await this.fetchImpl(getUrl, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if (!res.ok) {
        throw new Error(`Replicate poll failed: ${res.status} ${await safeText(res)}`);
      }
      current = await res.json();
    }

    if (current.status !== 'succeeded') {
      throw new Error(`Replicate prediction ${current.status}: ${current.error ?? 'unknown error'}`);
    }
    return current;
  }

  async _download(url) {
    const res = await this.fetchImpl(url);
    if (!res.ok) {
      throw new Error(`Failed to download audio: ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
