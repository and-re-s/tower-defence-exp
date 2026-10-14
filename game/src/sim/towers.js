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
  // Rings every 2 s while an enemy is in reach; the ring slows every ground enemy inside `range` for `slowTime`.
  bell: {
    name: 'Tide Bell', cost: 70, range: 2.5, rockBonus: 0, damage: 0, rate: 0.5, slow: 0.4, slowTime: 2, hotkey: 3,
    blurb: 'Slows enemies in an area',
  },
};

// Upgrade tiers: cost to reach the tier, damage and fire-rate multipliers. Tier 3 is the maximum.
export const MAX_TIER = 3;
export const TIERS = {
  harpoon: { 2: { cost: 60, damage: 1.5, rate: 1.1 }, 3: { cost: 90, damage: 2.1, rate: 1.25 } },
  cannon: { 2: { cost: 80, damage: 1.5, rate: 1.1 }, 3: { cost: 120, damage: 2.2, rate: 1.25 } },
  // The bell deals no damage: tiers deepen the slow (40% -> 50% -> 60%).
  bell: { 2: { cost: 50, damage: 1, rate: 1, slow: 0.5 }, 3: { cost: 85, damage: 1, rate: 1, slow: 0.6 } },
};
export const TARGETING = ['first', 'strongest', 'closest'];
export const SELL_REFUND = 0.7;

/** Damage and shots per second of a tower of this type at this tier. */
export function towerStats(type, tier) {
  const base = TOWER_TYPES[type];
  const m = TIERS[type][tier] || { damage: 1, rate: 1 };
  const out = { damage: Math.round(base.damage * m.damage * 10) / 10, rate: Math.round(base.rate * m.rate * 1000) / 1000 };
  if (base.slow) out.slow = m.slow || base.slow;
  return out;
}

export const BUILDABLE_TERRAIN = new Set(['sand', 'grass', 'rock']);

/** Range in hexes for a tower of this type standing on this terrain. */
export function towerRange(type, terrain) {
  const t = TOWER_TYPES[type];
  return t.range + (terrain === 'rock' ? t.rockBonus : 0);
}

export const hexesToWorld = (hexes) => hexes * SQRT3;
