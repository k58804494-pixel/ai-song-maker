/**
 * Utility functions for AURAVOX
 */

export const utils = {
  /**
   * Generate unique ID
   */
  generateId(prefix = 'id') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Deep clone an object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Debounce a function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle a function
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Calculate execution time
   */
  time(fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return { result, duration: end - start };
  },

  /**
   * Async time wrapper
   */
  async timeAsync(fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  },

  /**
   * Retry with exponential backoff
   */
  async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await this.sleep(delay * Math.pow(2, i));
        }
      }
    }
    throw lastError;
  },

  /**
   * Parallel execute with limit
   */
  async parallelExecute(tasks, limit = 5) {
    const results = [];
    const executing = [];

    for (const task of tasks) {
      const p = Promise.resolve(task()).then(result => {
        executing.splice(executing.indexOf(p), 1);
        return result;
      });
      results.push(p);
      executing.push(p);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  }
};

export default utils;
