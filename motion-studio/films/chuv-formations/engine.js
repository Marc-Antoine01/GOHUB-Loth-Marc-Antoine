// Shared engine: one CSS 3D world, one camera, site components, depth of field. See docs/ANIMATION_GUIDE.md.
(function () {
  'use strict';
  const P = 1400; // perspective: a plane P px in front of the camera renders at scale 1
  const W = 1920, H = 1080;
  const { range, clamp, lerp, ease } = M;
  const C = { forest: '#006144', mint: '#B8F9E5', signal: '#6EFC8A', ink: '#212121', white: '#FFFFFF', deep: '#004A34' };

  // ---- beats
  const BEATS = (window.BEATS && window.BEATS.beats) || [];
  const B = (i) => (i <= 0 ? 0 : BEATS[i] ?? i * 0.5); // beat 0 is the loop point: exactly 0
  const bar = (n) => B(n * 4);

  // ---- stage
  const stage = document.getElementById('stage');
  const viewport = el('div', 'viewport', stage);
  const world = el('div', 'world', viewport);

  function el(tag, cls, parent, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    (parent || world).appendChild(e);
    return e;
  }
  const css = (e, s) => { for (const k in s) e.style[k] = s[k]; return e; };

  // ---- planes: everything in the world is a plane with a centre pose; DOF and culling read the centre.
  const planes = [];
  function plane(child, { dof = true } = {}) {
    const p = el('div', 'plane', world);
    p.appendChild(child);
    const rec = { el: p, pos: [0, 0, 0], dof, on: true };
    planes.push(rec);
    return rec;
  }
  // pose: { x, y, z, rx, ry, rz, s }. The element's centre sits at (x, y, z).
  function place(rec, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1 } = {}) {
    rec.pos = [x, y, z];
    rec.el.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${s * 0.5}) translate(-50%,-50%)`; // components are built at 2x
  }
  const show = (rec, on) => { rec.on = on; rec.el.style.visibility = on ? '' : 'hidden'; };

  // ---- camera
  let cam = { x: 0, y: 0, z: P, yaw: 0, pitch: 0, roll: 0, focus: P };
  const rad = (d) => (d * Math.PI) / 180;
  // Camera-space depth of a world point (distance in front of the lens), same rotation order as the CSS below.
  function depthOf([px, py, pz]) {
    let x = px - cam.x, y = py - cam.y, z = pz - cam.z;
    let a = rad(-cam.yaw), c = Math.cos(a), s = Math.sin(a);
    [x, z] = [x * c + z * s, -x * s + z * c];
    a = rad(-cam.pitch); c = Math.cos(a); s = Math.sin(a);
    [y, z] = [y * c - z * s, y * s + z * c];
    return -z;
  }
  function setCamera(c) {
    cam = c;
    world.style.transform = `translateZ(${P}px) rotateZ(${-c.roll}deg) rotateX(${-c.pitch}deg) rotateY(${-c.yaw}deg) translate3d(${-c.x}px,${-c.y}px,${-c.z}px)`;
  }
  // keys: [[t, pose, easeName?]]; easing applies to the segment that ends at the key.
  const KEYS = ['x', 'y', 'z', 'yaw', 'pitch', 'roll', 'focus'];
  function cameraAt(keys, t) {
    let i = 0;
    while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
    const [t0, a] = keys[i], [t1, b, e = 'inOutCubic'] = keys[i + 1];
    const u = e === 'cut' ? (t >= t1 ? 1 : 0) : ease[e](range(t, t0, t1));
    const out = {};
    for (const k of KEYS) out[k] = lerp(a[k] ?? 0, b[k] ?? 0, u);
    return out;
  }

  // Depth of field + fog + culling, once per frame after the camera moves.
  function optics() {
    for (const r of planes) {
      // Every branch writes every style it owns, so no frame inherits another frame's optics.
      if (!r.on) { r.el.style.filter = ''; continue; }
      const d = depthOf(r.pos);
      if (d < 60) { r.el.style.visibility = 'hidden'; r.el.style.filter = ''; continue; }
      r.el.style.visibility = '';
      if (!r.dof) { r.el.style.filter = ''; continue; }
      const blur = clamp(Math.abs(d - cam.focus) * 0.006, 0, 14);
      const far = clamp((d - cam.focus) / 3000, 0, 1);
      r.el.style.filter = `blur(${blur.toFixed(2)}px) brightness(${(1 - 0.28 * far).toFixed(3)})`;
    }
  }

  // ---- components (designed at 2x, planes scale them by 0.5)
  const X2 = (v) => v * 2;
  function panel({ w, h, tone = 'mint', cls = '' }) {
    return css(el('div', `glass ${tone} ${cls}`, null), { width: X2(w) + 'px', height: X2(h) + 'px' });
  }
  function heading(text, size, color = C.ink, tag = 'div') {
    return css(el(tag, 'sharp', null, text), { fontSize: X2(size) + 'px', color, lineHeight: 1.08 });
  }
  function ui(text, size, color = C.ink) {
    return css(el('div', 'atlas', null, text), { fontSize: X2(size) + 'px', color, lineHeight: 1.25 });
  }
  const ARROW = `<svg viewBox="0 0 24 24" width="1em" height="1em"><path d="M3 12h16M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
  function row(label, { w = 560, size = 22 } = {}) {
    const r = css(el('div', 'row atlas', null, `<span>${label}</span><i class="arrow">${ARROW}</i>`), { width: X2(w) + 'px', fontSize: X2(size) + 'px' });
    return r;
  }
  function pill(label, { size = 22, active = false, onDark = true } = {}) {
    const p = css(el('div', 'pill atlas', null, label), { fontSize: X2(size) + 'px' });
    pillState(p, active, onDark);
    return p;
  }
  function pillState(p, active, onDark = true) {
    css(p, active ? { background: C.signal, color: '#000', borderColor: C.signal } : { background: 'transparent', color: onDark ? '#fff' : C.ink, borderColor: onDark ? '#fff' : C.ink });
  }
  function button(label, { size = 24 } = {}) {
    return css(el('div', 'button atlas', null, label), { fontSize: X2(size) + 'px' });
  }
  function skeleton(w, lines, { gap = 26, tone = 'rgba(0,97,68,0.18)' } = {}) {
    const s = css(el('div', 'skeleton', null), { width: X2(w) + 'px' });
    const r = M.mulberry32(Math.round(w * 13 + lines));
    for (let i = 0; i < lines; i++) css(el('i', null, s), { width: 55 + r() * 45 + '%', background: tone, marginTop: X2(i ? gap / 2 : 0) + 'px' });
    return s;
  }
  function photoMask(src, { w, h, radius = 28 }) {
    const box = css(el('div', 'photo', null), { width: X2(w) + 'px', height: X2(h) + 'px', borderRadius: X2(radius) + 'px' });
    const img = el('img', null, box); img.src = src;
    imgs.push(img);
    return box;
  }
  const imgs = [];

  // ---- shots
  const SHOTS = [];
  window.SHOT = (def) => SHOTS.push(def);

  window.E = { P, W, H, C, B, bar, el, css, plane, place, show, setCamera, cameraAt, optics, panel, heading, ui, row, pill, pillState, button, skeleton, photoMask, imgs, SHOTS, depthOf, get cam() { return cam; } };
})();
