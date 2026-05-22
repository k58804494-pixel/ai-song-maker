/**
 * AURAVOX PRIME - Media Generation Engine Tests
 */

const MediaGenerationEngine = require('../src/MediaGenerationEngine');

console.log('📍 MEDIA GENERATION ENGINE TESTS\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// Test 1: Engine initialization
test('Media Generation Engine initializes correctly', () => {
  const engine = new MediaGenerationEngine();
  if (!engine.projects) throw new Error('Projects map not initialized');
  if (!engine.continuityMemory) throw new Error('Continuity memory not initialized');
  if (!engine.stylePresets) throw new Error('Style presets not initialized');
});

// Test 2: Create project
test('Create project with arcs and scenes', () => {
  const engine = new MediaGenerationEngine();
  
  const project = engine.createProject({
    title: 'Test Movie',
    theme: 'Sci-Fi',
    style: 'cinematic',
    duration: '10 minutes'
  });
  
  if (!project.id) throw new Error('Project ID not generated');
  if (project.title !== 'Test Movie') throw new Error('Title mismatch');
  if (project.style !== 'cinematic') throw new Error('Style mismatch');
});

// Test 3: Add arcs
test('Add story arcs to project', () => {
  const engine = new MediaGenerationEngine();
  
  const project = engine.createProject({ title: 'Arc Test' });
  
  const beginning = engine.addArc(project.id, { type: 'Beginning', description: 'Introduction' });
  const conflict = engine.addArc(project.id, { type: 'Conflict', description: 'Rising action' });
  const climax = engine.addArc(project.id, { type: 'Climax', description: 'Peak tension' });
  
  if (project.arcs.length !== 3) throw new Error('Expected 3 arcs');
  if (beginning.type !== 'Beginning') throw new Error('Arc type mismatch');
});

// Test 4: Add scenes
test('Add scenes to arcs with full details', () => {
  const engine = new MediaGenerationEngine();
  
  const project = engine.createProject({ title: 'Scene Test' });
  const arc = engine.addArc(project.id, { type: 'Beginning' });
  
  const scene = engine.addScene(project.id, arc.id, {
    visual: 'Neon city at night with flying cars',
    environment: 'Cyberpunk City',
    characters: [
      { name: 'Hero', description: 'Protagonist in black coat' },
      { name: 'Sidekick', description: 'Tech expert' }
    ],
    action: 'Characters walk through market',
    camera: 'Wide establishing shot',
    mood: 'Mysterious',
    audioCues: ['ambient synth', 'distant traffic'],
    duration: '45s'
  });
  
  if (scene.id !== 'S01') throw new Error('Scene ID should be S01');
  if (scene.characters.length !== 2) throw new Error('Expected 2 characters');
  if (scene.mood !== 'Mysterious') throw new Error('Mood mismatch');
});

// Test 5: Character continuity tracking
test('Character continuity tracking works', () => {
  const engine = new MediaGenerationEngine();
  
  const project = engine.createProject({ title: 'Continuity Test' });
  const arc = engine.addArc(project.id, { type: 'Beginning' });
  
  // Add character in scene 1
  engine.addScene(project.id, arc.id, {
    visual: 'Room interior',
    environment: 'Apartment',
    characters: [{ name: 'Detective' }],
    action: 'Detective enters room'
  });
  
  // Add same character in scene 2
  engine.addScene(project.id, arc.id, {
    visual: 'Office',
    environment: 'Police Station',
    characters: [{ name: 'Detective' }],
    action: 'Detective reviews files'
  });
  
  const continuity = engine.continuityMemory.get(project.id);
  const detectiveData = continuity.characters.get('Detective');
  
  if (!detectiveData) throw new Error('Character not tracked');
  if (detectiveData.appearances.length !== 2) throw new Error('Expected 2 appearances');
  if (detectiveData.firstAppearance !== 'S01') throw new Error('First appearance wrong');
});

// Test 6: Generate scene images
test('Generate scene images with prompts', async () => {
  const engine = new MediaGenerationEngine();
  
  const project = engine.createProject({ title: 'Image Test', style: 'cinematic' });
  const arc = engine.addArc(project.id, { type: 'Beginning' });
  
  engine.addScene(project.id, arc.id, {
    visual: 'Sunset over mountains',
    environment: 'Mountain Range',
    characters: [{ name: 'Traveler' }],
    camera: 'Panoramic shot',
    mood: 'Peaceful'
  });
  
  const images = await engine.generateSceneImages(project.id, 'S01');
  
  if (images.length === 0) throw new Error('No images generated');
  if (!images[0].prompt) throw new Error('Image prompt missing');
  if (!images[0].prompt.includes('teal-orange')) throw new Error('Style not in prompt');
});

// Test 7: Generate video sequence
test('Generate video sequence from scenes', async () => {
  const engine = new MediaGenerationEngine();
  
  const project = engine.createProject({ title: 'Video Test' });
  const arc = engine.addArc(project.id, { type: 'Beginning' });
  
  engine.addScene(project.id, arc.id, {
    visual: 'City street',
    environment: 'Urban',
    action: 'Car chase begins',
    camera: 'Tracking shot',
    mood: 'Exciting',
    duration: '60s'
  });
  
  engine.addScene(project.id, arc.id, {
    visual: 'Highway',
    environment: 'Highway',
    action: 'Chase continues',
    camera: 'Aerial view',
    mood: 'Exciting',
    duration: '90s'
  });
  
  const sequence = await engine.generateVideoSequence(project.id);
  
  if (sequence.clips.length !== 2) throw new Error('Expected 2 clips');
  if (sequence.transitions.length !== 1) throw new Error('Expected 1 transition');
  if (sequence.status !== 'READY') throw new Error('Status should be READY');
});

// Test 8: Transition determination
test('Transition types determined correctly', () => {
  const engine = new MediaGenerationEngine();
  
  // Same environment = cut
  const transition1 = engine._determineTransition(
    { environment: 'City', mood: 'Exciting' },
    { environment: 'City', mood: 'Exciting' }
  );
  if (transition1 !== 'cut') throw new Error('Same environment should use cut');
  
  // Different mood = dissolve (same environment, different mood)
  const transition2 = engine._determineTransition(
    { environment: 'City', mood: 'Happy' },
    { environment: 'City', mood: 'Sad' }
  );
  if (transition2 !== 'dissolve') throw new Error(`Different mood should use dissolve, got ${transition2}`);
  
  // Different environment, same mood = crossfade
  const transition3 = engine._determineTransition(
    { environment: 'City', mood: 'Happy' },
    { environment: 'Forest', mood: 'Happy' }
  );
  if (transition3 !== 'crossfade') throw new Error(`Different environment same mood should use crossfade, got ${transition3}`);
});

// Test 9: Generate audio track
test('Generate adaptive audio track', async () => {
  const engine = new MediaGenerationEngine();
  
  const project = engine.createProject({ title: 'Audio Test' });
  const arc = engine.addArc(project.id, { type: 'Beginning' });
  
  engine.addScene(project.id, arc.id, {
    visual: 'Dark alley',
    environment: 'Alley',
    action: 'Suspense builds',
    mood: 'Tense',
    duration: '30s'
  });
  
  engine.addScene(project.id, arc.id, {
    visual: 'Explosion',
    environment: 'Street',
    action: 'Action peaks',
    mood: 'Exciting',
    duration: '45s'
  });
  
  const audioTrack = await engine.generateAudioTrack(project.id, { bpm: 140 });
  
  if (audioTrack.layers.length !== 2) throw new Error('Expected 2 audio layers');
  if (audioTrack.bpm !== 140) throw new Error('BPM mismatch');
  if (audioTrack.layers[0].intensity !== 0.8) throw new Error('Tense mood intensity wrong');
  if (audioTrack.layers[1].intensity !== 0.9) throw new Error('Exciting mood intensity wrong');
});

// Test 10: Export project
test('Export project as structured data', () => {
  const engine = new MediaGenerationEngine();
  
  const project = engine.createProject({ 
    title: 'Export Test',
    theme: 'Adventure',
    style: 'realistic'
  });
  
  const arc = engine.addArc(project.id, { type: 'Beginning' });
  
  engine.addScene(project.id, arc.id, {
    visual: 'Jungle',
    environment: 'Rainforest',
    characters: [{ name: 'Explorer' }],
    action: 'Discovery',
    mood: 'Wonder'
  });
  
  const exportData = engine.exportProject(project.id);
  
  if (!exportData.project) throw new Error('Project data missing');
  if (!exportData.structure) throw new Error('Structure missing');
  if (!exportData.continuity) throw new Error('Continuity data missing');
  if (exportData.structure.arcs.length !== 1) throw new Error('Arc count wrong');
});

// Test 11: Episodic series creation
test('Create episodic series for long content', () => {
  const engine = new MediaGenerationEngine();
  
  const series = engine.createEpisodicSeries({
    title: 'Long Series',
    totalDuration: '2 hours',
    episodeDuration: '10 minutes',
    theme: 'Drama',
    style: 'cinematic'
  });
  
  if (series.totalEpisodes !== 12) throw new Error(`Expected 12 episodes, got ${series.totalEpisodes}`);
  if (!series.sharedContinuity) throw new Error('Shared continuity flag missing');
});

// Test 12: Continuity report generation
test('Generate continuity report', () => {
  const engine = new MediaGenerationEngine();
  
  const project = engine.createProject({ title: 'Report Test' });
  const arc = engine.addArc(project.id, { type: 'Beginning' });
  
  // Add multiple scenes with recurring character (need >5 scenes for warning)
  engine.addScene(project.id, arc.id, {
    visual: 'Scene 1',
    environment: 'Location A',
    characters: [{ name: 'Main' }],
    action: 'Start'
  });
  
  engine.addScene(project.id, arc.id, {
    visual: 'Scene 2',
    environment: 'Location B',
    characters: [{ name: 'Main' }],
    action: 'Continue'
  });
  
  engine.addScene(project.id, arc.id, {
    visual: 'Scene 3',
    environment: 'Location C',
    characters: [{ name: 'Main' }],
    action: 'More action'
  });
  
  engine.addScene(project.id, arc.id, {
    visual: 'Scene 4',
    environment: 'Location D',
    characters: [{ name: 'Main' }],
    action: 'Even more'
  });
  
  engine.addScene(project.id, arc.id, {
    visual: 'Scene 5',
    environment: 'Location E',
    characters: [{ name: 'Main' }],
    action: 'Almost done'
  });
  
  engine.addScene(project.id, arc.id, {
    visual: 'Scene 6',
    environment: 'Location F',
    characters: [{ name: 'Supporting' }],
    action: 'New character appears once'
  });
  
  const report = engine.getContinuityReport(project.id);
  
  if (report.characters.length !== 2) throw new Error('Expected 2 characters');
  if (report.locations.length !== 6) throw new Error('Expected 6 locations');
  
  // Check for single appearance warning (project has 6 scenes > 5)
  const singleAppWarning = report.potentialIssues.find(
    i => i.type === 'SINGLE_APPEARANCE_CHARACTER'
  );
  if (!singleAppWarning) throw new Error('Missing single appearance warning for Supporting character');
});

// Test 13: Style consistency
test('Style presets applied correctly', () => {
  const engine = new MediaGenerationEngine();
  
  const cinematicProject = engine.createProject({ title: 'Cinematic', style: 'cinematic' });
  const animeProject = engine.createProject({ title: 'Anime', style: 'anime' });
  const noirProject = engine.createProject({ title: 'Noir', style: 'noir' });
  
  const cinematicStyle = engine.continuityMemory.get(cinematicProject.id).visualStyle;
  const animeStyle = engine.continuityMemory.get(animeProject.id).visualStyle;
  const noirStyle = engine.continuityMemory.get(noirProject.id).visualStyle;
  
  if (cinematicStyle.colorGrade !== 'teal-orange') throw new Error('Cinematic style wrong');
  if (cinematicStyle.aspectRatio !== '2.39:1') throw new Error('Cinematic aspect ratio wrong');
  if (!animeStyle.lineArt) throw new Error('Anime lineArt flag missing');
  if (noirStyle.colorGrade !== 'bw-high-contrast') throw new Error('Noir style wrong');
});

// Test 14: Duration calculation
test('Duration calculation accurate', () => {
  const engine = new MediaGenerationEngine();
  
  const clips = [
    { duration: '60s' },
    { duration: '90s' },
    { duration: '45s' }
  ];
  
  const total = engine._calculateTotalDuration(clips);
  
  // 60 + 90 + 45 = 195 seconds = 3m 15s
  if (total !== '3m 15s') throw new Error(`Duration calculation wrong: ${total}`);
});

// Test 15: Multi-arc project structure
test('Multi-arc project maintains structure', () => {
  const engine = new MediaGenerationEngine();
  
  const project = engine.createProject({ title: 'Full Movie' });
  
  // Add all story arc types
  const beginning = engine.addArc(project.id, { type: 'Beginning' });
  const development = engine.addArc(project.id, { type: 'Development' });
  const conflict = engine.addArc(project.id, { type: 'Conflict' });
  const climax = engine.addArc(project.id, { type: 'Climax' });
  const resolution = engine.addArc(project.id, { type: 'Resolution' });
  
  // Add scenes to each arc
  engine.addScene(project.id, beginning.id, { visual: 'Intro', environment: 'Home', action: 'Start' });
  engine.addScene(project.id, development.id, { visual: 'Journey', environment: 'Road', action: 'Travel' });
  engine.addScene(project.id, conflict.id, { visual: 'Battle', environment: 'Arena', action: 'Fight' });
  engine.addScene(project.id, climax.id, { visual: 'Showdown', environment: 'Arena', action: 'Final battle' });
  engine.addScene(project.id, resolution.id, { visual: 'Return', environment: 'Home', action: 'End' });
  
  if (project.arcs.length !== 5) throw new Error('Expected 5 arcs');
  if (project.scenes.length !== 5) throw new Error('Expected 5 scenes');
  
  // Verify timeline order
  const continuity = engine.continuityMemory.get(project.id);
  if (continuity.timeline[0] !== 'S01') throw new Error('Timeline order wrong');
  if (continuity.timeline[4] !== 'S01') throw new Error('Last scene should be S01 of last arc');
});

console.log('\n============================================================');
console.log(`📊 MEDIA GENERATION TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('============================================================\n');

if (failed > 0) {
  process.exit(1);
}
