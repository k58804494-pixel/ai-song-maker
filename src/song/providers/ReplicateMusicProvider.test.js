import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ReplicateMusicProvider } from './ReplicateMusicProvider.js';
import { jsonResponse, binaryResponse } from './_fakeHttp.js';
import { encodeWav, sineTone } from '../wav.js';
import { createSongSpec } from '../SongSpec.js';

const wavBytes = Buffer.from(encodeWav(sineTone({ frequency: 220, durationSec: 1 })));

function sequencedFetch(steps) {
  let i = 0;
  const calls = [];
  const impl = async (url, options = {}) => {
    calls.push({ url, method: options.method || 'GET' });
    const step = steps[Math.min(i, steps.length - 1)];
    i += 1;
    return step(url, options);
  };
  impl.calls = calls;
  return impl;
}

test('isAvailable reflects token presence', () => {
  assert.equal(new ReplicateMusicProvider({ token: null }).isAvailable(), false);
  assert.equal(new ReplicateMusicProvider({ token: 'r8_x', fetch: () => {} }).isAvailable(), true);
});

test('generate creates → polls → downloads → writes a real WAV', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'auravox-rep-'));

  const fetchImpl = sequencedFetch([
    // 1) create prediction
    () => jsonResponse({ id: 'pred1', status: 'starting', urls: { get: 'https://api/preds/pred1' } }, { status: 201 }),
    // 2) first poll → processing
    () => jsonResponse({ id: 'pred1', status: 'processing', urls: { get: 'https://api/preds/pred1' } }),
    // 3) second poll → succeeded with output URL
    () => jsonResponse({ id: 'pred1', status: 'succeeded', output: 'https://cdn/out.wav', urls: { get: 'https://api/preds/pred1' } }),
    // 4) download audio
    () => binaryResponse(wavBytes)
  ]);

  const provider = new ReplicateMusicProvider({
    token: 'r8_test',
    fetch: fetchImpl,
    sleep: async () => {},
    pollIntervalMs: 1
  });

  const spec = createSongSpec('an upbeat chiptune');
  const result = await provider.generate(spec, { outDir });

  assert.equal(result.provider, 'replicate');
  assert.equal(result.mode, 'hosted');
  assert.equal(result.sourceUrl, 'https://cdn/out.wav');

  const info = await stat(result.filePath);
  assert.ok(info.size > 44);
  const buf = await readFile(result.filePath);
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');

  // create + 2 polls + download = 4 calls
  assert.equal(fetchImpl.calls.length, 4);
  assert.equal(fetchImpl.calls[0].method, 'POST');
});

test('generate throws on failed prediction', async () => {
  const fetchImpl = sequencedFetch([
    () => jsonResponse({ id: 'p', status: 'starting', urls: { get: 'https://api/preds/p' } }, { status: 201 }),
    () => jsonResponse({ id: 'p', status: 'failed', error: 'boom', urls: { get: 'https://api/preds/p' } })
  ]);
  const provider = new ReplicateMusicProvider({ token: 't', fetch: fetchImpl, sleep: async () => {} });
  await assert.rejects(() => provider.generate(createSongSpec('x')), /failed: boom/);
});

test('generate throws without a token', async () => {
  const provider = new ReplicateMusicProvider({ token: null });
  await assert.rejects(() => provider.generate(createSongSpec('x')), /unavailable/);
});
