/**
 * LocalSynthProvider — the default, fully-free, fully-offline backend.
 *
 * Composes and synthesizes real instrumental music (chords + bass + melody +
 * drums) from a SongSpec using the from-scratch engine in `../synth`. No model,
 * no network, no API key, no GPU — so it costs nothing and runs anywhere,
 * including CI. Higher-fidelity neural backends (replicate/local) remain opt-in.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

import { BaseMusicProvider } from './BaseMusicProvider.js';
import { arrange } from '../synth/arranger.js';
import { encodeWav } from '../wav.js';

export class LocalSynthProvider extends BaseMusicProvider {
  get name() {
    return 'synth';
  }

  get mode() {
    return 'local';
  }

  isAvailable() {
    return true; // pure computation, always works
  }

  /**
   * @param {object} songSpec validated SongSpec
   * @param {object} [opts]
   * @param {string} [opts.outDir]
   * @param {number} [opts.renderSeconds] cap render length
   */
  async generate(songSpec, opts = {}) {
    const startTime = Date.now();
    const maxSeconds = Math.min(opts.renderSeconds ?? 30, songSpec.durationSec);

    // Sing the lyrics unless vocals are explicitly disabled ('none'/empty).
    const vocalsSetting = songSpec.providers?.vocals;
    const vocals = Boolean(vocalsSetting) && vocalsSetting !== 'none';

    const { samples, sampleRate, durationSec, bars, bpm, progression } = arrange(songSpec, { maxSeconds, vocals });
    const wav = encodeWav(samples, sampleRate);

    const outDir = opts.outDir || join(tmpdir(), 'auravox-songs');
    await mkdir(outDir, { recursive: true });
    const id = `mus_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const filePath = join(outDir, `${id}.wav`);
    await writeFile(filePath, wav);

    return {
      id,
      type: 'music',
      provider: this.name,
      mode: this.mode,
      filePath,
      url: `file://${filePath}`,
      format: 'wav',
      sampleRate,
      bytes: wav.length,
      durationSec,
      intendedDurationSec: songSpec.durationSec,
      renderTimeMs: Date.now() - startTime,
      watermarked: Boolean(songSpec.license?.watermark),
      cost: 0,
      metadata: {
        model: 'auravox-synth-v1',
        engine: 'procedural',
        bars,
        bpm,
        key: songSpec.key,
        genre: songSpec.genre,
        progression,
        vocals
      }
    };
  }
}
