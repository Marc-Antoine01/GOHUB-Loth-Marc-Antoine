# Style guide: Formations au CHUV (30 s, 16:9, loop)

**Promise:** the CHUV trains people at every level, from apprenticeship to MD-PhD. Its know-how is passed on, and the teaching is recognised.

**Reference:** `refs/grammar.md`, read from the whatships poster frame. The video itself is still blocked (video.twimg.com),
so the edit rhythm comes from our own score, not from the reference.

## Palette: the Formation colorway of chuv.ch

| Role | Hex | Use |
|---|---|---|
| Space (ground) | `#006144` forest green | the world the camera travels through |
| Surface | `#B8F9E5` mint, `#FFFFFF` | UI planes: rows, cards, panels |
| Accent (only one) | `#6EFC8A` signal green | the active pill, focus states, one word per shot, the progress line |
| Text | `#FFFFFF` on green, `#212121` on mint and white | |
| Depth tint | `#004A34` (forest −20 %) | far planes recede into this; it is fog, not a new color |

Lilac `#C996F1` exists on the site but stays out of the film (one accent).

## Type

- **Display:** Sharp Grotesk 400, tight tracking (−0.025em). Headlines, numbers, the hook.
- **UI:** Atlas Grotesk 400. Rows, buttons, labels: exactly as the site sets them.
- **Sizes at 1920×1080:** key line ≥ 120 px, numbers ≥ 260 px, UI rows ≥ 44 px, nothing under 40 px.
  At 360 px wide (the review size) that gives ≥ 22 px for key lines and ≥ 7.5 px for UI rows: UI rows are texture, so the message never rides on them alone.
- All copy is verbatim from the site (assets/ASSETS.md), the hook included: the client chose the site's own line as the slogan.

## UI, not photos

The page is rebuilt as **live UI built from the site's own styles**: rows with the arrow, the green button, the active nav pill,
the category headings, the mint bands. These are real components with real copy, not screenshots and not invented UI.
Photos only appear *inside* components: masked into a row, a card, a pill or a circle, cropped, never full frame and never a straight cut to a photo.

## Material (from the reference)
- Panels are frosted glass: mint `#B8F9E5` or white at 82–92 % opacity, `backdrop-filter: blur(18px)`, radius 28 px, a hairline inner edge (white at 40 %), and a long soft shadow toward the bottom left.
- One hero panel per shot is sharp and carries readable copy. Satellites are smaller, cropped by the frame, defocused, and keep only their real heading plus skeleton bars.
- Light: a soft radial key, top right, on the green space (`#0B7352` falling to `#004A34`). It is texture, never a backdrop for a centered title.

## Camera: a continuous move through space

- One **3D world**, one camera, no hard cuts except one designed cut at the act break. Planes sit at real depths (z from −4000 to +600).
- Moves: dolly through type, truck past rows, orbit around a cluster, crane up to reveal the layout, pull back to the loop point.
- Every move is eased; nothing moves at constant speed except the slow drift between beats (≤ 2 % of the frame per second).
- Depth cues: the scale falls off with z, far planes tint toward `#004A34`, and planes near the lens get a slight blur (CSS `filter: blur`, by distance, deterministic).
- **Loop:** the final camera pose equals the first one, and the last frame holds the empty space that the hook's first word enters.

## Motion vocabulary

- Entrances: masks, slides along the plane's own axis, and planes rotating into the camera from edge-on. No fades as entrances.
- Springs for arrivals (light damping on UI, heavier on type). Per-letter or per-word staggers only on the hook.
- One payoff every 3 to 5 s: something lands, locks, counts or links.

## Banned

Centered title on a gradient · everything fading in · corner labels and frame borders · glow on UI chrome · generic particle bursts ·
lens flares · stock "data" HUD · a photo used as a background plate · Ken Burns on a full-frame photo · any figure that is not on chuv.ch.

## Sound

`audio/track.wav` is used unchanged; beats are measured with `tools/beats.py`. SFX are synthesized and sit under the track:
air on camera moves, ticks on row passes, one click on the button. They land on measured beats or on their subdivisions.
Loudness of the final mix: −14 LUFS integrated.
