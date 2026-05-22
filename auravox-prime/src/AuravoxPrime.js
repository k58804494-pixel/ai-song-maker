/**
 * AURAVOX PRIME - Frontier-Class AI Operating System
 * 
 * Architecture designed to match/exceed Opus 4.7 / GPT-5.5 capabilities
 * 
 * Core Features:
 * - Multi-Brain Council System (Analyst, Creative, Critic, Strategy)
 * - Deep Reasoning with Step-by-Step Decomposition
 * - Self-Critique & Revision Loop
 * - Adaptive Memory with Forgetting/Updating Rules
 * - Tool Execution Layer
 * - Continuous Self-Improvement
 */

const { MultiBrainCouncil } = require('./core/MultiBrainCouncil');
const { AdaptiveMemory } = require('./memory/AdaptiveMemory');
const { SelfCritiqueEngine } = require('./core/SelfCritiqueEngine');
const { ToolExecutionLayer } = require('./core/ToolExecutionLayer');
const { SafetyGovernor } = require('./safety/SafetyGovernor');
const { ImprovementLoop } = require('./core/ImprovementLoop');

class AuravoxPrime {
    constructor(config = {}) {
        this.config = {
            enableSelfCritique: true,
            enableMultiBrain: true,
            enableMemory: true,
            enableTools: true,
            maxRevisionIterations: 3,
            ...config
        };

        // Initialize Core Systems
        this.memory = new AdaptiveMemory();
        this.safety = new SafetyGovernor();
        this.tools = new ToolExecutionLayer();
        
        // Multi-Brain Council
        this.council = new MultiBrainCouncil({
            memory: this.memory,
            tools: this.tools
        });

        // Self-Critique Engine
        this.critique = new SelfCritiqueEngine({
            maxIterations: this.config.maxRevisionIterations
        });

        // Continuous Improvement Loop
        this.improvement = new ImprovementLoop({
            memory: this.memory,
            council: this.council
        });

        this.sessionHistory = [];
        this.performanceMetrics = {
            totalQueries: 0,
            revisionsMade: 0,
            averageDepth: 0,
            toolCalls: 0
        };
    }

    /**
     * Primary Entry Point - Processes any user input with full cognitive stack
     */
    async process(input, options = {}) {
        const startTime = Date.now();
        this.performanceMetrics.totalQueries++;

        // Step 1: Safety Validation
        const safetyCheck = await this.safety.validate(input, options);
        if (!safetyCheck.approved) {
            return this._formatResponse(safetyCheck.response, { safetyBlocked: true });
        }

        // Step 2: Context Enrichment from Memory
        const enrichedContext = this.config.enableMemory 
            ? await this.memory.enrichContext(input, this.sessionHistory)
            : { context: '', relevantMemories: [] };

        // Step 3: Multi-Brain Council Deliberation
        let deliberation;
        if (this.config.enableMultiBrain) {
            deliberation = await this.council.deliberate(input, enrichedContext, options);
        } else {
            // Fallback to single reasoning engine
            deliberation = await this.council.analyst.reason(input, enrichedContext);
        }

        // Step 4: Self-Critique & Revision Loop
        let finalResponse = deliberation.consensus || deliberation.primary;
        let critiqueResult = null;
        
        if (this.config.enableSelfCritique) {
            critiqueResult = await this.critique.reviewAndRevise(
                input,
                finalResponse,
                deliberation.allPerspectives,
                enrichedContext
            );
            
            finalResponse = critiqueResult.revisedResponse;
            this.performanceMetrics.revisionsMade += critiqueResult.revisionsCount;
        }

        // Step 5: Tool Execution (if action required)
        if (finalResponse.requiresAction && this.config.enableTools) {
            const actionResult = await this.tools.execute(finalResponse.actionPlan);
            finalResponse.toolOutput = actionResult;
            this.performanceMetrics.toolCalls++;
        }

        // Step 6: Store Learning & Update Memory
        if (this.config.enableMemory) {
            await this.memory.store({
                input,
                output: finalResponse,
                deliberation,
                timestamp: Date.now(),
                quality: deliberation.confidenceScore
            });
        }

        // Step 7: Continuous Improvement Analysis
        await this.improvement.analyzeInteraction({
            input,
            output: finalResponse,
            deliberation,
            latency: Date.now() - startTime
        });

        // Update Session History
        this.sessionHistory.push({
            role: 'user',
            content: input,
            timestamp: Date.now()
        });
        this.sessionHistory.push({
            role: 'assistant',
            content: finalResponse,
            timestamp: Date.now()
        });

        // Maintain session history size
        if (this.sessionHistory.length > 50) {
            this.sessionHistory = this.sessionHistory.slice(-50);
        }

        // Update Metrics
        this.performanceMetrics.averageDepth = 
            (this.performanceMetrics.averageDepth * (this.performanceMetrics.totalQueries - 1) + 
             deliberation.reasoningDepth) / this.performanceMetrics.totalQueries;

        return this._formatResponse(finalResponse, {
            metadata: {
                latency: Date.now() - startTime,
                reasoningDepth: deliberation.reasoningDepth,
                confidenceScore: deliberation.confidenceScore,
                agentsInvolved: deliberation.agentsInvolved || [],
                revisionsMade: this.config.enableSelfCritique ? critiqueResult?.revisionsCount : 0
            }
        });
    }

    /**
     * Deep Reasoning Mode - Extended analysis for complex problems
     */
    async deepReason(input, options = {}) {
        return this.process(input, {
            ...options,
            mode: 'deep',
            maxRevisionIterations: 5,
            enableAllAgents: true
        });
    }

    /**
     * Fast Mode - Optimized for speed on simple queries
     */
    async fastRespond(input, options = {}) {
        return this.process(input, {
            ...options,
            mode: 'fast',
            enableSelfCritique: false,
            maxRevisionIterations: 1
        });
    }

    /**
     * Creative Mode - Enhanced creativity engine
     */
    async create(input, options = {}) {
        return this.process(input, {
            ...options,
            mode: 'creative',
            weightCreative: 0.7,
            weightAnalyst: 0.2,
            weightCritic: 0.1
        });
    }

    /**
     * Get System Status & Performance Metrics
     */
    getStatus() {
        return {
            status: 'operational',
            version: '1.0.0-prime',
            architecture: 'multi-brain-council',
            metrics: this.performanceMetrics,
            memorySize: this.memory.size(),
            sessionLength: this.sessionHistory.length,
            activeAgents: this.council.getActiveAgents(),
            safetyLevel: this.safety.currentLevel
        };
    }

    /**
     * Reset Session while preserving long-term memory
     */
    resetSession() {
        this.sessionHistory = [];
        return { status: 'session-reset', memoryPreserved: true };
    }

    /**
     * Export Learning Data
     */
    exportLearning() {
        return this.memory.export();
    }

    /**
     * Import Learning Data
     */
    importLearning(data) {
        return this.memory.import(data);
    }

    _formatResponse(response, options = {}) {
        const formatted = {
            content: response.content || response,
            structuredData: response.structuredData || null,
            actionPlan: response.actionPlan || null,
            sources: response.sources || [],
            confidence: response.confidenceScore || 0.85,
            metadata: options.metadata || {}
        };

        if (options.safetyBlocked) {
            formatted.safetyBlocked = true;
            formatted.reason = response.reason;
        }

        return formatted;
    }
}

module.exports = { AuravoxPrime };
