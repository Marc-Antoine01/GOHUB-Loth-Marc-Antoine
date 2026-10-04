// Film runtime: pure helpers (no clocks, no state) + a preview player that only runs outside render mode.
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

  // Index of the last beat at or before t (-1 before the first), and time since it.
  function beatAt(t, beats = (window.BEATS && window.BEATS.beats) || []) {
    let lo = 0, hi = beats.length - 1, i = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (beats[m] <= t) { i = m; lo = m + 1; } else hi = m - 1; }
    return { index: i, since: i < 0 ? t : t - beats[i] };
  }

  window.M = { clamp, lerp, range, mulberry32, hash, noise1, ease, spring, beatAt };

  // Preview player. render.mjs bans timers, so this must never run under __RENDER__.
  if (window.__RENDER__) return;
  window.addEventListener('load', async () => {
    if (typeof window.seek !== 'function' || !window.FILM) return;
    await window.ready;
    const { duration, fps } = window.FILM;
    const q = new URLSearchParams(location.search);
    let t = q.has('t') ? +q.get('t') : 0, playing = false, origin = 0;
    const audio = new Audio('out/mix.wav');
    const paint = () => window.seek(((t % duration) + duration) % duration);
    const tick = (now) => {
      if (!playing) return;
      t = (now - origin) / 1000;
      if (t >= duration) { t = 0; origin = now; audio.currentTime = 0; }
      paint(); requestAnimationFrame(tick);
    };
    const toggle = () => {
      playing = !playing;
      if (playing) { origin = performance.now() - t * 1000; audio.currentTime = t; audio.play().catch(() => {}); requestAnimationFrame(tick); }
      else audio.pause();
    };
    addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        if (playing) toggle();
        t += (e.code === 'ArrowRight' ? 1 : -1) / fps; paint();
      }
    });
    addEventListener('click', toggle);
    paint();
  });
})();
