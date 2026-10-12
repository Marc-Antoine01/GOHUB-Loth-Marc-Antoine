// S01 Hook, bar 0: "Faster, Stronger, Computer." word by word; on beat 3 the full stop becomes a qubit.
(() => {
  const { B, C, words, mono, qubit, push } = E;
  const SIZE = 150, X = 120, Y = 600;
  // Shared layout: where the full stop sits (S02 grows the qubit from here).
  E.hookDot = () => {
    const g = E.g;
    g.font = `300 ${SIZE}px PlexSans`; g.letterSpacing = `${-SIZE * 0.01}px`;
    const a = g.measureText('Faster,').width, b = g.measureText('Stronger,').width;
    g.font = `600 ${SIZE}px PlexSans`;
    const c = g.measureText('Computer').width;
    return { x: X + a + b + c + SIZE * 0.56 + SIZE * 0.2, y: Y - SIZE * 0.08, r: SIZE * 0.075 };
  };
  SHOT({
    id: 's01', from: () => 0, to: () => B(8),
    draw(g, t, lt) {
      E.field(C.ink);
      const dot = E.hookDot();
      push(lt, B(8), dot.x, dot.y, 0.05);
      // Snap zoom into the full stop on the last half-beat: the qubit becomes the next shot's nucleus.
      const zoom = 1 + 5 * M.ease.inExpo(M.range(t, B(8) - 0.32, B(8)));
      g.translate(dot.x, dot.y); g.scale(zoom, zoom); g.translate(-dot.x, -dot.y);
      words([{ text: 'Faster,', at: 0.1 }, { text: 'Stronger,', at: B(1) }, { text: 'Computer', at: B(2), accent: true }], X, Y, SIZE, t, { gap: 0.28 });
      // The full stop lands with "Computer", then on beat 3 it wakes up: a ring opens and it starts to oscillate.
      if (t >= B(2) - 0.05) {
        const wake = M.spring(t - B(3), 2.4, 0.35);
        const osc = t >= B(3) ? Math.sin((t - B(3)) * Math.PI * 2 * 2.13) * 6 * Math.exp(-(t - B(3)) * 0.4) : 0;
        qubit(dot.x, dot.y + osc, dot.r * (1 + 0.9 * Math.max(0, wake)), { fill: C.cyan, ring: C.cyan, ringR: t >= B(3) ? dot.r * (1 + 2.4 * Math.max(0, wake)) : 0, lw: 4 });
      }
      mono('// quantum', X + 6, Y + 120, t, B(1) + 0.05);
    },
  });
})();
