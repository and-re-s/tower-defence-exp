import * as THREE from 'three';
import { PAL } from './palette.js';

/** Renderer, scene, camera, sun, fill light, fog and sea. */
export function createStage(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.id = 'game-canvas';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAL.deepSea);
  scene.fog = new THREE.Fog(PAL.deepSea, 24, 60);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 200);

  // Low warm key light from the west with soft shadows.
  const sun = new THREE.DirectionalLight(0xffc48c, 3.0);
  sun.position.set(-17, 8.5, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -15; sc.right = 15; sc.top = 15; sc.bottom = -15; sc.near = 1; sc.far = 50;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const hemi = new THREE.HemisphereLight(0xd2a4ae, 0x1f3f70, 1.7);
  scene.add(hemi);

  // The sea: faceted-looking dark glass around the island.
  const seaGeo = new THREE.CircleGeometry(90, 48);
  seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({
    color: 0x1b3d6b, roughness: 0.75, metalness: 0.0, flatShading: true,
  }));
  sea.position.y = -0.02;
  sea.receiveShadow = true;
  scene.add(sea);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  return { renderer, scene, camera, sun, hemi, sea, resize };
}
