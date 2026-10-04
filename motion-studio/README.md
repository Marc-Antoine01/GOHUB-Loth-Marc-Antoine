# motion-studio

Headless-browser motion pipeline: each film is an HTML page whose `window.seek(t)` paints frame t. Playwright captures frames, ffmpeg encodes them, librosa measures the beat grid, and the score and SFX are synthesized in code.

## Setup

```bash
# Runtime: Node 22+, ffmpeg, Python 3
brew install node ffmpeg python        # macOS; apt install on Linux
npm run setup                          # pip install -r requirements.txt && npm install
npx playwright install chromium
npm test                               # renders a fixture end to end and checks contract violations fail
```

If Playwright can't download its browser (e.g. a sandbox with a preinstalled Chromium), set
`CHROMIUM_PATH=/path/to/chrome` before `node render.mjs` / `npm test`.

## Making a film

Studio rules and the render workflow are in [`CLAUDE.md`](CLAUDE.md). In short:

```bash
node render.mjs films/<name> --sound   # synth score -> beats.json -> SFX -> -14 LUFS
node render.mjs films/<name> --sheet   # contact sheet, one frame per beat, at phone width
node render.mjs films/<name>           # full render: H.264 yuv420p CRF 16
node render.mjs --serve                # preview at http://127.0.0.1:4173/films/<name>/
```

## Skills and plugins

- **Remotion** and **HyperFrames** skills are vendored in `.agents/skills/` (symlinked into `.claude/skills/`, pinned in `skills-lock.json`).
  Refresh with `npx skills add remotion-dev/skills` / `npx skills add heygen-com/hyperframes`.
- **claude-animation** (hand-drawn look) is declared in `.claude/settings.json`; Claude Code offers to install it when you trust this folder.
  Manual install: `claude plugin marketplace add buildwithhanif/claude-animation-skill && claude plugin install claude-animation@claude-animation-skill`.

Start Claude Code here with `claude --model claude-opus-5-5`, then use `/model` to set effort (xhigh for one-shots, max for flagship pieces).
