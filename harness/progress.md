# Progress

## Round 01
Items: B-001 → review, B-002 → review (project setup done too; a minimal title screen and Light chip exist because the screens need them)
Changes: Driftwood Cove renders as a hex island (sand, grass, rock at 3 heights, shallows ring, props, footprints) in a dark sea, lit by a low warm west sun with soft shadows; lighthouse with emissive lamp, halo and rotating beam. Q/E rotate 60° eased, wheel zooms, WASD pans. Scuttler crabs (dark shell, Brine Glow spots, animated legs) emerge from the surf and crawl the path; leaks cost Light, flicker the lamp, pulse the screen edges and play a cracked-bell sound. At 0 Light a defeat panel with Retry/Menu shows.
Decisions: sim is pure (src/sim) with a fixed 1/60 tick and an event queue; the waves system (breather -> wave -> done, 6 waves of scuttlers 5..15) already exists so B-004 only has to add Skitterers, the button and bonuses. Camera easing uses real dt so it works paused. `anim` clock drives all visuals (beam, legs) and freezes on pause. Sound ids are logged even if the AudioContext is not running (muted/headless) so audioLog is testable.
Known issues: no sky/stars yet (B-014); sea is a flat shaded plane (B-032); no bloom; enemy death on leak is a shrink tween only; no right-drag rotate or middle-drag pan; smoke runs at ~8 fps in software GL.
Tried and reverted: nothing.
How to test: `?test=1`, `__game.start({level:1,seed:1})`, `setTimeScale(8)`, read `state().enemies` / `light`; no towers -> `screen:'lost'` around game time 100 s, click `#retry`. Press Q/E and the wheel to check the camera; `audioLog()` shows `lighthouse_hit`. See harness/test-api.md.
