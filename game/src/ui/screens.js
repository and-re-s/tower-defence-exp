import { audio } from '../audio/audio.js';

const LAMP_SVG = `<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M8 24 L10 11 H16 L18 24 Z" fill="#ede6d6"/><path d="M9.2 17 H16.8 L17.4 20 H8.6 Z" fill="#13294b"/><rect x="9.5" y="6" width="7" height="5" rx="1" fill="#ffb23e"/><path d="M8.5 6 L13 2 L17.5 6 Z" fill="#3e3a4f"/></svg>`;
const SPEAKER_ON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>`;
const SPEAKER_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>`;

const PAUSE_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`;

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** DOM overlay: title screen, Light chip, end screens, mute button. */
export function createUI(root, game, actions) {
  const ui = el('<div id="ui"></div>');
  root.appendChild(ui);

  const edge = el('<div id="edge-pulse"></div>');
  const lightChip = el(`<div class="chip hidden" id="light-chip">${LAMP_SVG}<div><div class="label">Light</div>
    <div class="value"><span id="light-val">20</span> <small>/ <span id="light-max">20</span></small></div><span class="meter"><i></i></span></div></div>`);
  const title = el(`<div id="title"><div class="top"><h1>Tidewatch</h1><p>Hold the lamp. Keep the dark at bay.</p></div>
    <button class="btn" id="play">Play</button></div>`);
  const end = el(`<div id="end" class="hidden"><div class="panel"><h2></h2><p class="sub"></p>
    <div class="row"><button class="btn" id="retry">Retry</button><button class="btn quiet" id="to-menu">Menu</button></div></div></div>`);
  const mute = el(`<button id="mute" aria-label="Toggle sound"></button>`);
  const controls = el(`<div id="controls" class="hidden"><button id="speed" title="Game speed (F)" aria-label="Game speed">1x</button>
    <button id="pause-btn" title="Pause (P)" aria-label="Pause">${PAUSE_SVG}</button></div>`);
  const pauseMenu = el(`<div id="pause-menu" class="hidden"><div class="panel"><h2>Paused</h2>
    <div class="col"><button class="btn" id="resume">Resume</button><button class="btn quiet" id="restart">Restart</button>
    <button class="btn quiet" id="quit">Quit to menu</button></div></div></div>`);
  const hudRow = el('<div id="hud-row"></div>');
  hudRow.appendChild(lightChip);
  ui.append(edge, hudRow, title, end, controls, pauseMenu, mute);

  const q = (sel, r = ui) => r.querySelector(sel);
  const lightVal = q('#light-val');
  const lightMax = q('#light-max');
  const meter = q('.meter i');
  const endTitle = q('h2', end);
  const endSub = q('.sub', end);

  const hover = (e) => { if (e.target.closest('.btn')) audio.play('ui_hover', game.time); };
  ui.addEventListener('pointerover', hover);
  ui.addEventListener('click', (e) => {
    if (e.target.closest('button')) { audio.unlock(); audio.play('ui_click', game.time); }
  });
  q('#play').addEventListener('click', () => actions.play());
  q('#retry').addEventListener('click', () => actions.retry());
  q('#to-menu').addEventListener('click', () => actions.menu());
  mute.addEventListener('click', () => audio.toggleMute());
  q('#speed').addEventListener('click', () => actions.cycleSpeed());
  q('#pause-btn').addEventListener('click', () => actions.togglePause());
  q('#resume').addEventListener('click', () => actions.togglePause());
  q('#restart').addEventListener('click', () => actions.retry());
  q('#quit').addEventListener('click', () => actions.menu());
  controls.addEventListener('pointerdown', (e) => e.stopPropagation());
  pauseMenu.addEventListener('pointerdown', (e) => e.stopPropagation());
  const speedBtn = q('#speed');
  let shownSpeed = -1;
  const paintMute = () => {
    mute.innerHTML = audio.isMuted() ? SPEAKER_OFF : SPEAKER_ON;
    mute.title = audio.isMuted() ? 'Sound off (M)' : 'Sound on (M)';
  };
  audio.onMute(paintMute);
  paintMute();

  let shownLight = -1;
  let shownScreen = '';
  let pulseTimer = 0;
  return {
    root: ui,
    hudRow,
    /** The pause menu is only for the player's pause; the test API's pause() leaves the view clear. */
    showPauseMenu(on) { pauseMenu.classList.toggle('hidden', !on); },
    pauseMenuOpen: () => !pauseMenu.classList.contains('hidden'),
    pulse() {
      edge.classList.add('on');
      lightChip.classList.add('bump');
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(() => { edge.classList.remove('on'); lightChip.classList.remove('bump'); }, 140);
    },
    sync() {
      const s = game.screen;
      if (s !== shownScreen) {
        shownScreen = s;
        const inGame = s === 'playing' || s === 'paused' || s === 'won' || s === 'lost';
        title.classList.toggle('hidden', s !== 'menu');
        lightChip.classList.toggle('hidden', !inGame);
        controls.classList.toggle('hidden', s !== 'playing' && s !== 'paused');
        if (s !== 'paused') pauseMenu.classList.add('hidden');
        end.classList.toggle('hidden', s !== 'won' && s !== 'lost');
        end.classList.toggle('lost', s === 'lost');
        if (s === 'lost') {
          endTitle.textContent = 'The light has gone out';
          endSub.innerHTML = `The tide took the island on wave <b>${game.wave}</b>.`;
        } else if (s === 'won') {
          endTitle.textContent = 'The light holds';
          endSub.innerHTML = `Light left: <b>${game.light} <span class="of">/ ${game.lightMax}</span></b>`;
        }
      }
      if (game.timeScale !== shownSpeed) {
        shownSpeed = game.timeScale;
        speedBtn.textContent = `${Math.round(shownSpeed * 10) / 10}x`;
        speedBtn.classList.toggle('fast', shownSpeed > 1);
      }
      if (game.light !== shownLight) {
        shownLight = game.light;
        lightVal.textContent = game.light;
        lightMax.textContent = game.lightMax;
        meter.style.width = `${(100 * game.light) / Math.max(1, game.lightMax)}%`;
        lightChip.classList.toggle('danger', game.light <= 5);
      }
    },
  };
}
