/**
 * AURAVOX - Master Autonomous AI Operating System
 * Core Entry Point
 */

import { OrchestratorCore } from './orchestrator/OrchestratorCore.js';
import { MemoryGraphEngine } from './memory/MemoryGraphEngine.js';
import { SafetyGovernor } from './safety/SafetyGovernor.js';

class AURAVOX {
  constructor(config = {}) {
    this.config = {
      mode: config.mode || 'ADAPTIVE',
      safetyLevel: config.safetyLevel || 'STANDARD',
      enableLogging: config.enableLogging ?? true,
      ...config
    };

    // Initialize core systems
    this.safetyGovernor = new SafetyGovernor(this.config.safetyLevel);
    this.memoryGraph = new MemoryGraphEngine();
    this.orchestrator = new OrchestratorCore(this);

    this.version = '1.0.0';
    this.status = 'INITIALIZED';
    
    if (this.config.enableLogging) {
      console.log('🌟 AURAVOX v' + this.version + ' initialized');
      console.log('   Mode: ' + this.config.mode);
      console.log('   Safety Level: ' + this.config.safetyLevel);
    }
  }

  /**
   * Main entry point for processing requests
   */
  async process(request) {
    const startTime = Date.now();
    
    try {
      // Safety check first
      const safetyCheck = await this.safetyGovernor.validate(request);
      if (!safetyCheck.approved) {
        throw new Error('Request blocked by Safety Governor: ' + safetyCheck.reason);
      }

      // Process through orchestrator
      const result = await this.orchestrator.execute(request);

      // Store learning in memory graph
      await this.memoryGraph.store({
        type: 'execution',
        request,
        result,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      // Log failure to memory graph
      await this.memoryGraph.store({
        type: 'error',
        request,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      version: this.version,
      status: this.status,
      mode: this.config.mode,
      safetyLevel: this.config.safetyLevel,
      memoryNodes: this.memoryGraph.getNodeCount(),
      orchestrator: this.orchestrator.getStatus()
    };
  }

  /**
   * Shutdown gracefully
   */
  async shutdown() {
    console.log('🔒 Shutting down AURAVOX...');
    this.status = 'SHUTTING_DOWN';
    await this.orchestrator.shutdown();
    await this.memoryGraph.persist();
    this.status = 'SHUTDOWN';
    console.log('✅ AURAVOX shutdown complete');
  }
}

export { AURAVOX };
export default AURAVOX;
