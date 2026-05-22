/**
 * Creative Agent - Ideas, innovation, and novelty generation
 */
class CreativeAgent {
    constructor(memory, tools) {
        this.memory = memory;
        this.tools = tools;
        this.specialty = 'creative-innovation';
        this.noveltyThreshold = 0.6;
    }

    async analyze(input, context) {
        // Generate novel ideas and approaches
        const ideas = await this._generateIdeas(input, context);
        
        // Explore unconventional connections
        const connections = await this._findUnconventionalConnections(input);
        
        // Create innovative solutions
        const solutions = await this._createSolutions(ideas, connections);

        return {
            agent: 'creative',
            specialty: this.specialty,
            ideas,
            connections,
            solutions,
            noveltyScore: this._calculateNovelty(solutions),
            keyPoints: this._extractKeyInsights(solutions),
            confidence: this._calculateConfidence(solutions)
        };
    }

    async debate({ input, context, ownPerspective, otherPerspectives, weight }) {
        // Find creative improvements to other perspectives
        const enhancements = otherPerspectives.map(op => ({
            agent: op.agent,
            creativeEnhancements: this._enhanceCreatively(op.perspective),
            alternativeApproaches: this._suggestAlternatives(op.perspective),
            novelAngles: this._findNovelAngles(op.perspective)
        }));

        // Refine own proposal with creative insights
        const refinedProposal = this._refineWithCreativity(ownPerspective, enhancements);

        return {
            proposal: refinedProposal,
            enhancements,
            approvalScore: this._calculateApproval(refinedProposal)
        };
    }

    async _generateIdeas(input, context) {
        const ideaCategories = [
            'conventional',
            'unconventional', 
            'metaphorical',
            'cross-domain',
            'futuristic'
        ];

        const ideas = [];
        
        for (const category of ideaCategories) {
            const categoryIdeas = await this._generateCategoryIdeas(input, category);
            ideas.push(...categoryIdeas);
        }

        return ideas;
    }

    async _generateCategoryIdeas(input, category) {
        const baseIdeas = [
            {
                type: category,
                concept: `Exploring ${category} approach to the problem`,
                potential: 0.7,
                feasibility: category === 'conventional' ? 0.9 : 0.5
            }
        ];

        // Add variation based on category
        if (category === 'cross-domain') {
            baseIdeas.push({
                type: category,
                concept: 'Applying principles from unrelated fields',
                potential: 0.8,
                feasibility: 0.6
            });
        }

        if (category === 'metaphorical') {
            baseIdeas.push({
                type: category,
                concept: 'Using analogies to reframe the problem',
                potential: 0.75,
                feasibility: 0.7
            });
        }

        return baseIdeas;
    }

    async _findUnconventionalConnections(input) {
        const connections = [];
        
        // Find patterns that aren't immediately obvious
        const keywords = this._extractKeywords(input);
        
        // Cross-reference with stored knowledge patterns
        const patterns = await this._retrieveCreativePatterns(keywords);
        
        patterns.forEach(pattern => {
            connections.push({
                source: pattern.source,
                target: input.substring(0, 30) + '...',
                connectionType: pattern.type,
                strength: pattern.strength
            });
        });

        return connections;
    }

    async _retrieveCreativePatterns(keywords) {
        // Simulated pattern retrieval from memory/knowledge
        const patterns = [
            { source: 'design-thinking', type: 'iterative-refinement', strength: 0.8 },
            { source: 'systems-theory', type: 'holistic-view', strength: 0.75 },
            { source: 'biomimicry', type: 'nature-inspired', strength: 0.7 }
        ];

        return patterns.filter(p => 
            keywords.some(k => k.length > 4) // Simple filter
        );
    }

    async _createSolutions(ideas, connections) {
        const solutions = [];

        // Combine ideas in novel ways
        for (let i = 0; i < Math.min(ideas.length, 3); i++) {
            for (let j = i + 1; j < Math.min(ideas.length, 4); j++) {
                solutions.push({
                    id: solutions.length + 1,
                    concept: `${ideas[i].concept} + ${ideas[j].concept}`,
                    novelty: this._calculateCombinationNovelty(ideas[i], ideas[j]),
                    feasibility: (ideas[i].feasibility + ideas[j].feasibility) / 2,
                    connections: connections.slice(0, 2)
                });
            }
        }

        return solutions;
    }

    _calculateCombinationNovelty(idea1, idea2) {
        const typeDifference = idea1.type !== idea2.type ? 0.3 : 0;
        const avgPotential = (idea1.potential + idea2.potential) / 2;
        return Math.min(1.0, typeDifference + avgPotential);
    }

    _calculateNovelty(solutions) {
        if (solutions.length === 0) return 0;
        
        const avgNovelty = solutions.reduce((sum, s) => sum + s.novelty, 0) / solutions.length;
        return Math.min(1.0, avgNovelty + 0.1); // Bonus for having multiple solutions
    }

    _extractKeyInsights(solutions) {
        return solutions.slice(0, 3).map(s => s.concept);
    }

    _calculateConfidence(solutions) {
        const baseConfidence = 0.65;
        const noveltyBonus = solutions.length > 0 ? 0.1 : 0;
        const diversityBonus = new Set(solutions.map(s => s.concept)).size > 2 ? 0.1 : 0;
        return Math.min(0.95, baseConfidence + noveltyBonus + diversityBonus);
    }

    _enhanceCreatively(perspective) {
        return [
            'Add visual/metaphorical representation',
            'Consider reverse engineering approach',
            'Explore edge cases as opportunities'
        ];
    }

    _suggestAlternatives(perspective) {
        return [
            'What if constraints were removed?',
            'How would a different industry solve this?',
            'What\'s the simplest possible version?'
        ];
    }

    _findNovelAngles(perspective) {
        return [
            'Time-reversed perspective',
            'Scale-shifted view (micro/macro)',
            'Stakeholder role reversal'
        ];
    }

    _refineWithCreativity(ownPerspective, enhancements) {
        return {
            ...ownPerspective,
            creativelyEnhanced: true,
            enhancementsIncorporated: enhancements.length * 2,
            noveltyBoost: 0.15
        };
    }

    _calculateApproval(proposal) {
        return proposal.creativelyEnhanced ? 0.85 : 0.65;
    }

    _extractKeywords(text) {
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were']);
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));
    }
}

module.exports = { CreativeAgent };
