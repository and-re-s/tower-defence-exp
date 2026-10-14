import { SQRT3 } from './hex.js';

// Tower stat table. Ranges are in hexes; rock tiles add `rockBonus` hexes (the high-ground rule).
export const TOWER_TYPES = {
  harpoon: {
    name: 'Harpoon Post', cost: 50, range: 3.5, rockBonus: 1, damage: 12, rate: 1.2, projectileSpeed: 15, hotkey: 1,
    blurb: 'Fast single-target bolts',
  },
  // Lobs an arcing shell at a point on the path; the blast hurts every ground enemy inside `blast` hexes.
  cannon: {
    name: 'Cliff Cannon', cost: 90, range: 4, rockBonus: 1, minRange: 1.5, damage: 24, rate: 0.5, projectileSpeed: 7,
    blast: 1.2, hotkey: 2, blurb: 'Slow shells, splash damage',
  },
};

export const BUILDABLE_TERRAIN = new Set(['sand', 'grass', 'rock']);

/** Range in hexes for a tower of this type standing on this terrain. */
export function towerRange(type, terrain) {
  const t = TOWER_TYPES[type];
  return t.range + (terrain === 'rock' ? t.rockBonus : 0);
}

export const hexesToWorld = (hexes) => hexes * SQRT3;
