import { TOWER_TYPES } from '../sim/towers.js';

const SALVAGE_SVG = `<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M3 18 L13 13 L23 18 L13 23 Z" fill="#8a6d3a"/><path d="M3 18 V14 L13 9 V13 Z" fill="#5a4527"/><path d="M13 13 V9 L23 14 V18 Z" fill="#a98448"/><path d="M13 9 L23 14 L13 13 L3 14 Z" fill="#e3c27a"/><circle cx="19" cy="7" r="3" fill="#ffb23e"/></svg>`;
const WAVE_SVG = `<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M2 15 Q6 8 10 15 T18 15 T24 13" fill="none" stroke="#2e8c94" stroke-width="3" stroke-linecap="round"/><path d="M2 21 Q6 15 10 21 T18 21 T24 19" fill="none" stroke="#e3c27a" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/></svg>`;

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** Salvage and wave chips, the Next wave button and the build menu. */
export function createHud(ui, hudRow, game, actions) {
  const salvageChip = el(`<div class="chip hidden" id="salvage-chip">${SALVAGE_SVG}<div><div class="label">Salvage</div>
    <div class="value" id="salvage-val">0</div></div></div>`);
  const waveChip = el(`<div class="chip hidden" id="wave-chip">${WAVE_SVG}<div><div class="label" id="wave-label">Wave</div>
    <div class="value"><span id="wave-val">0</span> <small>/ <span id="wave-max">6</span></small></div></div></div>`);
  hudRow.append(salvageChip, waveChip);
  const nextBtn = el('<button class="btn hidden" id="next-wave">Next wave</button>');
  const menu = el(`<div id="build-menu" class="hidden" role="menu"><div class="menu-title">Build here</div></div>`);
  const towerBtn = el(`<button class="build-opt" data-tower="harpoon"><span class="opt-name">${TOWER_TYPES.harpoon.name}</span>
    <span class="opt-cost">${TOWER_TYPES.harpoon.cost}</span><kbd>1</kbd></button>`);
  menu.appendChild(towerBtn);
  ui.append(nextBtn, menu);

  const q = (id) => hudRow.querySelector(id);
  const salvageVal = q('#salvage-val');
  const waveVal = q('#wave-val');
  const waveMax = q('#wave-max');
  const waveLabel = q('#wave-label');
  nextBtn.addEventListener('click', () => actions.nextWave());
  towerBtn.addEventListener('click', () => actions.buildSelected());
  menu.addEventListener('pointerdown', (e) => e.stopPropagation());

  let shownSalvage = -1;
  let bumpTimer = 0;
  let menuHex = null;
  return {
    /** Opens the build menu anchored at a screen point; call `reposition` each frame afterwards. */
    openMenu(hex) { menuHex = hex; menu.classList.remove('hidden'); },
    closeMenu() { menuHex = null; menu.classList.add('hidden'); },
    menuHex: () => menuHex,
    /** screen: {x, y} pixel of the selected hex centre; keeps the menu below it and inside the viewport. */
    reposition(screen) {
      if (!menuHex) return;
      const w = menu.offsetWidth || 190;
      const h = menu.offsetHeight || 80;
      const x = Math.max(8, Math.min(window.innerWidth - w - 8, screen.x - w / 2));
      let y = screen.y + 34;
      if (y + h > window.innerHeight - 8) y = Math.max(8, screen.y - 70 - h);
      menu.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
    },
    sync() {
      const inGame = game.screen === 'playing' || game.screen === 'paused';
      salvageChip.classList.toggle('hidden', !inGame && game.screen !== 'won' && game.screen !== 'lost');
      waveChip.classList.toggle('hidden', salvageChip.classList.contains('hidden'));
      if (game.salvage !== shownSalvage) {
        if (shownSalvage >= 0 && game.salvage > shownSalvage) {
          salvageChip.classList.add('bump');
          clearTimeout(bumpTimer);
          bumpTimer = setTimeout(() => salvageChip.classList.remove('bump'), 160);
        }
        shownSalvage = game.salvage;
        salvageVal.textContent = game.salvage;
      }
      if (game.level) {
        waveVal.textContent = game.wave;
        waveMax.textContent = game.level.def.waves.length;
        waveLabel.textContent = game.phase === 'breather' ? `Next in ${Math.ceil(game.breatherLeft)}s` : game.phase === 'done' ? 'Cleared' : 'Wave';
        const showNext = inGame && game.phase === 'breather';
        nextBtn.classList.toggle('hidden', !showNext);
        nextBtn.disabled = game.screen === 'paused';
        if (showNext) nextBtn.innerHTML = `Next wave <span class="bonus">+${Math.round(game.breatherLeft * 1.5)}</span> <kbd>Space</kbd>`;
      }
      if (!inGame && menuHex) this.closeMenu();
      const cost = TOWER_TYPES.harpoon.cost;
      const poor = game.salvage < cost;
      towerBtn.classList.toggle('poor', poor);
      towerBtn.title = poor ? `Needs ${cost} salvage` : 'Build a Harpoon Post';
    },
  };
}
