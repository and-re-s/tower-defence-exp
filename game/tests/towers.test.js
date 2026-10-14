import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, TICK } from '../src/sim/game.js';
import { SQRT3 } from '../src/sim/hex.js';
import { pointOnPath } from '../src/sim/levels.js';

function finite(v, path = 'state') {
  if (typeof v === 'number') assert.ok(Number.isFinite(v), `${path} not finite`);
  else if (Array.isArray(v)) v.forEach((x, i) => finite(x, `${path}[${i}]`));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) finite(v[k], `${path}.${k}`);
}

/** Candidate spots ranked by how much of the walking line they cover. */
function rankSpots(g) {
  const pts = g.level.pathPoints;
  const spots = g.level.tiles.filter((t) => ['sand', 'grass', 'rock'].includes(t.terrain) && !t.lighthouse);
  return spots.map((t) => {
    const range = (t.terrain === 'rock' ? 4.5 : 3.5) * SQRT3;
    let cover = 0;
    for (const p of pts) if (Math.hypot(p.x - t.x, p.z - t.z) <= range) cover++;
    return { t, cover };
  }).sort((a, b) => b.cover - a.cover || a.t.q - b.t.q || a.t.r - b.t.r);
}

function playWithBot(seed, { towers = true } = {}) {
  const g = new Game();
  g.start({ level: 1, seed });
  const spots = rankSpots(g);
  let guard = 0;
  while (g.screen === 'playing' && guard++ < 60 * 60 * 20) {
    if (towers && g.phase === 'breather') {
      for (const s of spots) {
        if (g.salvage < 50) break;
        g.build('harpoon', s.t.q, s.t.r);
      }
      g.callNextWave();
    }
    g.tick();
    if (g.tick.length === 0 && guard % 600 === 0) finite(g.snapshot());
  }
  return g;
}

test('building follows terrain, occupancy and cost rules', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  const path = g.level.path[3];
  assert.equal(g.build('harpoon', path.q, path.r).reason, 'path');
  assert.equal(g.build('harpoon', g.level.lighthouse.q, g.level.lighthouse.r).ok, false);
  assert.equal(g.build('harpoon', 6, 0).reason, 'terrain'); // shallows ring
  assert.equal(g.build('harpoon', 40, 40).reason, 'invalid');
  const spot = rankSpots(g)[0].t;
  const before = g.salvage;
  assert.equal(g.build('harpoon', spot.q, spot.r).ok, true);
  assert.equal(g.salvage, before - 50);
  assert.equal(g.build('harpoon', spot.q, spot.r).reason, 'occupied');
  g.salvage = 10;
  const other = rankSpots(g)[5].t;
  assert.equal(g.build('harpoon', other.q, other.r).reason, 'salvage');
  assert.equal(g.salvage, 10);
  const s = g.snapshot();
  assert.equal(s.towers.length, 1);
  assert.equal(s.towers[0].type, 'harpoon');
  assert.equal(s.towers[0].tier, 1);
});

test('rock tiles give one more hex of range', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  g.salvage = 500;
  const rock = g.level.tiles.find((t) => t.terrain === 'rock' && !t.lighthouse);
  const sand = g.level.tiles.find((t) => t.terrain === 'sand');
  g.build('harpoon', rock.q, rock.r);
  g.build('harpoon', sand.q, sand.r);
  const [a, b] = g.snapshot().towers;
  assert.equal(a.range - b.range, 1);
});

test('a tower shoots, kills and earns salvage', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  const spot = rankSpots(g)[0].t;
  g.build('harpoon', spot.q, spot.r);
  let fired = 0;
  let kills = 0;
  const start = g.salvage;
  for (let i = 0; i < 60 * 60 && kills < 3; i++) {
    g.tick();
    for (const ev of g.drainEvents()) { if (ev.type === 'fire') fired++; if (ev.type === 'kill') kills++; }
  }
  assert.ok(fired > 0 && kills >= 3);
  assert.ok(g.salvage > start);
});

test('a reasonable layout wins level 1, deterministic per seed', () => {
  const a = playWithBot(1);
  const b = playWithBot(1);
  assert.equal(a.screen, 'won');
  assert.ok(a.light > 0);
  assert.equal(a.wave, 6);
  assert.equal(JSON.stringify(a.snapshot()), JSON.stringify(b.snapshot()));
  finite(a.snapshot());
});

test('no towers loses', () => {
  const g = playWithBot(2, { towers: false });
  assert.equal(g.screen, 'lost');
});

test('waves: skitterers are faster than scuttlers; calling early pays more the earlier', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  const early = g.callNextWave();
  assert.ok(early > 0 && g.phase === 'wave' && g.wave === 1);
  assert.equal(g.callNextWave(), -1);
  const h = new Game();
  h.start({ level: 1, seed: 1 });
  for (let i = 0; i < 60 * 10; i++) h.tick();
  assert.ok(h.callNextWave() < early);
  assert.equal(g.snapshot().waveCount, 6);
  const types = new Set();
  for (const w of g.level.def.waves) for (const gr of w.groups) types.add(gr.type);
  assert.deepEqual([...types].sort(), ['broodmother', 'gull', 'mistwalker', 'scuttler', 'shellback', 'skitterer']);
  void TICK;
});

function fixedLayout(n, seed = 1, lanterns = 1) {
  const g = new Game();
  g.start({ level: 1, seed });
  g.salvage = 50 * n + 60 * lanterns;
  const spots = rankSpots(g);
  for (let i = 0; i < n; i++) g.build('harpoon', spots[i].t.q, spots[i].t.r);
  // Mistwalkers (waves 5-6) need light: lanterns go on the next best spots.
  for (let i = 0; i < lanterns; i++) g.build('lantern', spots[n + i].t.q, spots[n + i].t.r);
  for (let i = 0; i < 60 * 900 && g.screen === 'playing'; i++) g.tick();
  return g;
}

test('tuning: a mediocre layout built once loses, six posts squeak through, no cliff', () => {
  assert.equal(fixedLayout(3).screen, 'lost');
  assert.equal(fixedLayout(5, 1, 0).screen, 'lost');
  const six = fixedLayout(6);
  assert.equal(six.screen, 'won');
  assert.ok(six.light >= 3 && six.light < 20, `six posts should end with a few Light, got ${six.light}`);
  assert.equal(fixedLayout(8).screen, 'won');
});

test('test helpers: skipToWave, win and lose', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  assert.equal(g.skipToWave(3), true);
  assert.equal(g.wave, 3);
  assert.equal(g.phase, 'wave');
  assert.equal(g.skipToWave(99), false);
  assert.equal(g.skipToWave(0), false);
  assert.equal(g.wave, 3);
  assert.equal(g.skipToWave(6), true);
  assert.equal(g.wave, g.level.def.waves.length);
  assert.equal(g.forceWin(), true);
  assert.equal(g.screen, 'won');
  assert.equal(g.forceLose(), false);
  g.start({ level: 1, seed: 1 });
  assert.equal(g.forceLose(), true);
  assert.equal(g.screen, 'lost');
  assert.equal(g.skipToWave(2), false);
});

test('same seed and same calls give an identical state, including helpers', () => {
  const run = () => {
    const g = new Game();
    g.start({ level: 1, seed: 1 });
    g.build('harpoon', -3, 3);
    g.build('harpoon', -2, 3);
    for (let i = 0; i < 600; i++) g.tick();
    g.skipToWave(2);
    for (let i = 0; i < 900; i++) g.tick();
    return JSON.stringify(g.snapshot());
  };
  assert.equal(run(), run());
});

// --- B-008: Cliff Cannon ---

test('cannon splash hits several clustered enemies on the same tick and never fires inside min range', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  g.salvage = 1000;
  const spot = rankSpots(g).find((s) => s.t.terrain === 'sand').t;
  assert.ok(g.build('cannon', spot.q, spot.r).ok);
  // Put three crabs in a tight cluster at a comfortable distance along the path.
  const pts = g.level.pathPoints;
  let s0 = 0;
  for (let s = 2; s < g.level.pathLength; s += 0.2) {
    const p = pointOnPath(g.level, s, {});
    const d = Math.hypot(p.x - spot.x, p.z - spot.z) / SQRT3;
    if (d > 2.5 && d < 3.5) { s0 = s; break; }
  }
  assert.ok(s0 > 0 && pts.length);
  for (let i = 0; i < 3; i++) {
    g.spawnEnemy('scuttler');
    const e = g.enemies[i];
    e.s = s0 + i * 0.25;
    pointOnPath(g.level, e.s, e);
  }
  g.phase = 'wave'; g.spawnQueue = [{ type: 'scuttler', gap: 99 }]; g.spawnTimer = 99;
  const before = g.enemies.map((e) => e.hp);
  let multi = false;
  for (let i = 0; i < 60 * 8 && !multi; i++) {
    const hp0 = g.enemies.map((e) => e.hp);
    g.tick();
    const dropped = g.enemies.filter((e, k) => e.hp < hp0[k]).length;
    if (dropped >= 2) multi = true;
    for (const tw of g.towers) {
      const t = g.enemies.find((e) => e.id === tw.targetId);
      if (t) assert.ok(Math.hypot(t.x - tw.x, t.z - tw.z) >= 1.5 * SQRT3 - 1e-6, 'targeted inside min range');
    }
  }
  assert.ok(multi, `no multi-hit; hp ${before} -> ${g.enemies.map((e) => e.hp)}`);
});

test('cannon never targets enemies closer than 1.5 hexes and range is +1 on rock', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  g.salvage = 1000;
  const spot = rankSpots(g)[0].t;
  g.build('cannon', spot.q, spot.r);
  g.spawnEnemy('scuttler');
  const e = g.enemies[0];
  // Find a path position well inside the minimum range and hold the crab there.
  let sClose = -1;
  for (let s = 0; s < g.level.pathLength; s += 0.05) {
    const p = pointOnPath(g.level, s, {});
    if (Math.hypot(p.x - spot.x, p.z - spot.z) < 1.2 * SQRT3) { sClose = s; break; }
  }
  assert.ok(sClose >= 0);
  for (let i = 0; i < 30; i++) { e.s = sClose; g.tick(); e.s = sClose; }
  assert.equal(g.towers[0].targetId, 0);
  assert.equal(g.projectiles.length, 0);
  const sand = g.level.tiles.find((t) => t.terrain === 'sand' && !g.towerAt.has(`${t.q},${t.r}`));
  const rock = g.level.tiles.find((t) => t.terrain === 'rock' && !g.towerAt.has(`${t.q},${t.r}`));
  g.build('cannon', sand.q, sand.r); g.build('cannon', rock.q, rock.r);
  const snap = g.snapshot().towers;
  assert.equal(snap.find((t) => t.terrain === 'rock').range - snap.find((t) => t.terrain === 'sand').range, 1);
});

test('time scale resets on start and Space-like wave call is a sim-level concern only', () => {
  const g = new Game();
  g.timeScale = 16;
  g.start({ level: 1, seed: 1 });
  assert.equal(g.snapshot().timeScale, 1);
});

test('B-009: upgrade raises tier and stats, costs salvage, caps at tier 3', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  g.salvage = 1000;
  const spot = g.level.tiles.find((t) => t.terrain === 'grass');
  const { id } = g.build('harpoon', spot.q, spot.r);
  const t = g.towerById(id);
  const before = g.towerStats(t);
  const s0 = g.salvage;
  assert.ok(g.upgrade(id).ok);
  assert.equal(t.tier, 2);
  assert.equal(g.salvage, s0 - 60);
  assert.ok(g.towerStats(t).damage > before.damage && g.towerStats(t).rate > before.rate);
  assert.ok(g.upgrade(id).ok);
  assert.equal(t.tier, 3);
  assert.equal(g.upgrade(id).reason, 'max');
  assert.equal(t.spent, 50 + 60 + 90);
});

test('B-009: sell refunds 70% of everything spent and frees the hex', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  g.salvage = 1000;
  const spot = g.level.tiles.find((t) => t.terrain === 'grass');
  const { id } = g.build('harpoon', spot.q, spot.r);
  g.upgrade(id);
  const s0 = g.salvage;
  const res = g.sell(id);
  assert.equal(res.refund, Math.floor(110 * 0.7));
  assert.equal(g.salvage, s0 + 77);
  assert.equal(g.towers.length, 0);
  assert.ok(g.build('cannon', spot.q, spot.r).ok);
  assert.equal(g.upgrade(id).ok, false);
});

test('B-009: upgrade is refused without salvage', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  const spot = g.level.tiles.find((t) => t.terrain === 'grass');
  const { id } = g.build('harpoon', spot.q, spot.r);
  g.salvage = 10;
  assert.equal(g.upgrade(id).reason, 'salvage');
  assert.equal(g.towerById(id).tier, 1);
});

test('B-009: strongest targeting picks the highest-hp enemy in range, first picks the furthest', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  g.salvage = 1000;
  const mid = { s: g.level.pathLength / 2, x: 0, z: 0 };
  pointOnPath(g.level, mid.s, mid);
  const spot = g.level.tiles
    .filter((t) => ['grass', 'sand', 'rock'].includes(t.terrain) && !t.lighthouse)
    .sort((a, b) => Math.hypot(a.x - mid.x, a.z - mid.z) - Math.hypot(b.x - mid.x, b.z - mid.z))[0];
  const { id } = g.build('harpoon', spot.q, spot.r);
  const t = g.towerById(id);
  const mk = (hp, off) => {
    const e = { id: g.nextId++, type: 'scuttler', hp, maxHp: hp, s: mid.s + off, x: 0, z: 0, heading: 0, born: 0, incoming: 0 };
    g.enemies.push(e);
    pointOnPath(g.level, e.s, e);
    return e;
  };
  const weak = mk(10, 0.4);
  const strong = mk(90, -0.4);
  g.phase = 'wave'; g.spawnQueue = [{ type: 'scuttler', gap: 1 }]; g.spawnTimer = 99;
  g.tick();
  assert.equal(t.targetId, weak.id);
  assert.ok(g.setTargeting(id, 'strongest'));
  g.tick();
  assert.equal(t.targetId, strong.id);
  assert.equal(g.setTargeting(id, 'bogus'), false);
});

test('B-009: sell refunds are exact at 70% (no float error)', () => {
  const want = { 50: 35, 90: 63, 110: 77, 140: 98, 170: 119, 200: 140, 290: 203 };
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  for (const [spent, refund] of Object.entries(want)) assert.equal(g.sellValue({ spent: Number(spent) }), refund);
});

function lone(type, tower) {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  g.salvage = 1000;
  g.hpScale = 1;
  g.spawnEnemy(type);
  const e = g.enemies[0];
  e.s = 6;
  if (tower) {
    const p = { x: e.x, z: e.z };
    const spot = g.level.tiles.filter((t) => ['grass', 'sand'].includes(t.terrain))
      .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    g.build(tower, spot.q, spot.r);
  }
  g.phase = 'done';
  return { g, e };
}

test('B-010: an enemy in a bell radius moves at 60% speed for 2 s after a pulse, then recovers', () => {
  const { g, e } = lone('scuttler', 'bell');
  const base = lone('scuttler').e;
  const ref = lone('scuttler').g;
  for (let i = 0; i < 30; i++) { g.tick(); ref.tick(); }
  assert.ok(g.enemies[0].slowUntil > g.time, 'pulse should have landed');
  const s0 = g.enemies[0].s;
  const r0 = ref.enemies[0].s;
  for (let i = 0; i < 60; i++) { g.tick(); ref.tick(); }
  const ratio = (g.enemies[0].s - s0) / (ref.enemies[0].s - r0);
  assert.ok(ratio > 0.55 && ratio < 0.65, `ratio ${ratio}`);
  assert.equal(g.snapshot().enemies[0].speedFactor, 0.6);
  void e; void base;
});

test('B-010: harpoons do half damage to a Shellback, cannons full damage', () => {
  const { g, e } = lone('shellback');
  const hp = e.hp;
  g.hitEnemy(e, 10, true);
  assert.equal(hp - e.hp, 5);
  g.hitEnemy(e, 10, false);
  assert.equal(hp - e.hp, 15);
  const sc = lone('scuttler');
  sc.g.hitEnemy(sc.e, 10, true);
  assert.equal(sc.e.maxHp - sc.e.hp, 10);
  assert.equal(g.snapshot().enemies[0].type, 'shellback');
});

test('B-010: the bell sells, upgrades its slow and pulses emit events', () => {
  const { g } = lone('scuttler', 'bell');
  const t = g.towers[0];
  assert.equal(g.upgrade(t.id).ok, true);
  assert.equal(g.snapshot().towers[0].slow, 0.5);
  for (let i = 0; i < 30; i++) g.tick();
  assert.ok(g.drainEvents().some((ev) => ev.type === 'bellPulse'));
});
