# Round 08 evaluation
Commit 5034bc7 · Spend $8.24 · PASS — the armor spark is finally readable and the round-07 minor bugs are fixed; the game is still a one-level slice with no tutorial or pause menu.

Cloud VM (software WebGL, about 5 fps): FPS is information only. Sounds checked through `audioLog()`.

## Scores
| Criterion | Score | Change | Why | What would earn +1 |
|---|---|---|---|---|
| Playability | 6 | 0 | Menu -> Play -> click hex -> build -> win/lose -> Retry works with real clicks (first-time.jpg). 0 console errors, 500 random key/pointer/wheel events and an invalid-call battery left state sane, 16x run to loss with no NaN or growth (max 26 enemies, 2 projectiles). But a first-time player still gets no hint where to click or where the path is (my first click on a path hex only gave a coral outline), no pause menu, and the Next wave button hides behind the tower bar at small windows. | Tutorial (B-017), pause menu and speed (B-013), fix B-044. |
| Depth | 5 | 0 | Three towers and an armored enemy give real counter-choices. A greedy incremental build now loses 8 Light and wins (12/20), and 4 unupgraded towers with 672 unspent salvage lose on wave 6, so spending matters a little. Still one level, no new enemy behaviours. | Lantern/Mistwalker (B-011), more levels (B-016). |
| Style | 6 | 0 | Ochre-banded Shellbacks now read apart from the teal slow ring (slowed-big.jpg); the diorama, bell arch and cannons stay cohesive. Still no sky/horizon, flat dark sea, hard-edged beam wedge. | Sky, stars, softer beam, living sea (B-014, B-032). |
| Feel | 6 | 0 | Armor hit now gives a white burst over the shell plus chips for about 0.2 s (spark-sheet.jpg), readable at the default camera. Still no recoil, hit flash or build drop-in juice visible beyond what existed; no sound can be heard by me, only logged. | Build/combat juice (B-027, B-028). |

## Items in review
- B-010 — verified. Line 3: with 2 harpoons on the beach and `skipToWave(6)`, at the tick of an `armor_hit` (audioLog time 20.65) a bright cream-white burst covers the Shellback and 9 chips fly out; frames 0,1,2,3,4,6,9,12 ticks (spark-sheet.jpg) show it growing, then fading to dots by tick 12 (~0.2 s). `bell_ring` and `armor_hit` are in `audioLog()`. Lines 1, 2, 4 were verified in round 07 and the bar still shows Harpoon/Cannon/Bell with 1/2/3 (first-time.jpg). The burst is cream-white more than yellow; acceptable.
- B-043 — verified. (1) Harpoon at (0,-1), `step(90)`, hover: the pale outline frames the tower's hex around its foot, centre at (640,~315) = `toScreen` of the tile top (hover-occ-big.jpg); not one hex in front. (2) At 640x420 the build menu sits between the HUD chips and the bar, no overlap with the chips, and the whole island is visible (small-menu2.jpg); but see new minor issues. (3) A slowed Shellback in a bell's range has a teal ring on the ground while its shell bands are ochre (slowed-big.jpg); an unslowed one has bands only.

## Bugs
No blocker or major.

### [minor] "Next wave" button is hidden behind the tower bar at small windows
Repro: viewport 800x500 or 640x420, `start({level:1,seed:1})`. Expected: button fully visible above the bar. Actual: button rect y 403-436 overlaps bar y 416-492 at 800x500; at 640x420 only the top of the button shows (small-start.jpg, 800x500.jpg). Fine at 1024x600 and 1280x720. In B-044.
### [minor] Build menu covers the island at 640x420
It no longer hits the HUD but covers the lighthouse and most of the island (small-menu2.jpg). In B-044.
### [minor] Tide Bell range preview uses the amber "buildable" ring
In B-044.
### [polish] The island looks small and dim at 640x420 (a lot of empty sea). The tower bar names wrap to two lines under 1024 px. No marker for the enemy path and no hint that hexes are clickable on first play. Still no sky, no pause menu, no speed control, no tutorial.

## Regressions
Core loop pass: Play (real click) -> build via menu -> natural win at 8x (280 s, 12/20 Light, 8 towers, no errors) -> natural loss at 8x (279 s, wave 6) -> Retry via real click resets to 150 salvage, 0 towers. Re-tested: B-003 build rules (`occupied`, `invalid`, repeated builds), B-009 upgrade/sell/max/invalid ids and `toMenu` then `start` leave 0 towers/enemies, 150 salvage, wave 0; B-041 clicking a cannon body opens the tower panel with targeting, Upgrade 80, Sell 63. `errors()` empty throughout; only GL ReadPixels warnings. Determinism not due (round 10).

## What it's like to play now
It plays well for a short session: I place a harpoon on the beach, add a cannon on the rocks and a bell near the path, and watch the pack get slowed and shelled. Armored hits finally pop with a visible white burst, so the Shellback counter is readable. The first click still lands on the path with no explanation, there is no pause or speed control, and once I know the level there is nothing new: one island, three towers, six waves. The look is cozy and consistent, but the empty dark sea and hard beam still make it feel like a prototype.

## Top 3 priorities for the next round
1. First-time guidance (B-017) and a pause menu with speed control (B-013).
2. Lantern and Mistwalker (B-011) for the first new decision type.
3. Next-wave preview (B-012) and B-044 layout fixes.

## Suggestions for the planner
- Mark the enemy path with faint footprints/arrows during the first breather.
- Show a "Shellback incoming" icon near the beach so counter-choices are informed.
- Add a first-wave hint pointing at a highlighted rock hex so the high-ground rule is discovered.
- Build drop-in, recoil and hit flash are the cheapest next Feel gains.

## Screenshots
- round-08/01-menu.jpg — fresh title
- round-08/02-start.jpg — level 1 seed 1 at start (paused)
- round-08/03-busy.jpg — wave 5: cannons, bell, harpoon, scuttlers and shellbacks slowed
- round-08/04-end.jpg — defeat panel (wave 6); 05-won.jpg — victory panel (12/20)
- round-08/first-time.jpg — HUD and bar for a new player
- round-08/spark-sheet.jpg (+spark-f*.jpg) — armor spark flip-book
- round-08/hover-occ-big.jpg — hover outline on a tower hex
- round-08/slowed-big.jpg — slowed Shellback with teal ring, ochre shell
- round-08/small-start.jpg, small-menu2.jpg, 800x500.jpg, 1024x600.jpg — small viewports
