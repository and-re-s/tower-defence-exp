import * as THREE from 'three';

let shared = null;

function kit() {
  if (shared) return shared;
  const body = new THREE.IcosahedronGeometry(0.5, 1);
  body.scale(0.62, 0.3, 0.52);
  const sac = new THREE.IcosahedronGeometry(0.2, 1);
  const egg = new THREE.IcosahedronGeometry(0.07, 0);
  const leg = new THREE.BoxGeometry(0.34, 0.05, 0.06);
  leg.translate(0.17, 0, 0);
  const claw = new THREE.ConeGeometry(0.14, 0.46, 5);
  claw.rotateX(Math.PI / 2);
  claw.translate(0, 0, 0.23);
  shared = {
    body, sac, egg, leg, claw,
    shell: new THREE.MeshStandardMaterial({ color: 0x4a2848, flatShading: true, roughness: 0.55 }),
    sacMat: new THREE.MeshStandardMaterial({ color: 0x7a3a5a, emissive: 0xff6b5b, emissiveIntensity: 0.55, flatShading: true, roughness: 0.4 }),
    eggMat: new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffa24a, emissiveIntensity: 1.3, flatShading: true }),
  };
  return shared;
}

/** Broodmother: a huge, slow brood crab with a glowing egg sac on its back (it bursts into Skitterers). */
export function buildBroodmother() {
  const k = kit();
  const g = new THREE.Group();
  const m = (geo, mat, x, y, z, s = 1) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(s);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };
  m(k.body, k.shell, 0, 0.3, 0);
  const sac = m(k.sac, k.sacMat, 0, 0.5, -0.12, 1.5);
  const eggs = [[-0.12, 0.74, -0.1], [0.1, 0.78, -0.2], [0.02, 0.72, 0.02], [0.14, 0.66, -0.02], [-0.1, 0.66, -0.26]].map(([x, y, z]) => m(k.egg, k.eggMat, x, y, z));
  for (const x of [-0.12, 0.12]) m(k.egg, k.eggMat, x, 0.42, 0.42, 0.8); // eyes
  const claws = [-1, 1].map((s) => {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.5, 0.28, 0.3);
    pivot.rotation.y = -s * 0.3;
    const c = new THREE.Mesh(k.claw, k.shell);
    c.castShadow = true;
    pivot.add(c);
    g.add(pivot);
    return { pivot, s };
  });
  const legs = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.48, 0.18, -0.2 + i * 0.16);
      pivot.scale.x = s;
      const l = new THREE.Mesh(k.leg, k.shell);
      l.castShadow = true;
      pivot.add(l);
      g.add(pivot);
      legs.push({ pivot, i, s });
    }
  }
  return {
    group: g, legs, claws, spd: 4, scale: 1.9,
    animate(time, phase) {
      const p = 1 + 0.05 * Math.sin(time * 3 + phase);
      sac.scale.setScalar(1.5 * p);
      eggs.forEach((e, i) => e.scale.setScalar(1 + 0.25 * Math.sin(time * 5 + i * 1.7 + phase)));
    },
  };
}
