import { test } from 'node:test';
import assert from 'node:assert/strict';

import { listProviders, resolveProvider, registerProvider } from './registry.js';
import { BaseMusicProvider } from './BaseMusicProvider.js';

test('mock provider is registered by default', () => {
  assert.ok(listProviders().includes('mock'));
  const provider = resolveProvider('mock');
  assert.equal(provider.name, 'mock');
  assert.equal(provider.mode, 'mock');
});

test('resolveProvider throws for unknown names', () => {
  assert.throws(() => resolveProvider('nope'), /Unknown music provider/);
});

test('unavailable providers surface a clear error', () => {
  class UnavailableProvider extends BaseMusicProvider {
    get name() { return 'unavailable'; }
    isAvailable() { return false; }
  }
  registerProvider('unavailable', () => new UnavailableProvider());
  assert.throws(() => resolveProvider('unavailable'), /not available/);
});

test('BaseMusicProvider.generate is abstract', async () => {
  const base = new BaseMusicProvider();
  await assert.rejects(() => base.generate({}), /not implemented/);
});
