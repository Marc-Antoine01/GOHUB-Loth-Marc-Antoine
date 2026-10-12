# Review log: "Faster, Stronger, Computer."

Stills: `node render.mjs films/quantum --sheet` gives one frame per measured beat (65), as 390 px thumbnails (≈ the 360 px review size).
Scores 1–10: hook, readability at 360, motion, composition, depth, sound sync, polish. On stills, motion and sync are judged from the planned timing; the animatic re-scores them.

## Round 1
| Hook | Read 360 | Motion | Compo | Depth | Sync | Polish |
|---|---|---|---|---|---|---|
| 6 | 5 | 7 | 7 | 6 | 7 | 6 |
1. The hook ends on an 11 px full stop: the qubit payoff is invisible, and the first S02 frame is almost empty (the dot flying in).
2. The mono captions (34 px) and the 104 px lines are unreadable at 360 px.
3. The loop clear wipe ends after 30 s: the last frame still shows grey bars.

## Round 2
| Hook | Read 360 | Motion | Compo | Depth | Sync | Polish |
|---|---|---|---|---|---|---|
| 7 | 8 | 8 | 8 | 7 | 8 | 7 |
Fixes: a snap zoom into the full stop on the last half-beat, which carries into S02's nucleus (depth via scale); captions at 46 px, lines at 120–128 px; the loop clear moved to 29.4 s.
1. The `2ⁿ` counter skips values (11, 11, 33, 33…): the row count was computed from a ratio, not from the lit rows.
2. The hook's ring overlaps the "r" of "Computer" and reads as a bracket.
3. Entanglement qubits too small for the flip to read.

## Round 3
| Hook | Read 360 | Motion | Compo | Depth | Sync | Polish |
|---|---|---|---|---|---|---|
| 8 | 8 | 8 | 8 | 8 | 8 | 8 |
Fixes: the counter counts lit rows (11, 22, 33 … 77, then n); the full stop sits clear of the text; the entanglement qubits are now R 130.
Open for the animatic: wipe speed against the 128 BPM grid, hold time on each payoff, and the silence-to-drop expansion in motion.

## Gate 3: animatic (960×540, score + SFX)
| Hook | Read 360 | Motion | Compo | Depth | Sync | Polish |
|---|---|---|---|---|---|---|
| 8 | 8 | 8 | 8 | 8 | 8 | 8 |
Checked from 0.1 s filmstrips around 1.2, 5.4, 14.3, 18.5 and 29 s: the snap zoom carries the full stop into the nucleus, the wipes cover and uncover within a beat,
and the silence holds the Bloch frame before ink swallows it exactly on the drop.
Fix: the loop clear moves to 29.25 s, so the bars are gone a few frames before 30 s and the last frame is the empty field frame 0 builds on.

## v2: 45 s (client: "too fast to read")
Every section was lengthened (hook 2 bars, the concept shots 3 bars, each use 2 bars instead of about 1.2); the score was extended to 24 bars, with the drop moved to bar 13; the beats were remeasured (97, all within 32 ms).
Re-check at 360 px:
| Hook | Read 360 | Motion | Compo | Depth | Sync | Polish |
|---|---|---|---|---|---|---|
| 8 | 9 | 8 | 8 | 8 | 8 | 8 |
1. The end line held for only about 0.6 s before the loop clear: the clear moved to 44.45 s.
2. The `2ⁿ` caption ran under the lattice: shortened to `// n qubits, 2^n states`.
3. The long holds keep moving: the push-in continues, the ghosts breathe, and the orbitals turn.
