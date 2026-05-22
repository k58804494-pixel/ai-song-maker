/**
 * Plugin System
 * Install, create, update, and sandbox-test plugins
 */

export class PluginSystem {
  constructor() {
    this.plugins = new Map();
    this.categories = ['coding', 'video', 'audio', 'ui', 'automation', 'gaming', 'analytics'];
    this.sandboxMode = true;
  }

  /**
   * Register a plugin
   */
  register(plugin) {
    if (!plugin.name || !plugin.execute) {
      throw new Error('Plugin must have name and execute method');
    }

    const pluginInfo = {
      ...plugin,
      id: this.generateId(),
      registeredAt: new Date().toISOString(),
      enabled: true,
      executionCount: 0
    };

    this.plugins.set(pluginInfo.id, pluginInfo);
    console.log('🔌 Plugin registered:', plugin.name);

    return pluginInfo;
  }

  /**
   * Execute a plugin in sandbox mode
   */
  async execute(pluginId, input) {
    const plugin = this.plugins.get(pluginId);
    
    if (!plugin) {
      throw new Error('Plugin not found: ' + pluginId);
    }

    if (!plugin.enabled) {
      throw new Error('Plugin is disabled: ' + plugin.name);
    }

    try {
      if (this.sandboxMode) {
        // Sandbox execution with timeout
        const result = await Promise.race([
          plugin.execute(input),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Plugin execution timeout')), 5000)
          )
        ]);
        
        plugin.executionCount++;
        return { success: true, result };
      } else {
        const result = await plugin.execute(input);
        plugin.executionCount++;
        return { success: true, result };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable/disable a plugin
   */
  setEnabled(pluginId, enabled) {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = enabled;
      console.log('🔌 Plugin ' + (enabled ? 'enabled' : 'disabled') + ':', plugin.name);
    }
  }

  /**
   * Get all plugins
   */
  getAll() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by category
   */
  getByCategory(category) {
    return Array.from(this.plugins.values()).filter(p => p.category === category);
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const all = Array.from(this.plugins.values());
    const total = all.length;
    const enabled = all.filter(p => p.enabled).length;
    const totalExecutions = all.reduce((sum, p) => sum + p.executionCount, 0);

    return {
      totalPlugins: total,
      enabledPlugins: enabled,
      disabledPlugins: total - enabled,
      totalExecutions,
      byCategory: this.categories.map(cat => ({
        category: cat,
        count: all.filter(p => p.category === cat).length
      }))
    };
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return 'plugin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Example built-in plugins
export const builtinPlugins = [
  {
    name: 'CodeAnalyzer',
    category: 'coding',
    description: 'Analyze code quality and patterns',
    execute: async (code) => {
      return {
        quality: 'good',
        suggestions: [],
        complexity: 'medium'
      };
    }
  },
  {
    name: 'AudioProcessor',
    category: 'audio',
    description: 'Process and analyze audio files',
    execute: async (audioData) => {
      return {
        duration: 0,
        format: 'unknown',
        metadata: {}
      };
    }
  },
  {
    name: 'ImageGenerator',
    category: 'video',
    description: 'Generate images from descriptions',
    execute: async (prompt) => {
      return {
        imageUrl: 'generated_image.png',
        prompt,
        style: 'default'
      };
    }
  }
];

export default PluginSystem;
