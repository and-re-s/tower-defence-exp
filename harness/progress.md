# Progress

## Round 01
Items: B-001 → review, B-002 → review (project setup done too; a minimal title screen and Light chip exist because the screens need them)
Changes: Driftwood Cove renders as a hex island (sand, grass, rock at 3 heights, shallows ring, props, footprints) in a dark sea, lit by a low warm west sun with soft shadows; lighthouse with emissive lamp, halo and rotating beam. Q/E rotate 60° eased, wheel zooms, WASD pans. Scuttler crabs (dark shell, Brine Glow spots, animated legs) emerge from the surf and crawl the path; leaks cost Light, flicker the lamp, pulse the screen edges and play a cracked-bell sound. At 0 Light a defeat panel with Retry/Menu shows.
Decisions: sim is pure (src/sim) with a fixed 1/60 tick and an event queue; the waves system (breather -> wave -> done, 6 waves of scuttlers 5..15) already exists so B-004 only has to add Skitterers, the button and bonuses. Camera easing uses real dt so it works paused. `anim` clock drives all visuals (beam, legs) and freezes on pause. Sound ids are logged even if the AudioContext is not running (muted/headless) so audioLog is testable.
Known issues: no sky/stars yet (B-014); sea is a flat shaded plane (B-032); no bloom; enemy death on leak is a shrink tween only; no right-drag rotate or middle-drag pan; smoke runs at ~8 fps in software GL.
Tried and reverted: nothing.
How to test: `?test=1`, `__game.start({level:1,seed:1})`, `setTimeScale(8)`, read `state().enemies` / `light`; no towers -> `screen:'lost'` around game time 100 s, click `#retry`. Press Q/E and the wheel to check the camera; `audioLog()` shows `lighthouse_hit`. See harness/test-api.md.

## Round 02
Items: B-037 → review, B-003 → review, B-004 → review
Changes: players can click a hex (amber/coral outline, range ring larger on rock), pick Harpoon Post (50) in a small menu, and watch the post turn and fire harpoons at crabs; kills pay salvage and the HUD shows Salvage and Wave N / 6. Six waves of Scuttlers and fast Skitterer shrimp (hp scales per wave), "Next wave +N" button/Space, wave-clear bonus, victory screen. B-037: camera/audioLog reset on start, enemies at full size after step(), closer zoom limit raised, legible subtitle pill, favicon, PCFShadowMap warning removed.
Decisions: harpoon stats from spec (12 dmg, 1.2/s, 3.5 hexes) but waves are large with hp scaling; a greedy bot test shows 3 posts lose, 5 barely win, 8+ win. Building also works while paused (needed for flip-book tests). Test API got `build`, `grantSalvage`, `callNextWave` and `tiles`/`towers`/`projectiles` in state (B-006 still has skipToWave/win/lose). Sounds for build/refuse/fire/hit/death added early (simple synth). Early-call bonus = 1.5 x seconds left.
Known issues: tower build menu offers only one tower; clicking a tower does nothing yet (B-009); no tutorial; beam still hard-edged; a coral hover outline persists under the mouse on path hexes (intended). Items committed together in one commit for B-003/B-004 because the code is interleaved.
Tried and reverted: spec-sized waves (5..15 crabs) were won by 3 posts without a leak.
How to test: `?test=1`, `start({level:1,seed:1})`, `build('harpoon',1,-1)` (rock) -> salvage 100, `state().towers`; `callNextWave()`, `setTimeScale(8)`, watch `projectiles`, `kills`; hover/click via `toScreen`; losing the lamp or clearing wave 6 shows end screens; `npm test` has a bot that wins level 1.
