// Loop earplugs, 30 s — v3: the shop's own photos in 2.5D. Each cutout is a card in a 3D space; a depth map derived from
// its silhouette (tools/prep_cutouts.py) lets a shader turn it a few degrees with real volume. Close-ups use the shop's
// 3D scene renders. Pure function of t. Shots are cut only at the times in CUTS, and every shot lasts at least MIN_SHOT.
import * as THREE from 'three';

const { B, line, rise, figure, el, css, show } = E;
const { range, lerp, clamp, ease } = M;
const W = 1920, H = 1080, D = Math.PI / 180;
const spring = (t, t0, f = 2.2, d = 0.6) => M.spring(t - t0, f, d);
const io = ease.inOutCubic, out = ease.outCubic, expo = ease.outExpo;
const seg = (t, a, b, f = io) => f(range(t, a, b));
const mix3 = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const float = (t, seed, a = 0.035) => M.noise1(seed, t * 0.6) * a; // slow, weightless drift

// ---- renderer: colours pass straight through (the photos are already graded)
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
renderer.domElement.id = 'gl';
document.getElementById('stage').prepend(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#050505');
const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 200);
function cam(pos, look, fov = 30, shift = 0) {
  camera.fov = fov; camera.position.set(...pos); camera.up.set(0, 1, 0); camera.lookAt(...look);
  if (shift) camera.setViewOffset(W, H, -shift, 0, W, H); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

// ---- 2.5D card shader: inverse parallax on the depth map. yaw/pitch in radians; the card also turns half as much in 3D.
const loader = new THREE.TextureLoader();
const loads = [];
function tex(url) {
  const t = new THREE.Texture(); t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 8;
  loads.push(new Promise((ok, ko) => { const img = new Image(); img.onload = () => { t.image = img; t.needsUpdate = true; ok(); }; img.onerror = () => ko(new Error('missing ' + url)); img.src = url; }));
  return t;
}
const VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = `
  uniform sampler2D map, depthMap; uniform float yaw, pitch, opacity, bright, useDepth;
  varying vec2 vUv;
  void main() {
    vec2 v = vec2(sin(yaw), -sin(pitch)) * 0.085 * useDepth;
    vec2 uv = vUv;
    for (int i = 0; i < 12; i++) { float d = texture2D(depthMap, uv).r; uv = vUv + v * (d - 0.4); }
    vec4 c = texture2D(map, uv);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) c.a = 0.0;
    gl_FragColor = vec4(c.rgb * bright, c.a * opacity);
  }`;
const all = [];
const FLAT = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); FLAT.needsUpdate = true;
function card(name, { scene: isScene = false } = {}) {
  const map = tex(isScene ? `assets/scene/${name}.webp` : `assets/cut/${name}.webp`);
  const depthMap = isScene ? FLAT : tex(`assets/depth/${name}.png`);
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
    uniforms: { map: { value: map }, depthMap: { value: depthMap }, yaw: { value: 0 }, pitch: { value: 0 }, opacity: { value: 1 }, bright: { value: 1 }, useDepth: { value: isScene ? 0 : 1 } } });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.userData = { map, mat };
  scene.add(mesh); all.push(mesh);
  return mesh;
}
// h = card height in world units; yaw/pitch in degrees (the turn the photo shows); order = draw order (higher in front)
function pose(c, { x = 0, y = 0, z = 0, h = 2.4, yaw = 0, pitch = 0, roll = 0, bright = 1, opacity = 1, on = true, order = 0 } = {}) {
  const img = c.userData.map.image, aspect = img && img.width ? img.width / img.height : 1;
  c.visible = on && opacity > 0.001 && h > 0.001;
  c.position.set(x, y, z); c.scale.set(h * aspect, h, 1);
  c.rotation.set(pitch * 0.5 * D, yaw * 0.5 * D, roll * D, 'YXZ');
  const u = c.userData.mat.uniforms;
  u.yaw.value = clamp(yaw, -16, 16) * D; u.pitch.value = clamp(pitch, -12, 12) * D; u.bright.value = bright; u.opacity.value = opacity;
  c.renderOrder = order;
}
// a full-frame backdrop (the shop's 3D scene renders), framed by its own push and drift
function backdrop(c, t0, t1, t, { s0 = 1.15, s1 = 1.35, x0 = 0, x1 = 0, y0 = 0, y1 = 0 } = {}) {
  const u = io(range(t, t0, t1)), z = -10, visH = 2 * Math.tan(15 * D) * 20, visW = visH * W / H; // camera at z 10, card at z -10
  const img = c.userData.map.image, aspect = img && img.width ? img.width / img.height : 1;
  cam([0, 0, 10], [0, 0, 0], 30);
  pose(c, { x: lerp(x0, x1, u), y: lerp(y0, y1, u), z, h: Math.max(visH, visW / aspect) * lerp(s0, s1, u) });
}

const C = (n) => card(n), S = (n) => card(n, { scene: true });
const P = {
  macroBlack: S('experience2-black-dark'), macroGold: S('experience2-gold-dark'), macroViolet: S('quiet2-violet-scene'),
  sw: C('switch2-emerald'), swB: C('switch2-black'), swG: C('switch2-gold'), swS: C('switch2-silver'),
  ex: C('experience2-gold'),
  qV: C('quiet2-violet'), qM: C('quiet2-mint'), qW: C('quiet2-white'),
  dr: C('dream-lilac'),
  enR: C('engage2-rose'), enD: C('engage2-dusk'),
  kB: C('kids2-berryblue'), kO: C('kids2-oceanorange'), kW: C('kids2-watermelon'),
};
const WHEEL = [
  ['switch2-emerald', 'Switch 2'], ['experience2-gold', 'Experience 2'], ['experience2plus-rosegold', 'Experience 2 Plus'], ['quiet2-violet', 'Quiet 2'],
  ['dream-lilac', 'Dream'], ['engage2-dusk', 'Engage 2'], ['engage2plus-rose', 'Engage 2 Plus'], ['kids2-oceanorange', 'Engage Kids 2'],
].map(([n, label]) => ({ c: C(n), label }));

// ---- type
const LABEL = { size: 72, weight: 400, color: 'rgba(255,255,255,0.62)' };
const HEAD = { size: 132, weight: 600 };
const T = {
  hook1: line('A Loop earplug', { ...HEAD, y: 350 }), hook2: line('for every situation.', { ...HEAD, y: 500 }),
  swName: line('Loop Switch 2', { ...LABEL, y: 250 }),
  modes: ['Engage.', 'Experience.', 'Quiet.'].map((w) => line(w, { ...HEAD, size: 170, y: 340 })),
  swSub: line('Three modes. One dial.', { ...LABEL, size: 56, y: 560 }),
  exName: line('Loop Experience 2', { ...LABEL, y: 250 }), exHead: line('Live music.', { ...HEAD, y: 340 }), exFig: figure({ y: 550 }),
  qName: line('Loop Quiet 2', { ...LABEL, y: 250 }), q1: line('Focus.', { ...HEAD, y: 340 }), q2: line('Travel.', { ...HEAD, y: 490 }), qFig: figure({ y: 700 }),
  drName: line('Loop Dream', { ...LABEL, y: 250 }), drHead: line('Sleep.', { ...HEAD, y: 340 }), drFig: figure({ y: 550 }),
  enName: line('Loop Engage 2', { ...LABEL, y: 250 }), en1: line('Speech', { ...HEAD, y: 340 }), en2: line('stays clear.', { ...HEAD, y: 490 }), enFig: figure({ y: 700 }),
  kName: line('Loop Engage Kids 2', { ...LABEL, y: 250 }), k1: line('Big protection', { ...HEAD, y: 340 }), k2: line('for small ears.', { ...HEAD, y: 490 }),
  range: line('Eight Loops. One for every moment.', { size: 64, weight: 600, y: 830, cls: 'center' }),
  tag: line('Experience life at your volume.', { size: 56, weight: 400, color: 'rgba(255,255,255,0.7)', y: 640, cls: 'center' }),
};
const logo = el('div', 'logo', null, window.LOOP_WORDMARK);
const hideType = () => { for (const k in T) (Array.isArray(T[k]) ? T[k] : [T[k]]).forEach((l) => l.set(0, 1, false)); };
const leave = (t, b) => range(t, b - 0.3, b);
const HERO = { z: 0, h: 3.0 }; // a product card on the stage, camera at z 8.5 with the frame shifted right of the type
const stage = (t, a, b, k = 1) => cam(mix3([0, 0.05, 8.6], [0, 0.02, 8.6 - 0.6 * k], range(t, a, b)), [0, 0, 0], 30, 430);
// a slow turn: the photo turns from -a to +a degrees over the shot (the 2.5D range is about ±16°)
const turn = (t, a, b, amp = 14, off = 0) => off + lerp(-amp, amp, io(range(t, a, b)));

// ---- shots: cut points (beat indices). Inside a shot the camera may move, but never cuts.
const CUTS = [0, 4, 11, 20, 23, 30, 35, 38, 44, 51, 56, 70];
const SHOTS = {
  // S01a macro: the shop's own render of the Experience 2, pulled back slowly
  0: (t, a, b) => { backdrop(P.macroBlack, a, b, t, { s0: 1.9, s1: 1.45, x0: -0.6, x1: -0.2 }); },
  // S01b the promise: Switch 2 in silhouette on the downbeat, lit two beats later, turning
  4: (t, a, b) => {
    stage(t, a, b);
    const lit = seg(t, B(6) - 0.1, B(7));
    pose(P.sw, { ...HERO, x: 0.35, y: float(t, 1), yaw: turn(t, a, b, 14), bright: lerp(0.06, 1, lit) });
    T.hook1.set(rise(t, B(4)), leave(t, b)); T.hook2.set(rise(t, B(6)), leave(t, b));
  },
  // S02 Switch 2: one continuous push from the pair into the dial while the modes change, then back out to the four finishes
  11: (t, a, b) => {
    const pushIn = seg(t, a, B(12), expo), pullOut = seg(t, B(17) - 0.1, B(18) + 0.2, io);
    const close = pushIn * (1 - pullOut);
    // the mode switch: the ring of the right-hand earplug and its lever, measured on the cutout at (0.68, 0.57) of the card
    const w = 3.0 * 1246 / 1412, dial = [0.1 + (0.68 - 0.5) * w, (0.5 - 0.57) * 3.0, 0];
    cam(mix3([0, 0.05, 8.6], [dial[0] - 0.25, dial[1], 2.7], close), mix3([0, 0, 0], [dial[0] - 0.25, dial[1], 0], close), 30, lerp(430, 330, close));
    const form = seg(t, B(18) - 0.1, B(19) + 0.1, expo);
    pose(P.sw, { x: lerp(0.1, -1.55, form), y: float(t, 2), h: lerp(3.0, 1.55, form), yaw: turn(t, a, b, 12) });
    [P.swB, P.swG, P.swS].forEach((c, i) => {
      const k = seg(t, B(18) - 0.1 + i * 0.07, B(19) + 0.1 + i * 0.07, expo);
      pose(c, { on: t >= B(18) - 0.1 + i * 0.07, x: -0.45 + i * 1.1, y: float(t, 10 + i), z: lerp(-12, 0, k), h: 1.55, yaw: turn(t, a, b, 12, i * 3) });
    });
    const MB = [12, 14, 16];
    T.swName.set(rise(t, a + 0.02), leave(t, b));
    T.modes.forEach((m, i) => { const tin = B(MB[i]), tout = i < 2 ? B(MB[i + 1]) : b; m.set(rise(t, tin, 0.3), range(t, tout - 0.16, tout - 0.02)); });
    T.swSub.set(rise(t, B(17)), leave(t, b));
  },
  // S03a match cut: the gold ring in the shop's render, pushing in
  20: (t, a, b) => { backdrop(P.macroGold, a, b, t, { s0: 1.35, s1: 1.7, x0: 0.3, x1: 0.5 }); },
  // S03b Experience 2: live music, the crowd drops 17 dB on the seat (B24)
  23: (t, a, b) => {
    stage(t, a, b);
    const seat = spring(t, B(24), 2.8, 0.45);
    pose(P.ex, { ...HERO, x: 0.35, y: float(t, 3), yaw: turn(t, a, b, 14) + (t >= B(24) ? (1 - seat) * 8 : 0) });
    T.exName.set(rise(t, a + 0.02), leave(t, b)); T.exHead.set(rise(t, a), leave(t, b)); T.exFig.set(t, B(24), 17, { out: leave(t, b) });
  },
  // S04a Quiet 2: three finishes at different depths, the camera drifts so they slide past each other (parallax)
  30: (t, a, b) => {
    const k = range(t, a, b), fwd = seg(t, B(32) - 0.15, B(32) + 0.35, expo);
    cam(mix3([0.6, 0.2, 9.2], [-0.2, 0.05, 8.2], k), [0, 0, 0], 30, 430);
    pose(P.qW, { x: 1.2, y: -1.3 + float(t, 6), z: -6, h: 2.4, yaw: turn(t, a, b, 10, 4), order: 0 });
    pose(P.qM, { x: 1.55, y: 1.05 + float(t, 5), z: -3, h: 2.3, yaw: turn(t, a, b, 12, -4), order: 1 });
    pose(P.qV, { x: lerp(0.6, 0.0, fwd), y: -0.1 + float(t, 4), z: lerp(-1.6, 0.4, fwd), h: 2.8, yaw: turn(t, a, b, 14), order: 2 });
    T.qName.set(rise(t, a + 0.02), leave(t, b)); T.q1.set(rise(t, a), leave(t, b)); T.q2.set(rise(t, B(31)), leave(t, b));
    T.qFig.set(t, B(32), 24, { out: leave(t, b) });
  },
  // S04b the shop's violet render: a slow lateral glide
  35: (t, a, b) => { backdrop(P.macroViolet, a, b, t, { s0: 1.3, s1: 1.45, x0: 0.5, x1: -0.5 }); },
  // S05 Dream: night (dimmed), a slow turn, 27 dB
  38: (t, a, b) => {
    stage(t, a, b);
    const seat = spring(t, B(40), 2.4, 0.5);
    pose(P.dr, { ...HERO, h: 2.8, x: 0.35, y: float(t, 7), yaw: turn(t, a, b, 14) + (t >= B(40) ? (1 - seat) * 6 : 0), bright: 0.92 });
    T.drName.set(rise(t, a + 0.02), leave(t, b)); T.drHead.set(rise(t, a), leave(t, b)); T.drFig.set(t, B(40), 27, { out: leave(t, b) });
  },
  // S06 Engage 2: two finishes trade places in depth, like a conversation; 16 dB
  44: (t, a, b) => {
    stage(t, a, b);
    const sw = io(range(t, a, b)), ang = lerp(-40, 140, sw) * D;
    const r = { x: 0.2 + Math.cos(ang) * 0.55, z: Math.sin(ang) * 1.2 };
    pose(P.enR, { x: r.x, z: r.z, y: 0.15 + float(t, 8), h: 2.5, yaw: turn(t, a, b, 14), order: r.z > 0 ? 2 : 1 });
    pose(P.enD, { x: 0.4 - (r.x - 0.2), z: -r.z, y: -0.15 + float(t, 9), h: 2.5, yaw: turn(t, a, b, -14), order: r.z > 0 ? 1 : 2 });
    T.enName.set(rise(t, a + 0.02), leave(t, b)); T.en1.set(rise(t, a), leave(t, b)); T.en2.set(rise(t, B(45)), leave(t, b));
    T.enFig.set(t, B(46), 16, { out: leave(t, b) });
  },
  // S07 Engage Kids 2: three colours pop in, one per beat, in a diagonal
  51: (t, a, b) => {
    stage(t, a, b);
    [[P.kB, a, [0.6, 0.85, -1.4]], [P.kO, B(53), [-0.35, -0.4, 0]], [P.kW, B(54), [0.75, -0.7, 0.9]]].forEach(([c, t0, [x, y, z]], i) => {
      const pop = spring(t, t0, 2.6, 0.45);
      pose(c, { on: t >= t0, x, y: y + float(t, 20 + i), z, h: 1.9 * clamp(pop, 0, 1.2), yaw: lerp(-16, 10, expo(range(t, t0, t0 + 1.2))), order: i });
    });
    T.kName.set(rise(t, a + 0.02), leave(t, b)); T.k1.set(rise(t, a), leave(t, b)); T.k2.set(rise(t, B(52)), leave(t, b));
  },
  // S08 the range: a carousel turning in depth, one stop per beat, then a row with one line
  56: (t, a, b) => {
    let pos = 0;
    for (let i = 0; i < 8; i++) if (t >= B(57 + i) - 0.12) pos = i + (expo(range(t, B(57 + i) - 0.12, B(57 + i) + 0.22)) - 1);
    if (t < B(57) - 0.12) pos = lerp(-1.4, -1, range(t, a, B(57) - 0.12));
    const row = seg(t, B(65) - 0.1, B(66), io);
    cam(mix3([0, 1.1, 8.2], [0, 0.2, 10.5], row), mix3([0, -0.1, -2.5], [0, 0.1, 0], row), 30);
    WHEEL.forEach(({ c }, i) => {
      const th = ((i - pos) / 8) * Math.PI * 2;
      const wx = Math.sin(th) * 3.3, wz = (Math.cos(th) - 1) * 6.5, depth = (Math.cos(th) + 1) / 2;
      pose(c, { x: lerp(wx, (i - 3.5) * 1.12, row), z: lerp(wz, 0, row), y: lerp(0, 0.35, row) + float(t, 30 + i, 0.03),
        h: lerp(2.2, 1.35, row), yaw: lerp(-Math.sin(th) * 16, 0, row) + lerp(0, turn(t, B(66), b, 10, i * 2), row),
        bright: lerp(0.35 + 0.65 * depth, 1, row), order: Math.round(lerp(depth * 10, 5, row)) });
    });
    T.range.set(rise(t, B(66)), leave(t, b));
  },
  // S09 logo on the hat drop (B71), then the site's own line
  70: (t) => { cam([0, 0, 8], [0, 0, 0], 30); T.tag.set(rise(t, B(73)), 0); },
};

// The edit's own rule: no shot shorter than MIN_SHOT (the 5 s flash of v2 came from a 0.13 s shot). Fails the render if broken.
const MIN_SHOT = 1.0;
const tEnd = (window.FILM && window.FILM.duration) || 30;
CUTS.forEach((c, i) => { const len = (i + 1 < CUTS.length ? B(CUTS[i + 1]) : tEnd) - B(c); if (len < MIN_SHOT) throw new Error(`shot at beat ${c} lasts ${len.toFixed(2)} s < ${MIN_SHOT} s`); });

window.ready = (async () => {
  await document.fonts.load('600 100px Display'); await document.fonts.load('400 100px Display');
  await Promise.all(loads);
  // upload every texture once so the first frame of each shot is not a blank
  for (const c of all) renderer.initTexture(c.userData.map);
})();

window.seek = (t) => {
  for (const c of all) c.visible = false;
  hideType();
  let i = CUTS.length - 1; while (i > 0 && t < B(CUTS[i])) i--;
  const a = B(CUTS[i]), b = i + 1 < CUTS.length ? B(CUTS[i + 1]) : tEnd;
  SHOTS[CUTS[i]](t, a, b);
  const land = spring(t, B(71), 2.2, 0.6);
  show(logo, t >= B(71) - 0.02);
  css(logo, { transform: `translate(-50%,-50%) scale(${(1.06 - 0.06 * land).toFixed(4)})`, clipPath: `inset(0 ${((1 - expo(range(t, B(71) - 0.02, B(71) + 0.35))) * 100).toFixed(2)}% 0 0)` });
  renderer.render(scene, camera);
};
