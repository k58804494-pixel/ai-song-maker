/**
 * AURAVOX PRIME - SYSTEM TESTS
 * Tests for Safety Governor, Input Agent, Vision Engine, and Gameplay Controller
 */

const assert = require('assert');
const { SafetyGovernor } = require('../src/safety/SafetyGovernor');
const { OmegaInputAgent } = require('../src/input/OmegaInputAgent');
const { ScreenVisionEngine } = require('../src/vision/ScreenVisionEngine');
const { GameplayAIController } = require('../src/gameplay/GameplayAIController');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        failed++;
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        failed++;
    }
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('🧪 AURAVOX PRIME - SYSTEM TESTS');
    console.log('='.repeat(60));
    console.log();

    // ========================================
    // SAFETY GOVERNOR TESTS
    // ========================================
    console.log('📍 SAFETY GOVERNOR TESTS\n');
    
    test('Safety Governor initializes correctly', () => {
        const governor = new SafetyGovernor();
        assert(governor, 'Governor should exist');
        assert(typeof governor.evaluate === 'function', 'Should have evaluate method');
    });

    await asyncTest('Safety Governor blocks dangerous commands', async () => {
        const governor = new SafetyGovernor();
        const result = await governor.evaluate('rm -rf /');
        assert.strictEqual(result.blocked, true, 'Should block rm -rf');
        assert.strictEqual(result.approved, false, 'Should not be approved');
    });

    await asyncTest('Safety Governor allows safe commands', async () => {
        const governor = new SafetyGovernor();
        const result = await governor.evaluate('list files');
        assert.strictEqual(result.approved, true, 'Should allow safe command');
    });

    // ========================================
    // OMEGA INPUT AGENT TESTS
    // ========================================
    console.log('\n📍 OMEGA INPUT AGENT TESTS\n');
    
    test('Omega Input Agent initializes correctly', () => {
        const agent = new OmegaInputAgent({ simulationMode: true });
        assert(agent, 'Agent should exist');
        assert(agent.isSimulationMode === true, 'Should be in simulation mode');
        assert(typeof agent.pressKey === 'function', 'Should have pressKey method');
        assert(typeof agent.executeMacro === 'function', 'Should have executeMacro method');
    });

    await asyncTest('Omega Input Agent executes key presses', async () => {
        const agent = new OmegaInputAgent({ simulationMode: true });
        const result = await agent.pressKey('W', 100);
        assert(result.success === true, 'Key press should succeed');
        assert(result.simulated === true, 'Should be simulated');
    });

    await asyncTest('Omega Input Agent blocks dangerous combinations', async () => {
        const agent = new OmegaInputAgent({ simulationMode: true });
        let blocked = false;
        try {
            await agent.pressCombination(['Alt', 'F4'], 50);
        } catch (error) {
            blocked = true;
        }
        assert(blocked === true, 'Should block Alt+F4');
    });

    await asyncTest('Omega Input Agent executes macros', async () => {
        const agent = new OmegaInputAgent({ simulationMode: true });
        const macro = [
            { type: 'KEY_PRESS', key: '1', delay: 50 },
            { type: 'KEY_PRESS', key: '2', delay: 50 },
            { type: 'KEY_PRESS', key: '3', delay: 50 }
        ];
        const result = await agent.executeMacro(macro, { name: 'test' });
        assert(result.length === 3, 'Should execute all steps');
        assert(result.every(r => r.success), 'All steps should succeed');
    });

    // ========================================
    // SCREEN VISION ENGINE TESTS
    // ========================================
    console.log('\n📍 SCREEN VISION ENGINE TESTS\n');
    
    test('Screen Vision Engine initializes correctly', () => {
        const engine = new ScreenVisionEngine({ simulationMode: true });
        assert(engine, 'Engine should exist');
        assert(engine.isSimulationMode === true, 'Should be in simulation mode');
        assert(typeof engine.captureScreen === 'function', 'Should have captureScreen method');
        assert(typeof engine.detectObjects === 'function', 'Should have detectObjects method');
    });

    await asyncTest('Screen Vision Engine captures screen', async () => {
        const engine = new ScreenVisionEngine({ simulationMode: true });
        const screen = await engine.captureScreen();
        assert(screen.width === 1920, 'Should have correct width');
        assert(screen.height === 1080, 'Should have correct height');
        assert(screen.simulated === true, 'Should be simulated');
    });

    await asyncTest('Screen Vision Engine performs OCR', async () => {
        const engine = new ScreenVisionEngine({ simulationMode: true });
        const ocr = await engine.performOCR();
        assert(ocr.text.length > 0, 'Should detect text');
        assert(ocr.fullText.length > 0, 'Should have full text');
    });

    await asyncTest('Screen Vision Engine detects objects', async () => {
        const engine = new ScreenVisionEngine({ simulationMode: true });
        const objects = await engine.detectObjects(['enemy', 'item']);
        assert(objects.count > 0, 'Should detect objects');
        assert(objects.detections.length > 0, 'Should have detections array');
    });

    await asyncTest('Screen Vision Engine analyzes UI layout', async () => {
        const engine = new ScreenVisionEngine({ simulationMode: true });
        const ui = await engine.analyzeUILayout();
        assert(ui.elements.length > 0, 'Should detect UI elements');
        assert(ui.layout === 'standard_game_ui', 'Should identify layout type');
    });

    // ========================================
    // GAMEPLAY AI CONTROLLER TESTS
    // ========================================
    console.log('\n📍 GAMEPLAY AI CONTROLLER TESTS\n');
    
    test('Gameplay AI Controller initializes correctly', () => {
        const controller = new GameplayAIController({ simulationMode: true });
        assert(controller, 'Controller should exist');
        assert(controller.inputAgent, 'Should have input agent');
        assert(controller.visionEngine, 'Should have vision engine');
        assert(typeof controller.executeCombatCombo === 'function', 'Should have executeCombatCombo method');
        assert(typeof controller.startFarmingRoute === 'function', 'Should have startFarmingRoute method');
    });

    await asyncTest('Gameplay AI Controller executes combat combos', async () => {
        const controller = new GameplayAIController({ simulationMode: true });
        const result = await controller.executeCombatCombo('basicRotation');
        assert(result.length > 0, 'Should execute combo steps');
        assert(result.every(r => r.success), 'All steps should succeed');
    });

    await asyncTest('Gameplay AI Controller executes farming routes', async () => {
        const controller = new GameplayAIController({ simulationMode: true });
        const result = await controller.startFarmingRoute('herbCircle', 2);
        assert(result.length > 0, 'Should execute farming steps');
    });

    await asyncTest('Gameplay AI Controller analyzes player performance', async () => {
        const controller = new GameplayAIController({ simulationMode: true });
        const analysis = await controller.analyzePlayerPerformance({
            actionsPerMinute: 150,
            accuracy: 0.75,
            avgReactionTime: 200
        });
        assert(typeof analysis.grade === 'string', 'Should have grade');
        assert(typeof analysis.overallScore === 'number', 'Should have score');
        assert(analysis.overallScore >= 0 && analysis.overallScore <= 100, 'Score should be 0-100');
    });

    test('Gameplay AI Controller switches modes', () => {
        const controller = new GameplayAIController({ simulationMode: true, mode: 'ASSIST' });
        assert(controller.mode === 'ASSIST', 'Should start in ASSIST mode');
        
        const result = controller.switchMode('AUTONOMOUS');
        assert(result.newMode === 'AUTONOMOUS', 'Should switch to AUTONOMOUS');
        assert(controller.mode === 'AUTONOMOUS', 'Mode should be updated');
    });

    await asyncTest('Gameplay AI Controller gets game state', async () => {
        const controller = new GameplayAIController({ simulationMode: true });
        const state = await controller.getGameState();
        assert(state.health, 'Should have health data');
        assert(state.enemies, 'Should have enemies data');
        assert(state.objectives, 'Should have objectives data');
    });

    // ========================================
    // INTEGRATION TESTS
    // ========================================
    console.log('\n📍 INTEGRATION TESTS\n');

    await asyncTest('Full gameplay loop integration', async () => {
        const controller = new GameplayAIController({ 
            simulationMode: true, 
            mode: 'ASSIST',
            reactionTime: 30
        });
        
        // Get initial state
        const initialState = await controller.getGameState();
        assert(initialState.health.current === 75, 'Should have initial health');
        
        // Execute a combo
        const comboResult = await controller.executeCombatCombo('basicRotation');
        assert(comboResult.every(r => r.success), 'Combo should succeed');
        
        // Get stats
        const stats = controller.getStats();
        assert(stats.mode === 'ASSIST', 'Should track mode');
        assert(stats.availableStrategies.length > 0, 'Should have strategies');
    });

    await asyncTest('Safety integration with input agent', async () => {
        const agent = new OmegaInputAgent({ simulationMode: true });
        
        // Safe commands should work
        const safeResult = await agent.pressKey('W', 50);
        assert(safeResult.success, 'Safe command should work');
        
        // Dangerous commands should be blocked
        let dangerousBlocked = false;
        try {
            await agent.pressCombination(['Ctrl', 'Alt', 'Del'], 50);
        } catch (error) {
            dangerousBlocked = true;
        }
        assert(dangerousBlocked, 'Dangerous command should be blocked');
    });

    // ========================================
    // SUMMARY
    // ========================================
    console.log();
    console.log('='.repeat(60));
    console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(60));
    
    if (failed > 0) {
        console.log('\n❌ Some tests failed!');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
}

runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
