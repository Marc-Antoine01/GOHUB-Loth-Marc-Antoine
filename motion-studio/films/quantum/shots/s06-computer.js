// S06 The computer, bars 8-9: in the silence the dark field expands from the qubit; on the drop a qubit lattice lights row by row; 2ⁿ.
(() => {
  const { B, C, words, mono } = E;
  const ROWS = 7, COLS = 11, LX = 860, LY = 230, DX = 88, DY = 100;
  SHOT({
    id: 's06', from: () => B(31), to: () => B(40),
    draw(g, t, lt) {
      if (t < B(32)) {
        // The silence: the Bloch frame holds, then ink swallows it from the qubit, landing exactly on the drop.
        E.field(C.paper);
        g.save(); E.push(t - B(28), B(32) - B(28), 1320, 560, 0.06); const tip = E.bloch(g, t); g.restore();
        const r = 2400 * M.ease.inExpo(M.range(t, B(31) + 0.05, B(32)));
        g.fillStyle = C.ink; g.beginPath(); g.arc(tip.x, tip.y, Math.max(0, r), 0, Math.PI * 2); g.fill();
        return;
      }
      E.field(C.ink);
      E.push(t - B(32), B(40) - B(32), 1300, 540, 0.035);
      const row = (r) => B(32 + r); // one row per beat
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
        else E.qubit(x, y, 9 + 4 * p, { fill: C.blue, ring: C.cyan, ringR: 13 + 8 * p });
      }
      // 2ⁿ: the exponent counts the lit rows' qubits doubling, then becomes n on beat 39.
      let lit = 0; for (let r = 0; r < ROWS; r++) if (t >= row(r)) lit = r + 1; lit = Math.max(1, lit); // rows lit so far
      const n = lit * COLS;
      g.textBaseline = 'alphabetic';
      g.font = '300 300px PlexSans'; g.fillStyle = C.white; g.fillText('2', 120, 640);
      const ex = t >= B(39) ? 'n' : String(n);
      const pop = 1 + 0.12 * (1 - Math.max(0, M.spring(t - (t >= B(39) ? B(39) : row(lit - 1)), 2.6, 0.4)));
      g.save(); g.translate(300, 470); g.scale(pop, pop); g.font = '600 140px PlexSans'; g.fillStyle = C.cyan; g.fillText(ex, 0, 0); g.restore();
      mono(t >= B(39) ? '// n qubits span 2^n states' : `// ${n} qubits`, 126, 760, t, t >= B(39) ? B(39) : B(32));
    },
  });
})();
