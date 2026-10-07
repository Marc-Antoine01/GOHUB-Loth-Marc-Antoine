// Loop earplugs in 3D, modelled on the shop's studio photos (assets/cut). One unit = the ring's outer radius.
// Every model is built along the same axes: the ring faces +z (camera), the nozzle and ear tip point to -z (into the ear).
import * as THREE from 'three';

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

// Materials per finish. Metals get their colour from the environment reflections, silicones are soft and slightly translucent.
export function finish(kind, color, opts = {}) {
  const c = new THREE.Color(color);
  switch (kind) {
    case 'metal': return new THREE.MeshPhysicalMaterial({ color: c, metalness: 1, roughness: opts.rough ?? 0.16, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 1.25 });
    case 'gloss': return new THREE.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 });
    case 'matte': return new THREE.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.55, sheen: 0.6, sheenRoughness: 0.5, sheenColor: c.clone().lerp(new THREE.Color('#fff'), 0.4) });
    case 'clear': return new THREE.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, emissive: c, emissiveIntensity: 0.22, sheen: 1, sheenRoughness: 0.3, sheenColor: c.clone().lerp(new THREE.Color('#fff'), 0.6), envMapIntensity: 1.4 }); // jelly: lit from within, glossy skin
    case 'silicone': return new THREE.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.42, transmission: opts.trans ?? 0.35, thickness: 0.5, ior: 1.4, attenuationColor: c, attenuationDistance: 0.8, sheen: 0.4, sheenColor: new THREE.Color('#ffffff') });
  }
}

// Body: ONE continuous tube, like the real moulding. It starts under the ear tip, comes down the right side as the neck,
// joins the ring tangentially and runs a full turn around it, ending hidden inside the neck: the "9" silhouette.
function bodyPath({ R = 0.68 } = {}) {
  const a0 = 0.62; // the neck meets the ring here (radians from +x), arriving along the ring's own tangent
  const J = V(Math.cos(a0) * R, Math.sin(a0) * R * 1.06, 0), T = V(Math.sin(a0), -Math.cos(a0) * 1.06, 0).normalize();
  const pts = [V(-0.2, 1.42, -0.34), V(0.02, 1.3, -0.24), J.clone().addScaledVector(T, -0.55).add(V(0, 0, -0.08)), J.clone().addScaledVector(T, -0.25)];
  for (let i = 0; i <= 72; i++) {
    const a = a0 - (i / 72) * (Math.PI * 2 - 0.5); // clockwise, ends inside the neck
    pts.push(V(Math.cos(a) * R, Math.sin(a) * R * 1.06, 0));
  }
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}
function body(mat, dims) {
  const path = bodyPath(dims);
  const m = new THREE.Mesh(new THREE.TubeGeometry(path, 400, dims.r, 56, false), mat);
  // the open ends sit inside the tip and inside the neck; caps keep them solid from every angle
  const cap = new THREE.SphereGeometry(dims.r, 40, 28);
  for (const u of [0, 1]) { const c = new THREE.Mesh(cap, mat); c.position.copy(path.getPointAt(u)); m.add(c); }
  return { mesh: m, path };
}
// Ear tip: a soft dome pointing into the ear (-z), its skirt folding back over the neck; a dark sound port at the apex.
function tip(mat, { size = 0.56, at = V(-0.14, 1.54, -0.46), long = 1, dir = null } = {}) {
  const pts = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = u * Math.PI * 0.5;
    pts.push(new THREE.Vector2(0.09 + Math.sin(a) * (size - 0.09) * (1 + 0.06 * Math.sin(u * Math.PI)), (Math.cos(a) * size * 0.95) * long));
  }
  pts.push(new THREE.Vector2(size * 0.99, -0.08 * long), new THREE.Vector2(size * 0.9, -0.2 * long), new THREE.Vector2(size * 0.7, -0.24 * long));
  const grp = new THREE.Group();
  const g = new THREE.LatheGeometry(pts, 128);
  g.rotateX(-Math.PI / 2); // lathe axis y -> -z
  const dome = new THREE.Mesh(g, mat); grp.add(dome);
  const port = new THREE.Mesh(new THREE.CircleGeometry(0.09, 48), new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.8 }));
  port.position.z = -size * 0.95 * long + 0.004; port.rotation.y = Math.PI; grp.add(port);
  grp.position.copy(at);
  if (dir) grp.lookAt(at.clone().sub(dir)); // -z (the dome) points along dir
  else { grp.rotation.x = 0.35; grp.rotation.y = -0.15; }
  return grp;
}
// Switch 2: its ring holds a clear lens and the mode dial in the middle.
function dial(mat, { R = 0.7, r = 0.3 } = {}) {
  const grp = new THREE.Group();
  const rad = R - r * 0.75;
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, 0.22, 96), new THREE.MeshPhysicalMaterial({ color: '#16191b', metalness: 0.2, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03 })); // smoked lens
  lens.rotation.x = Math.PI / 2; grp.add(lens);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(rad * 0.62, 0.06, 16, 120), mat);
  collar.position.z = 0.04; grp.add(collar);
  const nub = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.1, 8, 16), mat);
  nub.position.set(0, rad * 0.4, 0.13); grp.add(nub);
  return grp;
}

// The range. Each entry: geometry recipe + materials. Colours sampled from the shop photos.
export const RANGE = {
  'switch2-emerald': { kind: 'switch', ring: ['metal', '#1d6a57', { rough: 0.2 }], insert: ['gloss', '#0d2c25'], tip: ['silicone', '#3f8e7a', { trans: 0.5 }] },
  'switch2-gold': { kind: 'switch', ring: ['metal', '#d7b06a'], insert: ['gloss', '#2a2116'], tip: ['silicone', '#e9d6a8', { trans: 0.5 }] },
  'switch2-silver': { kind: 'switch', ring: ['metal', '#d9dbdf'], insert: ['gloss', '#2b2d31'], tip: ['silicone', '#eceef0', { trans: 0.5 }] },
  'switch2-black': { kind: 'switch', ring: ['metal', '#2a2b2e', { rough: 0.25 }], insert: ['gloss', '#111'], tip: ['silicone', '#3a3b3e', { trans: 0.2 }] },
  'experience2-gold': { kind: 'experience', ring: ['metal', '#e2b955'], insert: ['gloss', '#151515'], tip: ['silicone', '#f2efe6', { trans: 0.55 }] },
  'experience2-silver': { kind: 'experience', ring: ['metal', '#e4e5e8'], insert: ['gloss', '#151515'], tip: ['silicone', '#f2f2f2', { trans: 0.55 }] },
  'experience2-black': { kind: 'experience', ring: ['metal', '#232325', { rough: 0.22 }], insert: ['gloss', '#0b0b0b'], tip: ['silicone', '#2e2e30', { trans: 0.15 }] },
  'experience2-rosegold': { kind: 'experience', ring: ['metal', '#e8ab97'], insert: ['gloss', '#151515'], tip: ['silicone', '#f6e6df', { trans: 0.55 }] },
  'quiet2-violet': { kind: 'quiet', ring: ['matte', '#a99ae0'], tip: ['matte', '#b2a5e6'] },
  'quiet2-mint': { kind: 'quiet', ring: ['matte', '#a8e2d2'], tip: ['matte', '#b5e8da'] },
  'quiet2-white': { kind: 'quiet', ring: ['matte', '#f1f1f1'], tip: ['matte', '#ffffff'] },
  'quiet2-black': { kind: 'quiet', ring: ['matte', '#2a2a2c'], tip: ['matte', '#333335'] },
  'engage2-rose': { kind: 'engage', ring: ['clear', '#f4a58c'], insert: ['matte', '#fbe3da'], tip: ['silicone', '#f7c2b1', { trans: 0.6 }] },
  'engage2-clear': { kind: 'engage', ring: ['clear', '#e9eef2'], insert: ['matte', '#ffffff'], tip: ['silicone', '#f4f6f8', { trans: 0.7 }] },
  'engage2-dusk': { kind: 'engage', ring: ['clear', '#8a8f99'], insert: ['matte', '#d8dadf'], tip: ['silicone', '#9da2ab', { trans: 0.6 }] },
  'kids2-berryblue': { kind: 'kids', ring: ['clear', '#8fc0f2'], insert: ['matte', '#e7f1fc'], tip: ['silicone', '#c79be6', { trans: 0.4 }] },
  'kids2-oceanorange': { kind: 'kids', ring: ['clear', '#f2a93b'], insert: ['matte', '#fde9c8'], tip: ['silicone', '#a9d3f2', { trans: 0.4 }] },
  'kids2-watermelon': { kind: 'kids', ring: ['clear', '#f5a1a6'], insert: ['matte', '#fde3e5'], tip: ['silicone', '#3fbf9c', { trans: 0.3 }] },
  'dream-lilac': { kind: 'dream', ring: ['matte', '#b9a3ea'], tip: ['silicone', '#c9b8f0', { trans: 0.3 }] },
  'dream-peach': { kind: 'dream', ring: ['matte', '#f4b98a'], tip: ['silicone', '#f7c9a3', { trans: 0.3 }] },
};

// Build one earplug. Returns a group whose origin is the ring centre; parts are named so shots can take it apart.
export function earplug(name) {
  const spec = RANGE[name];
  const M = (a) => finish(...a);
  const g = new THREE.Group(); g.name = name;
  const bodyMat = M(spec.ring), tipMat = M(spec.tip);
  if (spec.kind === 'dream') {
    // Loop Dream: a low-profile bean with no hole, the tip on its upper edge.
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), bodyMat);
    body.scale.set(0.78, 1.0, 0.46); body.position.y = 0.1; body.name = 'body'; g.add(body);
    const t = tip(tipMat, { size: 0.56, at: V(-0.08, 1.12, -0.4) }); t.name = 'tip'; g.add(t);
    return g;
  }
  const dims = { switch: { R: 0.68, r: 0.32 }, experience: { R: 0.68, r: 0.3 }, quiet: { R: 0.66, r: 0.33 }, engage: { R: 0.68, r: 0.3 }, kids: { R: 0.64, r: 0.29 } }[spec.kind];
  const { mesh, path } = body(bodyMat, dims); mesh.name = 'body'; g.add(mesh);
  // the tip sits on the start of the tube and points the way the neck was heading, tilted into the ear
  const p0 = path.getPointAt(0), d = p0.clone().sub(path.getPointAt(0.04)).normalize().lerp(V(0, 0, -1), 0.55).normalize();
  const t = tip(tipMat, { size: spec.kind === 'kids' ? 0.6 : 0.68, at: p0.clone().add(d.clone().multiplyScalar(0.22)), dir: d }); t.name = 'tip'; g.add(t);
  if (spec.kind === 'switch') { const d = dial(M(spec.insert), dims); d.name = 'dial'; g.add(d); }
  return g;
}
