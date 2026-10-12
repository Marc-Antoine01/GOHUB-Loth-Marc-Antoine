// S07 What it does, bars 16-21: three 2-bar panels behind bar wipes: molecules assemble (b68), routes resolve (b76) and are
// travelled (b79), today's lock cracks (b83) and a new one snaps shut (b85). Every panel moves to its last frame.
(() => {
  const { B, C, words, mono, push } = E;
  E.wipe(B(64), [E.C.blue, E.C.paper, E.C.blue, E.C.paper, E.C.blue, E.C.paper]);
  E.wipe(B(72), [E.C.blue, E.C.paper, E.C.blue40, E.C.paper, E.C.blue, E.C.paper], { dir: -1 });
  E.wipe(B(80), [E.C.blue, E.C.paper, E.C.blue, E.C.paper, E.C.blue, E.C.paper]);
  const VX = 1360, VY = 560;

  function molecule(g, t) {
    // A hexagonal ring with three side atoms: atoms drift in one after another from beat 64.5, bonds draw on beat 68,
    // then the molecule turns slowly while a pulse runs round the ring on each beat (the simulation running).
    const r = M.mulberry32(7), atoms = [];
    for (let i = 0; i < 6; i++) atoms.push([170 * Math.cos(i * Math.PI / 3 + Math.PI / 6), 170 * Math.sin(i * Math.PI / 3 + Math.PI / 6), 30, C.blue]);
    for (const [i, k] of [[0, 1.85], [2, 1.85], [4, 1.85]]) atoms.push([170 * k * Math.cos(i * Math.PI / 3 + Math.PI / 6), 170 * k * Math.sin(i * Math.PI / 3 + Math.PI / 6), 22, C.purple]);
    const land = B(68), rot = 0.5 * M.ease.inOutCubic(M.range(t, B(67), B(72)));
    const bonds = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [2, 7], [4, 8]];
    const pos = atoms.map(([x, y], i) => {
      const sx = 900 + r() * 950, sy = 120 + r() * 840;
      const u = Math.max(0, M.spring(t - (E.Bf(64.5) + i * 0.2), 1.3, 0.72));
      const rx = VX + x * Math.cos(rot) - y * Math.sin(rot), ry = VY + x * Math.sin(rot) + y * Math.cos(rot);
      return [M.lerp(sx, rx, u), M.lerp(sy, ry, u)];
    });
    g.strokeStyle = C.gray80; g.lineWidth = 6; g.lineCap = 'round';
    bonds.forEach(([a, b], k) => {
      const bp = M.ease.outExpo(M.range(t, land - 0.15 + k * 0.05, land + 0.35 + k * 0.05));
      if (bp <= 0) return;
      const [x1, y1] = pos[a], [x2, y2] = pos[b];
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(M.lerp(x1, x2, bp), M.lerp(y1, y2, bp)); g.stroke();
    });
    atoms.forEach(([, , rad, col], i) => {
      let ring = t >= land && i < 6 ? rad + 10 * (1 - M.range(t, land, land + 0.4)) : 0;
      for (const b of [69, 70, 71]) { const u = M.range(t, B(b) + i * 0.06, B(b) + i * 0.06 + 0.35); if (i < 6 && u > 0 && u < 1) ring = rad + 4 + 22 * M.ease.outCubic(u); }
      E.qubit(pos[i][0], pos[i][1], rad, { fill: col, ring: col, ringR: ring });
    });
  }

  function routes(g, t) {
    // Fourteen tangled routes from A to B keep searching (their bends wander) until beat 76, when they collapse onto
    // the one shortest path; a traveller then runs it from beat 77 and arrives on beat 79.
    const ax = 1000, bx = 1800, y = VY, r = M.mulberry32(21);
    const solve = Math.max(0, M.spring(t - (B(76) - 0.2), 2.0, 0.6));
    const live = (1 - Math.min(1, solve)) * M.ease.inOutCubic(M.range(t, B(72), B(73)));
    for (let k = 0; k < 14; k++) {
      const c1 = [ax + 150 + r() * 400, 160 + r() * 760], c2 = [bx - 150 - r() * 400, 160 + r() * 760];
      c1[1] += 110 * live * M.noise1(30 + k, t * 1.3); c2[1] += 110 * live * M.noise1(60 + k, t * 1.3);
      const s1 = [M.lerp(c1[0], ax + 300, solve), M.lerp(c1[1], y, solve)], s2 = [M.lerp(c2[0], bx - 300, solve), M.lerp(c2[1], y, solve)];
      g.strokeStyle = solve > 0.95 ? C.blue : C.gray30; g.lineWidth = solve > 0.95 ? 8 : 3;
      g.beginPath(); g.moveTo(ax, y); g.bezierCurveTo(s1[0], s1[1], s2[0], s2[1], bx, y); g.stroke();
    }
    const go = M.ease.inOutCubic(M.range(t, B(77), B(79)));
    if (go > 0 && go < 1) E.qubit(M.lerp(ax, bx, go), y, 14, { fill: C.purple, ringR: 0 });
    E.qubit(ax, y, 20, { fill: C.ink, ringR: 0 });
    const arrive = M.range(t, B(79), B(79) + 0.5);
    E.qubit(bx, y, 20, { fill: C.blue, ring: C.blue, ringR: t >= B(76) ? 34 + (arrive > 0 && arrive < 1 ? 30 * M.ease.outCubic(arrive) : 0) : 0 });
  }

  function lock(g, t) {
    // Today's lock sits closed; on beat 83 it is cracked (the shackle springs open, the body flashes magenta),
    // and on beat 85 a new one snaps shut, blue, with a small overshoot: encryption made for the quantum era.
    const open = Math.max(0, M.spring(t - B(83), 3.0, 0.4)), close = Math.max(0, M.spring(t - (B(85) - 0.12), 2.6, 0.38));
    const shake = t > B(82) && t < B(83) ? 6 * Math.sin(t * 90) * M.range(t, B(82), B(83)) : 0;
    const lift = 120 * (open - close);
    const bw = 360, bh = 300, cx = VX + shake, x = cx - bw / 2, yb = VY - 40;
    g.strokeStyle = C.ink; g.lineWidth = 34; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(cx - 110, yb - lift + 4); g.lineTo(cx - 110, yb - 120 - lift); g.arc(cx, yb - 120 - lift, 110, Math.PI, 0); g.lineTo(cx + 110, yb - lift * 0.2); g.stroke();
    g.fillStyle = t >= B(85) ? C.blue : t >= B(83) ? C.magenta : C.gray80; g.beginPath(); g.roundRect(x, yb, bw, bh, 18); g.fill();
    g.fillStyle = C.paper; g.beginPath(); g.arc(cx, yb + 120, 26, 0, Math.PI * 2); g.fill(); g.fillRect(cx - 9, yb + 130, 18, 70);
    const ring = M.range(t, B(85), B(85) + 0.6);
    if (ring > 0 && ring < 1) { g.strokeStyle = C.blue; g.lineWidth = 3 * (1 - ring); g.beginPath(); g.roundRect(x - 40 * ring, yb - 40 * ring, bw + 80 * ring, bh + 80 * ring, 18 + 20 * ring); g.stroke(); }
  }

  SHOT({
    id: 's07', from: () => B(64), to: () => B(88),
    draw(g, t, lt) {
      E.field(C.paper);
      const panel = t < B(72) ? 0 : t < B(80) ? 1 : 2;
      const p0 = [B(64), B(72), B(80)][panel], p1 = [B(72), B(80), B(88)][panel];
      push(t - p0, p1 - p0, VX, VY, 0.05);
      if (panel === 0) {
        molecule(g, t);
        words([{ text: 'Simulate', at: B(65) }], 120, 450, 120, t, { color: C.ink, accent: C.blue });
        words([{ text: 'molecules.', at: B(66), accent: true }], 120, 590, 120, t, { color: C.ink, accent: C.blue });
        mono('// new medicines, new materials', 126, 700, t, B(68));
      } else if (panel === 1) {
        routes(g, t);
        words([{ text: 'Optimize', at: B(73), accent: true }], 120, 450, 120, t, { color: C.ink, accent: C.blue });
        words([{ text: 'the', at: B(74) }, { text: 'impossible.', at: B(74) + 0.23 }], 120, 590, 120, t, { color: C.ink, accent: C.blue });
        mono('// routes, portfolios, power grids', 126, 700, t, B(76));
      } else {
        lock(g, t);
        words([{ text: 'Secure', at: B(81) }], 120, 450, 120, t, { color: C.ink, accent: C.blue });
        words([{ text: 'tomorrow.', at: B(82), accent: true }], 120, 590, 120, t, { color: C.ink, accent: C.blue });
        mono("// today's encryption is at risk", 126, 700, t, B(83), { highlight: 'at risk' });
        mono('// so we build new locks', 126, 760, t, B(85), { color: C.gray50, size: 38 });
      }
    },
  });
})();
