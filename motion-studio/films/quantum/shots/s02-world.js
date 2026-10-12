// S02 The quantum world, bars 2-4: the qubit dot zooms into an atom; drifting probability clouds snap into orbitals on beat 13;
// on beat 16 one look collapses a cloud to a single point, which melts back into probability.
(() => {
  const { B, C, words, mono, push } = E;
  const NX = 1300, NY = 540;
  const CX = NX + 330 * Math.cos(0.35) * 0.7, CY = NY + 330 * Math.sin(0.35) * 0.7 - 60; // where the look finds it
  const ORB = [{ a: 330, b: 120, rot: 0.35 }, { a: 330, b: 120, rot: -0.75 }, { a: 330, b: 120, rot: 1.45 }];
  SHOT({
    id: 's02', from: () => B(8), to: () => B(20),
    draw(g, t, lt) {
      E.field(C.ink);
      push(lt, B(20) - B(8), NX, NY, 0.06);
      // Snap zoom: the hook's full stop flies to the nucleus and grows (0.35 s).
      const d = E.hookDot(), z = M.ease.inOutCubic(M.range(lt, 0, 0.35));
      const nx = M.lerp(d.sx, NX, z), ny = M.lerp(d.sy, NY, z), nr = M.lerp(d.r * 1.9 * 6 * d.P, 30, z); // continues S01's snap zoom
      // Clouds: seeded dots around each orbital; spread falls from a fuzzy cloud to a crisp ring on beat 8.
      const crisp = Math.max(0, M.spring(t - (B(13) - 0.15), 2.2, 0.55));
      // The measurement: orbital 0 collapses to one bright point on beat 16, then spreads out again by beat 19.
      const look = M.ease.outExpo(M.range(t, B(16) - 0.12, B(16) + 0.1)) * (1 - M.ease.inOutCubic(M.range(t, B(17), B(19))));
      const spread = M.lerp(70, 5, crisp) * Math.max(0.25, z);
      ORB.forEach((o, k) => {
        const r = M.mulberry32(100 + k);
        g.fillStyle = k === 1 ? C.purple40 : C.blue40;
        const spin = t * (0.35 + k * 0.12), col = k === 0 ? look : 0;
        for (let i = 0; i < 700; i++) {
          const th = r() * Math.PI * 2 + spin, u = r(), v = r();
          const gauss = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(2 * Math.PI * v);
          const zz = M.lerp(1.8, 1, z); const ex = (o.a + gauss * spread) * Math.cos(th) * zz, ey = (o.b + gauss * spread * 0.6) * Math.sin(th) * zz;
          let x = nx + ex * Math.cos(o.rot) - ey * Math.sin(o.rot), y = ny + ex * Math.sin(o.rot) + ey * Math.cos(o.rot);
          if (col > 0) { x = M.lerp(x, CX, col); y = M.lerp(y, CY, col); }
          const s = 2 + (i % 3 === 0 ? 1 : 0);
          g.fillRect(x - s / 2, y - s / 2, s, s);
        }
      });
      if (look > 0.02) { // the measured position: the one place the electron was found
        const u = M.range(t, B(16), B(16) + 0.6);
        E.qubit(CX, CY, 14 * look, { fill: C.white, ring: C.white, ringR: u < 1 ? 14 + 60 * M.ease.outCubic(u) : 0 });
      }
      E.qubit(nx, ny, nr, { fill: C.cyan, ring: C.cyan, ringR: nr * 1.7 });
      words([{ text: 'The', at: B(9) }, { text: 'quantum', at: B(10), accent: true }], 120, 500, 120, t);
      words([{ text: 'world.', at: B(11) }], 120, 640, 120, t);
      mono('// position becomes probability', 126, 740, t, B(13) + 0.1);
      mono('// until you look', 126, 800, t, B(16), { color: C.gray30 });
    },
  });
})();
