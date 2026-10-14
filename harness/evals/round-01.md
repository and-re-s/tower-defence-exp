# Round 01 evaluation
Commit 3a05a34 · Spend $0.39 · FAIL — the island and the threat half of the loop work and look promising, but the player has no way to act: every run is lost on wave 3 (Playability 4 < 5).

Cloud VM (software WebGL), fps 5-6: FPS is information only.

## Scores
| Criterion | Score | Change | Why | What would earn +1 |
|---|---|---|---|---|
| Playability | 4 | new | Menu -> Play -> crabs march -> lamp loses Light -> defeat -> Retry/Menu all work with 0 errors, but there is nothing to do: no build, no wave control, always lost on wave 3 (t≈102 s). | Build towers (B-003) so a run can be won; waves/victory (B-004). |
| Depth | 1 | new | No decisions at all. | Towers with cost and terrain rules (B-003, B-008). |
| Style | 5 | new | Cohesive palette (sand/grass/rock/teal shallows on Deep Sea), flat-shaded faceted tiles with height steps, props, warm west sun with long shadow of the lighthouse falling on the sea, banded lighthouse with amber lamp and sweeping beam, Fredoka title. Held back by: flat dark sea, no sky or fog gradient, crabs are tiny dark spider-like shapes on a dark path with a pale sticker-like disc under them and white (not Brine Glow teal) eyes, beam is a hard-edged flat wedge. | Sky/horizon gradient, readable enemy silhouettes with teal glow, softer beam. |
| Feel | 3 | new | Leaks give a lamp flicker, a red edge pulse (opacity 1 -> 0 over ~0.6 s, measured), a bell sound id and the Light chip; camera rotation is eased (x 271 -> 300 -> 312 -> 315 -> 316). Nothing the player does gets a response (no tower actions exist), no hit/death feedback for enemies, buttons only have hover/click ids. | Player-action feedback once building exists; enemy death/hit effects. |

## Items in review
- B-001 — verified. Evidence: 02-start.jpg shows the whole island at 1280x720 default zoom; `state().terrainCounts` {sand 48, grass 13, rock 11, path 19, shallows 36}, `heights` [0.05,0.25,0.5,0.75,1,1.25]; path of 20 hexes from (-5,3) to lighthouse (2,-2) checked hex by hex as a continuous adjacent chain, `lighthouse` {q2,r-2,x3,z-1.732} in state; shadows on tiles and a long lighthouse shadow visible, lamp emissive amber, beam angle differs between screenshots (02-start vs fp-start vs wave-early); Q/E give yaw 60 steps with decaying-exponential ease (~0.5 s); wheel moves zoom 1 -> 0 (zoom-close.jpg); no grey materials seen. Caveats (filed as minor): the close zoom is extreme, path reads as scattered rust-brown tiles rather than an obvious road (acceptable but weak).
- B-002 — verified. Evidence: `state()` exposes `light`, `enemies` {id,type,hp,x,z,progress}; sampled every 0.25 s for 25 s: no NaN, progress never decreases, positions stay within the hex path polyline once on the beach (only the surf run-in before the first hex, progress<0.01, is off-path, up to 1.8 units); each leak does `light` -1 with a `lighthouse_hit` entry in `audioLog()`; with no towers `screen:'lost'` at t=102.567 with `defeat` sound and the defeat panel (04-end.jpg); Retry (clicked) gives Light 20, salvage 150, wave restarting; Menu returns to the title with 0 enemies.

## Bugs
No blocker or major found. All below are minor/polish; bundled as B-037.

### [minor] Camera is not reset on start/retry
Repro: zoom in, pan, rotate; call `__game.start({level:1,seed:1})` or click Retry or Play from the menu. Expected: default view. Actual: `camera` stays at the old yaw/zoom/pan (checked: yaw 120, zoom 0.48, pan -3.44,2.9 after restarts). Evidence: 03-busy.jpg is taken from a leftover pan.

### [minor] audioLog keeps entries from previous runs
Repro: lose, Retry, read `audioLog()`: old `defeat`/`wave_start` entries with times of 102 s sit next to new ones at 6 s. Expected: reset on start.

### [minor] Freshly spawned enemies are tiny after `pause()` + `step(n)`
Repro: `start({level:1,seed:1}); pause(); step(600)`, screenshot: only white eye dots or nothing visible although `state().enemies` has 4-5 entries (wave-early not kept; enemies-mid.jpg). After `step(60)` more they show full size (enemies-mid2.jpg). Spawn visuals seem driven by a clock/tween that step() does not advance. It makes flip-book testing unreliable. Live play at speed shows them fine (03-busy.jpg).

### [minor] Closest zoom is too close
zoom-close.jpg: about 3 hexes across, the beam is a hard-edged yellow slab over a quarter of the screen. Not a "diorama" view.

### [polish] Title subtitle illegible over the island
01-menu.jpg: "Hold the lamp. Keep the dark at bay." is sand text over sand tiles, crossed by the beam. Also the title is not backed by any island orbit yet (B-033).

### [polish] Crabs
Dark bodies on a dark rust path, tiny, spider-like thin legs, white eyes; each sits on a pale translucent disc that reads as a sticker. Spec asks for wide flat crabs with Brine Glow (teal) spots. They are hard to read except by the disc.

### [polish] favicon.ico 404 in console on first load.

## Regressions
First round, nothing to regress. Core loop start -> play -> lose -> Retry and -> Menu -> Play (Enter key and button) works. Spam of keys (Q/E/Esc/Space/P/M/Enter/1/2/B/F) plus 20 canvas clicks: no errors, `errors()` empty. Resize to 800x600 and back: canvas fills the window, HUD stays in the corners. M toggles `muted` and writes `tidewatch.muted` to localStorage. No network requests apart from own assets. Console: only the three.js PCFSoftShadowMap warning (the code asks for a removed shadow type; harmless, easy to clean).

## What it's like to play now
I click Play and land on a pretty little dusk island: warm light, a striped lighthouse, a sweeping beam. Then small black crabs crawl in from the west beach and, one by one, ding my lamp; the edge flashes red and the Light counter drops. I try clicking hexes, pressing keys, everything: nothing responds. After about 100 seconds the light goes out and I get a clean defeat card with Retry and Menu. It looks like the start of something with real charm, but it is a screensaver, not a game yet.

## Top 3 priorities for the next round
1. B-003: building towers with salvage, with HUD salvage and hover outlines (the player must be able to act).
2. B-004: waves with Skitterers, Next wave and a victory screen so the loop can be won.
3. B-037 camera/test API fixes, then enemy readability (teal glow, contrast) alongside B-005 HUD.

## Suggestions for the planner
- Add a horizon/sky and fog gradient and animated sea early; the dark empty void around the island is the biggest Style gap.
- Make the path a clearly lighter packed-sand ribbon with footprints; now it is the darkest tile on the island and competes with rock.
- Replace the pale disc under enemies with a faint teal underglow (Brine Glow, per the spec).
- The first wave is only 4-5 crabs and wave 3 is lost around 100 s; with 20 Light the pacing is fine once towers exist.
- Remove the PCFSoftShadowMap warning (use PCFShadowMap).

## Screenshots
- round-01/01-menu.jpg — fresh storage, title screen over the island
- round-01/02-start.jpg — level 1 seed 1 right after start (camera was default)
- round-01/03-busy.jpg — wave 2, five crabs on the path, paused (camera left over from earlier panning)
- round-01/04-end.jpg — defeat screen
- round-01/zoom-close.jpg, rot-e.jpg, resize-800x600.jpg, enemies-mid.jpg / enemies-mid2.jpg (step render quirk), leak-0.jpg, live-play3.jpg, fp-start.jpg — evidence
