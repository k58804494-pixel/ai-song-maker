/**
 * Section editor — the core "beat Suno" control surface.
 *
 * Songs are composed section-by-section with an independent seed per section
 * (see `synth/arranger.js`). That lets you **regenerate** a single Verse/Chorus
 * to get a fresh variation, or **lock** a section so it never changes — while
 * every other section stays bit-identical. All free, offline, deterministic.
 *
 * Every function is pure: it returns a new SongSpec and never mutates the input.
 */

function cloneSpec(spec) {
  return {
    ...spec,
    structure: spec.structure.map((s) => ({ ...s })),
    providers: { ...spec.providers },
    voice: { ...spec.voice },
    license: { ...spec.license }
  };
}

function assertIndex(spec, index) {
  if (!Number.isInteger(index) || index < 0 || index >= spec.structure.length) {
    throw new RangeError(`section index ${index} out of range (0..${spec.structure.length - 1})`);
  }
}

/**
 * Lock or unlock a section. A locked section is protected from regeneration.
 * @param {object} spec
 * @param {number} index
 * @param {boolean} [locked=true]
 * @returns {object} new SongSpec
 */
export function lockSection(spec, index, locked = true) {
  assertIndex(spec, index);
  const next = cloneSpec(spec);
  next.structure[index].locked = Boolean(locked);
  return next;
}

/** Convenience: unlock a section. */
export function unlockSection(spec, index) {
  return lockSection(spec, index, false);
}

/**
 * Regenerate a single section by changing its seed. The musical content of that
 * section changes; all other sections render identically. Locked sections are
 * left untouched (no-op) unless `force` is set.
 *
 * @param {object} spec
 * @param {number} index
 * @param {object} [opts]
 * @param {number} [opts.seed]   explicit new seed (default: deterministic bump)
 * @param {boolean} [opts.force] regenerate even if the section is locked
 * @returns {object} new SongSpec
 */
export function regenerateSection(spec, index, opts = {}) {
  assertIndex(spec, index);
  const section = spec.structure[index];
  if (section.locked && !opts.force) return spec; // no-op: respect the lock

  const next = cloneSpec(spec);
  const current = Number.isFinite(section.seed) ? section.seed : 0;
  next.structure[index].seed = Number.isFinite(opts.seed) ? opts.seed : current + 1;
  return next;
}

/**
 * Replace a section's lyrics (and reset its seed so the new words get a fresh
 * melodic line). Useful for the lyric editor.
 * @param {object} spec
 * @param {number} index
 * @param {string} lyrics
 * @returns {object} new SongSpec
 */
export function setSectionLyrics(spec, index, lyrics) {
  assertIndex(spec, index);
  const next = cloneSpec(spec);
  next.structure[index].lyrics = lyrics;
  return next;
}
