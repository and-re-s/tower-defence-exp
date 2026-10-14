import { TICK } from './clock.js';
import { hexesToWorld, TOWER_TYPES, towerStats } from './towers.js';
import { pointOnPath } from './levels.js';
import { ENEMY_TYPES } from './enemies.js';
import { SQRT3 } from './hex.js';

const HIT_RADIUS = 0.15;

/** Higher score = preferred target: first = furthest along the path, strongest = most hp, closest = nearest. */
function priority(mode, e, d2) {
  if (mode === 'strongest') return e.hp * 1000 + e.s;
  if (mode === 'closest') return -d2;
  return e.s;
}

/** Towers pick the enemy furthest along the path and launch projectiles; projectiles home in and hurt. */
export function updateTowers(game) {
  // Damage already flying towards an enemy, so towers do not waste shots on doomed targets.
  for (const e of game.enemies) e.incoming = 0;
  for (const p of game.projectiles) {
    if (p.kind === 'shell') continue;
    const e = game.enemyById(p.targetId);
    if (e) e.incoming += p.damage * (1 - (ENEMY_TYPES[e.type].armor || 0));
  }
  for (const t of game.towers) {
    if (t.type === 'bell') { updateBell(game, t); continue; }
    if (t.type === 'lantern') continue; // lights via lantern.js
    const stats = { ...TOWER_TYPES[t.type], ...towerStats(t.type, t.tier) };
    t.cooldown = Math.max(0, t.cooldown - TICK);
    const reach = hexesToWorld(t.range);
    const minReach = stats.minRange ? hexesToWorld(stats.minRange) : 0;
    let best = null;
    let fallback = { e: null, score: -Infinity };
    for (const e of game.enemies) {
      if (!e.revealed) continue; // cloaked and outside lantern light
      if (e.flying && (stats.blast || t.type !== 'harpoon')) continue; // only harpoons reach gulls
      const dx = e.x - t.x;
      const dz = e.z - t.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > reach * reach || d2 < minReach * minReach) continue;
      const score = priority(t.targeting, e, d2);
      if (!fallback || score > fallback.score) fallback = { e, score };
      if (e.hp - e.incoming > 0 && (!best || score > best.score)) best = { e, score };
    }
    best = best && best.e;
    const target = best || fallback.e;
    t.targetId = target ? target.id : 0;
    if (!target) continue;
    t.angle = Math.atan2(target.x - t.x, target.z - t.z);
    if (t.cooldown > 0 || !best) continue;
    t.cooldown = 1 / stats.rate;
    if (stats.blast) { fireShell(game, t, stats, best); continue; }
    const p = {
      id: game.nextProjectileId++, towerId: t.id, targetId: best.id, x: t.x, z: t.z,
      ox: t.x, oz: t.z, damage: stats.damage, speed: stats.projectileSpeed, progress: 0,
      total: Math.hypot(best.x - t.x, best.z - t.z) || 1,
    };
    best.incoming += p.damage * (1 - (ENEMY_TYPES[best.type].armor || 0));
    game.projectiles.push(p);
    game.events.push({ type: 'fire', towerId: t.id, towerType: t.type, projectileId: p.id });
  }
}

/** The bell rings when an enemy is in reach; the ring slows everything inside the radius. */
function updateBell(game, t) {
  t.cooldown = Math.max(0, t.cooldown - TICK);
  if (t.cooldown > 0) return;
  const reach = hexesToWorld(t.range);
  const inside = game.enemies.filter((e) => !e.flying && (e.x - t.x) ** 2 + (e.z - t.z) ** 2 <= reach * reach);
  if (!inside.length) return;
  const { rate, slow } = { ...TOWER_TYPES.bell, ...towerStats('bell', t.tier) };
  t.cooldown = 1 / rate;
  t.pulsedAt = game.time;
  for (const e of inside) {
    e.slow = game.time < e.slowUntil ? Math.max(e.slow, slow) : slow;
    e.slowUntil = game.time + TOWER_TYPES.bell.slowTime;
  }
  game.events.push({ type: 'bellPulse', towerId: t.id, x: t.x, y: t.y, z: t.z, radius: reach });
}

/** Shells fly to a fixed landing point, aimed where the target will be when the shell arrives. */
function fireShell(game, t, stats, target) {
  const speed = ENEMY_TYPES[target.type].speed * SQRT3;
  const aim = { x: target.x, z: target.z };
  let flight = Math.hypot(target.x - t.x, target.z - t.z) / stats.projectileSpeed;
  for (let i = 0; i < 2; i++) {
    pointOnPath(game.level, Math.min(game.level.pathLength, target.s + speed * flight), aim);
    flight = Math.hypot(aim.x - t.x, aim.z - t.z) / stats.projectileSpeed;
  }
  t.angle = Math.atan2(aim.x - t.x, aim.z - t.z);
  game.projectiles.push({
    id: game.nextProjectileId++, towerId: t.id, targetId: target.id, kind: 'shell', x: t.x, z: t.z, ox: t.x, oz: t.z,
    tx: aim.x, tz: aim.z, damage: stats.damage, blast: hexesToWorld(stats.blast), speed: stats.projectileSpeed,
    progress: 0, total: Math.max(0.5, flight * stats.projectileSpeed), flight: Math.max(0.2, flight),
  });
  game.events.push({ type: 'fire', towerId: t.id, towerType: t.type, projectileId: game.nextProjectileId - 1 });
}

function explode(game, p) {
  const hits = game.enemies.filter((e) => !e.flying && Math.hypot(e.x - p.tx, e.z - p.tz) <= p.blast);
  game.events.push({ type: 'explode', x: p.tx, z: p.tz, radius: p.blast });
  for (const e of hits) game.hitEnemy(e, p.damage);
}

export function updateProjectiles(game) {
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const p = game.projectiles[i];
    if (p.kind === 'shell') {
      p.progress = Math.min(1, p.progress + TICK / p.flight);
      p.x = p.ox + (p.tx - p.ox) * p.progress;
      p.z = p.oz + (p.tz - p.oz) * p.progress;
      if (p.progress >= 1) { game.projectiles.splice(i, 1); explode(game, p); }
      continue;
    }
    const e = game.enemyById(p.targetId);
    if (!e) { game.projectiles.splice(i, 1); continue; }
    const dx = e.x - p.x;
    const dz = e.z - p.z;
    const d = Math.hypot(dx, dz);
    const step = p.speed * TICK;
    if (d <= step + HIT_RADIUS) {
      game.projectiles.splice(i, 1);
      game.hitEnemy(e, p.damage, true);
      continue;
    }
    p.x += (dx / d) * step;
    p.z += (dz / d) * step;
    p.progress = Math.min(1, Math.hypot(p.x - p.ox, p.z - p.oz) / p.total);
  }
}
