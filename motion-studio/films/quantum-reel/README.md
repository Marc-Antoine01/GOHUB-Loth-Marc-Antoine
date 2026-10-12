# SUPERPOSITION: a quantum computing reel (30 s, 16:9, loop)

A showreel piece: one particle takes both paths, becomes a qubit, is entangled, is cooled in the machine, joins 256
possible answers and collapses back into one point (the answer). The last frame is the first, so it loops.

| Shot | Time | Craft on show |
|---|---|---|
| The double slit | 0–8 s | a chase camera that threads the slit; a live ripple-tank interference shader; 18 000 detections building the fringes |
| Title drop | 8–10 s | the fringes snap into a barcode; the word shows through the stripes, in two states that collapse; a dive into the gold tittle |
| The qubit | 10–14 s | a fresnel glass Bloch sphere, the state vector's ribbon trail, live θ/φ readouts, a whip pan |
| Entanglement | 14–18 s | a braided link, a scale reveal (1,203 km, Micius 2017), a split screen where both answer on the same frame |
| The machine | 18–22 s | a procedural dilution refrigerator in PBR gold and silver, a helical crane through five temperature stages, a dive under the chip |
| The search | 22–26 s | Grover's algorithm on 256 bars with the true amplitudes (the oracle's dip, the diffusion's rise, 12 iterations) |
| Collapse | 26–30 s | the answer becomes the opening point; the end card; the loop |

## Deliverables (`out/`, regenerated, not committed)
`final.mp4` (1920×1080, 30 fps, H.264 yuv420p CRF 16, AAC, −14 LUFS) · `loop_check.mp4` (last 2 s, then first 2 s) · `poster.png` · `contact.png`

## Rebuild
```bash
cd motion-studio
node films/quantum-reel/music.mjs                 # audio/track.wav: original score, 120 BPM, A minor
node render.mjs films/quantum-reel --sound        # beats + SFX (sound.mjs) -> -14 LUFS
node render.mjs films/quantum-reel --sheet --format final
node render.mjs films/quantum-reel --format final
```
`CHROMIUM_PATH` must point at a Chromium with WebGL (SwiftShader is fine: about 2.5 s a frame at 1080p).

## Where things are
- `reel.js`: the world (three.js), the camera rigs, the post (bloom on emissives only, a NaN/highlight guard, whip blur, aberration, vignette, grain), the DOM type. Pure in t.
- `music.mjs` (score), `sound.mjs` (SFX on the picture's own event times), `docs/` (style guide, shot list, review log).
- Fonts: Instrument Serif and JetBrains Mono, both SIL OFL (licences in `assets/fonts/`).
