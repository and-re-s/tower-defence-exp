import * as THREE from 'three';
import { PAL } from './palette.js';
import { MUZZLE_HEIGHT } from './towerView.js';
import { hexKey, worldToHex } from '../sim/hex.js';

const UP = new THREE.Vector3(0, 0, 1);
const dir = new THREE.Vector3();

/** Pooled harpoon bolts flying from towers to their targets. */
export function createProjectileView(scene) {
  const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 5);
  shaftGeo.rotateX(Math.PI / 2);
  const tipGeo = new THREE.ConeGeometry(0.075, 0.2, 5);
  tipGeo.rotateX(Math.PI / 2);
  tipGeo.translate(0, 0, 0.42);
  const trailGeo = new THREE.ConeGeometry(0.03, 1.3, 4);
  trailGeo.rotateX(-Math.PI / 2);
  trailGeo.translate(0, 0, -0.95);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a6d3a, flatShading: true });
  const tipMat = new THREE.MeshStandardMaterial({ color: PAL.whitewash, flatShading: true, roughness: 0.4 });
  const trailMat = new THREE.MeshBasicMaterial({ color: PAL.sand, transparent: true, opacity: 0.55, depthWrite: false });
  const pool = [];
  const active = new Map();

  function acquire() {
    const g = pool.pop() || (() => {
      const grp = new THREE.Group();
      const shaft = new THREE.Mesh(shaftGeo, woodMat);
      const tip = new THREE.Mesh(tipGeo, tipMat);
      const trail = new THREE.Mesh(trailGeo, trailMat);
      shaft.castShadow = true;
      grp.add(shaft, tip, trail);
      return grp;
    })();
    scene.add(g);
    return g;
  }

  return {
    update(game) {
      const seen = new Set();
      for (const p of game.projectiles) {
        seen.add(p.id);
        let g = active.get(p.id);
        if (!g) { g = acquire(); active.set(p.id, g); }
        const target = game.enemyById(p.targetId);
        const tower = game.towers.find((t) => t.id === p.towerId);
        const y0 = (tower ? tower.y : 0.3) + MUZZLE_HEIGHT;
        let y1 = 0.7;
        if (target) {
          const h = worldToHex(target.x, target.z);
          const tile = game.level.tileMap.get(hexKey(h.q, h.r));
          y1 = (tile ? tile.height : 0.25) + 0.3;
        }
        const y = y0 + (y1 - y0) * p.progress + Math.sin(p.progress * Math.PI) * 0.35;
        g.position.set(p.x, y, p.z);
        if (target) {
          dir.set(target.x - p.x, y1 - y, target.z - p.z).normalize();
          g.quaternion.setFromUnitVectors(UP, dir);
        }
      }
      for (const [id, g] of active) {
        if (seen.has(id)) continue;
        scene.remove(g);
        pool.push(g);
        active.delete(id);
      }
    },
    clear() {
      for (const g of active.values()) { scene.remove(g); pool.push(g); }
      active.clear();
    },
  };
}
