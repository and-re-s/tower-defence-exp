import { errors } from './errors.js';
import { audio } from './audio/audio.js';

/** Exposes window.__game when the URL has ?test=1. It reports the real game; it changes nothing. */
export function installTestApi(ctl) {
  if (new URLSearchParams(location.search).get('test') !== '1') return;
  window.__game = {
    ready: true,
    state: () => ({ ...ctl.game.snapshot(), fps: Math.round(ctl.fps()), camera: ctl.rig.info(), muted: audio.isMuted(), audio: audio.status() }),
    start: ({ level = 1, seed = 1 } = {}) => ctl.start(level, seed),
    pause: () => ctl.game.pause(),
    resume: () => ctl.game.resume(),
    setTimeScale: (k) => { ctl.game.timeScale = Math.max(0.1, Math.min(32, Number(k) || 1)); },
    step: (ticks = 1) => ctl.step(ticks),
    toScreen: (x, y, z) => ctl.toScreen(x, y, z),
    build: (type, q, r) => ctl.build(type, q, r),
    upgrade: (id) => ctl.upgrade(id),
    sell: (id) => ctl.sell(id),
    setTargeting: (id, mode) => ctl.setTargeting(id, mode),
    grantSalvage: (n) => { ctl.game.salvage += Math.max(0, Math.floor(Number(n) || 0)); },
    spawnEnemy: (type) => { const g = ctl.game; if (g.screen !== 'playing' && g.screen !== 'paused') return 0; g.spawnEnemy(type); ctl.handleEvents(); return g.enemies[g.enemies.length - 1].id; },
    callNextWave: () => ctl.callNextWave(),
    skipToWave: (n) => { const ok = ctl.game.skipToWave(n); ctl.handleEvents(); return ok; },
    win: () => { const ok = ctl.game.forceWin(); ctl.handleEvents(); return ok; },
    lose: () => { const ok = ctl.game.forceLose(); ctl.handleEvents(); return ok; },
    errors,
    audioLog: () => audio.log(),
    toMenu: () => ctl.game.toMenu(),
  };
}
