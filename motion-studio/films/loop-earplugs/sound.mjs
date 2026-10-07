// Organic sound design under the supplied track ("Future Beat"). No samples: noise, filtered resonances, pitched impacts.
// Every hit sits on the beat index the shot uses (shots.js). Ambiences drop by each product's published dB (SNR) on its seat beat.
export function sfx({ sr, duration, beats, synth: s }) {
  const b = s.bus(sr, duration);
  const B = (i) => (i <= 0 ? 0 : beats.beats[i] ?? i * (60 / beats.tempo));
  const at = (v, t, gain, pan = 0) => b.add(v, Math.max(0, t), { gain, pan });
  const buf = (d) => new Float32Array(Math.max(1, Math.round(sr * d)));
  const rnd = (seed) => s.mulberry32(seed);
  const bandpass = (x, lo, hi) => s.highpass(s.lowpass(x, sr, hi), sr, lo);

  // ---- voices
  // The seal: the earplug seats. A falling sub "thock" (air pushed out of the canal) plus a soft wet click.
  function seal(seed = 1, { low = 58, body = 0.18 } = {}) {
    const x = buf(0.35), r = rnd(seed);
    let ph = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / sr;
      ph += (low + 170 * Math.exp(-t * 45)) / sr;
      x[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / body) * 0.9 + (r() * 2 - 1) * Math.exp(-t * 260) * 0.35;
    }
    return s.lowpass(x, sr, 2600);
  }
  // Silicone squeeze: band-limited noise that swells and pinches, with a rubbery resonance.
  function squeeze(seed = 2, dur = 0.24) {
    const x = buf(dur), r = rnd(seed);
    for (let i = 0; i < x.length; i++) {
      const u = i / x.length, t = i / sr;
      x[i] = ((r() * 2 - 1) * 0.6 + Math.sin(2 * Math.PI * (520 + 260 * u) * t) * 0.25) * Math.sin(Math.PI * u) ** 2;
    }
    return bandpass(x, 300, 1800);
  }
  // Dial detent: two close plastic clicks with a little body.
  function detent(seed = 3) {
    const x = buf(0.12), r = rnd(seed);
    for (const [o, g] of [[0, 1], [0.018, 0.55]]) {
      const k = Math.round(o * sr);
      for (let i = 0; i + k < x.length; i++) { const t = i / sr; x[i + k] += g * ((r() * 2 - 1) * Math.exp(-t * 900) + Math.sin(2 * Math.PI * 2300 * t) * Math.exp(-t * 300) * 0.5 + Math.sin(2 * Math.PI * 140 * t) * Math.exp(-t * 60) * 0.5); }
    }
    return x;
  }
  // Weight: a dry sub thump with a short transient (reveals).
  const thump = (decay = 0.5) => { const k = s.kick(sr, { freq: 42, punch: 90, decay }), r = rnd(9); for (let i = 0; i < k.length; i++) k[i] += (r() * 2 - 1) * Math.exp((-i / sr) * 120) * 0.3; return k; };
  // Air: a breath across the mic on the cuts.
  const air = (dur, seed) => bandpass(s.whoosh(sr, dur, { seed }), 200, 6000);
  // Wood "tock" for the wheel: short damped pluck, low brightness.
  const tock = (f, seed) => s.pluck(sr, f, 0.18, { seed, damping: 0.97, brightness: 0.1 });

  // ---- ambiences (mono, then "plugged" from the seat time)
  function crowd(dur, seed) {
    const x = buf(dur), r = rnd(seed); let y = 0;
    for (let i = 0; i < x.length; i++) { const t = i / sr; y += 0.08 * ((r() * 2 - 1) - y); x[i] = y * 3 * (0.75 + 0.25 * Math.sin(t * 2 * Math.PI * 0.7)); }
    // cheers: a few voiced swells
    const c = bandpass(Float32Array.from(x), 500, 3500);
    for (let i = 0; i < x.length; i++) { const t = i / sr; x[i] = x[i] * 0.6 + c[i] * 1.8 * Math.max(0, Math.sin(t * Math.PI * 0.9 + 0.4)) ** 3; }
    return x;
  }
  function city(dur, seed) {
    const x = buf(dur), r = rnd(seed); let br = 0;
    for (let i = 0; i < x.length; i++) { br = (br + 0.02 * (r() * 2 - 1)) * 0.998; x[i] = br * 4; }
    // a car passing (filtered noise with doppler-ish sweep) and a short horn
    const car = s.lowpass(Float32Array.from({ length: Math.round(sr * 1.4) }, () => r() * 2 - 1), sr, (u) => 300 + 1400 * Math.sin(Math.PI * u));
    for (let i = 0; i < car.length && i < x.length; i++) x[i + Math.round(sr * 0.1)] += car[i] * Math.sin(Math.PI * i / car.length) ** 2 * 0.9;
    const horn = s.lowpass(s.tone(sr, 415, 0.32, { wave: 'square', attack: 0.01, release: 0.05 }), sr, 1600), h2 = s.lowpass(s.tone(sr, 349, 0.32, { wave: 'square', attack: 0.01, release: 0.05 }), sr, 1600);
    const o = Math.round(sr * 0.45);
    for (let i = 0; i < horn.length && o + i < x.length; i++) x[o + i] += (horn[i] + h2[i]) * 0.14;
    return x;
  }
  function snore(dur, seed) {
    const x = buf(dur), r = rnd(seed); let y = 0, ph = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / sr, cyc = (t / 1.45) % 1, inhale = cyc < 0.55 ? Math.sin(Math.PI * cyc / 0.55) ** 2 : 0;
      y += 0.05 * ((r() * 2 - 1) - y); ph += (38 + 6 * Math.sin(t * 9)) / sr;
      const flutter = 0.5 + 0.5 * Math.sign(Math.sin(2 * Math.PI * ph)); // the soft palate flapping
      x[i] = (y * 5 * flutter + Math.sin(2 * Math.PI * ph * 2) * 0.15 * flutter) * inhale;
    }
    return s.lowpass(x, sr, 900);
  }
  function babble(dur, seed) {
    const x = buf(dur);
    for (let v = 0; v < 6; v++) {
      const r = rnd(seed + v), n = s.lowpass(Float32Array.from({ length: x.length }, () => r() * 2 - 1), sr, 1400 + v * 200);
      const rate = 3.5 + v * 0.6, off = v * 0.37;
      for (let i = 0; i < x.length; i++) x[i] += n[i] * Math.max(0, Math.sin(2 * Math.PI * rate * (i / sr) + off)) ** 2 * 0.5;
    }
    return s.highpass(x, sr, 250);
  }
  // The voice that stays clear under Engage: a voiced line with moving formants and syllables.
  function voice(dur, seed) {
    const x = buf(dur), r = rnd(seed); let ph = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / sr, f0 = 165 + 25 * Math.sin(t * 2.1) + 12 * Math.sin(t * 7.3);
      ph += f0 / sr;
      const syl = Math.max(0, Math.sin(2 * Math.PI * 4.2 * t + Math.sin(t * 3))) ** 1.5 * (t % 1.6 < 1.3 ? 1 : 0);
      let v = 0; for (let h = 1; h <= 14; h++) { const fh = f0 * h, form = Math.exp(-((fh - (550 + 300 * Math.sin(t * 5))) ** 2) / 90000) + 0.6 * Math.exp(-((fh - 1600) ** 2) / 250000); v += Math.sin(2 * Math.PI * ph * h) * form; }
      x[i] = (v * 0.35 + (r() * 2 - 1) * 0.02) * syl;
    }
    return x;
  }
  // Put the earplug in: from tSeat the sound is low-passed and lowered by the published dB, over 60 ms.
  function plug(x, tSeat, db, keep = null) {
    const n0 = Math.round(tSeat * sr), g = Math.pow(10, -db / 20), cut = 9000 * Math.pow(10, -db / 28);
    let y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const u = Math.min(1, Math.max(0, (i - n0) / (0.06 * sr)));
      const fc = 16000 * (1 - u) + cut * u, a = 1 - Math.exp((-2 * Math.PI * fc) / sr);
      y1 += a * (x[i] - y1); y2 += a * (y1 - y2);
      x[i] = y2 * (1 - u + g * u) * 1.0;
      if (keep) x[i] += keep[i];
    }
    return x;
  }
  // Fade the edges of an ambience so the cut in/out is clean but immediate.
  const edges = (x, fin = 0.02, fout = 0.08) => { const a = fin * sr, c = fout * sr; for (let i = 0; i < x.length; i++) x[i] *= Math.min(1, i / a, (x.length - i) / c); return x; };
  function ambience(make, from, to, seat, db, gain, seed, extra) {
    const d = to - from, x = make(d, seed);
    const keep = extra ? extra(d, seed + 50) : null;
    at(edges(plug(x, seat - from, db, keep)), from, gain);
  }

  // ---- S01 hook: breath into the macro, a light sweep, the silhouette lands with weight
  at(air(1.2, 11), 0.0, 0.35);
  at(squeeze(12, 0.3), B(2), 0.25, 0.2);
  at(thump(0.6), B(4), 0.8); at(seal(13), B(4), 0.5);
  at(air(0.6, 14), B(6) - 0.35, 0.25, -0.3);
  at(squeeze(15), B(7), 0.2, 0.3);

  // ---- S02 Switch 2: one detent per mode; the ambience under it gets quieter each click (relative, no figure claimed)
  {
    const from = B(11), to = B(20), d = to - from, x = city(d, 21);
    const steps = [[B(12), 0.62], [B(14), 0.42], [B(16), 0.16]];
    for (let i = 0; i < x.length; i++) { const t = from + i / sr; let g = 1; for (const [tt, gg] of steps) if (t >= tt) g = gg; x[i] *= g; }
    at(edges(x), from, 0.22);
    for (const [i, bi] of [12, 14, 16].entries()) at(detent(30 + i), B(bi), 0.55, 0.15);
    for (let i = 1; i < 4; i++) at(seal(40 + i, { low: 90, body: 0.06 }), B(18) - 0.05 + i * 0.06, 0.25, -0.3 + i * 0.25);
    at(air(0.5, 44), B(18) - 0.3, 0.2);
  }

  // ---- S03 match cut into the macro (air), then live music: the crowd drops 17 dB on the seat
  at(air(0.55, 50), B(20) - 0.3, 0.35); at(thump(0.35), B(20), 0.4);
  ambience(crowd, B(22), B(30), B(24), 17, 0.5, 51);
  at(seal(52), B(24), 0.75); at(squeeze(53), B(24) - 0.22, 0.25);
  for (const bi of [27, 28]) at(squeeze(54 + bi, 0.16), B(bi), 0.15, 0.3);

  // ---- S04 Quiet 2: traffic and a horn, muffled by 24 dB; then the beauty insert breathes
  ambience(city, B(30), B(35), B(32), 24, 0.55, 61);
  at(seal(62), B(32), 0.75); at(squeeze(63), B(32) - 0.22, 0.25);
  at(air(1.0, 64), B(35) - 0.2, 0.3); at(thump(0.5), B(35), 0.35);

  // ---- S05 Dream: the snore fades into near silence (27 dB)
  ambience(snore, B(38), B(44), B(40), 27, 0.55, 71);
  at(seal(72, { low: 50, body: 0.22 }), B(40), 0.7);

  // ---- S06 Engage 2: the room drops 16 dB, the voice stays. Then silence on the track's own dip (B50).
  ambience(babble, B(44), B(50), B(46), 16, 0.6, 81, (d, sd) => voice(d, sd));
  at(seal(82), B(46), 0.7);
  at(thump(0.9), B(50), 0.6); at(seal(83, { low: 46, body: 0.3 }), B(50), 0.5);

  // ---- S07 Kids: a small, bright pop per colour
  for (const [i, bi] of [51, 53, 54].entries()) { at(seal(90 + i, { low: 120, body: 0.05 }), B(bi), 0.5, 0.2); at(squeeze(95 + i, 0.14), B(bi) - 0.1, 0.15); }

  // ---- S08 the wheel: a wooden tock per name, the row lands on the dip, a light ripple
  at(air(0.6, 100), B(56) - 0.3, 0.3);
  for (let i = 0; i < 8; i++) at(tock(196 * Math.pow(2, [0, 2, 4, 5, 7, 9, 11, 12][i] / 12), 101 + i), B(57 + i), 0.35, -0.6 + i * 0.17);
  at(thump(0.5), B(66), 0.55); at(air(0.9, 110), B(67), 0.15);

  // ---- S09 logo: the last seal, with the only big room in the film
  {
    const tail = s.bus(sr, duration);
    tail.add(seal(120, { low: 48, body: 0.35 }), B(71), { gain: 0.8 });
    tail.add(thump(1.0), B(71), { gain: 0.6 });
    const wet = s.reverb(tail, { decay: 0.86, damp: 0.4, size: 1.3 });
    s.mixInto(b, tail, 1); s.mixInto(b, wet, 0.35);
  }
  return b;
}
