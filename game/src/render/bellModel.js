import * as THREE from 'three';
import { PAL } from './palette.js';

export const BELL_SCALE = 1.5;
export const BELL_HEIGHT = 2.2;
let shared = null;

function kit() {
  if (shared) return shared;
  shared = {
    stone: new THREE.MeshStandardMaterial({ color: PAL.basalt, flatShading: true, roughness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x5a4527, flatShading: true, roughness: 0.9 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0xc9893a, emissive: 0x6a3d10, emissiveIntensity: 0.35, flatShading: true, roughness: 0.4, metalness: 0.55 }),
    gold: new THREE.MeshStandardMaterial({ color: PAL.amber, emissive: PAL.amber, emissiveIntensity: 0.5, flatShading: true, roughness: 0.4, metalness: 0.4 }),
    teal: new THREE.MeshStandardMaterial({ color: PAL.shallows, emissive: PAL.shallows, emissiveIntensity: 0.5, flatShading: true }),
    dust: new THREE.MeshBasicMaterial({ color: PAL.sand, transparent: true, depthWrite: false, opacity: 0 }),
    pillar: new THREE.BoxGeometry(0.12, 1.5, 0.12),
    beam: new THREE.BoxGeometry(1.0, 0.12, 0.14),
    foot: new THREE.CylinderGeometry(0.46, 0.54, 0.16, 6),
    bell: new THREE.CylinderGeometry(0.1, 0.34, 0.5, 10, 1, true),
    cap: new THREE.SphereGeometry(0.1, 8, 5),
    lip: new THREE.TorusGeometry(0.34, 0.035, 5, 12),
    clapper: new THREE.SphereGeometry(0.07, 6, 5),
    collar: new THREE.CylinderGeometry(0.15, 0.15, 0.08, 6),
    wave: new THREE.TorusGeometry(0.12, 0.03, 4, 8),
    dustGeo: new THREE.RingGeometry(0.55, 0.8, 18).rotateX(-Math.PI / 2),
  };
  return shared;
}

/** Tide Bell: an open timber arch with a bronze bell that swings when it rings. */
export function buildTideBell() {
  const k = kit();
  const root = new THREE.Group();
  root.scale.setScalar(BELL_SCALE);
  const body = new THREE.Group();
  root.add(body);
  const add = (parent, geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  add(body, k.foot, k.stone, 0, 0.08, 0);
  add(body, k.pillar, k.wood, -0.46, 0.85, 0);
  add(body, k.pillar, k.wood, 0.46, 0.85, 0);
  add(body, k.beam, k.wood, 0, 1.62, 0);
  const swing = new THREE.Group(); // pivots at the crossbeam
  swing.position.y = 1.55;
  body.add(swing);
  add(swing, k.cap, k.bronze, 0, -0.04, 0);
  add(swing, k.bell, k.bronze, 0, -0.32, 0).material = k.bronze.clone();
  swing.children[1].material.side = THREE.DoubleSide;
  add(swing, k.lip, k.gold, 0, -0.57, 0).rotation.x = Math.PI / 2;
  add(swing, k.clapper, k.teal, 0, -0.52, 0);
  const tier2 = new THREE.Group();
  add(tier2, k.collar, k.gold, -0.46, 0.35, 0);
  add(tier2, k.collar, k.gold, 0.46, 0.35, 0);
  body.add(tier2);
  const tier3 = new THREE.Group();
  add(tier3, k.wave, k.teal, -0.46, 1.8, 0);
  add(tier3, k.wave, k.teal, 0.46, 1.8, 0);
  add(tier3, k.wave, k.gold, 0, 1.8, 0);
  body.add(tier3);
  const dust = new THREE.Mesh(k.dustGeo, k.dust.clone());
  dust.position.y = 0.06;
  dust.visible = false;
  root.add(dust);
  return { root, body, head: new THREE.Object3D(), recoil: new THREE.Object3D(), bolt: new THREE.Object3D(), swing, dust, tier2, tier3, baseScale: BELL_SCALE };
}
