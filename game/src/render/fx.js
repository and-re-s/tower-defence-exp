import * as THREE from 'three';
import { PAL } from './palette.js';

const MAX = 200;
const GRAVITY = 6;

/** Small pooled particle bursts. Everything advances on the animation (game) clock. */
export function createFx(scene) {
  const geo = new THREE.IcosahedronGeometry(0.06, 0);
  const mats = {
    hit: new THREE.MeshBasicMaterial({ color: PAL.whitewash, transparent: true, depthWrite: false }),
    glow: new THREE.MeshBasicMaterial({ color: PAL.brine, transparent: true, depthWrite: false }),
    smoke: new THREE.MeshBasicMaterial({ color: 0xcfc6b2, transparent: true, opacity: 0.55, depthWrite: false }),
    fire: new THREE.MeshBasicMaterial({ color: PAL.amber, transparent: true, depthWrite: false }),
    debris: new THREE.MeshBasicMaterial({ color: PAL.sand, transparent: true, depthWrite: false }),
  };
  // Flash discs: an expanding ground ring and a bright dome, each with its own material for fading.
  const ringGeo = new THREE.RingGeometry(0.8, 1, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const domeGeo = new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const flashes = [];
  const flashFree = [];
  function flash(x, y, z, radius, life) {
    const f = flashFree.pop() || {
      ring: new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: PAL.amber, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })),
      dome: new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })),
    };
    f.ring.position.set(x, 0.3, z);
    f.dome.position.set(x, 0.3, z);
    scene.add(f.ring, f.dome);
    flashes.push({ f, age: 0, life, radius });
  }
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
    /** One smoke puff, used for shell trails and muzzle clouds. */
    smoke(x, y, z, size = 1.4) { spawn('smoke', x, y, z, 0, 0.25, 0, 0.7, size); },
    explosion(x, z, radius) {
      burst('fire', x, 0.5, z, 18, radius * 2.0, 2.4, Math.floor(x * 7));
      burst('smoke', x, 0.4, z, 12, radius * 1.1, 3.6, Math.floor(z * 5));
      burst('debris', x, 0.3, z, 12, radius * 2.4, 1.3, Math.floor(x * 3 + z));
      flash(x, 0.6, z, radius, 0.45);
    },
    /** Amber sparkle fountain used by upgrades. */
    sparkle(x, y, z) {
      burst('fire', x, y + 0.2, z, 22, 3.2, 1.9, Math.floor(x * 5));
      burst('fire', x, y + 0.5, z, 16, 2.4, 1.5, Math.floor(z * 3));
      flash(x, y - 0.6, z, 1.7, 0.6);
    },
    /** Sand chips thrown up when a tower is sold. */
    chips(x, y, z) { burst('debris', x, y + 0.3, z, 12, 2.0, 1.4, Math.floor(z * 9)); },
    kill(x, z) { burst('glow', x, 0.4, z, 12, 2.1, 1, Math.floor(z * 11)); },
    update(time) {
      const dt = Math.max(0, Math.min(0.5, time - lastTime));
      lastTime = time;
      for (let i = flashes.length - 1; i >= 0; i--) {
        const fl = flashes[i];
        fl.age += dt;
        const u = fl.age / fl.life;
        if (u >= 1) { scene.remove(fl.f.ring, fl.f.dome); flashFree.push(fl.f); flashes.splice(i, 1); continue; }
        const e = 1 - (1 - u) ** 3;
        fl.f.ring.scale.setScalar(Math.max(0.01, fl.radius * (0.3 + 1.1 * e)));
        fl.f.ring.material.opacity = 0.9 * (1 - u);
        fl.f.dome.scale.setScalar(Math.max(0.01, fl.radius * (0.2 + 0.7 * Math.min(1, u * 2.5))));
        fl.f.dome.material.opacity = 0.7 * Math.max(0, 1 - u * 2);
      }
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
      for (const fl of flashes) { scene.remove(fl.f.ring, fl.f.dome); flashFree.push(fl.f); }
      flashes.length = 0;
    },
    count: () => parts.length,
  };
}
