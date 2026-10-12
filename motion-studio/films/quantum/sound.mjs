// SFX on top of the score (audio/track.wav), each on a beats.json index used by the shots.
export function sfx({ sr, duration, beats, synth: s }) {
  const b = s.bus(sr, duration), B = (i) => (i <= 0 ? 0 : beats.beats[i] ?? i * (60 / beats.tempo));
  const Bf = (x) => { const i = Math.floor(x); return B(i) + (B(i + 1) - B(i)) * (x - i); };
  const at = (v, t, gain, pan = 0) => b.add(v, Math.max(0, t), { gain, pan });
  const tick = (f) => s.tick(sr, { freq: f, decay: 0.012 });
  const glass = (midi, g = 0.18) => s.bell(sr, s.midiHz(midi), 0.9, { ratio: 3.01, index: 0.9, decay: 0.45 });
  // Word builds: a soft tick per word.
  for (const t of [0.1, B(1), B(2), B(9), B(10), B(11), B(21), B(22), B(24), B(25), B(34), B(45), B(65), B(66), B(73), B(74), B(81), B(82), B(88) + 0.3, B(89), B(90)]) at(tick(2600), t, 0.14);
  // The qubit wakes: glass ping; snap zoom: air.
  at(glass(100), B(3), 0.2); at(s.whoosh(sr, 0.35, { seed: 3 }), B(8) - 0.32, 0.3);
  for (const k of [5, 6, 7]) at(tick(4200), B(k), 0.06); // its heartbeat ripples
  // Orbitals snap: granular shimmer. The measurement: one glass note as the cloud collapses.
  const sh = s.riser(sr, 0.6, { seed: 5, from: 2000, to: 12000 }); at(sh, B(13) - 0.6, 0.12);
  at(glass(98), B(16), 0.16, 0.4);
  // Wipes: a whoosh each.
  for (const t of [B(20), B(32), B(44), B(64), B(72), B(80), B(88), 44.45]) at(s.whoosh(sr, 0.45, { seed: Math.round(t * 7) }), t - 0.3, 0.26, 0);
  // Superposition: two detuned pings, left and right, on the split.
  at(glass(96), B(24), 0.14, -0.6); at(glass(96.3), B(24), 0.14, 0.6);
  at(glass(93), B(28), 0.08, -0.5); at(glass(93), B(30), 0.08, 0.5); // the weights swing
  // Entanglement: both sides hit on the same sample.
  for (const k of [36, 40]) { at(glass(91), B(k), 0.2, -0.9); at(glass(91), B(k), 0.2, 0.9); }
  // The Bloch arrow lands on the equator.
  at(tick(3000), B(49), 0.14);
  // Lattice rows: rising ticks on each beat of the drop section.
  for (let r = 0; r < 7; r++) at(tick(1800 + r * 260), Bf(52 + r * 1.4), 0.16, -0.4 + r * 0.13);
  at(glass(103), B(61), 0.16);
  for (const k of [62, 63]) at(tick(3400), B(k), 0.07); // computation waves
  // Applications: molecule closes, route resolves, lock snaps.
  at(glass(88), B(68), 0.18);
  for (const k of [69, 70, 71]) at(tick(2200), B(k), 0.06);
  at(s.whoosh(sr, 0.3, { seed: 48 }), B(76) - 0.25, 0.2); at(glass(95), B(79), 0.14, 0.5);
  // The old lock cracks open, the new one snaps shut.
  at(s.snare(sr, { seed: 77, tone: 400, decay: 0.09 }), B(83), 0.3); at(tick(900), B(83), 0.25);
  at(s.kick(sr, { freq: 90, punch: 300, decay: 0.08 }), B(85), 0.5); at(tick(1500), B(85), 0.3);
  // End: the qubit lands as the full stop.
  at(glass(100), B(91), 0.22);
  for (const k of [92, 93]) at(tick(4200), B(k), 0.06);
  return b;
}
