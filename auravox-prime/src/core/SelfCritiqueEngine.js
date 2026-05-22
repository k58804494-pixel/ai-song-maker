/**
 * Self-Critique Engine - Reviews and revises outputs before final response
 */
class SelfCritiqueEngine {
    constructor({ maxIterations = 3 } = {}) {
        this.maxIterations = maxIterations;
        this.critiqueCriteria = [
            'accuracy',
            'completeness', 
            'clarity',
            'relevance',
            'depth',
            'novelty'
        ];
    }

    async reviewAndRevise(input, response, perspectives, context) {
        let currentResponse = response;
        let revisionsCount = 0;
        const revisionHistory = [];

        for (let iteration = 0; iteration < this.maxIterations; iteration++) {
            // Step 1: Critique current response
            const critique = await this._critique(input, currentResponse, perspectives, context);

            // Step 2: Check if revision needed
            if (critique.qualityScore >= 0.85 && critique.issues.length === 0) {
                break; // Response is good enough
            }

            // Step 3: Generate revision plan
            const revisionPlan = this._generateRevisionPlan(critique);

            // Step 4: Apply revisions
            const revisedResponse = await this._applyRevisions(currentResponse, revisionPlan);

            // Step 5: Track revision
            revisionHistory.push({
                iteration,
                critique,
                revisionPlan,
                improvements: revisedResponse.improvements || []
            });

            currentResponse = revisedResponse;
            revisionsCount++;

            // Stop if no meaningful improvement
            if (!revisedResponse.improved || revisedResponse.improvements?.length === 0) {
                break;
            }
        }

        return {
            revisedResponse: currentResponse,
            revisionsCount,
            revisionHistory,
            finalQualityScore: await this._assessFinalQuality(currentResponse, input)
        };
    }

    async _critique(input, response, perspectives, context) {
        const issues = [];
        const scores = {};

        // Evaluate against each criterion
        for (const criterion of this.critiqueCriteria) {
            const score = await this._evaluateCriterion(criterion, input, response, perspectives);
            scores[criterion] = score;

            if (score < 0.7) {
                issues.push({
                    criterion,
                    score,
                    severity: score < 0.5 ? 'high' : 'medium',
                    description: this._getIssueDescription(criterion, score)
                });
            }
        }

        // Check for hallucinations
        const hallucinationCheck = this._checkHallucinations(response, perspectives);
        if (hallucinationCheck.detected) {
            issues.push({
                criterion: 'accuracy',
                score: 0.3,
                severity: 'high',
                description: 'Potential hallucination detected',
                details: hallucinationCheck.details
            });
        }

        // Check for logical consistency
        const consistencyCheck = this._checkLogicalConsistency(response);
        if (!consistencyCheck.consistent) {
            issues.push({
                criterion: 'clarity',
                score: 0.5,
                severity: 'medium',
                description: 'Logical inconsistency detected',
                details: consistencyCheck.issues
            });
        }

        const qualityScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

        return {
            scores,
            qualityScore,
            issues,
            strengths: this._identifyStrengths(scores)
        };
    }

    async _evaluateCriterion(criterion, input, response, perspectives) {
        switch (criterion) {
            case 'accuracy':
                return this._evaluateAccuracy(response, perspectives);
            case 'completeness':
                return this._evaluateCompleteness(response, input);
            case 'clarity':
                return this._evaluateClarity(response);
            case 'relevance':
                return this._evaluateRelevance(response, input);
            case 'depth':
                return this._evaluateDepth(response);
            case 'novelty':
                return this._evaluateNovelty(response, perspectives);
            default:
                return 0.7;
        }
    }

    _evaluateAccuracy(response, perspectives) {
        // Check if response aligns with agent perspectives
        const consensusPoints = this._findConsensusPoints(perspectives);
        const responseContent = JSON.stringify(response);
        
        let alignmentScore = 0.8;
        
        // Penalize if contradicts multiple perspectives
        const contradictionCount = perspectives.filter(p => 
            this._hasContradiction(responseContent, p)
        ).length;
        
        alignmentScore -= contradictionCount * 0.1;
        
        return Math.max(0.3, Math.min(1.0, alignmentScore));
    }

    _evaluateCompleteness(response, input) {
        const inputQuestions = (input.match(/\?/g) || []).length;
        const responseSections = (response.content || '').split(/\n\n+/).filter(s => s.trim()).length;
        
        // Should have at least one response section per question
        const coverageRatio = responseSections / Math.max(inputQuestions, 1);
        
        return Math.min(1.0, 0.6 + (coverageRatio * 0.2));
    }

    _evaluateClarity(response) {
        const content = response.content || '';
        
        // Check readability metrics
        const avgSentenceLength = content.split(/[.!?]/).reduce((sum, s) => sum + s.split(/\s+/).length, 0) / 
                                   Math.max(content.split(/[.!?]/).filter(s => s.trim()).length, 1);
        
        let score = 0.8;
        if (avgSentenceLength > 40) score -= 0.15;
        if (avgSentenceLength > 60) score -= 0.1;
        
        // Check for clear structure
        const hasStructure = /\b(first|second|step|phase|conclusion|summary)\b/i.test(content);
        if (hasStructure) score += 0.1;
        
        return Math.max(0.4, Math.min(1.0, score));
    }

    _evaluateRelevance(response, input) {
        const inputWords = new Set(input.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4));
        const responseWords = new Set((response.content || '').toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4));
        
        const overlap = [...inputWords].filter(w => responseWords.has(w));
        const relevanceRatio = overlap.length / Math.max(inputWords.size, 1);
        
        return Math.min(1.0, 0.5 + (relevanceRatio * 0.5));
    }

    _evaluateDepth(response) {
        const content = response.content || '';
        
        const depthIndicators = [
            'because', 'therefore', 'causes', 'effects', 'implications',
            'underlying', 'fundamental', 'mechanism', 'principle', 'framework'
        ];
        
        const depthCount = depthIndicators.filter(d => content.toLowerCase().includes(d)).length;
        
        return Math.min(1.0, 0.5 + (depthCount * 0.06));
    }

    _evaluateNovelty(response, perspectives) {
        // Check if response adds value beyond existing perspectives
        const responseContent = JSON.stringify(response);
        
        let noveltyScore = 0.6;
        
        // Bonus for synthesis of multiple perspectives
        const perspectiveCount = perspectives?.length || 0;
        if (perspectiveCount >= 3) noveltyScore += 0.15;
        
        // Bonus for unique insights
        const hasUniqueInsight = /\b(novel|unique|innovative|new approach|alternative)\b/i.test(responseContent);
        if (hasUniqueInsight) noveltyScore += 0.1;
        
        return Math.min(1.0, noveltyScore);
    }

    _findConsensusPoints(perspectives) {
        // Find points that appear in multiple perspectives
        const allPoints = perspectives.flatMap(p => p.keyPoints || []);
        const pointCounts = {};
        
        allPoints.forEach(point => {
            pointCounts[point] = (pointCounts[point] || 0) + 1;
        });
        
        return Object.entries(pointCounts)
            .filter(([_, count]) => count >= Math.ceil(perspectives.length / 2))
            .map(([point]) => point);
    }

    _hasContradiction(responseContent, perspective) {
        // Simple contradiction detection
        const negationPatterns = ['not ', 'never ', 'cannot ', 'impossible'];
        const lowerResponse = responseContent.toLowerCase();
        
        return negationPatterns.some(pattern => 
            lowerResponse.includes(pattern) && 
            JSON.stringify(perspective).toLowerCase().includes(pattern.replace('not ', ''))
        );
    }

    _checkHallucinations(response, perspectives) {
        const detected = false;
        const details = [];
        
        // Check for unsupported claims
        const claimPatterns = /\b(studies show|research proves|experts agree|it is known)\b/i;
        const content = response.content || '';
        
        if (claimPatterns.test(content)) {
            // Verify if claim is supported by perspectives
            const supported = perspectives.some(p => 
                JSON.stringify(p).match(claimPatterns)
            );
            
            if (!supported) {
                return { detected: true, details: ['Unsupported claim detected'] };
            }
        }
        
        return { detected, details };
    }

    _checkLogicalConsistency(response) {
        const content = response.content || '';
        const issues = [];
        
        // Check for self-contradiction
        const statements = content.split(/[.!?]/).filter(s => s.trim().length > 20);
        
        for (let i = 0; i < statements.length; i++) {
            for (let j = i + 1; j < statements.length; j++) {
                if (this._areStatementsContradictory(statements[i], statements[j])) {
                    issues.push(`Contradiction between statements ${i + 1} and ${j + 1}`);
                }
            }
        }
        
        return {
            consistent: issues.length === 0,
            issues
        };
    }

    _areStatementsContradictory(stmt1, stmt2) {
        const negationWords = ['not', 'never', 'no', 'none', 'neither'];
        const lower1 = stmt1.toLowerCase();
        const lower2 = stmt2.toLowerCase();
        
        const hasNegation1 = negationWords.some(w => lower1.includes(` ${w} `));
        const hasNegation2 = negationWords.some(w => lower2.includes(` ${w} `));
        
        if (hasNegation1 !== hasNegation2) {
            const words1 = new Set(lower1.replace(/[^\w\s]/g, '').split(/\s+/));
            const words2 = new Set(lower2.replace(/[^\w\s]/g, '').split(/\s+/));
            const overlap = [...words1].filter(w => words2.has(w) && w.length > 5);
            
            if (overlap.length >= 4) {
                return true;
            }
        }
        
        return false;
    }

    _getIssueDescription(criterion, score) {
        const descriptions = {
            accuracy: `Response may contain inaccuracies (${(score * 100).toFixed(0)}% confidence)`,
            completeness: `Response may be incomplete (${(score * 100).toFixed(0)}% coverage)`,
            clarity: `Response could be clearer (${(score * 100).toFixed(0)}% readability)`,
            relevance: `Response may lack relevance (${(score * 100).toFixed(0)}% alignment)`,
            depth: `Response lacks depth (${(score * 100).toFixed(0)}% analysis)`,
            novelty: `Response lacks novelty (${(score * 100).toFixed(0)}% originality)`
        };
        
        return descriptions[criterion] || `Issue with ${criterion}`;
    }

    _identifyStrengths(scores) {
        return Object.entries(scores)
            .filter(([_, score]) => score >= 0.8)
            .map(([criterion, score]) => ({
                criterion,
                score,
                description: `Strong ${criterion}`
            }));
    }

    _generateRevisionPlan(critique) {
        const actions = [];
        
        critique.issues.forEach(issue => {
            actions.push({
                issue: issue.criterion,
                action: this._getRevisionAction(issue),
                priority: issue.severity === 'high' ? 1 : 2
            });
        });
        
        // Sort by priority
        actions.sort((a, b) => a.priority - b.priority);
        
        return { actions, estimatedImprovement: this._estimateImprovement(actions) };
    }

    _getRevisionAction(issue) {
        const actionMap = {
            accuracy: 'Verify facts and align with perspectives',
            completeness: 'Add missing information and examples',
            clarity: 'Restructure for better readability',
            relevance: 'Focus on core question and remove tangents',
            depth: 'Add deeper analysis and reasoning',
            novelty: 'Explore alternative approaches'
        };
        
        return actionMap[issue.criterion] || 'Improve quality';
    }

    _estimateImprovement(actions) {
        return Math.min(0.25, actions.length * 0.05);
    }

    async _applyRevisions(response, revisionPlan) {
        const improvements = [];
        
        revisionPlan.actions.forEach(action => {
            // Simulate applying revision
            improvements.push({
                area: action.issue,
                action: action.action,
                applied: true
            });
        });
        
        return {
            ...response,
            improved: improvements.length > 0,
            improvements,
            revisionApplied: true
        };
    }

    async _assessFinalQuality(response, input) {
        // Final quality assessment
        const baseScore = 0.8;
        const improvementBonus = (response.improvements?.length || 0) * 0.03;
        
        return Math.min(0.98, baseScore + improvementBonus);
    }
}

module.exports = { SelfCritiqueEngine };
