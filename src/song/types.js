/**
 * Shared JSDoc typedefs for the song pipeline.
 *
 * @typedef {object} SongRenderResult
 * @property {string} id
 * @property {'music'} type
 * @property {string} provider     provider name (e.g. 'mock')
 * @property {'mock'|'hosted'|'local'} mode
 * @property {string} filePath     absolute path to the rendered audio file
 * @property {string} url          file:// or https:// URL to the audio
 * @property {string} format       e.g. 'wav'
 * @property {number} durationSec  actual rendered duration
 * @property {number} bytes        size of the audio artifact
 */

export {};
