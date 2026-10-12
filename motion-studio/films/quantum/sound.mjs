// SFX on top of the score (audio/track.wav), each on a beats.json index used by the shots.
export function sfx({ sr, duration, beats, synth: s }) {
  const b = s.bus(sr, duration), B = (i) => (i <= 0 ? 0 : beats.beats[i] ?? i * (60 / beats.tempo));
  const at = (v, t, gain, pan = 0) => b.add(v, Math.max(0, t), { gain, pan });
  const tick = (f) => s.tick(sr, { freq: f, decay: 0.012 });
  const glass = (midi, g = 0.18) => s.bell(sr, s.midiHz(midi), 0.9, { ratio: 3.01, index: 0.9, decay: 0.45 });
  // Word builds: a soft tick per word.
  for (const t of [0.1, B(1), B(2), B(9), B(10), B(11), B(21), B(22), B(24), B(25), B(34), B(45), B(65), B(66), B(73), B(74), B(81), B(82), B(88) + 0.3, B(89), B(90)]) at(tick(2600), t, 0.14);
  // The qubit wakes: glass ping; snap zoom: air.
  at(glass(100), B(3), 0.2); at(s.whoosh(sr, 0.35, { seed: 3 }), B(8) - 0.32, 0.3);
  // Orbitals snap: granular shimmer.
  const sh = s.riser(sr, 0.6, { seed: 5, from: 2000, to: 12000 }); at(sh, B(12) - 0.6, 0.12);
  // Wipes: a whoosh each.
  for (const t of [B(20), B(32), B(44), B(64), B(72), B(80), B(88), 44.45]) at(s.whoosh(sr, 0.45, { seed: Math.round(t * 7) }), t - 0.3, 0.26, 0);
  // Superposition: two detuned pings, left and right, on the split.
  at(glass(96), B(24), 0.14, -0.6); at(glass(96.3), B(24), 0.14, 0.6);
  // Entanglement: both sides hit on the same sample.
  at(glass(91), B(36), 0.2, -0.9); at(glass(91), B(36), 0.2, 0.9);
  // Lattice rows: rising ticks on each beat of the drop section.
  for (let r = 0; r < 7; r++) at(tick(1800 + r * 260), B(52 + r), 0.16, -0.4 + r * 0.13);
  at(glass(103), B(59), 0.16);
  // Applications: molecule closes, route resolves, lock snaps.
  at(glass(88), B(67), 0.18);
  at(s.whoosh(sr, 0.3, { seed: 48 }), B(75) - 0.25, 0.2);
  at(s.kick(sr, { freq: 90, punch: 300, decay: 0.08 }), B(83), 0.5); at(tick(1500), B(83), 0.3);
  // End: the qubit lands as the full stop.
  at(glass(100), B(91), 0.22);
  return b;
}
