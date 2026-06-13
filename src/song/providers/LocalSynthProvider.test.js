import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { LocalSynthProvider } from './LocalSynthProvider.js';
import { createSongSpec } from '../SongSpec.js';

test('synth provider is always available and free', () => {
  const p = new LocalSynthProvider();
  assert.equal(p.name, 'synth');
  assert.equal(p.isAvailable(), true);
});

test('generate writes a real multi-second WAV with zero cost', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'auravox-synth-'));
  const provider = new LocalSynthProvider();
  const spec = createSongSpec({ prompt: 'a hopeful pop anthem', genre: 'pop', key: 'C major', tempo: 120 });

  const result = await provider.generate(spec, { outDir, renderSeconds: 4 });

  assert.equal(result.provider, 'synth');
  assert.equal(result.cost, 0);
  assert.ok(result.durationSec > 0);

  const info = await stat(result.filePath);
  // A few seconds of 44.1kHz 16-bit mono audio is well over 100KB.
  assert.ok(info.size > 100000, `expected a real audio file, got ${info.size} bytes`);

  const buf = await readFile(result.filePath);
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WAVE');
});
