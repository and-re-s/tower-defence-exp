import { TICK } from './clock.js';
import { hexesToWorld, TOWER_TYPES, towerStats } from './towers.js';
import { ENEMY_TYPES } from './enemies.js';

/**
 * Lantern light: every enemy inside a lantern's radius is lit (revealed to towers), marked (+damage from all
 * sources) and burns. Overlapping lanterns do not stack: the strongest burn applies.
 */
export function updateLanterns(game) {
  const lamps = [];
  for (const t of game.towers) {
    if (t.type !== 'lantern') continue;
    const reach = hexesToWorld(t.range);
    lamps.push({ t, reach2: reach * reach, burn: towerStats('lantern', t.tier).damage });
  }
  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const e = game.enemies[i];
    let burn = 0;
    let lit = false;
    for (const l of lamps) {
      if ((e.x - l.t.x) ** 2 + (e.z - l.t.z) ** 2 <= l.reach2) { lit = true; burn = Math.max(burn, l.burn); }
    }
    e.lit = lit;
    e.marked = lit;
    e.revealed = !ENEMY_TYPES[e.type].cloaked || lit;
    e.burn = burn;
    if (burn > 0) {
      e.hp -= burn * TICK;
      if (e.hp <= 0) game.killEnemy(e);
    }
  }
}

export const MARK_BONUS = TOWER_TYPES.lantern.mark;
