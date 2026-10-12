// S08 End card, bars 14-15: the line returns; the qubit drops in as the full stop on beat 60; the frame clears for the loop.
(() => {
  const { B, C, words, mono } = E;
  E.wipe(B(88), [E.C.blue, E.C.ink, E.C.blue, E.C.ink, E.C.blue, E.C.ink], { dir: -1 });
  const LOOP_CLEAR = 44.45; // uncover ends at +0.475 s, just before 45 s // bars sweep the card away; the last frames are the empty field frame 0 starts from
  E.wipe(LOOP_CLEAR, [E.C.gray80, E.C.ink, E.C.gray80, E.C.ink, E.C.gray80, E.C.ink]);
  const SIZE = 120, X = 120, Y = 560;
  SHOT({
    id: 's08', from: () => B(88), to: () => 45.01,
    draw(g, t, lt) {
      E.field(C.ink);
      if (t >= LOOP_CLEAR) return;
      E.push(lt, 45 - B(88), 900, 520, 0.03);
      const end = words([{ text: 'Faster,', at: B(88) + 0.3 }, { text: 'Stronger,', at: B(89) }, { text: 'Computer', at: B(90), accent: true }], X, Y, SIZE, t);
      // The full stop: the qubit from the hook falls into place and rings.
      const dx = end - SIZE * 0.28 + SIZE * 0.13, dy = Y - SIZE * 0.07, rr = SIZE * 0.075;
      const fall = Math.max(0, M.spring(t - (B(91) - 0.25), 2.4, 0.5));
      if (t >= B(91) - 0.25) {
        const ring = M.range(t, B(91), B(91) + 0.6);
        E.qubit(dx, M.lerp(dy - 420, dy, fall), rr, { fill: C.cyan, ring: C.cyan, ringR: t >= B(91) && ring < 1 ? rr * (1.5 + 3 * ring) : 0 });
      }
      mono('// the quantum world, now computable', X + 6, Y + 96, t, B(91) + 0.3);
    },
  });
})();
