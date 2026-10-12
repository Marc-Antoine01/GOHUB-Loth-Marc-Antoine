# SUPERPOSITION: style guide

A 30 s reel about quantum computing, built as a motion designer's showreel: every shot shows a different craft
(particles as data, kinetic type, 3D materials, camera, data visualisation, match cuts, sound design), and they share
one world and one idea, so it reads as a single piece, not a sampler.

## Idea
**Everything starts as one point and ends as one point.** A single particle opens the film; it takes both paths,
becomes a qubit, is entangled with another, is cooled in the machine, joins 256 possible answers, and collapses back
into one point: the answer. The last frame is the first frame, so the reel loops.

## Palette (one accent)
| Token | Hex | Use |
|---|---|---|
| void | `#07070A` | the world (never pure black: it keeps the grain visible) |
| fog | `#14141A` | depth fog, far planes |
| bone | `#EDEBE6` | type, lines, particle hits |
| ash | `#8B8A86` | secondary type, guides |
| **gold** | `#E8B04B` | the accent: the particle, the qubit's state, the machine, the right answer |

Gold carries the story: whatever is gold is the quantum thing we follow. Nothing else is coloured.

## Type
- **Display: Instrument Serif** (regular and italic), set big and tight. An editorial serif against a technical subject is the signature.
- **UI: JetBrains Mono** 400/500, small, tracked +2 %, always attached to an object (a readout next to the thing it measures). No corner labels.
- Rule of thumb: one serif statement per shot, at most one mono readout.

## Motion
- Eases: expo-out for arrivals, cubic in-out for camera, springs only for physical things (the vector, the bars).
- The camera always moves: dolly, arc, orbit, crane, push. Never a static frame for more than a beat.
- Cuts land on the beat; the big moves land on the downbeat; one half-beat of silence before each drop.
- Transitions are **match cuts on the point**: the particle becomes the vector's tip, the tip becomes the chip, the chip
  becomes the field, the field collapses to the point.

## Rendering
- three.js (WebGL, rendered frame by frame from t), DOM type over it for crisp text.
- Gold is a real PBR metal lit by a studio environment; the qubit shell is a fresnel glass shader; the hits are additive points.
- Film grain (seeded, per frame) and a soft vignette over everything; a light bloom on emissive gold only (no glow on type or UI).

## Banned (studio rules)
Centred title on a gradient, everything fading in, corner labels and frame borders, glow on UI chrome, generic particle
bursts (the particles here are detections that build a measured pattern), more than one accent.
