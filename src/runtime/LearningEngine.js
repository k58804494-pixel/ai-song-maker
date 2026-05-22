/**
 * AURAVOX Learning Engine
 * Implements continuous improvement through experience analysis and pattern recognition
 */

class LearningEngine {
  constructor(config = {}) {
    this.config = {
      learningRate: 0.1,
      memoryThreshold: 100,
      improvementInterval: 3600000, // 1 hour
      ...config
    };
    
    this.experiences = [];
    this.patterns = new Map();
    this.improvements = [];
    this.knowledgeGraph = {
      successes: [],
      failures: [],
      optimizations: [],
      userPreferences: {}
    };
    
    this.stats = {
      totalExperiences: 0,
      patternsRecognized: 0,
      improvementsApplied: 0,
      lastLearningCycle: null
    };
  }

  /**
   * Record a new experience
   */
  recordExperience(experience) {
    const timestamp = Date.now();
    const record = {
      id: `exp_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      type: experience.type, // 'success', 'failure', 'optimization'
      context: experience.context || {},
      outcome: experience.outcome,
      metrics: experience.metrics || {},
      lessons: []
    };
    
    this.experiences.push(record);
    this.stats.totalExperiences++;
    
    // Analyze immediately for patterns
    this.analyzeExperience(record);
    
    // Compress if too many experiences
    if (this.experiences.length > this.config.memoryThreshold) {
      this.compressExperiences();
    }
    
    return record.id;
  }

  /**
   * Analyze a single experience for patterns
   */
  analyzeExperience(experience) {
    const key = this.generatePatternKey(experience);
    
    if (!this.patterns.has(key)) {
      this.patterns.set(key, {
        count: 0,
        successes: 0,
        failures: 0,
        avgMetrics: {},
        lastOccurrence: null
      });
      this.stats.patternsRecognized++;
    }
    
    const pattern = this.patterns.get(key);
    pattern.count++;
    
    if (experience.type === 'success') {
      pattern.successes++;
    } else if (experience.type === 'failure') {
      pattern.failures++;
      this.extractLesson(experience, pattern);
    }
    
    pattern.lastOccurrence = experience.timestamp;
    this.updatePatternMetrics(pattern, experience.metrics);
  }

  /**
   * Generate a pattern key from experience context
   */
  generatePatternKey(experience) {
    const { type, context } = experience;
    const taskType = context.taskType || 'unknown';
    const agentType = context.agentType || 'unknown';
    const errorType = context.errorType || 'none';
    
    return `${taskType}:${agentType}:${errorType}:${type}`;
  }

  /**
   * Extract lessons from failures
   */
  extractLesson(experience, pattern) {
    const failureRate = pattern.failures / pattern.count;
    
    if (failureRate > 0.3 && pattern.count >= 3) {
      const lesson = {
        id: `lesson_${Date.now()}`,
        pattern: this.generatePatternKey(experience),
        failureRate,
        recommendation: this.generateRecommendation(pattern, experience),
        extractedAt: Date.now()
      };
      
      experience.lessons.push(lesson);
      this.knowledgeGraph.failures.push(lesson);
      
      console.log(`📚 Lesson learned: ${lesson.recommendation}`);
    }
  }

  /**
   * Generate recommendation based on pattern analysis
   */
  generateRecommendation(pattern, experience) {
    const failureRate = pattern.failures / pattern.count;
    
    if (failureRate > 0.7) {
      return `High failure rate detected (${Math.round(failureRate * 100)}%). Consider redesigning approach or adding safeguards.`;
    } else if (failureRate > 0.4) {
      return `Moderate failure rate (${Math.round(failureRate * 100)}%). Review error handling and edge cases.`;
    } else {
      return `Occasional failures detected. Monitor for recurring issues.`;
    }
  }

  /**
   * Update pattern metrics with running average
   */
  updatePatternMetrics(pattern, newMetrics) {
    Object.entries(newMetrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const currentAvg = pattern.avgMetrics[key] || 0;
        const count = pattern.count;
        pattern.avgMetrics[key] = currentAvg + (value - currentAvg) / count;
      }
    });
  }

  /**
   * Compress old experiences to save memory
   */
  compressExperiences() {
    const keepCount = Math.floor(this.config.memoryThreshold * 0.5);
    const compressed = this.experiences.slice(-keepCount);
    
    // Aggregate statistics from removed experiences
    const removed = this.experiences.slice(0, -keepCount);
    removed.forEach(exp => {
      if (exp.type === 'success') {
        this.knowledgeGraph.successes.push({
          summary: exp.context.taskType,
          count: 1
        });
      }
    });
    
    this.experiences = compressed;
    console.log(`🗜️ Compressed experiences: ${removed.length} archived, ${keepCount} retained`);
  }

  /**
   * Apply continuous improvement cycle
   */
  async runImprovementCycle() {
    console.log('🔄 Running learning improvement cycle...');
    
    const improvements = [];
    
    // Analyze failure patterns
    this.patterns.forEach((pattern, key) => {
      const failureRate = pattern.failures / pattern.count;
      
      if (failureRate > 0.5 && pattern.count >= 5) {
        improvements.push({
          type: 'process_improvement',
          pattern: key,
          action: 'add_validation',
          priority: 'high'
        });
      }
    });
    
    // Analyze performance patterns
    this.experiences
      .filter(exp => exp.metrics?.duration)
      .forEach(exp => {
        if (exp.metrics.duration > 5000) {
          improvements.push({
            type: 'performance_optimization',
            taskType: exp.context.taskType,
            action: 'optimize_execution',
            priority: 'medium'
          });
        }
      });
    
    this.improvements.push(...improvements);
    this.stats.improvementsApplied += improvements.length;
    this.stats.lastLearningCycle = Date.now();
    
    console.log(`✅ Improvement cycle complete: ${improvements.length} improvements identified`);
    
    return improvements;
  }

  /**
   * Get knowledge insights
   */
  getInsights() {
    const totalPatterns = this.patterns.size;
    const highFailurePatterns = Array.from(this.patterns.entries())
      .filter(([_, pattern]) => pattern.failures / pattern.count > 0.4)
      .length;
    
    const topSuccesses = this.knowledgeGraph.successes
      .slice(-10)
      .map(s => s.summary);
    
    return {
      totalExperiences: this.stats.totalExperiences,
      patternsRecognized: this.stats.patternsRecognized,
      highFailurePatterns,
      improvementsPending: this.improvements.length,
      topSuccesses,
      lastLearningCycle: this.stats.lastLearningCycle
    };
  }

  /**
   * Query knowledge graph for similar situations
   */
  querySimilar(context) {
    const key = this.generatePatternKey({ context, type: 'query' });
    const matches = [];
    
    this.patterns.forEach((pattern, patternKey) => {
      if (patternKey.includes(context.taskType || '')) {
        matches.push({
          pattern: patternKey,
          successRate: 1 - (pattern.failures / pattern.count),
          avgMetrics: pattern.avgMetrics,
          count: pattern.count
        });
      }
    });
    
    return matches.sort((a, b) => b.count - a.count).slice(0, 5);
  }

  /**
   * Export learning data for persistence
   */
  exportLearningData() {
    return {
      patterns: Array.from(this.patterns.entries()),
      knowledgeGraph: this.knowledgeGraph,
      stats: this.stats,
      recentExperiences: this.experiences.slice(-50),
      exportedAt: Date.now()
    };
  }

  /**
   * Import learning data from persistence
   */
  importLearningData(data) {
    if (data.patterns) {
      this.patterns = new Map(data.patterns);
    }
    if (data.knowledgeGraph) {
      this.knowledgeGraph = { ...this.knowledgeGraph, ...data.knowledgeGraph };
    }
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }
    if (data.recentExperiences) {
      this.experiences = data.recentExperiences;
    }
    
    console.log('📥 Learning data imported successfully');
  }
}

export default LearningEngine;
