// Spec palette (hex ints). New hues are not allowed; use tints and shades of these.
export const PAL = {
  deepSea: 0x13294b,
  shallows: 0x2e8c94,
  sand: 0xe3c27a,
  packedSand: 0x8a6d3a,
  moss: 0x5e8c4e,
  basalt: 0x625e7a,
  amber: 0xffb23e,
  brine: 0x4df2c9,
  coral: 0xe85a4f,
  whitewash: 0xede6d6,
  apricot: 0xf4a462,
};

export const cssHex = (n) => `#${n.toString(16).padStart(6, '0')}`;
