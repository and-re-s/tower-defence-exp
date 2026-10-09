import * as THREE from 'three';
import { errors } from './errors.js';
import { audio } from './audio/audio.js';

/** Exposes window.__game when the URL has ?test=1. It reports the real game; it changes nothing. */
export function installTestApi(ctl) {
  if (new URLSearchParams(location.search).get('test') !== '1') return;
  const v = new THREE.Vector3();
  window.__game = {
    ready: true,
    state: () => ({ ...ctl.game.snapshot(), fps: Math.round(ctl.fps()), camera: ctl.rig.info(), muted: audio.isMuted() }),
    start: ({ level = 1, seed = 1 } = {}) => ctl.start(level, seed),
    pause: () => ctl.game.pause(),
    resume: () => ctl.game.resume(),
    setTimeScale: (k) => { ctl.game.timeScale = Math.max(0.1, Math.min(32, Number(k) || 1)); },
    step: (ticks = 1) => ctl.step(ticks),
    toScreen(x, y, z) {
      v.set(x, y, z).project(ctl.camera);
      const rect = ctl.canvas.getBoundingClientRect();
      return { x: Math.round(rect.left + ((v.x + 1) / 2) * rect.width), y: Math.round(rect.top + ((1 - v.y) / 2) * rect.height) };
    },
    errors,
    audioLog: () => audio.log(),
    toMenu: () => ctl.game.toMenu(),
  };
}
