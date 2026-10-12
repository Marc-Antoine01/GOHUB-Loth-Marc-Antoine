// S05 The qubit, bar 7: a Bloch sphere; the state arrow sweeps and lands on the equator, then holds into the silence.
(() => {
  const { B, C, words, mono, push } = E;
  E.wipe(B(28), [E.C.blue, E.C.paper, E.C.blue, E.C.paper, E.C.blue, E.C.paper]);
  const SX = 1320, SY = 560, SR = 300;
  E.bloch = (g, t) => {
    g.strokeStyle = C.gray80; g.lineWidth = 2;
    g.beginPath(); g.arc(SX, SY, SR, 0, Math.PI * 2); g.stroke();
    g.setLineDash([10, 10]); g.beginPath(); g.ellipse(SX, SY, SR, SR * 0.28, 0, Math.PI, 2 * Math.PI); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.ellipse(SX, SY, SR, SR * 0.28, 0, 0, Math.PI); g.stroke();
    g.beginPath(); g.moveTo(SX, SY - SR - 30); g.lineTo(SX, SY + SR + 30); g.stroke();
    g.font = '400 40px PlexMono'; g.fillStyle = C.ink; g.textAlign = 'center';
    g.fillText('|0⟩', SX, SY - SR - 50); g.fillText('|1⟩', SX, SY + SR + 82); g.textAlign = 'left';
    // θ sweeps 0 → π → π/2 and lands on the equator on beat 30; φ turns slowly.
    const u = M.range(t, B(28), B(30));
    const th = u < 0.6 ? Math.PI * M.ease.inOutCubic(u / 0.6) : Math.PI - (Math.PI / 2) * M.ease.outBack(M.range(u, 0.6, 1));
    const ph = 0.9 + (t - B(28)) * 0.6;
    const x = SX + SR * Math.sin(th) * Math.cos(ph) * 0.98, y = SY - SR * Math.cos(th) + SR * 0.28 * Math.sin(th) * Math.sin(ph);
    g.strokeStyle = C.blue; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(SX, SY); g.lineTo(x, y); g.stroke();
    E.qubit(x, y, 16, { fill: C.blue, ring: C.blue, ringR: 30 });
    E.qubit(SX, SY, 6, { fill: C.ink, ringR: 0 });
    return { x, y };
  };
  SHOT({
    id: 's05', from: () => B(28), to: () => B(31),
    draw(g, t, lt) {
      E.field(C.paper);
      push(lt, B(32) - B(28), SX, SY, 0.06);
      E.bloch(g, t);
      words([{ text: 'The', at: B(28) + 0.12 }, { text: 'qubit.', at: B(29), accent: true }], 120, 520, 128, t, { color: C.ink, accent: C.blue });
      mono('// any blend of 0 and 1', 126, 640, t, B(29) + 0.2);
    },
  });
})();
