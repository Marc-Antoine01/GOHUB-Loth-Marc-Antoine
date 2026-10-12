// SFX for SUPERPOSITION, on top of the score (audio/track.wav). Every event sits on the time the picture uses
// (beats.json, or a time read from reel.js where the picture derives it from the camera path).
export function sfx({ sr, duration, beats, synth: s }) {
  const b = s.bus(sr, duration);
  const Bi = (i) => (i <= 0 ? 0 : beats.beats[i] ?? i * (60 / beats.tempo));
  const B = (x) => { const i = Math.floor(x); return x === i ? Bi(i) : Bi(i) + (Bi(i + 1) - Bi(i)) * (x - i); };
  const at = (v, t, gain, pan = 0) => b.add(v, Math.max(0, t), { gain, pan });
  const tick = (f, d = 0.012) => s.tick(sr, { freq: f, decay: d });
  const ping = (midi, d = 0.6) => s.bell(sr, s.midiHz(midi), d * 1.6, { ratio: 3.01, index: 0.8, decay: d });
  const rnd = s.mulberry32(4242);
  const A_MINOR = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84];

  // ---- S1: the point, the launch, the slit, the detections
  for (const k of [0, 1, 2, 3]) at(tick(3200, 0.02), B(k), 0.1); // the point breathes on the first four beats
  at(s.riser(sr, B(6.4) - B(4), { seed: 11, from: 180, to: 5000 }), B(4), 0.16); // it accelerates…
  at(s.whoosh(sr, 0.3, { seed: 12 }), B(6.4) - 0.12, 0.34); // …threads the slit (the camera's zip)…
  at(ping(93, 0.7), B(6.4), 0.16, -0.7); at(ping(93.15, 0.7), B(6.4), 0.16, 0.7); // …and becomes two (hard left, hard right)
  // detections: the first 260 one by one (seeded pitches in A minor), then a hiss whose density follows the count
  const HITS = 18000, t0 = B(8), t1 = B(15.5), when = (i) => t0 + (t1 - t0) * Math.pow(Math.max(0, i - 2) / HITS, 1 / 3.1);
  for (let i = 2; i < 260; i++) {
    const n = A_MINOR[Math.floor(rnd() * A_MINOR.length)] + 12;
    at(s.pluck(sr, s.midiHz(n), 0.12, { seed: 900 + (i % 32), damping: 0.99, brightness: 0.7 }), when(i), 0.05 * (1 - i / 300) + 0.012, rnd() * 1.6 - 0.8);
  }
  { // the torrent: grain noise, density ∝ d(count)/dt, highpassed, gone in the silence before the drop
    const n = Math.round((t1 - t0) * sr), x = new Float32Array(n), r = s.mulberry32(77);
    for (let i = 0; i < n; i++) { const u = i / n, dens = Math.pow(u, 2.1); x[i] = (r() < dens * 0.08 ? (r() * 2 - 1) : 0) * Math.min(1, u * 4); }
    at(s.highpass(x, sr, 3500), t0, 0.5, 0.15);
  }
  at(tick(2400), B(9), 0.1); at(tick(2400), B(11), 0.1);

  // ---- S2: the stripes open, the two states collapse, the dive into the tittle
  for (let k = 0; k < 6; k++) at(tick(1800 + k * 300, 0.008), B(16) + 0.05 + k * 0.075, 0.12, -0.5 + k * 0.2);
  at(ping(88, 0.9), B(18) - 0.1, 0.14, -0.3); at(ping(88.35, 0.9), B(18) - 0.1, 0.14, 0.3); // two detuned states…
  at(ping(100, 0.5), B(18) + 0.12, 0.12); // …collapse into one bright note
  at(tick(2600), B(17), 0.08);
  at(s.riser(sr, B(20) - B(19.2), { seed: 13, from: 500, to: 14000 }), B(19.2), 0.22);

  // ---- S3: the qubit. Its state is sonified: a soft sine whose pitch follows θ (|0⟩ low, |1⟩ high)
  at(s.impact(sr, { seed: 14, decay: 0.5 }), B(20), 0.25);
  {
    const a = B(20.5), z = B(27.4), n = Math.round((z - a) * sr), x = new Float32Array(n);
    const th = (t) => { const u = Math.min(1, Math.max(0, (t - B(20)) / (B(28) - B(20)))); const io = (v) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2); return Math.PI * 0.6 * io(Math.min(1, u * 1.35)) + 0.14 * Math.sin(u * 13) * u; };
    let ph = 0;
    for (let i = 0; i < n; i++) { const t = a + i / sr, f = 520 + 380 * (th(t) / Math.PI); ph += f / sr; const env = Math.min(1, i / (0.4 * sr)) * Math.min(1, (n - i) / (0.3 * sr)); x[i] = Math.sin(2 * Math.PI * ph) * env * (0.6 + 0.4 * Math.sin(2 * Math.PI * ph * 2.002)); }
    at(x, a, 0.05, 0.1);
  }
  for (const t of [B(21), B(21.5), B(22), B(22.5)]) at(tick(2800), t, 0.07, 0.3);
  at(s.whoosh(sr, 0.6, { seed: 15 }), B(27.4), 0.36, 0.6); // the whip

  // ---- S4: entanglement
  at(s.whoosh(sr, 0.4, { seed: 16 }), B(28) - 0.05, 0.22, -0.4);
  at(tick(2400), B(29), 0.1);
  for (let k = 0; k < 22; k++) { const u = k / 21; at(tick(2200 + 1400 * u, 0.006), B(30.3) + (B(31.8) - B(30.3)) * (1 - Math.pow(1 - u, 2)), 0.06); } // the distance counter
  at(s.whoosh(sr, 0.35, { seed: 17 }), B(31.6) - 0.05, 0.24, 0.8); // the split slides in
  at(ping(91, 0.8), B(32), 0.22, -1); at(ping(91, 0.8), B(32), 0.22, 1); // measured: both answer on the same sample
  at(s.kick(sr, { freq: 70, punch: 200, decay: 0.12 }), B(32), 0.35);
  at(tick(2600), B(33), 0.07);

  // ---- S5: the machine: a cold breath under the crane, a metallic clank as each stage's readout appears
  at(s.whoosh(sr, 0.7, { seed: 18 }), B(36) - 0.1, 0.3);
  {
    const a = B(36), z = B(44), n = Math.round((z - a) * sr), x = new Float32Array(n), r = s.mulberry32(19);
    for (let i = 0; i < n; i++) { const u = i / n; x[i] = (r() * 2 - 1) * Math.sin(Math.PI * u) * 0.5; }
    at(s.lowpass(s.highpass(x, sr, 900), sr, 4000), a, 0.12);
  }
  [18.4333, 19.0, 19.5667, 20.0833, 20.55].forEach((t, i) => {
    at(s.bell(sr, s.midiHz(45 - i * 2), 1.2, { ratio: 1.41, index: 2.2, decay: 0.45 }), t, 0.22, -0.3 + i * 0.15);
    at(s.kick(sr, { freq: 60, punch: 90, decay: 0.1 }), t, 0.18);
  });
  at(tick(2400), B(38), 0.09); at(tick(2800), B(40), 0.06);
  at(s.riser(sr, B(44) - B(42.2), { seed: 20, from: 300, to: 9000 }), B(42.2), 0.2); // the dive into the chip

  // ---- S6: Grover: an oracle click, then a note per iteration, climbing as the answer is amplified
  const STEPS = [22.496, 22.7493, 23.0027, 23.252, 23.5013, 23.74, 23.9787, 24.236, 24.4933, 24.752, 25.0107, 25.2614, 25.512];
  for (let j = 1; j < STEPS.length; j++) {
    at(tick(1200, 0.006), STEPS[j - 1] + 0.01, 0.06, -0.2);
    const n = A_MINOR[Math.min(A_MINOR.length - 1, j - 1)] + 12;
    at(s.pluck(sr, s.midiHz(n), 0.4, { seed: 700 + j, damping: 0.995, brightness: 0.55 }), STEPS[j - 1] + (STEPS[j] - STEPS[j - 1]) * 0.35, 0.09 + 0.006 * j, (j % 2 ? 0.35 : -0.35));
  }
  at(ping(96, 1.0), STEPS[12], 0.16); // found
  at(tick(2400), B(45), 0.08); at(tick(2400), B(48), 0.08);

  // ---- S7: the point lifts out, the card types, the loop
  {
    const a = B(52) + 0.3, z = B(55), n = Math.round((z - a) * sr), x = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) { const u = i / n, f = 880 * Math.pow(2, u * 1.0); ph += f / sr; x[i] = Math.sin(2 * Math.PI * ph) * Math.sin(Math.PI * u) * 0.5; }
    at(x, a, 0.05);
  }
  for (const t of [B(53.5), B(54.5), B(55)]) at(tick(2600), t, 0.07, 0.4);
  at(tick(1800, 0.02), B(58.6) - 0.3, 0.05); // the card clears
  return b;
}
