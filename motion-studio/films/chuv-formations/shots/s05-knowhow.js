// S05 Know-how, bars 7-8: cut on the drop to a tall card. Simulation photo inside a UI card; on b34 it turns to the apprentices.
SHOT({
  id: 's05',
  build(E) {
    this.O = [1000, 6400, 0];
    const card = E.css(E.el('div', null, null), { position: 'relative', width: '1400px', height: '1800px', transformStyle: 'preserve-3d' });
    const front = E.css(E.panel({ w: 700, h: 940, tone: 'white' }), { position: 'absolute', left: 0, top: 0, backfaceVisibility: 'hidden', padding: '48px' });
    front.appendChild(E.photoMask('assets/photos/csm_chuv-formation-simulation_e980858c69.webp', { w: 652, h: 560, radius: 20 }));
    const line = E.css(E.heading('Apprendre et progresser professionnellement', 60), { whiteSpace: 'normal', width: '1220px', marginTop: '44px' });
    front.appendChild(line);
    front.appendChild(E.css(E.row('Voir les offres de formation', { w: 600, size: 24 }), { marginTop: '48px', background: E.C.mint }));
    const back = E.css(E.panel({ w: 700, h: 900, tone: 'mint' }), { position: 'absolute', left: 0, top: 0, padding: '64px 48px' });
    this.front = front; this.back = back;
    back.appendChild(E.heading('Apprentissages', 64));
    back.appendChild(E.css(E.photoMask('assets/photos/csm_chuv-formation-apprenties_528748adec.webp', { w: 604, h: 300, radius: 150 }), { marginTop: '56px' }));
    back.appendChild(E.css(E.ui('plus de 260 apprenti·es', 44), { marginTop: '56px' }));
    back.appendChild(E.css(E.ui('30 métiers', 44), { marginTop: '12px' }));
    card.appendChild(front); card.appendChild(back);
    this.card = E.plane(card);
    const sat = (title, w, lines) => { const p = E.panel({ w, h: 100 + lines * 30, tone: 'mint' }); E.css(p, { padding: '48px' }); p.appendChild(E.heading(title, 28)); p.appendChild(E.css(E.skeleton(w - 48, lines), { marginTop: '24px' })); return E.plane(p); };
    this.sats = [sat('Stages dans la santé', 420, 3), sat('Formation continue', 380, 4), sat('Bachelor HES', 360, 2)];
    this.satPose = [[-900, -280, -700], [820, 300, -1100], [760, -420, -300]];
  },
  draw(t) {
    const { B, bar, place, show } = E;
    const [ox, oy, oz] = this.O;
    const on = t >= bar(7) - 0.3 && t < bar(10) + 0.6;
    show(this.card, on); this.sats.forEach((r) => show(r, on));
    // Styles are written even while hidden: a frame never inherits another frame's state.
    const turn = M.ease.inOutCubic(M.range(t, B(34) - 0.5, B(34)));
    const settle = 1 - 0.04 * (1 - M.spring(t - bar(7), 2.4, 0.5));
    // The DOF filter flattens 3D, so backface-visibility can't hide a face: swap faces at 90°.
    const ang = 180 * turn, showBack = ang >= 90;
    this.front.style.visibility = showBack ? 'hidden' : ''; this.back.style.visibility = showBack ? '' : 'hidden';
    place(this.card, { x: ox, y: oy, z: oz, ry: (showBack ? ang - 180 : ang) + 6 * Math.sin((t - bar(7)) * 0.6), s: settle });
    this.sats.forEach((r, i) => { const [sx, sy, sz] = this.satPose[i]; place(r, { x: ox + sx, y: oy + sy, z: oz + sz, ry: 10 - i * 8 }); });
  },
});
