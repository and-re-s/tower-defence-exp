import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, TICK } from '../src/sim/game.js';
import { buildLevel } from '../src/sim/levels.js';
import { DIRS, hexDistance } from '../src/sim/hex.js';

function runToEnd(game, maxSeconds = 600) {
  const ticks = Math.round(maxSeconds / TICK);
  for (let i = 0; i < ticks && game.screen === 'playing'; i++) game.tick();
}

function assertFinite(value, path = 'state') {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} is not finite`);
  else if (Array.isArray(value)) value.forEach((v, i) => assertFinite(v, `${path}[${i}]`));
  else if (value && typeof value === 'object') for (const k of Object.keys(value)) assertFinite(value[k], `${path}.${k}`);
}

test('level 1: path is a continuous chain from a beach to the lighthouse', () => {
  const lvl = buildLevel(1);
  const { path, lighthouse } = lvl;
  assert.ok(path.length > 10);
  assert.deepEqual(path[path.length - 1], { q: lighthouse.q, r: lighthouse.r });
  for (let i = 1; i < path.length; i++) {
    assert.equal(hexDistance(path[i - 1].q, path[i - 1].r, path[i].q, path[i].r), 1, `gap at ${i}`);
  }
  assert.equal(new Set(path.map((p) => `${p.q},${p.r}`)).size, path.length, 'path revisits a hex');
  const first = path[0];
  assert.ok(hexDistance(first.q, first.r, 0, 0) >= 5, 'path starts on a beach hex');
  void DIRS;
});

test('level 1: terrain variety and heights', () => {
  const s = (() => { const g = new Game(); g.start({ level: 1, seed: 1 }); return g.snapshot(); })();
  assert.ok(Object.keys(s.terrainCounts).length >= 4);
  assert.ok(s.heights.length >= 3);
  assert.ok(s.terrainCounts.rock > 0 && s.terrainCounts.grass > 0 && s.terrainCounts.sand > 0);
});

test('enemies advance along the path and stay on it', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  let last = new Map();
  let seen = 0;
  for (let i = 0; i < 60 * 20; i++) {
    g.tick();
    for (const e of g.enemies) {
      assert.ok(e.s >= (last.get(e.id) ?? 0));
      last.set(e.id, e.s);
      assert.ok(e.s >= 0 && e.s <= g.level.pathLength);
      seen++;
    }
  }
  assert.ok(seen > 0, 'enemies spawned');
});

test('with no towers the level is lost and Light never goes below 0', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  let leaks = 0;
  for (let i = 0; i < 60 * 600 && g.screen === 'playing'; i++) {
    g.tick();
    for (const ev of g.drainEvents()) if (ev.type === 'leak') leaks++;
    assert.ok(g.light >= 0);
  }
  assert.equal(g.screen, 'lost');
  assert.equal(g.light, 0);
  assert.ok(leaks >= 20);
  assertFinite(g.snapshot());
  g.start({ level: 1, seed: 1 });
  assert.equal(g.snapshot().light, 20);
  assert.equal(g.screen, 'playing');
});

test('same seed gives the same result', () => {
  const a = new Game();
  const b = new Game();
  a.start({ level: 1, seed: 7 });
  b.start({ level: 1, seed: 7 });
  const frames = [];
  for (let i = 0; i < 60 * 40; i++) {
    a.tick();
    b.tick();
    if (i % 300 === 0) frames.push([JSON.stringify(a.snapshot()), JSON.stringify(b.snapshot())]);
  }
  for (const [x, y] of frames) assert.equal(x, y);
  runToEnd(a);
  runToEnd(b);
  assert.equal(JSON.stringify(a.snapshot()), JSON.stringify(b.snapshot()));
});

test('pause freezes time', () => {
  const g = new Game();
  g.start({ level: 1, seed: 1 });
  for (let i = 0; i < 100; i++) g.tick();
  g.pause();
  const t = g.time;
  for (let i = 0; i < 100; i++) g.tick();
  assert.equal(g.time, t);
  g.resume();
  g.tick();
  assert.ok(g.time > t);
});
