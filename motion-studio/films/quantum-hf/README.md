# Faster, Stronger, Computer. — HyperFrames version

The HyperFrames port of `films/quantum` (v3): the same 45 s, 1920×1080 film, rebuilt as a HyperFrames composition so it can be
previewed, edited and rendered with the HyperFrames CLI and Studio.

## Layout
| Path | What |
|---|---|
| `index.html` | Host composition (45 s). Track 1: the ten scenes, cut on the beat. Track 2: the bar wipes. Tracks 3–4: score and SFX. |
| `compositions/s01-hook.html` … `s10-end.html` | One sub-composition per scene. The text is plain markup at the top of each file; the graphics are a canvas repainted from film time by the scene's GSAP timeline. |
| `compositions/transitions.html` | All the stacked-bar wipes, one `.wipe` line each (`data-at`, `data-dir`, `data-colors`). |
| `assets/quantum.js` | Shared engine: the beat grid, the Carbon colours, the word / caption builders, the push-in, the Bloch sphere. |
| `assets/vendor/gsap.min.js` | GSAP 3.14.2, vendored so renders need no network. |
| `assets/fonts/` | IBM Plex Sans 300/400/600 and Plex Mono 400 (SIL OFL, licence included). |
| `audio/score.m4a`, `audio/sfx.m4a` | The original score and the SFX, gain-matched so together they measure −14 LUFS. |

## Editing
- **Words:** edit the text inside a `.words` span. Its landing time is `data-beat` (a beat of the 128 BPM grid) plus `data-offset` in seconds, or `data-at` in seconds; `class="accent"` sets the accent weight and colour.
- **Captions:** the `.mono` lines type at 48 characters a second from their beat; `data-highlight` colours a phrase magenta.
- **Scene length or order:** the hosts in `index.html` (`data-start`, `data-duration`). The cuts sit under the wipes in `transitions.html`; move both together.
- **Sound:** `data-volume` on the two `<audio>` tracks. To change the music itself, edit `films/quantum/music.mjs` / `sound.mjs`, then re-export the stems.

## Commands (from this folder)
```bash
npx hyperframes@0.8.149 check                       # lint, runtime, layout, motion, contrast
npx hyperframes@0.8.149 preview                     # Studio
npx hyperframes@0.8.149 snapshot --at 2.6,12.7,40.8 --against ../quantum/out/final.mp4   # side by side with the canvas film
npx hyperframes@0.8.149 render --fps 30 --crf 16 --output renders/quantum-hf.mp4
```
Keep `HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1` set (studio rule).

## Differences from the canvas film
The timing, layout, colours and sound are the same. The words and captions are now real DOM text, so their antialiasing differs
slightly from the canvas text, and the first word's rise starts at frame 0 instead of 0.1 s before it.
