// S04 Entanglement, bars 8-10: two qubits joined by a wave; on beat 36 both flip on the same frame;
// they drift apart, the wave stretches, and on beat 40 they flip back together: distance changes nothing.
(() => {
  const { B, C, words, mono, push } = E;
  E.wipe(B(32), [E.C.blue, E.C.paper, E.C.blue40, E.C.paper, E.C.blue, E.C.paper], { dir: -1 });
  const R = 130;
  function spinQubit(g, q, ang, pulse) { // q is the centre
    g.fillStyle = C.white; g.strokeStyle = C.gray80; g.lineWidth = 2;
    g.beginPath(); g.arc(q.x, q.y, R, 0, Math.PI * 2); g.fill(); g.stroke();
    if (pulse > 0 && pulse < 1) { g.strokeStyle = C.blue; g.lineWidth = 3 * (1 - pulse); g.beginPath(); g.arc(q.x, q.y, R * (1 + pulse * 1.2), 0, Math.PI * 2); g.stroke(); }
    g.save(); g.translate(q.x, q.y); g.rotate(ang);
    g.strokeStyle = C.blue; g.fillStyle = C.blue; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, R * 0.55); g.lineTo(0, -R * 0.45); g.stroke();
    g.beginPath(); g.moveTo(0, -R * 0.68); g.lineTo(-R * 0.24, -R * 0.36); g.lineTo(R * 0.24, -R * 0.36); g.closePath(); g.fill();
    g.restore();
  }
  SHOT({
    id: 's04', from: () => B(32), to: () => B(44),
    draw(g, t, lt) {
      E.field(C.paper);
      const apart = M.ease.inOutCubic(M.range(t, B(37), E.Bf(39.5))) * 70; // they move apart between the two flips
      const A = { x: 700 - apart, y: 660 }, Bq = { x: 1640 + apart * 0.3, y: 660 };
      push(lt, B(44) - B(32), 1200, 640, 0.04);
      // The link: a standing wave between them, its amplitude breathing on the beat.
      const amp = 34 * (0.6 + 0.4 * Math.cos(((t - B(32)) / (B(33) - B(32))) * Math.PI * 2));
      const reach = M.ease.inOutCubic(M.range(t, B(32) + 0.1, B(34)));
      g.strokeStyle = C.blue40; g.lineWidth = 3;
      g.beginPath();
      for (let i = 0; i <= 200; i++) {
        const u = i / 200; if (u > reach) break;
        const x = M.lerp(A.x + R, Bq.x - R, u), y = A.y + Math.sin(u * Math.PI * 6 - t * 9) * amp * Math.sin(u * Math.PI);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      const flip = Math.max(0, M.spring(t - B(36), 2.6, 0.42)) - Math.max(0, M.spring(t - B(40), 2.6, 0.42)); // same t for both: no delay
      const pulse = t < B(40) ? M.range(t, B(36), B(36) + 0.5) : M.range(t, B(40), B(40) + 0.5);
      const inA = M.spring(t - (B(32) + 0.2), 2.4, 0.5), inB = M.spring(t - (B(33) + 0.0), 2.4, 0.5);
      g.save(); g.translate(A.x, A.y); g.scale(Math.max(0, inA), Math.max(0, inA)); g.translate(-A.x, -A.y); spinQubit(g, A, Math.PI * flip, pulse); g.restore();
      g.save(); g.translate(Bq.x, Bq.y); g.scale(Math.max(0, inB), Math.max(0, inB)); g.translate(-Bq.x, -Bq.y); spinQubit(g, Bq, Math.PI * (1 - flip) + Math.PI, pulse); g.restore();
      words([{ text: 'Entanglement.', at: B(34), accent: true }], 120, 290, 128, t, { color: C.ink, accent: C.blue });
      mono('// measure one, and you know the other', 126, 390, t, B(37));
      mono('// however far apart', 126, 450, t, B(40) + 0.1, { color: C.gray50 });
    },
  });
})();
