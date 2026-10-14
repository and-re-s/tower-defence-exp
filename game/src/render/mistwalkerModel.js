import * as THREE from 'three';
import { PAL } from './palette.js';

let shared = null;

function kit() {
  if (shared) return shared;
  const dome = new THREE.SphereGeometry(0.42, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.62);
  const tentacle = new THREE.ConeGeometry(0.05, 0.75, 4);
  tentacle.translate(0, -0.375, 0);
  const frill = new THREE.TorusGeometry(0.4, 0.04, 4, 10);
  frill.rotateX(Math.PI / 2);
  const mk = (color, emissive, ei, opacity) => new THREE.MeshStandardMaterial({
    color, emissive, emissiveIntensity: ei, transparent: true, opacity, flatShading: true, roughness: 0.2, depthWrite: false, side: THREE.DoubleSide,
  });
  shared = {
    dome, tentacle, frill,
    core: new THREE.IcosahedronGeometry(0.1, 1),
    // Cloaked: a faint shimmer. Revealed: a glowing jellyfish.
    cloak: mk(0x9fe8e0, 0x2e8c94, 0.25, 0.1),
    cloakTent: mk(0x9fe8e0, 0x2e8c94, 0.2, 0.07),
    lit: mk(0xbafcf0, PAL.brine, 1.5, 0.78),
    litTent: mk(0x7fe0d0, PAL.brine, 1.2, 0.6),
    coreMat: new THREE.MeshBasicMaterial({ color: 0xe9fff8, transparent: true, opacity: 0.9 }),
    shadow: new THREE.MeshBasicMaterial({ color: 0x0b1a33, transparent: true, opacity: 0.28, depthWrite: false }),
    shadowGeo: new THREE.CircleGeometry(0.34, 14).rotateX(-Math.PI / 2),
  };
  return shared;
}

export const MISTWALKER_FLOAT = 0.75;

/** Mistwalker: a translucent jellyfish drifting over the sand. Meshes swap between the cloaked and lit materials. */
export function buildMistwalker() {
  const k = kit();
  const group = new THREE.Group();
  const bell = new THREE.Group();
  group.add(bell);
  const swap = [];
  const dome = new THREE.Mesh(k.dome, k.cloak);
  const frill = new THREE.Mesh(k.frill, k.cloakTent);
  frill.position.y = 0.0;
  const core = new THREE.Mesh(k.core, k.coreMat);
  core.position.y = 0.12;
  bell.add(dome, frill, core);
  swap.push([dome, k.cloak, k.lit], [frill, k.cloakTent, k.litTent]);
  const tentacles = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26);
    const t = new THREE.Mesh(k.tentacle, k.cloakTent);
    pivot.add(t);
    bell.add(pivot);
    tentacles.push({ pivot, i });
    swap.push([t, k.cloakTent, k.litTent]);
  }
  const shadow = new THREE.Mesh(k.shadowGeo, k.shadow);
  shadow.position.y = -MISTWALKER_FLOAT / 1.3 + 0.04; // on the ground below the jelly (group scale is 1.3)
  group.add(shadow);
  let revealed = null;
  return {
    group, legs: [], claws: [], spd: 4, scale: 1.3, float: MISTWALKER_FLOAT, noShadow: true,
    setRevealed(on) {
      if (on === revealed) return;
      revealed = on;
      for (const [m, off, onMat] of swap) m.material = on ? onMat : off;
      core.visible = on;
      shadow.visible = on;
    },
    animate(time, phase) {
      const p = Math.sin(time * 2.2 + phase);
      bell.scale.set(1 + p * 0.07, 1 - p * 0.09, 1 + p * 0.07);
      for (const t of tentacles) {
        t.pivot.rotation.x = Math.sin(time * 2.2 + phase + t.i) * 0.22;
        t.pivot.rotation.z = Math.cos(time * 1.7 + phase + t.i * 1.3) * 0.22;
      }
    },
  };
}

/** Shimmer: the cloaked jellies pulse together so a hidden one is faintly visible. */
export function shimmerMistwalkers(time) {
  const k = kit();
  k.cloak.opacity = 0.09 + 0.05 * Math.sin(time * 3.3);
  k.cloakTent.opacity = 0.06 + 0.04 * Math.sin(time * 3.3 + 1.2);
}
