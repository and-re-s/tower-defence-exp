import * as THREE from 'three';
import { PAL } from './palette.js';

function haloTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,200,110,1)');
  grad.addColorStop(0.25, 'rgba(255,178,62,0.45)');
  grad.addColorStop(1, 'rgba(255,178,62,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The lighthouse with a glowing lamp and a rotating beam. */
export function buildLighthouse(lh) {
  const group = new THREE.Group();
  group.position.set(lh.x, lh.baseY, lh.z);
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };
  const std = (color, extra = {}) => track(new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8, ...extra }));
  const white = std(PAL.whitewash);
  const stripe = std(PAL.deepSea);
  const stone = std(PAL.basalt);
  const lampMat = std(PAL.amber, { emissive: PAL.amber, emissiveIntensity: 2.4, roughness: 0.4 });

  let y = 0;
  const add = (geo, mat, h, yOffset = 0) => {
    const m = new THREE.Mesh(track(geo), mat);
    m.position.y = y + h / 2 + yOffset;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    y += h;
    return m;
  };
  add(new THREE.CylinderGeometry(0.66, 0.74, 0.28, 8), stone, 0.28);
  add(new THREE.CylinderGeometry(0.48, 0.55, 0.95, 10), white, 0.95);
  add(new THREE.CylinderGeometry(0.44, 0.48, 0.34, 10), stripe, 0.34);
  add(new THREE.CylinderGeometry(0.4, 0.44, 0.9, 10), white, 0.9);
  add(new THREE.CylinderGeometry(0.37, 0.4, 0.34, 10), stripe, 0.34);
  add(new THREE.CylinderGeometry(0.33, 0.37, 0.8, 10), white, 0.8);
  add(new THREE.CylinderGeometry(0.52, 0.36, 0.12, 10), stone, 0.12); // gallery
  const lampY = y + 0.27;
  const lamp = add(new THREE.CylinderGeometry(0.25, 0.27, 0.54, 8), lampMat, 0.54);
  add(new THREE.ConeGeometry(0.38, 0.38, 8), stone, 0.38);
  add(new THREE.IcosahedronGeometry(0.07, 0), lampMat, 0.1, -0.02);
  lamp.castShadow = false;

  const light = new THREE.PointLight(PAL.amber, 14, 9, 2);
  light.position.set(0, lampY, 0);
  group.add(light);

  const halo = new THREE.Sprite(track(new THREE.SpriteMaterial({
    map: track(haloTexture()), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false,
  })));
  halo.position.set(0, lampY, 0);
  halo.scale.setScalar(2.6);
  group.add(halo);

  // Beam: an additive cone fading to black at its far end.
  const beamGeo = track(new THREE.ConeGeometry(1.5, 9, 14, 1, true));
  beamGeo.translate(0, -4.5, 0);
  beamGeo.rotateZ(Math.PI / 2);
  beamGeo.scale(1, 0.18, 1);
  const pos = beamGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const amber = new THREE.Color(PAL.amber);
  for (let i = 0; i < pos.count; i++) {
    const f = Math.max(0, 1 - pos.getX(i) / 9) ** 1.4 * 0.42;
    colors[i * 3] = amber.r * f;
    colors[i * 3 + 1] = amber.g * f;
    colors[i * 3 + 2] = amber.b * f;
  }
  beamGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const beam = new THREE.Mesh(beamGeo, track(new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false,
  })));
  const beamPivot = new THREE.Group();
  beamPivot.position.set(0, lampY, 0);
  beamPivot.add(beam);
  group.add(beamPivot);

  return {
    group,
    /** time: game seconds; sinceHit: game seconds since the last Light loss. */
    update(time, sinceHit) {
      beamPivot.rotation.y = time * 0.9;
      let k = 1;
      if (sinceHit < 0.9) {
        // flicker: fast on/off that settles back
        k = 0.25 + 0.75 * Math.abs(Math.sin(sinceHit * 38)) * Math.min(1, sinceHit / 0.9 + 0.2);
      }
      lampMat.emissiveIntensity = 2.4 * k;
      light.intensity = 14 * k;
      halo.material.opacity = 0.6 + 0.4 * k;
    },
    dispose() {
      for (const d of disposables) d.dispose();
      group.removeFromParent();
    },
  };
}
