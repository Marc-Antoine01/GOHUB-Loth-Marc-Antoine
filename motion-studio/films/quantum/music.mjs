// Original score for "Faster, Stronger, Computer.": 30 s, 128 BPM, F major, 16 bars.
// Brief: dynamic, bright electronic in the spirit of the client's reference ("circles!" by nekodex): chip-like square leads,
// sparkling arps, side-chained saw bass, drops and silences as punctuation. No melody, harmony or sound is copied from it.
// node films/quantum/music.mjs -> audio/track.wav (deterministic)
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import * as s from '../../lib/synth.mjs';

const SR = 48000, DUR = 30, BEAT = 60 / 128, BAR = BEAT * 4, S16 = BEAT / 4;
const HERE = dirname(fileURLToPath(import.meta.url));

// I–V–vi–IV, one chord per bar.
const PROG = ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb'];
const CHORD = { F: [53, 57, 60, 64], C: [48, 52, 55, 62], Dm: [50, 53, 57, 60], Bb: [46, 50, 53, 57] };
const ROOT = { F: 41, C: 36, Dm: 38, Bb: 34 };
const barOf = (t) => Math.min(15, Math.floor(t / BAR + 1e-9));
const chordAt = (t) => PROG[barOf(t)];
// Sections in bars (docs/shotlist.md).
const SEC = { hook: [0, 1], world: [1, 3], sup: [3, 5], ent: [5, 7], qubit: [7, 8], drop: [8, 10], apps: [10, 14], end: [14, 16] };
const inSec = (t, ...n) => n.some((k) => t >= SEC[k][0] * BAR - 1e-6 && t < SEC[k][1] * BAR - 1e-6);
const SILENCE = [8 * BAR - BEAT, 8 * BAR]; // the beat before the drop

const drums = s.bus(SR, DUR), music = s.bus(SR, DUR), verb = s.bus(SR, DUR), echo = s.bus(SR, DUR), kicks = [];
const kick = s.kick(SR, { freq: 50, punch: 210, decay: 0.3 });
const clap = s.snare(SR, { seed: 8, tone: 230, decay: 0.14 });
const hat = s.hat(SR, { seed: 9, decay: 0.03 }), hatO = s.hat(SR, { seed: 10, decay: 0.13 });
const silent = (t) => t >= SILENCE[0] && t < SILENCE[1];

// ---- drums
for (let i = 0; i * BEAT < DUR - 1e-6; i++) {
  const t = i * BEAT, b = i % 4;
  if (silent(t)) continue;
  // Hook: a hit per word (beats 0-2), the qubit ping takes beat 3. World: soft pulse. Full 4/4 from superposition.
  let g = 0;
  if (inSec(t, 'hook')) g = b < 3 ? 1 : 0;
  else if (inSec(t, 'world')) g = 0.55;
  else if (inSec(t, 'end')) g = t < 15 * BAR ? 0.9 : t === 15 * BAR ? 1 : 0;
  else g = 0.95;
  if (g) { drums.add(kick, t, { gain: g }); kicks.push(t); }
  if ((b === 1 || b === 3) && (inSec(t, 'sup', 'ent', 'drop', 'apps') || (inSec(t, 'end') && t < 15 * BAR))) {
    drums.add(clap, t, { gain: 0.45 }); verb.add(clap, t, { gain: 0.3 });
  }
}
for (let i = 0; i * S16 < DUR - 1e-6; i++) {
  const t = i * S16, q = i % 4;
  if (silent(t) || inSec(t, 'hook', 'world', 'qubit') || t >= 15 * BAR) continue;
  if (q === 2) drums.add(inSec(t, 'drop', 'apps') ? hatO : hat, t, { gain: 0.14, pan: 0.25 });
  else if (inSec(t, 'drop', 'apps')) drums.add(hat, t, { gain: q === 0 ? 0.05 : 0.09, pan: -0.25 });
}

// ---- bass: side-chained saw 8ths from superposition, a sub on every chord change from the drop
for (let i = 0; i * (BEAT / 2) < DUR - 1e-6; i++) {
  const t = i * BEAT / 2;
  if (silent(t) || inSec(t, 'hook', 'world', 'qubit') || t >= 15 * BAR || i % 2 === 0) continue;
  const cut = inSec(t, 'drop', 'apps') ? 1100 : 650;
  music.add(s.tone(SR, s.midiHz(ROOT[chordAt(t)] + 12), BEAT * 0.45, { wave: 'saw', attack: 0.003, release: 0.05, cutoff: cut }), t, { gain: 0.3 });
}
for (let bar = 8; bar < 15; bar++) music.add(s.tone(SR, s.midiHz(ROOT[PROG[bar]]), BAR * 0.95, { attack: 0.005, release: 0.4 }), bar * BAR, { gain: 0.35 });

// ---- pad: wide and soft under the quantum world, brighter later
for (let bar = 0; bar < 16; bar++) {
  const t = bar * BAR;
  if (inSec(t, 'hook')) continue;
  const cut = inSec(t, 'world') ? 900 + bar * 400 : inSec(t, 'drop', 'apps') ? 2600 : 1600;
  music.add(s.pad(SR, CHORD[PROG[bar]].map(s.midiHz), BAR + 0.4, { attack: inSec(t, 'world') ? 0.6 : 0.08, release: 0.4, cutoff: cut }), t, { gain: inSec(t, 'end') ? 0.22 : 0.17 });
}

// ---- sparkle arp: plucked 16ths, the "quantum" texture; sparse in the world, full from superposition
for (let i = 0; i * S16 < DUR - 1e-6; i++) {
  const t = i * S16;
  if (silent(t) || inSec(t, 'hook') || t >= 15 * BAR + BEAT) continue;
  if (inSec(t, 'world', 'qubit') && i % 2) continue;
  const c = CHORD[chordAt(t)], n = [c[0], c[2], c[3], c[1] + 12, c[2] + 12, c[3], c[1] + 12, c[2]][i % 8] + 12;
  const p = s.pluck(SR, s.midiHz(n), 0.25, { seed: 300 + (i % 12), damping: 0.993, brightness: 0.45 });
  music.add(p, t, { gain: inSec(t, 'world') ? 0.1 : 0.12, pan: i % 2 ? 0.4 : -0.4 }); echo.add(p, t, { gain: 0.07 });
}

// ---- chip lead: square wave motif over the drop and the applications (bars 8-13), answered an octave up
const MOTIF = [[77, 76, 72, null, 69, 72, 74, 72], [72, null, 74, 76, 77, null, 79, 76], [77, 76, 72, null, 69, 72, 81, 79], [77, null, 76, 74, 72, null, null, null]];
for (const [startBar, oct] of [[8, 0], [12, 12]]) for (let b = 0; b < 4; b++) MOTIF[b].forEach((n, k) => {
  if (n == null) return;
  const t = (startBar + b) * BAR + k * (BEAT / 2);
  const ld = s.tone(SR, s.midiHz(n + oct), BEAT * 0.42, { wave: 'square', attack: 0.004, release: 0.07, cutoff: 3800 });
  music.add(ld, t, { gain: 0.1, pan: 0.05 }); echo.add(ld, t, { gain: 0.07 }); verb.add(ld, t, { gain: 0.05 });
});
// Hook stabs: one bright chord per word, then the qubit ping on beat 3.
for (let b = 0; b < 3; b++) {
  const st = s.pad(SR, CHORD.F.map((n) => s.midiHz(n + 12)), 0.25, { attack: 0.002, release: 0.18, cutoff: 4200, detune: 0.012 });
  music.add(st, b * BEAT, { gain: 0.38 }); verb.add(st, b * BEAT, { gain: 0.25 });
}
const ping = s.bell(SR, s.midiHz(96), 1.2, { ratio: 2.76, index: 1.3, decay: 0.6 });
for (const t of [3 * BEAT, 15 * BAR]) { music.add(ping, t, { gain: 0.22 }); echo.add(ping, t, { gain: 0.15 }); }

// ---- transitions
music.add(s.riser(SR, BAR - BEAT, { seed: 41, from: 300, to: 11000 }), 7 * BAR, { gain: 0.26 });
for (const t of [0, 8 * BAR, 15 * BAR]) { const im = s.impact(SR, { seed: 50 + t, decay: 1.1 }); drums.add(im, t, { gain: 0.5 }); verb.add(im, t, { gain: 0.25 }); }
// The end chord rings into the loop point.
music.add(s.pad(SR, [53, 57, 60, 64, 69].map(s.midiHz), DUR - 15 * BAR, { attack: 0.01, release: 1.2, cutoff: 3000 }), 15 * BAR, { gain: 0.24 });

// ---- mix
const duck = (t) => { let last = -1; for (const k of kicks) { if (k > t) break; last = k; } return last < 0 ? 1 : 1 - 0.5 * Math.exp(-(t - last) / 0.09); };
const master = s.bus(SR, DUR);
s.mixInto(master, drums, 1);
s.mixInto(master, music, 1, duck);
s.mixInto(master, s.reverb(verb, { decay: 0.83, damp: 0.42 }), 0.45, duck);
s.mixInto(master, s.pingpong(echo, BEAT * 0.75, { feedback: 0.35 }), 0.45, duck);
s.saturate(master, 1.2);
let peak = 0; for (const ch of [master.L, master.R]) for (const v of ch) peak = Math.max(peak, Math.abs(v));
for (const ch of [master.L, master.R]) for (let i = 0; i < ch.length; i++) ch[i] *= Math.pow(10, -1 / 20) / peak;

mkdirSync(join(HERE, 'audio'), { recursive: true });
s.writeWav(join(HERE, 'audio', 'track.wav'), master);
console.log(`track: ${DUR}s @ 128 BPM -> audio/track.wav`);
