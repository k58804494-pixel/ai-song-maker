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

test('vocals add energy and stay deterministic', () => {
  const spec = createSongSpec({ prompt: 'sing to me', genre: 'pop', key: 'C major', tempo: 120 });
  const dry = arrange(spec, { maxSeconds: 6, vocals: false });
  const sung = arrange(spec, { maxSeconds: 6, vocals: true });

  assert.equal(sung.vocals, true);
  assert.equal(dry.vocals, false);

  const energy = (s) => { let e = 0; for (let i = 0; i < s.length; i++) e += s[i] * s[i]; return e; };
  // Both are normalized to the same peak; the sung mix is a different signal.
  let diff = 0;
  for (let i = 0; i < Math.min(dry.samples.length, sung.samples.length); i += 257) {
    if (dry.samples[i] !== sung.samples[i]) diff++;
  }
  assert.ok(diff > 0, 'vocal track should change the rendered audio');
  assert.ok(energy(sung.samples) > 0);

  // Deterministic with vocals on.
  const sung2 = arrange(spec, { maxSeconds: 6, vocals: true });
  for (let i = 0; i < sung.samples.length; i += 997) assert.equal(sung.samples[i], sung2.samples[i]);
});

test('makeRng is deterministic and seed-sensitive', () => {
  const r1 = makeRng(hashSeed('abc'));
  const r2 = makeRng(hashSeed('abc'));
  const r3 = makeRng(hashSeed('xyz'));
  assert.equal(r1(), r2());
  assert.notEqual(r1(), r3());
});
