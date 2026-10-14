# Round 10 evaluation
Commit ffb34c9 · Spend $10.63 · PASS — pause menu, speed control and the dusk-to-night arc work and look good; but the new sky dome shader fails to compile on every load, and there is still no tutorial or second level.

Cloud VM (software WebGL): FPS is information only. Determinism round: run twice (see Regressions).

## Scores
| Criterion | Score | Change | Why | What would earn +1 |
|---|---|---|---|---|
| Playability | 7 | +1 | Pause menu (Esc/P/button), speed 1x/2x/3x, hotkeys 1-4 at the hovered hex and Space all work; Restart/Quit clean; small viewports fixed; 8x natural win and 16x natural loss with Retry clean, no NaN, no errors(). Still: no first-time guidance, one level, console shader error on every load. | Tutorial (B-017), fix B-046. |
| Depth | 6 | 0 | Time of day is purely visual: it changes no decision. Level 1 is still easy (3 towers + 1 lantern + auto-calling won with 15/20 Light at 8x). One level. | More levels (B-016), new enemy behaviours (B-015), a night mechanic that matters. |
| Style | 7 | +1 | +1: the sunset at wave 3 (warm orange tiles, violet shadows, long beam) and the cold night at waves 5-6 with glowing lamp, amber rings and lantern pool are a real identity (tod-wave3.jpg, 03-busy.jpg). Held back: golden hour at wave 1 is not golden, towers go near-black at night, sky and stars never render (shader error). | Working sky/stars, golden start, readable towers at night. |
| Feel | 6 | 0 | Pause menu is a clean dark panel with Fredoka buttons; speed button shows 1x/2x/3x; whole frame freezes while paused (3 identical screenshots). No new juice for build/hit/upgrade. | Juice passes (B-027/B-028). |

## Items in review
- B-013 — verified. (1) Esc opened the menu (`pauseMenu` true, screen `paused`); `time` 2.1 -> 2.1 over 1.5 s real time, enemy positions and projectile count unchanged, and three PNG screenshots 0.7 s apart during an active wave were byte-identical (particles, beam, sea frozen). (2) Real time over 2 s: 1x +2.03 s, 2x +4.27 s, 3x +6.5 s game time; `#speed` label read 1x/2x/3x; F key and the button both cycle. (3) Restart: t 33 -> 0.8, wave 0, salvage 150, towers 0, same level/seed 1; Quit: screen menu, towers 0, enemies 0, projectiles 0, Play button visible (after-quit.jpg). Also: P toggles, Esc/P/F ignored on title and on the lost screen, hotkeys 1 (harpoon) and 4 (lantern) built at the hovered hex, 3 and 2 refused for lack of salvage, Space called the wave.
- B-014 — verified. (1) `timeOfDay` 0 at wave 1, 0.2/0.4/0.6/0.8/1 per wave (wave 3 and 5 read 0.4 / 0.8 target), 1 at wave 6; `daylight` eases: 0.503, 0.753, 0.878, 0.939, 0.970, 0.985, 0.993, 0.996 at 1 s steps. (2) tod-wave1.jpg vs tod-wave3.jpg vs tod-wave6.jpg: warm/long shadows -> orange and violet sunset -> dark blue-grey night with glowing lamp. (3) At night path, towers, enemies (white-eyed crabs with amber rings) and lantern pool are distinguishable (03-busy.jpg), though towers are near-black. The sky/stars part of the Behavior is NOT working, filed as B-046 (the three "Done when" lines pass, so the item is verified).
- B-045 — verified. (1) 400x700: island spans x 113-287, y 282-431, tower bar rect 68-332 (inside 400); 500x350: bar 122-378, island fully inside; 640x420 same; no bar/next-wave overlap (vp-*.jpg). (2) 500x350 and 400x700 screenshots show the same saturation and brightness as 1280x720, no wash-out. (3) Unrevealed Mistwalker shows two pale ground ripples at the default camera (mist-cloaked.jpg), `revealed` false, not targetable. Leftovers filed in B-047.

## Bugs
### [major] Sky dome shader does not compile (B-046)
Repro: open `/`, read console. Expected: no errors. Actual: `THREE.WebGLProgram: Shader Error ... 0:160: '#' : invalid character` / `'include' : undeclared identifier` from src/render/daylight.js line 40 (`#include <colorspace_fragment>` placed after code on the same line), then `useProgram: program not valid` warnings every frame ("too many errors" cap reached within seconds). Sky dome and stars never draw; the spec's "stars at night" is absent. Evidence: console log of the first load, 1 error + hundreds of warnings.
### [minor] bundled in B-047
- Preview chip clipped at 400 px width (right edge 433), icon-only at 500x350.
- Night towers near-black; golden hour at wave 1 not golden.
- Clicking the scene behind the pause menu resumes; F changes speed while the menu is open.
- Mistwalker ripple looks like the spawn pulse rings.
### [polish]
- At 400x700 the island is tiny in the middle of a tall empty screen.
- Win/lose panel at night sits over an almost black island; the win screen has no stars or stats yet.
- `state()` after Quit keeps stale `wave` and `salvage` (harmless).

## Regressions
- Core loop: Play (real click) -> hotkey builds -> Space -> natural 8x win at 266 s (15/20 Light, 150 kills, max 6 enemies, 3 projectiles, no NaN, `errors()` empty) -> natural 16x loss at t=68 with no towers -> Retry via real click: salvage 150, light 20, towers 0, enemies 0, timeScale 1, daylight 0 -> Esc/resize while paused: menu stays centered (156-544 at 700x500).
- Determinism (due this round): same seed, 5 towers, `skipToWave(5)`, `step(1500)` twice gave byte-identical state (time, light, salvage, kills, enemy ids/hp/positions, target ids, daylight).
- Lantern/mistwalker, wave preview chip, call bonus still work (Space gave +11 salvage mid-breather). Tower bar and `#next-wave` do not overlap at four viewport sizes.

## What it's like to play now
Pressing Esc and getting a proper Paused panel, and being able to push to 2x or 3x, makes the game finally feel like something I could sit through. The best moment is the slide from golden hour to blue night: by wave 5 the lantern pool and the amber-ringed crabs are the only warm things on a cold island, which is exactly the "hold the light" fantasy. But wave 1 does not look golden, the posts turn into black silhouettes at night, and the level is still easy enough that three towers win it. I'm still dropped in with no hint where to click, and there is only one island.

## Top 3 priorities for the next round
1. B-046 sky shader fix (and make golden hour read golden, B-047).
2. Guided tutorial (B-017) and the island chart plus level 2 (B-016): the game needs a second level and a first-time path.
3. Make the night matter mechanically (Broodmother/gulls B-015, or retune level 1 so the lantern is needed), since depth has been flat at 6.

## Suggestions for the planner
- Let night change gameplay: e.g. lit enemies reveal at night, lantern range grows when darker, or Mistwalkers only spawn once daylight > 0.6.
- Rim-light towers with the lamp colour at night; a faint warm light on the nearest tiles from the lighthouse.
- Show "Dusk"/"Blue hour"/"Night" as a small label next to the wave chip, so the clock is legible.
- Pause menu could show wave and Light left, and mention hotkeys.

## Screenshots
- round-10/01-menu.jpg — fresh title; 02-start.jpg — level 1 seed 1 paused at start
- round-10/03-busy.jpg — wave 5 night with six towers; 04-end.jpg — victory panel at night
- round-10/tod-wave1.jpg, tod-wave3.jpg, tod-wave6.jpg — time of day progression
- round-10/pause-menu.jpg, after-quit.jpg, hotkeys.jpg, lost.jpg — pause, quit, hotkey builds, defeat
- round-10/vp-1280x720.jpg, vp-400x700.jpg, vp-500x350.jpg, vp-640x420.jpg — viewport checks
- round-10/mist-cloaked.jpg — cloaked Mistwalker ripples; menu-after-night.jpg — title easing back to golden
