# Round 05 evaluation
Commit 81d02c8 · Spend $4.18 · PASS — Cliff Cannon, high-ground range and the B-040 fixes all hold up; first real second choice, but cannons make level 1 trivial and tower clicks pick the wrong hex.

Cloud VM (software WebGL): FPS is information only. Sounds were checked through `audioLog()`, not by ear.

## Scores
| Criterion | Score | Change | Why | What would earn +1 |
|---|---|---|---|---|
| Playability | 6 | 0 | Menu -> Play -> build (click/menu/hotkey/bar) -> win/lose -> Retry works, 0 console errors, 400 spammed keys + 200 random pointer events left state sane. Still no hint that hexes are clickable, no pause menu, clicking a tower picks the hex behind it. | Tutorial (B-017), pause menu (B-013), fix tower picking. |
| Depth | 3 | +1 | +1: a second tower with a real trade-off (splash, min range 1.5, rock range +1) and a visible rock-vs-sand ring. But no upgrades/sell, and cannons dominate: 8 cannons or a mixed 8-tower build win 20/20 Light on level 1 (salvage left 183-303), so the choice is solved quickly. | Upgrade/sell/targeting (B-009), counter enemies (B-010), retune level 1 for two towers. |
| Style | 6 | 0 | Cannon fits the palette (slate barrel, amber band, basalt base) and reads clearly different from the thin harpoon post; tower bar matches HUD chips. Still no sky/horizon, hard beam wedge, harpoon post is tiny next to the cannon. | Sky/horizon, softer beam, harpoon model at the same visual weight. |
| Feel | 6 | 0 | Cannon swivels toward targets, lobs a shell, has its own `cannon_fire`/`cannon_boom` ids; unaffordable costs turn red in the bar and menu. But the blast is barely visible at the default camera, no build drop-in, no hit flash, no recoil. | Readable explosion, build/combat juice (B-027/B-028). |

## Items in review
- B-040 — verified. (1) `start({level:1,seed:1}); pause();` then Space (window and document): wave stays 0, phase `breather`, `#next-wave` disabled; after `resume()` Space calls wave 1. (2) `setTimeScale(16); start()` -> timeScale 1; `setTimeScale(16); toMenu()`, real Play click -> 1; Retry click after a win at 16x -> 1.
- B-008 — verified. Evidence: (1) cannon on rock (0,-1), seed 1, wave 1 stepped by 1-6 ticks: two enemies lost hp on the same step at t=1.65 and t=3.717; at t=1.5->1.7 hp went 50/50 -> 14/26 from one shell. (2) cannon at (-1,2) beside the path: nearest enemy came to 0.87 hex, targeted distance over 157 samples was min 1.54, max 4.0 hex, i.e. never inside 1.5. (3) `state().towers`: cannon 5 on rock / 4 on grass, harpoon 4.5 on rock / 3.5 on grass; ring-rock.jpg vs ring-sand.jpg show clearly larger ring on rock. (4) towers.jpg / shell1-3.jpg: squat dark barrel with amber band, rotates toward target, very different from the thin wooden harpoon post; `audioLog()` has `cannon_fire` and `cannon_boom`. Bar shows both towers with icons, costs, hotkeys 1-2; hotkey 2 on a hovered hex builds a cannon (salvage 260 -> 170); bar click arms it.

## Bugs
No blocker or major. Minors bundled as B-041.

### [minor] Clicking a tower's body opens the build menu for the hex behind it
Repro: `start({level:1,seed:1}); pause(); build('cannon',0,-1)`; click (640,300); the highlighted hex is (0,-2) and choosing Harpoon Post builds a harpoon at (0,-2) (towers: cannon 0,-1; harpoon 0,-2). Expected: click resolves to the tower's hex. Evidence: click-tower.jpg.

### [minor] "Build here" opens on any hex including occupied ones; armed type survives restart
After `start()` the cannon slot stayed highlighted (armed) from the previous session while the menu highlighted Harpoon Post (resize-800.jpg).

### [minor] Cannon explosion is nearly invisible
boom.jpg / boom2.jpg: right after `cannon_boom` there is only a tiny yellow speck; the blast radius is not readable, so splash is hard to understand without reading the log.

### [polish] Cannon seen from above reads as a dark cauldron until it rotates; harpoon post is tiny (closeup.jpg). Camera zoom limit barely changes the view.
### [polish] Build menu covers the island centre; the tall tower ring/hex outline hides behind towers.
### [polish] 6 waves are cleared with 183-303 salvage unspent even with 8 towers: still no sink until upgrades.

## Regressions
Core loop pass: natural wins with 8 cannons, with a mixed 8-tower build (Light 20/20, 150 kills, 251 s game time at 16x) and a natural loss with 3 cannons (wave 6, Light 0). No errors in `errors()`, no NaN/null in state, max 8 enemies/3 projectiles at once. Build refusals re-tested: occupied, path, salvage, lighthouse, invalid (off island, unknown type, NaN) all refuse with `refuse` logged and salvage unchanged. Resize 800x480: HUD, bar and button fit (button overlaps bar slightly less than island). Done items re-tested: B-003 (build rules), B-006 (skipToWave to wave 5, step), B-007 (audio ids, state.audio). Determinism (due this round): `start({level:1,seed:1})`, 3 towers, callNextWave, 600 ticks, twice -> identical JSON of enemies, projectiles, towers, salvage, kills.

## What it's like to play now
I still get dropped in with a countdown and have to guess that hexes are clickable, but now the bar at the bottom shows two towers with costs and the build menu offers a choice. A cannon on a rock hex is satisfying to read: it swings toward the crabs and lobs a shell, and pairing it with a few posts wins a perfect game. That is the problem: I never felt pressure, the splash tower simply beats the level, and I ended with hundreds of salvage nothing could spend. Clicking on the tower itself picks the tile behind it, which feels broken. The explosion needs to be seen to be felt.

## Top 3 priorities for the next round
1. B-009 select/upgrade/sell (it also fixes tower clicking) and a salvage sink; B-041 bundle.
2. Retune level 1 for two towers (cannon-only should not win flawlessly) and add counters (B-010).
3. First-time guidance (B-017) and pause menu/speed (B-013); then combat juice for the blast.

## Suggestions for the planner
- Show the min-range as a faint inner ring in the cannon preview.
- Give the cannon blast a ground scorch/dust ring and a camera nudge when it hits 3+ enemies.
- Harpoon post needs a bolder silhouette (bigger ballista head) to match the cannon.

## Screenshots
- round-05/01-menu.jpg — fresh title
- round-05/02-start.jpg — level 1 seed 1, paused, bar with two towers
- round-05/03-busy.jpg — wave 5, 3 cannons + 4 posts, 8 crabs, shells in flight
- round-05/04-end.jpg — victory panel (20/20 Light)
- round-05/towers.jpg, closeup.jpg — cannon vs harpoon silhouette; ring-rock.jpg, ring-sand.jpg — range ring; shell1-3.jpg, boom.jpg, boom2.jpg — shot flip-book; menu-rock.jpg, click-tower.jpg, resize-800.jpg
