import * as THREE from 'three';

// Time-of-day keyframes at t = 0 (golden hour), 1/3 (sunset), 2/3 (blue hour), 1 (night).
const hex = (n) => new THREE.Color(n);
const KEYS = {
  sun: [0xffc48c, 0xff9a5a, 0x9db2ea, 0x8aa4e8].map(hex),
  sunInt: [3.0, 2.4, 1.5, 1.0],
  sunY: [8.5, 5.5, 5.0, 8.0],
  hemiSky: [0xd2a4ae, 0xc27a8a, 0x6a7cba, 0x6580c0].map(hex),
  hemiGround: [0x1f3f70, 0x1b3560, 0x1a3764, 0x1a3562].map(hex),
  hemiInt: [1.7, 1.6, 1.6, 1.7],
  fog: [0x13294b, 0x2a2a52, 0x172f5a, 0x0b1a36].map(hex),
  sea: [0x1b3d6b, 0x2b3a68, 0x1b3868, 0x112850].map(hex),
  horizon: [0xf4a462, 0xe0805a, 0x5a5f9a, 0x1a2f5a].map(hex),
  zenith: [0x1d3a68, 0x1a2d58, 0x13294b, 0x0a1630].map(hex),
  exposure: [1.05, 1.05, 1.08, 1.12],
};

const tmp = new THREE.Color();
function sampleColor(list, t, out) {
  const f = Math.min(2.999, Math.max(0, t * 3));
  const i = Math.floor(f);
  return out.copy(list[i]).lerp(list[i + 1], f - i);
}
function sampleNum(list, t) {
  const f = Math.min(2.999, Math.max(0, t * 3));
  const i = Math.floor(f);
  return list[i] + (list[i + 1] - list[i]) * (f - i);
}

/** Sky dome, stars and the lighting/fog/sea keyframes for the level's time of day. */
export function createDaylight(stage) {
  const { scene, sun, hemi, sea, renderer } = stage;
  const group = new THREE.Group();

  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { horizon: { value: new THREE.Color() }, zenith: { value: new THREE.Color() } },
    vertexShader: 'varying float vH; void main(){ vH = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 horizon; uniform vec3 zenith; varying float vH; void main(){ float k = smoothstep(0.0, 0.55, vH); gl_FragColor = vec4(mix(horizon, zenith, k), 1.0); #include <colorspace_fragment>\n}',
  });
  const skyGeo = new THREE.SphereGeometry(150, 24, 12);
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.renderOrder = -10;
  group.add(sky);

  // A few stars on the upper dome, fixed positions from a tiny deterministic generator.
  const N = 140;
  const pos = new Float32Array(N * 3);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < N; i++) {
    const a = rnd() * Math.PI * 2;
    const h = 0.18 + rnd() * 0.8;
    const r = Math.sqrt(1 - h * h);
    pos.set([Math.cos(a) * r * 140, h * 140, Math.sin(a) * r * 140], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xede6d6, size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  group.add(new THREE.Points(starGeo, starMat));
  scene.add(group);

  /** t in 0..1 (0 golden hour, 1 night). */
  function apply(t) {
    sampleColor(KEYS.sun, t, sun.color);
    sun.intensity = sampleNum(KEYS.sunInt, t);
    sun.position.set(-17, sampleNum(KEYS.sunY, t), 4);
    sampleColor(KEYS.hemiSky, t, hemi.color);
    sampleColor(KEYS.hemiGround, t, hemi.groundColor);
    hemi.intensity = sampleNum(KEYS.hemiInt, t);
    sampleColor(KEYS.fog, t, tmp);
    scene.fog.color.copy(tmp);
    scene.background.copy(tmp);
    sampleColor(KEYS.sea, t, sea.material.color);
    sampleColor(KEYS.horizon, t, skyMat.uniforms.horizon.value);
    sampleColor(KEYS.zenith, t, skyMat.uniforms.zenith.value);
    renderer.toneMappingExposure = sampleNum(KEYS.exposure, t);
    starMat.opacity = Math.max(0, Math.min(1, (t - 0.55) / 0.35));
  }
  apply(0);

  return {
    apply,
    dispose() { skyGeo.dispose(); skyMat.dispose(); starGeo.dispose(); starMat.dispose(); group.removeFromParent(); },
  };
}
