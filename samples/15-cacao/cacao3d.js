// MAISON CACAO NOIR — procedural chocolate for Three.js r160.
// Classic script (pages open from file://). A module on the page passes THREE + addons in:
//   const C = CACAO3D(THREE, { RoomEnvironment, RoundedBoxGeometry });  C.hero(canvas)
window.CACAO3D = (THREE, { RoomEnvironment, RoundedBoxGeometry }) => {
const TAU = Math.PI * 2, V2 = (x, y) => new THREE.Vector2(x, y), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const col = h => new THREE.Color(h);
function rng(seed = 1) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
function tex(w, h, draw, { srgb = true, wrap = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const noise3 = (x, y, z) => Math.sin(x * 3.1 + Math.sin(y * 2.3)) * Math.cos(y * 2.7 + z * 1.9) * .5 + Math.sin(z * 4.3 + x * 1.7) * .3 + Math.sin(x * 9.1 + y * 7.3 + z * 5.1) * .2;

/* ------------------------------------------------------------------ stage */
window.__pending3d = window.__pending3d || 0;
function stage(canvas, o = {}) {
  const w = +canvas.getAttribute('width'), h = +canvas.getAttribute('height');
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(w, h, false);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = o.exposure ?? 1.05; r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = !!o.shadows; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r), room = new RoomEnvironment(r);
  const tint = col(o.envTint || '#ffdcb8');
  room.traverse(m => { if (m.isMesh && m.material && m.material.isMeshBasicMaterial) { m.material = m.material.clone(); m.material.color.multiply(tint); } });
  scene.environment = pm.fromScene(room, .035).texture;
  if (o.fog) scene.fog = new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]);
  const cam = new THREE.PerspectiveCamera(o.fov || 30, w / h, .1, 120);
  cam.position.set(...(o.pos || [0, 0, 10])); const tgt = V3(...(o.target || [0, 0, 0])); cam.lookAt(tgt);
  const key = new THREE.DirectionalLight(col('#ffe2c2'), o.key ?? 2.4); key.position.set(...(o.keyPos || [4, 8, 6]));
  if (o.shadows) { key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 5; key.shadow.bias = -.0004; const sc = key.shadow.camera; sc.left = sc.bottom = -8; sc.right = sc.top = 8; sc.near = .5; sc.far = 40; }
  scene.add(key);
  const rim = new THREE.DirectionalLight(col('#f0b866'), o.rim ?? 3); rim.position.set(...(o.rimPos || [-6, 4, -6])); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(col('#ff9a7a'), o.rim2 ?? .9); rim2.position.set(7, 1, -4); scene.add(rim2);
  scene.add(new THREE.HemisphereLight(col('#ffe6cc'), col('#2a1208'), o.fill ?? .35));
  const ticks = []; let frame = 0; const t0 = performance.now();
  window.__pending3d++;
  const st = { renderer: r, scene, camera: cam, target: tgt, key, rim, w, h, tick: f => ticks.push(f) };
  function loop() {
    const t = (performance.now() - t0) / 1000; ticks.forEach(f => f(t)); r.render(scene, cam);
    if (frame++ === 1 && --window.__pending3d <= 0) window.__ready3d = true;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return st;
}
function contact(size = 4, opacity = .7, sy = 1) {
  const t = tex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.35, 'rgba(0,0,0,.55)'); gr.addColorStop(.7, 'rgba(0,0,0,.15)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { srgb: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * sy), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity, depthWrite: false, color: 0x000000 }));
  m.material.alphaMap = t; m.rotation.x = -Math.PI / 2; m.renderOrder = -1; return m;
}

/* ------------------------------------------------------------------ materials */
const CH = { dark: '#2f140a', bitter: '#2a120a', milk: '#7a4426', ruby: '#8f3343', white: '#ead9bb' };
const choc = (hex = CH.dark, o = {}) => new THREE.MeshPhysicalMaterial({ color: col(hex), roughness: .34, clearcoat: .55, clearcoatRoughness: .2, sheen: .25, sheenColor: col('#8a4a28'), sheenRoughness: .4, envMapIntensity: .7, ...o });
const gold = (o = {}) => new THREE.MeshPhysicalMaterial({ color: col('#e2bd72'), metalness: 1, roughness: .26, envMapIntensity: 1.35, ...o });
const nibMat = () => new THREE.MeshPhysicalMaterial({ color: col('#3b1a0d'), roughness: .62, clearcoat: .2, sheen: .5, sheenColor: col('#7a4022') });

function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function jitter(geo, amt, R, sc = [1, 1, 1]) {
  const p = geo.attributes.position, map = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = p.getX(i).toFixed(3) + ',' + p.getY(i).toFixed(3) + ',' + p.getZ(i).toFixed(3);
    if (!map.has(k)) map.set(k, [1 + (R() - .5) * amt, 1 + (R() - .5) * amt, 1 + (R() - .5) * amt]);
    const f = map.get(k); p.setXYZ(i, p.getX(i) * f[0] * sc[0], p.getY(i) * f[1] * sc[1], p.getZ(i) * f[2] * sc[2]);
  }
  geo.computeVertexNormals(); return geo;
}

/* ------------------------------------------------------------------ bar */
const INNER = .6;
let _logo;
function logoBump() {
  if (_logo) return _logo;
  _logo = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.translate(w / 2, h / 2); g.filter = 'blur(3px)';
    g.strokeStyle = '#fff'; g.fillStyle = '#fff';
    g.lineWidth = 12; g.beginPath(); g.arc(0, 0, 176, 0, TAU); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 150, 0, TAU); g.stroke();
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.beginPath(); g.arc(Math.cos(a) * 163, Math.sin(a) * 163, 3.5, 0, TAU); g.fill(); }
    g.font = '400 190px "Gilda Display", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', 0, 10);
    g.font = '700 26px Manrope, Arial'; g.fillText('MCN', 0, -98);
    // little cacao pod under the letter
    g.beginPath(); g.ellipse(0, 104, 14, 26, 0, 0, TAU); g.fill();
  }, { srgb: false });
  _logo.repeat.set(1 / INNER, 1 / INNER); _logo.offset.set(.5, .5); return _logo;
}
const geoCache = {};
function pieceGeos() {
  if (geoCache.piece) return geoCache.piece;
  const slabH = .2, slab = new RoundedBoxGeometry(1, 1, slabH, 2, .03); slab.translate(0, 0, slabH / 2);
  const bt = .17, bs = .15;
  const top = new THREE.ExtrudeGeometry(roundedRect(INNER, INNER, .07), { depth: .05, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: 5, curveSegments: 6 });
  top.translate(0, 0, slabH + bt - .002);
  return geoCache.piece = { slab, top, height: slabH + bt * 2 + .05 };
}
function bar({ cols = 4, rows = 6, color = CH.dark, logo = true } = {}) {
  const G = pieceGeos(), m = choc(color), tm = m.clone();
  if (logo) { tm.bumpMap = logoBump(); tm.bumpScale = 2.2; }
  const group = new THREE.Group(), pieces = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const p = new THREE.Group(), s = new THREE.Mesh(G.slab, m), t = new THREE.Mesh(G.top, tm);
    s.castShadow = t.castShadow = s.receiveShadow = t.receiveShadow = true; p.add(s, t);
    p.position.set((i - (cols - 1) / 2), (j - (rows - 1) / 2), 0);
    p.userData = { i, j, home: p.position.clone() }; group.add(p); pieces.push(p);
  }
  return { group, pieces, mat: m, cols, rows, at: (i, j) => pieces[j * cols + i] };
}
let _shards;
function shardGeos() {
  if (_shards) return _shards; const R = rng(11); _shards = [];
  for (let k = 0; k < 7; k++) _shards.push(jitter(new THREE.IcosahedronGeometry(1, 0), .75, R, [1, .75, .3]));
  return _shards;
}
function shards(n, seed, area, size, mat) {
  const R = rng(seed), G = shardGeos(), g = new THREE.Group();
  for (let k = 0; k < n; k++) {
    const m = new THREE.Mesh(G[k % G.length], mat); const s = size[0] + R() * (size[1] - size[0]);
    m.scale.setScalar(s); m.position.set(area[0] + R() * (area[1] - area[0]), area[2] + R() * (area[3] - area[2]), area[4] + R() * (area[5] - area[4]));
    m.rotation.set(R() * TAU, R() * TAU, R() * TAU); m.castShadow = true; m.userData.spin = V3((R() - .5) * .6, (R() - .5) * .6, (R() - .5) * .6);
    g.add(m);
  }
  return g;
}
function nibs(n, seed, area, size = [.04, .09], mat = nibMat()) {
  const R = rng(seed), geo = jitter(new THREE.DodecahedronGeometry(1, 0), .6, R, [1, .7, .55]);
  const im = new THREE.InstancedMesh(geo, mat, n), d = new THREE.Object3D();
  for (let k = 0; k < n; k++) {
    d.position.set(area[0] + R() * (area[1] - area[0]), area[2] + R() * (area[3] - area[2]), area[4] + R() * (area[5] - area[4]));
    d.rotation.set(R() * TAU, R() * TAU, R() * TAU); d.scale.setScalar(size[0] + R() * (size[1] - size[0])); d.updateMatrix(); im.setMatrixAt(k, d.matrix);
  }
  im.castShadow = true; return im;
}
function inclusions(group, cols, rows, seed) { // freeze-dried raspberry + pistachio on the back of a bar
  const R = rng(seed);
  const rasp = new THREE.MeshPhysicalMaterial({ color: col('#c22a4c'), roughness: .85, sheen: 1, sheenColor: col('#ff8fa6') });
  const pist = new THREE.MeshPhysicalMaterial({ color: col('#9cb04a'), roughness: .6, clearcoat: .2 });
  const nut = new THREE.MeshPhysicalMaterial({ color: col('#c79a5e'), roughness: .5 });
  const gR = jitter(new THREE.IcosahedronGeometry(1, 1), .5, R), gP = jitter(new THREE.DodecahedronGeometry(1, 0), .5, R, [1, .6, .5]);
  for (let k = 0; k < 46; k++) {
    const t = k % 3, m = new THREE.Mesh(t ? gP : gR, t === 0 ? rasp : t === 1 ? pist : nut);
    m.scale.setScalar(t ? .09 + R() * .07 : .12 + R() * .08); m.position.set((R() - .5) * (cols - .3), (R() - .5) * (rows - .3), -.04 - R() * .06);
    m.rotation.set(R() * 6, R() * 6, R() * 6); group.add(m);
  }
}

/* ------------------------------------------------------------------ molten ripple */
function ripple({ w = 34, d = 22, sx = 150, sz = 96, color = '#2a1007', center = [0, 0], amp = .16 } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, sx, sz); geo.rotateX(-Math.PI / 2);
  const mat = choc(color, { roughness: .16, clearcoat: .7, clearcoatRoughness: .06, sheen: 0, envMapIntensity: .55 });
  const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true;
  const p = geo.attributes.position, base = Float32Array.from(p.array);
  function update(t) {
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2], dx = x - center[0], dz = z - center[1], r = Math.sqrt(dx * dx + dz * dz);
      const ring = Math.sin(r * 2.5 - t * 2.1) * amp * Math.exp(-r * .2) * Math.min(1, r * 1.4);
      const flow = Math.sin(x * .33 + t * .4) * .1 + Math.sin(z * .55 - x * .2 + t * .3) * .07 + Math.sin(x * 1.1 + z * .9 - t * .5) * .025;
      p.array[i * 3 + 1] = ring + flow + .3 * Math.exp(-r * r * 3) - .12 * Math.exp(-((r - .55) ** 2) * 14);
    }
    p.needsUpdate = true; geo.computeVertexNormals();
  }
  update(0); return { mesh, update, mat };
}
function stream(top, bottom, mat) { // a pouring thread of molten chocolate
  const pts = [], L = top - bottom;
  pts.push(V2(0, 0));
  for (let k = 0; k <= 40; k++) { const t = k / 40, y = t * L; const r = .055 + .03 * Math.sin(t * 9) * (1 - t) + .16 * Math.exp(-((t - .02) ** 2) * 900) + .22 * Math.exp(-((1 - t) ** 2) * 120); pts.push(V2(r, y)); }
  pts.push(V2(0, L));
  const g = new THREE.LatheGeometry(pts, 40); g.translate(0, bottom, 0); return new THREE.Mesh(g, mat);
}
function crown(n, rad, seed, mat) {
  const R = rng(seed), g = new THREE.Group(), geo = new THREE.SphereGeometry(1, 20, 14);
  for (let k = 0; k < n; k++) {
    const a = k / n * TAU + R() * .3, h = .15 + R() * .5, d = new THREE.Mesh(geo, mat);
    d.scale.set(.05 + R() * .04, .09 + R() * .1, .05 + R() * .04); d.position.set(Math.cos(a) * (rad + R() * .25), h, Math.sin(a) * (rad + R() * .25));
    d.rotation.z = -Math.cos(a) * .5; d.rotation.x = Math.sin(a) * .5; g.add(d);
  }
  return g;
}

/* ------------------------------------------------------------------ pralines */
function marble(base, colors, seed) {
  return tex(1024, 512, (g, w, h) => {
    const R = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 22; k++) {
      g.strokeStyle = colors[k % colors.length]; g.globalAlpha = .3 + R() * .5; g.lineWidth = 3 + R() * 20; g.filter = `blur(${R() * 3}px)`;
      g.beginPath(); let x = R() * w, y = R() * h; g.moveTo(x, y);
      for (let s = 0; s < 3; s++) { g.bezierCurveTo(x + (R() - .5) * 500, y + (R() - .5) * 300, x + (R() - .5) * 500, y + (R() - .5) * 300, x = R() * w, y = R() * h); }
      g.stroke();
    }
    g.globalAlpha = 1; g.filter = 'none';
  });
}
function dust(base, seed, density = 2600, top = true) {
  const R = rng(seed), dots = [];
  for (let k = 0; k < density; k++) { const y = top ? Math.pow(R(), 1.8) * 512 : R() * 512; dots.push([R() * 1024, y, .6 + R() * R() * 4]); }
  const map = tex(1024, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); dots.forEach(([x, y, r]) => { g.fillStyle = `hsl(${38 + R() * 8},${55 + R() * 20}%,${55 + R() * 22}%)`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }); });
  const met = tex(1024, 512, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; dots.forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }); }, { srgb: false });
  return { map, met };
}
function transfer(base, seed) {
  const R = rng(seed);
  const draw = (g, w, h, metal) => { g.fillStyle = metal ? '#000' : base; g.fillRect(0, 0, w, h); g.strokeStyle = metal ? '#fff' : '#e3c07a'; g.lineWidth = 7;
    for (let k = -10; k < 20; k++) { g.beginPath(); g.moveTo(k * 46, 0); g.lineTo(k * 46 + 256, 512); g.stroke(); }
    g.lineWidth = 2; for (let k = -10; k < 20; k++) { g.beginPath(); g.moveTo(k * 46 + 18, 0); g.lineTo(k * 46 + 274, 512); g.stroke(); } };
  return { map: tex(512, 512, (g, w, h) => draw(g, w, h, 0)), met: tex(512, 512, (g, w, h) => draw(g, w, h, 1), { srgb: false }) };
}
function domeGeo() {
  if (geoCache.dome) return geoCache.dome;
  const pts = [V2(0, 0), V2(.44, 0), V2(.49, .015), V2(.5, .05)];
  for (let k = 0; k <= 28; k++) { const a = k / 28 * Math.PI / 2; pts.push(V2(.5 * Math.cos(a), .05 + .5 * Math.sin(a) * .98)); }
  return geoCache.dome = new THREE.LatheGeometry(pts, 72);
}
function cupolaGeo() { // tall fluted cupola
  if (geoCache.cup) return geoCache.cup;
  const pts = [V2(0, 0), V2(.42, 0), V2(.46, .03)];
  for (let k = 0; k <= 30; k++) { const t = k / 30; pts.push(V2(.46 * Math.cos(t * Math.PI / 2) ** .8 * (1 - .15 * t), .03 + .62 * Math.sin(t * Math.PI / 2))); }
  const g = new THREE.LatheGeometry(pts, 96), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), f = 1 + .07 * Math.abs(Math.cos(a * 4)) ** .6; p.setX(i, x * f); p.setZ(i, z * f); }
  g.computeVertexNormals(); return geoCache.cup = g;
}
function leaf(R) { // gold leaf flake
  const s = new THREE.Shape(); const n = 9;
  for (let k = 0; k < n; k++) { const a = k / n * TAU, r = .08 + R() * .09; k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), gold({ side: THREE.DoubleSide, roughness: .35 })); return m;
}
const PRALINES = {
  noisette: { name: 'Noisette Dorée', shell: 'gold-dusted dome' },
  framboise: { name: 'Framboise Rubis', shell: 'marbled ruby dome' },
  pistache: { name: 'Pistache Sicile', shell: 'marbled green cupola' },
  caramel: { name: 'Caramel Fleur de Sel', shell: 'gold transfer square' },
  truffe: { name: 'Truffe Noire', shell: 'cocoa-dusted truffle' },
  yuzu: { name: 'Yuzu Ambre', shell: 'airbrushed amber dome' }
};
const pralineMats = {};
function pralineMat(kind) {
  if (pralineMats[kind]) return pralineMats[kind];
  let m;
  if (kind === 'noisette') { const d = dust('#3a1a0f', 3); m = new THREE.MeshPhysicalMaterial({ map: d.map, metalnessMap: d.met, metalness: 1, roughness: .3, clearcoat: .5, clearcoatRoughness: .2, sheen: .3, sheenColor: col('#a8653a') }); }
  else if (kind === 'framboise') m = new THREE.MeshPhysicalMaterial({ map: marble('#3b0d16', ['#d63a63', '#ff7a9a', '#7d1028', '#f3d2c2', '#b81e45'], 5), roughness: .16, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.2 });
  else if (kind === 'pistache') m = new THREE.MeshPhysicalMaterial({ map: marble('#25140c', ['#a8bf5e', '#cfe08a', '#5f7a2a', '#f1e6c8'], 9), roughness: .18, clearcoat: 1, clearcoatRoughness: .05 });
  else if (kind === 'caramel') { const d = transfer('#2e150c', 2); m = new THREE.MeshPhysicalMaterial({ map: d.map, metalnessMap: d.met, metalness: 1, roughness: .28, clearcoat: .6, clearcoatRoughness: .2 }); }
  else if (kind === 'truffe') m = new THREE.MeshPhysicalMaterial({ map: tex(512, 256, (g, w, h) => { const R = rng(4); g.fillStyle = '#5a3020'; g.fillRect(0, 0, w, h); for (let k = 0; k < 9000; k++) { g.fillStyle = `rgba(${R() > .5 ? '120,74,48' : '58,30,18'},.6)`; g.fillRect(R() * w, R() * h, 2, 2); } }), roughness: .92, sheen: 1, sheenColor: col('#9a6a48'), sheenRoughness: .8 });
  else if (kind === 'yuzu') m = new THREE.MeshPhysicalMaterial({ map: tex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2b23a'); gr.addColorStop(.38, '#d9781e'); gr.addColorStop(.7, '#5a2a12'); gr.addColorStop(1, '#2e140a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), roughness: .2, clearcoat: 1, clearcoatRoughness: .06 });
  return pralineMats[kind] = m;
}
function praline(kind, seed = 1) {
  const R = rng(seed), g = new THREE.Group(), m = pralineMat(kind); let mesh;
  if (kind === 'caramel') { mesh = new THREE.Mesh(geoCache.sq || (geoCache.sq = new RoundedBoxGeometry(.86, .42, .86, 4, .07)), m); mesh.position.y = .21; }
  else if (kind === 'truffe') {
    if (!geoCache.tr) { const s = new THREE.SphereGeometry(.44, 48, 32), p = s.attributes.position; for (let i = 0; i < p.count; i++) { const v = V3(p.getX(i), p.getY(i), p.getZ(i)), f = 1 + .07 * noise3(v.x * 6, v.y * 6, v.z * 6); v.multiplyScalar(f); p.setXYZ(i, v.x, v.y * .92, v.z); } s.computeVertexNormals(); geoCache.tr = s; }
    mesh = new THREE.Mesh(geoCache.tr, m); mesh.position.y = .4;
  }
  else if (kind === 'pistache') { mesh = new THREE.Mesh(cupolaGeo(), m); }
  else { mesh = new THREE.Mesh(domeGeo(), m); }
  mesh.rotation.y = R() * TAU; mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh);
  if (kind === 'framboise') { const l = leaf(R); l.rotation.x = -Math.PI / 2 + .25; l.position.set(.05, .545, .02); g.add(l); }
  if (kind === 'pistache') { const pm = new THREE.MeshPhysicalMaterial({ color: col('#9fb84a'), roughness: .6 }); const pg = jitter(new THREE.DodecahedronGeometry(1, 0), .6, R); for (let k = 0; k < 9; k++) { const c = new THREE.Mesh(pg, pm), a = R() * TAU, rr = R() * .1; c.scale.setScalar(.035 + R() * .025); c.position.set(Math.cos(a) * rr, .64, Math.sin(a) * rr); g.add(c); } }
  if (kind === 'caramel') { const sm = new THREE.MeshPhysicalMaterial({ color: '#fff', roughness: .2, transmission: .4, thickness: .1 }); const sg = jitter(new THREE.OctahedronGeometry(1, 0), .5, R); for (let k = 0; k < 7; k++) { const c = new THREE.Mesh(sg, sm); c.scale.setScalar(.02 + R() * .02); c.position.set((R() - .5) * .5, .425, (R() - .5) * .5); g.add(c); } }
  if (kind === 'yuzu') { const l = leaf(R); l.scale.setScalar(.6); l.rotation.x = -Math.PI / 2 + .3; l.position.set(-.04, .54, .05); g.add(l); }
  return g;
}

/* ------------------------------------------------------------------ box */
function pleatedCup() {
  if (geoCache.pc) return geoCache.pc;
  const g = new THREE.CylinderGeometry(.53, .44, .2, 96, 1, true), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), f = 1 + .045 * Math.cos(a * 28); p.setX(i, x * f); p.setZ(i, z * f); }
  g.translate(0, .1, 0); g.computeVertexNormals(); return geoCache.pc = g;
}
function tray({ n = 4, cell = 1.18, fill = [], gift = false } = {}) {
  const W = n * cell + .36, g = new THREE.Group();
  const leather = new THREE.MeshPhysicalMaterial({ color: col('#2a1309'), roughness: .5, sheen: .35, sheenColor: col('#8a5a3a'), sheenRoughness: .5, clearcoat: .25, clearcoatRoughness: .4, envMapIntensity: .6 });
  const lining = new THREE.MeshPhysicalMaterial({ color: col('#1e0c06'), roughness: .6, sheen: .6, sheenColor: col('#6b3a24') });
  const foil = gold({ color: col('#b8893e'), roughness: .3, side: THREE.DoubleSide, envMapIntensity: 1 });
  const floor = new THREE.Mesh(new RoundedBoxGeometry(W, .14, W, 3, .05), leather); floor.position.y = .07; floor.receiveShadow = true; floor.castShadow = true; g.add(floor);
  const lin = new THREE.Mesh(new THREE.PlaneGeometry(W - .3, W - .3), lining); lin.rotation.x = -Math.PI / 2; lin.position.y = .145; lin.receiveShadow = true; g.add(lin);
  const wallG = new RoundedBoxGeometry(W, .62, .16, 3, .05), wallS = new RoundedBoxGeometry(.16, .62, W, 3, .05);
  [[0, W / 2 - .08, wallG], [0, -W / 2 + .08, wallG], [W / 2 - .08, 0, wallS], [-W / 2 + .08, 0, wallS]].forEach(([x, z, geo]) => { const m = new THREE.Mesh(geo, leather); m.position.set(x, .31, z); m.castShadow = m.receiveShadow = true; g.add(m); });
  const rimG = new RoundedBoxGeometry(W + .02, .04, .17, 2, .015), rimS = new RoundedBoxGeometry(.17, .04, W + .02, 2, .015);
  [[0, W / 2 - .08, rimG], [0, -W / 2 + .08, rimG], [W / 2 - .08, 0, rimS], [-W / 2 + .08, 0, rimS]].forEach(([x, z, geo]) => { const m = new THREE.Mesh(geo, gold()); m.position.set(x, .63, z); g.add(m); });
  const dv = gold({ roughness: .4 });
  for (let k = 1; k < n; k++) { const o = (k - n / 2) * cell; const a = new THREE.Mesh(new THREE.BoxGeometry(W - .3, .3, .025), dv); a.position.set(0, .29, o); g.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(.025, .3, W - .3), dv); b.position.set(o, .29, 0); g.add(b); }
  const cells = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * cell, z = (j - (n - 1) / 2) * cell, cup = new THREE.Mesh(pleatedCup(), foil);
    cup.position.set(x, .15, z); cup.receiveShadow = true; g.add(cup);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(.44, 40), foil); disc.rotation.x = -Math.PI / 2; disc.position.set(x, .152, z); g.add(disc);
    const k = fill[j * n + i]; let pr = null;
    if (k) { pr = praline(k, j * n + i + 3); pr.position.set(x, .17, z); pr.scale.setScalar(.92); g.add(pr); }
    cells.push({ x, z, praline: pr });
  }
  return { group: g, cells, W, leather };
}
function lidTop(W, text = 'MAISON CACAO NOIR') {
  const a = tex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.fillStyle = '#fff';
    g.lineWidth = 5; g.strokeRect(54, 54, w - 108, h - 108); g.lineWidth = 2; g.strokeRect(74, 74, w - 148, h - 148);
    g.translate(w / 2, h / 2); g.lineWidth = 4; g.beginPath(); g.arc(0, -120, 92, 0, TAU); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '400 120px "Gilda Display", Georgia, serif'; g.fillText('N', 0, -112);
    g.font = '400 66px "Gilda Display", Georgia, serif'; g.fillText(text.split(' ').slice(0, 1).join(' '), 0, 40);
    g.font = '400 92px "Abril Fatface", Georgia, serif'; g.fillText('CACAO NOIR', 0, 140);
    g.font = '700 22px Manrope, Arial'; g.fillText('B R U X E L L E S  ·  B E A N  T O  B A R', 0, 250);
  }, { srgb: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W * .92, W * .92), gold({ alphaMap: a, transparent: true, roughness: .22 }));
  m.rotation.x = -Math.PI / 2; return m;
}
function lid(W, leather) {
  const g = new THREE.Group(), b = new THREE.Mesh(new RoundedBoxGeometry(W + .14, .36, W + .14, 4, .07), leather);
  b.castShadow = b.receiveShadow = true; b.position.y = .18; g.add(b); const t = lidTop(W); t.position.y = .362; g.add(t); return g;
}
function ribbon(W, H) {
  const g = new THREE.Group(), m = new THREE.MeshPhysicalMaterial({ color: col('#5e0819'), roughness: .3, sheen: .45, sheenColor: col('#e0466a'), sheenRoughness: .35, clearcoat: .4, clearcoatRoughness: .25 });
  const a = new THREE.Mesh(new THREE.BoxGeometry(W + .24, H + .02, .34), m), b = new THREE.Mesh(new THREE.BoxGeometry(.34, H + .02, W + .24), m);
  a.position.y = b.position.y = H / 2; g.add(a, b);
  const loop = new THREE.TorusGeometry(.42, .1, 18, 64);
  [-1, 1].forEach(s => { const l = new THREE.Mesh(loop, m); l.scale.set(1, .62, .55); l.position.set(s * .4, H + .2, 0); l.rotation.set(0, 0, s * .32); l.castShadow = true; g.add(l);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(.9, .03, .3), m); tail.position.set(s * .45, H + .03, .45); tail.rotation.set(0, s * .7 - .2, s * .1); g.add(tail); });
  const knot = new THREE.Mesh(new THREE.SphereGeometry(.17, 24, 16), m); knot.scale.set(1.1, .8, .9); knot.position.y = H + .14; g.add(knot);
  return g;
}

/* ------------------------------------------------------------------ cacao pod */
function podProfile(L = 3.2, R0 = .78) {
  const pts = [];
  for (let k = 0; k <= 64; k++) { const t = k / 64, s = Math.sin(Math.PI * t); const r = R0 * Math.pow(s, .72) * (1 - .18 * t) + (k === 0 || k === 64 ? 0 : .002); pts.push(V2(r, (t - .5) * L)); }
  return pts;
}
function podShell(phiStart, L, R0, colors) {
  const g = new THREE.LatheGeometry(podProfile(L, R0), 120, phiStart, Math.PI), p = g.attributes.position;
  const c = new Float32Array(p.count * 3), A = col(colors[0]), B = col(colors[1]), C = col(colors[2]), tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(x, z), rr = Math.hypot(x, z);
    const ridge = .085 * Math.pow(Math.abs(Math.cos(a * 5)), .7) + .03 * noise3(x * 4, y * 3, z * 4) + .012 * noise3(x * 19, y * 23, z * 17);
    const f = rr > 1e-4 ? (1 + ridge) : 1; p.setX(i, x * f); p.setZ(i, z * f);
    const t = (y / L + .5), n = .5 + .5 * noise3(x * 2, y * 1.6, z * 2);
    tmp.copy(A).lerp(B, Math.min(1, Math.max(0, t * 1.2 + n * .4 - .2))).lerp(C, Math.max(0, n - .55) * 1.6 + Math.max(0, .25 - t));
    c.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .5, clearcoat: .35, clearcoatRoughness: .35, side: THREE.DoubleSide, sheen: .4, sheenColor: col('#ffcf8a') }));
}
function podHalf(side, seed, L = 3.2, R0 = .78) {
  // side 0: shell on +x, cut face looking -x
  const g = new THREE.Group(), R = rng(seed);
  const shell = podShell(side ? Math.PI : 0, L, R0, ['#6e140c', '#b8401a', '#d6951c']); shell.castShadow = true; g.add(shell);
  const prof = podProfile(L, R0);
  const outer = new THREE.Shape(); prof.forEach((p, k) => k ? outer.lineTo(p.x * 1.05, p.y) : outer.moveTo(p.x * 1.05, p.y)); [...prof].reverse().forEach(p => outer.lineTo(-p.x * 1.05, p.y));
  const inner = new THREE.Path(); prof.forEach((p, k) => k ? inner.lineTo(p.x * .74, p.y * .92) : inner.moveTo(p.x * .74, p.y * .92)); [...prof].reverse().forEach(p => inner.lineTo(-p.x * .74, p.y * .92));
  const rimS = outer.clone ? outer : outer; rimS.holes.push(inner);
  const rimMat = new THREE.MeshPhysicalMaterial({ color: col('#e0a63c'), roughness: .65, side: THREE.DoubleSide, sheen: .5, sheenColor: col('#ffd27a') });
  const pulpMat = new THREE.MeshPhysicalMaterial({ color: col('#efe2c8'), roughness: .3, clearcoat: .9, clearcoatRoughness: .2, sheen: .5, sheenColor: col('#fff') });
  const rim = new THREE.Mesh(new THREE.ShapeGeometry(rimS, 4), rimMat);
  const innerShape = new THREE.Shape(inner.getPoints()); const pulp = new THREE.Mesh(new THREE.ShapeGeometry(innerShape, 4), pulpMat);
  // shapes lie in XY; rotate so they sit in the YZ cut plane facing -x (or +x)
  [rim, pulp].forEach(m => { m.rotation.y = side ? Math.PI / 2 : -Math.PI / 2; g.add(m); });
  // beans: mucilage-coated + a few sliced purple ones
  const beanG = new THREE.SphereGeometry(1, 28, 18), sliced = new THREE.MeshPhysicalMaterial({ color: col('#5b2340'), roughness: .5, clearcoat: .4 });
  const dir = side ? 1 : -1;
  for (let row = 0; row < 7; row++) for (let c = 0; c < 3; c++) {
    const y = (row - 3) * .34 + (c === 1 ? .17 : 0), zw = R0 * Math.pow(Math.sin(Math.PI * (y / L + .5)), .72) * .55;
    if (Math.abs(y) > L * .36) continue;
    const b = new THREE.Mesh(beanG, (row * 3 + c + seed) % 5 === 0 ? sliced : pulpMat);
    b.scale.set(.1 + R() * .02, .2, .14); b.position.set(dir * (.03 + R() * .05), y + (R() - .5) * .05, (c - 1) * zw * .9);
    b.rotation.set((R() - .5) * .4, (R() - .5) * .3, (R() - .5) * .3); b.castShadow = true; g.add(b);
  }
  return g;
}
function bean(R, mat) { const m = new THREE.Mesh(geoCache.bean || (geoCache.bean = jitter(new THREE.SphereGeometry(1, 20, 14), .12, rng(2))), mat); m.scale.set(.12, .2, .08); m.rotation.set(R() * 6, R() * 6, R() * 6); m.castShadow = true; return m; }

/* ================================================================== scenes */
const S = {};
S.hero = (canvas) => {
  const st = stage(canvas, { fov: 26, pos: [0, 2.6, 14.5], target: [0, .1, 0], fog: ['#160a06', 14, 30], shadows: true, exposure: 1.1, keyPos: [3, 9, 7] });
  const B = bar({ cols: 4, rows: 6 }), root = new THREE.Group(); B.group.scale.setScalar(.6); root.add(B.group);
  root.position.set(2.05, .45, .4); root.rotation.set(-.42, -.5, -.36); st.scene.add(root);
  // the break: top two rows separate mid-air
  const pose = [
    [0, 4, [-.32, .52, .28], [-.18, .12, .22]], [1, 4, [-.32, .52, .28], [-.18, .12, .22]], [0, 5, [-.32, .52, .28], [-.18, .12, .22]], [1, 5, [-.32, .52, .28], [-.18, .12, .22]],
    [2, 4, [.25, .7, .75], [.3, -.4, .35]], [3, 4, [.9, .35, 1.25], [-.5, .7, -.4]], [2, 5, [.45, 1.2, .5], [.9, .3, -.5]], [3, 5, [1.15, 1.0, 1.4], [-.4, -.9, .8]]
  ];
  pose.forEach(([i, j, o, r]) => { const p = B.at(i, j); p.position.add(V3(...o)); p.rotation.set(...r); p.userData.rot = V3(...r); p.userData.fly = j === 5 || i > 1; });
  // chunk A rotates as one: give the 4-piece chunk a shared pivot tilt
  const sh = shards(26, 3, [-2, 2.4, .7, 2.4, -.1, 1.4], [.1, .3], B.mat); B.group.add(sh);
  const sh2 = shards(14, 8, [1.2, 3.4, 1.6, 3.4, .4, 2.6], [.06, .16], B.mat); B.group.add(sh2);
  st.scene.add(nibs(130, 5, [-.5, 5.5, -1.6, 3.0, -1.5, 3], [.04, .1]));
  // molten pool + pouring stream
  root.updateMatrixWorld(true);
  const tip = B.group.localToWorld(V3(-1.2, -3.05, .1));
  const pool = ripple({ center: [tip.x, tip.z], amp: .18 }); pool.mesh.position.y = -2.25; st.scene.add(pool.mesh);
  const s = stream(tip.y, -2.2, pool.mat); s.position.set(tip.x, 0, tip.z); st.scene.add(s);
  const cr = crown(16, .5, 2, pool.mat); cr.position.set(tip.x, -2.25, tip.z); st.scene.add(cr);
  const cs = contact(5, .55); cs.position.set(2, -2.0, .3); st.scene.add(cs);
  let last = -1;
  st.tick(t => {
    st.camera.position.x = Math.sin(t * .18) * .35; st.camera.lookAt(st.target);
    B.pieces.forEach(p => { if (p.userData.fly) { const r = p.userData.rot; p.rotation.set(r.x + Math.sin(t * .5 + p.userData.i) * .06, r.y + t * .05 * (p.userData.i - 1.5), r.z); } });
    [sh, sh2].forEach(g => g.children.forEach(m => { m.rotation.x += m.userData.spin.x * .01; m.rotation.y += m.userData.spin.y * .01; }));
    if (t - last > .05) { pool.update(t); last = t; }
  });
  return st;
};
S.pralineRow = (canvas, kinds = ['noisette', 'framboise', 'pistache', 'caramel', 'truffe', 'yuzu']) => {
  const st = stage(canvas, { fov: 22, pos: [0, 2.5, 11], target: [0, .55, 0], shadows: true, exposure: 1.15, keyPos: [2, 9, 6] });
  const gap = 1.62, items = [];
  const shelf = new THREE.Mesh(new RoundedBoxGeometry(14, .14, 3.2, 3, .05), choc('#110503', { roughness: .16, clearcoat: .8, clearcoatRoughness: .05, sheen: 0, envMapIntensity: .2 }));
  shelf.position.y = -.07; shelf.receiveShadow = true; st.scene.add(shelf);
  kinds.forEach((k, n) => {
    const pr = praline(k, n * 7 + 2); pr.scale.setScalar(1.38); const x = (n - (kinds.length - 1) / 2) * gap;
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(.6, .63, .08, 64), gold({ roughness: .3 })); ped.position.set(x, .04, 0); ped.receiveShadow = true; st.scene.add(ped);
    pr.position.set(x, .08, 0); st.scene.add(pr); items.push(pr);
  });
  items[1].position.y += .5; items[1].rotation.z = .12; // lifted, as if picked up
  const cs = contact(1.6, .6); cs.position.set(items[1].position.x, .1, 0); st.scene.add(cs);
  st.tick(t => { items.forEach((p, n) => { p.rotation.y = t * .25 + n; }); items[1].position.y = .58 + Math.sin(t * 1.2) * .05; });
  return st;
};
S.fan = (canvas) => {
  const st = stage(canvas, { fov: 24, pos: [0, 1.2, 15], target: [0, 0, 0], shadows: true, exposure: 1.1, keyPos: [4, 8, 8] });
  const defs = [['#4a2412', [-2.5, -.25, -1.2], [-.25, .55, .22]], [CH.dark, [-.2, .2, -.4], [-.15, .2, -.08]], [CH.bitter, [2.0, -.3, .6], [-.3, -.45, -.26]]];
  const groups = defs.map(([c, p, r], n) => { const B = bar({ cols: 3, rows: 6, color: c }); B.group.scale.setScalar(.62); B.group.position.set(...p); B.group.rotation.set(...r); st.scene.add(B.group); return B; });
  const back = bar({ cols: 3, rows: 6, color: CH.bitter }); back.group.scale.setScalar(.62); back.group.position.set(3.75, .9, -2.6); back.group.rotation.set(.2, Math.PI + .5, .3); inclusions(back.group, 3, 6, 4); st.scene.add(back.group);
  st.scene.add(nibs(60, 9, [-5, 6, -2.6, 2.8, -1.5, 2], [.04, .09]));
  const cs = contact(12, .45, .35); cs.position.y = -2.3; st.scene.add(cs);
  st.tick(t => { groups.forEach((B, n) => { B.group.position.y = defs[n][1][1] + Math.sin(t * .7 + n * 1.3) * .08; }); back.group.rotation.y = Math.PI + .5 + Math.sin(t * .3) * .1; });
  return st;
};
S.viewer = (canvas) => {
  const st = stage(canvas, { fov: 24, pos: [0, 1.4, 12.5], target: [0, .1, 0], shadows: true, exposure: 1.0, keyPos: [5, 6, 4], rimPos: [-6, 5, -3] });
  const B = bar({ cols: 4, rows: 6, color: CH.dark }), root = new THREE.Group(); B.group.scale.setScalar(.6); root.add(B.group);
  root.rotation.set(-.3, .3, -.5); root.position.set(.1, .1, 0); st.scene.add(root);
  const p = B.at(3, 5); p.position.add(V3(.5, .75, 1.1)); p.rotation.set(.5, -.6, .4);
  const q = B.at(2, 5); q.position.add(V3(.15, .25, .35)); q.rotation.set(.15, -.12, .1);
  B.group.add(shards(16, 21, [.5, 2.6, 1.8, 3.2, .1, 1.4], [.06, .18], B.mat));
  st.scene.add(nibs(40, 4, [-3, 3, -1.9, 2.5, -1, 2], [.04, .08]));
  const cs = contact(7, .6, .8); cs.position.y = -2.1; st.scene.add(cs);
  st.tick(t => { root.rotation.z = -.5 + Math.sin(t * .35) * .08; root.position.y = .1 + Math.sin(t * .8) * .05; p.rotation.y = -.6 + t * .2; });
  return st;
};
S.box = (canvas, fill, opts = {}) => {
  const st = stage(canvas, { fov: 26, pos: [0, 8.6, 9.2], target: [0, 0, .3], shadows: true, exposure: 1.1, keyPos: [3, 10, 5], ...opts });
  const T = tray({ n: 4, fill }); T.group.rotation.y = -.1; st.scene.add(T.group);
  const L = lid(T.W, T.leather); L.position.set(.3, .6, -T.W / 2 - 1.1); L.rotation.set(-1.15, 0, 0); L.position.y = 1.9; st.scene.add(L);
  const cs = contact(T.W * 1.9, .7); cs.position.y = .002; st.scene.add(cs);
  // the next praline dropping into its cup + pulse ring
  const empty = T.cells.find(c => !c.praline); let drop = null, ring = null;
  if (empty && opts.drop) {
    drop = praline(opts.drop, 99); drop.scale.setScalar(.92); drop.position.set(empty.x, 1.5, empty.z); drop.rotation.set(.3, 0, .2); T.group.add(drop);
    ring = new THREE.Mesh(new THREE.RingGeometry(.5, .56, 64), new THREE.MeshBasicMaterial({ color: col('#f2d08a'), transparent: true, opacity: .9, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(empty.x, .2, empty.z); T.group.add(ring);
  }
  st.tick(t => { if (drop) { drop.position.y = 1.35 + Math.sin(t * 1.4) * .12; drop.rotation.y = t * .6; const k = (t * .8) % 1; ring.scale.setScalar(1 + k * .5); ring.material.opacity = .9 * (1 - k); } T.group.rotation.y = -.1 + Math.sin(t * .25) * .03; });
  return st;
};
S.gift = (canvas) => {
  const st = stage(canvas, { fov: 24, pos: [0, 5.2, 13], target: [0, .6, 0], shadows: true, exposure: 1.1, keyPos: [4, 10, 6] });
  const W = 3.6, g = new THREE.Group();
  const leather = new THREE.MeshPhysicalMaterial({ color: col('#2a1309'), roughness: .5, sheen: .35, sheenColor: col('#8a5a3a'), sheenRoughness: .5, clearcoat: .25, clearcoatRoughness: .4, envMapIntensity: .6 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(W, .9, W, 4, .06), leather); base.position.y = .45; base.castShadow = base.receiveShadow = true; g.add(base);
  const L = lid(W - .14, leather); L.position.y = .78; g.add(L);
  const rb = ribbon(W + .02, 1.16); g.add(rb);
  g.rotation.y = -.55; st.scene.add(g);
  const extra = [['framboise', [-1.45, 0, 2.25]], ['noisette', [-.25, 0, 2.7]], ['pistache', [2.75, 0, 1.6]], ['truffe', [1.8, 0, 2.8]], ['caramel', [-2.2, 0, 1.2]]];
  extra.forEach(([k, p], n) => { const pr = praline(k, n + 40); pr.scale.setScalar(1.1); pr.position.set(...p); st.scene.add(pr); });
  const B = bar({ cols: 3, rows: 5, color: CH.milk }); B.group.scale.setScalar(.55); B.group.rotation.set(-Math.PI / 2 + .05, 0, .5); B.group.position.set(3.0, .02, -2.4); st.scene.add(B.group);
  const cs = contact(10, .6, .7); cs.position.y = .003; st.scene.add(cs);
  st.tick(t => { g.rotation.y = -.55 + Math.sin(t * .3) * .05; });
  return st;
};
S.pod = (canvas) => {
  const st = stage(canvas, { fov: 26, pos: [0, .8, 13], target: [0, 0, 0], shadows: true, exposure: 1.15, keyPos: [-3, 8, 7], rimPos: [6, 3, -5] });
  const A = podHalf(0, 3), Bh = podHalf(1, 8);
  A.rotation.set(.12, Math.PI / 2 - .55, -.62); A.position.set(.25, -.05, .3); A.scale.setScalar(1.22);
  Bh.rotation.set(.1, -.35, -.38); Bh.position.set(2.95, .05, -1.6); Bh.scale.setScalar(1.22);
  st.scene.add(A, Bh);
  const R = rng(7), beanM = new THREE.MeshPhysicalMaterial({ color: col('#f2e8d4'), roughness: .3, clearcoat: .9 }), roast = new THREE.MeshPhysicalMaterial({ color: col('#6a3a24'), roughness: .55, clearcoat: .3 });
  const flying = [];
  for (let k = 0; k < 16; k++) { const b = bean(R, k % 3 ? roast : beanM); b.position.set(-.6 + R() * 5.2, -2 + R() * 4, .4 + R() * 1.8); b.scale.multiplyScalar(.9 + R() * .6); st.scene.add(b); flying.push(b); }
  st.scene.add(nibs(60, 12, [-4, 4.5, -2.2, 2.4, -1, 2], [.035, .08]));
  const cs = contact(8, .5, .6); cs.position.y = -2.3; st.scene.add(cs);
  st.tick(t => { A.position.y = -.05 + Math.sin(t * .7) * .06; Bh.position.y = .05 + Math.sin(t * .6 + 1) * .08; flying.forEach((b, n) => { b.rotation.x += .004 * (n % 3 + 1); b.rotation.y += .003; }); });
  return st;
};
return { ...S, stage, bar, praline, PRALINES, rng };
};
