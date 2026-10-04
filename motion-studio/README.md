# motion-studio

Headless-browser motion pipeline: HTML/Canvas → Playwright frames → ffmpeg video, with Python (librosa) for audio analysis.

## Setup

```bash
# Runtime: Node 22+, ffmpeg, Python 3
brew install node ffmpeg python        # macOS; apt install on Linux
npm run setup                          # pip install -r requirements.txt && npm install
npx playwright install chromium
npm run smoke                          # renders out/smoke/smoke.mp4 and checks librosa
```

If Playwright can't download its browser (e.g. a sandbox with a preinstalled Chromium), set
`CHROMIUM_PATH=/path/to/chrome` before `npm run smoke`.

## Skills and plugins

- **Remotion** and **HyperFrames** skills are vendored in `.agents/skills/` (symlinked into `.claude/skills/`, pinned in `skills-lock.json`).
  Refresh with `npx skills add remotion-dev/skills` / `npx skills add heygen-com/hyperframes`.
- **claude-animation** (hand-drawn look) is declared in `.claude/settings.json`; Claude Code offers to install it when you trust this folder.
  Manual install: `claude plugin marketplace add buildwithhanif/claude-animation-skill && claude plugin install claude-animation@claude-animation-skill`.

Start Claude Code here with `claude --model claude-opus-5-5`, then use `/model` to set effort (xhigh for one-shots, max for flagship pieces).
