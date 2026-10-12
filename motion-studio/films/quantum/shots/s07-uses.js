// S07 What it does, bars 10-13: three panels behind bar wipes: molecules close (b43), routes resolve (b48), the lock snaps (b53).
(() => {
  const { B, C, words, mono, push } = E;
  E.wipe(B(40), [E.C.blue, E.C.paper, E.C.blue, E.C.paper, E.C.blue, E.C.paper]);
  E.wipe(B(45), [E.C.blue, E.C.paper, E.C.blue40, E.C.paper, E.C.blue, E.C.paper], { dir: -1 });
  E.wipe(B(50), [E.C.blue, E.C.paper, E.C.blue, E.C.paper, E.C.blue, E.C.paper]);
  const VX = 1360, VY = 560;

  function molecule(g, t) {
    // A hexagonal ring with three side atoms; atoms fly in from seeded spots and lock on beat 43, bonds draw after.
    const r = M.mulberry32(7), atoms = [];
    for (let i = 0; i < 6; i++) atoms.push([VX + 170 * Math.cos(i * Math.PI / 3 + Math.PI / 6), VY + 170 * Math.sin(i * Math.PI / 3 + Math.PI / 6), 30, C.blue]);
    for (const [i, k] of [[0, 1.85], [2, 1.85], [4, 1.85]]) atoms.push([VX + 170 * k * Math.cos(i * Math.PI / 3 + Math.PI / 6), VY + 170 * k * Math.sin(i * Math.PI / 3 + Math.PI / 6), 22, C.purple]);
    const land = B(43);
    const bonds = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [2, 7], [4, 8]];
    const bp = M.ease.outExpo(M.range(t, land - 0.15, land + 0.25));
    const pos = atoms.map(([x, y], i) => {
      const sx = 900 + r() * 950, sy = 120 + r() * 840;
      const u = Math.max(0, M.spring(t - (land - 0.9 + i * 0.05), 1.8, 0.62));
      return [M.lerp(sx, x, u), M.lerp(sy, y, u)];
    });
    g.strokeStyle = C.gray80; g.lineWidth = 6; g.lineCap = 'round';
    for (const [a, b] of bonds) {
      const [x1, y1] = pos[a], [x2, y2] = pos[b];
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(M.lerp(x1, x2, bp), M.lerp(y1, y2, bp)); g.stroke();
    }
    atoms.forEach(([, , rad, col], i) => E.qubit(pos[i][0], pos[i][1], rad, { fill: col, ring: col, ringR: t >= land && i < 6 ? rad + 10 * (1 - M.range(t, land, land + 0.4)) : 0 }));
  }

  function routes(g, t) {
    // Fourteen tangled routes from A to B collapse onto the one shortest path on beat 48.
    const ax = 1000, bx = 1800, y = VY, r = M.mulberry32(21);
    const solve = Math.max(0, M.spring(t - (B(48) - 0.2), 2.0, 0.6));
    for (let k = 0; k < 14; k++) {
      const c1 = [ax + 150 + r() * 400, 160 + r() * 760], c2 = [bx - 150 - r() * 400, 160 + r() * 760];
      const s1 = [M.lerp(c1[0], ax + 300, solve), M.lerp(c1[1], y, solve)], s2 = [M.lerp(c2[0], bx - 300, solve), M.lerp(c2[1], y, solve)];
      g.strokeStyle = solve > 0.95 ? C.blue : C.gray30; g.lineWidth = solve > 0.95 ? 8 : 3;
      g.beginPath(); g.moveTo(ax, y); g.bezierCurveTo(s1[0], s1[1], s2[0], s2[1], bx, y); g.stroke();
    }
    E.qubit(ax, y, 20, { fill: C.ink, ringR: 0 }); E.qubit(bx, y, 20, { fill: C.blue, ring: C.blue, ringR: t >= B(48) ? 34 : 0 });
  }

  function lock(g, t) {
    // The shackle hangs open, then snaps shut on beat 53 with a small overshoot.
    const close = M.spring(t - (B(53) - 0.12), 2.6, 0.38);
    const lift = 120 * (1 - close);
    const bw = 360, bh = 300, x = VX - bw / 2, yb = VY - 40;
    g.strokeStyle = C.ink; g.lineWidth = 34; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(VX - 110, yb - lift + 4); g.lineTo(VX - 110, yb - 120 - lift); g.arc(VX, yb - 120 - lift, 110, Math.PI, 0); g.lineTo(VX + 110, yb - lift * 0.2); g.stroke();
    g.fillStyle = t >= B(53) ? C.blue : C.gray80; g.beginPath(); g.roundRect(x, yb, bw, bh, 18); g.fill();
    g.fillStyle = C.paper; g.beginPath(); g.arc(VX, yb + 120, 26, 0, Math.PI * 2); g.fill(); g.fillRect(VX - 9, yb + 130, 18, 70);
  }

  SHOT({
    id: 's07', from: () => B(40), to: () => B(56),
    draw(g, t, lt) {
      E.field(C.paper);
      const panel = t < B(45) ? 0 : t < B(50) ? 1 : 2;
      const p0 = [B(40), B(45), B(50)][panel], p1 = [B(45), B(50), B(56)][panel];
      push(t - p0, p1 - p0, VX, VY, 0.05);
      if (panel === 0) {
        molecule(g, t);
        words([{ text: 'Simulate', at: B(41) }], 120, 450, 120, t, { color: C.ink, accent: C.blue });
        words([{ text: 'molecules.', at: B(42), accent: true }], 120, 590, 120, t, { color: C.ink, accent: C.blue });
        mono('// new medicines, new materials', 126, 700, t, B(43));
      } else if (panel === 1) {
        routes(g, t);
        words([{ text: 'Optimize', at: B(46), accent: true }], 120, 450, 120, t, { color: C.ink, accent: C.blue });
        words([{ text: 'the', at: B(47) }, { text: 'impossible.', at: B(47) + 0.23 }], 120, 590, 120, t, { color: C.ink, accent: C.blue });
        mono('// routes, portfolios, power grids', 126, 700, t, B(48));
      } else {
        lock(g, t);
        words([{ text: 'Secure', at: B(51) }], 120, 450, 120, t, { color: C.ink, accent: C.blue });
        words([{ text: 'tomorrow.', at: B(52), accent: true }], 120, 590, 120, t, { color: C.ink, accent: C.blue });
        mono("// today's encryption is at risk", 126, 700, t, B(53), { highlight: 'at risk' });
      }
    },
  });
})();
