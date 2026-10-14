import * as THREE from 'three';

let shared = null;
const GULL_FLOAT = 3.2;

function kit() {
  if (shared) return shared;
  const body = new THREE.IcosahedronGeometry(0.5, 1);
  body.scale(0.2, 0.17, 0.42);
  const head = new THREE.IcosahedronGeometry(0.1, 0);
  const beak = new THREE.ConeGeometry(0.05, 0.2, 4);
  beak.rotateX(Math.PI / 2);
  beak.translate(0, 0, 0.1);
  // One wing as a flat swept triangle strip pivoting at its root.
  const wing = new THREE.BufferGeometry();
  wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.3, 0, 0, -0.25, 0.95, 0, -0.35, 0, 0, 0.3, 0.95, 0, -0.35, 0, 0, -0.25], 3));
  wing.computeVertexNormals();
  shared = {
    body, head, beak, wing,
    skin: new THREE.MeshStandardMaterial({ color: 0x2b2650, flatShading: true, roughness: 0.6, side: THREE.DoubleSide }),
    glow: new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xff8a4a, emissiveIntensity: 1.6, flatShading: true }),
    shadow: new THREE.MeshBasicMaterial({ color: 0x050d1c, transparent: true, opacity: 0.4, depthWrite: false }),
    shadowGeo: new THREE.CircleGeometry(0.5, 14).rotateX(-Math.PI / 2),
  };
  return shared;
}

/** Gloom Gull: a dark bird with glowing eyes that flies high over the island; a blob shadow marks the ground below. */
export function buildGull() {
  const k = kit();
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };
  add(k.body, k.skin, 0, 0, 0);
  add(k.head, k.skin, 0, 0.04, 0.4);
  add(k.beak, k.glow, 0, 0.03, 0.46);
  for (const x of [-0.05, 0.05]) add(k.head, k.glow, x, 0.08, 0.46).scale.setScalar(0.35);
  const wings = [-1, 1].map((s) => {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.08, 0.04, 0);
    pivot.scale.x = s;
    const w = new THREE.Mesh(k.wing, k.skin);
    w.castShadow = true;
    pivot.add(w);
    g.add(pivot);
    return pivot;
  });
  const shadow = new THREE.Mesh(k.shadowGeo, k.shadow);
  shadow.position.y = -GULL_FLOAT / 1.2 + 0.05;
  shadow.scale.set(0.8, 1, 1.1);
  g.add(shadow);
  return {
    group: g, legs: [], claws: [], spd: 6, scale: 1.2, float: GULL_FLOAT, noShadow: true,
    animate(time, phase) {
      const f = Math.sin(time * 7 + phase);
      for (const w of wings) w.rotation.z = f * 0.55;
      g.position.y += Math.sin(time * 2 + phase) * 0.12;
    },
  };
}
