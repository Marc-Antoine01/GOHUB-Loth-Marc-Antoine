# Style guide: "Faster, Stronger, Computer." The quantum world and quantum computers (30 s, 16:9, 2D)

**Promise:** the quantum world (superposition, entanglement, interference) explained in images, then what quantum computers do with it
(simulating molecules, optimisation, and the risks and opportunities for cryptography), with the energy of a product launch film.
**It promotes quantum computing itself, not a brand** (client's decision): no logo, no company name, no product name.
**Language: all English** (client's decision).

## Brand: the IBM design language, not the IBM logo
- Typeface: **IBM Plex Sans** (Light 300 for the display, SemiBold 600 for the accent word) and **IBM Plex Mono** for captions and code.
  Both are open source (SIL OFL, from npm `@ibm/plex-sans` and `@ibm/plex-mono`) and live in `assets/fonts/`.
- Colours from **Carbon** (`@carbon/colors`):

| Role | Token | Hex |
|---|---|---|
| Ink / dark field | Gray 100 | `#161616` |
| Light field | Gray 10 / White | `#F4F4F4` / `#FFFFFF` |
| **Primary accent** | **Blue 60** (IBM Blue) | `#0F62FE` |
| Quantum light | Cyan 30 / Blue 40 | `#82CFFF` / `#78A9FF` |
| Second state (|1⟩) | Purple 60 / 40 | `#8A3FFC` / `#BE95FF` |
| Rare signal | Magenta 50 | `#EE5396` (only for "risk" in the crypto beat) |

- **2× grid** (IBM's layout grid): a 16-column, 1920 px frame with 120 px margins; everything snaps to 8 px.
- **No logo of any kind** (client's decision): the IBM design language is used as a visual style only, with no IBM mark or name anywhere.

## Look
- Flat, precise, technical: thin 1–2 px strokes, circles and Bloch spheres drawn as 2D ellipses, dot grids, wave lines.
- Fields alternate between Gray 100 (the quantum world) and Gray 10 (the computer and the applications), in the reference's chapter-colour grammar.
  Blue 60 is the only saturated colour on a light field.
- Texture: a faint 8 px dot grid on each field (the IBM grid made visible), never noise or grain.

## Camera (from `refs/grammar.md`)
Locked-off and frontal. Slow push-ins of 3–6 % per shot; a snap zoom only into an accent word or a detail.
Transitions are graphic wipes: **stacked bars** (in Blue 60 / Gray 100), a field expanding from a qubit, or an object scaling to fill the frame. At most one hard cut.

## Type rules
- Word-by-word build on beats; one accent word per line (Blue 60 on light, Cyan 30 on dark).
- Display ≥ 120 px; mono captions 32–40 px (`// superposition`, `|ψ⟩ = α|0⟩ + β|1⟩`).
- Science is shown correctly and never sold as magic. No made-up numbers: any figure on screen is
  a definition (2ⁿ states for n qubits) or labelled as illustrative.

## Sound
- Client's reference track: **"circles!" by nekodex**. No source can be reached from this session (Bandcamp, SoundCloud, YouTube and osu! are blocked).
  Its licence also has to be checked: nekodex tracks distributed through osu! are licensed for osu! only, so a promotional film needs the artist's permission or a purchased licence.
  Until a file and its rights are supplied, the animatic runs on an original placeholder score synthesized in code: dynamic electronic,
  bright, with drops and silences used as punctuation.
- SFX: a glassy "ping" for qubits, a granular shimmer for superposition, a stereo tie for entanglement, a whoosh on wipes,
  and a sub-drop on the big reveals. All on the measured beats; −14 LUFS.

## Banned
Centered title on gradient · everything fading in · glow on UI chrome · particle bursts · "Matrix" code rain · the sci-fi blue hologram cliché ·
the IBM logo · claiming quantum computers are faster at everything.
