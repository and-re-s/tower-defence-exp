# Round 06 evaluation
Commit 19fabd5 · Spend $5.33 · PASS — tower selection, upgrades, sell and targeting work and fix tower clicking; B-009 fails only on a rounding error in the sell refund.

Cloud VM (software WebGL): FPS is information only (about 4 fps). Sounds checked through `audioLog()`.

## Scores
| Criterion | Score | Change | Why | What would earn +1 |
|---|---|---|---|---|
| Playability | 6 | 0 | Menu -> Play -> build -> select -> upgrade -> win/lose -> Retry works; 0 console errors, 500 random keys/pointer events and 10x spammed Upgrade/5x Sell clicks left state sane. But a first-time player still gets no hint that hexes are clickable, the path is not marked, no pause menu. | Tutorial (B-017), pause menu (B-013). |
| Depth | 4 | +1 | +1: upgrades (tier 3 max, costs 60/90 and 80/120) and targeting modes are a real salvage sink and a new decision. But 6 towers at tier 2 beat level 1 with 20/20 Light (bot, 8x, 216 s), so the choice is still solved; no counters yet. | Counter enemies (B-010), retune level 1 so upgrades are needed to win, not to win flawlessly. |
| Style | 6 | 0 | Tier 2/3 towers read well (gold collars, hoop, bigger barrel; 03-busy.jpg). Tier 1 harpoon is still tiny and tier differences are hard to see at the default camera; no sky, hard beam wedge. | Sky/horizon, bolder harpoon silhouette, closer zoom. |
| Feel | 6 | 0 | Cannon blast is now a readable white flash plus amber ring (boom-0/10/24.jpg), `upgrade`/`sell` sounds in `audioLog()`, panel responds instantly. Upgrade sparkle is faint, no build drop-in, no hit flash or recoil. | Build/upgrade/sell juice (B-027), combat juice (B-028). |

## Items in review
- B-041 — verified. (1) cannon on (0,-1), click (640,300): `#tower-panel` opens for the cannon, `towers` still only the cannon, no build menu (click-body.jpg); clicking its base hex (640,313) also selects it. (2) hovering/clicking an occupied hex: `#build-menu` display none, panel opens on click. (3) tower bar: cannon armed, `start()` -> harpoon slot `armed`, cannon not. (4) blast: boom-0.jpg right after `cannon_boom` shows a white flash and a big amber ring; boom-10.jpg (10 ticks) ring still large with debris; boom-24.jpg (0.4 s) gone.
- B-009 — failed. "Done when" line 2: refund is not 70%: cannon (90 spent) sells for 62 instead of 63, a tier-2 cannon (170) for 118 instead of 119 (`state().towers[].sellValue`, `sell()` refund, UI "Sell for 62"). Harpoon 35/140 and tier-3 cannon 203 are right. Repro: `start({level:1,seed:1}); grantSalvage(500); sell(build('cannon',0,-1).id)` -> `{refund:62}`. Other lines verified: (1) `upgrade` raises tier 1->3 (cannon damage 24/36/52.8, rate 0.5/0.55/0.625, harpoon 12/.../25.2, rate up to 1.5), costs salvage (580 after the first cannon upgrade), `upgrade` at tier 3 -> `{reason:'max'}`, panel shows "Fully upgraded"; model grows with gold collars/hoop/mast (03-busy.jpg, tiers-crop.jpg). (3) `setTargeting(id,'strongest')` and the panel button: over 73 samples at wave 5 the target was never beaten in hp by an enemy at the same or smaller distance (35 samples had differing hp), `targeting` shows "strongest", the button stays highlighted on re-select. (4) panel sits beside the tower and never covers it (panel-first/right.jpg), stays inside the viewport at 640x420 for all towers; island pan is clamped so edges cannot be reached. Esc and right click close it; clicking another tower switches; selling frees the hex (`tiles[].tower` 0, rebuild ok) and closes the panel.

## Bugs
No blocker or major. B-009 returns to todo for the refund; minors bundled as B-042.

### [minor] Sell refund is 1 salvage short on cannons (see B-009)
Evidence above; cause is `Math.floor(spent * 0.7)` (90*0.7 = 62.999...).

### [minor] Hovering a tower base shows the buildable amber outline
hover-occupied.jpg: the amber hex outline appears over an occupied hex, so amber no longer means "buildable". No menu opens, so it is only a signal clash.

### [minor] Zoom range is tiny
Wheel zoom goes only 1 -> 0.76 (`state().camera.zoom`); towers stay small, so tier changes and the harpoon are hard to read. `yawDeg` can read 360 instead of 0.

### [polish] Upgrade sparkle is a few faint dots (upgrade-flipbook.jpg); the tower only grows a little. Tier 1 harpoon post is tiny and a selected tower's hex outline sits below the model, which reads as "the hex in front". Selection panel often covers the lighthouse and beam. Stale panel after an API `sell()` of the selected tower (test-only, not reachable by players).
### [polish] Level 1 is still trivial: a greedy bot with 6 towers (2 cannons, 4 harpoons, upgraded to tier 2) wins at 20/20 Light with 87 salvage left, so upgrades make a perfect run easy.

## Regressions
Core loop pass: natural win at 8x (216 s, 150 kills, Light 20), natural loss at 16x with no towers (wave 2, 16 enemies max), Retry resets timeScale to 1, towers and panel; Menu returns to title. `errors()` empty, no NaN, enemies/projectiles bounded (16/3). Re-tested done items: B-003 build/refuse rules (cannon on rock, occupied sell/rebuild, invalid ids), B-006 `skipToWave(3)`, `skipToWave(0/7)` false, B-007 `state().audio.running` true, M mute persisted (`tidewatch.muted`), `upgrade`/`sell` sound ids. Determinism not due this round.

## What it's like to play now
I click a hex, pick a tower, and now I can click my tower to see a neat panel with stats, tier pips, a targeting switch, Upgrade and Sell. The upgrade makes the post or cannon visibly sturdier with gold trim, and finally gives my leftover salvage something to do. Clicking a tower body no longer builds something behind it, which was the most irritating thing last round. The blast is now readable, with a white flash and a ring. But I still have no idea what to do on first launch, and by wave 6 with six upgraded towers I had lost nothing, so nothing is at stake.

## Top 3 priorities for the next round
1. Fix B-009 refund (one line) and B-042; then B-010 Tide Bell and Shellback so tower choice matters.
2. Retune level 1: upgrades should be needed to win without leaks, not make it flawless.
3. First-time guidance (B-017) and pause menu/speed (B-013).

## Suggestions for the planner
- Show a small "upgrade available" amber pip over towers when salvage covers the next tier.
- Keyboard shortcut for Upgrade (U) and Sell, and show refund as +N floating at the tile.
- Let the panel avoid the lighthouse/beam area when it can.

## Screenshots
- round-06/01-menu.jpg — fresh title
- round-06/02-start.jpg — level 1 seed 1, paused, fresh
- round-06/03-busy.jpg — wave 5, 6 upgraded towers, crabs and blast
- round-06/04-end.jpg — victory panel (20/20 Light)
- round-06/first-time.jpg, built.jpg, panel-first.jpg — first-time play with real clicks
- round-06/click-body.jpg, cannon-t2.jpg, c-t2-crop.jpg, c-t3-crop.jpg, tiers-zoom.jpg, tiers-crop.jpg — selection and tiers
- round-06/panel-right.jpg, select-harpoon.jpg, panel-edge.jpg — panel placement
- round-06/boom-0.jpg, boom-10.jpg, boom-24.jpg — blast flip-book; upgrade-flipbook.jpg; hover-occupied.jpg; panel-over-defeat.jpg; after-retry.jpg
