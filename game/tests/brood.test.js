import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/sim/game.js';

function fresh() {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  g.salvage = 1000;
  return g;
}

test('killing a Broodmother adds 4 Skitterers at its position', () => {
  const g = fresh();
  const b = g.spawnEnemy('broodmother');
  for (let i = 0; i < 300; i++) g.tick();
  g.hitEnemy(b, 9999);
  const kids = g.enemies.filter((e) => e.type === 'skitterer');
  assert.equal(kids.length, 4);
  for (const k of kids) assert.ok(Math.hypot(k.x - b.x, k.z - b.z) < 0.9);
  assert.equal(g.enemies.some((e) => e.type === 'broodmother'), false);
});

test('a gull flies a straight line to the lighthouse and leaks', () => {
  const g = fresh();
  const gull = g.spawnEnemy('gull');
  const a = { x: gull.x, z: gull.z };
  const l = g.level.lighthouse;
  const snaps = [];
  for (let i = 0; i < 60 * 40 && g.enemies.includes(gull); i++) {
    g.tick();
    if (i % 30 === 0 && g.enemies.includes(gull)) snaps.push({ x: gull.x, z: gull.z });
  }
  assert.ok(snaps.length > 3);
  for (const p of snaps) {
    // cross product of (p - a) and (l - a) is zero on the straight line
    const cross = (p.x - a.x) * (l.z - a.z) - (p.z - a.z) * (l.x - a.x);
    assert.ok(Math.abs(cross) < 0.05, `off the line by ${cross}`);
  }
  assert.equal(g.light, 19);
});

test('cannons and bells ignore gulls, harpoons shoot them', () => {
  for (const [type, expectHit] of [['cannon', false], ['bell', false], ['harpoon', true]]) {
    const g = fresh();
    const l = g.level.lighthouse;
    // Build next to the lighthouse on any free buildable tile.
    const spot = g.level.tiles.filter((t) => ['sand', 'grass', 'rock'].includes(t.terrain) && !t.lighthouse)
      .sort((a, b) => Math.hypot(a.x - l.x, a.z - l.z) - Math.hypot(b.x - l.x, b.z - l.z))
      .find((t) => g.buildBlocker(type, t.q, t.r) === null);
    g.build(type, spot.q, spot.r);
    const gull = g.spawnEnemy('gull');
    const hp = gull.hp;
    let hurt = false;
    for (let i = 0; i < 60 * 30 && g.enemies.includes(gull); i++) { g.tick(); if (gull.hp < hp) hurt = true; }
    assert.equal(hurt, expectHit, type);
  }
});
