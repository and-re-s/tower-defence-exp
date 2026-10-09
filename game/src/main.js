import './errors.js';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './ui/styles.css';
import { Game, TICK } from './sim/game.js';
import { buildLevel } from './sim/levels.js';
import { createStage } from './render/stage.js';
import { createCameraRig } from './render/cameraRig.js';
import { buildIsland } from './render/island.js';
import { buildLighthouse } from './render/lighthouse.js';
import { createEnemyView } from './render/enemyView.js';
import { createUI } from './ui/screens.js';
import { audio } from './audio/audio.js';
import { installTestApi } from './testApi.js';

const MAX_TICKS_PER_FRAME = 480;
const root = document.getElementById('app');
const game = new Game();
const stage = createStage(root);
const rig = createCameraRig(stage.camera, stage.renderer.domElement);
const enemyView = createEnemyView(stage.scene);
const previewLevel = buildLevel(1);

let world = null; // { key, island, lighthouse }
let anim = 0; // animation clock: advances with game ticks while playing, with real time on idle screens
let flickerAt = -100;

function showWorld() {
  const level = game.level || previewLevel;
  const seed = game.level ? game.seed : 1;
  const key = `${level.def.id}:${seed}`;
  if (world && world.key === key) return;
  if (world) { world.island.dispose(); world.lighthouse.dispose(); }
  const island = buildIsland(level, seed);
  const lighthouse = buildLighthouse(level.lighthouse);
  stage.scene.add(island.group, lighthouse.group);
  world = { key, island, lighthouse };
}

function start(level, seed) {
  game.start({ level, seed });
  handleEvents();
  ui.sync();
}

const ui = createUI(root, game, {
  play: () => start(1, 1),
  retry: () => start(game.levelId || 1, game.seed || 1),
  menu: () => { game.toMenu(); enemyView.clear(); },
});

function handleEvents() {
  for (const ev of game.drainEvents()) {
    switch (ev.type) {
      case 'levelStart': enemyView.clear(); flickerAt = -100; showWorld(); break;
      case 'leak': audio.play('lighthouse_hit', game.time); ui.pulse(); flickerAt = anim; break;
      case 'waveStart': audio.play('wave_start', game.time); break;
      case 'waveCleared': audio.play('wave_clear', game.time); break;
      case 'victory': audio.play('victory', game.time); break;
      case 'defeat': audio.play('defeat', game.time); break;
      default: break;
    }
  }
}

function runTicks(n) {
  for (let i = 0; i < n && game.screen === 'playing'; i++) {
    game.tick();
    anim += TICK;
    if (game.events.length) handleEvents();
  }
}

let fpsSmooth = 60;
const ctl = {
  game, rig, camera: stage.camera, canvas: stage.renderer.domElement,
  fps: () => fpsSmooth,
  start,
  step(ticks) {
    if (game.screen !== 'paused') return;
    game.screen = 'playing';
    runTicks(Math.max(0, Math.floor(ticks)));
    if (game.screen === 'playing') game.screen = 'paused';
    handleEvents();
    ui.sync();
    render();
  },
};

function render() {
  showWorld();
  enemyView.update(game, anim);
  world.lighthouse.update(anim, anim - flickerAt);
  stage.renderer.render(stage.scene, stage.camera);
}

let acc = 0;
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  if (dt > 0) fpsSmooth += (1 / dt - fpsSmooth) * 0.1;
  if (game.screen === 'playing') {
    acc += dt * game.timeScale;
    const n = Math.min(MAX_TICKS_PER_FRAME, Math.floor(acc / TICK));
    acc -= n * TICK;
    runTicks(n);
    if (n === MAX_TICKS_PER_FRAME) acc = 0;
  } else if (game.screen !== 'paused') {
    anim += dt;
  }
  handleEvents();
  rig.update(dt);
  ui.sync();
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('pointerdown', () => audio.unlock());
window.addEventListener('keydown', (e) => {
  audio.unlock();
  if (e.code === 'KeyM' && !e.repeat) audio.toggleMute();
  if (e.code === 'Enter' && game.screen === 'menu') start(1, 1);
});

installTestApi(ctl);
showWorld();
requestAnimationFrame(frame);
