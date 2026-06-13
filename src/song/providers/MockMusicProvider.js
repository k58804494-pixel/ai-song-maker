/**
 * MockMusicProvider — deterministic, dependency-free backend that writes a real
 * (tiny) WAV file. It lets the entire pipeline + tests run in CI with no GPU and
 * no API keys, while still producing a genuine, playable audio artifact.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

import { BaseMusicProvider } from './BaseMusicProvider.js';
import { encodeWav, sineTone } from '../wav.js';

// Rough mapping of a few musical keys to a base frequency (Hz) so different
// specs yield audibly different mock output.
const KEY_FREQUENCIES = {
  'C major': 261.63,
  'C minor': 261.63,
  'A minor': 220.0,
  'A major': 220.0,
  'G major': 196.0,
  'E minor': 164.81,
  'D major': 293.66,
  'F major': 349.23
};

export class MockMusicProvider extends BaseMusicProvider {
  get name() {
    return 'mock';
  }

  get mode() {
    return 'mock';
  }

  /**
   * @param {object} songSpec  validated SongSpec
   * @param {object} [opts]
   * @param {string} [opts.outDir]   directory to write the audio file into
   * @param {number} [opts.renderSeconds]  cap the rendered audio length (keeps test files tiny)
   */
  async generate(songSpec, opts = {}) {
    const startTime = Date.now();
    const sampleRate = 44100;
    // Keep the artifact tiny in tests but still real; default to 2s preview.
    const renderSeconds = Math.min(opts.renderSeconds ?? 2, songSpec.durationSec);
    const frequency = KEY_FREQUENCIES[songSpec.key] ?? 261.63;

    const samples = sineTone({ frequency, durationSec: renderSeconds, sampleRate });
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
      durationSec: renderSeconds,
      intendedDurationSec: songSpec.durationSec,
      renderTimeMs: Date.now() - startTime,
      watermarked: Boolean(songSpec.license?.watermark),
      metadata: {
        model: 'auravox-mock-tone-v0',
        frequency,
        key: songSpec.key,
        tempo: songSpec.tempo,
        sections: songSpec.structure.map((s) => s.section)
      }
    };
  }
}
