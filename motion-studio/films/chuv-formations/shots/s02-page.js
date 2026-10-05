// S02 The page builds, bars 1-2: the site's header assembles around the lens; "Formation" goes active on b9; H1 lands on b10.
SHOT({
  id: 's02',
  build(E) {
    this.O = [3200, 0, 0];
    const logo = E.el('img', null, null); logo.src = 'assets/brand/logo.svg'; logo.style.width = '360px'; E.imgs.push(logo);
    this.logo = E.plane(logo);
    this.pillsData = [
      { label: 'Offre en soins', size: 44 }, { label: 'Pratique', size: 44 },
      { label: 'Formation', size: 34 }, { label: 'Recherche et innovation', size: 34 }, { label: 'Départements et services', size: 34 },
    ];
    this.pills = this.pillsData.map((d) => { d.el = E.pill(d.label, { size: d.size }); return E.plane(d.el); });
    const h1w = E.css(E.el('div', null, null), { width: '2800px' });
    this.h1text = E.heading('Formations au CHUV', 120, '#fff');
    h1w.appendChild(this.h1text);
    this.h1 = E.plane(h1w);
    // Satellites: real section headings over skeleton bodies, defocused around the hero.
    const sat = (title, w, lines, tone) => {
      const p = E.panel({ w, h: 120 + lines * 30, tone });
      E.css(p, { padding: '56px' });
      p.appendChild(E.heading(title, 30)); p.appendChild(E.css(E.skeleton(w - 56, lines), { marginTop: '28px' }));
      return E.plane(p);
    };
    this.sats = [sat('Catégories professionnelles', 520, 4, 'mint'), sat('Stages d’observation', 420, 3, 'white'), sat('Apprentissages', 460, 5, 'mint'), sat('Formation en ligne', 400, 3, 'white')];
    this.satPose = [[-1250, 600, -1100, 8], [1500, 820, -1900, -10], [1300, 560, -700, -6], [-1700, 900, -2300, 9]];
  },
  layout(E) {
    // Lay the pills out like the site: two big ones on the left, three small ones on the right.
    let x = -900;
    this.pillsData.forEach((d, i) => {
      const w = d.el.offsetWidth / 2; // layout size, not the 3D-projected size
      if (i === 2) x = 1000 - this.pillsData.slice(2).reduce((a, q) => a + q.el.offsetWidth / 2 + 20, 0) + 20;
      d.cx = x + w / 2; x += w + 20;
    });
  },
  draw(t) {
    const { B, bar, place, show, pillState } = E;
    const [ox, oy, oz] = this.O;
    const on = t >= bar(1) - 0.6 && t < bar(3) + 0.6;
    [this.logo, this.h1, ...this.pills, ...this.sats].forEach((r) => show(r, on));
    // Styles are written even while hidden: a frame never inherits another frame's state.
    const lu = M.spring(t - (B(4) - 0.3), 2.2, 0.6);
    place(this.logo, { x: ox - 900 + 90, y: oy - 390, z: oz + (1 - lu) * -900, ry: (1 - lu) * 40 });
    this.pills.forEach((r, i) => {
      const d = this.pillsData[i], land = B(4 + i), u = M.spring(t - (land - 0.3), 2.2, 0.55);
      const active = d.label === 'Formation' && t >= B(9);
      pillState(d.el, active);
      const punch = active ? 1 + 0.12 * (1 - M.spring(t - B(9), 2.6, 0.4)) : 1;
      place(r, { x: ox + (d.cx ?? 0), y: oy - 250 + (i < 2 ? 0 : 8), z: oz + (1 - u) * -1100, rx: (1 - u) * -50, s: punch });
    });
    const hu = M.ease.outExpo(M.range(t, B(10) - 0.32, B(10) + 0.1));
    this.h1text.style.clipPath = `inset(0 ${(1 - hu) * 100}% 0 0)`;
    place(this.h1, { x: ox - 540 + 700, y: oy + 40, z: oz + (1 - hu) * 120 });
    this.sats.forEach((r, i) => {
      const [sx, sy, sz, ry] = this.satPose[i], u = M.spring(t - (B(4 + i) - 0.4), 1.8, 0.7);
      place(r, { x: ox + sx, y: oy + sy + (1 - u) * 300, z: oz + sz, ry });
    });
  },
});
