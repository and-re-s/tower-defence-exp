# Round 03 evaluation
Commit 91629fb · Spend $2.74 · PASS — the three review items hold up and the build is stable (0 errors), but the game is still one tower on one level with no onboarding, so scores are flat.

Cloud VM (software WebGL, fps ~5): FPS is information only.

## Scores
| Criterion | Score | Change | Why | What would earn +1 |
|---|---|---|---|---|
| Playability | 6 | 0 | Menu -> Play -> click hex -> build -> win/lose -> Retry/Menu all work; 0 console errors; hotkey 1 now works paused; Menu button works from win and defeat. Still no hint that hexes are clickable (first wave auto-starts at 20 s), no pause menu, one level. | Tutorial (B-017) and pause menu (B-013). |
| Depth | 2 | 0 | Still one tower, one decision (where to put identical posts). Tuning is steeper (3 and 6 posts lose, 8 win), but a greedy "build whenever 50 salvage" player wins 20/20 Light with 16 posts. | Second tower plus select/upgrade/sell (B-008, B-009). |
| Style | 6 | 0 | Same cohesive diorama: warm sand/wood vs dark teal-glow crabs, Fredoka/Atkinson panels, large glowing title. Range ring is now a clean thin amber ring (improvement), but no sky/horizon, beam is still a hard wedge, win-panel zero is slashed. | Sky and horizon gradient, soft beam. |
| Feel | 5 | 0 | Same feedback as round 2: hover outline, ring, build/refuse/fire/hit/death ids, teal death burst. Still no build animation, hit flash, recoil or floating salvage. | Build drop-in + dust, hit flash, salvage chips. |

## Items in review
- B-038 — verified (with a caveat). Evidence: `start({level:1,seed:1}); pause();` click sand hex, press `1` builds (salvage 150 -> 100, audioLog `ui_click`,`build`); after clicking a path hex first it correctly refused. Tuning: 3 posts at (-3,3),(-2,3),(-4,1) lose (wave 4, Light 0, 284 salvage). 6 best-placed posts built once lose at wave 6 (Light 0, 622 salvage). 8 posts win with Light 19, 750 salvage. A greedy rebuilder (16 posts) wins at Light 20. Caveat: the literal line "6 posts lose several Light" is stricter-than-asked (they lose all 20), a cliff between 6 and 8, filed in B-039. Ring: hover-rock-ring.jpg shows a thin amber ring with no darkening of the island.
- B-005 — verified. Evidence: fresh storage load shows title (`screen: 'menu'`, 01-menu.jpg), Play click gives the HUD in level 1; over 60 paused 2 s steps the HUD text always contained the state's light, salvage and `wave / 6`; fonts loaded are Fredoka 600 and Atkinson 400, h1 family is Fredoka; resource list has only own assets (js, css, 2 woff2); Menu button on the victory (04-end.jpg) and defeat (defeat.jpg) screens returns to `menu` with 0 towers/enemies. Only remaining font flaw is the slashed zero in the win panel (B-039).
- B-006 — verified. Evidence: `build` returns `{ok, reason}` with `path`, `terrain`, `lighthouse`, `occupied`, `invalid` and success, each refusal logs `refuse`; `grantSalvage(100)` adds exactly 100; `skipToWave(2)` starts wave 2 (`wave_start` logged), `lose()` gives `lost`/Light 0 and `defeat`, `win()` gives `won`; `win()` after a loss returns false; `callNextWave()` outside a breather returns -1. Every `state()` key and every `__game` member appears in test-api.md. Determinism: two runs of start, 4 builds, skipToWave(2), step 2400, grantSalvage, step 600 give byte-identical `state()` (8761 chars, 22 kills).

## Bugs
No blocker or major. Minors bundled as B-039.

### [minor] Slashed zero remains in the victory panel
Win panel "Light left: 20 / 20" renders "/ 20" in Atkinson (04-end.jpg, "2Ø"); round 2 reported the same, only the wave label was fixed.

### [minor] `skipToWave` accepts out-of-range waves
`skipToWave(0)` and `skipToWave(7)` return true (doc says 1..waveCount).

### [minor] Difficulty cliff on level 1
3 and 6 well-placed posts lose; 8 win at Light 19. Players with ~150 start salvage can only place 3 before wave 1, so the early game reads as "build all you can". Steps from loss to near-perfect in two posts.

### [minor] Next wave button vanishes while paused
02-start.jpg shows no button when paused; Space still works.

### [polish] Title subtitle pill covers the lighthouse lamp
01-menu.jpg: the pill and big title sit right on top of the lamp and beam; the lighthouse is the hero image and is hidden.

### [polish] Retry/Play keeps the test timeScale
After `setTimeScale(16)` then menu -> Play, `timeScale` stays 16. Test-only for now.

### [polish] Enemies and towers still read small at default zoom
03-busy.jpg is better than round 2 (skitterers and crabs readable, posts clear), but crabs on dark brown path hexes are low contrast.

## Regressions
Core loop start -> play -> win/lose -> Retry/Menu passes (greedy bot wins at 16x in 237 s, lose at wave 4 for 3 posts). 40 random real clicks plus keys 1/Esc/Space/right click: no errors, no stuck menus. Resize to 800x500: HUD stays at edges, ring and menu fine (resize-800.jpg). 16x runs of 150-250 game seconds: no NaN, projectiles and enemies return to 0 after the final wave, `errors()` empty. Console: 0 errors (only software-GL ReadPixels warnings). Done items re-tested: B-003 refusals (path, shallows, lighthouse, occupied), B-004 wave and victory flow.

## What it's like to play now
I press Play, see the island and a countdown, and guess to click hexes. Building a harpoon post is quick and the first waves are fun; the island, glowing lamp and crabs look good. With 150 salvage I can place only three posts, then kills fund more, and by wave 4 the crab swarm is a real threat so careful placement matters (a nice change from round 2). But there is still only one tower, nothing to upgrade or sell, no tutorial, and the whole decision is "put another post on the best hex". It is a pleasant toy for one level, not yet a game.

## Top 3 priorities for the next round
1. Second tower and high ground (B-008) plus select/upgrade/sell (B-009): the depth score cannot move without them.
2. Sound pass (B-007) and juice (B-027/B-028): the game is nearly silent in a real session and Feel is flat.
3. Pause menu and first-time guidance (B-013, B-017); fix B-039.

## Suggestions for the planner
- Move the title block to the left or top and let the lighthouse beam be the hero of the title.
- Add sky/horizon and softer beam; they are the biggest Style gap and cheap.
- A faint pulse on a good starting hex before the tutorial exists.
- Show the build menu's range ring while choosing, so the rock-vs-sand choice is visible.

## Screenshots
- round-03/01-menu.jpg — fresh title screen
- round-03/02-start.jpg — level 1 seed 1 right after start (paused)
- round-03/03-busy.jpg — wave 4, 17 enemies, 3 posts (paused)
- round-03/04-end.jpg — victory panel (slashed zero in "/ 20")
- round-03/defeat.jpg, first-play.jpg, first-build.jpg, paused-click.jpg, hover-rock-ring.jpg, resize-800.jpg — evidence
