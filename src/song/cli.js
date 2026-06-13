#!/usr/bin/env node
/**
 * Tiny CLI to generate a song from a prompt.
 *
 *   node src/song/cli.js "a dreamy synthwave track" --provider mock --seconds 2
 *   REPLICATE_API_TOKEN=... node src/song/cli.js "lofi beat" --provider replicate
 *   LOCAL_MUSIC_URL=http://127.0.0.1:8000/generate node src/song/cli.js "jazz" --provider local
 */
import { SongPipeline } from './SongPipeline.js';

function parseArgs(argv) {
  const args = { provider: 'synth', seconds: 20, out: undefined, prompt: '', genre: undefined, key: undefined, tempo: undefined, vocals: undefined };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--provider') args.provider = argv[++i];
    else if (a === '--seconds') args.seconds = Number(argv[++i]);
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--genre') args.genre = argv[++i];
    else if (a === '--key') args.key = argv[++i];
    else if (a === '--tempo') args.tempo = Number(argv[++i]);
    else if (a === '--no-vocals') args.vocals = 'none';
    else rest.push(a);
  }
  args.prompt = rest.join(' ').trim();
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.prompt) {
    console.error('Usage: node src/song/cli.js "<prompt>" [--provider synth|mock|replicate|local] [--genre G] [--key "A minor"] [--tempo N] [--seconds N] [--no-vocals] [--out DIR]');
    process.exit(1);
  }

  const pipeline = new SongPipeline({ outDir: args.out, renderSeconds: args.seconds });
  const { audio, lyrics } = await pipeline.generateSong({
    prompt: args.prompt,
    genre: args.genre,
    key: args.key,
    tempo: args.tempo,
    providers: { music: args.provider, ...(args.vocals ? { vocals: args.vocals } : {}) }
  });

  console.log(`🎵 ${audio.provider} (${audio.mode}) → ${audio.filePath}`);
  console.log(`   ${audio.bytes} bytes, ${audio.durationSec}s`);
  if (lyrics.length) {
    console.log('   lyrics:');
    for (const l of lyrics) console.log(`     ${l.lyrics}`);
  }
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
