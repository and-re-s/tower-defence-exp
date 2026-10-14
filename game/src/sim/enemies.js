// Enemy type stats. speed is in hexes per second, leak is the Light removed at the lighthouse.
export const ENEMY_TYPES = {
  scuttler: { hp: 40, speed: 1.0, leak: 1, reward: 4 },
  skitterer: { hp: 25, speed: 1.8, leak: 1, reward: 3 },
  // armor: share of piercing (harpoon) damage that is shrugged off.
  shellback: { hp: 120, speed: 0.6, leak: 2, reward: 9, armor: 0.5 },
  // cloaked: towers cannot target it unless it stands inside a Lantern's light.
  mistwalker: { hp: 60, speed: 0.8, leak: 1, reward: 7, cloaked: true },
};

export const ENEMY_NAMES = { scuttler: 'Scuttler', skitterer: 'Skitterer', shellback: 'Shellback', mistwalker: 'Mistwalker' };
