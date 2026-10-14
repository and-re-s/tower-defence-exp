import { TICK } from './clock.js';
import { hexesToWorld, TOWER_TYPES } from './towers.js';

const HIT_RADIUS = 0.15;

/** Towers pick the enemy furthest along the path and launch projectiles; projectiles home in and hurt. */
export function updateTowers(game) {
  // Damage already flying towards an enemy, so towers do not waste shots on doomed targets.
  for (const e of game.enemies) e.incoming = 0;
  for (const p of game.projectiles) {
    const e = game.enemyById(p.targetId);
    if (e) e.incoming += p.damage;
  }
  for (const t of game.towers) {
    const stats = TOWER_TYPES[t.type];
    t.cooldown = Math.max(0, t.cooldown - TICK);
    const reach = hexesToWorld(t.range);
    let best = null;
    let fallback = null;
    for (const e of game.enemies) {
      const dx = e.x - t.x;
      const dz = e.z - t.z;
      if (dx * dx + dz * dz > reach * reach) continue;
      if (!fallback || e.s > fallback.s) fallback = e;
      if (e.hp - e.incoming > 0 && (!best || e.s > best.s)) best = e;
    }
    const target = best || fallback;
    t.targetId = target ? target.id : 0;
    if (!target) continue;
    t.angle = Math.atan2(target.x - t.x, target.z - t.z);
    if (t.cooldown > 0 || !best) continue;
    t.cooldown = 1 / stats.rate;
    const p = {
      id: game.nextProjectileId++, towerId: t.id, targetId: best.id, x: t.x, z: t.z,
      ox: t.x, oz: t.z, damage: stats.damage, speed: stats.projectileSpeed, progress: 0,
      total: Math.hypot(best.x - t.x, best.z - t.z) || 1,
    };
    best.incoming += p.damage;
    game.projectiles.push(p);
    game.events.push({ type: 'fire', towerId: t.id, towerType: t.type, projectileId: p.id });
  }
}

export function updateProjectiles(game) {
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const p = game.projectiles[i];
    const e = game.enemyById(p.targetId);
    if (!e) { game.projectiles.splice(i, 1); continue; }
    const dx = e.x - p.x;
    const dz = e.z - p.z;
    const d = Math.hypot(dx, dz);
    const step = p.speed * TICK;
    if (d <= step + HIT_RADIUS) {
      game.projectiles.splice(i, 1);
      game.hitEnemy(e, p.damage);
      continue;
    }
    p.x += (dx / d) * step;
    p.z += (dz / d) * step;
    p.progress = Math.min(1, Math.hypot(p.x - p.ox, p.z - p.oz) / p.total);
  }
}
