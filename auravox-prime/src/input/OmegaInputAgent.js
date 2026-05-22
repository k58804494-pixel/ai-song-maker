/**
 * OMEGA INPUT AGENT
 * Real-time keyboard, mouse, and gameplay control system
 * 
 * Capabilities:
 * - Precision key presses and combinations
 * - Mouse movement and clicking
 * - Game state analysis and strategy
 * - Real-time reflex loop (Observe → Act → Evaluate → Adjust)
 * - Macro execution and combo chains
 * - Safety-governed input control
 */

const { SafetyGovernor } = require('../safety/SafetyGovernor');

class OmegaInputAgent {
    constructor(options = {}) {
        this.safetyGovernor = new SafetyGovernor();
        this.isSimulationMode = options.simulationMode !== false; // Default to simulation for safety
        this.activeSequence = null;
        this.inputHistory = [];
        this.reactionTime = options.reactionTime || 50; // ms
        this.maxInputsPerSecond = options.maxInputsPerSecond || 20;
        this.inputQueue = [];
        this.isRunning = false;
        this.currentStrategy = null;
        
        // Game state tracking
        this.gameState = {
            health: 100,
            enemies: [],
            objectives: [],
            inventory: [],
            position: { x: 0, y: 0 },
            lastScreenUpdate: null
        };
        
        // Performance metrics
        this.metrics = {
            inputsExecuted: 0,
            averageReactionTime: 0,
            successRate: 0,
            combosExecuted: 0
        };
        
        console.log('🎮 Omega Input Agent initialized');
        console.log(`   Mode: ${this.isSimulationMode ? 'SIMULATION (Safe)' : 'LIVE'}`);
        console.log(`   Max Inputs/sec: ${this.maxInputsPerSecond}`);
        console.log(`   Reaction Time: ${this.reactionTime}ms`);
    }

    /**
     * Single key press with timing control
     */
    async pressKey(key, duration = 50, options = {}) {
        const action = {
            type: 'KEY_PRESS',
            key,
            duration,
            timestamp: Date.now(),
            ...options
        };

        if (!await this._validateAction(action)) {
            throw new Error(`Action blocked by safety governor: ${key}`);
        }

        return this._executeInput(action);
    }

    /**
     * Key combination (e.g., Ctrl+C, Shift+W)
     */
    async pressCombination(keys, duration = 50, options = {}) {
        const action = {
            type: 'KEY_COMBINATION',
            keys: Array.isArray(keys) ? keys : [keys],
            duration,
            timestamp: Date.now(),
            ...options
        };

        if (!await this._validateAction(action)) {
            throw new Error(`Combination blocked by safety governor: ${keys.join('+')}`);
        }

        return this._executeInput(action);
    }

    /**
     * Hold key for specified duration
     */
    async holdKey(key, duration = 500, options = {}) {
        const action = {
            type: 'KEY_HOLD',
            key,
            duration,
            timestamp: Date.now(),
            ...options
        };

        if (!await this._validateAction(action)) {
            throw new Error(`Hold action blocked: ${key}`);
        }

        return this._executeInput(action);
    }

    /**
     * Release held key
     */
    async releaseKey(key, options = {}) {
        const action = {
            type: 'KEY_RELEASE',
            key,
            timestamp: Date.now(),
            ...options
        };

        return this._executeInput(action);
    }

    /**
     * Move mouse to coordinates
     */
    async moveMouse(x, y, options = {}) {
        const action = {
            type: 'MOUSE_MOVE',
            x,
            y,
            timestamp: Date.now(),
            ...options
        };

        if (!await this._validateAction(action)) {
            throw new Error(`Mouse move blocked: (${x}, ${y})`);
        }

        return this._executeInput(action);
    }

    /**
     * Click mouse button
     */
    async clickMouse(button = 'left', options = {}) {
        const action = {
            type: 'MOUSE_CLICK',
            button,
            timestamp: Date.now(),
            ...options
        };

        if (!await this._validateAction(action)) {
            throw new Error(`Mouse click blocked: ${button}`);
        }

        return this._executeInput(action);
    }

    /**
     * Execute a macro/sequence of inputs
     */
    async executeMacro(sequence, options = {}) {
        const macroName = options.name || `macro_${Date.now()}`;
        console.log(`🎬 Executing macro: ${macroName} (${sequence.length} steps)`);

        this.activeSequence = {
            name: macroName,
            sequence,
            startIndex: 0,
            startTime: Date.now()
        };

        const results = [];
        for (let i = 0; i < sequence.length; i++) {
            const step = sequence[i];
            try {
                const result = await this._executeInput({
                    ...step,
                    timestamp: Date.now(),
                    macroStep: i,
                    macroName
                });
                results.push({ success: true, step, result });
                
                // Wait between steps if specified
                if (step.delay) {
                    await this._sleep(step.delay);
                }
            } catch (error) {
                results.push({ success: false, step, error: error.message });
                if (options.stopOnError) {
                    break;
                }
            }
        }

        this.activeSequence = null;
        this.metrics.combosExecuted++;
        return results;
    }

    /**
     * Game strategy execution - high-level game actions
     */
    async executeGameStrategy(strategy, gameState) {
        this.gameState = { ...this.gameState, ...gameState };
        this.currentStrategy = strategy;

        console.log(`🧠 Executing game strategy: ${strategy.name}`);
        console.log(`   Objective: ${strategy.objective}`);
        console.log(`   Current State: HP=${this.gameState.health}, Enemies=${this.gameState.enemies.length}`);

        const actions = this._planStrategyActions(strategy);
        return this.executeMacro(actions, { name: strategy.name, stopOnError: true });
    }

    /**
     * Real-time reflex loop - continuous observe/act cycle
     */
    async startReflexLoop(gameLoopFn, options = {}) {
        if (this.isRunning) {
            throw new Error('Reflex loop already running');
        }

        this.isRunning = true;
        const interval = options.interval || this.reactionTime;
        let iteration = 0;
        const startTime = Date.now();

        console.log('🔁 Starting real-time reflex loop');
        console.log(`   Interval: ${interval}ms`);

        while (this.isRunning) {
            try {
                iteration++;
                const loopStart = Date.now();

                // Observe
                const gameState = await gameLoopFn(iteration);
                
                // Analyze and decide
                const action = this._decideNextAction(gameState);
                
                // Act
                if (action) {
                    await this._executeInput({
                        ...action,
                        timestamp: Date.now(),
                        reflexIteration: iteration
                    });
                }

                // Evaluate
                this._evaluateActionResult(action, gameState);

                // Update metrics
                const reactionTime = Date.now() - loopStart;
                this._updateMetrics(reactionTime, action !== null);

                // Maintain target interval
                const elapsed = Date.now() - loopStart;
                if (elapsed < interval) {
                    await this._sleep(interval - elapsed);
                }

                // Safety check - prevent runaway loops
                if (options.maxIterations && iteration >= options.maxIterations) {
                    console.log(`✅ Completed ${iteration} iterations`);
                    break;
                }

            } catch (error) {
                console.error('❌ Reflex loop error:', error.message);
                if (options.stopOnError) {
                    this.stopReflexLoop();
                    break;
                }
            }
        }

        const totalTime = Date.now() - startTime;
        console.log(`⏹ Reflex loop stopped after ${iteration} iterations (${totalTime}ms)`);
        return { iterations: iteration, totalTime, metrics: { ...this.metrics } };
    }

    /**
     * Stop the reflex loop
     */
    stopReflexLoop() {
        this.isRunning = false;
        console.log('⏹ Reflex loop stopping...');
    }

    /**
     * Update game state from screen/vision input
     */
    updateGameStateFromVision(visionData) {
        const updates = {};
        
        // Extract common game elements from vision data
        if (visionData.healthBar) {
            updates.health = visionData.healthBar.percentage * 100;
        }
        
        if (visionData.enemies) {
            updates.enemies = visionData.enemies.map(e => ({
                ...e,
                detectedAt: Date.now()
            }));
        }

        if (visionData.playerPosition) {
            updates.position = visionData.playerPosition;
        }

        if (visionData.objectives) {
            updates.objectives = visionData.objectives;
        }

        this.gameState = { ...this.gameState, ...updates };
        this.gameState.lastScreenUpdate = Date.now();
        
        return this.gameState;
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            isRunning: this.isRunning,
            activeSequence: this.activeSequence?.name || null,
            currentStrategy: this.currentStrategy?.name || null,
            gameState: { ...this.gameState }
        };
    }

    /**
     * Internal: Validate action through safety governor
     */
    async _validateAction(action) {
        // Check rate limiting
        const recentInputs = this.inputHistory.filter(
            i => Date.now() - i.timestamp < 1000
        );
        
        if (recentInputs.length >= this.maxInputsPerSecond) {
            console.warn('⚠️ Rate limit exceeded, delaying input');
            return false;
        }

        // Block dangerous key combinations
        const dangerousPatterns = [
            ['Alt', 'F4'],
            ['Ctrl', 'Alt', 'Del'],
            ['Meta', 'D'], // Show desktop
        ];

        if (action.type === 'KEY_COMBINATION') {
            const keys = action.keys.sort();
            for (const pattern of dangerousPatterns) {
                const sortedPattern = [...pattern].sort();
                if (JSON.stringify(keys) === JSON.stringify(sortedPattern)) {
                    console.warn(`🚫 Blocked dangerous combination: ${action.keys.join('+')}`);
                    return false;
                }
            }
        }

        // Check for infinite loop patterns
        if (this.activeSequence && this.activeSequence.sequence.length > 100) {
            console.warn('⚠️ Sequence too long, may indicate loop');
            return false;
        }

        return true;
    }

    /**
     * Internal: Execute input (simulation or real)
     */
    async _executeInput(action) {
        const startTime = Date.now();
        
        if (this.isSimulationMode) {
            // Simulation mode - log action without executing
            await this._sleep(this.reactionTime);
            
            const logEntry = {
                ...action,
                executed: true,
                simulated: true,
                executionTime: Date.now() - startTime
            };
            
            this._logAction(logEntry);
            
            if (action.type === 'KEY_PRESS') {
                console.log(`   ⌨️ [SIM] Press: ${action.key} (${action.duration}ms)`);
            } else if (action.type === 'KEY_COMBINATION') {
                console.log(`   ⌨️ [SIM] Combo: ${action.keys.join('+')} (${action.duration}ms)`);
            } else if (action.type === 'MOUSE_MOVE') {
                console.log(`   🖱️ [SIM] Move: (${action.x}, ${action.y})`);
            } else if (action.type === 'MOUSE_CLICK') {
                console.log(`   🖱️ [SIM] Click: ${action.button}`);
            }
            
            return { success: true, simulated: true, ...logEntry };
        } else {
            // Live mode - would integrate with actual input libraries
            // For now, still simulate but could be extended with:
            // - robotjs for real keyboard/mouse control
            // - nut.js for cross-platform automation
            // - direct game API integration
            
            console.warn('⚠️ Live mode not fully implemented - running in simulation');
            return this._executeInput({ ...action, simulationMode: true });
        }
    }

    /**
     * Internal: Plan actions from strategy
     */
    _planStrategyActions(strategy) {
        const actions = [];
        
        switch (strategy.type) {
            case 'COMBAT':
                // Combat rotation
                if (strategy.targetEnemy) {
                    actions.push({ type: 'KEY_PRESS', key: 'Tab', delay: 50 }); // Target enemy
                    actions.push({ type: 'KEY_HOLD', key: 'Shift', duration: strategy.combatDuration || 3000 });
                    actions.push({ type: 'KEY_PRESS', key: '1', delay: 100 }); // Ability 1
                    actions.push({ type: 'KEY_PRESS', key: '2', delay: 200 }); // Ability 2
                    actions.push({ type: 'KEY_PRESS', key: '3', delay: 300 }); // Ability 3
                    actions.push({ type: 'KEY_RELEASE', key: 'Shift' });
                }
                break;
                
            case 'MOVEMENT':
                // Movement pattern
                if (strategy.destination) {
                    const dx = strategy.destination.x - this.gameState.position.x;
                    const dy = strategy.destination.y - this.gameState.position.y;
                    
                    if (dx > 0) actions.push({ type: 'KEY_HOLD', key: 'D', duration: Math.abs(dx) * 10 });
                    if (dx < 0) actions.push({ type: 'KEY_HOLD', key: 'A', duration: Math.abs(dx) * 10 });
                    if (dy > 0) actions.push({ type: 'KEY_HOLD', key: 'S', duration: Math.abs(dy) * 10 });
                    if (dy < 0) actions.push({ type: 'KEY_HOLD', key: 'W', duration: Math.abs(dy) * 10 });
                }
                break;
                
            case 'RESOURCE_GATHER':
                // Farming/grinding pattern
                for (let i = 0; i < (strategy.cycles || 5); i++) {
                    actions.push({ type: 'KEY_PRESS', key: 'E', delay: 100 }); // Interact
                    actions.push({ type: 'KEY_PRESS', key: 'Space', delay: 300 }); // Jump
                    actions.push({ type: 'KEY_HOLD', key: 'W', duration: 500 }); // Move forward
                }
                break;
                
            default:
                console.warn(`Unknown strategy type: ${strategy.type}`);
        }
        
        return actions;
    }

    /**
     * Internal: Decide next action based on game state
     */
    _decideNextAction(gameState) {
        // Simple AI decision making
        if (gameState.enemies && gameState.enemies.length > 0) {
            const nearestEnemy = gameState.enemies[0]; // Simplified - would calculate distance
            if (nearestEnemy.distance < 5) {
                return { type: 'KEY_PRESS', key: '1' }; // Attack
            } else {
                return { type: 'KEY_HOLD', key: 'W', duration: 100 }; // Move toward
            }
        }
        
        if (gameState.health < 30) {
            return { type: 'KEY_PRESS', key: 'H' }; // Heal
        }
        
        return null; // No action needed
    }

    /**
     * Internal: Evaluate action result
     */
    _evaluateActionResult(action, gameState) {
        // Would compare expected vs actual outcome
        // For now, just track that evaluation occurred
    }

    /**
     * Internal: Update performance metrics
     */
    _updateMetrics(reactionTime, hadAction) {
        this.metrics.inputsExecuted += hadAction ? 1 : 0;
        
        // Running average of reaction time
        const total = this.metrics.averageReactionTime * (this.metrics.inputsExecuted - 1) + reactionTime;
        this.metrics.averageReactionTime = total / this.metrics.inputsExecuted;
    }

    /**
     * Internal: Log action to history
     */
    _logAction(action) {
        this.inputHistory.push(action);
        
        // Keep only last 1000 actions in memory
        if (this.inputHistory.length > 1000) {
            this.inputHistory = this.inputHistory.slice(-1000);
        }
    }

    /**
     * Internal: Sleep utility
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { OmegaInputAgent };
