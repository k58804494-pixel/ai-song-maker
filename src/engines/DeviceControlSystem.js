/**
 * Device Control System - Safe Computer Interaction Layer
 * Handles desktop, browser, IDE, and application automation
 */

import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';

const execPromise = util.promisify(exec);

class DeviceControlSystem {
  constructor(safetyGovernor) {
    this.safetyGovernor = safetyGovernor;
    this.activeSessions = new Map();
    this.capabilities = [
      'fileOperations',
      'appControl',
      'browserAutomation',
      'terminalCommands',
      'screenCapture',
      'inputSimulation'
    ];
    this.stats = {
      totalOperations: 0,
      byType: {},
      blocked: 0,
      confirmed: 0
    };
    
    // Dangerous patterns that always require confirmation
    this.dangerousPatterns = [
      /rm\s+-rf/,
      /del\s+\/f\s+/i,
      /format\s+/i,
      /shutdown\s+/i,
      /sudo\s+rm/,
      /chmod\s+-R\s+777/,
      /dd\s+if=/,
      />\s+\/dev/
    ];
  }

  /**
   * Initialize device control system
   */
  async initialize() {
    console.log('🖥 Device Control System initializing...');
    
    for (const capability of this.capabilities) {
      this.stats.byType[capability] = 0;
    }
    
    console.log(`✅ Device Control ready with ${this.capabilities.length} capabilities`);
    return true;
  }

  /**
   * Check if command is safe to execute
   */
  checkSafety(command) {
    // Check against dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(command)) {
        return { safe: false, reason: 'dangerous_pattern', pattern: pattern.toString() };
      }
    }
    
    // Use safety governor if available
    if (this.safetyGovernor) {
      const governorResult = this.safetyGovernor.isSafe(command);
      if (!governorResult.safe) {
        return { safe: false, reason: 'safety_governor' };
      }
    }
    
    return { safe: true };
  }

  /**
   * Execute terminal command safely
   */
  async executeCommand(command, options = {}) {
    const startTime = Date.now();
    
    // Safety check
    const safetyCheck = this.checkSafety(command);
    if (!safetyCheck.safe) {
      this.stats.blocked++;
      throw new Error(`Command blocked: ${safetyCheck.reason}`);
    }
    
    // Require confirmation for certain operations
    if (options.requireConfirmation || this.needsConfirmation(command)) {
      this.stats.confirmed++;
      if (!options.confirmed) {
        return {
          requiresConfirmation: true,
          command,
          reason: 'Potentially destructive operation'
        };
      }
    }
    
    try {
      const { stdout, stderr } = await execPromise(command, {
        timeout: options.timeout || 30000,
        maxBuffer: options.maxBuffer || 1024 * 1024
      });
      
      this.stats.totalOperations++;
      this.stats.byType.terminalCommands = (this.stats.byType.terminalCommands || 0) + 1;
      
      return {
        success: true,
        stdout,
        stderr,
        executionTime: Date.now() - startTime,
        command
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stderr: error.stderr,
        command
      };
    }
  }

  /**
   * Check if command needs confirmation
   */
  needsConfirmation(command) {
    const confirmKeywords = ['delete', 'remove', 'kill', 'stop', 'close', 'exit'];
    return confirmKeywords.some(keyword => 
      command.toLowerCase().includes(keyword)
    );
  }

  /**
   * Open application
   */
  async openApp(appName, options = {}) {
    const platform = process.platform;
    let command;
    
    switch (platform) {
      case 'darwin': // macOS
        command = `open -a "${appName}"`;
        break;
      case 'win32': // Windows
        command = `start "" "${appName}"`;
        break;
      case 'linux': // Linux
        command = `xdg-open "${appName}"`;
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    const result = await this.executeCommand(command, options);
    
    if (result.success) {
      this.stats.byType.appControl = (this.stats.byType.appControl || 0) + 1;
    }
    
    return result;
  }

  /**
   * Close application
   */
  async closeApp(appName, options = {}) {
    const platform = process.platform;
    let command;
    
    switch (platform) {
      case 'darwin':
        command = `pkill -x "${appName}"`;
        break;
      case 'win32':
        command = `taskkill /IM "${appName}.exe" /F`;
        break;
      case 'linux':
        command = `pkill -x "${appName}"`;
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    const result = await this.executeCommand(command, { ...options, requireConfirmation: true });
    
    if (result.success) {
      this.stats.byType.appControl = (this.stats.byType.appControl || 0) + 1;
    }
    
    return result;
  }

  /**
   * Browser automation - open URL
   */
  async openURL(url, browser = 'default') {
    const platform = process.platform;
    let command;
    
    // Validate URL
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }
    
    switch (platform) {
      case 'darwin':
        command = browser === 'default' 
          ? `open "${url}"` 
          : `open -a "${browser}" "${url}"`;
        break;
      case 'win32':
        command = browser === 'default'
          ? `start "" "${url}"`
          : `start "" "${browser}" "${url}"`;
        break;
      case 'linux':
        command = browser === 'default'
          ? `xdg-open "${url}"`
          : `${browser} "${url}"`;
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    const result = await this.executeCommand(command);
    
    if (result.success) {
      this.stats.byType.browserAutomation = (this.stats.byType.browserAutomation || 0) + 1;
    }
    
    return result;
  }

  /**
   * File operations - read file
   */
  async readFile(filePath) {
    // fs imported at top
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.stats.totalOperations++;
      this.stats.byType.fileOperations = (this.stats.byType.fileOperations || 0) + 1;
      
      return {
        success: true,
        content,
        path: filePath,
        size: content.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: filePath
      };
    }
  }

  /**
   * File operations - write file
   */
  async writeFile(filePath, content, options = {}) {
    // fs imported at top
    
    // Safety check - don't overwrite critical files
    const protectedPaths = ['/etc/', '/usr/', '/bin/', '/sbin/', 'C:\\Windows\\'];
    if (protectedPaths.some(path => filePath.startsWith(path))) {
      this.stats.blocked++;
      throw new Error('Cannot write to protected system path');
    }
    
    try {
      await fs.writeFile(filePath, content, options);
      this.stats.totalOperations++;
      this.stats.byType.fileOperations = (this.stats.byType.fileOperations || 0) + 1;
      
      return {
        success: true,
        path: filePath,
        size: content.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: filePath
      };
    }
  }

  /**
   * File operations - list directory
   */
  async listDirectory(dirPath) {
    // fs imported at top
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      this.stats.totalOperations++;
      this.stats.byType.fileOperations = (this.stats.byType.fileOperations || 0) + 1;
      
      const files = entries
        .filter(e => e.isFile())
        .map(e => ({ name: e.name, type: 'file' }));
      const directories = entries
        .filter(e => e.isDirectory())
        .map(e => ({ name: e.name, type: 'directory' }));
      
      return {
        success: true,
        path: dirPath,
        files,
        directories,
        total: entries.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: dirPath
      };
    }
  }

  /**
   * Screen capture
   */
  async captureScreen(options = {}) {
    const platform = process.platform;
    const outputPath = options.output || `/tmp/screenshot_${Date.now()}.png`;
    
    let command;
    switch (platform) {
      case 'darwin':
        command = `screencapture "${outputPath}"`;
        break;
      case 'win32':
        // Windows would need PowerShell or external tool
        return {
          success: false,
          error: 'Screen capture requires additional setup on Windows',
          platform: 'win32'
        };
      case 'linux':
        command = `gnome-screenshot -f "${outputPath}" 2>/dev/null || import "${outputPath}"`;
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    const result = await this.executeCommand(command);
    
    if (result.success) {
      this.stats.byType.screenCapture = (this.stats.byType.screenCapture || 0) + 1;
      result.outputPath = outputPath;
    }
    
    return result;
  }

  /**
   * Simulate keyboard input
   */
  async typeText(text, options = {}) {
    // This would require external tools like robotjs, nut.js, or pynput
    // Simulation for demonstration
    return {
      success: true,
      text,
      simulated: true,
      message: 'Text input simulated. Install robotjs for real input simulation.',
      length: text.length
    };
  }

  /**
   * Simulate mouse click
   */
  async click(x, y, button = 'left') {
    // This would require external tools
    return {
      success: true,
      x,
      y,
      button,
      simulated: true,
      message: 'Mouse click simulated. Install robotjs for real input simulation.'
    };
  }

  /**
   * Create automation session
   */
  createSession(sessionId, config = {}) {
    const session = {
      id: sessionId || `session_${Date.now()}`,
      createdAt: new Date().toISOString(),
      config,
      actions: [],
      active: true
    };
    
    this.activeSessions.set(session.id, session);
    return session;
  }

  /**
   * Record action in session
   */
  recordAction(sessionId, action) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" not found`);
    }
    
    session.actions.push({
      timestamp: new Date().toISOString(),
      ...action
    });
    
    return action;
  }

  /**
   * Get session history
   */
  getSessionHistory(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }
    
    return session.actions;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeSessions: this.activeSessions.size,
      platform: process.platform
    };
  }

  /**
   * Close session
   */
  closeSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    session.active = false;
    session.closedAt = new Date().toISOString();
    return true;
  }
}

export default DeviceControlSystem;
