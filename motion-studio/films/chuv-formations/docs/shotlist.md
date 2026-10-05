# Shot list: Formations au CHUV, 30 s, 1920×1080 @ 30 fps (900 frames)

**Score:** `audio/track.wav`, 120 BPM, G major, 15 bars of 2 s. It is our own composition (`music.mjs`), in the style the client asked for:
corporate UI, rhythmic, inspiring. `beats.json` is measured from it by `tools/beats.py`: 60 beats, all within 48 ms of the grid.
Each shot starts on a bar line; `b` = beat index in beats.json, frame = beat × 15.

**Slogan:** the client keeps the CHUV's own line: **"Au cœur de nombreux réseaux nationaux et internationaux"** (page intro, verbatim).

One continuous 3D world: forest-green space, frosted mint and white panels (refs/grammar.md), signal green `#6EFC8A` as the only accent.

| # | Bars · time · frames | Music | Camera | On screen (verbatim) | Payoff | SFX |
|---|---|---|---|---|---|---|
| **S01 Hook** | bar 0 · 0:00–0:02 · 0–59 | impact, kick on every beat, bright plucks | Fast dolly forward through four type planes, then a settle | "Au cœur de" (b0) · "nombreux réseaux" (b1) · "nationaux et" (b2) · "internationaux" (b3, signal green). Frame 0: "Au cœur de" already entering | "internationaux" lands square to the lens on b3; the four lines hold together for the second half-beat | air push per group, low hit on b0 |
| **S02 The page builds** | bars 1–2 · 0:02–0:06 · 60–179 | groove starts, 8th bass | Trucks right and cranes down while the header assembles around the lens | Nav pills: Offre en soins · Pratique · **Formation** · Recherche et innovation · Départements et services; then the H1 **Formations au CHUV** | b9 (4.5 s): "Formation" switches to active green as the camera passes it | pill ticks on b4–b8, click on b9 |
| **S03 Categories** | bars 3–4 · 0:06–0:10 · 180–299 | claps come in | Orbits a ring of 7 frosted category panels (60° of arc); satellites defocused | Professions médicales universitaires · Soins · Administration · Médico-technique et thérapeutique · Psycho-social · Logistique · Management et cadres | b18 (9 s): the ring collapses into the site's two-column grid, flat to the lens | whoosh per panel at front, lock thud on b18 |
| **S04 The path** | bars 5–6 · 0:10–0:14 · 300–419 | 16th plucks, riser, breath at 13.5 s | Dollies along a vertical step list (the reference's "Working" grammar). Each step lights as the lens passes | Apprentissage ASSC → Bachelor HES → Pré-grade: Master → Formations postgraduées de spécialiste → **Ecole doctorale: MD, MD-PhD** | b26 (13 s): the last step locks in its green pill and fills the frame; silence at 13.5 | tick per step on b20, 22, 24, 26 |
| **S05 Know-how** | bars 7–8 · 0:14–0:18 · 420–539 | **drop**: keys, bell motif | **Designed cut** on the drop (b28), then a slow push and a 90° turn around a tall card | The simulation photo masked into a frosted card with the row arrow; line: "apprendre et progresser professionnellement" | b34 (17 s): the card turns and its back shows the apprentices photo inside a pill-shaped mask | impact on b28, turn whoosh at b33 |
| **S06 Figures** | bars 9–10 · 0:18–0:22 · 540–659 | chorus continues, bell motif again | Trucks left past three number panels at staggered depths, racking focus | **260+** apprenti·es · **30** métiers · **13 000** collaboratrices et collaborateurs | Each number counts up and lands: b37 (18.5 s), b39 (19.5 s), b42 (21 s) | counter ticks, one hit per landing |
| **S07 Online** | bars 11–12 · 0:22–0:26 · 660–779 | half-time lift, riser into bar 13 | Cranes up to a top-down view, echoing the e-learning photo (people linked by lines) | "Formation en ligne" · "Apprendre grâce à nos cours, conférences et vidéos en ligne"; coloured links draw between the panels seen so far | b50 (25 s): the links close into one network | string rise, tick per link |
| **S08 Offer + loop** | bars 13–14 · 0:26–0:30 · 780–899 | outro: groove, bell, fill into the loop | Pulls back and descends to S01's exact pose | Logo (white) · button **Voir les offres de formation** (forest green, as on the site) · chuv.ch › Formation | b58 (29 s): the button presses; the last frames open the space where "Au cœur de" enters | button click, air gathering into frame 0 |

## Pacing check
Payoffs land at 1.5, 4.5, 9, 13, 14 (drop), 17, 18.5, 19.5, 21, 25 and 29 s: never more than 4 s apart.

## Loop rule
Camera pose at frame 899 = pose at frame 0. The score's last bar (D) resolves into bar 0 (G), and its fill lands on frame 0.
`out/loop_check.mp4` = the last 2 s and then the first 2 s, back to back.
