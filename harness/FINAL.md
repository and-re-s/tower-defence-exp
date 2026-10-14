# Final report

## Totals
- Total spend: $12.85 (estimate) of a $12.00 budget. By agent: orchestrator $1.13 · planner $0.34 · evaluator $7.64 · generator $3.74.
- Rounds evaluated: 11 (round 01 was evaluated twice; see below).
- Final scores (round 11): Playability 7 · Depth 6 · Style 7 · Feel 6 · Total 26 · PASS. Best Total 26 (round 10).

## Checkpoints
Only one checkpoint exists in `checkpoints/`: `012` (saved at $12.85, commit 38c0af4, last evaluated round 11, build ok). No `CHECKPOINT.md` exists for the $10 mark; this run's budget was $12, so the $20, $50 and $100 checkpoints were never reached. The $10 checkpoint is not in the repository, and I did not investigate why.

| Checkpoint | Round | Playability | Depth | Style | Feel | Total |
|---|---|---|---|---|---|---|
| $12 | 11 | 7 | 6 | 7 | 6 | 26 |

### What changed in the game over the run (from `harness/rounds.md`)
- Rounds 01-03 ($0.4-$2.7): the island, path, lighthouse and enemies were built first, and the evaluator scored it FAIL (Total 13) because the player could not act. Round 02 added Harpoon Posts, building, salvage and six waves, which gave PASS at 19. Round 03 retuned level 1 and added test-API helpers.
- Rounds 04-05 ($3.5-$5.3): the sound pass with ambience and a mute button, then the Cliff Cannon with blast damage and a minimum range (Total 20, then 21).
- Rounds 06-08 ($5.3-$9.2): tower select, upgrade and sell, then the Tide Bell (slow) and the armored Shellback, with fixes for the sell refund rounding and the armor spark (Total 22, 23, 23).
- Rounds 09-11 ($9.2-$12.9): the Lantern and the cloaked Mistwalker, a next-wave preview, a pause menu with speed control, a day-to-night arc, small and portrait viewport layouts, and the Broodmother and Gloom Gull (Total 24, 26, 26).

## What went wrong
- Round 01: the first evaluator run replied `NO BROWSER` and the loop stopped via `harness/STOP`. After the browser was fixed, the evaluator ran again with `--start` and scored FAIL (Total 13).
- Open at the end: B-046 (major) is still not fixed. The sky dome and stars are not visible at any reachable camera at night, although the shader now compiles. B-047 is also still open: golden hour on wave 1 reads mauve and navy rather than warm.
- The planner ran only once, at the start. The queue never emptied and Total never stalled for two rounds, so it was never due again.
- Still missing: a tutorial or onboarding, only one level, and level 1 stays too easy (a late run won with 640 salvage unspent).
- The final round's spend crossed the budget ($12.85 against $12.00).
