// Code-synthesized score and SFX. Every voice is deterministic: noise comes from mulberry32(seed).
import { writeFileSync } from 'node:fs';

export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Stereo mix bus. add() places a mono voice at time t with equal-power pan in [-1, 1].
export function bus(sr, duration) {
  const n = Math.ceil(sr * duration);
  const L = new Float32Array(n), R = new Float32Array(n);
  return {
    sr, duration, L, R,
    add(src, t, { gain = 1, pan = 0 } = {}) {
      const o = Math.round(t * sr), a = ((pan + 1) * Math.PI) / 4;
      const gl = gain * Math.cos(a), gr = gain * Math.sin(a);
      for (let i = Math.max(0, -o); i < src.length && o + i < n; i++) { L[o + i] += src[i] * gl; R[o + i] += src[i] * gr; }
      return this;
    },
  };
}

// 32-bit float WAV; loudness is normalized later, so no clipping happens here.
export function writeWav(path, { sr, L, R }) {
  const n = L.length, data = Buffer.alloc(n * 8), h = Buffer.alloc(44);
  for (let i = 0; i < n; i++) { data.writeFloatLE(L[i], i * 8); data.writeFloatLE(R[i], i * 8 + 4); }
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 8, 28); h.writeUInt16LE(8, 32); h.writeUInt16LE(32, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([h, data]));
}

// ---- building blocks -------------------------------------------------------

const buf = (sr, dur) => new Float32Array(Math.max(1, Math.round(sr * dur)));

// Linear attack, exponential-ish release, sustain at 1 in between.
function envelope(i, sr, len, attack, release) {
  const t = i / sr, end = len / sr;
  if (t < attack) return t / attack;
  if (t > end - release) return Math.max(0, (end - t) / release) ** 2;
  return 1;
}

export function lowpass(x, sr, cutoff) {
  const f = typeof cutoff === 'function' ? cutoff : () => cutoff;
  let y = 0;
  for (let i = 0; i < x.length; i++) { const a = 1 - Math.exp((-2 * Math.PI * f(i / x.length)) / sr); y += a * (x[i] - y); x[i] = y; }
  return x;
}

export function highpass(x, sr, cutoff) {
  const a = Math.exp((-2 * Math.PI * cutoff) / sr);
  let px = 0, py = 0;
  for (let i = 0; i < x.length; i++) { const y = a * (py + x[i] - px); px = x[i]; py = y; x[i] = y; }
  return x;
}

const WAVES = {
  sine: (p) => Math.sin(2 * Math.PI * p),
  saw: (p) => 2 * (p - Math.floor(p + 0.5)),
  square: (p) => (p % 1 < 0.5 ? 1 : -1),
  tri: (p) => 1 - 4 * Math.abs((p % 1) - 0.5),
};

// ---- voices ----------------------------------------------------------------

export function tone(sr, freq, dur, { wave = 'sine', attack = 0.005, release = 0.1, cutoff } = {}) {
  const x = buf(sr, dur), w = WAVES[wave];
  for (let i = 0; i < x.length; i++) x[i] = w((freq * i) / sr) * envelope(i, sr, x.length, attack, release);
  return cutoff ? lowpass(x, sr, cutoff) : x;
}

// Detuned saw stack through a lowpass: a warm bed for chords.
export function pad(sr, freqs, dur, { attack = 0.4, release = 0.8, cutoff = 1800, detune = 0.006 } = {}) {
  const x = buf(sr, dur);
  for (const f of freqs) for (const d of [-detune, 0, detune]) {
    const ph = (f * (1 + d)) / sr;
    for (let i = 0; i < x.length; i++) x[i] += WAVES.saw(ph * i) / (freqs.length * 3);
  }
  for (let i = 0; i < x.length; i++) x[i] *= envelope(i, sr, x.length, attack, release);
  return lowpass(x, sr, cutoff);
}

export function kick(sr, { freq = 48, punch = 170, decay = 0.38 } = {}) {
  const x = buf(sr, decay * 1.5);
  let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / sr;
    ph += (freq + punch * Math.exp(-t * 28)) / sr;
    x[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / (decay / 3));
  }
  return x;
}

export function snare(sr, { seed = 1, tone: f = 190, decay = 0.18 } = {}) {
  const r = mulberry32(seed), x = buf(sr, decay * 1.6);
  for (let i = 0; i < x.length; i++) {
    const t = i / sr;
    x[i] = (r() * 2 - 1) * 0.7 * Math.exp(-t / (decay / 3)) + Math.sin(2 * Math.PI * f * t) * 0.4 * Math.exp(-t * 30);
  }
  return highpass(x, sr, 120);
}

export function hat(sr, { seed = 2, decay = 0.05 } = {}) {
  const r = mulberry32(seed), x = buf(sr, decay * 2);
  for (let i = 0; i < x.length; i++) x[i] = (r() * 2 - 1) * Math.exp(-i / sr / (decay / 3));
  return highpass(x, sr, 7000);
}

// Short UI tick: a filtered click, for cuts and type-ons.
export function tick(sr, { freq = 2400, decay = 0.02 } = {}) {
  const x = buf(sr, decay * 3);
  for (let i = 0; i < x.length; i++) x[i] = Math.sin((2 * Math.PI * freq * i) / sr) * Math.exp(-i / sr / (decay / 3));
  return x;
}

// Noise swell with an opening filter; ends exactly at dur, so place it at (hit - dur).
export function riser(sr, dur, { seed = 3, from = 300, to = 9000 } = {}) {
  const r = mulberry32(seed), x = buf(sr, dur);
  for (let i = 0; i < x.length; i++) x[i] = (r() * 2 - 1) * Math.pow(i / x.length, 2);
  return lowpass(x, sr, (u) => from * Math.pow(to / from, u));
}

export function whoosh(sr, dur = 0.5, { seed = 4 } = {}) {
  const r = mulberry32(seed), x = buf(sr, dur);
  for (let i = 0; i < x.length; i++) { const u = i / x.length; x[i] = (r() * 2 - 1) * Math.sin(Math.PI * u) ** 2; }
  return lowpass(x, sr, (u) => 400 + 5000 * Math.sin(Math.PI * u));
}

export function impact(sr, { seed = 5, decay = 1.2 } = {}) {
  const k = kick(sr, { freq: 38, punch: 90, decay }), r = mulberry32(seed);
  for (let i = 0; i < k.length; i++) k[i] += (r() * 2 - 1) * 0.5 * Math.exp((-i / sr) * 18);
  return k;
}
