import * as THREE from 'three';
import { PAL } from './palette.js';
import { createRng } from '../sim/rng.js';
import { hexToWorld } from '../sim/hex.js';

const TERRAIN_COLOR = {
  sand: PAL.sand, path: PAL.packedSand, grass: PAL.moss, rock: PAL.basalt, shallows: PAL.shallows,
};

/** Hex prism: tapered sides give a slight bevel, side faces are darker (the skirt). */
function makeTileGeometry() {
  const geo = new THREE.CylinderGeometry(0.94, 0.99, 1, 6, 1);
  geo.rotateY(Math.PI / 6); // flat-top: vertices on the x axis
  const normal = geo.attributes.normal;
  const colors = new Float32Array(normal.count * 3);
  for (let i = 0; i < normal.count; i++) {
    const top = normal.getY(i) > 0.5;
    const k = top ? 1 : 0.68;
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function instanced(geo, mat, count) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.count = 0;
  return mesh;
}

/** The island: tiles, props and path footprints. Returns a group and a dispose function. */
export function buildIsland(level, seed) {
  const group = new THREE.Group();
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };
  const rng = createRng(seed * 7919 + 13);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  // Tiles
  const tileGeo = track(makeTileGeometry());
  const tileMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 }));
  const tiles = instanced(tileGeo, tileMat, level.tiles.length);
  const DEPTH = 1.2;
  level.tiles.forEach((t, i) => {
    const H = t.height + DEPTH;
    dummy.position.set(t.x, t.height - H / 2, t.z);
    dummy.scale.set(1, H, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    tiles.setMatrixAt(i, dummy.matrix);
    col.set(TERRAIN_COLOR[t.terrain]);
    const lift = t.terrain === 'rock' ? (t.height - 1) * 0.12 : 0;
    col.offsetHSL((t.jitter - 0.5) * 0.02, (t.jitter - 0.5) * 0.06, (t.jitter - 0.5) * 0.11 + lift);
    tiles.setColorAt(i, col);
  });
  tiles.count = level.tiles.length;
  tiles.instanceMatrix.needsUpdate = true;
  tiles.instanceColor.needsUpdate = true;
  group.add(tiles);

  // Props
  const tufts = instanced(track(new THREE.ConeGeometry(0.07, 0.24, 4)), track(new THREE.MeshStandardMaterial({ color: PAL.moss, flatShading: true, roughness: 0.9 })), 400);
  const pebbles = instanced(track(new THREE.IcosahedronGeometry(0.09, 0)), track(new THREE.MeshStandardMaterial({ color: PAL.basalt, flatShading: true, roughness: 0.9 })), 300);
  const wood = instanced(track(new THREE.BoxGeometry(0.55, 0.06, 0.08)), track(new THREE.MeshStandardMaterial({ color: 0x8a6c3c, flatShading: true, roughness: 0.95 })), 40);
  const boulders = instanced(track(new THREE.DodecahedronGeometry(0.2, 0)), track(new THREE.MeshStandardMaterial({ color: 0x4a455c, flatShading: true, roughness: 0.9 })), 40);

  const put = (mesh, x, y, z, sx, sy, sz, ry, tint) => {
    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    dummy.rotation.set(0, ry, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(mesh.count, dummy.matrix);
    if (tint !== undefined) {
      col.setScalar(tint);
      mesh.setColorAt(mesh.count, col);
    }
    mesh.count += 1;
  };
  for (const m of [tufts, pebbles, wood, boulders]) {
    // instanceColor must exist before any setColorAt call
    m.setColorAt(0, col.setScalar(1));
  }

  for (const t of level.tiles) {
    if (t.lighthouse || t.terrain === 'shallows' || t.terrain === 'path') continue;
    const place = () => {
      const a = rng.range(0, Math.PI * 2);
      const rad = rng.range(0.5, 0.82);
      return [t.x + Math.cos(a) * rad, t.z + Math.sin(a) * rad, a];
    };
    if (t.terrain === 'grass') {
      const n = rng.int(0, 3);
      for (let i = 0; i < n && tufts.count < 400; i++) {
        const [x, z] = place();
        const s = rng.range(0.8, 1.4);
        put(tufts, x, t.height + 0.1 * s, z, s, s, s, rng.range(0, 3), rng.range(0.85, 1.15));
      }
      if (rng.next() < 0.1 && boulders.count < 40) {
        const [x, z] = place();
        put(boulders, x, t.height + 0.08, z, 1, 0.7, 1, rng.range(0, 3), rng.range(0.9, 1.2));
      }
    } else if (t.terrain === 'sand') {
      if (rng.next() < 0.4 && pebbles.count < 300) {
        const [x, z] = place();
        const s = rng.range(0.6, 1.2);
        put(pebbles, x, t.height + 0.03, z, s, s * 0.7, s, rng.range(0, 3), rng.range(0.9, 1.3));
      }
      if (rng.next() < 0.1 && wood.count < 40) {
        const [x, z, a] = place();
        put(wood, x, t.height + 0.04, z, 1, 1, 1, a + 1.2, rng.range(0.8, 1.1));
      }
    } else if (t.terrain === 'rock') {
      const n = rng.int(0, 2);
      for (let i = 0; i < n && boulders.count < 40; i++) {
        const [x, z] = place();
        const s = rng.range(0.5, 0.9);
        put(boulders, x, t.height + 0.05, z, s, s * 0.7, s, rng.range(0, 3), rng.range(0.9, 1.3));
      }
    }
  }
  for (const m of [tufts, pebbles, wood, boulders]) {
    m.instanceMatrix.needsUpdate = true;
    m.instanceColor.needsUpdate = true;
    group.add(m);
  }

  // Footprints along the packed-sand path: pairs of small dark prints, alternating left and right.
  const printGeo = track(new THREE.CircleGeometry(0.055, 6));
  printGeo.rotateX(-Math.PI / 2);
  const printMat = track(new THREE.MeshBasicMaterial({ color: 0x8a6e38, transparent: true, opacity: 0.55, depthWrite: false }));
  const prints = new THREE.InstancedMesh(printGeo, printMat, 160);
  prints.count = 0;
  const path = level.path;
  for (let i = 0; i < path.length - 1; i++) {
    const a = hexToWorld(path[i].q, path[i].r);
    const b = hexToWorld(path[i + 1].q, path[i + 1].r);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const nx = -dz / len;
    const nz = dx / len;
    for (let k = 0; k < 3; k++) {
      const t = (k + 0.5) / 3;
      const side = (i + k) % 2 === 0 ? 1 : -1;
      const off = 0.13 * side + rng.range(-0.03, 0.03);
      dummy.position.set(a.x + dx * t + nx * off, 0.255, a.z + dz * t + nz * off);
      dummy.rotation.set(0, Math.atan2(dx, dz), 0);
      dummy.scale.set(1, 1, 1.6);
      dummy.updateMatrix();
      prints.setMatrixAt(prints.count++, dummy.matrix);
    }
  }
  prints.instanceMatrix.needsUpdate = true;
  group.add(prints);

  return {
    group,
    dispose() {
      for (const d of disposables) d.dispose();
      for (const m of [tiles, tufts, pebbles, wood, boulders, prints]) m.dispose();
      group.removeFromParent();
    },
  };
}
