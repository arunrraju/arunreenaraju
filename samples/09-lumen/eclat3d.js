// ÉCLAT 3D: procedural fine-jewellery renderer (Three.js r160).
// Loaded as a classic script so it works from file://. Pages call: const E = Eclat(THREE, { RoomEnvironment, RoundedBoxGeometry });
window.Eclat = function (THREE, addons = {}) {
  const TAU = Math.PI * 2;
  const stages = [];
  window.__pending3d = (window.__pending3d || 0);

  /* ---------- environment: dark studio with softboxes, strips & pin lights ---------- */
  function envScene(theme = 'emerald') {
    const s = new THREE.Scene();
    const base = { emerald: 0x031510, sapphire: 0x040a1f, ruby: 0x1a0308, noir: 0x050506 }[theme] || 0x040404;
    s.background = new THREE.Color(base);
    const tc = new THREE.Color(base);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { tc: { value: new THREE.Vector3(tc.r, tc.g, tc.b) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 tc; varying vec3 vP; void main(){ float y = vP.y; float az = atan(vP.z, vP.x); vec3 c = tc*0.7 + vec3(0.015); float b = step(0.5, fract(az*14./6.2832)) * step(0.45, fract(y*6.+0.2)); c += vec3(2.4)*b*smoothstep(-0.35,0.3,y); c += tc*9.*b*(1.-smoothstep(-0.35,-0.1,y)); c += vec3(2.2)*smoothstep(0.8,0.93,y); gl_FragColor = vec4(c,1.); }' }));
    s.add(dome);
    const box = (w, h, c, k, pos, look) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos); m.lookAt(...(look || [0, 0, 0])); s.add(m); return m;
    };
    box(9, 9, 0xffffff, 6, [0, 9, 0]);                 // overhead softbox
    box(1.2, 10, 0xffffff, 9, [-8, 1, 2]);             // strip left
    box(1.2, 10, 0xf2f6ff, 9, [8, 1, -2]);             // strip right
    box(6, 2.5, 0xbfd8ff, 4, [0, 2, 9]);               // cool front fill
    box(5, 2, 0xffd79a, 4, [-3, -1, -9]);              // warm kicker
    box(4, 1, theme === 'sapphire' ? 0x3a68ff : 0x2fd39a, 3, [6, -3, 6]); // jewel-tone bounce
    // pin lights: give facets something sharp to catch
    const g = new THREE.PlaneGeometry(0.35, 0.35);
    for (let i = 0; i < 70; i++) {
      const u = Math.random() * 2 - 1, t = Math.random() * TAU, r = 7 + Math.random() * 2;
      const p = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(t), u, Math.sqrt(1 - u * u) * Math.sin(t)).multiplyScalar(r);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(Math.random() < .2 ? .58 : .1, .3, .5).multiplyScalar(14 + Math.random() * 10), side: THREE.DoubleSide }));
      m.position.copy(p); m.lookAt(0, 0, 0); s.add(m);
    }
    return s;
  }

  /* ---------- gem material: dispersive refraction + fake internal bounce + facet scintillation ---------- */
  const gemMats = [];
  function gemMaterial(env, { tint = [1, 1, 1], ior = 2.42, disp = 0.04, bright = 1.0, sparkle = 1.0, body = 0.0, sat = 0.0 } = {}) {
    const m = new THREE.ShaderMaterial({
      uniforms: { env: { value: env }, tint: { value: new THREE.Vector3(...tint) }, ior: { value: ior }, disp: { value: disp }, bright: { value: bright }, sparkle: { value: sparkle }, body: { value: body }, sat: { value: sat }, time: { value: 0 } },
      vertexShader: `
        varying vec3 vWN; varying vec3 vWP; varying vec3 vLP;
        void main(){
          vec4 lp = vec4(position,1.0); vec3 n = normal;
          #ifdef USE_INSTANCING
            lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
          #endif
          vec4 wp = modelMatrix * lp; vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * n); vLP = position;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        uniform samplerCube env; uniform vec3 tint; uniform float ior, disp, bright, sparkle, body, time, sat;
        varying vec3 vWN; varying vec3 vWP; varying vec3 vLP;
        vec3 E(vec3 d){ return textureCube(env, d).rgb; }
        vec3 bounce(vec3 d, vec3 n){
          float q = (floor(atan(vLP.z, vLP.x) / 6.2832 * 16.0) + 0.5) / 16.0 * 6.2832;
          vec3 pn = normalize(vec3(cos(q), -1.15, sin(q)));
          d = reflect(d, pn);
          vec3 b1 = normalize(n * vec3(1.0,-1.0,1.0) + vec3(0.0,-0.6,0.0));
          d = reflect(d, b1);
          vec3 b2 = normalize(vec3(-n.z, -0.4, n.x));
          return normalize(reflect(d, b2) + vec3(0.0, 0.15, 0.0));
        }
        void main(){
          vec3 n = normalize(vWN); vec3 I = normalize(vWP - cameraPosition);
          if (dot(n, I) > 0.0) n = -n;
          vec3 refl = E(reflect(I, n)); refl = mix(refl, refl * sqrt(tint) * 1.15, sat * 0.6);
          vec3 rr = refract(I, n, 1.0/(ior - disp)); vec3 rg = refract(I, n, 1.0/ior); vec3 rb = refract(I, n, 1.0/(ior + disp));
          vec3 col = vec3(E(bounce(rr, n)).r, E(bounce(rg, n)).g, E(bounce(rb, n)).b);
          float F = 0.17 + 0.83 * pow(1.0 - max(dot(-I, n), 0.0), 5.0);
          vec3 colT = mix(col, vec3(dot(col, vec3(0.3333))) * tint * 1.6, sat) * mix(tint, vec3(1.0), sat);
          vec3 c = mix(colT * bright, refl, F * (1.0 - sat * 0.45));
          c = pow(max(c, 0.0), vec3(1.25)) * 1.5 + tint * body;
                    float h = fract(sin(dot(floor(n * 31.0), vec3(12.989, 78.233, 37.719))) * 43758.5453);
          float s = pow(max(0.0, sin(time * 1.6 + h * 70.0)), 30.0) * step(0.5, h);
          c += s * sparkle * vec3(1.6, 1.6, 1.8);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    gemMats.push(m);
    return m;
  }
  const GEMS = {
    diamond: { tint: [1, 1, 1], ior: 2.42, disp: 0.09, bright: 1.0 },
    sapphire: { tint: [0.1, 0.25, 1.0], ior: 1.77, disp: 0.02, bright: 1.7, body: 0.04, sat: 0.85 },
    emerald: { tint: [0.05, 0.8, 0.38], ior: 1.58, disp: 0.015, bright: 1.6, body: 0.04, sat: 0.85 },
    ruby: { tint: [1.0, 0.05, 0.16], ior: 1.77, disp: 0.02, bright: 1.7, body: 0.04, sat: 0.85 },
    padparadscha: { tint: [1.0, 0.45, 0.35], ior: 1.77, disp: 0.02, bright: 1.5, body: 0.04, sat: 0.5 }
  };

  /* ---------- faceted geometry ---------- */
  function fromTris(tris) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(2), 3));
    g.computeVertexNormals(); // non-indexed => flat facets
    return g;
  }
  const OUTLINES = {
    round: t => [Math.cos(t), Math.sin(t)],
    oval: t => [Math.cos(t) * 0.78, Math.sin(t) * 1.12],
    cushion: t => { const c = Math.cos(t), s = Math.sin(t); return [Math.sign(c) * Math.abs(c) ** 0.62 * 0.92, Math.sign(s) * Math.abs(s) ** 0.62 * 0.98]; },
    pear: t => { const c = Math.cos(t), s = Math.sin(t); const z = s * 1.12; const x = c * (s > 0 ? 0.82 : 0.82 * (1 + s * 0.78)); return [x, z + (s < 0 ? s * 0.18 : 0)]; }
  };
  // Brilliant cut: table, star, bezel kites, upper girdle, girdle, lower girdle, pavilion mains, culet.
  function brilliant(shape = 'round', R = 1) {
    const O = OUTLINES[shape] || OUTLINES.round, N = 8;
    const P = (t, f, y) => { const [x, z] = O(t); return [x * f * R, y * R, z * R * f]; };
    const tri = [];
    const crownH = 0.33, tableF = 0.56, girdle = 0.025, pav = -0.86;
    const T = k => P(k / N * TAU, tableF, crownH);
    const S = k => P((k + 0.5) / N * TAU, 0.80, crownH * 0.5);
    const Gt = j => P(j / (2 * N) * TAU, 1, girdle);
    const Gb = j => P(j / (2 * N) * TAU, 1, -girdle);
    const M = k => P((k + 0.5) / N * TAU, 0.38, pav * 0.6);
    const C = [0, pav * R, 0];
    const top = [0, crownH * R, 0];
    for (let k = 0; k < N; k++) {
      const k1 = (k + 1) % N, km = (k + N - 1) % N;
      tri.push([top, T(k1), T(k)]);                              // table (fan)
      tri.push([T(k), T(k1), S(k)]);                             // star
      tri.push([T(k), S(k), Gt(2 * k)], [T(k), Gt(2 * k), S(km)]); // bezel kite
      tri.push([S(k), Gt(2 * k + 1), Gt(2 * k)], [S(k), Gt((2 * k + 2) % (2 * N)), Gt(2 * k + 1)]); // upper girdle
      for (const j of [2 * k, 2 * k + 1]) { const j1 = (j + 1) % (2 * N); tri.push([Gt(j), Gt(j1), Gb(j1)], [Gt(j), Gb(j1), Gb(j)]); } // girdle
      tri.push([M(k), Gb(2 * k), Gb(2 * k + 1)], [M(k), Gb(2 * k + 1), Gb((2 * k + 2) % (2 * N))]); // lower girdle
      tri.push([C, M(k), Gb(2 * k)], [C, Gb(2 * k), M(km)]);   // pavilion main kite
    }
    // windings may vary: make faces outward by checking normal vs centroid
    for (const t of tri) {
      const a = new THREE.Vector3(...t[0]), b = new THREE.Vector3(...t[1]), c = new THREE.Vector3(...t[2]);
      const n = b.clone().sub(a).cross(c.clone().sub(a)); const cen = a.clone().add(b).add(c).divideScalar(3);
      if (n.dot(cen.clone().sub(new THREE.Vector3(0, 0.0, 0))) < 0) { const tmp = t[1]; t[1] = t[2]; t[2] = tmp; }
    }
    const g = fromTris(tri); g.userData = { pav: -pav * R, crown: crownH * R, outline: O, R };
    return g;
  }
  // Emerald (step) cut: octagonal rings stepping down to a keel.
  function emeraldCut(R = 1) {
    const ax = 0.78, az = 1.12, c = 0.26;
    const oct = [[ax - c, az], [-(ax - c), az], [-ax, az - c], [-ax, -(az - c)], [-(ax - c), -az], [ax - c, -az], [ax, -(az - c)], [ax, az - c]];
    const rings = [[0.66, 0.66, 0.30], [0.80, 0.82, 0.24], [0.91, 0.92, 0.14], [1, 1, 0.025], [1, 1, -0.025], [0.84, 0.86, -0.22], [0.64, 0.7, -0.42], [0.4, 0.55, -0.6], [0.06, 0.4, -0.72]];
    const pt = (i, r) => [oct[i % 8][0] * r[0] * R, r[2] * R, oct[i % 8][1] * r[1] * R];
    const tri = [];
    for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < 8; i++) {
      const a = pt(i, rings[r]), b = pt(i + 1, rings[r]), cc = pt(i + 1, rings[r + 1]), d = pt(i, rings[r + 1]);
      tri.push([a, cc, b], [a, d, cc]);
    }
    const top = [0, rings[0][2] * R, 0], bot = [0, rings.at(-1)[2] * R, 0];
    for (let i = 0; i < 8; i++) { tri.push([top, pt(i, rings[0]), pt(i + 1, rings[0])]); tri.push([bot, pt(i + 1, rings.at(-1)), pt(i, rings.at(-1))]); }
    for (const t of tri) {
      const a = new THREE.Vector3(...t[0]), b = new THREE.Vector3(...t[1]), cc = new THREE.Vector3(...t[2]);
      const n = b.clone().sub(a).cross(cc.clone().sub(a)); const cen = a.clone().add(b).add(cc).divideScalar(3);
      if (n.dot(cen) < 0) { const tmp = t[1]; t[1] = t[2]; t[2] = tmp; }
    }
    const g = fromTris(tri); g.userData = { pav: 0.72 * R, crown: 0.3 * R, outline: t => { const c2 = Math.cos(t), s2 = Math.sin(t); const k = 1 / Math.max(Math.abs(c2) / ax, Math.abs(s2) / az, (Math.abs(c2) + Math.abs(s2)) / (ax + az - c)); return [c2 * k, s2 * k]; }, R };
    return g;
  }
  function stoneGeometry(shape, R) { return shape === 'emerald' ? emeraldCut(R) : brilliant(shape, R); }

  /* ---------- metals & velvet ---------- */
  const METALS = { platinum: 0xe9ebee, white: 0xdfe2e6, yellow: 0xf0c66e, rose: 0xf0b19a };
  const metal = (k = 'platinum', rough = 0.14) => new THREE.MeshPhysicalMaterial({ color: METALS[k] || k, metalness: 1, roughness: rough, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 1.35 });
  const velvet = (c = 0x0d2a22, sheen = 0x2a8a68) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 1, metalness: 0, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(sheen), envMapIntensity: 0.18 });

  /* ---------- ring ---------- */
  function buildRing(stage, { shape = 'round', metalKey = 'platinum', gem = 'diamond', carat = 2, pave = true, bandW = 0.24, eternity = false } = {}) {
    const grp = new THREE.Group();
    const mat = metal(metalKey);
    const Rin = 0.85, Rout = 0.985;
    // comfort-fit band: lathe a rounded section around Y, then stand it up (axis -> Z)
    const prof = [];
    const w = bandW / 2, th = Rout - Rin;
    for (let i = 0; i <= 24; i++) {
      const a = i / 24 * TAU; const c = Math.cos(a), s = Math.sin(a);
      const r = Rin + th / 2 + Math.sign(c) * Math.abs(c) ** 0.5 * th / 2, y = Math.sign(s) * Math.abs(s) ** 0.45 * w;
      prof.push(new THREE.Vector2(r, y));
    }
    const band = new THREE.Mesh(new THREE.LatheGeometry(prof, 120), mat);
    band.rotation.x = Math.PI / 2; grp.add(band);
    // stone
    const R = 0.4 * Math.cbrt(carat / 1.5);
    const sg = stoneGeometry(shape, R);
    const gy = Rout + sg.userData.pav * 0.78;
    let stone = null;
    if (!eternity) {
    stone = new THREE.Mesh(sg, gemMaterial(stage.cube, GEMS[gem] || GEMS.diamond));
    stone.position.y = gy; grp.add(stone);
    // prongs
    const O = sg.userData.outline;
    const angles = shape === 'round' ? [0, 1, 2, 3, 4, 5].map(k => (k + 0.5) / 6 * TAU) : shape === 'emerald' ? [0.62, Math.PI - 0.62, Math.PI + 0.62, TAU - 0.62] : shape === 'pear' ? [0.5, Math.PI - 0.5, Math.PI * 1.5] : [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    for (const a of angles) {
      const [ox, oz] = O(a);
      const pts = [
        new THREE.Vector3(ox * R * 0.25, Rout - 0.06, oz * R * 0.25),
        new THREE.Vector3(ox * R * 0.62, gy - sg.userData.pav * 0.55, oz * R * 0.62),
        new THREE.Vector3(ox * R * 1.03, gy - 0.02, oz * R * 1.03),
        new THREE.Vector3(ox * R * 1.04, gy + 0.05, oz * R * 1.04),
        new THREE.Vector3(ox * R * 0.9, gy + 0.09, oz * R * 0.9)];
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.034 * Math.max(0.8, R / 0.4), 10), mat);
      grp.add(tube);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.036 * Math.max(0.8, R / 0.4), 14, 10), mat); tip.position.copy(pts[4]); grp.add(tip);
    }
    // gallery rails (basket)
    for (const [f, y, t] of [[0.62, gy - sg.userData.pav * 0.55, 0.026], [0.4, Rout + 0.04, 0.022]]) {
      const tor = new THREE.Mesh(new THREE.TorusGeometry(R * f, t, 10, 64), mat);
      tor.rotation.x = Math.PI / 2; tor.position.y = y;
      const [sx, sz] = [Math.abs(O(0)[0]), Math.abs(O(Math.PI / 2)[1])];
      tor.scale.set(sx, sz, 1); grp.add(tor);
    }
    }
    // pavé: two staggered rows of melee on the shoulders, set in metal beads
    if (pave) {
      const mg = brilliant('round', 0.05);
      const list = [];
      if (eternity) for (let i = 0; i < 40; i++) list.push([i / 40 * TAU, 0, 1.45]);
      else for (let row = 0; row < 2; row++) for (let i = 0; i < 17; i++) {
        const side = i < 8.5 ? -1 : 1; const k = i < 8.5 ? i : i - 8.5;
        const phi = Math.PI / 2 + side * (0.32 + k * 0.12 + row * 0.06);
        const z = (row ? 1 : -1) * 0.052;
        list.push([phi, z]);
      }
      const inst = new THREE.InstancedMesh(mg, gemMaterial(stage.cube, { ...GEMS.diamond, sparkle: 1.4 }), list.length);
      const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.014, 8, 6), mat, list.length * 2);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
      list.forEach(([phi, z, sc = 1], i) => {
        const dir = new THREE.Vector3(Math.cos(phi), Math.sin(phi), 0);
        q.setFromUnitVectors(up, dir);
        m4.compose(dir.clone().multiplyScalar(Rout + 0.004).add(new THREE.Vector3(0, 0, z)), q, new THREE.Vector3(sc, sc, sc));
        inst.setMatrixAt(i, m4);
        for (const s of [-1, 1]) {
          const t = new THREE.Vector3(-Math.sin(phi), Math.cos(phi), 0).multiplyScalar(eternity ? 0 : s * 0.045);
          m4.compose(dir.clone().multiplyScalar(Rout + 0.012).add(t).add(new THREE.Vector3(0, 0, eternity ? s * 0.088 : z * 1.9)), q, new THREE.Vector3(1, 1, 1));
          beads.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), m4);
        }
      });
      grp.add(inst, beads);
    }
    grp.userData = { stone, stoneY: gy, R };
    return grp;
  }

  /* ---------- pendant on a chain ---------- */
  function buildPendant(stage, { gem = 'diamond', shape = 'pear', metalKey = 'platinum', carat = 2.2, chain = true } = {}) {
    const grp = new THREE.Group(); const mat = metal(metalKey);
    const R = 0.4 * Math.cbrt(carat / 1.5);
    const sg = stoneGeometry(shape, R);
    const stone = new THREE.Mesh(sg, gemMaterial(stage.cube, GEMS[gem]));
    stone.rotation.x = Math.PI / 2; // table faces camera, pear point down
        grp.add(stone);
    // halo of melee around the outline
    const O = sg.userData.outline; const mg = brilliant('round', 0.05);
    const n = 26; const inst = new THREE.InstancedMesh(mg, gemMaterial(stage.cube, { ...GEMS.diamond, sparkle: 1.5 }), n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    for (let i = 0; i < n; i++) { const a = i / n * TAU; const [x, z] = O(a); m4.compose(new THREE.Vector3(x * (R + 0.075), -z * (R + 0.075), 0.02), q, new THREE.Vector3(1, 1, 1)); inst.setMatrixAt(i, m4); }
    grp.add(inst);
    const rimPts = []; for (let i = 0; i < 96; i++) { const [x, z] = O(i / 96 * TAU); rimPts.push(new THREE.Vector3(x * (R + 0.13), -z * (R + 0.13), -0.01)); }
    grp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts, true), 160, 0.02, 8, true), mat));
    const rimPts2 = rimPts.map(p => new THREE.Vector3(p.x * (R + 0.02) / (R + 0.13), p.y * (R + 0.02) / (R + 0.13), -0.03));
    grp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts2, true), 160, 0.016, 8, true), mat));
    // bail
    const top = Math.max(...[...Array(64)].map((_, i) => -O(i / 64 * TAU)[1])) * (R + 0.13);
    const bail = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 10, 32), mat); bail.position.y = top + 0.07; bail.rotation.y = Math.PI / 2; grp.add(bail);
    if (chain) {
      // two catenary strands of instanced cable links rising out of frame
      const linkG = new THREE.TorusGeometry(0.03, 0.009, 6, 14); linkG.scale(1.6, 1, 1);
      const links = [];
      for (const s of [-1, 1]) {
        const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, top + 0.1, 0), new THREE.Vector3(s * 0.35, top + 0.9, -0.2), new THREE.Vector3(s * 1.0, top + 2.4, -0.6), new THREE.Vector3(s * 1.8, top + 4.6, -1.0)]);
        const L = curve.getLength(), cnt = Math.floor(L / 0.05);
        for (let i = 1; i < cnt; i++) links.push([curve.getPointAt(i / cnt), curve.getTangentAt(i / cnt), i]);
      }
      const im = new THREE.InstancedMesh(linkG, mat, links.length); const qq = new THREE.Quaternion(), tw = new THREE.Quaternion();
      links.forEach(([p, t, i], k) => { qq.setFromUnitVectors(new THREE.Vector3(1, 0, 0), t); tw.setFromAxisAngle(t, i % 2 ? Math.PI / 2 : 0); qq.premultiply(tw); m4.compose(p, qq, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(k, m4); });
      grp.add(im);
    }
    grp.userData = { stone };
    return grp;
  }

  /* ---------- loose stone ---------- */
  function buildStone(stage, { gem = 'diamond', shape = 'round', R = 0.6, sparkle = 1 } = {}) {
    const m = new THREE.Mesh(stoneGeometry(shape, R), gemMaterial(stage.cube, { ...GEMS[gem], sparkle }));
    return m;
  }

  /* ---------- plinth, contact shadow, sparkles ---------- */
  function radialTex(stops, size = 256) {
    const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
    const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => g.addColorStop(o, col));
    x.fillStyle = g; x.fillRect(0, 0, size, size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function shadow(w = 3, h = 1.4, k = 0.75) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: radialTex([[0, `rgba(0,0,0,${k})`], [0.45, `rgba(0,0,0,${k * 0.45})`], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; return m;
  }
  function plinth({ color = 0x082119, sheen = 0x2f8f6c, r = 2.2, h = 0.55, gold = true } = {}) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.02, h, 128, 1), velvet(color, sheen)); body.position.y = -h / 2; g.add(body);
    if (gold) {
      const gm = new THREE.MeshPhysicalMaterial({ color: 0xd6ad55, metalness: 1, roughness: 0.22, envMapIntensity: 1.2 });
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.028, 12, 160), gm); rim.rotation.x = Math.PI / 2; g.add(rim);
      const rim2 = rim.clone(); rim2.position.y = -h; rim2.scale.setScalar(1.02); g.add(rim2);
    }
    return g;
  }
  function starTexture() {
    const s = 128, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d');
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.08, 'rgba(255,255,255,.9)'); g.addColorStop(0.25, 'rgba(200,225,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    x.globalCompositeOperation = 'lighter';
    for (const [w, a, rot] of [[2.2, 1, 0], [2.2, 1, Math.PI / 2], [1.1, .45, Math.PI / 4], [1.1, .45, -Math.PI / 4]]) {
      x.save(); x.translate(s / 2, s / 2); x.rotate(rot);
      const lg = x.createLinearGradient(-s / 2, 0, s / 2, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, `rgba(255,255,255,${a})`); lg.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = lg; x.fillRect(-s / 2, -w / 2, s, w); x.restore();
    }
    const t = new THREE.CanvasTexture(c); return t;
  }
  let _star;
  function sparkles(count = 120, spread = [4, 3, 3], { size = 26, colors = [0xffffff, 0xcfe6ff, 0xffe7b0], center = [0, 0, 0], shape = 'box' } = {}) {
    _star = _star || starTexture();
    const pos = [], col = [], ph = [], sz = [];
    for (let i = 0; i < count; i++) {
      let p;
      if (shape === 'disc') { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * spread[0]; p = [Math.cos(a) * r, (Math.random() - .5) * spread[1], Math.sin(a) * r]; }
      else p = spread.map(v => (Math.random() - 0.5) * v);
      pos.push(p[0] + center[0], p[1] + center[1], p[2] + center[2]);
      const c = new THREE.Color(colors[i % colors.length]); col.push(c.r, c.g, c.b); ph.push(Math.random() * 100); sz.push(0.35 + Math.random() ** 3 * 1.6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('phase', new THREE.Float32BufferAttribute(ph, 1)); g.setAttribute('sz', new THREE.Float32BufferAttribute(sz, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { map: { value: _star }, time: { value: 0 }, size: { value: size } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float phase; attribute float sz; attribute vec3 color; uniform float time, size; varying vec3 vC; varying float vA;
        void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); float tw = pow(0.5+0.5*sin(time*1.7+phase*6.283), 3.0);
        vA = 0.25 + tw; vC = color; gl_PointSize = size * sz * (0.5 + tw) * (6.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * t.rgb * vA, t.a * vA); }`
    });
    gemMats.push(m);
    return new THREE.Points(g, m);
  }
  // big lens flare stars pinned to a point (e.g. the stone)
  function flares(n = 3, at = new THREE.Vector3(), radius = 0.3, scale = 0.9) {
    _star = _star || starTexture();
    const grp = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: _star, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, color: i % 2 ? 0xd8ecff : 0xffffff }));
      s.position.set(at.x + (Math.random() - .5) * radius, at.y + (Math.random() - .2) * radius * 0.6, at.z + (Math.random() - .5) * radius);
      s.userData = { ph: Math.random() * 10, base: scale * (0.5 + Math.random() * 0.7) };
      grp.add(s);
    }
    grp.userData.tick = t => grp.children.forEach(s => { const k = Math.max(0, Math.sin(t * 1.3 + s.userData.ph)) ** 4; s.scale.setScalar(s.userData.base * (0.15 + k)); s.material.rotation = t * 0.2 + s.userData.ph; s.material.opacity = 0.3 + k * 0.7; });
    return grp;
  }

  /* ---------- stage ---------- */
  function stage(el, { w, h, fov = 30, cam = [0, 1, 7], target = [0, 0.6, 0], theme = 'emerald', exposure = 1.05, bg = null, fog = null } = {}) {
    w = w || el.clientWidth; h = h || el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !bg, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure; renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px'; renderer.domElement.style.display = 'block';
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); if (bg) scene.background = new THREE.Color(bg);
    const es = envScene(theme);
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.02).texture;
    const crt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType, generateMipmaps: false });
    const cc = new THREE.CubeCamera(0.1, 50, crt); es.add(cc); cc.update(renderer, es);
    const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 100); camera.position.set(...cam); camera.lookAt(...target);
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 6, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfd8ff, 1.2); rim.position.set(-5, 3, -4); scene.add(rim);
    const st = { renderer, scene, camera, cube: crt.texture, el, w, h, ticks: [], target: new THREE.Vector3(...target), frame: 0, after: [] };
    st.onFrame = fn => st.ticks.push(fn);
    window.__pending3d++;
    stages.push(st);
    return st;
  }
  const clock = new THREE.Clock();
  let running = false;
  function loop() {
    const t = clock.getElapsedTime() + 4.2; // offset so the first frame is "mid-moment"
    gemMats.forEach(m => m.uniforms.time.value = t);
    for (const st of stages) {
      st.ticks.forEach(fn => fn(t, st));
      st.renderer.render(st.scene, st.camera);
      st.after.forEach(fn => fn(st));
      if (++st.frame === 2) { window.__pending3d--; if (window.__pending3d <= 0) window.__ready3d = true; }
    }
    requestAnimationFrame(loop);
  }
  function start() { if (!running) { running = true; loop(); } }

  // Offscreen product renders -> dataURL (for card thumbnails). Reuses one renderer.
  let snapR;
  function snapshot(build, { w = 600, h = 600, cam = [0, 1.6, 5.4], target = [0, 0.75, 0], theme = 'emerald', fov = 30, bg = null, t = 4.6, exposure = 1.1 } = {}) {
    if (!snapR) {
      const c = document.createElement('canvas');
      snapR = { renderer: new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true }), envs: {} };
      snapR.renderer.setPixelRatio(1); snapR.renderer.toneMapping = THREE.ACESFilmicToneMapping; snapR.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    const r = snapR.renderer; r.setSize(w, h, false); r.toneMappingExposure = exposure;
    if (!snapR.envs[theme]) {
      const es = envScene(theme); const pm = new THREE.PMREMGenerator(r);
      const crt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType, generateMipmaps: false }); const cc = new THREE.CubeCamera(0.1, 50, crt); es.add(cc); cc.update(r, es);
      snapR.envs[theme] = { env: pm.fromScene(es, 0.02).texture, cube: crt.texture };
    }
    const E = snapR.envs[theme];
    const scene = new THREE.Scene(); scene.environment = E.env; if (bg) scene.background = new THREE.Color(bg);
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 6, 4); scene.add(key);
    const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 100); camera.position.set(...cam); camera.lookAt(...target);
    const fake = { cube: E.cube };
    const before = gemMats.length;
    build(scene, fake);
    gemMats.slice(before).forEach(m => m.uniforms.time.value = t);
    r.render(scene, camera);
    return r.domElement.toDataURL('image/png');
  }

  return { stage, start, buildRing, buildPendant, buildStone, plinth, shadow, sparkles, flares, gemMaterial, metal, velvet, GEMS, METALS, brilliant, emeraldCut, snapshot, radialTex, THREE };
};
