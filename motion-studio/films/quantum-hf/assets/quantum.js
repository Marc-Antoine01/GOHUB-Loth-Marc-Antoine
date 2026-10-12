// Shared engine for the HyperFrames version of "Faster, Stronger, Computer.".
// Loaded once by the host (index.html); every scene sub-composition uses window.Q.
// Times are film times in seconds (the canvas film's beat grid); a scene converts them to its local timeline with `- S`.
(function () {
  'use strict';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  // 0 before a, 1 after b, linear in between: the basic building block for timing.
  const range = (t, a, b) => clamp((t - a) / (b - a));

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Stateless: same (seed, i) always gives the same value, so it is safe inside seek(t).
  const hash = (seed, i) => mulberry32((Math.imul(seed, 374761393) + Math.imul(i, 668265263)) | 0)();
  // Smooth value noise in [-1, 1].
  function noise1(seed, x) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(seed, i), hash(seed, i + 1), u) * 2 - 1;
  }

  const ease = {
    outCubic: (u) => 1 - Math.pow(1 - u, 3),
    inOutCubic: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    outExpo: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
    inExpo: (u) => (u <= 0 ? 0 : Math.pow(2, 10 * u - 10)),
    outBack: (u, s = 1.7) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2),
  };

  // Closed-form damped spring from 0 to 1, t in seconds since release. Pure in t.
  function spring(t, freq = 2.2, damping = 0.45) {
    if (t <= 0) return 0;
    const w = 2 * Math.PI * freq, z = damping;
    if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  }


  const M = { clamp, lerp, range, mulberry32, hash, noise1, ease, spring };

  // The measured beat grid of the score (films/quantum/beats.json, 127.8 BPM).
  const BEATS = [0.0213, 0.4667, 0.936, 1.4053, 1.872, 2.3387, 2.8133, 3.2773, 3.7493, 4.2053, 4.6853, 5.152, 5.6267, 6.0907, 6.56, 7.032, 7.496, 7.9573, 8.432, 8.8987, 9.3733, 9.824, 10.312, 10.776, 11.248, 11.7067, 12.1867, 12.6533, 13.1227, 13.5947, 14.0613, 14.5307, 14.9947, 15.4693, 15.9253, 16.384, 16.872, 17.3227, 17.8107, 18.2773, 18.7493, 19.2107, 19.656, 20.152, 20.6213, 21.0933, 21.56, 22.032, 22.4987, 22.9707, 23.4267, 23.8987, 24.3707, 24.8347, 25.3147, 25.776, 26.2507, 26.7067, 27.1867, 27.6533, 28.12, 28.5947, 29.0613, 29.5227, 29.9947, 30.4667, 30.9307, 31.3947, 31.872, 32.3227, 32.8133, 33.272, 33.7493, 34.208, 34.6853, 35.152, 35.6267, 36.088, 36.5627, 37.032, 37.4933, 37.968, 38.432, 38.904, 39.376, 39.84, 40.3093, 40.7733, 41.2507, 41.704, 42.176, 42.648, 43.1227, 43.608, 44.0747, 44.5333, 44.9813];
  const PERIOD = 60 / 127.84;
  const B = (i) => (i <= 0 ? 0 : BEATS[i] ?? i * PERIOD);
  const Bf = (x) => { const i = Math.floor(x); return lerp(B(i), B(i + 1), x - i); }; // fractional beat
  const W = 1920, H = 1080;
  const C = { ink: '#161616', paper: '#F4F4F4', white: '#FFFFFF', blue: '#0F62FE', cyan: '#82CFFF', blue40: '#78A9FF', purple: '#8A3FFC', purple40: '#BE95FF', magenta: '#EE5396', gray50: '#8D8D8D', gray30: '#C6C6C6', gray80: '#393939', gray20: '#E0E0E0' };

  // Fonts must be loaded before anything is measured or a timeline is built.
  // Lazy: the host's @font-face rules are parsed after this file runs, so the faces are requested on first use (by a scene).
  let fontsReady = null;
  const FACES = ['300 100px PlexSans', '400 100px PlexSans', '600 100px PlexSans', '400 100px PlexMono'];
  const loadFonts = () => (fontsReady ||= Promise.all(FACES.map((f) => document.fonts.load(f))).then((sets) => {
    if (sets.some((faces) => !faces.length)) throw new Error('quantum.js: IBM Plex is not declared (@font-face missing)');
  }));
  const meter = document.createElement('canvas').getContext('2d');
  const measure = (font, text, spacing = 0) => { meter.font = font; meter.letterSpacing = `${spacing}px`; return meter.measureText(text); };

  // ---- canvas side: the graphics of each scene are drawn from film time t ----
  function canvas(el) { el.width = W; el.height = H; return el.getContext('2d'); }
  function field(g, color, dots = color === C.ink ? 'rgba(255,255,255,0.07)' : 'rgba(22,22,22,0.07)') {
    g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalCompositeOperation = 'source-over';
    g.fillStyle = color; g.fillRect(0, 0, W, H);
    g.fillStyle = dots;
    for (let y = 4; y < H; y += 32) for (let x = 4; x < W; x += 32) g.fillRect(x, y, 2, 2); // IBM grid made visible
  }
  // The slow push-in, as a canvas transform (the DOM side gets the same move from Q.push).
  function pushCanvas(g, lt, dur, fx, fy, amount) {
    const s = 1 + amount * ease.inOutCubic(clamp(lt / dur));
    g.translate(fx, fy); g.scale(s, s); g.translate(-fx, -fy);
  }
  function qubit(g, x, y, r, { fill = C.blue, ring = C.cyan, ringR = r * 1.6, lw = 2 } = {}) {
    g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    if (ringR > r) { g.strokeStyle = ring; g.lineWidth = lw; g.beginPath(); g.arc(x, y, ringR, 0, Math.PI * 2); g.stroke(); }
  }
  // Drive a canvas from the scene timeline: a proxy tween carries film time across [from, to] and repaints on every seek.
  function drive(tl, S, from, to, draw) {
    const p = { t: from };
    draw(from);
    tl.fromTo(p, { t: from }, { t: to, duration: to - from, ease: 'none', immediateRender: false, onUpdate: () => draw(p.t) }, from - S);
  }

  // ---- DOM side: editable text, animated by the scene's GSAP timeline ----
  const el = (tag, css, parent) => { const e = document.createElement(tag); Object.assign(e.style, css); parent && parent.appendChild(e); return e; };
  // The camera push on a DOM layer: same curve as pushCanvas (power2.inOut is the cubic in-out).
  function push(tl, layer, S, from, dur, fx, fy, amount) {
    layer.style.transformOrigin = `${fx}px ${fy}px`;
    tl.fromTo(layer, { scale: 1 }, { scale: 1 + amount, duration: dur, ease: 'power2.inOut' }, Math.max(0, from - S));
  }
  // Word build: each word rises from below its baseline inside its own line box, sharpening, and lands on its beat.
  // items: [{ text, at, accent }] with `at` in film time. Returns the x where the next word would start.
  function words(tl, S, parent, items, x, y, size, { color = C.white, accent = C.cyan, gap = 0.28 } = {}) {
    let cx = x;
    for (const it of items) {
      const w = it.accent ? 600 : 300, font = `${w} ${size}px PlexSans`, sp = -size * 0.01;
      const m = measure(font, it.text, sp), wd = m.width, asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
      const box = el('div', { position: 'absolute', left: `${cx - size * 0.1}px`, top: `${y - size * 1.05}px`, width: `${wd + size * 0.3}px`, height: `${size * 1.35}px`, overflow: 'hidden' }, parent);
      box.className = 'word';
      const span = el('div', { position: 'absolute', left: `${size * 0.1}px`, top: `${size * 1.05 - asc}px`, font, letterSpacing: `${sp}px`, lineHeight: `${asc + desc}px`, whiteSpace: 'pre', color: it.accent ? accent : color, opacity: 0 }, box);
      span.textContent = it.text;
      const at = Math.max(S, it.at - 0.2);
      tl.set(span, { opacity: 1 }, at - S); // a cut, not a fade: the word appears clipped below its line
      tl.fromTo(span, { y: size * 1.1, filter: 'blur(10px)' }, { y: 0, filter: 'blur(0px)', duration: it.at + 0.12 - at, ease: 'expo.out' }, at - S);
      cx += wd + size * gap;
    }
    return cx;
  }
  // Mono caption, typed at 48 characters a second from `at`, with a blinking block cursor while it types.
  function mono(tl, S, parent, text, x, y, at, { color = C.gray50, size = 46, highlight = null, hiColor = C.magenta } = {}) {
    const font = `400 ${size}px PlexMono`, m = measure(font, 'M'), adv = m.width, asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    const line = el('div', { position: 'absolute', left: `${x}px`, top: `${y - asc}px`, font, lineHeight: `${asc + desc}px`, whiteSpace: 'pre', color }, parent);
    line.className = 'mono';
    const hi = highlight ? text.indexOf(highlight) : -1;
    const chars = [...text].map((ch, k) => {
      const s = el('span', { opacity: 0 }, line); s.textContent = ch;
      if (hi >= 0 && k >= hi && k < hi + highlight.length) s.style.color = hiColor;
      tl.set(s, { opacity: 1 }, at + (k + 1) / 48 - S);
      return s;
    });
    const cur = el('div', { position: 'absolute', left: '0px', top: `${asc - size * 0.8}px`, width: `${size * 0.5}px`, height: `${size * 0.95}px`, background: color, opacity: 0 }, line);
    const n = chars.length, end = at + (n + 8) / 48;
    for (let k = 1; k <= n; k++) tl.set(cur, { x: adv * k + 4 }, at + k / 48 - S);
    for (let q = 0; at + q * 0.25 < end; q++) {
      const t0 = Math.max(at + 1 / 48, at + q * 0.25);
      tl.set(cur, { opacity: q % 2 === 0 ? 1 : 0 }, t0 - S);
    }
    tl.set(cur, { opacity: 0 }, end - S);
    return line;
  }

  // Markup readers: the text lives in the scene's HTML, so it can be edited there (or in Studio) without touching the code.
  // <div class="words" data-x data-y data-size [data-color data-accent]><span data-beat="2" [data-offset] [class="accent"]>Computer</span>…</div>
  // <div class="mono" data-x data-y data-beat [data-offset data-size data-color data-highlight]>// caption</div>
  // A time is `data-at` (seconds), or `data-beat` (a beat index, fractional allowed) plus `data-offset` (seconds).
  const timeOf = (e) => (e.dataset.at != null ? +e.dataset.at : Bf(+e.dataset.beat) + (+e.dataset.offset || 0));
  const colorOf = (v, fallback) => (v == null ? fallback : C[v] || v);
  function wordsFrom(tl, S, box, opts = {}) {
    const items = [...box.children].map((s) => ({ text: s.textContent, at: timeOf(s), accent: s.classList.contains('accent') }));
    box.textContent = '';
    const d = box.dataset;
    return words(tl, S, box, items, +d.x, +d.y, opts.size ?? +d.size, { color: colorOf(d.color, C.white), accent: colorOf(d.accent, C.cyan), gap: opts.gap ?? 0.28 });
  }
  function monoFrom(tl, S, box, opts = {}) {
    const d = box.dataset, text = box.textContent.trim();
    box.textContent = '';
    return mono(tl, S, box, text, opts.x ?? +d.x, opts.y ?? +d.y, timeOf(box), { color: colorOf(d.color, C.gray50), size: d.size ? +d.size : 46, highlight: d.highlight || null });
  }

  // ---- shared layouts that cross scene boundaries ----
  // The hook line, fitted to the frame: the full stop's qubit and its widest ring end at the right margin.
  function hookDot() {
    const X = 120, Y = 600, RIGHT = W - 120, u = (w, s) => measure(`${w} 100px PlexSans`, s, -1).width / 100;
    const k = u(300, 'Faster,') + u(300, 'Stronger,') + u(600, 'Computer') + 0.56 + 0.2;
    const SIZE = Math.min(150, (RIGHT - X) / (k + 0.075 * 3.6));
    const x = X + k * SIZE, y = Y - SIZE * 0.08, fy = Y - SIZE * 0.3, P = 1.04;
    return { X, Y, x, y, r: SIZE * 0.075, size: SIZE, fy, sx: W / 2 + (x - W / 2) * P, sy: fy + (y - fy) * P, P };
  }
  // The Bloch sphere (S05, and S06's silence that swallows it).
  const SX = 1320, SY = 560, SR = 300;
  function bloch(g, t) {
    g.strokeStyle = C.gray80; g.lineWidth = 2;
    g.beginPath(); g.arc(SX, SY, SR, 0, Math.PI * 2); g.stroke();
    g.setLineDash([10, 10]); g.beginPath(); g.ellipse(SX, SY, SR, SR * 0.28, 0, Math.PI, 2 * Math.PI); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.ellipse(SX, SY, SR, SR * 0.28, 0, 0, Math.PI); g.stroke();
    g.beginPath(); g.moveTo(SX, SY - SR - 30); g.lineTo(SX, SY + SR + 30); g.stroke();
    g.font = '400 40px PlexMono'; g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillText('|0⟩', SX, SY - SR - 50); g.fillText('|1⟩', SX, SY + SR + 82); g.textAlign = 'left';
    // θ sweeps 0 → π (beat 46.5), back up past the pole (beat 48) and lands on the equator on beat 49; φ keeps turning.
    const u = range(t, B(44) + 0.2, B(49));
    const th = u < 0.45 ? Math.PI * ease.inOutCubic(u / 0.45)
      : u < 0.75 ? Math.PI - Math.PI * 0.85 * ease.inOutCubic(range(u, 0.45, 0.75))
      : Math.PI * 0.15 + Math.PI * 0.35 * ease.outBack(range(u, 0.75, 1));
    const ph = 0.9 + (t - B(44)) * 0.9;
    const x = SX + SR * Math.sin(th) * Math.cos(ph) * 0.98, y = SY - SR * Math.cos(th) + SR * 0.28 * Math.sin(th) * Math.sin(ph);
    g.strokeStyle = C.blue; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(SX, SY); g.lineTo(x, y); g.stroke();
    qubit(g, x, y, 16, { fill: C.blue, ring: C.blue, ringR: 30 });
    qubit(g, SX, SY, 6, { fill: C.ink, ringR: 0 });
    return { x, y };
  }

  window.Q = { M, B, Bf, W, H, C, get ready() { return loadFonts(); }, measure, canvas, field, pushCanvas, qubit, drive, el, push, words, mono, wordsFrom, monoFrom, timeOf, hookDot, bloch, SX, SY, SR };
})();
