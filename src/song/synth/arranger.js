/**
 * Arranger — turns a SongSpec into a fully rendered instrumental mix
 * (chords + bass + melody + drums) using music theory and the synth voices.
 *
 * Deterministic for a given prompt/key/genre (seeded RNG), so results are
 * reproducible and testable. 100% offline, no model, no network.
 */
import { chordForDegree, progressionForGenre, scaleNotes, midiToFreq } from './theory.js';
import { makeRng, hashSeed, renderNote, renderDrum, normalize } from './synth.js';

const BEATS_PER_BAR = 4;
const NON_MELODIC = new Set(['Intro', 'Outro']);

/**
 * @param {object} songSpec
 * @param {object} [opts]
 * @param {number} [opts.sampleRate=44100]
 * @param {number} [opts.maxSeconds=45]  cap render length
 * @returns {{ samples: Float32Array, sampleRate: number, durationSec: number, bars: number, bpm: number, progression: number[] }}
 */
export function arrange(songSpec, opts = {}) {
  const sampleRate = opts.sampleRate ?? 44100;
  const maxSeconds = opts.maxSeconds ?? 45;

  const bpm = songSpec.tempo || 120;
  const secPerBeat = 60 / bpm;
  const barDur = secPerBeat * BEATS_PER_BAR;

  const rng = makeRng(hashSeed(`${songSpec.prompt}|${songSpec.key}|${songSpec.genre}|${songSpec.mood}`));
  const progression = progressionForGenre(songSpec.genre);
  const scale = scaleNotes(songSpec.key, 5); // melody register

  // Flatten sections into a bar list, capped to maxSeconds.
  const maxBars = Math.max(1, Math.floor(maxSeconds / barDur));
  const barPlan = [];
  for (const section of songSpec.structure) {
    const bars = Math.max(1, Math.round(section.bars / 4)); // compress bar counts for previews
    for (let b = 0; b < bars; b++) {
      barPlan.push(section.section);
      if (barPlan.length >= maxBars) break;
    }
    if (barPlan.length >= maxBars) break;
  }

  const totalBars = barPlan.length;
  const durationSec = totalBars * barDur;
  const samples = new Float32Array(Math.ceil(durationSec * sampleRate) + sampleRate);

  for (let bar = 0; bar < totalBars; bar++) {
    const sectionName = barPlan[bar];
    const barStart = bar * barDur;
    const degree = progression[bar % progression.length];
    const chord = chordForDegree(songSpec.key, degree, 4);

    // Pad / chords — sustained triad for the whole bar.
    for (const note of chord.notes) {
      renderNote(samples, {
        freq: midiToFreq(note), startSec: barStart, durSec: barDur * 0.98,
        sampleRate, waveform: 'saw', gain: 0.10,
        adsr: { attack: 0.04, decay: 0.2, sustain: 0.6, release: 0.3 }
      });
    }

    // Bass — root note on each beat, an octave below the chord root.
    for (let beat = 0; beat < BEATS_PER_BAR; beat++) {
      renderNote(samples, {
        freq: midiToFreq(chord.root - 12), startSec: barStart + beat * secPerBeat,
        durSec: secPerBeat * 0.9, sampleRate, waveform: 'triangle', gain: 0.22,
        adsr: { attack: 0.005, decay: 0.05, sustain: 0.8, release: 0.06 }
      });
    }

    // Melody — eighth notes drawn from the chord + scale (rests for space).
    if (!NON_MELODIC.has(sectionName)) {
      const pool = [...chord.notes.map((n) => n + 12), ...scale];
      for (let eighth = 0; eighth < BEATS_PER_BAR * 2; eighth++) {
        if (rng() < 0.35) continue; // rest
        const note = pool[Math.floor(rng() * pool.length)];
        renderNote(samples, {
          freq: midiToFreq(note), startSec: barStart + eighth * (secPerBeat / 2),
          durSec: (secPerBeat / 2) * 0.85, sampleRate, waveform: 'square', gain: 0.14,
          adsr: { attack: 0.005, decay: 0.04, sustain: 0.5, release: 0.05 }
        });
      }
    }

    // Drums — fuller in Chorus, lighter in Intro.
    const drums = sectionName === 'Intro' ? 'light' : 'full';
    for (let beat = 0; beat < BEATS_PER_BAR; beat++) {
      const beatStart = barStart + beat * secPerBeat;
      if (drums === 'full') {
        if (beat % 2 === 0) renderDrum(samples, { type: 'kick', startSec: beatStart, sampleRate, gain: 0.6, rng });
        else renderDrum(samples, { type: 'snare', startSec: beatStart, sampleRate, gain: 0.45, rng });
      }
      // hi-hats on eighths
      renderDrum(samples, { type: 'hat', startSec: beatStart, sampleRate, gain: 0.18, rng });
      renderDrum(samples, { type: 'hat', startSec: beatStart + secPerBeat / 2, sampleRate, gain: 0.14, rng });
    }
  }

  normalize(samples, 0.89);

  return { samples, sampleRate, durationSec, bars: totalBars, bpm, progression };
}
