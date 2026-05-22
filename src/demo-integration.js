/**
 * AURAVOX - Full System Integration Demo
 * Demonstrates all core capabilities working together
 */

import OrchestratorCore from './orchestrator/OrchestratorCore.js';
import RuntimeEnvironment from './runtime/RuntimeEnvironment.js';
import LearningEngine from './runtime/LearningEngine.js';
import SimulationSandbox from './simulations/SimulationSandbox.js';
import VisionInterface from './interfaces/VisionInterface.js';
import VoiceInterface from './interfaces/VoiceInterface.js';
import DeviceControlInterface from './interfaces/DeviceControlInterface.js';

async function runFullSystemDemo() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     🚀 AURAVOX FULL SYSTEM INTEGRATION DEMO              ║');
  console.log('║     Autonomous AI Operating Ecosystem                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Initialize all systems
  console.log('📦 Initializing System Components...\n');
  
  const orchestrator = new OrchestratorCore();
  const runtime = new RuntimeEnvironment({ persistence: true, sandboxMode: true });
  const learning = new LearningEngine({ learningRate: 0.15 });
  const sandbox = new SimulationSandbox({ autoRollback: true });
  const vision = new VisionInterface({ ocrEnabled: true });
  const voice = new VoiceInterface({ emotionAdaptation: true });
  const device = new DeviceControlInterface({ sandboxMode: true });

  // Initialize runtime
  await runtime.initialize();
  console.log('');
  
  // Initialize voice
  await voice.initialize();
  console.log('');

  // Start conversation
  const conversationId = voice.startConversation();
  console.log('');

  // Demo 1: Multi-Agent Task Orchestration
  console.log('━━━ Demo 1: Multi-Agent Task Orchestration ━━━\n');
  
  const taskResult = await orchestrator.executeTask({
    id: 'demo_task_001',
    type: 'code_generation',
    description: 'Create a REST API endpoint',
    priority: 'high'
  });
  console.log('');

  // Record experience for learning
  learning.recordExperience({
    type: 'success',
    context: { taskType: 'code_generation', agentType: 'builder' },
    outcome: 'completed',
    metrics: { duration: taskResult.duration }
  });

  // Demo 2: Vision Processing
  console.log('━━━ Demo 2: Vision Processing ━━━\n');
  
  const visionResult = await vision.processImage('screenshot.png', {
    ocr: true,
    objects: true,
    uiAnalysis: true
  });
  console.log('');

  // Demo 3: Voice Interaction
  console.log('━━━ Demo 3: Voice Interaction ━━━\n');
  
  await voice.setEmotion('happy');
  const speechResult = await voice.generateSpeech(
    'Hello! I am AURAVOX, your autonomous AI assistant.',
    { emotion: 'happy' }
  );
  console.log('');

  // Demo 4: Device Control with Safety
  console.log('━━━ Demo 4: Device Control (Sandbox Mode) ━━━\n');
  
  const appResult = await device.openApp('text-editor');
  console.log('');

  const commandResult = await device.executeCommand('echo "Hello AURAVOX"');
  console.log('');

  // Test blocked command
  const blockedResult = await device.executeCommand('rm -rf /dangerous');
  console.log('');

  // Demo 5: Simulation Sandbox
  console.log('━━━ Demo 5: Simulation Sandbox ━━━\n');
  
  const simResult = await sandbox.runSimulation(
    'workflow_test',
    async (state, logger) => {
      logger.log('Step 1: Validating input...');
      logger.log('Step 2: Processing data...');
      logger.log('Step 3: Generating output...');
      return { completed: true, items: 42 };
    },
    { testData: [1, 2, 3] }
  );
  console.log('');

  // Demo 6: Learning Engine Analysis
  console.log('━━━ Demo 6: Learning Engine Analysis ━━━\n');
  
  // Record more experiences
  learning.recordExperience({
    type: 'success',
    context: { taskType: 'vision_processing', agentType: 'vision' },
    outcome: 'completed',
    metrics: { duration: visionResult.duration }
  });

  learning.recordExperience({
    type: 'failure',
    context: { taskType: 'device_control', agentType: 'device', errorType: 'blocked' },
    outcome: 'blocked_for_safety',
    metrics: {}
  });

  // Run improvement cycle
  await learning.runImprovementCycle();
  console.log('');

  const insights = learning.getInsights();
  console.log(`📊 Learning Insights:`);
  console.log(`   Total Experiences: ${insights.totalExperiences}`);
  console.log(`   Patterns Recognized: ${insights.patternsRecognized}`);
  console.log(`   Improvements Pending: ${insights.improvementsPending}`);
  console.log('');

  // Display System Statistics
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║              📈 SYSTEM STATISTICS                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  console.log('🎯 Orchestrator:');
  const orchStats = orchestrator.getStats();
  console.log(`   Tasks Completed: ${orchStats.tasksCompleted}`);
  console.log(`   Active Agents: ${orchStats.activeAgents}`);
  console.log(`   Average Response: ${orchStats.averageResponseTime}`);
  console.log('');

  console.log('⚙️ Runtime:');
  const runtimeStats = runtime.getStats();
  console.log(`   Status: ${runtimeStats.status}`);
  console.log(`   Uptime: ${runtimeStats.uptime}`);
  console.log(`   Memory: ${runtimeStats.memoryUsage}`);
  console.log(`   Tasks Completed: ${runtimeStats.completedTasks}`);
  console.log('');

  console.log('🧠 Learning Engine:');
  console.log(`   Experiences: ${insights.totalExperiences}`);
  console.log(`   Patterns: ${insights.patternsRecognized}`);
  console.log('');

  console.log('🧪 Simulation Sandbox:');
  const sandboxStats = sandbox.getStats();
  console.log(`   Simulations Run: ${sandboxStats.simulationsRun}`);
  console.log(`   Success Rate: ${Math.round((sandboxStats.successfulSimulations / Math.max(1, sandboxStats.simulationsRun)) * 100)}%`);
  console.log(`   Rollbacks: ${sandboxStats.rollbacksPerformed}`);
  console.log('');

  console.log('👁 Vision Interface:');
  const visionStats = vision.getStats();
  console.log(`   Images Processed: ${visionStats.imagesProcessed}`);
  console.log(`   OCR Operations: ${visionStats.ocrOperations}`);
  console.log(`   Objects Detected: ${visionStats.objectsDetected}`);
  console.log('');

  console.log('🎙 Voice Interface:');
  const voiceStats = voice.getStats();
  console.log(`   Conversations: ${voiceStats.conversationsCount}`);
  console.log(`   Messages Spoken: ${voiceStats.messagesSpoken}`);
  console.log(`   Messages Heard: ${voiceStats.messagesHeard}`);
  console.log(`   Current Emotion: ${voiceStats.currentEmotion}`);
  console.log('');

  console.log('🖥 Device Control:');
  const deviceStats = device.getStats();
  console.log(`   Commands Executed: ${deviceStats.commandsExecuted}`);
  console.log(`   Commands Blocked: ${deviceStats.commandsBlocked}`);
  console.log(`   Apps Opened: ${deviceStats.appsOpened}`);
  console.log(`   Active Sessions: ${deviceStats.activeSessions}`);
  console.log('');

  // End conversation
  const conversationSummary = voice.endConversation();
  console.log('');

  // Stop runtime gracefully
  await runtime.stop();
  console.log('');

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     ✅ AURAVOX DEMO COMPLETED SUCCESSFULLY               ║');
  console.log('║     All systems operational and integrated               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  return {
    success: true,
    components: [
      'OrchestratorCore',
      'RuntimeEnvironment', 
      'LearningEngine',
      'SimulationSandbox',
      'VisionInterface',
      'VoiceInterface',
      'DeviceControlInterface'
    ],
    stats: {
      orchestrator: orchStats,
      runtime: runtimeStats,
      learning: insights,
      sandbox: sandboxStats,
      vision: visionStats,
      voice: voiceStats,
      device: deviceStats
    }
  };
}

// Run the demo
runFullSystemDemo()
  .then(result => {
    console.log('🎉 System demo finished successfully!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Demo failed:', error);
    process.exit(1);
  });
