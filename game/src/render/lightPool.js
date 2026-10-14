import * as THREE from 'three';
import { hexDisk, hexDistance, hexKey } from '../sim/hex.js';

let geo = null;
const mat = new THREE.MeshBasicMaterial({
  color: 0xffffff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
});

/**
 * Warm pool of light on the hexes around a lantern: one flat hex per lit tile at that tile's own height, fading with
 * distance. Flickers on the animation clock.
 */
export function createLightPool(level, tower) {
  if (!geo) geo = new THREE.CircleGeometry(0.93, 6).rotateX(-Math.PI / 2);
  const tiles = [];
  for (const o of hexDisk(tower.range)) {
    const q = tower.q + o.q;
    const r = tower.r + o.r;
    const tile = level.tileMap.get(hexKey(q, r));
    if (tile) tiles.push({ tile, d: hexDistance(q, r, tower.q, tower.r) });
  }
  const mesh = new THREE.InstancedMesh(geo, mat, tiles.length);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  tiles.forEach(({ tile, d }, i) => {
    m.makeTranslation(tile.x, tile.height + 0.04, tile.z);
    mesh.setMatrixAt(i, m);
    const k = 0.26 * (1 - 0.7 * (d / (tower.range + 0.5)));
    c.setRGB(1.0 * k, 0.62 * k, 0.2 * k);
    mesh.setColorAt(i, c);
  });
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  return { mesh };
}

/** Shared flicker applied to the common material (all lanterns breathe together). */
export function flickerPools(time) {
  mat.opacity = 0.6 + 0.1 * Math.sin(time * 3.1) + 0.06 * Math.sin(time * 7.3 + 1);
}
