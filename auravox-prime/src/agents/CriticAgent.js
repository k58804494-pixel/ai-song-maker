/**
 * Critic Agent - Error detection, quality assurance, and flaw identification
 */
class CriticAgent {
    constructor(memory, tools) {
        this.memory = memory;
        this.tools = tools;
        this.specialty = 'critical-evaluation';
        this.critiqueDepth = 'deep';
    }

    async analyze(input, context) {
        // Identify potential errors and weaknesses
        const errors = await this._identifyErrors(input);
        
        // Find logical fallacies and gaps
        const fallacies = await this._findFallacies(input);
        
        // Assess quality and completeness
        const qualityAssessment = await this._assessQuality(input, context);

        return {
            agent: 'critic',
            specialty: this.specialty,
            errors,
            fallacies,
            qualityAssessment,
            riskLevel: this._calculateRisk(errors, fallacies),
            keyPoints: this._extractCriticalPoints(errors, qualityAssessment),
            confidence: this._calculateConfidence(qualityAssessment)
        };
    }

    async debate({ input, context, ownPerspective, otherPerspectives, weight }) {
        // Critically evaluate other perspectives
        const evaluations = otherPerspectives.map(op => ({
            agent: op.agent,
            strengthsIdentified: this._identifyStrengths(op.perspective),
            weaknessesFound: this._findWeaknesses(op.perspective),
            potentialFailures: this._predictFailures(op.perspective),
            improvementSuggestions: this._suggestImprovements(op.perspective)
        }));

        // Apply self-critique to own proposal
        const selfCritique = this._selfCritique(ownPerspective);
        const refinedProposal = this._refineBasedOnCritique(ownPerspective, selfCritique, evaluations);

        return {
            proposal: refinedProposal,
            evaluations,
            selfCritique,
            approvalScore: this._calculateApproval(refinedProposal)
        };
    }

    async _identifyErrors(input) {
        const errors = [];

        // Check for factual inconsistencies
        const factualErrors = await this._checkFactualConsistency(input);
        errors.push(...factualErrors);

        // Check for logical contradictions
        const logicalErrors = this._checkLogicalContradictions(input);
        errors.push(...logicalErrors);

        // Check for missing information
        const missingInfo = this._identifyMissingInformation(input);
        if (missingInfo.length > 0) {
            errors.push({
                type: 'incomplete',
                severity: 'medium',
                description: 'Missing critical information',
                details: missingInfo
            });
        }

        return errors;
    }

    async _checkFactualConsistency(input) {
        // Simulated factual consistency check
        const errors = [];
        
        // Look for contradictory statements
        const statements = input.split(/[.!?]/).filter(s => s.trim().length > 10);
        
        for (let i = 0; i < statements.length; i++) {
            for (let j = i + 1; j < statements.length; j++) {
                if (this._areContradictory(statements[i], statements[j])) {
                    errors.push({
                        type: 'contradiction',
                        severity: 'high',
                        description: 'Potentially contradictory statements detected',
                        statements: [statements[i].trim(), statements[j].trim()]
                    });
                }
            }
        }

        return errors;
    }

    _areContradictory(stmt1, stmt2) {
        // Simple contradiction detection (negation patterns)
        const negationPatterns = ['not ', 'never ', 'cannot ', 'impossible ', 'no '];
        const lower1 = stmt1.toLowerCase();
        const lower2 = stmt2.toLowerCase();

        // Check if one contains negation while discussing similar topic
        const hasNegation1 = negationPatterns.some(p => lower1.includes(p));
        const hasNegation2 = negationPatterns.some(p => lower2.includes(p));

        if (hasNegation1 !== hasNegation2) {
            // Check for keyword overlap
            const words1 = new Set(lower1.replace(/[^\w\s]/g, '').split(/\s+/));
            const words2 = new Set(lower2.replace(/[^\w\s]/g, '').split(/\s+/));
            const overlap = [...words1].filter(w => words2.has(w) && w.length > 4);
            
            if (overlap.length >= 3) {
                return true;
            }
        }

        return false;
    }

    _checkLogicalContradictions(input) {
        const errors = [];
        
        // Check for circular reasoning patterns
        if (/\b(therefore|thus|hence)\b.*\bbecause\b/i.test(input)) {
            errors.push({
                type: 'circular_reasoning',
                severity: 'medium',
                description: 'Potential circular reasoning detected'
            });
        }

        // Check for false dichotomy
        if (/\b(either|only two options)\b/i.test(input) && !/\b(multiple|several|many)\b/i.test(input)) {
            errors.push({
                type: 'false_dichotomy',
                severity: 'low',
                description: 'Possible false dichotomy - consider more options'
            });
        }

        return errors;
    }

    _identifyMissingInformation(input) {
        const missing = [];
        
        // Check for undefined terms
        if (!/\b(define|meaning|refers to)\b/i.test(input) && /\b(new concept|novel approach)\b/i.test(input)) {
            missing.push('Definition of new concepts');
        }

        // Check for missing examples
        if (input.length > 200 && !/\b(for example|such as|e\.g\.|like)\b/i.test(input)) {
            missing.push('Concrete examples would strengthen the argument');
        }

        // Check for missing evidence
        if (/\b(should|must|always|never)\b/i.test(input) && !/\b(because|since|evidence|data|study)\b/i.test(input)) {
            missing.push('Supporting evidence for strong claims');
        }

        return missing;
    }

    async _findFallacies(input) {
        const fallacies = [];

        // Ad hominem check
        if (/\b(you|your|they|their)\b.*\b(wrong|foolish|stupid|ignorant)\b/i.test(input)) {
            fallacies.push({
                type: 'ad_hominem',
                severity: 'high',
                description: 'Attack on person rather than argument'
            });
        }

        // Straw man check
        if (/\b(some people|critics|opponents)\b.*\b(believe|think|say)\b/i.test(input)) {
            fallacies.push({
                type: 'straw_man',
                severity: 'medium',
                description: 'Potential misrepresentation of opposing views'
            });
        }

        // Appeal to authority check
        if (/\b(experts|scientists|studies show|research proves)\b/i.test(input) && !/\b(specific|name|citation)\b/i.test(input)) {
            fallacies.push({
                type: 'appeal_to_authority',
                severity: 'low',
                description: 'Vague appeal to authority without specifics'
            });
        }

        return fallacies;
    }

    async _assessQuality(input, context) {
        const scores = {
            clarity: this._assessClarity(input),
            completeness: this._assessCompleteness(input),
            coherence: this._assessCoherence(input),
            relevance: this._assessRelevance(input, context),
            depth: this._assessDepth(input)
        };

        const overall = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

        return {
            scores,
            overall,
            strengths: this._identifyStrengthsFromScores(scores),
            areasForImprovement: this._identifyWeaknessesFromScores(scores)
        };
    }

    _assessClarity(input) {
        const avgWordLength = input.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / input.split(/\s+/).length;
        const sentenceCount = input.split(/[.!?]/).filter(s => s.trim()).length;
        
        // Penalize very long words and very long sentences
        let score = 0.8;
        if (avgWordLength > 8) score -= 0.1;
        if (input.length / sentenceCount > 50) score -= 0.1;
        
        return Math.max(0.3, Math.min(1.0, score));
    }

    _assessCompleteness(input) {
        const hasIntroduction = /\b(introduction|overview|purpose|goal)\b/i.test(input);
        const hasConclusion = /\b(conclusion|summary|therefore|in conclusion)\b/i.test(input);
        const hasSupportingPoints = (input.match(/\b(first|second|third|finally|additionally|moreover)\b/gi) || []).length;

        let score = 0.5;
        if (hasIntroduction) score += 0.15;
        if (hasConclusion) score += 0.15;
        score += Math.min(0.2, hasSupportingPoints * 0.05);

        return Math.min(1.0, score);
    }

    _assessCoherence(input) {
        // Check for transition words and logical flow
        const transitions = ['however', 'therefore', 'moreover', 'furthermore', 'consequently', 'thus', 'hence', 'accordingly'];
        const transitionCount = transitions.filter(t => input.toLowerCase().includes(t)).length;

        return Math.min(1.0, 0.6 + (transitionCount * 0.05));
    }

    _assessRelevance(input, context) {
        // Simple relevance check based on keyword overlap with context
        if (!context || !context.context) return 0.7; // Default if no context

        const inputWords = new Set(input.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
        const contextWords = new Set(context.context.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
        
        const overlap = [...inputWords].filter(w => contextWords.has(w) && w.length > 4);
        const relevance = overlap.length / Math.max(inputWords.size, 1);

        return Math.min(1.0, 0.5 + relevance);
    }

    _assessDepth(input) {
        const depthIndicators = [
            'because', 'therefore', 'causes', 'effects', 'implications',
            'underlying', 'fundamental', 'root cause', 'mechanism'
        ];
        
        const depthCount = depthIndicators.filter(d => input.toLowerCase().includes(d)).length;
        return Math.min(1.0, 0.5 + (depthCount * 0.08));
    }

    _identifyStrengthsFromScores(scores) {
        return Object.entries(scores)
            .filter(([_, score]) => score >= 0.75)
            .map(([aspect, score]) => `Strong ${aspect} (${(score * 100).toFixed(0)}%)`);
    }

    _identifyWeaknessesFromScores(scores) {
        return Object.entries(scores)
            .filter(([_, score]) => score < 0.6)
            .map(([aspect, score]) => `Improve ${aspect} (${(score * 100).toFixed(0)}%)`);
    }

    _calculateRisk(errors, fallacies) {
        const errorWeight = errors.reduce((sum, e) => {
            const weights = { high: 0.3, medium: 0.15, low: 0.05 };
            return sum + (weights[e.severity] || 0.1);
        }, 0);

        const fallacyWeight = fallacies.reduce((sum, f) => {
            const weights = { high: 0.25, medium: 0.12, low: 0.04 };
            return sum + (weights[f.severity] || 0.08);
        }, 0);

        return Math.min(1.0, errorWeight + fallacyWeight);
    }

    _extractCriticalPoints(errors, qualityAssessment) {
        const points = [];
        
        errors.slice(0, 3).forEach(e => {
            points.push(`⚠️ ${e.type}: ${e.description}`);
        });

        if (qualityAssessment.areasForImprovement?.length > 0) {
            points.push(...qualityAssessment.areasForImprovement.slice(0, 2));
        }

        return points;
    }

    _calculateConfidence(qualityAssessment) {
        // Higher confidence when quality assessment is thorough
        const baseConfidence = 0.75;
        const qualityBonus = qualityAssessment.overall * 0.15;
        return Math.min(0.95, baseConfidence + qualityBonus);
    }

    _identifyStrengths(perspective) {
        return ['Clear structure', 'Logical flow', 'Good use of evidence'].slice(
            0, Math.floor(Math.random() * 2) + 1
        );
    }

    _findWeaknesses(perspective) {
        return ['Could use more examples', 'Some assumptions unstated', 'Edge cases not considered'].slice(
            0, Math.floor(Math.random() * 2) + 1
        );
    }

    _predictFailures(perspective) {
        return ['May fail with unexpected inputs', 'Scalability concerns', 'Maintenance complexity'];
    }

    _suggestImprovements(perspective) {
        return [
            'Add error handling for edge cases',
            'Provide concrete examples',
            'Clarify underlying assumptions'
        ];
    }

    _selfCritique(ownPerspective) {
        return {
            identifiedIssues: this._findWeaknesses(ownPerspective),
            confidenceAdjustment: -0.05,
            recommendedChanges: this._suggestImprovements(ownPerspective)
        };
    }

    _refineBasedOnCritique(ownPerspective, selfCritique, evaluations) {
        return {
            ...ownPerspective,
            critiqued: true,
            issuesAddressed: selfCritique.identifiedIssues.length,
            improvementsIncorporated: evaluations.length,
            revisedConfidence: Math.max(0.5, (ownPerspective.confidence || 0.7) + selfCritique.confidenceAdjustment)
        };
    }

    _calculateApproval(proposal) {
        return proposal.critiqued ? 0.8 : 0.6;
    }
}

module.exports = { CriticAgent };
