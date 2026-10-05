// Original score for "Formations au CHUV": 30 s, 120 BPM, G major, written to loop seamlessly.
// Brief: corporate UI, rhythmic, inspiring. Style reference only (whatships Legora film); no material is taken from it.
// node films/chuv-formations/music.mjs  ->  audio/track.wav (deterministic: seeded noise, no clocks)
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import * as s from '../../lib/synth.mjs';

const SR = 48000, DUR = 30, BEAT = 0.5, BAR = 2, S16 = BEAT / 4;
const HERE = dirname(fileURLToPath(import.meta.url));

// One chord per bar. The last two bars (C, D) lead back into G at the loop point.
const PROG = ['G', 'D', 'Em', 'C', 'G', 'D', 'Em', 'C', 'G', 'D', 'Em', 'C', 'G', 'C', 'D'];
const CHORD = { G: [55, 59, 62, 69], D: [50, 54, 57, 64], Em: [52, 55, 59, 62], C: [48, 52, 55, 62] };
const ROOT = { G: 43, D: 38, Em: 40, C: 36 };
const barOf = (t) => Math.min(PROG.length - 1, Math.floor(t / BAR + 1e-9));
const chordAt = (t) => PROG[barOf(t)];

// Sections in bars, matching docs/shotlist.md.
const SEC = { hook: [0, 1], page: [1, 3], cats: [3, 5], path: [5, 7], know: [7, 9], figs: [9, 11], net: [11, 13], offer: [13, 15] };
const inSec = (t, ...names) => names.some((n) => t >= SEC[n][0] * BAR && t < SEC[n][1] * BAR);

const drums = s.bus(SR, DUR), music = s.bus(SR, DUR), verb = s.bus(SR, DUR), echo = s.bus(SR, DUR);
const kicks = [];

// ---- drums
const kick = s.kick(SR, { freq: 50, punch: 150, decay: 0.32 });
const clap = s.snare(SR, { seed: 12, tone: 240, decay: 0.12 });
const hat = s.hat(SR, { seed: 23, decay: 0.03 }), hatOpen = s.hat(SR, { seed: 24, decay: 0.12 });
const shaker = s.hat(SR, { seed: 25, decay: 0.018 });
for (let i = 0; i * BEAT < DUR - 1e-6; i++) {
  const t = i * BEAT, b = i % 4;
  const halftime = inSec(t, 'net');
  // A pulse on every beat keeps the grid measurable; the half-time lift only softens beats 2-4.
  const gap = t >= 13.5 && t < 14; // breath before the drop
  if (!gap) { drums.add(kick, t, { gain: halftime && b !== 0 ? 0.42 : 0.95 }); kicks.push(t); }
  if ((b === 1 || b === 3) && t >= SEC.cats[0] * BAR && !halftime && !(t >= 13.5 && t < 14)) {
    drums.add(clap, t, { gain: 0.42, pan: 0.05 }); verb.add(clap, t, { gain: 0.3 });
  }
}
for (let i = 0; i * S16 < DUR - 1e-6; i++) {
  const t = i * S16, q = i % 4;
  if (t < SEC.page[0] * BAR || (t >= 13.5 && t < 14)) continue;
  if (q === 2) drums.add(inSec(t, 'know', 'figs', 'offer') ? hatOpen : hat, t, { gain: 0.13, pan: 0.3 });
  if (inSec(t, 'path', 'know', 'figs', 'offer') && q !== 2) drums.add(shaker, t, { gain: q === 0 ? 0.05 : 0.08, pan: -0.35 });
}

// ---- bass: 8ths on the root, sidechained, rests on every downbeat kick
for (let i = 0; i * (BEAT / 2) < DUR - 1e-6; i++) {
  const t = i * BEAT / 2;
  if (i % 2 === 0 || inSec(t, 'hook') || (t >= 13.5 && t < 14)) continue;
  const cut = inSec(t, 'know', 'figs', 'offer') ? 900 : 600;
  music.add(s.tone(SR, s.midiHz(ROOT[chordAt(t)] + 12), BEAT * 0.45, { wave: 'saw', attack: 0.003, release: 0.06, cutoff: cut }), t, { gain: 0.3 });
}
for (let bar = 1; bar < PROG.length; bar++) if (bar !== 11 && bar !== 12) music.add(s.tone(SR, s.midiHz(ROOT[PROG[bar]]), BAR * 0.9, { attack: 0.01, release: 0.5 }), bar * BAR, { gain: 0.32 });

// ---- pads: warm bed under everything, swells into the drop and the loop point
for (let bar = 0; bar < PROG.length; bar++) {
  const notes = CHORD[PROG[bar]].map((n) => s.midiHz(n));
  const lift = inSec(bar * BAR, 'net') ? 2600 : 1500;
  music.add(s.pad(SR, notes, BAR + 0.5, { attack: 0.15, release: 0.5, cutoff: lift }), bar * BAR, { gain: 0.2 });
}

// ---- UI plucks: the signature. Chord-tone arp, 8ths early, 16ths from the path onward.
for (let i = 0; i * S16 < DUR - 1e-6; i++) {
  const t = i * S16;
  const dense = inSec(t, 'path', 'know', 'figs', 'offer');
  if (!dense && i % 2) continue;
  if (inSec(t, 'net') && i % 4) continue;
  const c = CHORD[chordAt(t)], n = [c[0], c[1], c[2], c[3], c[2] + 12, c[3], c[1] + 12, c[2]][i % 8] + 12;
  const p = s.pluck(SR, s.midiHz(n), 0.35, { seed: 100 + (i % 16), damping: 0.994, brightness: 0.35 });
  const g = inSec(t, 'hook') ? 0.22 : 0.15;
  music.add(p, t, { gain: g, pan: i % 2 ? 0.35 : -0.35 }); echo.add(p, t, { gain: 0.08 });
}

// ---- keys: off-beat chord stabs in the chorus and the outro
for (let i = 0; i * BEAT < DUR - 1e-6; i++) {
  const t = i * BEAT + BEAT / 2;
  if (!inSec(t, 'know', 'figs', 'offer')) continue;
  const k = s.keys(SR, CHORD[chordAt(t)].map((n) => s.midiHz(n + 12)), 0.4, { decay: 0.5, release: 0.12 });
  music.add(k, t, { gain: 0.2 }); verb.add(k, t, { gain: 0.15 });
}

// ---- bell lead: the inspiring motif, two bars, played over the chorus (bars 7-10) and once in the outro
const MOTIF = [[74, null, 71, null, 69, 71, null, 67], [74, null, 76, null, 74, 71, null, 69]];
for (const startBar of [7, 9, 13]) for (let b = 0; b < 2; b++) MOTIF[b].forEach((n, k) => {
  if (n == null) return;
  const t = (startBar + b) * BAR + k * (BEAT / 2);
  const bl = s.bell(SR, s.midiHz(n + 12), 1.0, { ratio: 3.5, index: 1.8, decay: 0.55 });
  music.add(bl, t, { gain: 0.16, pan: 0.1 }); echo.add(bl, t, { gain: 0.12 }); verb.add(bl, t, { gain: 0.12 });
});

// ---- transitions: hook hit, riser into the drop, lift before the outro, fill into the loop
for (const t of [0, 14]) { const im = s.impact(SR, { seed: 40 + t, decay: 0.9 }); drums.add(im, t, { gain: 0.45 }); verb.add(im, t, { gain: 0.25 }); }
music.add(s.riser(SR, 2.0, { seed: 31, from: 300, to: 9000 }), 12, { gain: 0.22 });
music.add(s.riser(SR, 2.0, { seed: 32, from: 400, to: 10000 }), 24, { gain: 0.2 });
for (let k = 0; k < 4; k++) drums.add(s.snare(SR, { seed: 60 + k, tone: 220, decay: 0.08 }), 29.5 + k * S16 * 0.5 + k * 0.06, { gain: 0.12 + k * 0.05 });

// ---- mix
const duck = (t) => {
  let last = -1;
  for (const k of kicks) { if (k > t) break; last = k; }
  return last < 0 ? 1 : 1 - 0.45 * Math.exp(-(t - last) / 0.1);
};
const master = s.bus(SR, DUR);
s.mixInto(master, drums, 1);
s.mixInto(master, music, 1, duck);
s.mixInto(master, s.reverb(verb, { decay: 0.82, damp: 0.45 }), 0.5, duck);
s.mixInto(master, s.pingpong(echo, BEAT * 0.75, { feedback: 0.35 }), 0.5, duck);
s.saturate(master, 1.15);
// Peak to -1 dBFS; loudness is set later on the final mix (-14 LUFS).
let peak = 0;
for (const ch of [master.L, master.R]) for (const v of ch) peak = Math.max(peak, Math.abs(v));
const g = Math.pow(10, -1 / 20) / peak;
for (const ch of [master.L, master.R]) for (let i = 0; i < ch.length; i++) ch[i] *= g;

mkdirSync(join(HERE, 'audio'), { recursive: true });
s.writeWav(join(HERE, 'audio', 'track.wav'), master);
console.log(`track: ${DUR}s @ ${60 / BEAT} BPM -> audio/track.wav`);
