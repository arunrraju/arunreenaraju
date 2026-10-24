/* Domaine Vinea — shared Three.js builders (classic script).
   Usage inside an inline module:  const V = window.V3D(THREE);  */
window.V3D = function (THREE) {
  const V = {};
  const TAU = Math.PI * 2;

  V.fonts = () => Promise.all([
    '400 80px "Libre Caslon Display"', 'italic 400 40px "Libre Caslon Text"', '400 40px "Libre Caslon Text"', '600 30px Karla', '400 30px Karla'
  ].map(f => document.fonts.load(f))).catch(() => 0);

  V.renderer = (canvas, w, h) => {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(w, h);
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    return r;
  };

  /* product-photography environment: tall softboxes left/right, warm rim, burgundy floor bounce */
  V.studioEnv = (renderer, opts = {}) => {
    const s = new THREE.Scene();
    s.background = new THREE.Color(opts.bg ?? 0x070405);
    const box = (w, h, x, y, z, c, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
    };
    box(2.2, 14, -7, 1, 4, 0xfff0dc, opts.key ?? 5);
    box(1.2, 14, 7, 1, 3, 0xffcf9a, opts.fill ?? 3);
    box(9, 2.5, 0, 8, 1, 0xffffff, 1.2);
    box(5, 12, -2, 0, -8, 0xd8a560, 2.2);
    box(5, 12, 4, 0, -8, 0x8a2236, 1.6);
    box(14, 3, 0, -5, 5, 0x5a1424, 1.2);
    const pm = new THREE.PMREMGenerator(renderer);
    const t = pm.fromScene(s, 0.035).texture; pm.dispose();
    return t;
  };

  /* soft contact shadow */
  V.shadow = (w, h, strength = 0.8, color = '0,0,0') => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, `rgba(${color},${strength})`); gr.addColorStop(0.35, `rgba(${color},${strength * 0.55})`); gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.002; m.renderOrder = -1;
    return m;
  };

  /* radial glow card (behind objects, also feeds transmission) */
  V.glow = (w, h, stops) => {
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
    const gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, toneMapped: false }));
  };

  /* opaque painted backdrop (so glass refracts it). opts: w,h (units), cx,cy (0..1 glow centre), text, textY, textSize, stops */
  V.backdrop = (o = {}) => {
    const CW = 2048, CH = Math.round(2048 * (o.h || 7) / (o.w || 9.5));
    const c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d');
    g.fillStyle = o.base || '#120a0c'; g.fillRect(0, 0, CW, CH);
    const gr = g.createRadialGradient(CW * (o.cx ?? .5), CH * (o.cy ?? .5), 0, CW * (o.cx ?? .5), CH * (o.cy ?? .5), CW * (o.r ?? .42));
    (o.stops || [[0, '#4a1020'], [0.45, '#22090f'], [1, '#120a0c']]).forEach(([p, col]) => gr.addColorStop(p, col));
    g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
    if (o.text) {
      g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = `400 ${o.textSize || 700}px "Libre Caslon Display"`;
      const ty = CH * (o.textY ?? 0.62);
      const fg = g.createLinearGradient(0, ty - (o.textSize || 700) * 0.7, 0, ty);
      fg.addColorStop(0, 'rgba(184,149,90,.22)'); fg.addColorStop(1, 'rgba(184,149,90,0)');
      g.fillStyle = fg; g.fillText(o.text, CW * (o.textX ?? .5), ty);
      g.lineWidth = 2.4; g.strokeStyle = 'rgba(220,192,138,.42)'; g.strokeText(o.text, CW * (o.textX ?? .5), ty);
    }
    if (o.draw) o.draw(g, CW, CH);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(o.w || 9.5, o.h || 7), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
  };

  /* ---------- engraved crest (shared by labels / case) ---------- */
  V.crest = (g, x, y, s, gold, ink) => {
    g.save(); g.lineJoin = 'round';
    // laurel / vine leaves
    g.fillStyle = gold;
    for (const side of [-1, 1]) for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.62 + i * 0.075); const R = s * 1.45;
      const px = x + side * Math.cos(a) * -R, py = y + s * 0.15 + Math.sin(a) * R * 0.95 - R * 0.55;
      g.save(); g.translate(px, py); g.rotate(side * (a - Math.PI * 0.4)); g.beginPath(); g.ellipse(0, 0, s * 0.09, s * 0.22, 0, 0, TAU); g.fill(); g.restore();
    }
    // shield
    g.beginPath(); g.moveTo(x - s * 0.8, y - s * 0.75); g.lineTo(x + s * 0.8, y - s * 0.75); g.lineTo(x + s * 0.8, y + s * 0.1);
    g.quadraticCurveTo(x + s * 0.8, y + s * 0.85, x, y + s * 1.15); g.quadraticCurveTo(x - s * 0.8, y + s * 0.85, x - s * 0.8, y + s * 0.1); g.closePath();
    g.fillStyle = ink; g.fill(); g.lineWidth = s * 0.06; g.strokeStyle = gold; g.stroke();
    g.beginPath(); g.moveTo(x - s * 0.66, y - s * 0.62); g.lineTo(x + s * 0.66, y - s * 0.62); g.lineTo(x + s * 0.66, y + s * 0.08);
    g.quadraticCurveTo(x + s * 0.66, y + s * 0.74, x, y + s * 0.99); g.quadraticCurveTo(x - s * 0.66, y + s * 0.74, x - s * 0.66, y + s * 0.08); g.closePath();
    g.lineWidth = s * 0.02; g.stroke();
    // grape cluster
    g.fillStyle = gold; const rr = s * 0.1;
    [[0, 0], [-2, -1], [2, -1], [-1, -1], [1, -1], [-1.5, 0], [1.5, 0]].length;
    const rows = [[-1.5, -0.5, 0.5, 1.5], [-1, 0, 1], [-0.5, 0.5], [0]];
    rows.forEach((row, ri) => row.forEach(cx => { g.beginPath(); g.arc(x + cx * rr * 2.05, y - s * 0.12 + ri * rr * 1.8, rr, 0, TAU); g.fill(); }));
    g.lineWidth = s * 0.035; g.strokeStyle = gold; g.beginPath(); g.moveTo(x, y - s * 0.24); g.quadraticCurveTo(x + s * 0.05, y - s * 0.42, x + s * 0.2, y - s * 0.5); g.stroke();
    g.beginPath(); g.ellipse(x + s * 0.3, y - s * 0.4, s * 0.16, s * 0.08, -0.5, 0, TAU); g.fill();
    // crown dots
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(x + i * s * 0.22, y - s * 0.95 - Math.abs(i === 0 ? s * 0.12 : 0), s * 0.06, 0, TAU); g.fill(); }
    g.restore();
  };

  /* ---------- label texture ---------- */
  V.label = (o = {}) => {
    const W = 1536, H = 1024;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const bg = o.bg || '#efe4d0', ink = o.ink || '#2a1414', acc = o.accent || '#9a7741';
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 14000; i++) { g.fillStyle = o.dark ? `rgba(255,240,210,${rnd() * 0.05})` : `rgba(90,60,30,${rnd() * 0.07})`; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2); }
    for (let i = 0; i < 60; i++) { g.strokeStyle = o.dark ? 'rgba(255,255,255,.025)' : 'rgba(110,80,40,.05)'; g.lineWidth = 1; g.beginPath(); const yy = rnd() * H; g.moveTo(0, yy); g.bezierCurveTo(W * .3, yy + rnd() * 20 - 10, W * .6, yy + rnd() * 20 - 10, W, yy + rnd() * 10); g.stroke(); }
    const vg = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 950); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, o.dark ? 'rgba(0,0,0,.4)' : 'rgba(110,60,20,.32)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    // engraved frames
    g.strokeStyle = acc; g.lineWidth = 4; g.strokeRect(34, 34, W - 68, H - 68); g.lineWidth = 1.5; g.strokeRect(52, 52, W - 104, H - 104);
    // corner fleurons
    g.fillStyle = acc; for (const [cx, cy] of [[52, 52], [W - 52, 52], [52, H - 52], [W - 52, H - 52]]) { g.save(); g.translate(cx, cy); g.rotate(Math.PI / 4); g.fillRect(-9, -9, 18, 18); g.restore(); }
    const C = W / 2;
    V.crest(g, C, 205, 92, acc, o.dark ? '#120a0c' : '#4a0f1c');
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = ink;
    const sp = (px) => { try { g.letterSpacing = px; } catch (e) { } };
    sp('18px'); g.font = '600 32px Karla'; g.fillText(o.house || 'DOMAINE VINEA', C + 9, 365);
    sp('0px'); let fs = 124; g.font = `400 ${fs}px "Libre Caslon Display"`;
    while (g.measureText(o.name || 'Clos des Ombres').width > 620) { fs -= 4; g.font = `400 ${fs}px "Libre Caslon Display"`; }
    g.fillText(o.name || 'Clos des Ombres', C, 510);
    g.font = 'italic 400 46px "Libre Caslon Text"'; g.fillStyle = acc; g.fillText(o.cru || 'Grand Cru', C, 584);
    g.strokeStyle = acc; g.lineWidth = 2; g.beginPath(); g.moveTo(C - 300, 628); g.lineTo(C - 30, 628); g.moveTo(C + 30, 628); g.lineTo(C + 300, 628); g.stroke();
    g.save(); g.translate(C, 628); g.rotate(Math.PI / 4); g.fillRect(-8, -8, 16, 16); g.restore();
    g.fillStyle = o.dark ? acc : '#4a0f1c'; g.font = '400 168px "Libre Caslon Display"'; g.fillText(o.year || '2019', C, 800);
    g.fillStyle = ink; sp('7px'); g.font = '600 22px Karla';
    g.fillText(o.ac || 'APPELLATION VINEA GRAND CRU CONTRÔLÉE', C + 3, 870);
    g.font = '400 20px Karla'; g.fillText(o.small || 'MIS EN BOUTEILLE AU DOMAINE · 750 ML · 13,5 % VOL.', C + 3, 912);
    // side panels (wrap to the back)
    sp('4px'); g.font = '600 18px Karla'; g.textAlign = 'left'; g.globalAlpha = 0.75;
    const left = ['PINOT NOIR', 'VIEILLES VIGNES · 64 ANS', 'ÉLEVÉ 18 MOIS', 'EN FÛTS DE CHÊNE', 'RÉCOLTE MANUELLE'];
    left.forEach((t, i) => g.fillText(t, 110, 380 + i * 44));
    g.textAlign = 'right'; ['BOUTEILLE', 'N° 04 812', 'SUR 9 600', 'CAVE N° III', 'LOT L19-CO'].forEach((t, i) => g.fillText(t, W - 110, 380 + i * 44));
    g.globalAlpha = 1; sp('0px');
    // wax drop ref dot on side
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  };

  V.collar = (o = {}) => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const g = c.getContext('2d');
    g.fillStyle = o.bg || '#4a0f1c'; g.fillRect(0, 0, 1024, 160);
    g.strokeStyle = o.accent || '#c9a36a'; g.lineWidth = 3; g.strokeRect(6, 10, 1012, 140);
    g.fillStyle = o.accent || '#d8b87e'; g.textAlign = 'center'; g.font = '400 92px "Libre Caslon Display"'; g.fillText(o.year || '2019', 512, 112);
    g.font = '600 22px Karla'; try { g.letterSpacing = '8px'; } catch (e) { } g.fillText('VINEA', 200, 92); g.fillText('VINEA', 824, 92);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };

  /* ---------- bottle ---------- */
  V.bottleProfile = (shape = 'burgundy') => {
    const P = []; const v = (x, y) => P.push(new THREE.Vector2(x, y));
    const R = shape === 'sparkling' ? 0.4 : 0.385;
    v(0, 0.2); v(0.07, 0.19); v(0.15, 0.15); v(0.23, 0.08); v(0.29, 0.025); v(0.335, 0.004); v(R - 0.022, 0.0); v(R - 0.006, 0.014); v(R, 0.05);
    if (shape === 'bordeaux') {
      v(R, 1.9); v(R - 0.01, 1.98); v(R - 0.04, 2.06);
      for (let i = 1; i <= 10; i++) { const t = i / 10; v(R - 0.04 - (R - 0.04 - 0.128) * (1 - Math.pow(1 - t, 2.2)), 2.06 + t * 0.26); }
      v(0.126, 2.6);
    } else if (shape === 'sparkling') {
      v(R, 1.42);
      for (let i = 1; i <= 18; i++) { const t = i / 18; const s = t * t * (3 - 2 * t); v(R - (R - 0.14) * s, 1.42 + t * 1.0); }
      v(0.135, 2.62);
    } else {
      v(R, 1.5);
      for (let i = 1; i <= 18; i++) { const t = i / 18; const s = t * t * (3 - 2 * t); v(R - (R - 0.128) * s, 1.5 + t * 0.98); }
      v(0.126, 2.6);
    }
    const nr = shape === 'sparkling' ? 0.135 : 0.124;
    v(nr, 2.84); v(nr + 0.02, 2.855); v(nr + 0.026, 2.885); v(nr + 0.026, 2.945); v(nr + 0.016, 2.972); v(0.1, 2.98); v(0, 2.98);
    return P;
  };

  V.bottle = (o = {}) => {
    const shape = o.shape || 'burgundy';
    const grp = new THREE.Group();
    const prof = V.bottleProfile(shape);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: o.glass ?? 0x1f4a2a, metalness: 0, roughness: 0.05, transmission: o.transmission ?? 0.82, thickness: 0.55, ior: 1.52,
      attenuationColor: new THREE.Color(o.atten ?? 0x0c2a12), attenuationDistance: o.attenDist ?? 0.55,
      clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 1, envMapIntensity: o.envI ?? 1.5
    });
    if (o.cheap) { glassMat.transmission = 0; glassMat.opacity = 1; glassMat.color = new THREE.Color(o.glassCheap ?? 0x0c1f12); glassMat.roughness = 0.08; }
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof, o.seg || 72), glassMat); grp.add(body);
    // wine inside
    const level = o.level ?? 2.05;
    const inner = prof.filter(p => p.y < level && p.y > 0.03).map(p => new THREE.Vector2(Math.max(0, p.x - 0.03), p.y + 0.02));
    inner.unshift(new THREE.Vector2(0, 0.24)); inner.push(new THREE.Vector2(inner[inner.length - 1].x, level)); inner.push(new THREE.Vector2(0, level));
    const wineMat = new THREE.MeshPhysicalMaterial({ color: o.wine ?? 0x3d0711, roughness: 0.2, metalness: 0, clearcoat: 0.6, emissive: new THREE.Color(o.wineGlow ?? 0x1a0206), emissiveIntensity: 1, sheen: 0.4, sheenColor: new THREE.Color(0x8a1a2a) });
    if (o.level !== 0) grp.add(new THREE.Mesh(new THREE.LatheGeometry(inner, 48), wineMat));
    // label
    if (o.label !== false) {
      const lh = shape === 'sparkling' ? 0.78 : 0.92, ly = shape === 'bordeaux' ? 0.62 : 0.44;
      const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.392 + (shape === 'sparkling' ? 0.016 : 0), 0.392 + (shape === 'sparkling' ? 0.016 : 0), lh, 96, 1, true, -Math.PI * 0.55, Math.PI * 1.1),
        new THREE.MeshPhysicalMaterial({ map: o.labelTex || V.label(o.labelOpts), roughness: 0.62, sheen: 0.3, sheenRoughness: 0.8, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 0.7, side: THREE.FrontSide }));
      lab.position.y = ly + lh / 2; grp.add(lab);
      // embossed gold edge rings on label
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0xc9a36a, metalness: 1, roughness: 0.3 });
      for (const yy of [ly, ly + lh]) {
        const e = new THREE.Mesh(new THREE.CylinderGeometry(0.394 + (shape === 'sparkling' ? 0.016 : 0), 0.394 + (shape === 'sparkling' ? 0.016 : 0), 0.008, 96, 1, true, -Math.PI * 0.55, Math.PI * 1.1), edgeMat);
        e.position.y = yy; grp.add(e);
      }
    }
    // foil capsule following the neck
    const capTop = 2.99, capBot = shape === 'sparkling' ? 2.1 : 2.5;
    const cap = prof.filter(p => p.y >= capBot - 0.001).map(p => new THREE.Vector2(p.x + 0.007, p.y + (p.x === 0 ? 0.01 : 0)));
    const capMat = new THREE.MeshPhysicalMaterial({ color: o.capsule ?? 0x5a0f1f, metalness: 0.85, roughness: o.capRough ?? 0.28, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.3 });
    const capM = new THREE.Mesh(new THREE.LatheGeometry(cap, 64), capMat); grp.add(capM);
    // capsule rings & top seal disk
    const ringMat = new THREE.MeshStandardMaterial({ color: o.capRing ?? 0xc9a36a, metalness: 1, roughness: 0.25 });
    const nr = shape === 'sparkling' ? 0.142 : 0.131;
    for (const yy of [2.62, 2.66].map(y => shape === 'sparkling' ? y : y)) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(nr + 0.004, 0.006, 8, 64), ringMat); r.rotation.x = Math.PI / 2; r.position.y = yy; grp.add(r);
    }
    if (shape === 'sparkling') { // wire cage
      const wm = new THREE.MeshStandardMaterial({ color: 0xd8c08a, metalness: 1, roughness: 0.3 });
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + 0.4; const pts = [];
        for (let k = 0; k <= 12; k++) { const t = k / 12; const rr = 0.17 - 0.12 * t * t; pts.push(new THREE.Vector3(Math.cos(a) * rr, 2.72 + t * 0.28, Math.sin(a) * rr)); }
        grp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.006, 6), wm));
      }
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 8, 48), wm); r2.rotation.x = Math.PI / 2; r2.position.y = 2.72; grp.add(r2);
      const plaque = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 32), wm); plaque.position.y = 3.0; grp.add(plaque);
    }
    // collar label
    if (o.collar !== false && shape !== 'sparkling') {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.151, 0.16, 64, 1, true, -Math.PI * 0.5, Math.PI), new THREE.MeshStandardMaterial({ map: V.collar(o.collarOpts), roughness: 0.4, metalness: 0.2 }));
      col.position.y = 2.38; grp.add(col);
    }
    grp.userData = { glassMat, wineMat, capMat, body };
    return grp;
  };

  /* ---------- crystal glass with live wine surface ---------- */
  V.wineGlass = (o = {}) => {
    const grp = new THREE.Group();
    const bowlPts = [[0.05, 1.12], [0.2, 1.17], [0.34, 1.26], [0.45, 1.4], [0.515, 1.58], [0.535, 1.76], [0.52, 1.96], [0.48, 2.16], [0.445, 2.36], [0.435, 2.46]].map(p => new THREE.Vector2(p[0], p[1]));
    const spline = new THREE.SplineCurve(bowlPts); const bowl = spline.getPoints(40);
    const P = [];
    // foot & stem
    [[0, 0.0], [0.5, 0.0], [0.53, 0.008], [0.53, 0.02], [0.46, 0.036], [0.2, 0.06], [0.07, 0.085], [0.045, 0.13], [0.04, 0.4], [0.038, 0.8], [0.042, 0.98], [0.06, 1.06]].forEach(p => P.push(new THREE.Vector2(p[0], p[1])));
    bowl.forEach(p => P.push(p.clone()));
    P.push(new THREE.Vector2(0.43, 2.465)); P.push(new THREE.Vector2(0.424, 2.46));
    const innerBowl = bowl.slice().reverse().map(p => new THREE.Vector2(Math.max(0, p.x - 0.012), p.y + 0.012 * (p.y < 1.3 ? 3 : 0)));
    innerBowl.forEach(p => P.push(p)); P.push(new THREE.Vector2(0, 1.17));
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.0, transmission: 1, thickness: 0.06, ior: 1.5, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2.2, side: THREE.DoubleSide, attenuationColor: new THREE.Color(0xfff6ea), attenuationDistance: 2 });
    grp.add(new THREE.Mesh(new THREE.LatheGeometry(P, 96), glassMat));
    // wine body
    const level = o.level ?? 1.6;
    const inner = bowl.filter(p => p.y < level).map(p => new THREE.Vector2(Math.max(0, p.x - 0.018), p.y + 0.02));
    const rAt = (y) => { for (let i = 0; i < bowl.length - 1; i++) if (bowl[i].y <= y && bowl[i + 1].y >= y) { const t = (y - bowl[i].y) / (bowl[i + 1].y - bowl[i].y); return bowl[i].x + (bowl[i + 1].x - bowl[i].x) * t - 0.018; } return 0.5; };
    const R = rAt(level);
    inner.unshift(new THREE.Vector2(0, 1.17)); inner.push(new THREE.Vector2(R, level));
    const wineMat = new THREE.MeshPhysicalMaterial({ color: o.wine ?? 0x5c0a18, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, emissive: new THREE.Color(o.glowC ?? 0x2a0309), emissiveIntensity: 1, sheen: 0.6, sheenColor: new THREE.Color(0xc0283a), envMapIntensity: 1.4, side: THREE.DoubleSide });
    const wb = new THREE.LatheGeometry(inner, 64); const wineBody = new THREE.Mesh(wb, wineMat); grp.add(wineBody);
    // polar surface grid
    const RINGS = 14, SEG = 72; const pos = [], idx = [];
    pos.push(0, level, 0);
    for (let i = 1; i <= RINGS; i++) for (let j = 0; j < SEG; j++) { const r = R * i / RINGS, a = j / SEG * TAU; pos.push(Math.cos(a) * r, level, Math.sin(a) * r); }
    for (let j = 0; j < SEG; j++) idx.push(0, 1 + (j + 1) % SEG, 1 + j);
    for (let i = 1; i < RINGS; i++) for (let j = 0; j < SEG; j++) {
      const a = 1 + (i - 1) * SEG + j, b = 1 + (i - 1) * SEG + (j + 1) % SEG, c = 1 + i * SEG + j, d = 1 + i * SEG + (j + 1) % SEG;
      idx.push(a, b, c, b, d, c);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx);
    const surfMat = new THREE.MeshPhysicalMaterial({ color: o.surface ?? 0x3a0510, roughness: 0.04, clearcoat: 1, metalness: 0.1, envMapIntensity: 2.4, side: THREE.DoubleSide, emissive: new THREE.Color(0x14010a) });
    const surf = new THREE.Mesh(sg, surfMat); grp.add(surf);
    const sp = sg.attributes.position; const wp = wb.attributes.position;
    const topIdx = []; for (let i = 0; i < wp.count; i++) if (Math.abs(wp.getY(i) - level) < 1e-4 && wp.getX(i) ** 2 + wp.getZ(i) ** 2 > 0.01) topIdx.push(i);
    const amp = o.swirl ?? 0.07;
    const hfn = (x, z, t) => { const r = Math.hypot(x, z) / R; const a = Math.atan2(z, x); return amp * Math.pow(r, 1.6) * Math.cos(a - t * 1.6) + 0.006 * Math.sin(r * 14 - t * 4) * r; };
    grp.userData.update = (t) => {
      for (let i = 0; i < sp.count; i++) sp.setY(i, level + hfn(sp.getX(i), sp.getZ(i), t));
      sp.needsUpdate = true; sg.computeVertexNormals();
      for (const i of topIdx) wp.setY(i, level + hfn(wp.getX(i), wp.getZ(i), t));
      wp.needsUpdate = true;
    };
    grp.userData.update(o.t0 ?? 0.6);
    grp.userData.R = R; grp.userData.level = level; grp.userData.wineMat = wineMat;
    return grp;
  };

  /* ---------- wood / stone textures ---------- */
  V.wood = (base = '#6b4326', w = 1024, h = 512, opts = {}) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    let seed = opts.seed || 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 260; i++) {
      const y0 = rnd() * h, a = rnd() * 8 + 2, f = rnd() * 0.01 + 0.002, ph = rnd() * 6;
      g.strokeStyle = rnd() > 0.5 ? `rgba(30,14,6,${rnd() * 0.28})` : `rgba(255,214,160,${rnd() * 0.08})`; g.lineWidth = rnd() * 2.4 + 0.4;
      g.beginPath(); for (let x = 0; x <= w; x += 16) { const y = y0 + Math.sin(x * f + ph) * a + Math.sin(x * f * 3.1) * a * 0.3; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    }
    for (let k = 0; k < 3; k++) { const x = rnd() * w, y = rnd() * h; const gr = g.createRadialGradient(x, y, 1, x, y, 26); gr.addColorStop(0, 'rgba(25,10,4,.7)'); gr.addColorStop(1, 'rgba(25,10,4,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 40, 14, 0, 0, TAU); g.fill(); }
    if (opts.planks) { g.fillStyle = 'rgba(15,6,3,.55)'; for (let i = 1; i < opts.planks; i++) g.fillRect(0, i * h / opts.planks - 2, w, 4); }
    if (opts.draw) opts.draw(g, w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };

  V.stone = (w = 1024, h = 1024) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = '#3a2b22'; g.fillRect(0, 0, w, h);
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const bh = 64; for (let r = 0; r < h / bh; r++) { let x = -rnd() * 120; while (x < w) { const bw = 90 + rnd() * 120; const l = 30 + rnd() * 30; g.fillStyle = `hsl(${22 + rnd() * 10},${18 + rnd() * 12}%,${l * 0.6}%)`; g.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6); x += bw; } }
    for (let i = 0; i < 20000; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '0,0,0' : '255,220,180'},${rnd() * 0.08})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  };

  /* ---------- wooden case configurator ---------- */
  V.wineCase = (o = {}) => {
    const grp = new THREE.Group();
    const cols = o.cols || 3, rows = o.rows || 2, pitch = 0.92, H = o.height || 1.25, T = 0.09;
    const iw = cols * pitch, id = rows * pitch;
    const wood = V.wood('#7a4a28', 1024, 512, { seed: 5 });
    const woodD = V.wood('#5e3820', 1024, 512, { seed: 9 });
    const front = V.wood('#7f4d2a', 1024, 512, {
      seed: 13, draw: (g, w, h) => {
        g.save(); g.shadowColor = 'rgba(20,6,2,.9)'; g.shadowBlur = 6; g.fillStyle = 'rgba(28,10,4,.88)'; g.strokeStyle = 'rgba(28,10,4,.88)';
        g.lineWidth = 5; g.strokeRect(40, 40, w - 80, h - 80); g.lineWidth = 2; g.strokeRect(56, 56, w - 112, h - 112);
        V.crest(g, w / 2, 168, 62, 'rgba(28,10,4,.9)', 'rgba(122,74,40,1)');
        g.textAlign = 'center'; try { g.letterSpacing = '20px'; } catch (e) { }
        g.font = '400 92px "Libre Caslon Display"'; g.fillText('DOMAINE VINEA', w / 2 + 10, 340);
        try { g.letterSpacing = '10px'; } catch (e) { } g.font = '600 26px Karla'; g.fillText(o.caseText || 'SIX GRANDS VINS · CAVE N° III · MMXXVI', w / 2 + 5, 410);
        g.restore();
      }
    });
    const mk = (tex) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.78, metalness: 0, envMapIntensity: 0.8 });
    const box = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); grp.add(b); return b; };
    const mW = mk(wood), mD = mk(woodD);
    box(iw + 2 * T, T, id + 2 * T, 0, T / 2, 0, mD); // floor
    const mats = [mW, mW, mW, mW, mk(front), mW];
    box(iw + 2 * T, H, T, 0, H / 2, id / 2 + T / 2, mats); // front (engraved)
    box(iw + 2 * T, H, T, 0, H / 2, -id / 2 - T / 2, mW);
    box(T, H, id, -iw / 2 - T / 2, H / 2, 0, mW); box(T, H, id, iw / 2 + T / 2, H / 2, 0, mW);
    // dividers
    for (let i = 1; i < cols; i++) box(0.025, H * 0.82, id, -iw / 2 + i * pitch, H * 0.41, 0, mD);
    for (let j = 1; j < rows; j++) box(iw, H * 0.82, 0.025, 0, H * 0.41, -id / 2 + j * pitch, mD);
    // rope handles
    const ropeM = new THREE.MeshStandardMaterial({ color: 0xc8a878, roughness: 0.9 });
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 10, 32, Math.PI), ropeM); r.position.set(s * (iw / 2 + T + 0.005), H * 0.72, 0); r.rotation.y = Math.PI / 2; grp.add(r); }
    // iron corner brackets
    const ironM = new THREE.MeshStandardMaterial({ color: 0x2a2220, metalness: 0.8, roughness: 0.45 });
    for (const sx of [-1, 1]) for (const yy of [0.18, H - 0.18]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.012), ironM); b.position.set(sx * (iw / 2 - 0.02), yy, id / 2 + T + 0.006); grp.add(b); }
    grp.userData.slots = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) grp.userData.slots.push(new THREE.Vector3(-iw / 2 + pitch / 2 + i * pitch, T, -id / 2 + pitch / 2 + j * pitch));
    grp.userData.dims = { iw, id, H, T };
    return grp;
  };

  /* ---------- barrel (instanced) ---------- */
  V.barrels = (mats, opts = {}) => {
    const n = mats.length; const P = [];
    for (let i = 0; i <= 14; i++) { const y = i / 14 * 1.2; P.push(new THREE.Vector2(0.46 + 0.075 * Math.sin(Math.PI * y / 1.2), y)); }
    const geo = new THREE.LatheGeometry(P, 28); geo.translate(0, -0.6, 0);
    const tex = (() => {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d');
      const t0 = V.wood('#6a3e22', 1024, 256, { seed: 21 }).image; g.drawImage(t0, 0, 0);
      for (let s = 0; s < 22; s++) { g.fillStyle = 'rgba(15,5,2,.6)'; g.fillRect(s * 1024 / 22, 0, 3, 256); g.fillStyle = `rgba(${s % 2 ? '255,210,150' : '0,0,0'},.06)`; g.fillRect(s * 1024 / 22 + 3, 0, 1024 / 22 - 3, 256); }
      // wine stain band in middle
      const gr = g.createLinearGradient(0, 100, 0, 160); gr.addColorStop(0, 'rgba(80,10,20,0)'); gr.addColorStop(.5, 'rgba(80,10,20,.35)'); gr.addColorStop(1, 'rgba(80,10,20,0)'); g.fillStyle = gr; g.fillRect(0, 100, 1024, 60);
      for (const v of [0.06, 0.16, 0.84, 0.94]) { g.fillStyle = '#1d1512'; g.fillRect(0, v * 256 - 7, 1024, 14); g.fillStyle = 'rgba(255,200,140,.12)'; g.fillRect(0, v * 256 - 7, 1024, 2); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const body = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, envMapIntensity: 0.5 }), n);
    const headTex = V.wood('#7a4a2a', 512, 512, {
      seed: 31, planks: 6, draw: (g, w, h) => {
        g.strokeStyle = '#1d1512'; g.lineWidth = 26; g.beginPath(); g.arc(256, 256, 243, 0, TAU); g.stroke();
        g.fillStyle = 'rgba(240,230,215,.7)'; g.font = '400 64px "Libre Caslon Display"'; g.textAlign = 'center'; g.fillText(opts.mark || 'V · 24', 256, 250);
        g.font = '600 26px Karla'; g.fillText('CLOS DES OMBRES', 256, 300);
      }
    });
    const hg = new THREE.CircleGeometry(0.47, 28); hg.rotateX(-Math.PI / 2); hg.translate(0, 0.6, 0);
    const heads = new THREE.InstancedMesh(hg, new THREE.MeshStandardMaterial({ map: headTex, roughness: 0.75, envMapIntensity: 0.5 }), n);
    mats.forEach((m, i) => { body.setMatrixAt(i, m); heads.setMatrixAt(i, m); });
    return [body, heads];
  };

  /* ---------- sunset vineyard terrain ---------- */
  V.H = (x, z) => {
    let h = 2.4 * Math.sin(x * 0.065 + 0.6) * Math.cos(z * 0.055 + 0.3) + 1.5 * Math.sin(x * 0.14 + z * 0.1) + 0.55 * Math.sin(x * 0.3 - z * 0.21) + 0.25 * Math.sin(x * 0.7 + z * 0.5);
    h += Math.max(0, -z - 30) * 0.09;
    return h;
  };
  V.sky = (sunDir) => new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sun: { value: sunDir.clone().normalize() } },
    vertexShader: 'varying vec3 vW; void main(){ vW = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW,1.); }',
    fragmentShader: `uniform vec3 sun; varying vec3 vW; void main(){ vec3 d=normalize(vW - cameraPosition); float h=d.y;
      vec3 hor=vec3(1.0,0.66,0.38); vec3 mid=vec3(0.78,0.30,0.22); vec3 top=vec3(0.14,0.045,0.08);
      vec3 c=mix(hor,mid,smoothstep(-0.02,0.12,h)); c=mix(c,top,smoothstep(0.1,0.55,h));
      float s=max(dot(d,sun),0.); c+=vec3(1.0,0.9,0.7)*smoothstep(0.99965,0.9998,s)*1.2 + vec3(1.0,0.62,0.3)*pow(s,90.)*0.6 + vec3(1.,.45,.25)*pow(s,6.)*0.2;
      gl_FragColor=vec4(c,1.); }`
  }));

  return V;
};
