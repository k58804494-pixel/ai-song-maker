/**
 * Safety Governor
 * Three-tier safety system: SAFE, CONFIRM, RESTRICTED
 * Prevents dangerous operations and enforces permissions
 */

export class SafetyGovernor {
  constructor(level = 'STANDARD') {
    this.level = level;
    this.restrictedPatterns = [
      'delete.*system',
      'rm.*-rf.*\/',
      'drop.*table',
      'format.*:',
      'chmod.*777',
      'sudo.*rm',
      'eval.*user',
      'exec.*injection'
    ];
    
    this.confirmPatterns = [
      'delete',
      'remove',
      'update.*production',
      'deploy',
      'restart',
      'modify.*config',
      'change.*permission'
    ];

    this.validationHistory = [];
  }

  /**
   * Validate a request against safety rules
   */
  async validate(request) {
    const requestStr = typeof request === 'string' 
      ? request.toLowerCase() 
      : JSON.stringify(request).toLowerCase();

    const timestamp = new Date().toISOString();
    
    // Check for restricted patterns
    for (const pattern of this.restrictedPatterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(requestStr)) {
        const result = {
          approved: false,
          level: 'RESTRICTED',
          reason: 'Request matches restricted pattern: ' + pattern,
          timestamp
        };
        this.validationHistory.push(result);
        console.log('🔴 BLOCKED:', result.reason);
        return result;
      }
    }

    // Check for confirmation-required patterns
    for (const pattern of this.confirmPatterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(requestStr)) {
        const result = {
          approved: this.level !== 'STRICT',
          level: 'CONFIRM',
          reason: 'Request requires confirmation: ' + pattern,
          requiresUserApproval: true,
          timestamp
        };
        this.validationHistory.push(result);
        
        if (!result.approved) {
          console.log('🟡 REQUIRES CONFIRMATION:', result.reason);
        } else {
          console.log('🟡 CONFIRMED:', result.reason);
        }
        
        return result;
      }
    }

    // Default: safe
    const result = {
      approved: true,
      level: 'SAFE',
      reason: 'No safety concerns detected',
      timestamp
    };
    
    this.validationHistory.push(result);
    console.log('🟢 SAFE:', result.reason);
    
    return result;
  }

  /**
   * Check if an action is safe to execute
   */
  isSafe(action) {
    const actionStr = action.toLowerCase();
    
    // Dangerous file operations
    if (actionStr.includes('rm -rf') || actionStr.includes('del /f')) {
      return false;
    }
    
    // Database destruction
    if (actionStr.includes('drop database') || actionStr.includes('truncate table')) {
      return false;
    }
    
    // System modifications
    if (actionStr.includes('/etc/') || actionStr.includes('/bin/') || actionStr.includes('/usr/')) {
      if (actionStr.includes('rm') || actionStr.includes('overwrite')) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Require explicit user confirmation
   */
  requireConfirmation(action, reason = '') {
    return {
      requiresConfirmation: true,
      action,
      reason: reason || 'This action may have significant consequences',
      prompt: '⚠️ Confirm: ' + action + '? (' + (reason || 'proceed with caution') + ')'
    };
  }

  /**
   * Get validation history
   */
  getHistory() {
    return this.validationHistory;
  }

  /**
   * Get safety statistics
   */
  getStats() {
    const total = this.validationHistory.length;
    const blocked = this.validationHistory.filter(v => !v.approved).length;
    const confirmed = this.validationHistory.filter(v => v.level === 'CONFIRM').length;
    const safe = this.validationHistory.filter(v => v.level === 'SAFE').length;

    return {
      totalValidations: total,
      blocked,
      requiresConfirmation: confirmed,
      safe,
      blockRate: total > 0 ? ((blocked / total) * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Set safety level
   */
  setLevel(level) {
    const validLevels = ['PERMISSIVE', 'STANDARD', 'STRICT'];
    if (!validLevels.includes(level)) {
      throw new Error('Invalid safety level. Must be one of: ' + validLevels.join(', '));
    }
    
    this.level = level;
    console.log('🔒 Safety level set to:', level);
  }
}

export default SafetyGovernor;
