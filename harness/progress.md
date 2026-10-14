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

## Round 03
Items: B-038 -> review, B-005 -> review, B-006 -> review
Changes: level 1 hp scale x1.25: 3 or 6 posts built once lose, 8 posts win but leak; a greedy rebuilding bot still wins at 20 Light. Range ring is a thin amber ring with a faint additive warm fill (no darkening). Keys 1/Space/Esc work while paused. Wave label uses Fredoka (no slashed zero). Test API: `skipToWave`, `win`, `lose`.
Decisions: B-005 was mostly built in rounds 1-2 (title with Play, HUD chips, end screens with Menu); I only fixed the font and checked it. Salvage still piles up because there is one tower; the real fix is B-008/B-009.
Known issues: salvage sink missing until more towers; a 6-post fixed layout loses outright (not just a few Light).
Tried and reverted: hp x1.15/1.2 left 8 posts with zero leaks.
How to test: `start({level:1,seed:1}); pause();` click a hex, press 1 -> tower built. `skipToWave(4)`, `win()`, `lose()`; npm test has layout tuning and determinism tests.

## Round 04
Items: B-039 → review, B-007 → review (B-008 left for next round to keep the round at ~3 points of risk)
Changes: title block moved to the left, lamp and beam clear; victory "/ 20" in Fredoka; "Next wave" stays visible but disabled while paused; skipToWave returns false outside 1..waveCount; level 1 waves 4-6 softened (5 posts lose, 6 win with 7 Light, 7 win with 20). Sound pass: kalimba plucks for UI, woody refuse thunk, thwip-thunk harpoon, wet clicks and splash-pops with deterministic pitch variation, sand hiss on build, foghorn, two-strike ship's bell, richer victory/defeat, compressor on the master bus, second surf layer, faint gulls.
Decisions: most B-007 ids already existed from round 2; this round was the quality pass plus ambience layers. `state().audio` = {muted, running} lets the evaluator verify the context started after a gesture. Gull cries use a fixed LCG (no Math.random).
Known issues: sounds cannot be listened to in the cloud, only logged; cannon/bell/upgrade/sell sounds wait for their items; music and separate volumes are B-030/B-031.
Tried and reverted: nothing.
How to test: `start({level:1,seed:1})`, click a button then read `state().audio.running` (true) and `audioLog()` ids (ui_click, build, harpoon_fire, enemy_hit, enemy_death, wave_start, wave_clear, lighthouse_hit, victory, defeat via win()/lose()); press M, `state().muted`, reload keeps it. Pause, `#next-wave` is disabled. `skipToWave(0)`/`(7)` return false. npm test has the new tuning test.

## Round 05
Items: B-040 -> review, B-008 -> review (B-009 left for next round)
Changes: second tower, Cliff Cannon (90): squat slate barrel on a basalt base, lobs an arcing shell with a smoke trail, muzzle puff, explosion burst in a 1.2-hex blast, own fire/boom sounds. Min range 1.5 hexes, +1 range on rock (4 / 5). Bottom tower bar with icons, costs, hotkeys 1-2; the build menu lists both towers; Next wave button moved above the bar. B-040: Space ignored while paused, timeScale resets to 1 on start.
Decisions: shells are aimed at the enemy's predicted path position (not homing) so a cluster gets hit; shells are not counted as "incoming" damage so harpoons keep firing. Cannon stats: 24 dmg, 0.5/s, shell speed 7. The bar click only arms the type (range-ring preview); building still needs a hex.
Known issues: level 1 tuning untouched (cannons make it easier; the bot tests only use harpoons); no cannon-specific balance test; salvage sink improves but upgrades (B-009) still missing.
Tried and reverted: nothing.
How to test: `start({level:1,seed:1}); pause(); grantSalvage(500); build('cannon', q, r)` (rock tile = range 5 in `state().towers`), `callNextWave()`, `step(n)` until `projectiles` has kind `shell`; `audioLog()` shows `cannon_fire`, `cannon_boom`. Click a hex then press 2 or click the cannon option. npm test has cluster/min-range/rock-range tests.

## Round 06
Items: B-041 -> review, B-009 -> review (committed together: the picking and selection code is interleaved)
Changes: clicking a tower (body or hex) selects it: range ring plus a panel beside it with Damage/Rate/Range, tier pips, targeting First/Strongest/Closest, Upgrade (2 tiers, gold collars/hoop then mast+orb or spikes, tower grows, amber sparkle, rising chime) and Sell for 70% (chips + sound). Occupied hexes no longer open "Build here". Armed type resets to Harpoon on start. Cannon blast now has a flash dome, expanding ring (0.45 s), more fire/smoke/debris.
Decisions: upgrade costs harpoon 60/90, cannon 80/120 (salvage sink); tiers raise damage and rate, not range. Tower pick = screen-space distance to the tower's base-top segment (34 px), checked before the ground raycast. Sell removes the tower instantly (sink animation is B-027).
Known issues: panel overlaps the beam wedge visually; no keyboard shortcuts for upgrade; level 1 not retuned for upgrades (bot tests unchanged, still pass).
Tried and reverted: nothing.
How to test: `start({level:1,seed:1}); pause(); grantSalvage(500); build('cannon',0,-1)`, click `toScreen(0,2.2,-1.732)` -> `#tower-panel` opens; `upgrade(1)`, `setTargeting(1,'strongest')`, `sell(1)` (`state().towers` has tier/damage/sellValue). npm test has 4 new tests.
