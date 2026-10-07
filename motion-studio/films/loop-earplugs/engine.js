// Loop earplugs engine: a black studio stage, products from the shop's own cutouts, light that moves across them,
// and one "sound line" that shows how much noise each earplug takes away. Every draw writes every style it owns.
(function () {
  'use strict';
  const W = 1920, H = 1080;
  const { range, clamp, lerp, ease } = M;

  // ---- beats: beat 0 is exactly 0
  const BEATS = (window.BEATS && window.BEATS.beats) || [];
  const PERIOD = 60 / ((window.BEATS && window.BEATS.tempo) || 157);
  const B = (i) => (i <= 0 ? 0 : BEATS[i] ?? i * PERIOD);

  const stage = document.getElementById('stage');
  function el(tag, cls, parent, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    (parent || stage).appendChild(e);
    return e;
  }
  const css = (e, s) => { for (const k in s) e.style[k] = s[k]; return e; };
  const show = (e, on) => { e.style.visibility = on ? '' : 'hidden'; };
  const imgs = [];

  // A shot is a full-frame layer; its "lens" is a slow push (scale) and drift, set per frame.
  function layer(parent) { return el('div', 'layer', parent); }
  function lens(e, { s = 1, x = 0, y = 0, ox = 960, oy = 540 } = {}) {
    e.style.transformOrigin = `${ox}px ${oy}px`;
    e.style.transform = `translate(${x}px,${y}px) scale(${s})`;
  }

  // ---- stage light: near-black wall, a key from top left tinted by the product's finish, a pool on the floor.
  function light(parent) {
    const e = el('div', 'light', parent);
    return {
      el: e,
      set({ tint = '255,255,255', key = 0.08, poolX = 1340, poolY = 860, pool = 0.09, floor = 860, night = 0 }) {
        const wall = night ? `rgb(${Math.round(lerp(10, 6, night))},${Math.round(lerp(10, 9, night))},${Math.round(lerp(10, 20, night))})` : '#0A0A0A';
        e.style.background = [
          `radial-gradient(ellipse 520px 90px at ${poolX}px ${poolY}px, rgba(255,255,255,${pool}) 0%, rgba(255,255,255,0) 100%)`,
          `linear-gradient(180deg, rgba(0,0,0,0) ${floor - 2}px, rgba(255,255,255,0.025) ${floor}px, rgba(0,0,0,0) ${floor + 220}px)`,
          `radial-gradient(ellipse 1500px 1000px at 18% -10%, rgba(${tint},${key}) 0%, rgba(${tint},0) 70%)`,
          wall,
        ].join(',');
      },
    };
  }

  // ---- product rig: cutout + specular streak (masked to the cutout) + floor reflection.
  // set(): x, y = floor contact (bottom centre); h = height in px.
  function product(src, parent) {
    const root = el('div', 'prod', parent);
    const body = el('div', 'pbody', root);
    const img = el('img', 'pimg', body); img.src = src; imgs.push(img);
    const spec = el('div', 'spec', body);
    css(spec, { webkitMaskImage: `url(${src})`, maskImage: `url(${src})` });
    const refl = el('div', 'refl', root);
    const rimg = el('img', 'pimg', refl); rimg.src = src; imgs.push(rimg);
    const rec = {
      root, aspect: 0.85,
      set({ x = 1340, y = 860, h = 640, ry = 0, rz = 0, s = 1, spec: u = -1, bright = 1, refl: ro = 0.2, on = true, z = 0, blur = 0, specA = 0.75 }) {
        show(root, on);
        const w = h * (img.naturalWidth ? img.naturalWidth / img.naturalHeight : rec.aspect);
        css(root, { transform: `translate(${x - w / 2}px,${y - h}px)`, width: w + 'px', height: h + 'px', zIndex: String(z) });
        css(body, { transform: `perspective(1600px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`, filter: `brightness(${bright})${blur ? ` blur(${blur}px)` : ''}` });
        // The streak is a soft diagonal band; u runs from -0.4 (off left) to 1.4 (off right).
        const p = u * 100;
        spec.style.background = `linear-gradient(105deg, rgba(255,255,255,0) ${p - 22}%, rgba(255,255,255,${specA}) ${p}%, rgba(255,255,255,0) ${p + 22}%)`;
        spec.style.opacity = u < -0.39 || u > 1.39 ? '0' : '1';
        css(refl, { transform: `translateY(4px) scaleY(-1)`, opacity: String(ro * (bright > 0.05 ? 1 : 0)), filter: `brightness(${bright})${blur ? ` blur(${blur + 2}px)` : ' blur(2px)'}` });
      },
    };
    return rec;
  }

  // ---- macro: a shop 3D scene, full frame, pushed in, with a light sweep across the surfaces.
  function macro(src, parent) {
    const box = el('div', 'macro', parent);
    const img = el('img', null, box); img.src = src; imgs.push(img);
    const sweep = el('div', 'sweep', box);
    return {
      el: box,
      set({ on = true, s = 1.3, x = 0, y = 0, ox = 50, oy = 50, sweep: u = -1, blur = 0, bright = 1 }) {
        show(box, on);
        css(img, { transformOrigin: `${ox}% ${oy}%`, transform: `translate(${x}px,${y}px) scale(${s})`, filter: `blur(${blur}px) brightness(${bright})` });
        const p = u * 100;
        sweep.style.background = `linear-gradient(110deg, rgba(255,255,255,0) ${p - 18}%, rgba(255,255,255,0.35) ${p}%, rgba(255,255,255,0) ${p + 18}%)`;
      },
    };
  }

  // ---- type: one line under a mask; the line rises from its baseline (no fades).
  function line(text, { size = 140, weight = 600, color = '#fff', parent, x = 150, y = 400, cls = '' } = {}) {
    const mask = el('div', 'mask ' + cls, parent);
    const inner = el('div', 'in', mask, text);
    css(mask, { left: x + 'px', top: y + 'px', fontSize: size + 'px', fontWeight: String(weight), color });
    return {
      el: mask, inner,
      // u: 0 hidden below, 1 in place; o: 0 in place, 1 gone above
      set(u, o = 0, on = true) {
        show(mask, on && u > 0 && o < 1);
        inner.style.transform = `translateY(${((1 - ease.outExpo(u)) * 105 - ease.inExpo(o) * 105).toFixed(2)}%)`;
      },
      text(s) { if (inner.textContent !== s) inner.textContent = s; },
    };
  }
  // A reveal that starts `lead` seconds before beat t0 and lands on it.
  const rise = (t, t0, dur = 0.42) => range(t, t0 - dur * 0.35, t0 + dur * 0.65);

  // ---- the sound line: a horizontal waveform. amp 1 = the raw ambience; the earplug scales it by 10^(-dB/20).
  const NS = 'http://www.w3.org/2000/svg';
  function soundline(parent, { y = 975, x0 = 150, x1 = 1770, color = 'rgba(255,255,255,0.9)', width = 4.5 } = {}) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'wave'); svg.setAttribute('width', W); svg.setAttribute('height', H);
    (parent || stage).appendChild(svg);
    const mk = (c, w) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', c); p.setAttribute('stroke-width', w); p.setAttribute('stroke-linecap', 'round'); svg.appendChild(p); return p; };
    const noise = mk(color, width), voice = mk('#fff', width + 0.5);
    const N = 260;
    // kind: 'crowd' (dense, pumping), 'city' (slow swells), 'snore' (periodic swell), 'office' (noise + speech), 'flat'
    function path(t, amp, kind, seed, speech) {
      let d = '';
      for (let i = 0; i <= N; i++) {
        const u = i / N, x = lerp(x0, x1, u);
        const taper = Math.sin(Math.PI * u) ** 0.6; // the line rests on both ends
        let v;
        if (speech) {
          // syllables: bursts that travel along the line
          const syl = Math.max(0, M.noise1(seed + 9, u * 9 - t * 6)) ** 1.5;
          v = Math.sin(u * 180 + t * 40) * syl * 1.4;
        } else {
          const fast = M.noise1(seed, u * 90 + t * 31) * 0.55 + M.noise1(seed + 1, u * 37 - t * 17) * 0.45;
          let env = 1;
          if (kind === 'crowd') env = 0.7 + 0.3 * Math.abs(Math.sin(t * Math.PI * 2.6)); // pumps with the music
          if (kind === 'city') env = 0.55 + 0.45 * (M.noise1(seed + 2, u * 3 + t * 0.9) * 0.5 + 0.5);
          if (kind === 'snore') env = 0.15 + 0.85 * Math.max(0, Math.sin(t * Math.PI * 1.35 + u * 1.2)) ** 2;
          if (kind === 'office') env = 0.6 + 0.4 * (M.noise1(seed + 3, u * 5 - t * 1.5) * 0.5 + 0.5);
          v = fast * env;
        }
        const yy = y + v * amp * 95 * taper;
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + yy.toFixed(1);
      }
      return d;
    }
    return {
      el: svg,
      set({ t, amp = 1, kind = 'crowd', seed = 1, on = true, voiceAmp = 0, opacity = 1 }) {
        show(svg, on);
        svg.style.opacity = String(opacity);
        noise.setAttribute('d', kind === 'flat' ? `M${x0} ${y}L${x1} ${y}` : path(t, amp, kind, seed, false));
        voice.setAttribute('d', voiceAmp > 0 ? path(t, voiceAmp, 'speech', seed, true) : '');
      },
    };
  }

  // dB figure: counts up and lands on the beat. Tabular figures so the width never jitters.
  function figure(parent, { x = 150, y = 610 } = {}) {
    const box = el('div', 'figure', parent);
    css(box, { left: x + 'px', top: y + 'px' });
    const num = el('span', 'num', box), unit = el('span', 'unit', box, ' dB'), snr = el('span', 'snr', box, 'SNR');
    const mask = box;
    return {
      el: box,
      set(t, t0, value, { on = true, out = 0 } = {}) {
        const u = range(t, t0 - 0.55, t0);
        show(mask, on && t >= t0 - 0.55 && out < 1);
        num.textContent = String(Math.round(value * ease.outCubic(u)));
        box.style.clipPath = `inset(0 0 0 0)`;
        box.style.transform = `translateY(${(-ease.inExpo(out) * 120).toFixed(1)}%)`;
      },
    };
  }

  // ---- shots
  const SHOTS = [];
  window.SHOT = (def) => SHOTS.push(def);

  window.E = { W, H, B, el, css, show, layer, lens, light, product, macro, line, rise, soundline, figure, imgs, SHOTS, clamp, range, lerp, ease };
})();
