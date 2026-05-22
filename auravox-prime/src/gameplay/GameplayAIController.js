/**
 * GAMEPLAY AI CONTROLLER
 * Integrates Omega Input Agent + Screen Vision Engine for autonomous gameplay
 * 
 * Features:
 * - Real-time game state awareness
 * - Adaptive strategy selection
 * - Combat rotation automation
 * - Resource gathering optimization
 * - Quest/mission assistance
 * - Coach mode for player improvement
 */

const { OmegaInputAgent } = require('../input/OmegaInputAgent');
const { ScreenVisionEngine } = require('../vision/ScreenVisionEngine');

class GameplayAIController {
    constructor(options = {}) {
        this.inputAgent = new OmegaInputAgent({
            simulationMode: options.simulationMode !== false,
            reactionTime: options.reactionTime || 50,
            maxInputsPerSecond: options.maxInputsPerSecond || 20
        });
        
        this.visionEngine = new ScreenVisionEngine({
            simulationMode: options.simulationMode !== false,
            resolution: options.resolution || { width: 1920, height: 1080 }
        });
        
        this.gameProfile = options.gameProfile || 'generic_rpg';
        this.mode = options.mode || 'ASSIST'; // ASSIST, COACH, AUTONOMOUS
        this.isRunning = false;
        
        // Strategy library
        this.strategies = this._initializeStrategies();
        
        // Performance tracking
        this.sessionStats = {
            startTime: null,
            actionsExecuted: 0,
            enemiesDefeated: 0,
            resourcesCollected: 0,
            deaths: 0,
            averageReactionTime: 0
        };
        
        console.log('🎮 Gameplay AI Controller initialized');
        console.log(`   Game Profile: ${this.gameProfile}`);
        console.log(`   Mode: ${this.mode}`);
        console.log(`   Input Agent: ${this.inputAgent.isSimulationMode ? 'SIMULATION' : 'LIVE'}`);
        console.log(`   Vision Engine: ${this.visionEngine.isSimulationMode ? 'SIMULATION' : 'LIVE'}`);
    }

    /**
     * Start autonomous gameplay session
     */
    async startSession(objectives = []) {
        if (this.isRunning) {
            throw new Error('Session already running');
        }

        this.isRunning = true;
        this.sessionStats.startTime = Date.now();
        
        console.log('🚀 Starting gameplay session');
        console.log(`   Objectives: ${objectives.map(o => o.name).join(', ') || 'Free play'}`);
        console.log(`   Mode: ${this.mode}`);

        // Start the main game loop
        return this.inputAgent.startReflexLoop(
            async (iteration) => await this._gameLoop(iteration, objectives),
            {
                interval: this.inputAgent.reactionTime,
                maxIterations: objectives.find(o => o.type === 'limited_iterations')?.iterations || null,
                stopOnError: true
            }
        );
    }

    /**
     * Stop current session
     */
    async stopSession() {
        this.isRunning = false;
        this.inputAgent.stopReflexLoop();
        
        const duration = Date.now() - this.sessionStats.startTime;
        console.log('⏹ Session ended');
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Actions: ${this.sessionStats.actionsExecuted}`);
        console.log(`   Enemies Defeated: ${this.sessionStats.enemiesDefeated}`);
        console.log(`   Resources Collected: ${this.sessionStats.resourcesCollected}`);
        
        return {
            duration,
            ...this.sessionStats
        };
    }

    /**
     * Execute specific combat combo
     */
    async executeCombatCombo(comboName, target = null) {
        const combo = this.strategies.combatCombos[comboName];
        
        if (!combo) {
            throw new Error(`Unknown combo: ${comboName}`);
        }

        console.log(`⚔️ Executing combat combo: ${comboName}`);
        return this.inputAgent.executeMacro(combo.sequence, {
            name: comboName,
            stopOnError: combo.stopOnError !== false
        });
    }

    /**
     * Farm/grind resources automatically
     */
    async startFarmingRoute(routeName, cycles = 10) {
        const route = this.strategies.farmingRoutes[routeName];
        
        if (!route) {
            throw new Error(`Unknown farming route: ${routeName}`);
        }

        console.log(`🌾 Starting farming route: ${routeName} (${cycles} cycles)`);
        
        const strategy = {
            name: `farm_${routeName}`,
            type: 'RESOURCE_GATHER',
            cycles,
            route
        };

        return this.inputAgent.executeGameStrategy(strategy, this.inputAgent.gameState);
    }

    /**
     * Coaching mode - analyze player performance and give suggestions
     */
    async analyzePlayerPerformance(gameplayRecording) {
        console.log('📊 Analyzing player performance...');
        
        const analysis = {
            strengths: [],
            weaknesses: [],
            suggestions: [],
            apm: gameplayRecording?.actionsPerMinute || 0,
            accuracy: gameplayRecording?.accuracy || 0,
            reactionTime: gameplayRecording?.avgReactionTime || 0,
            efficiency: 0
        };

        // Analyze APM
        if (analysis.apm > 200) {
            analysis.strengths.push('High actions per minute');
        } else if (analysis.apm < 100) {
            analysis.weaknesses.push('Low APM - consider increasing activity');
            analysis.suggestions.push('Practice ability rotations to increase APM');
        }

        // Analyze accuracy
        if (analysis.accuracy > 0.8) {
            analysis.strengths.push('Excellent accuracy');
        } else if (analysis.accuracy < 0.5) {
            analysis.weaknesses.push('Low accuracy');
            analysis.suggestions.push('Focus on aim training or ability targeting');
        }

        // Calculate efficiency score
        analysis.efficiency = (analysis.apm / 300) * 0.3 + 
                             analysis.accuracy * 0.5 + 
                             (Math.max(0, 500 - analysis.reactionTime) / 500) * 0.2;

        analysis.overallScore = Math.round(analysis.efficiency * 100);
        analysis.grade = this._getGrade(analysis.overallScore);

        return analysis;
    }

    /**
     * Get real-time game state
     */
    async getGameState() {
        const [visionState, inputState] = await Promise.all([
            this.visionEngine.detectGameState(),
            Promise.resolve(this.inputAgent.getMetrics())
        ]);

        return {
            ...visionState,
            inputMetrics: inputState,
            mode: this.mode,
            isRunning: this.isRunning
        };
    }

    /**
     * Switch gameplay mode
     */
    switchMode(newMode) {
        const validModes = ['ASSIST', 'COACH', 'AUTONOMOUS'];
        
        if (!validModes.includes(newMode)) {
            throw new Error(`Invalid mode. Choose from: ${validModes.join(', ')}`);
        }

        const oldMode = this.mode;
        this.mode = newMode;
        
        console.log(`🔄 Mode switched: ${oldMode} → ${newMode}`);
        return { oldMode, newMode };
    }

    /**
     * Internal: Main game loop iteration
     */
    async _gameLoop(iteration, objectives) {
        // Observe: Get current game state from vision
        const gameState = await this.visionEngine.detectGameState();
        
        // Update input agent's internal state
        this.inputAgent.updateGameStateFromVision({
            healthBar: { percentage: gameState.health.percentage },
            enemies: gameState.enemies.detections || [],
            objectives: gameState.objectives
        });

        // Decide: Choose action based on mode and state
        if (this.mode === 'AUTONOMOUS') {
            // Full autonomous decision making
            return this._decideAutonomousAction(gameState, objectives);
        } else if (this.mode === 'ASSIST') {
            // Only act when needed (low health, enemy detected, etc.)
            return this._decideAssistAction(gameState, objectives);
        } else if (this.mode === 'COACH') {
            // Don't act, just observe and provide feedback
            this._generateCoachingFeedback(gameState);
            return null;
        }

        return null;
    }

    /**
     * Internal: Decide action in autonomous mode
     */
    _decideAutonomousAction(gameState, objectives) {
        // Priority system
        // 1. Survival (low health)
        if (gameState.health.percentage < 0.3) {
            return { type: 'KEY_PRESS', key: 'H', priority: 'SURVIVAL' }; // Heal
        }

        // 2. Combat (enemies present)
        if (gameState.enemies.detections && gameState.enemies.detections.length > 0) {
            return { type: 'KEY_PRESS', key: '1', priority: 'COMBAT' }; // Attack
        }

        // 3. Objectives
        if (objectives && objectives.length > 0) {
            const currentObjective = objectives[0];
            
            if (currentObjective.type === 'COLLECT') {
                return { type: 'KEY_PRESS', key: 'E', priority: 'OBJECTIVE' }; // Interact/Collect
            }
            
            if (currentObjective.type === 'MOVE_TO') {
                return { type: 'KEY_HOLD', key: 'W', duration: 500, priority: 'OBJECTIVE' }; // Move
            }
        }

        // 4. Exploration (default)
        return { type: 'KEY_HOLD', key: 'W', duration: 300, priority: 'EXPLORATION' };
    }

    /**
     * Internal: Decide action in assist mode
     */
    _decideAssistAction(gameState, objectives) {
        // Only intervene when necessary
        
        // Critical health - auto heal
        if (gameState.health && gameState.health.percentage < 0.2) {
            console.log('⚠️ CRITICAL: Auto-healing');
            return { type: 'KEY_PRESS', key: 'H', priority: 'EMERGENCY' };
        }

        // Enemy ambush - alert and defend
        if (gameState.enemies && gameState.enemies.detections && gameState.enemies.detections.length > 2) {
            console.log('⚠️ AMBUSH DETECTED: Multiple enemies');
            return { type: 'KEY_PRESS', key: '2', priority: 'DEFENSE' }; // AoE ability
        }

        return null; // Let player handle normal situations
    }

    /**
     * Internal: Generate coaching feedback
     */
    _generateCoachingFeedback(gameState) {
        const tips = [];

        if (gameState.health.percentage < 0.5) {
            tips.push('💡 Tip: Your health is low, consider retreating or using a healing item');
        }

        if (gameState.enemies.detections && gameState.enemies.detections.length > 3) {
            tips.push('💡 Tip: You\'re outnumbered! Use crowd control abilities');
        }

        if (tips.length > 0) {
            console.log('🎓 COACHING:', tips.join(' | '));
        }
    }

    /**
     * Internal: Initialize strategy library
     */
    _initializeStrategies() {
        return {
            combatCombos: {
                basicRotation: {
                    name: 'Basic Rotation',
                    sequence: [
                        { type: 'KEY_PRESS', key: 'Tab', delay: 50 },
                        { type: 'KEY_PRESS', key: '1', delay: 200 },
                        { type: 'KEY_PRESS', key: '2', delay: 200 },
                        { type: 'KEY_PRESS', key: '3', delay: 200 },
                        { type: 'KEY_PRESS', key: '4', delay: 100 }
                    ],
                    stopOnError: true,
                    cooldown: 5000
                },
                burstDamage: {
                    name: 'Burst Damage',
                    sequence: [
                        { type: 'KEY_HOLD', key: 'Shift', duration: 2000 },
                        { type: 'KEY_PRESS', key: 'R', delay: 100 },
                        { type: 'KEY_PRESS', key: '1', delay: 100 },
                        { type: 'KEY_PRESS', key: '2', delay: 100 },
                        { type: 'KEY_PRESS', key: '3', delay: 100 },
                        { type: 'KEY_RELEASE', key: 'Shift' }
                    ],
                    stopOnError: true,
                    cooldown: 15000
                },
                defensiveStance: {
                    name: 'Defensive Stance',
                    sequence: [
                        { type: 'KEY_PRESS', key: 'D', delay: 50 },
                        { type: 'KEY_HOLD', key: 'RightClick', duration: 1500 },
                        { type: 'KEY_PRESS', key: '5', delay: 100 }
                    ],
                    stopOnError: false,
                    cooldown: 8000
                }
            },
            farmingRoutes: {
                herbCircle: {
                    name: 'Herb Collection Circle',
                    waypoints: [
                        { x: 100, y: 100 },
                        { x: 500, y: 100 },
                        { x: 500, y: 500 },
                        { x: 100, y: 500 }
                    ],
                    actionsAtWaypoint: [
                        { type: 'KEY_PRESS', key: 'E', delay: 300 }
                    ]
                },
                miningRoute: {
                    name: 'Mining Path',
                    waypoints: [
                        { x: 200, y: 300 },
                        { x: 600, y: 300 },
                        { x: 600, y: 700 }
                    ],
                    actionsAtWaypoint: [
                        { type: 'KEY_PRESS', key: '1', delay: 500 },
                        { type: 'KEY_PRESS', key: 'E', delay: 300 }
                    ]
                }
            }
        };
    }

    /**
     * Internal: Get grade from score
     */
    _getGrade(score) {
        if (score >= 90) return 'S';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }

    /**
     * Get controller statistics
     */
    getStats() {
        return {
            mode: this.mode,
            isRunning: this.isRunning,
            gameProfile: this.gameProfile,
            sessionStats: { ...this.sessionStats },
            inputMetrics: this.inputAgent.getMetrics(),
            visionMetrics: this.visionEngine.getMetrics(),
            availableStrategies: Object.keys(this.strategies.combatCombos),
            availableRoutes: Object.keys(this.strategies.farmingRoutes)
        };
    }
}

module.exports = { GameplayAIController };
