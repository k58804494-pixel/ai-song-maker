/**
 * Safety Governor - Three-tier safety system
 */
class SafetyGovernor {
    constructor() {
        this.levels = {
            SAFE: 'safe',
            CONFIRM: 'confirm',
            RESTRICTED: 'restricted'
        };
        
        this.dangerousPatterns = [
            { pattern: /rm\s+-rf/, level: 'restricted', reason: 'Destructive file deletion' },
            { pattern: /drop\s+table/i, level: 'restricted', reason: 'Database destruction' },
            { pattern: /delete\s+from/i, level: 'restricted', reason: 'Data deletion' },
            { pattern: /format\s+[cdefg]:/i, level: 'restricted', reason: 'Disk formatting' },
            { pattern: /sudo\s+rm/i, level: 'restricted', reason: 'Privileged deletion' },
            { pattern: /chmod\s+-?R?\s*777/i, level: 'confirm', reason: 'Permission change' },
            { pattern: /eval\s*\(/, level: 'confirm', reason: 'Code evaluation' },
            { pattern: /exec\s*\(/, level: 'confirm', reason: 'Command execution' }
        ];
        
        this.currentLevel = 'active';
        this.requestLog = [];
    }

    async validate(input, options = {}) {
        return this.evaluate(input, options); // Alias for backwards compatibility
    }

    async evaluate(input, options = {}) {
        const request = {
            id: this._generateId(),
            input: input.substring(0, 500),
            timestamp: Date.now(),
            options
        };

        // Check for dangerous patterns
        for (const { pattern, level, reason } of this.dangerousPatterns) {
            if (pattern.test(input)) {
                request.result = 'blocked';
                request.reason = reason;
                request.safetyLevel = level;
                this.requestLog.push(request);
                
                return {
                    approved: level === 'safe',
                    requiresConfirmation: level === 'confirm',
                    blocked: level === 'restricted',
                    response: {
                        content: `⚠️ Safety Warning: ${reason}`,
                        reason,
                        level
                    }
                };
            }
        }

        // Check for potentially harmful actions
        const riskScore = this._assessRisk(input);
        
        if (riskScore > 0.8) {
            request.result = 'requires_confirmation';
            request.riskScore = riskScore;
            this.requestLog.push(request);
            
            return {
                approved: false,
                requiresConfirmation: true,
                blocked: false,
                response: {
                    content: 'This action may have significant consequences. Please confirm.',
                    riskScore
                }
            };
        }

        request.result = 'approved';
        request.riskScore = riskScore;
        this.requestLog.push(request);

        return {
            approved: true,
            requiresConfirmation: false,
            blocked: false,
            riskScore
        };
    }

    _assessRisk(input) {
        let riskScore = 0;
        const lowerInput = input.toLowerCase();

        // Risk factors
        if (lowerInput.includes('delete') || lowerInput.includes('remove')) riskScore += 0.3;
        if (lowerInput.includes('permanent')) riskScore += 0.2;
        if (lowerInput.includes('all') || lowerInput.includes('everything')) riskScore += 0.2;
        if (lowerInput.includes('system') || lowerInput.includes('root')) riskScore += 0.2;
        if (lowerInput.includes('password') || lowerInput.includes('secret')) riskScore += 0.1;

        return Math.min(1.0, riskScore);
    }

    _generateId() {
        return `saf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    getStats() {
        const total = this.requestLog.length;
        const blocked = this.requestLog.filter(r => r.result === 'blocked').length;
        const confirmed = this.requestLog.filter(r => r.result === 'requires_confirmation').length;
        const approved = this.requestLog.filter(r => r.result === 'approved').length;

        return {
            totalRequests: total,
            blocked,
            requiresConfirmation: confirmed,
            approved,
            blockRate: total > 0 ? (blocked / total).toFixed(2) : 0
        };
    }

    clearLog() {
        this.requestLog = [];
    }
}

module.exports = { SafetyGovernor };
