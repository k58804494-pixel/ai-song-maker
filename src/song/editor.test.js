import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createSongSpec } from './SongSpec.js';
import { lockSection, unlockSection, regenerateSection, setSectionLyrics } from './editor.js';
import { arrange } from './synth/arranger.js';

function specWithSections() {
  return createSongSpec({
    prompt: 'editor demo',
    genre: 'pop',
    key: 'C major',
    tempo: 120,
    structure: [
      { section: 'Verse', bars: 8 },
      { section: 'Chorus', bars: 8 },
      { section: 'Verse', bars: 8 }
    ]
  });
}

// Compare the audio inside a section's time range between two renders.
function sectionDiffers(a, b, range) {
  const sr = a.sampleRate;
  const start = Math.floor(range.startSec * sr);
  const end = Math.min(a.samples.length, b.samples.length, Math.floor((range.startSec + range.durSec) * sr));
  for (let i = start; i < end; i++) {
    if (a.samples[i] !== b.samples[i]) return true;
  }
  return false;
}

test('regenerateSection bumps only the target seed, immutably', () => {
  const spec = specWithSections();
  const next = regenerateSection(spec, 1);
  assert.equal(spec.structure[1].seed, 0, 'original spec is not mutated');
  assert.equal(next.structure[1].seed, 1);
  assert.equal(next.structure[0].seed, 0);
  assert.equal(next.structure[2].seed, 0);
});

test('regenerating one section changes only that section audio', () => {
  const spec = specWithSections();
  const before = arrange(spec, { maxSeconds: 24 });

  const regen = regenerateSection(spec, 1); // middle (Chorus)
  const after = arrange(regen, { maxSeconds: 24 });

  const ranges = before.sections;
  // The regenerated section's audio changes...
  const chorus = ranges.find((r) => r.sectionId === 1);
  assert.ok(sectionDiffers(before, after, chorus), 'regenerated section should change');

  // ...while the other sections stay bit-identical.
  for (const r of ranges.filter((x) => x.sectionId !== 1)) {
    assert.ok(!sectionDiffers(before, after, r), `section ${r.sectionId} (${r.name}) must be unchanged`);
  }
});

test('locked section ignores regeneration (no-op)', () => {
  const spec = lockSection(specWithSections(), 1, true);
  const attempted = regenerateSection(spec, 1);
  assert.equal(attempted, spec, 'locked regenerate returns the same spec unchanged');

  // force overrides the lock
  const forced = regenerateSection(spec, 1, { force: true });
  assert.equal(forced.structure[1].seed, 1);
});

test('lock/unlock toggles the flag immutably', () => {
  const spec = specWithSections();
  const locked = lockSection(spec, 0);
  assert.equal(locked.structure[0].locked, true);
  assert.equal(spec.structure[0].locked, false);
  assert.equal(unlockSection(locked, 0).structure[0].locked, false);
});

test('arrange reports per-section time ranges that tile the song', () => {
  const spec = specWithSections();
  const { sections, durationSec } = arrange(spec, { maxSeconds: 24 });
  assert.ok(sections.length >= 1);
  assert.equal(sections[0].startSec, 0);
  // ranges are contiguous
  for (let i = 1; i < sections.length; i++) {
    const prev = sections[i - 1];
    assert.ok(Math.abs((prev.startSec + prev.durSec) - sections[i].startSec) < 1e-6);
  }
  const last = sections[sections.length - 1];
  assert.ok(Math.abs((last.startSec + last.durSec) - durationSec) < 1e-6);
});

test('setSectionLyrics updates words without touching others', () => {
  const spec = specWithSections();
  const next = setSectionLyrics(spec, 0, 'brand new words to sing');
  assert.equal(next.structure[0].lyrics, 'brand new words to sing');
  assert.equal(spec.structure[0].lyrics, null);
});
