#!/usr/bin/env node
// node render.mjs films/<name> [--sound | --sheet] [--format <name>|all] — and node render.mjs --serve. See CLAUDE.md.
import http from 'node:http';
import { once } from 'node:events';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import * as synth from './lib/synth.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SR = 48000, LUFS = -14, TRUE_PEAK = -1, CRF = 16;
const THUMB = 390; // CSS px = phone screen width, so the contact sheet is also the phone-readability check
const COLS = 4, SHEET_MAX_H = 2400;
const TRACKS = ['track.wav', 'track.mp3', 'track.m4a', 'track.flac', 'track.aac'].flatMap((f) => [f, 'audio/' + f]);

class ContractError extends Error {}
const fail = (msg) => { throw new ContractError(msg); };
const log = (msg) => process.stderr.write(msg + '\n');

// ---- static server: injects window.FILM / window.BEATS into every film page ----

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4',
};
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);

function serve(port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let p = resolve(ROOT, '.' + decodeURIComponent(url.pathname));
    if (p !== ROOT && !p.startsWith(ROOT + sep)) return res.writeHead(403).end();
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) return res.writeHead(404).end();
    let body = readFileSync(p);
    if (p.endsWith('.html')) {
      const d = dirname(p);
      const film = existsSync(join(d, 'film.json')) ? resolveFormat(readJson(join(d, 'film.json')), url.searchParams.get('format')) : null;
      const inject = `<script>window.FILM=${JSON.stringify(film)};window.BEATS=${JSON.stringify(readJson(join(d, 'beats.json')))};</script>`;
      body = body.toString().replace(/<head[^>]*>/i, (m) => m + inject);
    }
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

// ---- film page under the render contract ----

// Runs before any film script. Banned APIs throw *and* are recorded, so a film that swallows the error still fails.
const GUARD = `(() => {
  window.__RENDER__ = true;
  const v = (window.__violations = []);
  const ban = (name) => function () { v.push(name); throw new Error('render contract: ' + name + ' is banned in render mode'); };
  window.setTimeout = ban('setTimeout');
  window.setInterval = ban('setInterval');
  window.requestAnimationFrame = ban('requestAnimationFrame');
  Math.random = ban('Math.random');
  Element.prototype.animate = ban('Element.animate');
})();`;

// Elements with a CSS transition or animation: their paint depends on wall-clock time, not t.
const FIND_CSS_MOTION = `(() => [...document.querySelectorAll('*')].filter((e) => {
  const s = getComputedStyle(e);
  return s.transitionDuration.split(',').some((d) => parseFloat(d) > 0) || s.animationName.split(',').some((n) => n.trim() !== 'none');
}).slice(0, 5).map((e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).join('.') : '')))()`;

// film.json may list "formats": { "9x16": [1080, 1920], "1x1": [1080, 1080] } — one timeline, several canvases.
// The page sees FILM.format and FILM.width/height for the chosen one; the first format is the default.
function resolveFormat(film, name) {
  if (!film.formats) return { ...film, format: null };
  const names = Object.keys(film.formats);
  const format = name || names[0];
  if (!film.formats[format]) fail(`unknown format "${format}"; film.json has ${names.join(', ')}`);
  const [width, height] = film.formats[format];
  return { ...film, width, height, format };
}

function loadFilm(dir, format) {
  const raw = readJson(join(dir, 'film.json'));
  if (!raw) fail(`${dir}/film.json missing`);
  const film = resolveFormat(raw, format);
  for (const k of ['duration', 'fps', 'width', 'height']) if (!(film[k] > 0)) fail(`film.json: "${k}" must be a positive number`);
  if (film.width % 2 || film.height % 2) fail('film.json: width and height must be even for yuv420p');
  return film;
}

async function openFilm(dir, film, port) {
  if (!existsSync(join(dir, 'index.html'))) fail(`${dir}/index.html missing`);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: film.width, height: film.height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(GUARD);
  const query = film.format ? `?render&format=${encodeURIComponent(film.format)}` : '?render';
  await page.goto(`http://127.0.0.1:${port}/${relative(ROOT, dir).split(sep).join('/')}/index.html${query}`, { waitUntil: 'load' });
  await page.evaluate(async () => { await window.ready; await document.fonts.ready; });
  if (!(await page.evaluate(() => typeof window.seek === 'function'))) fail('index.html must define window.seek(t)');

  const check = (violations, t) => {
    if (violations.length) fail(`t=${t.toFixed(3)}: banned in render mode: ${[...new Set(violations)].join(', ')}`);
    if (errors.length) fail(`t=${t.toFixed(3)}: page error: ${errors[0]}`);
  };
  return {
    browser,
    async shot(t) {
      const v = await page.evaluate(async (t) => {
        await window.seek(t);
        await document.fonts.ready;
        return window.__violations.splice(0);
      }, t);
      check(v, t);
      return page.screenshot({ type: 'png' });
    },
    async cssMotion(t) {
      const found = await page.evaluate(FIND_CSS_MOTION);
      if (found.length) fail(`t=${t.toFixed(3)}: CSS transition/animation on ${found.join(', ')}`);
    },
  };
}

// ---- sound: score -> measured beats -> SFX on the grid -> -14 LUFS ----

const ffmpeg = (args) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8' });
  if (r.status !== 0) fail(`ffmpeg failed: ${r.stderr.trim().split('\n').slice(-3).join(' | ')}`);
  return r.stderr;
};

function measureLufs(file) {
  const err = ffmpeg(['-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-']);
  const m = [...err.matchAll(/I:\s+(-?[\d.]+|-inf) LUFS/g)].pop();
  return m ? parseFloat(m[1]) : null;
}

function normalize(src, dst) {
  const target = `I=${LUFS}:TP=${TRUE_PEAK}:LRA=11`;
  const err = ffmpeg(['-i', src, '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-']);
  const m = JSON.parse(err.slice(err.lastIndexOf('{'), err.lastIndexOf('}') + 1));
  if (!isFinite(parseFloat(m.input_i))) fail('mix is silent; nothing to normalize');
  const measured = `measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}`;
  ffmpeg(['-i', src, '-af', `loudnorm=${target}:${measured}:linear=true`, '-ar', String(SR), '-c:a', 'pcm_f32le', dst]);
}

async function buildSound(dir, film) {
  const out = join(dir, 'out');
  mkdirSync(out, { recursive: true });
  const track = TRACKS.map((f) => join(dir, f)).find(existsSync);
  const soundFile = join(dir, 'sound.mjs');
  const sound = existsSync(soundFile) ? await import(pathToFileURL(soundFile).href + '?' + Date.now()) : {};
  const ctx = { sr: SR, duration: film.duration, film, synth };
  const layers = [];

  if (track) {
    layers.push(join(out, 'bed.wav'));
    ffmpeg(['-i', track, '-t', String(film.duration), '-ar', String(SR), '-ac', '2', '-c:a', 'pcm_f32le', layers[0]]);
    if (sound.score) log('track supplied: ignoring score() in sound.mjs');
  } else if (sound.score) {
    layers.push(join(out, 'bed.wav'));
    synth.writeWav(layers[0], await sound.score(ctx));
  }
  if (layers.length) {
    // film.json "beatsFull": true tracks the pulse on the full spectrum (tracks with a sparse kick).
    const r = spawnSync('python3', [join(ROOT, 'tools/beats.py'), layers[0], join(dir, 'beats.json'), ...(film.beatsFull ? ['--full'] : [])], { encoding: 'utf8' });
    if (r.status !== 0) fail(`beat detection failed: ${r.stderr.trim().split('\n').pop()}`);
    log(r.stdout.trim());
  }
  if (sound.sfx) {
    const beats = readJson(join(dir, 'beats.json'));
    if (!beats) fail('sfx() needs beats.json: supply a track, a score(), or a beats.json');
    layers.push(join(out, 'sfx.wav'));
    synth.writeWav(layers.at(-1), await sound.sfx({ ...ctx, beats }));
  }
  if (!layers.length) return null;

  let raw = layers[0];
  if (layers.length > 1) {
    raw = join(out, 'raw.wav');
    ffmpeg([...layers.flatMap((l) => ['-i', l]), '-filter_complex', `amix=inputs=${layers.length}:normalize=0`, '-c:a', 'pcm_f32le', raw]);
  }
  const mix = join(out, 'mix.wav');
  normalize(raw, mix);
  log(`mix: ${measureLufs(mix)} LUFS -> ${relative(ROOT, mix)}`);
  return mix;
}

// ---- purity: compare two renders of the same frame ----

const PURITY_DB = 50;
function psnr(a, b, tmp) {
  writeFileSync(tmp + '-a.png', a); writeFileSync(tmp + '-b.png', b);
  const err = ffmpeg(['-i', tmp + '-a.png', '-i', tmp + '-b.png', '-lavfi', 'psnr', '-f', 'null', '-']);
  rmSync(tmp + '-a.png'); rmSync(tmp + '-b.png');
  const m = err.match(/average:(inf|[\d.]+)/);
  return !m || m[1] === 'inf' ? Infinity : parseFloat(m[1]);
}

// ---- contact sheet: one frame per beat, at phone width ----

async function sheet(dir, film, port) {
  const beats = readJson(join(dir, 'beats.json'))?.beats;
  let times = (beats || []).filter((t) => t < film.duration);
  if (!times.length) {
    log('no beats.json: sampling every 0.5s instead (add sound.mjs, a track, or beats.json)');
    times = Array.from({ length: Math.ceil(film.duration / 0.5) }, (_, i) => i * 0.5);
  }
  if (times[0] > 0.05) times.unshift(0); // the hook lives in the first frames

  const tag = film.format ? `-${film.format}` : '';
  const out = join(dir, 'out'), frames = join(out, `sheet${tag}`);
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });

  const f = await openFilm(dir, film, port);
  const shots = [];
  try {
    for (const [i, t] of times.entries()) {
      shots.push(await f.shot(t));
      await f.cssMotion(t);
      writeFileSync(join(frames, `${String(i).padStart(3, '0')}.png`), shots[i]);
    }
    // Purity check: revisit frames after jumping around. Any difference means state carried between frames.
    for (const i of [...new Set([times.length - 1, times.length >> 1, 0])]) {
      const again = await f.shot(times[i]);
      if (again.equals(shots[i])) continue;
      // Byte-different is not enough: Chromium's raster caches can shift a few values by 1-2 levels.
      // Real carried state (a moved or changed element) drops PSNR far below this line.
      const db = psnr(shots[i], again, join(frames, 'purity'));
      if (db < PURITY_DB) fail(`frame at t=${times[i].toFixed(3)} changes with render order (PSNR ${db.toFixed(1)} dB): seek(t) carries state between frames`);
    }
  } finally { await f.browser.close(); }

  const thumbH = Math.round((THUMB * film.height) / film.width);
  const perPage = COLS * Math.max(1, Math.floor(SHEET_MAX_H / (thumbH + 26)));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: COLS * (THUMB + 8) + 8, height: 600 } });
  const base = `http://127.0.0.1:${port}/${relative(ROOT, frames).split(sep).join('/')}`;
  const written = [];
  for (let p = 0; p * perPage < times.length; p++) {
    const cells = times.slice(p * perPage, (p + 1) * perPage).map((t, k) => {
      const i = p * perPage + k, b = beats ? beats.indexOf(t) : -1;
      return `<figure><img src="${base}/${String(i).padStart(3, '0')}.png"><figcaption>${b >= 0 ? `beat ${b + 1}` : 'frame'} · ${t.toFixed(2)}s</figcaption></figure>`;
    }).join('');
    await page.setContent(`<style>body{margin:0;padding:8px;background:#202020;color:#ccc;font:12px ui-monospace,monospace;display:grid;grid-template-columns:repeat(${COLS},${THUMB}px);gap:8px;width:max-content}figure{margin:0}img{width:${THUMB}px;display:block}figcaption{padding-top:4px}</style>${cells}`, { waitUntil: 'load' });
    const file = join(out, `sheet${tag}-${String(p + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: file, fullPage: true });
    written.push(relative(ROOT, file));
  }
  await browser.close();
  log(`contact sheet: ${times.length} frames -> ${written.join(', ')}`);
}

// ---- full render ----

async function render(dir, film, port, mix) {
  const out = join(dir, 'out', `${basename(dir)}${film.format ? '-' + film.format : ''}.mp4`);
  const n = Math.round(film.duration * film.fps);
  const enc = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(film.fps), '-i', '-',
    ...(mix ? ['-i', mix, '-c:a', 'aac', '-b:a', '256k'] : []),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p',
    '-t', String(film.duration), '-movflags', '+faststart', out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = once(enc, 'exit');

  const f = await openFilm(dir, film, port);
  try {
    for (let i = 0; i < n; i++) {
      const t = i / film.fps;
      const png = await f.shot(t);
      if (i === 0) await f.cssMotion(t);
      if (!enc.stdin.write(png)) await once(enc.stdin, 'drain');
      if (i % film.fps === 0) process.stderr.write(`\rframe ${i}/${n}`);
    }
  } catch (e) { enc.kill(); throw e; } finally { await f.browser.close(); }
  enc.stdin.end();
  const [code] = await done;
  if (code !== 0) fail(`ffmpeg exited with ${code}`);
  log(`\rframe ${n}/${n}`);
  if (mix) {
    const lufs = measureLufs(out);
    if (lufs === null || Math.abs(lufs - LUFS) > 1) fail(`final loudness ${lufs} LUFS, expected ${LUFS} ±1`);
    log(`loudness: ${lufs} LUFS`);
  }
  log(`render: ${relative(ROOT, out)} (H.264 yuv420p CRF ${CRF}, ${n} frames @ ${film.fps}fps)`);
}

// ---- cli ----

const args = process.argv.slice(2);
const has = (f) => args.includes(`--${f}`);
try {
  if (has('serve')) {
    const port = 4173;
    await serve(port);
    log(`preview: http://127.0.0.1:${port}/films/<name>/  (space: play/pause, arrows: step, ?t=2.5: freeze)`);
  } else {
    const target = args.find((a) => !a.startsWith('--'));
    if (!target) fail('usage: node render.mjs films/<name> [--sound | --sheet] [--format <name>|all]   |   node render.mjs --serve');
    const dir = resolve(target), fi = args.indexOf('--format'), want = fi >= 0 ? args[fi + 1] : null;
    const film = loadFilm(dir, want === 'all' ? null : want);
    const films = want === 'all' && film.formats ? Object.keys(film.formats).map((f) => loadFilm(dir, f)) : [film];
    const server = await serve();
    const { port } = server.address();
    try {
      if (has('sound')) await buildSound(dir, film);
      else if (has('sheet')) {
        if (!existsSync(join(dir, 'beats.json'))) await buildSound(dir, film);
        for (const f of films) await sheet(dir, f, port);
      } else {
        const mix = await buildSound(dir, film); // one mix for every format: same timeline, same sound
        for (const f of films) await render(dir, f, port, mix);
      }
    } finally { server.close(); }
  }
} catch (e) {
  log(e instanceof ContractError ? `✗ ${e.message}` : e.stack);
  process.exit(1);
}
