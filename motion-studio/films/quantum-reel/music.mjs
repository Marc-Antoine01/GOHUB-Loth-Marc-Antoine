// Original score for SUPERPOSITION: 30 s, 120 BPM, A minor, 15 bars (docs/shotlist.md).
// Cinematic electronic: a ticking intro, a drop on bar 4, a groove through the qubit, entanglement and the machine,
// a build into the search, and a last impact whose chord rings into the loop point.
// node films/quantum-reel/music.mjs -> audio/track.wav (deterministic)
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import * as s from '../../lib/synth.mjs';

const SR = 48000, DUR = 30, BEAT = 0.5, BAR = 2, S16 = BEAT / 4;
const HERE = dirname(fileURLToPath(import.meta.url));

// i–VI–III–VII, one chord per bar.
const CH = { Am: [57, 60, 64, 69], F: [53, 57, 60, 65], C: [55, 60, 64, 67], G: [55, 59, 62, 67] };
const ROOT = { Am: 45, F: 41, C: 48, G: 43 };
const PROG = Array.from({ length: 15 }, (_, i) => ['Am', 'F', 'C', 'G'][i % 4]);
const chordAt = (t) => PROG[Math.min(14, Math.floor(t / BAR + 1e-9))];
const DROP = 4 * BAR, FINAL = 13 * BAR;
const SILENT = [[DROP - BEAT / 2, DROP], [FINAL - BEAT / 2, FINAL]];
const silent = (t) => SILENT.some(([a, b]) => t >= a - 1e-6 && t < b - 1e-6);
const sec = (t) => (t < DROP ? 'intro' : t < 9 * BAR ? 'groove' : t < 11 * BAR ? 'machine' : t < FINAL ? 'build' : 'outro');

const drums = s.bus(SR, DUR), music = s.bus(SR, DUR), verb = s.bus(SR, DUR), echo = s.bus(SR, DUR), kicks = [];
const kick = s.kick(SR, { freq: 46, punch: 190, decay: 0.34 });
const clap = s.snare(SR, { seed: 21, tone: 210, decay: 0.16 });
const hat = s.hat(SR, { seed: 22, decay: 0.025 }), hatO = s.hat(SR, { seed: 23, decay: 0.12 });

// ---- drums
for (let i = 0; i * BEAT < DUR - 1e-6; i++) {
  const t = i * BEAT, b = i % 4, k = sec(t);
  if (silent(t)) continue;
  let g = 0;
  if (k === 'intro') g = t >= 4 && b === 0 ? 0.45 : 0; // a heartbeat once the particle launches
  else if (k === 'outro') g = Math.abs(t - FINAL) < 1e-6 ? 1 : 0;
  else g = k === 'machine' ? (b === 0 || b === 2 ? 1 : 0.7) : 0.95;
  if (g) { drums.add(kick, t, { gain: g }); kicks.push(t); }
  if ((b === 1 || b === 3) && (k === 'groove' || k === 'machine' || k === 'build')) { drums.add(clap, t, { gain: 0.42 }); verb.add(clap, t, { gain: 0.35 }); }
}
for (let i = 0; i * S16 < DUR - 1e-6; i++) {
  const t = i * S16, q = i % 4, k = sec(t);
  if (silent(t) || k === 'outro') continue;
  if (k === 'intro') { if (q === 0 || q === 2) drums.add(hat, t, { gain: 0.05 + 0.05 * (t / DROP), pan: 0.3 }); continue; } // the clock
  drums.add(q === 2 ? hatO : hat, t, { gain: q === 2 ? 0.12 : 0.06 + (k === 'build' ? 0.04 * ((t - 11 * BAR) / (2 * BAR)) : 0), pan: q % 2 ? 0.25 : -0.25 });
}

// ---- sub + bass: a long sub under the intro, side-chained saw offbeats from the drop
for (let bar = 0; bar < 4; bar++) music.add(s.tone(SR, s.midiHz(33), BAR, { attack: bar ? 0.01 : 1.2, release: 0.3 }), bar * BAR, { gain: 0.32 });
for (let i = 0; i * (BEAT / 2) < DUR - 1e-6; i++) {
  const t = (i * BEAT) / 2, k = sec(t);
  if (silent(t) || k === 'intro' || k === 'outro' || i % 2 === 0) continue;
  const cut = k === 'build' ? 700 + 2200 * ((t - 11 * BAR) / (2 * BAR)) : k === 'machine' ? 520 : 900;
  music.add(s.tone(SR, s.midiHz(ROOT[chordAt(t)]), BEAT * 0.46, { wave: 'saw', attack: 0.003, release: 0.05, cutoff: cut }), t, { gain: 0.34 });
}
for (let bar = 4; bar < 13; bar++) music.add(s.tone(SR, s.midiHz(ROOT[PROG[bar]] - 12), BAR * 0.96, { attack: 0.005, release: 0.3 }), bar * BAR, { gain: 0.3 });
// The machine: a low metallic drone under bars 9-10.
music.add(s.pad(SR, [s.midiHz(33), s.midiHz(40), s.midiHz(45.1)], 2 * BAR, { attack: 0.3, release: 0.5, cutoff: 500, detune: 0.004 }), 9 * BAR, { gain: 0.26 });

// ---- pad: dark and wide in the intro, opening up over the groove
for (let bar = 0; bar < 15; bar++) {
  const t = bar * BAR, k = sec(t);
  if (k === 'outro') continue;
  const cut = k === 'intro' ? 500 + bar * 180 : k === 'build' ? 1800 + (bar - 11) * 1200 : 1500;
  music.add(s.pad(SR, CH[PROG[bar]].map((n) => s.midiHz(n - 12)), BAR + 0.3, { attack: k === 'intro' ? 0.8 : 0.06, release: 0.4, cutoff: cut }), t, { gain: k === 'intro' ? 0.13 : 0.15 });
}

// ---- arp: plucked 16ths, sparse in the intro, full from the drop, climbing an octave in the build
for (let i = 0; i * S16 < DUR - 1e-6; i++) {
  const t = i * S16, k = sec(t);
  if (silent(t) || k === 'outro' || t < 2) continue;
  if (k === 'intro' && i % 4) continue;
  const c = CH[chordAt(t)], oct = k === 'build' && t >= 12 * BAR ? 12 : 0;
  const n = [c[0], c[2], c[3], c[1] + 12, c[2] + 12, c[3], c[1] + 12, c[2]][i % 8] + 12 + oct;
  const p = s.pluck(SR, s.midiHz(n), 0.22, { seed: 400 + (i % 16), damping: 0.994, brightness: k === 'machine' ? 0.25 : 0.45 });
  music.add(p, t, { gain: k === 'intro' ? 0.08 : 0.1, pan: i % 2 ? 0.45 : -0.45 }); echo.add(p, t, { gain: 0.08 });
}

// ---- lead: a bell motif over the qubit and entanglement (bars 5-8), answered in the build
const MOTIF = [[76, null, 72, 74, 76, null, 79, null], [77, null, 76, 72, 74, null, null, null], [72, null, 74, 76, 79, null, 81, 79], [76, null, null, 74, 72, null, null, null]];
for (const [start, oct, gain] of [[5, 0, 0.09], [11, 12, 0.06]]) MOTIF.forEach((row, b) => row.forEach((n, j) => {
  if (n == null || start + b > 12) return;
  const t = (start + b) * BAR + j * (BEAT / 2);
  const v = s.bell(SR, s.midiHz(n + oct), 0.9, { ratio: 2.0, index: 1.1, decay: 0.35 });
  music.add(v, t, { gain }); echo.add(v, t, { gain: gain * 0.8 }); verb.add(v, t, { gain: gain * 0.6 });
}));

// ---- the hits
const stab = (t, gain) => { const st = s.pad(SR, CH.Am.map((n) => s.midiHz(n + 12)), 0.6, { attack: 0.002, release: 0.4, cutoff: 5000, detune: 0.01 }); music.add(st, t, { gain }); verb.add(st, t, { gain: gain * 0.8 }); };
music.add(s.riser(SR, BAR - BEAT / 2, { seed: 61, from: 200, to: 12000 }), 3 * BAR, { gain: 0.3 });
music.add(s.riser(SR, BAR - BEAT / 2, { seed: 62, from: 300, to: 14000 }), 12 * BAR, { gain: 0.3 });
for (const t of [DROP, FINAL]) { const im = s.impact(SR, { seed: 70 + t, decay: 1.6 }); drums.add(im, t, { gain: 0.6 }); verb.add(im, t, { gain: 0.3 }); stab(t, 0.32); }
// The last chord rings to the loop point, and the intro's clock comes back in under it (the seam).
music.add(s.pad(SR, [57, 64, 69, 72, 76].map(s.midiHz), DUR - FINAL, { attack: 0.01, release: 1.6, cutoff: 3200 }), FINAL, { gain: 0.2 });
for (let i = 0; FINAL + 1 + i * BEAT < DUR - 1e-6; i++) drums.add(hat, FINAL + 1 + i * BEAT, { gain: 0.04, pan: 0.3 });
// The outro bed: the intro's dark pad and sub return under the end card, so the loop seam joins two quiet, matching beds.
music.add(s.pad(SR, CH.Am.map((n) => s.midiHz(n - 12)), DUR - FINAL - 1, { attack: 1.2, release: 0.8, cutoff: 700 }), FINAL + 1, { gain: 0.14 });
music.add(s.tone(SR, s.midiHz(33), DUR - FINAL - 1, { attack: 1.0, release: 0.6 }), FINAL + 1, { gain: 0.22 });

// ---- mix
const duck = (t) => { let last = -1; for (const k of kicks) { if (k > t) break; last = k; } return last < 0 ? 1 : 1 - 0.5 * Math.exp(-(t - last) / 0.1); };
const master = s.bus(SR, DUR);
s.mixInto(master, drums, 1);
s.mixInto(master, music, 1, duck);
s.mixInto(master, s.reverb(verb, { decay: 0.86, damp: 0.4 }), 0.5, duck);
s.mixInto(master, s.pingpong(echo, BEAT * 0.75, { feedback: 0.38 }), 0.45, duck);
// The two silences are true gaps: the wet tails are cut too (5 ms ramps), so the hits land on nothing.
for (const [a, b] of SILENT) for (const ch of [master.L, master.R]) for (let i = Math.round((a - 0.005) * SR); i < Math.round(b * SR); i++) {
  const t = i / SR; ch[i] *= t < a ? (a - t) / 0.005 : t > b - 0.005 ? (t - (b - 0.005)) / 0.005 : 0;
}
s.saturate(master, 1.25);
let peak = 0; for (const ch of [master.L, master.R]) for (const v of ch) peak = Math.max(peak, Math.abs(v));
for (const ch of [master.L, master.R]) for (let i = 0; i < ch.length; i++) ch[i] *= Math.pow(10, -1 / 20) / peak;
mkdirSync(join(HERE, 'audio'), { recursive: true });
s.writeWav(join(HERE, 'audio', 'track.wav'), master);
console.log(`track: ${DUR}s @ 120 BPM -> audio/track.wav`);
