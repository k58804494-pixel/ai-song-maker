/**
 * BaseMusicProvider — the stable interface every music backend implements.
 *
 * The whole point of the provider abstraction (docs/PLAN.md §5) is that
 * choosing hosted vs local vs mock is a config value in `SongSpec.providers`,
 * never a code change. M0 ships the `mock` provider; M1 adds one hosted and one
 * local provider behind this same interface.
 */
export class BaseMusicProvider {
  /**
   * @param {object} [config]
   */
  constructor(config = {}) {
    this.config = config;
  }

  /** Short stable name used in `SongSpec.providers.music`. */
  get name() {
    return 'base';
  }

  /** One of: 'mock' | 'hosted' | 'local'. */
  get mode() {
    return 'mock';
  }

  /**
   * Whether this provider can run in the current environment (e.g. required API
   * key present, or local model installed). Mock is always available.
   * @returns {boolean}
   */
  isAvailable() {
    return true;
  }

  /**
   * Render audio for a (validated) SongSpec.
   *
   * @param {object} _songSpec
   * @param {object} [_opts]
   * @returns {Promise<import('../types.js').SongRenderResult>}
   */
  async generate(_songSpec, _opts = {}) {
    throw new Error(`${this.constructor.name}.generate() not implemented`);
  }
}
