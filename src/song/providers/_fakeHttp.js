/**
 * Test helper: build fake fetch Response objects so provider network flows can
 * be exercised deterministically without real HTTP. Not shipped in prod paths.
 */
export function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() { return body; },
    async text() { return JSON.stringify(body); },
    async arrayBuffer() { return new ArrayBuffer(0); }
  };
}

export function binaryResponse(buffer, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() { throw new Error('not json'); },
    async text() { return '[binary]'; },
    async arrayBuffer() {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
  };
}
