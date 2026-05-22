/**
 * AURAVOX PRIME - Media Generation Engine Demo
 * Demonstrates scene-based cinematic pipeline generation
 */

const MediaGenerationEngine = require('../src/MediaGenerationEngine');

console.log('======================================================================');
console.log('🎬 AURAVOX PRIME - MEDIA GENERATION ENGINE DEMO');
console.log('======================================================================\n');

// Initialize engine
const engine = new MediaGenerationEngine();

// Demo 1: Create a complete movie project
console.log('\n📍 DEMO 1: CREATE CINEMATIC PROJECT');
console.log('--------------------------------------------------');

const project = engine.createProject({
  title: 'Neon Dreams',
  theme: 'Cyberpunk Sci-Fi',
  style: 'cinematic',
  duration: '5 minutes'
});

// Add story arcs
const beginning = engine.addArc(project.id, { 
  type: 'Beginning', 
  description: 'Introduction to the neon city world' 
});

const conflict = engine.addArc(project.id, { 
  type: 'Conflict', 
  description: 'Hero discovers conspiracy' 
});

const climax = engine.addArc(project.id, { 
  type: 'Climax', 
  description: 'Final confrontation' 
});

const resolution = engine.addArc(project.id, { 
  type: 'Resolution', 
  description: 'Resolution and aftermath' 
});

// Add scenes to Beginning arc
engine.addScene(project.id, beginning.id, {
  visual: 'Neon city awakening at night with flying vehicles',
  environment: 'Neo Tokyo Streets',
  characters: [
    { name: 'Kai', description: 'Protagonist in black trench coat' }
  ],
  action: 'Kai walks through crowded market',
  camera: 'Wide aerial establishing shot transitioning to medium',
  mood: 'Mysterious',
  audioCues: ['ambient synth', 'distant traffic', 'crowd murmur'],
  duration: '45s'
});

engine.addScene(project.id, beginning.id, {
  visual: 'Kai receives mysterious data chip from hooded figure',
  environment: 'Dark Alley',
  characters: [
    { name: 'Kai', description: 'Protagonist in black trench coat' },
    { name: 'Informant', description: 'Hooded mysterious figure' }
  ],
  action: 'Secret exchange in shadows',
  camera: 'Close-up on hands, then wide shot',
  mood: 'Tense',
  audioCues: ['rain dripping', 'low synth drone', 'whispered dialogue'],
  duration: '60s'
});

// Add scenes to Conflict arc
engine.addScene(project.id, conflict.id, {
  visual: 'Kai discovers truth about the data chip',
  environment: 'Abandoned Warehouse',
  characters: [
    { name: 'Kai', description: 'Protagonist in black trench coat' }
  ],
  action: 'Kai plugs into terminal, holographic display reveals conspiracy',
  camera: 'Over-the-shoulder then dramatic push-in',
  mood: 'Shocked',
  audioCues: ['electronic hum', 'dramatic sting', 'heartbeat bass'],
  duration: '90s'
});

engine.addScene(project.id, conflict.id, {
  visual: 'Corporate drones burst through windows',
  environment: 'Abandoned Warehouse',
  characters: [
    { name: 'Kai', description: 'Protagonist in black trench coat' },
    { name: 'Security Drones', description: 'Menacing corporate enforcers' }
  ],
  action: 'Kai dodges laser fire, returns fire with plasma pistol',
  camera: 'Dynamic handheld action shots',
  mood: 'Exciting',
  audioCues: ['explosions', 'laser blasts', 'intense percussion'],
  duration: '120s'
});

// Add scenes to Climax arc
engine.addScene(project.id, climax.id, {
  visual: 'Rooftop confrontation with CEO villain',
  environment: 'Corporate Tower Rooftop',
  characters: [
    { name: 'Kai', description: 'Protagonist in black trench coat' },
    { name: 'CEO Vance', description: 'Antagonist in expensive suit' }
  ],
  action: 'Final showdown with philosophical debate over city future',
  camera: 'Epic wide shots with city backdrop',
  mood: 'Dramatic',
  audioCues: ['swelling orchestra', 'wind howling', 'thunder'],
  duration: '180s'
});

// Add scenes to Resolution arc
engine.addScene(project.id, resolution.id, {
  visual: 'Sunrise over transformed city',
  environment: 'Neo Tokyo Streets',
  characters: [
    { name: 'Kai', description: 'Protagonist in black trench coat' }
  ],
  action: 'Kai walks away as city begins to change for better',
  camera: 'Slow pull-back to wide establishing',
  mood: 'Hopeful',
  audioCues: ['uplifting strings', 'birds chirping', 'gentle wind'],
  duration: '60s'
});

console.log(`\n✅ Project Structure Created`);
console.log(`   Title: ${project.title}`);
console.log(`   Total Arcs: ${project.arcs.length}`);
console.log(`   Total Scenes: ${project.scenes.length}`);

// Demo 2: Generate images for key scenes
console.log('\n\n📍 DEMO 2: GENERATE SCENE IMAGES');
console.log('--------------------------------------------------');

async function runImageDemo() {
  const images = await engine.generateSceneImages(project.id, 'S01');
  console.log(`\n🖼️ Generated ${images.length} image assets:`);
  images.forEach(img => {
    console.log(`   - ${img.type}: ${img.prompt?.substring(0, 80)}...`);
  });
}

// Demo 3: Generate video sequence
console.log('\n\n📍 DEMO 3: GENERATE VIDEO SEQUENCE');
console.log('--------------------------------------------------');

async function runVideoDemo() {
  const sequence = await engine.generateVideoSequence(project.id);
  console.log(`\n🎬 Video Sequence Generated:`);
  console.log(`   Total Duration: ${sequence.totalDuration}`);
  console.log(`   Clips: ${sequence.clips.length}`);
  console.log(`   Transitions: ${sequence.transitions.length}`);
  
  console.log('\n   Clip Breakdown:');
  sequence.clips.forEach((clip, i) => {
    console.log(`   ${i+1}. Scene ${clip.sceneId}: ${clip.visual.substring(0, 50)}... (${clip.duration})`);
  });
  
  console.log('\n   Transitions:');
  sequence.transitions.forEach(t => {
    console.log(`   - ${t.from} → ${t.to}: ${t.type}`);
  });
}

// Demo 4: Generate adaptive audio track
console.log('\n\n📍 DEMO 4: GENERATE ADAPTIVE AUDIO TRACK');
console.log('--------------------------------------------------');

async function runAudioDemo() {
  const audioTrack = await engine.generateAudioTrack(project.id, { bpm: 110, key: 'D minor' });
  console.log(`\n🎵 Audio Track Generated:`);
  console.log(`   Duration: ${audioTrack.duration}`);
  console.log(`   BPM: ${audioTrack.bpm}`);
  console.log(`   Key: ${audioTrack.key}`);
  console.log(`   Layers: ${audioTrack.layers.length}`);
  
  console.log('\n   Mood-Based Layers:');
  audioTrack.layers.forEach((layer, i) => {
    console.log(`   ${i+1}. Scene ${layer.sceneId}: Intensity ${layer.intensity}, Instruments: ${layer.instruments.join(', ')}`);
  });
}

// Demo 5: Continuity report
console.log('\n\n📍 DEMO 5: CONTINUITY QUALITY CHECK');
console.log('--------------------------------------------------');

function runContinuityDemo() {
  const report = engine.getContinuityReport(project.id);
  console.log(`\n📊 Continuity Report:`);
  console.log(`   Characters Tracked: ${report.characters.length}`);
  console.log(`   Locations Used: ${report.locations.length}`);
  console.log(`   Potential Issues: ${report.potentialIssues.length}`);
  
  console.log('\n   Character Appearances:');
  report.characters.forEach(char => {
    console.log(`   - ${char.name}: ${char.appearances} appearances (First: ${char.firstAppearance})`);
  });
  
  console.log('\n   Location Usage:');
  report.locations.forEach(loc => {
    console.log(`   - ${loc.name}: ${loc.appearances} variations`);
  });
  
  if (report.potentialIssues.length > 0) {
    console.log('\n   ⚠️ Potential Issues:');
    report.potentialIssues.forEach(issue => {
      console.log(`   - ${issue.type}: ${issue.details}`);
    });
  } else {
    console.log('\n   ✅ No continuity issues detected!');
  }
}

// Demo 6: Export project
console.log('\n\n📍 DEMO 6: EXPORT PROJECT STRUCTURE');
console.log('--------------------------------------------------');

function runExportDemo() {
  const exportData = engine.exportProject(project.id);
  console.log(`\n📦 Project Exported:`);
  console.log(`   Format: JSON`);
  console.log(`   Project: ${exportData.project.title}`);
  console.log(`   Theme: ${exportData.project.theme}`);
  console.log(`   Style: ${exportData.project.style}`);
  console.log(`   Total Scenes: ${exportData.assets.totalScenes}`);
  console.log(`   Generated Images: ${exportData.assets.generatedImages}`);
}

// Demo 7: Episodic series for long content
console.log('\n\n📍 DEMO 7: EPISODIC SERIES (LONG-FORM CONTENT)');
console.log('--------------------------------------------------');

function runEpisodicDemo() {
  const series = engine.createEpisodicSeries({
    title: 'Chronicles of Neo Tokyo',
    totalDuration: '4 hours',
    episodeDuration: '20 minutes',
    theme: 'Cyberpunk Epic',
    style: 'cinematic'
  });
  
  console.log(`\n📺 Episodic Series Created:`);
  console.log(`   Series: ${series.seriesTitle}`);
  console.log(`   Total Episodes: ${series.totalEpisodes}`);
  console.log(`   Shared Continuity: ${series.sharedContinuity ? 'Yes' : 'No'}`);
  console.log(`\n   Episode List:`);
  series.episodeProjects.forEach(ep => {
    console.log(`   - Episode ${ep.number}: ${ep.title}`);
  });
}

// Run all demos
(async () => {
  await runImageDemo();
  await runVideoDemo();
  await runAudioDemo();
  runContinuityDemo();
  runExportDemo();
  runEpisodicDemo();
  
  console.log('\n\n======================================================================');
  console.log('✅ MEDIA GENERATION DEMO COMPLETE');
  console.log('======================================================================');
  console.log('\nThe Media Generation Engine successfully:');
  console.log('  ✓ Created structured cinematic project with arcs and scenes');
  console.log('  ✓ Tracked character and location continuity');
  console.log('  ✓ Generated image prompts with style consistency');
  console.log('  ✓ Built video sequence with intelligent transitions');
  console.log('  ✓ Composed adaptive audio track based on scene moods');
  console.log('  ✓ Performed quality assurance continuity check');
  console.log('  ✓ Exported complete project structure');
  console.log('  ✓ Split long-form content into episodic series');
  console.log('\n🎬 Ready for production-scale media generation!\n');
})();
