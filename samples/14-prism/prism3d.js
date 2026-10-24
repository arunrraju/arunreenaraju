// PRISM shared WebGL kit: iridescent studio env, procedural Prism One headset,
// controllers, liquid-chrome blobs, holographic UI panels, exploded optics stack.
window.P3D = function (THREE, U) {
const { mergeVertices, RoundedBoxGeometry } = U;
const P = {};

P.FRAMES = {
  silver:   { name: 'Liquid Silver', c: '#e2e4ec', m: 1.0, r: 0.14, irid: 0.12 },
  pearl:    { name: 'Pearl',         c: '#f7f3f7', m: 0.45, r: 0.22, irid: 0.8 },
  lilac:    { name: 'Lilac Chrome',  c: '#cfc2ff', m: 1.0, r: 0.14, irid: 0.5 },
  graphite: { name: 'Graphite',      c: '#5b5d69', m: 1.0, r: 0.26, irid: 0.2 }
};
P.STRAPS = {
  cloud:    { name: 'Cloud Knit',   c: '#eceef6' },
  lilac:    { name: 'Lilac Knit',   c: '#c3b4ff' },
  aqua:     { name: 'Aqua Knit',    c: '#a3ebee' },
  blush:    { name: 'Blush Knit',   c: '#ffc6e1' },
  graphite: { name: 'Graphite Knit',c: '#55576a' }
};

P.fontsReady = Promise.all(['700 40px Unbounded', '500 40px Unbounded', '500 20px Inter', '600 20px Inter', '700 20px Inter'].map(f => document.fonts.load(f))).catch(() => 0);

/* ---------- iridescent studio environment ---------- */
function envMap(renderer, { tint = 1 } = {}) {
  const s = new THREE.Scene();
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const lg = g.createLinearGradient(0, 0, 0, 512);
  [[0, '#ffffff'], [0.26, '#efeaff'], [0.4, '#c3b4ff'], [0.47, '#a6eef3'], [0.5, '#3e3a55'], [0.53, '#6d6890'], [0.58, '#ffc9e6'], [0.7, '#f4f4fa'], [1, '#c4c7d6']].forEach(([o, col]) => lg.addColorStop(o, col));
  g.fillStyle = lg; g.fillRect(0, 0, 1024, 512);
  const hues = ['rgba(150,120,255,', 'rgba(100,225,240,', 'rgba(255,140,205,', 'rgba(190,255,210,'];
  for (let i = 0; i < 9; i++) {
    const x = i * 120 + 20, y = 140 + (i % 3) * 40;
    const rg = g.createRadialGradient(x, y, 0, x, y, 170);
    rg.addColorStop(0, hues[i % 4] + (0.55 * tint) + ')'); rg.addColorStop(1, hues[i % 4] + '0)');
    g.fillStyle = rg; g.fillRect(0, 0, 1024, 512);
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  s.add(new THREE.Mesh(new THREE.SphereGeometry(40, 64, 32), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })));
  const box = (w, h, pos, k, col = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  box(22, 7, [0, 26, 8], 4.2);
  box(5, 20, [-24, 5, 10], 3.2);
  box(5, 20, [24, 6, -4], 2.6, [0.85, 0.9, 1]);
  box(16, 3, [0, -2, -26], 2.4, [1, 0.88, 0.96]);
  box(4, 4, [10, 10, 24], 3.5);
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(s, 0.025).texture;
  pm.dispose();
  return t;
}

/* ---------- stage ---------- */
P.stage = function (canvas, { w, h, fov = 28, pos = [0, 0.4, 6], target = [0, 0, 0], exposure = 1.05 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.environment = envMap(renderer);
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.05, 200);
  camera.position.set(...pos);
  const tgt = new THREE.Vector3(...target);
  camera.lookAt(tgt);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc9b8ff, 2.2); rim.position.set(5, 2, -5); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x9ff0f5, 1.4); rim2.position.set(-6, -1, -4); scene.add(rim2);
  let frames = 0;
  return {
    renderer, scene, camera, target: tgt, w, h,
    toScreen(v) { const p = v.clone().project(camera); return [(p.x + 1) / 2 * w, (1 - p.y) / 2 * h]; },
    loop(fn, after) {
      const t0 = performance.now();
      const tick = () => {
        const t = (performance.now() - t0) / 1000;
        fn && fn(t);
        renderer.render(scene, camera);
        frames++;
        if (frames === 2) { after && after(); window.__ready3d = true; }
        requestAnimationFrame(tick);
      };
      tick();
    }
  };
};

/* ---------- helpers ---------- */
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
P.canvasTex = canvasTex;
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
P.rr = rr;

// superellipsoid shell with face-wrap bend and a nose notch; planar front UVs
function sEllip(sx, sy, sz, { e = [0.42, 0.55, 0.8], seg = [128, 72], bend = 0.28, nose = 0 } = {}) {
  let g = new THREE.SphereGeometry(1, seg[0], seg[1]);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g);
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  const f = (v, k) => Math.sign(v) * Math.pow(Math.abs(v), k);
  for (let i = 0; i < p.count; i++) {
    let x = f(p.getX(i), e[0]) * sx, y = f(p.getY(i), e[1]) * sy, z = f(p.getZ(i), e[2]) * sz;
    z -= bend * x * x;
    if (nose && y < 0) y += nose * Math.exp(-x * x / 0.03) * Math.min(1, -y / sy * 1.6);
    p.setXYZ(i, x, y, z);
    uv[i * 2] = x / (2 * sx) + 0.5; uv[i * 2 + 1] = y / (2 * sy) + 0.5;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// sweep a closed 2D profile along a path with a fixed up vector
function sweep(points, profile, up = new THREE.Vector3(0, 1, 0)) {
  const pos = [], uvs = [], idx = [], n = profile.length, N = points.length;
  let len = 0;
  for (let i = 0; i < N; i++) {
    if (i) len += points[i].distanceTo(points[i - 1]);
    const a = points[Math.max(0, i - 1)], b = points[Math.min(N - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    const nrm = new THREE.Vector3().crossVectors(up, t).normalize();
    for (let j = 0; j < n; j++) {
      const [cx, cy] = profile[j];
      const v = points[i].clone().addScaledVector(nrm, cx).addScaledVector(up, cy);
      pos.push(v.x, v.y, v.z); uvs.push(len, j / n);
    }
  }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < n; j++) {
    const j2 = (j + 1) % n, A = i * n + j, B = i * n + j2, C = (i + 1) * n + j2, D = (i + 1) * n + j;
    idx.push(A, B, C, A, C, D);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function rrProfile(w, h, r, cs = 6) {
  const out = [];
  const corners = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 1], [-w / 2 + r, -h / 2 + r, 2], [w / 2 - r, -h / 2 + r, 3]];
  corners.forEach(([cx, cy, q]) => { for (let k = 0; k <= cs; k++) { const a = (q + k / cs) * Math.PI / 2; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } });
  return out;
}

/* ---------- materials ---------- */
const knitBump = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) {
    const gr = g.createRadialGradient(x + 4, y + 4, 0, x + 4, y + 4, 5);
    gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(1, '#5a5a5a');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x + 4, y + 4, 2.4, 4, (y / 8) % 2 ? 0.6 : -0.6, 0, 7); g.fill();
  }
}, false);
knitBump.wrapS = knitBump.wrapT = THREE.RepeatWrapping;

P.chrome = (c = '#f1f1f8', irid = 0.55) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 1, roughness: 0.06, iridescence: irid, iridescenceIOR: 1.8, iridescenceThicknessRange: [180, 620], envMapIntensity: 1.25 });
P.alu = (k = 'silver') => { const f = P.FRAMES[k]; return new THREE.MeshPhysicalMaterial({ color: f.c, metalness: f.m, roughness: f.r, clearcoat: f.m < 1 ? 1 : 0.3, clearcoatRoughness: 0.1, iridescence: f.irid, iridescenceIOR: 1.5, iridescenceThicknessRange: [200, 500], envMapIntensity: 1.1 }); };
P.fabric = (k = 'lilac', rep = [1, 0.9]) => {
  const b = knitBump.clone(); b.needsUpdate = true; b.repeat.set(...rep); b.wrapS = b.wrapT = THREE.RepeatWrapping;
  return new THREE.MeshPhysicalMaterial({ color: P.STRAPS[k].c, roughness: 0.82, metalness: 0, sheen: 1, sheenColor: new THREE.Color('#f4efff'), sheenRoughness: 0.45, bumpMap: b, bumpScale: 3, envMapIntensity: 0.7 });
};
const glassGlow = canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  [[170, 130, 90, 'rgba(150,110,255,.7)'], [350, 120, 80, 'rgba(90,220,240,.6)'], [262, 150, 60, 'rgba(255,130,200,.4)']].forEach(([x, y, r, col]) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
});
P.visorGlass = (glow = 0.3) => new THREE.MeshPhysicalMaterial({ color: '#07070c', metalness: 0.15, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [120, 460], emissive: '#ffffff', emissiveMap: glassGlow, emissiveIntensity: glow, envMapIntensity: 1.8 });
const darkGloss = new THREE.MeshPhysicalMaterial({ color: '#15151d', roughness: 0.18, metalness: 0.2, clearcoat: 1, envMapIntensity: 1 });
P.darkGloss = darkGloss;

/* ---------- Prism One headset ---------- */
P.headset = function ({ frame = 'silver', strap = 'lilac', glow = 0.3, strapOn = true } = {}) {
  const root = new THREE.Group();
  const mats = { alu: P.alu(frame), fab: P.fabric(strap), glass: P.visorGlass(glow), seal: P.fabric('cloud', [10, 3]) };
  mats.seal.color.set('#d9dbe6');
  const glass = new THREE.Mesh(sEllip(1.0, 0.5, 0.36, { bend: 0.3, nose: 0.13 }), mats.glass);
  glass.position.z = 0.02;
  const fr = new THREE.Mesh(sEllip(1.035, 0.535, 0.3, { bend: 0.3, nose: 0.13, e: [0.4, 0.5, 0.6] }), mats.alu);
  fr.position.z = -0.06;
  const seal = new THREE.Mesh(sEllip(0.95, 0.46, 0.3, { bend: 0.3, nose: 0.12, e: [0.45, 0.55, 0.7], seg: [96, 48] }), mats.seal);
  seal.position.z = -0.26;
  root.add(glass, fr, seal);
  // crown + top button
  const crownG = new THREE.CylinderGeometry(0.075, 0.075, 0.07, 72, 1);
  const cp = crownG.attributes.position;
  for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), z = cp.getZ(i), r = Math.hypot(x, z); if (r > 0.07) { const a = Math.atan2(z, x), k = 1 + 0.05 * Math.sign(Math.sin(a * 36)); cp.setX(i, x * k); cp.setZ(i, z * k); } }
  crownG.computeVertexNormals();
  const crown = new THREE.Mesh(crownG, mats.alu); crown.position.set(0.72, 0.555, -0.22); root.add(crown);
  const btn = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.05, 0.08, 3, 0.024), mats.alu); btn.position.set(-0.7, 0.54, -0.21); btn.rotation.y = 0.35; root.add(btn);
  // sensors under the frame
  [-0.62, -0.3, 0.3, 0.62].forEach((x, i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 20, 12), darkGloss); s.scale.set(1, 0.45, 1); s.position.set(x, -0.5 + (Math.abs(x) > 0.5 ? 0.02 : 0.05), -0.06 - 0.3 * x * x + 0.06); root.add(s); });
  // strap + audio pods
  const parts = { glass, frame: fr, seal, crown };
  if (strapOn) {
    const pts = [];
    for (let i = 0; i <= 90; i++) { const t = i / 90 * Math.PI; pts.push(new THREE.Vector3(0.97 * Math.cos(t), -0.04 - 0.1 * Math.sin(t), -0.38 - 1.75 * Math.sin(t))); }
    const strapM = new THREE.Mesh(sweep(pts, rrProfile(0.075, 0.36, 0.035)), mats.fab);
    root.add(strapM); parts.strap = strapM;
    [-1, 1].forEach(s => {
      const pod = new THREE.Mesh(sEllip(0.07, 0.17, 0.27, { e: [0.6, 0.55, 0.6], bend: 0, seg: [48, 32] }), mats.alu);
      pod.position.set(s * 0.99, -0.03, -0.45); pod.rotation.y = s * 0.12; root.add(pod);
      const grill = new THREE.Mesh(sEllip(0.02, 0.09, 0.15, { e: [0.8, 0.6, 0.6], bend: 0, seg: [32, 24] }), darkGloss);
      grill.position.set(s * 1.045, -0.05, -0.46); grill.rotation.y = s * 0.12; root.add(grill);
    });
  }
  root.userData = { mats, parts };
  root.setFrame = k => { const m = P.alu(k); root.traverse(o => { if (o.material === mats.alu) o.material = m; }); mats.alu = m; };
  return root;
};

/* ---------- controller ---------- */
P.controller = function (side = 1, { shell = '#f4f2f8' } = {}) {
  const g = new THREE.Group();
  const pearl = new THREE.MeshPhysicalMaterial({ color: shell, roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.7, iridescenceIOR: 1.4, iridescenceThicknessRange: [250, 600], envMapIntensity: 1.1 });
  const prof = [];
  [[0, -0.62], [0.13, -0.6], [0.16, -0.52], [0.17, -0.3], [0.185, -0.05], [0.2, 0.1], [0.215, 0.2], [0.22, 0.26], [0.2, 0.3], [0, 0.31]].forEach(([x, y]) => prof.push(new THREE.Vector2(x, y)));
  const handle = new THREE.Mesh(new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(60), 72), pearl);
  handle.scale.set(1, 1, 0.82); g.add(handle);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 64), darkGloss); face.position.y = 0.3; face.scale.z = 0.82; g.add(face);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.07, 40), darkGloss); stick.position.set(-0.04 * side, 0.34, 0.02); g.add(stick);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 40, 20, 0, 6.3, 0, 1.2), new THREE.MeshPhysicalMaterial({ color: '#2a2a35', roughness: 0.55 })); cap.position.set(-0.04 * side, 0.36, 0.02); g.add(cap);
  [[0.09, -0.06], [0.1, 0.07]].forEach(([x, z]) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 32), P.chrome('#e6e6f0', 0.8)); b.position.set(x * side, 0.32, z); g.add(b); });
  const trig = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.18, 0.1, 3, 0.04), darkGloss); trig.position.set(0, 0.12, 0.17); trig.rotation.x = -0.3; g.add(trig);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.045, 28, 120), pearl);
  ring.position.set(0, 0.42, -0.06); ring.rotation.set(-0.95, 0, 0); ring.scale.set(1, 1.2, 1);
  g.add(ring);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.012, 12, 120), P.chrome('#d8ccff', 1)); band.position.copy(ring.position); band.rotation.copy(ring.rotation); band.scale.set(1.0, 1.2, 1); band.position.y += 0.0; band.translateZ(0.04); g.add(band);
  const strapLoop = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 12, 40, Math.PI), P.fabric('lilac', [4, 1])); strapLoop.position.set(0, -0.62, 0); strapLoop.rotation.x = Math.PI; g.add(strapLoop);
  return g;
};

/* ---------- liquid chrome blob ---------- */
P.blob = function (r = 1, { detail = 28, amp = 0.16, freq = 1.6, c = '#f4f4fb', irid = 0.7, seed = 0 } = {}) {
  let geo = new THREE.IcosahedronGeometry(1, detail);
  geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
  geo = mergeVertices(geo);
  const p = geo.attributes.position, base = p.array.slice();
  const m = new THREE.Mesh(geo, P.chrome(c, irid));
  m.scale.setScalar(r);
  m.update = t => {
    t += seed * 10;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
      const n = Math.sin(freq * 2 * x + t * 0.9) * Math.cos(freq * 1.6 * y - t * 0.6) + Math.sin(freq * 2.4 * z + t * 0.7 + seed) * 0.7 + Math.sin(freq * 3.3 * (x + y) + t * 1.1) * 0.35;
      const k = 1 + amp * n * 0.6;
      p.setXYZ(i, x * k, y * k, z * k);
    }
    p.needsUpdate = true; geo.computeVertexNormals();
  };
  m.update(0);
  return m;
};

/* ---------- holographic UI panel ---------- */
P.panel = function (w, h, draw, { px = 420, opacity = 1, tint = 'light' } = {}) {
  const W = Math.round(w * px), H = Math.round(h * px);
  const tex = canvasTex(W, H, (g) => {
    const r = Math.min(W, H) * 0.12;
    rr(g, 3, 3, W - 6, H - 6, r);
    const bg = g.createLinearGradient(0, 0, W, H);
    if (tint === 'light') { bg.addColorStop(0, 'rgba(255,255,255,.86)'); bg.addColorStop(0.5, 'rgba(240,236,255,.72)'); bg.addColorStop(1, 'rgba(225,248,252,.78)'); }
    else { bg.addColorStop(0, 'rgba(30,26,52,.82)'); bg.addColorStop(1, 'rgba(20,40,60,.78)'); }
    g.fillStyle = bg; g.fill();
    const st = g.createLinearGradient(0, 0, W, H);
    st.addColorStop(0, '#ffffff'); st.addColorStop(0.3, '#c3b2ff'); st.addColorStop(0.6, '#95eaf2'); st.addColorStop(1, '#ffb9de');
    g.lineWidth = 5; g.strokeStyle = st; g.stroke();
    g.save(); rr(g, 3, 3, W - 6, H - 6, r); g.clip();
    const sh = g.createLinearGradient(0, 0, 0, H * 0.45); sh.addColorStop(0, 'rgba(255,255,255,.55)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.fillRect(0, 0, W, H * 0.45);
    draw && draw(g, W, H);
    g.restore();
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  return mesh;
};

/* ---------- soft contact shadow ---------- */
P.shadow = function (scene, { sx = 3, sz = 1.4, y = -0.9, a = 0.35, col = '60,50,110' } = {}) {
  const tex = canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(0.45, `rgba(${col},${a * 0.4})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.scale.set(sx, sz, 1); m.position.y = y; m.renderOrder = -1; scene.add(m);
  return m;
};

/* ---------- sparkle particles ---------- */
P.sparkles = function (n = 160, spread = [6, 3.5, 3], size = 0.05) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * spread[0]; pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1]; pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2]; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = canvasTex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(210,190,255,.8)'); gr.addColorStop(1, 'rgba(160,230,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
  return new THREE.Points(g, new THREE.PointsMaterial({ size, map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
};

/* ---------- exploded optics stack ---------- */
function ringGeo(ow, oh, iw, ih, depth, bend, n = 4) {
  const sup = (a, b, k) => { const s = new THREE.Shape(); for (let i = 0; i <= 96; i++) { const t = i / 96 * Math.PI * 2, c = Math.cos(t), si = Math.sin(t); const x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / k), y = b * Math.sign(si) * Math.pow(Math.abs(si), 2 / k); i ? s.lineTo(x, y) : s.moveTo(x, y); } return s; };
  const s = sup(ow, oh, n); s.holes.push(sup(iw, ih, n));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4, curveSegments: 64 });
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) - bend * p.getX(i) ** 2);
  g.computeVertexNormals();
  return g;
}
const screenTex = (hue) => canvasTex(512, 420, (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, hue[0]); bg.addColorStop(0.5, hue[1]); bg.addColorStop(1, hue[2]);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.75)';
  for (let i = 0; i < 3; i++) { rr(g, 40 + i * 150, 250, 130, 120, 22); g.fill(); }
  rr(g, 40, 50, 430, 160, 26); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill();
  g.fillStyle = '#fff'; g.font = '700 54px Unbounded'; g.fillText('3,660 ppi', 70, 150);
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1;
  for (let x = 0; x < w; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
});
P.exploded = function () {
  const root = new THREE.Group(), layers = [];
  const add = (obj, name) => { const L = new THREE.Group(); L.add(obj); L.name = name; root.add(L); layers.push(L); return L; };
  // 1 front glass
  add(new THREE.Mesh(sEllip(1.0, 0.5, 0.14, { bend: 0.3, nose: 0.13, e: [0.42, 0.55, 0.9] }), P.visorGlass(0.4)), 'glass');
  // 2 aluminium frame ring
  add(new THREE.Mesh(ringGeo(1.03, 0.53, 0.9, 0.42, 0.12, 0.3), P.alu('silver')), 'frame');
  // 3 micro-OLED displays
  const disp = new THREE.Group();
  [-1, 1].forEach((s, i) => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.5, 0.05, 4, 0.04), darkGloss); b.position.x = s * 0.4; b.rotation.y = -s * 0.22;
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.44), new THREE.MeshBasicMaterial({ map: screenTex(i ? ['#7ee6f0', '#b9a6ff', '#ff9fd0'] : ['#b9a6ff', '#ff9fd0', '#8de9f1']), toneMapped: false }));
    sc.position.z = 0.027; b.add(sc); disp.add(b);
  });
  add(disp, 'displays');
  // 4 pancake lenses
  const lens = new THREE.Group();
  const lp = []; for (let i = 0; i <= 24; i++) { const t = i / 24; lp.push(new THREE.Vector2(0.27 * Math.sin(t * Math.PI / 2), 0.06 * Math.cos(t * Math.PI / 2))); }
  for (let i = 24; i >= 0; i--) { const t = i / 24; lp.push(new THREE.Vector2(0.27 * Math.sin(t * Math.PI / 2), -0.04 * Math.cos(t * Math.PI / 2))); }
  const lensMat = new THREE.MeshPhysicalMaterial({ color: '#e9f6ff', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.42, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.5, iridescenceThicknessRange: [300, 700], envMapIntensity: 2.4 });
  [-1, 1].forEach(s => {
    const l = new THREE.Mesh(new THREE.LatheGeometry(lp, 72), lensMat); l.rotation.x = Math.PI / 2; l.position.x = s * 0.4;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.275, 0.022, 16, 90), P.alu('lilac')); rim.position.x = s * 0.4;
    lens.add(l, rim);
  });
  add(lens, 'lenses');
  // 5 logic board with chips
  const board = new THREE.Group();
  const pcb = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.42, 0.04, 3, 0.02), new THREE.MeshPhysicalMaterial({ color: '#2b2c3c', roughness: 0.45, metalness: 0.3, clearcoat: 0.6 }));
  board.add(pcb);
  const chipTex = (t1, t2) => canvasTex(256, 256, (g, w, h) => { const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#d7d9e4'); bg.addColorStop(0.5, '#f7f7fb'); bg.addColorStop(1, '#b9bccb'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a38'; g.font = '700 70px Unbounded'; g.fillText(t1, 30, 130); g.font = '600 26px Inter'; g.fillText(t2, 32, 190); });
  [[-0.38, 0.32, 'P1', '3 nm · 12-core'], [0.22, 0.26, 'R2', 'sensor fusion'], [0.6, 0.14, 'M', '16 GB']].forEach(([x, s, a, b]) => {
    const c = new THREE.Mesh(new RoundedBoxGeometry(s, s, 0.04, 2, 0.01), [darkGloss, darkGloss, darkGloss, darkGloss, new THREE.MeshPhysicalMaterial({ map: chipTex(a, b), metalness: 0.8, roughness: 0.25 }), darkGloss]);
    c.position.set(x, 0, 0.04); board.add(c);
  });
  for (let i = 0; i < 18; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 0.02), P.chrome('#e4e4ee', 0.3)); c.position.set(-0.7 + i * 0.08, -0.17, 0.03); board.add(c); }
  add(board, 'board');
  // 6 light seal
  const sealMat = P.fabric('cloud', [30, 4]); sealMat.color.set('#dcdeea');
  add(new THREE.Mesh(ringGeo(0.98, 0.49, 0.78, 0.33, 0.22, 0.3), sealMat), 'seal');
  layers.forEach((L, i) => { L.userData.z = -i * 0.62; L.position.z = L.userData.z; });
  root.stack = layers;
  return root;
};

return P;
};
