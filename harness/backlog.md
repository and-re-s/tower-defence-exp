# Backlog — Tidewatch

Order = priority. Take items from the top. Sizes: S = 1, M = 2, L = 4 points.
Finished and dropped items live in `harness/backlog-done.md`.

---

## M0 — vertical slice

### B-040 · fix · review · S — Round 04 minor bugs bundle
Found: round-04 (minor)
Repro/Done when:
- with `start({level:1,seed:1}); pause();` the "Next wave" button is disabled but Space still calls the wave (wave 0 -> 1, phase `wave`) while paused; make both consistent (Space also ignored while paused, or button enabled);
- `setTimeScale(16)` then `start()` or Play from the menu keeps `timeScale` 16 in `state()`; reset it to 1 on start/Retry/Play.



---

## M1 — full core


### B-008 · M1 · review · M — Cliff Cannon and the high-ground rule
Why: pillar "The island is the board"; the first real tower choice (single target vs splash).
Behavior: A second tower, the Cliff Cannon (cost 90): a squat basalt tower with a barrel that lobs an arcing shell with a smoke trail; it explodes in a 1.2-hex blast damaging every ground enemy inside. It can't hit enemies closer than 1.5 hexes. Every tower on a rock tile gets +1 hex range. A tower bar at the bottom shows both towers with icons, costs and hotkeys 1–2.
Done when:
- one cannon shell damages several enemies at once when they are clustered (hp drops for 2+ enemies on the same tick in `state()`);
- the cannon never fires at an enemy within 1.5 hexes;
- a tower's range in `state().towers` is 1 higher on rock than on sand, and the range ring shows it;
- the cannon's silhouette is clearly different from the Harpoon Post from the default camera, and the cannon has its own fire sound in `audioLog()`.

### B-009 · M1 · todo · M — Select a tower: upgrade, sell, targeting
Why: depth through investment decisions; the decision stays on the map.
Behavior: Clicking a tower selects it: its range ring appears and a small panel anchored next to it shows its stats, "Upgrade for N" (tiers 2 and 3, each visibly taller or more ornate), targeting priority (first / strongest / closest) and "Sell for N" (70% refund). Esc or right click deselects.
Done when:
- upgrading raises `tier` and the tower's damage or rate in `state().towers` and costs salvage; the model visibly changes per tier; tier 3 is the maximum;
- selling removes the tower, frees the hex and refunds 70% of the total spent (base + upgrades);
- switching targeting to "strongest" makes the tower target the highest-hp enemy in range (check the target id in `state()`);
- the panel never covers the selected tower and stays on screen at the island edges.

### B-010 · M1 · todo · M — Tide Bell and the Shellback
Why: counter-choices — armor punishes harpoon spam, slows set up the cannon.
Behavior: The Tide Bell (cost 70) is an open arch with a bell that rings every 2 s, sending an expanding ring that slows ground enemies within 2.5 hexes by 40% for 2 s (slowed enemies show a Shallows-tinted trail). The Shellback (tall hermit shell, 120 hp, slow) takes 50% less damage from harpoons; armored hits spark and make a lower crunch.
Done when:
- an enemy inside a bell's radius moves at about 60% speed for 2 s after a pulse (measured from positions in `state()`);
- a harpoon hit on a Shellback removes half the hp it removes from a Scuttler; cannon damage is unaffected;
- the bell ring and the armored spark are visible in screenshots; both have their own sounds in `audioLog()`;
- the tower bar shows three towers with hotkeys 1–3.

### B-011 · M1 · todo · M — Lantern and the Mistwalker
Why: pillar "Hold the light": light as a weapon and visibility as a mechanic.
Behavior: The Lantern (cost 60) is a glass-topped tower glowing amber that lights the hexes around it (radius 3) with a warm pool of light, burns enemies inside it (4 dps), and marks them to take +15% damage from all sources. The Mistwalker (a translucent floating jellyfish) is cloaked: towers can't target it unless it is inside a Lantern's light; while cloaked it is drawn as a faint shimmer.
Done when:
- `state().enemies` shows a `cloaked`/`revealed` flag; no tower targets a Mistwalker outside lantern light; inside it, they do;
- an enemy inside lantern light loses hp over time without any other tower and takes 15% more damage from a harpoon hit;
- the lantern's light pool is visible on the ground in a screenshot, and a cloaked Mistwalker looks clearly different from a revealed one;
- the tower bar shows four towers with hotkeys 1–4.

### B-012 · M1 · todo · S — Next-wave preview and calling waves early
Why: informed decisions between waves; rewards confident players.
Behavior: During the breather the HUD shows the next wave as small enemy icons with counts, and its spawn beach pulses on the map. "Next wave +N" calls it early; the bonus shrinks as the breather runs out.
Done when:
- `state()` exposes the next wave's composition and it matches what spawns;
- calling a wave early grants more salvage the earlier it is called (two calls at different times give different bonuses); the bonus shows as a floating "+N" near the salvage counter;
- the spawn beach of the next wave visibly pulses in a screenshot during the breather.

### B-013 · M1 · todo · S — Pause menu, game speed and hotkeys
Why: control and comfort; needed for every later level.
Behavior: Esc or P opens a pause menu (Resume, Restart, Quit to menu) and freezes all motion; F or the HUD button cycles speed 1×/2×/3×; 1–4 pick a tower to place at the hovered hex; Space calls the next wave.
Done when:
- while paused, `state().time` doesn't advance and enemies, projectiles and particles don't move;
- speed 3× makes `time` advance about 3 times faster than 1× over the same real time; the current speed is shown in the HUD;
- Restart from the pause menu gives a fresh run of the same level; Quit returns to the title screen with no leftover enemies or towers.

### B-014 · M1 · todo · M — From dusk to night across the waves
Why: pillar "Hold the light": the night is the clock, and it's the strongest image this game has.
Behavior: The level starts at golden hour; each wave lowers the sun in eased steps through sunset and blue hour to night. At night the sun is dim and cold, the sky darkens to Deep Sea with stars, and the lighthouse lamp, lanterns and enemy glow become the main light sources. Mistwalkers appear only from dusk on.
Done when:
- `state()` exposes a time-of-day value that advances with each wave and reaches night on the last wave;
- screenshots of wave 1 and of the last wave of a level show clearly different lighting (warm long shadows vs dark scene with glowing lamp and enemies), with the transition eased, not instant;
- the island stays readable at night: path, towers and enemies are distinguishable in a night screenshot.

### B-015 · M1 · todo · M — Broodmother and Gloom Gulls
Why: varied situations — burst threats and an air route that ignores the path.
Behavior: The Broodmother (huge brood crab, slow, 220 hp) splits into 4 Skitterers when killed. Gloom Gulls fly at a fixed height straight from their spawn to the lighthouse, ignoring the path; only Harpoon Posts, lantern burn (and later the beam) can hurt them; cannons and bells ignore them.
Done when:
- killing a Broodmother adds 4 Skitterers at its position in `state().enemies`;
- a gull's path is a straight line to the lighthouse (positions in `state()`), and cannons and bells never target it while harpoons do;
- both are visually distinct from the default camera (gulls cast a shadow on the tiles below them).

---

## M2 — content and depth

### B-016 · M2 · todo · M — Island chart, saved progress, and Saltmarsh
Why: the brief requires several levels; progress gives the session a purpose.
Behavior: Play opens an island chart: the islands as small icons on a dark sea map with their names, stars and lock state. Winning an island unlocks the next; progress persists in localStorage. Level 2, Saltmarsh, is a flat marshy island with two paths that merge halfway, 8 waves, introducing the Tide Bell and Shellbacks.
Done when:
- after winning level 1 and reloading, the chart shows level 1 with its stars and level 2 unlocked; a fresh storage shows only level 1 unlocked;
- level 2 has two spawns and two paths that merge (visible in `state()` path data), and its own island shape;
- level 2 can be won at 8× with a sensible build (check `screen: 'won'`), and the victory screen's "Next island" starts it.

### B-017 · M2 · todo · M — Guided tutorial on Driftwood Cove
Why: the brief requires a short tutorial; a new player must win level 1 without help.
Behavior: The first time level 1 starts, 5–6 anchored tips guide the player: build a Harpoon Post on the highlighted hex, start the wave, watch salvage come in, build a Cliff Cannon on the highlighted rock, upgrade a tower, call a wave early. Each step advances on the action itself; a Skip button ends it. Finished or skipped tutorials don't repeat.
Done when:
- with fresh storage, starting level 1 shows the first tip with a pointer to a specific hex; performing each action advances to the next step (`state()` exposes the tutorial step);
- Skip ends the tutorial immediately; restarting level 1 after finishing or skipping shows no tutorial;
- the game doesn't spawn the first wave until the player has built a tower or skipped.

### B-018 · M2 · todo · M — The lighthouse beam
Why: pillar "Hold the light": the signature ability that makes this game different from other TDs.
Behavior: Clicking the lighthouse or pressing B takes control of the beam for up to 5 s: it follows the cursor across the island, reveals cloaked enemies, slows everything in it by 50% and deals light burn, including to gulls. It spends Lamp Oil, shown as a meter on the Light chip, which refills slowly and with kills. When released, the beam returns to its idle sweep.
Done when:
- `state()` exposes the oil level and whether the beam is controlled; using it drains oil, and it can't be used when empty (refuse sound);
- enemies inside the controlled beam are slowed, take damage and are revealed (flags in `state()`), including gulls;
- the controlled beam is visibly brighter and points at the cursor position in a screenshot; it has a sound in `audioLog()`.

### B-019 · M2 · todo · M — Basalt Steps
Why: pillar "The island is the board": high ground becomes the main decision.
Behavior: Level 3 is a tall island of rock terraces with a long switchback path, 10 waves, introducing the Broodmother and Gloom Gulls. The best build spots are high rock ledges overlooking several turns of the path.
Done when:
- the level has at least 4 distinct terrain heights and at least 3 path turns that a single rock tile can cover;
- it's unlocked by winning level 2, saves its stars, and can be won at 8× with a sensible build;
- its waves include Broodmothers and gulls, and a screenshot of it is clearly a different island from levels 1 and 2.

### B-020 · M2 · todo · M — Fogbank
Why: pillar "Hold the light": the level where light decides everything.
Behavior: Level 4 has three beaches and 10 waves; it unlocks the Lantern, and from wave 3 a low mist rolls over the island and Mistwalkers join the waves. The mist is a visible layer that lantern light and the beam cut through.
Done when:
- the level has 3 spawns; Mistwalkers appear from wave 3 on;
- the mist is visible in a screenshot and visibly cleared inside a lantern's light pool;
- it's unlocked by winning level 3, saves its stars, and can be won at 8× with lanterns but loses without any lantern or beam use (two runs with `build` and `setTimeScale`).

### B-021 · M2 · todo · M — Specializations: Harpoon Post and Cliff Cannon
Why: depth — the tier-3 branch is the biggest build decision.
Behavior: Upgrading a Harpoon Post or Cliff Cannon at tier 2 offers two specializations instead of a plain tier 3, each with a name, one-line effect and its own look: Twin Harpoons (two targets) or Whaler's Lance (heavy piercing shot through a line); Shrapnel (bigger blast) or Depth Charge (ignores armor, short stun).
Done when:
- each of the 4 specializations shows its effect in `state()`: Twin Harpoons hits two enemies per volley, the Lance damages every enemy along its line, Shrapnel has a larger radius, Depth Charge deals full damage to Shellbacks and stuns;
- each has a distinct model change visible from the default camera;
- the choice is permanent for that tower and shown in its panel.

### B-022 · M2 · todo · M — Specializations: Tide Bell and Lantern
Why: depth — synergies between towers.
Behavior: Tide Bell at tier 2 offers Storm Bell (pulses deal damage) or Undertow Bell (pulses push enemies back a short way along the path, with a per-enemy cooldown); Lantern offers Searchlight (long narrow cone, strong burn) or Beacon (towers within its light fire 20% faster).
Done when:
- Undertow measurably moves an enemy backward along the path (positions in `state()`), and the same enemy isn't pushed again until its cooldown ends;
- Storm Bell pulses reduce hp of every ground enemy in its radius;
- a tower inside a Beacon's light has a 20% higher fire rate in `state()`; Searchlight's cone is visible and reaches farther than a normal lantern.

### B-023 · M2 · todo · S — New enemy cards and tower unlock tips
Why: onboarding for every new idea, not just level 1.
Behavior: The first time an enemy type appears, the game pauses and a card shows its silhouette, name, one line about it and its counter ("Shellback — armored against harpoons. Cannons crack it."). The first time a level unlocks a tower, a one-line tip points at it in the tower bar. Seen cards are remembered.
Done when:
- the first Shellback in a fresh profile pauses the game and shows its card; closing it resumes; it doesn't show again after reload;
- every enemy type has a card with real copy (no placeholder text).

### B-024 · M2 · todo · S — Stars and run stats on the end screens
Why: a reason to replay islands; clear feedback on how well the player did.
Behavior: Victory shows 1–3 stars (3 at ≥ 18 Light, 2 at ≥ 10) that fill in one by one with a chime each, plus kills, salvage earned and Light left. Defeat shows the wave reached and a tip that names the enemy type that leaked the most Light.
Done when:
- the stars match the Light thresholds (check with `state()` and the screen), and the best stars per island are saved on the chart;
- the defeat tip names the enemy type with the most leaked Light in that run.

### B-025 · M2 · todo · M — The Maw
Why: the campaign needs a finale island built for everything the player has learned.
Behavior: Level 5 is a crescent island around a dark bay with three paths and 12 waves mixing every enemy type, at full night by the end. All towers are available.
Done when:
- the level has 3 paths and its waves use every non-boss enemy type;
- it's unlocked by winning level 4 and can be won at 8× with a build that uses specializations;
- a screenshot of it is clearly a different island from the other four.

### B-026 · M2 · todo · M — The Leviathan
Why: a memorable finale; pillar "A toy you want to touch".
Behavior: The last wave of The Maw is the Leviathan: a three-tile-long sea serpent with glowing fins that surfaces from the bay, crawls along the main path, submerges for 3 s every 12 s (untargetable, shown as a moving wake) and surfaces with a splash that stuns towers next to the path for 2 s. A boss health bar shows at the top of the screen; the music swells.
Done when:
- `state()` shows the boss with hp, a `submerged` flag, and stunned towers; no tower damages it while submerged;
- if it reaches the lighthouse the level is lost; killing it wins the level and the campaign, with a dedicated ending line on the victory screen;
- the boss bar and the surfacing splash are visible in screenshots, with their own sounds in `audioLog()`.

---

## M3 — feel and polish

### B-027 · M3 · todo · M — Build, upgrade and sell juice
Why: pillar "A toy you want to touch".
Behavior: Towers drop in with a squash-and-stretch bounce and a dust ring; upgrades grow the tower with an amber sparkle and a rising chime; selling sinks the tower into the sand with salvage chips flying to the counter. Hover on a buildable hex lifts it slightly.
Done when:
- a step-by-step flip-book (pause, act, `step(n)` + screenshots) shows each of the three animations over several frames, not a single-frame swap;
- all motion runs on game time (pausing freezes it mid-animation);
- each action has its own sound in `audioLog()`.

### B-028 · M3 · todo · M — Combat juice
Why: pillar "A toy you want to touch"; makes every shot readable and satisfying.
Behavior: Each tower has a firing tell (harpoon recoil and rope trail, cannon muzzle puff and smoke trail, bell sway, lantern flare). Enemies flash white and bounce on hit, armored hits spark, deaths burst into glow particles and a rising salvage chip; damaged enemies show a small health bar.
Done when:
- a flip-book of one shot from fire to death shows the firing tell, the projectile, the hit flash and the death burst;
- health bars appear only on damaged enemies;
- a busy wave at 1× keeps frame time stable (no growth in particle or object counts after the wave ends, checked through `state()`).

### B-029 · M3 · todo · S — The lighthouse under attack
Why: pillar "Hold the light": losing light must hurt.
Behavior: When an enemy reaches the lighthouse, the lamp flickers, the screen edges pulse Signal Coral, the camera shakes briefly (if enabled) and the Light chip bumps. Below 5 Light the lamp dims and a slow pulse plays until the wave ends.
Done when:
- a flip-book of a leak shows the flicker, the edge pulse and the chip bump;
- below 5 Light, `audioLog()` shows the low-lamp pulse and the lamp is visibly dimmer than at 20.

### B-030 · M3 · todo · M — Music that follows the night
Why: the brief requires sound; music carries the mood shift from dusk to night.
Behavior: A synthesized music bed (slow pad, plucked arpeggio in a minor-pentatonic mode) plays in the menu and in levels; it adds layers and percussion as the night deepens and during waves, drops back in breathers, and has a boss variant.
Done when:
- `state()` or `audioLog()` shows the current music layer/intensity, and it changes between breather, wave, night and boss;
- the music volume is separate from effects and persists.

### B-031 · M3 · todo · S — Settings
Why: comfort and accessibility.
Behavior: A Settings screen (from the title and the pause menu) with music volume, effects volume, camera shake on/off and graphics quality (shadows and bloom on/off), all persisted.
Done when:
- every setting takes effect immediately and survives a reload;
- with shake off, a lighthouse hit produces no camera movement.

### B-032 · M3 · todo · M — Living sea and shoreline
Why: the sea frames every screenshot; it should feel alive, not like a flat plane.
Behavior: The sea is a faceted, gently heaving surface in Deep Sea tones with a lighter Shallows ring around the island, white foam lapping the shore, and spray where enemies emerge at spawn beaches.
Done when:
- two screenshots a few game seconds apart show the water surface and foam moving;
- foam follows the island's actual outline in every level; spawn beaches show spray when enemies emerge.

### B-033 · M3 · todo · M — Title diorama and camera fly-ins
Why: the first impression; one orchestrated moment.
Behavior: The title screen shows the island slowly orbiting at dusk with the beam sweeping; choosing an island on the chart flies the camera down from the sky to the level's start view; winning slowly pulls back to a wide shot of the lit island.
Done when:
- the title screen camera moves over time and the title text is legible over it;
- starting a level and winning it each show an eased camera transition of about 1–2 s (flip-book);
- the test API `start()` still starts levels immediately and deterministically.

### B-034 · M3 · todo · S — Tower tooltips and How to play
Why: readability of decisions.
Behavior: Hovering a tower in the build menu or tower bar shows a tooltip with its role, cost, range, what it can hit and one tip. A "How to play" screen from the title explains controls and the Light/salvage rules in a few lines with tower icons.
Done when:
- each of the 4 towers has a tooltip with real copy matching `state()` stats;
- How to play lists every control from the spec and is reachable from the title screen.

---

## M4 — ambition

### B-035 · M4 · todo · L — Long Night: endless mode
Why: replay value after the campaign; pillar "Hold the light".
Behavior: Unlocked by winning The Maw. A larger island with all towers available and endless seeded waves that escalate in count, mix and hp; the night never ends. Score = waves survived; the best score is saved and shown on the title screen.
Done when:
- waves keep coming past wave 20 with growing total hp (from `state()`), and the same seed gives the same waves;
- losing shows the waves survived and the best score; the best score persists across reloads;
- it's locked on a fresh profile and unlocked after a win on level 5.

### B-036 · M4 · todo · M — Storm surge
Why: pillar "The island is the board": the board itself changes and the player must rebuild.
Behavior: On Fogbank, The Maw and Long Night, a storm can roll in between waves (rain, darker sky, thunder): the tide rises a step and some low sand tiles flood for the next 2 waves; towers on flooded tiles stop working until the tide recedes. The HUD warns one wave ahead.
Done when:
- `state()` shows flooded tiles and disabled towers during a surge, and both return to normal after it;
- the warning appears one breather before the surge; flooding is visible in screenshots and has its own sound.
