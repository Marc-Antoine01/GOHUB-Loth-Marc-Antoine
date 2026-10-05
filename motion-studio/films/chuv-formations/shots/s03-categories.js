// S03 Categories, bars 3-4: a ring of the 7 real categories turns past the lens, then collapses into the site's two-column grid on b18.
SHOT({
  id: 's03',
  build(E) {
    this.O = [3200, 2200, 0];
    // Site order: left column then right column.
    this.cats = [
      ['Professions médicales universitaires', 0, 0], ['Administration', 0, 1], ['Psycho-social', 0, 2],
      ['Soins', 1, 0], ['Médico-technique et thérapeutique', 1, 1], ['Logistique', 1, 2], ['Management et cadres', 1, 3],
    ].map(([title, col, rowi]) => {
      const p = E.panel({ w: 820, h: 190, tone: 'mint' });
      E.css(p, { padding: '48px 60px' });
      p.appendChild(E.heading(title, 46)); p.appendChild(E.css(E.skeleton(700, 2, { gap: 22 }), { marginTop: '26px' }));
      return { rec: E.plane(p), col, rowi };
    });
    const hw = E.css(E.el('div', null, null), { width: '2800px' });
    this.titleText = E.heading('Catégories professionnelles', 96, '#fff');
    hw.appendChild(this.titleText);
    this.title = E.plane(hw);
  },
  draw(t) {
    const { B, bar, place, show } = E;
    const [ox, oy, oz] = this.O;
    const on = t >= bar(3) - 0.6 && t < bar(5) + 0.6;
    show(this.title, on); this.cats.forEach((c) => show(c.rec, on));
    // Styles are written even while hidden: a frame never inherits another frame's state.
    const R = 980, n = this.cats.length;
    const spin = 70 - 70 * M.ease.inOutCubic(M.range(t, bar(3) - 0.2, B(18) - 0.2)); // ring turns 70° into place
    const collapse = M.spring(t - (B(18) - 0.28), 2.0, 0.62);
    this.cats.forEach((c, i) => {
      const phi = ((spin + (i * 360) / n) * Math.PI) / 180;
      const ring = { x: ox + R * Math.sin(phi), y: oy + 60, z: oz - R + R * Math.cos(phi), ry: (phi * 180) / Math.PI };
      const grid = { x: ox + (c.col ? 430 : -430), y: oy - 130 + c.rowi * 205, z: oz, ry: 0 };
      const u = Math.max(0, collapse);
      const ryRing = ((ring.ry + 180) % 360) - 180;
      place(c.rec, { x: ring.x + (grid.x - ring.x) * u, y: ring.y + (grid.y - ring.y) * u, z: ring.z + (grid.z - ring.z) * u, ry: ryRing * (1 - Math.min(1, u)) });
    });
    const tu = M.ease.outExpo(M.range(t, B(18) - 0.1, B(18) + 0.3));
    this.titleText.style.clipPath = `inset(0 ${(1 - tu) * 100}% 0 0)`;
    place(this.title, { x: ox - 840 + 700, y: oy - 360, z: oz });
  },
});
