import { SQRT3 } from './hex.js';
import { createRng } from './rng.js';
import { buildLevel, pointOnPath } from './levels.js';
import { ENEMY_TYPES } from './enemies.js';

export const TICK = 1 / 60;
const round = (v, n = 3) => Math.round(v * 10 ** n) / 10 ** n;

/** Pure simulation: no rendering, no DOM. Rendering and audio read it and drain `events`. */
export class Game {
  constructor() {
    this.screen = 'menu';
    this.levelId = 0;
    this.seed = 0;
    this.time = 0;
    this.events = [];
    this.timeScale = 1;
    this.resumeScreen = 'playing';
    this.level = null;
    this.enemies = [];
    this.light = 0;
    this.lastLeakTime = -100;
  }

  start({ level = 1, seed = 1 } = {}) {
    this.level = buildLevel(level);
    this.levelId = level;
    this.seed = seed;
    this.rng = createRng(seed);
    this.time = 0;
    this.enemies = [];
    this.nextId = 1;
    this.light = this.level.def.startLight;
    this.lightMax = this.level.def.startLight;
    this.salvage = this.level.def.startSalvage;
    this.lastLeakTime = -100;
    this.wave = 0; // number of waves started so far
    this.phase = 'breather';
    this.breatherLeft = this.level.def.firstBreather;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.screen = 'playing';
    this.events.push({ type: 'levelStart' });
  }

  toMenu() {
    this.screen = 'menu';
    this.enemies = [];
  }

  pause() {
    if (this.screen === 'playing') this.screen = 'paused';
  }

  resume() {
    if (this.screen === 'paused') this.screen = 'playing';
  }

  tick() {
    if (this.screen !== 'playing') return;
    this.time += TICK;
    this.updateWaves();
    this.updateEnemies();
    if (this.light <= 0) {
      this.light = 0;
      this.screen = 'lost';
      this.events.push({ type: 'defeat' });
    } else if (this.phase === 'done' && this.enemies.length === 0) {
      this.screen = 'won';
      this.events.push({ type: 'victory' });
    }
  }

  updateWaves() {
    const def = this.level.def;
    if (this.phase === 'breather') {
      this.breatherLeft -= TICK;
      if (this.breatherLeft <= 0) this.startWave();
    } else if (this.phase === 'wave') {
      this.spawnTimer -= TICK;
      while (this.spawnQueue.length && this.spawnTimer <= 0) {
        const next = this.spawnQueue.shift();
        this.spawnEnemy(next.type);
        this.spawnTimer += next.gap;
      }
      if (!this.spawnQueue.length && this.enemies.length === 0) {
        this.events.push({ type: 'waveCleared', wave: this.wave });
        if (this.wave >= def.waves.length) this.phase = 'done';
        else {
          this.phase = 'breather';
          this.breatherLeft = def.breather;
        }
      }
    }
  }

  startWave() {
    const wave = this.level.def.waves[this.wave];
    this.wave += 1;
    this.phase = 'wave';
    this.spawnQueue = [];
    for (const g of wave.groups) {
      for (let i = 0; i < g.count; i++) {
        this.spawnQueue.push({ type: g.type, gap: g.interval * this.rng.range(0.85, 1.15) });
      }
    }
    this.spawnTimer = 0;
    this.events.push({ type: 'waveStart', wave: this.wave });
  }

  spawnEnemy(type) {
    const stats = ENEMY_TYPES[type];
    const e = { id: this.nextId++, type, hp: stats.hp, maxHp: stats.hp, s: 0, x: 0, z: 0, heading: 0 };
    pointOnPath(this.level, 0, e);
    this.enemies.push(e);
    this.events.push({ type: 'spawn', id: e.id, enemyType: type });
  }

  updateEnemies() {
    const lvl = this.level;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const stats = ENEMY_TYPES[e.type];
      e.s += stats.speed * SQRT3 * TICK;
      if (e.s >= lvl.pathLength) {
        this.light -= stats.leak;
        this.lastLeakTime = this.time;
        this.events.push({ type: 'leak', id: e.id, enemyType: e.type, leak: stats.leak });
        this.enemies.splice(i, 1);
        continue;
      }
      pointOnPath(lvl, e.s, e);
    }
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  /** JSON-serializable snapshot of the simulation (the test API adds camera, fps, etc.). */
  snapshot() {
    const lvl = this.level;
    const out = {
      screen: this.screen,
      level: this.levelId,
      seed: this.seed,
      time: round(this.time),
      timeScale: this.timeScale,
    };
    if (!lvl) return out;
    const terrain = {};
    const heights = new Set();
    for (const t of lvl.tiles) {
      terrain[t.terrain] = (terrain[t.terrain] || 0) + 1;
      heights.add(t.height);
    }
    Object.assign(out, {
      levelName: lvl.def.name,
      light: this.light,
      lightMax: this.lightMax,
      salvage: this.salvage,
      wave: this.wave,
      waveCount: lvl.def.waves.length,
      phase: this.phase,
      breatherLeft: round(Math.max(0, this.breatherLeft), 2),
      lastLeakTime: round(this.lastLeakTime),
      path: lvl.path,
      lighthouse: { q: lvl.lighthouse.q, r: lvl.lighthouse.r, x: round(lvl.lighthouse.x), z: round(lvl.lighthouse.z) },
      terrainCounts: terrain,
      heights: [...heights].sort((a, b) => a - b),
      enemies: this.enemies.map((e) => ({
        id: e.id, type: e.type, hp: e.hp, x: round(e.x), z: round(e.z), progress: round(e.s / lvl.pathLength),
      })),
    });
    return out;
  }
}
