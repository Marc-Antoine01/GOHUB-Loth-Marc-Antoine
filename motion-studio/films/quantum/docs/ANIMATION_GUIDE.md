# Animation guide: "Faster, Stronger, Computer."

Read this first. Every shot file follows it; if a shot needs something new, add it here first.

## Contract (motion-studio/CLAUDE.md, enforced by render.mjs)
`seek(t)` repaints the whole canvas from t alone. No timers, no rAF, no `Math.random` (use `M.mulberry32(seed)` created inside the draw call),
and nothing remembered between frames.

## Files
```
index.html        canvas, fonts, the engine (E), the scene table and seek()
shots/sNN-*.js    SHOT({ id, from, to, draw(g, t, lt) }): draws one scene; from/to are times in s
```
A shot draws its own field and content. The engine draws the bar wipes on top. Only the engine touches the camera.

## Canvas and grid
- Author at 1920×1080. The context is pre-scaled for other formats (the 960×540 animatic).
- IBM 2× grid: 16 columns, 120 px margins, gutter 0; `E.col(n)` = x of column n (0–16). Snap to 8 px.
- Text is **left-aligned on column 1** (x = 120) unless the shot says otherwise. Never centred titles.

## Palette (Carbon tokens, `E.C`)
`ink #161616` · `paper #F4F4F4` · `white` · `blue #0F62FE` (accent) · `cyan #82CFFF` · `blue40 #78A9FF` · `purple #8A3FFC` · `purple40 #BE95FF` · `magenta #EE5396` (only for "risk") · `gray50 #8D8D8D` · `gray30 #C6C6C6` · `gray80 #393939`.
On dark fields the accent is `cyan`; on light fields it is `blue`.

## Type (`E.words`, `E.mono`)
- Display: IBM Plex Sans Light 300, with the accent word in SemiBold 600; tracking −1 % (`letterSpacing`). Sizes: 128 (hero), 96, 72.
- Mono: IBM Plex Mono 400, 34 px, `gray50`. Typed one character per frame, from a start time.
- **Word build** (the reference grammar): each word is clipped to its line box and rises from below the baseline while it sharpens
  (blur 10 px → 0), landing on its beat: start = land − 0.2 s, settled at land + 0.12 s. **No opacity fades as entrances.**

## Timing
`E.B(i)` = measured beat i (`beats.json`); `E.bar(n)` = B(4n). Beat ≈ 0.469 s, bar ≈ 1.875 s. Things **land on** beats.

## Camera (the reference: locked-off and frontal)
`E.push(g, lt, focus, amount)`: a slow push-in, scaling around a focus point from 1 to 1 + amount (0.03–0.06) over the shot.
Snap zooms only where the shot list says so.

## Transitions (`E.wipe`)
Stacked horizontal bars (6 by default) sweep across, staggered by 40 ms, covering the frame in 0.25 s and uncovering it in 0.25 s.
The scenes switch at full cover, which is the transition's beat. The bars are `blue` plus the colour of the next field.

## Drawing style
Strokes 2 px (`gray80` on light, `gray30` on dark), qubits are discs with a 2 px ring, and the background dot grid has an 8 px period at low contrast.
No glow, no gradients behind type, no particles flying out.
