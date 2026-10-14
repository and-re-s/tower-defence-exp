import * as THREE from 'three';
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
import { createTowerView } from './render/towerView.js';
import { createProjectileView } from './render/projectileView.js';
import { createFx } from './render/fx.js';
import { createPlacement } from './render/placement.js';
import { createUI } from './ui/screens.js';
import { createHud } from './ui/hud.js';
import { createTowerPanel } from './ui/towerPanel.js';
import { hexKey } from './sim/hex.js';
import { audio } from './audio/audio.js';
import { installTestApi } from './testApi.js';

const MAX_TICKS_PER_FRAME = 480;
const root = document.getElementById('app');
const game = new Game();
const stage = createStage(root);
const rig = createCameraRig(stage.camera, stage.renderer.domElement);
const enemyView = createEnemyView(stage.scene);
const towerView = createTowerView(stage.scene);
const fx = createFx(stage.scene);
const projectileView = createProjectileView(stage.scene, fx);

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
  rig.reset();
  audio.clearLog();
  towerView.clear(); projectileView.clear(); fx.clear();
  armed = 'harpoon'; hud.setArmed(armed);
  deselect();
  placement.reset();
  handleEvents();
  ui.sync();
}

const ui = createUI(root, game, {
  play: () => start(1, 1),
  retry: () => start(game.levelId || 1, game.seed || 1),
  menu: () => { game.toMenu(); clearActors(); },
});

function clearActors() {
  enemyView.clear(); towerView.clear(); projectileView.clear(); fx.clear();
}

let armed = 'harpoon'; // tower type shown by the range preview
function arm(type) { armed = type; hud.setArmed(type); audio.unlock(); audio.play('ui_click', game.time); }
function buildSelected(type = armed) {
  armed = type; hud.setArmed(type);
  const hex = hud.menuHex() || placement.hover();
  if (!hex || (game.screen !== 'playing' && game.screen !== 'paused')) return;
  const res = game.build(type, hex.q, hex.r);
  if (res.ok) { hud.closeMenu(); placement.setSelected(null); } else placement.refuseFlash(hex, anim);
  handleEvents();
}
const hud = createHud(ui.root, ui.hudRow, game, {
  nextWave: () => { if (game.callNextWave() >= 0) handleEvents(); },
  buildSelected,
  arm,
});
hud.setArmed(armed);
const towerPanel = createTowerPanel(ui.root, game, {
  upgrade: () => { game.upgrade(towerPanel.towerId()); handleEvents(); },
  sell: () => { const id = towerPanel.towerId(); game.sell(id); deselect(); handleEvents(); },
  target: (mode) => { game.setTargeting(towerPanel.towerId(), mode); audio.play('ui_click', game.time); },
});
function deselect() { hud.closeMenu(); towerPanel.close(); placement.setSelected(null); }
function selectTower(tower) {
  hud.closeMenu();
  towerPanel.open(tower.id);
  placement.setSelected({ q: tower.q, r: tower.r });
  audio.unlock(); audio.play('ui_click', game.time);
}
const placement = createPlacement({
  scene: stage.scene, camera: stage.camera, dom: stage.renderer.domElement, game,
  onPick(hex) {
    const tower = game.towerAt.get(hexKey(hex.q, hex.r));
    if (tower) { selectTower(tower); return; }
    towerPanel.close();
    const blocker = game.buildBlocker(armed, hex.q, hex.r);
    if (blocker && blocker !== 'salvage') {
      hud.closeMenu(); placement.setSelected(null);
      game.build(armed, hex.q, hex.r); // pushes the refuse event
      placement.refuseFlash(hex, anim);
      handleEvents();
      return;
    }
    hud.openMenu(hex); placement.setSelected(hex);
    audio.unlock(); audio.play('ui_click', game.time);
  },
  onCancel: deselect,
});

function muzzleSmoke(towerId) {
  const t = game.towers.find((tw) => tw.id === towerId);
  if (!t) return;
  const dx = Math.sin(t.angle) * 0.6;
  const dz = Math.cos(t.angle) * 0.6;
  for (let i = 0; i < 4; i++) fx.smoke(t.x + dx * (1 + i * 0.4), t.y + 1.7 + i * 0.1, t.z + dz * (1 + i * 0.4), 1.6 - i * 0.2);
}

function handleEvents() {
  for (const ev of game.drainEvents()) {
    switch (ev.type) {
      case 'levelStart': clearActors(); flickerAt = -100; showWorld(); break;
      case 'build': audio.play('build', game.time); break;
      case 'upgrade': audio.play('upgrade', game.time); fx.sparkle(ev.x, ev.y + 1.2, ev.z); break;
      case 'sell': audio.play('sell', game.time); fx.chips(ev.x, ev.y, ev.z); break;
      case 'refuse': audio.play('refuse', game.time); break;
      case 'fire': audio.play(ev.towerType === 'cannon' ? 'cannon_fire' : 'harpoon_fire', game.time); towerView.onFire(ev.towerId, anim); if (ev.towerType === 'cannon') muzzleSmoke(ev.towerId); break;
      case 'hit': audio.play('enemy_hit', game.time); fx.hit(ev.x, ev.z); break;
      case 'explode': audio.play('cannon_boom', game.time); fx.explosion(ev.x, ev.z, ev.radius); break;
      case 'kill': audio.play('enemy_death', game.time); fx.kill(ev.x, ev.z); break;
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

const v3 = new THREE.Vector3();
let fpsSmooth = 60;
const ctl = {
  game, rig, camera: stage.camera, canvas: stage.renderer.domElement,
  fps: () => fpsSmooth,
  handleEvents,
  start,
  step(ticks) {
    if (game.screen !== 'paused') return;
    game.screen = 'playing';
    runTicks(Math.max(0, Math.floor(ticks)));
    if (game.screen === 'playing') game.screen = 'paused';
    handleEvents();
    ui.sync();
    hud.sync();
    towerPanel.sync();
    render();
  },
  upgrade: (id) => { const res = game.upgrade(id); handleEvents(); return res; },
  sell: (id) => { if (towerPanel.towerId() === id) deselect(); const res = game.sell(id); handleEvents(); return res; },
  setTargeting: (id, mode) => game.setTargeting(id, mode),
  build: (type, q, r) => { const res = game.build(type, q, r); handleEvents(); return res; },
  callNextWave: () => { const b = game.callNextWave(); handleEvents(); return b; },
  toScreen(x, y, z) {
    v3.set(x, y, z).project(stage.camera);
    const rect = stage.renderer.domElement.getBoundingClientRect();
    return { x: Math.round(rect.left + ((v3.x + 1) / 2) * rect.width), y: Math.round(rect.top + ((1 - v3.y) / 2) * rect.height) };
  },
};

function render() {
  showWorld();
  enemyView.update(game, anim);
  towerView.update(game, anim);
  projectileView.update(game);
  fx.update(anim);
  const selTower = game.towerById(towerPanel.towerId());
  placement.update(anim, armed, selTower);
  if (selTower) towerPanel.reposition(ctl.toScreen(selTower.x, selTower.y + 1.2, selTower.z));
  const sel = hud.menuHex();
  if (sel) {
    const tile = game.level.tileMap.get(`${sel.q},${sel.r}`);
    const p = ctl.toScreen(tile.x, tile.height, tile.z);
    hud.reposition(p);
  }
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
  hud.sync();
  towerPanel.sync();
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('pointerdown', () => audio.unlock());
window.addEventListener('keydown', (e) => {
  audio.unlock();
  if (e.code === 'KeyM' && !e.repeat) audio.toggleMute();
  if (e.code === 'Enter' && game.screen === 'menu') start(1, 1);
  if ((game.screen === 'playing' || game.screen === 'paused') && !e.repeat) {
    if (e.code === 'Space') { e.preventDefault(); if (game.screen === 'playing' && game.callNextWave() >= 0) handleEvents(); }
    else if (e.code === 'Digit1') buildSelected('harpoon');
    else if (e.code === 'Digit2') buildSelected('cannon');
    else if (e.code === 'Escape') deselect();
  }
});

installTestApi(ctl);
showWorld();
requestAnimationFrame(frame);
