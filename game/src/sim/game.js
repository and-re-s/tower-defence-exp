import { SQRT3 } from './hex.js';
import { createRng } from './rng.js';
import { buildLevel, pointOnPath } from './levels.js';
import { ENEMY_TYPES } from './enemies.js';
import { TICK } from './clock.js';
import { BUILDABLE_TERRAIN, TOWER_TYPES, towerRange } from './towers.js';
import { updateProjectiles, updateTowers } from './combat.js';
import { hexKey } from './hex.js';

export { TICK };
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
    this.towers = [];
    this.projectiles = [];
    this.light = 0;
    this.lastLeakTime = -100;
  }

  start({ level = 1, seed = 1 } = {}) {
    this.level = buildLevel(level);
    this.levelId = level;
    this.seed = seed;
    this.timeScale = 1;
    this.rng = createRng(seed);
    this.time = 0;
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.towerAt = new Map();
    this.nextId = 1;
    this.nextTowerId = 1;
    this.nextProjectileId = 1;
    this.kills = 0;
    this.light = this.level.def.startLight;
    this.lightMax = this.level.def.startLight;
    this.salvage = this.level.def.startSalvage;
    this.lastLeakTime = -100;
    this.wave = 0; // number of waves started so far
    this.phase = 'breather';
    this.breatherLeft = this.level.def.firstBreather;
    this.spawnQueue = [];
    this.hpScale = 1;
    this.spawnTimer = 0;
    this.screen = 'playing';
    this.events.push({ type: 'levelStart' });
  }

  toMenu() {
    this.screen = 'menu';
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
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
    updateTowers(this);
    updateProjectiles(this);
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
        const bonus = 20 + 5 * this.wave;
        this.salvage += bonus;
        this.events.push({ type: 'waveCleared', wave: this.wave, bonus });
        if (this.wave >= def.waves.length) this.phase = 'done';
        else {
          this.phase = 'breather';
          this.breatherLeft = def.breather;
        }
      }
    }
  }

  /** Skips the rest of the breather. Earlier calls pay a bigger bonus. Returns the bonus or -1 if not allowed. */
  callNextWave() {
    if ((this.screen !== 'playing' && this.screen !== 'paused') || this.phase !== 'breather') return -1;
    const bonus = Math.round(Math.max(0, this.breatherLeft) * 1.5);
    this.salvage += bonus;
    this.events.push({ type: 'waveCalled', bonus });
    this.startWave();
    return bonus;
  }

  /** Test helper: drops everything in flight and starts wave n (1-based) right now. Returns false outside a level. */
  skipToWave(n) {
    if (this.screen !== 'playing' && this.screen !== 'paused') return false;
    const count = this.level.def.waves.length;
    const target = Math.floor(Number(n));
    if (!(target >= 1 && target <= count)) return false;
    this.enemies = [];
    this.projectiles = [];
    for (const t of this.towers) t.targetId = 0;
    this.wave = target - 1;
    this.startWave();
    return true;
  }

  /** Test helper: ends the level as a victory (needs a level in progress). */
  forceWin() {
    if (this.screen !== 'playing' && this.screen !== 'paused') return false;
    this.enemies = [];
    this.projectiles = [];
    this.wave = this.level.def.waves.length;
    this.phase = 'done';
    this.screen = 'won';
    this.events.push({ type: 'victory' });
    return true;
  }

  /** Test helper: ends the level as a defeat. */
  forceLose() {
    if (this.screen !== 'playing' && this.screen !== 'paused') return false;
    this.light = 0;
    this.screen = 'lost';
    this.events.push({ type: 'defeat' });
    return true;
  }

  /** Why a tower cannot be built on (q, r) right now, or null if it can. */
  buildBlocker(type, q, r) {
    const tile = this.level && this.level.tileMap.get(hexKey(q, r));
    if (!tile || !TOWER_TYPES[type]) return 'invalid';
    if (tile.lighthouse) return 'lighthouse';
    if (!BUILDABLE_TERRAIN.has(tile.terrain)) return tile.terrain === 'path' ? 'path' : 'terrain';
    if (this.towerAt.has(hexKey(q, r))) return 'occupied';
    if (this.salvage < TOWER_TYPES[type].cost) return 'salvage';
    return null;
  }

  /** Places a tower following the player's rules. Returns { ok, reason }. */
  build(type, q, r) {
    if (this.screen !== 'playing' && this.screen !== 'paused') return { ok: false, reason: 'screen' };
    const reason = this.buildBlocker(type, q, r);
    if (reason) {
      this.events.push({ type: 'refuse', reason, q, r });
      return { ok: false, reason };
    }
    const tile = this.level.tileMap.get(hexKey(q, r));
    const stats = TOWER_TYPES[type];
    this.salvage -= stats.cost;
    const tower = {
      id: this.nextTowerId++, type, q, r, x: tile.x, z: tile.z, y: tile.height, terrain: tile.terrain, tier: 1,
      range: towerRange(type, tile.terrain), cooldown: 0.4, targetId: 0, angle: 0, spent: stats.cost, born: this.time,
    };
    this.towers.push(tower);
    this.towerAt.set(hexKey(q, r), tower);
    this.events.push({ type: 'build', towerId: tower.id, towerType: type, q, r });
    return { ok: true, reason: null, id: tower.id };
  }

  enemyById(id) {
    for (const e of this.enemies) if (e.id === id) return e;
    return null;
  }

  /** Applies damage; a kill removes the enemy and pays its reward. */
  hitEnemy(e, damage) {
    e.hp = Math.max(0, e.hp - damage);
    this.events.push({ type: 'hit', id: e.id, x: e.x, z: e.z });
    if (e.hp > 0) return;
    const reward = ENEMY_TYPES[e.type].reward;
    this.salvage += reward;
    this.kills += 1;
    this.enemies.splice(this.enemies.indexOf(e), 1);
    this.events.push({ type: 'kill', id: e.id, enemyType: e.type, x: e.x, z: e.z, reward });
  }

  startWave() {
    const wave = this.level.def.waves[this.wave];
    this.wave += 1;
    this.phase = 'wave';
    this.hpScale = wave.hpScale || 1;
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
    const hp = Math.round(stats.hp * this.hpScale);
    const e = { id: this.nextId++, type, hp, maxHp: hp, s: 0, x: 0, z: 0, heading: 0, born: this.time, incoming: 0 };
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
      kills: this.kills,
      tiles: lvl.tiles.map((t) => ({ q: t.q, r: t.r, terrain: t.terrain, height: t.height, tower: this.towerAt.get(hexKey(t.q, t.r))?.id ?? 0 })),
      towers: this.towers.map((t) => ({
        id: t.id, type: t.type, q: t.q, r: t.r, tier: t.tier, range: t.range, terrain: t.terrain, targetId: t.targetId,
        angleDeg: round((t.angle * 180) / Math.PI, 1),
      })),
      projectiles: this.projectiles.map((p) => ({ id: p.id, kind: p.kind || 'bolt', towerId: p.towerId, targetId: p.targetId, x: round(p.x), z: round(p.z) })),
      enemies: this.enemies.map((e) => ({
        id: e.id, type: e.type, hp: round(e.hp, 2), maxHp: e.maxHp, x: round(e.x), z: round(e.z), progress: round(e.s / lvl.pathLength),
      })),
    });
    return out;
  }
}
