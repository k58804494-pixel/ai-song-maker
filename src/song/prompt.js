/**
 * Build a single natural-language music prompt from a SongSpec.
 *
 * Shared by the hosted/local providers so they condition models consistently.
 * Vocals/lyrics conditioning is layered in later milestones (dual-track stage);
 * M1 instrumental models use this descriptive prompt.
 *
 * @param {object} songSpec
 * @returns {string}
 */
export function buildMusicPrompt(songSpec) {
  const parts = [
    songSpec.genre,
    songSpec.mood,
    `${songSpec.tempo} BPM`,
    songSpec.key
  ].filter(Boolean);

  const descriptor = parts.join(', ');
  const theme = (songSpec.prompt || songSpec.title || '').trim();

  return theme ? `${descriptor} — ${theme}` : descriptor;
}

/**
 * Clamp a requested duration to a model-safe range (seconds).
 * @param {number} durationSec
 * @param {number} [max=30]
 * @returns {number}
 */
export function clampDuration(durationSec, max = 30) {
  if (typeof durationSec !== 'number' || Number.isNaN(durationSec)) return 8;
  return Math.max(1, Math.min(max, Math.round(durationSec)));
}
