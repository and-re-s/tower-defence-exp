import * as THREE from 'three';

const STEP = Math.PI / 3;
const PITCH = (50 * Math.PI) / 180;
const DIST_CLOSE = 10;
const DIST_FAR = 35;
const PAN_LIMIT = 4.5;

const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));

/** Orbit camera: 60-degree rotation steps, wheel zoom and edge-limited pan, all eased. */
export function createCameraRig(camera, dom) {
  const rig = {
    yawTarget: 0, yaw: 0, zoomTarget: 1, zoom: 1,
    panTarget: new THREE.Vector2(), pan: new THREE.Vector2(),
  };
  const keys = new Set();

  rig.rotate = (dir) => { rig.yawTarget += dir * STEP; };
  rig.setZoom = (z) => { rig.zoomTarget = THREE.MathUtils.clamp(z, 0, 1); };

  window.addEventListener('keydown', (e) => {
    if (e.repeat && (e.code === 'KeyQ' || e.code === 'KeyE')) return;
    if (e.code === 'KeyQ') rig.rotate(-1);
    else if (e.code === 'KeyE') rig.rotate(1);
    else keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  dom.addEventListener('wheel', (e) => {
    e.preventDefault();
    rig.setZoom(rig.zoomTarget + Math.sign(e.deltaY) * 0.12);
  }, { passive: false });

  const dist = () => DIST_CLOSE + (DIST_FAR - DIST_CLOSE) * rig.zoom;

  rig.update = (dt) => {
    // WASD / arrows pan relative to the view direction.
    const fwd = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const side = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    if (fwd || side) {
      const speed = 7 * dt * (0.5 + 0.5 * rig.zoom);
      const sy = Math.sin(rig.yawTarget);
      const cy = Math.cos(rig.yawTarget);
      rig.panTarget.x += (side * cy - fwd * sy) * speed;
      rig.panTarget.y += (-side * sy - fwd * cy) * speed;
      if (rig.panTarget.length() > PAN_LIMIT) rig.panTarget.setLength(PAN_LIMIT);
    }
    rig.yaw = Math.abs(rig.yawTarget - rig.yaw) < 1e-4 ? rig.yawTarget : damp(rig.yaw, rig.yawTarget, 7, dt);
    rig.zoom = damp(rig.zoom, rig.zoomTarget, 9, dt);
    rig.pan.x = damp(rig.pan.x, rig.panTarget.x, 10, dt);
    rig.pan.y = damp(rig.pan.y, rig.panTarget.y, 10, dt);
    const d = dist();
    const cp = Math.cos(PITCH);
    camera.position.set(
      rig.pan.x + Math.sin(rig.yaw) * cp * d,
      Math.sin(PITCH) * d,
      rig.pan.y + Math.cos(rig.yaw) * cp * d,
    );
    camera.lookAt(rig.pan.x, 0.4, rig.pan.y);
    camera.updateMatrixWorld();
  };

  rig.info = () => ({
    yawDeg: Math.round(((rig.yawTarget * 180) / Math.PI) * 100) / 100,
    zoom: Math.round(rig.zoomTarget * 100) / 100,
    pan: [Math.round(rig.panTarget.x * 100) / 100, Math.round(rig.panTarget.y * 100) / 100],
  });
  rig.update(0);
  return rig;
}
