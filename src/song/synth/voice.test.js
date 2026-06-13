import { test } from 'node:test';
import assert from 'node:assert/strict';

import { lyricsToVowels, makeVowelCursor, renderVowel, VOWELS } from './voice.js';

test('lyricsToVowels extracts vowels in order', () => {
  assert.deepEqual(lyricsToVowels('hello'), ['e', 'o']);
  assert.deepEqual(lyricsToVowels('sky'), ['i']); // y -> i
});

test('lyricsToVowels falls back when no vowels present', () => {
  const v = lyricsToVowels('rhythm!!!');
  assert.ok(v.length > 0);
  for (const x of v) assert.ok(VOWELS.includes(x));
});

test('vowel cursor cycles through a line deterministically', () => {
  const next = makeVowelCursor('ae');
  assert.deepEqual([next(), next(), next(), next()], ['a', 'e', 'a', 'e']);
});

test('renderVowel writes audible, in-range samples', () => {
  const sr = 44100;
  const buf = new Float32Array(sr); // 1s
  renderVowel(buf, { vowel: 'a', freq: 220, startSec: 0.1, durSec: 0.4, sampleRate: sr, gain: 0.3 });

  let peak = 0;
  let nonzero = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i];
    peak = Math.max(peak, Math.abs(v));
    if (v !== 0) nonzero++;
  }
  assert.ok(peak > 0.05, 'vowel should be audible');
  assert.ok(peak <= 1, 'vowel must stay in range before normalization');
  // Audio only within the note window (~0.4s), not the whole buffer.
  assert.ok(nonzero > sr * 0.3 && nonzero < sr * 0.5);
});
