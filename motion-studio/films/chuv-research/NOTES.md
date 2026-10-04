# Review loop: La recherche au CHUV

Each pass: `node render.mjs films/chuv-research --sheet` (one frame per measured beat + t=0, at phone width), read, score, fix the 3 worst.

| Pass | Hook 2s | Phone readability | Motion | Variety | Brand | Sound sync |
|---|---|---|---|---|---|---|
| 1 | 5 | 5 | 6 | 7 | 8 | 7 |
| 2 | 7 | 7 | 7 | 6 | 8 | 7 |
| 3 | 8 | 7 | 7 | 8 | 8 | 8 |
| 4 | 8 | 8 | 8 | 8 | 8 | 8 |

## Fixes per pass
1. Frame 0 was empty (first word now already slamming at t=0). Feature UI text was ~15 px on a 1080 frame (cameras pushed in to ~1.9x). "Accompagner" overflowed and captions overlapped across cuts (verbs fit to column, exits finish before entries). Also fixed: NaN transform made the URL show early; staircase clipped "Chaque"; 800 spilled off frame.
2. Feature panel too tall for landscape UI (9:16 panel 960×900); trials title cut (camera widens on the result). Things started on beats instead of landing on them (label, card, CTA, logo now land on the beat). Every feature entered the same way (swing / rise / zoom).
3. News cards were jammed at the bottom of the capture (recaptured with the section at the top). Page assembly sat empty for a second (header lands right on the cut, punch-in on the title at 5.5 s). Lockup half empty (photo bookend from the hook), service/feature panels overlapping at 6.0 s.
4. CTA pill overflowed the frame (label fits to width); cursor covered "CHUV". SFX resynced to the new assembly beats. 16:9: captions under the panel, card overshooting onto the numeral, empty right half on the lockup.

## Known limits
- I can't listen to the mix. Sync is checked on the timeline (every visual hit and SFX is placed on a beats.json index), and loudness is measured at -14 LUFS.
- Look rules checked by eye: no gradient title, no fade-ins (masks, wipes, springs only), no corner labels or frame borders, no glow, no particles; Sharp Grotesk + Atlas Grotesk; cyan is the only accent.
