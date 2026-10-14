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
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  startSurf();
  scheduleGulls();
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
  // second, higher and slower layer so the swells never line up
  const src2 = ctx.createBufferSource();
  src2.buffer = noiseBuffer();
  src2.loop = true;
  src2.loopStart = 1.3;
  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass';
  f2.frequency.value = 1400;
  f2.Q.value = 0.5;
  const g2 = ctx.createGain();
  g2.gain.value = 0.012;
  const lfoB = ctx.createOscillator();
  lfoB.frequency.value = 0.07;
  const lfoBGain = ctx.createGain();
  lfoBGain.gain.value = 0.012;
  lfoB.connect(lfoBGain).connect(g2.gain);
  src2.connect(f2).connect(g2).connect(master);
  src2.start();
  lfoB.start();
}

let gullTimer = 0; // eslint-disable-line no-unused-vars
/** Faint distant gulls every so often; timing uses a fixed LCG so no Math.random. */
function scheduleGulls() {
  let seed = 777;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 8) / 16777216;
  };
  const cry = () => {
    if (ctx && !muted && ctx.state === 'running') {
      const base = 1500 + next() * 500;
      tone(base, 0.28, { type: 'triangle', vol: 0.012, slideTo: base * 0.72, attack: 0.04 });
      tone(base * 1.1, 0.22, { type: 'triangle', vol: 0.01, slideTo: base * 0.8, attack: 0.04, delay: 0.3 });
    }
    gullTimer = setTimeout(cry, 9000 + next() * 14000);
  };
  gullTimer = setTimeout(cry, 6000);
}

// Deterministic pitch variation so repeated sounds (hits, shots) never sound machine-gunned.
let variant = 0;
const vary = () => { variant = (variant * 7 + 3) % 11; return 0.92 + variant * 0.016; };

/** Kalimba-like pluck: a bright sine with a short inharmonic overtone. */
function pluck(freq, vol, delay = 0) {
  tone(freq, 0.3, { type: 'sine', vol, delay, attack: 0.003 });
  tone(freq * 4.1, 0.08, { type: 'sine', vol: vol * 0.3, delay, attack: 0.002 });
}

const SOUNDS = {
  build() {
    tone(95, 0.22, { type: 'triangle', vol: 0.3, slideTo: 55 });
    noise(0.14, { freq: 700, vol: 0.2 });
    noise(0.35, { freq: 4500, kind: 'highpass', vol: 0.05, delay: 0.1 }); // sand hiss
    tone(520, 0.1, { type: 'triangle', vol: 0.08, delay: 0.1 });
  },
  refuse() {
    // lower woody thunk
    tone(150, 0.14, { type: 'triangle', vol: 0.2, slideTo: 80 });
    tone(110, 0.1, { type: 'square', vol: 0.04, slideTo: 70 });
    noise(0.06, { freq: 420, vol: 0.14 });
  },
  harpoon_fire() {
    const k = vary();
    tone(1100 * k, 0.1, { type: 'triangle', vol: 0.07, slideTo: 300 }); // thwip
    noise(0.08, { freq: 2200, q: 1.5, kind: 'bandpass', vol: 0.1 });
    tone(140 * k, 0.14, { type: 'sine', vol: 0.16, delay: 0.05, slideTo: 70 }); // thunk
    noise(0.05, { freq: 500, vol: 0.1, delay: 0.05 });
  },
  enemy_hit() {
    const k = vary();
    noise(0.04, { freq: 2600 * k, q: 3, kind: 'bandpass', vol: 0.12 }); // wet click
    tone(520 * k, 0.04, { type: 'sine', vol: 0.05, slideTo: 260 });
  },
  enemy_death() {
    const k = vary();
    tone(520 * k, 0.16, { type: 'sine', vol: 0.12, slideTo: 140 }); // splash-pop
    noise(0.2, { freq: 1500, kind: 'lowpass', vol: 0.14 });
    tone(900 * k, 0.05, { type: 'sine', vol: 0.07, slideTo: 1500, delay: 0.14 });
  },
  ui_click() {
    pluck(659.3, 0.15);
    pluck(987.8, 0.07, 0.05);
  },
  ui_hover() { pluck(880, 0.045); },
  lighthouse_hit() {
    // deep cracked bell: inharmonic partials plus a brittle noise crack
    [[110, 0.3], [221, 0.18], [304, 0.12], [451, 0.08]].forEach(([f, v]) => tone(f, 1.4, { vol: v, attack: 0.004 }));
    tone(165, 1.1, { type: 'triangle', vol: 0.1, slideTo: 150 });
    noise(0.12, { freq: 2600, kind: 'highpass', vol: 0.18 });
  },
  wave_start() {
    // foghorn: two detuned saws through a falling-formant lowpass, plus a breath of air
    [82.4, 82.4 * 1.006, 123.5].forEach((f, i) => tone(f, 2.1, { type: 'sawtooth', vol: i === 2 ? 0.03 : 0.07, attack: 0.3, slideTo: f * 0.97 }));
    noise(1.6, { freq: 380, vol: 0.05 });
  },
  wave_clear() {
    // ship's bell, two strikes
    [0, 0.42].forEach((d) => {
      tone(1318, 1.4, { vol: 0.11, delay: d });
      tone(1760 * 1.003, 1.0, { vol: 0.05, delay: d });
      tone(3320, 0.4, { vol: 0.03, delay: d });
    });
  },
  victory() {
    [220, 277.2, 329.6, 440, 554.4, 659.3].forEach((f, i) => tone(f, 3.2, { vol: 0.085, attack: 0.3 + i * 0.07 }));
    pluck(1318.5, 0.1, 1.2);
    pluck(1661.2, 0.08, 1.45);
  },
  defeat() {
    // slow descending foghorn
    [[150, 62], [151.2, 63]].forEach(([f, to]) => tone(f, 3.2, { type: 'sawtooth', vol: 0.09, slideTo: to, attack: 0.2 }));
    tone(75, 3.2, { type: 'sine', vol: 0.12, slideTo: 40, attack: 0.2 });
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
  clearLog() { log.length = 0; },
  isMuted: () => muted,
  /** For the test API: whether audio can actually be heard. */
  status: () => ({ muted, running: !!ctx && ctx.state === 'running' }),
  setMuted(m) {
    muted = m;
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* ignore */ }
    if (master) master.gain.value = m ? 0 : 0.8;
    listeners.forEach((fn) => fn(m));
  },
  toggleMute() { audio.setMuted(!muted); },
  onMute(fn) { listeners.add(fn); },
};
