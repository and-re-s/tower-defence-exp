import * as THREE from 'three';
import { PAL } from './palette.js';

const DROP_TIME = 0.5;
const RECOIL_TIME = 0.35;
const TURN_RATE = 9;
const TOWER_SCALE = 1.5;
export const MUZZLE_HEIGHT = 1.62 * TOWER_SCALE;
const CANNON_SCALE = 1.9;
export const CANNON_MUZZLE_HEIGHT = 1.0 * CANNON_SCALE;
export const muzzleHeight = (type) => (type === 'cannon' ? CANNON_MUZZLE_HEIGHT : MUZZLE_HEIGHT);
const easeOutBack = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

function makeKit() {
  const mats = {
    wood: new THREE.MeshStandardMaterial({ color: 0xb08a4e, flatShading: true, roughness: 0.9 }),
    flag: new THREE.MeshStandardMaterial({ color: PAL.amber, emissive: PAL.amber, emissiveIntensity: 0.35, flatShading: true, side: THREE.DoubleSide }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x5a4527, flatShading: true, roughness: 0.9 }),
    stone: new THREE.MeshStandardMaterial({ color: PAL.basalt, flatShading: true, roughness: 0.9 }),
    rope: new THREE.MeshStandardMaterial({ color: PAL.sand, flatShading: true, roughness: 1 }),
    iron: new THREE.MeshStandardMaterial({ color: PAL.whitewash, flatShading: true, roughness: 0.5 }),
    cannon: new THREE.MeshStandardMaterial({ color: 0x56607a, flatShading: true, roughness: 0.55, metalness: 0.35 }),
    bore: new THREE.MeshBasicMaterial({ color: 0x07080c }),
    gold: new THREE.MeshStandardMaterial({ color: PAL.amber, emissive: PAL.amber, emissiveIntensity: 0.5, flatShading: true, roughness: 0.4, metalness: 0.4 }),
    dust: new THREE.MeshBasicMaterial({ color: PAL.sand, transparent: true, depthWrite: false, opacity: 0 }),
  };
  const geos = {
    post: new THREE.CylinderGeometry(0.15, 0.22, 1.45, 6),
    brace: new THREE.BoxGeometry(0.62, 0.07, 0.07),
    rock: new THREE.IcosahedronGeometry(0.17, 0),
    platform: new THREE.CylinderGeometry(0.36, 0.3, 0.1, 6),
    stock: new THREE.BoxGeometry(0.16, 0.13, 0.66),
    arm: new THREE.BoxGeometry(0.52, 0.08, 0.09),
    bolt: new THREE.CylinderGeometry(0.018, 0.018, 0.6, 5),
    tip: new THREE.ConeGeometry(0.05, 0.14, 5),
    coil: new THREE.TorusGeometry(0.09, 0.025, 4, 8),
    flag: new THREE.BoxGeometry(0.02, 0.2, 0.34),
    pole: new THREE.CylinderGeometry(0.018, 0.018, 0.6, 4),
    dust: new THREE.RingGeometry(0.55, 0.8, 18),
    base: new THREE.CylinderGeometry(0.5, 0.58, 0.42, 6),
    drum: new THREE.CylinderGeometry(0.36, 0.42, 0.2, 8),
    barrel: new THREE.CylinderGeometry(0.2, 0.27, 0.95, 8),
    band: new THREE.CylinderGeometry(0.285, 0.285, 0.07, 8),
    muzzle: new THREE.CylinderGeometry(0.3, 0.22, 0.2, 8),
    bore: new THREE.CylinderGeometry(0.13, 0.13, 0.04, 8),
    ball: new THREE.SphereGeometry(0.1, 6, 5),
    trunnion: new THREE.BoxGeometry(0.7, 0.14, 0.14),
    collar: new THREE.CylinderGeometry(0.235, 0.235, 0.09, 6),
    mast: new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5),
    orb: new THREE.IcosahedronGeometry(0.09, 1),
    wing: new THREE.BoxGeometry(0.04, 0.3, 0.36),
    hoop: new THREE.TorusGeometry(0.4, 0.045, 5, 12),
    spike: new THREE.ConeGeometry(0.07, 0.3, 5),
  };
  geos.hoop.rotateX(Math.PI / 2);
  geos.barrel.rotateX(Math.PI / 2);
  geos.band.rotateX(Math.PI / 2);
  geos.muzzle.rotateX(Math.PI / 2);
  geos.bore.rotateX(Math.PI / 2);
  geos.bolt.rotateX(Math.PI / 2);
  geos.tip.rotateX(Math.PI / 2);
  geos.dust.rotateX(-Math.PI / 2);
  return { mats, geos };
}

function buildHarpoonPost(kit) {
  const { mats: m, geos: g } = kit;
  const root = new THREE.Group();
  root.scale.setScalar(TOWER_SCALE);
  const body = new THREE.Group(); // squashes and stretches on build
  root.add(body);
  const add = (parent, geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  add(body, g.post, m.wood, 0, 0.72, 0);
  for (const [x, z] of [[0.17, 0.05], [-0.14, 0.12], [-0.03, -0.18]]) add(body, g.rock, m.stone, x, 0.1, z);
  const brace = add(body, g.brace, m.woodDark, 0, 0.55, 0);
  brace.rotation.y = 0.6;
  add(body, g.brace, m.woodDark, 0, 0.35, 0).rotation.y = -0.6;
  add(body, g.platform, m.woodDark, 0, 1.47, 0);
  add(body, g.pole, m.woodDark, -0.22, 1.82, 0);
  add(body, g.flag, m.flag, -0.22, 1.98, 0.18);
  const head = new THREE.Group(); // turns toward the target
  head.position.y = 1.58;
  body.add(head);
  const recoil = new THREE.Group(); // slides back when firing
  head.add(recoil);
  add(recoil, g.stock, m.wood, 0, 0, 0);
  const armL = add(recoil, g.arm, m.woodDark, 0.2, 0.01, 0.22);
  armL.rotation.y = -0.28;
  const armR = add(recoil, g.arm, m.woodDark, -0.2, 0.01, 0.22);
  armR.rotation.y = 0.28;
  const bolt = new THREE.Group();
  add(bolt, g.bolt, m.iron, 0, 0.08, 0.1);
  add(bolt, g.tip, m.iron, 0, 0.08, 0.46);
  recoil.add(bolt);
  add(recoil, g.coil, m.rope, 0, 0.1, -0.24).rotation.x = Math.PI / 2;
  // Tier extras: gold collars and a taller mast with a glowing orb (tier 3 adds wings).
  const tier2 = new THREE.Group();
  add(tier2, g.collar, m.gold, 0, 0.9, 0);
  add(tier2, g.collar, m.gold, 0, 0.2, 0).scale.set(1.25, 1, 1.25);
  body.add(tier2);
  const tier3 = new THREE.Group();
  add(tier3, g.mast, m.woodDark, 0.22, 1.85, 0);
  add(tier3, g.orb, m.gold, 0.22, 2.15, 0);
  add(tier3, g.wing, m.flag, 0.2, 1.62, -0.05);
  add(tier3, g.wing, m.flag, -0.2, 1.62, -0.05);
  body.add(tier3);
  const dust = new THREE.Mesh(g.dust, m.dust.clone());
  dust.position.y = 0.06;
  dust.visible = false;
  root.add(dust);
  return { root, body, head, recoil, bolt, dust, tier2, tier3, baseScale: TOWER_SCALE };
}

function buildCliffCannon(kit) {
  const { mats: m, geos: g } = kit;
  const root = new THREE.Group();
  root.scale.setScalar(CANNON_SCALE);
  const body = new THREE.Group();
  root.add(body);
  const add = (parent, geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  add(body, g.base, m.stone, 0, 0.21, 0);
  add(body, g.drum, m.cannon, 0, 0.52, 0);
  for (const [x, z] of [[0.4, 0.15], [0.32, 0.3], [-0.42, -0.1]]) add(body, g.ball, m.cannon, x, 0.47, z);
  const head = new THREE.Group();
  head.position.y = 0.72;
  body.add(head);
  add(head, g.trunnion, m.woodDark, 0, 0, 0);
  const pitch = new THREE.Group();
  pitch.rotation.x = -0.62; // barrel tilted up
  head.add(pitch);
  const recoil = new THREE.Group();
  pitch.add(recoil);
  add(recoil, g.barrel, m.cannon, 0, 0, 0.3);
  add(recoil, g.band, m.flag, 0, 0, 0.05);
  add(recoil, g.muzzle, m.cannon, 0, 0, 0.8);
  add(recoil, g.bore, m.bore, 0, 0, 0.91);
  // Tier extras: gold hoop around the base, then spikes on the drum (tier 3).
  const tier2 = new THREE.Group();
  add(tier2, g.hoop, m.gold, 0, 0.42, 0).scale.set(1.1, 1.1, 1.1);
  body.add(tier2);
  const tier3 = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const sp = add(tier3, g.spike, m.gold, Math.cos(i * 1.0472) * 0.4, 0.74, Math.sin(i * 1.0472) * 0.4);
    sp.rotation.set(Math.sin(i * 1.0472) * 0.5, 0, -Math.cos(i * 1.0472) * 0.5);
  }
  body.add(tier3);
  const dust = new THREE.Mesh(g.dust, m.dust.clone());
  dust.position.y = 0.06;
  dust.visible = false;
  root.add(dust);
  return { root, body, head, recoil, bolt: new THREE.Object3D(), dust, tier2, tier3, baseScale: CANNON_SCALE };
}

/** One model per tower; the build bounce, the turning and the recoil run on the game clock. */
export function createTowerView(scene) {
  const kit = makeKit();
  const views = new Map();
  const fireAt = new Map();
  let lastTime = 0;

  return {
    onFire(towerId, time) { fireAt.set(towerId, time); },
    update(game, time) {
      const dt = Math.max(0, Math.min(0.5, time - lastTime));
      lastTime = time;
      const k = 1 - Math.exp(-TURN_RATE * dt);
      const alive = new Set();
      for (const t of game.towers) {
        alive.add(t.id);
        let v = views.get(t.id);
        if (!v) {
          v = { m: (t.type === 'cannon' ? buildCliffCannon : buildHarpoonPost)(kit), yaw: t.angle };
          v.m.root.position.set(t.x, t.y, t.z);
          scene.add(v.m.root);
          views.set(t.id, v);
        }
        v.m.tier2.visible = t.tier >= 2;
        v.m.tier3.visible = t.tier >= 3;
        // Grow with each tier, with a short overshoot after an upgrade.
        const up = game.time - t.upgradedAt;
        const pop = up >= 0 && up < 0.5 ? Math.sin((up / 0.5) * Math.PI) * 0.14 * (1 - up / 0.5) : 0;
        v.m.root.scale.setScalar(v.m.baseScale * (1 + (t.tier - 1) * 0.1 + pop));
        const age = game.time - t.born;
        const drop = Math.min(1, age / DROP_TIME);
        const e = drop >= 1 ? 1 : easeOutBack(drop);
        // Squash-and-stretch: tall and thin while dropping in, settling to 1.
        const squash = drop >= 1 ? 0 : Math.sin(drop * Math.PI) * 0.18;
        v.m.body.scale.set(1 + squash * 0.6, Math.max(0.01, e) * (1 - squash * 0.4), 1 + squash * 0.6);
        v.m.body.position.y = drop < 1 ? (1 - Math.min(1, drop * 2.2)) * 1.4 : 0;
        const ring = v.m.dust;
        ring.visible = age > 0.12 && age < 0.7;
        if (ring.visible) {
          const d = (age - 0.12) / 0.58;
          ring.scale.setScalar(0.5 + d * 1.1);
          ring.material.opacity = 0.55 * (1 - d);
        }
        let diff = t.angle - v.yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        v.yaw += diff * k;
        v.m.head.rotation.y = v.yaw;
        const since = time - (fireAt.get(t.id) ?? -10);
        const r = since < RECOIL_TIME ? Math.sin((since / RECOIL_TIME) * Math.PI) : 0;
        v.m.recoil.position.z = (t.type === 'cannon' ? -0.22 : -0.12) * r * (1 - since / RECOIL_TIME);
        v.m.bolt.visible = since > 0.3 || since < 0;
      }
      for (const [id, v] of views) {
        if (alive.has(id)) continue;
        scene.remove(v.m.root);
        v.m.dust.material.dispose();
        views.delete(id);
        fireAt.delete(id);
      }
    },
    clear() {
      for (const v of views.values()) { scene.remove(v.m.root); v.m.dust.material.dispose(); }
      views.clear();
      fireAt.clear();
    },
    /** Top of the tower in world coordinates (for anchoring UI). */
    heightOf: (type) => muzzleHeight(type) + 0.3,
  };
}
