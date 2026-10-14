import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/sim/game.js';

test('time of day advances with each wave and reaches night on the last', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  assert.equal(g.snapshot().timeOfDay, 0);
  let prev = 0;
  const n = g.level.def.waves.length;
  for (let w = 1; w <= n; w++) {
    g.skipToWave(w);
    const t = g.snapshot().timeOfDay;
    assert.ok(t >= prev, 'monotonic');
    prev = t;
  }
  assert.equal(prev, 1);
});

test('pausing freezes time, restart gives a fresh run', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  for (let i = 0; i < 30; i++) g.tick();
  g.pause();
  const t = g.time;
  for (let i = 0; i < 30; i++) g.tick();
  assert.equal(g.time, t);
  g.resume();
  g.start({ level: 1, seed: 1 });
  assert.equal(g.time, 0);
  assert.equal(g.enemies.length, 0);
  g.skipToWave(2);
  g.toMenu();
  assert.equal(g.enemies.length + g.towers.length, 0);
});
