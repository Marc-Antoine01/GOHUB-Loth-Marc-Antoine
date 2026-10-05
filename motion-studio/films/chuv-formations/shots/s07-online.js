// S07 Online, bars 11-12: crane up over a floor plane; people (crops of the e-learning photo) get linked, the network closes on b50.
SHOT({
  id: 's07',
  build(E) {
    this.O = [-8000, 2400, 0];
    const floor = E.css(E.el('div', null, null), { position: 'relative', width: '4000px', height: '2600px' });
    const head = E.css(E.panel({ w: 1320, h: 360, tone: 'white' }), { position: 'absolute', left: '1240px', top: '60px', padding: '60px 76px' });
    head.appendChild(E.heading('Formation en ligne', 88));
    head.appendChild(E.css(E.ui('Apprendre grâce à nos cours, conférences et vidéos en ligne', 38), { marginTop: '22px' }));
    floor.appendChild(head);
    this.nodes = [[700, 1100], [1500, 1900], [2300, 1050], [3100, 1800], [3500, 900], [2000, 1500]];
    const svg = E.css(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), { position: 'absolute', left: 0, top: 0 });
    svg.setAttribute('width', 4000); svg.setAttribute('height', 2600);
    floor.appendChild(svg);
    const links = [[0, 5], [5, 2], [2, 4], [4, 3], [3, 1], [1, 5], [5, 3], [1, 0]];
    this.links = links.map(([a, b]) => {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const [x1, y1] = this.nodes[a], [x2, y2] = this.nodes[b];
      Object.entries({ x1, y1, x2, y2, stroke: E.C.signal, 'stroke-width': 8, 'stroke-linecap': 'round' }).forEach(([k, v]) => l.setAttribute(k, v));
      const len = Math.hypot(x2 - x1, y2 - y1); l.setAttribute('stroke-dasharray', len); l.dataset.len = len;
      svg.appendChild(l); return l;
    });
    this.discs = this.nodes.map(([x, y], i) => {
      const d = E.css(E.photoMask('assets/photos/csm_chuv-formation-e-learning_10a6d64ac4.webp', { w: 150, h: 150, radius: 75 }), { position: 'absolute', left: x - 150 + 'px', top: y - 150 + 'px', boxShadow: `0 0 0 10px ${E.C.mint}` });
      d.firstChild.style.objectPosition = `${[18, 30, 52, 70, 86, 45][i]}% ${[60, 35, 70, 30, 55, 50][i]}%`;
      d.firstChild.style.transform = 'scale(2.6)';
      floor.appendChild(d); return d;
    });
    this.floor = E.plane(floor);
  },
  draw(t) {
    const { B, bar, place, show } = E;
    const [ox, oy, oz] = this.O;
    const on = t >= bar(11) - 0.5 && t < bar(13) + 0.5;
    show(this.floor, on);
    // Styles are written even while hidden: a frame never inherits another frame's state.
    place(this.floor, { x: ox, y: oy, z: oz, rx: 90 });
    this.discs.forEach((d, i) => {
      const u = M.spring(t - (B(44 + i) - 0.25), 2.4, 0.55);
      d.style.transform = `scale(${Math.max(0, u)})`;
    });
    this.links.forEach((l, i) => {
      const end = i === this.links.length - 1 ? B(50) : B(45) + i * 0.32;
      const u = M.ease.inOutCubic(M.range(t, end - 0.4, end));
      l.setAttribute('stroke-dashoffset', (1 - u) * l.dataset.len);
    });
  },
});
