import * as THREE from 'three';
import { PAL } from './palette.js';

/** Pulsing marker on the beach where the next wave comes ashore. Runs on the animation clock. */
export function createSpawnMarker(scene) {
  const ringGeo = new THREE.RingGeometry(0.82, 1, 40).rotateX(-Math.PI / 2);
  const colGeo = new THREE.CylinderGeometry(0.9, 0.9, 3, 20, 1, true);
  const mk = () => new THREE.MeshBasicMaterial({
    color: PAL.amber, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const group = new THREE.Group();
  const rings = [0, 1].map(() => {
    const m = new THREE.Mesh(ringGeo, mk());
    m.renderOrder = 8;
    group.add(m);
    return m;
  });
  const column = new THREE.Mesh(colGeo, mk());
  column.position.y = 1.5;
  column.renderOrder = 8;
  group.add(column);
  group.visible = false;
  scene.add(group);
  return {
    update(time, spawn) {
      group.visible = !!spawn;
      if (!spawn) return;
      group.position.set(spawn.x, 0.15, spawn.z);
      rings.forEach((r, i) => {
        const u = (time * 0.9 + i * 0.5) % 1;
        r.scale.setScalar(0.6 + u * 2.2);
        r.material.opacity = 0.8 * (1 - u) ** 1.5;
      });
      column.material.opacity = 0.1 + 0.08 * Math.sin(time * 4.5);
      column.scale.set(1 + 0.08 * Math.sin(time * 3), 1, 1 + 0.08 * Math.sin(time * 3));
    },
    dispose() {
      scene.remove(group);
      ringGeo.dispose(); colGeo.dispose();
      for (const m of [...rings, column]) m.material.dispose();
    },
  };
}
