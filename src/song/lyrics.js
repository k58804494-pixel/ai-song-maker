/**
 * Lyrics stage.
 *
 * M0 ships a deterministic, dependency-free placeholder so the pipeline runs in
 * CI without an LLM key. M2 swaps in a real LLM behind `SongSpec.providers.lyrics`
 * with structure/meter awareness. Locked sections and sections that already have
 * lyrics are never overwritten — this is what enables section-level editing.
 */

const NON_LYRICAL = new Set(['Intro', 'Solo', 'Outro']);

/**
 * Fill in lyrics for each lyrical section that doesn't already have them.
 * Returns a new structure array (does not mutate input).
 *
 * @param {object} songSpec
 * @returns {Array<object>} structure with lyrics populated
 */
export function generateLyrics(songSpec) {
  const theme = (songSpec.prompt || songSpec.mood || 'the moment').trim();

  return songSpec.structure.map((section, idx) => {
    if (section.locked || section.lyrics || NON_LYRICAL.has(section.section)) {
      return { ...section };
    }
    const line = `[${section.section} ${idx + 1}] A ${songSpec.mood} ${songSpec.genre} song about ${theme}`;
    return { ...section, lyrics: line };
  });
}
