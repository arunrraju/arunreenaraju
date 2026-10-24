// KAIROS — procedural tourbillon watch for Three.js (r160).
// Loaded as a classic script (pages open from file://); a module on the page passes THREE in:
//   const K = KAIROS3D(THREE, { RoundedBoxGeometry });
// Units are millimetres. The dial faces +Z, 12 o'clock is +Y.

window.KAIROS3D = (THREE, { RoundedBoxGeometry }) => {
const TAU = Math.PI * 2;
const V2 = (x, y) => new THREE.Vector2(x, y);

/* ---------------------------------------------------------------- options */
const METALS = {
  steel:    { hex: 0xdfe4ea, rough: .12, label: '904L Steel' },
  titanium: { hex: 0xa3abb5, rough: .2,  label: 'Grade 5 Titanium' },
  rose:     { hex: 0xeab49c, rough: .13, label: '18k Rose Gold' },
  platinum: { hex: 0xf1f3f6, rough: .1,  label: 'Platinum 950' }
};
const DIALS = {
  blue:   { a: '#2753c4', b: '#071640', light: 'rgba(160,195,255,.30)', dark: 'rgba(0,4,25,.45)', print: '#eef3fb', track: '#0a1a4a', sub: '#0b1d55' },
  onyx:   { a: '#272c36', b: '#06070a', light: 'rgba(210,220,240,.16)', dark: 'rgba(0,0,0,.5)', print: '#e9eef6', track: '#0b0d12', sub: '#101319' },
  silver: { a: '#f2f4f7', b: '#aeb6c1', light: 'rgba(255,255,255,.75)', dark: 'rgba(40,52,75,.28)', print: '#0b1530', track: '#d6dbe2', sub: '#c3c9d2' },
  skeleton:{ a: '#20252e', b: '#06070a', light: 'rgba(210,220,240,.16)', dark: 'rgba(0,0,0,.5)', print: '#e9eef6', track: '#0b0d12', sub: '#101319' }
};
const STRAPS = {
  alligator: { base: '#0c1428', hi: '#18264a', lo: '#04070f', stitch: '#9aa7bd' },
  calf:      { base: '#1a1b1f', hi: '#34363d', lo: '#08080a', stitch: '#8d96a6' },
  rubber:    { base: '#121418', hi: '#22252b', lo: '#050607', stitch: null }
};

/* ---------------------------------------------------------------- helpers */
function canvasTex(w, h, draw, { srgb = true, repeat = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
const lathe = (pts, seg = 160) => { const g = new THREE.LatheGeometry(pts.map(p => V2(p[0], p[1])), seg); g.rotateX(Math.PI / 2); return g; };
function metal(hex, rough = .14, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color: hex, metalness: 1, roughness: rough, envMapIntensity: 1.25, ...extra });
}
function circlePath(cx, cy, r, cw = false) { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, TAU, cw); return p; }
function arcBar(cx, cy, r, a0, a1, w) { // thick arc with round ends
  const s = new THREE.Shape(), ro = r + w / 2, ri = r - w / 2;
  s.absarc(cx, cy, ro, a0, a1, false);
  const ex = cx + Math.cos(a1) * r, ey = cy + Math.sin(a1) * r;
  s.absarc(ex, ey, w / 2, a1, a1 + Math.PI, false);
  s.absarc(cx, cy, ri, a1, a0, true);
  const sx = cx + Math.cos(a0) * r, sy = cy + Math.sin(a0) * r;
  s.absarc(sx, sy, w / 2, a0 + Math.PI, a0 + TAU, false);
  return s;
}
function barShape(x0, y0, x1, y1, w) { // stadium between two points
  const a = Math.atan2(y1 - y0, x1 - x0), s = new THREE.Shape();
  s.absarc(x1, y1, w / 2, a - Math.PI / 2, a + Math.PI / 2, false);
  s.absarc(x0, y0, w / 2, a + Math.PI / 2, a + Math.PI * 1.5, false);
  return s;
}
const extrude = (shape, depth, bevel = .12, seg = 2, curve = 24) =>
  new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: curve });

/* custom gear outline: N teeth on radius 1, optional spoke windows */
function gearShape(N, spokes = 5, hub = .26, rim = .8) {
  const s = new THREE.Shape(), m = 2 / N, ra = 1 + m * .9, rr = 1 - m * 1.15;
  for (let i = 0; i < N; i++) {
    const a = i / N * TAU, st = TAU / N;
    const pts = [[rr, a], [rr, a + st * .18], [ra, a + st * .34], [ra, a + st * .62], [rr, a + st * .78]];
    pts.forEach(([r, b], k) => { const x = Math.cos(b) * r, y = Math.sin(b) * r; i === 0 && k === 0 ? s.moveTo(x, y) : s.lineTo(x, y); });
  }
  s.closePath();
  if (spokes) {
    const gap = .2 / spokes * 5 * .55;
    for (let k = 0; k < spokes; k++) {
      const a0 = k / spokes * TAU + gap, a1 = (k + 1) / spokes * TAU - gap, h = new THREE.Path();
      h.absarc(0, 0, rim, a0, a1, false);
      h.absarc(0, 0, hub + .06, a1 - gap * .4, a0 + gap * .4, true);
      h.closePath(); s.holes.push(h);
    }
  }
  s.holes.push(circlePath(0, 0, .07, true));
  return s;
}
function pinionShape(N = 10) {
  const s = new THREE.Shape();
  for (let i = 0; i < N * 2; i++) { const a = i / (N * 2) * TAU, r = i % 2 ? .62 : 1; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(r, 0); }
  s.closePath(); return s;
}

/* faceted dauphine hand (four facets + flat back) */
function dauphine(L, w, tail, h = .24) {
  const a = L * .17, T = [0, -tail, 0], Lf = [-w, a, 0], P = [0, L, 0], R = [w, a, 0], C = [0, a, h];
  const tris = [T, C, Lf, Lf, C, P, T, R, C, R, P, C, T, Lf, P, T, P, R];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals(); return g;
}

/* ---------------------------------------------------------------- textures */
const texCache = {};
function dialTex(key, mode) {
  const id = key + mode; if (texCache[id]) return texCache[id];
  const p = DIALS[key], S = 2048, C = S / 2, k = C / 16.4, skel = key === 'skeleton', bump = mode === 'bump';
  const t = canvasTex(S, S, g => {
    const P = (x, y) => [C + x * k, C - y * k];
    if (bump) { g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); }
    else { const gr = g.createRadialGradient(C, C * .82, 0, C, C, C * 1.05); gr.addColorStop(0, p.a); gr.addColorStop(1, p.b); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
    const L = bump ? 'rgba(255,255,255,.55)' : p.light, D = bump ? 'rgba(0,0,0,.55)' : p.dark;
    if (!skel) {
      // rosette guilloché
      g.save(); g.beginPath(); g.arc(C, C, 11.5 * k, 0, TAU); g.clip(); g.lineWidth = 1.5;
      for (let i = 0; i < 210; i++) {
        const a = i / 210 * TAU, [x, y] = P(Math.cos(a) * 3.3, Math.sin(a) * 3.3);
        g.strokeStyle = D; g.beginPath(); g.arc(x + 1.3, y + 1.3, 8.3 * k, 0, TAU); g.stroke();
        g.strokeStyle = L; g.beginPath(); g.arc(x, y, 8.3 * k, 0, TAU); g.stroke();
      }
      g.restore();
      // azurage ring
      for (let r = 11.65; r < 14.75; r += .13) { g.strokeStyle = Math.round(r / .13) % 2 ? L : D; g.lineWidth = 2; g.beginPath(); g.arc(C, C, r * k, 0, TAU); g.stroke(); }
    }
    if (!bump) {
      // sunray sheen
      const cg = g.createConicGradient(-.4, C, C);
      for (let i = 0; i <= 8; i++) cg.addColorStop(i / 8, i % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)');
      g.fillStyle = cg; g.fillRect(0, 0, S, S);
      // chapter track
      g.fillStyle = p.track; g.beginPath(); g.arc(C, C, 16.4 * k, 0, TAU); g.arc(C, C, 14.85 * k, 0, TAU, true); g.fill();
      g.strokeStyle = p.print; g.globalAlpha = .9;
      for (let i = 0; i < 60; i++) {
        const a = i / 60 * TAU, big = i % 5 === 0, r0 = big ? 15.05 : 15.35, r1 = 16.05;
        g.lineWidth = big ? 5 : 2.2; g.beginPath(); g.moveTo(...P(Math.sin(a) * r0, Math.cos(a) * r0)); g.lineTo(...P(Math.sin(a) * r1, Math.cos(a) * r1)); g.stroke();
        for (let j = 1; j < 5 && i % 1 === 0; j++) { const b = (i + j / 5) / 60 * TAU; g.lineWidth = 1; g.beginPath(); g.moveTo(...P(Math.sin(b) * 15.7, Math.cos(b) * 15.7)); g.lineTo(...P(Math.sin(b) * 16.05, Math.cos(b) * 16.05)); g.stroke(); }
      }
      g.lineWidth = 2; [14.9, 16.15].forEach(r => { g.beginPath(); g.arc(C, C, r * k, 0, TAU); g.stroke(); });
      g.globalAlpha = 1;
    }
    if (!skel) {
      // sub-dials: power reserve (9) and 24h (3)
      [[-7.6, 'PR'], [7.6, '24']].forEach(([sx, kind]) => {
        const [x, y] = P(sx, 0);
        if (!bump) { g.fillStyle = p.sub; g.beginPath(); g.arc(x, y, 3.45 * k, 0, TAU); g.fill(); }
        for (let r = .5; r < 3.4; r += .075) { g.strokeStyle = Math.round(r / .075) % 2 ? L : D; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, r * k, 0, TAU); g.stroke(); }
        if (bump) return;
        g.strokeStyle = p.print; g.fillStyle = p.print;
        const n = kind === 'PR' ? 12 : 24, span = kind === 'PR' ? 4.2 : TAU, a0 = kind === 'PR' ? -2.1 : 0;
        for (let i = 0; i <= (kind === 'PR' ? n : n - 1); i++) {
          const a = a0 + i / n * span, big = kind === 'PR' ? i % 3 === 0 : i % 6 === 0, r0 = big ? 2.45 : 2.8;
          g.lineWidth = big ? 4 : 2; g.beginPath(); g.moveTo(x + Math.sin(a) * r0 * k, y - Math.cos(a) * r0 * k); g.lineTo(x + Math.sin(a) * 3.2 * k, y - Math.cos(a) * 3.2 * k); g.stroke();
        }
        g.font = `500 ${.62 * k}px "IBM Plex Mono"`; g.textAlign = 'center'; g.textBaseline = 'middle';
        if (kind === 'PR') { [['0', -2.1], ['36', 0], ['72', 2.1]].forEach(([s, a]) => g.fillText(s, x + Math.sin(a) * 1.75 * k, y - Math.cos(a) * 1.75 * k)); g.font = `600 ${.5 * k}px "IBM Plex Mono"`; g.fillText('RÉSERVE', x, y + 1.2 * k); }
        else { [['24', 0], ['6', Math.PI / 2], ['12', Math.PI], ['18', Math.PI * 1.5]].forEach(([s, a]) => g.fillText(s, x + Math.sin(a) * 1.8 * k, y - Math.cos(a) * 1.8 * k)); }
      });
      if (!bump) {
        // aperture shadow + prints
        const [ax, ay] = P(0, -7.4); const sg = g.createRadialGradient(ax, ay, 4.4 * k, ax, ay, 5.6 * k);
        sg.addColorStop(0, 'rgba(0,0,0,.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.beginPath(); g.arc(ax, ay, 5.6 * k, 0, TAU); g.fill();
        g.fillStyle = p.print; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `600 ${1.32 * k}px Unbounded`; g.letterSpacing = `${.42 * k}px`; g.fillText('KAIROS', C + .21 * k, C - 8.55 * k);
        g.font = `500 ${.5 * k}px "IBM Plex Mono"`; g.letterSpacing = `${.28 * k}px`; g.fillText('GENÈVE · KT-01', C + .14 * k, C - 6.85 * k);
        g.font = `500 ${.56 * k}px "IBM Plex Mono"`; g.fillText('TOURBILLON', C + .14 * k, C + 13.05 * k);
        g.font = `500 ${.36 * k}px "IBM Plex Mono"`; g.letterSpacing = `${.2 * k}px`; g.fillText('SWISS MADE', C + .1 * k, C + 14.15 * k);
        g.letterSpacing = '0px';
      }
    }
  }, { srgb: !bump });
  texCache[id] = t; return t;
}
function repeatTex(id, size, draw, srgb = true) {
  if (texCache[id]) return texCache[id];
  return texCache[id] = canvasTex(size, size, draw, { srgb, repeat: true });
}
const perlageTex = () => repeatTex('perlage', 1024, (g, S) => {
  g.fillStyle = '#b9c0ca'; g.fillRect(0, 0, S, S); const st = 38;
  for (let y = -st, row = 0; y < S + st; y += st * .8, row++) for (let x = -st + (row % 2) * st / 2; x < S + st; x += st) {
    const cg = g.createConicGradient(Math.random() * 6, x, y);
    cg.addColorStop(0, '#f4f6f9'); cg.addColorStop(.25, '#8e97a4'); cg.addColorStop(.5, '#eef1f5'); cg.addColorStop(.75, '#9aa3b0'); cg.addColorStop(1, '#f4f6f9');
    g.fillStyle = cg; g.beginPath(); g.arc(x, y, st * .62, 0, TAU); g.fill();
  }
});
const cotesTex = () => repeatTex('cotes', 1024, (g, S) => {
  const n = 8, w = S / n;
  for (let i = 0; i < n; i++) { const gr = g.createLinearGradient(i * w, 0, i * w + w, 0); gr.addColorStop(0, '#1d222c'); gr.addColorStop(.45, '#6d7788'); gr.addColorStop(.55, '#8994a6'); gr.addColorStop(1, '#232934'); g.fillStyle = gr; g.fillRect(i * w, 0, w, S); }
  g.globalAlpha = .08; for (let i = 0; i < 4000; i++) { g.fillStyle = Math.random() > .5 ? '#fff' : '#000'; g.fillRect(Math.random() * S, Math.random() * S, 1, 3 + Math.random() * 6); }
});
function strapTex(kind) {
  const c = STRAPS[kind];
  return repeatTex('strap' + kind, 1024, (g, S) => {
    g.fillStyle = c.base; g.fillRect(0, 0, S, S);
    if (kind === 'alligator') {
      // scale rows: big rectangles on the top face, smaller towards edges
      let y = 0; while (y < S) {
        const h = 70 + Math.random() * 60; let x = 0;
        while (x < S) {
          const u = x / S, top = u > .08 && u < .42, w = top ? 64 + Math.random() * 46 : 30 + Math.random() * 16;
          const gr = g.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w * .7);
          gr.addColorStop(0, c.hi); gr.addColorStop(1, c.base); g.fillStyle = gr; g.globalAlpha = .55 + Math.random() * .45;
          g.beginPath(); g.roundRect(x + 3, y + 3, w - 6, (top ? h : h / 2) - 6, 16); g.fill();
          g.globalAlpha = 1; g.strokeStyle = c.lo; g.lineWidth = 3; g.stroke();
          if (!top) { g.fillStyle = gr; g.beginPath(); g.roundRect(x + 3, y + h / 2 + 3, w - 6, h / 2 - 6, 12); g.fill(); g.stroke(); } x += w;
        }
        y += h;
      }
    } else if (kind === 'calf') {
      for (let i = 0; i < 26000; i++) { g.fillStyle = Math.random() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; g.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
    } else {
      for (let y = 0; y < S; y += 32) { g.fillStyle = c.lo; g.fillRect(S * .12, y, S * .26, 12); g.fillStyle = c.hi; g.fillRect(S * .12, y + 12, S * .26, 3); }
    }
    if (c.stitch) {
      g.strokeStyle = c.stitch; g.lineWidth = 7; g.lineCap = 'round';
      [.078, .422].forEach(u => { for (let y = 8; y < S; y += 34) { g.beginPath(); g.moveTo(u * S, y); g.lineTo(u * S, y + 18); g.stroke(); } });
    }
  });
}
const shadowTex = () => texCache.shadow || (texCache.shadow = canvasTex(256, 256, (g, S) => {
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(.45, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
}));
const crownTex = () => texCache.crown || (texCache.crown = canvasTex(256, 256, (g, S) => {
  g.fillStyle = '#9aa3ae'; g.fillRect(0, 0, S, S);
  const cg = g.createConicGradient(0, S / 2, S / 2); for (let i = 0; i <= 16; i++) cg.addColorStop(i / 16, i % 2 ? '#e8ecf1' : '#8d96a2');
  g.fillStyle = cg; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, TAU); g.fill();
  g.fillStyle = '#2a3140'; g.font = '700 120px Unbounded'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('K', S / 2, S / 2 + 6);
}));

/* ---------------------------------------------------------------- environment */
function makeEnv(renderer, tint = 0x7aa2ff) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 vP;void main(){float y=vP.y;vec3 top=vec3(.10,.14,.26),hor=vec3(.045,.07,.14),bot=vec3(.006,.008,.016);vec3 c=y>0.?mix(hor,top,pow(y,.7)):mix(hor,bot,pow(-y,.5));gl_FragColor=vec4(c,1.);}'
  })));
  const panel = (w, h, col, k, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(70, 16, 0xffffff, 4.5, [0, 70, 15]);
  panel(9, 70, 0xffffff, 7, [-70, 10, 35]);
  panel(9, 70, tint, 6, [72, 4, -18]);
  panel(46, 8, 0xffffff, 2, [0, -24, 80]);
  panel(22, 22, 0xfff0e2, 3.4, [44, 38, 60]);
  panel(30, 5, tint, 2.5, [-30, -40, -50]);
  const pm = new THREE.PMREMGenerator(renderer); const tex = pm.fromScene(s, .02).texture; pm.dispose(); return tex;
}

/* ---------------------------------------------------------------- the watch */
function buildWatch(o = {}) {
  o = { metal: 'steel', dial: 'blue', strap: 'alligator', caseOn: true, movement: true, ...o };
  const M = METALS[o.metal], root = new THREE.Group(), ex = [];
  const reg = (obj, dz) => { obj.userData.z0 = obj.position.z; obj.userData.dz = dz; ex.push(obj); return obj; };
  const skel = o.dial === 'skeleton';

  const polished = metal(M.hex, M.rough), brushed = metal(M.hex, M.rough + .2, { anisotropy: .8 });
  const steel = metal(0xdde2e8, .12), dark = metal(0x2b3240, .32), rhodium = metal(0xd3d8df, .18);
  const blued = metal(0x2346a8, .2, { clearcoat: 1, clearcoatRoughness: .05 });
  const ruby = new THREE.MeshPhysicalMaterial({ color: 0xa3102e, metalness: 0, roughness: .05, clearcoat: 1, transmission: 0, sheen: 0, emissive: 0x2a0008, envMapIntensity: 2 });
  const gold = metal(0xe2c08a, .16);
  const handMat = (o.dial === 'silver') ? blued : (o.metal === 'rose' ? polished : metal(0xf2f5f8, .2));

  /* ---- case ---- */
  if (o.caseOn) {
    const caseG = new THREE.Group(); root.add(caseG); reg(caseG, 0);
    caseG.add(new THREE.Mesh(lathe([[16.2, .9], [18.6, .9], [19.8, 1.5], [20.7, 2.7], [21.1, 4.3], [21.1, 7.3], [20.85, 8.5], [20.3, 9.15], [17.9, 9.2], [17.7, 7.6]]), polished));
    // lugs
    const lugPts = [[14.5, 1.6], [19.5, 1.7], [23.2, 2.3], [25.1, 3.3], [25.5, 4.6], [24.9, 5.8], [22.2, 7.4], [18.5, 8.5], [14.5, 8.8]];
    [1, -1].forEach(sy => {
      const sh = new THREE.Shape(); const pts = lugPts.map(([y, z]) => V2(y * sy, z));
      sh.moveTo(pts[0].x, pts[0].y); sh.splineThru(pts.slice(1)); sh.closePath();
      const g = extrude(sh, 2.6, .45, 3, 40);
      g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
      [-1, 1].forEach(sx => { const m = new THREE.Mesh(g, polished); m.position.x = sx > 0 ? 9.95 : -12.55; caseG.add(m); });
      // spring-bar ends
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 19.6, 16), steel); bar.rotation.z = Math.PI / 2; bar.position.set(0, 22.6 * sy, 3.9); caseG.add(bar);
    });
    // bezel (polished flank + brushed top)
    const bezel = new THREE.Group(); bezel.position.z = 0; root.add(bezel); reg(bezel, 26);
    bezel.add(new THREE.Mesh(lathe([[17.6, 9.2], [20.3, 9.2], [20.55, 9.65], [20.35, 10.6], [19.6, 11.2]]), polished));
    bezel.add(new THREE.Mesh(lathe([[19.6, 11.2], [18.2, 11.45]]), brushed));
    bezel.add(new THREE.Mesh(lathe([[18.2, 11.45], [17.55, 11.35], [17.4, 10.9]]), polished));
    // sapphire crystal
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .0, transmission: 1, thickness: .5, ior: 1.5, specularIntensity: .14, envMapIntensity: .7, iridescence: .15, iridescenceIOR: 1.3, attenuationColor: new THREE.Color(0xdde6ff), attenuationDistance: 12 });
    bezel.add(new THREE.Mesh(lathe([[0, 12.05], [8, 11.98], [14, 11.75], [17.5, 11.35], [17.5, 10.7], [14, 11.0], [8, 11.18], [0, 11.25], [0, 12.05]], 96), glass));
    // rehaut
    const reh = new THREE.Mesh(lathe([[16.35, 7.9], [17.75, 9.3]]), metal(o.dial === 'silver' ? 0xc9cfd8 : 0x1b2232, .3)); caseG.add(reh);
    // crown
    const cg = new THREE.CylinderGeometry(3.15, 3.15, 3.4, 72, 1, false); const pa = cg.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), r = Math.hypot(x, z); if (r > 3) { const f = (Math.round(Math.atan2(z, x) / TAU * 72 * 2) % 2) ? 1 : .955; pa.setX(i, x * f); pa.setZ(i, z * f); } }
    cg.computeVertexNormals(); cg.rotateZ(-Math.PI / 2);
    const crown = new THREE.Mesh(cg, polished); crown.position.set(23.9, 0, 4.8); caseG.add(crown);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshPhysicalMaterial({ map: crownTex(), metalness: 1, roughness: .2, color: new THREE.Color(M.hex) })); cap.rotation.y = Math.PI / 2; cap.position.set(25.62, 0, 4.8); caseG.add(cap);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2, 24), steel); tube.rotation.z = Math.PI / 2; tube.position.set(21.4, 0, 4.8); caseG.add(tube);
    // caseback: brushed ring + sapphire
    const back = new THREE.Group(); root.add(back); reg(back, -12);
    back.add(new THREE.Mesh(lathe([[13.2, .9], [18.4, .9], [18.0, .25], [15, 0], [13.2, .05], [13.2, .9]]), brushed));
    back.add(new THREE.Mesh(lathe([[0, .1], [13.3, .1], [13.3, .7], [0, .7]], 64), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .03, transmission: 1, thickness: .6, ior: 1.77, metalness: 0 })));
    // shadow-catcher behind dial so the case never looks hollow
    // strap
    if (o.strap && o.strap !== 'none') root.add(buildStrap(o, polished, brushed));
  }

  /* ---- movement ---- */
  const mv = new THREE.Group(); root.add(mv);
  const anchors = {}; const anc = (name, parent, x, y, z) => { const a = new THREE.Object3D(); a.position.set(x, y, z); parent.add(a); anchors[name] = a; };
  if (o.movement) {
    // mainplate with skeleton windows
    const mp = new THREE.Shape(); mp.absarc(0, 0, 16.1, 0, TAU, false);
    mp.holes.push(circlePath(0, -7.4, 5.3, true), circlePath(0, 0, .7, true));
    const win = (r0, r1, a0, a1) => { const h = new THREE.Path(); h.absarc(0, 0, r1, a0 * Math.PI / 180, a1 * Math.PI / 180, false); h.absarc(0, 0, r0, a1 * Math.PI / 180, a0 * Math.PI / 180, true); h.closePath(); return h; };
    mp.holes.push(win(9, 14.3, 28, 74), win(9, 14.3, 106, 152), win(8.8, 14.3, 190, 222), win(8.8, 14.3, 318, 350));
    const pt = perlageTex(); const plateTop = new THREE.MeshPhysicalMaterial({ map: pt, metalness: .9, roughness: .3, color: 0xffffff, envMapIntensity: 1.1 });
    pt.repeat.set(1 / 9, 1 / 9);
    const plate = new THREE.Mesh(extrude(mp, .8, .12, 1, 48), [plateTop, rhodium]); plate.position.z = 3.0; mv.add(plate); reg(plate, -6);

    // gears — one custom geometry, many instances
    const wheelG = extrude(gearShape(64, 5), .3, .03, 1, 8), solidG = extrude(gearShape(84, 0), .5, .03, 1, 8), pin = extrude(pinionShape(10), 1.2, 0);
    const wheelMat = metal(0xe9d2a6, .2), solidMat = metal(0xc9ced6, .22);
    const wheels = [[0, 0, 5.1, 5.15], [-7.0, -2.6, 3.9, 5.75], [8.7, -4.6, 2.6, 5.4], [11.3, -7.4, 1.8, 5.8], [12.6, 2.6, 2.2, 6.0]];
    const iw = new THREE.InstancedMesh(wheelG, wheelMat, wheels.length), ip = new THREE.InstancedMesh(pin, rhodium, wheels.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    wheels.forEach(([x, y, r, z], i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), i * .7);
      iw.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z), q, sc.set(r, r, 1)));
      ip.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z - .5), q, sc.set(.55, .55, 1)));
    });
    const train = new THREE.Group(); train.add(iw, ip); mv.add(train); reg(train, 4); train.userData.wheels = wheels; train.userData.iw = iw;
    const barrel = new THREE.Mesh(solidG, solidMat); barrel.scale.set(6.0, 6.0, 1); barrel.position.set(3.6, 7.2, 4.6); train.add(barrel);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(5.3, 5.3, 1.4, 64), dark); drum.rotation.x = Math.PI / 2; drum.position.set(3.6, 7.2, 5.6); train.add(drum);
    anc('train', train, -7.0, -2.6, 5.8); anc('barrel', train, 3.6, 7.2, 6.2); anc('plate', plate, 13.5, -6, .8);

    // bridges — anthracite côtes de Genève, polished chamfers
    const ct = cotesTex(); ct.repeat.set(1 / 16, 1 / 16); ct.rotation = Math.PI / 4;
    const bridgeTop = new THREE.MeshPhysicalMaterial({ map: ct, metalness: .95, roughness: .28, color: 0xffffff });
    const bridges = new THREE.Group(); mv.add(bridges); reg(bridges, 8.5);
    const addB = sh => { const m = new THREE.Mesh(extrude(sh, .55, .18, 2, 40), [bridgeTop, polished]); m.position.z = 6.45; bridges.add(m); };
    const ringB = new THREE.Shape(); ringB.absarc(3.6, 7.2, 6.6, 0, TAU, false); ringB.holes.push(circlePath(3.6, 7.2, 4.4, true)); addB(ringB);
    addB(barShape(8.4, 10.6, 13.4, 6.4, 2.4)); addB(barShape(-1.2, 11.8, -6.4, 12.6, 2.4));
    addB(arcBar(0, 0, 9.6, 2.75, 3.75, 2.2)); addB(barShape(-8.6, -3.6, 0, 0, 2.0)); addB(barShape(0, 0, 9.6, -2.4, 1.8));
    addB(barShape(9.6, -2.4, 11.3, -7.4, 1.8));
    anc('bridge', bridges, -9.2, 2.2, 7.2);
    // ratchet wheel with sunburst
    const rat = new THREE.Mesh(solidG, metal(0xd6dbe2, .14)); rat.scale.set(4.1, 4.1, .8); rat.position.set(3.6, 7.2, 7.25); bridges.add(rat);
    // jewels, chatons, blued screws — instanced
    const jp = [[0, 0], [-7, -2.6], [8.7, -4.6], [11.3, -7.4], [12.6, 2.6], [10.9, 8.5], [-3.8, 12.2], [-9.4, 1.0], [5.2, -1.2], [-4.3, -1.8]];
    const jw = new THREE.InstancedMesh(new THREE.CylinderGeometry(.42, .5, .3, 24).rotateX(Math.PI / 2), ruby, jp.length);
    const ch = new THREE.InstancedMesh(new THREE.TorusGeometry(.62, .16, 10, 32), gold, jp.length);
    jp.forEach(([x, y], i) => { jw.setMatrixAt(i, m4.makeTranslation(x, y, 7.2)); ch.setMatrixAt(i, m4.makeTranslation(x, y, 7.18)); });
    bridges.add(jw, ch);
    const sp = [[13.4, 6.4], [-6.4, 12.6], [8.4, 10.6], [-1.2, 11.8], [-8.6, -3.6], [9.6, -2.4], [3.6 + 5.5, 7.2 - 3.3], [3.6 - 5.4, 7.2 + 3.4], [3.6, 7.2]];
    const sw = new THREE.InstancedMesh(new THREE.CylinderGeometry(.62, .62, .4, 24).rotateX(Math.PI / 2), blued, sp.length);
    const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(1.15, .16, .12), new THREE.MeshStandardMaterial({ color: 0x050812, roughness: .6 }), sp.length);
    sp.forEach(([x, y], i) => {
      const z = i === sp.length - 1 ? 7.9 : 7.3;
      sw.setMatrixAt(i, m4.makeTranslation(x, y, z)); q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), i * 1.3);
      sl.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z + .2), q, sc.set(1, 1, 1)));
    });
    bridges.add(sw, sl);

    // tourbillon cage (rotates once a minute)
    const tb = new THREE.Group(); tb.position.set(0, -7.4, 0); mv.add(tb); reg(tb, 12);
    const cage = new THREE.Group(); tb.add(cage);
    const frameMat = steel;
    [4.6, 7.45].forEach(z => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4.0, .17, 12, 96), frameMat); ring.position.z = z; cage.add(ring);
      for (let k = 0; k < 3; k++) {
        const arm = new THREE.Mesh(extrude(barShape(0, 0, 4.0 * Math.cos(k * TAU / 3 + .5), 4.0 * Math.sin(k * TAU / 3 + .5), .62), .16, .06, 1, 12), frameMat);
        arm.position.z = z - .1; cage.add(arm);
      }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .35, 32).rotateX(Math.PI / 2), frameMat); hub.position.z = z + .05; cage.add(hub);
    });
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + .5 + Math.PI / 3, p = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 2.9, 12).rotateX(Math.PI / 2), frameMat); p.position.set(Math.cos(a) * 3.95, Math.sin(a) * 3.95, 6.03); cage.add(p); }
    const cj = new THREE.Mesh(new THREE.CylinderGeometry(.35, .38, .3, 20).rotateX(Math.PI / 2), ruby); cj.position.z = 7.65; cage.add(cj);
    const bal = new THREE.Group(); bal.position.z = 6.35; cage.add(bal);
    bal.add(new THREE.Mesh(new THREE.TorusGeometry(2.55, .17, 10, 80), gold));
    const sp2 = new THREE.Mesh(new THREE.BoxGeometry(5.1, .32, .14), gold); bal.add(sp2);
    for (let k = 0; k < 6; k++) { const a = k * TAU / 6, s = new THREE.Mesh(new THREE.SphereGeometry(.24, 10, 8), gold); s.position.set(Math.cos(a) * 2.8, Math.sin(a) * 2.8, 0); bal.add(s); }
    const hs = []; for (let i = 0; i <= 420; i++) { const t = i / 420, a = t * 13 * TAU, r = .45 + t * 1.6; hs.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, -.35)); }
    const spring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hs), 840, .035, 3), blued); bal.add(spring);
    const esc = new THREE.Mesh(wheelG, metal(0xd8dde4, .16)); esc.scale.set(1.15, 1.15, 1); esc.position.set(1.7, -1.6, 5.0); cage.add(esc);
    const fork = new THREE.Mesh(extrude(barShape(-.2, -.3, 1.4, -1.0, .32), .18, .04, 1, 8), steel); fork.position.z = 5.6; cage.add(fork);
    // fixed seconds wheel ring under the cage
    const fw = new THREE.Mesh(wheelG, wheelMat); fw.scale.set(4.6, 4.6, 1); fw.position.z = 4.2; tb.add(fw);
    anc('tourbillon', tb, 0, 0, 7.6);
    root.userData.cage = cage; root.userData.balance = bal; root.userData.esc = esc;
  }

  /* ---- dial ---- */
  const dialG = new THREE.Group(); root.add(dialG); reg(dialG, 16);
  {
    const R = 16.4, sh = new THREE.Shape(); sh.absarc(0, 0, R, 0, TAU, false);
    if (skel) sh.holes.push(circlePath(0, 0, 13.0, true)); else sh.holes.push(circlePath(0, -7.4, 4.6, true));
    const g = new THREE.ShapeGeometry(sh, 128), pa = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pa.count; i++) uv.setXY(i, pa.getX(i) / (2 * R) + .5, pa.getY(i) / (2 * R) + .5);
    const dm = new THREE.MeshPhysicalMaterial({ map: dialTex(o.dial, 'color'), bumpMap: dialTex(o.dial, 'bump'), bumpScale: 1.4, metalness: o.dial === 'silver' ? .55 : .75, roughness: .32, clearcoat: .35, clearcoatRoughness: .12 });
    const dial = new THREE.Mesh(g, dm); dial.position.z = 7.9; dialG.add(dial);
    // applied faceted indices
    const r0 = skel ? 13.4 : 12.4, r1 = skel ? 15.0 : 14.6;
    const ishape = new THREE.Shape(); ishape.moveTo(-.38, 0); ishape.lineTo(.38, 0); ishape.lineTo(.38, r1 - r0); ishape.lineTo(-.38, r1 - r0); ishape.closePath();
    const ig = extrude(ishape, .12, .2, 1, 4); const list = [];
    for (let h = 0; h < 12; h++) { if (!skel && h === 6) continue; if (h === 0) { list.push([0, -.75], [0, .75]); } else list.push([h, 0]); }
    const im = new THREE.InstancedMesh(ig, handMat === blued ? polished : handMat, list.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    list.forEach(([h, off], i) => {
      const a = -h / 12 * TAU; q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
      const p = new THREE.Vector3(off, r0, 8.0).applyAxisAngle(new THREE.Vector3(0, 0, 1), a); p.z = 8.0;
      im.setMatrixAt(i, m4.compose(p, q, new THREE.Vector3(1, 1, 1)));
    });
    dialG.add(im);
    if (!skel) {
      const ring = (x, y, r) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, .14, 10, 96), polished); m.position.set(x, y, 7.95); dialG.add(m); };
      ring(0, -7.4, 4.7); ring(-7.6, 0, 3.45); ring(7.6, 0, 3.45);
    }
    // tourbillon bridge (polished steel lyre over the aperture)
    const tbb = new THREE.Group(); dialG.add(tbb);
    const lyre = new THREE.Mesh(extrude(arcBar(0, -13.7, 6.3, .5, Math.PI - .5, 1.0), .3, .14, 2, 48), steel); lyre.position.z = 8.15; tbb.add(lyre);
    const pivot = new THREE.Mesh(extrude(circleShape(0, -7.4, 1.25), .3, .14, 2, 32), steel); pivot.position.z = 8.15; tbb.add(pivot);
    const pj = new THREE.Mesh(new THREE.CylinderGeometry(.42, .46, .3, 20).rotateX(Math.PI / 2), ruby); pj.position.set(0, -7.4, 8.6); tbb.add(pj);
    [-1, 1].forEach(s => { const sc2 = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .3, 20).rotateX(Math.PI / 2), blued); sc2.position.set(s * 5.35, -10.55, 8.5); tbb.add(sc2); });
    anc('dial', dialG, -10.5, 6.5, 8); anc('bridgeT', dialG, 3.6, -9.6, 8.5);
  }

  /* ---- hands ---- */
  const hands = new THREE.Group(); root.add(hands); reg(hands, 21);
  const mk = (geo, z, mat = handMat) => { const g = new THREE.Group(); const m = new THREE.Mesh(geo, mat); g.add(m); g.position.z = z; hands.add(g); return g; };
  const hH = mk(dauphine(9.2, 1.0, 2.1), 8.75), hM = mk(dauphine(14.2, .8, 2.6), 9.1);
  const sec = new THREE.Group(); sec.position.z = 9.45; hands.add(sec);
  const secMat = o.dial === 'blue' ? steel : blued;
  const needle = new THREE.Mesh(new THREE.BoxGeometry(.17, 18.6, .1), secMat); needle.position.y = 4.9; sec.add(needle);
  const cw = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .12, 32).rotateX(Math.PI / 2), secMat); cw.position.y = -3.2; sec.add(cw);
  const tip = new THREE.Mesh(new THREE.BoxGeometry(.3, 2.0, .12), metal(0x6f9bff, .2, { emissive: 0x1d3a99, emissiveIntensity: .5 })); tip.position.y = 13.2; sec.add(tip);
  [[.9, 8.7], [.75, 9.05], [.55, 9.4], [.32, 9.55]].forEach(([r, z]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .22, 32).rotateX(Math.PI / 2), z > 9.3 ? secMat : handMat); c.position.z = z; hands.add(c); });
  let subA = null, subB = null;
  if (!skel) { subA = mk(dauphine(2.7, .26, .6, .12), 8.1); subA.position.x = -7.6; subB = mk(dauphine(2.7, .26, .6, .12), 8.1); subB.position.x = 7.6; }
  anc('hands', hands, 5.5, 9.0, 9.4); anc('crystal', root, -11.5, 11, 11.3); anc('crown', root, 25.6, 0, 4.8); anc('case', root, 14.6, -14.6, 8); anc('lug', root, -11.3, 25, 5);

  /* ---- shadow card ---- */
  root.userData = { ...root.userData, ex, anchors, hands: { hH, hM, sec, subA, subB }, opts: o };
  root.setExplode = e => ex.forEach(obj => { obj.position.z = obj.userData.z0 + obj.userData.dz * e; });
  root.setExplode(0);
  const t0 = performance.now(), base = new Date(); const startSec = base.getSeconds() + base.getMilliseconds() / 1000;
  root.tick = (now = performance.now()) => {
    const el = (now - t0) / 1000, s = startSec + el, whole = Math.floor(s), f = s - whole;
    const snap = f < .14 ? (1 - Math.pow(1 - f / .14, 3)) * 1.04 - .04 * Math.max(0, f / .14 - .6) : 1;
    const secA = ((whole + Math.min(snap, 1.03)) % 60) / 60 * TAU;
    const minutes = 9 + s / 60, hours = 10 + minutes / 60;
    hH.rotation.z = -(hours % 12) / 12 * TAU; hM.rotation.z = -(minutes % 60) / 60 * TAU; sec.rotation.z = -secA;
    if (subA) subA.rotation.z = 1.25; if (subB) subB.rotation.z = -(22.2 / 24) * TAU;
    const ud = root.userData;
    if (ud.cage) { ud.cage.rotation.z = -(s / 60) * TAU; ud.balance.rotation.z = Math.sin(el * TAU * 3) * 2.4; ud.esc.rotation.z = -whole * .6; }
  };
  root.tick();
  return root;
}
function circleShape(x, y, r) { const s = new THREE.Shape(); s.absarc(x, y, r, 0, TAU, false); return s; }

/* strap: swept rounded section (leather/rubber) or instanced links (bracelet) */
function strapCurve(sy) {
  return new THREE.CatmullRomCurve3([[0, 19.5, 3.9], [0, 25, 3.9], [0, 31, 2.6], [0, 36.5, -1.5], [0, 40, -9], [0, 40.6, -19], [0, 38.2, -29]].map(([x, y, z]) => new THREE.Vector3(x, y * sy, z)), false, 'centripetal');
}
function buildStrap(o, polished, brushed) {
  const g = new THREE.Group();
  [1, -1].forEach(sy => {
    const curve = strapCurve(sy), N = 90, K = 28, len = curve.getLength();
    if (o.strap === 'bracelet') {
      const n = Math.floor(len / 3.3), geoC = new RoundedBoxGeometry(6.6, 3.0, 2.7, 2, .9), geoO = new RoundedBoxGeometry(6.3, 3.0, 2.3, 2, .8);
      const ic = new THREE.InstancedMesh(geoC, polished, n), io = new THREE.InstancedMesh(geoO, brushed, n * 2);
      const m = new THREE.Matrix4(), B = new THREE.Vector3(1, 0, 0);
      for (let i = 0; i < n; i++) {
        const u = (i + .5) / n, p = curve.getPointAt(u), T = curve.getTangentAt(u).multiplyScalar(sy), N2 = new THREE.Vector3().crossVectors(B, T);
        const w = 19.6 - 3 * u;
        m.makeBasis(B, T, N2).setPosition(p); ic.setMatrixAt(i, m);
        [-1, 1].forEach((sx, j) => { const mm = m.clone().setPosition(p.clone().addScaledVector(B, sx * (w / 2 - 3.25)).addScaledVector(N2, -.15)); io.setMatrixAt(i * 2 + j, mm); });
      }
      g.add(ic, io);
      return;
    }
    const pos = [], uv = [], idx = [], B = new THREE.Vector3(sy, 0, 0);
    for (let i = 0; i <= N; i++) {
      const u = i / N, p = curve.getPointAt(u), T = curve.getTangentAt(u), Nn = new THREE.Vector3().crossVectors(B, T).normalize();
      const w = (19.4 - 3.4 * u) / 2, h = (o.strap === 'rubber' ? 3.4 : 3.8 - 1.2 * u) / 2;
      for (let k = 0; k <= K; k++) {
        const th = k / K * TAU, c = Math.cos(th), s = Math.sin(th);
        const x = Math.sign(c) * Math.pow(Math.abs(c), .28) * w, y = Math.sign(s) * Math.pow(Math.abs(s), .5) * h;
        const v = p.clone().addScaledVector(B, x).addScaledVector(Nn, y);
        pos.push(v.x, v.y, v.z); uv.push(k / K, u * len / 24);
      }
    }
    for (let i = 0; i < N; i++) for (let k = 0; k < K; k++) { const a = i * (K + 1) + k, b = a + K + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const tex = strapTex(o.strap);
    const mat = new THREE.MeshPhysicalMaterial({ map: tex, bumpMap: tex, bumpScale: 1.2, roughness: o.strap === 'rubber' ? .75 : .55, sheen: o.strap === 'rubber' ? 0 : .5, sheenRoughness: .45, sheenColor: new THREE.Color(o.strap === 'alligator' ? 0x2c3f6e : 0x5a606b), clearcoat: o.strap === 'alligator' ? .5 : 0, clearcoatRoughness: .35, side: THREE.DoubleSide });
    g.add(new THREE.Mesh(geo, mat));
  });
  return g;
}

/* ---------------------------------------------------------------- stage */
function hold() { window.__k3dPending = (window.__k3dPending || 0) + 1; }
function release() { window.__k3dPending--; if (window.__k3dPending <= 0) requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready3d = true; })); }
// render several configurations with one offscreen renderer and hand back PNG data URLs
async function snapshots(list, cfg = {}) {
  hold();
  const canvas = document.createElement('canvas'), api = stage(canvas, { ...cfg, opts: null, still: true, preserve: true });
  await api.ready; const out = [];
  for (const o of list) {
    api.build(o); if (o.rot) api.watch.rotation.set(...o.rot); if (o.explode) api.watch.setExplode(o.explode);
    api.watch.tick(); api.renderer.render(api.scene, api.camera); out.push(canvas.toDataURL('image/png'));
  }
  release(); return out;
}
function stage(canvas, cfg = {}) {
  hold();
  const w = cfg.w || canvas.parentElement.clientWidth, h = cfg.h || canvas.parentElement.clientHeight;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!cfg.preserve });
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = cfg.exposure ?? 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.environment = makeEnv(renderer, cfg.tint);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-40, 60, 80); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7aa2ff, 2.4); rim.position.set(60, 20, -50); scene.add(rim);
  const warm = new THREE.PointLight(0xffe2c8, 1200, 0, 2); warm.position.set(40, -10, 60); scene.add(warm);
  const camera = new THREE.PerspectiveCamera(cfg.fov || 24, w / h, 1, 2000);
  const setCam = c => {
    camera.fov = c.fov || camera.fov; camera.position.set(...c.pos); camera.lookAt(new THREE.Vector3(...(c.target || [0, 0, 0])));
    camera.updateProjectionMatrix(); if (c.shift) { camera.projectionMatrix.elements[8] -= c.shift[0]; camera.projectionMatrix.elements[9] -= c.shift[1] || 0; camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert(); }
  };
  setCam(cfg.cam || { pos: [0, 0, 150] });
  const pivot = new THREE.Group(); scene.add(pivot);
  if (cfg.shadow !== false) {
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, opacity: cfg.shadowOpacity ?? .8 }));
    const s = cfg.shadow || { pos: [0, -36, -6], size: [90, 60] };
    sh.scale.set(s.size[0], s.size[1], 1); sh.rotation.x = -Math.PI / 2; sh.position.set(...s.pos); scene.add(sh);
  }
  const api = { renderer, scene, camera, pivot, setCam, THREE, watch: null };
  api.build = opts => {
    if (api.watch) { pivot.remove(api.watch); api.watch.traverse(m => { if (m.geometry) m.geometry.dispose(); }); }
    api.watch = buildWatch(opts); if (cfg.rot) api.watch.rotation.set(...cfg.rot); pivot.add(api.watch); return api.watch;
  };
  const project = () => {
    if (!cfg.onAnchors || !api.watch) return;
    const out = {}; api.watch.updateMatrixWorld(true);
    const p = new THREE.Vector3();
    for (const [k, o] of Object.entries(api.watch.userData.anchors)) { o.getWorldPosition(p); p.project(camera); out[k] = [(p.x + 1) / 2 * w, (1 - p.y) / 2 * h]; }
    cfg.onAnchors(out);
  };
  let first = true;
  const loop = now => {
    if (api.watch) { api.watch.tick(now); cfg.animate && cfg.animate(now / 1000, api); }
    renderer.render(scene, camera); project();
    if (first) { first = false; release(); cfg.onFirst && cfg.onFirst(api); }
    if (!cfg.still) requestAnimationFrame(loop);
  };
  api.ready = Promise.all([document.fonts.load('600 40px Unbounded'), document.fonts.load('500 40px "IBM Plex Mono"')]).catch(() => {}).then(() => {
    if (cfg.opts !== null) api.build(cfg.opts || {});
    requestAnimationFrame(loop); return api;
  });
  api.renderOnce = () => { renderer.render(scene, camera); };
  return api;
}

return { stage, buildWatch, makeEnv, snapshots, METALS };
};
