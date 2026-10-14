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
| `grantSalvage(n)` | `__game.grantSalvage(100)` | adds salvage |
| `callNextWave()` | `__game.callNextWave()` | during a breather: starts the next wave now; returns the early bonus (added to salvage) or -1 |
| `toMenu()` | `__game.toMenu()` | back to the title screen |

## `state()` fields
- `screen` menu | playing | paused | won | lost; `level`, `levelName`, `seed`, `time` (game s), `timeScale`, `fps`.
- `light`, `lightMax` (20), `salvage` (150 at start), `wave` (waves started), `waveCount`,
  `phase` (`breather` | `wave` | `done`), `breatherLeft` (s), `lastLeakTime`.
- `path`: `[{q,r}]` hexes from the beach hex to the lighthouse hex (last). `lighthouse`: `{q,r,x,z}`.
- `terrainCounts`: tiles per terrain (sand, grass, rock, path, shallows); `heights`: distinct tile heights.
- `kills`; `tiles`: `[{q, r, terrain, height, tower}]` (tower = tower id or 0); `towers`: `[{id, type, q, r, tier, range (hexes, +1 on rock), terrain, targetId, angleDeg}]`; `projectiles`: `[{id, towerId, targetId, x, z}]`.
- `enemies`: `[{id, type (scuttler|skitterer), hp, maxHp, x, z, progress}]` world position and 0..1 progress along the path.
- `camera`: `{yawDeg, zoom (0 close .. 1 full island), pan:[x,z]}` (targets, not eased values); `muted`.

Notes: tile centers are `x = 1.5q`, `z = sqrt(3)(r + q/2)`; tile top heights are in `heights`.
Waves: 6 on level 1, wave-clear bonus 20+5*wave salvage, early call bonus = 1.5 * breather seconds left. First breather 20 s, later 12 s. Later waves have scaled hp. Win = all waves cleared with Light > 0.
Player input: hover a hex = amber (buildable) or coral outline; click a buildable hex opens the build menu (`#build-menu`, button `.build-opt`, key 1); clicking a non-buildable hex refuses; Esc/right click cancels; Space or `#next-wave` calls the wave. Works in `playing` and `paused`.
Keys: Q/E rotate 60 degrees, wheel zoom, WASD pan, M mute, Enter on the title starts level 1.
Lamp hit sound id: `lighthouse_hit`. Other ids so far: `build`, `refuse`, `harpoon_fire`, `enemy_hit`, `enemy_death`, `ui_click`, `ui_hover`, `wave_start`, `wave_clear`, `victory`, `defeat`.

`start()` (and Retry/Play) resets the camera to yaw 0, zoom 1, pan 0,0 and clears `audioLog()`.
