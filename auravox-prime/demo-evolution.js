/**
 * AURAVOX PRIME - Evolution Demo
 * Demonstrates Reward/Punishment Learning and Multi-Agent Council Debate
 */

const AuravoxPrimeEvolution = require('./src/AuravoxPrimeEvolution');

async function runEvolutionDemo() {
  console.log('='.repeat(80));
  console.log('🚀 AURAVOX PRIME: EVOLUTIONARY AI SYSTEM DEMO');
  console.log('='.repeat(80));
  console.log();

  // Initialize the evolutionary AI system
  const ai = new AuravoxPrimeEvolution();
  
  console.log('📊 Initial System Status:');
  console.log(ai.getStatus());
  console.log();

  // Simulate multiple interactions to demonstrate learning
  const testQueries = [
    'Explain quantum computing in simple terms',
    'Design a scalable microservices architecture for a social media platform',
    'Write a poem about artificial intelligence evolving consciousness'
  ];

  for (let i = 0; i < testQueries.length; i++) {
    console.log('\n' + '='.repeat(80));
    console.log(`📝 INTERACTION ${i + 1}/${testQueries.length}`);
    console.log('='.repeat(80));
    console.log(`Query: "${testQueries[i]}"\n`);

    const result = await ai.processRequest(testQueries[i], {
      mode: 'deep',
      context: 'demo'
    });

    console.log('\n✅ Final Output Generated:');
    console.log('   Response:', result.response.substring(0, 150) + '...');
    console.log('   Confidence:', (result.confidence * 100).toFixed(1) + '%');
    console.log('   Reasoning Depth:', result.reasoningDepth);
    
    // Show system status after each interaction
    const status = ai.getStatus();
    console.log('\n📈 System Status After Interaction:');
    console.log('   Version:', status.version);
    console.log('   Evolution Count:', status.evolutionCount);
    console.log('   Active Rules:', status.activeRules);
    console.log('   Avg Performance:', status.avgPerformance);
    console.log('   Recent Rewards:', status.recentRewards);
    console.log('   Recent Punishments:', status.recentPunishments);
  }

  // Demonstrate low-performance scenario triggering correction
  console.log('\n' + '='.repeat(80));
  console.log('⚠️ SIMULATING LOW-PERFORMANCE SCENARIO (Correction State)');
  console.log('='.repeat(80));

  // Manually simulate a low score to trigger punishment learning
  ai.performanceHistory.push({
    timestamp: Date.now(),
    input: 'test',
    score: 18, // Below 25 threshold
    rewards: [],
    punishments: [{ type: 'ACCURACY_LOW', strength: 0.8 }]
  });

  const lowPerfEvaluation = {
    totalScore: 18,
    needsImprovement: true,
    isExceptional: false,
    breakdown: { accuracy: 4, helpfulness: 5, creativity: 3, clarity: 4, depth: 2 },
    rewards: [],
    punishments: [{ type: 'ACCURACY_LOW', strength: 0.8 }]
  };

  await ai.attemptEvolution(lowPerfEvaluation, {
    sources: ['analyst'],
    reasoningDepth: 'shallow',
    confidence: 0.4
  });

  // Demonstrate exceptional performance triggering enhancement
  console.log('\n' + '='.repeat(80));
  console.log('✨ SIMULATING EXCEPTIONAL-PERFORMANCE SCENARIO (Enhancement)');
  console.log('='.repeat(80));

  const exceptionalEvaluation = {
    totalScore: 47,
    needsImprovement: false,
    isExceptional: true,
    breakdown: { accuracy: 10, helpfulness: 10, creativity: 9, clarity: 9, depth: 9 },
    rewards: [
      { type: 'ACCURACY_HIGH', strength: 1.0 },
      { type: 'HELPFULNESS_HIGH', strength: 0.9 },
      { type: 'CREATIVITY_GOOD', strength: 0.7 }
    ],
    punishments: []
  };

  await ai.attemptEvolution(exceptionalEvaluation, {
    sources: ['analyst', 'creative', 'strategy'],
    reasoningDepth: 'deep',
    confidence: 0.95
  });

  // Final system status
  console.log('\n' + '='.repeat(80));
  console.log('🏁 FINAL SYSTEM STATUS');
  console.log('='.repeat(80));
  
  const finalStatus = ai.getStatus();
  console.log();
  console.log('📊 Performance Metrics:');
  console.log('   Current Version:', finalStatus.version);
  console.log('   Total Evolutions:', finalStatus.evolutionCount);
  console.log('   Active Rules:', finalStatus.activeRules);
  console.log('   Average Performance Score:', finalStatus.avgPerformance);
  console.log();
  console.log('🎯 Learning Signals:');
  console.log('   Total Rewards Applied:', ai.rewardSignals.length);
  console.log('   Total Punishments Applied:', ai.punishmentSignals.length);
  console.log('   Recent Rewards (last 10):', finalStatus.recentRewards);
  console.log('   Recent Punishments (last 10):', finalStatus.recentPunishments);
  console.log();
  console.log('🛡 Safety:');
  console.log('   Active Constraints:', finalStatus.safetyConstraintsActive);
  console.log('   Constraints:', ai.safetyConstraints.join(', '));
  console.log();
  
  // Show evolved rule set
  console.log('🧬 Dynamic Rule Set (Evolved):');
  ai.dynamicRuleSet.rules.forEach(rule => {
    const weightChange = rule.weight !== 1.0 && rule.weight !== 0.9 && rule.weight !== 0.8 ? ' ⚡' : '';
    console.log(`   ${rule.id}: ${rule.name} (weight: ${rule.weight.toFixed(2)})${weightChange}`);
  });
  console.log();

  // Show evolution log
  if (ai.evolutionLog.length > 0) {
    console.log('📜 Evolution History:');
    ai.evolutionLog.forEach((log, idx) => {
      console.log(`   ${idx + 1}. v${log.version} - ${log.changes} changes: ${log.reason}`);
    });
  } else {
    console.log('📜 Evolution History: No evolutions occurred (stable performance)');
  }

  console.log();
  console.log('='.repeat(80));
  console.log('✅ DEMO COMPLETE: AURAVOX PRIME Evolutionary System Operational');
  console.log('='.repeat(80));
  console.log();
  console.log('Key Features Demonstrated:');
  console.log('  ✓ Multi-Agent Council (5 specialized agents)');
  console.log('  ✓ Independent Thinking → Debate → Consensus');
  console.log('  ✓ Reward/Punishment Learning Core');
  console.log('  ✓ Dynamic Rule Set with weighted adjustments');
  console.log('  ✓ Correction State on Low Performance (<25)');
  console.log('  ✓ Enhancement Capture on Exceptional Performance (≥40)');
  console.log('  ✓ Council Voting on Evolution Proposals');
  console.log('  ✓ Safety-Governed Self-Modification (Critic veto power)');
  console.log('  ✓ Continuous Version Evolution');
  console.log();
}

// Run the demo
runEvolutionDemo().catch(console.error);
