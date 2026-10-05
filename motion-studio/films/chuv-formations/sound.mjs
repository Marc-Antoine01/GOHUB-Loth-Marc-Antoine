// SFX under the supplied track (audio/track.wav). Every hit sits on a beats.json index used by the shots.
export function sfx({ sr, duration, beats, synth: s }) {
  const b = s.bus(sr, duration), B = (i) => (i <= 0 ? 0 : beats.beats[i] ?? i * (60 / beats.tempo));
  const at = (v, t, gain, pan = 0) => b.add(v, Math.max(0, t), { gain, pan });
  const tick = (f = 2400) => s.tick(sr, { freq: f, decay: 0.012 });
  const click = (() => { const c = s.tick(sr, { freq: 1800, decay: 0.014 }), k = s.kick(sr, { freq: 110, punch: 260, decay: 0.05 }); for (let i = 0; i < c.length; i++) c[i] += (k[i] || 0) * 0.5; return c; })();
  const air = (len, seed) => s.whoosh(sr, len, { seed });
  // S01 hook: a swish per line as it rotates in
  for (let i = 0; i < 4; i++) at(air(0.3, 10 + i), B(i) - 0.26, 0.22, i % 2 ? 0.3 : -0.3);
  // camera travels between regions
  for (const [t, len] of [[B(6) - 0.05, 0.6], [B(12), 0.5], [B(20), 0.5], [B(28), 0.6], [B(40), 0.55], [B(48), 0.6], [B(60), 0.6], [30, 0.7]]) at(air(len, Math.round(t * 10)), t - len * 0.8, 0.3);
  // S02 pills, activation, H1
  for (let i = 0; i < 5; i++) at(tick(2000 + i * 150), B(6) + i * (B(7) - B(6)) / 2, 0.18, -0.4 + i * 0.2);
  at(click, B(9), 0.5); at(tick(3000), B(10), 0.2);
  // S03 ring collapse: lock
  at(s.kick(sr, { freq: 70, punch: 120, decay: 0.15 }), B(18), 0.45); at(click, B(18) + 0.04, 0.3);
  // S04 steps, last one is the payoff
  for (const i of [20, 21, 22, 24]) at(tick(2600), B(i), 0.22);
  at(click, B(26), 0.55); at(s.bell(sr, 1318.5, 0.8, { index: 1.2, decay: 0.4 }), B(26), 0.12);
  // S05 card turn
  at(air(0.5, 77), B(34) - 0.45, 0.3);
  // S06 counters: ticks while counting, a hit on each landing
  for (const i of [41, 43, 46]) { for (let k = 0; k < 6; k++) at(tick(2200 + k * 100), B(i) - 0.7 + k * 0.1, 0.1); at(click, B(i), 0.45); }
  // S07 nodes pop, links draw, network closes
  for (let i = 0; i < 6; i++) at(tick(1800 + i * 200), B(49 + i), 0.16, -0.5 + i * 0.2);
  at(s.bell(sr, 1760, 1.0, { index: 1.4, decay: 0.5 }), B(57), 0.12); at(click, B(57), 0.35);
  // S08 button press, then the loop
  at(click, B(70), 0.7);
  return b;
}
