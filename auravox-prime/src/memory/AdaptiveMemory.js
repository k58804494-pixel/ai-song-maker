/**
 * Adaptive Memory System
 * - Short-term context memory
 * - Long-term pattern memory
 * - Forgetting and updating rules
 */
class AdaptiveMemory {
    constructor(config = {}) {
        this.shortTerm = [];
        this.longTerm = new Map();
        this.maxShortTermSize = config.maxShortTermSize || 50;
        this.forgetThreshold = config.forgetThreshold || 0.3;
        this.updateThreshold = config.updateThreshold || 0.7;
        this.accessCounts = new Map();
    }

    async store(interaction) {
        const entry = {
            id: this._generateId(),
            timestamp: Date.now(),
            input: interaction.input,
            output: interaction.output,
            quality: interaction.quality || 0.5,
            accessCount: 1
        };

        // Store in short-term
        this.shortTerm.push(entry);
        
        // Trim if over capacity
        if (this.shortTerm.length > this.maxShortTermSize) {
            await this._forgetOldest();
        }

        // Extract patterns for long-term storage
        await this._extractPatterns(interaction);

        return entry.id;
    }

    async enrichContext(input, sessionHistory) {
        const relevantMemories = await this._findRelevantMemories(input);
        
        const context = relevantMemories.map(m => 
            `Previous: ${m.input.substring(0, 50)}... → ${JSON.stringify(m.output).substring(0, 100)}...`
        ).join('\n');

        return {
            context,
            relevantMemories,
            sessionLength: sessionHistory?.length || 0
        };
    }

    async _findRelevantMemories(input, limit = 5) {
        const inputKeywords = this._extractKeywords(input);
        
        const scored = this.shortTerm.map(memory => ({
            memory,
            score: this._calculateRelevance(inputKeywords, memory)
        }));

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(s => s.memory);
    }

    _calculateRelevance(inputKeywords, memory) {
        const memoryKeywords = this._extractKeywords(memory.input);
        
        const intersection = inputKeywords.filter(k => memoryKeywords.includes(k));
        const union = new Set([...inputKeywords, ...memoryKeywords]);
        
        let score = union.size > 0 ? intersection.length / union.size : 0;
        
        // Boost recent memories
        const recencyBonus = Math.exp(-(Date.now() - memory.timestamp) / 3600000) * 0.2;
        
        // Boost high-quality memories
        const qualityBonus = memory.quality * 0.1;
        
        return Math.min(1.0, score + recencyBonus + qualityBonus);
    }

    async _extractPatterns(interaction) {
        // Extract common patterns from successful interactions
        if (interaction.quality < this.updateThreshold) return;

        const patternKey = this._generatePatternKey(interaction.input);
        
        if (this.longTerm.has(patternKey)) {
            const existing = this.longTerm.get(patternKey);
            existing.count++;
            existing.avgQuality = (existing.avgQuality * existing.count + interaction.quality) / (existing.count + 1);
            existing.lastUpdated = Date.now();
        } else {
            this.longTerm.set(patternKey, {
                pattern: interaction.input.substring(0, 100),
                solutionType: this._classifySolution(interaction.output),
                count: 1,
                avgQuality: interaction.quality,
                createdAt: Date.now(),
                lastUpdated: Date.now()
            });
        }
    }

    async _forgetOldest() {
        // Remove lowest priority memories
        const priorities = this.shortTerm.map((m, i) => ({
            index: i,
            priority: this._calculatePriority(m)
        }));

        priorities.sort((a, b) => a.priority - b.priority);
        
        // Remove bottom 10%
        const removeCount = Math.max(1, Math.floor(this.shortTerm.length * 0.1));
        for (let i = 0; i < removeCount; i++) {
            this.shortTerm.splice(priorities[i].index, 1);
        }
    }

    _calculatePriority(memory) {
        const recency = Math.exp(-(Date.now() - memory.timestamp) / 86400000);
        const quality = memory.quality;
        const accessFrequency = (memory.accessCount || 1) / 10;
        
        return recency * 0.4 + quality * 0.4 + accessFrequency * 0.2;
    }

    _extractKeywords(text) {
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had']);
        return (text || '').toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));
    }

    _generatePatternKey(input) {
        // Generate simplified key based on input structure
        const keywords = this._extractKeywords(input).slice(0, 5);
        return keywords.join('_');
    }

    _classifySolution(output) {
        const content = JSON.stringify(output);
        if (content.includes('code') || content.includes('function')) return 'code';
        if (content.includes('plan') || content.includes('strategy')) return 'planning';
        if (content.includes('creative') || content.includes('idea')) return 'creative';
        if (content.includes('analysis') || content.includes('reasoning')) return 'analytical';
        return 'general';
    }

    _generateId() {
        return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    size() {
        return this.shortTerm.length + this.longTerm.size;
    }

    export() {
        return {
            shortTerm: this.shortTerm,
            longTerm: Array.from(this.longTerm.entries()),
            metadata: {
                exportedAt: Date.now(),
                totalEntries: this.size()
            }
        };
    }

    import(data) {
        if (data.shortTerm) {
            this.shortTerm = data.shortTerm;
        }
        if (data.longTerm) {
            this.longTerm = new Map(data.longTerm);
        }
        return true;
    }

    clear() {
        this.shortTerm = [];
        this.longTerm.clear();
    }
}

module.exports = { AdaptiveMemory };
