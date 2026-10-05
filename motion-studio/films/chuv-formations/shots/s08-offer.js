// S08 Offer + loop, bars 13-14: logo, the site's primary button (pressed on b58), then the camera returns to frame 0's pose.
SHOT({
  id: 's08',
  build(E) {
    this.O = [-3200, 1200, 0];
    const logo = E.el('img', null, null); logo.src = 'assets/brand/logo.svg'; logo.style.width = '1100px'; E.imgs.push(logo);
    this.logo = E.plane(logo);
    const p = E.panel({ w: 1000, h: 330, tone: 'mint' });
    E.css(p, { padding: '72px 80px' });
    this.btn = E.button('Voir les offres de formation', { size: 50 });
    p.appendChild(this.btn);
    p.appendChild(E.css(E.ui('chuv.ch › Formation', 34), { marginTop: '40px' }));
    this.panel = E.plane(p);
  },
  draw(t) {
    const { B, bar, place, show } = E;
    const [ox, oy, oz] = this.O;
    const on = t >= bar(15) - 0.4;
    show(this.logo, on); show(this.panel, on);
    // Styles are written even while hidden: a frame never inherits another frame's state.
    const lu = M.ease.outCubic(M.range(t, bar(15) - 0.1, B(61)));
    this.logo.el.firstChild.style.clipPath = `polygon(0 0, ${lu * 140}% 0, ${lu * 140 - 35}% 100%, 0 100%)`;
    place(this.logo, { x: ox - 220, y: oy - 210, z: oz });
    const pu = M.spring(t - (B(62) - 0.3), 2.2, 0.6);
    const press = 1 - 0.05 * Math.sin(Math.PI * M.clamp((t - B(70) + 0.05) / 0.2));
    this.btn.style.transform = `scale(${press})`;
    this.btn.style.background = t >= B(70) && t < B(70) + 0.25 ? '#004A34' : E.C.forest;
    place(this.panel, { x: ox - 220, y: oy + 220 + (1 - pu) * 200, z: oz + 60, rx: (1 - pu) * -40 });
  },
});
