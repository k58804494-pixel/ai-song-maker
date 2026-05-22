/**
 * Analyst Agent - Logic, reasoning, and problem decomposition
 */
class AnalystAgent {
    constructor(memory, tools) {
        this.memory = memory;
        this.tools = tools;
        this.specialty = 'logical-analysis';
    }

    async analyze(input, context) {
        // Break down the problem into logical components
        const decomposition = await this._decomposeProblem(input);
        
        // Identify dependencies and constraints
        const dependencies = await this._identifyDependencies(decomposition);
        
        // Apply logical reasoning to each component
        const reasoning = await this._applyLogic(decomposition, context);

        return {
            agent: 'analyst',
            specialty: this.specialty,
            decomposition,
            dependencies,
            reasoning,
            subProblems: decomposition.subProblems || [],
            keyPoints: this._extractKeyPoints(reasoning),
            confidence: this._calculateConfidence(reasoning)
        };
    }

    async debate({ input, context, ownPerspective, otherPerspectives, weight }) {
        // Review other perspectives logically
        const critiques = otherPerspectives.map(op => ({
            agent: op.agent,
            logicalConsistency: this._checkLogicalConsistency(op.perspective),
            gapsIdentified: this._identifyGaps(op.perspective),
            suggestions: this._generateSuggestions(op.perspective)
        }));

        // Refine own proposal based on feedback
        const refinedProposal = this._refineProposal(ownPerspective, critiques);

        return {
            proposal: refinedProposal,
            critiques,
            approvalScore: this._calculateApproval(refinedProposal)
        };
    }

    async _decomposeProblem(input) {
        // Split input into core question and sub-questions
        const lines = input.split('\n').filter(l => l.trim());
        
        return {
            mainQuestion: lines[0] || input,
            subProblems: lines.slice(1).map((line, i) => ({
                id: i + 1,
                question: line,
                type: this._classifyProblemType(line)
            })),
            complexity: this._assessComplexity(input)
        };
    }

    _classifyProblemType(question) {
        const q = question.toLowerCase();
        if (q.includes('how') && q.includes('code')) return 'implementation';
        if (q.includes('why')) return 'causal';
        if (q.includes('what')) return 'definitional';
        if (q.includes('compare') || q.includes('vs')) return 'comparative';
        if (q.includes('design') || q.includes('architect')) return 'architectural';
        if (q.includes('calculate') || q.includes('math')) return 'computational';
        return 'general';
    }

    _assessComplexity(input) {
        const wordCount = input.split(/\s+/).length;
        const technicalTerms = (input.match(/\b(function|class|interface|algorithm|system|architecture|database|API)\b/gi) || []).length;
        
        if (wordCount > 100 || technicalTerms > 5) return 'high';
        if (wordCount > 50 || technicalTerms > 2) return 'medium';
        return 'low';
    }

    async _identifyDependencies(decomposition) {
        const deps = [];
        
        for (const problem of decomposition.subProblems || []) {
            const problemDeps = await this._findDependenciesForProblem(problem);
            deps.push({
                problemId: problem.id,
                dependencies: problemDeps
            });
        }

        return deps;
    }

    async _findDependenciesForProblem(problem) {
        // Simulated dependency analysis
        const commonDeps = {
            implementation: ['requirements', 'constraints', 'resources'],
            causal: ['prior_events', 'conditions', 'context'],
            architectural: ['components', 'interfaces', 'data_flow']
        };

        return commonDeps[problem.type] || ['information', 'context'];
    }

    async _applyLogic(decomposition, context) {
        const reasoningSteps = [];
        
        // Step 1: Define premises
        reasoningSteps.push({
            step: 1,
            type: 'premise',
            content: 'Defining known information and constraints'
        });

        // Step 2: Logical deduction
        reasoningSteps.push({
            step: 2,
            type: 'deduction',
            content: 'Applying logical rules to derive conclusions'
        });

        // Step 3: Validation
        reasoningSteps.push({
            step: 3,
            type: 'validation',
            content: 'Checking consistency and completeness'
        });

        return {
            steps: reasoningSteps,
            conclusion: this._deriveConclusion(decomposition, context),
            assumptions: this._identifyAssumptions(decomposition)
        };
    }

    _deriveConclusion(decomposition, context) {
        return `Based on logical analysis of ${decomposition.subProblems?.length || 0} sub-problems, 
        the solution requires systematic evaluation of all identified dependencies and constraints.`;
    }

    _identifyAssumptions(decomposition) {
        return ['All provided information is accurate', 'No hidden constraints exist', 'Standard conditions apply'];
    }

    _extractKeyPoints(reasoning) {
        return reasoning.steps?.map(s => s.content) || [];
    }

    _calculateConfidence(reasoning) {
        const baseConfidence = 0.7;
        const stepBonus = Math.min(0.2, (reasoning.steps?.length || 0) * 0.05);
        return baseConfidence + stepBonus;
    }

    _checkLogicalConsistency(perspective) {
        // Check for contradictions in reasoning
        return 0.85; // Simulated score
    }

    _identifyGaps(perspective) {
        return ['Missing edge case analysis', 'Could benefit from more examples'];
    }

    _generateSuggestions(perspective) {
        return ['Consider alternative approaches', 'Validate with additional test cases'];
    }

    _refineProposal(ownPerspective, critiques) {
        // Incorporate valid critiques
        return {
            ...ownPerspective,
            refined: true,
            improvementsApplied: critiques.length
        };
    }

    _calculateApproval(proposal) {
        return proposal.refined ? 0.9 : 0.7;
    }
}

module.exports = { AnalystAgent };
