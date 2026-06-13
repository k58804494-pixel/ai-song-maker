import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createSongSpec, validateSongSpec } from './SongSpec.js';

test('createSongSpec accepts a plain prompt string', () => {
  const spec = createSongSpec('a happy summer pop song');
  assert.equal(spec.prompt, 'a happy summer pop song');
  assert.ok(Array.isArray(spec.structure) && spec.structure.length > 0);
  assert.equal(spec.providers.music, 'mock');
});

test('createSongSpec merges a partial spec and keeps defaults', () => {
  const spec = createSongSpec({ title: 'Neon Rain', genre: 'synthwave', tempo: 110 });
  assert.equal(spec.title, 'Neon Rain');
  assert.equal(spec.genre, 'synthwave');
  assert.equal(spec.tempo, 110);
  assert.equal(spec.key, 'C major'); // default preserved
});

test('validateSongSpec passes for a normalized spec', () => {
  const { valid, errors } = validateSongSpec(createSongSpec('x'));
  assert.equal(valid, true, errors.join('; '));
});

test('validateSongSpec flags bad tempo, duration and unknown section', () => {
  const spec = createSongSpec('x');
  spec.tempo = 5;
  spec.durationSec = -1;
  spec.structure = [{ section: 'NotASection', bars: 0 }];
  const { valid, errors } = validateSongSpec(spec);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('tempo')));
  assert.ok(errors.some((e) => e.includes('durationSec')));
  assert.ok(errors.some((e) => e.includes('section')));
  assert.ok(errors.some((e) => e.includes('bars')));
});

test('validateSongSpec requires a provider name per stage', () => {
  const spec = createSongSpec('x');
  spec.providers.music = '';
  const { valid, errors } = validateSongSpec(spec);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('providers.music')));
});
