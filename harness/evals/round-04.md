# Round 04 evaluation
Commit f744902 · Spend $3.49 · PASS — both review items hold up (sound pass verified through audio-graph probes, tuning and title fixes confirmed), 0 errors; still one tower and no onboarding, so Depth stays flat.

Cloud VM (software WebGL): FPS is information only. Sounds cannot be heard here; audio was verified through `audioLog()`, `state().audio` and a probe of the Web Audio graph.

## Scores
| Criterion | Score | Change | Why | What would earn +1 |
|---|---|---|---|---|
| Playability | 6 | 0 | Menu -> Play -> click hex -> menu -> build -> win/lose -> Retry/Menu all work; 0 console errors; mute/keys robust. Still no hint that hexes are clickable (first wave auto-starts), no pause menu, one level, one tower. | Tutorial (B-017), pause menu (B-013). |
| Depth | 2 | 0 | Unchanged: identical posts, one decision (where). Salvage piles up unspent (693-750 at the end of every run). | Second tower, high ground, upgrade/sell (B-008, B-009). |
| Style | 6 | 0 | Title block now sits left, lamp and beam are the hero (better composition), win panel numerals are Fredoka. Still no sky/horizon, beam is a hard wedge, crabs low contrast on path. | Sky/horizon, softer beam. |
| Feel | 6 | +1 | +1: every action now has a distinct sound id and a surf bed with two looping layers and a master compressor; mute is real (master gain 0.80 -> 0.00). Visual feedback is unchanged (no build drop-in, hit flash, recoil, salvage popups), and I could not judge how the sounds actually sound. | Build/combat juice (B-027, B-028). |

## Items in review
- B-039 — verified. Evidence: (1) victory panel "/ 20" computed font is Fredoka (04-end.jpg); HUD "/ 20" and "/ 6" are Fredoka too. (2) `skipToWave(0)` and `skipToWave(7)` both return false. (3) Best-coverage posts built once with salvage granted (seed 1, 32x/16x): 5 posts lose (wave 6, Light 0), 6 posts win with Light 7, 7 posts win with Light 19. A mild step, no longer a 0-to-win cliff. (4) Paused at start, `#next-wave` is visible (dimmed, `disabled` attribute set, clicking it changes nothing, 02-start.jpg). (5) Menu screenshot 01-menu.jpg: title and pill are left, lamp and beam clear; also holds at 900x500 (menu-900.jpg).
- B-007 — verified. Evidence: `audioLog()` shows distinct ids `ui_click` (real Play click), `ui_hover` (real hover), `refuse` (build on a path hex), `build`, `harpoon_fire`, `enemy_hit`, `enemy_death`, `wave_start`, `wave_clear`, `lighthouse_hit`, `defeat` (natural loss, seed 1, 1 post) and `victory` (`win()`). `state().audio.running` is false on the menu and true after the Play click. Ambience: two looping `AudioBufferSourceNode`s (4.0 s buffers, `loop: true`, seam step smaller than the average sample step, so no gap or click). No audio errors in `errors()` over a full 242 s won run at 16x; live oscillator/source count returned to 12 (only the ambience) at the end, so nothing leaks. Mute: toggle button and M both flip `state().muted`; `tidewatch.muted` is 1/0 in localStorage; after reload `muted` stays true; the master gain feeding the compressor is 0.00 when muted and 0.80 when not (graph probe). Caveat: sound quality and balance were not audible to me.

## Bugs
No blocker or major. Minors bundled as B-040.

### [minor] Space calls the wave while paused although the button is disabled
Repro: `start({level:1,seed:1}); pause();` dispatch Space keydown. Expected: same as the disabled button. Actual: wave 0 -> 1, phase `wave` (still `paused` screen). Test API docs say keys work paused, so decide one rule.

### [minor] timeScale survives start/Play
`setTimeScale(16)`, `start()` -> `timeScale` still 16 (seen again this round; test-only today but will bite a speed-control UI, B-013).

### [polish] Title beam still passes under the "h" of the title
01-menu.jpg: lamp is clear now, but the beam wedge starts right under the title's last letters. Nudging the title up or the beam angle would finish it.

### [polish] Crabs on dark brown path hexes are low contrast; towers read small at default zoom
03-busy.jpg: posts are clear, crabs are readable but small.

### [polish] Salvage piles up
All winning runs ended with 693-750 unspent salvage; no sink until B-008/B-009.

## Regressions
Core loop start -> play -> lose/win -> Retry/Menu passes (natural defeat with 1 post at wave 4; natural wins with 6 and 7 posts). Build refusals re-tested: `terrain` (shallows), `lighthouse`, `occupied`, `invalid`, `path`; salvage 150 -> 100 after a build; `start()` mid-wave resets towers, enemies, projectiles, wave and salvage (150). 300 spammed key events and 200 random pointer events: no errors, state sane. Resize to 900x500: HUD and title fine. Done items re-tested: B-003 (refusals), B-006 (skipToWave/win/lose), B-005 (title, HUD, Menu button). Console: 0 errors (only software-GL warnings). Determinism is not due until round 05.

## What it's like to play now
I press Play, see the lighthouse beam sweeping and a countdown, and have to guess that hexes are clickable. Once I build, things click into place: hover pluck, a build thud, harpoons flying, crabs dying. The title screen is nicer with the lighthouse unobstructed. Mechanically it is the same as before: identical posts, a good placement wins, and I finish with hundreds of salvage nothing can spend. The sound layer is wired in everywhere (as far as the logs tell), but the picture still doesn't react to my actions with any juice.

## Top 3 priorities for the next round
1. B-008 Cliff Cannon plus high ground, then B-009 select/upgrade/sell: Depth cannot move and salvage has no sink.
2. First-time guidance (B-017) or at least a pulsing hint on a good hex; pause menu and speed (B-013, with the timeScale reset).
3. Visual juice (B-027/B-028) to match the new sound layer; sky/horizon and softer beam for Style.

## Suggestions for the planner
- Hover-triggered range ring while the build menu is open to show rock vs sand.
- A visible mute state change (icon swap exists; add a short toast or fade).
- Tie sound pitch to tier/target type once more towers exist so players can tell towers apart by ear.

## Screenshots
- round-04/01-menu.jpg — fresh title, title block left, lamp clear
- round-04/02-start.jpg — level 1 seed 1, paused, dimmed disabled Next wave button
- round-04/03-busy.jpg — wave 5, 6 posts, 4 crabs and a harpoon in flight
- round-04/04-end.jpg — victory panel, Fredoka "/ 20"
- round-04/menu-900.jpg, resize-900.jpg — small-window checks
