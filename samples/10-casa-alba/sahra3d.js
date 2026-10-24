/* SAHRA — shared Three.js scene builder (classic script; call SAHRA3D(THREE, addons, canvas, preset, opts) from a module). */
(function () {
  /* ---------- simplex noise 2D ---------- */
  const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  const perm = new Uint8Array(512), grad = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  (function () { const p = []; for (let i = 0; i < 256; i++) p[i] = i; let s = 1337; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; })();
  function n2(xin, yin) {
    let n0, n1, n2v; const s = (xin + yin) * F2; const i = Math.floor(xin + s), j = Math.floor(yin + s); const t = (i + j) * G2;
    const x0 = xin - (i - t), y0 = yin - (j - t); let i1, j1; if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2; const ii = i & 255, jj = j & 255;
    let t0 = 0.5 - x0 * x0 - y0 * y0; if (t0 < 0) n0 = 0; else { const g = grad[perm[ii + perm[jj]] & 7]; t0 *= t0; n0 = t0 * t0 * (g[0] * x0 + g[1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1; if (t1 < 0) n1 = 0; else { const g = grad[perm[ii + i1 + perm[jj + j1]] & 7]; t1 *= t1; n1 = t1 * t1 * (g[0] * x1 + g[1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2; if (t2 < 0) n2v = 0; else { const g = grad[perm[ii + 1 + perm[jj + 1]] & 7]; t2 *= t2; n2v = t2 * t2 * (g[0] * x2 + g[1] * y2); }
    return 70 * (n0 + n1 + n2v);
  }
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* raw dune field: ridged, domain-warped noise = sharp crests, soft troughs */
  function duneRaw(x, z) {
    const wx = x + 34 * n2(x * 0.004 + 3.1, z * 0.004), wz = z + 34 * n2(x * 0.004, z * 0.004 + 7.7);
    const a = n2(wx * 0.0042, wz * 0.0105); let r = 1 - Math.sqrt(a * a + 0.0012); r = Math.pow(r, 2.4);
    const b = n2(wx * 0.011 + 5, wz * 0.021); let r2 = 1 - Math.sqrt(b * b + 0.002); r2 = r2 * r2 * r2;
    return r * 17 + r2 * 3.2 + n2(x * 0.0022, z * 0.0022) * 7 + n2(x * 0.05, z * 0.05) * 0.18;
  }

  /* ---------- textures ---------- */
  function rippleNormal(THREE) {
    const S = 512, h = new Float32Array(S * S), T = Math.PI * 2;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S;
      const warp = 0.012 * Math.sin(T * (2 * u + v)) + 0.008 * Math.sin(T * (3 * v - u + 0.3)) + 0.006 * Math.sin(T * (5 * u + 4 * v)) + 0.004 * Math.sin(T * (11 * u - 7 * v));
      const f = ((v + warp) * 26) % 1; const ff = f < 0 ? f + 1 : f;
      const tri = ff < 0.72 ? ff / 0.72 : (1 - ff) / 0.28;
      h[y * S + x] = tri * tri * (3 - 2 * tri) + (Math.random() - 0.5) * 0.06;
    }
    const d = new Uint8Array(S * S * 4), k = 2.2;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const l = h[y * S + ((x - 1 + S) % S)], r = h[y * S + ((x + 1) % S)], t = h[((y - 1 + S) % S) * S + x], b = h[((y + 1) % S) * S + x];
      let nx = (l - r) * k, ny = (t - b) * k, nz = 1; const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L;
      const i = (y * S + x) * 4; d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
    const tex = new THREE.DataTexture(d, S, S, THREE.RGBAFormat); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 8; tex.needsUpdate = true; return tex;
  }
  function glowTex(THREE, stops) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); (stops || [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]).forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function textPlane(THREE, text, opt) {
    const c = document.createElement('canvas'); c.width = 4096; c.height = 1024; const g = c.getContext('2d');
    g.font = `400 ${opt.px || 760}px ${opt.font || 'Marcellus'}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = (opt.ls || 60) + 'px';
    const grd = g.createLinearGradient(0, 120, 0, 900); (opt.grad || [[0, '#fff8ee'], [1, '#ffe2b8']]).forEach(s => grd.addColorStop(s[0], s[1]));
    g.fillStyle = grd; g.fillText(text, 2048 + (opt.ls || 60) / 2, opt.base || 860);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(opt.w, opt.w / 4), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: opt.opacity ?? 1, fog: false, toneMapped: false, depthWrite: false }));
    return m;
  }

  /* ---------- sky ---------- */
  function skyMesh(THREE, cfg) {
    const u = { top: { value: new THREE.Color(cfg.top) }, mid: { value: new THREE.Color(cfg.mid) }, horizon: { value: new THREE.Color(cfg.horizon) }, ground: { value: new THREE.Color(cfg.ground || cfg.horizon) }, sunColor: { value: new THREE.Color(cfg.sunColor || '#ffb06a') }, sunDir: { value: cfg.sunDir.clone() }, sunSize: { value: cfg.sunSize ?? 0.0009 }, glow: { value: cfg.glow ?? 1 }, haze: { value: new THREE.Color(cfg.haze || cfg.horizon) } };
    const m = new THREE.ShaderMaterial({
      uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 top,mid,horizon,ground,sunColor,sunDir,haze; uniform float sunSize,glow; varying vec3 vDir;
      void main(){ vec3 d=normalize(vDir); float y=d.y;
        vec3 col = mix(horizon, mid, smoothstep(-0.01, 0.16, y)); col = mix(col, top, smoothstep(0.14, 0.75, y));
        col = mix(col, haze, (1.-smoothstep(0.,0.07,abs(y)))*0.55);
        if(y<0.) col = mix(horizon, ground, smoothstep(0.,0.2,-y));
        float s = max(dot(d, normalize(sunDir)), 0.);
        col += sunColor * (pow(s, 6.)*0.28 + pow(s, 48.)*0.55 + pow(s,600.)*1.2) * glow;
        col += sunColor * smoothstep(1.-sunSize, 1.-sunSize*0.55, s) * 6. * step(0.,sunDir.y);
        gl_FragColor = vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1500, 64, 32), m); mesh.renderOrder = -10; mesh.frustumCulled = false; return mesh;
  }

  /* ---------- stars + milky way ---------- */
  function starfield(THREE, opt) {
    const N = opt.count || 9000, MW = opt.mw ?? 22000, R = 1200; const pos = [], col = [], size = [], ph = [];
    const palette = [new THREE.Color('#fff4e8'), new THREE.Color('#cfdcff'), new THREE.Color('#ffd9b0'), new THREE.Color('#e6d6ff'), new THREE.Color('#ffffff')];
    const add = (v, c, s) => { pos.push(v.x * R, v.y * R, v.z * R); col.push(c.r, c.g, c.b); size.push(s); ph.push(Math.random()); };
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 1.1 - 0.1, Math.random() * 2 - 1).normalize();
      const b = Math.pow(Math.random(), 7); add(v, palette[(Math.random() * 5) | 0].clone().multiplyScalar(0.55 + b * 2.2), 1.4 + b * 5);
    }
    const n = opt.bandC ? opt.bandC.clone().normalize().cross(opt.bandD.clone().normalize()).normalize() : (opt.band || new THREE.Vector3(0.55, 0.35, 0.75)).clone().normalize();
    const a = new THREE.Vector3(1, 0, 0).cross(n).normalize(), b2 = n.clone().cross(a).normalize();
    const warm = [new THREE.Color('#ffe7cf'), new THREE.Color('#f6d2ff'), new THREE.Color('#d6e2ff'), new THREE.Color('#ffcfa6')];
    let made = 0, guard = 0;
    while (made < MW && guard++ < MW * 6) {
      const t = Math.random() * Math.PI * 2; const g = (Math.random() + Math.random() + Math.random() - 1.5) * 0.17;
      const dens = 0.55 + 0.45 * n2(Math.cos(t) * 3, Math.sin(t) * 3) + 0.5 * Math.exp(-Math.pow((t - 1.2) * 1.3, 2));
      if (Math.random() > dens * Math.exp(-Math.abs(g) * 5)) continue;
      const lane = Math.abs(g - 0.02 * Math.sin(t * 3)) < 0.018 && Math.random() < 0.75; if (lane) continue;
      const v = a.clone().multiplyScalar(Math.cos(t)).add(b2.clone().multiplyScalar(Math.sin(t))).add(n.clone().multiplyScalar(g)).normalize();
      if (v.y < -0.12) continue;
      add(v, warm[(Math.random() * 4) | 0].clone().multiplyScalar(0.35 + Math.random() * 0.75), 1.0 + Math.random() * 2.0); made++;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('size', new THREE.Float32BufferAttribute(size, 1)); geo.setAttribute('phase', new THREE.Float32BufferAttribute(ph, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, bright: { value: opt.bright ?? 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float size; attribute vec3 color; attribute float phase; uniform float time; varying vec3 vC; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; float tw=0.72+0.28*sin(time*1.7+phase*40.); vC=color*tw; gl_PointSize=size; }',
      fragmentShader: 'uniform float bright; varying vec3 vC; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); a=a*a; gl_FragColor=vec4(vC*a*bright*1.4,1.); }'
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = -5;
    // nebular glow along the band
    const gp = [], gc = [], gs = []; const neb = [new THREE.Color('#5b3f8f'), new THREE.Color('#8a5a7a'), new THREE.Color('#3b4f9a'), new THREE.Color('#a8744f')];
    for (let i = 0; i < 700; i++) {
      const t = Math.random() * Math.PI * 2, g = (Math.random() - 0.5) * 0.16; const v = a.clone().multiplyScalar(Math.cos(t)).add(b2.clone().multiplyScalar(Math.sin(t))).add(n.clone().multiplyScalar(g)).normalize(); if (v.y < -0.1) continue;
      gp.push(v.x * R * 1.05, v.y * R * 1.05, v.z * R * 1.05); const c = neb[(Math.random() * 4) | 0].clone().multiplyScalar(0.13 + 0.12 * Math.exp(-Math.pow((t - 1.2) * 1.3, 2))); gc.push(c.r, c.g, c.b); gs.push(60 + Math.random() * 120);
    }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); g2.setAttribute('color', new THREE.Float32BufferAttribute(gc, 3)); g2.setAttribute('size', new THREE.Float32BufferAttribute(gs, 1)); g2.setAttribute('phase', new THREE.Float32BufferAttribute(gs.map(() => 0), 1));
    const neb2 = new THREE.Points(g2, new THREE.ShaderMaterial({ uniforms: { bright: { value: opt.bright ?? 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: 'attribute float size; attribute vec3 color; varying vec3 vC; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=size; }', fragmentShader: 'uniform float bright; varying vec3 vC; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); gl_FragColor=vec4(vC*a*bright,1.); }' }));
    neb2.frustumCulled = false; neb2.renderOrder = -6;
    const grp = new THREE.Group(); grp.add(neb2, pts); grp.userData.mat = mat; return grp;
  }

  /* ---------- the dome suite ---------- */
  function domeSuite(THREE, X, opt) {
    const R = opt.R || 5, night = !!opt.night, G = new THREE.Group(), parts = {};
    const RB = X.RoundedBoxGeometry;
    const stone = new THREE.MeshStandardMaterial({ color: '#d8b48c', roughness: 0.82 });
    const stoneDark = new THREE.MeshStandardMaterial({ color: '#b98a5e', roughness: 0.85 });
    const wood = new THREE.MeshStandardMaterial({ color: '#7a4a2c', roughness: 0.55 });
    const linen = new THREE.MeshStandardMaterial({ color: '#f4ede2', roughness: 0.9 });
    const violet = new THREE.MeshStandardMaterial({ color: '#4a3566', roughness: 0.8 });
    const bronze = new THREE.MeshStandardMaterial({ color: '#c9a072', metalness: 1, roughness: 0.32 });
    const brass = new THREE.MeshStandardMaterial({ color: '#d9b27a', metalness: 1, roughness: 0.22 });
    const base = new THREE.Group(), interior = new THREE.Group(), shell = new THREE.Group(), deck = new THREE.Group();
    // plinth
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.22, R * 1.3, 0.9, 96), stone); pl.position.y = -0.15; base.add(pl);
    const step = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.16, R * 1.16, 0.12, 96), stoneDark); step.position.y = 0.36; base.add(step);
    // deck with plunge pool
    const dk = new THREE.Mesh(new RB(R * 1.7, 0.6, R * 1.25, 3, 0.12), stone); dk.position.set(R * 1.55, -0.02, R * 0.55); deck.add(dk);
    const rim = new THREE.Mesh(new RB(R * 1.25, 0.2, R * 0.72, 3, 0.08), stoneDark); rim.position.set(R * 1.7, 0.32, R * 0.6); deck.add(rim);
    const water = new THREE.Mesh(new RB(R * 1.12, 0.1, R * 0.6, 3, 0.04), new THREE.MeshPhysicalMaterial({ color: night ? '#0e5d6e' : '#2a93a6', roughness: 0.03, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.02, emissive: night ? '#1aa6bf' : '#0b3a44', emissiveIntensity: night ? 1.6 : 0.25, envMapIntensity: 1.6 }));
    water.position.set(R * 1.7, 0.4, R * 0.6); deck.add(water); parts.water = water;
    // loungers on deck
    for (let i = 0; i < 2; i++) { const l = new THREE.Mesh(new RB(0.75, 0.22, 2.1, 2, 0.08), linen); l.position.set(R * 1.15 + i * 1.0, 0.42, R * 1.05); l.rotation.y = 0.1; deck.add(l); }
    // floor
    const fl = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.985, R * 0.985, 0.1, 96), wood); fl.position.y = 0.46; interior.add(fl);
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.55, R * 0.55, 0.03, 64), new THREE.MeshStandardMaterial({ color: '#c98a4b', roughness: 1 })); rug.position.set(0.2, 0.52, 0.6); interior.add(rug);
    // bed
    const bb = new THREE.Mesh(new RB(3.9, 0.42, 3.1, 3, 0.08), wood); bb.position.set(-0.6, 0.72, -1.2); interior.add(bb);
    const mat = new THREE.Mesh(new RB(3.6, 0.42, 2.8, 4, 0.16), linen); mat.position.set(-0.6, 1.1, -1.2); interior.add(mat);
    const thr = new THREE.Mesh(new RB(3.66, 0.1, 1.0, 2, 0.05), violet); thr.position.set(-0.6, 1.33, -0.3); interior.add(thr);
    for (let i = -1; i <= 1; i += 2) { const p = new THREE.Mesh(new RB(1.15, 0.32, 0.6, 3, 0.14), linen); p.position.set(-0.6 + i * 0.75, 1.42, -2.25); p.rotation.x = -0.35; interior.add(p); }
    const hb = new THREE.Mesh(new RB(4.3, 1.3, 0.25, 2, 0.08), wood); hb.position.set(-0.6, 1.3, -2.85); interior.add(hb);
    // low table + lamp
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 32), brass); tb.position.set(2.2, 0.75, -1.6); interior.add(tb);
    const lampMat = new THREE.MeshStandardMaterial({ color: '#ffd7a0', emissive: '#ffb25e', emissiveIntensity: night ? 6 : 1.4 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 16), lampMat); lamp.position.set(2.2, 1.35, -1.6); interior.add(lamp);
    const lamp2 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 16), lampMat); lamp2.position.set(-3.2, 0.9, 0.6); interior.add(lamp2);
    // armchair
    const ch = new THREE.Mesh(new RB(1.3, 0.7, 1.2, 3, 0.25), new THREE.MeshStandardMaterial({ color: '#e7c9a0', roughness: 0.95 })); ch.position.set(1.4, 0.85, 1.9); ch.rotation.y = -0.6; interior.add(ch);
    // telescope
    const tel = new THREE.Group(); const legG = new THREE.CylinderGeometry(0.035, 0.035, 1.6, 8);
    for (let i = 0; i < 3; i++) { const lg = new THREE.Mesh(legG, bronze); const a = i * Math.PI * 2 / 3; lg.position.set(Math.cos(a) * 0.3, 0.75, Math.sin(a) * 0.3); lg.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); tel.add(lg); }
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.9, 24), brass); tube.position.set(0, 1.75, 0); tube.rotation.z = -0.9; tube.rotation.y = 0.4; tel.add(tube);
    tel.position.set(-2.9, 0.5, 1.9); interior.add(tel);
    // glass hemisphere
    const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.25, ior: 1.38, iridescence: 0.55, iridescenceIOR: 1.25, iridescenceThicknessRange: [180, 520], envMapIntensity: 1.4, specularIntensity: 1, clearcoat: 0.6, attenuationColor: new THREE.Color(night ? '#ffd9a8' : '#fff1de'), attenuationDistance: 6 }));
    glass.position.y = 0.46; shell.add(glass); parts.glass = glass;
    // geodesic struts (4-frequency icosa, vertex up, cut at equator)
    const ico = new THREE.IcosahedronGeometry(R * 1.004, 3); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 1.618).normalize(), new THREE.Vector3(0, 1, 0));
    ico.applyQuaternion(q); const pa = ico.attributes.position; const key = v => v.toArray().map(n => n.toFixed(3)).join(','); const edges = new Map();
    for (let i = 0; i < pa.count; i += 3) { const vs = [0, 1, 2].map(k => new THREE.Vector3().fromBufferAttribute(pa, i + k)); for (let k = 0; k < 3; k++) { const A = vs[k], B = vs[(k + 1) % 3]; if (A.y < -0.01 || B.y < -0.01) continue; const kk = [key(A), key(B)].sort().join('|'); if (!edges.has(kk)) edges.set(kk, [A, B]); } }
    const strutG = new THREE.CylinderGeometry(R * 0.012, R * 0.012, 1, 6, 1); const inst = new THREE.InstancedMesh(strutG, bronze, edges.size); const m4 = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0); let ei = 0;
    edges.forEach(([A, B]) => { const mid = A.clone().add(B).multiplyScalar(0.5); const dir = B.clone().sub(A); const len = dir.length(); const qq = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()); m4.compose(mid, qq, new THREE.Vector3(1, len, 1)); inst.setMatrixAt(ei++, m4); });
    inst.position.y = 0.46; shell.add(inst);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.005, 0.1, 12, 160), bronze); ring.rotation.x = Math.PI / 2; ring.position.y = 0.5; shell.add(ring);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.18, 32), bronze); cap.position.y = R + 0.48; shell.add(cap);
    // interior light
    const pLight = new THREE.PointLight('#ffb468', night ? 260 : 25, R * 4, 1.6); pLight.position.set(0.5, 2.6, 0); interior.add(pLight); parts.light = pLight;
    if (night) { const pool = new THREE.PointLight('#38d3e8', 40, 10, 1.6); pool.position.set(R * 1.7, 1.2, R * 0.6); deck.add(pool); }
    G.add(base, deck, interior, shell); parts.base = base; parts.deck = deck; parts.interior = interior; parts.shell = shell;
    G.traverse(o => { if (o.isMesh) { o.castShadow = o !== glass; o.receiveShadow = true; } });
    if (night || opt.glow) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(THREE, [[0, 'rgba(255,190,120,.85)'], [0.3, 'rgba(255,150,80,.28)'], [1, 'rgba(255,120,60,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      sp.scale.set(R * 5.2, R * 4.4, 1); sp.position.y = R * 0.55; G.add(sp); parts.glow = sp;
    }
    G.userData.parts = parts; return G;
  }

  /* ---------- dune terrain ---------- */
  function dunes(THREE, opt) {
    const size = opt.size || 640, seg = opt.seg || 300; const geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position; const cols = new Float32Array(p.count * 3);
    const cLo = new THREE.Color(opt.lo || '#9a5a2e'), cMid = new THREE.Color(opt.mid || '#c98a4b'), cHi = new THREE.Color(opt.hi || '#e7b06c'), tmp = new THREE.Color();
    const H = opt.height;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const y = H(x, z); p.setY(i, y); }
    geo.computeVertexNormals(); const nr = geo.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), slope = 1 - nr.getY(i); const t = ss(-4, 26, y);
      tmp.copy(cLo).lerp(cMid, ss(0, 0.5, t)).lerp(cHi, ss(0.5, 1, t) * 0.8); tmp.lerp(cLo, ss(0.05, 0.4, slope) * 0.35);
      const nn = n2(p.getX(i) * 0.05, p.getZ(i) * 0.05) * 0.04; tmp.offsetHSL(0, 0, nn);
      cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const nm = rippleNormal(THREE); nm.repeat.set(opt.rep || 110, opt.rep || 110);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0, normalMap: nm, normalScale: new THREE.Vector2(opt.ns ?? 0.45, opt.ns ?? 0.45), envMapIntensity: opt.env ?? 0.5 });
    if (opt.contours) {
      mat.onBeforeCompile = s => {
        s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying float vH;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvH = position.y;');
        s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vH;').replace('#include <color_fragment>', `#include <color_fragment>
          float f = vH/1.4; float dd = abs(fract(f-.5)-.5)/fwidth(f); float ln = 1.-min(dd,1.);
          float f2 = vH/7.0; float d2 = abs(fract(f2-.5)-.5)/fwidth(f2); float ln2 = 1.-min(d2/1.6,1.);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.,.86,.62), ln*.28 + ln2*.5);`);
      };
    }
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.castShadow = true; return m;
  }

  function windSand(THREE, opt) {
    const N = opt.n || 2400, pos = new Float32Array(N * 3), base = [];
    for (let i = 0; i < N; i++) { const x = (rnd() - 0.5) * opt.w, z = opt.z0 + (rnd() - 0.5) * opt.d; const y = opt.h(x, z) + rnd() * rnd() * 3.2; pos.set([x, y, z], i * 3); base.push([x, y, z, rnd()]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: opt.color || '#ffd9a6', size: opt.size || 0.09, transparent: true, opacity: opt.opacity ?? 0.55, depthWrite: false, sizeAttenuation: true }));
    pts.userData.tick = t => { for (let i = 0; i < N; i++) { const b = base[i]; let x = b[0] + ((t * 4 + b[3] * 60) % 60) - 30; pos[i * 3] = x; pos[i * 3 + 1] = b[1] + Math.sin(t * 2 + b[3] * 20) * 0.25; } g.attributes.position.needsUpdate = true; };
    return pts;
  }

  /* ---------- main ---------- */
  window.SAHRA3D = function (THREE, X, canvas, preset, opts = {}) {
    window.__p3d = (window.__p3d || 0) + 1;
    const W = canvas.parentElement.clientWidth || 1440, Hh = canvas.parentElement.clientHeight || 900;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(1); renderer.setSize(W, Hh, true);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(opts.fov || 34, W / Hh, 0.5, 4000);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const P = PRESETS[preset]; const ctx = { THREE, X, scene, camera, renderer, pmrem, opts, W, H: Hh, ticks: [], anchors: opts.anchors || [] };
    const ready = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('400 200px Marcellus'), document.fonts.ready]).catch(() => 0) : Promise.resolve();
    ready.then(() => {
      P(ctx);
      const clock = new THREE.Clock(); let frames = 0, slow = false; const mouse = { x: 0, y: 0 };
      addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
      const v = new THREE.Vector3();
      const placeAnchors = () => ctx.anchors.forEach(a => { if (!a.el) return; v.set(...(a.obj ? a.obj.getWorldPosition(new THREE.Vector3()).toArray() : a.pos)); v.project(camera); a.el.style.left = ((v.x * 0.5 + 0.5) * W).toFixed(1) + 'px'; a.el.style.top = ((-v.y * 0.5 + 0.5) * Hh).toFixed(1) + 'px'; a.el.style.opacity = v.z < 1 ? '' : 0; });
      const frame = () => {
        const t = clock.getElapsedTime() + (opts.t0 || 0);
        ctx.ticks.forEach(f => f(t, mouse));
        const t0 = performance.now(); renderer.render(scene, camera); placeAnchors();
        frames++; if (frames === 1) { window.__p3d--; if (window.__p3d <= 0) requestAnimationFrame(() => { window.__ready3d = true; }); }
        if (frames < 4 && performance.now() - t0 > 250) slow = true;
        if (!slow || frames < 3) requestAnimationFrame(frame);
      };
      frame();
    });
    return ctx;
  };

  function sunVec(THREE, azDeg, elDeg) { const a = azDeg * Math.PI / 180, e = elDeg * Math.PI / 180; return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); }
  function envFromSky(ctx, sky, extra) { const { THREE, pmrem } = ctx; const s = new THREE.Scene(); s.add(sky.clone()); if (extra) s.add(extra); const rt = pmrem.fromScene(s, 0.02); return rt.texture; }
  function makeHeight(dome, flatR, cam) {
    const h0 = dome ? duneRaw(dome.x, dome.z) : 0;
    const segD = (x, z) => { const ax = cam.x, az = cam.z, bx = dome.x, bz = dome.z; const dx = bx - ax, dz = bz - az; let t = ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz); t = Math.max(0, Math.min(1, t)); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
    return (x, z) => {
      let h = duneRaw(x, z);
      if (cam && dome) { const k = ss(cam.w || 10, (cam.w || 10) * 3.2, segD(x, z)); const lo = Math.min(h0, cam.y) - 1; h = lo + (h - lo) * (0.12 + 0.88 * k); }
      if (dome) { const d = Math.hypot(x - dome.x, z - dome.z); const k = ss(flatR, flatR * 2.4, d); h = h0 + (h - h0) * k; }
      return h;
    };
  }
  function sunLight(ctx, dir, color, intensity, target, span) {
    const { THREE, scene } = ctx; const L = new THREE.DirectionalLight(color, intensity); L.position.copy(target).add(dir.clone().multiplyScalar(220)); L.target.position.copy(target);
    L.castShadow = true; L.shadow.mapSize.set(2048, 2048); const c = L.shadow.camera; c.left = c.bottom = -span; c.right = c.top = span; c.near = 20; c.far = 520; L.shadow.bias = -0.0006; L.shadow.normalBias = 0.05; L.shadow.radius = 4;
    scene.add(L, L.target); return L;
  }
  function drift(ctx, base, look, amp) {
    const { camera } = ctx; camera.position.copy(base); camera.lookAt(look);
    ctx.ticks.push((t, m) => { camera.position.set(base.x + Math.sin(t * 0.12) * amp + m.x * amp * 1.6, base.y + Math.sin(t * 0.17) * amp * 0.3 - m.y * amp * 0.6, base.z); camera.lookAt(look); });
  }

  const PRESETS = {
    /* golden hour hero */
    day(ctx) {
      const { THREE, X, scene, camera, renderer, opts } = ctx;
      const dome = new THREE.Vector3(9, 0, 4); const H = makeHeight(dome, 9, { x: -6, z: 46, w: 9, y: duneRaw(-6, 46) }); dome.y = H(dome.x, dome.z);
      const sun = sunVec(THREE, -6, 2.6); const sunL = sunVec(THREE, -62, 8);
      const sky = skyMesh(THREE, { top: '#3e4f8c', mid: '#e39a6a', horizon: '#ffc785', haze: '#ffd497', sunDir: sun, sunColor: '#ffa04f', glow: 1.5, sunSize: 0.0012, ground: '#c98a4b' });
      scene.add(sky); scene.environment = envFromSky(ctx, sky); scene.fog = new THREE.Fog('#f4b57c', 80, 470);
      renderer.toneMappingExposure = 1.0;
      const terrain = dunes(THREE, { height: H, size: 900, seg: 340, lo: '#8a4824', mid: '#d08f4e', hi: '#f6c182' }); scene.add(terrain);
      const title = textPlane(THREE, opts.title || 'SAHRA', { w: opts.titleW || 196, ls: 90, grad: [[0, '#fffaf2'], [0.7, '#ffe6c4'], [1, '#ffd29a']], opacity: 0.96 }); title.position.set(opts.titleX ?? 0, opts.titleY ?? 33, -150); scene.add(title);
      const d = domeSuite(THREE, X, { R: 5, glow: false }); d.position.copy(dome); d.rotation.y = 2.3; scene.add(d);
      sunLight(ctx, sunL, '#ffc185', 4.6, dome, 90);
      scene.add(new THREE.HemisphereLight('#c9b6e0', '#7a4325', 0.25));
      const ws = windSand(THREE, { w: 90, z0: 18, d: 40, h: H, n: 2600, color: '#ffe2b5', size: 0.07, opacity: 0.6 }); scene.add(ws); ctx.ticks.push(t => ws.userData.tick(t));
      drift(ctx, new THREE.Vector3(-6, Math.max(dome.y, H(-6, 44)) + 8.5, 44), new THREE.Vector3(2, dome.y + 6.5, -4), 0.8);
      ctx.anchors.forEach(a => { if (a.dome) a.pos = [dome.x + a.dome[0], dome.y + a.dome[1], dome.z + a.dome[2]]; });
    },
    /* starlit night */
    night(ctx) {
      const { THREE, X, scene, camera, renderer, opts } = ctx;
      const dome = new THREE.Vector3(opts.domeX ?? -10, 0, opts.domeZ ?? 2); const H = makeHeight(dome, 9, { x: opts.camX ?? 2, z: opts.camZ ?? 46, w: 9, y: duneRaw(opts.camX ?? 2, opts.camZ ?? 46) }); dome.y = H(dome.x, dome.z);
      const moon = sunVec(THREE, 40, 24);
      const sky = skyMesh(THREE, { top: '#04061a', mid: '#0e1236', horizon: '#2a2550', haze: '#3a2a4f', sunDir: moon, sunColor: '#8fa6ff', glow: 0.25, sunSize: 0.0, ground: '#0e1230' });
      scene.add(sky); scene.environment = envFromSky(ctx, sky); scene.fog = new THREE.Fog('#1b1a3e', 60, 420);
      renderer.toneMappingExposure = 1.05;
      const sf = starfield(THREE, { bandC: new THREE.Vector3(0.1, 0.35, -1), bandD: new THREE.Vector3(1, 1.1, 0.25), bright: 1.2 }); scene.add(sf); ctx.ticks.push(t => sf.userData.mat.uniforms.time.value = t);
      const terrain = dunes(THREE, { height: H, size: 900, seg: 320, lo: '#2a2440', mid: '#55476a', hi: '#8a7393', env: 0.9 }); scene.add(terrain);
      const d = domeSuite(THREE, X, { R: 5, night: true }); d.position.copy(dome); d.rotation.y = 0.5; scene.add(d);
      sunLight(ctx, moon, '#9fb2ff', 0.55, dome, 90);
      scene.add(new THREE.HemisphereLight('#2b3a7a', '#120f22', 0.35));
      // warm light pool on the sand + lantern path
      const spill = new THREE.PointLight('#ff9d55', 160, 40, 1.4); spill.position.set(dome.x, dome.y + 3, dome.z + 6); scene.add(spill);
      const gt = glowTex(THREE, [[0, 'rgba(255,190,120,1)'], [0.2, 'rgba(255,160,90,.5)'], [1, 'rgba(255,120,60,0)']]);
      for (let i = 0; i < 9; i++) {
        const t = i / 8, x = dome.x + 8 + t * 22 + Math.sin(t * 5) * 3, z = dome.z + 8 + t * 26; const y = H(x, z);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.9, 8), new THREE.MeshStandardMaterial({ color: '#2a2030' })); post.position.set(x, y + 0.45, z); scene.add(post);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffd09a' })); bulb.position.set(x, y + 1.0, z); scene.add(bulb);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 })); s.scale.set(2.6, 2.6, 1); s.position.set(x, y + 1.0, z); scene.add(s);
      }
      const ws = windSand(THREE, { w: 90, z0: 16, d: 40, h: H, n: 1400, color: '#c9c3ff', size: 0.06, opacity: 0.35 }); scene.add(ws); ctx.ticks.push(t => ws.userData.tick(t));
      drift(ctx, new THREE.Vector3(opts.camX ?? 2, Math.max(dome.y, H(opts.camX ?? 2, opts.camZ ?? 46)) + (opts.camH ?? 7), opts.camZ ?? 46), new THREE.Vector3(opts.lookX ?? -4, dome.y + (opts.lookY ?? 13), opts.lookZ ?? -10), 0.7);
      ctx.anchors.forEach(a => { if (a.dome) a.pos = [dome.x + a.dome[0], dome.y + a.dome[1], dome.z + a.dome[2]]; });
    },
    /* violet dusk (booking background) */
    dusk(ctx) {
      const { THREE, X, scene, renderer, opts } = ctx;
      const dome = new THREE.Vector3(opts.domeX ?? 48, 0, opts.domeZ ?? -60); const H = makeHeight(dome, 9, { x: 0, z: 40, w: 14, y: duneRaw(0, 40) }); dome.y = H(dome.x, dome.z);
      const sun = sunVec(THREE, -18, -1.2);
      const sky = skyMesh(THREE, { top: '#120f30', mid: '#3a2a4f', horizon: '#f08a55', haze: '#e0708a', sunDir: sun, sunColor: '#ff7a3c', glow: 1.6, sunSize: 0.0, ground: '#3a2a4f' });
      scene.add(sky); scene.environment = envFromSky(ctx, sky); scene.fog = new THREE.Fog('#a8566a', 80, 520);
      renderer.toneMappingExposure = 1.0;
      const sf = starfield(THREE, { count: 2500, mw: 0, bright: 0.55 }); scene.add(sf); ctx.ticks.push(t => sf.userData.mat.uniforms.time.value = t);
      const terrain = dunes(THREE, { height: H, size: 1000, seg: 320, lo: '#3b2440', mid: '#7a4a52', hi: '#c27a5c', env: 1.0 }); scene.add(terrain);
      const d = domeSuite(THREE, X, { R: 5, night: true }); d.position.copy(dome); scene.add(d);
      const L = sunLight(ctx, sunVec(THREE, -18, 4), '#ff9a6a', 1.4, new THREE.Vector3(0, 0, -40), 140);
      scene.add(new THREE.HemisphereLight('#6a4a9a', '#1a1030', 0.5));
      drift(ctx, new THREE.Vector3(0, H(0, 40) + 14, 40), new THREE.Vector3(10, H(0, 40) + 10, -80), 0.9);
      ctx.anchors.forEach(a => { if (a.dome) a.pos = [dome.x + a.dome[0], dome.y + a.dome[1], dome.z + a.dome[2]]; });
    },
    /* resort site map */
    map(ctx) {
      const { THREE, X, scene, camera, renderer, opts } = ctx;
      const H = (x, z) => duneRaw(x * 1.6 + 40, z * 1.6 - 30) * 0.55;
      const sun = sunVec(THREE, -60, 14);
      scene.fog = new THREE.Fog(opts.fog || '#120f2c', 220, 470); renderer.toneMappingExposure = 1.05;
      const sky = skyMesh(THREE, { top: '#2a2350', mid: '#6a4a6a', horizon: '#e8a070', sunDir: sun, sunColor: '#ffb070' }); scene.environment = envFromSky(ctx, sky);
      const terrain = dunes(THREE, { height: H, size: 360, seg: 260, lo: '#6e3b22', mid: '#c98a4b', hi: '#f2c088', contours: true, rep: 30, ns: 0.6, env: 0.7 }); scene.add(terrain);
      sunLight(ctx, sun, '#ffcf9a', 3.0, new THREE.Vector3(), 170);
      scene.add(new THREE.HemisphereLight('#9a86d0', '#3a2030', 0.55));
      // oasis hub
      const hub = new THREE.Vector3(-8, 0, 10); hub.y = H(hub.x, hub.z);
      const water = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshPhysicalMaterial({ color: '#1e8fa6', emissive: '#0f6a80', emissiveIntensity: 0.6, roughness: 0.05, clearcoat: 1 })); water.rotation.x = -Math.PI / 2; water.scale.set(1.5, 1, 1); water.position.set(hub.x + 10, hub.y + 0.6, hub.z + 4); scene.add(water);
      const lodge = domeSuite(THREE, X, { R: 4.2, glow: true }); lodge.position.copy(hub); lodge.position.y += 0.4; scene.add(lodge);
      { const ah = ctx.anchors.find(a => a.id === 'hub'); if (ah) ah.pos = [hub.x, hub.y + 10, hub.z]; }
      // palms (stylised)
      const palmM = new THREE.MeshStandardMaterial({ color: '#3f5a3a', roughness: 0.8 }), trunkM = new THREE.MeshStandardMaterial({ color: '#6b4a32' });
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = 15 + (i % 3) * 2.5; const x = hub.x + 10 + Math.cos(a) * r * 1.4, z = hub.z + 4 + Math.sin(a) * r; const y = H(x, z); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 4.5, 6), trunkM); tr.position.set(x, y + 2.2, z); tr.castShadow = true; scene.add(tr); const cr = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.2, 7), palmM); cr.position.set(x, y + 4.6, z); cr.castShadow = true; scene.add(cr); }
      // suites
      const cat = { dune: '#ffd29a', oasis: '#5fe0f0', crest: '#d9c6ff', pav: '#ffe7b0' };
      const pins = opts.pins || []; const gt = glowTex(THREE);
      const domeG = new THREE.SphereGeometry(1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const pathM = new THREE.LineDashedMaterial({ color: '#ffe3b8', dashSize: 1.6, gapSize: 1.4, transparent: true, opacity: 0.75 });
      pins.forEach((p, i) => {
        if (p.c === 'crest') { let best = -1e9, bx = p.x, bz = p.z; for (let dx = -14; dx <= 14; dx += 2) for (let dz = -14; dz <= 14; dz += 2) { const hh = H(p.x + dx, p.z + dz); if (hh > best) { best = hh; bx = p.x + dx; bz = p.z + dz; } } p.x = bx; p.z = bz; }
        const x = p.x, z = p.z, y = H(x, z); const c = cat[p.c];
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 0.8, 32), new THREE.MeshStandardMaterial({ color: '#e2c09a', roughness: 0.8 })); plinth.position.set(x, y + 0.1, z); plinth.castShadow = plinth.receiveShadow = true; scene.add(plinth);
        const dm = new THREE.Mesh(domeG, new THREE.MeshPhysicalMaterial({ color: c, emissive: c, emissiveIntensity: p.hot ? 1.4 : 0.55, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.92 })); dm.position.set(x, y + 0.5, z); dm.scale.setScalar(p.c === 'pav' ? 1.6 : 1); dm.castShadow = true; scene.add(dm);
        const beamH = p.hot ? 16 : 7; const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, beamH, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: p.hot ? 0.95 : 0.55 })); beam.position.set(x, y + 2 + beamH / 2, z); scene.add(beam);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: c, blending: THREE.AdditiveBlending, depthWrite: false, opacity: p.hot ? 1 : 0.6 })); s.scale.setScalar(p.hot ? 9 : 5); s.position.set(x, y + 1.5, z); scene.add(s);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(p.hot ? 0.45 : 0.28, 16, 8), new THREE.MeshBasicMaterial({ color: c })); tip.position.set(x, y + 2 + beamH, z); scene.add(tip);
        if (p.hot) { const rg = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.5, 64), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); rg.rotation.x = -Math.PI / 2; rg.position.set(x, y + 0.6, z); scene.add(rg); ctx.ticks.push(t => { const k = 1 + ((t * 0.6) % 1) * 1.4; rg.scale.setScalar(k); rg.material.opacity = 0.85 * (1 - ((t * 0.6) % 1)); }); }
        // path back to the hub
        const pts = []; for (let k = 0; k <= 40; k++) { const tt = k / 40; const px = hub.x + (x - hub.x) * tt + Math.sin(tt * Math.PI) * (z - hub.z) * 0.12, pz = hub.z + (z - hub.z) * tt - Math.sin(tt * Math.PI) * (x - hub.x) * 0.12; pts.push(new THREE.Vector3(px, H(px, pz) + 0.35, pz)); }
        const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), pathM); ln.computeLineDistances(); scene.add(ln);
        const a = ctx.anchors.find(a => a.id === p.id); if (a) a.pos = [x, y + 2 + beamH, z];
      });
      const base = new THREE.Vector3(0, 175, 175); const look = new THREE.Vector3(0, 0, 8);
      camera.position.copy(base); camera.lookAt(look);
      ctx.ticks.push((t, m) => { const a = Math.sin(t * 0.08) * 0.08 + m.x * 0.1; camera.position.set(Math.sin(a) * 247 * 0.71, 175 - m.y * 6, Math.cos(a) * 175); camera.lookAt(look); });
    },
    /* floating exploded dome — suite detail */
    float(ctx) {
      const { THREE, X, scene, camera, renderer, pmrem, opts } = ctx;
      scene.environment = pmrem.fromScene(new X.RoomEnvironment(renderer), 0.04).texture; scene.environmentIntensity = 0.6; renderer.toneMappingExposure = 0.85;
      const d = domeSuite(THREE, X, { R: 5, night: !!opts.night, glow: true }); const P = d.userData.parts; scene.add(d); P.light.intensity = 70; P.light.distance = 9; d.traverse(o => { if (o.isMesh && o.material && o.material.color && o.material.color.getHexString() === 'd8b48c') { o.material = o.material.clone(); o.material.color.set('#9c7552'); } });
      P.shell.position.y = 3.6; P.base.position.y = -2.4; P.base.scale.set(0.92, 0.6, 0.92); P.deck.position.set(1.2, -2.4, 0.6);
      d.rotation.x = 0.22; d.position.y = 0.4;
      const key = new THREE.DirectionalLight('#ffd0a0', 2.6); key.position.set(-14, 20, 14); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); const c = key.shadow.camera; c.left = c.bottom = -16; c.right = c.top = 16; scene.add(key);
      const rim = new THREE.DirectionalLight('#9a7cff', 2.2); rim.position.set(16, 8, -14); scene.add(rim);
      const fill = new THREE.PointLight('#ff9a5a', 25, 40, 1.6); fill.position.set(10, -6, 10); scene.add(fill);
      // explode guides
      const gm = new THREE.LineDashedMaterial({ color: '#f3d2a5', dashSize: 0.35, gapSize: 0.3, transparent: true, opacity: 0.6 });
      [[-5, 0, 0], [5, 0, 0], [0, 0, -5], [0, 0, 5]].forEach(p => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p[0], -2.4, p[2]), new THREE.Vector3(p[0], 4.2, p[2])]), gm); l.computeLineDistances(); d.add(l); });
      // contact shadow
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), new THREE.MeshBasicMaterial({ map: glowTex(THREE, [[0, 'rgba(10,6,20,.75)'], [0.45, 'rgba(10,6,20,.3)'], [1, 'rgba(10,6,20,0)']]), transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = -6.2; scene.add(sh);
      // orbiting sand
      const N = 1600, pos = new Float32Array(N * 3), seeds = []; for (let i = 0; i < N; i++) seeds.push([8 + rnd() * 6, rnd() * Math.PI * 2, (rnd() - 0.5) * 2.2, 0.15 + rnd() * 0.25]);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const ring = new THREE.Points(g, new THREE.PointsMaterial({ color: '#f6c890', size: 0.07, transparent: true, opacity: 0.8, depthWrite: false })); ring.rotation.x = 0.35; ring.rotation.z = -0.12; scene.add(ring);
      ctx.ticks.push((t, m) => { for (let i = 0; i < N; i++) { const s = seeds[i]; const a = s[1] + t * s[3]; pos[i * 3] = Math.cos(a) * s[0]; pos[i * 3 + 1] = s[2] + Math.sin(a * 3) * 0.2; pos[i * 3 + 2] = Math.sin(a) * s[0]; } g.attributes.position.needsUpdate = true; d.rotation.y = (opts.rot ?? -0.6) + t * 0.07 + m.x * 0.4; d.position.y = 0.4 + Math.sin(t * 0.9) * 0.25; d.position.x = opts.offX || 0; P.shell.position.y = 3.6 + Math.sin(t * 0.9 + 1) * 0.18; });
      camera.position.set(0, 9, opts.dist || 34); camera.lookAt(0, opts.lookY ?? 0.6, 0);
      ctx.anchors.forEach(a => { if (a.part) a.obj = (() => { const o = new THREE.Object3D(); o.position.set(...a.at); P[a.part].add(o); return o; })(); });
    },
    /* looking up at the milky way */
    sky(ctx) {
      const { THREE, X, scene, camera, renderer, opts } = ctx;
      const H = (x, z) => duneRaw(x + 300, z - 120) * 0.9 - 6;
      const sky = skyMesh(THREE, { top: '#03041a', mid: '#0b0f32', horizon: '#2b2050', haze: '#4a2f5c', sunDir: new THREE.Vector3(0, -1, 0), sunColor: '#000000', glow: 0, sunSize: 0 });
      scene.add(sky); scene.environment = envFromSky(ctx, sky); scene.fog = new THREE.Fog('#1a1438', 40, 380); renderer.toneMappingExposure = 1.1;
      const sf = starfield(THREE, { bandC: new THREE.Vector3(0.1, 0.4, -1), bandD: new THREE.Vector3(1, 0.75, 0.2), count: 12000, mw: 42000, bright: 2.1 }); scene.add(sf); ctx.ticks.push(t => sf.userData.mat.uniforms.time.value = t);
      const terrain = dunes(THREE, { height: H, size: 900, seg: 260, lo: '#120f22', mid: '#2a2440', hi: '#4a3e62', env: 0.6 }); scene.add(terrain);
      sunLight(ctx, sunVec(THREE, 70, 20), '#8fa2ff', 0.4, new THREE.Vector3(0, 0, -60), 120);
      const domeP = new THREE.Vector3(opts.domeX ?? 34, 0, opts.domeZ ?? -120); domeP.y = H(domeP.x, domeP.z); const d = domeSuite(THREE, X, { R: 5, night: true }); d.position.copy(domeP); scene.add(d);
      // constellations
      const toV = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).multiplyScalar(1100); };
      const lm = new THREE.LineBasicMaterial({ color: '#ffd9a8', transparent: true, opacity: 0.55, fog: false });
      const bm = new THREE.PointsMaterial({ color: '#fff6e6', size: 7, sizeAttenuation: false, transparent: true, map: glowTex(THREE), depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      (opts.constellations || []).forEach(cn => {
        const vs = cn.stars.map(s => toV(s[0], s[1])); const seg = []; cn.lines.forEach(([a, b]) => seg.push(vs[a], vs[b]));
        scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg), lm)); scene.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(vs), bm));
        const an = ctx.anchors.find(a => a.id === cn.id); if (an) an.pos = toV(cn.label[0], cn.label[1]).toArray();
      });
      const base = new THREE.Vector3(0, H(0, 30) + 5, 30); const look = new THREE.Vector3(10, H(0, 30) + 5 + 21, -80);
      drift(ctx, base, look, 0.6);
    },
  };
})();
