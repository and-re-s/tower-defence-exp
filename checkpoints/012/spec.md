# Tidewatch — spec v1

## North Star

You are the last keeper of a lighthouse on a small hex island at dusk. As the sun sinks, the sea gives up its creatures and they crawl up the shore toward your lamp; you shape the island tile by tile with towers that harpoon, shell, ring and shine, and you watch your little diorama hold out against the dark. Every wave survived feels like keeping a flame alive by hand.

## Design pillars

1. **The island is the board.** Every hex matters: terrain, height and the shape of the path decide what is worth building where. Every decision the player makes is visible on the map, and you can read the state of the battle from a single glance at the island.
2. **Hold the light.** The lighthouse is the heart of the game: its lamp is your life, the night is your clock, and light itself is a weapon. Mechanics that involve light, darkness and visibility come first.
3. **A toy you want to touch.** The island looks and behaves like a handmade diorama. Every click, build, shot, hit and wave answers back with motion and sound; nothing appears, changes or disappears without a reaction.

Every feature must serve at least one pillar. If it serves none, it is cut.

## Core loop

### 30 seconds
Enemies crawl out of the surf along the sand path. The player sees a cluster of armored Shellbacks shrugging off harpoons, clicks an empty rock hex near the bend, drops a Cliff Cannon there (it thumps into place with a dust puff), and watches the first shell burst scatter the cluster. Salvage chips fly from the dead crabs into the counter; the player saves up for the next upgrade.

### One session (one level, 6–12 minutes)
Build phase → wave → short breather → wave, 6–12 waves per level. Between waves the player reads the preview of the next wave (which enemy types, from which spawn), spends salvage on new towers, upgrades and specializations, and can call the next wave early for bonus salvage. The sun sets as waves pass: the level starts at golden hour and ends in full night, when mist creatures appear that only light can reveal. The level ends in a win (all waves cleared with the lamp still lit; 1–3 stars by remaining light) or a loss (the lamp goes out), with a clear end screen and a one-click retry.

### The whole game (about 1–1.5 hours)
A campaign of 5 islands, each introducing one new tower or mechanic and one or two new enemies, ending with the Leviathan boss at The Maw. Stars earned on each island are saved; the island chart (level select) shows progress. After the campaign, the Long Night endless mode tests how long you can keep the lamp burning.

## Visual and audio language

### Mood
A handmade diorama at dusk: chunky low-poly hex tiles with visible height steps, warm low sunlight raking across them, a dark glassy sea around them, and cold bioluminescent creatures crawling toward a warm lamp. The core visual story is **warm light versus cold glow**: everything the player owns is warm (amber, sand, whitewash, wood); everything hostile glows cold (teal-cyan, violet) against dark shells.

### Palette (core 7 + 1 signal color)
| Name | Hex | Use |
|---|---|---|
| Deep Sea | `#13294B` | open water, fog, UI panel base |
| Shallows | `#2E8C94` | shallow water hexes, shoreline, secondary UI |
| Dune Sand | `#E3C27A` | sand tiles, enemy paths (packed, slightly darker), UI text on dark |
| Sea Moss | `#5E8C4E` | grass tiles, vegetation tufts |
| Basalt | `#3E3A4F` | rock tiles and cliffs, tower bases |
| Lamp Amber | `#FFB23E` | the lamp, player highlights, salvage, selected states, tower accents |
| Brine Glow | `#4DF2C9` | enemy bioluminescence only — never on player objects or UI chrome |
| Signal Coral | `#E85A4F` | danger only: light loss, invalid placement, low-lamp warning |

Tints and shades of these are fine; new hues are not. Whitewash (a warm off-white, around `#EDE6D6`) is allowed for tower and lighthouse walls only. Sky: a horizon of apricot (around `#F4A462`) fading up into Deep Sea; at night it becomes Deep Sea with a few stars.

### Lighting and time of day
- One low key light from the west (the sun), warm, with soft shadows; long shadows are part of the look.
- A hemisphere fill: sky side dusky apricot-violet, ground side Deep Sea.
- Fog in Deep Sea tones swallowing the horizon so the island floats in its own pool.
- Over a level the sun sets in steps with each wave: golden hour → sunset → blue hour → night. At night the key light is weak and cold, and the lighthouse lamp, tower lanterns and enemy glow carry the scene. The lighthouse beam sweeps the island all the time and is visible at every time of day.
- Tone mapping and correct color space; emissive materials for lamp and glow; a subtle bloom on emissives only if it stays at 60 FPS.

### Camera
- Perspective camera at about 50° tilt looking at the island, framed so a whole island fits at default zoom at 1280×720.
- Rotate in 60° steps (Q/E or dragging with the right mouse button snaps to hex faces), wheel zoom between a close "diorama" view and the full island, edge-limited pan (WASD/arrows or middle drag).
- Smooth eased camera transitions; a tiny shake on heavy hits on the lighthouse (respecting a reduced-motion setting).

### Shape language and scale
- Hex tiles: radius 1 unit, flat-topped prisms with a slight bevel and a darker side skirt; terrain heights in steps of 0.25 (shallows 0, sand 0.25, grass 0.5, rock 0.75–1.25). Tiles have small per-tile color jitter within the palette and occasional props (tufts, pebbles, driftwood, nets) so the island never looks like a grid of identical prisms.
- The enemy path is packed darker sand with subtle footprints; it reads as a road from the default camera.
- Lighthouse: the tallest object on the island (about 4 tiles high), whitewash with a Deep Sea or coral stripe, a glowing amber lamp room and a rotating beam.
- Towers: tall, vertical, warm silhouettes on a basalt or wood base, each with a distinct top shape (harpoon ballista, cannon barrel, bell in an arch, glass lantern). Each tier makes the tower visibly taller or more ornate.
- Enemies: low, wide, crawling sea creatures with dark shells (Basalt and Deep Sea shades) and Brine Glow spots, each type with its own silhouette (wide crab, tall hermit shell, thin shrimp, floating jellyfish, huge brood crab, gulls in the air, the Leviathan). Enemies are roughly half a tile wide; the boss spans three tiles.
- Everything is faceted (flat shading) — no smooth plastic spheres.

### UI
- Typefaces from npm (no network fonts): **Fredoka** for titles, numbers and buttons (rounded, toy-like, matches the diorama); **Atkinson Hyperlegible** for body text, tooltips and tutorial copy.
- Panels: Deep Sea at roughly 90% opacity, warm sand-colored text, Lamp Amber only for the important number or the active state. Large panels have 16px corners; buttons are pill-shaped; small chips use 8px. Hierarchy, not one radius everywhere.
- The HUD is minimal and sits at the edges: top-left resource chips (lamp light, salvage), top-center wave counter with the next-wave preview, bottom-right speed and pause controls, bottom-center tower bar with costs and hotkeys.
- Build and upgrade choices appear next to the selected hex (a ring or small panel anchored to the world position), so the decision stays on the map.
- Every button has hover, pressed, disabled (not enough salvage — the cost turns Signal Coral) and focus states. Sentence case everywhere; plain verbs ("Build", "Upgrade", "Sell for 35", "Call wave early +20").
- Icons are simple custom SVG glyphs that echo each tower's silhouette. No emoji.

### Sound and music (all synthesized with Web Audio)
- Ambience: a constant bed of filtered-noise surf with slow swells, plus faint gulls at dusk; the bed darkens at night.
- UI: soft wooden marimba/kalimba plucks for hover and click; a lower woody thunk for "can't do that".
- Build: a heavy wooden thud plus a sand hiss; upgrade: a rising three-note chime; sell: a coin trickle.
- Towers: harpoon "thwip-thunk", cannon low boom with a short tail, bell a clear struck tone (detuned per tier), lantern a soft hum swell.
- Enemies: wet clicks on hit, a splash-pop on death, a lower crunch for armored hits.
- Lighthouse hit: a deep cracked bell and a flicker; low lamp: a slow heartbeat-like pulse.
- Waves: a foghorn at wave start, a bright ship's bell chime when a wave is cleared, a warm chord on victory, a slow descending foghorn on defeat.
- Music: a slow pad and a plucked arpeggio in a minor-pentatonic mode, sparse at dusk, more layers and percussion as night falls and during the boss.
- Separate music and effects volumes, a mute toggle (M), persisted.

### What to avoid
- Default grey or white MeshStandardMaterial, plastic-looking smooth shading, flat ambient-only lighting, unlit boxes and spheres standing in for objects.
- A uniform grid of identical hexes with no height, props or color variation.
- Random colors per object or per tower; neon cyberpunk glow; Brine Glow on anything the player owns.
- Purple-blue UI gradients, glassmorphism, stock browser buttons, system-ui or Arial, generic grey rectangles with drop shadows, the same rounded card for everything.
- Cream background with terracotta accent, all-caps tracked labels, emoji icons, placeholder text, "Lorem", "TODO" or debug text visible in the build.
- Objects popping in or vanishing without a tween; silent actions.

## Systems and content

### The island and terrain
- Axial hex grid. Each level is a hand-authored island (the shape, heights, paths and spawns are data); decorative scatter uses the level seed.
- Terrain types: **sand** (buildable), **grass** (buildable), **rock** (buildable; towers on rock get +1 hex range — the "high ground" rule), **path** (enemies walk here; not buildable), **shallows** (not buildable; decoration and spawn surf), **deep water** (the sea around the island).
- One hex holds at most one tower. Hovering a hex shows whether it is buildable (amber outline) or not (coral outline), and while placing, the tower's range ring including the rock bonus.

### The lighthouse and the lamp
- The lighthouse stands on its own hex at the end of every path. It has **Light** (20 by default). Each enemy that reaches it removes its leak value from Light, flickers the lamp and plays the hit sound. Light 0 = defeat.
- Stars on a win: 3 stars at ≥ 18 Light, 2 at ≥ 10, 1 otherwise (out of 20).
- **Lighthouse beam (signature ability):** the beam constantly sweeps the island. The player can take control of it (click the lighthouse or press B) for a few seconds: the beam follows the cursor, reveals mist enemies, slows everything in it by 50% and deals light burn damage. It uses Lamp Oil, which refills slowly over time and with kills. It never replaces towers; it saves a bad moment.

### Economy
- **Salvage** is the only currency: starting salvage per level, a reward per kill, a bonus for clearing a wave, and a bonus for calling a wave early (more the earlier it is called).
- Selling a tower refunds 70% of everything spent on it.
- Numbers are starting values to tune: start 150 salvage; kill rewards 4–15; wave-clear bonus 20 + 5 × wave number.

### Towers (4 types, 3 tiers each, a branch at tier 3)
| Tower | Role | Base cost | Base stats (tune freely) | Hits |
|---|---|---|---|---|
| Harpoon Post | fast single target, piercing | 50 | 12 dmg, 1.2 shots/s, range 3.5 hexes | ground and air |
| Cliff Cannon | slow splash, blunt | 90 | 30 dmg in a 1.2-hex blast, 0.4 shots/s, range 4.5, min range 1.5 | ground only |
| Tide Bell | slows in an area | 70 | pulse every 2 s, 40% slow for 2 s, radius 2.5 | ground only |
| Lantern | reveals mist enemies, light burn, marks targets | 60 | reveal radius 3; 4 burn dps; revealed enemies take +15% damage | ground and air |

- Tier 2 and tier 3 upgrades cost about 70% and 120% of the base cost and raise the main stats about 35% each.
- At tier 3 the player picks one of two specializations (the choice is permanent for that tower):
  - Harpoon Post: **Twin Harpoons** (fires at two targets) or **Whaler's Lance** (big damage that pierces through a line of enemies).
  - Cliff Cannon: **Shrapnel** (larger blast, more damage to swarms) or **Depth Charge** (ignores armor, short stun).
  - Tide Bell: **Storm Bell** (pulses also deal damage) or **Undertow Bell** (pulses push enemies back along the path a short distance, with a cooldown per enemy).
  - Lantern: **Searchlight** (long narrow cone, strong burn) or **Beacon** (nearby towers fire 20% faster).
- Each tower has a targeting priority the player can switch: first, strongest, closest.
- Synergies the player should discover: Tide Bell + Cliff Cannon (slowed clusters eat blasts); Lantern + anything (mist reveal and the damage mark); Cannon's Depth Charge vs Shellbacks; Harpoons vs gulls.

### Enemies (Brine creatures)
| Enemy | Silhouette | HP | Speed (hex/s) | Leak | Special |
|---|---|---|---|---|---|
| Scuttler | wide flat crab | 40 | 1.0 | 1 | basic |
| Skitterer | thin shrimp, fast legs | 25 | 1.8 | 1 | fast, comes in swarms |
| Shellback | tall hermit shell | 120 | 0.6 | 2 | 50% armor against piercing (harpoons) |
| Mistwalker | floating translucent jellyfish | 60 | 0.9 | 2 | cloaked: can't be targeted unless inside a Lantern's radius or the beam |
| Broodmother | huge brood crab | 220 | 0.5 | 3 | splits into 4 Skitterers on death |
| Gloom Gull | gull with a glowing eye, in the air | 35 | 1.4 | 1 | flies straight from its spawn to the lighthouse, ignoring the path; only harpoons, lantern burn and the beam hit it |
| The Leviathan | sea serpent, three tiles long | 3000 | 0.3 | all | boss of The Maw: submerges for 3 s every 12 s (untargetable), surfaces with a wave that briefly stuns towers next to the path |

- Enemies have readable health bars only when damaged, in Brine Glow on a dark plate.
- The first time an enemy type appears, a short card introduces it (name, one line, its counter) and the game pauses until the player closes it.

### Waves
- Each level has a scripted wave list (types, counts, spawn, intervals) with some seeded variation in spacing. A wave can mix spawns and types.
- Between waves there is a breather (about 8 s, or until the player presses "Next wave"); the HUD shows the next wave's composition as small enemy icons with counts and its spawn points flash on the map.
- Calling the next wave early grants bonus salvage proportional to the time remaining.
- Each wave advances the time of day.

### Levels (the campaign)
| # | Island | Shape and idea | Waves | New |
|---|---|---|---|---|
| 1 | Driftwood Cove | a small round island, one winding path from a single beach; the tutorial | 6 | Harpoon Post, Cliff Cannon; Scuttler, Skitterer |
| 2 | Saltmarsh | a flat marshy island, two paths that merge halfway | 8 | Tide Bell; Shellback |
| 3 | Basalt Steps | tall rock terraces over a long switchback path; high ground matters | 10 | Broodmother, Gloom Gull |
| 4 | Fogbank | three beaches, mist rolls in from wave 3 | 10 | Lantern; Mistwalker |
| 5 | The Maw | a crescent island around a dark bay, three paths, the boss in the last wave | 12 | the Leviathan |

- Level 1 is completable by a new player; level 5 should need specializations and synergies.
- Progress (unlocked islands, best stars) is saved in localStorage. Island N+1 unlocks when island N is won.

### Onboarding
- Level 1 starts with a short guided tutorial of 5–6 steps, each a small anchored tip with a pointer to the relevant hex or button: build a Harpoon Post on the highlighted hex; start the wave; watch salvage come in; build a Cliff Cannon on the rock; upgrade a tower; call a wave early. Each step advances on the action itself; the tutorial can be skipped and doesn't repeat once finished.
- New enemy cards (see Enemies) and a one-line tip when a new tower is unlocked.

### Menus and flow
- **Main menu:** the title "Tidewatch" set large in Fredoka over a live, slowly orbiting island diorama at dusk with the beam sweeping; buttons Play, Long Night (locked until island 5 is won), Settings, How to play.
- **Island chart (level select):** the 5 islands as small floating dioramas or icons on a dark sea chart, with stars and lock state.
- **In game:** pause menu (Resume, Restart, Settings, Quit to chart) on Esc/P; speed 1×/2×/3×; mute on M.
- **End screens:** victory with stars filling in one by one, kills, salvage earned, light left, buttons Next island / Retry / Chart; defeat with the wave reached, a tip relevant to what leaked, buttons Retry / Chart.
- **Settings:** music volume, effects volume, camera shake on/off, graphics quality (shadows/bloom), persisted.

### Controls
- Left click an empty hex: open the build choices there. Left click a tower: select it (range ring, upgrade, specialization, targeting, sell). Right click or Esc: cancel.
- Keys: 1–4 pick a tower to place at the hovered hex; Space — next wave; B — beam; Q/E — rotate; WASD — pan; wheel — zoom; F — cycle speed; P/Esc — pause; M — mute.

### Feedback (what "answers back" means)
- Build: the tower drops in with a squash-and-stretch bounce, a dust ring, a thud. Upgrade: the tower grows with a chime and an amber sparkle. Sell: it sinks into the sand with a coin trickle and salvage chips fly to the counter.
- Fire: muzzle flash or recoil per tower type, a visible projectile (harpoon with a rope trail, arcing shell with a smoke trail, an expanding bell ring, a lantern beam).
- Hit: a white flash on the enemy, a small knockback, wet particle bits; armored hits spark. Death: a splash of glow particles and a salvage chip rising.
- Lighthouse hit: a lamp flicker, a coral pulse at the screen edges, a short camera shake, the Light chip bumps.
- Wave start: foghorn and the spawn beaches pulse; wave clear: bell and a "Wave cleared +N" toast.

### Long Night (endless mode, M4)
- A sixth, larger island with procedurally escalating waves (seeded) and all towers unlocked; score = waves survived; best score saved locally.

### Storm surge (M4 ambition)
- On later islands and in Long Night, a storm can roll in between waves: the tide rises one step, some shallow-edge sand tiles flood for a few waves (towers there stop working until the tide recedes), and the waves that follow are bigger. The island literally changes shape and the player has to rebuild.

## What "finished" means for this game

- A new player opens the page, sees a striking dusk title screen, plays the tutorial on Driftwood Cove without reading anything outside the game, and wins it.
- All 5 islands are playable from the chart, each with its own shape, path layout and new idea; the Leviathan fight on The Maw is a memorable finale.
- All 4 towers with tiers and specializations, all 7 enemies and the beam work, are visible on screen and are needed somewhere in the campaign.
- Day-to-night lighting progresses across every level; every action has motion and sound; music and ambience play and respond to the night and the boss.
- Saved progress, settings, pause, speed, restart and end screens all work; no console errors; 60 FPS on an ordinary laptop.
- A screenshot of any moment is recognizably "Tidewatch": warm lamp vs cold glow on a hex diorama at dusk.

## Technical frame

- three.js + Vite, a static front end with no back end and no network requests (fonts from npm, all assets procedural).
- The test API `window.__game`, enabled by `?test=1`: reads the game state, starts any level with a fixed seed, changes time scale, steps the simulation, converts world positions to screen coordinates, and lists caught errors and played sounds. Game-specific state and helpers (salvage, light, wave, towers, enemies with positions, building and upgrading through the API, granting salvage, skipping to a wave) are added as the game grows. The exact contract lives in the generator's instructions and `harness/test-api.md`.
- The same seed always gives the same game.
- Smooth 60 FPS on an ordinary laptop.

## Not doing

- Multiplayer, online leaderboards, accounts, any back end.
- Free-form mazing (enemies always follow authored paths).
- Imported 3D models, textures, sounds or remote fonts.
- Mobile-first touch controls (it should not break on a small window, but mouse and keyboard are the target).
- More than 4 tower types or a tech tree; depth comes from tiers, specializations, terrain and combinations.

## Version history

- **v1 (round 01, START).** First spec from the brief. Defined the North Star (a lighthouse keeper holding the light on a hex island at dusk), three pillars (the island is the board; hold the light; a toy you want to touch), the warm-lamp-versus-cold-glow visual language, 4 towers with branching tier 3, 7 enemies, 5 islands, the beam ability, tutorial, menus and sound. Backlog B-001…B-036 in milestones M0–M4, ordered so the game is playable after every item and the brief's must-haves (menu, tutorial, several levels, sound, own style) arrive as early as possible.
