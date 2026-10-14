# Tidewatch code map

Vite + three.js, ES modules, no network. Run from `game/`: `npm run build`, `npm test`, `npm run smoke`.

## Layers
- `src/sim/` pure simulation (no DOM/three), fixed tick `TICK = 1/60`, seeded RNG. Node-testable.
  - `hex.js` axial flat-top hex math (hexToWorld, worldToHex, hexLine, hexDisk, distance).
  - `rng.js` mulberry32 `createRng(seed)` and `hash2` (stable authored noise).
  - `levels.js` level data (`LEVELS`), `buildLevel(id)` -> tiles, tileMap, path hexes, pathPoints
    (enemy walking line starting in the surf), lighthouse; `pointOnPath(level, s, out)`.
  - `enemies.js` enemy stat table (scuttler, skitterer: hp, speed in hexes/s, leak, reward).
  - `towers.js` tower stat table (Harpoon Post), buildable terrain, `towerRange` (+1 on rock). `clock.js` TICK.
  - `combat.js` tower targeting (first on path, skips doomed targets), homing projectiles, damage on arrival.
  - `game.js` `Game` class: screen state machine (menu/playing/paused/won/lost), waves
    (breather -> wave -> done, `callNextWave`, clear bonus), enemies, towers, projectiles, salvage, `build()`, Light, `events` queue (`drainEvents()`), `snapshot()`.
- `src/render/` three.js views that read the sim; all animation uses the `anim` clock from main.js.
  - `stage.js` renderer (ACES, sRGB, soft shadows), scene, fog, sun, hemisphere light, sea.
  - `cameraRig.js` orbit camera: Q/E 60-degree steps, wheel zoom, WASD pan; eased on real dt.
  - `island.js` instanced hex tiles (vertex-color skirt + per-tile jitter), props, footprints. `buildIsland(level, seed)`.
  - `lighthouse.js` tower, emissive lamp, halo, additive beam; `update(time, sinceHit)` handles flicker.
  - `enemyView.js` one model per sim enemy (Scuttler crab, Skitterer shrimp); emerge uses game time (`e.born`).
  - `towerView.js` Harpoon Post model: build bounce + dust ring (game time), turning, recoil. `projectileView.js` pooled bolts.
  - `fx.js` pooled hit/kill particles on the anim clock. `placement.js` hex picking, hover outline, range ring.
  - `palette.js` spec palette constants.
- `src/audio/audio.js` the only sound module: Web Audio synth, unlock on gesture, surf ambience,
  mute (M, persisted in localStorage), `play(id, time)` also writes the `audioLog`.
- `src/ui/` DOM overlay: `screens.js` (title, Light chip, end screen, mute button), `hud.js` (salvage/wave chips, Next wave button, build menu), `styles.css`.
- `src/errors.js` collects window errors early. `src/testApi.js` installs `window.__game` for `?test=1`.
- `src/main.js` wires everything (events -> audio/fx/views, build flow, hotkeys Space/1/Esc): game loop (accumulator, time scale, fixed ticks), event -> audio/UI,
  world rebuild per (level, seed), `ctl` object shared with the test API.
- `tests/*.test.js` node:test simulation tests. `scripts/smoke.mjs` Playwright smoke (port 4174, writes `harness/smoke/*.png`).

## Conventions
- Sim never touches Math.random; render code never mutates sim state.
- `anim` clock (main.js) = sum of game ticks while playing; real time on menu/end screens; frozen when paused.
- Camera input uses real dt so it works while paused.
- Add a new tower/enemy: stat entry in sim, model builder in render, sound id in audio.js SOUNDS.
