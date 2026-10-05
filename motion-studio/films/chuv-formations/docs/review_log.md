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
