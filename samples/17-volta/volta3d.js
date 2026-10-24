/* VOLTA — procedural e-bike kit (classic script; the page's inline module passes THREE in).
   const K = window.VOLTA3D(THREE, { RoomEnvironment });
   K.stage(el,{w,h}) · K.bike(opts) · K.streaks(scene,opts) · K.dust(scene) · K.glow(color,size) · K.project(v, stage) */
window.__pending3d = 0;
window.VOLTA3D = function (THREE, X) {
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const YEL = '#e6ff00';

  /* ---------- stage ---------- */
  function stage(el, { w = el.clientWidth, h = el.clientHeight, fov = 26, exposure = 1.05, envI = 0.04 } = {}) {
    window.__pending3d++;
    let renderer;
    function done() { if (--window.__pending3d <= 0) window.__ready3d = true; }
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
    catch (e) { console.warn('webgl off', e); done(); return null; }
    renderer.setPixelRatio(1); renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    { const pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(studioEnv(), 0.02).texture; }
    const camera = new THREE.PerspectiveCamera(fov, w / h, 0.05, 100);
    // product-photographer lights: cool key, volt-yellow rim, blue counter rim
    const key = new THREE.DirectionalLight('#ffffff', 1.5); key.position.set(2, 3, 4); scene.add(key);
    const rim = new THREE.DirectionalLight('#eaff4d', 2.0); rim.position.set(-3, 1.5, -2.5); scene.add(rim);
    const rim2 = new THREE.DirectionalLight('#6fa8ff', 1.4); rim2.position.set(3, 0.8, -3); scene.add(rim2);
    const fill = new THREE.HemisphereLight('#cfd8e6', '#16171a', 0.5); scene.add(fill);
    let first = true, t0 = performance.now(), onFrame = () => {};
    function run(fn) {
      onFrame = fn;
      const tick = () => {
        const t = (performance.now() - t0) / 1000;
        onFrame(t); renderer.render(scene, camera);
        if (first) { first = false; requestAnimationFrame(() => done()); }
        requestAnimationFrame(tick);
      };
      tick();
    }
    return { renderer, scene, camera, run, w, h, lights: { key, rim, rim2, fill } };
  }

  /* dark studio with softbox strips: glossy dark paint stays dark, highlights stay crisp */
  function studioEnv() {
    const e = new THREE.Scene();
    e.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: '#0a0b0c', side: THREE.BackSide })));
    const box = (w, h, pos, look, col, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(...look); e.add(m); };
    box(10, 3, [0, 9, 1], [0, 0, 0], '#ffffff', 3.2);        // overhead softbox
    box(1.2, 9, [-8, 2, 4], [0, 0, 0], '#ffffff', 4);        // left strip
    box(1.2, 9, [8, 2, 3], [0, 0, 0], '#dfe8ff', 2.6);       // right strip
    box(1.5, 8, [-6, 1, -7], [0, 0, 0], '#e6ff00', 2.2);     // volt rim
    box(1.5, 8, [6, 1, -7], [0, 0, 0], '#6fa8ff', 1.6);      // cool rim
    box(16, 1, [0, -3, 8], [0, 0, 0], '#ffffff', 0.6);       // low front bounce
    box(30, 30, [0, -6, 0], [0, 0, 0], '#1a1b1d', 1);        // floor
    return e;
  }

  function project(v, st) {
    const p = v.clone().project(st.camera);
    return { x: (p.x + 1) / 2 * st.w, y: (1 - p.y) / 2 * st.h };
  }

  /* ---------- textures ---------- */
  function canvasTex(w, h, draw, srgb = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  const radial = (stops) => canvasTex(256, 256, (g, w, h) => {
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach(([o, c]) => r.addColorStop(o, c)); g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  function glow(color = YEL, size = 0.3, opacity = 1) {
    const t = radial([[0, color], [0.18, color + 'aa'], [0.5, color + '22'], [1, color + '00']]);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity }));
    s.scale.set(size, size, 1); return s;
  }
  const carbonTex = (dark = '#121315', lite = '#26282c', text) => canvasTex(2048, 256, (g, w, h) => {
    g.fillStyle = dark; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) for (let y = 0; y < h; y += 8) {
      g.fillStyle = ((x + y) / 8) % 2 ? lite : dark; g.fillRect(x, y, 8, 4);
      g.fillStyle = ((x + y) / 8) % 2 ? dark : lite; g.fillRect(x, y + 4, 8, 4);
    }
    if (text) text(g, w, h);
  });

  /* ---------- sweep: hydroformed tube along a curve (oval / squircle section, tapering) ---------- */
  function sweep(curve, rf, segs = 64, radial = 20, caps = true, ex = 0.8) {
    const pos = [], nor = [], uv = [], idx = [];
    const Z = V(0, 0, 1);
    const ring = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const P = curve.getPointAt(t), T = curve.getTangentAt(t).normalize();
      let N = new THREE.Vector3().crossVectors(Z, T); if (N.lengthSq() < 1e-6) N = V(0, 1, 0); N.normalize();
      const B = new THREE.Vector3().crossVectors(T, N).normalize();
      const [a, b] = rf(t);
      ring.push({ P, T });
      for (let j = 0; j <= radial; j++) {
        const an = j / radial * Math.PI * 2, c = Math.cos(an), s = Math.sin(an);
        const cx = Math.sign(c) * Math.pow(Math.abs(c), ex), sy = Math.sign(s) * Math.pow(Math.abs(s), ex);
        pos.push(P.x + N.x * a * cx + B.x * b * sy, P.y + N.y * a * cx + B.y * b * sy, P.z + N.z * a * cx + B.z * b * sy);
        const n = N.clone().multiplyScalar(c / a).add(B.clone().multiplyScalar(s / b)).normalize();
        nor.push(n.x, n.y, n.z); uv.push(t, j / radial);
      }
    }
    for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    if (caps) for (const [i, sgn] of [[0, -1], [segs, 1]]) {
      const c = pos.length / 3, { P, T } = ring[i];
      pos.push(P.x, P.y, P.z); nor.push(T.x * sgn, T.y * sgn, T.z * sgn); uv.push(0.5, 0.5);
      for (let j = 0; j <= radial; j++) {
        const k = (i * (radial + 1) + j) * 3;
        pos.push(pos[k], pos[k + 1], pos[k + 2]); nor.push(T.x * sgn, T.y * sgn, T.z * sgn); uv.push(0.5, 0.5);
      }
      for (let j = 0; j < radial; j++) sgn > 0 ? idx.push(c, c + 2 + j, c + 1 + j) : idx.push(c, c + 1 + j, c + 2 + j);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); return g;
  }
  const cr = (pts) => new THREE.CatmullRomCurve3(pts.map(p => V(...p)), false, 'centripetal');
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- the bike ---------- */
  function bike({ color = '#2b2d31', accent = YEL, wheels = 'spoke', battery = 1, light = true, decal = true, bar = 'drop', fenders = false } = {}) {
    const root = new THREE.Group();
    const parts = {};
    const P = (name) => { const g = new THREE.Group(); g.userData.ex = V(0, 0, 0); root.add(g); parts[name] = g; return g; };

    const M = {
      frame: new THREE.MeshPhysicalMaterial({ color, metalness: 0.12, roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.2 }),
      matte: new THREE.MeshPhysicalMaterial({ color: '#131417', metalness: 0.1, roughness: 0.62, clearcoat: 0.3, clearcoatRoughness: 0.5, envMapIntensity: 0.5 }),
      black: new THREE.MeshStandardMaterial({ color: '#0d0e10', metalness: 0.4, roughness: 0.45 }),
      alu: new THREE.MeshStandardMaterial({ color: '#c9ced6', metalness: 1, roughness: 0.22 }),
      steel: new THREE.MeshStandardMaterial({ color: '#8d939b', metalness: 1, roughness: 0.3 }),
      rubber: new THREE.MeshStandardMaterial({ color: '#141416', metalness: 0, roughness: 0.85 }),
      accent: new THREE.MeshPhysicalMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.25, metalness: 0.2, roughness: 0.3, clearcoat: 1 }),
      copper: new THREE.MeshStandardMaterial({ color: '#c8742f', metalness: 1, roughness: 0.32 }),
      cell: new THREE.MeshPhysicalMaterial({ color: '#cfe400', emissive: '#a6c400', emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.25, clearcoat: 1 }),
      wire: new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0, depthWrite: false })
    };
    const frameMeshes = [];
    const add = (grp, geo, mat, isFrame) => { const m = new THREE.Mesh(geo, mat); grp.add(m); if (isFrame) frameMeshes.push(m); return m; };

    /* key points (metres; x forward, y up, z = drive side toward camera) */
    const R = V(-0.52, 0, 0), F = V(0.65, 0, 0), BB = V(-0.075, -0.065, 0);

    /* frame */
    const frame = P('frame');
    const downCurve = cr([[0.452, 0.39, 0], [0.30, 0.265, 0], [0.10, 0.075, 0], [-0.06, -0.05, 0]]);
    add(frame, sweep(downCurve, t => [lerp(0.052, 0.06, Math.sin(t * Math.PI)), 0.041], 80, 24), M.frame, true);
    const topCurve = cr([[0.415, 0.545, 0], [0.18, 0.525, 0], [-0.08, 0.475, 0], [-0.245, 0.445, 0]]);
    add(frame, sweep(topCurve, t => [lerp(0.03, 0.021, t), lerp(0.024, 0.019, t)], 60, 20), M.frame, true);
    const seatCurve = cr([[-0.075, -0.06, 0], [-0.14, 0.15, 0], [-0.215, 0.38, 0], [-0.252, 0.53, 0]]);
    add(frame, sweep(seatCurve, t => [lerp(0.036, 0.022, t), lerp(0.03, 0.02, t)], 50, 20), M.frame, true);
    const headCurve = cr([[0.4, 0.61, 0], [0.427, 0.5, 0], [0.46, 0.36, 0]]);
    add(frame, sweep(headCurve, t => [lerp(0.031, 0.04, t), lerp(0.029, 0.036, t)], 20, 24, true, 1), M.frame, true);
    for (const s of [1, -1]) {
      const cs = cr([[-0.07, -0.07, 0.03 * s], [-0.22, -0.055, 0.058 * s], [-0.40, -0.02, 0.066 * s], [-0.52, 0, 0.066 * s]]);
      add(frame, sweep(cs, t => [lerp(0.022, 0.013, t), lerp(0.014, 0.01, t)], 40, 14), M.frame, true);
      const ss = cr([[-0.205, 0.37, 0.018 * s], [-0.30, 0.25, 0.05 * s], [-0.42, 0.10, 0.064 * s], [-0.515, 0.012, 0.066 * s]]);
      add(frame, sweep(ss, t => [lerp(0.014, 0.010, t), lerp(0.013, 0.009, t)], 40, 14), M.frame, true);
      // dropout
      const d = add(frame, new THREE.CylinderGeometry(0.02, 0.02, 0.008, 20).rotateX(Math.PI / 2), M.matte); d.position.set(-0.52, 0.004, 0.068 * s);
    }
    // junction blobs
    const blob = (p, r, sx = 1, sy = 1, sz = 1) => { const m = add(frame, new THREE.SphereGeometry(r, 24, 16), M.frame, true); m.position.copy(p); m.scale.set(sx, sy, sz); };
    blob(V(-0.23, 0.43, 0), 0.03, 1, 1.2, 0.8);
    // BB shell
    const bbs = add(frame, new THREE.CylinderGeometry(0.04, 0.04, 0.09, 28).rotateX(Math.PI / 2), M.frame, true); bbs.position.copy(BB);
    // seatpost + clamp
    const spCurve = cr([[-0.25, 0.50, 0], [-0.265, 0.58, 0], [-0.282, 0.665, 0]]);
    add(frame, sweep(spCurve, () => [0.0145, 0.0145], 12, 18, true, 1), M.black);
    const clamp = add(frame, new THREE.TorusGeometry(0.022, 0.006, 10, 30), M.accent); clamp.position.set(-0.252, 0.527, 0); clamp.rotation.set(Math.PI / 2, 0, 0.2);
    // decal on downtube
    if (decal) {
      const dt = canvasTex(1024, 128, (g, w, h) => {
        g.clearRect(0, 0, w, h); g.font = 'italic 800 104px "Barlow Condensed", "Arial Narrow", sans-serif'; g.textBaseline = 'middle';
        g.fillStyle = '#ffffff'; g.fillText('VOLTA', 30, h / 2 + 4);
        const wv = g.measureText('VOLTA').width; g.fillStyle = YEL;
        g.beginPath(); g.moveTo(60 + wv, 30); g.lineTo(90 + wv, 30); g.lineTo(70 + wv, 98); g.lineTo(40 + wv, 98); g.fill();
        g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '600 30px Inter, sans-serif'; g.fillText('E·DRIVE  85 NM', 140 + wv, h / 2 + 2);
      });
      const pmat = new THREE.MeshBasicMaterial({ map: dt, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
      const mid = downCurve.getPointAt(0.42), tan = downCurve.getTangentAt(0.42);
      const ang = Math.atan2(tan.y, tan.x) + Math.PI;
      for (const s of [1, -1]) {
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.05), pmat);
        pl.position.set(mid.x, mid.y, 0.0425 * s); pl.rotation.set(0, s > 0 ? 0 : Math.PI, s > 0 ? ang : -ang);
        frame.add(pl); frameMeshes.push(pl); pl.userData.decal = true;
      }
    }

    /* battery: cover on the down tube underside + cells */
    const bat = P('battery');
    const N = (t) => { const T = downCurve.getTangentAt(t); return V(-T.y, T.x, 0).normalize(); };
    // N(t) points to the underside
    const batPts = []; for (let i = 0; i <= 8; i++) { const t = lerp(0.14, 0.86, i / 8); batPts.push(downCurve.getPointAt(t).add(N(t).multiplyScalar(0.022))); }
    const batCurve = new THREE.CatmullRomCurve3(batPts);
    const cover = add(bat, sweep(batCurve, () => [0.042, 0.037], 50, 20, true, 0.6), M.matte);
    const stripe = add(bat, sweep(batCurve, () => [0.006, 0.0385], 50, 12, true, 0.9), M.accent);
    stripe.position.copy(N(0.5).multiplyScalar(-0.006));
    const cellGeo = new THREE.CylinderGeometry(0.0105, 0.0105, 0.066, 14).rotateX(Math.PI / 2);
    const cells = new THREE.InstancedMesh(cellGeo, M.cell, 28);
    { const m = new THREE.Matrix4(); let k = 0;
      for (let i = 0; i < 14; i++) for (const off of [-0.012, 0.012]) {
        const t = lerp(0.12, 0.88, i / 13), p = batCurve.getPointAt(t), n = N(0.5);
        m.makeTranslation(p.x + n.x * off, p.y + n.y * off, 0); cells.setMatrixAt(k++, m);
      } }
    cells.visible = false; bat.add(cells);
    // charge LEDs on top tube near the seat cluster
    const leds = [];
    for (let i = 0; i < 5; i++) {
      const p = topCurve.getPointAt(0.18 + i * 0.045);
      const l = add(frame, new THREE.BoxGeometry(0.014, 0.004, 0.006), new THREE.MeshBasicMaterial({ color: i < 3 + battery ? YEL : '#2a2c20' }));
      l.position.set(p.x, p.y + 0.03, 0); leds.push(l);
    }
    bat.userData.ex = N(0.5).multiplyScalar(0.2).add(V(0, -0.02, 0.06));

    /* fork + head */
    const fork = P('fork');
    for (const s of [1, -1]) {
      const fl = cr([[0.462, 0.36, 0.03 * s], [0.49, 0.25, 0.05 * s], [0.565, 0.1, 0.056 * s], [0.65, 0.0, 0.056 * s]]);
      add(fork, sweep(fl, t => [lerp(0.024, 0.012, t), lerp(0.017, 0.01, t)], 40, 14), M.frame, true);
    }
    const crown = add(fork, new THREE.SphereGeometry(0.05, 24, 12), M.frame, true); crown.position.set(0.462, 0.355, 0); crown.scale.set(0.8, 0.45, 1.25);
    // headlight
    if (light) {
      const hl = new THREE.Group(); hl.position.set(0.505, 0.43, 0); hl.rotation.z = -0.12; fork.add(hl);
      const body = add(hl, new THREE.CylinderGeometry(0.022, 0.026, 0.05, 24).rotateZ(Math.PI / 2), M.black);
      const lens = add(hl, new THREE.CircleGeometry(0.019, 24).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fffbe0' })); lens.position.x = 0.0255;
      const ring = add(hl, new THREE.TorusGeometry(0.021, 0.0025, 8, 30).rotateY(Math.PI / 2), M.accent); ring.position.x = 0.025;
      const gl = glow('#fff6c8', 0.22, 0.95); gl.position.x = 0.03; hl.add(gl);
      const gl2 = glow(YEL, 0.5, 0.35); gl2.position.x = 0.04; hl.add(gl2);
      // beam
      const beamTex = canvasTex(256, 64, (g, w, h) => { const lg = g.createLinearGradient(0, 0, w, 0); lg.addColorStop(0, 'rgba(255,250,210,.55)'); lg.addColorStop(1, 'rgba(255,250,210,0)'); g.fillStyle = lg; g.fillRect(0, 0, w, h); });
      const beam = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 32, 1, true).rotateZ(Math.PI / 2).translate(0.47, 0, 0),
        new THREE.MeshBasicMaterial({ color: '#fff7c0', transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beam.rotation.z = -0.12; parts.beam = beam;
      // mount
      const mnt = add(hl, new THREE.BoxGeometry(0.035, 0.01, 0.012), M.black); mnt.position.set(-0.025, 0.004, 0);
    }
    // rear light under saddle
    const rl = add(frame, new THREE.BoxGeometry(0.008, 0.016, 0.03), new THREE.MeshBasicMaterial({ color: '#ff2a3a' })); rl.position.set(-0.29, 0.6, 0); rl.rotation.z = 0.2;
    const rlg = glow('#ff2a3a', 0.16, 0.8); rlg.position.set(-0.30, 0.6, 0); frame.add(rlg);

    /* cockpit: spacers, stem, drop bar, hoods, display */
    const cock = P('cockpit');
    const spacer = add(cock, new THREE.CylinderGeometry(0.019, 0.02, 0.03, 24), M.black); spacer.position.set(0.393, 0.63, 0); spacer.rotation.z = -0.27;
    const stemC = cr([[0.387, 0.645, 0], [0.44, 0.655, 0], [0.5, 0.665, 0]]);
    add(cock, sweep(stemC, t => [lerp(0.022, 0.017, t), lerp(0.019, 0.016, t)], 16, 16, true, 0.7), M.frame, true);
    const barSide = (s) => cr([[0.500, 0.665, 0], [0.502, 0.665, 0.12 * s], [0.510, 0.665, 0.19 * s], [0.565, 0.658, 0.215 * s], [0.610, 0.618, 0.222 * s], [0.610, 0.553, 0.226 * s], [0.575, 0.513, 0.228 * s], [0.510, 0.511, 0.228 * s]]);
    if (bar === 'flat') {
      const fb = cr([[0.47, 0.70, -0.31], [0.50, 0.69, -0.12], [0.505, 0.668, 0], [0.50, 0.69, 0.12], [0.47, 0.70, 0.31]]);
      add(cock, new THREE.TubeGeometry(fb, 50, 0.0115, 12), M.black);
      for (const s of [1, -1]) {
        const gp = add(cock, new THREE.CylinderGeometry(0.017, 0.017, 0.12, 16).rotateX(Math.PI / 2), M.rubber); gp.position.set(0.474, 0.70, 0.255 * s); gp.rotation.y = 0.12 * s;
        const end = add(cock, new THREE.CylinderGeometry(0.018, 0.018, 0.008, 16).rotateX(Math.PI / 2), M.accent); end.position.set(0.468, 0.70, 0.318 * s);
        const lv = add(cock, new THREE.BoxGeometry(0.1, 0.008, 0.016), M.alu); lv.position.set(0.53, 0.70, 0.2 * s); lv.rotation.y = -0.3 * s;
      }
    } else for (const s of [1, -1]) {
      add(cock, new THREE.TubeGeometry(barSide(s), 60, 0.0115, 12), M.rubber);
      const hood = add(cock, new THREE.CapsuleGeometry(0.014, 0.045, 6, 12).rotateZ(Math.PI / 2), M.black); hood.position.set(0.595, 0.665, 0.218 * s); hood.rotation.z = -0.25;
      const lever = add(cock, new THREE.BoxGeometry(0.012, 0.1, 0.012), M.alu); lever.position.set(0.625, 0.608, 0.22 * s); lever.rotation.z = 0.12;
    }
    const disp = canvasTex(256, 128, (g, w, h) => {
      g.fillStyle = '#050607'; g.fillRect(0, 0, w, h);
      g.fillStyle = YEL; g.font = 'italic 800 78px "Barlow Condensed", sans-serif'; g.fillText('32', 22, 86);
      g.fillStyle = '#fff'; g.font = '600 18px Inter, sans-serif'; g.fillText('KM/H', 112, 54); g.fillStyle = '#9aa'; g.fillText('BOOST', 112, 82);
      for (let i = 0; i < 5; i++) { g.fillStyle = i < 4 ? YEL : '#333'; g.fillRect(180 + i * 13, 98, 9, 14); }
    });
    const dbox = add(cock, new THREE.BoxGeometry(0.06, 0.008, 0.04), M.black); dbox.position.set(0.46, 0.678, 0);
    const dscr = add(cock, new THREE.PlaneGeometry(0.055, 0.035).rotateX(-Math.PI / 2).rotateY(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: disp })); dscr.position.set(0.46, 0.6825, 0);
    cock.userData.ex = V(0.04, 0.16, 0);

    /* saddle */
    const sad = P('saddle');
    const sh = new THREE.Shape();
    sh.moveTo(-0.13, 0); sh.bezierCurveTo(-0.13, 0.075, -0.06, 0.072, -0.02, 0.05); sh.bezierCurveTo(0.03, 0.03, 0.09, 0.022, 0.135, 0.016);
    sh.quadraticCurveTo(0.15, 0, 0.135, -0.016); sh.bezierCurveTo(0.09, -0.022, 0.03, -0.03, -0.02, -0.05); sh.bezierCurveTo(-0.06, -0.072, -0.13, -0.075, -0.13, 0);
    const hole = new THREE.Path(); hole.moveTo(-0.08, 0); hole.bezierCurveTo(-0.08, 0.012, 0.05, 0.008, 0.06, 0); hole.bezierCurveTo(0.05, -0.008, -0.08, -0.012, -0.08, 0); sh.holes.push(hole);
    const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 5, curveSegments: 24 }).rotateX(-Math.PI / 2);
    const sm = add(sad, sg, M.rubber); sm.position.set(-0.285, 0.672, 0); sm.rotation.z = 0.03;
    const sAcc = add(sad, new THREE.BoxGeometry(0.03, 0.03, 0.002), M.accent); sAcc.position.set(-0.41, 0.69, 0); sAcc.visible = false;
    const rails = add(sad, new THREE.BoxGeometry(0.16, 0.012, 0.03), M.alu); rails.position.set(-0.285, 0.665, 0);
    sad.userData.ex = V(-0.04, 0.17, 0);

    /* drivetrain: chainring (belt sprocket), cranks, pedals, belt */
    const drive = P('drive');
    const ringShape = new THREE.Shape(); const nT = 46, rO = 0.102, rI = 0.094;
    for (let i = 0; i <= nT * 4; i++) { const a = i / (nT * 4) * Math.PI * 2, r = (i % 4 < 2) ? rO : rI; i ? ringShape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ringShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3, h = new THREE.Path(); h.absarc(Math.cos(a) * 0.062, Math.sin(a) * 0.062, 0.021, 0, Math.PI * 2, true); ringShape.holes.push(h); }
    const ringG = new THREE.ExtrudeGeometry(ringShape, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 1, curveSegments: 16 });
    const ring = add(drive, ringG, M.matte); ring.position.set(BB.x, BB.y, 0.062);
    const ringEdge = add(drive, new THREE.TorusGeometry(0.096, 0.0022, 6, 90), M.accent); ringEdge.position.set(BB.x, BB.y, 0.067);
    const spider = add(drive, new THREE.CylinderGeometry(0.03, 0.03, 0.012, 24).rotateX(Math.PI / 2), M.alu); spider.position.set(BB.x, BB.y, 0.068);
    const crankA = 1.95;
    for (const s of [1, -1]) {
      const a = s > 0 ? crankA : crankA + Math.PI, L = 0.17;
      const arm = add(drive, new THREE.BoxGeometry(L, 0.028, 0.014).translate(L / 2, 0, 0), M.black); arm.position.set(BB.x, BB.y, 0.078 * s); arm.rotation.z = a;
      const tip = V(BB.x + Math.cos(a) * L, BB.y + Math.sin(a) * L, 0.078 * s);
      const ped = add(drive, new THREE.BoxGeometry(0.09, 0.016, 0.075), M.black); ped.position.set(tip.x, tip.y, tip.z + 0.045 * s);
      const pedA = add(drive, new THREE.BoxGeometry(0.092, 0.005, 0.077), M.alu); pedA.position.set(tip.x, tip.y + 0.009, tip.z + 0.045 * s);
    }
    // belt
    const belt = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI / 2 - i / 12 * Math.PI; belt.push(V(BB.x + Math.cos(a) * 0.1, BB.y + Math.sin(a) * 0.1, 0.06)); }
    for (let i = 1; i <= 4; i++) belt.push(V(lerp(BB.x, R.x, i / 5), lerp(BB.y - 0.1, R.y - 0.05, i / 5), 0.06));
    for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 - i / 10 * Math.PI; belt.push(V(R.x + Math.cos(a) * 0.05, R.y + Math.sin(a) * 0.05, 0.06)); }
    for (let i = 1; i <= 4; i++) belt.push(V(lerp(R.x, BB.x, i / 5), lerp(R.y + 0.05, BB.y + 0.1, i / 5), 0.06));
    const beltC = new THREE.CatmullRomCurve3(belt, true);
    add(drive, new THREE.TubeGeometry(beltC, 200, 0.0045, 6, true), M.black);
    drive.userData.ex = V(0, -0.02, 0.2);

    /* wheels */
    const rimTex = carbonTex('#0e0f11', '#1e2024', (g, w, h) => {
      // sidewall band on the drive side: canvas y 0.72h..1h
      g.font = 'italic 800 40px "Barlow Condensed", sans-serif'; g.textBaseline = 'middle';
      for (let k = 0; k < 2; k++) {
        const x0 = k * w / 2 + 120;
        g.fillStyle = '#ffffff'; g.fillText('VOLTA', x0, h * 0.86);
        g.fillStyle = YEL; g.fillText('AERO·45', x0 + 120, h * 0.86);
        g.fillStyle = 'rgba(255,255,255,.4)'; g.font = '600 18px Inter, sans-serif'; g.fillText('CARBON  DISC  TUBELESS', x0 + 300, h * 0.86);
        g.font = 'italic 800 40px "Barlow Condensed", sans-serif';
      }
    });
    rimTex.wrapS = THREE.RepeatWrapping;
    const M2 = {
      rim: new THREE.MeshPhysicalMaterial({ map: rimTex, metalness: 0.3, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.05 }),
      tyre: new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0,
        map: canvasTex(2048, 256, (g, w, h) => {
          g.fillStyle = '#131315'; g.fillRect(0, 0, w, h);
          g.fillStyle = '#c0925c'; g.fillRect(0, h * 0.17, w, h * 0.17); g.fillRect(0, h * 0.66, w, h * 0.17); // gum sidewalls
          g.fillStyle = '#1b1b1d'; for (let x = 0; x < w; x += 16) { g.fillRect(x, h * 0.0, 9, h * 0.07); g.fillRect(x + 6, h * 0.93, 9, h * 0.07); }
        }),
        bumpMap: canvasTex(2048, 256, (g, w, h) => {
          g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff';
          for (let x = 0; x < w; x += 16) { g.fillRect(x, 0, 9, h * 0.08); g.fillRect(x + 6, h * 0.92, 9, h * 0.08); g.fillRect(x + 3, h * 0.1, 5, h * 0.05); g.fillRect(x + 9, h * 0.85, 5, h * 0.05); }
        }, false), bumpScale: 4 })
    };
    const rimProfile = [[0.318, 0.012], [0.302, 0.0135], [0.285, 0.011], [0.268, 0], [0.285, -0.011], [0.302, -0.0135], [0.318, -0.012], [0.318, 0.012]].map(([r, y]) => new THREE.Vector2(r, y));
    const rimGeo = new THREE.LatheGeometry(rimProfile, 128).rotateX(Math.PI / 2);
    const tyreGeo = new THREE.TorusGeometry(0.337, 0.025, 20, 200);
    const discProfile = [[0.27, 0.004], [0.2, 0.014], [0.1, 0.022], [0.035, 0.026], [0.035, -0.026], [0.1, -0.022], [0.2, -0.014], [0.27, -0.004]].map(([r, y]) => new THREE.Vector2(r, y)).reverse();
    const discGeo = new THREE.LatheGeometry(discProfile, 96).rotateX(Math.PI / 2);
    const discMat = new THREE.MeshPhysicalMaterial({ map: carbonTex('#0c0d0f', '#1a1c20'), metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04 });
    const rotorTex = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000';
      for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; for (const rr of [0.78, 0.88]) { g.beginPath(); g.arc(256 + Math.cos(a + rr) * 256 * rr, 256 + Math.sin(a + rr) * 256 * rr, 7, 0, 7); g.fill(); } }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.save(); g.translate(256, 256); g.rotate(a); g.beginPath(); g.ellipse(150, 0, 34, 20, 0.5, 0, 7); g.fill(); g.restore(); }
    }, false);
    const rotorMat = new THREE.MeshStandardMaterial({ color: '#b9bec5', metalness: 1, roughness: 0.25, alphaMap: rotorTex, alphaTest: 0.5, side: THREE.DoubleSide });
    const spokeGeo = new THREE.CylinderGeometry(0.0014, 0.0014, 1, 5);
    const wheelSets = [];
    function wheel(center, rear) {
      const g = P(rear ? 'rearWheel' : 'frontWheel'); g.position.copy(center); g.userData.base = center.clone();
      const spin = new THREE.Group(); g.add(spin); g.userData.spin = spin;
      add(spin, rimGeo, M2.rim);
      add(spin, tyreGeo, M2.tyre);
      const spokes = new THREE.InstancedMesh(spokeGeo, M.black, 24);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = V(0, 1, 0);
      const hubR = rear ? 0.07 : 0.03;
      for (let k = 0; k < 24; k++) {
        const s = k % 2 ? 1 : -1, a = k / 24 * Math.PI * 2;
        const H = V(Math.cos(a) * hubR, Math.sin(a) * hubR, s * (rear ? 0.022 : 0.03));
        const ar = a + s * (rear ? 0.05 : 0.18);
        const Rr = V(Math.cos(ar) * 0.272, Math.sin(ar) * 0.272, 0);
        const d = Rr.clone().sub(H), L = d.length();
        q.setFromUnitVectors(up, d.normalize());
        m.compose(H.clone().add(Rr).multiplyScalar(0.5), q, V(1, L, 1)); spokes.setMatrixAt(k, m);
      }
      spin.add(spokes);
      const disc = add(spin, discGeo, discMat); disc.visible = false;
      const discLogo = canvasTex(512, 512, (g2, w, h) => { g2.clearRect(0, 0, w, h); g2.translate(256, 256); g2.font = 'italic 800 56px "Barlow Condensed", sans-serif'; g2.textAlign = 'center'; g2.fillStyle = '#fff'; g2.fillText('VOLTA', 0, -150); g2.fillStyle = YEL; g2.font = 'italic 800 34px "Barlow Condensed", sans-serif'; g2.fillText('DISC·AERO', 0, 170); });
      const dl = new THREE.Mesh(new THREE.CircleGeometry(0.27, 48), new THREE.MeshBasicMaterial({ map: discLogo, transparent: true, depthWrite: false })); dl.position.z = 0.0262; dl.visible = false; spin.add(dl);
      wheelSets.push({ spokes, disc, dl });
      // hub
      if (rear) {
        const motorProfile = [[0.0, 0.034], [0.06, 0.034], [0.074, 0.03], [0.08, 0.018], [0.08, -0.018], [0.074, -0.03], [0.06, -0.034], [0.0, -0.034]].map(([r, y]) => new THREE.Vector2(r, y)).reverse();
        const shell = add(spin, new THREE.LatheGeometry(motorProfile, 64).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#1d1f22', metalness: 0.7, roughness: 0.3, clearcoat: 1 }));
        g.userData.shell = shell;
        for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const fin = add(spin, new THREE.BoxGeometry(0.03, 0.004, 0.003), M.alu); fin.position.set(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.035); fin.rotation.z = a; }
        const mr = add(spin, new THREE.TorusGeometry(0.067, 0.003, 8, 64), M.accent); mr.position.z = 0.036;
        const cap = add(spin, new THREE.CylinderGeometry(0.018, 0.018, 0.012, 24).rotateX(Math.PI / 2), M.alu); cap.position.z = 0.038;
        const cog = add(spin, new THREE.CylinderGeometry(0.05, 0.05, 0.006, 40).rotateX(Math.PI / 2), M.steel); cog.position.z = 0.06;
      } else {
        const hub = add(spin, new THREE.CylinderGeometry(0.02, 0.024, 0.09, 24).rotateX(Math.PI / 2), M.black);
        for (const s of [1, -1]) { const fl = add(spin, new THREE.CylinderGeometry(0.032, 0.032, 0.005, 24).rotateX(Math.PI / 2), M.alu); fl.position.z = 0.03 * s; }
      }
      const rotor = add(spin, new THREE.RingGeometry(0.03, 0.08, 64), rotorMat); rotor.position.z = -0.05;
      // axle + caliper (do not spin)
      const ax = add(g, new THREE.CylinderGeometry(0.008, 0.008, 0.15, 12).rotateX(Math.PI / 2), M.alu);
      const cal = add(g, new THREE.BoxGeometry(0.05, 0.03, 0.03), M.black); cal.position.set(rear ? -0.04 : 0.02, rear ? 0.07 : 0.07, -0.058); cal.rotation.z = rear ? 0.6 : -0.3;
      return g;
    }
    const fw = wheel(F, false), rw = wheel(R, true);
    if (fenders) for (const [g, a0, len] of [[fw, 0.35, 2.1], [rw, 0.55, 2.3]]) {
      const fg = new THREE.Mesh(new THREE.TorusGeometry(0.385, 0.03, 10, 60, len), M.matte); fg.scale.set(1, 1, 0.75); fg.rotation.z = a0; g.add(fg);
      const st = new THREE.Mesh(new THREE.TorusGeometry(0.386, 0.0034, 6, 60, len * 0.8), M.accent); st.position.z = 0.0236; st.rotation.z = a0 + len * 0.1; g.add(st);
    }
    fw.userData.ex = V(0.26, 0, -0.05); rw.userData.ex = V(-0.22, 0, -0.05);

    /* motor internals (x-ray / exploded) */
    const mot = P('motor'); mot.position.copy(R); mot.visible = false;
    const stator = add(mot, new THREE.CylinderGeometry(0.045, 0.045, 0.03, 36).rotateX(Math.PI / 2), M.steel);
    for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; const tooth = add(mot, new THREE.BoxGeometry(0.018, 0.009, 0.034), M.copper); tooth.position.set(Math.cos(a) * 0.055, Math.sin(a) * 0.055, 0); tooth.rotation.z = a; }
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; const mg = add(mot, new THREE.BoxGeometry(0.006, 0.014, 0.034), k % 2 ? M.accent : M.alu); mg.position.set(Math.cos(a) * 0.071, Math.sin(a) * 0.071, 0); mg.rotation.z = a; }
    const mglow = glow(YEL, 0.28, 0.6); mot.add(mglow);
    mot.userData.ex = V(0.02, 0.04, 0.34);

    /* contact shadow */
    const sh2 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(0,0,0,.85)'], [0.45, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
    sh2.rotation.x = -Math.PI / 2; sh2.position.set(0.02, -0.362, 0); sh2.scale.set(1.75, 0.38, 1); root.add(sh2); parts.shadow = sh2;
    // under-glow reflection line
    const refl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(230,255,0,.35)'], [1, 'rgba(230,255,0,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    refl.rotation.x = -Math.PI / 2; refl.position.set(0.0, -0.364, 0); refl.scale.set(2.4, 0.5, 1); root.add(refl); parts.refl = refl;

    /* x-ray wire overlays */
    const wires = frameMeshes.filter(m => !m.userData.decal).map(m => { const w = new THREE.Mesh(m.geometry, M.wire); w.position.copy(m.position); w.rotation.copy(m.rotation); w.scale.copy(m.scale); m.parent.add(w); return w; });

    for (const k in parts) if (parts[k].userData && !parts[k].userData.base) parts[k].userData.base = parts[k].position.clone();

    const api = {
      root, parts, M,
      setColor(c) { M.frame.color.set(c); },
      setAccent(c) { M.accent.color.set(c); M.accent.emissive.set(c); },
      setWheels(type) { wheelSets.forEach(w => { const d = type === 'disc'; w.spokes.visible = !d; w.disc.visible = d; w.dl.visible = d; }); },
      setBattery(n) { leds.forEach((l, i) => l.material.color.set(i < 2 + n ? YEL : '#2a2c20')); },
      setExplode(k) {
        for (const key of ['battery', 'cockpit', 'saddle', 'drive', 'frontWheel', 'rearWheel', 'motor']) {
          const p = parts[key]; p.position.copy(p.userData.base).addScaledVector(p.userData.ex, k);
        }
      },
      setXray(k) { // 0..1
        const x = k > 0.01;
        M.frame.transparent = x; M.frame.opacity = 1 - 0.9 * k; M.frame.depthWrite = !x;
        M.matte.transparent = x; M.matte.opacity = 1 - 0.8 * k; M.matte.depthWrite = !x;
        const shell = rw.userData.shell.material; shell.transparent = x; shell.opacity = 1 - 0.85 * k; shell.depthWrite = !x;
        M.wire.opacity = 0.055 * k; cells.visible = x; parts.motor.visible = x;
        frameMeshes.forEach(m => { if (m.userData.decal) m.visible = !x; });
      },
      spin(t) { fw.userData.spin.rotation.z = -t; rw.userData.spin.rotation.z = -t; }
    };
    api.setWheels(wheels);
    return api;
  }

  /* ---------- motion streaks behind the bike ---------- */
  function streaks(scene, { n = 46, z0 = -1.6, z1 = -0.25, y0 = -0.5, y1 = 1.1, x0 = -3, x1 = 3, front = 8 } = {}) {
    const tex = canvasTex(512, 8, (g, w, h) => { const lg = g.createLinearGradient(0, 0, w, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.8, 'rgba(255,255,255,.9)'); lg.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = lg; g.fillRect(0, 0, w, h); });
    const items = [];
    const geo = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < n + front; i++) {
      const isF = i >= n, yel = Math.random() < 0.45;
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: yel ? YEL : '#cfe3ff', transparent: true, opacity: isF ? 0.18 : lerp(0.25, 0.85, Math.random()), blending: THREE.AdditiveBlending, depthWrite: false }));
      const L = lerp(0.4, 1.8, Math.random());
      m.scale.set(L, lerp(0.002, isF ? 0.02 : 0.008, Math.random()), 1);
      m.position.set(lerp(x0, x1, Math.random()), lerp(y0, y1, Math.random()), isF ? lerp(0.5, 0.9, Math.random()) : lerp(z0, z1, Math.random()));
      m.userData.v = lerp(1.2, 3.4, Math.random());
      scene.add(m); items.push(m);
    }
    return (dt) => items.forEach(m => { m.position.x -= m.userData.v * dt; if (m.position.x < x0) m.position.x = x1; });
  }

  function dust(scene, { n = 260, spread = 3 } = {}) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * spread * 2; pos[i * 3 + 1] = Math.random() * 1.6 - 0.4; pos[i * 3 + 2] = (Math.random() - 0.5) * spread; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color: YEL, size: 0.008, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(p); return p;
  }

  /* render bike variants to PNG data URLs (one offscreen context, used for product cards) */
  function snapshot(configs, { w = 640, h = 400, cam = [0, 0.2, 3.25], look = [0.04, 0.12, 0], ry = -0.18 } = {}) {
    const st = stage(document.createElement('div'), { w, h, fov: 24 });
    if (!st) return [];
    const out = configs.map(c => {
      const b = bike(c); st.scene.add(b.root); b.root.rotation.y = c.ry ?? ry;
      if (c.wheels) b.setWheels(c.wheels);
      st.camera.position.set(...cam); st.camera.lookAt(...look);
      st.renderer.render(st.scene, st.camera);
      const url = st.renderer.domElement.toDataURL('image/png');
      st.scene.remove(b.root); return url;
    });
    window.__pending3d--; st.renderer.dispose(); st.renderer.forceContextLoss();
    return out;
  }

  return { THREE, stage, snapshot, project, bike, streaks, dust, glow, canvasTex, sweep, YEL };
};
