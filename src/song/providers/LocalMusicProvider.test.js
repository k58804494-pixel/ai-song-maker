import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { LocalMusicProvider } from './LocalMusicProvider.js';
import { jsonResponse, binaryResponse } from './_fakeHttp.js';
import { encodeWav, sineTone } from '../wav.js';
import { createSongSpec } from '../SongSpec.js';

const wavBytes = Buffer.from(encodeWav(sineTone({ frequency: 330, durationSec: 1 })));

test('isAvailable reflects endpoint presence', () => {
  assert.equal(new LocalMusicProvider({ endpoint: null }).isAvailable(), false);
  assert.equal(new LocalMusicProvider({ endpoint: 'http://127.0.0.1:8000/generate', fetch: () => {} }).isAvailable(), true);
});

test('generate handles audio_base64 response', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'auravox-local-'));
  const fetchImpl = async () => jsonResponse({ audio_base64: wavBytes.toString('base64'), format: 'wav' });
  const provider = new LocalMusicProvider({ endpoint: 'http://x/generate', fetch: fetchImpl });

  const result = await provider.generate(createSongSpec('lofi'), { outDir });
  assert.equal(result.provider, 'local');
  assert.equal(result.mode, 'local');
  const buf = await readFile(result.filePath);
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.length, wavBytes.length);
});

test('generate handles url response by downloading', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'auravox-local-'));
  let call = 0;
  const fetchImpl = async () => {
    call += 1;
    return call === 1 ? jsonResponse({ url: 'https://cdn/out.wav' }) : binaryResponse(wavBytes);
  };
  const provider = new LocalMusicProvider({ endpoint: 'http://x/generate', fetch: fetchImpl });
  const result = await provider.generate(createSongSpec('lofi'), { outDir });
  const buf = await readFile(result.filePath);
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
});

test('generate throws without an endpoint', async () => {
  const provider = new LocalMusicProvider({ endpoint: null });
  await assert.rejects(() => provider.generate(createSongSpec('x')), /unavailable/);
});
