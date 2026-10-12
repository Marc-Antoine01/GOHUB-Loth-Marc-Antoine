// S02 The quantum world, bars 1-2: the qubit dot zooms into an atom; probability clouds snap into orbitals on beat 8.
(() => {
  const { B, C, words, mono, push } = E;
  const NX = 1300, NY = 540;
  const ORB = [{ a: 330, b: 120, rot: 0.35 }, { a: 330, b: 120, rot: -0.75 }, { a: 330, b: 120, rot: 1.45 }];
  SHOT({
    id: 's02', from: () => B(4), to: () => B(12),
    draw(g, t, lt) {
      E.field(C.ink);
      push(lt, B(12) - B(4), NX, NY, 0.06);
      // Snap zoom: the hook's full stop flies to the nucleus and grows (0.35 s).
      const d = E.hookDot(), z = M.ease.inOutCubic(M.range(lt, 0, 0.35));
      const nx = M.lerp(d.x, NX, z), ny = M.lerp(d.y, NY, z), nr = M.lerp(d.r * 1.9 * 6, 30, z); // continues S01's snap zoom
      // Clouds: seeded dots around each orbital; spread falls from a fuzzy cloud to a crisp ring on beat 8.
      const crisp = Math.max(0, M.spring(t - (B(8) - 0.15), 2.2, 0.55));
      const spread = M.lerp(70, 5, crisp) * Math.max(0.25, z);
      ORB.forEach((o, k) => {
        const r = M.mulberry32(100 + k);
        g.fillStyle = k === 1 ? C.purple40 : C.blue40;
        const spin = t * (0.35 + k * 0.12);
        for (let i = 0; i < 700; i++) {
          const th = r() * Math.PI * 2 + spin, u = r(), v = r();
          const gauss = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(2 * Math.PI * v);
          const zz = M.lerp(1.8, 1, z); const ex = (o.a + gauss * spread) * Math.cos(th) * zz, ey = (o.b + gauss * spread * 0.6) * Math.sin(th) * zz;
          const x = nx + ex * Math.cos(o.rot) - ey * Math.sin(o.rot), y = ny + ex * Math.sin(o.rot) + ey * Math.cos(o.rot);
          const s = 2 + (i % 3 === 0 ? 1 : 0);
          g.fillRect(x - s / 2, y - s / 2, s, s);
        }
      });
      E.qubit(nx, ny, nr, { fill: C.cyan, ring: C.cyan, ringR: nr * 1.7 });
      words([{ text: 'The', at: B(5) }, { text: 'quantum', at: B(6), accent: true }], 120, 500, 120, t);
      words([{ text: 'world.', at: B(7) }], 120, 640, 120, t);
      mono('// position becomes probability', 126, 740, t, B(8) + 0.1);
    },
  });
})();
