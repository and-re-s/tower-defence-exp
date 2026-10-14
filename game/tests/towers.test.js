import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, TICK } from '../src/sim/game.js';
import { SQRT3 } from '../src/sim/hex.js';

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
  assert.deepEqual([...types].sort(), ['scuttler', 'skitterer']);
  void TICK;
});

function fixedLayout(n, seed = 1) {
  const g = new Game();
  g.start({ level: 1, seed });
  g.salvage = 50 * n;
  const spots = rankSpots(g);
  for (let i = 0; i < n; i++) g.build('harpoon', spots[i].t.q, spots[i].t.r);
  for (let i = 0; i < 60 * 900 && g.screen === 'playing'; i++) g.tick();
  return g;
}

test('tuning: a mediocre layout built once loses, a strong one still leaks', () => {
  assert.equal(fixedLayout(3).screen, 'lost');
  assert.equal(fixedLayout(6).screen, 'lost');
  const eight = fixedLayout(8);
  assert.equal(eight.screen, 'won');
  assert.ok(eight.light < 20, 'eight posts should leak at least once');
});

test('test helpers: skipToWave, win and lose', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  assert.equal(g.skipToWave(3), true);
  assert.equal(g.wave, 3);
  assert.equal(g.phase, 'wave');
  assert.equal(g.skipToWave(99), true);
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
