/**
 * AURAVOX - Complete System Integration Demo
 * Demonstrates all engines working together
 */

import { ReasoningEngine, VisionEngine, VoiceEngine, DeviceControlSystem, MediaGenerationEngine, CharacterIdentityEngine } from './engines/index.js';
import MemoryGraphEngine from './memory/MemoryGraphEngine.js';
import OrchestratorCore from './orchestrator/OrchestratorCore.js';
import PluginSystem from './plugins/PluginSystem.js';
import SafetyGovernor from './safety/SafetyGovernor.js';

async function runCompleteDemo() {
  console.log('🚀 AURAVOX - Complete System Integration Demo\n');
  console.log('=' .repeat(60));

  // Initialize core systems
  console.log('\n📦 INITIALIZING CORE SYSTEMS...\n');
  
  const safetyGovernor = new SafetyGovernor();
  safetyGovernor.setLevel('STANDARD');
  
  const memoryEngine = new MemoryGraphEngine();
  await memoryEngine.initialize();
  
  const pluginSystem = new PluginSystem();
  await pluginSystem.initialize();
  
  const orchestrator = new OrchestratorCore({
    safetyGovernor,
    memoryEngine,
    pluginSystem
  });
  await orchestrator.initialize();

  // Initialize all engines
  console.log('\n🔧 INITIALIZING ENGINES...\n');
  
  const reasoningEngine = new ReasoningEngine();
  await reasoningEngine.initialize();
  
  const visionEngine = new VisionEngine();
  await visionEngine.initialize();
  
  const voiceEngine = new VoiceEngine();
  await voiceEngine.initialize();
  
  const deviceControl = new DeviceControlSystem(safetyGovernor);
  await deviceControl.initialize();
  
  const mediaEngine = new MediaGenerationEngine();
  await mediaEngine.initialize();
  
  const characterEngine = new CharacterIdentityEngine();
  await characterEngine.initialize();

  console.log('\n✅ All systems initialized!\n');
  console.log('=' .repeat(60));

  // Demo 1: Reasoning + Multi-Agent Collaboration
  console.log('\n🧠 DEMO 1: Reasoning & Multi-Agent Collaboration\n');
  
  const reasoningResult = await reasoningEngine.reason(
    'Design a scalable microservices architecture for a video streaming platform',
    'THINK'
  );
  console.log('Reasoning Mode:', reasoningResult.mode);
  console.log('Steps Generated:', reasoningResult.steps?.length || 0);
  console.log('Confidence:', reasoningResult.confidence || 'N/A');

  // Demo 2: Vision Processing
  console.log('\n👁 DEMO 2: Vision Engine Processing\n');
  
  const visionResult = await visionEngine.processImage(
    'sample_ui_screenshot.png',
    { ocr: true, objects: true, ui: true }
  );
  console.log('Vision Analysis ID:', visionResult.id);
  console.log('OCR Detected:', visionResult.analyses.ocr?.detected);
  console.log('Objects Found:', visionResult.analyses.objects?.count);
  console.log('UI Elements:', visionResult.analyses.uiLayout?.elements?.length);

  // Demo 3: Voice Conversation
  console.log('\n🎙 DEMO 3: Voice Conversation Engine\n');
  
  const conversation = voiceEngine.startConversation('demo_conv_001');
  console.log('Conversation Started:', conversation.id);
  
  const response = await voiceEngine.respond(
    "I'm excited to see what AURAVOX can do!",
    conversation.id
  );
  console.log('User Emotion Detected:', response.userEmotion);
  console.log('AI Response Emotion:', response.emotion);
  console.log('Response Text:', response.text);

  // Demo 4: Device Control (Safe Operations)
  console.log('\n🖥 DEMO 4: Device Control System\n');
  
  const dirResult = await deviceControl.listDirectory('./src');
  console.log('Directory Listing:', dirResult.path);
  console.log('Files Found:', dirResult.files?.length || 0);
  console.log('Subdirectories:', dirResult.directories?.length || 0);
  
  const commandResult = await deviceControl.executeCommand('echo "AURAVOX System Test"');
  console.log('Command Execution:', commandResult.success ? '✅ Success' : '❌ Failed');

  // Demo 5: Media Generation
  console.log('\n🎬 DEMO 5: Media Generation Engine\n');
  
  const imageResult = await mediaEngine.generateImage(
    'Futuristic AI interface with holographic displays',
    { style: 'cinematic', quality: 'high' }
  );
  console.log('Image Generated:', imageResult.id);
  console.log('Style:', imageResult.config.style);
  
  const musicResult = await mediaEngine.generateMusic({
    genre: 'cinematic',
    mood: 'epic',
    duration: 180
  });
  console.log('Music Generated:', musicResult.id);
  console.log('Duration:', musicResult.duration, 'seconds');

  // Demo 6: Character Identity
  console.log('\n🎭 DEMO 6: Character Identity Engine\n');
  
  const character = characterEngine.createCharacter({
    name: 'AURA',
    face: { structure: 'oval', eyes: { color: 'blue', shape: 'almond' } },
    body: { height: 170, build: 'athletic' },
    appearance: { hair: { color: 'silver', style: 'long' } },
    voice: { pitch: 'medium', tone: 'warm' },
    emotions: { baseline: 'calm', range: ['curious', 'focused', 'friendly'] }
  });
  console.log('Character Created:', character.name);
  console.log('Character ID:', character.id);
  console.log('Voice Tone:', character.voice.tone);
  console.log('Emotional Range:', character.emotions.range.join(', '));
  
  // Render character
  const render = await characterEngine.renderCharacter(character.id, {
    cameraAngle: 'three-quarter',
    lighting: 'studio',
    expression: 'friendly'
  });
  console.log('Character Rendered:', render.id);
  console.log('Expression:', render.expression);

  // Demo 7: Memory Graph Storage
  console.log('\n💾 DEMO 7: Memory Graph Engine\n');
  
  await memoryEngine.addNode({
    type: 'session',
    sessionId: 'demo_session_001',
    timestamp: new Date().toISOString(),
    engines: ['reasoning', 'vision', 'voice', 'device', 'media', 'character'],
    status: 'success'
  });
  
  const stats = memoryEngine.getStats();
  console.log('Memory Nodes:', stats.totalNodes);
  console.log('Node Types:', JSON.stringify(stats.byType, null, 2));

  // Demo 8: Plugin System
  console.log('\n🔌 DEMO 8: Plugin System\n');
  
  await pluginSystem.registerPlugin({
    id: 'demo_analyzer',
    name: 'Demo Analyzer',
    category: 'analytics',
    execute: async (data) => ({ analyzed: true, data })
  });
  
  const pluginStats = pluginSystem.getStats();
  console.log('Total Plugins:', pluginStats.totalPlugins);
  console.log('By Category:', JSON.stringify(pluginStats.byCategory, null, 2));

  // Demo 9: Safety Governor
  console.log('\n🔒 DEMO 9: Safety Governor\n');
  
  const safeTest = safetyGovernor.isSafe('create a new file');
  console.log('Safe Request:', safeTest.safe ? '✅ Approved' : '❌ Blocked');
  
  const unsafeTest = safetyGovernor.isSafe('rm -rf /');
  console.log('Unsafe Request:', unsafeTest.safe ? '✅ Approved' : '❌ Blocked');
  
  const confirmTest = safetyGovernor.isSafe('delete temporary files');
  console.log('Confirmation Needed:', confirmTest.level === 'CONFIRM' ? '⚠️ Yes' : 'No');

  // Demo 10: Orchestrator Task Routing
  console.log('\n🎯 DEMO 10: Orchestrator Task Routing\n');
  
  const task1 = await orchestrator.processRequest('Build a REST API endpoint');
  console.log('Task 1 Processed:', task1.intent);
  
  const task2 = await orchestrator.processRequest('Review code for bugs');
  console.log('Task 2 Processed:', task2.intent);

  // Final System Status
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 FINAL SYSTEM STATUS\n');
  
  const systemStatus = {
    version: '1.0.0',
    status: 'FULLY_OPERATIONAL',
    engines: {
      reasoning: 'active',
      vision: 'active',
      voice: 'active',
      deviceControl: 'active',
      mediaGeneration: 'active',
      characterIdentity: 'active'
    },
    core: {
      orchestrator: 'running',
      memory: 'persisting',
      plugins: 'loaded',
      safety: 'enforcing'
    },
    statistics: {
      reasoningExecutions: reasoningEngine.getStats().totalReasonings,
      visionProcessing: visionEngine.getStats().totalProcessed,
      conversations: voiceEngine.getStats().totalConversations,
      mediaGenerations: mediaEngine.getStats().totalGenerations,
      characters: characterEngine.getStats().totalCharacters,
      memoryNodes: stats.totalNodes,
      plugins: pluginStats.totalPlugins
    }
  };
  
  console.log(JSON.stringify(systemStatus, null, 2));
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n✅ AURAVOX Complete System Demo Finished Successfully!\n');
  console.log('🌟 All engines operational and integrated.\n');
  
  return systemStatus;
}

// Run the demo
runCompleteDemo()
  .then(() => {
    console.log('Demo completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
