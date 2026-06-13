/**
 * SongPipeline — the single entrypoint that turns a prompt (or partial SongSpec)
 * into a real audio artifact. This replaces the old simulated `generateMusic()`
 * stub that just returned `url: '[Generated audio URL]'`.
 *
 * M0 stages: normalize → validate → lyrics (deterministic) → music provider.
 * Later milestones extend this with composition (MIDI), dual-track vocals,
 * mix/master, stems, and the CriticAgent QA loop (docs/PLAN.md §6).
 */
import { createSongSpec, validateSongSpec } from './SongSpec.js';
import { generateLyrics } from './lyrics.js';
import { resolveProvider } from './providers/registry.js';

export class SongPipeline {
  /**
   * @param {object} [opts]
   * @param {string} [opts.outDir]        where audio files are written
   * @param {number} [opts.renderSeconds] cap rendered length (mock provider)
   */
  constructor(opts = {}) {
    this.opts = opts;
  }

  /**
   * Generate a song from a prompt string or partial SongSpec.
   *
   * @param {string|object} input
   * @returns {Promise<{ songSpec: object, lyrics: Array, audio: object }>}
   */
  async generateSong(input) {
    const songSpec = createSongSpec(input);

    const { valid, errors } = validateSongSpec(songSpec);
    if (!valid) {
      throw new Error(`Invalid SongSpec:\n - ${errors.join('\n - ')}`);
    }

    // Lyrics stage (does not overwrite locked / pre-filled sections).
    songSpec.structure = generateLyrics(songSpec);

    // Music stage via the provider abstraction.
    const provider = resolveProvider(songSpec.providers.music);
    const audio = await provider.generate(songSpec, this.opts);

    return {
      songSpec,
      lyrics: songSpec.structure
        .filter((s) => s.lyrics)
        .map((s) => ({ section: s.section, lyrics: s.lyrics })),
      audio
    };
  }
}

export default SongPipeline;
