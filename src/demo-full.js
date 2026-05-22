/**
 * AURAVOX Full System Demo
 * Demonstrates all core capabilities
 */

import AURAVOX from './index.js';
import { PluginSystem, builtinPlugins } from './plugins/index.js';
import { utils } from './utils/index.js';

console.log('🌟 AURAVOX - Full System Demo\n');
console.log('=' .repeat(60));

(async () => {
  // 1. Initialize AURAVOX
  console.log('\n1️⃣ INITIALIZING SYSTEM\n');
  const auravox = new AURAVOX({
    mode: 'ADAPTIVE',
    safetyLevel: 'STANDARD',
    enableLogging: true
  });

  // 2. Demonstrate Plugin System
  console.log('\n2️⃣ PLUGIN SYSTEM DEMO\n');
  const pluginSystem = new PluginSystem();
  
  // Register built-in plugins
  for (const plugin of builtinPlugins) {
    pluginSystem.register(plugin);
  }
  
  console.log('\nPlugin Statistics:');
  console.log(JSON.stringify(pluginSystem.getStats(), null, 2));

  // Execute a plugin
  const codePlugin = pluginSystem.getByCategory('coding')[0];
  if (codePlugin) {
    const result = await pluginSystem.execute(codePlugin.id, 'console.log("hello")');
    console.log('\nCodeAnalyzer Result:', result);
  }

  // 3. Process various requests through orchestrator
  console.log('\n3️⃣ ORCHESTRATOR DEMO\n');
  
  const requests = [
    { type: 'architect', description: 'Design scalable microservices architecture' },
    { type: 'builder', description: 'Build REST API with authentication' },
    { type: 'designer', description: 'Create modern dashboard UI' },
    { type: 'critic', description: 'Review code for security vulnerabilities' },
    { type: 'devops', description: 'Set up CI/CD pipeline' }
  ];

  for (const request of requests) {
    console.log('\n📝 Processing:', request.description);
    const result = await auravox.process(request);
    console.log('   → Intent:', result.analysis.intent);
    console.log('   → Mode:', result.reasoningMode);
    console.log('   → Tasks:', result.results.map(r => r.agent).join(', '));
  }

  // 4. Memory Graph Demo
  console.log('\n4️⃣ MEMORY GRAPH DEMO\n');
  const status = auravox.getStatus();
  console.log('Memory Nodes Stored:', status.memoryNodes);
  console.log('Memory Stats:', JSON.stringify(auravox.memoryGraph.getStats(), null, 2));

  // 5. Safety Governor Demo
  console.log('\n5️⃣ SAFETY GOVERNOR DEMO\n');
  const safetyTests = [
    'create a function',
    'delete temporary files',
    'rm -rf /dangerous'
  ];
  
  for (const test of safetyTests) {
    const result = await auravox.safetyGovernor.validate(test);
    console.log('   [' + result.level + '] "' + test + '" → ' + (result.approved ? '✅ Approved' : '❌ Blocked'));
  }
  
  console.log('\nSafety Stats:', JSON.stringify(auravox.safetyGovernor.getStats(), null, 2));

  // 6. Reasoning Engine Demo
  console.log('\n6️⃣ REASONING ENGINE DEMO\n');
  const reasoningStats = auravox.orchestrator.reasoningEngine.getStats();
  console.log('Reasoning Stats:', JSON.stringify(reasoningStats, null, 2));

  // 7. Utility Functions Demo
  console.log('\n7️⃣ UTILITY FUNCTIONS DEMO\n');
  const id = utils.generateId('test');
  console.log('Generated ID:', id);
  
  const timed = await utils.timeAsync(async () => {
    await utils.sleep(100);
    return 'completed';
  });
  console.log('Timed execution:', timed.duration.toFixed(2) + 'ms');

  // Final Status
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SYSTEM STATUS\n');
  console.log(JSON.stringify(auravox.getStatus(), null, 2));
  
  await auravox.shutdown();
  
  console.log('\n✅ Full system demo completed successfully!');
})();
