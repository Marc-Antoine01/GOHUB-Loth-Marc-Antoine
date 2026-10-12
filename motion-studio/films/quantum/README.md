# "Faster, Stronger, Computer.": 30 s, 16:9, 2D motion design

The quantum world (superposition, entanglement, the qubit), then what quantum computers do with it
(simulate molecules, optimize, secure tomorrow). It promotes quantum computing itself: no logo, no brand. All copy is in English.

## Deliverables (`out/`, regenerated, not committed)
`final.mp4` (1920×1080, 30 fps, H.264 CRF 16, AAC, −14 LUFS) · `loop_check.mp4` (last 2 s, then first 2 s) · `poster.png` · `contact.png`

## Rebuild
```bash
cd motion-studio
node films/quantum/music.mjs                       # original 128 BPM score -> audio/track.wav
node render.mjs films/quantum --sound              # beats (full-spectrum grid), SFX, -14 LUFS
node render.mjs films/quantum --sheet              # stills review
node render.mjs films/quantum --format animatic    # 960×540
node render.mjs films/quantum --format final       # 1920×1080
```

## Design
- The IBM design language as a style only: IBM Plex Sans and Mono (SIL OFL, `assets/fonts/`), Carbon colour tokens, the 16-column grid shown as a dot grid. No IBM marks.
- Camera and transitions follow the whatships "Eazo" film (`refs/grammar.md`): a locked-off frontal lens with slow push-ins, word-by-word builds, and stacked-bar wipes.
- Music: an original score in the spirit of "circles!" by nekodex (the client's reference, which could not be fetched and needs a licence for promotional use).
- Docs: `docs/style_guide.md`, `docs/shotlist.md`, `docs/ANIMATION_GUIDE.md`, `docs/review_log.md`.
- Budget: no API used, so the cost is $0.
