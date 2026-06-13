/**
 * Minimal 16-bit PCM mono WAV writer (zero dependencies).
 *
 * Used by the mock music provider so the pipeline produces a *real*, playable
 * audio artifact end-to-end without any model, GPU, or API key. Future
 * hosted/local providers return real model audio instead.
 */

/**
 * Encode mono Float32 samples (range [-1, 1]) into a WAV file Buffer.
 *
 * @param {Float32Array|number[]} samples
 * @param {number} sampleRate
 * @returns {Buffer}
 */
export function encodeWav(samples, sampleRate = 44100) {
  const numSamples = samples.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = bytesPerSample; // mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * bytesPerSample;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(36 + dataSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // PCM chunk size
  buffer.writeUInt16LE(1, offset); offset += 2; // audio format = PCM
  buffer.writeUInt16LE(1, offset); offset += 2; // channels = mono
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(16, offset); offset += 2; // bits per sample

  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), offset);
    offset += 2;
  }

  return buffer;
}

/**
 * Generate a simple sine tone as Float32 samples.
 *
 * @param {object} opts
 * @param {number} opts.frequency  Hz
 * @param {number} opts.durationSec
 * @param {number} [opts.sampleRate=44100]
 * @param {number} [opts.amplitude=0.3]
 * @returns {Float32Array}
 */
export function sineTone({ frequency, durationSec, sampleRate = 44100, amplitude = 0.3 }) {
  const total = Math.max(1, Math.floor(durationSec * sampleRate));
  const out = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    // light fade in/out to avoid clicks
    const env = Math.min(1, i / 1000, (total - i) / 1000);
    out[i] = amplitude * env * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return out;
}
