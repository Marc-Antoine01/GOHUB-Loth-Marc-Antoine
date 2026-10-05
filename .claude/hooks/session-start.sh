#!/bin/bash
# Cloud sessions start from a fresh container: install what motion-studio needs to render.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

MS="$CLAUDE_PROJECT_DIR/motion-studio"

# Python audio analysis (beats.json).
python3 -c "import librosa, soundfile" 2>/dev/null || pip install -q -r "$MS/requirements.txt"

# Node projects: our renderer, Remotion, HyperFrames (GSAP is vendored through npm; the CDN is not reachable here).
for dir in "$MS" "$MS/remotion" "$MS/hyperframes"; do
  [ -f "$dir/package.json" ] && (cd "$dir" && npm install --no-audit --no-fund --loglevel=error)
done
# Warm the pinned HyperFrames CLI so the first `npx hyperframes` doesn't download it.
(cd "$MS/hyperframes" && npx -y hyperframes@0.8.134 --version >/dev/null 2>&1) || true

# Chromium uses its own NSS store: trust the session's proxy CA there, or every https page fails.
CA=/root/.ccr/agent-proxy-ca.crt
if [ -f "$CA" ]; then
  command -v certutil >/dev/null || (apt-get install -y -q libnss3-tools >/dev/null 2>&1 || (apt-get update -q >/dev/null 2>&1 && apt-get install -y -q libnss3-tools >/dev/null 2>&1)) || true
  if command -v certutil >/dev/null; then
    mkdir -p "$HOME/.pki/nssdb"
    [ -f "$HOME/.pki/nssdb/cert9.db" ] || certutil -N -d "sql:$HOME/.pki/nssdb" --empty-password
    certutil -L -d "sql:$HOME/.pki/nssdb" -n ccr-agent-proxy >/dev/null 2>&1 || certutil -A -d "sql:$HOME/.pki/nssdb" -n ccr-agent-proxy -t "C,," -i "$CA"
  fi
fi

# HyperFrames: no usage telemetry, no feedback prompts (client decision, see motion-studio/CLAUDE.md).
(cd "$MS/hyperframes" && HYPERFRAMES_NO_TELEMETRY=1 npx -y hyperframes@0.8.134 telemetry disable >/dev/null 2>&1) || true
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  printf 'export HYPERFRAMES_NO_TELEMETRY=1\nexport DO_NOT_TRACK=1\nexport HYPERFRAMES_NO_FEEDBACK=1\n' >> "$CLAUDE_ENV_FILE"
fi

# Point all three tools at the preinstalled browsers instead of downloading their own.
CHROMIUM=/opt/pw-browsers/chromium
SHELL_BIN=$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | head -1 || true)
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  [ -x "$CHROMIUM" ] && echo "export CHROMIUM_PATH=$CHROMIUM" >> "$CLAUDE_ENV_FILE"
  if [ -n "$SHELL_BIN" ]; then
    echo "export REMOTION_BROWSER_EXECUTABLE=$SHELL_BIN" >> "$CLAUDE_ENV_FILE"
    echo "export HYPERFRAMES_BROWSER_PATH=$SHELL_BIN" >> "$CLAUDE_ENV_FILE"
  fi
fi
