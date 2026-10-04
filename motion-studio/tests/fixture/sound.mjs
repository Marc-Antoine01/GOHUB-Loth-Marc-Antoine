// Tooling fixture: 120 BPM kick + pad bed, ticks on the measured beats.
export function score({ sr, duration, synth: s }) {
  const b = s.bus(sr, duration), kick = s.kick(sr);
  for (let t = 0; t < duration; t += 0.5) b.add(kick, t, { gain: 0.9 });
  b.add(s.pad(sr, [57, 60, 64].map(s.midiHz), duration), 0, { gain: 0.25 });
  return b;
}
export function sfx({ sr, duration, beats, synth: s }) {
  const b = s.bus(sr, duration), tick = s.tick(sr);
  beats.beats.forEach((t, i) => b.add(tick, t, { gain: 0.2, pan: i % 2 ? 0.4 : -0.4 }));
  return b;
}
