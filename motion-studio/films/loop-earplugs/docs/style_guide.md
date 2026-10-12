# Style guide: Loop earplugs, "presented like an Apple product launch" (30 s, 16:9)

**Promise:** a Loop earplug for every situation. Earplugs shown as a new technology: precise, sculpted, premium.

**Status:** built. Products, wordmark, names and dB figures are the site's own (see `assets/ASSETS.md`).
Typeface is a stand-in (Inter Tight) until Loop's font is supplied. No figure goes on screen unless it is published on loopearplugs.com.

## Homage, not imitation
The grammar of an Apple product film (black stage, single product, macro light, 360° turns, match cuts, one line of type).
**No Apple logo, name, product, typeface (SF Pro) or wording.** Everything on screen is Loop's: logo, font, colours, product names.

## Palette
- Stage: near-black `#0A0A0A` with a soft studio gradient floor; one white "daylight" section for the product wheel.
- Product colours drive the colour: each earplug's real finish (from the shop photos) is the only colour in its shot.
- Brand accent: Loop's own (to be read from the site CSS).

## Type
- Loop's display face from the site's @font-face (to be captured), one weight for headlines, one for labels.
- One line per shot, ≥ 110 px at 1920 wide; product names ≥ 72 px. Never more than 6 words on screen.

## Product: the shop's own photos, in 2.5D (v3)
- v2's procedural 3D models were not faithful enough (client). v3 uses only Loop's own imagery: the studio cutouts
  (`assets/cut/`) and the 3D scene renders (`assets/scene/`) as close-ups.
- **2.5D turn:** each cutout has a depth map derived from its silhouette (`tools/prep_cutouts.py`: every part of a Loop is a
  rounded tube, so its height across the tube is a half-circle). A shader re-samples the photo along that depth, so a card turns
  about ±14° with real volume while keeping the real materials and reflections. A full 360° is not possible from one photo.
- **No fake shine**, no graphic overlays: the light is the one in Loop's photos.
- **Edit rule:** no shot under 1 s (enforced in `film25d.js`, and checked on the render with `tools/cuts.py`).

## Camera and edit
- Slow orbits and push-ins on the product; **match cuts** between products on a shared shape (the ring), position and scale on the cut beat.
- **Product wheel:** the eight earplugs on a carousel ring turning in depth, one name landing per beat (the grammar of the AirPods Max colour wheel).

## Sound
- **Music:** the client's track "Future Beat" (verclub_music). `audio/track.wav` is an untouched 30 s excerpt (19.89–49.89 s of the source,
  150 ms fade at the very end only). It is 157 BPM; the grid is measured on the full spectrum (`"beatsFull": true`, the kick is sparse).
  The excerpt breathes at 4.0 s (a match-cut point) and ends just before the source's break at 50 s, so the logo lands on the silence.
- **Sound design: organic and powerful, as in Apple's product films** (client's brief). That means real-world textures
  (breath, fabric, silicone squeeze, skin contact, a seal "pop" when the earplug seats, air) instead of digital bleeps.
  Hits have weight: sub-thump plus transient, close-miked and dry, with one big shared reverb only on the reveals. Silence is used as a hit.
  Everything is synthesized from noise, filtered resonances and pitched impacts (no samples), placed on beats.json (`sound.mjs`).
- **Noise-reduction demonstrations:** each use case has an ambience (crowd, city, snoring, office, playground) that is
  low-pass filtered and lowered when the earplug "goes in". The amount follows the product's published dB figure, and the change lands on a beat.
- −14 LUFS for the final mix.

## Banned
Apple marks or typefaces · invented specs or figures · redrawn products · glow on UI chrome · particle bursts ·
a centred title on a gradient · everything fading in.
