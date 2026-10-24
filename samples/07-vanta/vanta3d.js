// VANTA Σ1 — procedural hypercar + studio stage (Three.js r160).
// Classic script (file:// cannot import local ES modules): call makeV3(THREE, addons) from a module script.
// The car is a lofted body built from profile curves (side, plan, section), sculpted per vertex:
// fender peaks, wheel arches, cockpit tub, side scallop. Canopy, wheels, lights, aero are separate meshes.
window.makeV3 = function (THREE, { RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, mergeGeometries, RoundedBoxGeometry }) {

const STILL = /HeadlessChrome/.test(navigator.userAgent) || location.hash === '#still';

/* ------------------------------------------------------------------ helpers */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const spow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
// monotone cubic interpolation through knots (no overshoot)
function mono(xs, ys) {
  const n = xs.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return x => {
    if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
// grid surface from fn(u,v)->[x,y,z]; v wraps around (closed section)
function loft(nu, nv, fn, uvs = [8, 3], closed = true) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const p = fn(i / nu, j / nv); pos.push(p[0], p[1], p[2]); uv.push(i / nu * uvs[0], j / nv * uvs[1]);
  }
  const r = nv + 1;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * r + j, b = a + r;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  if (!closed) return g;
  // weld normals across the v seam
  const n = g.attributes.normal;
  for (let i = 0; i <= nu; i++) {
    const a = i * r, b = i * r + nv;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  return g;
}

/* ------------------------------------------------------------------ textures */
function canvasTex(w, h, draw, { repeat = [1, 1], srgb = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let _flakeR, _flakeN, _carbon;
function flakeMaps() {
  if (_flakeR) return [_flakeR, _flakeN];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  _flakeR = canvasTex(256, 256, (x, w, h) => {
    const d = x.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const v = 95 + rnd() * 70; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
    x.putImageData(d, 0, 0);
  }, { repeat: [14, 10] });
  _flakeN = canvasTex(256, 256, (x, w, h) => {
    const d = x.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { d.data[i * 4] = 128 + (rnd() - .5) * 90; d.data[i * 4 + 1] = 128 + (rnd() - .5) * 90; d.data[i * 4 + 2] = 255; d.data[i * 4 + 3] = 255; }
    x.putImageData(d, 0, 0);
  }, { repeat: [14, 10] });
  return [_flakeR, _flakeN];
}
function carbonTex(rep = [6, 6]) {
  const t = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#0c0d10'; x.fillRect(0, 0, w, h);
    const s = 16;
    for (let i = 0; i < w / s; i++) for (let j = 0; j < h / s; j++) {
      const tw = (i + j) % 2;
      const g = x.createLinearGradient(i * s, j * s, i * s + (tw ? s : 0), j * s + (tw ? 0 : s));
      g.addColorStop(0, '#15171c'); g.addColorStop(.5, tw ? '#3a3e47' : '#262930'); g.addColorStop(1, '#101115');
      x.fillStyle = g; x.fillRect(i * s + 1, j * s + 1, s - 2, s - 2);
    }
  }, { repeat: rep, srgb: true });
  return t;
}

/* ------------------------------------------------------------------ materials */
const PAINTS = {
  void:    { name: 'Void Black',   hex: '#0a0c11', metal: .55, rough: .30, sheen: '#3a4a66' },
  cyan:    { name: 'Ion Cyan',     hex: '#0790a6', metal: .62, rough: .30 },
  magenta: { name: 'Magenta Flux', hex: '#a3127f', metal: .6,  rough: .30 },
  white:   { name: 'Arctic Pearl', hex: '#d9dfe7', metal: .25, rough: .26 },
  ember:   { name: 'Ember',        hex: '#c43a0b', metal: .6,  rough: .30 },
  volt:    { name: 'Volt',         hex: '#86a812', metal: .6,  rough: .30 },
  silver:  { name: 'Liquid Silver',hex: '#8c949e', metal: .9,  rough: .24 },
  violet:  { name: 'Ultraviolet',  hex: '#3b1fb0', metal: .65, rough: .28 }
};
function paintMat(key = 'void') {
  const p = PAINTS[key] || PAINTS.void, [r, n] = flakeMaps();
  return new THREE.MeshPhysicalMaterial({
    color: p.hex, metalness: p.metal, roughness: p.rough, roughnessMap: r, normalMap: n, normalScale: new THREE.Vector2(.12, .12),
    clearcoat: 1, clearcoatRoughness: .035, envMapIntensity: 1.25
  });
}
function setPaint(mat, key) {
  const p = PAINTS[key] || PAINTS.void;
  mat.color.set(p.hex); mat.metalness = p.metal; mat.roughness = p.rough; mat.needsUpdate = true;
}
const MAT = {};
function mats() {
  if (MAT.carbon) return MAT;
  MAT.carbon = new THREE.MeshPhysicalMaterial({ map: carbonTex([10, 10]), color: '#ffffff', metalness: .35, roughness: .45, clearcoat: .6, clearcoatRoughness: .18 });
  MAT.carbonFine = new THREE.MeshPhysicalMaterial({ map: carbonTex([3, 3]), metalness: .35, roughness: .38, clearcoat: 1, clearcoatRoughness: .08 });
  MAT.black = new THREE.MeshPhysicalMaterial({ color: '#050608', metalness: .2, roughness: .25, clearcoat: 1, clearcoatRoughness: .05 });
  MAT.satin = new THREE.MeshStandardMaterial({ color: '#0d0f13', metalness: .4, roughness: .6 });
  MAT.glass = new THREE.MeshPhysicalMaterial({ color: '#0b1a22', metalness: 0, roughness: .03, transmission: .55, thickness: .05, ior: 1.5,
    clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.8, specularIntensity: 1, attenuationColor: new THREE.Color('#0a3c48'), attenuationDistance: .6 });
  MAT.rubber = new THREE.MeshStandardMaterial({ color: '#08090a', metalness: 0, roughness: .78, envMapIntensity: .45 });
  MAT.rimDark = new THREE.MeshPhysicalMaterial({ color: '#23272e', metalness: 1, roughness: .22, clearcoat: .6 });
  MAT.rimSilver = new THREE.MeshPhysicalMaterial({ color: '#c3cad3', metalness: 1, roughness: .14, clearcoat: .6 });
  MAT.rimBronze = new THREE.MeshPhysicalMaterial({ color: '#6b5236', metalness: 1, roughness: .26, clearcoat: .6 });
  MAT.chrome = new THREE.MeshStandardMaterial({ color: '#e8edf2', metalness: 1, roughness: .08 });
  MAT.alu = new THREE.MeshStandardMaterial({ color: '#9aa1aa', metalness: 1, roughness: .35 });
  MAT.disc = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: .55, roughness: .55,
    map: canvasTex(256, 256, (x, w, h) => {
      x.fillStyle = '#3d3f44'; x.fillRect(0, 0, w, h);
      for (let k = 0; k < 2600; k++) { x.fillStyle = `rgba(${Math.random() < .5 ? '20,20,24' : '90,92,98'},.25)`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      x.fillStyle = '#0a0a0c';
      for (let a = 0; a < 36; a++) for (let r = 0; r < 3; r++) {
        const ang = a / 36 * Math.PI * 2 + r * .06, rad = (.62 + r * .1) * w / 2;
        x.beginPath(); x.arc(w / 2 + Math.cos(ang) * rad, h / 2 + Math.sin(ang) * rad, 2.6, 0, 7); x.fill();
      }
    }, { srgb: true }) });
  MAT.seat = new THREE.MeshStandardMaterial({ color: '#15171c', roughness: .7, metalness: .1 });
  MAT.seatTrim = new THREE.MeshStandardMaterial({ color: '#00e5ff', emissive: '#00e5ff', emissiveIntensity: .4, roughness: .5 });
  return MAT;
}
function glowMat(color, k = 3) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
}

/* ------------------------------------------------------------------ body profiles (metres, +x = nose) */
const X0 = -2.32, X1 = 2.30;
const KX = [-2.32, -2.15, -1.80, -1.33, -0.80, -0.30, 0.30, 0.90, 1.42, 1.90, 2.15, 2.30];
const YT = mono(KX, [0.80, 0.85, 0.87, 0.87, 0.84, 0.78, 0.77, 0.73, 0.66, 0.56, 0.46, 0.40]);
const YB = mono(KX, [0.34, 0.27, 0.17, 0.13, 0.12, 0.12, 0.12, 0.12, 0.13, 0.14, 0.15, 0.17]);
const YC = mono(KX, [0.58, 0.56, 0.53, 0.52, 0.48, 0.46, 0.46, 0.47, 0.48, 0.42, 0.34, 0.30]);
const HW = mono(KX, [0.90, 0.98, 1.01, 1.02, 0.97, 0.93, 0.94, 0.97, 0.99, 0.96, 0.88, 0.80]);
const FD = mono(KX, [0.00, 0.03, 0.07, 0.09, 0.05, 0.02, 0.03, 0.08, 0.15, 0.11, 0.05, 0.00]);
const WHEELS = [
  { x: 1.42, r: 0.355, w: 0.27, ra: 0.41 },
  { x: -1.33, r: 0.37, w: 0.33, ra: 0.43 }
];
const hwAt = x => HW(x) + WHEELS.reduce((s, w) => s + 0.035 * Math.exp(-(((x - w.x) / 0.5) ** 2)), 0);
WHEELS.forEach(w => { w.z = hwAt(w.x) - w.w / 2 - 0.035; });

// raw section point; th: -PI/2 bottom, 0 = +z side, PI/2 top
function bodyPoint(x, th, sculpt = true) {
  const c = Math.cos(th), s = Math.sin(th);
  const tn = clamp((x - (X1 - 0.34)) / 0.34, 0, 1), tr = clamp(((X0 + 0.16) - x) / 0.16, 0, 1);
  const tnv = clamp((x - (X1 - 0.12)) / 0.12, 0, 1);
  const eP = Math.min(Math.pow(1 - Math.pow(tn, 2.4), 1 / 2.4), Math.pow(1 - Math.pow(tr, 3), 1 / 3));
  const eV = Math.min(Math.sqrt(1 - tnv * tnv), Math.pow(1 - Math.pow(tr, 3), 1 / 3));
  const hw = hwAt(x) * eP, yt = YT(x), yb = YB(x), yc = YC(x);
  let z = hw * spow(c, 2 / 3.4);
  z *= 1 - 0.13 * Math.pow(Math.max(0, s), 1.4) - 0.07 * Math.pow(Math.max(0, -s), 1.6);
  let y = s >= 0 ? yc + (yt - yc) * Math.pow(s, 2 / 3.6) : yc - (yc - yb) * Math.pow(-s, 2 / 7);
  if (s > 0) { const t = Math.abs(z) / (hw + 1e-6); y += FD(x) * Math.exp(-(((t - 0.8) / 0.2) ** 2)) * Math.min(1, s * 2.4); }
  y = yc + (y - yc) * eV;
  if (!sculpt) return [x, y, z];
  // side scallop feeding the rear-motor intake
  const bx = x > -1.0 && x < -0.2 ? Math.sin(Math.PI * (x + 1.0) / 0.8) ** 2 : 0;
  if (bx) z -= Math.sign(z) * 0.085 * bx * Math.exp(-(((s - 0.02) / 0.3) ** 2)) * Math.abs(c);
  // cockpit tub under the canopy
  const ck = sstep(-0.95, -0.55, x) * (1 - sstep(0.55, 0.95, x));
  if (ck && s > 0) { const cw = 0.5; const wz = 1 - sstep(cw - 0.12, cw, Math.abs(z)); y = lerp(y, Math.min(y, 0.5), ck * wz); }
  // wheel arches
  for (const w of WHEELS) {
    const dx = x - w.x;
    if (Math.abs(dx) < w.ra) {
      const ya = w.r + Math.sqrt(w.ra * w.ra - dx * dx), zIn = w.z - w.w / 2 - 0.05;
      const k = sstep(zIn - 0.05, zIn + 0.02, Math.abs(z));
      if (y < ya && s < 0.8) y = lerp(y, ya, k);
    }
  }
  return [x, y, z];
}
const easeEnds = u => 0.5 - 0.5 * Math.cos(Math.PI * u);
const bodyFn = (u, v) => { const x = lerp(X0, X1, lerp(u, easeEnds(u), 0.55)); return bodyPoint(x, v * Math.PI * 2 - Math.PI / 2); };

// canopy: teardrop bubble sunk into the tub; front part glass, rear part body colour
const CX = [-1.80, -1.30, -0.80, -0.30, 0.10, 0.50, 0.85, 1.02];
const CT = mono(CX, [0.88, 0.97, 1.06, 1.13, 1.15, 1.06, 0.88, 0.74]);
const CW = mono(CX, [0.22, 0.40, 0.52, 0.58, 0.58, 0.56, 0.50, 0.40]);
const CB = 0.62;
function canopyPoint(x, th) {
  const c = Math.cos(th), s = Math.sin(th);
  const tn = clamp((x - (1.02 - 0.12)) / 0.12, 0, 1), tr = clamp(((-1.80 + 0.3) - x) / 0.3, 0, 1);
  const e = Math.min(Math.sqrt(1 - tn * tn), Math.pow(1 - Math.pow(tr, 2), 0.5));
  const w = CW(x) * Math.max(e, 0.0), top = CT(x);
  const z = w * spow(c, 2 / 2.8) * (1 - 0.2 * Math.pow(Math.max(0, s), 1.5));
  const y = s >= 0 ? CB + (top - CB) * Math.pow(s, 2 / 2.4) : CB - 0.12 * Math.pow(-s, 0.5);
  return [x, lerp(CB, y, Math.max(e, 0.0001) ** 0.3), z];
}

/* ------------------------------------------------------------------ wheel */
function lathe(profile, seg = 64) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  g.rotateX(Math.PI / 2); // lathe axis Y -> Z
  return g;
}
function spokeGeo(r0, r1, w0, w1, sweep, depth, dish) {
  const sh = new THREE.Shape();
  sh.moveTo(-w0 / 2, r0); sh.lineTo(w0 / 2, r0);
  sh.quadraticCurveTo(w1 / 2 + sweep * .4, (r0 + r1) / 2, w1 / 2 + sweep, r1);
  sh.lineTo(-w1 / 2 + sweep, r1);
  sh.quadraticCurveTo(-w0 / 2 + sweep * .4, (r0 + r1) / 2, -w0 / 2, r0);
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: .006, bevelSize: .005, bevelSegments: 2, curveSegments: 6 });
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)); p.setZ(i, p.getZ(i) - dish * (1 - clamp((r - r0) / (r1 - r0), 0, 1)) ** 1.4); }
  g.computeVertexNormals();
  return g;
}
function buildWheel({ r = .355, w = .27, rim = 'blade', rimMat, caliper = '#ff2bd6', side = 1 } = {}) {
  const M = mats();
  const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
  const rr = r * 0.72, hw = w / 2;
  // tyre with rounded shoulders and bulged sidewall
  const tp = [];
  tp.push([rr + .004, -hw + .01]);
  for (let i = 0; i <= 6; i++) { const t = i / 6; tp.push([lerp(rr + .01, r - .028, t), -hw - .006 * Math.sin(Math.PI * t)]); }
  for (let i = 1; i <= 6; i++) { const a = -Math.PI / 2 + i / 6 * Math.PI / 2; tp.push([r - .028 + .028 * Math.cos(a), -hw + .028 + .028 * Math.sin(a)]); }
  for (let i = 1; i <= 5; i++) tp.push([r + .002 * Math.sin(Math.PI * i / 6), -hw + .028 + (w - .056) * i / 6]);
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; tp.push([r - .028 + .028 * Math.cos(a), hw - .028 + .028 * Math.sin(a)]); }
  for (let i = 1; i <= 6; i++) { const t = i / 6; tp.push([lerp(r - .028, rr + .01, t), hw + .006 * Math.sin(Math.PI * t)]); }
  tp.push([rr + .004, hw - .01]);
  const tyre = new THREE.Mesh(lathe(tp, 72), M.rubber); spin.add(tyre);
  // tread grooves (dark rings)
  for (const k of [-.3, 0, .3]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r + .0005, .006, 4, 72), MAT.black); ring.position.z = k * w; ring.scale.z = 1; spin.add(ring); }
  // rim barrel + polished lip
  const rm = rimMat || M.rimDark;
  const barrel = new THREE.Mesh(lathe([[rr - .012, -hw + .015], [rr - .012, hw - .03], [rr + .004, hw - .018], [rr + .006, hw - .004], [rr - .006, hw + .002], [rr - .02, hw - .01]], 64), rm);
  spin.add(barrel);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(rr + .001, .0065, 8, 72), M.chrome); lip.position.z = hw - .004; spin.add(lip);
  // brake disc + hat
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(rr * .82, rr * .82, .034, 56), M.disc); disc.rotation.x = Math.PI / 2; disc.position.z = hw - .14; spin.add(disc);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(rr * .38, rr * .42, .05, 36), M.alu); hat.rotation.x = Math.PI / 2; hat.position.z = hw - .115; spin.add(hat);
  // spokes
  const face = new THREE.Group(); face.position.z = hw - .035; spin.add(face);
  const r0 = .062, r1 = rr - .006, parts = [];
  if (rim === 'blade') for (let i = 0; i < 10; i++) { const s = spokeGeo(r0, r1, .036, .02, .035, .022, .055); s.rotateZ(i / 10 * Math.PI * 2); parts.push(s); }
  if (rim === 'forged') for (let i = 0; i < 5; i++) for (const d of [-1, 1]) { const s = spokeGeo(r0, r1, .05, .026, .042 * d, .03, .06); s.rotateZ(i / 5 * Math.PI * 2); parts.push(s); }
  if (rim === 'aero') {
    const disk = new THREE.LatheGeometry([new THREE.Vector2(r1, -.05), new THREE.Vector2(r1 - .01, -.04), new THREE.Vector2(.12, -.012), new THREE.Vector2(.06, .0)], 64);
    disk.rotateX(Math.PI / 2);
    const dm = M.carbonFine.clone(); dm.side = THREE.DoubleSide; face.add(new THREE.Mesh(disk, dm));
    for (let i = 0; i < 7; i++) { const s = spokeGeo(.09, r1 - .01, .012, .012, .07, .012, .03); s.rotateZ(i / 7 * Math.PI * 2); s.translate(0, 0, .002); parts.push(s); }
  }
  if (parts.length) face.add(new THREE.Mesh(mergeGeometries(parts), rm));
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.066, .07, .05, 40), rm); hub.rotation.x = Math.PI / 2; hub.position.z = -.02; face.add(hub);
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(.034, .034, .04, 6), M.chrome); nut.rotation.x = Math.PI / 2; nut.position.z = .016; face.add(nut);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .006, 24), glowMat('#00e5ff', 1.6)); cap.rotation.x = Math.PI / 2; cap.position.z = .038; face.add(cap);
  // caliper (static)
  const cs = new THREE.Shape(); const a0 = .25, a1 = 1.25, ri = rr * .5, ro = rr * .9;
  cs.absarc(0, 0, ro, a0, a1, false); cs.absarc(0, 0, ri, a1, a0, true);
  const cg = new THREE.ExtrudeGeometry(cs, { depth: .07, bevelEnabled: true, bevelThickness: .012, bevelSize: .01, bevelSegments: 3, curveSegments: 24 });
  const calMat = new THREE.MeshPhysicalMaterial({ color: caliper, metalness: .3, roughness: .32, clearcoat: 1, clearcoatRoughness: .1 });
  const cal = new THREE.Mesh(cg, calMat); cal.position.z = hw - .175; g.add(cal);
  g.userData = { spin, face, calMat, rimMat: rm, r, w };
  if (side < 0) g.rotation.y = Math.PI;
  return g;
}

/* ------------------------------------------------------------------ light strip along body surface */
function surfNormal(x, th) {
  const e = 1e-3, p = bodyPoint(x, th, false), px = bodyPoint(x + e, th, false), pt = bodyPoint(x, th + e, false);
  const a = new THREE.Vector3(px[0] - p[0], px[1] - p[1], px[2] - p[2]), b = new THREE.Vector3(pt[0] - p[0], pt[1] - p[1], pt[2] - p[2]);
  return a.cross(b).normalize();
}
function stripCurve(xa, xb, th, off = .006, n = 26) {
  const pts = [];
  const side = (sgn, rev) => {
    for (let i = 0; i <= n; i++) {
      const t = rev ? 1 - i / n : i / n, x = lerp(xa, xb, t ** 0.7), thh = sgn > 0 ? th : Math.PI - th;
      const p = bodyPoint(x, thh, false), nn = surfNormal(x, thh);
      pts.push(new THREE.Vector3(p[0], p[1], p[2]).addScaledVector(nn, off));
    }
  };
  side(1, false); side(-1, true);
  return new THREE.CatmullRomCurve3(pts);
}

/* ------------------------------------------------------------------ the car */
function buildCar({ paint = 'void', rim = 'blade', caliper = '#ff2bd6', head = '#bff8ff', tail = '#ff1f6a', detail = 1 } = {}) {
  const M = mats();
  const car = new THREE.Group();
  const paintM = paintMat(paint);
  const shell = new THREE.Group(); car.add(shell); // everything that lifts in the exploded view
  const BAND = 0.205; // lower body (sills, arches, nose lip, diffuser) in exposed carbon
  const body = new THREE.Mesh(loft(260, 120, (u, v) => bodyFn(u, lerp(BAND, 1 - BAND, v)), [10, 4], false), paintM); shell.add(body);
  const under = new THREE.Mesh(loft(260, 44, (u, v) => bodyFn(u, lerp(1 - BAND, 1 + BAND, v)), [40, 3], false), M.carbon); shell.add(under);
  // canopy split in glass (front) and painted spine (rear)
  const cFn = (x0, x1) => (u, v) => canopyPoint(lerp(x0, x1, u), v * Math.PI * 2 - Math.PI / 2);
  const glass = new THREE.Mesh(loft(90, 72, cFn(-0.78, 1.02)), M.glass); shell.add(glass);
  const spine = new THREE.Mesh(loft(70, 72, cFn(-1.80, -0.76)), paintM); shell.add(spine);
  // engine louvres on the spine
  for (let i = 0; i < 6; i++) {
    const x = -1.0 - i * 0.11, p = canopyPoint(x, Math.PI / 2);
    const l = new THREE.Mesh(new RoundedBoxGeometry(.05, .02, CW(x) * 1.1, 2, .008), M.black); l.position.set(x, p[1] + .004, 0); l.rotation.z = -.18; shell.add(l);
  }
  // A-pillar / canopy frame: thin dark band where glass meets spine
  const band = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 25 }, (_, i) => { const th = -0.35 + i / 24 * (Math.PI + 0.7); const p = canopyPoint(-0.77, th); return new THREE.Vector3(p[0], p[1], p[2]); })), 40, .018, 6), M.black);
  shell.add(band);
  // interior: seats, dash, wheel
  const interior = new THREE.Group(); shell.add(interior);
  for (const z of [-.28, .28]) {
    const seat = new THREE.Mesh(new RoundedBoxGeometry(.5, .1, .42, 4, .04), M.seat); seat.position.set(-0.2, .42, z); interior.add(seat);
    const back = new THREE.Mesh(new RoundedBoxGeometry(.1, .6, .42, 4, .04), M.seat); back.position.set(-0.48, .72, z); back.rotation.z = -.45; interior.add(back);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(.012, .5, .02), M.seatTrim); trim.position.set(-0.44, .74, z); trim.rotation.z = -.45; interior.add(trim);
  }
  const dash = new THREE.Mesh(new RoundedBoxGeometry(.3, .16, 1.0, 3, .05), M.carbonFine); dash.position.set(0.55, .66, 0); interior.add(dash);
  const sw = new THREE.Mesh(new THREE.TorusGeometry(.13, .018, 8, 32), M.satin); sw.position.set(0.3, .74, .28); sw.rotation.y = Math.PI / 2; sw.rotation.x = .4; interior.add(sw);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(.36, .1), glowMat('#00e5ff', .9)); screen.position.set(0.44, .76, 0); screen.rotation.y = -Math.PI / 2; screen.rotation.x = 0; interior.add(screen);

  // light bars
  const headHousing = new THREE.Mesh(new THREE.TubeGeometry(stripCurve(X1 - 0.44, X1 - 0.004, 0.16, -.004), 160, .024, 8), M.black); shell.add(headHousing);
  const headBar = new THREE.Mesh(new THREE.TubeGeometry(stripCurve(X1 - 0.42, X1 - 0.004, 0.16, .016), 160, .0095, 8), glowMat(head, 5)); shell.add(headBar);
  const drlC = stripCurve(X1 - 0.30, X1 - 0.004, -0.12, .006);
  const drl = new THREE.Mesh(new THREE.TubeGeometry(drlC, 120, .004, 6), glowMat(head, 2)); shell.add(drl);
  const tailHousing = new THREE.Mesh(new THREE.TubeGeometry(stripCurve(X0 + 0.17, X0 + 0.0005, 0.42, -.006), 160, .034, 8), M.black); shell.add(tailHousing);
  const tailBar = new THREE.Mesh(new THREE.TubeGeometry(stripCurve(X0 + 0.16, X0 + 0.0005, 0.42, .02), 160, .011, 8), glowMat(tail, 7)); shell.add(tailBar);
  // nose intakes: dark slots under the light bar
  const intakeC = stripCurve(X1 - 0.34, X1 - 0.006, -0.42, .002);
  const intake = new THREE.Mesh(new THREE.TubeGeometry(intakeC, 120, .035, 8), M.black); intake.scale.set(1, 1, 1); shell.add(intake);

  // aero: splitter, side blades, diffuser, wing, mirrors
  const aero = new THREE.Group(); shell.add(aero);
  const sp = new THREE.Shape(), spPts = [];
  for (let i = 0; i <= 40; i++) { const x = lerp(1.82, X1 - .002, i / 40); spPts.push([x + .035 * (i / 40) ** 3, bodyPoint(x, -0.25, false)[2] + .012]); }
  sp.moveTo(1.82, -spPts[0][1]); spPts.forEach(([x, z]) => sp.lineTo(x, -z)); spPts.slice().reverse().forEach(([x, z]) => sp.lineTo(x, z)); sp.lineTo(1.82, -spPts[0][1]);
  const splitter = new THREE.Mesh(new THREE.ExtrudeGeometry(sp, { depth: .022, bevelEnabled: true, bevelSize: .006, bevelThickness: .004, bevelSegments: 1 }), M.carbon);
  splitter.rotation.x = Math.PI / 2; splitter.position.y = .16; aero.add(splitter);
  for (const s of [-1, 1]) {
    const blade = new THREE.Mesh(new RoundedBoxGeometry(1.5, .035, .06, 2, .012), M.carbon);
    blade.position.set(0.05, .13, s * (bodyPoint(0.05, -0.3, false)[2] * Math.sign(s) - 0.0)); aero.add(blade);
    // camera mirror pod
    const arm = new THREE.Mesh(new RoundedBoxGeometry(.06, .02, .2, 2, .008), M.black); arm.position.set(0.72, .82, s * .6); aero.add(arm);
    const pod = new THREE.Mesh(new RoundedBoxGeometry(.16, .06, .06, 3, .025), paintM); pod.position.set(0.7, .83, s * .7); aero.add(pod);
    // wing endplates & swan necks
    const neck = new THREE.Mesh(new RoundedBoxGeometry(.13, .26, .02, 2, .008), M.carbon); neck.position.set(-2.0, 1.02, s * .42); neck.rotation.z = -.5; aero.add(neck);
    const plate = new THREE.Mesh(new RoundedBoxGeometry(.4, .14, .014, 2, .006), M.carbon); plate.position.set(-2.04, 1.15, s * .86); aero.add(plate);
  }
  // wing: aerofoil extruded across the width
  const af = new THREE.Shape(); const ch = .40;
  af.moveTo(0, 0);
  for (let i = 0; i <= 24; i++) { const t = i / 24, yt = .12 * ch * 5 * (.2969 * Math.sqrt(t) - .126 * t - .3516 * t * t + .2843 * t ** 3 - .1015 * t ** 4); af.lineTo(t * ch, yt + .03 * Math.sin(Math.PI * t)); }
  for (let i = 24; i >= 0; i--) { const t = i / 24, yt = .12 * ch * 5 * (.2969 * Math.sqrt(t) - .126 * t - .3516 * t * t + .2843 * t ** 3 - .1015 * t ** 4); af.lineTo(t * ch, -yt * .6 + .03 * Math.sin(Math.PI * t)); }
  const wingG = new THREE.ExtrudeGeometry(af, { depth: 1.7, bevelEnabled: false, curveSegments: 4 }); wingG.translate(-ch, 0, -.85);
  const wing = new THREE.Mesh(wingG, M.carbon); wing.position.set(-1.85, 1.16, 0); wing.rotation.z = .08; aero.add(wing);
  const wingLight = new THREE.Mesh(new THREE.BoxGeometry(.006, .006, 1.6), glowMat(tail, 3)); wingLight.position.set(-2.25, 1.165, 0); aero.add(wingLight);
  // diffuser fins
  for (let i = -3; i <= 3; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.42, .14, .012), M.carbon); f.position.set(-2.02, .22, i * .2); f.rotation.z = -.32; aero.add(f); }
  const dif = new THREE.Mesh(new THREE.BoxGeometry(.5, .015, 1.4), M.carbon); dif.position.set(-1.98, .17, 0); dif.rotation.z = -.32; aero.add(dif);

  // wheels
  const wheels = [];
  for (const W of WHEELS) for (const s of [1, -1]) {
    const wh = buildWheel({ r: W.r, w: W.w, rim, caliper, side: s });
    wh.position.set(W.x, W.r, s * W.z); car.add(wh); wheels.push(wh);
  }
  const api = {
    group: car, shell, body, glass, spine, wheels, paintM, interior, aero,
    setPaint(k) { setPaint(paintM, k); },
    setCaliper(c) { wheels.forEach(w => w.userData.calMat.color.set(c)); },
    setRim(type, mat) {
      wheels.forEach((w, i) => {
        const W = WHEELS[i >> 1], s = i % 2 ? -1 : 1, nw = buildWheel({ r: W.r, w: W.w, rim: type, rimMat: mat, caliper: '#' + w.userData.calMat.color.getHexString(), side: s });
        nw.position.copy(w.position); car.remove(w); car.add(nw); wheels[i] = nw;
      });
    },
    spin(a) { wheels.forEach((w, i) => { w.userData.spin.rotation.z = -a; }); }
  };
  return api;
}


/* ------------------------------------------------------------------ exploded chassis: tub, structural pack of instanced cells, 4 motors */
function buildChassis({ glowCells = .14 } = {}) {
  const M = mats(), g = new THREE.Group();
  const tub = new THREE.Group(); g.add(tub);
  const t1 = new THREE.Mesh(new RoundedBoxGeometry(1.95, .5, 1.36, 6, .14), M.carbonFine); t1.position.set(0.05, .5, 0); tub.add(t1);
  const t2 = new THREE.Mesh(new RoundedBoxGeometry(.9, .32, .9, 5, .1), M.carbonFine); t2.position.set(1.4, .42, 0); tub.add(t2);
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(.5, .045, 10, 40, Math.PI), M.carbonFine); hoop.position.set(-0.75, .72, 0); hoop.rotation.y = Math.PI / 2; tub.add(hoop);
  const sub = new THREE.Group(); tub.add(sub);
  for (const z of [-.45, .45]) for (const y of [.32, .62]) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.25, 10), M.alu); tube.rotation.z = Math.PI / 2; tube.position.set(-1.55, y, z); sub.add(tube);
  }
  // battery pack: 16 modules x 176 cells, instanced
  const pack = new THREE.Group(); g.add(pack);
  const base = new THREE.Mesh(new RoundedBoxGeometry(2.3, .04, 1.3, 2, .015), M.alu); base.position.set(0.05, .16, 0); pack.add(base);
  const cellGeo = new THREE.CylinderGeometry(.0105, .0105, .07, 8, 1);
  const nx = 8, nz = 22, cols = 8, rows = 2, cold = [], hot = [];
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const mx = -0.95 + c * .275, mz = r ? .31 : -.31;
    const frame = new THREE.Mesh(new RoundedBoxGeometry(.25, .085, .6, 2, .01), new THREE.MeshPhysicalMaterial({ color: '#0b1a22', metalness: .2, roughness: .2, transparent: true, opacity: .45, clearcoat: 1 }));
    frame.position.set(mx, .225, mz); pack.add(frame);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(.25, .006, .012), glowMat('#00e5ff', 2.2)); bar.position.set(mx, .27, mz + (r ? .3 : -.3)); pack.add(bar);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const p = [mx - .1 + i * .0286, .225, mz - .27 + j * .0257];
      (rnd() < glowCells * (1.2 - Math.abs(c - 3.5) / 4) ? hot : cold).push(p);
    }
  }
  const inst = (list, mat) => { const im = new THREE.InstancedMesh(cellGeo, mat, list.length), m4 = new THREE.Matrix4(); list.forEach((p, i) => im.setMatrixAt(i, m4.makeTranslation(...p))); return im; };
  const cells = inst(cold, new THREE.MeshStandardMaterial({ color: '#2a3848', metalness: .8, roughness: .28 }));
  pack.add(inst(hot, glowMat('#00e5ff', 2.4)));
  pack.add(cells);
  // motors at each wheel + half shafts
  const motors = new THREE.Group(); g.add(motors);
  const copper = new THREE.MeshStandardMaterial({ color: '#b8643a', metalness: 1, roughness: .32 });
  for (const W of WHEELS) for (const s of [1, -1]) {
    const m = new THREE.Group(); m.position.set(W.x, W.r, s * (W.z - .42)); motors.add(m);
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .13, 40), M.alu); housing.rotation.x = Math.PI / 2; m.add(housing);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(.15, .03, 10, 40), copper); coil.position.z = s * .07; m.add(coil);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.172, .006, 6, 48), glowMat('#ff2bd6', 3)); ring.position.z = s * .069; m.add(ring);
    for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.012, .06, .14), M.alu); const a = i / 12 * Math.PI * 2; f.position.set(Math.cos(a) * .18, Math.sin(a) * .18, 0); f.rotation.z = a; m.add(f); }
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .3, 10), M.chrome); shaft.rotation.x = Math.PI / 2; shaft.position.z = s * .2; m.add(shaft);
    // wishbones
    for (const y of [-.12, .16]) { const wb = new THREE.Mesh(new RoundedBoxGeometry(.36, .025, .3, 2, .01), M.satin); wb.position.set(0, y, s * .2); m.add(wb); }
  }
  return { group: g, tub, pack, motors, cells };
}

/* ------------------------------------------------------------------ studio */
function studioEnv(renderer, { tint = ['#00e5ff', '#ff2bd6'], room = false, k = 1 } = {}) {
  const pm = new THREE.PMREMGenerator(renderer);
  let scene;
  if (room) { scene = new RoomEnvironment(renderer); }
  else {
    scene = new THREE.Scene(); scene.background = new THREE.Color('#020306');
    const geo = new THREE.PlaneGeometry(1, 1);
    const add = (color, int, w, h, pos, look) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(int * k), side: THREE.DoubleSide }));
      m.scale.set(w, h, 1); m.position.set(...pos); m.lookAt(...look); scene.add(m);
    };
    add('#ffffff', 5, 12, 2.6, [0, 7, 0], [0, 0, 0]);          // overhead softbox
    add('#ffffff', 3, 1.2, 9, [-2, 6.5, 2.5], [0, 0, 0]);      // cross strip
    add('#eaf9ff', 3.4, 16, .45, [0, 2.2, 7], [0, 1, 0]);       // long side strips -> crisp lines in the paint
    add('#eaf9ff', 2.6, 16, .35, [0, 3.6, 7.5], [0, 1, 0]);
    add('#eaf9ff', 3.4, 16, .45, [0, 2.2, -7], [0, 1, 0]);
    add(tint[0], 6, 6, 4, [-8, 2, 3], [0, 1, 0]);             // coloured rims
    add(tint[1], 5, 6, 4, [8, 2, -3], [0, 1, 0]);
    add('#ffffff', 1.1, 4, 3, [9, 3, 4], [0, 1, 0]);            // front key
    add('#1a2233', 1, 40, 40, [0, -0.5, 0], [0, 1, 0]);         // faint floor bounce
  }
  const t = pm.fromScene(scene, 0.03).texture; pm.dispose();
  return t;
}
function radialTex(stops, size = 256, sy = 1) {
  return canvasTex(size, size, (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h);
  }, { srgb: false });
}
// soft contact shadow + translucent glossy floor + mirrored twin for the reflection
function addFloor(scene, root, { radius = 9, grid = true, color = '#05070d', opacity = .8, shadow = 1, edge = true } = {}) {
  // mirrored twin under a translucent floor = the reflection; kept in sync with the live model every frame
  let twin, src = [], dst = [];
  const reclone = () => {
    if (twin) scene.remove(twin);
    twin = root.clone(true); scene.add(twin); src = []; dst = [];
    root.traverse(o => src.push(o)); twin.traverse(o => dst.push(o));
  };
  reclone();
  const sync = () => {
    let n = 0; root.traverse(() => n++);
    if (n !== src.length) reclone();
    for (let i = 1; i < src.length; i++) { const a = src[i], b = dst[i]; b.position.copy(a.position); b.quaternion.copy(a.quaternion); b.scale.copy(a.scale); b.visible = a.visible; }
    twin.position.set(root.position.x, -root.position.y - .002, root.position.z); twin.quaternion.copy(root.quaternion); twin.scale.set(root.scale.x, -root.scale.y, root.scale.z);
  };
  const prev = scene.onBeforeRender; scene.onBeforeRender = (...a) => { if (prev) prev(...a); sync(); };
  const alpha = edge ? radialTex([[0, '#d0d0d0'], [.45, '#e0e0e0'], [1, '#ffffff']], 512) : radialTex([[0, '#ffffff'], [.4, '#f0f0f0'], [.8, '#777777'], [1, '#000000']], 512);
  const tex = grid ? canvasTex(1024, 1024, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(0,229,255,.22)'; x.lineWidth = 1.5;
    for (let i = 0; i <= w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  }, { repeat: [1, 1], srgb: true }) : null;
  const fm = new THREE.MeshStandardMaterial({ color: grid ? '#ffffff' : color, map: tex, roughness: .4, metalness: .2, transparent: true, opacity, alphaMap: alpha, depthWrite: false });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 96), fm); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // fade the floor (and the twin under it) into the page at the edges
  const edgeM = new THREE.Mesh(new THREE.RingGeometry(radius * .45, radius * 1.02, 96, 1), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1,
    alphaMap: canvasTex(512, 512, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, w * .22, w / 2, h / 2, w / 2); g.addColorStop(0, '#000'); g.addColorStop(1, '#fff'); x.fillStyle = g; x.fillRect(0, 0, w, h); }), depthWrite: false }));
  edgeM.rotation.x = -Math.PI / 2; edgeM.position.y = .001; if (edge) scene.add(edgeM);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.8), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .92 * shadow, depthWrite: false,
    alphaMap: radialTex([[0, '#ffffff'], [.35, '#bbbbbb'], [.7, '#333333'], [1, '#000000']]) }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = .003; scene.add(sh);
  const sh2 = sh.clone(); sh2.material = sh.material.clone(); sh2.material.opacity = .9 * shadow; sh2.scale.set(.82, .88, 1); sh2.position.y = .004; scene.add(sh2);
  return { get twin() { return twin; }, reclone, floor, shadow: sh, shadow2: sh2 };
}

function stage(el, { w, h, fov = 26, pos = [5.4, 1.5, 5.2], target = [0, .5, 0], bloom = [.55, .35, 3.2], exposure = 1.0, env = {}, alpha = true } = {}) {
  w = w || el.clientWidth; h = h || el.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer, env);
  const camera = new THREE.PerspectiveCamera(fov, w / h, .1, 200);
  camera.position.set(...pos); camera.lookAt(...target); camera.userData.target = new THREE.Vector3(...target);
  let composer = null;
  if (bloom) {
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt); composer.setPixelRatio(1); composer.setSize(w, h);
    const rp = new RenderPass(scene, camera); rp.clearAlpha = 0; composer.addPass(rp);
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), ...bloom));
    composer.addPass(new OutputPass());
  }
  const render = () => composer ? composer.render() : renderer.render(scene, camera);
  // animate(fn(t)): in headless capture renders a few frames at a fixed pose time, then flags ready
  window.__v3pending = (window.__v3pending || 0) + 1;
  const ready = () => { if (--window.__v3pending <= 0) window.__ready3d = true; };
  const animate = (fn, { pose = 0, frames = 3 } = {}) => {
    if (STILL) {
      let n = 0; const step = () => { fn(pose); render(); if (++n < frames) requestAnimationFrame(step); else ready(); };
      requestAnimationFrame(step); return;
    }
    const t0 = performance.now(); let first = true;
    const loop = now => { fn(pose + (now - t0) / 1000); render(); if (first) { first = false; ready(); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  };
  return { renderer, scene, camera, composer, render, animate, w, h };
}

/* key/rim lights that make the silhouette pop */
function studioLights(scene, { key = .35 } = {}) {
  // punctual lights stay soft: on a 0.03-roughness clearcoat a hard light becomes a near-infinite highlight and blooms
  const k = new THREE.DirectionalLight('#ffffff', key); k.position.set(4, 7, 3); scene.add(k);
  scene.add(new THREE.HemisphereLight('#bfe9ff', '#05070d', .3));
}

return { THREE, STILL, buildChassis, bodyPoint, canopyPoint, hwAt, lerp, clamp, sstep, canvasTex, radialTex, X0, X1, carbonTex, PAINTS, paintMat, setPaint, MAT, glowMat, WHEELS, buildWheel, buildCar, studioEnv, addFloor, stage, studioLights };
};

// one call per page: resolves the import map (three@0.160.0) and returns the toolkit
window.loadV3 = async () => {
  const base = 'three/addons/';
  const [THREE, env, ec, rp, ub, op, bgu, rbg] = await Promise.all([
    import('three'), import(base + 'environments/RoomEnvironment.js'), import(base + 'postprocessing/EffectComposer.js'),
    import(base + 'postprocessing/RenderPass.js'), import(base + 'postprocessing/UnrealBloomPass.js'), import(base + 'postprocessing/OutputPass.js'),
    import(base + 'utils/BufferGeometryUtils.js'), import(base + 'geometries/RoundedBoxGeometry.js')]);
  return window.makeV3(THREE, { RoomEnvironment: env.RoomEnvironment, EffectComposer: ec.EffectComposer, RenderPass: rp.RenderPass,
    UnrealBloomPass: ub.UnrealBloomPass, OutputPass: op.OutputPass, mergeGeometries: bgu.mergeGeometries, RoundedBoxGeometry: rbg.RoundedBoxGeometry });
};
