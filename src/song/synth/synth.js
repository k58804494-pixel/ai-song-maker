/**
 * Low-level audio synthesis: oscillators, ADSR envelopes, and drum voices that
 * render additively into a Float32 sample buffer. Pure math, no dependencies.
 */

/** Deterministic RNG (mulberry32) so a given prompt/seed reproduces a song. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap string → 32-bit seed hash. */
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function osc(waveform, phase) {
  switch (waveform) {
    case 'saw':
      return 2 * (phase - Math.floor(phase + 0.5));
    case 'square':
      return phase - Math.floor(phase) < 0.5 ? 1 : -1;
    case 'triangle':
      return 2 * Math.abs(2 * (phase - Math.floor(phase + 0.5))) - 1;
    case 'sine':
    default:
      return Math.sin(2 * Math.PI * phase);
  }
}

function adsrEnv(t, dur, { attack = 0.01, decay = 0.06, sustain = 0.7, release = 0.08 }) {
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (1 - sustain) * ((t - attack) / decay);
  if (t < dur - release) return sustain;
  if (t < dur) return sustain * (1 - (t - (dur - release)) / release);
  return 0;
}

/**
 * Render a pitched note additively into `buffer`.
 * @param {Float32Array} buffer
 * @param {object} opts
 */
export function renderNote(buffer, {
  freq, startSec, durSec, sampleRate, waveform = 'sine', gain = 0.2, adsr = {}
}) {
  const start = Math.floor(startSec * sampleRate);
  const len = Math.floor(durSec * sampleRate);
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= buffer.length) continue;
    const t = i / sampleRate;
    const phase = freq * t;
    const env = adsrEnv(t, durSec, adsr);
    buffer[idx] += gain * env * osc(waveform, phase);
  }
}

/** Render a synthesized drum hit ('kick' | 'snare' | 'hat') into `buffer`. */
export function renderDrum(buffer, { type, startSec, sampleRate, gain = 0.5, rng = Math.random }) {
  const durations = { kick: 0.18, snare: 0.16, hat: 0.05 };
  const durSec = durations[type] ?? 0.1;
  const start = Math.floor(startSec * sampleRate);
  const len = Math.floor(durSec * sampleRate);

  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= buffer.length) continue;
    const t = i / sampleRate;
    let sample = 0;

    if (type === 'kick') {
      const freq = 120 * Math.exp(-18 * t) + 45; // pitch drop
      sample = Math.sin(2 * Math.PI * freq * t) * Math.exp(-12 * t);
    } else if (type === 'snare') {
      const noise = rng() * 2 - 1;
      const tone = Math.sin(2 * Math.PI * 180 * t);
      sample = (0.7 * noise + 0.3 * tone) * Math.exp(-22 * t);
    } else { // hat
      const noise = rng() * 2 - 1;
      sample = noise * Math.exp(-60 * t);
    }
    buffer[idx] += gain * sample;
  }
}

/**
 * Normalize peak to `target` and apply a gentle soft-clip to avoid harsh
 * clipping. Mutates and returns the buffer.
 */
export function normalize(buffer, target = 0.89) {
  let peak = 0;
  for (let i = 0; i < buffer.length; i++) peak = Math.max(peak, Math.abs(buffer[i]));
  if (peak === 0) return buffer;
  const g = target / peak;
  for (let i = 0; i < buffer.length; i++) {
    const x = buffer[i] * g;
    buffer[i] = Math.tanh(x); // soft-clip
  }
  return buffer;
}
