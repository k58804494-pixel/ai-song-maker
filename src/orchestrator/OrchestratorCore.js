/**
 * Orchestrator Core - Master Controller
 * Routes tasks, assigns agents, prioritizes execution, monitors system health
 */

import { ArchitectAgent } from '../agents/ArchitectAgent.js';
import { BuilderAgent } from '../agents/BuilderAgent.js';
import { DesignerAgent } from '../agents/DesignerAgent.js';
import { CriticAgent } from '../agents/CriticAgent.js';
import { DevOpsAgent } from '../agents/DevOpsAgent.js';
import { ReasoningEngine } from '../engines/ReasoningEngine.js';

export class OrchestratorCore {
  constructor(auravox) {
    this.auravox = auravox;
    this.status = 'IDLE';
    this.activeAgents = new Map();
    this.taskQueue = [];
    this.executionHistory = [];

    // Initialize specialized agents
    this.agents = {
      architect: new ArchitectAgent(this),
      builder: new BuilderAgent(this),
      designer: new DesignerAgent(this),
      critic: new CriticAgent(this),
      devops: new DevOpsAgent(this)
    };

    // Initialize reasoning engine
    this.reasoningEngine = new ReasoningEngine(auravox.config.mode);

    console.log('🎯 Orchestrator Core initialized with ' + Object.keys(this.agents).length + ' agents');
  }

  /**
   * Main execution flow
   */
  async execute(request) {
    this.status = 'ANALYZING';
    
    try {
      // Step 1: Analyze Intent
      const analysis = await this.analyzeIntent(request);
      
      // Step 2: Select Reasoning Mode
      const reasoningMode = this.reasoningEngine.selectMode(analysis.complexity);
      
      // Step 3: Split into Tasks
      const tasks = await this.splitIntoTasks(request, analysis);
      
      // Step 4: Assign Agents
      const agentAssignments = this.assignAgents(tasks);
      
      // Step 5: Execute Safely
      const results = await this.executeTasks(agentAssignments, reasoningMode);
      
      // Step 6: Validate Results
      const validation = await this.validateResults(results);
      
      if (!validation.valid) {
        throw new Error('Validation failed: ' + validation.errors.join(', '));
      }

      this.status = 'IDLE';
      
      return {
        success: true,
        results,
        analysis,
        reasoningMode,
        executionTime: Date.now()
      };
    } catch (error) {
      this.status = 'ERROR';
      throw error;
    }
  }

  /**
   * Analyze the intent of the request
   */
  async analyzeIntent(request) {
    const keywords = Object.keys({
      'architect': ['design', 'plan', 'structure', 'architecture', 'scale'],
      'builder': ['code', 'build', 'create', 'implement', 'develop'],
      'designer': ['ui', 'ux', 'visual', 'design', 'interface'],
      'critic': ['review', 'analyze', 'test', 'debug', 'validate'],
      'devops': ['deploy', 'infrastructure', 'optimize', 'monitor', 'ci/cd']
    }).reduce((acc, key, i) => {
      const patterns = Object.entries({
        'architect': ['design', 'plan', 'structure', 'architecture', 'scale'],
        'builder': ['code', 'build', 'create', 'implement', 'develop'],
        'designer': ['ui', 'ux', 'visual', 'design', 'interface'],
        'critic': ['review', 'analyze', 'test', 'debug', 'validate'],
        'devops': ['deploy', 'infrastructure', 'optimize', 'monitor', 'ci/cd']
      })[i][1];
      
      const text = JSON.stringify(request).toLowerCase();
      if (patterns.some(p => text.includes(p))) {
        acc[key] = true;
      }
      return acc;
    }, {});

    const complexity = this.calculateComplexity(request);

    return {
      intent: Object.keys(keywords).length > 0 ? Object.keys(keywords)[0] : 'general',
      keywords,
      complexity,
      estimatedDuration: complexity * 100
    };
  }

  /**
   * Calculate complexity score (1-10)
   */
  calculateComplexity(request) {
    const text = JSON.stringify(request);
    let score = 1;

    // Length factor
    if (text.length > 100) score += 1;
    if (text.length > 500) score += 1;
    if (text.length > 1000) score += 1;

    // Multi-step indicators
    const multiStepPatterns = ['then', 'after', 'finally', 'sequence', 'workflow'];
    if (multiStepPatterns.some(p => text.toLowerCase().includes(p))) score += 2;

    // Technical depth
    const techPatterns = ['api', 'database', 'algorithm', 'optimization', 'integration'];
    if (techPatterns.some(p => text.toLowerCase().includes(p))) score += 2;

    return Math.min(score, 10);
  }

  /**
   * Split request into executable tasks
   */
  async splitIntoTasks(request, analysis) {
    const tasks = [];
    
    // Simple task splitting based on analysis
    if (analysis.intent === 'architect') {
      tasks.push({ type: 'plan', description: 'Create architecture plan' });
      tasks.push({ type: 'design', description: 'Design system structure' });
    } else if (analysis.intent === 'builder') {
      tasks.push({ type: 'code', description: 'Implement requested functionality' });
      tasks.push({ type: 'test', description: 'Test implementation' });
    } else if (analysis.intent === 'designer') {
      tasks.push({ type: 'conceptualize', description: 'Create design concept' });
      tasks.push({ type: 'prototype', description: 'Build prototype' });
    } else {
      tasks.push({ type: 'execute', description: 'Process general request' });
    }

    return tasks;
  }

  /**
   * Assign agents to tasks based on capabilities
   */
  assignAgents(tasks) {
    const assignments = [];

    for (const task of tasks) {
      let assignedAgent;
      
      switch (task.type) {
        case 'plan':
        case 'design':
          assignedAgent = this.agents.architect;
          break;
        case 'code':
        case 'implement':
        case 'build':
          assignedAgent = this.agents.builder;
          break;
        case 'conceptualize':
        case 'prototype':
          assignedAgent = this.agents.designer;
          break;
        case 'test':
        case 'validate':
        case 'review':
          assignedAgent = this.agents.critic;
          break;
        case 'deploy':
        case 'optimize':
          assignedAgent = this.agents.devops;
          break;
        default:
          assignedAgent = this.agents.builder;
      }

      assignments.push({
        task,
        agent: assignedAgent,
        agentName: Object.keys(this.agents).find(key => this.agents[key] === assignedAgent)
      });
    }

    return assignments;
  }

  /**
   * Execute tasks through assigned agents
   */
  async executeTasks(assignments, reasoningMode) {
    const results = [];

    for (const assignment of assignments) {
      this.status = 'EXECUTING_' + assignment.agentName.toUpperCase();
      
      try {
        const result = await assignment.agent.execute(assignment.task, reasoningMode);
        results.push({
          task: assignment.task,
          agent: assignment.agentName,
          result,
          status: 'SUCCESS'
        });
      } catch (error) {
        results.push({
          task: assignment.task,
          agent: assignment.agentName,
          error: error.message,
          status: 'FAILED'
        });
      }
    }

    return results;
  }

  /**
   * Validate execution results
   */
  async validateResults(results) {
    const errors = [];
    
    for (const result of results) {
      if (result.status === 'FAILED') {
        errors.push(result.error);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      status: this.status,
      activeAgents: this.activeAgents.size,
      queuedTasks: this.taskQueue.length,
      executedTasks: this.executionHistory.length,
      agents: Object.keys(this.agents)
    };
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown() {
    console.log('🔒 Shutting down Orchestrator Core...');
    this.status = 'SHUTDOWN';
    this.taskQueue = [];
  }
}

export default OrchestratorCore;
