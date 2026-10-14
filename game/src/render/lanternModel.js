import * as THREE from 'three';
import { PAL } from './palette.js';

export const LANTERN_SCALE = 1.5;
export const LANTERN_HEIGHT = 2.3;
let shared = null;

function kit() {
  if (shared) return shared;
  shared = {
    stone: new THREE.MeshStandardMaterial({ color: PAL.basalt, flatShading: true, roughness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x5a4527, flatShading: true, roughness: 0.9 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x2f3340, flatShading: true, roughness: 0.5, metalness: 0.4 }),
    gold: new THREE.MeshStandardMaterial({ color: PAL.amber, emissive: PAL.amber, emissiveIntensity: 0.5, flatShading: true, roughness: 0.4, metalness: 0.4 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0xffd48a, emissive: PAL.amber, emissiveIntensity: 0.9, flatShading: true, transparent: true, opacity: 0.55, roughness: 0.15, depthWrite: false,
    }),
    flame: new THREE.MeshBasicMaterial({ color: 0xfff0c0 }),
    halo: new THREE.MeshBasicMaterial({ color: PAL.amber, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
    dust: new THREE.MeshBasicMaterial({ color: PAL.sand, transparent: true, depthWrite: false, opacity: 0 }),
    foot: new THREE.CylinderGeometry(0.44, 0.52, 0.16, 6),
    post: new THREE.CylinderGeometry(0.09, 0.13, 1.0, 6),
    plate: new THREE.CylinderGeometry(0.3, 0.26, 0.08, 8),
    cage: new THREE.CylinderGeometry(0.27, 0.22, 0.56, 8),
    bar: new THREE.BoxGeometry(0.035, 0.6, 0.035),
    roof: new THREE.ConeGeometry(0.36, 0.26, 8),
    ring: new THREE.TorusGeometry(0.07, 0.02, 4, 8),
    core: new THREE.IcosahedronGeometry(0.12, 1),
    haloGeo: new THREE.SphereGeometry(0.5, 12, 8),
    collar: new THREE.CylinderGeometry(0.16, 0.16, 0.07, 6),
    drop: new THREE.OctahedronGeometry(0.07, 0),
    dustGeo: new THREE.RingGeometry(0.55, 0.8, 18).rotateX(-Math.PI / 2),
  };
  return shared;
}

/** Lantern: a timber post with a glass cage around a bright flame. The ground light pool is drawn by lightPool.js. */
export function buildLantern() {
  const k = kit();
  const root = new THREE.Group();
  root.scale.setScalar(LANTERN_SCALE);
  const body = new THREE.Group();
  root.add(body);
  const add = (parent, geo, mat, x, y, z, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  add(body, k.foot, k.stone, 0, 0.08, 0);
  add(body, k.post, k.wood, 0, 0.66, 0);
  add(body, k.plate, k.iron, 0, 1.2, 0);
  add(body, k.cage, k.glass, 0, 1.52, 0, false);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    add(body, k.bar, k.iron, Math.cos(a) * 0.25, 1.52, Math.sin(a) * 0.25);
  }
  const flame = add(body, k.core, k.flame, 0, 1.5, 0, false);
  add(body, k.haloGeo, k.halo, 0, 1.5, 0, false);
  add(body, k.roof, k.iron, 0, 1.96, 0);
  add(body, k.ring, k.gold, 0, 2.14, 0);
  const tier2 = new THREE.Group();
  add(tier2, k.collar, k.gold, 0, 0.35, 0);
  add(tier2, k.collar, k.gold, 0, 1.28, 0).scale.set(1.5, 1, 1.5);
  body.add(tier2);
  const tier3 = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    add(tier3, k.drop, k.gold, Math.cos(a) * 0.4, 1.16, Math.sin(a) * 0.4, false);
  }
  body.add(tier3);
  const dust = new THREE.Mesh(k.dustGeo, k.dust.clone());
  dust.position.y = 0.06;
  dust.visible = false;
  root.add(dust);
  return { root, body, head: new THREE.Object3D(), recoil: new THREE.Object3D(), bolt: new THREE.Object3D(), dust, tier2, tier3, flame, baseScale: LANTERN_SCALE };
}
