// Axial hex math for flat-top hexes of radius 1 (q to the east, r to the south-east).
export const SQRT3 = Math.sqrt(3);
export const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

export const hexKey = (q, r) => `${q},${r}`;

export function hexToWorld(q, r) {
  return { x: 1.5 * q, z: SQRT3 * (r + q / 2) };
}

export function hexDistance(aq, ar, bq, br) {
  const dq = aq - bq;
  const dr = ar - br;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

function cubeRound(fq, fr) {
  const fs = -fq - fr;
  let q = Math.round(fq);
  let r = Math.round(fr);
  const s = Math.round(fs);
  const dq = Math.abs(q - fq);
  const dr = Math.abs(r - fr);
  const ds = Math.abs(s - fs);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return { q, r };
}

export function worldToHex(x, z) {
  const q = (2 / 3) * x;
  const r = z / SQRT3 - q / 2;
  return cubeRound(q, r);
}

/** Hexes on the straight line from a to b, both included. */
export function hexLine(aq, ar, bq, br) {
  const n = hexDistance(aq, ar, bq, br);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = n === 0 ? 0 : i / n;
    // tiny nudge avoids ties on hex edges
    out.push(cubeRound(aq + (bq - aq) * t + 1e-6, ar + (br - ar) * t + 2e-6));
  }
  return out;
}

export function hexDisk(radius) {
  const out = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      out.push({ q, r });
    }
  }
  return out;
}
