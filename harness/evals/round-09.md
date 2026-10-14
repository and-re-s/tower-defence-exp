# Round 09 evaluation
Commit 944b19d · Spend $9.21 · PASS — the Lantern/Mistwalker pair adds the first stealth-and-light decision and the wave preview works; still one level, no tutorial, no pause menu.

Cloud VM (software WebGL): FPS is information only. Sounds checked through `audioLog()`.

## Scores
| Criterion | Score | Change | Why | What would earn +1 |
|---|---|---|---|---|
| Playability | 6 | 0 | Real-click flow Play -> hex click -> Lantern -> wave works, 0 console errors, key/click spam plus resizes left state sane, 8x natural win and 16x natural loss with Retry clean. A new player still gets no hint where to click or why the first hex click on the path fails; no pause menu; narrow portrait windows break the layout. | Tutorial (B-017), pause menu (B-013), B-045. |
| Depth | 6 | +1 | +1: the Lantern gives a new decision (light placement gates what can be shot; mark amplifies harpoons/shells) and the Mistwalker forces it (harpoons ignore it outside light). Tradeoff: with one lantern the level is now very easy (9 towers incl. T3 lantern: 20/20 Light, 155 kills). One level only. | More levels (B-016) and enemy behaviours (B-015). |
| Style | 6 | 0 | The warm light pool on tile tops, amber rings on lit enemies and the glowing jellyfish fit the dusk palette (first-build.jpg, lantern-t3.jpg). Cloaked Mistwalker is almost invisible, preview-chip icons are dark on dark, small viewports look washed out, still no sky or soft beam. | Sky/dusk (B-014), readable chip icons. |
| Feel | 6 | 0 | New: "+N" bonus float under Salvage, spawn beach rings pulse, embers on lit enemies, lantern tier collars. Still no recoil, hit flash, build drop juice that I could see beyond the old set. | Juice passes (B-027/B-028). |

## Items in review
- B-044 — verified. (1) `#next-wave` vs `#tower-bar` rects: no overlap at 1280x720, 1024x600, 800x500 (410 vs 416), 640x420 (362 vs 368), 560x400, 1920x1080. (2) 640x420: clicking a hex gives a compact 4-icon row beside the hex (menu rect 340-609 x 215-257), hex and lighthouse visible (menu-640.jpg). (3) Tide Bell preview ring is teal, harpoon and lantern rings amber (ring-compare.jpg).
- B-011 — verified. (1) Mistwalker `cloaked: true`; two harpoons in range, `targetId` stayed 0/0 for 10 game s outside light; with lanterns `revealed/lit/marked` true and harpoons target it. (2) Lone lantern vs Shellback: hp 118,116,...,80 = 4 dps with no other tower; harpoon hit on a marked Mistwalker did 13.8 = 12 x 1.15. (3) Light pool visible on tile tops in first-build.jpg/lantern-t3.jpg; cloaked vs revealed differ (cloak-vs-revealed.jpg) though the cloaked one is nearly invisible (see bugs). (4) Bar shows 4 towers, keys 1-4; hovering a hex and pressing 4 built a lantern. Selling the lantern re-cloaked the Mistwalker (revealed false, burn stopped). Upgrade gives burn 4/6/8, panel shows Burn/Marked/Light radius.
- B-012 — verified. (1) `nextWave` for wave 5 = 14 scuttler, 2 shellback, 2 mistwalker, 18 skitterer; `skipToWave(5)` spawned exactly those (ids counted by type). `#preview-chip` shows icons+counts in breather. (2) `callNextWave()` at 19 s left -> +29, at 13.67 s left -> +21; `.float-bonus` "+27" under the Salvage chip (float-bonus.jpg); a second call during the wave returns -1; audio `wave_called`. (3) Spawn beach ring and column pulse over 80 ticks (pulse-sheet.jpg), rings greenish-white more than amber, but visible.

## Bugs
No blocker or major.
### [minor] Narrow/small viewports break the camera and look washed out (B-045)
Repro: viewport 400x700, `start({level:1,seed:1})`. Expected: island visible. Actual: island is not visible, only the lighthouse dot; the tower bar spans -41..441 px. At 500x350 and 640x420 the island is rendered much darker than at 1280x720. Evidence: portrait-400.jpg, vp-500.jpg, menu-640.jpg.
### [minor] Cloaked Mistwalker is nearly invisible
Outside light it is a faint ring on the ground you can barely see at the default camera (cloak-vs-revealed.jpg left). The player cannot tell why nothing shoots, or that something is coming. Spec says "faint shimmer", this is fainter than that.
### [polish]
- Preview chip enemy icons are dark navy on a dark panel (02-start.jpg); at a glance only the number reads.
- Level 1 is now too easy with a lantern: 9 towers with auto upgrades win 20/20 (267 s at 8x); retune.
- The spawn pulse reads pale green, not the amber described.
- No tutorial: the first click on a path hex still only draws a coral outline without a word.
- Tower panel covers the lighthouse; no speed/pause control yet.

## Regressions
Core loop: Play (real click) -> build via menu/hotkey -> natural 8x win (267 s, 20/20, no NaN, max 7 enemies, 3 projectiles at 0.5 s samples) -> natural 16x loss with no towers on wave 2 -> Retry via real click resets to 150 salvage, 0 towers, 0 enemies, wave 0, timeScale 1. Build rules (`path`, `lighthouse`, `invalid`, NaN, `occupied`), `skipToWave(0/7/-1)` false, `callNextWave` twice, `upgrade(999)` invalid: all sane. Tower panel opens by click, sell refund 42 for a lantern (70% of 60). `errors()` empty throughout. Determinism not due (round 10).

## What it's like to play now
Placing a lantern next to the path feels good: the sand around it glows, crabs inside get amber rings and embers, and Mistwalkers pop into view as glowing jellyfish exactly when they enter the light. The wave preview chip and the "+27" call bonus give me a reason to call waves early. But a first-time player is still dropped on the island with no guidance, the Mistwalker is invisible until lit, and one lantern plus a few posts makes the six-wave level trivial. It is a pleasant slice, not yet a game with progression.

## Top 3 priorities for the next round
1. First-time guidance (B-017) and pause/speed/hotkeys (B-013).
2. More content: island chart and level 2 (B-016), dusk-to-night (B-014).
3. Retune level 1 for the lantern, fix B-045.

## Suggestions for the planner
- Make the Mistwalker's cloaked state visible as a ripple/wake so the lantern feels like a solution to a seen problem.
- Show lit-radius on the hover ring when the lantern is armed (currently same ring as the others).
- Give the preview chip icons a lighter backing so each enemy type is recognisable.

## Screenshots
- round-09/01-menu.jpg — fresh title; 02-start.jpg — level 1 seed 1 at start (paused, preview chip visible)
- round-09/03-busy.jpg — wave 5 with lantern, harpoon, bell (a stray "+27" is an artefact of my paused CSS animation); 04-end.jpg — victory panel
- round-09/first-time.jpg, first-build.jpg — first-time flow, lantern pool and lit crabs
- round-09/cloak-vs-revealed.jpg, cloak-lit.jpg — cloaked vs revealed Mistwalker
- round-09/pulse-sheet.jpg — spawn beach pulse, 4 frames; float-bonus.jpg — "+27" float
- round-09/ring-compare.jpg — bell/harpoon/lantern range previews; menu-640.jpg, vp-*.jpg, portrait-400.jpg — small viewports
- round-09/lantern-panel.jpg, lantern-t3.jpg — tower panel and tier 3 lantern
