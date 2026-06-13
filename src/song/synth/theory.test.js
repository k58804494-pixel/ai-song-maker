import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseKey, scaleNotes, chordForDegree, progressionForGenre, midiToFreq } from './theory.js';

test('parseKey reads root and mode', () => {
  assert.deepEqual(parseKey('A minor'), { rootPc: 9, mode: 'minor' });
  assert.deepEqual(parseKey('C major'), { rootPc: 0, mode: 'major' });
  assert.deepEqual(parseKey('F# minor'), { rootPc: 6, mode: 'minor' });
});

test('midiToFreq anchors A4 to 440Hz', () => {
  assert.ok(Math.abs(midiToFreq(69) - 440) < 1e-6);
  assert.ok(Math.abs(midiToFreq(57) - 220) < 1e-6); // A3
});

test('scaleNotes returns 7 ascending notes', () => {
  const notes = scaleNotes('C major', 4);
  assert.equal(notes.length, 7);
  for (let i = 1; i < notes.length; i++) assert.ok(notes[i] > notes[i - 1]);
});

test('chordForDegree builds correct triad qualities', () => {
  // In C major: I = C major (C E G), ii = D minor (D F A)
  const I = chordForDegree('C major', 1, 4);
  assert.equal(I.quality, 'maj');
  assert.deepEqual(I.notes.map((n) => n - I.root), [0, 4, 7]);

  const ii = chordForDegree('C major', 2, 4);
  assert.equal(ii.quality, 'min');
  assert.deepEqual(ii.notes.map((n) => n - ii.root), [0, 3, 7]);
});

test('progressionForGenre falls back to default for unknown genre', () => {
  assert.deepEqual(progressionForGenre('totally-made-up'), [1, 5, 6, 4]);
  assert.deepEqual(progressionForGenre('synthwave'), [6, 4, 1, 5]);
});
