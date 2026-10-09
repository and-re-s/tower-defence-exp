import { hexDisk, hexDistance, hexKey, hexLine, hexToWorld } from './hex.js';
import { hash2 } from './rng.js';

// Terrain heights (world units). Rock heights vary per tile.
export const TERRAIN_HEIGHT = { shallows: 0.05, sand: 0.25, path: 0.25, grass: 0.5, rock: 1.0 };

// Authored level data. Terrain, heights and paths are data; props use the level seed.
export const LEVELS = {
  1: {
    id: 1,
    name: 'Driftwood Cove',
    radius: 6,
    terrainSalt: 11,
    lighthouse: { q: 2, r: -2 },
    waypoints: [[-5, 3], [-2, 4], [1, 2], [-2, 0], [-1, -3], [2, -3], [2, -2]],
    rocks: {
      '2,-2': 1.25, '3,-2': 1.0, '3,-3': 0.75, '1,-1': 1.0, '0,0': 1.25, '1,0': 1.0, '0,-1': 0.75,
      '-3,2': 0.75, '-3,1': 1.0, '-4,2': 0.75, '-4,1': 0.75,
    },
    startLight: 20,
    startSalvage: 150,
    // Breather before the first wave, then per-wave groups of enemies spawned `interval` s apart.
    firstBreather: 6,
    breather: 8,
    waves: [5, 7, 9, 11, 13, 15].map((count) => ({ groups: [{ type: 'scuttler', count, interval: 1.2 }] })),
  },
};

/** Builds tiles, the enemy path and the lighthouse position from level data. */
export function buildLevel(id) {
  const def = LEVELS[id];
  if (!def) throw new Error(`Unknown level ${id}`);

  const pathHexes = [];
  for (let i = 0; i < def.waypoints.length - 1; i++) {
    const [aq, ar] = def.waypoints[i];
    const [bq, br] = def.waypoints[i + 1];
    const seg = hexLine(aq, ar, bq, br);
    pathHexes.push(...(i === 0 ? seg : seg.slice(1)));
  }
  const pathKeys = new Set(pathHexes.map((h) => hexKey(h.q, h.r)));
  const lhKey = hexKey(def.lighthouse.q, def.lighthouse.r);

  const tiles = [];
  const tileMap = new Map();
  for (const { q, r } of hexDisk(def.radius)) {
    const key = hexKey(q, r);
    const d = hexDistance(q, r, 0, 0);
    const n = hash2(q, r, def.terrainSalt);
    let terrain;
    let height;
    if (key in def.rocks) {
      terrain = 'rock';
      height = def.rocks[key];
    } else if (d >= def.radius) {
      terrain = 'shallows';
      height = TERRAIN_HEIGHT.shallows;
    } else if (pathKeys.has(key)) {
      terrain = 'path';
      height = TERRAIN_HEIGHT.path;
    } else if (d === def.radius - 1) {
      terrain = 'sand';
      height = TERRAIN_HEIGHT.sand;
    } else if (d === def.radius - 2) {
      terrain = n > 0.62 ? 'grass' : 'sand';
      height = TERRAIN_HEIGHT[terrain];
    } else {
      terrain = n > 0.3 ? 'grass' : 'sand';
      height = TERRAIN_HEIGHT[terrain];
    }
    const w = hexToWorld(q, r);
    const tile = {
      q, r, x: w.x, z: w.z, terrain, height,
      lighthouse: key === lhKey,
      jitter: hash2(q, r, def.terrainSalt + 7),
    };
    tiles.push(tile);
    tileMap.set(key, tile);
  }

  // Enemy walking line: starts in the surf one hex beyond the beach, then the path hex centers.
  const first = pathHexes[0];
  const dir = hexToWorld(first.q, first.r);
  const len = Math.hypot(dir.x, dir.z) || 1;
  const pathPoints = [{ x: dir.x + (dir.x / len) * 1.8, z: dir.z + (dir.z / len) * 1.8 }];
  for (const h of pathHexes) pathPoints.push(hexToWorld(h.q, h.r));
  const cumulative = [0];
  for (let i = 1; i < pathPoints.length; i++) {
    cumulative.push(cumulative[i - 1] + Math.hypot(pathPoints[i].x - pathPoints[i - 1].x, pathPoints[i].z - pathPoints[i - 1].z));
  }

  const lhWorld = hexToWorld(def.lighthouse.q, def.lighthouse.r);
  const lhTile = tileMap.get(lhKey);
  return {
    def, tiles, tileMap,
    path: pathHexes.map(({ q, r }) => ({ q, r })),
    pathPoints, pathLength: cumulative[cumulative.length - 1], pathCumulative: cumulative,
    lighthouse: { q: def.lighthouse.q, r: def.lighthouse.r, x: lhWorld.x, z: lhWorld.z, baseY: lhTile.height },
  };
}

/** Position on the enemy walking line at distance s, plus the heading angle (radians around Y). */
export function pointOnPath(level, s, out) {
  const pts = level.pathPoints;
  const cum = level.pathCumulative;
  const clamped = Math.max(0, Math.min(level.pathLength, s));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < clamped) i++;
  const segLen = cum[i] - cum[i - 1] || 1;
  const t = (clamped - cum[i - 1]) / segLen;
  out.x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t;
  out.z = pts[i - 1].z + (pts[i].z - pts[i - 1].z) * t;
  out.heading = Math.atan2(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  return out;
}
