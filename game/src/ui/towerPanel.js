import { TOWER_TYPES, MAX_TIER, TARGETING } from '../sim/towers.js';

const LABELS = { first: 'First', strongest: 'Strongest', closest: 'Closest' };

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** Panel anchored next to the selected tower: stats, upgrade, targeting priority and sell. */
export function createTowerPanel(ui, game, actions) {
  const panel = el(`<div id="tower-panel" class="hidden" role="dialog" aria-label="Tower">
    <div class="tp-head"><span class="tp-name"></span><span class="tp-tier"></span></div>
    <div class="tp-stats"></div>
    <div class="tp-label">Targets</div>
    <div class="tp-target" role="group"></div>
    <button class="tp-up"></button>
    <button class="tp-sell"></button>
  </div>`);
  const q = (s) => panel.querySelector(s);
  const nameEl = q('.tp-name');
  const tierEl = q('.tp-tier');
  const stats = q('.tp-stats');
  const targetRow = q('.tp-target');
  const upBtn = q('.tp-up');
  const sellBtn = q('.tp-sell');
  const modeBtns = {};
  for (const mode of TARGETING) {
    const b = el(`<button data-mode="${mode}">${LABELS[mode]}</button>`);
    b.addEventListener('click', () => actions.target(mode));
    targetRow.appendChild(b);
    modeBtns[mode] = b;
  }
  upBtn.addEventListener('click', () => actions.upgrade());
  sellBtn.addEventListener('click', () => actions.sell());
  panel.addEventListener('pointerdown', (e) => e.stopPropagation());
  ui.appendChild(panel);

  let towerId = 0;
  let key = '';
  return {
    open(id) { towerId = id; key = ''; panel.classList.remove('hidden'); },
    close() { towerId = 0; panel.classList.add('hidden'); },
    towerId: () => towerId,
    /** Puts the panel beside the tower (right if it fits, else left) so it never covers it. */
    reposition(screen) {
      if (!towerId) return;
      const w = panel.offsetWidth || 210;
      const h = panel.offsetHeight || 220;
      const gap = 62;
      let x = screen.x + gap;
      if (x + w > window.innerWidth - 8) x = screen.x - gap - w;
      x = Math.max(8, x);
      const y = Math.max(8, Math.min(window.innerHeight - h - 8, screen.y - h / 2));
      panel.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
    },
    sync() {
      if (!towerId) return;
      const t = game.towerById(towerId);
      if (!t || (game.screen !== 'playing' && game.screen !== 'paused')) { this.close(); return; }
      const st = game.towerStats(t);
      const k = `${t.tier}|${t.targeting}|${game.salvage >= game.upgradeCost(t)}|${game.salvage}`;
      if (k === key) return;
      key = k;
      nameEl.textContent = TOWER_TYPES[t.type].name;
      tierEl.innerHTML = Array.from({ length: MAX_TIER }, (_, i) => `<i class="${i < t.tier ? 'on' : ''}"></i>`).join('');
      stats.innerHTML = `<div><span>Damage</span><b>${st.damage}</b></div><div><span>Rate</span><b>${st.rate}/s</b></div>
        <div><span>Range</span><b>${t.range}</b></div>`;
      for (const [m, b] of Object.entries(modeBtns)) b.classList.toggle('on', m === t.targeting);
      const cost = game.upgradeCost(t);
      if (!cost) {
        upBtn.textContent = 'Fully upgraded';
        upBtn.disabled = true;
      } else {
        upBtn.innerHTML = `Upgrade <span class="tp-cost">${cost}</span>`;
        upBtn.disabled = false;
      }
      upBtn.classList.toggle('poor', !!cost && game.salvage < cost);
      sellBtn.innerHTML = `Sell for <span class="tp-cost">${game.sellValue(t)}</span>`;
    },
  };
}
