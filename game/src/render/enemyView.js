import * as THREE from 'three';
import { PAL } from './palette.js';
import { worldToHex, hexKey } from '../sim/hex.js';

const MODEL_SCALE = 1.35;
const DEATH_TIME = 0.35;
const EMERGE_TIME = 0.9;
const easeOut = (t) => 1 - (1 - t) ** 3;

/** Shared geometries and materials for every enemy model; created once. */
function makeKit() {
  const mats = {
    shell: new THREE.MeshStandardMaterial({ color: 0x2a2a3e, flatShading: true, roughness: 0.55 }),
    shell2: new THREE.MeshStandardMaterial({ color: 0x1d3157, flatShading: true, roughness: 0.5 }),
    glow: new THREE.MeshStandardMaterial({ color: 0x0b3a33, emissive: PAL.brine, emissiveIntensity: 2.2, flatShading: true }),
    pool: new THREE.MeshBasicMaterial({ color: PAL.brine, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }),
  };
  const body = new THREE.IcosahedronGeometry(0.5, 0);
  body.scale(0.34, 0.14, 0.27);
  const carapace = new THREE.IcosahedronGeometry(0.5, 0);
  carapace.scale(0.27, 0.11, 0.2);
  const spot = new THREE.IcosahedronGeometry(0.045, 0);
  const leg = new THREE.BoxGeometry(0.2, 0.028, 0.03);
  leg.translate(0.1, 0, 0);
  const claw = new THREE.ConeGeometry(0.06, 0.22, 4);
  claw.rotateX(Math.PI / 2);
  claw.translate(0, 0, 0.11);
  const pool = new THREE.CircleGeometry(0.4, 16);
  pool.rotateX(-Math.PI / 2);
  return { mats, geos: { body, carapace, spot, leg, claw, pool } };
}

function buildScuttler(kit) {
  const g = new THREE.Group();
  const m = (geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };
  m(kit.geos.body, kit.mats.shell, 0, 0.17, 0);
  m(kit.geos.carapace, kit.mats.shell2, 0, 0.25, -0.02);
  for (const [x, z] of [[-0.1, -0.06], [0.1, -0.06], [0, 0.05], [0.05, -0.14]]) m(kit.geos.spot, kit.mats.glow, x, 0.31, z);
  for (const x of [-0.07, 0.07]) m(kit.geos.spot, kit.mats.glow, x, 0.25, 0.2); // eyes
  const claws = [-1, 1].map((s) => {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.2, 0.17, 0.2);
    const c = new THREE.Mesh(kit.geos.claw, kit.mats.shell);
    c.castShadow = true;
    pivot.add(c);
    g.add(pivot);
    return { pivot, s };
  });
  const legs = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.26, 0.13, -0.12 + i * 0.12);
      pivot.scale.x = s;
      const l = new THREE.Mesh(kit.geos.leg, kit.mats.shell);
      pivot.add(l);
      g.add(pivot);
      legs.push({ pivot, i, s });
    }
  }
  const pool = new THREE.Mesh(kit.geos.pool, kit.mats.pool);
  pool.position.y = 0.02;
  g.add(pool);
  return { group: g, legs, claws };
}

/** Maintains one model per simulated enemy and animates it on game time. */
export function createEnemyView(scene) {
  const kit = makeKit();
  const views = new Map();
  const dying = [];

  function heightAt(level, x, z) {
    const h = worldToHex(x, z);
    const t = level.tileMap.get(hexKey(h.q, h.r));
    return t ? t.height : 0.05;
  }

  function pose(v, e, level, time) {
    const g = v.model.group;
    const age = time - v.born;
    const phase = e.id * 1.7;
    const spd = 12;
    const emerge = easeOut(Math.min(1, age / EMERGE_TIME));
    const bob = Math.abs(Math.sin(time * spd * 0.5 + phase)) * 0.025;
    g.position.set(e.x, heightAt(level, e.x, e.z) + bob - (1 - emerge) * 0.25, e.z);
    g.rotation.y = e.heading;
    g.rotation.z = Math.sin(time * spd * 0.5 + phase) * 0.05;
    g.scale.setScalar(MODEL_SCALE * (0.4 + 0.6 * emerge));
    for (const l of v.model.legs) {
      const w = Math.sin(time * spd + phase + l.i * 2.1 + (l.s > 0 ? Math.PI : 0));
      l.pivot.rotation.y = w * 0.4 * l.s;
      l.pivot.rotation.z = Math.max(0, w) * 0.4;
    }
    for (const c of v.model.claws) c.pivot.rotation.x = Math.sin(time * 3 + phase + c.s) * 0.12;
  }

  return {
    update(game, time) {
      const level = game.level;
      const alive = new Set();
      if (level) {
        for (const e of game.enemies) {
          alive.add(e.id);
          let v = views.get(e.id);
          if (!v) {
            v = { model: buildScuttler(kit), born: time, last: e };
            scene.add(v.model.group);
            views.set(e.id, v);
          }
          v.last = { id: e.id, x: e.x, z: e.z, heading: e.heading };
          pose(v, e, level, time);
        }
      }
      for (const [id, v] of views) {
        if (alive.has(id)) continue;
        views.delete(id);
        if (level && game.screen !== 'menu') dying.push({ v, at: time });
        else scene.remove(v.model.group);
      }
      for (let i = dying.length - 1; i >= 0; i--) {
        const d = dying[i];
        const t = (time - d.at) / DEATH_TIME;
        const g = d.v.model.group;
        if (t >= 1 || t < 0) {
          scene.remove(g);
          dying.splice(i, 1);
        } else {
          g.scale.setScalar(Math.max(0.001, MODEL_SCALE * (1 - easeOut(t))));
          g.position.y += 0.012;
        }
      }
    },
    clear() {
      for (const v of views.values()) scene.remove(v.model.group);
      for (const d of dying) scene.remove(d.v.model.group);
      views.clear();
      dying.length = 0;
    },
  };
}
