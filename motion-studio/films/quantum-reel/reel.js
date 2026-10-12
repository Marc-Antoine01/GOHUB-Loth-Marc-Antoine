// SUPERPOSITION, 30 s: a quantum computing reel (docs/shotlist.md). Pure function of t: window.seek(t) poses the world,
// the cameras and the type from t alone; nothing is carried between frames.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const { range, lerp, clamp, ease, mulberry32, noise1 } = M;
const W = 1920, H = 1080, D = Math.PI / 180, TAU = Math.PI * 2;
const BEATS = (window.BEATS && window.BEATS.beats) || [];
const Bi = (i) => (i <= 0 ? 0 : BEATS[i] ?? i * 0.5);
// B(x): beat x of the measured grid; a fractional x interpolates between its two beats (B(15.5) is the 8th note after 15).
const B = (x) => { const i = Math.floor(x); return x === i ? Bi(i) : lerp(Bi(i), Bi(i + 1), x - i); };
const Bf = B;
const io = ease.inOutCubic, oc = ease.outCubic, ox = ease.outExpo, ix = ease.inExpo;
const seg = (t, a, b, f = io) => f(range(t, a, b));
const spring = (t, t0, f = 2.2, d = 0.5) => M.spring(t - t0, f, d);
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix3 = (a, b, u) => a.clone().lerp(b, u);

const HEX = { void: 0x07070a, fog: 0x14141a, bone: 0xedebe6, ash: 0x8b8a86, gold: 0xe8b04b };
const COL = Object.fromEntries(Object.entries(HEX).map(([k, v]) => [k, new THREE.Color(v)]));

// ---------------------------------------------------------------- renderer, world, post
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.id = 'gl';
document.getElementById('stage').prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = COL.void.clone();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.9;
scene.fog = new THREE.FogExp2(HEX.void, 0.02);

const camera = new THREE.PerspectiveCamera(30, W / H, 0.01, 400);
const camB = new THREE.PerspectiveCamera(30, W / 2 / H, 0.01, 400); // the right half of the split screen
// shift: a lens shift in fractions of the frame width (positive moves the subject right), so a centred subject can sit
// on a third without turning the camera.
function aim(c, pos, look, fov = 30, roll = 0, shift = 0) {
  c.fov = fov; c.position.copy(pos); c.up.set(Math.sin(roll), Math.cos(roll), 0); c.lookAt(look);
  if (Math.abs(shift) > 1e-4) c.setViewOffset(W, H, -shift * W, 0, W, H); else c.clearViewOffset();
  c.updateProjectionMatrix();
  c.updateMatrixWorld(true); // lookAt does not refresh matrixWorld: without this, projections would use the last frame's camera
}

const key = new THREE.DirectionalLight(0xfff1dc, 2.2); key.position.set(5, 9, 4); scene.add(key);
const rim = new THREE.DirectionalLight(0xdfe6ff, 1.4); rim.position.set(-6, 3, -7); scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.08));

// The world pass draws one camera, or the split screen (left: the main camera, right: camB sliding in).
class WorldPass extends Pass {
  constructor() { super(); this.needsSwap = false; this.split = 0; }
  render(r, writeBuffer, readBuffer) {
    r.setRenderTarget(readBuffer);
    r.setClearColor(HEX.void, 1); r.clear();
    if (this.split <= 0) { r.setViewport(0, 0, W, H); r.render(scene, camera); return; }
    const xr = Math.round(W - this.split * (W / 2)), lw = Math.round(lerp(W, W / 2, this.split));
    camera.aspect = lw / H; camera.updateProjectionMatrix();
    r.setScissorTest(true);
    r.setViewport(0, 0, lw, H); r.setScissor(0, 0, xr, H); r.render(scene, camera);
    r.setViewport(W / 2, 0, W / 2, H); r.setScissor(xr, 0, W - xr, H); r.render(scene, camB);
    r.setScissorTest(false); r.setViewport(0, 0, W, H);
    camera.aspect = W / H; camera.updateProjectionMatrix();
  }
}
const target = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, target);
composer.setPixelRatio(1); composer.setSize(W, H);
const world = new WorldPass();
composer.addPass(world);
// Before the bloom: any NaN goes to black and highlights are capped, so a stray specular can never flare the whole frame.
composer.addPass(new ShaderPass({
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c.rgb)) || any(isinf(c.rgb))) c.rgb = vec3(0.0); gl_FragColor = vec4(min(c.rgb, vec3(2.6)), 1.0); }',
}));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.65, 0.55, 1.8); // only emissive gold (×4 and up) crosses the threshold, not reflections
composer.addPass(bloom);
composer.addPass(new OutputPass());
// Finish: whip-pan blur (directional, only during whips), a hair of chromatic aberration at the edges, vignette, seeded grain.
const finish = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uBlur: { value: new THREE.Vector2() }, uTaps: { value: 1 }, uSeed: { value: 0 }, uGrain: { value: 0.045 }, uVig: { value: 0.38 }, uAb: { value: 0.0035 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uBlur; uniform int uTaps; uniform float uSeed, uGrain, uVig, uAb; varying vec2 vUv;
    float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031 + uSeed * 0.0137); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main() {
      vec2 d = vUv - 0.5; float r2 = dot(d, d);
      vec3 c = vec3(0.0); float n = 0.0;
      for (int i = 0; i < 24; i++) {
        if (i >= uTaps) break;
        float k = uTaps > 1 ? float(i) / float(uTaps - 1) - 0.5 : 0.0;
        vec2 uv = vUv + uBlur * k;
        c += vec3(texture2D(tDiffuse, uv + d * uAb * r2 * 4.0).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - d * uAb * r2 * 4.0).b);
        n += 1.0;
      }
      c /= n;
      c *= 1.0 - uVig * smoothstep(0.15, 0.75, r2 * 2.0);
      c += (hash(gl_FragCoord.xy) - 0.5) * uGrain;
      gl_FragColor = vec4(c, 1.0);
    }`,
});
composer.addPass(finish);

// ---------------------------------------------------------------- materials
const gold = new THREE.MeshStandardMaterial({ color: HEX.gold, metalness: 1, roughness: 0.26, envMapIntensity: 1.25 });
const goldRough = new THREE.MeshStandardMaterial({ color: HEX.gold, metalness: 1, roughness: 0.42, envMapIntensity: 1.1 });
const plateM = new THREE.MeshStandardMaterial({ color: HEX.gold, metalness: 1, roughness: 0.5, envMapIntensity: 0.75 }); // brushed: a polished plate mirrors the studio lamps
const silver = new THREE.MeshStandardMaterial({ color: 0xa9a6a0, metalness: 1, roughness: 0.42, envMapIntensity: 0.6 });
const glow = (k = 5) => new THREE.MeshBasicMaterial({ color: COL.gold.clone().multiplyScalar(k), toneMapped: true, fog: false }); // emissive: never fogged, always blooms
const boneM = new THREE.MeshStandardMaterial({ color: HEX.bone, metalness: 0.1, roughness: 0.55 });
const lineM = (color = HEX.ash, opacity = 0.4) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
function circle(r, n = 128, a0 = 0, a1 = TAU) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); pts.push(v3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  return new THREE.BufferGeometry().setFromPoints(pts);
}
const segLine = (a, b, m) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), m);
// A tube rebuilt every frame from a curve (trails, braids): the old geometry is disposed, so nothing accumulates.
function liveTube(mesh, points, radius, segs = 160, radial = 8) {
  mesh.geometry.dispose();
  mesh.geometry = points.length > 1 ? new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segs, radius, radial, false) : new THREE.BufferGeometry();
}
// Tube shader whose alpha follows the tube's length (uv.x): a trail that fades with age.
const trailM = (k = 3) => new THREE.ShaderMaterial({
  uniforms: { uColor: { value: COL.gold.clone().multiplyScalar(k) }, uHead: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 uColor; uniform float uHead; varying vec2 vUv; void main(){ float a = pow(vUv.x, 2.2) * uHead; gl_FragColor = vec4(uColor * a, a); }',
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});

// Camera rig: keys [time, position, target, fov]; positions and targets run on centripetal Catmull-Rom splines through the
// keys (no stop at a key), fov eases per segment. Pure in t.
function rig(keys) {
  const pc = new THREE.CatmullRomCurve3(keys.map((k) => k[1]), false, 'centripetal');
  const lc = new THREE.CatmullRomCurve3(keys.map((k) => k[2]), false, 'centripetal');
  return (t) => {
    let i = 0; while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
    const u = clamp((t - keys[i][0]) / (keys[i + 1][0] - keys[i][0])), g = (i + u) / (keys.length - 1);
    return { pos: pc.getPoint(g), look: lc.getPoint(g), fov: lerp(keys[i][3], keys[i + 1][3], io(u)) };
  };
}
const groups = {};
const group = (name) => { const g = new THREE.Group(); g.name = name; scene.add(g); groups[name] = g; return g; };

// ---------------------------------------------------------------- S1/S2: the double slit
const G1 = group('slit');
const SRC = v3(0, 0, -12), SLIT = 0.35, SCREEN_Z = 8;
const PT_R = 0.016; // the point: small and hot, so the bloom reads as a star, not a sun
const particle = new THREE.Mesh(new THREE.SphereGeometry(PT_R, 32, 16), glow(5)); G1.add(particle);
const ghosts = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 24, 12), glow(4)); G1.add(m); return m; });
const ghostTrails = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.0, 1, 12, 1, true).rotateX(Math.PI / 2).translate(0, 0, -0.5), trailM(2.5)); G1.add(m); return m; });
const pulseRing = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 96), new THREE.MeshBasicMaterial({ color: COL.gold.clone().multiplyScalar(2), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
G1.add(pulseRing);
const streak = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.0, 1, 12, 1, true).rotateX(Math.PI / 2).translate(0, 0, -0.5), trailM(2.5));
G1.add(streak);
// Dust round the source: 500 faint motes, only there to give the macro orbit real parallax (seeded, static).
{
  const r = mulberry32(31), pos = new Float32Array(500 * 3);
  for (let i = 0; i < 500; i++) { const a = r() * TAU, e = Math.acos(r() * 2 - 1), d = 0.25 + Math.pow(r(), 0.7) * 3.2; pos.set([Math.sin(e) * Math.cos(a) * d, Math.cos(e) * d, SRC.z + Math.sin(e) * Math.sin(a) * d], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  G1.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x6d6b66, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false })));
}
const barrierM = new THREE.MeshStandardMaterial({ color: 0x121217, metalness: 0.5, roughness: 0.6, envMapIntensity: 0.25 });
const edgeM = new THREE.LineBasicMaterial({ color: HEX.bone, transparent: true, opacity: 0.85, depthWrite: false });
for (const [x0, x1] of [[-3.6, -SLIT - 0.06], [-SLIT + 0.06, SLIT - 0.06], [SLIT + 0.06, 3.6]]) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 4.4, 0.06), barrierM); b.position.set((x0 + x1) / 2, 0, 0); G1.add(b);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), edgeM); e.position.copy(b.position); G1.add(e);
}
const screen = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 4.4), new THREE.MeshBasicMaterial({ color: 0x101016 }));
const screenEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(7.4, 4.4)), lineM(HEX.ash, 0.35)); screenEdge.position.z = SCREEN_Z - 0.01; G1.add(screenEdge);
screen.position.z = SCREEN_Z; screen.rotation.y = Math.PI; G1.add(screen);
// The ripple tank: a floor under the beam computes the two-slit interference live. Two circular waves from the slits are
// summed and squared; the front spreads at the wave speed, so the hyperbolic nodal lines draw themselves after the pass.
const tankM = new THREE.ShaderMaterial({
  uniforms: { uT: { value: 0 }, uOn: { value: 0 }, uFront: { value: 0 }, uSlit: { value: SLIT }, uBone: { value: COL.bone }, uGold: { value: COL.gold } },
  vertexShader: 'varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: `uniform float uT, uOn, uFront, uSlit; uniform vec3 uBone, uGold; varying vec2 vP;
    void main(){
      float r1 = length(vP - vec2(-uSlit, 0.0)), r2 = length(vP - vec2(uSlit, 0.0));
      float k = 6.2831853 / 0.28, w = 6.2831853 * 2.2;
      float a = sin(k * r1 - w * uT) / sqrt(r1 + 0.25) + sin(k * r2 - w * uT) / sqrt(r2 + 0.25);
      float front = smoothstep(uFront, uFront - 0.6, max(r1, r2));          // only where the wave has arrived
      float edge = smoothstep(0.0, 0.5, vP.y) * (1.0 - smoothstep(7.0, 8.0, vP.y)) * (1.0 - smoothstep(2.8, 3.7, abs(vP.x)));
      float I = a * a * 0.22;
      vec3 c = mix(uBone, uGold * 1.4, smoothstep(0.9, 2.0, I)) * I;          // the crests turn gold where they reinforce
      gl_FragColor = vec4(c * front * edge * uOn, 1.0);
    }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const tank = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 8.4), tankM);
tank.rotation.x = -Math.PI / 2; tank.position.set(0, -0.7, 4.1); G1.add(tank);

// Detections: 16 000 hits sampled once (seeded) from the two-slit intensity, revealed in order.
const HITS = 18000, FRINGE = 0.44;
const ENVELOPE = 3.1; // single-slit envelope: its first zero sits at ±3.1, so the fringes fill the screen
const intensity = (x) => { const s = x / ENVELOPE; const sinc = Math.abs(s) < 1e-4 ? 1 : Math.sin(Math.PI * s) / (Math.PI * s); return Math.cos((Math.PI * x) / FRINGE) ** 2 * sinc * sinc; };
const hitPos = new Float32Array(HITS * 3), hitIdx = new Float32Array(HITS);
{
  const r = mulberry32(77);
  for (let i = 0; i < HITS; i++) {
    let x; do { x = (r() * 2 - 1) * 3.5; } while (r() > intensity(x));
    const y = (r() + r() + r() - 1.5) * 1.55;
    hitPos.set([x, y, SCREEN_Z - 0.02], i * 3); hitIdx[i] = i;
  }
}
const hitGeo = new THREE.BufferGeometry();
hitGeo.setAttribute('position', new THREE.BufferAttribute(hitPos, 3));
hitGeo.setAttribute('aIndex', new THREE.BufferAttribute(hitIdx, 1));
const hitM = new THREE.ShaderMaterial({
  uniforms: { uCount: { value: 0 }, uSize: { value: 3.0 }, uBone: { value: COL.bone }, uGold: { value: COL.gold } },
  vertexShader: `attribute float aIndex; uniform float uCount, uSize; varying float vFresh;
    void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
      vFresh = 1.0 - clamp((uCount - aIndex) / 90.0, 0.0, 1.0); gl_PointSize = uSize * (1.0 + 2.2 * vFresh) * (7.0 / -mv.z); }`,
  fragmentShader: `uniform vec3 uBone, uGold; varying float vFresh;
    void main(){ float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard; float a = smoothstep(0.5, 0.15, r);
      vec3 c = mix(uBone * 0.85, uGold * 5.0, vFresh * vFresh); gl_FragColor = vec4(c * a, a); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const hits = new THREE.Points(hitGeo, hitM); hits.frustumCulled = false; G1.add(hits);
// S2: the ideal pattern as hard bars on the screen (the hits snap into it on the drop); the centre fringe is gold.
const barsM = new THREE.ShaderMaterial({
  uniforms: { uOn: { value: 0 }, uDim: { value: 1 }, uBone: { value: COL.bone }, uGold: { value: COL.gold }, uF: { value: FRINGE } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform float uOn, uDim, uF; uniform vec3 uBone, uGold; varying vec2 vUv;
    void main(){ float x = (0.5 - vUv.x) * 7.4; float s = x / 3.1; float sinc = abs(s) < 1e-4 ? 1.0 : sin(3.14159 * s) / (3.14159 * s);
      float cx = cos(3.14159 * x / uF); float I = cx * cx * sinc * sinc; float bar = step(0.42, I) * step(0.04, sinc * sinc);
      vec3 c = abs(x) < uF * 0.5 ? uGold * 1.6 : uBone * (0.35 + 0.65 * sinc * sinc);
      gl_FragColor = vec4(c * bar * uOn * uDim, 1.0); }`,
});
const bars = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 4.4), barsM);
bars.position.z = SCREEN_Z - 0.03; bars.rotation.y = Math.PI; G1.add(bars);

// ---------------------------------------------------------------- the Bloch sphere (S3, twice in S4)
function bloch(R) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: COL.bone }, uK: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uColor; uniform float uK; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0), 3.0); gl_FragColor = vec4(uColor * f * 0.85 * uK, f * 0.75 * uK); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  g.add(shell);
  const eq = new THREE.Line(circle(R), lineM(HEX.bone, 0.55)); g.add(eq);
  for (const lat of [-45, 45]) { const l = new THREE.Line(circle(R * Math.cos(lat * D)), lineM(HEX.ash, 0.28)); l.position.y = R * Math.sin(lat * D); g.add(l); }
  for (let k = 0; k < 6; k++) { const l = new THREE.Line(circle(R), lineM(HEX.ash, 0.22)); l.rotation.x = Math.PI / 2; l.rotation.z = (k / 6) * Math.PI; g.add(l); }
  g.add(segLine(v3(0, -R * 1.3, 0), v3(0, R * 1.3, 0), lineM(HEX.bone, 0.45)));
  g.add(segLine(v3(-R * 1.15, 0, 0), v3(R * 1.15, 0, 0), lineM(HEX.ash, 0.25)));
  g.add(segLine(v3(0, 0, -R * 1.15), v3(0, 0, R * 1.15), lineM(HEX.ash, 0.25)));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.014, R * 0.014, 1, 12).translate(0, 0.5, 0), gold);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(R * 0.045, 32, 16), glow(5));
  const hub = new THREE.Mesh(new THREE.SphereGeometry(R * 0.025, 16, 8), boneM);
  const shadow = segLine(v3(0, 0, 0), v3(0, 1, 0), lineM(HEX.ash, 0.5));
  const foot = new THREE.Line(circle(R * 0.04, 32), lineM(HEX.bone, 0.6));
  g.add(rod, tip, hub, shadow, foot);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.02, R * 0.006, 8, 160), new THREE.MeshBasicMaterial({ color: COL.gold.clone().multiplyScalar(3), transparent: true, opacity: 0, depthWrite: false }));
  ring.rotation.x = Math.PI / 2; g.add(ring);
  // Pose the state (θ from |0⟩ at the top, φ round the equator); returns the tip in world space.
  g.userData.state = (th, ph) => {
    const p = v3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).multiplyScalar(R);
    rod.quaternion.setFromUnitVectors(v3(0, 1, 0), p.clone().normalize()); rod.scale.set(1, R * 0.96, 1);
    tip.position.copy(p);
    const f = v3(p.x, 0, p.z);
    shadow.geometry.setFromPoints([p, f]); foot.position.copy(f);
    g.updateMatrixWorld(true);
    return tip.getWorldPosition(v3());
  };
  g.userData.R = R; g.userData.ring = ring; g.userData.shell = shell;
  return g;
}
const G3 = group('qubit');
const Q3 = bloch(1.6); G3.add(Q3);
const trail3 = new THREE.Mesh(new THREE.BufferGeometry(), trailM(3)); G3.add(trail3);
const th3 = (t) => { const u = range(t, B(20), B(28)); return Math.PI * 0.6 * io(clamp(u * 1.35)) + 0.14 * Math.sin(u * 13) * u + 0.0001; };
const ph3 = (t) => 0.5 + TAU * 2.1 * range(t, B(20), B(28)) + 0.6 * oc(range(t, B(20), B(22)));
const tipAt3 = (t) => { const th = th3(t), ph = ph3(t), R = 1.6; return v3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).multiplyScalar(R); };

const G4 = group('pair');
const QA = bloch(1.0), QB = bloch(1.0); G4.add(QA, QB);
const braid = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.BufferGeometry(), glow(2.2)); G4.add(m); return m; });

// ---------------------------------------------------------------- S5: the machine
const G5 = group('fridge');
const PLATES = [{ y: 3.4, r: 1.6, label: '50 K' }, { y: 1.7, r: 1.4, label: '4 K' }, { y: 0, r: 1.2, label: '800 mK' }, { y: -1.7, r: 1.0, label: '100 mK' }, { y: -3.4, r: 0.8, label: '15 mK' }];
PLATES.forEach((p, i) => {
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, 0.08, 128), plateM); plate.position.y = p.y; G5.add(plate);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(p.r, 0.022, 12, 128), goldRough); lip.rotation.x = Math.PI / 2; lip.position.y = p.y + 0.04; G5.add(lip);
  // components on each plate: attenuators and heat exchangers, seeded
  const r = mulberry32(300 + i);
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU + r() * 0.3, rr = p.r * (0.45 + r() * 0.35), h = 0.12 + r() * 0.22;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05 + r() * 0.04, 0.06, h, 24), k % 3 ? silver : goldRough);
    c.position.set(Math.cos(a) * rr, p.y + 0.04 + h / 2, Math.sin(a) * rr); G5.add(c);
  }
  if (i < PLATES.length - 1) for (let k = 0; k < 6; k++) { // rods to the next plate
    const a = (k / 6) * TAU + i * 0.25, rr = PLATES[i + 1].r * 0.86, len = p.y - PLATES[i + 1].y;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 12), goldRough);
    rod.position.set(Math.cos(a) * rr, p.y - len / 2, Math.sin(a) * rr); G5.add(rod);
  }
});
const topRod = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 4, 32), goldRough); topRod.position.y = 5.4; G5.add(topRod);
const CHIP_Y = -4.6;
for (let c = 0; c < 12; c++) { // coaxial lines spiralling down to the chip
  const r = mulberry32(500 + c), a0 = (c / 12) * TAU, pts = [];
  PLATES.forEach((p, i) => pts.push(v3(Math.cos(a0 + i * 0.42) * p.r * (0.55 + 0.12 * r()), p.y - 0.12, Math.sin(a0 + i * 0.42) * p.r * (0.55 + 0.12 * r()))));
  pts.unshift(v3(Math.cos(a0) * 1.0, 4.6, Math.sin(a0) * 1.0));
  pts.push(v3(Math.cos(a0 + 2.3) * 0.32, CHIP_Y + 0.25, Math.sin(a0 + 2.3) * 0.32));
  G5.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.016, 8, false), c % 4 ? silver : goldRough));
}
const can = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.5, 64, 1, true), silver); can.position.y = CHIP_Y + 0.3; G5.add(can);
const chip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.9), gold); chip.position.y = CHIP_Y; G5.add(chip);
// the qubit grid on the chip's underside: the pattern the next shot opens on
const cells = new THREE.InstancedMesh(new THREE.BoxGeometry(0.032, 0.01, 0.032), glow(1.4), 256);
for (let i = 0; i < 256; i++) cells.setMatrixAt(i, new THREE.Matrix4().makeTranslation(((i % 16) - 7.5) * 0.05, CHIP_Y - 0.03, (Math.floor(i / 16) - 7.5) * 0.05));
G5.add(cells);

// ---------------------------------------------------------------- S6/S7: the search
const G6 = group('field');
const N = 256, SIDE = 16, PITCH = 0.3, MARK = 16 * 10 + 5;
const cellXZ = (i) => [((i % SIDE) - 7.5) * PITCH, (Math.floor(i / SIDE) - 7.5) * PITCH];
const barGeo = new THREE.BoxGeometry(0.2, 1, 0.2).translate(0, 0.5, 0);
const field = new THREE.InstancedMesh(barGeo, new THREE.MeshStandardMaterial({ color: 0xa8a59f, metalness: 0.15, roughness: 0.5, envMapIntensity: 0.5 }), N);
G6.add(field);
const tower = new THREE.Mesh(barGeo, new THREE.MeshStandardMaterial({ color: HEX.gold, metalness: 1, roughness: 0.22, emissive: HEX.gold, emissiveIntensity: 0.25, side: THREE.DoubleSide })); // dips below the floor (negative scale)
G6.add(tower);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x050507, metalness: 0.2, roughness: 0.85, envMapIntensity: 0.15 }));
floor.rotation.x = -Math.PI / 2; G6.add(floor);
const point7 = new THREE.Mesh(new THREE.SphereGeometry(PT_R, 32, 16), glow(5)); G6.add(point7);
// the collapse: one ring leaves the answer as it becomes a point (a single event, not a burst)
const ring7 = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 128), new THREE.MeshBasicMaterial({ color: COL.gold.clone().multiplyScalar(2.5), transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false })); G6.add(ring7);
// Grover's algorithm, exactly: after k iterations the marked amplitude is sin((2k+1)θ), every other cos((2k+1)θ)/√(N−1).
const THETA = Math.asin(1 / Math.sqrt(N)), KMAX = 12;
const ampMarked = (k) => Math.sin((2 * k + 1) * THETA), ampOther = (k) => Math.cos((2 * k + 1) * THETA) / Math.sqrt(N - 1);
const STEP = (j) => Bf(45 + j * 0.5); // iteration j lands on every 8th note from beat 45
function groverAt(t) {
  let j = 0; while (j < KMAX && t >= STEP(j + 1)) j++;
  const P = (k) => ampMarked(k) ** 2;
  if (j >= KMAX) return { k: KMAX, m: ampMarked(KMAX), o: ampOther(KMAX), p: P(KMAX) };
  const u = range(t, STEP(j), STEP(j + 1)), a = ampMarked(j);
  // the oracle flips the marked amplitude's sign (the bar dips below the floor), then the diffusion lifts it higher than before
  if (u < 0.35) return { k: j, m: a * (1 - 2 * io(u / 0.35)), o: ampOther(j), p: P(j) }; // the sign flips; the probability does not change
  const s = clamp(M.spring((u - 0.35) * (STEP(j + 1) - STEP(j)), 6, 0.6));
  return { k: j + s, m: lerp(-a, ampMarked(j + 1), s), o: lerp(ampOther(j), ampOther(j + 1), s), p: lerp(P(j), P(j + 1), s) };
}
const HSCALE = 9; // height = 9 · |amplitude|: uniform bars stand 0.56, the answer ~9
const dummy = new THREE.Object3D();

// ---------------------------------------------------------------- type (DOM)
const typeEl = document.getElementById('type');
const all = [];
function el(cls, html, css = {}) { const e = document.createElement('div'); e.className = cls; if (html != null) e.innerHTML = html; Object.assign(e.style, css); typeEl.appendChild(e); all.push(e); return e; }
const show = (e, on) => { e.style.visibility = on ? 'visible' : 'hidden'; };
// A serif line under a mask: it rises from its baseline (expo out) and leaves upwards (expo in). No fades.
function line(html, { size = 150, italic = true, x = 150, y = 700, color = '#EDEBE6' } = {}) {
  const mask = el('mask serif', null, { left: x + 'px', top: y + 'px', fontSize: size + 'px', fontStyle: italic ? 'italic' : 'normal', color });
  const inner = document.createElement('span'); inner.className = 'in'; inner.innerHTML = html; mask.appendChild(inner);
  return {
    el: mask, inner,
    set(t, t0, t1 = 1e9) {
      const u = range(t, t0 - 0.14, t0 + 0.42), o = range(t, t1 - 0.3, t1);
      show(mask, u > 0 && o < 1);
      inner.style.transform = `translateY(${((1 - ox(u)) * 108 - ix(o) * 108).toFixed(2)}%)`;
    },
  };
}
// Mono readout: types at 45 characters a second from t0, with a block cursor while typing; html() can change per frame.
function mono(css = {}) {
  const e = el('mono', '', css);
  return {
    el: e,
    set(t, t0, text, { t1 = 1e9, at = null } = {}) {
      const n = Math.floor((t - t0) * 45);
      show(e, n > 0 && t < t1);
      if (n <= 0 || t >= t1) return;
      if (at) { e.style.left = at.x.toFixed(1) + 'px'; e.style.top = at.y.toFixed(1) + 'px'; }
      const plain = text.replace(/<[^>]+>/g, '');
      e.innerHTML = n >= plain.length ? text : esc(plain.slice(0, n)) + (Math.floor((t - t0) * 6) % 2 ? '' : '▌');
    },
  };
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const inFrame = (s, w = 420) => ({ x: clamp(s.x, 60, W - w), y: clamp(s.y, 60, H - 80) });
const screenOf = (p, c = camera, vw = W, ox0 = 0) => { const q = p.clone().project(c); return { x: ox0 + (q.x * 0.5 + 0.5) * vw, y: (-q.y * 0.5 + 0.5) * H, z: q.z }; };

const T = {
  one: line('One particle.', { x: 150, y: 640 }),
  two: line('Two paths.', { x: 150, y: 800, italic: false }),
  hitsRead: mono(),
  title: null, // S2 builds its own (two states)
  sub2: mono({ left: '156px', top: '760px' }),
  qubit: line('The qubit.', { x: 150, y: 150, size: 170 }),
  formula: mono({ left: '158px', top: '345px' }),
  tipRead: mono(),
  k0: mono(), k1: mono(),
  ent: line('Entangled.', { x: 150, y: 150, size: 170 }),
  dist: mono(),
  know: mono({ left: '156px', top: '930px' }),
  cold: line('Colder than space.', { x: 150, y: 820, size: 150 }),
  plates: PLATES.map(() => mono()),
  space: mono({ left: '158px', top: '985px' }),
  all1: line('Every answer at once.', { x: 150, y: 120, size: 130 }),
  amp: line('The right one, <i style="color:#E8B04B">amplified.</i>', { x: 150, y: 255, size: 130, italic: false }),
  grover: mono({ left: '156px', top: '420px' }),
  prob: mono(),
  end: line('Superposition', { x: 1070, y: 468, size: 120 }),
  credit: mono({ left: '1076px', top: '612px', fontSize: '34px' }),
  credit2: mono({ left: '1076px', top: '660px', fontSize: '34px' }),
};
const lead = el('tick', null, { height: '1px', width: '0px' }); // leader line for the plate readouts
const gutter = el('tick', null, { top: '0px', height: '1080px', width: '2px', background: '#EDEBE6' });
// S2 title: every letter twice, white and gold, offset as two states until they collapse on beat 18.
const TITLE = 'Superposition', TS = 300, TIT_X = 0.765, TIT_Y = 0.279; // tittle position within the glyph box (tuned on stills)
const titleBox = el('serif', null, { position: 'absolute', left: '150px', top: '330px', width: '1700px', height: '420px', fontSize: TS + 'px', fontStyle: 'italic' });
const titleA = document.createElement('span'), titleB = document.createElement('span');
for (const [s, c] of [[titleB, '#E8B04B'], [titleA, '#EDEBE6']]) { s.textContent = TITLE; Object.assign(s.style, { position: 'absolute', left: 0, top: 0, color: c }); titleBox.appendChild(s); }
const tittle = el('', null, { position: 'absolute', width: '0px', height: '0px', borderRadius: '50%', background: '#E8B04B' });

function hideAll() { for (const e of all) e.style.visibility = 'hidden'; }

// ---------------------------------------------------------------- shots
const CUTS = [0, 16, 20, 28, 36, 44, 52]; // beats
const vis = (...names) => { for (const k in groups) groups[k].visible = names.includes(k); };
let blur = [0, 0];

const MACRO = v3(0.36, 0.1, 0.7); // the opening (and closing) framing of the point
// The opening macro slowly orbits the point (zero at t = 0, so the last frame of the film is the first).
const macroPos = (t) => { const a = -0.42 * io(range(t, 0, B(4))); return SRC.clone().add(MACRO.clone().applyAxisAngle(v3(0, 1, 0), a)).add(v3(0, 0.06 * Math.sin(Math.max(0, t) * 0.7), 0)); }; // t < 0 is the loop tail: held still
const CHASE = v3(0.22, 0.3, -1.7), CHASE_LOOK = v3(0.1, -0.05, 3.0); // behind and above the particle, the slits ahead
const THREAD = v3(SLIT, 0, -0.9); // where the chase ends: lined up on the right slit
const S1_RIG = rig([
  [B(6.4), THREAD.clone(), v3(SLIT, 0, 3), 36],           // the pass: the camera is lined up on the right slit…
  [B(6.75), v3(SLIT, 0, 0.45), v3(SLIT, 0, 4), 40],       // …and threads it (the slit is 0.12 wide; the path stays on x = 0.35, y = 0)
  [B(7.0), v3(SLIT + 0.1, 0.5, 1.2), v3(0.1, -0.7, 4.2), 40],   // tilting down onto the ripple tank
  [B(8.6), v3(1.8, 2.3, 1.7), v3(0, -0.2, 5.5), 36],      // rising: the wavefronts below, the hits ahead
  [B(11), v3(2.0, 1.3, 1.4), v3(0, 0, 6.5), 34],
  [B(14.5), v3(0.0, 0.05, 1.3), v3(0, 0, SCREEN_Z), 32],  // facing the screen
  [B(16), v3(0.0, 0.05, 1.3), v3(0, 0, SCREEN_Z), 31],
]);
function s1(t) { // the double slit, then (S2) the drop on the same screen
  vis('slit'); scene.environmentIntensity = 0.9; key.intensity = 2.2; rim.intensity = 1.4;
  scene.fog.density = 0.022;
  const launch = B(4), pass = Bf(6.4);
  // the particle: breathing at the source, launched on beat 4, through the barrier at 3.2 s
  const fly = range(t, launch, pass), z = lerp(SRC.z, 0, fly ** 2.4); // accelerating
  const breathe = 1 + 0.12 * Math.sin(t * TAU * 1.0);
  particle.visible = t < pass; particle.position.set(0, 0, z); particle.scale.setScalar(breathe);
  const sp = t > launch && t < pass ? 2.4 * Math.pow(fly, 1.4) * 4 : 0;
  streak.visible = sp > 0.01; streak.position.copy(particle.position); streak.scale.set(1, 1, sp);
  // a ring opens on each of the first four beats
  let ring = -1; for (const k of [0, 1, 2, 3]) if (t >= B(k) && t < B(k) + 0.5) ring = k;
  pulseRing.visible = ring >= 0 && t < launch;
  if (pulseRing.visible) { const u = range(t, B(ring), B(ring) + 0.5); pulseRing.position.copy(SRC); pulseRing.scale.setScalar(0.035 + 0.13 * oc(u)); pulseRing.material.opacity = 0.9 * (1 - u); }
  // two ghosts leave the slits and fade into the wave as the hits begin
  const g = range(t, pass, pass + 0.8);
  ghostTrails.forEach((m, i) => { const q = ghosts[i]; m.visible = g > 0.02 && g < 1; m.position.set((i ? 1 : -1) * SLIT * (1 + g * 2.5), 0, 0.3 + 7 * oc(g)); m.lookAt((i ? 1 : -1) * SLIT * (1 + (g + 0.1) * 2.5), 0, 0.3 + 7 * oc(g + 0.1)); m.scale.set(1, 1, 1.6 * (1 - g) + 0.2); });
  ghosts.forEach((m, i) => { m.visible = g > 0 && g < 1; m.position.set((i ? 1 : -1) * SLIT * (1 + g * 2.5), 0, 0.3 + 7 * oc(g)); m.scale.setScalar(0.6 * (1 - g)); }); // out ahead of the camera, fast
  // the ripple tank: the wave is born at the pass and sweeps the tank in under a second
  tank.visible = t > pass && t < B(16);
  tankM.uniforms.uT.value = t; tankM.uniforms.uFront.value = Math.max(0, t - pass) * 9.0;
  tankM.uniforms.uOn.value = 0.9;
  // detections: a handful one by one, then a torrent, frozen on the silence before the drop
  const u = range(t, B(8), Bf(15.5)), count = t < B(8) ? 0 : Math.min(HITS, Math.floor(2 + HITS * Math.pow(u, 3.1)));
  hitGeo.setDrawRange(0, count); hitM.uniforms.uCount.value = count;
  hits.visible = t < B(16) + 0.08;
  // S2: the bars take over on the drop
  bars.visible = t >= B(16); barsM.uniforms.uOn.value = 1; // opaque: only drawn from the drop
  barsM.uniforms.uDim.value = 1 - 0.78 * seg(t, B(16) + 0.15, B(16.8)); // the barcode flashes, then steps back behind the word

  // camera: macro on the source → tracking side-on → arc round to face the screen → (S2) push into the bars
  let pos, look, fov = 30, roll = 0;
  if (t < launch) { pos = macroPos(t); look = SRC.clone(); }
  else if (t < pass) { // chase: from the macro framing round behind the particle as it accelerates
    const a = seg(t, launch, launch + 0.7), P = particle.position, line = io(range(t, Bf(5.2), pass));
    const chase = mix3(P.clone().add(CHASE), v3(SLIT, 0, P.z - 0.9), line), chaseLook = mix3(P.clone().add(CHASE_LOOK), v3(SLIT, 0, P.z + 3), line);
    pos = mix3(macroPos(t), chase, a); look = mix3(SRC, chaseLook, a); fov = lerp(30, 36, a);
    roll = -6 * D * a * (1 - line);
  } else {
    const c = S1_RIG(t); pos = c.pos; look = c.look; fov = c.fov;
    roll = -5 * D * Math.sin(Math.PI * range(t, B(7), B(14.5)));
    if (t >= B(16)) { const p = ox(range(t, B(16), B(19))); fov = lerp(31, 27.5, p); roll = 0; } // the drop: a slow tighten on the barcode
  }
  aim(camera, pos, look, fov, roll);
  const frontal = range(t, B(12), B(14.5));
  tankM.uniforms.uOn.value *= 1 - 0.7 * frontal; // it steps back as the hits take over
  pulseRing.lookAt(camera.position); // faces this frame's camera (aimed just above)

  T.one.set(t, B(9), B(15.6)); T.two.set(t, B(11), B(15.6));
  if (t >= 0 && t < launch) { const s = screenOf(SRC); T.hitsRead.set(t, B(1), '<b>1</b> photon   <i>·</i>   |ψ⟩', { at: { x: s.x + 120, y: s.y - 14 }, t1: launch }); }
  if (count > 0 && t < B(16)) { const s = screenOf(v3(2.0, -1.7, SCREEN_Z)); T.hitsRead.set(t, B(8), `detections <b>${String(count).padStart(5, '0')}</b>`, { at: { x: clamp(s.x + 18, 150, W - 360), y: clamp(s.y - 30, 120, H - 90) } }); }
  if (t >= B(16)) title(t);
}

function title(t) { // S2: the word through the bars, two states collapsing on beat 18, then a zoom into the gold tittle
  const open = range(t, B(16) + 0.05, B(16) + 0.5), collapse = spring(t, B(18) - 0.1, 1.8, 0.55);
  show(titleBox, open > 0);
  const stripe = 4 + 36 * ox(open); // the word shows through vertical stripes that widen to solid
  const mask = open >= 1 ? 'none' : `repeating-linear-gradient(90deg, #000 0 ${stripe.toFixed(1)}px, transparent ${stripe.toFixed(1)}px 40px)`;
  titleBox.style.webkitMaskImage = mask; titleBox.style.maskImage = mask;
  const off = (1 - clamp(collapse)) * 22 + (collapse > 1 ? (collapse - 1) * -10 : 0);
  titleA.style.transform = `translate(${(-off).toFixed(2)}px, ${(-off * 0.45).toFixed(2)}px)`;
  titleB.style.transform = `translate(${off.toFixed(2)}px, ${(off * 0.45).toFixed(2)}px)`;
  titleB.style.opacity = t < B(18) + 0.35 ? '1' : '0'; // opacity, not visibility: a visible child would show through its hidden parent in other shots
  T.sub2.set(t, B(17), 'a qubit is <b>0</b> and <b>1</b> until it is measured', { t1: B(19.3) });
  // the zoom: the last i's tittle turns gold and the frame dives into it (it becomes the qubit's tip in S3)
  const zoom = ix(range(t, B(19.2), B(20)));
  const { tx, ty, d } = TITTLE; // the last "i"'s tittle, measured on the face once the fonts are in
  show(tittle, t >= B(18) + 0.2);
  Object.assign(tittle.style, { left: (tx - d / 2) + 'px', top: (ty - d / 2) + 'px', width: d + 'px', height: d + 'px' });
  const s = 1 + 60 * zoom;
  for (const e of [titleBox, tittle]) e.style.transformOrigin = `${tx - parseFloat(e.style.left)}px ${ty - parseFloat(e.style.top)}px`;
  titleBox.style.transform = tittle.style.transform = `scale(${s.toFixed(3)})`;
}

function s3(t) { // the qubit
  vis('qubit'); scene.environmentIntensity = 0.9; key.intensity = 2.2; rim.intensity = 1.4;
  scene.fog.density = 0.0;
  const tip = Q3.userData.state(th3(t), ph3(t));
  const pts = []; for (let i = 0; i <= 80; i++) pts.push(tipAt3(t - 1.6 + (1.6 * i) / 80));
  liveTube(trail3, pts, 0.014, 160, 6); trail3.material.uniforms.uHead.value = seg(t, B(20), B(21));
  Q3.userData.shell.material.uniforms.uK.value = 1;
  // camera: starts inside the gold tip (the match from S2's tittle), pulls out, orbits, then whips away
  const pull = ox(range(t, B(20), B(22.5)));
  const az = lerp(25, 105, seg(t, B(20), B(27.4), (u) => u)) * D + 70 * D * ix(range(t, B(27.4), B(28))), el0 = 16 * D;
  const orbit = v3(Math.sin(az) * Math.cos(el0), Math.sin(el0), Math.cos(az) * Math.cos(el0)).multiplyScalar(6.6);
  const close = tip.clone().add(tip.clone().normalize().multiplyScalar(1.0)).add(v3(0.1, 0.08, 0.25)); // the orb as a star, pulling out to the sphere
  aim(camera, mix3(close, orbit, pull), mix3(tip, v3(0, 0, 0), pull), lerp(28, 32, pull), lerp(8 * D, 0, pull), 0.17 * pull);
  blur = [0.05 * ix(range(t, B(27.4), B(28))), 0];
  T.qubit.set(t, B(21), B(27.3));
  T.formula.set(t, B(22.5), '|ψ⟩ = cos(θ/2) |0⟩ + e<sup>iφ</sup> sin(θ/2) |1⟩', { t1: B(27.3) });
  const s = screenOf(tip), th = th3(t), ph = ((ph3(t) % TAU) + TAU) % TAU;
  if (pull > 0.6) T.tipRead.set(t, B(22), `<i>θ</i> <b>${th.toFixed(3)}</b>   <i>φ</i> <b>${ph.toFixed(3)}</b>`, { at: inFrame({ x: s.x + 26, y: s.y - 38 }), t1: B(27.4) });
  const p0 = screenOf(v3(0, 1.6 * 1.3 + 0.08, 0)), p1 = screenOf(v3(0, -1.6 * 1.3 - 0.08, 0));
  T.k0.set(t, B(21.5), '|0⟩', { at: { x: p0.x - 22, y: p0.y - 30 }, t1: B(27.4) });
  T.k1.set(t, B(21.5), '|1⟩', { at: { x: p1.x - 22, y: p1.y + 6 }, t1: B(27.4) });
}

function s4(t) { // entanglement: the braid, the distance, the split screen, the measurement
  vis('pair'); scene.environmentIntensity = 0.9; key.intensity = 2.2; rim.intensity = 1.4;
  scene.fog.density = 0.0;
  const apart = io(range(t, B(30), B(31.8))), dx = lerp(2.3, 6.5, apart);
  QA.position.set(-dx, 0, 0); QB.position.set(dx, 0, 0);
  const w = t * 2.4, meas = spring(t, B(32), 2.4, 0.42);
  const thA = lerp(Math.PI / 2, 0.0001, clamp(meas)) + (meas > 1 ? (1 - meas) * 0.3 : 0), thB = Math.PI - thA;
  const tipA = QA.userData.state(thA, w), tipB = QB.userData.state(thB, w + Math.PI);
  // the braid: two gold strands twisting round the line between them; it carries a pulse and lets go after the measurement
  const cut = range(t, B(32), B(33.2));
  braid.forEach((m, s) => {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const u = i / 120, x = lerp(-dx + 1.0, dx - 1.0, u), a = u * TAU * (3 + apart * 6) - t * 5 + s * Math.PI, rr = 0.16 * Math.sin(u * Math.PI) * (1 - cut);
      pts.push(v3(x, Math.cos(a) * rr + Math.sin(u * Math.PI) * 0.0, Math.sin(a) * rr));
    }
    liveTube(m, pts, 0.012 * (1 - 0.8 * cut), 240, 6); m.visible = cut < 0.98;
  });
  { const r = QA.userData.ring, u = range(t, B(32), B(32) + 0.7); r.material.opacity = u > 0 && u < 1 ? 1 - u : 0; r.scale.setScalar(1 + 0.6 * oc(u)); } // A is the one measured
  QB.userData.ring.material.opacity = 0;
  // main camera: whip in from S3, orbit low, then pull back wide as they separate; then the split screen closes in on A
  const whip = 1 - oc(range(t, B(28), B(28.6)));
  const az = (-30 + 60 * whip + 18 * seg(t, B(28), B(31))) * D;
  const wide = io(range(t, B(30), B(31.9)));
  const dist = lerp(8.5, 21, wide);
  let pos = v3(Math.sin(az) * dist, lerp(1.2, 3.2, wide), Math.cos(az) * dist), look = v3(0, 0, 0), fov = 32;
  const sp = oc(range(t, Bf(31.6), B(32)));
  world.split = sp;
  if (sp > 0) {
    const cA = QA.position.clone().add(v3(1.5, 0.8, 4.7)), cB = QB.position.clone().add(v3(-1.5, 0.8, 4.7));
    pos = mix3(pos, cA, sp); look = mix3(look, QA.position, sp);
    aim(camB, cB, QB.position, 34);
  }
  aim(camera, pos, look, lerp(fov, 34, sp));
  blur = [0.06 * whip * whip, 0];
  show(gutter, sp > 0); gutter.style.left = (W - sp * (W / 2) - 1) + 'px';
  T.ent.set(t, B(29), Bf(31.5));
  if (wide > 0.15 && sp < 0.5) { const m = screenOf(v3(0, -1.5, 0)); T.dist.set(t, B(30.3), `<b>${Math.round(1203 * oc(range(t, B(30.3), B(31.8)))).toLocaleString('en-US')}</b> km apart`, { at: { x: m.x - 80, y: m.y + 10 } }); }
  T.know.set(t, B(33), 'measure one, <b>know the other</b>   <i>·</i>   Micius satellite, 2017: 1,203 km');
  if (sp >= 1) {
    camera.aspect = W / 2 / H; camera.updateProjectionMatrix();
    const a = screenOf(tipA, camera, W / 2), b = screenOf(tipB, camB, W / 2, W / 2);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    T.k0.set(t, B(32) + 0.1, '|0⟩', { at: { x: a.x + 24, y: a.y - 36 } });
    T.k1.set(t, B(32) + 0.1, '|1⟩', { at: { x: b.x + 24, y: b.y - 10 } });
  }
}

// The crane: a descending helix round the stages, then under the chip, looking up into its qubit grid (the next shot opens on it).
const helix = (a, r, y) => v3(Math.cos(a) * r, y, Math.sin(a) * r);
const S5_RIG = rig([
  [B(36), helix(-0.5, 5.0, 6.2), v3(0, 4.4, 0), 36],
  [B(38), helix(0.45, 4.4, 3.3), v3(0, 1.8, 0), 34],
  [B(40), helix(1.4, 3.7, 0.2), v3(0, -1.3, 0), 34],
  [B(41.5), helix(2.2, 3.0, -2.6), v3(0, -3.9, 0), 36],
  [B(42.6), helix(2.9, 1.6, -5.4), v3(0, CHIP_Y, 0), 40],   // swinging under the chip
  [B(43.4), v3(0.12, CHIP_Y - 0.9, 0.08), v3(0, CHIP_Y, 0), 38],
  [B(44), v3(0.02, CHIP_Y - 0.32, 0.01), v3(0, CHIP_Y, 0), 30], // into the grid
]);
const camY5 = (t) => S5_RIG(t).pos.y + 2.2 * (1 - oc(range(t, B(36), B(36.7))));
const nearStage = (y, i) => Math.abs(y - (PLATES[i].y + 0.6)) < 1.0;
function stageSince(t, i) { for (let s = B(36); s <= t; s += 1 / 60) if (nearStage(camY5(s), i)) return s; return null; }
function s5(t) { // the machine: crane down through the stages into the chip
  vis('fridge');
  scene.fog.density = 0.035;
  scene.environmentIntensity = 0.5; key.intensity = 0.8; rim.intensity = 0.35; // polished metal everywhere: keep the highlights under the bloom threshold
  const c = S5_RIG(t), drop = 1 - oc(range(t, B(36), B(36.7))); // the cut lands mid-move: a fast vertical drop settling into the crane
  const pos = c.pos.clone().add(v3(0, drop * 2.2, 0)), look = c.look, fov = c.fov;
  const dive = range(t, B(42), B(44));
  const a = Math.atan2(pos.z, pos.x);
  aim(camera, pos, look, fov, -3 * D * (1 - dive), 0.15 * (1 - io(dive))); // the machine sits right of the line
  blur = [0, 0.05 * drop * drop];
  T.cold.set(t, B(38), B(42.4));
  T.space.set(t, B(40), 'deep space <b>2.7 K</b>   <i>·</i>   this plate <b>0.015 K</b>', { t1: B(42.4) });
  // a readout for each stage as the camera passes it
  let best = -1, bd = 9;
  PLATES.forEach((p, i) => {
    const d = Math.abs(pos.y - (p.y + 0.6));
    if (d < 1.0 && d < bd && dive < 0.2) { bd = d; best = i; }
  });
  T.plates.forEach((m, i) => {
    if (i !== best) return;
    const p = PLATES[i], edge = screenOf(v3(Math.cos(a + 1.2) * p.r, p.y, Math.sin(a + 1.2) * p.r));
    const tIn = stageSince(t, i) ?? t;
    const at = inFrame({ x: edge.x + 70, y: edge.y - 11 }, 300);
    m.set(t, tIn, `<b>${p.label}</b>  stage ${i + 1}`, { at });
    show(lead, at.x === edge.x + 70); Object.assign(lead.style, { left: (edge.x + 8) + 'px', top: edge.y + 'px', width: '54px' });
  });
}

// top-down on the grid (the match from the chip) → three-quarter → a low hero angle looking up at the answer
const S6_RIG = rig([
  [B(44), v3(0.001, 7.5, 0.4), v3(0, 0, 0), 42],
  [B(46.5), v3(5.8, 2.8, 7.0), v3(0, 0.6, 0), 36],
  [B(49), v3(6.4, 2.2, 8.4), v3(cellXZ(MARK)[0], 2.4, cellXZ(MARK)[1]), 40],
  [B(51.5), v3(7.6, 3.0, 10.6), v3(cellXZ(MARK)[0], 3.9, cellXZ(MARK)[1]), 42],   // pulled back: the whole answer over the fallen field
  [B(52), v3(7.6, 3.0, 10.6), v3(cellXZ(MARK)[0], 4.0, cellXZ(MARK)[1]), 42],
]);
function s6(t) { // the search, and (S7) the collapse into one point
  vis('field'); scene.environmentIntensity = 0.7; key.intensity = 1.4; rim.intensity = 0.3;
  scene.fog.density = 0.03;
  const gr = groverAt(t);
  const fall = ix(range(t, B(52), B(53)));      // S7: everything falls
  const shrink = io(range(t, B(52) + 0.2, B(54)));
  for (let i = 0; i < N; i++) {
    if (i === MARK) { dummy.position.set(0, -10, 0); dummy.scale.set(0, 0, 0); dummy.updateMatrix(); field.setMatrixAt(i, dummy.matrix); continue; } // drawn as the gold tower
    const [x, z] = cellXZ(i), d = Math.hypot(x, z);
    const ripple = t < B(46) ? 0.18 * Math.sin(d * 2.6 - (t - B(44)) * 7) * Math.exp(-(t - B(44)) * 0.9) : 0;
    const h = Math.max(0.04, (HSCALE * Math.abs(gr.o) + ripple) * (1 - fall));
    dummy.position.set(x, 0, z); dummy.scale.set(1, h, 1); dummy.updateMatrix(); field.setMatrixAt(i, dummy.matrix);
  }
  field.instanceMatrix.needsUpdate = true;
  const [mx, mz] = cellXZ(MARK);
  const hm = HSCALE * gr.m * (1 - shrink);
  tower.position.x = mx; tower.position.z = mz; tower.scale.set(1, Math.abs(hm) < 0.02 ? 0.02 : hm, 1);
  tower.visible = shrink < 1;
  // S7: the tower's top becomes a point, which the camera brings to the centre of frame: the first frame of the film
  const rise = io(range(t, B(52) + 0.2, B(54.2)));
  const top = v3(mx, Math.max(0.05, HSCALE * ampMarked(KMAX) * (1 - shrink)) + 0.05 + rise * 3.2, mz); // the point lifts out of the field
  field.position.y = tower.position.y = floor.position.y = -2.5 * ix(range(t, B(52), B(54.5))); // the field sinks away
  point7.visible = t >= B(52); point7.position.copy(top); point7.scale.setScalar(t >= B(56) ? 1 + 0.12 * Math.sin(t * TAU) : lerp(3.2, 1, oc(range(t, B(52), B(54)))));
  floor.visible = field.visible = t < B(54.5);
  { const u = range(t, B(52), B(52) + 0.9); ring7.visible = u > 0 && u < 1; ring7.position.copy(top); ring7.scale.setScalar(0.1 + 2.4 * oc(u)); ring7.material.opacity = 1 - u; }
  // camera: top-down (the chip's grid) → three-quarter low → rises with the tower → (S7) pushes into the point
  const cr = S6_RIG(t);
  let pos = cr.pos, look = cr.look, fov = cr.fov;
  tower.material.emissiveIntensity = 0.2 + 1.1 * gr.p; // the answer glows as its probability rises
  const c = io(range(t, B(52) + 0.15, B(54.2)));
  if (c > 0) { const end = top.clone().add(MACRO); pos = mix3(pos, end, c); look = mix3(look, top, c); fov = lerp(fov, 30, c); }
  const open = 1 - oc(range(t, B(44), B(44.6))); // the match from the chip: a twist as the grid becomes the field
  aim(camera, pos, look, fov + open * 10, open * 25 * D, 0.17 * io(range(t, B(46), B(48))) * (1 - c)); // the field moves right as the lines arrive
  blur = [0, 0];
  scene.fog.density = lerp(0.03, 0.22, c);
  ring7.lookAt(camera.position);
  T.all1.set(t, B(45), B(51.6)); T.amp.set(t, B(48), B(51.6));
  T.grover.set(t, B(45.5), `grover search   <i>·</i>   N = <b>256</b>   <i>·</i>   k = <b>${String(Math.min(KMAX, Math.floor(gr.k + 1e-6))).padStart(2, '0')}</b>`, { t1: B(51.6) });
  if (t > B(46) && t < B(52)) { const s = screenOf(v3(mx, Math.max(0.6, hm) + 0.15, mz)); T.prob.set(t, B(46), `P = <b>${gr.p.toFixed(3)}</b>`, { at: inFrame({ x: s.x + 22, y: Math.max(s.y - 30, 430) }, 260) }); }
  // the end card types beside the point, then clears so only the point is left for the loop
  T.end.set(t, B(54.5), Bf(58.6));
  T.credit.set(t, B(55.5), 'a quantum computing reel', { t1: Bf(58.6) });
  T.credit2.set(t, B(56), 'motion, 3D, type & sound <i>·</i> <b>Claude</b>', { t1: Bf(58.6) });
}
// t ≥ 29.5: the same composition as frame 0 (S1's macro on the breathing point) so the loop is seamless.
function tail(t) { s1(t - 30); }

const SHOT_FNS = { 0: s1, 16: s1, 20: s3, 28: s4, 36: s5, 44: s6, 52: s6 };
const MIN_SHOT = 1.0;
CUTS.forEach((c, i) => { const len = (i + 1 < CUTS.length ? B(CUTS[i + 1]) : 30) - B(c); if (len < MIN_SHOT) throw new Error(`shot at beat ${c} lasts ${len.toFixed(2)} s`); });

const TITTLE = { tx: 0, ty: 0, d: 0 };
window.ready = (async () => {
  await Promise.all(['italic 100px Serif', '100px Serif', '400 22px Mono', '500 22px Mono', '400 22px MonoGreek'].map((f) => document.fonts.load(f)));
  // Measure the last "i" of the title (no transform applied yet): its box centre gives x; the tittle sits at 0.24 em
  // below the top of the em box on Instrument Serif italic, shifted right by the italic slant.
  const r = document.createRange(), node = titleA.firstChild, i = TITLE.lastIndexOf('i');
  r.setStart(node, i); r.setEnd(node, i + 1);
  const box = r.getBoundingClientRect(), stage = document.getElementById('stage').getBoundingClientRect(), k = stage.width / W;
  TITTLE.tx = (box.left - stage.left) / k + box.width / k * TIT_X; TITTLE.ty = (box.top - stage.top) / k + TS * TIT_Y; TITTLE.d = TS * 0.1;
  renderer.compile(scene, camera);
})();

window.seek = (t) => {
  hideAll();
  world.split = 0; blur = [0, 0];
  if (t >= 29.5) tail(t);
  else { let i = CUTS.length - 1; while (i > 0 && t < B(CUTS[i])) i--; SHOT_FNS[CUTS[i]](t); }
  // finish: whip blur (in UV units), seeded grain per frame
  finish.uniforms.uBlur.value.set(blur[0], blur[1]);
  finish.uniforms.uTaps.value = Math.hypot(blur[0], blur[1]) > 0.002 ? 24 : 1;
  finish.uniforms.uSeed.value = Math.round(t * 30) % 977;
  composer.render();
};
