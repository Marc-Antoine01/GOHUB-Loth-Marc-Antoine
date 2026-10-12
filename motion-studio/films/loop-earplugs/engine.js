// Type layer for the Loop film: lines that rise out of a mask, the dB figure, beats. The products are 3D (film3d.js).
(function () {
  'use strict';
  const { range, ease } = M;
  const BEATS = (window.BEATS && window.BEATS.beats) || [];
  const PERIOD = 60 / ((window.BEATS && window.BEATS.tempo) || 157);
  const B = (i) => (i <= 0 ? 0 : BEATS[i] ?? i * PERIOD); // beat 0 is exactly 0

  const type = document.getElementById('type');
  function el(tag, cls, parent, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    (parent || type).appendChild(e);
    return e;
  }
  const css = (e, s) => { for (const k in s) e.style[k] = s[k]; return e; };
  const show = (e, on) => { e.style.visibility = on ? '' : 'hidden'; };

  // One line under a mask; it rises from its baseline and leaves upwards (no fades).
  function line(text, { size = 132, weight = 600, color = '#fff', x = 150, y = 400, cls = '' } = {}) {
    const mask = el('div', 'mask ' + cls);
    const inner = el('div', 'in', mask, text);
    css(mask, { left: x + 'px', top: y + 'px', fontSize: size + 'px', fontWeight: String(weight), color });
    return {
      el: mask,
      set(u, o = 0, on = true) {
        show(mask, on && u > 0 && o < 1);
        inner.style.transform = `translateY(${((1 - ease.outExpo(u)) * 105 - ease.inExpo(o) * 105).toFixed(2)}%)`;
      },
    };
  }
  // A reveal that starts just before beat t0 and lands on it.
  const rise = (t, t0, dur = 0.42) => range(t, t0 - dur * 0.35, t0 + dur * 0.65);

  // dB figure: counts up and lands on the beat; tabular figures so the width never jitters.
  function figure({ x = 150, y = 610 } = {}) {
    const box = el('div', 'figure');
    css(box, { left: x + 'px', top: y + 'px' });
    const num = el('span', 'num', box); el('span', 'unit', box, ' dB'); el('span', 'snr', box, 'SNR');
    return {
      set(t, t0, value, { on = true, out = 0 } = {}) {
        const u = range(t, t0 - 0.55, t0);
        show(box, on && t >= t0 - 0.55 && out < 1);
        num.textContent = String(Math.round(value * ease.outCubic(u)));
        box.style.transform = `translateY(${(-ease.inExpo(out) * 120).toFixed(1)}%)`;
      },
    };
  }

  window.E = { B, el, css, show, line, rise, figure };
})();
