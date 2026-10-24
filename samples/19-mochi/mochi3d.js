/* MOCHI MONSTERS — procedural 3D toy kit.
   Classic script (file:// safe). From an inline module:
   const K = Mochi3D(THREE, { RoomEnvironment, RoundedBoxGeometry }); */
window.Mochi3D = function (THREE, A) {
  const C = { peach: '#ffb59a', mint: '#9fe3c6', lav: '#c7b6ff', butter: '#ffe58a', sky: '#9cd2ff', cream: '#fff4e6', pink: '#ff9fbf', berry: '#ff6f91', ink: '#2b2240', coral: '#ff8a6b', lilac: '#9d88ff', teal: '#4fc9a6', white: '#ffffff', leaf: '#6fd39a', blush: '#ff7d9a' };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  /* ---------- stage ---------- */
  function stage(canvas, w, h, o = {}) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!o.preserve });
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposure ?? 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new A.RoomEnvironment(), 0.04).texture;
    const camera = new THREE.PerspectiveCamera(o.fov ?? 30, w / h, 0.1, 300);
    scene.add(new THREE.HemisphereLight(0xfff3e6, 0xe2d4ff, o.hemi ?? 0.7));
    const key = new THREE.DirectionalLight(0xfff0dd, o.key ?? 1.7); key.position.set(5, 9, 7); scene.add(key);
    const rim = new THREE.DirectionalLight(0xc8dcff, o.rim ?? 1.4); rim.position.set(-7, 5, -6); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffd7e4, 0.5); fill.position.set(-6, 1, 6); scene.add(fill);
    return { renderer, scene, camera, key, rim, w, h };
  }

  /* ---------- textures ---------- */
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  let shadowTex;
  function shadow(r = 1.2, op = 0.32, color = '#4a3a6a') {
    shadowTex ??= canvasTex(256, 256, (g, w) => {
      const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), new THREE.MeshBasicMaterial({ map: shadowTex, color, transparent: true, opacity: op, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.004; m.renderOrder = -1; m.userData.op = op; return m;
  }

  /* ---------- materials ---------- */
  const mc = {};
  function mat(color, kind = 'vinyl') {
    const k = color + '|' + kind; if (mc[k]) return mc[k];
    const c = new THREE.Color(color); let m;
    if (kind === 'flock') m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.92, sheen: 1, sheenRoughness: 0.32, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.6), envMapIntensity: 0.55 });
    else if (kind === 'pearl') m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.18, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [180, 620] });
    else if (kind === 'gold') m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.26, metalness: 0.85, clearcoat: 0.6, envMapIntensity: 1.6 });
    else if (kind === 'glass') m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.04, transmission: 1, thickness: 0.4, ior: 1.45, transparent: true, envMapIntensity: 1.2, specularIntensity: 1 });
    else if (kind === 'eye') m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02 });
    else if (kind === 'matte') m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 });
    else if (kind === 'glow') m = new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
    else if (kind === 'sil') m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
    else m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.95 });
    return mc[k] = m;
  }

  /* ---------- geometry cache ---------- */
  const gc = {};
  const G = (k, f) => gc[k] ??= f();
  const sph = q => G('s' + q, () => q === 'lo' ? new THREE.SphereGeometry(1, 28, 18) : new THREE.SphereGeometry(1, 48, 32));
  const cap = (r, l, q) => G(`c${r}${l}${q}`, () => new THREE.CapsuleGeometry(r, l, q === 'lo' ? 6 : 10, q === 'lo' ? 16 : 28));
  const arc = (r, t, a = Math.PI) => G(`a${r}${t}${a}`, () => new THREE.TorusGeometry(r, t, 8, 24, a));

  /* ---------- character ---------- */
  // d: {color, accent, kind, type: bunny|cat|bear|devil|alien|sprout|blob, face: happy|wink|sleepy|wow, mouth: smile|o|w|fang, acc: [], q, eyes}
  function character(d) {
    const q = d.q || 'hi', S = sph(q);
    const kind = d.kind || 'vinyl';
    const body = d.sil ? mat('#3a2f55', 'sil') : mat(d.color, kind);
    const acc = d.sil ? body : mat(d.accent || C.cream, d.accentKind || (kind === 'flock' ? 'vinyl' : kind === 'pearl' ? 'vinyl' : 'vinyl'));
    const eyeM = d.sil ? mat('#ffffff', 'glow') : mat(C.ink, 'eye'), whiteM = mat('#ffffff', 'matte');
    const root = new THREE.Group(), bob = new THREE.Group(); root.add(bob);
    const add = (geo, m, p, s, r, parent = bob) => { const x = new THREE.Mesh(geo, m); x.position.set(...p); if (s) (typeof s === 'number' ? x.scale.setScalar(s) : x.scale.set(...s)); if (r) x.rotation.set(...r); parent.add(x); return x; };
    // legs + body
    add(S, body, [-.25, .12, .07], [.25, .16, .31]); add(S, body, [.25, .12, .07], [.25, .16, .31]);
    add(cap(.45, .3, q), body, [0, .68, 0]);
    if (!d.noBelly) add(S, acc, [0, .6, .3], [.29, .3, .17]);
    add(cap(.125, .26, q), body, [-.5, .74, .06], null, [0, 0, .8]);
    add(cap(.125, .26, q), body, [.5, .74, .06], null, [0, 0, -.8]);
    if (d.type === 'bunny' || d.type === 'bear') add(S, d.type === 'bunny' ? mat(C.white, 'flock') : body, [0, .5, -.44], .17);
    if (d.type === 'devil' || d.type === 'cat') { const tl = add(cap(.07, .5, q), body, [.38, .45, -.4], null, [.5, 0, -.9]); if (d.type === 'devil') add(new THREE.ConeGeometry(.12, .2, 16), acc, [.66, .68, -.58], null, [.5, 0, -.9]); }
    // head
    const H = new THREE.Group(); H.position.set(0, 2.04, 0); bob.add(H);
    const hs = d.hs || (d.type === 'blob' ? [1.24, .86, 1.04] : [1.13, .96, 1]);
    add(S, body, [0, 0, 0], hs, null, H);
    const place = (o, u, out = 0) => {
      u = u.clone().normalize();
      const n = V(u.x / hs[0], u.y / hs[1], u.z / hs[2]).normalize();
      o.position.set(u.x * hs[0], u.y * hs[1], u.z * hs[2]).addScaledVector(n, out);
      o.quaternion.setFromUnitVectors(V(0, 0, 1), n); H.add(o); return o;
    };
    // face
    const es = d.eyes || 1, face = d.face || 'happy';
    const eye = (sx, closed) => {
      const e = new THREE.Group(); place(e, V(sx * .37, -.04, .93), 0);
      if (closed) { const t = new THREE.Mesh(arc(.11 * es, .03), eyeM); t.position.z = .02; e.add(t); }
      else {
        const p = new THREE.Mesh(S, eyeM); p.scale.set(.15 * es, .185 * es, .08); e.add(p);
        if (!d.sil) { const h1 = new THREE.Mesh(S, whiteM); h1.scale.setScalar(.048 * es); h1.position.set(-.05 * es, .075 * es, .07); e.add(h1);
          const h2 = new THREE.Mesh(S, whiteM); h2.scale.setScalar(.022 * es); h2.position.set(.05 * es, -.06 * es, .075); e.add(h2); }
      }
    };
    eye(-1, face === 'sleepy'); eye(1, face === 'sleepy' || face === 'wink');
    if (!d.sil) {
      const bm = new THREE.MeshBasicMaterial({ color: d.blush || C.blush, transparent: true, opacity: .45, depthWrite: false });
      const bg = G('blush', () => new THREE.CircleGeometry(.17, 28));
      [-1, 1].forEach(s => place(new THREE.Mesh(bg, bm), V(s * .64, -.28, .73), .025));
      const mouth = d.mouth || 'smile';
      if (mouth === 'o') place(new THREE.Mesh(arc(.055, .025, Math.PI * 2), eyeM), V(0, -.3, .95), .01);
      else if (mouth === 'w') { [-1, 1].forEach(s => { const m = new THREE.Mesh(arc(.055, .022), eyeM); const g = new THREE.Group(); place(g, V(s * .06, -.27, .96), .01); m.rotation.z = Math.PI; m.position.x = s * .05; g.add(m); }); }
      else { const g = new THREE.Group(); place(g, V(0, -.27, .96), .01); const m = new THREE.Mesh(arc(.09, .026), eyeM); m.rotation.z = Math.PI; g.add(m);
        if (mouth === 'fang') { const f = new THREE.Mesh(new THREE.ConeGeometry(.035, .08, 10), whiteM); f.rotation.z = Math.PI; f.position.set(.05, -.1, .01); g.add(f); } }
    }
    // ears / tops
    const t = d.type;
    if (t === 'bunny') [-1, 1].forEach(s => {
      add(cap(.22, .85, q), body, [s * .43, 1.22, -.05], null, [0, 0, -s * .2], H);
      add(cap(.11, .62, q), acc, [s * .45, 1.24, .12], [1, 1, .5], [0, 0, -s * .2], H);
    });
    if (t === 'cat') [-1, 1].forEach(s => {
      add(G('cone1', () => new THREE.ConeGeometry(.36, .64, 32)), body, [s * .62, .98, 0], null, [0, 0, -s * .42], H);
      add(G('cone2', () => new THREE.ConeGeometry(.2, .38, 24)), acc, [s * .62, .94, .15], [1, 1, .45], [0, 0, -s * .42], H);
    });
    if (t === 'bear') [-1, 1].forEach(s => {
      add(S, body, [s * .8, .68, -.05], .34, null, H);
      add(S, acc, [s * .8, .68, .2], [.19, .19, .1], null, H);
    });
    if (t === 'devil') [-1, 1].forEach(s => {
      add(G('horn', () => new THREE.ConeGeometry(.17, .58, 28)), mat(d.horn || C.butter, 'vinyl'), [s * .5, .98, 0], null, [0, 0, -s * .32], H);
    });
    if (t === 'alien') [-1, 1].forEach(s => {
      const a = s * -.28, L = .6, bx = s * .32, by = 1.12;
      add(G('ant', () => new THREE.CylinderGeometry(.035, .045, .6, 12)), body, [bx, by, 0], null, [0, 0, a], H);
      add(S, mat(d.accent || C.butter, 'glow' === d.antKind ? 'glow' : 'vinyl'), [bx - Math.sin(a) * L / 2, by + Math.cos(a) * L / 2, 0], .14, null, H);
    });
    if (t === 'sprout') {
      add(G('stem', () => new THREE.CylinderGeometry(.035, .05, .42, 12)), mat(C.leaf, 'vinyl'), [0, 1.0, 0], null, null, H);
      [-1, 1].forEach(s => add(S, mat(C.leaf, 'vinyl'), [s * .22, 1.24, 0], [.27, .085, .14], [0, 0, s * .45], H));
    }
    if (t === 'blob') add(G('swirl', () => new THREE.TorusGeometry(.16, .07, 12, 32)), acc, [0, .9, 0], null, [Math.PI / 2.4, 0, 0], H);
    // accessories
    const accs = {};
    (d.acc || []).forEach(a => { const g = accessory(a, q, d); H.add(g); accs[a] = g; });
    root.userData = { bob, head: H, def: d, accs, place, hs };
    if (d.shadow !== false) { const sh = shadow(1.35, d.shadowOp ?? .3); root.add(sh); root.userData.shadow = sh; }
    if (d.scale) root.scale.setScalar(d.scale);
    return root;
  }

  function accessory(a, q, d = {}) {
    const S = sph(q), g = new THREE.Group();
    const m = (c, k) => mat(c, k);
    if (a === 'party') {
      const tex = G('partytex', () => canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); const cs = ['#ff9fbf', '#9cd2ff', '#ffe58a', '#9fe3c6']; for (let i = 0; i < 8; i++) { x.fillStyle = cs[i % 4]; x.fillRect(i * 32, 0, 16, h); } }));
      const cm = G('partym', () => new THREE.MeshPhysicalMaterial({ map: tex, roughness: .35, clearcoat: 1 }));
      const c = new THREE.Mesh(G('pcone', () => new THREE.ConeGeometry(.34, .82, 40, 1, true)), cm); c.material.side = THREE.DoubleSide; c.position.y = .41; g.add(c);
      const p = new THREE.Mesh(S, m(C.berry, 'flock')); p.scale.setScalar(.12); p.position.y = .84; g.add(p);
      g.position.set(.32, .9, .05); g.rotation.z = -.38;
    }
    if (a === 'crown') {
      const gold = m('#ffd47a', 'gold');
      const ring = new THREE.Mesh(G('cring', () => new THREE.CylinderGeometry(.42, .38, .2, 40, 1, true)), gold); ring.material.side = THREE.DoubleSide; g.add(ring);
      for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2; const sp = new THREE.Mesh(G('cspike', () => new THREE.ConeGeometry(.08, .24, 12)), gold); sp.position.set(Math.cos(an) * .4, .2, Math.sin(an) * .4); g.add(sp);
        const gem = new THREE.Mesh(S, m([C.berry, C.sky, C.mint][i % 3], 'pearl')); gem.scale.setScalar(.055); gem.position.set(Math.cos(an) * .41, .34, Math.sin(an) * .41); g.add(gem); }
      g.position.set(-.12, .98, 0); g.rotation.z = .16;
    }
    if (a === 'phones') {
      const band = new THREE.Mesh(G('band', () => new THREE.TorusGeometry(1.2, .075, 14, 56, Math.PI)), m(d.phoneBand || C.ink, 'vinyl')); band.position.y = .02; g.add(band);
      [-1, 1].forEach(s => { const cup = new THREE.Mesh(G('cup', () => new THREE.CylinderGeometry(.34, .34, .26, 36)), m(d.phoneCup || C.mint, 'vinyl')); cup.rotation.z = Math.PI / 2; cup.position.set(s * 1.18, 0, 0); g.add(cup);
        const pad = new THREE.Mesh(G('pad', () => new THREE.TorusGeometry(.24, .07, 10, 28)), m(C.cream, 'flock')); pad.rotation.y = Math.PI / 2; pad.position.set(s * 1.33, 0, 0); g.add(pad); });
    }
    if (a === 'scarf') {
      const sc = m(d.scarf || C.berry, 'flock');
      const r = new THREE.Mesh(G('scarf', () => new THREE.TorusGeometry(.46, .14, 14, 40)), sc); r.rotation.x = Math.PI / 2; r.position.y = -.78; g.add(r);
      const tl = new THREE.Mesh(cap(.12, .36, q), sc); tl.position.set(.25, -1.08, .4); tl.rotation.set(.3, 0, .35); g.add(tl);
    }
    if (a === 'glasses') {
      const gm = m(d.glass || C.ink, 'vinyl');
      [-1, 1].forEach(s => { const r = new THREE.Mesh(G('lens', () => new THREE.TorusGeometry(.21, .035, 10, 36)), gm); r.position.set(s * .41, -.04, .97); r.rotation.y = s * .32; g.add(r); });
      const br = new THREE.Mesh(G('bridge', () => new THREE.CylinderGeometry(.025, .025, .22, 8)), gm); br.rotation.z = Math.PI / 2; br.position.set(0, .0, 1.04); g.add(br);
    }
    if (a === 'flower') {
      const f = new THREE.Group();
      for (let i = 0; i < 5; i++) { const an = i / 5 * Math.PI * 2; const p = new THREE.Mesh(S, m(d.petal || C.pink, 'vinyl')); p.scale.set(.13, .13, .06); p.position.set(Math.cos(an) * .14, Math.sin(an) * .14, 0); f.add(p); }
      const c = new THREE.Mesh(S, m(C.butter, 'vinyl')); c.scale.set(.08, .08, .06); c.position.z = .03; f.add(c);
      const u = V(.6, .62, .5).normalize(); f.position.set(u.x * 1.13, u.y * .96, u.z).multiplyScalar(1.02); f.lookAt(f.position.clone().multiplyScalar(2)); g.add(f);
    }
    if (a === 'halo') {
      const h = new THREE.Mesh(G('halo', () => new THREE.TorusGeometry(.5, .05, 12, 48)), m('#fff2a8', 'glow')); h.rotation.x = Math.PI / 2.2; h.position.y = 1.45; g.add(h);
    }
    return g;
  }

  /* ---------- motion ---------- */
  function bounce(ch, t, o = {}) {
    const T = o.T || 1.5, amp = o.amp ?? .55, x = (((t / T + (o.ph || 0)) % 1) + 1) % 1;
    const s = Math.sin(Math.PI * x), c = Math.abs(Math.cos(Math.PI * x)), contact = Math.pow(c, 12);
    const sy = 1 - .2 * contact + .08 * c * (1 - contact), sx = 1 / Math.sqrt(sy);
    const u = ch.userData; u.bob.position.y = amp * s; u.bob.scale.set(sx, sy, sx);
    u.head.rotation.z = .07 * Math.sin(2 * Math.PI * x); u.head.position.y = 2.04 + .06 * (1 - sy) * -1;
    if (u.shadow) { const k = 1 - .45 * s; u.shadow.scale.setScalar(k); u.shadow.material.opacity = u.shadow.userData.op * (.45 + .55 * k); }
    return x;
  }
  function float(ch, t, o = {}) {
    const u = ch.userData, ph = o.ph || 0;
    u.bob.position.y = (o.amp ?? .25) * Math.sin(t * 1.3 + ph);
    const sy = 1 + .03 * Math.sin(t * 2.6 + ph); u.bob.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    u.head.rotation.z = .05 * Math.sin(t * 1.1 + ph);
    if (u.shadow) { const k = 1 - .25 * (Math.sin(t * 1.3 + ph) * .5 + .5); u.shadow.scale.setScalar(k); }
  }

  /* ---------- props ---------- */
  function star(color, r = .35, kind = 'vinyl') {
    const geo = G('star' + r, () => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? r * .48 : r; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      const g = new THREE.ExtrudeGeometry(s, { depth: r * .35, bevelEnabled: true, bevelThickness: r * .18, bevelSize: r * .14, bevelSegments: 5 }); g.center(); return g; });
    return new THREE.Mesh(geo, mat(color, kind));
  }
  function drop(color, s = .3) { // little gumdrop / candy
    const m = new THREE.Mesh(sph('lo'), mat(color, 'vinyl')); m.scale.set(s, s * .8, s); return m;
  }
  function confetti(n = 260, area = [10, 8, 6], cols) {
    cols = cols || [C.peach, C.mint, C.lav, C.butter, C.sky, C.pink, C.berry];
    const geo = new THREE.PlaneGeometry(.16, .09);
    const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .45, metalness: .1 });
    const im = new THREE.InstancedMesh(geo, m, n);
    const P = [], col = new THREE.Color(), dm = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      P.push({ x: (Math.random() - .5) * area[0], y: Math.random() * area[1], z: (Math.random() - .5) * area[2], sp: .25 + Math.random() * .5, ax: Math.random() * 6, ay: Math.random() * 6, w: 1 + Math.random() * 3, s: .7 + Math.random() * .9 });
      im.setColorAt(i, col.set(cols[i % cols.length]));
    }
    im.instanceColor.needsUpdate = true;
    im.userData.update = (t, o = {}) => {
      const H = area[1];
      P.forEach((p, i) => {
        let y = p.y - t * p.sp * (o.fall ?? 1); y = ((y % H) + H) % H;
        dm.position.set(p.x + Math.sin(t * p.w + i) * .25, y + (o.y0 || 0), p.z);
        dm.rotation.set(p.ax + t * p.w, p.ay + t * p.w * .7, 0); dm.scale.setScalar(p.s);
        if (o.radial) { const r = Math.hypot(p.x, p.z); dm.position.x *= o.radial(y, r); dm.position.z *= o.radial(y, r); }
        dm.updateMatrix(); im.setMatrixAt(i, dm.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
    };
    im.userData.update(0); return im;
  }
  function boxFace(o) {
    return canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = o.bg; x.fillRect(0, 0, w, h);
      x.save(); x.globalAlpha = .22; x.fillStyle = '#ffffff';
      for (let i = -h; i < w; i += 56) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 26, 0); x.lineTo(i + 26 + h, h); x.lineTo(i + h, h); x.fill(); }
      x.restore();
      if (o.q) {
        x.fillStyle = '#ffffff'; x.beginPath(); x.arc(w / 2, h * .46, 150, 0, 7); x.fill();
        x.fillStyle = o.ink || '#2b2240'; x.font = '700 230px Fredoka, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', w / 2, h * .48);
      }
      x.fillStyle = o.ink || '#2b2240'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      x.font = '700 44px Fredoka, sans-serif'; x.fillText(o.title || 'MOCHI MONSTERS', w / 2, o.q ? h * .86 : h * .55);
      x.font = '700 22px Nunito, sans-serif'; x.fillText(o.sub || 'SUGAR RUSH · SERIES 03', w / 2, o.q ? h * .93 : h * .64);
    });
  }
  function blindBox(o = {}) {
    const W = o.w || 2.2, Hh = o.h || 2.4, bg = o.color || C.lav;
    const side = new THREE.MeshPhysicalMaterial({ map: boxFace({ bg, q: true, sub: o.sub }), roughness: .5, clearcoat: .5, clearcoatRoughness: .3 });
    const side2 = new THREE.MeshPhysicalMaterial({ map: boxFace({ bg: o.color2 || C.peach, q: true, sub: o.sub }), roughness: .5, clearcoat: .5, clearcoatRoughness: .3 });
    const inner = new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 10, w / 2, w / 2, w * .62); g.addColorStop(0, '#4b3b75'); g.addColorStop(.7, '#7d68b8'); g.addColorStop(1, '#efe6ff'); x.fillStyle = g; x.fillRect(0, 0, w, w); }), roughness: .9 });
    const plain = mat(bg, 'vinyl');
    const base = new THREE.Mesh(new A.RoundedBoxGeometry(W, Hh, W, 5, .16), o.open ? [side2, side2, inner, plain, side, side] : [side2, side2, plain, plain, side, side]);
    base.position.y = Hh / 2;
    const lid = new THREE.Mesh(new A.RoundedBoxGeometry(W + .14, .44, W + .14, 4, .14), [plain, plain, new THREE.MeshPhysicalMaterial({ map: boxFace({ bg: o.lidColor || C.butter, title: 'MOCHI', sub: 'OPEN ME GENTLY ♥' }), roughness: .45, clearcoat: .6 }), plain, mat(o.lidColor || C.butter), mat(o.lidColor || C.butter)]);
    lid.position.y = Hh + .2;
    const g = new THREE.Group(); g.add(base, lid); g.userData = { base, lid, H: Hh };
    return g;
  }
  function pedestal(r = 1.6, color = C.cream) {
    const pts = [V(0, 0, 0), V(r - .12, 0, 0), V(r, .04, 0), V(r + .04, .18, 0), V(r, .32, 0), V(r - .1, .36, 0), V(0, .36, 0)].map(p => new THREE.Vector2(p.x, p.y));
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 96), mat(color, 'vinyl')));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r - .35, .025, 8, 120), mat('#f4c45e', 'gold')); ring.rotation.x = Math.PI / 2; ring.position.y = .365; g.add(ring);
    return g;
  }
  function roundBox(w, h, d, r, color, kind) { return new THREE.Mesh(new A.RoundedBoxGeometry(w, h, d, 4, r), typeof color === 'string' ? mat(color, kind) : color); }

  /* ---------- mini renderer for cards: one WebGL context, many 2D canvases ---------- */
  function mini(w = 360, h = 360, o = {}) {
    const cv = document.createElement('canvas');
    const st = stage(cv, w, h, { fov: o.fov ?? 26, exposure: o.exposure ?? 1.0, preserve: true });
    st.camera.position.set(0, o.camY ?? 2.6, o.camZ ?? 11.5); st.camera.lookAt(0, o.lookY ?? 1.75, 0);
    const holder = new THREE.Group(); st.scene.add(holder);
    st.draw = (obj, target, opts = {}) => {
      holder.clear(); holder.add(obj);
      if (cv.width !== target.width || cv.height !== target.height) { st.renderer.setSize(target.width, target.height, false); st.camera.aspect = target.width / target.height; st.camera.updateProjectionMatrix(); }
      if (opts.fov) { st.camera.fov = opts.fov; st.camera.updateProjectionMatrix(); }
      if (opts.cam) { st.camera.position.set(...opts.cam); st.camera.lookAt(...(opts.look || [0, 1.75, 0])); }
      st.renderer.render(st.scene, st.camera);
      const x = target.getContext('2d'); x.clearRect(0, 0, target.width, target.height);
      x.drawImage(cv, 0, 0, target.width, target.height);
    };
    return st;
  }

  /* ---------- the roster ---------- */
  const R = {
    peachy: { name: 'Peachy Bun', type: 'bunny', color: C.peach, accent: '#fff1e6', face: 'happy' },
    minto: { name: 'Minto', type: 'cat', color: C.mint, accent: '#ffffff', kind: 'flock', mouth: 'w' },
    lulu: { name: 'Lulu', type: 'bear', color: C.lav, accent: C.pink, face: 'sleepy', acc: ['flower'] },
    bean: { name: 'Butterbean', type: 'sprout', color: C.butter, accent: '#ffffff', mouth: 'o' },
    skip: { name: 'Skipper', type: 'alien', color: C.sky, accent: C.butter, face: 'wink', acc: ['phones'], phoneCup: C.peach, phoneBand: '#8f7cf0' },
    imp: { name: 'Little Imp', type: 'devil', color: C.pink, accent: C.berry, kind: 'flock', mouth: 'fang' },
    dumpling: { name: 'Dumpling', type: 'blob', color: '#fff3e6', accent: C.pink, kind: 'flock', face: 'sleepy' },
    sorbet: { name: 'Sorbet', type: 'cat', color: C.pink, accent: C.butter, acc: ['party'], face: 'wink' },
    cloud: { name: 'Cloudlet', type: 'bear', color: '#e8f4ff', accent: C.sky, kind: 'flock', mouth: 'o' },
    kiwi: { name: 'Kiwi Kid', type: 'sprout', color: C.mint, accent: C.butter, acc: ['scarf'], scarf: C.peach },
    jelly: { name: 'Jellybean', type: 'alien', color: C.lav, accent: C.mint, kind: 'pearl', mouth: 'w' },
    honey: { name: 'Honey Horn', type: 'devil', color: C.butter, accent: C.peach, horn: C.coral, face: 'happy', mouth: 'fang' },
    glimmer: { name: 'Glimmer Ghost', type: 'bunny', color: '#ddd0ff', accent: '#ffd9ea', kind: 'pearl', acc: ['crown'], face: 'happy' },
  };
  const make = (k, o = {}) => character({ ...R[k], ...o });

  return { R, make, THREE, C, stage, mat, character, accessory, bounce, float, star, drop, confetti, blindBox, pedestal, roundBox, shadow, canvasTex, mini, sph };
};
