// S03 Superposition, bars 3-4: one bit is 0 and 1 at once; it splits into two breathing ghosts on beat 16.
(() => {
  const { B, C, words, mono, push } = E;
  E.wipe(B(20), [E.C.blue, E.C.paper, E.C.blue, E.C.paper, E.C.blue, E.C.paper]);
  const GX = 1340, GY = 690;
  SHOT({
    id: 's03', from: () => B(20), to: () => B(32),
    draw(g, t, lt) {
      E.field(C.paper);
      push(lt, B(32) - B(20), GX, GY - 200, 0.04);
      // The bit: "0" and "1" in the same place; on beat 16 they part and breathe against each other on every beat.
      const split = Math.max(0, M.spring(t - (B(24) - 0.12), 2.0, 0.5));
      const beatPhase = ((t - B(24)) / (B(25) - B(24))) % 1;
      const breathe = t > B(24) ? 0.5 - 0.5 * Math.cos(beatPhase * Math.PI * 2) : 0;
      const off = split * (150 + 18 * breathe);
      const enter = M.ease.outExpo(M.range(t, B(20) + 0.05, B(21)));
      g.save();
      g.font = '300 520px PlexSans'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.beginPath(); g.rect(GX - 700, GY - 520, 1400, 560); g.clip();
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = C.blue; g.fillText('0', GX - off, GY + (1 - enter) * 560);
      g.fillStyle = C.purple; g.fillText('1', GX + off, GY + (1 - enter) * 560);
      g.restore();
      words([{ text: '0', at: B(21) }, { text: 'and', at: B(21) + 0.23 }, { text: '1.', at: B(22) }], 120, 460, 128, t, { color: C.ink, accent: C.blue });
      words([{ text: 'At', at: B(24) }, { text: 'once.', at: B(25), accent: true }], 120, 610, 128, t, { color: C.ink, accent: C.blue });
      mono('|ψ⟩ = α|0⟩ + β|1⟩', 126, 720, t, B(26));
    },
  });
})();
