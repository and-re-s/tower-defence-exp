import { TOWER_TYPES } from '../sim/towers.js';
import { ENEMY_NAMES } from '../sim/enemies.js';

const SALVAGE_SVG = `<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M3 18 L13 13 L23 18 L13 23 Z" fill="#8a6d3a"/><path d="M3 18 V14 L13 9 V13 Z" fill="#5a4527"/><path d="M13 13 V9 L23 14 V18 Z" fill="#a98448"/><path d="M13 9 L23 14 L13 13 L3 14 Z" fill="#e3c27a"/><circle cx="19" cy="7" r="3" fill="#ffb23e"/></svg>`;
const WAVE_SVG = `<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M2 15 Q6 8 10 15 T18 15 T24 13" fill="none" stroke="#2e8c94" stroke-width="3" stroke-linecap="round"/><path d="M2 21 Q6 15 10 21 T18 21 T24 19" fill="none" stroke="#e3c27a" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/></svg>`;

const TOWER_ICONS = {
  harpoon: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M17 36 L19 14 H23 L25 36 Z" fill="#b08a4e"/><path d="M11 37 H31 L29 33 H13 Z" fill="#5a4527"/><rect x="13" y="11" width="16" height="4" rx="1" fill="#5a4527"/><path d="M21 3 L25 11 H17 Z" fill="#f4ecd8"/><rect x="20" y="9" width="2" height="4" fill="#f4ecd8"/><path d="M26 14 V6 L32 9 Z" fill="#ffb23e"/></svg>`,
  cannon: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 36 L9 24 H31 L34 36 Z" fill="#4a4f5c"/><path d="M9 24 H31 L29 21 H11 Z" fill="#6c7282"/><g transform="rotate(-32 20 20)"><rect x="12" y="13" width="22" height="10" rx="3" fill="#2f3340"/><rect x="29" y="11" width="6" height="14" rx="2" fill="#6c7282"/><rect x="18" y="12" width="3" height="12" fill="#ffb23e"/></g><circle cx="10" cy="19" r="4" fill="#2e8c94" opacity="0.8"/></svg>`,
  bell: `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="7" y="9" width="3" height="27" fill="#5a4527"/><rect x="30" y="9" width="3" height="27" fill="#5a4527"/><rect x="6" y="8" width="28" height="4" rx="1" fill="#5a4527"/><path d="M20 12 V15" stroke="#c9893a" stroke-width="2"/><path d="M14 30 Q14 17 20 15 Q26 17 26 30 Z" fill="#c9893a"/><rect x="13" y="29" width="14" height="3" rx="1.5" fill="#ffb23e"/><circle cx="20" cy="34" r="2" fill="#2e8c94"/><path d="M3 38 Q10 33 20 38 T37 38" fill="none" stroke="#2e8c94" stroke-width="2" opacity="0.8"/></svg>`,
  lantern: `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="18" y="20" width="4" height="16" fill="#5a4527"/><path d="M10 37 H30 L28 34 H12 Z" fill="#625e7a"/><rect x="11" y="18" width="18" height="3" rx="1" fill="#2f3340"/><path d="M12 18 L14 8 H26 L28 18 Z" fill="#ffd48a" opacity="0.85"/><circle cx="20" cy="13" r="3.2" fill="#fff0c0"/><path d="M11 8 L20 2 L29 8 Z" fill="#2f3340"/><circle cx="20" cy="13" r="9" fill="#ffb23e" opacity="0.25"/></svg>`,
};

const ENEMY_ICONS = {
  scuttler: `<svg viewBox="0 0 26 26" aria-hidden="true"><ellipse cx="13" cy="15" rx="8" ry="5.5" fill="#2a2a3e"/><ellipse cx="13" cy="13.5" rx="6" ry="3.8" fill="#1d3157"/><circle cx="10" cy="12.5" r="1.2" fill="#4df2c9"/><circle cx="16" cy="12.5" r="1.2" fill="#4df2c9"/><path d="M4 12 L2 6 L7 9 Z M22 12 L24 6 L19 9 Z" fill="#2a2a3e"/><path d="M5 19 L2 22 M9 20 L8 24 M17 20 L18 24 M21 19 L24 22" stroke="#2a2a3e" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  skitterer: `<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M21 6 Q9 5 6 13 Q4 19 8 22" fill="none" stroke="#f4a462" stroke-width="4.5" stroke-linecap="round"/><path d="M21 6 Q15 6 11 9" fill="none" stroke="#4a3358" stroke-width="5" stroke-linecap="round"/><circle cx="21" cy="6" r="1.5" fill="#4df2c9"/><path d="M8 22 L4 24" stroke="#f4a462" stroke-width="2" stroke-linecap="round"/></svg>`,
  shellback: `<svg viewBox="0 0 26 26" aria-hidden="true"><ellipse cx="14" cy="21" rx="9" ry="3.5" fill="#1d3157"/><path d="M6 20 Q5 6 14 4 Q23 6 21 20 Z" fill="#3a2f4d"/><path d="M8 17 Q14 14 20 17 M9 12 Q14 9 19 12" fill="none" stroke="#c8742a" stroke-width="1.8"/><path d="M3 21 L1 17 L6 19 Z" fill="#1d3157"/></svg>`,
  mistwalker: `<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M4 13 Q4 3 13 3 Q22 3 22 13 Z" fill="#9fe8e0" opacity="0.8"/><circle cx="13" cy="9" r="2.4" fill="#e9fff8"/><path d="M7 13 Q5 18 8 23 M11 13 Q10 19 12 24 M15 13 Q17 19 14 24 M19 13 Q21 18 18 23" fill="none" stroke="#4df2c9" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/></svg>`,
  broodmother: `<svg viewBox="0 0 26 26" aria-hidden="true"><ellipse cx="13" cy="16" rx="10" ry="6" fill="#4a2848"/><circle cx="13" cy="10" r="5" fill="#ff6b5b"/><circle cx="11" cy="9" r="1.4" fill="#ffd9a0"/><circle cx="15" cy="11" r="1.4" fill="#ffd9a0"/><path d="M4 15 L1 20 M22 15 L25 20" stroke="#4a2848" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  gull: `<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M13 14 Q8 6 1 8 Q7 10 10 16 Z M13 14 Q18 6 25 8 Q19 10 16 16 Z" fill="#4a4580"/><ellipse cx="13" cy="15" rx="3" ry="5" fill="#2b2650"/><circle cx="12" cy="11" r="1" fill="#ffa24a"/><circle cx="14" cy="11" r="1" fill="#ffa24a"/></svg>`,
};

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
  const previewChip = el(`<div class="chip hidden" id="preview-chip"><div><div class="label" id="preview-label">Next wave</div>
    <div class="preview-icons"></div></div></div>`);
  hudRow.append(salvageChip, waveChip, previewChip);
  const previewIcons = previewChip.querySelector('.preview-icons');
  const previewLabel = previewChip.querySelector('#preview-label');
  const nextBtn = el('<button class="btn hidden" id="next-wave">Next wave</button>');
  const dock = el('<div id="dock"></div>');
  const menu = el(`<div id="build-menu" class="hidden" role="menu"><div class="menu-title">Build here</div></div>`);
  const optBtns = {};
  const barBtns = {};
  const bar = el('<div id="tower-bar" class="hidden" role="toolbar" aria-label="Towers"></div>');
  for (const [type, t] of Object.entries(TOWER_TYPES)) {
    const opt = el(`<button class="build-opt" data-tower="${type}">${TOWER_ICONS[type]}<span class="opt-name">${t.name}</span>
      <span class="opt-cost">${t.cost}</span><kbd>${t.hotkey}</kbd></button>`);
    opt.addEventListener('click', () => actions.buildSelected(type));
    menu.appendChild(opt);
    optBtns[type] = opt;
    const slot = el(`<button class="bar-slot" data-tower="${type}">${TOWER_ICONS[type]}<span class="slot-text">
      <span class="slot-name">${t.name}</span><span class="slot-cost">${t.cost}</span></span><kbd>${t.hotkey}</kbd></button>`);
    slot.addEventListener('click', () => actions.arm(type));
    bar.appendChild(slot);
    barBtns[type] = slot;
  }
  dock.append(nextBtn, bar);
  ui.append(dock, menu);
  bar.addEventListener('pointerdown', (e) => e.stopPropagation());
  nextBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

  const q = (id) => hudRow.querySelector(id);
  const salvageVal = q('#salvage-val');
  const waveVal = q('#wave-val');
  const waveMax = q('#wave-max');
  const waveLabel = q('#wave-label');
  nextBtn.addEventListener('click', () => actions.nextWave());
  menu.addEventListener('pointerdown', (e) => e.stopPropagation());

  let shownPreview = '';
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
      const top = 84; // below the Light/Salvage chips
      const dockTop = dock.getBoundingClientRect().top - 8; // above the Next wave button and tower bar
      if (window.innerHeight <= 560) {
        // Compact row beside the hex (right if it fits, else left) so the hex and the island stay visible.
        let x = screen.x + 40;
        if (x + w > window.innerWidth - 8) x = screen.x - 40 - w;
        x = Math.max(8, x);
        const y = Math.max(top, Math.min(dockTop - h, screen.y - h / 2));
        menu.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
        return;
      }
      const x = Math.max(8, Math.min(window.innerWidth - w - 8, screen.x - w / 2));
      let y = screen.y + 34;
      if (y + h > dockTop) y = screen.y - 70 - h;
      y = Math.max(top, Math.min(dockTop - h, y));
      menu.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
    },
    /** Floating "+N" that rises from the salvage chip when a wave is called early. */
    floatBonus(n) {
      if (!(n > 0)) return;
      const r = salvageChip.getBoundingClientRect();
      const f = el(`<div class="float-bonus">+${n}</div>`);
      f.style.left = `${Math.round(r.left + r.width / 2)}px`;
      f.style.top = `${Math.round(r.bottom + 2)}px`;
      ui.appendChild(f);
      f.addEventListener('animationend', () => f.remove());
    },
    setArmed(type) { for (const [k, b] of Object.entries(barBtns)) b.classList.toggle('armed', k === type); },
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
        const info = showNext ? game.nextWaveInfo() : null;
        previewChip.classList.toggle('hidden', !info);
        const key = info ? `${info.number}` : '';
        if (key !== shownPreview) {
          shownPreview = key;
          if (info) {
            previewLabel.textContent = `Wave ${info.number} incoming`;
            previewIcons.innerHTML = info.groups.map((g) => `<span class="pv" title="${ENEMY_NAMES[g.type]}">${ENEMY_ICONS[g.type]}<b>${g.count}</b></span>`).join('');
          }
        }
        nextBtn.classList.toggle('hidden', !showNext);
        nextBtn.disabled = game.screen === 'paused';
        if (showNext) nextBtn.innerHTML = `Next wave <span class="bonus">+${Math.round(game.breatherLeft * 1.5)}</span> <kbd>Space</kbd>`;
      }
      if (!inGame && menuHex) this.closeMenu();
      bar.classList.toggle('hidden', !inGame);
      for (const [type, t] of Object.entries(TOWER_TYPES)) {
        const poor = game.salvage < t.cost;
        const title = poor ? `Needs ${t.cost} salvage` : `${t.name}: ${t.blurb}`;
        for (const b of [optBtns[type], barBtns[type]]) { b.classList.toggle('poor', poor); b.title = title; }
      }
    },
  };
}
