/**
 * AURAVOX web UI — runs the from-scratch synth engine entirely in the browser.
 * No server, no API, no GPU: the same pure-JS modules used by the CLI are
 * imported directly and rendered to a Web Audio buffer.
 */
import { createSongSpec } from '../src/song/SongSpec.js';
import { generateLyrics } from '../src/song/lyrics.js';
import { arrange } from '../src/song/synth/arranger.js';
import { lockSection, regenerateSection } from '../src/song/editor.js';

const $ = (id) => document.getElementById(id);

const state = {
  spec: null,
  arrangement: null,
  audioCtx: null,
  source: null,
  playing: false,
  startedAt: 0, // audioCtx time when playback (re)started
  offset: 0, // seconds into the track where playback started
  raf: 0
};

const SECTION_COLORS = ['#7c5cff', '#19d3c5', '#ff6ec7', '#ffb347', '#5d7bff', '#6ddf6d'];

function fmtTime(s) {
  s = Math.max(0, s | 0);
  return `${(s / 60) | 0}:${String(s % 60).padStart(2, '0')}`;
}

function specFromControls() {
  return createSongSpec({
    prompt: $('prompt').value.trim() || 'a song',
    genre: $('genre').value,
    key: $('key').value,
    tempo: Number($('tempo').value),
    structure: [
      { section: 'Intro', bars: 8 },
      { section: 'Verse', bars: 8 },
      { section: 'Chorus', bars: 8 },
      { section: 'Verse', bars: 8 },
      { section: 'Chorus', bars: 8 },
      { section: 'Outro', bars: 8 }
    ]
  });
}

function renderArrangement() {
  const maxSeconds = Number($('secs').value);
  const vocals = $('vocals').checked;
  state.arrangement = arrange(state.spec, { maxSeconds, vocals });
  drawWave();
  buildSectionList();
  $('dur').textContent = fmtTime(state.arrangement.durationSec);
}

// ---- Web Audio playback ------------------------------------------------------

function ensureCtx() {
  if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
  return state.audioCtx;
}

function toAudioBuffer(ctx) {
  const { samples, sampleRate } = state.arrangement;
  const buf = ctx.createBuffer(1, samples.length, sampleRate);
  buf.copyToChannel(samples instanceof Float32Array ? samples : Float32Array.from(samples), 0);
  return buf;
}

function stopSource() {
  if (state.source) {
    try { state.source.onended = null; state.source.stop(); } catch { /* already stopped */ }
    state.source = null;
  }
  cancelAnimationFrame(state.raf);
}

function play(fromSec = state.offset) {
  if (!state.arrangement) return;
  const ctx = ensureCtx();
  stopSource();
  const src = ctx.createBufferSource();
  src.buffer = toAudioBuffer(ctx);
  src.connect(ctx.destination);
  const dur = state.arrangement.durationSec;
  const start = Math.min(Math.max(0, fromSec), dur);
  src.start(0, start);
  src.onended = () => { if (state.playing) stop(); };
  state.source = src;
  state.startedAt = ctx.currentTime;
  state.offset = start;
  state.playing = true;
  $('playBtn').textContent = '❚❚';
  tick();
}

function stop() {
  stopSource();
  state.playing = false;
  $('playBtn').textContent = '▶';
}

function currentPlayhead() {
  if (!state.arrangement) return 0;
  if (!state.playing) return state.offset;
  return Math.min(state.offset + (state.audioCtx.currentTime - state.startedAt), state.arrangement.durationSec);
}

function tick() {
  const t = currentPlayhead();
  $('cur').textContent = fmtTime(t);
  drawWave(t);
  if (state.playing) state.raf = requestAnimationFrame(tick);
}

// ---- Waveform ----------------------------------------------------------------

function drawWave(playhead = currentPlayhead()) {
  const canvas = $('wave');
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 800;
  const cssH = 120;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);
  if (!state.arrangement) return;

  const { samples, durationSec, sections, sampleRate } = state.arrangement;
  const mid = cssH / 2;

  // Section bands + boundaries.
  sections.forEach((s, i) => {
    const x0 = (s.startSec / durationSec) * cssW;
    const w = (s.durSec / durationSec) * cssW;
    ctx.fillStyle = (i % 2 === 0) ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(x0, 0, w, cssH);
    if (s.locked) {
      ctx.fillStyle = 'rgba(255,179,71,0.10)';
      ctx.fillRect(x0, 0, w, cssH);
    }
    ctx.fillStyle = '#9aa0bd';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`${s.name}${s.locked ? ' 🔒' : ''}`, x0 + 5, 13);
  });

  // Waveform (min/max per column).
  const total = Math.min(samples.length, Math.floor(durationSec * sampleRate));
  const step = Math.max(1, Math.floor(total / cssW));
  ctx.strokeStyle = 'rgba(124,92,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < cssW; x++) {
    const s0 = x * step;
    let min = 1, max = -1;
    for (let j = 0; j < step && s0 + j < total; j++) {
      const v = samples[s0 + j];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    ctx.moveTo(x + 0.5, mid - max * mid * 0.92);
    ctx.lineTo(x + 0.5, mid - min * mid * 0.92);
  }
  ctx.stroke();

  // Playhead.
  const px = (playhead / durationSec) * cssW;
  ctx.strokeStyle = '#19d3c5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, 0);
  ctx.lineTo(px, cssH);
  ctx.stroke();
}

// ---- Section list ------------------------------------------------------------

function buildSectionList() {
  const ul = $('sectionList');
  ul.innerHTML = '';
  state.arrangement.sections.forEach((s) => {
    const li = document.createElement('li');
    li.className = 'sec' + (s.locked ? ' locked' : '');

    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = SECTION_COLORS[s.sectionId % SECTION_COLORS.length];

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<span class="name">${s.name}</span>` +
      `<span class="range">${s.startSec.toFixed(1)}s – ${(s.startSec + s.durSec).toFixed(1)}s · seed ${s.seed}</span>`;

    const spacer = document.createElement('div');
    spacer.className = 'spacer';

    const lockBtn = document.createElement('button');
    lockBtn.textContent = s.locked ? '🔒 Locked' : '🔓 Lock';
    if (s.locked) lockBtn.classList.add('on');
    lockBtn.onclick = () => {
      state.spec = lockSection(state.spec, s.sectionId, !s.locked);
      renderArrangement(); // refresh flags/labels (audio unchanged)
    };

    const regenBtn = document.createElement('button');
    regenBtn.textContent = '↻ Regenerate';
    regenBtn.disabled = s.locked;
    regenBtn.onclick = () => {
      state.spec = regenerateSection(state.spec, s.sectionId);
      const wasPlaying = state.playing;
      const at = currentPlayhead();
      renderArrangement();
      $('status').textContent = `Regenerated ${s.name}. Locked sections stayed identical.`;
      if (wasPlaying) play(at);
    };

    li.append(dot, meta, spacer, lockBtn, regenBtn);
    ul.appendChild(li);
  });
}

// ---- WAV download (browser encoder; wav.js uses Node Buffer) ------------------

function encodeWav(samples, sampleRate) {
  const n = samples.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);
  const ws = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
  ws(0, 'RIFF'); view.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE');
  ws(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ws(36, 'data'); view.setUint32(40, n * 2, true);
  let off = 44;
  for (let i = 0; i < n; i++) {
    const c = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, Math.round(c * 32767), true);
    off += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function download() {
  if (!state.arrangement) return;
  const { samples, sampleRate } = state.arrangement;
  const url = URL.createObjectURL(encodeWav(samples, sampleRate));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(state.spec.prompt || 'song').replace(/[^a-z0-9]+/gi, '_').slice(0, 40)}.wav`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Neural (GPU) backend mode ----------------------------------------------

function collectLyrics(spec) {
  return spec.structure
    .map((s) => (s.lyrics || '').trim())
    .filter(Boolean)
    .join('\n');
}

// Decode a base64 WAV from the backend into state.arrangement (so the existing
// player, waveform and download all work unchanged).
async function loadEncodedAudio(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ctx = ensureCtx();
  const buf = await ctx.decodeAudioData(bytes.buffer);
  state.arrangement = {
    samples: Float32Array.from(buf.getChannelData(0)),
    sampleRate: buf.sampleRate,
    durationSec: buf.duration,
    sections: [] // per-section editing is synth-mode only
  };
}

async function generateNeural() {
  const base = $('backendUrl').value.trim().replace(/\/+$/, '');
  if (!base) {
    $('status').textContent = 'Paste your Colab backend URL first (run the notebook to get it).';
    return false;
  }
  state.spec = specFromControls();
  state.spec.structure = generateLyrics(state.spec);
  const body = {
    prompt: state.spec.prompt,
    genre: $('genre').value,
    key: $('key').value,
    tempo: Number($('tempo').value),
    duration: Number($('secs').value),
    vocals: $('vocals').checked,
    lyrics: collectLyrics(state.spec),
    format: 'wav'
  };
  $('status').textContent = 'Generating on GPU… first run downloads models (~2 min).';
  const res = await fetch(base + '/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Backend error ${res.status}`);
  const payload = await res.json();
  if (!payload.audio_base64) throw new Error('Backend returned no audio');
  await loadEncodedAudio(payload.audio_base64);
  drawWave();
  buildSectionList();
  $('dur').textContent = fmtTime(state.arrangement.durationSec);
  $('status').textContent = payload.has_vocals
    ? 'Done — neural music + singing. (Per-section editing is synth-mode only.)'
    : 'Done — neural instrumental.';
  return true;
}

// ---- Wiring ------------------------------------------------------------------

function generate() {
  const btn = $('generate');
  const neural = $('neural').checked;
  btn.disabled = true;
  btn.textContent = neural ? 'Generating on GPU…' : 'Composing…';
  stop();
  state.offset = 0;
  // Defer so the button repaint is visible before the (sync) render.
  setTimeout(async () => {
    try {
      if (neural) {
        const ok = await generateNeural();
        if (!ok) return;
      } else {
        state.spec = specFromControls();
        state.spec.structure = generateLyrics(state.spec);
        renderArrangement();
        $('sectionsPanel').hidden = false;
        $('status').textContent = 'Done. Press play, or regenerate/lock sections below.';
      }
      $('playerPanel').hidden = false;
      $('sectionsPanel').hidden = neural; // no per-section editor in neural mode
      $('cur').textContent = '0:00';
      ensureCtx();
      play(0);
    } catch (err) {
      $('playerPanel').hidden = false;
      $('status').textContent = `Failed: ${err.message}. Check the backend URL and that the Colab cell is still running.`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate song';
    }
  }, 20);
}

$('tempo').addEventListener('input', (e) => { $('tempoOut').textContent = e.target.value; });
$('secs').addEventListener('input', (e) => { $('secsOut').textContent = e.target.value; });
$('neural').addEventListener('change', (e) => { $('neuralUrlRow').hidden = !e.target.checked; });
$('generate').addEventListener('click', generate);
$('playBtn').addEventListener('click', () => { if (state.playing) { state.offset = currentPlayhead(); stop(); } else play(); });
$('download').addEventListener('click', download);
$('wave').addEventListener('click', (e) => {
  if (!state.arrangement) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const t = ((e.clientX - rect.left) / rect.width) * state.arrangement.durationSec;
  state.offset = t;
  if (state.playing) play(t); else { drawWave(t); $('cur').textContent = fmtTime(t); }
});
window.addEventListener('resize', () => drawWave());
