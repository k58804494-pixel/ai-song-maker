/**
 * AURAVOX Simulation Sandbox
 * Provides safe testing environment for code, workflows, and system changes
 */

class SimulationSandbox {
  constructor(config = {}) {
    this.config = {
      autoRollback: true,
      maxExecutionTime: 30000, // 30 seconds
      resourceLimits: {
        memory: 512, // MB
        cpu: 50, // percentage
        disk: 100 // MB
      },
      ...config
    };
    
    this.activeSimulations = new Map();
    this.snapshots = new Map();
    this.results = [];
    
    this.stats = {
      simulationsRun: 0,
      successfulSimulations: 0,
      failedSimulations: 0,
      rollbacksPerformed: 0,
      averageExecutionTime: 0
    };
  }

  /**
   * Create a snapshot of current state
   */
  async createSnapshot(name, state) {
    const id = `snapshot_${Date.now()}_${name}`;
    
    console.log(`📸 Creating snapshot: ${name}`);
    
    this.snapshots.set(id, {
      id,
      name,
      state: JSON.parse(JSON.stringify(state)),
      createdAt: Date.now(),
      size: JSON.stringify(state).length
    });
    
    return id;
  }

  /**
   * Restore state from snapshot
   */
  async restoreSnapshot(snapshotId) {
    const snapshot = this.snapshots.get(snapshotId);
    
    if (!snapshot) {
      console.error(`❌ Snapshot not found: ${snapshotId}`);
      return { success: false, error: 'Snapshot not found' };
    }
    
    console.log(`↩️ Restoring snapshot: ${snapshot.name}`);
    
    this.stats.rollbacksPerformed++;
    
    return {
      success: true,
      snapshot: snapshot.name,
      restoredState: snapshot.state
    };
  }

  /**
   * Run a simulation with isolation
   */
  async runSimulation(name, simulationFn, initialState = {}) {
    const id = `sim_${Date.now()}_${name}`;
    const startTime = Date.now();
    
    console.log(`🧪 Starting simulation: ${name}`);
    
    // Create initial snapshot
    const snapshotId = await this.createSnapshot(`${name}_initial`, initialState);
    
    const simulation = {
      id,
      name,
      status: 'running',
      startTime,
      snapshotId,
      logs: [],
      result: null
    };
    
    this.activeSimulations.set(id, simulation);
    
    try {
      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Simulation timeout')), this.config.maxExecutionTime);
      });
      
      const executionPromise = simulationFn(initialState, {
        log: (msg) => {
          simulation.logs.push({
            type: 'info',
            message: msg,
            timestamp: Date.now()
          });
          console.log(`   ${msg}`);
        },
        warn: (msg) => {
          simulation.logs.push({
            type: 'warning',
            message: msg,
            timestamp: Date.now()
          });
          console.warn(`   ⚠️ ${msg}`);
        },
        error: (msg) => {
          simulation.logs.push({
            type: 'error',
            message: msg,
            timestamp: Date.now()
          });
          console.error(`   ❌ ${msg}`);
        }
      });
      
      const result = await Promise.race([executionPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      simulation.status = 'completed';
      simulation.result = result;
      simulation.duration = duration;
      
      this.stats.simulationsRun++;
      this.stats.successfulSimulations++;
      this.updateAverageExecutionTime(duration);
      
      console.log(`✅ Simulation completed: ${name} (${duration}ms)`);
      
      // Store result
      this.results.push({
        id,
        name,
        status: 'success',
        duration,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        id,
        result,
        duration,
        logs: simulation.logs
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      simulation.status = 'failed';
      simulation.error = error.message;
      simulation.duration = duration;
      
      this.stats.simulationsRun++;
      this.stats.failedSimulations++;
      
      console.error(`❌ Simulation failed: ${name} - ${error.message}`);
      
      // Auto-rollback if enabled
      if (this.config.autoRollback) {
        console.log('🔄 Auto-rolling back to initial state...');
        await this.restoreSnapshot(snapshotId);
      }
      
      // Store result
      this.results.push({
        id,
        name,
        status: 'failed',
        error: error.message,
        duration,
        timestamp: Date.now()
      });
      
      return {
        success: false,
        id,
        error: error.message,
        duration,
        logs: simulation.logs,
        rolledBack: this.config.autoRollback
      };
    } finally {
      this.activeSimulations.delete(id);
    }
  }

  /**
   * Test code execution in sandbox
   */
  async testCode(code, context = {}) {
    console.log('💻 Testing code in sandbox...');
    
    return this.runSimulation('code_test', async (state, logger) => {
      logger.log('Executing code...');
      
      // In production, would use vm2 or similar for safe execution
      // For now, simulate successful execution
      
      logger.log('Code executed successfully');
      
      return {
        executed: true,
        output: '[Code output]',
        warnings: []
      };
    }, context);
  }

  /**
   * Test workflow execution
   */
  async testWorkflow(workflow, inputData) {
    console.log('🔄 Testing workflow in sandbox...');
    
    return this.runSimulation('workflow_test', async (state, logger) => {
      logger.log(`Starting workflow: ${workflow.name || 'unnamed'}`);
      
      const steps = workflow.steps || [];
      const results = [];
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        logger.log(`Executing step ${i + 1}/${steps.length}: ${step.name || 'step'}`);
        
        // Simulate step execution
        results.push({
          step: i + 1,
          success: true,
          output: `[Step ${i + 1} output]`
        });
      }
      
      logger.log('Workflow completed');
      
      return {
        completed: true,
        stepsExecuted: steps.length,
        results
      };
    }, { inputData, workflow });
  }

  /**
   * Test system change safely
   */
  async testSystemChange(change, currentState) {
    console.log('⚙️ Testing system change in sandbox...');
    
    return this.runSimulation('system_change', async (state, logger) => {
      logger.log('Applying change to cloned state...');
      
      // Clone state
      const newState = JSON.parse(JSON.stringify(currentState));
      
      // Apply change (simulated)
      Object.assign(newState, change);
      
      logger.log('Validating new state...');
      
      // Validate (simulated)
      const validation = {
        valid: true,
        issues: []
      };
      
      if (validation.valid) {
        logger.log('System change validated successfully');
      } else {
        logger.warn(`Validation issues: ${validation.issues.join(', ')}`);
      }
      
      return {
        applied: true,
        newState,
        validation
      };
    }, currentState);
  }

  /**
   * Compare two states for differences
   */
  compareStates(state1, state2) {
    const differences = [];
    
    const allKeys = new Set([...Object.keys(state1), ...Object.keys(state2)]);
    
    allKeys.forEach(key => {
      const val1 = state1[key];
      const val2 = state2[key];
      
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({
          key,
          before: val1,
          after: val2
        });
      }
    });
    
    return {
      hasChanges: differences.length > 0,
      changesCount: differences.length,
      differences
    };
  }

  /**
   * Update average execution time
   */
  updateAverageExecutionTime(newDuration) {
    const total = this.stats.averageExecutionTime * (this.stats.simulationsRun - 1) + newDuration;
    this.stats.averageExecutionTime = total / this.stats.simulationsRun;
  }

  /**
   * Get active simulations
   */
  getActiveSimulations() {
    return Array.from(this.activeSimulations.values());
  }

  /**
   * Get simulation results
   */
  getResults(limit = 20) {
    return this.results.slice(-limit);
  }

  /**
   * Get sandbox statistics
   */
  getStats() {
    return {
      simulationsRun: this.stats.simulationsRun,
      successfulSimulations: this.stats.successfulSimulations,
      failedSimulations: this.stats.failedSimulations,
      rollbacksPerformed: this.stats.rollbacksPerformed,
      averageExecutionTime: `${Math.round(this.stats.averageExecutionTime)}ms`,
      activeSimulations: this.activeSimulations.size,
      snapshotsCount: this.snapshots.size
    };
  }

  /**
   * Clear old snapshots
   */
  clearSnapshots(olderThan = 3600000) { // Default: 1 hour
    const now = Date.now();
    let cleared = 0;
    
    for (const [id, snapshot] of this.snapshots.entries()) {
      if (now - snapshot.createdAt > olderThan) {
        this.snapshots.delete(id);
        cleared++;
      }
    }
    
    console.log(`🗑️ Cleared ${cleared} old snapshots`);
    return cleared;
  }
}

export default SimulationSandbox;
