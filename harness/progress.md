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

## Round 07
Items: B-042 -> review, B-009 -> review (refund fix), B-010 -> review
Changes: Tide Bell (70, key 3, bar icon): bronze bell in a timber arch that swings and sends a teal ring every 2 s while enemies are in 2.5 hexes; slowed enemies (60% speed, 2 s) wear a teal ring and drip trail. Shellback (hermit crab with a spiral shell, 120 hp, speed 0.6, leak 2) takes half harpoon damage, full cannon damage; armored hits give white sparks and a low crunch. Sell refunds are exact (63, 119...). Hovering an occupied hex shows a pale cue (not amber); zoom reaches much closer; yawDeg is 0..359; upgrade sparkle is bigger.
Decisions: bell tiers deepen the slow (40/50/60%, upgrades 50/85) since it deals no damage; its panel hides targeting. Shellbacks (1,2,2,3) join level 1 waves 3-6 so they can be seen now (spec puts them on level 2); their hp scales at half the wave rate; tuning tests still pass.
Known issues: bell ring is only tested by screenshot in the smoke path; no Saltmarsh yet so shellback card/tips are B-023; bell range ring preview uses the same amber ring.
Tried and reverted: shellbacks 2..5 per wave with full hp scaling made 6 posts lose.
How to test: `start({level:1,seed:1}); pause(); grantSalvage(500); build('bell',q,r)` next to the path, `skipToWave(3)`, step and read `enemies[].slowed/speedFactor`; `skipToWave(6)` + step 60*24 for shellbacks; `audioLog()` has bell_ring / armor_hit. npm test has 4 new tests.

## Round 08
Items: B-043 -> review, B-010 -> review (fix of the armor spark)
Changes: armor spark is now a bright white-yellow burst (hot core flash plus 9 chips, drawn on top, about 0.2 s, 3-7x larger). Shellback shell stripes are warm ochre instead of cyan, so only the teal ring means slowed. At short/narrow viewports (640x420) the camera backs off and the build menu is clamped between the HUD chips and the bottom bar, with a compact CSS mode under 560 px height.
Decisions: spark particles use depthTest false so they read over the crowd. Camera fit = 1.78/aspect (and x1.15 under 500 px height), applied only as the camera zooms out.
Disputed: hover outline "one hex in front of the tower" — the outline is at tile.height and frames the tower's hex once the build drop-in settles (verified: 90 ticks after build, tower foot at hex centre, outline around it). The evaluator's screenshot was taken during the 1.4-unit drop animation (about 0.45 s after build) and with the tall model. No code change.
Known issues: bell range preview still amber; on 640x420 the open build menu covers part of the island.
Tried and reverted: nothing.
How to test: B-010 repro in backlog (`build('harpoon',-3,2)` x2, `skipToWave(6)`, step until `armor_hit`, step(1..4), screenshot). Small view: viewport 640x420, `start`, click a sand hex. Hover: build harpoon (0,-1), step(90), hover its body.

## Round 09
Items: B-044 -> review, B-011 -> review, B-012 -> review
Changes: Lantern (60, key 4): glass-caged flame on a timber post, warm light pool on the 3-hex disc (instanced hexes at each tile's height), burns 4/6/8 dps and marks enemies +15% damage from all sources; lit enemies get an amber ring and embers. Mistwalker (jellyfish, 60 hp, level 1 waves 5-6) is a faint shimmer until lit, untargetable outside light. Next-wave preview chip with enemy icons and counts, pulsing amber rings/column on the spawn beach, floating "+N" under Salvage when a wave is called. B-044: Next wave button and tower bar share a `#dock` (no overlap at any size), compact icon-row build menu beside the hex under 560 px height, teal range preview for the Tide Bell.
Decisions: mistwalkers were added to level 1 waves 5-6 so the feature is playable now; tuning tests build one lantern in the fixed layouts (5 posts without a lantern still lose; with one, 6 posts win with 3 Light). Burn is not amplified by the mark; overlapping lanterns do not stack (max burn). Cannon blasts hit cloaked enemies (only targeting is blocked). Under 760 px width the tower bar hides names.
Known issues: no sky or dusk yet (B-014); the light pool floats at each tile's height so it is subtle at golden hour; lantern tier 2/3 differ only by gold collars/drops; the cloaked shimmer is faint by design.
Tried and reverted: light pool as one flat disc (floated above or sank under rock tiles), replaced by per-hex instances.
How to test: `start({level:1,seed:1}); pause(); grantSalvage(500); build('harpoon',-3,3); spawnEnemy('mistwalker'); step(300)` -> `enemies[0].revealed` false, tower `targetId` 0; then `build('lantern',-2,3)` and step: revealed true, hp drops, `marked`. Breather: `state().nextWave`, `#preview-chip`, `callNextWave()` shows `.float-bonus`. Viewports 640x420 / 800x500: compare `#next-wave` and `#tower-bar` rects; click a hex for the compact menu. npm test has tests/lantern.test.js.

## Round 10
Items: B-045 -> review, B-013 -> review, B-014 -> review (one combined commit: main.js/screens.js changes are interleaved)
Changes: pause menu (Esc/P/button: Resume, Restart, Quit), speed button (F cycles 1x/2x/3x) next to mute; time of day: the level starts at golden hour and eases through sunset and blue hour to a cold night on the last wave (sun, hemisphere, fog, sea, exposure, sky dome, stars, brighter lamp/beam at night); portrait/small viewports no longer lose the island in fog and look the same as 1280x720; narrow layout (under 640 px) shrinks the tower bar and moves buttons under the chips; cloaked Mistwalkers have ground ripples.
Decisions: fog near/far follow camera distance (root cause of the dark/invisible island at small sizes). Pause menu is only for player pauses so `pause()` screenshots stay clean. Esc closes build menu/panel first, else pauses. Night keeps hemisphere light high (1.7) so path/towers stay readable. Mistwalkers already only appear in waves 5-6 (dusk onward).
Known issues: sky dome and stars are barely visible from the default 50-degree camera (it only sees the sea); speed beyond 3x via test API shows e.g. 8x and F returns to 1x.
Tried and reverted: darker night (sun 0.5, hemi 1.15) made the island unreadable.
How to test: `start({level:1,seed:1})`, press Esc -> `state().pauseMenu`, time frozen; F then `timeScale` 2. `pause(); skipToWave(1)` vs `skipToWave(6); step(600)` and compare screenshots (`timeOfDay` 0 vs 1, `daylight`). Viewports 400x700 and 500x350. `spawnEnemy('mistwalker')` for ripples. npm test has tests/daylight.test.js.

## Round 11
Items: B-046 -> review, B-047 -> review (one commit), B-015 -> review
Changes: sky dome shader compiles (no GL errors). Golden hour is warm (mauve fog, warmer sea); night has more ambient lift so towers read. HUD chips wrap inside narrow viewports; pause menu blocks scene clicks and F; cloaked Mistwalker ripple is violet. Broodmother (slow, 220 hp, bursts into 4 Skitterers) and Gloom Gull (flies straight to the lighthouse at height 3.2 with a ground shadow; only harpoons and lantern light hurt it) join level 1 (Broodmother waves 4 and 6, gulls waves 5-6) so they can be seen now.
Decisions: gull is `flying` in the sim (progress along its own straight line); cannon targeting, blasts and bell pulses skip flying enemies. Gull/brood counts were cut so 6 posts + 1 lantern still win (12 Light left).
Known issues: sky dome is barely visible from the default camera (only a thin band above the sea); bolts shot at gulls are drawn at ground height; no enemy cards (B-023).
Tried and reverted: broodmothers 2 and gulls 3-4 made 6 posts lose.
How to test: `start({level:1,seed:1}); pause(); spawnEnemy('broodmother'); spawnEnemy('gull'); step(300)`; kill the brood with harpoons and count `skitterer`s. npm test has tests/brood.test.js. Console should show no WebGLProgram errors.
