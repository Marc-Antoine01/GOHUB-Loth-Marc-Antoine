# Style guide: Loop earplugs, "presented like an Apple product launch" (30 s, 16:9)

**Promise:** a Loop earplug for every situation. Earplugs shown as a new technology: precise, sculpted, premium.

**Status:** draft. loopearplugs.com, its Shopify CDN and YouTube are blocked in this session, so the brand values below
(logo, typeface, colours, product names and noise-reduction figures) are placeholders. They are replaced by the
site's own values in `assets/ASSETS.md` before any still is built. No figure goes on screen unless it is published on loopearplugs.com.

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

## Product, not illustration
- Products come from the shop's own photos (transparent or studio-white backgrounds, keyed). No redrawn earplugs.
- **360°:** turntables built from the shop's multi-angle photos, or from a single angle with a controlled rotateY plus specular sweep
  where only one angle exists (stated per shot in the shot list).
- **Macro:** extreme scale-ups on the ring, the filter and the switch, with shallow depth of field (blur by depth).
- **Light:** a soft key from top left, a moving specular streak across the product on each beat, and a reflection on the floor.

## Camera and edit
- Slow orbits and push-ins on the product; **match cuts** between products on a shared shape (the ring), position and scale on the cut beat.
- **Product wheel:** the eight earplugs on a carousel ring turning in depth, one name landing per beat (the grammar of the AirPods Max colour wheel).

## Sound
- `audio/track.wav` unchanged, beats measured with `tools/beats.py`.
- **Noise-reduction demonstrations:** each use case has an ambience (crowd, city, snoring, office, playground) that is
  low-pass filtered and lowered when the earplug "goes in". The amount follows the product's published dB figure, and the change lands on a beat.
- −14 LUFS for the final mix.

## Banned
Apple marks or typefaces · invented specs or figures · redrawn products · glow on UI chrome · particle bursts ·
a centred title on a gradient · everything fading in.
