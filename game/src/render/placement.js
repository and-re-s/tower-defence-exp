import * as THREE from 'three';
import { PAL } from './palette.js';
import { hexKey, worldToHex, SQRT3 } from '../sim/hex.js';
import { towerRange } from '../sim/towers.js';

/**
 * Hex picking, the hover outline and the range ring. Pure view code: it asks the game whether a hex is
 * buildable and tells the UI what was clicked.
 */
export function createPlacement({ scene, camera, dom, game, onPick, onCancel }) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  const outlineGeo = new THREE.RingGeometry(0.8, 0.95, 6);
  outlineGeo.rotateX(-Math.PI / 2);
  const ringGeo = new THREE.RingGeometry(0.978, 1, 96);
  ringGeo.rotateX(-Math.PI / 2);
  const discGeo = new THREE.CircleGeometry(1, 48);
  discGeo.rotateX(-Math.PI / 2);
  const mk = (color, opacity) => new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
  });
  const mats = { select: mk(0xf3e9d2, 0.5), amber: mk(PAL.amber, 0.95), coral: mk(PAL.coral, 0.95), ring: mk(PAL.amber, 0.9), disc: mk(0xffa23a, 0.06), tealRing: mk(PAL.shallows, 0.95), tealDisc: mk(0x2e8c94, 0.1) };
  mats.disc.blending = THREE.AdditiveBlending; // warm glow that never darkens the island
mats.tealDisc.blending = THREE.AdditiveBlending;
  const outline = new THREE.Mesh(outlineGeo, mats.amber);
  const ring = new THREE.Mesh(ringGeo, mats.ring);
  const disc = new THREE.Mesh(discGeo, mats.disc);
  const selOutline = new THREE.Mesh(outlineGeo, mats.amber);
  for (const o of [outline, ring, disc, selOutline]) { o.renderOrder = 10; o.visible = false; scene.add(o); }

  let hover = null; // {q, r} under the pointer
  let selected = null; // hex with the build menu open
  let flash = -10;
  let flashAt = null;
  let pointerIn = false;

  const top = new THREE.Vector3();
  const base = new THREE.Vector3();
  /** A click on a tower's visible body counts as a click on the tower's own hex. */
  function pickTower(clientX, clientY, rect) {
    let best = null;
    let bestD = 34;
    for (const t of game.towers) {
      const h = t.type === 'cannon' ? 2.0 : t.type === 'bell' ? 3.0 : 3.0;
      base.set(t.x, t.y + 0.2, t.z).project(camera);
      top.set(t.x, t.y + h, t.z).project(camera);
      const bx = rect.left + ((base.x + 1) / 2) * rect.width;
      const by = rect.top + ((1 - base.y) / 2) * rect.height;
      const tx = rect.left + ((top.x + 1) / 2) * rect.width;
      const ty = rect.top + ((1 - top.y) / 2) * rect.height;
      const vx = tx - bx;
      const vy = ty - by;
      const len2 = vx * vx + vy * vy || 1;
      const u = Math.max(0, Math.min(1, ((clientX - bx) * vx + (clientY - by) * vy) / len2));
      const d = Math.hypot(clientX - (bx + vx * u), clientY - (by + vy * u));
      if (d < bestD) { bestD = d; best = { q: t.q, r: t.r }; }
    }
    return best;
  }

  function pick(clientX, clientY) {
    const rect = dom.getBoundingClientRect();
    const onTower = game.level && game.towers.length ? pickTower(clientX, clientY, rect) : null;
    if (onTower) return onTower;
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    // Intersect with the plane at the height of the tile found so far; two rounds settle on tall tiles.
    let h = 0.25;
    let res = null;
    for (let i = 0; i < 3; i++) {
      plane.constant = -h;
      if (!ray.ray.intersectPlane(plane, hit)) return null;
      res = worldToHex(hit.x, hit.z);
      const tile = game.level && game.level.tileMap.get(hexKey(res.q, res.r));
      if (!tile) return null;
      h = tile.height;
    }
    return res;
  }

  dom.addEventListener('pointermove', (e) => { pointerIn = true; hover = pick(e.clientX, e.clientY); });
  dom.addEventListener('pointerleave', () => { pointerIn = false; hover = null; });
  dom.addEventListener('pointerdown', (e) => {
    if (e.button === 2) { onCancel(); return; }
    if (e.button !== 0 || (game.screen !== 'playing' && game.screen !== 'paused')) return;
    const hex = pick(e.clientX, e.clientY);
    if (hex) onPick(hex);
    else onCancel();
  });
  dom.addEventListener('contextmenu', (e) => e.preventDefault());

  /** The Tide Bell previews in teal so its ring never reads as the amber build cue. */
  function tint(type) {
    ring.material = type === 'bell' ? mats.tealRing : mats.ring;
    disc.material = type === 'bell' ? mats.tealDisc : mats.disc;
  }

  function place(hex, type, time, kind) {
    const tile = game.level.tileMap.get(hexKey(hex.q, hex.r));
    const y = tile.height + 0.05;
    const pulse = 0.5 + 0.5 * Math.sin(time * 5);
    outline.position.set(tile.x, y, tile.z);
    outline.scale.setScalar(1 + (kind === 'ok' ? 0.02 * pulse : 0));
    if (kind === 'ok') {
      tint(type);
      const r = hexRange(type, tile) * SQRT3;
      for (const o of [ring, disc]) { o.position.set(tile.x, y, tile.z); o.scale.set(r, 1, r); o.visible = true; }
      ring.scale.set(r, 1, r);
    }
  }
  const hexRange = (type, tile) => towerRange(type, tile.terrain);

  return {
    /** Hex currently open in the build menu (or null). */
    setSelected(hex) { selected = hex; },
    refuseFlash(hex, time) { flashAt = hex; flash = time; },
    reset() { selected = null; flashAt = null; },
    hover: () => hover,
    update(time, type = 'harpoon', selTower = null) {
      outline.visible = ring.visible = disc.visible = selOutline.visible = false;
      if ((game.screen !== 'playing' && game.screen !== 'paused') || !game.level) return;
      const active = selected || (pointerIn ? hover : null);
      if (active) {
        const blocker = game.buildBlocker(type, active.q, active.r);
        const ok = !blocker || blocker === 'salvage';
        outline.material = blocker === 'occupied' ? mats.select : ok ? mats.amber : mats.coral;
        outline.visible = true;
        place(active, type, time, ok ? 'ok' : 'no');
      }
      if (selTower) {
        const tile = game.level.tileMap.get(hexKey(selTower.q, selTower.r));
        const y = tile.height + 0.05;
        const r = selTower.range * SQRT3;
        tint(selTower.type);
        outline.material = mats.amber;
        outline.position.set(tile.x, y, tile.z);
        outline.scale.setScalar(1);
        outline.visible = true;
        for (const o of [ring, disc]) { o.position.set(tile.x, y, tile.z); o.scale.set(r, 1, r); o.visible = true; }
      }
      if (flashAt && time - flash < 0.4) {
        const tile = game.level.tileMap.get(hexKey(flashAt.q, flashAt.r));
        selOutline.material = mats.coral;
        selOutline.position.set(tile.x, tile.height + 0.07, tile.z);
        selOutline.scale.setScalar(1 + 0.12 * Math.sin(((time - flash) / 0.4) * Math.PI));
        selOutline.visible = true;
        outline.material = mats.coral;
      }
    },
    dispose() {
      for (const o of [outline, ring, disc, selOutline]) scene.remove(o);
      outlineGeo.dispose(); ringGeo.dispose(); discGeo.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    },
  };
}
