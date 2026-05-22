/**
 * AURAVOX Example Usage
 * Demonstrates the core system capabilities
 */

import AURAVOX from './index.js';

console.log('🚀 Starting AURAVOX Demo...\n');

// Initialize AURAVOX with adaptive mode
const auravox = new AURAVOX({
  mode: 'ADAPTIVE',
  safetyLevel: 'STANDARD',
  enableLogging: true
});

// Get initial status
console.log('\n📊 System Status:');
console.log(JSON.stringify(auravox.getStatus(), null, 2));

// Test different request types
const requests = [
  { type: 'code', description: 'Create a REST API endpoint' },
  { type: 'design', description: 'Plan microservices architecture' },
  { type: 'review', description: 'Test and validate the code' }
];

// Process requests
(async () => {
  for (const request of requests) {
    console.log('\n' + '='.repeat(50));
    console.log('📝 Processing:', request.description);
    console.log('='.repeat(50));
    
    try {
      const result = await auravox.process(request);
      console.log('\n✅ Result:');
      console.log('   Reasoning Mode:', result.reasoningMode);
      console.log('   Intent:', result.analysis.intent);
      console.log('   Complexity:', result.analysis.complexity);
      console.log('   Tasks executed:', result.results.length);
      
      for (const r of result.results) {
        console.log('   - [' + r.status + '] ' + r.agent + ': ' + r.task.description);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
  
  // Final status
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 Final System Status:');
  console.log('='.repeat(50));
  console.log(JSON.stringify(auravox.getStatus(), null, 2));
  
  // Shutdown
  await auravox.shutdown();
  console.log('\n✅ Demo completed successfully!');
})();
