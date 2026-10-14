# Tidewatch code map

Vite + three.js, ES modules, no network. Run from `game/`: `npm run build`, `npm test`, `npm run smoke`.

## Layers
- `src/sim/` pure simulation (no DOM/three), fixed tick `TICK = 1/60`, seeded RNG. Node-testable.
  - `hex.js` axial flat-top hex math (hexToWorld, worldToHex, hexLine, hexDisk, distance).
  - `rng.js` mulberry32 `createRng(seed)` and `hash2` (stable authored noise).
  - `levels.js` level data (`LEVELS`), `buildLevel(id)` -> tiles, tileMap, path hexes, pathPoints
    (enemy walking line starting in the surf), lighthouse; `pointOnPath(level, s, out)`.
  - `enemies.js` enemy stat table (scuttler, skitterer, shellback: hp, speed in hexes/s, leak, reward, armor vs harpoons).
  - `towers.js` tower stat table (Harpoon Post, Cliff Cannon, Tide Bell: minRange, blast, slow, hotkey), `TIERS` (upgrade cost/damage/rate), `towerStats`, `TARGETING`, buildable terrain, `towerRange` (+1 on rock). `clock.js` TICK.
  - `combat.js` `updateBell` (pulse slows enemies via `slowUntil`/`slow`), tower targeting (priority first/strongest/closest, skips doomed targets), homing bolts; cannon `fireShell` lobs a shell at a predicted path point and `explode` damages all enemies in the blast.
  - `game.js` `Game` class: screen state machine (menu/playing/paused/won/lost), waves
    (breather -> wave -> done, `callNextWave`, clear bonus), enemies, towers, projectiles, salvage, `build()`, `upgrade()`, `sell()` (70%), `setTargeting()`, Light, `events` queue (`drainEvents()`), `snapshot()`; test helpers `skipToWave`, `forceWin`, `forceLose`.
- `src/render/` three.js views that read the sim; all animation uses the `anim` clock from main.js.
  - `stage.js` renderer (ACES, sRGB, soft shadows), scene, fog, sun, hemisphere light, sea.
  - `cameraRig.js` orbit camera: Q/E 60-degree steps, wheel zoom, WASD pan; eased on real dt.
  - `island.js` instanced hex tiles (vertex-color skirt + per-tile jitter), props, footprints. `buildIsland(level, seed)`.
  - `lighthouse.js` tower, emissive lamp, halo, additive beam; `update(time, sinceHit)` handles flicker.
  - `enemyView.js` one model per sim enemy (Scuttler crab, Skitterer shrimp); emerge uses game time (`e.born`).
  - `towerView.js` Harpoon Post and Cliff Cannon models: build bounce + dust ring (game time), turning, recoil. `projectileView.js` pooled bolts and arcing shells (smoke trail via fx).
  - `fx.js` pooled hit/kill particles on the anim clock. `placement.js` hex picking (a click on a tower body resolves to its own hex), hover outline, range ring.
  - `bellModel.js` Tide Bell model; `shellbackModel.js` Shellback model (both own their kit). Slowed enemies get a teal ring + drip trail (enemyView, fx.trail); `fx.bellRing`, `fx.spark`.
  - `palette.js` spec palette constants.
- `src/audio/audio.js` the only sound module: Web Audio synth, unlock on gesture, surf ambience,
  mute (M, persisted in localStorage), `play(id, time)` also writes the `audioLog`.
- `src/ui/` DOM overlay: `screens.js` (title, Light chip, end screen, mute button), `hud.js` (salvage/wave chips, Next wave button, build menu, bottom tower bar), `towerPanel.js` (selected-tower panel: stats, upgrade, targeting, sell), `styles.css`.
- `src/errors.js` collects window errors early. `src/testApi.js` installs `window.__game` for `?test=1`.
- `src/main.js` wires everything (events -> audio/fx/views, build flow, hotkeys Space/1/2/Esc; `armed` tower type, tower selection via `towerPanel`): game loop (accumulator, time scale, fixed ticks), event -> audio/UI,
  world rebuild per (level, seed), `ctl` object shared with the test API.
- `tests/*.test.js` node:test simulation tests. `scripts/smoke.mjs` Playwright smoke (port 4174, writes `harness/smoke/*.png`).

## Conventions
- Sim never touches Math.random; render code never mutates sim state.
- `anim` clock (main.js) = sum of game ticks while playing; real time on menu/end screens; frozen when paused.
- Camera input uses real dt so it works while paused.
- Add a new tower/enemy: stat entry in sim, model builder in render, sound id in audio.js SOUNDS.
