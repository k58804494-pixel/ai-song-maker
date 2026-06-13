/**
 * From-scratch singing-voice synthesis (free, offline, no model).
 *
 * Renders sung vowels by additive formant synthesis: a harmonic-rich glottal
 * source at the note pitch, shaped so harmonics near each vowel's formant
 * frequencies are emphasized. Adds vibrato + ADSR so it reads as a sustained
 * sung note rather than a buzz. It won't sound human, but it genuinely *sings*
 * the lyric's vowels on the melody — and it costs nothing.
 */

// Formant frequencies (F1, F2, F3) in Hz for common vowels.
const FORMANTS = {
  a: [800, 1150, 2800],
  e: [500, 1800, 2500],
  i: [300, 2300, 3000],
  o: [500, 900, 2400],
  u: [350, 800, 2400]
};

const VOWELS = Object.keys(FORMANTS);

/** Map an arbitrary character to the nearest supported vowel. */
function toVowel(ch) {
  const c = ch.toLowerCase();
  if (FORMANTS[c]) return c;
  if ('àáâä'.includes(c)) return 'a';
  if ('èéêë'.includes(c)) return 'e';
  if ('ìíîï'.includes(c)) return 'i';
  if ('òóôö'.includes(c)) return 'o';
  if ('ùúûü'.includes(c)) return 'u';
  if (c === 'y') return 'i';
  return null;
}

/**
 * Turn a lyric string into an ordered list of vowels to sing. Falls back to a
 * neutral pattern when a line has no detectable vowels.
 * @param {string} text
 * @returns {string[]}
 */
export function lyricsToVowels(text) {
  const vowels = [];
  for (const ch of String(text || '')) {
    const v = toVowel(ch);
    if (v) vowels.push(v);
  }
  if (vowels.length === 0) return ['a', 'o', 'e'];
  return vowels;
}

/** Cyclic vowel cursor over a lyric line. */
export function makeVowelCursor(text) {
  const vowels = lyricsToVowels(text);
  let i = 0;
  return () => {
    const v = vowels[i % vowels.length];
    i += 1;
    return v;
  };
}

function formantGain(harmonicFreq, formants, bandwidth = 120) {
  let g = 0;
  for (const f of formants) {
    const d = harmonicFreq - f;
    g += Math.exp(-(d * d) / (2 * bandwidth * bandwidth));
  }
  return g;
}

/**
 * Render a single sung vowel note additively into `buffer`.
 *
 * @param {Float32Array} buffer
 * @param {object} opts
 * @param {string} opts.vowel
 * @param {number} opts.freq        fundamental (Hz)
 * @param {number} opts.startSec
 * @param {number} opts.durSec
 * @param {number} opts.sampleRate
 * @param {number} [opts.gain=0.28]
 * @param {number} [opts.vibratoHz=5.5]
 * @param {number} [opts.vibratoDepth=0.006]  fraction of f0
 */
export function renderVowel(buffer, {
  vowel, freq, startSec, durSec, sampleRate,
  gain = 0.28, vibratoHz = 5.5, vibratoDepth = 0.006
}) {
  const formants = FORMANTS[vowel] || FORMANTS.a;
  const start = Math.floor(startSec * sampleRate);
  const len = Math.floor(durSec * sampleRate);
  const nyquist = sampleRate / 2;
  const maxFreq = Math.min(nyquist, 4200);

  // Precompute harmonic weights (sawtooth 1/n * formant emphasis).
  const harmonics = [];
  for (let n = 1; n * freq < maxFreq; n++) {
    const hf = n * freq;
    const w = (1 / n) * (0.18 + formantGain(hf, formants));
    harmonics.push({ n, w });
  }
  let norm = 0;
  for (const h of harmonics) norm += h.w;
  if (norm === 0) norm = 1;

  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= buffer.length) continue;
    const t = i / sampleRate;

    // ADSR (legato-ish): quick attack, long sustain, soft release.
    const attack = 0.03, release = Math.min(0.12, durSec * 0.3);
    let env;
    if (t < attack) env = t / attack;
    else if (t < durSec - release) env = 1;
    else env = Math.max(0, 1 - (t - (durSec - release)) / release);

    const vib = 1 + vibratoDepth * Math.sin(2 * Math.PI * vibratoHz * t);
    const f0 = freq * vib;

    let sample = 0;
    for (const h of harmonics) {
      sample += h.w * Math.sin(2 * Math.PI * h.n * f0 * t);
    }
    buffer[idx] += gain * env * (sample / norm);
  }
}

export { VOWELS };
