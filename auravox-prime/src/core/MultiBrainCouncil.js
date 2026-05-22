/**
 * Multi-Brain Council System
 * 
 * Four specialized AI agents that deliberate together:
 * - Analyst: Logic, reasoning, decomposition
 * - Creative: Ideas, innovation, novelty
 * - Critic: Error detection, quality assurance
 * - Strategy: Decision making, planning
 */

const { AnalystAgent } = require('../agents/AnalystAgent');
const { CreativeAgent } = require('../agents/CreativeAgent');
const { CriticAgent } = require('../agents/CriticAgent');
const { StrategyAgent } = require('../agents/StrategyAgent');

class MultiBrainCouncil {
    constructor({ memory, tools }) {
        this.agents = {
            analyst: new AnalystAgent(memory, tools),
            creative: new CreativeAgent(memory, tools),
            critic: new CriticAgent(memory, tools),
            strategy: new StrategyAgent(memory, tools)
        };
        
        this.deliberationHistory = [];
        this.consensusThreshold = 0.7;
    }

    /**
     * Main deliberation process - all agents contribute perspectives
     */
    async deliberate(input, context, options = {}) {
        const mode = options.mode || 'balanced';
        const weights = this._getWeights(mode, options);

        // Step 1: Gather all agent perspectives in parallel
        const perspectives = await Promise.all([
            this.agents.analyst.analyze(input, context),
            this.agents.creative.analyze(input, context),
            this.agents.critic.analyze(input, context),
            this.agents.strategy.analyze(input, context)
        ]);

        const [analystView, creativeView, criticView, strategyView] = perspectives;

        // Step 2: Agent debate round
        const debateResults = await this._runDebateRound({
            input,
            context,
            perspectives: {
                analyst: analystView,
                creative: creativeView,
                critic: criticView,
                strategy: strategyView
            },
            weights
        });

        // Step 3: Generate consensus
        const consensus = this._generateConsensus(debateResults, weights);

        // Step 4: Calculate confidence score
        const confidenceScore = this._calculateConfidence(debateResults, consensus);

        // Step 5: Determine reasoning depth
        const reasoningDepth = this._calculateReasoningDepth(perspectives);

        return {
            consensus,
            allPerspectives: perspectives,
            debateResults,
            confidenceScore,
            reasoningDepth,
            agentsInvolved: Object.keys(this.agents),
            mode
        };
    }

    /**
     * Get weights based on mode
     */
    _getWeights(mode, options) {
        const defaultWeights = {
            analyst: 0.3,
            creative: 0.2,
            critic: 0.25,
            strategy: 0.25
        };

        const modeWeights = {
            balanced: defaultWeights,
            deep: { analyst: 0.35, creative: 0.15, critic: 0.3, strategy: 0.2 },
            creative: { analyst: 0.2, creative: 0.4, critic: 0.15, strategy: 0.25 },
            analytical: { analyst: 0.4, creative: 0.1, critic: 0.3, strategy: 0.2 },
            strategic: { analyst: 0.25, creative: 0.15, critic: 0.2, strategy: 0.4 }
        };

        return {
            ...modeWeights[mode] || defaultWeights,
            ...(options.weights || {})
        };
    }

    /**
     * Run debate round between agents
     */
    async _runDebateRound({ input, context, perspectives, weights }) {
        const debateResults = {};

        for (const [agentName, agent] of Object.entries(this.agents)) {
            const otherPerspectives = Object.entries(perspectives)
                .filter(([name]) => name !== agentName)
                .map(([name, view]) => ({ agent: name, perspective: view }));

            debateResults[agentName] = await agent.debate({
                input,
                context,
                ownPerspective: perspectives[agentName],
                otherPerspectives,
                weight: weights[agentName]
            });
        }

        return debateResults;
    }

    /**
     * Generate consensus from debate results
     */
    _generateConsensus(debateResults, weights) {
        const proposals = Object.values(debateResults).map(r => r.proposal);
        
        // Find common ground
        const commonElements = this._findCommonElements(proposals);
        
        // Weight and merge proposals
        const weightedMerge = this._weightedMerge(debateResults, weights);
        
        // Strategy agent makes final decision on conflicts
        const finalDecision = this.agents.strategy.resolveConflicts(
            weightedMerge,
            debateResults.strategy.proposal
        );

        return {
            content: finalDecision.content,
            reasoning: finalDecision.reasoning,
            steps: finalDecision.steps || [],
            alternatives: finalDecision.alternatives || [],
            sources: this._mergeSources(debateResults)
        };
    }

    _findCommonElements(proposals) {
        if (proposals.length === 0) return [];
        const firstProposal = proposals[0];
        const common = [];
        const allPoints = proposals.flatMap(p => p.keyPoints || []);
        const pointCounts = {};
        
        allPoints.forEach(point => {
            pointCounts[point] = (pointCounts[point] || 0) + 1;
        });

        Object.entries(pointCounts).forEach(([point, count]) => {
            if (count >= Math.ceil(proposals.length / 2)) {
                common.push(point);
            }
        });

        return common;
    }

    _weightedMerge(debateResults, weights) {
        const merged = { content: '', reasoning: [], keyPoints: [], confidence: 0 };
        let totalWeight = 0;

        Object.entries(debateResults).forEach(([agentName, result]) => {
            const weight = weights[agentName];
            totalWeight += weight;

            if (result.proposal?.content) {
                merged.content += ` ${result.proposal.content}`;
            }

            if (Array.isArray(result.proposal?.reasoning)) {
                merged.reasoning.push(...result.proposal.reasoning.map(r => ({
                    text: r,
                    weight,
                    source: agentName
                })));
            } else if (result.proposal?.reasoning) {
                merged.reasoning.push({
                    text: result.proposal.reasoning,
                    weight,
                    source: agentName
                });
            }

            if (Array.isArray(result.proposal?.keyPoints)) {
                merged.keyPoints.push(...result.proposal.keyPoints.map(p => ({
                    text: p,
                    weight,
                    source: agentName
                })));
            } else if (result.proposal?.keyPoints) {
                merged.keyPoints.push({
                    text: result.proposal.keyPoints,
                    weight,
                    source: agentName
                });
            }
        });

        merged.confidence = totalWeight;
        return merged;
    }

    _mergeSources(debateResults) {
        const sources = new Set();
        Object.values(debateResults).forEach(result => {
            if (result.proposal?.sources) {
                result.proposal.sources.forEach(s => sources.add(s));
            }
        });
        return Array.from(sources);
    }

    _calculateConfidence(debateResults, consensus) {
        const proposals = Object.values(debateResults).map(r => r.proposal);
        
        if (proposals.length < 2) return 0.5;

        let agreementScore = 0;
        let comparisons = 0;

        for (let i = 0; i < proposals.length; i++) {
            for (let j = i + 1; j < proposals.length; j++) {
                const similarity = this._calculateSimilarity(proposals[i], proposals[j]);
                agreementScore += similarity;
                comparisons++;
            }
        }

        const baseConfidence = comparisons > 0 ? agreementScore / comparisons : 0.5;
        const criticApproval = debateResults.critic?.approvalScore || 0.5;
        
        return (baseConfidence + criticApproval) / 2;
    }

    _calculateSimilarity(p1, p2) {
        if (!p1 || !p2) return 0;

        const keywords1 = this._extractKeywords(p1.content || '');
        const keywords2 = this._extractKeywords(p2.content || '');

        const intersection = keywords1.filter(k => keywords2.includes(k));
        const union = new Set([...keywords1, ...keywords2]);

        return union.size > 0 ? intersection.length / union.size : 0;
    }

    _extractKeywords(text) {
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));
    }

    _calculateReasoningDepth(perspectives) {
        const depths = perspectives.map(p => {
            let depth = 1;
            if (p.reasoning?.length) depth += p.reasoning.length * 0.5;
            if (p.subProblems?.length) depth += p.subProblems.length * 0.3;
            if (p.dependencies?.length) depth += p.dependencies.length * 0.2;
            return depth;
        });

        return depths.reduce((a, b) => a + b, 0) / depths.length;
    }

    getActiveAgents() {
        return Object.keys(this.agents);
    }
}

module.exports = { MultiBrainCouncil };
