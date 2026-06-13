/**
 * Minimal music-theory helpers for the free, offline synth engine.
 *
 * No dependencies — just equal-temperament math, scales, and genre-specific
 * chord progressions expressed as scale degrees. This is what lets the engine
 * compose *real* harmony for any key/genre without a model or network.
 */

const NOTE_INDEX = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
};

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];

// Chord quality per scale degree (0-indexed) for major / natural-minor keys.
const MAJOR_QUALITIES = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
const MINOR_QUALITIES = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];

const TRIAD_INTERVALS = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6]
};

// Genre → progression as 1-indexed scale degrees (i..vii).
const GENRE_PROGRESSIONS = {
  pop: [1, 5, 6, 4],
  synthwave: [6, 4, 1, 5],
  rock: [1, 4, 5, 4],
  lofi: [2, 5, 1, 6],
  jazz: [2, 5, 1, 6],
  edm: [6, 4, 1, 5],
  cinematic: [1, 6, 4, 5],
  folk: [1, 4, 1, 5],
  default: [1, 5, 6, 4]
};

/** MIDI note number → frequency (Hz), A4 (69) = 440. */
export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Parse a key string like "A minor" or "C major" → { rootPc, mode }.
 * @param {string} key
 */
export function parseKey(key = 'C major') {
  const [rawRoot, rawMode] = String(key).trim().split(/\s+/);
  const rootPc = NOTE_INDEX[rawRoot] ?? 0;
  const mode = /min/i.test(rawMode || '') ? 'minor' : 'major';
  return { rootPc, mode };
}

/**
 * Build the scale MIDI notes for a key at a given octave.
 * @returns {number[]} 7 MIDI note numbers
 */
export function scaleNotes(key, octave = 4) {
  const { rootPc, mode } = parseKey(key);
  const steps = mode === 'minor' ? MINOR_STEPS : MAJOR_STEPS;
  const base = 12 * (octave + 1) + rootPc; // MIDI: C-1 = 0
  return steps.map((s) => base + s);
}

/** Get the genre progression (1-indexed degrees), falling back to default. */
export function progressionForGenre(genre) {
  const key = String(genre || '').toLowerCase();
  return GENRE_PROGRESSIONS[key] || GENRE_PROGRESSIONS.default;
}

/**
 * Build a chord (array of MIDI notes) for a scale degree in a key.
 * @param {string} key
 * @param {number} degree  1-indexed scale degree
 * @param {number} octave
 * @returns {{ degree:number, quality:string, notes:number[], root:number }}
 */
export function chordForDegree(key, degree, octave = 4) {
  const { rootPc, mode } = parseKey(key);
  const steps = mode === 'minor' ? MINOR_STEPS : MAJOR_STEPS;
  const qualities = mode === 'minor' ? MINOR_QUALITIES : MAJOR_QUALITIES;
  const idx = (degree - 1) % 7;

  const base = 12 * (octave + 1) + rootPc;
  const root = base + steps[idx];
  const quality = qualities[idx];
  const notes = TRIAD_INTERVALS[quality].map((iv) => root + iv);

  return { degree, quality, notes, root };
}
