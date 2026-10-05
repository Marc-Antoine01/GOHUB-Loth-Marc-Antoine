// S04 The path, bars 5-6: the reference's "Working" step list, rebuilt with real CHUV offers. Each step lights as the lens passes.
SHOT({
  id: 's04',
  build(E) {
    this.O = [3200, 4400, 0];
    this.STEPS = ['Apprentissage ASSC', 'Bachelor HES', 'Pré-grade: Master', 'Formations postgraduées de spécialiste', 'Ecole doctorale: MD, MD-PhD'];
    this.at = [20, 21, 22, 24, 26]; // beats the steps land on; the last is the payoff
    const card = E.panel({ w: 1180, h: 1080, tone: 'white' });
    E.css(card, { padding: '96px 110px' });
    card.appendChild(E.heading('Formations au CHUV', 56));
    this.thread = E.css(E.el('div', null, card), { position: 'absolute', left: '150px', top: '330px', width: '4px', height: '0px', background: E.C.forest });
    this.rows = this.STEPS.map((label, i) => {
      const r = E.css(E.el('div', null, card), { position: 'absolute', left: '120px', top: 300 + i * 300 + 'px', display: 'flex', alignItems: 'center', gap: '56px' });
      const dot = E.css(E.el('div', null, r), { width: '64px', height: '64px', borderRadius: '50%', border: `6px solid ${E.C.forest}`, boxSizing: 'border-box', background: '#fff' });
      const lab = E.css(E.row(label, { w: 900, size: 34 }), { background: '#F3F3F3' });
      r.appendChild(lab);
      return { r, dot, lab };
    });
    this.card = E.plane(card);
  },
  draw(t) {
    const { B, bar, place, show } = E;
    const [ox, oy, oz] = this.O;
    const on = t >= bar(5) - 0.6 && t < bar(7);
    show(this.card, on);
    // Styles are written even while hidden: a frame never inherits another frame's state.
    place(this.card, { x: ox, y: oy, z: oz, rx: 6 });
    this.rows.forEach((row, i) => {
      const land = B(this.at[i]), u = M.ease.outExpo(M.range(t, land - 0.3, land + 0.05));
      row.r.style.clipPath = `inset(0 ${(1 - u) * 100}% 0 0)`;
      row.r.style.transform = `translateX(${(1 - u) * 60}px)`;
      const done = t >= land, last = i === this.rows.length - 1;
      row.dot.style.background = done ? (last ? E.C.signal : E.C.forest) : '#fff';
      row.lab.style.background = done && last ? E.C.signal : '#F3F3F3';
      row.lab.style.transform = last ? `scale(${1 + 0.06 * M.ease.outBack(M.range(t, land - 0.05, land + 0.35))})` : '';
      row.lab.style.transformOrigin = '0 50%';
    });
    const reach = M.ease.inOutCubic(M.range(t, B(20) - 0.2, B(26)));
    this.thread.style.height = reach * 1200 + 'px';
  },
});
