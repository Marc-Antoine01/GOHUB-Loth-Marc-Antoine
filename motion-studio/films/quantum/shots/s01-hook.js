// S01 Hook, bar 0: "Faster, Stronger, Computer." word by word; on beat 3 the full stop becomes a qubit and keeps pulsing.
(() => {
  const { B, C, words, mono, qubit, push } = E;
  const X = 120, Y = 600, RIGHT = E.W - 120; // the line, the dot and its widest ring all stay inside the 120 px margins
  // Shared layout, fitted to the frame: the type size is solved from the measured line so the ring ends at RIGHT.
  E.hookDot = () => {
    const g = E.g, m = (w, s) => { g.font = `${w} 100px PlexSans`; g.letterSpacing = '-1px'; return g.measureText(s).width / 100; };
    const k = m(300, 'Faster,') + m(300, 'Stronger,') + m(600, 'Computer') + 0.56 + 0.2; // dot centre, in units of SIZE
    const SIZE = Math.min(150, (RIGHT - X) / (k + 0.075 * 3.6)); // ring peaks near 3.4 r
    const x = X + k * SIZE, y = Y - SIZE * 0.08, fy = Y - SIZE * 0.3, P = 1.04; // P: the push at the end of the shot
    return { x, y, r: SIZE * 0.075, size: SIZE, fy, sx: E.W / 2 + (x - E.W / 2) * P, sy: fy + (y - fy) * P, P };
  };
  SHOT({
    id: 's01', from: () => 0, to: () => B(8),
    draw(g, t, lt) {
      E.field(C.ink);
      const dot = E.hookDot(), SIZE = dot.size;
      push(lt, B(8), E.W / 2, dot.fy, dot.P - 1); // centred push: the line grows evenly and never leaves the frame
      // Snap zoom into the full stop on the last half-beat: the qubit becomes the next shot's nucleus.
      const zoom = 1 + 5 * M.ease.inExpo(M.range(t, B(8) - 0.32, B(8)));
      g.translate(dot.x, dot.y); g.scale(zoom, zoom); g.translate(-dot.x, -dot.y);
      words([{ text: 'Faster,', at: 0.1 }, { text: 'Stronger,', at: B(1) }, { text: 'Computer', at: B(2), accent: true }], X, Y, SIZE, t, { gap: 0.28 });
      // The full stop lands with "Computer", then on beat 3 it wakes up: a ring opens and it starts to oscillate.
      if (t >= B(2) - 0.05) {
        const wake = M.spring(t - B(3), 2.4, 0.35);
        const osc = t >= B(3) ? Math.sin((t - B(3)) * Math.PI * 2 * 2.13) * 6 * Math.exp(-(t - B(3)) * 0.4) : 0;
        qubit(dot.x, dot.y + osc, dot.r * (1 + 0.9 * Math.max(0, wake)), { fill: C.cyan, ring: C.cyan, ringR: t >= B(3) ? dot.r * (1 + 2.4 * Math.max(0, wake)) : 0, lw: 4 });
        // Heartbeat: from beat 5 a ripple runs out inside its ring on every beat, as if it were listening.
        for (const b of [5, 6, 7]) {
          const u = M.range(t, B(b), B(b) + 0.45);
          if (u > 0 && u < 1) { g.strokeStyle = `rgba(130,207,255,${(0.8 * (1 - u)).toFixed(3)})`; g.lineWidth = 2; g.beginPath(); g.arc(dot.x, dot.y + osc, dot.r * (1.3 + 2 * M.ease.outCubic(u)), 0, Math.PI * 2); g.stroke(); }
        }
      }
      mono('// quantum', X + 6, Y + SIZE * 0.8, t, B(1) + 0.05);
      mono(' computing', X + 6 + 46 * 0.6 * 10, Y + SIZE * 0.8, t, B(5), { color: C.gray30 });
    },
  });
})();
