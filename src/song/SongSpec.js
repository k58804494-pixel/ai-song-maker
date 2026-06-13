/**
 * SongSpec — the structured contract that flows through every stage of the
 * song pipeline (lyrics → composition → vocals → accompaniment → mix → export)
 * and is the unit of editing (section lock/regenerate).
 *
 * See docs/PLAN.md §5 "Core data contract". This is the stable interface; the
 * provider backends (hosted / local / mock) are swapped via `providers`.
 */

export const SECTION_TYPES = [
  'Intro', 'Verse', 'PreChorus', 'Chorus', 'Bridge', 'Solo', 'Outro'
];

export const PROVIDER_STAGES = ['lyrics', 'music', 'vocals'];

const DEFAULT_STRUCTURE = [
  { section: 'Intro', bars: 4 },
  { section: 'Verse', bars: 16 },
  { section: 'Chorus', bars: 16 },
  { section: 'Outro', bars: 4 }
];

/**
 * Normalize arbitrary user input into a complete SongSpec with defaults.
 * Accepts either a plain prompt string or a partial spec object.
 *
 * @param {string|object} input
 * @returns {object} SongSpec
 */
export function createSongSpec(input = {}) {
  const partial = typeof input === 'string' ? { prompt: input } : { ...input };

  const structure = Array.isArray(partial.structure) && partial.structure.length
    ? partial.structure.map((s) => ({
        section: s.section,
        bars: s.bars ?? 8,
        lyrics: s.lyrics ?? null,
        locked: Boolean(s.locked)
      }))
    : DEFAULT_STRUCTURE.map((s) => ({ ...s, lyrics: null, locked: false }));

  return {
    title: partial.title || 'Untitled',
    prompt: partial.prompt || '',
    genre: partial.genre || 'pop',
    mood: partial.mood || 'uplifting',
    tempo: partial.tempo ?? 120,
    key: partial.key || 'C major',
    language: partial.language || 'en',
    durationSec: partial.durationSec ?? 180,
    structure,
    voice: {
      personaId: partial.voice?.personaId ?? null,
      gender: partial.voice?.gender || 'any',
      style: partial.voice?.style || 'smooth'
    },
    providers: {
      lyrics: partial.providers?.lyrics || 'mock',
      music: partial.providers?.music || 'synth',
      vocals: partial.providers?.vocals || 'mock'
    },
    license: {
      model: partial.license?.model || 'open',
      watermark: partial.license?.watermark ?? true
    }
  };
}

/**
 * Validate a SongSpec. Returns { valid, errors }. Pure, no throwing, so it can
 * back both API validation and unit tests.
 *
 * @param {object} spec
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSongSpec(spec) {
  const errors = [];

  if (!spec || typeof spec !== 'object') {
    return { valid: false, errors: ['SongSpec must be an object'] };
  }

  if (typeof spec.title !== 'string' || !spec.title.trim()) {
    errors.push('title must be a non-empty string');
  }
  if (typeof spec.tempo !== 'number' || spec.tempo < 20 || spec.tempo > 300) {
    errors.push('tempo must be a number between 20 and 300 BPM');
  }
  if (typeof spec.durationSec !== 'number' || spec.durationSec <= 0 || spec.durationSec > 600) {
    errors.push('durationSec must be a number in (0, 600]');
  }
  if (typeof spec.language !== 'string' || !spec.language.trim()) {
    errors.push('language must be a non-empty string');
  }

  if (!Array.isArray(spec.structure) || spec.structure.length === 0) {
    errors.push('structure must be a non-empty array');
  } else {
    spec.structure.forEach((s, i) => {
      if (!SECTION_TYPES.includes(s.section)) {
        errors.push(`structure[${i}].section "${s.section}" is not one of ${SECTION_TYPES.join(', ')}`);
      }
      if (typeof s.bars !== 'number' || s.bars <= 0) {
        errors.push(`structure[${i}].bars must be a positive number`);
      }
    });
  }

  if (!spec.providers || typeof spec.providers !== 'object') {
    errors.push('providers must be an object');
  } else {
    for (const stage of PROVIDER_STAGES) {
      if (typeof spec.providers[stage] !== 'string' || !spec.providers[stage]) {
        errors.push(`providers.${stage} must be a provider name string`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
