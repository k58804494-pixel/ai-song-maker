import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SongPipeline } from './SongPipeline.js';
import { createSongSpec } from './SongSpec.js';

const createSongSpecDefault = () => createSongSpec('x').providers.music;

async function tmpOutDir() {
  return mkdtemp(join(tmpdir(), 'auravox-test-'));
}

test('pipeline produces a real, non-empty WAV file from a prompt', async () => {
  const outDir = await tmpOutDir();
  const pipeline = new SongPipeline({ outDir, renderSeconds: 1 });

  // Force the deterministic mock backend so this stays a fast plumbing check.
  const { songSpec, lyrics, audio } = await pipeline.generateSong({ prompt: 'a chill lofi beat', providers: { music: 'mock' } });

  // A real artifact exists on disk and is larger than a bare WAV header.
  const info = await stat(audio.filePath);
  assert.ok(info.size > 44, 'WAV should contain PCM data beyond the 44-byte header');
  assert.equal(audio.bytes, info.size);

  // It is a valid RIFF/WAVE file.
  const buf = await readFile(audio.filePath);
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WAVE');

  // Spec + lyrics flowed through the pipeline.
  assert.equal(audio.provider, 'mock');
  assert.equal(songSpec.providers.music, 'mock');
  assert.equal(createSongSpecDefault(), 'synth'); // default backend is the free synth
  assert.ok(lyrics.length > 0, 'lyrical sections should have lyrics');
});

test('pipeline does not overwrite locked section lyrics', async () => {
  const outDir = await tmpOutDir();
  const pipeline = new SongPipeline({ outDir, renderSeconds: 1 });

  const { songSpec } = await pipeline.generateSong({
    prompt: 'test',
    structure: [
      { section: 'Verse', bars: 8, lyrics: 'KEEP ME', locked: true },
      { section: 'Chorus', bars: 8 }
    ]
  });

  const verse = songSpec.structure.find((s) => s.section === 'Verse');
  assert.equal(verse.lyrics, 'KEEP ME');
});

test('pipeline rejects an invalid spec with a helpful error', async () => {
  const pipeline = new SongPipeline();
  await assert.rejects(
    () => pipeline.generateSong({ prompt: 'x', tempo: 9999 }),
    /Invalid SongSpec/
  );
});

test('unknown provider name fails clearly', async () => {
  const pipeline = new SongPipeline();
  await assert.rejects(
    () => pipeline.generateSong({ prompt: 'x', providers: { music: 'does-not-exist' } }),
    /Unknown music provider/
  );
});
