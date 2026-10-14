import { SQRT3 } from './hex.js';

// Tower stat table. Ranges are in hexes; rock tiles add `rockBonus` hexes (the high-ground rule).
export const TOWER_TYPES = {
  harpoon: {
    name: 'Harpoon Post', cost: 50, range: 3.5, rockBonus: 1, damage: 12, rate: 1.2, projectileSpeed: 15,
  },
};

export const BUILDABLE_TERRAIN = new Set(['sand', 'grass', 'rock']);

/** Range in hexes for a tower of this type standing on this terrain. */
export function towerRange(type, terrain) {
  const t = TOWER_TYPES[type];
  return t.range + (terrain === 'rock' ? t.rockBonus : 0);
}

export const hexesToWorld = (hexes) => hexes * SQRT3;
