/**
 * Music provider registry.
 *
 * Maps `SongSpec.providers.music` → a provider instance. M0 registers the
 * `mock` backend; M1 registers one hosted and one local backend here without
 * touching the pipeline or callers.
 */
import { MockMusicProvider } from './MockMusicProvider.js';

const factories = new Map();

/**
 * Register a provider factory under a name.
 * @param {string} name
 * @param {() => import('./BaseMusicProvider.js').BaseMusicProvider} factory
 */
export function registerProvider(name, factory) {
  factories.set(name, factory);
}

/** @returns {string[]} registered provider names */
export function listProviders() {
  return [...factories.keys()];
}

/**
 * Resolve a provider instance by name, with a helpful error if unknown.
 * @param {string} name
 * @returns {import('./BaseMusicProvider.js').BaseMusicProvider}
 */
export function resolveProvider(name) {
  const factory = factories.get(name);
  if (!factory) {
    throw new Error(
      `Unknown music provider "${name}". Registered: ${listProviders().join(', ') || '(none)'}`
    );
  }
  const provider = factory();
  if (!provider.isAvailable()) {
    throw new Error(
      `Music provider "${name}" is registered but not available in this environment ` +
      `(missing API key or local model). Falling back requires choosing another provider.`
    );
  }
  return provider;
}

// Built-in providers.
registerProvider('mock', () => new MockMusicProvider());
