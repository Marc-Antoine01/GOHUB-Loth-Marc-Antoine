// End-to-end check: headless Chromium renders frames -> ffmpeg encodes MP4 + tone -> librosa analyses audio.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const OUT = 'out/smoke';
const FPS = 30, FRAMES = 30, W = 640, H = 360;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// CHROMIUM_PATH lets you point at a preinstalled browser (e.g. cloud containers) instead of Playwright's download.
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(`<body style="margin:0;background:#111">
  <div id="b" style="position:absolute;top:150px;width:60px;height:60px;border-radius:50%;background:#f5a623"></div></body>`);
for (let f = 0; f < FRAMES; f++) {
  await page.evaluate((x) => { document.getElementById('b').style.left = x + 'px'; }, (f / (FRAMES - 1)) * (W - 60));
  await page.screenshot({ path: `${OUT}/frame_${String(f).padStart(4, '0')}.png` });
}
await browser.close();

execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', `${OUT}/tone.wav`]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${OUT}/frame_%04d.png`,
  '-i', `${OUT}/tone.wav`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-shortest', `${OUT}/smoke.mp4`]);

const py = `import librosa, numpy as np
y, sr = librosa.load("${OUT}/tone.wav", sr=None)
f0 = librosa.yin(y, fmin=100, fmax=1000, sr=sr)
print(f"librosa ok: {len(y)/sr:.2f}s, median pitch {np.median(f0):.0f} Hz")`;
console.log(execFileSync('python3', ['-c', py]).toString().trim());
console.log(`video ok: ${OUT}/smoke.mp4`);
