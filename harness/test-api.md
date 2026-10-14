# Test API (`window.__game`, only with `?test=1`)

It reports the real game and changes nothing about gameplay. Wait for `__game.ready === true`.

| Member | Example | Notes |
|---|---|---|
| `ready` | `__game.ready` | true when the game accepts commands |
| `state()` | `__game.state()` | JSON snapshot, fields below |
| `start({level, seed})` | `__game.start({level:1, seed:1})` | starts a level immediately, deterministic |
| `pause()` / `resume()` | `__game.pause()` | `screen` becomes `paused` / `playing` |
| `setTimeScale(k)` | `__game.setTimeScale(8)` | 0.1 to 32; the game runs k times faster |
| `step(ticks)` | `__game.step(60)` | only while paused: advances N fixed ticks (60 = 1 game second) and renders |
| `toScreen(x,y,z)` | `__game.toScreen(0,0.25,0)` | viewport pixels `{x,y}` of a world point (world x/z as in `state()`; y up) |
| `errors()` | `__game.errors()` | `[{kind, message, at}]` window errors and unhandled rejections |
| `audioLog()` | `__game.audioLog()` | last 50 `{id, time}` (time = game seconds). Logged even when muted |
| `build(type, q, r)` | `__game.build('harpoon', 1, -1)` | same rules as the player (terrain, occupancy, cost); returns `{ok, reason}`; reasons: `path`, `terrain`, `lighthouse`, `occupied`, `salvage`, `invalid`. Works while paused. A refusal logs `refuse` in `audioLog()` |
| `upgrade(id)` | `__game.upgrade(1)` | tier +1 (max 3); returns `{ok, reason}` (`salvage`, `max`, `invalid`); logs `upgrade` (or `refuse`) in `audioLog()`. Costs: harpoon 60/90, cannon 80/120; damage x1.5/x2.1 (cannon x2.2), rate x1.1/x1.25 |
| `sell(id)` | `__game.sell(1)` | removes the tower, refunds 70% of `spent` (floor); returns `{ok, refund}`; logs `sell` |
| `setTargeting(id, mode)` | `__game.setTargeting(1,'strongest')` | `first` (default) / `strongest` (highest hp) / `closest`; returns bool |
| `grantSalvage(n)` | `__game.grantSalvage(100)` | adds salvage |
| `callNextWave()` | `__game.callNextWave()` | during a breather: starts the next wave now; returns the early bonus (added to salvage) or -1 |
| `skipToWave(n)` | `__game.skipToWave(3)` | from `playing`/`paused`: clears enemies and projectiles and starts wave n (1..waveCount) now; returns true/false (false outside 1..waveCount, nothing changes) |
| `win()` / `lose()` | `__game.win()` | forces `screen: 'won'` / `'lost'` (lose sets Light 0); returns true/false; false outside a level |
| `toMenu()` | `__game.toMenu()` | back to the title screen |

## `state()` fields
- `screen` menu | playing | paused | won | lost; `level`, `levelName`, `seed`, `time` (game s), `timeScale`, `fps`.
- `light`, `lightMax` (20), `salvage` (150 at start), `wave` (waves started), `waveCount`,
  `phase` (`breather` | `wave` | `done`), `breatherLeft` (s), `lastLeakTime`.
- `path`: `[{q,r}]` hexes from the beach hex to the lighthouse hex (last). `lighthouse`: `{q,r,x,z}`.
- `terrainCounts`: tiles per terrain (sand, grass, rock, path, shallows); `heights`: distinct tile heights.
- `kills`; `tiles`: `[{q, r, terrain, height, tower}]` (tower = tower id or 0); `towers`: `[{id, type, q, r, tier, range (hexes, +1 on rock), terrain, targetId, targeting, damage, rate, upgradeCost (0 at max), sellValue, spent, angleDeg}]`; `projectiles`: `[{id, kind ('bolt'|'shell'), towerId, targetId, x, z}]`.
- `enemies`: `[{id, type (scuttler|skitterer|shellback), hp, maxHp, x, z, progress, slowed, speedFactor}]` world position, 0..1 progress along the path; `slowed` true for 2 s after a Tide Bell pulse (`speedFactor` 0.6 = moving at 60%). Towers of type `bell` have `slow` (0.4/0.5/0.6) and damage 0; `build('bell', q, r)` costs 70. Shellbacks spawn in level 1 waves 3-6 (`skipToWave(6)`); audioLog ids `bell_ring`, `armor_hit`. `camera.yawDeg` is 0..359.
- `camera`: `{yawDeg, zoom (0 close .. 1 full island), pan:[x,z]}` (targets, not eased values); `muted`; `audio`: `{muted, running}` (running = AudioContext unlocked by a gesture).

Notes: tile centers are `x = 1.5q`, `z = sqrt(3)(r + q/2)`; tile top heights are in `heights`.
Waves: 6 on level 1, wave-clear bonus 20+5*wave salvage, early call bonus = 1.5 * breather seconds left. First breather 20 s, later 12 s. Later waves have scaled hp. Win = all waves cleared with Light > 0.
Player input: hover a hex = amber (buildable) or coral outline; click a buildable hex opens the build menu (`#build-menu`, one `.build-opt[data-tower]` per tower, keys 1 harpoon / 2 cannon build at the open or hovered hex); clicking a non-buildable hex refuses; Esc/right click cancels; Space or `#next-wave` calls the wave (both ignored while paused; the `callNextWave()` test call still works paused). Keys 1/2 and Esc work in `playing` and `paused`. Bottom tower bar `#tower-bar` with `.bar-slot[data-tower]` (click arms a type for the range ring preview). `start()` resets `timeScale` to 1.
Keys: Q/E rotate 60 degrees, wheel zoom, WASD pan, M mute, Enter on the title starts level 1.
Lamp hit sound id: `lighthouse_hit`. Other ids so far: `cannon_fire`, `cannon_boom` (shell explosion), `build`, `refuse`, `harpoon_fire`, `enemy_hit`, `enemy_death`, `ui_click`, `ui_hover`, `wave_start`, `wave_clear`, `victory`, `defeat`.

`start()` (and Retry/Play) resets the camera to yaw 0, zoom 1, pan 0,0 and clears `audioLog()`.

Sound: ambience (two surf layers with slow swells, faint gulls) starts on the first gesture; mute via button or M is persisted in localStorage (`tidewatch.muted`) and silences everything; ids are logged in `audioLog()` even when muted.

Tower types for `build()`: `harpoon` (50), `cannon` (90, range 4 / 5 on rock, min range 1.5, blast 1.2 hexes, ground only).

Selecting a tower: click it (its body or its hex) opens `#tower-panel` (`.tp-up` upgrade, `.tp-sell` sell, `.tp-target button[data-mode]`); Esc / right click / click elsewhere closes it. Clicking a tower never opens the build menu. `start()` resets the armed tower type to harpoon. Sound ids `upgrade`, `sell` added.
