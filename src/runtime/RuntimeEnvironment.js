/**
 * AURAVOX Runtime Environment
 * Manages the execution lifecycle, state persistence, and hot-reloading
 */

class RuntimeEnvironment {
  constructor(config = {}) {
    this.config = {
      persistence: true,
      hotReload: false,
      sandboxMode: true,
      maxMemoryMB: 2048,
      ...config
    };
    
    this.state = {
      status: 'idle', // idle, running, paused, stopped
      uptime: 0,
      memoryUsage: 0,
      activeTasks: new Map(),
      completedTasks: [],
      errorLog: [],
      startTime: null
    };
    
    this.metrics = {
      tasksCompleted: 0,
      errorsHandled: 0,
      averageResponseTime: 0,
      memoryPeaks: []
    };
    
    this.intervals = [];
  }

  /**
   * Initialize the runtime environment
   */
  async initialize() {
    console.log('🚀 Initializing AURAVOX Runtime...');
    this.state.status = 'initializing';
    this.state.startTime = Date.now();
    
    // Setup memory monitoring
    this.startMemoryMonitoring();
    
    // Setup error handlers
    this.setupErrorHandlers();
    
    // Load persisted state if available
    if (this.config.persistence) {
      await this.loadState();
    }
    
    this.state.status = 'running';
    console.log('✅ Runtime initialized successfully');
    return true;
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    const interval = setInterval(() => {
      const usage = process.memoryUsage();
      this.state.memoryUsage = Math.round(usage.heapUsed / 1024 / 1024);
      
      if (this.state.memoryUsage > this.config.maxMemoryMB * 0.9) {
        console.warn('⚠️ Memory usage approaching limit:', this.state.memoryUsage, 'MB');
        this.triggerGarbageCollection();
      }
      
      this.metrics.memoryPeaks.push(this.state.memoryUsage);
      if (this.metrics.memoryPeaks.length > 100) {
        this.metrics.memoryPeaks.shift();
      }
    }, 5000);
    
    this.intervals.push(interval);
  }

  /**
   * Setup global error handlers
   */
  setupErrorHandlers() {
    process.on('uncaughtException', (err) => {
      console.error('💥 Uncaught Exception:', err.message);
      this.state.errorLog.push({
        type: 'uncaughtException',
        message: err.message,
        stack: err.stack,
        timestamp: Date.now()
      });
      this.metrics.errorsHandled++;
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚫 Unhandled Rejection:', reason);
      this.state.errorLog.push({
        type: 'unhandledRejection',
        message: String(reason),
        timestamp: Date.now()
      });
      this.metrics.errorsHandled++;
    });
  }

  /**
   * Execute a task with monitoring
   */
  async executeTask(taskId, taskFn, context = {}) {
    const startTime = Date.now();
    
    this.state.activeTasks.set(taskId, {
      id: taskId,
      status: 'running',
      startTime,
      context
    });
    
    try {
      const result = await taskFn(context);
      const duration = Date.now() - startTime;
      
      this.state.activeTasks.delete(taskId);
      this.state.completedTasks.push({
        id: taskId,
        status: 'completed',
        duration,
        timestamp: Date.now()
      });
      
      this.metrics.tasksCompleted++;
      this.updateAverageResponseTime(duration);
      
      return { success: true, result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.state.activeTasks.delete(taskId);
      this.state.errorLog.push({
        taskId,
        type: 'taskFailure',
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
      
      this.metrics.errorsHandled++;
      
      return { success: false, error: error.message, duration };
    }
  }

  /**
   * Update average response time metric
   */
  updateAverageResponseTime(newDuration) {
    const total = this.metrics.averageResponseTime * (this.metrics.tasksCompleted - 1) + newDuration;
    this.metrics.averageResponseTime = total / this.metrics.tasksCompleted;
  }

  /**
   * Trigger garbage collection (if available)
   */
  triggerGarbageCollection() {
    if (global.gc) {
      console.log('🧹 Triggering garbage collection...');
      global.gc();
    } else {
      console.log('⚠️ GC not exposed, consider running with --expose-gc');
    }
  }

  /**
   * Save current state to disk
   */
  async saveState() {
    if (!this.config.persistence) return;
    
    const fs = await import('fs').catch(() => null);
    const path = await import('path').catch(() => null);
    
    if (!fs || !path) {
      console.warn('⚠️ Filesystem access not available for state persistence');
      return;
    }
    
    const stateFile = path.join(process.cwd(), '.auravox-state.json');
    const stateData = {
      metrics: this.metrics,
      completedTasksCount: this.state.completedTasks.length,
      errorsHandled: this.metrics.errorsHandled,
      lastUpdated: Date.now()
    };
    
    try {
      fs.writeFileSync(stateFile, JSON.stringify(stateData, null, 2));
      console.log('💾 State saved successfully');
    } catch (error) {
      console.error('❌ Failed to save state:', error.message);
    }
  }

  /**
   * Load state from disk
   */
  async loadState() {
    const fs = await import('fs').catch(() => null);
    const path = await import('path').catch(() => null);
    
    if (!fs || !path) return;
    
    const stateFile = path.join(process.cwd(), '.auravox-state.json');
    
    try {
      if (fs.existsSync(stateFile)) {
        const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        this.metrics = { ...this.metrics, ...data.metrics };
        console.log('📂 State loaded successfully');
      }
    } catch (error) {
      console.warn('⚠️ Could not load previous state:', error.message);
    }
  }

  /**
   * Get runtime statistics
   */
  getStats() {
    const uptime = this.state.startTime 
      ? Math.round((Date.now() - this.state.startTime) / 1000) 
      : 0;
    
    return {
      status: this.state.status,
      uptime: `${uptime}s`,
      memoryUsage: `${this.state.memoryUsage}MB`,
      activeTasks: this.state.activeTasks.size,
      completedTasks: this.metrics.tasksCompleted,
      errorsHandled: this.metrics.errorsHandled,
      averageResponseTime: `${Math.round(this.metrics.averageResponseTime)}ms`
    };
  }

  /**
   * Pause runtime
   */
  pause() {
    if (this.state.status !== 'running') return false;
    
    this.state.status = 'paused';
    this.intervals.forEach(interval => clearInterval(interval));
    console.log('⏸️ Runtime paused');
    return true;
  }

  /**
   * Resume runtime
   */
  resume() {
    if (this.state.status !== 'paused') return false;
    
    this.state.status = 'running';
    this.startMemoryMonitoring();
    console.log('▶️ Runtime resumed');
    return true;
  }

  /**
   * Stop runtime gracefully
   */
  async stop() {
    console.log('🛑 Stopping runtime...');
    this.state.status = 'stopped';
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    // Wait for active tasks to complete (with timeout)
    const activeCount = this.state.activeTasks.size;
    if (activeCount > 0) {
      console.log(`⏳ Waiting for ${activeCount} active tasks to complete...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Save state before exit
    await this.saveState();
    
    console.log('✅ Runtime stopped successfully');
    return true;
  }
}

export default RuntimeEnvironment;
