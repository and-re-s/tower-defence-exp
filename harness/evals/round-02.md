# Round 02 evaluation
Commit 5646e90 · Spend $1.18 · PASS — the loop now works end to end (build, shoot, win, lose, retry) with 0 errors; but there is one tower, a trivially easy level and no onboarding.

Cloud VM (software WebGL, fps ~5): FPS is information only.

## Scores
| Criterion | Score | Change | Why | What would earn +1 |
|---|---|---|---|---|
| Playability | 6 | +2 | Menu -> Play -> click hex -> Harpoon Post -> crabs die -> wave clear -> victory/defeat -> Retry all work; refusals (path, lighthouse, shallows, occupied, salvage) correct; 0 errors in `errors()` across a 200 s win at 16x, key and click spam, resize. Held back: nothing tells a first-time player to click a hex (I found it by clicking); no pause menu; hotkey `1` ignored while paused. | Tutorial/hint (B-017), pause menu (B-013). |
| Depth | 2 | +1 | Only decision: where to put identical posts (grass/sand 3.5 range, rock 4.5). 8 posts win with 0 leaks and 544 salvage unspent; 3 posts reach wave 4 at 20/20 Light. No dominant-strategy problem yet only because there is one strategy. | Second tower (B-008), upgrades (B-009), harder pacing so salvage matters. |
| Style | 6 | +1 | Cohesive spec palette; Fredoka/Atkinson UI panels in Deep Sea with amber numbers, coral for cost shortfall; towers are warm wood/basalt, enemies dark with teal glow, death makes a teal particle burst; skitterers are a clearly different thin orange silhouette. Up close it is charming. Held back: at default zoom crabs/towers are tiny, sea is flat dark void with no sky/horizon, beam is still a hard wedge, hover ring is a muddy grey disc. | Sky/horizon gradient, bigger enemy silhouettes, soft beam. |
| Feel | 5 | +2 | Hover outline (amber/coral), range ring, build sound id, refuse sound id on every bad click, tower rotates to target (angleDeg -114 -> -99), harpoon projectile travels (x -5.6 -> -6.7 over 5 ticks), `enemy_hit`/`enemy_death`/`wave_clear`/`victory` ids, teal burst on death, salvage +4 per kill visible on HUD. Held back: no build animation or dust, no hit flash, no floating +N salvage, no tower recoil, no sell/upgrade, towers pop in. | Build drop-in + dust, hit flash, salvage chips (B-027/B-028). |

## Items in review
- B-037 — verified. Evidence: after zoom/Q/E and `start()`, Retry click and Play click, `camera` = yaw 0, zoom 1, pan 0,0 each time; `audioLog()` is `[]` right after `start()` and later times are monotonic; `start(); pause(); step(1260)` shows a full-size crab at progress 0.05 (step-spawn.jpg); zoom 0 shows ~8-9 hex columns, towers and neighbours visible (zoom-close.jpg); title subtitle sits on a dark pill and is legible (01-menu.jpg); favicon is an inline data URI, no 404 and no console messages. Remaining: beam still hard-edged (not part of the item).
- B-003 — verified. Evidence: `build` reasons `path`, `lighthouse`, `terrain` (shallows), `invalid` (off map), `occupied`, `salvage` each refuse and log `refuse`; coral outline on path and lighthouse hex (hover-path-coral.jpg, hover-lighthouse.jpg); with 0 salvage the menu cost is rgb(232,90,79) and clicking it refuses and keeps the menu; successful build: salvage 150 -> 100, `towers` lists type/q/r/tier/range, `build` in `audioLog()`; rock tower range 4.5 vs 3.5 and a visibly larger ring on rock (rock-ring.jpg); `targetId` set, `angleDeg` changes, projectile positions travel, hp drops, `enemy_death`, kills raise salvage (80 -> 84).
- B-004 — verified. Evidence: `wave`, `waveCount` 6, `phase` breather/wave/done; wave 1 = 8 scuttlers, wave 2 = 10 scuttlers + 6 skitterers; skitterer mean progress speed 0.090/s vs scuttler 0.050/s (n=5/18); 8 posts at 8x and 6 posts at 16x both reach `screen:'won'` with victory panel (04-end.jpg) and `victory`, `wave_clear`, `wave_start` ids; Retry clicked from both the win and loss screens gives Light 20, salvage 150, wave 0, no towers/enemies/projectiles, errors empty.

## Bugs
No blocker or major. Minor items are bundled as B-038.

### [minor] Hotkey 1 does nothing while `paused`
Repro: `start({level:1,seed:1}); pause();` click a sand hex (menu opens), press `1`: no tower, salvage 150 (only `ui_click` logged). After `resume()` the same press builds. test-api.md says input works while paused; the menu shows a "1" hint.

### [minor] Level 1 is too easy
Repro: `start({level:1,seed:1})`, build posts at (-3,3), (-2,3), (-4,1), run at 8x: wave 4 reached with Light 20 and 305 salvage unspent. 8 posts (seed 1) win with Light 20/20 and 544 salvage. With seed 2, 6 posts and early calls ended at Light 5 (so some pressure exists, only if the player over-calls). Salvage piles up with nothing to spend it on, which will worsen once only one tower exists.

### [minor] Range ring is a muddy grey disc
hover-sand.jpg, rock-ring.jpg: translucent grey fill darkens sea and tiles under it.

### [polish] Slashed zeros in Atkinson Hyperlegible
"Next in 20s" and "/ 20" render as "2Ø" in HUD and win panel. Hyperlegible's zero is slashed by design; consider Fredoka numerals for all HUD numbers.

### [polish] Enemies still small and sticker-like
At default zoom the scuttlers are dark specks on a pale translucent disc (03-busy.jpg); skitterers read better.

### [polish] No salvage feedback near the counter
Kills give +4 but nothing flies or floats; the number just changes.

### [polish] Retry keeps the test `timeScale`
After a 16x loss, Retry starts at 16x (state().timeScale 16). Only matters for test runs, but a player-facing speed button later should reset sensibly.

## Regressions
Core loop start -> play -> win/lose -> Retry passes. Menu -> Play (button and Enter) resets camera. Q/E rotate still eased. Spam of 30 random canvas clicks plus keys Esc/1/2/Space/p/f/b: no errors. Esc and right click close the build menu. Resize to 800x500 keeps HUD in corners and the menu anchored near the hex (resize-800.jpg). No network requests apart from own assets and fonts. Console: 0 errors, 0 warnings (the earlier PCFSoftShadowMap warning is gone; only GL driver "ReadPixels" notices from software GL on first load). 200 s runs at 8x/16x: no NaN, no negative values, projectiles and enemies return to 0 after a wave.

## What it's like to play now
I click Play, see the island and a "Next in 19s" timer with a big amber Next wave button, and have to guess that hexes are clickable. Hovering lights an amber outline and a big range ring; clicking opens a neat little "Build here" menu, and a wooden ballista post pops onto the tile. When the crabs wade in the post swivels, a bolt flies, the crab bursts into teal sparks and the salvage counter ticks up. It is satisfying for the first two waves, then I realise I have 300 salvage and nothing to spend it on, and waves 4-6 just fall to a handful of posts. Win and defeat panels are clean and Retry is instant. It works as a toy, not yet as a strategy game.

## Top 3 priorities for the next round
1. Second tower and the high-ground rule as a real choice (B-008), plus tuning so salvage is scarce (B-038).
2. Select/upgrade/sell (B-009) so salvage has a sink and towers can be removed (currently a misplaced post is permanent).
3. HUD/title polish and first-time guidance (B-005, B-013, B-017): a hint on the first hex and a pause menu.

## Suggestions for the planner
- Show a faint "click a hex to build" pulse on a good rock hex during the first breather before the tutorial exists.
- Enemies can be hit while still in the surf, before they land on the path; consider starting range checks at the first beach hex so they have a visible approach.
- The first wave auto-starts at 20 s even if the player has not built; fine, but flag it with a toast ("The tide is coming").
- Add sky and horizon, and soften the beam edges; they are the largest remaining Style gap.
- Put a small shadow/dust ring under placed towers so they sit on the tile.

## Screenshots
- round-02/01-menu.jpg — fresh storage title screen (subtitle on pill)
- round-02/02-start.jpg — level 1 seed 1 right after start, paused
- round-02/03-busy.jpg — wave 4, 16 enemies, 3 posts, paused
- round-02/04-end.jpg — victory panel (Light 20/20)
- round-02/first-play.jpg, hover-sand.jpg, first-build.jpg, hover-path-coral.jpg, hover-lighthouse.jpg, menu-nosalvage.jpg, rock-ring.jpg — build/hover evidence
- round-02/zoom-close.jpg, step-spawn.jpg, step600.jpg, proj-1.jpg, flip-a.jpg, shot-a/b/c.jpg — camera, step-render and shot/death flip-book
- round-02/resize-800.jpg — 800x500 window
