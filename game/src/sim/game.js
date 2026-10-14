import { SQRT3 } from './hex.js';
import { createRng } from './rng.js';
import { buildLevel, pointOnPath } from './levels.js';
import { ENEMY_TYPES, GULL_HEIGHT } from './enemies.js';
import { TICK } from './clock.js';
import { BUILDABLE_TERRAIN, TOWER_TYPES, TIERS, MAX_TIER, TARGETING, SELL_REFUND, towerRange, towerStats } from './towers.js';
import { updateProjectiles, updateTowers } from './combat.js';
import { updateLanterns, MARK_BONUS } from './lantern.js';
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

  /** Time of day 0..1: golden hour while wave 1 is coming and runs, full night when the last wave starts. */
  get timeOfDay() {
    if (!this.level) return 0;
    const n = this.level.def.waves.length;
    return n <= 1 ? 1 : Math.max(0, Math.min(1, (this.wave - 1) / (n - 1)));
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
    updateLanterns(this);
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

  /** Composition of the wave that starts next, or null when every wave has started. Matches what `startWave` spawns. */
  nextWaveInfo() {
    if (!this.level || this.wave >= this.level.def.waves.length) return null;
    const wave = this.level.def.waves[this.wave];
    const p = this.level.pathPoints[0];
    return { number: this.wave + 1, groups: wave.groups.map((g) => ({ type: g.type, count: g.count })), spawn: { x: round(p.x), z: round(p.z) } };
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
      range: towerRange(type, tile.terrain), cooldown: 0.4, targetId: 0, angle: 0, spent: stats.cost, born: this.time, targeting: 'first', upgradedAt: -100,
    };
    this.towers.push(tower);
    this.towerAt.set(hexKey(q, r), tower);
    this.events.push({ type: 'build', towerId: tower.id, towerType: type, q, r });
    return { ok: true, reason: null, id: tower.id };
  }

  towerById(id) {
    for (const t of this.towers) if (t.id === id) return t;
    return null;
  }

  towerStats(t) {
    return towerStats(t.type, t.tier);
  }

  /** Cost of the next upgrade, or 0 at the maximum tier. */
  upgradeCost(t) {
    return t.tier >= MAX_TIER ? 0 : TIERS[t.type][t.tier + 1].cost;
  }

  /** Refund for selling this tower: 70% of everything spent on it. */
  sellValue(t) {
    return Math.floor(Math.round(t.spent * SELL_REFUND * 1000) / 1000);
  }

  upgrade(id) {
    const t = this.towerById(id);
    if (!t || (this.screen !== 'playing' && this.screen !== 'paused')) return { ok: false, reason: 'invalid' };
    const reason = t.tier >= MAX_TIER ? 'max' : this.salvage < this.upgradeCost(t) ? 'salvage' : null;
    if (reason) {
      this.events.push({ type: 'refuse', reason, q: t.q, r: t.r });
      return { ok: false, reason };
    }
    const cost = this.upgradeCost(t);
    this.salvage -= cost;
    t.spent += cost;
    t.tier += 1;
    t.upgradedAt = this.time;
    this.events.push({ type: 'upgrade', towerId: id, tier: t.tier, x: t.x, y: t.y, z: t.z });
    return { ok: true, reason: null, tier: t.tier };
  }

  sell(id) {
    const t = this.towerById(id);
    if (!t || (this.screen !== 'playing' && this.screen !== 'paused')) return { ok: false, reason: 'invalid' };
    const refund = this.sellValue(t);
    this.salvage += refund;
    this.towers.splice(this.towers.indexOf(t), 1);
    this.towerAt.delete(hexKey(t.q, t.r));
    this.projectiles = this.projectiles.filter((p) => p.towerId !== id || p.kind === 'shell');
    this.events.push({ type: 'sell', towerId: id, refund, x: t.x, y: t.y, z: t.z });
    return { ok: true, reason: null, refund };
  }

  setTargeting(id, mode) {
    const t = this.towerById(id);
    if (!t || !TARGETING.includes(mode)) return false;
    t.targeting = mode;
    return true;
  }

  enemyById(id) {
    for (const e of this.enemies) if (e.id === id) return e;
    return null;
  }

  /** Applies damage; a kill removes the enemy and pays its reward. */
  hitEnemy(e, damage, piercing = false) {
    const armor = piercing ? ENEMY_TYPES[e.type].armor || 0 : 0;
    e.hp = Math.max(0, e.hp - damage * (1 - armor) * (e.marked ? 1 + MARK_BONUS : 1));
    this.events.push({ type: 'hit', id: e.id, x: e.x, z: e.z, armored: armor > 0 });
    if (e.hp > 0) return;
    this.killEnemy(e);
  }

  /** Removes a dead enemy, pays its reward and announces the kill. */
  killEnemy(e) {
    const reward = ENEMY_TYPES[e.type].reward;
    this.salvage += reward;
    this.kills += 1;
    this.enemies.splice(this.enemies.indexOf(e), 1);
    this.events.push({ type: 'kill', id: e.id, enemyType: e.type, x: e.x, z: e.z, reward });
    const splits = ENEMY_TYPES[e.type].splits;
    for (let i = 0; i < (splits || 0); i++) {
      // Spread the brood a little along the path so they do not overlap.
      const child = this.spawnEnemy('skitterer', { s: Math.max(0, e.s + (i - (splits - 1) / 2) * 0.28), spawned: true });
      child.fromBrood = e.id;
    }
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

  spawnEnemy(type, opts = {}) {
    const stats = ENEMY_TYPES[type];
    // Armored types scale at half rate: they are already tough against harpoons.
    const hp = Math.round(stats.hp * (stats.armor ? 1 + (this.hpScale - 1) * 0.5 : this.hpScale));
    const e = { id: this.nextId++, type, hp, maxHp: hp, s: 0, x: 0, z: 0, heading: 0, born: this.time, incoming: 0, slow: 0, slowUntil: -1, lit: false, marked: false, burn: 0, revealed: !stats.cloaked };
    if (stats.flying) {
      const a = this.level.pathPoints[0];
      const l = this.level.lighthouse;
      e.flying = true;
      e.y = GULL_HEIGHT;
      e.sx = a.x; e.sz = a.z;
      e.flightLength = Math.hypot(l.x - a.x, l.z - a.z);
      e.heading = Math.atan2(l.x - a.x, l.z - a.z);
      e.x = a.x; e.z = a.z;
    } else {
      pointOnPath(this.level, opts.s || 0, e);
      if (opts.s) e.s = opts.s;
    }
    this.enemies.push(e);
    this.events.push({ type: 'spawn', id: e.id, enemyType: type, split: !!opts.spawned });
    return e;
  }

  updateEnemies() {
    const lvl = this.level;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const stats = ENEMY_TYPES[e.type];
      const slow = this.time < e.slowUntil ? 1 - e.slow : 1;
      e.s += stats.speed * slow * SQRT3 * TICK;
      const end = e.flying ? e.flightLength : lvl.pathLength;
      if (e.s >= end) {
        this.light -= stats.leak;
        this.lastLeakTime = this.time;
        this.events.push({ type: 'leak', id: e.id, enemyType: e.type, leak: stats.leak });
        this.enemies.splice(i, 1);
        continue;
      }
      if (e.flying) {
        const k = e.s / e.flightLength;
        e.x = e.sx + (lvl.lighthouse.x - e.sx) * k;
        e.z = e.sz + (lvl.lighthouse.z - e.sz) * k;
      } else pointOnPath(lvl, e.s, e);
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
      timeOfDay: round(this.timeOfDay, 3),
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
      nextWave: this.nextWaveInfo(),
      lastLeakTime: round(this.lastLeakTime),
      path: lvl.path,
      lighthouse: { q: lvl.lighthouse.q, r: lvl.lighthouse.r, x: round(lvl.lighthouse.x), z: round(lvl.lighthouse.z) },
      terrainCounts: terrain,
      heights: [...heights].sort((a, b) => a - b),
      kills: this.kills,
      tiles: lvl.tiles.map((t) => ({ q: t.q, r: t.r, terrain: t.terrain, height: t.height, tower: this.towerAt.get(hexKey(t.q, t.r))?.id ?? 0 })),
      towers: this.towers.map((t) => ({
        id: t.id, type: t.type, q: t.q, r: t.r, tier: t.tier, range: t.range, terrain: t.terrain, targetId: t.targetId,
        targeting: t.targeting, ...towerStats(t.type, t.tier), upgradeCost: this.upgradeCost(t), sellValue: this.sellValue(t), spent: t.spent,
        angleDeg: round((t.angle * 180) / Math.PI, 1),
      })),
      projectiles: this.projectiles.map((p) => ({ id: p.id, kind: p.kind || 'bolt', towerId: p.towerId, targetId: p.targetId, x: round(p.x), z: round(p.z) })),
      enemies: this.enemies.map((e) => ({
        id: e.id, type: e.type, hp: round(e.hp, 2), maxHp: e.maxHp, x: round(e.x), z: round(e.z), progress: round(e.s / (e.flying ? e.flightLength : lvl.pathLength)), flying: !!e.flying, y: e.flying ? e.y : undefined,
        cloaked: !!ENEMY_TYPES[e.type].cloaked, revealed: e.revealed, lit: e.lit, marked: e.marked,
        slowed: this.time < e.slowUntil, speedFactor: this.time < e.slowUntil ? round(1 - e.slow, 2) : 1,
      })),
    });
    return out;
  }
}
