// Original score for "Formations au CHUV": 30 s, 144 BPM (72 BPM pulse), A minor, written to loop seamlessly.
// Brief: corporate UI, rhythmic, inspiring, based on the whatships Legora film. Taken from it: tempo feel, key, energy shape
// (steady, a breath around the first third, full return); see refs/grammar.md. No melody, harmony or sound is copied.
// node films/chuv-formations/music.mjs  ->  audio/track.wav (deterministic: seeded noise, no clocks)
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import * as s from '../../lib/synth.mjs';

const SR = 48000, DUR = 30, BEAT = 60 / 144, BAR = BEAT * 4, S16 = BEAT / 4; // 18 bars = 30 s
const HERE = dirname(fileURLToPath(import.meta.url));

// One chord per bar: i–VI–III–VII, the uplifting minor loop. The last bars (F, G) lead back into Am at the loop point.
const PROG = ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'];
const CHORD = { Am: [57, 60, 64, 71], F: [53, 57, 60, 67], C: [52, 55, 60, 62], G: [55, 59, 62, 69] };
const ROOT = { Am: 45, F: 41, C: 36, G: 43 };
const barOf = (t) => Math.min(PROG.length - 1, Math.floor(t / BAR + 1e-9));
const chordAt = (t) => PROG[barOf(t)];

// Sections in bars, matching docs/shotlist.md.
const SEC = { hook: [0, 1], page: [1, 3], cats: [3, 5], path: [5, 7], know: [7, 10], figs: [10, 12], net: [12, 15], offer: [15, 18] };
const GAP = [SEC.know[0] * BAR - BEAT, SEC.know[0] * BAR]; // one-beat breath into the breakdown
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
  const breath = inSec(t, 'know'), gap = t >= GAP[0] && t < GAP[1];
  // Half-time feel (the reference's 72 BPM pulse): strong kick on 1 and 3, a soft low pulse on 2 and 4 so the 144 grid stays measurable.
  if (!gap) { drums.add(kick, t, { gain: breath ? 0.38 : b % 2 === 0 ? 0.95 : 0.4 }); kicks.push(t); }
  if (b === 2 && t >= SEC.cats[0] * BAR && !breath && !gap) { drums.add(clap, t, { gain: 0.45, pan: 0.05 }); verb.add(clap, t, { gain: 0.32 }); }
}
for (let i = 0; i * S16 < DUR - 1e-6; i++) {
  const t = i * S16, q = i % 4;
  if (t < SEC.page[0] * BAR || (t >= GAP[0] && t < GAP[1]) || inSec(t, 'know')) continue;
  if (q === 2) drums.add(inSec(t, 'figs', 'offer') ? hatOpen : hat, t, { gain: 0.13, pan: 0.3 });
  if (inSec(t, 'path', 'figs', 'net', 'offer') && q !== 2) drums.add(shaker, t, { gain: q === 0 ? 0.05 : 0.08, pan: -0.35 });
}

// ---- bass: 8ths on the root, sidechained, rests on every downbeat kick
for (let i = 0; i * (BEAT / 2) < DUR - 1e-6; i++) {
  const t = i * BEAT / 2;
  if (i % 2 === 0 || inSec(t, 'hook', 'know') || (t >= GAP[0] && t < GAP[1])) continue;
  const cut = inSec(t, 'figs', 'offer') ? 900 : 600;
  music.add(s.tone(SR, s.midiHz(ROOT[chordAt(t)] + 12), BEAT * 0.45, { wave: 'saw', attack: 0.003, release: 0.06, cutoff: cut }), t, { gain: 0.3 });
}
for (let bar = 1; bar < PROG.length; bar++) if (!inSec(bar * BAR, 'know')) music.add(s.tone(SR, s.midiHz(ROOT[PROG[bar]]), BAR * 0.9, { attack: 0.01, release: 0.5 }), bar * BAR, { gain: 0.32 });

// ---- pads: warm bed under everything, swells into the drop and the loop point
for (let bar = 0; bar < PROG.length; bar++) {
  const notes = CHORD[PROG[bar]].map((n) => s.midiHz(n));
  const lift = inSec(bar * BAR, 'know') ? 3200 : inSec(bar * BAR, 'net') ? 2400 : 1500;
  music.add(s.pad(SR, notes, BAR + 0.5, { attack: 0.15, release: 0.5, cutoff: lift }), bar * BAR, { gain: 0.2 });
}

// ---- UI plucks: the signature. Chord-tone arp, 8ths early, 16ths from the path onward.
for (let i = 0; i * S16 < DUR - 1e-6; i++) {
  const t = i * S16;
  const dense = inSec(t, 'path', 'figs', 'net', 'offer');
  if (!dense && i % 2) continue;
  if (inSec(t, 'know') && i % 4) continue; // the breath: quarter-note plucks only
  const c = CHORD[chordAt(t)], n = [c[0], c[1], c[2], c[3], c[2] + 12, c[3], c[1] + 12, c[2]][i % 8] + 12;
  const p = s.pluck(SR, s.midiHz(n), 0.35, { seed: 100 + (i % 16), damping: 0.994, brightness: 0.35 });
  const g = inSec(t, 'hook') ? 0.22 : 0.15;
  music.add(p, t, { gain: g, pan: i % 2 ? 0.35 : -0.35 }); echo.add(p, t, { gain: 0.08 });
}

// ---- keys: off-beat chord stabs in the chorus and the outro
for (let i = 0; i * BEAT < DUR - 1e-6; i++) {
  const t = i * BEAT + BEAT / 2;
  if (!inSec(t, 'figs', 'net', 'offer')) continue;
  const k = s.keys(SR, CHORD[chordAt(t)].map((n) => s.midiHz(n + 12)), 0.4, { decay: 0.5, release: 0.12 });
  music.add(k, t, { gain: 0.2 }); verb.add(k, t, { gain: 0.15 });
}

// ---- bell lead: the inspiring motif, two bars, played over the chorus (bars 7-10) and once in the outro
// A-minor pentatonic, rising to the 5th: hopeful, not sad.
const MOTIF = [[76, null, 72, null, 71, 72, null, 69], [76, null, 79, null, 76, 74, null, 72]];
for (const startBar of [8, 10, 16]) for (let b = 0; b < 2; b++) MOTIF[b].forEach((n, k) => {
  if (n == null) return;
  const t = (startBar + b) * BAR + k * (BEAT / 2);
  const bl = s.bell(SR, s.midiHz(n + 12), 1.0, { ratio: 3.5, index: 1.8, decay: 0.55 });
  music.add(bl, t, { gain: 0.16, pan: 0.1 }); echo.add(bl, t, { gain: 0.12 }); verb.add(bl, t, { gain: 0.12 });
});

// ---- transitions: hook hit, riser into the drop, lift before the outro, fill into the loop
for (const t of [0, SEC.figs[0] * BAR]) { const im = s.impact(SR, { seed: 40 + t, decay: 0.9 }); drums.add(im, t, { gain: 0.45 }); verb.add(im, t, { gain: 0.25 }); }
music.add(s.riser(SR, 2.5, { seed: 31, from: 300, to: 9000 }), SEC.figs[0] * BAR - 2.5, { gain: 0.24 });   // out of the breath
music.add(s.riser(SR, 1.6, { seed: 32, from: 400, to: 10000 }), SEC.offer[0] * BAR - 1.6, { gain: 0.18 });
for (let k = 0; k < 4; k++) drums.add(s.snare(SR, { seed: 60 + k, tone: 220, decay: 0.08 }), DUR - BEAT + k * S16, { gain: 0.12 + k * 0.05 }); // fill into frame 0

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
