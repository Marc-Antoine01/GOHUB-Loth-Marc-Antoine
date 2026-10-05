# Formations au CHUV: 30 s, 16:9, loop

Promotes CHUV training: every level from apprenticeship to MD-PhD, know-how passed on, recognised teaching.
Slogan: the site's own line, "Au cœur de nombreux réseaux nationaux et internationaux".

## Deliverables (`out/`, regenerated, not committed)
| File | What |
|---|---|
| `final.mp4` | 1920×1080, 30 fps, H.264 yuv420p CRF 16, AAC, −14 LUFS |
| `loop_check.mp4` | last 2 s then first 2 s, back to back: the seam should be invisible |
| `poster.png` | frame at 1.4 s (the full slogan) |
| `contact.png` | first page of the per-beat contact sheet |

## Rebuild
```bash
cd motion-studio
node films/chuv-formations/music.mjs                      # audio/track.wav (original score, 144 BPM, A minor)
python3 tools/beats.py films/chuv-formations/audio/track.wav films/chuv-formations/beats.json
node render.mjs films/chuv-formations --sound             # track + SFX (sound.mjs) -> -14 LUFS
node render.mjs films/chuv-formations --sheet             # stills review
node render.mjs films/chuv-formations --format animatic   # 960×540
node render.mjs films/chuv-formations --format final      # 1920×1080
```
The fonts (`assets/fonts/`) are git-ignored; fetch them with the research film's `capture.mjs`, or copy them from it.

## Where things are
- `docs/style_guide.md`, `docs/shotlist.md`, `docs/ANIMATION_GUIDE.md`, `docs/review_log.md` (every critique round)
- `refs/grammar.md`: the grammar of the whatships reference (the video itself is git-ignored)
- `engine.js` (world, camera, components, depth of field) · `shots/s01…s08` · `index.html` (camera path)
- `assets/ASSETS.md`: what came from chuv.ch, and the published figures used (260+, 30, 13 000)

## Notes
- No API was used (ElevenLabs and FAL untouched), so the cost is $0.
- The score is original: only the reference's tempo feel, key and energy shape were taken.
