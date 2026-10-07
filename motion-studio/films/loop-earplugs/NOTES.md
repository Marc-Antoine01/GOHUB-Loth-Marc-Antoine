# Loop earplugs: review log

Scores per pass (contact sheet, one frame per beat, phone width). Axes: hook · readability · motion · variety · brand · sound sync.

## Pass 1 (silent, stills)
Hook 7 · readability 6 · motion 6 · variety 8 · brand 8 · sound n/a
Fixes: (1) the floor reflection was flipped around its top edge and drew a dark ghost behind every product → flip about its centre;
(2) headlines collided with the product (S01, S02) → 132 px headlines, product moved to x 1460; (3) the sound line was invisible
at phone width → 4.5 px stroke, 95 px amplitude. Also: logo moved from B72 to B71 (the track's hat drop), wheel ends a beat later
so the black gap before the logo is one beat, not three.

## Pass 2 (with sound.mjs)
Hook 8 · readability 7 · motion 7 · variety 8 · brand 8 · sound 8
Fixes: (1) S01 "situation." still touched the product → product at x 1530, 640 px; (2) Kids colour pops started at 55 % scale and read
as a glitch on the beat frame → start at 80 %; (3) wheel back half too bright and busy → depth brightness ^2.2, blur 7 px.

## Pass 3
Hook 8 · readability 8 · motion 8 · variety 8 · brand 8 · sound 8 → full render.
Open points for the client: Loop's own typeface (Inter Tight stands in), and approval of the end line (the site's meta description).

## v2: 3D (client feedback: "too cheap", wants Apple-style movement in space, more close-ups and 360°, no shine overlay)
The 2D cutouts are replaced by real-time 3D models (loop3d.js, three.js) built from the shop photos: one continuous moulded
body (ring + neck, the "9" silhouette) and a silicone dome tip; finishes as physical materials. The fake specular streak and
the waveform graphic are gone; reflections come from the studio environment and lights only.
Pass 1 → Hook 7 · readability 6 · motion 7 · variety 8 · brand 7 · sound 8. Fixes: Switch lens rendered as a flat white
disc → smoked glass; carousel crowded and clipped → deep ellipse, smaller scale; products framed too big, touching the type → cameras pulled back.
Purity check caught the dial rotation leaking between frames → reset every frame.
Pass 2 → Hook 8 · readability 8 · motion 8 · variety 9 · brand 8 · sound 8. Fixes: label hidden on dial macros, Quiet trio and Engage pair spread out,
air on the 360° turn. Full render.
