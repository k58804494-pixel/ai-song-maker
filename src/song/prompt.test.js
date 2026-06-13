import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildMusicPrompt, clampDuration } from './prompt.js';
import { createSongSpec } from './SongSpec.js';

test('buildMusicPrompt combines descriptors and theme', () => {
  const spec = createSongSpec({ prompt: 'driving home at night', genre: 'synthwave', mood: 'nostalgic', tempo: 110, key: 'A minor' });
  const p = buildMusicPrompt(spec);
  assert.match(p, /synthwave/);
  assert.match(p, /nostalgic/);
  assert.match(p, /110 BPM/);
  assert.match(p, /A minor/);
  assert.match(p, /driving home at night/);
});

test('clampDuration keeps values within range', () => {
  assert.equal(clampDuration(10), 10);
  assert.equal(clampDuration(999, 30), 30);
  assert.equal(clampDuration(-5), 1);
  assert.equal(clampDuration('nope'), 8);
});
