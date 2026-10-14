import * as THREE from 'three';
import { PAL } from './palette.js';

const MAX = 120;
const GRAVITY = 6;

/** Small pooled particle bursts. Everything advances on the animation (game) clock. */
export function createFx(scene) {
  const geo = new THREE.IcosahedronGeometry(0.06, 0);
  const mats = {
    hit: new THREE.MeshBasicMaterial({ color: PAL.whitewash, transparent: true, depthWrite: false }),
    glow: new THREE.MeshBasicMaterial({ color: PAL.brine, transparent: true, depthWrite: false }),
  };
  const parts = [];
  const free = [];
  let lastTime = 0;

  function spawn(kind, x, y, z, vx, vy, vz, life, size) {
    if (parts.length >= MAX) return;
    const mesh = free.pop() || new THREE.Mesh(geo, mats.hit);
    mesh.material = mats[kind];
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(size);
    scene.add(mesh);
    parts.push({ mesh, vx, vy, vz, life, age: 0, size });
  }

  // Deterministic spread: golden-angle fan, no Math.random.
  function burst(kind, x, y, z, n, speed, size, seedShift = 0) {
    for (let i = 0; i < n; i++) {
      const a = (i + seedShift) * 2.39996;
      const up = 0.6 + ((i * 7 + seedShift) % 5) * 0.25;
      spawn(kind, x, y, z, Math.cos(a) * speed * (0.5 + (i % 3) * 0.3), up * speed, Math.sin(a) * speed * (0.5 + (i % 3) * 0.3), 0.5 + (i % 4) * 0.08, size);
    }
  }

  return {
    hit(x, z) { burst('hit', x, 0.45, z, 4, 1.4, 0.7, Math.floor(x * 13)); },
    kill(x, z) { burst('glow', x, 0.4, z, 12, 2.1, 1, Math.floor(z * 11)); },
    update(time) {
      const dt = Math.max(0, Math.min(0.5, time - lastTime));
      lastTime = time;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        if (p.age >= p.life) {
          scene.remove(p.mesh);
          free.push(p.mesh);
          parts.splice(i, 1);
          continue;
        }
        p.vy -= GRAVITY * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y = Math.max(0.1, p.mesh.position.y + p.vy * dt);
        p.mesh.position.z += p.vz * dt;
        p.mesh.scale.setScalar(p.size * (1 - p.age / p.life));
      }
    },
    clear() {
      for (const p of parts) { scene.remove(p.mesh); free.push(p.mesh); }
      parts.length = 0;
    },
    count: () => parts.length,
  };
}
