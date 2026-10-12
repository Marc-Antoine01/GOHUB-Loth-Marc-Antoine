// S06 The computer, bars 13-15: in the silence the dark field expands from the qubit; on the drop a qubit lattice lights
// a row every 1.4 beats; 2ⁿ counts them, becomes n on beat 61, then waves of computation run through the lattice.
(() => {
  const { B, C, words, mono } = E;
  const ROWS = 7, COLS = 11, LX = 860, LY = 230, DX = 88, DY = 100;
  SHOT({
    id: 's06', from: () => B(51), to: () => B(64),
    draw(g, t, lt) {
      if (t < B(52)) {
        // The silence: the Bloch frame holds, then ink swallows it from the qubit, landing exactly on the drop.
        E.field(C.paper);
        g.save(); E.push(t - B(44), B(52) - B(44), 1320, 560, 0.06); const tip = E.bloch(g, t); g.restore();
        const r = 2400 * M.ease.inExpo(M.range(t, B(51) + 0.05, B(52)));
        g.fillStyle = C.ink; g.beginPath(); g.arc(tip.x, tip.y, Math.max(0, r), 0, Math.PI * 2); g.fill();
        return;
      }
      E.field(C.ink);
      E.push(t - B(52), B(64) - B(52), 1300, 540, 0.035);
      const row = (r) => E.Bf(52 + r * 1.4); // a row every beat and a bit: the last lands on beat 60.4
      // Lattice links (stylised heavy-hex: horizontal rows, a vertical link every 4 nodes, alternating offset).
      g.lineWidth = 2;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const x = LX + c * DX, y = LY + r * DY, lit = t >= row(r);
        g.strokeStyle = lit ? 'rgba(130,207,255,0.55)' : C.gray80;
        if (c < COLS - 1) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + DX, y); g.stroke(); }
        if (r < ROWS - 1 && (c + (r % 2) * 2) % 4 === 0) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + DY); g.stroke(); }
      }
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const x = LX + c * DX, y = LY + r * DY;
        const p = Math.max(0, M.spring(t - (row(r) + c * 0.012), 2.6, 0.45));
        if (t < row(r)) { g.fillStyle = C.gray80; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); }
        else {
          // After the count: a diagonal wave runs through the lattice on every beat (the computation working).
          let wv = 0;
          for (const b of [61, 62, 63]) { const d = (t - B(b)) * 2.6 - (c + r) / (ROWS + COLS - 2); if (d > 0 && d < 0.35) wv = Math.max(wv, Math.sin((d / 0.35) * Math.PI)); }
          E.qubit(x, y, 9 + 4 * p + 5 * wv, { fill: wv > 0.5 ? C.cyan : C.blue, ring: C.cyan, ringR: 13 + 8 * p + 10 * wv });
        }
      }
      // 2ⁿ: the exponent counts the lit rows' qubits doubling, then becomes n on beat 39.
      let lit = 0; for (let r = 0; r < ROWS; r++) if (t >= row(r)) lit = r + 1; lit = Math.max(1, lit); // rows lit so far
      const n = lit * COLS;
      g.textBaseline = 'alphabetic';
      g.font = '300 300px PlexSans'; g.fillStyle = C.white; g.fillText('2', 120, 640);
      const ex = t >= B(61) ? 'n' : String(n);
      const pop = 1 + 0.12 * (1 - Math.max(0, M.spring(t - (t >= B(61) ? B(61) : row(lit - 1)), 2.6, 0.4)));
      g.save(); g.translate(300, 470); g.scale(pop, pop); g.font = '600 140px PlexSans'; g.fillStyle = C.cyan; g.fillText(ex, 0, 0); g.restore();
      mono(t >= B(61) ? '// n qubits, 2^n states' : `// ${n} qubits`, 126, 760, t, t >= B(61) ? B(61) : B(52));
      mono('// +1 qubit, ×2 states', 126, 820, t, B(62), { color: C.gray30, size: 38 });
    },
  });
})();
