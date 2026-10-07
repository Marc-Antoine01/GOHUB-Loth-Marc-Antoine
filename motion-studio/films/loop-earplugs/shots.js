// The nine shots. Times are beat indices into beats.json (157 BPM); see docs/shotlist.md.
// Layout: type in a left column (x 150), product on the right standing on the floor line (y 860).
(function () {
  const { B, el, css, show, layer, lens, light, product, macro, line, rise, soundline, figure, range, lerp, ease } = E;
  const CUT = (n) => `assets/cut/${n}.webp`, SCENE = (n) => `assets/scene/${n}.webp`;
  const FLOOR = 860, PX = 1460;
  const LABEL = { size: 72, weight: 400, color: 'rgba(255,255,255,0.62)' };
  const HEAD = { size: 132, weight: 600 };
  const spring = (t, t0, f = 2.4, d = 0.55) => M.spring(t - t0, f, d);
  // dB amount → line amplitude (published SNR figures)
  const atten = (db) => Math.pow(10, -db / 20);

  // A use-case shot: name label, headline, the sound line collapsing on the "seat" beat, the figure landing on it.
  function useCase(cfg) {
    return {
      id: cfg.id,
      build() {
        this.root = layer();
        this.light = light(this.root);
        this.prods = cfg.finishes.map((f) => product(CUT(f), this.root));
        this.name = line(cfg.name, { ...LABEL, parent: this.root, y: 250 });
        this.heads = cfg.head.map((h, i) => line(h, { ...HEAD, parent: this.root, y: 340 + i * 170 }));
        this.fig = figure(this.root, { y: 340 + cfg.head.length * 170 + 40 });
        this.wave = soundline(this.root);
      },
      draw(t) {
        const [a, b] = [B(cfg.from), B(cfg.to)];
        const on = t >= a && t < b;
        show(this.root, on);
        const seat = B(cfg.seat), k = range(t, a, b);
        lens(this.root, { s: 1 + 0.035 * k, ox: PX, oy: FLOOR - 300 });
        this.light.set({ tint: cfg.tint, key: 0.16, night: cfg.night || 0, pool: 0.08 });
        // finish swaps on the listed beats, hard cuts
        let fi = 0;
        (cfg.swaps || []).forEach((bi, i) => { if (t >= B(bi)) fi = i + 1; });
        const press = spring(t, seat, 3.2, 0.42); // the earplug "seats": a small push that settles
        this.prods.forEach((p, i) => p.set({
          on: on && i === fi, x: PX, y: FLOOR, h: cfg.h || 640,
          ry: lerp(-14, 10, k), rz: (1 - press) * -4,
          s: 1 + (t >= seat ? (1 - press) * 0.05 : 0),
          spec: lerp(-0.4, 1.4, range(t, seat - 0.25, seat + 0.7)) + (t < seat - 0.25 ? 0 : 0),
          refl: 0.18,
        }));
        this.name.set(rise(t, a + 0.02), range(t, b - 0.3, b));
        cfg.head.forEach((_, i) => this.heads[i].set(rise(t, B(cfg.headAt[i])), range(t, b - 0.3, b)));
        this.fig.set(t, seat, cfg.db, { on, out: range(t, b - 0.3, b) });
        const after = t >= seat ? lerp(1, atten(cfg.db), ease.outExpo(range(t, seat, seat + 0.35))) : 1;
        this.wave.set({ t, on, kind: cfg.kind, seed: cfg.seed, amp: after * 1.0, voiceAmp: cfg.voice ? 0.55 : 0 });
      },
    };
  }

  // ---- S01 Hook (0 → B11): macro on the ring, then the stage and the promise
  SHOT({
    id: 's01',
    build() {
      this.root = layer();
      this.light = light(this.root);
      this.prod = product(CUT('switch2-emerald'), this.root);
      this.l1 = line('A Loop earplug', { ...HEAD, parent: this.root, y: 350 });
      this.l2 = line('for every situation.', { ...HEAD, parent: this.root, y: 500 });
      this.macro = macro(SCENE('experience2-black-dark'), this.root);
    },
    draw(t) {
      const on = t < B(11);
      show(this.root, on);
      const m = t < B(4);
      // macro: pulls back off the ring while a streak crosses it
      this.macro.set({ on: on && m, s: lerp(2.3, 1.45, ease.outCubic(range(t, 0, B(4)))), ox: 52, oy: 50, sweep: lerp(-0.3, 1.3, range(t, 0.15, B(4) - 0.1)) });
      const k = range(t, B(4), B(11));
      lens(this.root, { s: 1 + 0.03 * k, ox: PX, oy: FLOOR - 300 });
      this.light.set({ tint: '40,160,120', key: 0.2 * range(t, B(5), B(7)), pool: 0.09 * range(t, B(4), B(6)) });
      // silhouette on the downbeat, the key light comes up two beats later
      const lit = ease.inOutCubic(range(t, B(6) - 0.1, B(7)));
      this.prod.set({ on: on && !m, x: 1530, y: FLOOR, h: 640, ry: lerp(-18, 8, k), bright: lerp(0.04, 1, lit), spec: lerp(-0.4, 1.4, range(t, B(7), B(9))), refl: 0.2 });
      this.l1.set(rise(t, B(4)), range(t, B(11) - 0.3, B(11)), !m);
      this.l2.set(rise(t, B(6)), range(t, B(11) - 0.3, B(11)), !m);
    },
  });

  // ---- S02 Switch 2 (B11 → B20): three modes, one per beat; then the four finishes
  SHOT({
    id: 's02',
    build() {
      this.root = layer();
      this.light = light(this.root);
      this.finishes = ['switch2-emerald', 'switch2-black', 'switch2-gold', 'switch2-silver'].map((f) => product(CUT(f), this.root));
      this.name = line('Loop Switch 2', { ...LABEL, parent: this.root, y: 250 });
      this.modes = ['Engage.', 'Experience.', 'Quiet.'].map((w) => line(w, { ...HEAD, size: 170, parent: this.root, y: 340 }));
      this.sub = line('Three modes. One dial.', { ...LABEL, size: 56, parent: this.root, y: 560 });
      this.wave = soundline(this.root);
    },
    draw(t) {
      const a = B(11), b = B(20), on = t >= a && t < b;
      show(this.root, on);
      const k = range(t, a, b);
      lens(this.root, { s: 1.02 + 0.03 * k, ox: PX, oy: FLOOR - 300 });
      this.light.set({ tint: '40,160,120', key: 0.18, pool: 0.08 });
      const MB = [12, 14, 16];
      let mi = -1; MB.forEach((bi, i) => { if (t >= B(bi) - 0.05) mi = i; });
      // each mode is a quarter-turn click of the dial: a small twist that springs back
      const click = mi >= 0 ? spring(t, B(MB[mi]), 3.4, 0.38) : 1;
      const row = ease.inOutCubic(range(t, B(18) - 0.15, B(18) + 0.35)); // payoff: the four finishes line up
      this.finishes.forEach((p, i) => {
        if (i === 0) {
          p.set({ on, x: lerp(PX, 1000, row), y: FLOOR, h: lerp(720, 380, row), ry: lerp(-10, 6, k), rz: (1 - click) * 10,
            spec: lerp(-0.4, 1.4, range(t, B(MB[Math.max(0, mi)]) - 0.05, B(MB[Math.max(0, mi)]) + 0.6)), refl: 0.2 });
        } else {
          const u = ease.outExpo(range(t, B(18) - 0.05 + i * 0.06, B(18) + 0.45 + i * 0.06));
          p.set({ on: on && t >= B(18) - 0.05 + i * 0.06, x: 1010 + i * 255 + (1 - u) * 400, y: FLOOR, h: 380, ry: -8, refl: 0.2,
            spec: lerp(-0.4, 1.4, range(t, B(19) + i * 0.05, B(19) + 0.6 + i * 0.05)) });
        }
      });
      this.name.set(rise(t, a + 0.02), range(t, b - 0.3, b));
      this.modes.forEach((m, i) => {
        const tin = B(MB[i]), tout = i < 2 ? B(MB[i + 1]) : b;
        m.set(rise(t, tin, 0.3), range(t, tout - 0.16, tout - 0.02));
      });
      this.sub.set(rise(t, B(17)), range(t, b - 0.3, b));
      const amp = [1, 0.62, 0.42, 0.16][mi + 1];
      this.wave.set({ t, on, kind: 'city', seed: 21, amp: amp * (1 - row * 0) });
    },
  });

  // ---- S03 Experience 2 (B20 → B30): match cut on the ring, live music, 17 dB
  SHOT({
    id: 's03m',
    build() { this.root = layer(); this.macro = macro(SCENE('experience2-gold-dark'), this.root); },
    draw(t) {
      const on = t >= B(20) && t < B(22);
      show(this.root, on);
      this.macro.set({ on, s: lerp(1.9, 1.55, ease.outCubic(range(t, B(20), B(22)))), ox: 46, oy: 56, sweep: lerp(-0.3, 1.3, range(t, B(20), B(22))) });
    },
  });
  SHOT(useCase({ id: 's03', from: 22, to: 30, seat: 24, name: 'Loop Experience 2', head: ['Live music.'], headAt: [22],
    finishes: ['experience2-gold', 'experience2-silver', 'experience2-black'], swaps: [27, 28], tint: '200,160,80', db: 17, kind: 'crowd', seed: 31 }));

  // ---- S04 Quiet 2 (B30 → B38): match cut ring → ring; focus, travel; 24 dB; then a beauty insert
  SHOT(useCase({ id: 's04', from: 30, to: 35, seat: 32, name: 'Loop Quiet 2', head: ['Focus.', 'Travel.'], headAt: [30, 31],
    finishes: ['quiet2-violet'], tint: '150,120,230', db: 24, kind: 'city', seed: 41 }));
  SHOT({
    id: 's04m',
    build() { this.root = layer(); this.macro = macro(SCENE('quiet2-violet-scene'), this.root); },
    draw(t) {
      const on = t >= B(35) && t < B(38);
      show(this.root, on);
      this.macro.set({ on, s: lerp(1.25, 1.45, range(t, B(35), B(38))), ox: 50, oy: 48, x: lerp(30, -30, range(t, B(35), B(38))), sweep: lerp(-0.3, 1.3, range(t, B(35), B(38))) });
    },
  });

  // ---- S05 Dream (B38 → B44): night light, snoring, 27 dB
  SHOT(useCase({ id: 's05', from: 38, to: 44, seat: 40, name: 'Loop Dream', head: ['Sleep.'], headAt: [38],
    finishes: ['dream-lilac', 'dream-peach'], swaps: [42], tint: '90,110,220', night: 1, db: 27, kind: 'snore', seed: 51, h: 600 }));

  // ---- S06 Engage 2 (B44 → B50): the background drops, the voice stays. Then silence (B50, the track's dip).
  SHOT(useCase({ id: 's06', from: 44, to: 50, seat: 46, name: 'Loop Engage 2', head: ['Speech', 'stays clear.'], headAt: [44, 45],
    finishes: ['engage2-rose', 'engage2-dusk'], swaps: [48], tint: '230,140,120', db: 16, kind: 'office', seed: 61, voice: true }));
  SHOT({
    id: 's06s',
    build() { this.root = layer(); css(this.root, { background: '#050505' }); this.wave = soundline(this.root); },
    draw(t) { const on = t >= B(50) && t < B(51); show(this.root, on); this.wave.set({ t, on, kind: 'flat' }); },
  });

  // ---- S07 Engage Kids 2 (B51 → B56): pops into a smaller ring; three colours, one per beat
  SHOT({
    id: 's07',
    build() {
      this.root = layer();
      this.light = light(this.root);
      this.prods = ['kids2-berryblue', 'kids2-oceanorange', 'kids2-watermelon'].map((f) => product(CUT(f), this.root));
      this.name = line('Loop Engage Kids 2', { ...LABEL, parent: this.root, y: 250 });
      this.l1 = line('Big protection', { ...HEAD, parent: this.root, y: 340 });
      this.l2 = line('for small ears.', { ...HEAD, parent: this.root, y: 510 });
    },
    draw(t) {
      const a = B(51), b = B(56), on = t >= a && t < b;
      show(this.root, on);
      const k = range(t, a, b);
      lens(this.root, { s: 1 + 0.03 * k, ox: PX, oy: FLOOR - 300 });
      let fi = 0; if (t >= B(53)) fi = 1; if (t >= B(54)) fi = 2;
      const tints = ['110,150,240', '240,160,60', '240,110,120'];
      this.light.set({ tint: tints[fi], key: 0.18, pool: 0.08 });
      const pop = spring(t, [a, B(53), B(54)][fi], 2.6, 0.45);
      this.prods.forEach((p, i) => p.set({ on: on && i === fi, x: PX, y: FLOOR, h: 560, s: 0.8 + 0.2 * pop, ry: lerp(-12, 10, k), spec: lerp(-0.4, 1.4, range(t, [a, B(53), B(54)][fi], [a, B(53), B(54)][fi] + 0.6)), refl: 0.18 }));
      this.name.set(rise(t, a + 0.02), range(t, b - 0.3, b));
      this.l1.set(rise(t, a), range(t, b - 0.3, b));
      this.l2.set(rise(t, B(52)), range(t, b - 0.3, b));
    },
  });

  // ---- S08 The wheel (B56 → B69): eight earplugs on a ring turning in depth, one name per beat, then a row
  const WHEEL = [
    ['switch2-emerald', 'Switch 2'], ['experience2-gold', 'Experience 2'], ['experience2plus-rosegold', 'Experience 2 Plus'], ['quiet2-violet', 'Quiet 2'],
    ['dream-lilac', 'Dream'], ['engage2-dusk', 'Engage 2'], ['engage2plus-rose', 'Engage 2 Plus'], ['kids2-oceanorange', 'Engage Kids 2'],
  ];
  SHOT({
    id: 's08',
    build() {
      this.root = layer();
      this.light = light(this.root);
      this.prods = WHEEL.map(([f]) => product(CUT(f), this.root));
      this.names = WHEEL.map(([, n]) => line(n, { size: 96, weight: 600, parent: this.root, y: 880, cls: 'center' }));
    },
    draw(t) {
      const a = B(56), b = B(70), on = t >= a && t < b;
      show(this.root, on);
      lens(this.root, { s: 1, ox: 960, oy: 600 });
      this.light.set({ tint: '255,255,255', key: 0.1, poolX: 960, poolY: 690, pool: 0.08, floor: 690 });
      // turn: product i is at the front on B(57+i); between beats the wheel springs to the next stop
      let pos = 0;
      for (let i = 0; i < 8; i++) if (t >= B(57 + i) - 0.12) pos = i + (ease.outExpo(range(t, B(57 + i) - 0.12, B(57 + i) + 0.18)) - 1);
      if (t < B(57) - 0.12) pos = lerp(-1.2, -1, range(t, a, B(57) - 0.12));
      const flat = ease.inOutCubic(range(t, B(65) - 0.1, B(66))); // the wheel opens into a row and stops on the dip
      this.prods.forEach((p, i) => {
        const th = ((i - pos) / 8) * Math.PI * 2;
        const depth = (Math.cos(th) + 1) / 2; // 1 front, 0 back
        const wx = 960 + Math.sin(th) * 700, wy = 690 - (1 - depth) * 120, ws = 0.42 + 0.58 * depth;
        const rx = 960 + (i - 3.5) * 215, ry = 690, rs = 0.42;
        p.set({
          on, x: lerp(wx, rx, flat), y: lerp(wy, ry, flat), h: 520 * lerp(ws, rs, flat),
          z: Math.round(lerp(depth * 100, 50, flat)), bright: lerp(0.08 + 0.92 * depth ** 2.2, 1, flat), blur: lerp((1 - depth) * 7, 0, flat),
          ry: lerp(Math.sin(th) * -35, 0, flat), refl: lerp(0.18 * depth, 0.16, flat),
          // a ripple of light runs across the row after it stops
          spec: lerp(-0.4, 1.4, range(t, B(67) + i * 0.07, B(67) + 0.55 + i * 0.07)),
        });
        const tin = B(57 + i), tout = i < 7 ? B(58 + i) : B(65);
        this.names[i].set(rise(t, tin, 0.26), range(t, tout - 0.14, tout - 0.02), on);
      });
    },
  });

  // ---- S09 Logo (B69 → end): an empty stage, the wordmark lands on the downbeat, then the site's own line
  SHOT({
    id: 's09',
    build() {
      this.root = layer();
      this.light = light(this.root);
      this.logo = el('div', 'logo', this.root, window.LOOP_WORDMARK);
      this.tag = line('Experience life at your volume.', { size: 56, weight: 400, color: 'rgba(255,255,255,0.7)', parent: this.root, y: 640, cls: 'center' });
    },
    draw(t) {
      const a = B(70), on = t >= a;
      show(this.root, on);
      this.light.set({ tint: '255,255,255', key: 0.06 * range(t, B(71), B(73)), pool: 0, floor: 2000 });
      const land = spring(t, B(71), 2.2, 0.6);
      show(this.logo, on && t >= B(71) - 0.02);
      css(this.logo, { transform: `translate(-50%,-50%) scale(${(1.06 - 0.06 * land).toFixed(4)})`, clipPath: `inset(0 ${((1 - ease.outExpo(range(t, B(71) - 0.02, B(71) + 0.35))) * 100).toFixed(2)}% 0 0)` });
      this.tag.set(rise(t, B(73)), 0, on);
    },
  });
})();
