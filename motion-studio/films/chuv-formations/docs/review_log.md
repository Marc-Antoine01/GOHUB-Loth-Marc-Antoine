# Review log: Formations au CHUV

Method: `node render.mjs films/chuv-formations --sheet` gives one frame per measured beat (60) plus t=0, as 390 px wide thumbnails (≈ the 360 px review size).
Scores are 1–10 on hook, readability at 360 px, motion, composition, depth, sound sync and polish.
Motion and sound sync are judged from the planned timing on stills; the animatic (gate 3) re-scores them in motion with the track.

## Gate 2: stills

### Round 1 (whole film)
| Hook | Read 360 | Motion | Compo | Depth | Sync | Polish |
|---|---|---|---|---|---|---|
| 7 | 4 | 6 | 4 | 6 | 6 | 4 |

Biggest problems:
1. S07 invisible: the floor sat behind the lens (pitch sign). S05's flip showed the card's front mirrored: the DOF `filter` flattens 3D, so `backface-visibility` cannot work.
2. The camera is too far in S02, S03, S05 and S08: the UI is tiny.
3. S02 crops the H1, and the satellites sit on top of the header.

Also fixed: the purity check flagged frame 15 s. Shots now write all their styles every frame (hidden ones included). The check compares PSNR instead of bytes, because Chromium's raster cache shifts a few values by 1–2 levels; real carried state still fails (`npm test`, stateful fixture).

### Round 2
| Hook | Read 360 | Motion | Compo | Depth | Sync | Polish |
|---|---|---|---|---|---|---|
| 7 | 6 | 7 | 6 | 7 | 7 | 6 |

1. S02 pills overlap: they were laid out from their projected (3D) widths instead of their layout widths.
2. S08 group cropped on the left.
3. S01 frame 0: lines that have not entered yet show edge-on as thin strokes, which reads as a glitch.

### Round 3
| Shot | Hook | Read 360 | Compo | Depth | Polish |
|---|---|---|---|---|---|
| S01 | 8 | 8 | 8 | 8 | 8 |
| S02 | – | 6 | 7 | 7 | 7 |
| S03 | – | 5 (ring) / 8 (grid) | 7 | 8 | 7 |
| S04 | – | 8 | 8 | 8 | 8 |
| S05 | – | 7 | 7 | 8 | 7 |
| S06 | – | 8 | 8 | 8 | 8 |
| S07 | – | 6 | 7 | 7 | 7 |
| S08 | – | 8 | 8 | 7 | 8 |

1. S03 ring panels are small and overlap while turning.
2. S07's heading is too small and foreshortened.
3. The S05 card is small in frame for the first 1.5 s.

### Round 4
| Shot | Hook | Read 360 | Compo | Depth | Polish |
|---|---|---|---|---|---|
| S01 | 8 | 8 | 8 | 8 | 8 |
| S02 | – | 8 | 8 | 8 | 8 |
| S03 | – | 8 | 8 | 8 | 8 |
| S04 | – | 8 | 8 | 8 | 8 |
| S05 | – | 8 | 8 | 8 | 8 |
| S06 | – | 8 | 8 | 8 | 8 |
| S07 | – | 8 | 8 | 8 | 8 |
| S08 | – | 8 | 8 | 8 | 8 |

Fixes this round: S03 is close on the ring and pulls back on the collapse; S07 is closer and more top-down, with a bigger heading;
S05 is closer; S02 has bigger pills and a truck right across the header.
A regression (the camera cropped the H1 at its b10 landing) was fixed and checked at 4.5, 5.0 and 5.9 s.

Still open, for the animatic: the camera speed between regions (it may whip), the hold time on each payoff, and sync with the track.

## Reference and re-score (after video.twimg.com opened)
`refs/grammar.md` now holds the video analysis: no hard cuts in 47 s, a 72/144 BPM pulse in A minor, and a breath around the first third.
Changes: the score was rewritten at 144 BPM in A minor (i–VI–III–VII) with a breakdown at 11.7–16.7 s. The designed cut at S05 became a continuous
camera move (the reference has no cuts), so the camera now runs one closed circuit. Shots were retimed to the new bars, and `tools/beats.py` now keeps the edge beats (73 beats, all within 50 ms).

## Gate 3: animatic (960×540, track + measured grid)
Reviewed from 0.1 s filmstrips around every transition.

### Round 1
| Hook | Read 360 | Motion | Compo | Depth | Sync | Polish |
|---|---|---|---|---|---|---|
| 7 | 8 | 7 | 8 | 8 | 7 | 7 |

1. The full hook line held for only about 0.3 s before the camera left.
2. About 0.4 s of empty green between S06 and S07 (the figures panels left before the floor arrived).
3. The S02 pills landed before the camera arrived (timed to b4–b8 while the camera reached the page at b5).

### Round 2
| Hook | Read 360 | Motion | Compo | Depth | Sync | Polish |
|---|---|---|---|---|---|---|
| 8 | 8 | 8 | 8 | 8 | 8 | 8 |

Fixes: the hook holds until b5 and travels on b5–b6; the S07 crane arrives 0.18 s earlier; the S02 pills land on eighths from b6.
