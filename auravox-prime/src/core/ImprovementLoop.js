/**
 * Continuous Improvement Loop - Learns from interactions and improves
 */
class ImprovementLoop {
    constructor({ memory, council }) {
        this.memory = memory;
        this.council = council;
        this.improvementHistory = [];
        this.patterns = new Map();
        this.metrics = {
            totalInteractions: 0,
            improvementsSuggested: 0,
            patternsIdentified: 0
        };
    }

    async analyzeInteraction(interaction) {
        this.metrics.totalInteractions++;

        // Analyze quality and performance
        const analysis = await this._analyzeQuality(interaction);

        // Identify improvement opportunities
        const improvements = await this._identifyImprovements(analysis, interaction);

        // Extract learnable patterns
        await this._extractPatterns(interaction, analysis);

        // Store improvement record
        if (improvements.length > 0) {
            this.improvementHistory.push({
                timestamp: Date.now(),
                analysis,
                improvements,
                interactionId: this._generateId()
            });
            this.metrics.improvementsSuggested += improvements.length;
        }

        return {
            analysis,
            improvements,
            metrics: this.metrics
        };
    }

    async _analyzeQuality(interaction) {
        const { input, output, deliberation, latency } = interaction;

        // Quality dimensions
        const scores = {
            responsiveness: this._scoreResponsiveness(latency),
            coherence: this._scoreCoherence(output),
            completeness: this._scoreCompleteness(input, output),
            accuracy: this._scoreAccuracy(deliberation),
            userSatisfaction: this._estimateSatisfaction(output, deliberation)
        };

        const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

        return {
            scores,
            overallScore,
            latency,
            strengths: this._identifyStrengths(scores),
            weaknesses: this._identifyWeaknesses(scores)
        };
    }

    _scoreResponsiveness(latency) {
        // Score based on response time
        if (latency < 500) return 1.0;
        if (latency < 1000) return 0.9;
        if (latency < 2000) return 0.7;
        if (latency < 5000) return 0.5;
        return 0.3;
    }

    _scoreCoherence(output) {
        const content = output.content || '';
        
        // Check for logical flow indicators
        const flowWords = ['therefore', 'however', 'moreover', 'consequently', 'thus', 'first', 'second', 'finally'];
        const flowCount = flowWords.filter(w => content.toLowerCase().includes(w)).length;
        
        // Check structure
        const hasStructure = /\n\n/.test(content) && content.split(/\n\n+/).length > 1;
        
        return Math.min(1.0, 0.6 + (flowCount * 0.05) + (hasStructure ? 0.1 : 0));
    }

    _scoreCompleteness(input, output) {
        const inputQuestions = (input.match(/\?/g) || []).length;
        const outputSections = (output.content || '').split(/\n\n+/).filter(s => s.trim()).length;
        
        // Ideally one section per question
        const ratio = outputSections / Math.max(inputQuestions, 1);
        
        return Math.min(1.0, ratio * 0.8);
    }

    _scoreAccuracy(deliberation) {
        // Based on confidence score from deliberation
        return deliberation?.confidenceScore || 0.7;
    }

    _estimateSatisfaction(output, deliberation) {
        let score = 0.7;

        // Boost for high confidence
        if (deliberation?.confidenceScore > 0.85) score += 0.1;

        // Boost for multiple agents involved (thorough analysis)
        if ((deliberation?.agentsInvolved?.length || 0) >= 3) score += 0.1;

        // Boost for revisions made (self-improvement)
        if (output.revisionApplied) score += 0.05;

        return Math.min(1.0, score);
    }

    _identifyStrengths(scores) {
        return Object.entries(scores)
            .filter(([_, score]) => score >= 0.8)
            .map(([dimension, score]) => ({ dimension, score }));
    }

    _identifyWeaknesses(scores) {
        return Object.entries(scores)
            .filter(([_, score]) => score < 0.6)
            .map(([dimension, score]) => ({ dimension, score, needsImprovement: true }));
    }

    async _identifyImprovements(analysis, interaction) {
        const improvements = [];

        // Suggest improvements for weak areas
        for (const weakness of analysis.weaknesses) {
            improvements.push({
                area: weakness.dimension,
                currentScore: weakness.score,
                suggestion: this._getImprovementSuggestion(weakness.dimension),
                priority: weakness.score < 0.4 ? 'high' : 'medium'
            });
        }

        // Pattern-based improvements
        const patternImprovements = await this._getPatternBasedImprovements(interaction);
        improvements.push(...patternImprovements);

        return improvements;
    }

    _getImprovementSuggestion(dimension) {
        const suggestions = {
            responsiveness: 'Optimize processing pipeline or enable caching',
            coherence: 'Improve transition planning between reasoning steps',
            completeness: 'Ensure all aspects of the query are addressed',
            accuracy: 'Increase cross-verification between agents',
            userSatisfaction: 'Enhance output formatting and clarity'
        };
        return suggestions[dimension] || 'Review and optimize this aspect';
    }

    async _getPatternBasedImprovements(interaction) {
        const improvements = [];
        const inputLower = (interaction.input || '').toLowerCase();

        // Check for recurring patterns
        if (inputLower.includes('code') || inputLower.includes('function')) {
            const codePattern = this.patterns.get('code_queries');
            if (codePattern && codePattern.avgScore < 0.75) {
                improvements.push({
                    area: 'code_handling',
                    suggestion: 'Consider adding more code examples and edge cases',
                    priority: 'medium',
                    basedOn: `${codePattern.count} similar queries`
                });
            }
        }

        return improvements;
    }

    async _extractPatterns(interaction, analysis) {
        const inputLower = (interaction.input || '').toLowerCase();

        // Categorize interaction
        let category = 'general';
        if (inputLower.includes('code') || inputLower.includes('function')) category = 'code_queries';
        else if (inputLower.includes('design') || inputLower.includes('architect')) category = 'design_queries';
        else if (inputLower.includes('explain') || inputLower.includes('what')) category = 'explanation_queries';
        else if (inputLower.includes('compare') || inputLower.includes('vs')) category = 'comparison_queries';

        // Update pattern statistics
        const existing = this.patterns.get(category);
        if (existing) {
            existing.count++;
            existing.avgScore = (existing.avgScore * (existing.count - 1) + analysis.overallScore) / existing.count;
            existing.lastSeen = Date.now();
        } else {
            this.patterns.set(category, {
                count: 1,
                avgScore: analysis.overallScore,
                createdAt: Date.now(),
                lastSeen: Date.now()
            });
            this.metrics.patternsIdentified++;
        }
    }

    _generateId() {
        return `imp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    getImprovementHistory(limit = 10) {
        return this.improvementHistory.slice(-limit);
    }

    getPatterns() {
        return Array.from(this.patterns.entries()).map(([name, data]) => ({
            name,
            ...data
        }));
    }

    getMetrics() {
        return { ...this.metrics };
    }

    generateReport() {
        const patterns = this.getPatterns();
        const weakPatterns = patterns.filter(p => p.avgScore < 0.7);

        return {
            summary: {
                totalInteractions: this.metrics.totalInteractions,
                improvementsSuggested: this.metrics.improvementsSuggested,
                patternsIdentified: this.metrics.patternsIdentified
            },
            areasNeedingAttention: weakPatterns.map(p => ({
                pattern: p.name,
                avgScore: p.avgScore.toFixed(3),
                occurrences: p.count
            })),
            topPatterns: patterns
                .sort((a, b) => b.avgScore - a.avgScore)
                .slice(0, 5)
                .map(p => ({
                    pattern: p.name,
                    avgScore: p.avgScore.toFixed(3),
                    occurrences: p.count
                }))
        };
    }
}

module.exports = { ImprovementLoop };
