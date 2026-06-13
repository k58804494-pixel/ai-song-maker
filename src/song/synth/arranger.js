/**
 * Arranger — turns a SongSpec into a fully rendered instrumental mix
 * (chords + bass + melody + drums) using music theory and the synth voices.
 *
 * Deterministic for a given prompt/key/genre (seeded RNG), so results are
 * reproducible and testable. 100% offline, no model, no network.
 */
import { chordForDegree, progressionForGenre, scaleNotes, midiToFreq } from './theory.js';
import { makeRng, hashSeed, renderNote, renderDrum, masterBus } from './synth.js';
import { makeVowelCursor, renderVowel } from './voice.js';

const BEATS_PER_BAR = 4;
const NON_MELODIC = new Set(['Intro', 'Outro']);

/**
 * @param {object} songSpec
 * @param {object} [opts]
 * @param {number} [opts.sampleRate=44100]
 * @param {number} [opts.maxSeconds=45]  cap render length
 * @param {boolean} [opts.vocals=false]  render a sung vocal lead from lyrics
 * @returns {{ samples: Float32Array, sampleRate: number, durationSec: number, bars: number, bpm: number, progression: number[], vocals: boolean, sections: Array }}
 */
export function arrange(songSpec, opts = {}) {
  const sampleRate = opts.sampleRate ?? 44100;
  const maxSeconds = opts.maxSeconds ?? 45;
  const vocals = Boolean(opts.vocals);

  const bpm = songSpec.tempo || 120;
  const secPerBeat = 60 / bpm;
  const barDur = secPerBeat * BEATS_PER_BAR;

  const seedBase = `${songSpec.prompt}|${songSpec.key}|${songSpec.genre}|${songSpec.mood}`;
  const progression = progressionForGenre(songSpec.genre);
  const scale = scaleNotes(songSpec.key, 5); // melody register

  // Drums use one stable RNG for the whole song, independent of any section's
  // melody seed — so regenerating a section never changes the beat.
  const drumRng = makeRng(hashSeed(`${seedBase}|drums`));

  // Each section gets its OWN melody RNG, seeded only by that section's identity
  // and its `seed`. This makes sections independent: regenerating one (bumping
  // its seed) or locking it leaves every other section's audio bit-identical.
  const melodyRngs = new Map();
  const sectionRng = (sectionId) => {
    if (!melodyRngs.has(sectionId)) {
      const section = songSpec.structure[sectionId];
      const seed = section.seed ?? 0;
      melodyRngs.set(sectionId, makeRng(hashSeed(`${seedBase}|sec${sectionId}|${section.section}|seed${seed}`)));
    }
    return melodyRngs.get(sectionId);
  };

  // Flatten sections into a bar list, capped to maxSeconds.
  const maxBars = Math.max(1, Math.floor(maxSeconds / barDur));
  const barPlan = [];
  // One vowel cursor per section so a sung line flows across that section's bars.
  const cursors = new Map();
  songSpec.structure.forEach((section, sectionId) => {
    cursors.set(sectionId, makeVowelCursor(section.lyrics || section.section));
  });
  for (let sectionId = 0; sectionId < songSpec.structure.length; sectionId++) {
    const section = songSpec.structure[sectionId];
    const bars = Math.max(1, Math.round(section.bars / 4)); // compress bar counts for previews
    for (let b = 0; b < bars; b++) {
      barPlan.push({ name: section.section, sectionId });
      if (barPlan.length >= maxBars) break;
    }
    if (barPlan.length >= maxBars) break;
  }

  const totalBars = barPlan.length;
  const durationSec = totalBars * barDur;
  const samples = new Float32Array(Math.ceil(durationSec * sampleRate) + sampleRate);

  for (let bar = 0; bar < totalBars; bar++) {
    const { name: sectionName, sectionId } = barPlan[bar];
    const nextVowel = cursors.get(sectionId);
    const barStart = bar * barDur;
    const srng = sectionRng(sectionId);
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
    // When vocals are on, the synth melody becomes a quiet backing and a sung
    // vowel lead (an octave lower, in vocal range) carries the line.
    if (!NON_MELODIC.has(sectionName)) {
      const pool = [...chord.notes.map((n) => n + 12), ...scale];
      const melodyGain = vocals ? 0.05 : 0.14;
      for (let eighth = 0; eighth < BEATS_PER_BAR * 2; eighth++) {
        if (srng() < 0.35) continue; // rest
        const note = pool[Math.floor(srng() * pool.length)];
        const startSec = barStart + eighth * (secPerBeat / 2);
        renderNote(samples, {
          freq: midiToFreq(note), startSec,
          durSec: (secPerBeat / 2) * 0.85, sampleRate, waveform: 'square', gain: melodyGain,
          adsr: { attack: 0.005, decay: 0.04, sustain: 0.5, release: 0.05 }
        });
        if (vocals) {
          renderVowel(samples, {
            vowel: nextVowel(), freq: midiToFreq(note - 12), startSec,
            durSec: (secPerBeat / 2) * 0.95, sampleRate, gain: 0.34
          });
        }
      }
    }

    // Drums — fuller in Chorus, lighter in Intro.
    const drums = sectionName === 'Intro' ? 'light' : 'full';
    for (let beat = 0; beat < BEATS_PER_BAR; beat++) {
      const beatStart = barStart + beat * secPerBeat;
      if (drums === 'full') {
        if (beat % 2 === 0) renderDrum(samples, { type: 'kick', startSec: beatStart, sampleRate, gain: 0.6, rng: drumRng });
        else renderDrum(samples, { type: 'snare', startSec: beatStart, sampleRate, gain: 0.45, rng: drumRng });
      }
      // hi-hats on eighths
      renderDrum(samples, { type: 'hat', startSec: beatStart, sampleRate, gain: 0.18, rng: drumRng });
      renderDrum(samples, { type: 'hat', startSec: beatStart + secPerBeat / 2, sampleRate, gain: 0.14, rng: drumRng });
    }
  }

  // Content-independent master bus (NOT peak normalization): keeps per-section
  // edits from rescaling the rest of the mix, so locked sections stay bit-exact.
  masterBus(samples, { drive: 1.1, out: 0.95 });

  // Group contiguous bars into per-section time ranges (for the editor/UI).
  const sections = [];
  for (let bar = 0; bar < totalBars; bar++) {
    const { name, sectionId } = barPlan[bar];
    const last = sections[sections.length - 1];
    if (last && last.sectionId === sectionId) {
      last.bars += 1;
      last.durSec += barDur;
    } else {
      sections.push({
        sectionId,
        name,
        startSec: bar * barDur,
        durSec: barDur,
        bars: 1,
        locked: Boolean(songSpec.structure[sectionId]?.locked),
        seed: songSpec.structure[sectionId]?.seed ?? 0
      });
    }
  }

  return { samples, sampleRate, durationSec, bars: totalBars, bpm, progression, vocals, sections };
}
