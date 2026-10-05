// S01 Hook, bar 0: the site's own line, four planes stepping back in depth, each rotating in from edge-on onto its beat.
SHOT({
  id: 's01',
  build(E) {
    const LINES = ['Au cœur de', 'nombreux réseaux', 'nationaux et', 'internationaux'];
    this.lines = LINES.map((text, i) => {
      const wrap = E.css(E.el('div', null, null), { width: '2600px' }); // 1300 design px column, left-aligned
      wrap.appendChild(E.heading(text, 150, i === 3 ? E.C.signal : '#fff'));
      return E.plane(wrap);
    });
  },
  draw(t) {
    const { B, place, show } = E;
    const on = t < B(6);
    this.lines.forEach((rec, i) => {
      // A line exists only once its rotation starts: edge-on text would read as a glitch.
      show(rec, on && t >= B(i) - 0.28);
      // Styles are written even while hidden: a frame never inherits another frame's state.
      const land = B(i), u = M.spring(t - (land - 0.28), 1.8, 0.7);
      // Left edge at x = -640: the column centre sits 650 px right of it.
      place(rec, { x: -640 + 650, y: -330 + i * 210 + (1 - u) * 60, z: -i * 140, rx: (1 - Math.min(u, 1)) * 82 });
    });
  },
});
