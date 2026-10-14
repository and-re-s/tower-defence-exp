import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/sim/game.js';
import { SQRT3 } from '../src/sim/hex.js';
import { pointOnPath } from '../src/sim/levels.js';

function setup() {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  g.salvage = 1000;
  return g;
}
/** A sand hex next to the path and the path distance s whose point is `dist` hexes from it. */
function spotAndPoint(g, dist) {
  const spot = g.level.tiles.find((t) => t.terrain === 'sand' && t.q === -2 && t.r === 3) || g.level.tiles.find((t) => t.terrain === 'sand');
  for (let s = 1; s < g.level.pathLength; s += 0.05) {
    const p = pointOnPath(g.level, s, {});
    if (Math.abs(Math.hypot(p.x - spot.x, p.z - spot.z) / SQRT3 - dist) < 0.05) return { spot, s };
  }
  throw new Error('no point');
}
function spawn(g, type, s) {
  g.spawnEnemy(type);
  const e = g.enemies[g.enemies.length - 1];
  e.s = s;
  pointOnPath(g.level, s, e);
  return e;
}

test('a Mistwalker is cloaked: towers ignore it outside lantern light and shoot it inside', () => {
  const g = setup();
  const { spot, s } = spotAndPoint(g, 2);
  assert.ok(g.build('harpoon', spot.q, spot.r).ok);
  const m = spawn(g, 'mistwalker', s);
  m.speed = 0;
  for (let i = 0; i < 120; i++) g.tick();
  assert.equal(g.towers[0].targetId, 0);
  assert.equal(m.hp, m.maxHp);
  assert.deepEqual([g.snapshot().enemies[0].cloaked, g.snapshot().enemies[0].revealed], [true, false]);
  // Light a lantern on a neighbouring free hex.
  const nb = g.level.tiles.find((t) => t.terrain === 'sand' && !g.towerAt.has(`${t.q},${t.r}`) && Math.hypot(t.x - spot.x, t.z - spot.z) < 2 * SQRT3 && Math.hypot(t.x - m.x, t.z - m.z) < 2.5 * SQRT3);
  assert.ok(nb && g.build('lantern', nb.q, nb.r).ok);
  g.tick();
  assert.equal(g.snapshot().enemies[0].revealed, true);
  g.tick();
  assert.equal(g.towers[0].targetId, m.id);
});

test('lantern light burns enemies and marks them for +15% damage', () => {
  const g = setup();
  const lamp = g.level.tiles.find((t) => t.terrain === 'sand' && t.q === -2 && t.r === 3);
  g.build('lantern', lamp.q, lamp.r);
  const { s } = spotAndPoint(g, 1.5);
  const inLight = spawn(g, 'scuttler', s);
  const outside = spawn(g, 'scuttler', 0);
  const hp0 = inLight.hp;
  g.tick();
  assert.ok(inLight.lit && inLight.marked && !outside.lit);
  for (let i = 0; i < 59; i++) { inLight.s = s; pointOnPath(g.level, s, inLight); g.tick(); }
  assert.ok(Math.abs(hp0 - inLight.hp - 4) < 0.1, `burned ${hp0 - inLight.hp}`);
  assert.ok(outside.hp === outside.maxHp);
  const before = inLight.hp;
  g.hitEnemy(inLight, 20);
  assert.ok(Math.abs(before - inLight.hp - 23) < 0.2);
  g.hitEnemy(outside, 20);
  assert.equal(outside.maxHp - outside.hp, 20);
});

test('burn alone can kill and pays the reward', () => {
  const g = setup();
  const lamp = g.level.tiles.find((t) => t.terrain === 'sand' && t.q === -2 && t.r === 3);
  g.build('lantern', lamp.q, lamp.r);
  const { s } = spotAndPoint(g, 1.5);
  const e = spawn(g, 'skitterer', s);
  e.hp = 1;
  const salvage = g.salvage;
  for (let i = 0; i < 30; i++) { e.s = s; pointOnPath(g.level, s, e); g.tick(); }
  assert.equal(g.enemies.length, 0);
  assert.ok(g.salvage > salvage && g.kills === 1);
});

test('the next wave preview matches what spawns', () => {
  const g = setup();
  g.light = 1e6;
  for (let w = 1; w <= g.level.def.waves.length; w++) {
    const info = g.snapshot().nextWave;
    assert.equal(info.number, w);
    const counts = {};
    g.skipToWave(w);
    const spawned = {};
    for (let i = 0; i < 60 * 120 && g.spawnQueue.length; i++) {
      g.tick();
      for (const ev of g.drainEvents()) if (ev.type === 'spawn') spawned[ev.enemyType] = (spawned[ev.enemyType] || 0) + 1;
    }
    for (const gr of info.groups) counts[gr.type] = gr.count;
    assert.deepEqual(spawned, counts);
    g.wave = w;
  }
  g.wave = g.level.def.waves.length;
  assert.equal(g.snapshot().nextWave, null);
});

test('calling a wave early pays a bigger bonus the earlier it is called', () => {
  const a = setup();
  a.tick();
  const b = setup();
  for (let i = 0; i < 600; i++) b.tick();
  assert.ok(a.callNextWave() > b.callNextWave());
});
