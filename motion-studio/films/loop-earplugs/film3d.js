// Loop earplugs, 30 s: the products move in space like an Apple product film — macro glides, 360° turns, fly-throughs,
// formations — on a black stage. Pure function of t: every frame sets every object, camera and light, then renders once.
// Times are beat indices into beats.json (157 BPM); see docs/shotlist.md.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { earplug } from './loop3d.js';

const { B, line, rise, figure, el, css, show } = E;
const { range, lerp, clamp, ease } = M;
const W = 1920, H = 1080;
const D = Math.PI / 180;
const spring = (t, t0, f = 2.2, d = 0.6) => M.spring(t - t0, f, d);
const io = ease.inOutCubic, out = ease.outCubic, expo = ease.outExpo;
const seg = (t, a, b, f = io) => f(range(t, a, b));

// ---- renderer, stage, light
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.id = 'gl';
document.getElementById('stage').prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#050505');
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const key = new THREE.DirectionalLight('#ffffff', 2); scene.add(key);
const rim = new THREE.DirectionalLight('#ffffff', 2); scene.add(rim);
const kick = new THREE.DirectionalLight('#ffffff', 0); scene.add(kick);
// light rig: positions on a sphere around the product (degrees), so a shot can swing the key across the surfaces
function lights({ env = 1, keyI = 2.2, keyAz = -40, keyEl = 35, rimI = 2.2, rimC = '#ffffff', rimAz = 150, kickI = 0, kickC = '#ffffff', kickAz = 90, exposure = 1 }) {
  scene.environmentIntensity = env;
  const at = (l, az, elv, r = 10) => l.position.set(Math.sin(az * D) * Math.cos(elv * D) * r, Math.sin(elv * D) * r, Math.cos(az * D) * Math.cos(elv * D) * r);
  key.intensity = keyI; at(key, keyAz, keyEl);
  rim.intensity = rimI; rim.color.set(rimC); at(rim, rimAz, 25);
  kick.intensity = kickI; kick.color.set(kickC); at(kick, kickAz, -10);
  renderer.toneMappingExposure = exposure;
}

// ---- camera: position, look-at, lens; `shift` slides the frame (px) so the product sits right of the type column
const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 200);
function cam(pos, look, fov = 30, shift = 0, roll = 0) {
  camera.fov = fov; camera.position.set(...pos); camera.up.set(Math.sin(roll * D), Math.cos(roll * D), 0); camera.lookAt(...look);
  if (shift) camera.setViewOffset(W, H, -shift, 0, W, H); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
const mix3 = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));

// ---- products: a pivot at the visual centre of each earplug, so turns happen around the middle of the "9"
const all = [];
function plug(name) {
  const pivot = new THREE.Group(), e = earplug(name);
  e.position.y = -0.5; pivot.add(e); scene.add(pivot);
  pivot.userData = { e, dial: e.getObjectByName('dial') };
  all.push(pivot);
  return pivot;
}
function pose(p, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, on = true } = {}) {
  p.visible = on && s > 0.001;
  p.position.set(x, y, z); p.rotation.set(rx * D, ry * D, rz * D, 'YXZ'); p.scale.setScalar(Math.max(s, 0.001));
}
const float = (t, seed, a = 0.04) => M.noise1(seed, t * 0.6) * a; // a slow, weightless drift

const P = {
  sw: plug('switch2-emerald'), swB: plug('switch2-black'), swG: plug('switch2-gold'), swS: plug('switch2-silver'),
  ex: plug('experience2-gold'),
  qV: plug('quiet2-violet'), qM: plug('quiet2-mint'), qW: plug('quiet2-white'),
  dr: plug('dream-lilac'),
  enR: plug('engage2-rose'), enD: plug('engage2-dusk'),
  kB: plug('kids2-berryblue'), kO: plug('kids2-oceanorange'), kW: plug('kids2-watermelon'),
};
const WHEEL = [
  ['switch2-emerald', 'Switch 2'], ['experience2-gold', 'Experience 2'], ['experience2-rosegold', 'Experience 2 Plus'], ['quiet2-violet', 'Quiet 2'],
  ['dream-lilac', 'Dream'], ['engage2-dusk', 'Engage 2'], ['engage2-rose', 'Engage 2 Plus'], ['kids2-oceanorange', 'Engage Kids 2'],
].map(([n, label]) => ({ p: plug(n), label }));

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
  names: WHEEL.map(({ label }) => line(label, { size: 96, weight: 600, y: 900, cls: 'center' })),
  tag: line('Experience life at your volume.', { size: 56, weight: 400, color: 'rgba(255,255,255,0.7)', y: 640, cls: 'center' }),
};
const logo = el('div', 'logo', null, window.LOOP_WORDMARK);
// every line is owned by one shot; a shot calls these with its own timing, the rest are hidden each frame
const hideType = () => { for (const k in T) (Array.isArray(T[k]) ? T[k] : [T[k]]).forEach((l) => (l.set ? l.set(0, 1, false) : 0)); };
const leave = (t, b) => range(t, b - 0.3, b); // lines leave upwards over the last 0.3 s of their shot

// ---- shots: [from beat, to beat, draw(t, a, b)]
const SHOTS = [
  // S01 hook. Macro glide along the emerald ring while the key light swings across it, then the pull-back reveal.
  [0, 11, (t, a, b) => {
    const m = t < B(4);
    if (m) {
      const u = range(t, 0, B(4));
      pose(P.sw, { ry: lerp(-58, -38, u), rx: 8, rz: -6 });
      cam(mix3([-0.62, -0.95, 1.05], [-0.28, -0.7, 1.35], io(u)), mix3([-0.5, -0.62, 0], [-0.3, -0.55, 0], u), lerp(20, 24, u));
      lights({ env: 0.5, keyI: 3, keyAz: lerp(-120, 20, u), keyEl: 30, rimI: 2.4, rimC: '#9fe7cf', rimAz: 160 });
    } else {
      const u = range(t, B(4), b), lit = seg(t, B(6) - 0.1, B(7));
      pose(P.sw, { x: 0.45, ry: lerp(-70, 30, out(u)), rx: 6, y: float(t, 1), rz: -4 });
      cam(mix3([0, 0.15, 8.2], [0, 0.1, 7.4], u), [0, 0, 0], 30, 430);
      // silhouette on the downbeat: rim only; the key and the room come up two beats later
      lights({ env: lerp(0.02, 1, lit), keyI: lerp(0, 2.4, lit), keyAz: -45, rimI: 3.2, rimC: '#bff5e3', rimAz: 155, exposure: 1 });
    }
    T.hook1.set(rise(t, B(4)), leave(t, b), !m); T.hook2.set(rise(t, B(6)), leave(t, b), !m);
  }],

  // S02 Switch 2. A macro cut on the dial per mode (it clicks round), a full 360° turn, then the four finishes take formation.
  [11, 20, (t, a, b) => {
    const MB = [12, 14, 16];
    let mi = -1; MB.forEach((bi, i) => { if (t >= B(bi) - 0.04) mi = i; });
    const dialTurn = MB.reduce((acc, bi) => acc + 40 * clamp(spring(t, B(bi), 3, 0.5), 0, 1.3), 0);
    if (P.sw.userData.dial) P.sw.userData.dial.rotation.z = -dialTurn * D;
    const macro = mi >= 0 && t < B(MB[mi]) + 0.62 && t < B(17);
    const spin = seg(t, B(17) - 0.2, B(20), ease.inOutCubic);
    const form = seg(t, B(18) - 0.1, B(19) + 0.1, expo);
    if (macro) {
      // three different macro angles on the dial, each drifting
      const v = [[[0.9, -0.2, 2.3], [0.1, -0.5, 0], 26], [[-0.9, -1.0, 2.2], [-0.05, -0.5, 0], 26], [[0.25, -0.35, 2.0], [0.05, -0.5, 0], 30]][mi];
      const u = range(t, B(MB[mi]), B(MB[mi]) + 0.62);
      pose(P.sw, { ry: 0, rx: 0 });
      cam(mix3(v[0], v[0].map((c, i) => c * (i === 2 ? 0.92 : 1)), u), v[1], v[2]);
      lights({ env: 0.8, keyI: 2.6, keyAz: lerp(-60, -10, u), rimI: 2, rimC: '#9fe7cf' });
    } else {
      pose(P.sw, { x: lerp(0.3, -1.35, form), ry: -25 + 360 * spin, rx: 6, y: float(t, 2), s: lerp(1, 0.5, form) });
      cam([0, 0.1, lerp(7.6, 8, form)], [0, 0, 0], 30, 420);
      lights({ env: 1, keyI: 2.4, keyAz: -45, rimI: 2.6, rimC: '#bff5e3', rimAz: 150 });
    }
    // the other finishes arrive from deep space into a row, already turning
    [P.swB, P.swG, P.swS].forEach((p, i) => {
      const k = seg(t, B(18) - 0.1 + i * 0.07, B(19) + 0.1 + i * 0.07, expo);
      pose(p, { on: !macro && t >= B(18) - 0.1 + i * 0.07, x: -0.4 + i * 0.95, z: lerp(-14, 0, k), y: float(t, 10 + i), ry: -25 + 360 * spin + i * 12, rx: 6, s: 0.5 });
    });
    T.swName.set(rise(t, a + 0.02), leave(t, b), !macro);
    T.modes.forEach((m, i) => { const tin = B(MB[i]), tout = i < 2 ? B(MB[i + 1]) : b; m.set(rise(t, tin, 0.3), range(t, tout - 0.16, tout - 0.02)); });
    T.swSub.set(rise(t, B(17)), leave(t, b));
  }],

  // S03 Experience 2. The gold ring flies out of the lens (match cut on the ring), turns; seats on B24; macro on the ear tip.
  [20, 30, (t, a, b) => {
    const fly = seg(t, a, B(22), expo);
    const tipMacro = t >= B(27) && t < B(28) + 0.2;
    const seat = spring(t, B(24), 2.8, 0.45);
    if (tipMacro) {
      const u = range(t, B(27), B(28) + 0.2);
      pose(P.ex, { ry: lerp(150, 175, u), rx: 10 });
      cam(mix3([-0.9, 1.5, -2.2], [-0.6, 1.3, -1.9], u), [-0.3, 0.95, -0.6], 26);
      lights({ env: 0.9, keyI: 2.6, keyAz: lerp(160, 210, u), keyEl: 40, rimI: 2.5, rimC: '#ffe2a8', rimAz: -20 });
    } else {
      // starts with the ring's hole around the lens and pulls back to the hero position
      pose(P.ex, { x: lerp(0, 0.3, fly), z: lerp(6.4, 0, fly), y: lerp(0.55, 0, fly) + float(t, 3), ry: lerp(0, -35, fly) + 70 * range(t, B(22), b) + (t >= B(24) ? (1 - seat) * 25 : 0), rx: 5 });
      cam([0, 0.1, 7.6], [0, 0, 0], 30, lerp(0, 430, fly));
      lights({ env: 1, keyI: 2.6, keyAz: lerp(-70, -30, range(t, a, b)), rimI: 2.6, rimC: '#ffd98a', rimAz: 150 });
    }
    T.exName.set(rise(t, B(22)), leave(t, b), !tipMacro); T.exHead.set(rise(t, B(22)), leave(t, b), !tipMacro);
    T.exFig.set(t, B(24), 17, { on: !tipMacro, out: leave(t, b) });
  }],

  // S04 Quiet 2. Three finishes float at different depths; violet comes forward on the seat; a macro glide over the matte skin.
  [30, 38, (t, a, b) => {
    const k = range(t, a, b), fwd = seg(t, B(32) - 0.15, B(32) + 0.3, expo);
    const macro = t >= B(35);
    pose(P.qV, { x: lerp(0.6, 0, fwd), z: lerp(-1.5, 0.3, fwd), y: float(t, 4), ry: -40 + 80 * k, rx: 8 });
    pose(P.qM, { on: !macro, x: 2.3, z: -3.5, y: 1.0 + float(t, 5), ry: 30 + 60 * k, rx: -6 });
    pose(P.qW, { on: !macro, x: 2.6, z: -6, y: -1.3 + float(t, 6), ry: 120 - 70 * k, rx: 10 });
    if (macro) {
      const u = range(t, B(35), b);
      cam(mix3([1.6, 0.2, 2.6], [0.9, -0.6, 2.9], io(u)), mix3([0.2, -0.3, 0], [0.0, -0.5, 0], u), 28);
      lights({ env: 0.8, keyI: 2.4, keyAz: lerp(-20, 50, u), rimI: 2.4, rimC: '#c9b8ff' });
    } else {
      cam(mix3([0.3, 0.3, 8.6], [0, 0.1, 7.8], k), [0, 0, 0], 30, 430);
      lights({ env: 1, keyI: 2.2, keyAz: -40, rimI: 2.6, rimC: '#c9b8ff', rimAz: 150 });
    }
    T.qName.set(rise(t, a + 0.02), leave(t, B(35)), !macro); T.q1.set(rise(t, a), leave(t, B(35)), !macro); T.q2.set(rise(t, B(31)), leave(t, B(35)), !macro);
    T.qFig.set(t, B(32), 24, { on: !macro, out: leave(t, B(35)) });
  }],

  // S05 Dream. Night: a cold moon rim, a low warm key; the bean turns slowly; 27 dB on the seat.
  [38, 44, (t, a, b) => {
    const k = range(t, a, b), seat = spring(t, B(40), 2.4, 0.5);
    pose(P.dr, { ry: lerp(-60, 40, io(k)) + (t >= B(40) ? (1 - seat) * 15 : 0), rx: 6, y: float(t, 7) });
    cam(mix3([0, 0.2, 7.8], [0, 0.1, 6.8], k), [0, 0, 0], 30, 430);
    lights({ env: 0.35, keyI: 1.2, keyAz: -60, keyEl: 20, rimI: 3.4, rimC: '#7f9cff', rimAz: 160, kickI: 0.8, kickC: '#ffcf9e', exposure: 0.95 });
    T.drName.set(rise(t, a + 0.02), leave(t, b)); T.drHead.set(rise(t, a), leave(t, b)); T.drFig.set(t, B(40), 27, { out: leave(t, b) });
  }],

  // S06 Engage 2. Two finishes revolve around each other like a conversation; the room drops 16 dB, the voice stays.
  [44, 50, (t, a, b) => {
    const k = range(t, a, b), orbit = lerp(-30, 150, io(k)) * D;
    pose(P.enR, { x: Math.cos(orbit) * 1.25, z: Math.sin(orbit) * 1.25, y: 0.1 + float(t, 8), ry: -30 + 120 * k, rx: 6 });
    pose(P.enD, { x: -Math.cos(orbit) * 1.25, z: -Math.sin(orbit) * 1.25, y: -0.15 + float(t, 9), ry: 150 + 120 * k, rx: -6 });
    cam([0, 0.6, 9.2], [0.2, 0, 0], 30, 430);
    lights({ env: 1, keyI: 2.4, keyAz: -40, rimI: 2.6, rimC: '#ffc2ad', rimAz: 150 });
    T.enName.set(rise(t, a + 0.02), leave(t, b)); T.en1.set(rise(t, a), leave(t, b)); T.en2.set(rise(t, B(45)), leave(t, b));
    T.enFig.set(t, B(46), 16, { out: leave(t, b) });
  }],

  // B50: the track's own dip. Black, nothing — silence as a hit.
  [50, 51, () => { cam([0, 0, 6], [0, 0, 0], 30); lights({ env: 0, keyI: 0, rimI: 0 }); }],

  // S07 Engage Kids 2. Three colours pop into a diagonal, one per beat, each with a quick spin.
  [51, 56, (t, a, b) => {
    const k = range(t, a, b);
    [[P.kB, a, [0.9, 0.7, -1.4]], [P.kO, B(53), [0.35, -0.45, 0]], [P.kW, B(54), [1.75, -0.35, 0.6]]].forEach(([p, t0, [x, y, z]], i) => {
      const pop = spring(t, t0, 2.6, 0.45);
      pose(p, { on: t >= t0, x, y: y + float(t, 20 + i), z, s: 0.75 * pop, ry: -40 + 360 * expo(range(t, t0, t0 + 0.9)) + 20 * k, rx: 8 });
    });
    cam([0, 0.2, 8.4], [0.4, 0, 0], 30, 430);
    lights({ env: 1, keyI: 2.4, keyAz: -40, rimI: 2.4, rimC: '#bcd8ff', rimAz: 150 });
    T.kName.set(rise(t, a + 0.02), leave(t, b)); T.k1.set(rise(t, a), leave(t, b)); T.k2.set(rise(t, B(52)), leave(t, b));
  }],

  // S08 The range. Eight earplugs on a carousel turning in depth, one name per beat; then a row, all turning 360° in sync.
  [56, 70, (t, a, b) => {
    let pos = 0;
    for (let i = 0; i < 8; i++) if (t >= B(57 + i) - 0.12) pos = i + (expo(range(t, B(57 + i) - 0.12, B(57 + i) + 0.2)) - 1);
    if (t < B(57) - 0.12) pos = lerp(-1.4, -1, range(t, a, B(57) - 0.12));
    const row = seg(t, B(65) - 0.1, B(66), io), spin = seg(t, B(66), b - 0.2, io);
    WHEEL.forEach(({ p }, i) => {
      const th = ((i - pos) / 8) * Math.PI * 2;
      const wx = Math.sin(th) * 3.3, wz = (Math.cos(th) - 1) * 6.5; // a deep ellipse: the back of the wheel recedes far behind
      const rx = (i - 3.5) * 0.98;
      pose(p, { x: lerp(wx, rx, row), z: lerp(wz, 0, row), y: lerp(0.1, -0.05, row) + float(t, 30 + i, 0.03), s: lerp(0.8, 0.42, row),
        ry: lerp(-th / D * 0.6 - 20, -20, row) + 360 * spin + i * 4, rx: 6 });
    });
    cam(mix3([0, 1.3, 7.2], [0, 0.35, 9.6], row), mix3([0, -0.1, -2.5], [0, -0.05, 0], row), 30);
    lights({ env: 1, keyI: 2.4, keyAz: -40, rimI: 2.4, rimC: '#ffffff', rimAz: 160 });
    T.names.forEach((n, i) => { const tin = B(57 + i), tout = i < 7 ? B(58 + i) : B(65); n.set(rise(t, tin, 0.26), range(t, tout - 0.14, tout - 0.02)); });
  }],

  // S09 Logo. The stage empties; the wordmark lands on the hat drop (B71), then the site's own line.
  [70, 79, (t) => {
    cam([0, 0, 6], [0, 0, 0], 30); lights({ env: 0, keyI: 0, rimI: 0 });
    T.tag.set(rise(t, B(73)), 0);
  }],
];

const tEnd = (window.FILM && window.FILM.duration) || 30;
window.ready = (async () => {
  await document.fonts.load('600 100px Display'); await document.fonts.load('400 100px Display');
  renderer.compile(scene, camera);
})();

window.seek = (t) => {
  for (const p of all) { p.visible = false; if (p.userData.dial) p.userData.dial.rotation.z = 0; }
  hideType();
  let s = SHOTS.find(([fa, fb], i) => t >= B(fa) && (i === SHOTS.length - 1 ? t <= tEnd + 1 : t < B(fb)));
  if (s) s[2](t, B(s[0]), s[0] === 70 ? tEnd : B(s[1]));
  const land = spring(t, B(71), 2.2, 0.6);
  show(logo, t >= B(71) - 0.02);
  css(logo, { transform: `translate(-50%,-50%) scale(${(1.06 - 0.06 * land).toFixed(4)})`, clipPath: `inset(0 ${((1 - expo(range(t, B(71) - 0.02, B(71) + 0.35))) * 100).toFixed(2)}% 0 0)` });
  renderer.render(scene, camera);
};
