// Original score: 120 BPM, D minor, cut to the sections in film.json.
// hook (stabs + kick) -> service (full groove) -> features (arp opens up) -> riser -> metric (half-time hit) -> lockup (resolve).

const BEAT = 0.5, S16 = BEAT / 4;
// Chord per 1.5 s (three beats): the changes land on section cuts at 3, 6, 9, 12, 15 and 17.5.
const CHORDS = [
  [0, 'Dm'], [3, 'Bb'], [4.5, 'F'], [6, 'Dm'], [7.5, 'Bb'], [9, 'F'], [10.5, 'C'],
  [12, 'Gm'], [13.5, 'A'], [15, 'Dm'], [17.5, 'Bb'], [19, 'F'],
];
const NOTES = { Dm: [50, 53, 57], Bb: [46, 50, 53], F: [53, 57, 60], C: [48, 52, 55], Gm: [55, 58, 62], A: [57, 61, 64] };
const chordAt = (t) => CHORDS.filter(([s]) => s <= t + 1e-6).at(-1)[1];

export function score({ sr, duration, synth: s }) {
  const drums = s.bus(sr, duration), music = s.bus(sr, duration), verbSend = s.bus(sr, duration), delaySend = s.bus(sr, duration);
  const kicks = [];
  const kick = s.kick(sr, { freq: 46, punch: 190, decay: 0.42 });
  const clap = s.snare(sr, { seed: 11, tone: 210, decay: 0.16 });
  const hatC = s.hat(sr, { seed: 21, decay: 0.035 }), hatO = s.hat(sr, { seed: 22, decay: 0.16 });

  // ---- drums
  for (let t = 0; t < 19.99; t += BEAT) {
    const half = t >= 15 && t < 17.5; // metric: half-time
    if (!half || t === 15 || t === 16.5) { drums.add(kick, t, { gain: 1 }); kicks.push(t); }
    const inBar = Math.round(t / BEAT) % 4;
    if (t >= 3 && !half && (inBar === 1 || inBar === 3)) { drums.add(clap, t, { gain: 0.55 }); verbSend.add(clap, t, { gain: 0.35 }); }
    if (half && t === 16) { drums.add(clap, t, { gain: 0.7 }); verbSend.add(clap, t, { gain: 0.6 }); }
  }
  for (let i = 0; i * S16 < 17.5; i++) {
    const t = i * S16, pos = i % 4;
    if (t >= 15 && t < 17.5) continue;
    if (pos === 2) drums.add(hatO, t, { gain: 0.16, pan: 0.25 });
    else if (t >= 3) drums.add(hatC, t, { gain: pos === 0 ? 0.06 : 0.1, pan: -0.25 });
  }

  // ---- bass: rolling 16ths on the root, rests on the kick so the low end never fights
  for (let i = 0; i * S16 < 17.5; i++) {
    const t = i * S16;
    if (i % 4 === 0 || (t >= 15 && t < 17.5)) continue;
    const root = NOTES[chordAt(t)][0] - 12;
    music.add(s.tone(sr, s.midiHz(root), S16 * 0.9, { wave: 'saw', attack: 0.003, release: 0.05, cutoff: t < 3 ? 420 : 700 }), t, { gain: 0.32 });
  }
  // Sub drops under the two big hits.
  for (const t of [15, 17.5]) music.add(s.tone(sr, s.midiHz(26), 1.6, { attack: 0.002, release: 1.2 }), t, { gain: 0.6 });

  // ---- stabs: syncopated chord hits in the hook, then on the off-beats of each change
  const stabAt = (t, gain, open) => {
    const v = NOTES[chordAt(t)].flatMap((n) => [n + 12, n + 24]);
    const stab = s.pad(sr, v.map(s.midiHz), 0.22, { attack: 0.002, release: 0.16, cutoff: open, detune: 0.01 });
    music.add(stab, t, { gain }); verbSend.add(stab, t, { gain: gain * 0.6 }); delaySend.add(stab, t, { gain: gain * 0.3 });
  };
  for (const bar of [0, 2]) for (const p of [0, 3, 6, 10, 12]) if (bar + p * S16 < 3) stabAt(bar + p * S16, 0.5, 3200);
  for (const [t] of CHORDS) if (t >= 3 && t < 15) stabAt(t, 0.32, 2400);

  // ---- arp: 16th chord tones through the three features, filter opening as the energy builds
  for (let i = 0; i * S16 < 9; i++) {
    const t = 6 + i * S16, v = NOTES[chordAt(t)], n = [v[0], v[1], v[2], v[1] + 12][i % 4] + 12;
    const cut = 900 + 4200 * (i / 72);
    const pl = s.tone(sr, s.midiHz(n), 0.12, { wave: 'saw', attack: 0.002, release: 0.09, cutoff: cut });
    music.add(pl, t, { gain: 0.13, pan: i % 2 ? 0.3 : -0.3 }); delaySend.add(pl, t, { gain: 0.1 });
  }

  // ---- pad bed, everywhere except the hook (the hook is all punch)
  for (const [i, [t, c]] of CHORDS.entries()) {
    if (t < 3) continue;
    const end = CHORDS[i + 1]?.[0] ?? duration;
    music.add(s.pad(sr, NOTES[c].map(s.midiHz), end - t + 0.6, { attack: 0.08, release: 0.6, cutoff: 1400 }), t, { gain: 0.22 });
  }
  // Final chord rings out under the CTA.
  music.add(s.pad(sr, [50, 53, 57, 62, 65].map(s.midiHz), 1.0, { attack: 0.01, release: 0.9, cutoff: 2600 }), 19, { gain: 0.3 });

  // ---- transitions: riser into the metric, impacts on the two hits
  const rise = s.riser(sr, 2.5, { seed: 31, from: 250, to: 11000 });
  music.add(rise, 12.5, { gain: 0.35 });
  for (const t of [0, 15, 17.5]) { const im = s.impact(sr, { seed: 41 + t }); drums.add(im, t, { gain: 0.55 }); verbSend.add(im, t, { gain: 0.25 }); }

  // ---- mix: sidechain music to the kick, add returns, glue
  const duck = (t) => {
    let last = -1;
    for (const k of kicks) { if (k > t) break; last = k; }
    return last < 0 ? 1 : 1 - 0.55 * Math.exp(-(t - last) / 0.09);
  };
  const master = s.bus(sr, duration);
  s.mixInto(master, drums, 1);
  s.mixInto(master, music, 1, duck);
  s.mixInto(master, s.reverb(verbSend, { decay: 0.84, damp: 0.4 }), 0.5, duck);
  s.mixInto(master, s.pingpong(delaySend, BEAT * 0.75, { feedback: 0.38 }), 0.5, duck);
  return s.saturate(master, 1.3);
}
