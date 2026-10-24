// OCÉANE — shared 3D kit (Three.js r160). Classic script: file:// blocks local ES-module imports,
// so pages call makeO3(THREE, addons) from an inline module after importing Three from the CDN.
// Contents: stage(), procedural superyacht (lofted hull + extruded deck levels), sunset ocean,
// wake foam, deck-plan cutaway, stylised islands for the route map, value noise.
window.makeO3 = function (THREE, A) {
  const { Water, Sky, RoomEnvironment } = A;
  const STILL = /HeadlessChrome/.test(navigator.userAgent) || location.hash === '#still';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- noise ---------- */
  const hash = (x, y, s = 0) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
  function vnoise(x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  const fbm = (x, y, s = 0, o = 5) => { let f = 0, a = .5, k = 1; for (let i = 0; i < o; i++) { f += a * vnoise(x * k, y * k, s + i * 13); k *= 2.03; a *= .5; } return f; };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function canvasTex(w, h, draw, srgb = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    draw(x, w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }

  /* ---------- stage ---------- */
  function stage(el, o) {
    const w = o.w, h = o.h;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposure ?? 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (o.shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
    if (o.clip) renderer.localClippingEnabled = true;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(o.fov ?? 30, w / h, o.near ?? .1, o.far ?? 20000);
    camera.position.set(...o.pos); const target = new THREE.Vector3(...(o.target || [0, 0, 0])); camera.lookAt(target);
    if (o.room) { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; }
    const S = { renderer, scene, camera, target, w, h, el, ticks: [] };
    S.project = (v) => { const p = v.clone().project(camera); return [(p.x * .5 + .5) * w, (-p.y * .5 + .5) * h]; };
    S.loop = (fn) => {
      let t0 = performance.now(), first = true, last = t0;
      const step = (now) => {
        const dt = Math.min(.05, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
        fn && fn(t, dt); S.ticks.forEach(f => f(t, dt));
        renderer.render(scene, camera);
        if (first) { first = false; S.onFirst && S.onFirst(); (window.__r3 = (window.__r3 || 0) + 1); if (window.__r3 >= (window.__n3 || 1)) window.__ready3d = true; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    return S;
  }

  let _pane;
  function paneTex() {
    if (_pane) return _pane;
    _pane = canvasTex(512, 64, (x, w, h) => {
      x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) { const a = [.9, .15, .55, 1, .08, .7, .3, .95][i]; const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,190,120,' + a * .35 + ')'); g.addColorStop(1, 'rgba(255,200,140,' + a + ')'); x.fillStyle = g; x.fillRect(i * 64 + 4, 4, 56, h - 6); }
    });
    _pane.wrapS = _pane.wrapT = THREE.RepeatWrapping; _pane.repeat.set(.9, 3.2); return _pane;
  }
  /* ---------- materials ---------- */
  const M = {
    paint: (c) => new THREE.MeshPhysicalMaterial({ color: c, metalness: .05, roughness: .22, clearcoat: 1, clearcoatRoughness: .06 }),
    white: () => new THREE.MeshPhysicalMaterial({ color: '#f3f1ec', metalness: 0, roughness: .3, clearcoat: .8, clearcoatRoughness: .1 }),
    glass: (lit) => new THREE.MeshPhysicalMaterial({ color: '#0a141d', metalness: .85, roughness: .06, clearcoat: 1, clearcoatRoughness: .02, emissive: lit ? '#ffb46b' : '#000', emissiveMap: lit ? paneTex() : null, emissiveIntensity: lit ? .5 : 0, envMapIntensity: 1.6 }),
    steel: () => new THREE.MeshPhysicalMaterial({ color: '#cfd4d8', metalness: 1, roughness: .22 }),
    brass: () => new THREE.MeshPhysicalMaterial({ color: '#c9a45c', metalness: 1, roughness: .28 }),
  };
  function teakTex(rep = 1) {
    const t = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#9a6a3c'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 32; i++) {
        const y = i * 16; x.fillStyle = `hsl(${26 + rnd() * 6},${42 + rnd() * 12}%,${33 + rnd() * 9}%)`; x.fillRect(0, y, w, 14);
        for (let k = 0; k < 30; k++) { x.fillStyle = `rgba(60,35,15,${.05 + rnd() * .08})`; x.fillRect(rnd() * w, y + rnd() * 14, 30 + rnd() * 120, 1); }
        x.fillStyle = '#2a1a0e'; x.fillRect(0, y + 14, w, 2);
        x.fillRect((i * 173) % w, y, 2, 14);
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t;
  }

  /* ---------- loft ---------- */
  function loft(nu, nv, fn, flip) {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const p = fn(i / nu, j / nv); pos.push(p[0], p[1], p[2]); uv.push(i / nu, j / nv); }
    const r = nv + 1;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = i * r + j, b = a + r;
      if (flip) idx.push(a, a + 1, b, b, a + 1, b + 1); else idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }

  /* ---------- yacht ---------- */
  // Length 10 units (~62 m): stern x=-5, bow tip x=+5, waterline y=0.
  const X0 = -5, X1 = 5;
  const deckY = x => .62 + .2 * Math.pow(sstep(.5, 5, x), 1.3);
  const keelY = x => {
    let k = lerp(-.1, -.32, sstep(-5, -3.2, x));
    if (x > 2) k = lerp(k, deckY(5) - .02, Math.pow(sstep(2, 5, x), 1.7));
    return k;
  };
  const halfW = x => {
    let w = lerp(.86, .96, sstep(-5, -1.5, x));
    if (x > .8) w *= Math.pow(clamp(1 - Math.pow((x - .8) / 4.25, 2.1), 0, 1), .62);
    return Math.max(w, .004);
  };
  function hullPoint(x, t) {           // t: 0 deck edge -> 1 keel centre
    const d = deckY(x), k = keelY(x), hw = halfW(x), ch = k + (d - k) * .42;
    if (t < .5) { const s = t / .5; return [hw * (1 - .05 * s * s) , lerp(d, ch, s)]; }
    const s = (t - .5) / .5; return [hw * .95 * (1 - Math.pow(s, 1.15)), ch + (k - ch) * Math.pow(s, .55)];
  }

  function hullTexture(o) {
    return canvasTex(2048, 512, (x, w, h) => {
      const base = o.hull; x.fillStyle = base; x.fillRect(0, 0, w, h);
      const band = (v0, v1, f) => { f(v0 * h, (v1 - v0) * h); f((1 - v1) * h, (v1 - v0) * h); };
      // gold sheer line near deck edge
      band(.012, .02, (y, hh) => { x.fillStyle = '#c9a45c'; x.fillRect(0, y, w * .985, hh); });
      // hull window band (u: 0 stern -> 1 bow)
      band(.075, .125, (y, hh) => {
        const g = x.createLinearGradient(0, y, 0, y + hh); g.addColorStop(0, '#1b2b38'); g.addColorStop(.5, '#05090d'); g.addColorStop(1, '#101c26');
        x.fillStyle = g; x.beginPath(); x.roundRect(w * .2, y, w * .33, hh, hh / 2); x.fill();
        x.beginPath(); x.roundRect(w * .56, y + hh * .15, w * .12, hh * .7, hh / 2); x.fill();
        if (o.lit) { x.fillStyle = 'rgba(255,190,120,.85)'; for (let i = 0; i < 9; i++) x.fillRect(w * (.215 + i * .035), y + hh * .3, w * .018, hh * .4); }
        x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(w * .2, y + 2, w * .33, 2);
      });
      // portholes forward
      band(.15, .17, (y, hh) => { x.fillStyle = o.lit ? '#ffcf95' : '#0a1218'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(w * (.7 + i * .025), y + hh / 2, 9, hh / 2, 0, 0, 7); x.fill(); } });
      // hull accent stripe (white boot-top above waterline)
      band(.235, .245, (y, hh) => { x.fillStyle = o.stripe || '#2a8c9a'; x.fillRect(w * .03, y, w * .9, hh); });
    });
  }

  function planShape(x0, x1, hw, fl, aftR = .12) {
    const s = new THREE.Shape(); const xf = x1 - fl;
    s.moveTo(x0 + aftR, -hw); s.lineTo(xf, -hw);
    s.bezierCurveTo(xf + fl * .55, -hw, x1, -hw * .42, x1, 0);
    s.bezierCurveTo(x1, hw * .42, xf + fl * .55, hw, xf, hw);
    s.lineTo(x0 + aftR, hw); s.quadraticCurveTo(x0, hw, x0, hw - aftR); s.lineTo(x0, -hw + aftR); s.quadraticCurveTo(x0, -hw, x0 + aftR, -hw);
    return s;
  }
  function slab(shape, depth, mat, y, bev = .018) {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 28 });
    g.rotateX(-Math.PI / 2); g.translate(0, y, 0); const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m;
  }

  function shear(g, xs, x1, yb, k) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); if (x <= xs) continue; const f = Math.pow(clamp((x - xs) / (x1 - xs), 0, 1), 2); p.setX(i, x - Math.max(0, p.getY(i) - yb) * k * f); }
    p.needsUpdate = true; g.computeVertexNormals();
  }
  function yacht(o = {}) {
    o = Object.assign({ hull: '#0e2235', lit: false, stripe: '#c9a45c' }, o);
    const G = new THREE.Group(); G.name = 'yacht';
    const paint = M.paint('#ffffff'); paint.map = hullTexture(o);
    const white = M.white(), glass = M.glass(o.lit), steel = M.steel();
    const teak = new THREE.MeshStandardMaterial({ map: teakTex(1), roughness: .62 });
    const hullG = loft(150, 48, (u, v) => {
      const x = lerp(X0, X1, u); const side = v < .5 ? 1 : -1; const t = v < .5 ? v * 2 : (1 - v) * 2;
      const [z, y] = hullPoint(x, t); return [x, y, z * side];
    }, o.flipHull);
    const hull = new THREE.Mesh(hullG, paint); hull.name = 'hull'; hull.castShadow = true; G.add(hull);
    hull.material.side = THREE.DoubleSide;
    // transom cap
    {
      const pts = []; for (let j = 0; j <= 24; j++) { const [z, y] = hullPoint(X0, j / 24); pts.push(new THREE.Vector2(z, y)); }
      for (let j = 24; j >= 0; j--) { const [z, y] = hullPoint(X0, j / 24); pts.push(new THREE.Vector2(-z, y)); }
      const sh = new THREE.Shape(pts); const g = new THREE.ShapeGeometry(sh); g.rotateY(-Math.PI / 2); g.translate(X0, 0, 0);
      const m = new THREE.Mesh(g, M.paint(o.hull)); m.name = 'transom'; m.material.side = THREE.DoubleSide; G.add(m);
    }
    // teak deck (slightly cambered)
    const deck = new THREE.Mesh(loft(120, 8, (u, v) => { const x = lerp(X0 + .01, X1 - .06, u), hw = halfW(x) * .985, z = lerp(-hw, hw, v); return [x, deckY(x) + .012 * (1 - Math.pow(2 * v - 1, 2)), z]; }, !o.flipHull), teak);
    deck.material.map.repeat.set(10, 1); deck.material.side = THREE.DoubleSide; deck.receiveShadow = true; G.add(deck);
    // bulwark rail (white cap along the deck edge, forward half)
    for (const sd of [1, -1]) {
      const pts = []; for (let i = 0; i <= 40; i++) { const x = lerp(-4.9, 4.9, i / 40); pts.push(new THREE.Vector3(x, deckY(x) + .07, halfW(x) * .97 * sd)); }
      const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, .012, 6), steel); G.add(rail);
      const stG = new THREE.CylinderGeometry(.007, .007, .07, 5); const st = new THREE.InstancedMesh(stG, steel, 30); const m4 = new THREE.Matrix4();
      for (let i = 0; i < 30; i++) { const x = lerp(-4.8, 4.75, i / 29); m4.makeTranslation(x, deckY(x) + .035, halfW(x) * .97 * sd); st.setMatrixAt(i, m4); } G.add(st);
    }
    // swim platform
    { const p = new THREE.Mesh(new THREE.BoxGeometry(.32, .05, 1.5), teak); p.position.set(X0 - .14, .14, 0); G.add(p);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(.34, .03, 1.52), white); p2.position.set(X0 - .14, .105, 0); G.add(p2); }

    // superstructure levels
    const L = o.levels || [
      { x0: -3.3, x1: 2.75, hw: .80, h: .40, y: .66, fl: 1.5 },
      { x0: -2.45, x1: 2.05, hw: .74, h: .36, y: 1.1, fl: 1.35 },
      { x0: -1.45, x1: 1.35, hw: .62, h: .32, y: 1.5, fl: 1.1 },
      { x0: -.55, x1: .8, hw: .42, h: .22, y: 1.86, fl: .7 },
    ];
    const levels = [];
    L.forEach((l, i) => {
      const g = new THREE.Group(); g.name = 'level' + i; G.add(g); levels.push(g);
      const yb = l.y;
      // floor slab (overhanging lip)
      g.add(slab(planShape(l.x0 - .05, l.x1 + .03, l.hw + .03, l.fl), .04, white, yb, .015));
      // glass band
      const gl = slab(planShape(l.x0 + .02, l.x1 - .06, l.hw - .05, l.fl * .95), l.h - .07, glass, yb + .055, .01); g.add(gl); g.userData.glass = gl;
      // solid aft bulkhead + forward fairing spine (white pieces breaking the glass)
      g.add(slab(planShape(l.x0 + .0, l.x0 + .55, l.hw - .035, .05, .1), l.h - .07, white, yb + .055, .008));
      const sp = slab(planShape(l.x1 - l.fl * .55, l.x1 - .03, l.hw * .5, l.fl * .5), l.h - .07, white, yb + .055, .008); g.add(sp);
      // roof with aft overhang (deeper aft = shaded terrace)
      const ov = i === 3 ? .1 : .55 - i * .08;
      g.add(slab(planShape(l.x0 - ov, l.x1 + .02, l.hw + .05, l.fl * 1.05), .05, white, yb + l.h - .02, .02));
      // terrace teak under overhang on the level below's roof is implicit; add teak on aft floor lip
      const tk = new THREE.Mesh(new THREE.PlaneGeometry(.5, l.hw * 1.9), teak); tk.rotation.x = -Math.PI / 2; tk.position.set(l.x0 - .3, yb + .045, 0);
      if (i < 3) g.add(tk);
      // window mullions
      const mul = new THREE.InstancedMesh(new THREE.BoxGeometry(.018, l.h - .08, .02), white, 24); const m4 = new THREE.Matrix4(); let n = 0;
      for (const sd of [1, -1]) for (let k = 0; k < 12 && n < 24; k++) { const x = lerp(l.x0 + .7, l.x1 - l.fl * .8, k / 11); m4.makeTranslation(x, yb + .055 + (l.h - .07) / 2, (l.hw - .05) * sd); mul.setMatrixAt(n++, m4); }
      g.add(mul);
      g.children.forEach(m => { if (m.isMesh && !m.isInstancedMesh && m.geometry.type === 'ExtrudeGeometry') shear(m.geometry, l.x1 - l.fl * 1.15, l.x1, yb, l.rake ?? 1.1); });
    });
    // aft decks: sundeck pool on level 2 roof aft
    {
      const l = L[2]; const pool = new THREE.Mesh(new THREE.BoxGeometry(.5, .03, .55), new THREE.MeshPhysicalMaterial({ color: '#33c2c9', roughness: .05, transmission: 0, clearcoat: 1, emissive: '#0b6f78', emissiveIntensity: .35 }));
      pool.position.set(l.x0 - .05, l.y + l.h + .04, 0); levels[2].add(pool);
      const deckT = new THREE.Mesh(new THREE.PlaneGeometry(1.05, l.hw * 1.8), teak); deckT.rotation.x = -Math.PI / 2; deckT.position.set(l.x0 + .05, l.y + l.h + .036, 0); levels[2].add(deckT);
    }
    // mast + radar arch
    {
      const l = L[3], top = l.y + l.h + .02, mg = new THREE.Group(); levels[3].add(mg);
      const arch = new THREE.Shape(); arch.moveTo(-.18, 0); arch.lineTo(.05, 0); arch.bezierCurveTo(.12, .25, .2, .45, .28, .5); arch.lineTo(.05, .5); arch.bezierCurveTo(0, .4, -.1, .2, -.18, 0);
      for (const sd of [1, -1]) { const g = new THREE.ExtrudeGeometry(arch, { depth: .05, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 2 }); const m = new THREE.Mesh(g, white); m.position.set(.05, top, sd * .3 - .025); mg.add(m); }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(.3, .05, .68), white); bar.position.set(.22, top + .5, 0); mg.add(bar);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(.018, .03, .55, 10), white); mast.position.set(.22, top + .78, 0); mast.rotation.z = .12; mg.add(mast);
      for (const [x, y, z, r] of [[.18, .6, .22, .07], [.18, .6, -.22, .07], [.24, .95, 0, .05]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), white); d.position.set(x, top + y, z); mg.add(d); const pd = new THREE.Mesh(new THREE.CylinderGeometry(.02, .025, .06, 8), white); pd.position.set(x, top + y - r, z); mg.add(pd); }
      const yard = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .5, 6), steel); yard.rotation.x = Math.PI / 2; yard.position.set(.25, top + .84, 0); mg.add(yard);
      for (const z of [-.2, .2]) { const an = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, .3, 4), steel); an.position.set(.2, top + 1, z); mg.add(an); }
      // hardtop over sundeck
      const ht = slab(planShape(-1.1, .1, .55, .3), .035, white, l.y + l.h + .38, .015); levels[3].add(ht);
      for (const sd of [1, -1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .38, 6), steel); leg.position.set(-1.0, l.y + l.h + .19, sd * .48); levels[3].add(leg); }
    }
    // navigation lights / lit deck spots
    if (o.lit) {
      L.forEach((l, i) => { const pl = new THREE.PointLight('#ffb070', 1.2, 2.5, 2); pl.position.set(l.x0 - .2, l.y + l.h - .1, 0); levels[i].add(pl); });
    }
    G.userData = { levels, L, deckY, halfW, keelY, X0, X1 };
    return G;
  }

  /* ---------- sunset ocean ---------- */
  function ocean(S, o = {}) {
    o = Object.assign({ elev: 2.2, az: 200, turbidity: 10, rayleigh: 2.6, mie: .006, g: .78, water: '#06202c', distortion: 3.2, size: 10000, normalRepeat: 1 }, o);
    const sun = new THREE.Vector3();
    const wn = new THREE.TextureLoader().load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/waternormals.jpg', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
    const water = new Water(new THREE.PlaneGeometry(o.size, o.size), {
      textureWidth: 512, textureHeight: 512, waterNormals: wn, sunDirection: new THREE.Vector3(), sunColor: o.sunColor || 0xffe2b8,
      waterColor: o.water, distortionScale: o.distortion, fog: !!S.scene.fog, alpha: 1,
    });
    water.rotation.x = -Math.PI / 2; water.material.uniforms.size.value = o.normalScale ?? 1.4; S.scene.add(water);
    const sky = new Sky(); sky.scale.setScalar(10000);
    const u = sky.material.uniforms; u.turbidity.value = o.turbidity; u.rayleigh.value = o.rayleigh; u.mieCoefficient.value = o.mie; u.mieDirectionalG.value = o.g;
    sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - o.elev), THREE.MathUtils.degToRad(o.az));
    u.sunPosition.value.copy(sun); water.material.uniforms.sunDirection.value.copy(sun).normalize();
    const pm = new THREE.PMREMGenerator(S.renderer); const envScene = new THREE.Scene(); envScene.add(sky);
    S.scene.environment = pm.fromScene(envScene).texture; S.scene.add(sky);
    S.ticks.push((t, dt) => { water.material.uniforms.time.value += dt * (o.speed ?? .6); });
    return { water, sky, sun };
  }

  /* ---------- wake foam ---------- */
  function wakeTex() {
    const t = canvasTex(512, 1024, (x, w, h) => {
      x.clearRect(0, 0, w, h);
      // V wake: origin at top centre (stern), spreading down
      for (let i = 0; i < 2600; i++) {
        const v = Math.pow(rnd(), .8), side = rnd() < .5 ? -1 : 1, spread = .03 + v * .44;
        const edge = rnd() < .62;
        const u = .5 + side * (edge ? spread * (.9 + rnd() * .12) : spread * rnd() * .55);
        const a = (1 - v) * (edge ? .5 : .28) * (.4 + rnd() * .6);
        x.fillStyle = `rgba(255,255,255,${a})`; x.beginPath(); x.ellipse(u * w, v * h, 1 + rnd() * 5 * (1 - v * .5), 2 + rnd() * 14, side * (.25 + v * .2), 0, 7); x.fill();
      }
      // churned centre wash
      for (let i = 0; i < 1400; i++) {
        const v = Math.pow(rnd(), 1.4) * .85, u = .5 + (rnd() - .5) * (.06 + v * .22);
        x.fillStyle = `rgba(235,250,255,${(1 - v) * .4 * rnd()})`; x.beginPath(); x.ellipse(u * w, v * h, 2 + rnd() * 8, 3 + rnd() * 10, 0, 0, 7); x.fill();
      }
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.9, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = g; x.fillRect(0, 0, w, h);
    });
    return t;
  }
  function bowTex() {
    return canvasTex(512, 256, (x, w, h) => {
      for (let i = 0; i < 900; i++) { const a = rnd(), r = rnd(); const px = w * (.5 + (a - .5) * (.2 + r * .9)), py = h * (r); x.fillStyle = `rgba(255,255,255,${(1 - r) * .55 * rnd()})`; x.beginPath(); x.ellipse(px, py, 1 + rnd() * 5, 1 + rnd() * 3, 0, 0, 7); x.fill(); }
    });
  }
  function wake(G, o = {}) {
    const len = o.len ?? 26, wid = o.wid ?? 9;
    const mat = new THREE.MeshBasicMaterial({ map: o.debug?null:wakeTex(), transparent: true, depthWrite: false, opacity: o.opacity ?? .9, color: o.color || '#ffffff' });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wid, len), mat); m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.PI / 2;
    m.position.set(X0 - len / 2 + .3, .02, 0); G.add(m);
    // hull-side foam lines + bow wave
    const bm = new THREE.MeshBasicMaterial({ map: bowTex(), transparent: true, depthWrite: false, opacity: .85 });
    for (const sd of [1, -1]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(6.5, .9), bm); b.rotation.x = -Math.PI / 2; b.position.set(.6, .025, sd * 1.05); b.rotation.z = sd * .06; G.add(b); }
    const bw = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), bm); bw.rotation.x = -Math.PI / 2; bw.rotation.z = -Math.PI / 2; bw.position.set(4.2, .03, 0); G.add(bw);
    return m;
  }

  /* ---------- deck plan cutaway ---------- */
  function planTex(rooms, o) {
    // rooms in level-local x/z units; texture covers bbox [x0,x1]x[-hw,hw]
    const W = 2048, H = Math.round(2048 * (2 * o.hw) / (o.x1 - o.x0));
    return canvasTex(W, H, (x, w, h) => {
      const sx = w / (o.x1 - o.x0), sz = h / (2 * o.hw);
      const X = v => (v - o.x0) * sx, Z = v => (v + o.hw) * sz;
      x.fillStyle = '#ede6d8'; x.fillRect(0, 0, w, h);
      rooms.forEach(r => {
        x.fillStyle = r.c || '#e6dccb'; x.fillRect(X(r.x0), Z(r.z0), (r.x1 - r.x0) * sx, (r.z1 - r.z0) * sz);
        if (r.teak) { for (let y = Z(r.z0); y < Z(r.z1); y += 9) { x.fillStyle = 'rgba(90,55,25,.25)'; x.fillRect(X(r.x0), y, (r.x1 - r.x0) * sx, 1.5); } }
        // furniture hints
        x.strokeStyle = 'rgba(11,31,51,.35)'; x.lineWidth = 3;
        if (r.bed) { const cx = X((r.x0 + r.x1) / 2), cz = Z((r.z0 + r.z1) / 2); x.fillStyle = '#f8f5ef'; x.fillRect(cx - 70, cz - 55, 140, 110); x.strokeRect(cx - 70, cz - 55, 140, 110); x.fillStyle = '#c9a45c'; x.fillRect(cx - 70, cz - 55, 28, 110); }
        if (r.sofa) { const cx = X((r.x0 + r.x1) / 2), cz = Z((r.z0 + r.z1) / 2); x.fillStyle = '#f8f5ef'; x.beginPath(); x.roundRect(cx - 120, cz - 70, 240, 40, 12); x.fill(); x.stroke(); x.beginPath(); x.roundRect(cx - 120, cz + 30, 240, 40, 12); x.fill(); x.stroke(); x.fillStyle = '#a0703f'; x.beginPath(); x.ellipse(cx, cz, 50, 22, 0, 0, 7); x.fill(); }
        if (r.dine) { const cx = X((r.x0 + r.x1) / 2), cz = Z((r.z0 + r.z1) / 2); x.fillStyle = '#a0703f'; x.beginPath(); x.roundRect(cx - 110, cz - 30, 220, 60, 30); x.fill(); x.fillStyle = '#f8f5ef'; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(cx - 90 + i * 45, cz - 48, 12, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.arc(cx - 90 + i * 45, cz + 48, 12, 0, 7); x.fill(); x.stroke(); } }
        if (r.pool) { x.fillStyle = '#3cc6cc'; x.beginPath(); x.roundRect(X(r.x0) + 20, Z(r.z0) + 20, (r.x1 - r.x0) * sx - 40, (r.z1 - r.z0) * sz - 40, 20); x.fill(); x.strokeStyle = 'rgba(255,255,255,.6)'; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(X(r.x0) + 40, Z(r.z0) + 40 + k * 18); x.bezierCurveTo(X(r.x0) + 100, Z(r.z0) + 30 + k * 18, X(r.x0) + 140, Z(r.z0) + 50 + k * 18, X(r.x1) - 40, Z(r.z0) + 40 + k * 18); x.stroke(); } }
        if (r.loungers) { const n = r.loungers; for (let k = 0; k < n; k++) { x.fillStyle = '#f8f5ef'; x.beginPath(); x.roundRect(X(r.x0) + 30, Z(r.z0) + 30 + k * ((r.z1 - r.z0) * sz - 60) / n, 120, ((r.z1 - r.z0) * sz - 60) / n - 14, 10); x.fill(); x.stroke(); } }
        if (r.label) { x.fillStyle = '#0b1f33'; x.font = '600 30px Figtree, sans-serif'; x.textAlign = 'center'; x.fillText(r.label.toUpperCase(), X((r.x0 + r.x1) / 2), Z(r.z1) - 24); }
      });
      // hull outline hint / grid
      x.strokeStyle = 'rgba(11,31,51,.08)'; x.lineWidth = 1; for (let i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
    });
  }
  function walls(rooms, mat, h, t = .018) {
    const g = new THREE.Group(); const box = new THREE.BoxGeometry(1, 1, 1);
    const seg = (ax, az, bx, bz) => { const m = new THREE.Mesh(box, mat); const len = Math.hypot(bx - ax, bz - az); m.scale.set(len + t, h, t); m.position.set((ax + bx) / 2, h / 2, (az + bz) / 2); m.rotation.y = -Math.atan2(bz - az, bx - ax); m.castShadow = true; g.add(m); };
    rooms.forEach(r => { if (r.open) return; const d = .12; // leave a door gap on one long side
      seg(r.x0, r.z0, r.x1, r.z0); seg(r.x0, r.z1, (r.x0 + r.x1) / 2 - d, r.z1); seg((r.x0 + r.x1) / 2 + d, r.z1, r.x1, r.z1); seg(r.x0, r.z0, r.x0, r.z1); seg(r.x1, r.z0, r.x1, r.z1); });
    return g;
  }

  /* ---------- islands ---------- */
  function island(o) {
    // o: {rx, rz, h, seed, seg}
    const seg = o.seg || 110, g = new THREE.PlaneGeometry(o.rx * 2.6, o.rz * 2.6, seg, seg); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = [], c = new THREE.Color();
    const sand = new THREE.Color('#e3cf9f'), green = new THREE.Color('#6f8a55'), dark = new THREE.Color('#3b5a3f'), rock = new THREE.Color('#8f7f68'), shallow = new THREE.Color('#3fb2b6'), deepc = new THREE.Color(o.deep || '#0c3150');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), nx = x / o.rx, nz = z / o.rz;
      const ang = Math.atan2(nz, nx); const coast = .78 + .38 * fbm(Math.cos(ang) * 1.6 + o.seed, Math.sin(ang) * 1.6 + o.seed, o.seed, 4) - .19;
      const r = Math.hypot(nx, nz) / coast;
      let hgt = Math.max(0, 1 - r); hgt = Math.pow(hgt, .9) * (.35 + 1.1 * Math.pow(fbm(x * 1.3 + o.seed, z * 1.3, o.seed + 3, 5), 1.6));
      const y = r < 1 ? hgt * o.h + .02 : -.06 - (r - 1) * .4;
      p.setY(i, y);
      const k = y / o.h;
      if (y < 0) c.copy(shallow).lerp(deepc, clamp((r - 1) * 4.5, 0, 1)); else if (k < .04) c.copy(sand); else if (k < .5) c.copy(green).lerp(dark, k * 1.8); else if (k < .85) c.copy(dark).lerp(rock, (k - .5) * 2.8); else c.copy(rock).lerp(new THREE.Color('#cfc6b4'), (k - .85) * 4);
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, flatShading: true }));
    m.castShadow = m.receiveShadow = true; return m;
  }

  return { THREE, STILL, stage, yacht, ocean, wake, canvasTex, teakTex, M, loft, planShape, slab, planTex, walls, island, fbm, vnoise, rnd, lerp, clamp, sstep, deckY, halfW, keelY };
};
