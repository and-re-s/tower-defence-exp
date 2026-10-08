// All sound goes through this module: Web Audio synthesis, one master gain, a mute toggle.
const MUTE_KEY = 'tidewatch.muted';

let ctx = null;
let master = null;
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* storage unavailable */ }
const log = [];
const listeners = new Set();

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.8;
  master.connect(ctx.destination);
  startSurf();
  return ctx;
}

let cachedNoise = null;
function noiseBuffer() {
  if (cachedNoise) return cachedNoise;
  const seconds = 4;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  // deterministic noise (LCG): audio does not touch Math.random
  let s = 12345;
  for (let i = 0; i < d.length; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    d[i] = (s / 2147483648) * 0.9;
  }
  cachedNoise = buf;
  return buf;
}

function tone(freq, dur, { type = 'sine', vol = 0.2, delay = 0, slideTo = null, attack = 0.005, dest = master } = {}) {
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(dest);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(dur, { freq = 1000, q = 1, kind = 'lowpass', vol = 0.2, delay = 0 } = {}) {
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
  const f = ctx.createBiquadFilter();
  f.type = kind;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

function startSurf() {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 520;
  const g = ctx.createGain();
  g.gain.value = 0.05;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.11; // slow swell
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.035;
  lfo.connect(lfoGain).connect(g.gain);
  const lfo2 = ctx.createGain();
  lfo2.gain.value = 260;
  lfo.connect(lfo2).connect(f.frequency);
  src.connect(f).connect(g).connect(master);
  src.start();
  lfo.start();
}

const SOUNDS = {
  ui_click() {
    tone(660, 0.16, { type: 'triangle', vol: 0.16 });
    tone(990, 0.12, { type: 'sine', vol: 0.06, delay: 0.02 });
  },
  ui_hover() { tone(880, 0.07, { type: 'triangle', vol: 0.05 }); },
  lighthouse_hit() {
    // deep cracked bell: inharmonic partials plus a brittle noise crack
    [[110, 0.3], [221, 0.18], [304, 0.12], [451, 0.08]].forEach(([f, v]) => tone(f, 1.4, { vol: v, attack: 0.004 }));
    tone(165, 1.1, { type: 'triangle', vol: 0.1, slideTo: 150 });
    noise(0.12, { freq: 2600, kind: 'highpass', vol: 0.18 });
  },
  wave_start() {
    tone(98, 1.5, { type: 'sawtooth', vol: 0.09, attack: 0.25 });
    tone(98 * 1.007, 1.5, { type: 'sawtooth', vol: 0.09, attack: 0.25 });
  },
  wave_clear() {
    tone(1318, 1.2, { vol: 0.12 });
    tone(1760, 1.0, { vol: 0.06 });
    tone(1318, 1.2, { vol: 0.1, delay: 0.32 });
  },
  victory() {
    [220, 277.2, 329.6, 440, 554.4].forEach((f, i) => tone(f, 2.6, { vol: 0.1, attack: 0.3 + i * 0.05 }));
  },
  defeat() {
    tone(150, 2.6, { type: 'sawtooth', vol: 0.1, slideTo: 62, attack: 0.1 });
    tone(151.2, 2.6, { type: 'sawtooth', vol: 0.08, slideTo: 63, attack: 0.1 });
  },
};

export const audio = {
  /** Call on any user gesture: browsers block audio before that. */
  unlock() {
    const c = ensureContext();
    if (c && c.state === 'suspended') c.resume();
  },
  play(id, time = 0) {
    log.push({ id, time: Math.round(time * 1000) / 1000 });
    if (log.length > 60) log.shift();
    if (!ctx || muted || ctx.state !== 'running' || !SOUNDS[id]) return;
    SOUNDS[id]();
  },
  log: () => log.slice(-50),
  isMuted: () => muted,
  setMuted(m) {
    muted = m;
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* ignore */ }
    if (master) master.gain.value = m ? 0 : 0.8;
    listeners.forEach((fn) => fn(m));
  },
  toggleMute() { audio.setMuted(!muted); },
  onMute(fn) { listeners.add(fn); },
};
