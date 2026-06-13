import { test } from 'node:test';
import assert from 'node:assert/strict';

import { arrange } from './arranger.js';
import { makeRng, hashSeed } from './synth.js';
import { createSongSpec } from '../SongSpec.js';

test('arrange produces non-silent samples and sane metadata', () => {
  const spec = createSongSpec({ prompt: 'sunset drive', genre: 'synthwave', key: 'A minor', tempo: 120 });
  const { samples, sampleRate, durationSec, bars, progression } = arrange(spec, { maxSeconds: 6 });

  assert.equal(sampleRate, 44100);
  assert.ok(bars >= 1);
  assert.ok(durationSec > 0);
  assert.deepEqual(progression, [6, 4, 1, 5]); // synthwave

  // Audio is not silent and stays within [-1, 1].
  let peak = 0;
  let energy = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    peak = Math.max(peak, Math.abs(v));
    energy += v * v;
    assert.ok(v >= -1 && v <= 1);
  }
  assert.ok(peak > 0.1, 'rendered audio should be audible');
  assert.ok(energy > 0, 'rendered audio should carry energy');
});

test('arrange is deterministic for the same spec', () => {
  const spec = createSongSpec({ prompt: 'same', genre: 'pop', key: 'C major', tempo: 100 });
  const a = arrange(spec, { maxSeconds: 4 });
  const b = arrange(spec, { maxSeconds: 4 });
  assert.equal(a.samples.length, b.samples.length);
  for (let i = 0; i < a.samples.length; i += 997) {
    assert.equal(a.samples[i], b.samples[i]);
  }
});

test('makeRng is deterministic and seed-sensitive', () => {
  const r1 = makeRng(hashSeed('abc'));
  const r2 = makeRng(hashSeed('abc'));
  const r3 = makeRng(hashSeed('xyz'));
  assert.equal(r1(), r2());
  assert.notEqual(r1(), r3());
});
