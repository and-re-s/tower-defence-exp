import * as THREE from 'three';
import { PAL } from './palette.js';

let shared = null;

function kit() {
  if (shared) return shared;
  const shell = new THREE.IcosahedronGeometry(0.5, 1);
  shell.scale(0.42, 0.62, 0.42);
  const stripe = new THREE.TorusGeometry(0.3, 0.035, 4, 10);
  stripe.rotateX(Math.PI / 2);
  const body = new THREE.IcosahedronGeometry(0.5, 0);
  body.scale(0.36, 0.14, 0.3);
  const leg = new THREE.BoxGeometry(0.2, 0.03, 0.035);
  leg.translate(0.1, 0, 0);
  const claw = new THREE.ConeGeometry(0.09, 0.3, 4);
  claw.rotateX(Math.PI / 2);
  claw.translate(0, 0, 0.15);
  shared = {
    shell, stripe, body, leg, claw,
    spot: new THREE.IcosahedronGeometry(0.045, 0),
    shellMat: new THREE.MeshStandardMaterial({ color: 0x3a2f4d, flatShading: true, roughness: 0.5 }),
    stripeMat: new THREE.MeshStandardMaterial({ color: 0x4a2a1a, emissive: 0xc8742a, emissiveIntensity: 1.1, flatShading: true }),
    skin: new THREE.MeshStandardMaterial({ color: 0x1d3157, flatShading: true, roughness: 0.55 }),
  };
  return shared;
}

/** Shellback: a hermit crab under a tall spiral shell, slow and heavy. */
export function buildShellback() {
  const k = kit();
  const g = new THREE.Group();
  const m = (geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };
  m(k.body, k.skin, 0, 0.16, 0.04);
  const shell = m(k.shell, k.shellMat, 0, 0.55, -0.1);
  shell.rotation.z = 0.12;
  for (const [y, s] of [[0.35, 1.0], [0.55, 0.85], [0.75, 0.6]]) m(k.stripe, k.stripeMat, 0, y, -0.1).scale.setScalar(s);
  for (const x of [-0.08, 0.08]) m(k.spot, k.stripeMat, x, 0.27, 0.25); // eyes
  const claws = [-1, 1].map((s) => {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.27, 0.16, 0.2);
    const c = new THREE.Mesh(k.claw, k.skin);
    c.castShadow = true;
    pivot.add(c);
    g.add(pivot);
    return { pivot, s };
  });
  const legs = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.26, 0.11, -0.04 + i * 0.1);
      pivot.scale.x = s;
      pivot.add(new THREE.Mesh(k.leg, k.skin));
      g.add(pivot);
      legs.push({ pivot, i, s });
    }
  }
  return { group: g, legs, claws, spd: 7, scale: 1.45 };
}
