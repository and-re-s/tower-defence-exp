# Round 07 evaluation
Commit 75c22ff · Spend $6.78 · PASS — Tide Bell and Shellback work as counters and the B-009 refund and B-042 bundle are fixed. B-010 fails only on a barely visible armor spark.

Cloud VM (software WebGL, about 5 fps): FPS is information only. Sounds checked through `audioLog()`.

## Scores
| Criterion | Score | Change | Why | What would earn +1 |
|---|---|---|---|---|
| Playability | 6 | 0 | Menu -> Play -> build (menu now lists the bell) -> select -> upgrade -> win -> Retry works. 0 console errors, 400 random keys/pointer/wheel events left state sane, natural win at 8x (258 s, Light 20/20, 150 kills, no NaN, max 9 enemies). But a first-time player still gets no hint that hexes are clickable or where the path is; no pause menu; layout breaks at 640x420. | Tutorial (B-017), pause menu (B-013), small-viewport fix. |
| Depth | 5 | +1 | +1: the Tide Bell and the Shellback create a real choice (harpoons do 6 vs 12 on a Shellback, cannons keep 24, a bell sets up the cannon). But level 1 is still flawless: 6 towers incl. 2 bells won with 20/20 Light and 138 salvage left, so nothing is at stake. | Retune level 1 so counters are needed; Lantern/Mistwalker (B-011). |
| Style | 6 | 0 | Bell arch with a bronze bell and the hermit-crab Shellback fit the dusk diorama (zoom-bell.jpg, 03-busy.jpg). Still no sky, hard beam wedge; the Shellback's cyan shell rings look like the slow effect. | Sky/horizon (B-014), distinct slow ring colour. |
| Feel | 6 | 0 | Bell ring is a clear expanding ring plus swing (bell-18.jpg); upgrade burst is now a readable gold ring (upgrade-crop4.jpg); zoom now reaches 0. But armored hits have no discernible spark, no build drop-in, no hit flash or recoil. | Armor spark, build/combat juice (B-027, B-028). |

## Items in review
- B-009 — verified. Sell values (UI/`state().towers[].sellValue`, `sell()` refund): cannon 63 / 119 / 203 (spent 90/170/290), harpoon 35 / 77 / 140, bell 49 / 84 / 143. No more 62/118.
- B-042 — verified. (1) hovering the harpoon's hex shows a pale grey outline, not amber (hover-occupied2.jpg); an empty sand hex still shows amber (hover-buildable.jpg). (2) wheel zoom now spans `camera.zoom` 1 -> 0 (0.8, 0.6, 0.4 ... per notch), towers readable (armor-close.jpg). (3) pressing E 6x then Q 7x gave yawDeg 60,120,180,240,300,0 and 300,240...,0,300: always 0..359. (4) upgrading two towers gives a gold spiky ring burst readable at the default camera (upgrade-crop.jpg, upgrade-crop4.jpg).
- B-010 — failed. Line 3: bell ring visible (bell-0/18.jpg) and `bell_ring` + `armor_hit` both in `audioLog()`, but no armor spark is distinguishable at the tick of a hit (armor-spark-nobell.jpg, armor-crop.jpg, armor-close.jpg). Verified: line 1 (bell at (-3,3), scuttler progress rate 0.030/s slowed vs 0.050/s free, `speedFactor` 0.6, `slowed` flips false after leaving range); line 2 (harpoon deltas on Scuttler 12, on Shellback 6 (14 samples); cannon 24 on Shellback, same as on Scuttler); line 4 (bar shows Harpoon/Cannon/Bell with 1/2/3; menu lists all three; key 3 and click build the bell for 70; clicking the bell opens a panel with Slow/Pulse/Range, Upgrade 50, Sell 49, no targeting).

## Bugs
No blocker or major.

### [minor] Hover/selection outline sits one hex in front of a tower
Repro: build harpoon (0,-1), hover it. Expected: outline frames the tower's hex. Actual: pale outline drawn at ground height, about 47 px below the tower (hover-occupied2.jpg). Filed in B-043.
### [minor] Layout breaks at 640x420
Build menu covers the HUD chips and the island is cropped (small-viewport.jpg). In B-043.
### [minor] Slowed and unslowed Shellbacks look alike
Shellback shell bands are cyan-white like the slow ring; with no bell in range one still shows rings (armor-spark-nobell.jpg). In B-043.
### [polish] Armored spark is tiny (see B-010). Bell range preview uses the amber build ring, so it reads as "buildable". Bell ring is cream-white rather than teal at the moment it is widest (bell-18.jpg). Still no marker for the enemy path or hint that hexes are clickable (first-time.jpg: my first click landed on a path hex and got only a coral outline).

## Regressions
Core loop pass (menu -> Play -> win at 8x -> Retry via real click: timeScale reset to 1, towers 0, salvage 150). Natural loss at 40-53 s with 2-3 towers on wave 6 shows `defeat`. `skipToWave`, `build` reasons (path, terrain, lighthouse, invalid) correct for the bell. Re-tested done items: B-003 build rules, B-006 `skipToWave`, B-041 select vs build (clicking a tower body opens its panel, no build menu), Esc closes panel. `errors()` empty throughout; GL ReadPixels warnings only. Determinism not due (round 10).

## What it's like to play now
I can finally react to what the enemies are: the tall black-shelled hermit crabs shrug off my harpoons, so I put cannons on the rocks and a bell by the beach to slow the pack, and the bell's swing and expanding ring make that feel like a real tool. Zooming in is now useful: towers and tiers can be read up close. Upgrade bursts are visible. But the level is still a walkover (20/20 Light with two bells and four other towers), my first click still lands on the path with no explanation, and hits on armor give me no extra satisfaction, only a quieter sound I cannot see.

## Top 3 priorities for the next round
1. Make the armor spark readable (B-010) and fix B-043.
2. Retune level 1 / waves so counters and upgrades matter, then Lantern and Mistwalker (B-011).
3. First-time guidance (B-017) and a pause menu with speed controls (B-013).

## Suggestions for the planner
- Show a "Shellback incoming" icon at the beach so counter-choices are informed (B-012).
- Mark the enemy path with faint footprints/arrows during the first breather.
- Teal ring only on slowed enemies, and a different tint for the bell's range preview.

## Screenshots
- round-07/01-menu.jpg — fresh title
- round-07/02-start.jpg — level 1 seed 1 right after start (a stale hover ring from my mouse is visible)
- round-07/03-busy.jpg — wave 5, bells, cannons, harpoons, two Shellbacks under slow rings
- round-07/04-end.jpg — victory panel (20/20 Light)
- round-07/first-time.jpg, click1.jpg — first-time play with real clicks
- round-07/zoom-bell.jpg, bell-0.jpg, bell-18.jpg — bell arch and ring flip-book
- round-07/shellback-armor.jpg, armor-close.jpg, armor-crop.jpg, armor-spark*.jpg — armor spark attempts
- round-07/hover-occupied2.jpg, hover-buildable.jpg, upgrade-crop.jpg, upgrade-crop4.jpg — B-042 evidence
- round-07/small-viewport.jpg — 640x420 layout
