# Animation guide: Formations au CHUV

Every contributor (me or a subagent) codes to this guide. If a shot needs something the guide doesn't cover, add it here first.

## Contract (from motion-studio/CLAUDE.md, enforced by render.mjs)
- `window.seek(t)` paints frame t from t alone. No timers, no rAF, no CSS transitions or animations, no `Math.random`
  (use `M.mulberry32(seed)` / `M.noise1(seed, x)`), and no state carried between frames.
- Render: `node render.mjs films/chuv-formations [--sheet]`. Contact sheets are the review tool.

## Files
```
index.html           stage, fonts, styles, loads engine.js then shots/*.js, defines seek()
engine.js            world + camera + components + timing helpers (shared, owned by the director)
shots/s01-hook.js    one file per shot, registers itself: SHOT({ id, bars: [a, b], build(world), draw(lt, t) })
...                  s02-page, s03-categories, s04-path, s05-knowhow, s06-figures, s07-online, s08-offer
```
A shot file never touches another shot's elements, and only `engine.js` writes the camera.

## Units and space
- Stage 1920×1080 CSS px. World units are CSS px. **x** right, **y** down, **z** toward the viewer (CSS convention).
- The camera is a pose `{ x, y, z, yaw, pitch, roll, focus }`. `focus` is the distance to the sharp plane.
  Perspective `P = 1400` px: a plane at distance P from the camera renders at scale 1.
- Each shot owns a **region** of the world and builds its planes there (`world.region(id)` returns its origin).
  The camera travels between regions; that travel is the transition.
- Camera keys live in `engine.js → CAMERA`, as one list `[time, pose]` for the whole film, eased per segment
  (`inOutCubic` by default, `outExpo` for arrivals). The pose at t=30 equals the pose at t=0 (loop).

## Timing
- Use beats, never raw seconds: `B(i)` is the measured time of beat i (beats.json); `bar(n) = B(4n)`.
- Arrivals **land on** a beat: they start before it (`land - dur`) and settle on it. Nothing important starts on the beat and lands later.
- Local time inside a shot: `lt = t - bar(shot.bars[0])`.

## Components (engine.js; build only from these)
| Component | Look (site styles) |
|---|---|
| `panel({ w, h, tone })` | frosted glass: tone `mint` (#B8F9E5, 88 %) or `white` (92 %), radius 28, hairline inner edge, long soft shadow toward bottom left |
| `row(label)` | the site's list row: white, radius 6, Atlas 44 px, the → arrow at the right |
| `pill(label, { active })` | nav pill: 2 px border in the text colour, radius 8; active = filled #6EFC8A, black text |
| `button(label)` | primary button: #006144, white Atlas, radius 6 |
| `heading(text, size)` | Sharp Grotesk 400, tracking −0.025em |
| `skeleton(w, lines)` | grey bars for satellite bodies (reference grammar), never fake words |
| `photoMask(src, shape)` | a photo inside a card, pill or circle; `object-fit: cover`; never a full-frame plate |

Sizes are designed at **2× and scaled 0.5** on the plane, so text stays sharp when the camera pushes in.

## Depth of field and fog
`engine.js` computes each plane's camera-space depth every frame:
`blur = clamp(|depth − focus| × 0.006, 0, 14) px`, plus a fog tint (`brightness(1 − 0.25 × farness)`). Shots never set
`filter` themselves; they choose `focus` through the camera keys.

## Motion vocabulary (style_guide.md)
- Entrances: mask reveals (`clip-path inset`), slides along the plane's axis, rotate-in from edge-on. Never an opacity fade as the entrance.
- Springs: `M.spring(t, 2.2, 0.55)` for UI and `M.spring(t, 1.8, 0.7)` for type. Easings come from `M.ease`.
- One payoff per shot, on the beat the shot list names.

## Review
Every shot: render 3–5 stills (`--sheet` frames on its beats). Score 1–10 on hook, readability at 360 px wide, motion,
composition, depth, sound sync and polish. Log the scores and the 3 biggest problems in docs/review_log.md, fix, and repeat until all scores are 8+ (at least 3 rounds).
