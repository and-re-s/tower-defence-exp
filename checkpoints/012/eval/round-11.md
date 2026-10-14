# Round 11 evaluation
Commit 2f6c0e0 · Spend $11.68 · PASS — Broodmother and Gloom Gulls work and the sky shader no longer errors, but the sky/stars are still invisible and golden hour is still not golden.

Cloud VM (software WebGL, fps 4-60): FPS is information only. Determinism not due this round.

## Scores
| Criterion | Score | Change | Why | What would earn +1 |
|---|---|---|---|---|
| Playability | 7 | 0 | Menu -> real click Play -> build via menu -> wave -> win at 8x (11/20 Light) -> Retry resets all state; console now 0 errors; 200 random clicks/keys left no errors or NaN. Still no first-time guidance (nothing says what to click) and one level. | Tutorial (B-017), a second level (B-016). |
| Depth | 6 | 0 | Gulls force harpoons and Broodmothers add a burst threat, but an 8-tower harpoon-heavy layout still wins with 640 salvage unspent; no new decision about where or what to build. | Levels with different layouts, specializations, salvage sinks. |
| Style | 7 | 0 | Broodmother (red spotted shell) and gull silhouette with ground shadow are readable and on-style; night towers now legible. Held back: no sky or stars anywhere, wave 1 is mauve not golden, night sand is flat grey. | Visible sky/stars, truly golden start. |
| Feel | 6 | 0 | Nothing new in juice: no health bars, no visible burst on Broodmother death (no flip-book frame showed one), bolts at gulls from ground level. | B-027/B-028 juice. |

## Items in review
- B-015 — verified. (1) `build` 4 harpoons, `spawnEnemy('broodmother')`: it died at (-6, 2.49), next state had 4 `skitterer` entries at (-6,3.2), (-5.99,3.47), (-5.75,3.61), (-5.5,3.75), each hp 25, kills 1. (2) Gull from (-9.288, 1.072) to lighthouse (3,-1.732): positions at t=0.5/1/1.5/2 were z 0.80/0.53/0.26/-0.01 on the straight line, y 3.2, `flying` true, off the path. With only 2 cannons + 2 bells the gull kept hp 30, `slowed` false, towers' targetId 0 and it leaked 1 Light (audio `lighthouse_hit`), while with a harpoon `targetId` was 1 and it died in 2.5 s. (3) brood-gull.jpg, gull-zoom.jpg: big red spotted shell crab vs tiny scuttler; dark bird with an elliptical shadow on the tiles under it.
- B-046 — failed. Line 1 passes (0 errors, 0 warnings about WebGLProgram on title, level, night). Line 2 fails: night screenshots at zoom 0/0.6/1 and panned (night.jpg, night-close.jpg, night-pan.jpg) show no gradient, dome or stars anywhere; the camera only sees sea. progress.md itself admits "barely visible".
- B-047 — failed (one line of five). Passing: 400x700 chips inside (preview chip 8-53 px, icon-only), 500x350 all inside; night towers/lantern readable (03-busy.jpg); pause menu: click at (1000,200), F, 1 and Space all ignored (`screen` stayed paused, towers 0, salvage 150, wave 0); Mistwalker ripple is coral and small, unlike the pale large spawn rings (mist-cloaked.jpg). Failing: 02-start.jpg sea/fog at wave 1 is dark mauve/navy, not warm/golden.

## Bugs
### [major] Sky dome and stars still never visible (B-046, reopened)
Repro: `start({level:1,seed:1}); pause(); skipToWave(6); step(600)`, screenshot at any zoom/pan. Expected: sky gradient/stars, as spec and progress claim. Actual: flat dark blue; nothing above the sea. Evidence: night*.jpg.
### [minor] Golden hour not golden (B-047)
Repro: `start({level:1,seed:1})`, screenshot. Expected warm sea/fog; actual purple-navy (02-start.jpg).
### [polish]
- Night turns all sand tiles flat grey-white and the sea saturated royal blue: legible but reads as a different, plain palette (night.jpg).
- After the Broodmother's hp reaches 0 and the enemy leaves `state()`, one captured frame still showed its pink shell (brood-burst4.jpg); next frame it was gone. No burst/gib effect was visible when it split.
- Broodmother needs about 5.5 s under 4 harpoons yet no health bar shows its damage; unspent salvage (640 at win) has no sink.
- The "Next wave" button looks faded while paused via test API (probably intended).
- Gull bolts start at tower height and travel to ground height of the target plan (known issue); gull is a dark silhouette on dark night tiles.

## Regressions
- Core loop: menu (real click on Play) -> hex click opens build menu -> Harpoon (salvage 150->100) -> natural 8x win at t=241 s, Light 11, 161 kills, max 13 enemies/3 projectiles, no NaN, errors() empty -> real click Retry: light 20, salvage 150, towers 0, enemies 0, timeScale 1, daylight 0.
- Weak layout (3 posts) lost at t=152 on wave 4 as expected.
- Pause menu (B-013): Esc opens, Resume button works, time frozen. Speed button 1x. Viewports 400x700 and 500x350 keep tower bar and Next wave apart (no overlap).
- Stress: 200 random clicks/keys at 4x speed built 15 towers, kept playing, no errors.

## What it's like to play now
I click Play and get dropped in with a lighthouse, a beach with pulsing rings and four towers at the bottom, but nothing tells me what to do; I only found the build menu by clicking a hex. Once waves come, the new Broodmother lumbering in and bursting into four little crabs, and the gull cutting straight over the island that only harpoons can answer, make waves 4-6 more varied than before. The sunset-to-night arc is still the best thing. But the dusk start is purple, the night has no sky, nothing visibly reacts when a Broodmother dies, and I still win with a pile of unspent salvage.

## Top 3 priorities for the next round
1. Fix B-046 (visible sky/stars or remove claims) and B-047 golden hour, so they stop bouncing.
2. B-017 tutorial and B-016 chart plus Saltmarsh: a first-time player and a second level are the biggest gaps.
3. Combat juice (B-028): health bars on damaged enemies, a visible Broodmother burst, so the new enemies feel as good as they play.

## Suggestions for the planner
- Make level 1 harder so lanterns, cannons and upgrades matter; unspent salvage means the economy has no tension.
- Give gulls a visible hit-flash and bolts that track their height.
- Add an enemy-intro card for Broodmother/Gull (B-023) soon; the gull's rule is only learnable by losing Light.
- Show daylight label (Dusk/Night) next to the wave chip.

## Screenshots
- round-11/01-menu.jpg — fresh title; 02-start.jpg — level 1 seed 1 at start (mauve, not golden)
- round-11/03-busy.jpg — wave 5 night, 6 towers, mistwalker; 04-end.jpg — victory panel at night
- round-11/brood-gull.jpg, gull-zoom.jpg, gull-bolt.jpg, brood-burst1-5.jpg — B-015 evidence
- round-11/night.jpg, night-close.jpg, night-closest.jpg, night-pan.jpg — sky search at night
- round-11/pause-menu.jpg, vp-400x700.jpg, vp-500x350.jpg, mist-cloaked.jpg, fp-*.jpg — B-047 and first-time flow
