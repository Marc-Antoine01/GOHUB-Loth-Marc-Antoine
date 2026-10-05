// S06 Figures, bars 9-10: the three published numbers, staggered in depth; each counts up and lands on its beat.
SHOT({
  id: 's06',
  build(E) {
    this.F = [
      { to: 260, plus: true, label: 'apprenti·es', beat: 41, pos: [-800, 6400, 0] },
      { to: 30, label: 'métiers', beat: 43, pos: [-1900, 6340, -700] },
      { to: 13000, label: 'collaboratrices et collaborateurs', beat: 46, pos: [-3000, 6440, -200] },
    ].map((f) => {
      const p = E.panel({ w: 980, h: 480, tone: 'mint' });
      E.css(p, { padding: '64px 80px' });
      f.num = E.heading('0', 210, E.C.forest); p.appendChild(f.num);
      p.appendChild(E.css(E.ui(f.label, 50), { marginTop: '8px' }));
      f.rec = E.plane(p);
      return f;
    });
  },
  draw(t) {
    const { B, bar, place, show } = E;
    const on = t >= bar(10) - 0.4 && t < bar(12) + 0.1;
    this.F.forEach((f) => {
      show(f.rec, on);
      // Styles are written even while hidden: a frame never inherits another frame's state.
      const land = B(f.beat), v = Math.round(f.to * M.ease.outExpo(M.range(t, land - 0.7, land)));
      f.num.textContent = v.toLocaleString('fr-CH').replace(/\s|’|'/g, ' ') + (f.plus ? '+' : '');
      const u = M.spring(t - (land - 0.7), 2.0, 0.6);
      const [x, y, z] = f.pos;
      place(f.rec, { x, y: y + (1 - u) * 120, z, rx: (1 - u) * 30, ry: 6 });
    });
  },
});
