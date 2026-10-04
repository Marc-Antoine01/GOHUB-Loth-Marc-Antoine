# Motion studio rules

## Render contract
- Every film is a pure function of time: `window.seek(t)` paints frame t.
- No CSS transitions, no setTimeout, no requestAnimationFrame in render mode,
  no state carried between frames. Seeded noise only (mulberry32), never Math.random.
- Render with `node render.mjs`, encode H.264 yuv420p, CRF 16.

## Look
- Banned defaults: centered title on gradient, everything fading in,
  corner labels and frame borders, glow on UI chrome, generic particle bursts.
- One display face, one UI face. One accent color unless the brief says otherwise.
- Every 2 to 4 seconds something new must happen on screen.

## Sound
- Score and SFX are synthesized in code unless a track is supplied.
- Place hits on the measured beat grid (beats.json). Loudness -14 LUFS.

## Loop before you show me anything
1. Render one frame per beat as a contact sheet and LOOK at it.
2. Score it 1-10 on: hook in first 2s, readability at phone size,
   motion quality, variety, brand accuracy, sound sync.
3. Fix the 3 worst problems. Repeat until every score is 8+.
4. Only then do the full render.

---

## How the tooling maps to the rules

A film lives in `films/<name>/`:

| File | Purpose |
|---|---|
| `film.json` | `{ "duration": s, "fps": 30, "width": 1080, "height": 1920 }` (even width/height), or `"formats": { "9x16": [1080, 1920], "1x1": [1080, 1080] }` for one timeline on several canvases; the page reads `FILM.format`. |
| `index.html` | Defines `window.seek(t)`; may `await` inside it. Optional `window.ready` promise for setup. Include `/lib/runtime.js` for `M.mulberry32`, `M.noise1`, `M.range`, easings, `M.spring`. |
| `sound.mjs` | Optional. `export function score(ctx)` → bus (the bed); `export function sfx(ctx)` → bus, with `ctx.beats` from beats.json. Build voices with `ctx.synth` (`lib/synth.mjs`). |
| `track.{wav,mp3,m4a,flac}` | A supplied track. Replaces `score()`; beats are measured from it. |

The server injects `window.FILM` (from film.json) and `window.BEATS` (from beats.json) into the page. Films read them and never fetch them.

Commands (run from `motion-studio/`):

- `node render.mjs films/<name> --sound`: builds the score, measures `beats.json` with librosa, places the SFX, and mixes to -14 LUFS.
- `node render.mjs films/<name> --sheet`: writes contact sheets to `out/sheet-NN.png`, with one frame per beat plus t=0. Thumbnails are 390 CSS px wide (phone width), so reading the sheet is the phone-readability check. Also re-renders frames out of order and fails if any frame depends on history.
- `--format <name>` picks one canvas (default: the first), and `--format all` renders every format from one mix.
- `node render.mjs films/<name>`: full render to `out/<name>.mp4`. H.264 yuv420p, CRF 16, AAC; integrated loudness is verified after muxing.
- `node render.mjs --serve`: opens a preview at http://127.0.0.1:4173/films/<name>/. Space plays or pauses (with audio), arrow keys step one frame, and `?t=2.5` freezes on that time.

What fails a render: any call to `setTimeout`, `setInterval`, `requestAnimationFrame`, `Math.random` or `Element.animate`; any element with a CSS transition or animation; a page error; or a non-deterministic frame.

The tooling can't check the **Look** rules or the scores. Score them by reading the sheet with the Read tool, and write the scores and the three fixes into `films/<name>/NOTES.md` on each pass.

`npm test` runs the pipeline on `tests/` fixtures. The fixtures are tooling tests, not films.
