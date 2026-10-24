/* FORMA ATELIER — shared procedural 3D library (Three.js r160).
   Classic script so it loads over file://; pages call Forma3D(THREE, addons) from their module. */
window.Forma3D = function (THREE, ADD) {
  const { RoomEnvironment, RoundedBoxGeometry } = ADD;
  const F = { THREE };
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  /* ---------- ready bookkeeping for the capture tool ---------- */
  let pending = 0;
  F.expect = n => { pending += n; };
  F.done = () => { pending--; if (pending <= 0) window.__ready3d = true; };

  /* ---------- seeded random ---------- */
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  F.rng = rng;
  const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  const texCache = {};
  const tex = (key, make, { rep = [1, 1], color = true } = {}) => {
    const canvas = texCache[key] || (texCache[key] = make());
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 4;
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };

  /* ---------- procedural textures ---------- */
  const boucleCanvas = () => cv(512, 512, (x, w, h) => {
    const R = rng(7); x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 5200; i++) {
      const px = R() * w, py = R() * h, r = 2.5 + R() * 5.5;
      x.beginPath(); x.ellipse(px, py, r, r * (0.6 + R() * 0.5), R() * 3, 0, Math.PI * 2);
      x.lineWidth = 1.2 + R() * 2.2; x.strokeStyle = `rgba(255,255,255,${0.25 + R() * 0.5})`; x.stroke();
      if (R() < 0.3) { x.fillStyle = `rgba(0,0,0,${0.25 + R() * 0.3})`; x.fillRect(px, py, 2, 2); }
    }
  });
  const grainCanvas = (seed, n, a) => () => cv(512, 512, (x, w, h) => {
    const R = rng(seed); x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { const v = R() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${v},${v},${v},${a * R()})`; const s = 1 + R() * 3; x.fillRect(R() * w, R() * h, s, s); }
    x.filter = 'blur(0.6px)'; x.drawImage(x.canvas, 0, 0);
  });
  const velvetCanvas = () => cv(512, 512, (x, w, h) => {
    const R = rng(11); x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { x.strokeStyle = `rgba(${R() < .5 ? 0 : 255},${R() < .5 ? 0 : 255},128,${0.05 + R() * 0.08})`; x.lineWidth = 6 + R() * 30; x.beginPath(); const y = R() * h; x.moveTo(0, y); x.bezierCurveTo(w * .3, y + (R() - .5) * 80, w * .7, y + (R() - .5) * 80, w, y + (R() - .5) * 40); x.stroke(); }
    x.filter = 'blur(6px)'; x.drawImage(x.canvas, 0, 0);
  });
  const marbleCanvas = (base, vein, fine, seed) => () => cv(1024, 1024, (x, w, h) => {
    const R = rng(seed);
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, base[0]); g.addColorStop(1, base[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(${base[2]},${0.03 + R() * 0.05})`; x.beginPath(); x.ellipse(R() * w, R() * h, 40 + R() * 200, 20 + R() * 90, R() * 3, 0, 7); x.fill(); }
    const veins = (col, lw, blur, n, step) => {
      for (let k = 0; k < n; k++) {
        let px = R() * w, py = R() * h, a = 0.7 + (R() - 0.5) * 1.2;
        x.beginPath(); x.moveTo(px, py);
        for (let s = 0; s < 160; s++) { a += (R() - 0.5) * 0.28; px += Math.cos(a) * step; py += Math.sin(a) * step; x.lineTo(px, py); }
        x.strokeStyle = col; x.lineWidth = lw * (0.4 + R()); x.filter = `blur(${blur}px)`; x.stroke();
      }
      x.filter = 'none';
    };
    veins(`rgba(${vein},.4)`, 30, 12, 8, 9); veins(`rgba(${vein},.9)`, 4.5, 1, 22, 8); veins(`rgba(${fine},.5)`, 1, .4, 34, 6);
  });
  const travertineCanvas = () => cv(1024, 1024, (x, w, h) => {
    const R = rng(23); x.fillStyle = '#d6c3a2'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const y = R() * h; x.fillStyle = `rgba(${R() < .5 ? '150,118,80' : '240,228,205'},${0.08 + R() * 0.16})`; x.fillRect(0, y, w, 2 + R() * 22); }
    for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(120,92,60,${0.25 + R() * 0.4})`; x.beginPath(); x.ellipse(R() * w, R() * h, 1 + R() * 9, 0.6 + R() * 2.2, 0, 0, 7); x.fill(); }
  });
  const woodCanvas = (c1, c2, seed) => () => cv(1024, 1024, (x, w, h) => {
    const R = rng(seed); x.fillStyle = c1; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 180; i++) {
      x.strokeStyle = `${c2}${(0.08 + R() * 0.25).toFixed(2)})`; x.lineWidth = 1 + R() * 5; x.beginPath();
      const y0 = R() * h; x.moveTo(0, y0);
      for (let s = 0; s <= 16; s++) x.lineTo(s * w / 16, y0 + Math.sin(s * 0.7 + i) * 6 + (R() - .5) * 4);
      x.stroke();
    }
  });
  const herringCanvas = () => cv(1024, 1024, (x, w, h) => {
    const R = rng(41); x.fillStyle = '#6e4a2c'; x.fillRect(0, 0, w, h);
    const L = 256, T = 64;
    x.save();
    for (let row = -8; row < 24; row++) for (let col = -4; col < 12; col++) {
      for (const dir of [1, -1]) {
        x.save(); const ox = col * 2 * T * 1.414 + (dir > 0 ? 0 : T * 1.414), oy = row * T * 1.414 + (dir > 0 ? 0 : 0);
        x.translate(ox, oy); x.rotate(dir * Math.PI / 4);
        const tone = 0.75 + R() * 0.4; x.fillStyle = `rgb(${150 * tone | 0},${104 * tone | 0},${64 * tone | 0})`; x.fillRect(0, 0, L, T);
        for (let k = 0; k < 6; k++) { x.fillStyle = `rgba(70,40,20,${0.08 + R() * 0.12})`; x.fillRect(0, R() * T, L, 1 + R() * 3); }
        x.strokeStyle = 'rgba(40,22,10,.55)'; x.lineWidth = 2; x.strokeRect(0, 0, L, T); x.restore();
      }
    }
    x.restore();
  });
  const plasterCanvas = () => cv(512, 512, (x, w, h) => {
    const R = rng(5); x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${R() < .5 ? 0 : 255},${R() < .5 ? 0 : 255},${R() < .5 ? 0 : 255},${0.04 + R() * 0.06})`; x.beginPath(); x.ellipse(R() * w, R() * h, 8 + R() * 40, 4 + R() * 20, R() * 3, 0, 7); x.fill(); }
    x.filter = 'blur(4px)'; x.drawImage(x.canvas, 0, 0);
  });

  /* ---------- materials ---------- */
  F.COLORS = { plaster: '#e6ded0', oxblood: '#6a2320', forest: '#22422f', ochre: '#b07a35', ink: '#1d1d24', clay: '#c48f7c', sage: '#8c9a7f', cognac: '#8a4a26' };
  F.fabric = (kind = 'boucle', color = '#e6ded0', rep = [10, 3]) => {
    const c = new THREE.Color(color);
    const sheenColor = c.clone().lerp(new THREE.Color('#ffffff'), 0.45);
    const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.92, sheen: 1, sheenRoughness: 0.6, sheenColor });
    if (kind === 'boucle') { m.roughness = 1; m.sheen = 0.7; m.sheenRoughness = 0.85; m.bumpMap = tex('boucle', boucleCanvas, { rep, color: false }); m.bumpScale = 2.2; }
    if (kind === 'velvet') { m.color.multiplyScalar(0.78); m.roughness = 0.75; m.sheen = 0.6; m.sheenRoughness = 0.35; m.sheenColor = c.clone().multiplyScalar(1.5); m.bumpMap = tex('velvet', velvetCanvas, { rep: [2, 1], color: false }); m.bumpScale = 0.8; }
    if (kind === 'mohair') { m.roughness = 0.85; m.sheen = 0.9; m.sheenRoughness = 0.5; m.bumpMap = tex('mohair', grainCanvas(3, 26000, 0.9), { rep: [6, 2], color: false }); m.bumpScale = 1.2; }
    if (kind === 'leather') { m.roughness = 0.42; m.sheen = 0; m.clearcoat = 0.35; m.clearcoatRoughness = 0.45; m.bumpMap = tex('leather', grainCanvas(9, 9000, 0.7), { rep: [5, 2], color: false }); m.bumpScale = 0.9; }
    m.userData.kind = kind;
    return m;
  };
  F.metal = (finish = 'brass') => {
    const P = {
      brass: { color: '#c9a063', roughness: 0.3, anisotropy: 0.75 },
      bronze: { color: '#3b2d24', roughness: 0.42, anisotropy: 0.5 },
      nickel: { color: '#dcd8cf', roughness: 0.12, anisotropy: 0.2 },
      copper: { color: '#b8704c', roughness: 0.3, anisotropy: 0.6 }
    }[finish];
    if (!P) return F.wood('oak');
    return new THREE.MeshPhysicalMaterial({ metalness: 1, color: P.color, roughness: P.roughness, anisotropy: P.anisotropy, clearcoat: 0.15, clearcoatRoughness: 0.4 });
  };
  F.wood = (kind = 'walnut') => {
    const W = { walnut: ['#5b3a25', 'rgba(30,16,8,', 31], oak: ['#3e3026', 'rgba(15,10,6,', 32], light: ['#b48a5c', 'rgba(90,58,30,', 33] }[kind];
    return new THREE.MeshPhysicalMaterial({ map: tex('wood' + kind, woodCanvas(...W), { rep: [1, 1] }), roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.35 });
  };
  F.marble = (kind = 'viola', rep = [1, 1]) => {
    const M = {
      viola: [['#efe9e2', '#e2d9cf', '160,140,130'], '110,28,36', '150,130,128', 13],
      nero: [['#151313', '#211d1b', '90,80,70'], '230,222,210', '160,150,140', 17],
      verde: [['#173226', '#0f241b', '40,90,60'], '220,230,215', '120,160,130', 19]
    }[kind];
    return new THREE.MeshPhysicalMaterial({ map: tex('marble' + kind, marbleCanvas(...M), { rep }), roughness: 0.18, clearcoat: 0.6, clearcoatRoughness: 0.15 });
  };
  F.travertine = (rep = [1, 1]) => new THREE.MeshPhysicalMaterial({ map: tex('trav', travertineCanvas, { rep }), roughness: 0.7, bumpMap: tex('travb', travertineCanvas, { rep, color: false }), bumpScale: 0.6 });
  F.lacquer = color => new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 });
  F.plaster = (color = '#e9e2d6', rep = [2, 2]) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.95, bumpMap: tex('plaster', plasterCanvas, { rep, color: false }), bumpScale: 0.6 });
  F.floor = (rep = [3, 3]) => new THREE.MeshPhysicalMaterial({ map: tex('herring', herringCanvas, { rep }), roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.3 });
  F.opal = () => new THREE.MeshPhysicalMaterial({ color: '#fff4e2', emissive: '#ffcc88', emissiveIntensity: 1.7, roughness: 0.35, clearcoat: 1 });

  /* ---------- geometry helpers ---------- */
  const mesh = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; };
  F.mesh = mesh;
  // Rounded "puffy" profile for lathes: radius r, height h, corner radius rr, crown on top
  const puffy = (r, h, rr, crown = 0, waist = 0) => {
    const p = [V2(0, 0)], seg = 10;
    for (let i = 0; i <= seg; i++) { const a = -Math.PI / 2 + i / seg * Math.PI / 2; p.push(V2(r - rr + rr * Math.cos(a) - waist, rr + rr * Math.sin(a))); }
    for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI / 2; p.push(V2(r - rr + rr * Math.cos(a), h - rr + rr * Math.sin(a))); }
    for (let i = 1; i <= 8; i++) { const t = i / 8, xx = (r - rr) * (1 - t); p.push(V2(Math.max(xx, 0.0001), h + crown * (1 - (1 - t) * (1 - t)))); }
    return p;
  };
  F.lathe = (pts, mat, seg = 72) => mesh(new THREE.LatheGeometry(pts, seg), mat);
  const rod = (a, b, r1, r2, mat) => {
    const d = a.clone().sub(b), len = d.length();
    const m = mesh(new THREE.CylinderGeometry(r1, r2, len, 24), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize());
    return m;
  };
  F.rod = rod;
  const rbox = (w, h, d, r, mat, seg = 5) => mesh(new RoundedBoxGeometry(w, h, d, seg, r), mat);
  F.rbox = rbox;

  /* ---------- pieces ---------- */
  // ORBE lounge chair: puffy drum + cushion, wrap-around torus back, splayed brass legs
  F.chair = (o = {}) => {
    const fab = o.fabric || F.fabric('boucle', '#e6ded0'), met = o.metal || F.metal('brass');
    const g = new THREE.Group(), parts = {};
    const legs = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2;
      legs.add(rod(V3(Math.cos(a) * 0.36, 0.18, Math.sin(a) * 0.36), V3(Math.cos(a) * 0.47, 0, Math.sin(a) * 0.47), 0.026, 0.014, met));
      const foot = mesh(new THREE.SphereGeometry(0.018, 16, 12), met); foot.position.set(Math.cos(a) * 0.47, 0.004, Math.sin(a) * 0.47); legs.add(foot);
    }
    const ring = mesh(new THREE.TorusGeometry(0.37, 0.013, 12, 96), met); ring.rotation.x = Math.PI / 2; ring.position.y = 0.18; legs.add(ring);
    g.add(legs); parts.legs = legs;
    const drum = F.lathe(puffy(0.6, 0.22, 0.09, 0.01), fab); drum.position.y = 0.17; g.add(drum); parts.drum = drum;
    const band = mesh(new THREE.TorusGeometry(0.585, 0.009, 10, 128), met); band.rotation.x = Math.PI / 2; band.position.y = 0.2; g.add(band); parts.band = band;
    const cushion = F.lathe(puffy(0.52, 0.15, 0.075, 0.035), fab); cushion.position.set(0, 0.38, 0.03); g.add(cushion); parts.cushion = cushion;
    // back: a horizontal torus arc, stretched vertically, with ellipsoid end caps
    const back = new THREE.Group(), R = 0.56, r = 0.16, arc = Math.PI * 1.32, sy = 1.8;
    const tg = new THREE.TorusGeometry(R, r, 40, 140, arc);
    tg.rotateZ(Math.PI / 2 - arc / 2); tg.rotateX(-Math.PI / 2); tg.scale(1, sy, 1);
    back.add(mesh(tg, fab));
    for (const th of [Math.PI / 2 - arc / 2, Math.PI / 2 + arc / 2]) {
      const cap = mesh(new THREE.SphereGeometry(r, 32, 24), fab); cap.scale.set(1, sy, 1);
      cap.position.set(R * Math.cos(th), 0, -R * Math.sin(th)); back.add(cap);
    }
    back.position.y = 0.6; g.add(back); parts.back = back;
    g.userData.parts = parts; g.userData.fabric = fab; g.userData.metal = met;
    return g;
  };
  F.setMaterials = (g, fab, met) => g.traverse(m => { if (!m.isMesh) return; if (m.material === g.userData.fabric) m.material = fab; else if (m.material === g.userData.metal) m.material = met; });
  F.swap = (g, { fabric, metal }) => {
    const oldF = g.userData.fabric, oldM = g.userData.metal;
    g.traverse(m => { if (!m.isMesh) return; if (fabric && m.material === oldF) m.material = fabric; if (metal && m.material === oldM) m.material = metal; });
    if (fabric) g.userData.fabric = fabric; if (metal) g.userData.metal = metal;
  };

  // OVUM pouf / ottoman
  F.pouf = (o = {}) => {
    const fab = o.fabric || F.fabric('velvet', F.COLORS.oxblood), met = o.metal || F.metal('brass');
    const g = new THREE.Group();
    const body = F.lathe(puffy(0.34, 0.3, 0.14, 0.04, 0.03), fab); body.position.y = 0.06; g.add(body);
    const foot = F.lathe([V2(0, 0), V2(0.2, 0), V2(0.21, 0.012), V2(0.2, 0.065), V2(0, 0.065)], met); g.add(foot);
    g.userData.fabric = fab; g.userData.metal = met;
    return g;
  };

  // DUNE modular sofa: 3 curved modules
  F.sofa = (o = {}) => {
    const fab = o.fabric || F.fabric('boucle', '#e6ded0', [4, 2]), met = o.metal || F.metal('bronze'), accent = o.accent || F.fabric('velvet', F.COLORS.oxblood);
    const g = new THREE.Group(), Rr = 3.2;
    [-0.31, 0, 0.31].forEach((a, i) => {
      const m = new THREE.Group();
      const base = rbox(0.86, 0.07, 0.82, 0.02, met, 2); base.position.y = 0.035; m.add(base);
      const seat = rbox(0.98, 0.32, 0.94, 0.14, fab, 6); seat.position.set(0, 0.23, 0.02); m.add(seat);
      const back = rbox(0.98, 0.44, 0.28, 0.13, fab, 6); back.position.set(0, 0.56, -0.33); back.rotation.x = -0.12; m.add(back);
      if (i !== 1) { const b = mesh(new THREE.CapsuleGeometry(0.11, 0.42, 8, 24), accent); b.rotation.z = Math.PI / 2; b.position.set(i === 0 ? -0.14 : 0.14, 0.5, -0.12); b.rotation.y = i === 0 ? 0.25 : -0.25; m.add(b); }
      m.position.set(Rr * Math.sin(a), 0, Rr - Rr * Math.cos(a)); m.rotation.y = -a;
      g.add(m);
    });
    g.userData.fabric = fab;
    return g;
  };

  // MONOLITH coffee table: elliptical marble slab on two travertine drums
  F.table = (o = {}) => {
    const top = o.top || F.marble('viola', [0.7, 0.7]), base = o.base || F.travertine();
    const g = new THREE.Group(), parts = {};
    const s = new THREE.Shape(); s.absellipse(0, 0, 0.78, 0.46, 0, Math.PI * 2, false, 0);
    const eg = new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 5, curveSegments: 96 });
    eg.rotateX(-Math.PI / 2);
    const slab = mesh(eg, top); slab.position.y = 0.33; g.add(slab); parts.top = slab;
    const ped = [];
    for (const x of [-0.34, 0.34]) {
      const p = F.lathe([V2(0, 0), V2(0.17, 0), V2(0.18, 0.02), V2(0.13, 0.14), V2(0.12, 0.2), V2(0.15, 0.31), V2(0.16, 0.33), V2(0, 0.33)], base, 64);
      p.position.x = x; g.add(p); ped.push(p);
    }
    parts.ped = ped; g.userData.parts = parts;
    return g;
  };

  // PEBBLE side table in travertine
  F.side = (o = {}) => {
    const m = o.mat || F.travertine();
    const g = new THREE.Group();
    g.add(F.lathe([V2(0, 0), V2(0.2, 0), V2(0.21, 0.02), V2(0.15, 0.12), V2(0.1, 0.28), V2(0.12, 0.4), V2(0.24, 0.47), V2(0.25, 0.5), V2(0, 0.5)], m, 64));
    return g;
  };

  // HALO floor lamp: brass stem + vertical ring + floating opal globe
  F.lamp = (o = {}) => {
    const met = o.metal || F.metal('brass');
    const g = new THREE.Group();
    g.add(F.lathe([V2(0, 0), V2(0.17, 0), V2(0.18, 0.012), V2(0.16, 0.035), V2(0.03, 0.05), V2(0, 0.05)], F.marble('nero', [0.3, 0.3]), 64));
    g.add(rod(V3(0, 1.32, 0), V3(0, 0.05, 0), 0.011, 0.014, met));
    const ring = mesh(new THREE.TorusGeometry(0.27, 0.014, 16, 128), met); ring.position.y = 1.6; g.add(ring);
    const globe = mesh(new THREE.SphereGeometry(0.16, 48, 32), F.opal(), false); globe.position.y = 1.6; g.add(globe);
    g.userData.globe = globe;
    return g;
  };

  // TOTEM cabinet: stacked volumes
  F.cabinet = () => {
    const g = new THREE.Group(), met = F.metal('brass');
    const a = rbox(0.92, 0.42, 0.44, 0.03, F.lacquer('#5a1f1b')); a.position.y = 0.27; g.add(a);
    const b = rbox(0.78, 0.36, 0.44, 0.03, F.wood('walnut')); b.position.set(0.08, 0.66, 0); g.add(b);
    const c = rbox(0.98, 0.05, 0.48, 0.012, F.marble('nero', [0.5, 0.5])); c.position.y = 0.87; g.add(c);
    const d = rbox(0.5, 0.28, 0.4, 0.14, F.lacquer('#1f3a2f')); d.position.set(-0.18, 1.04, 0); g.add(d);
    const plinth = rbox(0.8, 0.06, 0.36, 0.01, F.metal('bronze')); plinth.position.y = 0.03; g.add(plinth);
    for (const [x, y] of [[-0.2, 0.27], [0.2, 0.27], [0.08, 0.66]]) { const k = mesh(new THREE.SphereGeometry(0.03, 20, 14), met); k.position.set(x, y, 0.235); g.add(k); }
    return g;
  };

  /* ---------- staging ---------- */
  let snapR = null;
  const envFor = r => { const pm = new THREE.PMREMGenerator(r); const e = pm.fromScene(new RoomEnvironment(r), 0.04).texture; pm.dispose(); return e; };
  F.envIntensity = (scene, v) => scene.traverse(o => { if (o.isMesh && o.material && 'envMapIntensity' in o.material) o.material.envMapIntensity = v; });

  F.stage = (canvas, { w, h, fov = 30, exposure = 1, shadows = true } = {}) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure; renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(); scene.environment = envFor(renderer);
    const camera = new THREE.PerspectiveCamera(fov, w / h, 0.05, 100);
    const st = { renderer, scene, camera, w, h, tick: [], first: true, env: 0.6 };
    F.expect(1);
    st.start = () => {
      F.envIntensity(scene, st.env);
      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        const t = clock.getElapsedTime();
        st.tick.forEach(f => f(t));
        renderer.render(scene, camera);
        if (st.first) { st.first = false; F.envIntensity(scene, st.env); requestAnimationFrame(() => F.done()); }
      });
    };
    st.project = (v) => { camera.updateMatrixWorld(); const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * w, y: (1 - p.y) / 2 * h }; };
    return st;
  };

  F.spot = (scene, { pos = [1.5, 4, 2], target = [0, 0.4, 0], intensity = 60, angle = 0.42, color = '#fff1dc', shadow = true, size = 1024 } = {}) => {
    const l = new THREE.SpotLight(color, intensity, 0, angle, 0.65, 1.6);
    l.position.set(...pos); l.target.position.set(...target); scene.add(l, l.target);
    if (shadow) { l.castShadow = true; l.shadow.mapSize.set(size, size); l.shadow.bias = -0.0008; l.shadow.normalBias = 0.02; l.shadow.radius = 6; l.shadow.camera.near = 0.5; l.shadow.camera.far = 20; }
    return l;
  };
  F.rim = (scene, pos = [-3, 2.5, -3], color = '#ffd9a8', intensity = 3) => { const l = new THREE.DirectionalLight(color, intensity); l.position.set(...pos); scene.add(l); return l; };

  F.shadowFloor = (scene, size = 12, opacity = 0.4) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity })); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; scene.add(m); return m; };
  F.blob = (rx = 1, rz = 1, opacity = 0.55) => {
    const c = cv(256, 256, (x) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, `rgba(0,0,0,${opacity})`); g.addColorStop(0.5, `rgba(0,0,0,${opacity * 0.45})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(rx * 2, rz * 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.002; m.renderOrder = 1; return m;
  };
  // volumetric light cone
  F.beam = ({ top = [0, 4, 0], height = 4, radius = 1.4, color = '#ffe2b8', opacity = 0.22 } = {}) => {
    const geo = new THREE.CylinderGeometry(0.06, radius, height, 64, 1, true);
    const mat = new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(color) }, o: { value: opacity } },
      vertexShader: 'varying vec2 vUv;varying float vF;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vec3 n=normalize(normalMatrix*normal);vF=abs(dot(n,normalize(-mv.xyz)));gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'uniform vec3 c;uniform float o;varying vec2 vUv;varying float vF;void main(){float a=o*pow(vF,2.2)*mix(.25,1.,vUv.y);gl_FragColor=vec4(c*a,a);}',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    const m = new THREE.Mesh(geo, mat); m.position.set(top[0], top[1] - height / 2, top[2]); m.renderOrder = 5; return m;
  };
  F.dust = ({ n = 420, r = 1.3, y0 = 0.1, y1 = 3.5, color = '#ffe7c4', size = 0.018, seed = 3 } = {}) => {
    const R = rng(seed), pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const y = y0 + R() * (y1 - y0), rad = Math.sqrt(R()) * r * (1 - (y - y0) / (y1 - y0) * 0.7), a = R() * 6.283; pos.set([Math.cos(a) * rad, y, Math.sin(a) * rad], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const sprite = new THREE.CanvasTexture(cv(64, 64, x => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: sprite, color, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    p.userData.base = pos.slice(); return p;
  };
  F.driftDust = (p, t) => { const a = p.geometry.attributes.position, b = p.userData.base; for (let i = 0; i < a.count; i++) { a.array[i * 3 + 1] = b[i * 3 + 1] + Math.sin(t * 0.4 + i) * 0.05; a.array[i * 3] = b[i * 3] + Math.sin(t * 0.25 + i * 1.7) * 0.03; } a.needsUpdate = true; };

  F.plinth = ({ r = 1, h = 0.6, mat, trim } = {}) => {
    const g = new THREE.Group();
    const body = mesh(new THREE.CylinderGeometry(r, r, h, 96), mat || F.plaster('#e9e2d6', [3, 1])); body.position.y = -h / 2; g.add(body);
    if (trim !== false) { const t = mesh(new THREE.TorusGeometry(r, 0.008, 8, 160), trim || F.metal('brass')); t.rotation.x = Math.PI / 2; t.position.y = -0.03; g.add(t); }
    return g;
  };

  // Render a piece once to a PNG data URL (gallery thumbnails, cart items, material spheres)
  F.snap = (build, { w = 560, h = 680, cam = [2.2, 1.5, 3.2], target = [0, 0.4, 0], fov = 26, exposure = 1.05, key = [2, 4.5, 3], floor = true, env = 0.7, rim = '#ffd2a0', fit = 0, drop = 0.22 } = {}) => {
    if (!snapR) {
      snapR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      snapR.setPixelRatio(1); snapR.toneMapping = THREE.ACESFilmicToneMapping; snapR.outputColorSpace = THREE.SRGBColorSpace;
      snapR.shadowMap.enabled = true; snapR.shadowMap.type = THREE.PCFSoftShadowMap; snapR.userData = { env: envFor(snapR) };
    }
    snapR.setSize(w, h, false); snapR.toneMappingExposure = exposure; snapR.setClearColor(0x000000, 0);
    const scene = new THREE.Scene(); scene.environment = snapR.userData.env;
    const camera = new THREE.PerspectiveCamera(fov, w / h, 0.05, 50); camera.position.set(...cam); camera.lookAt(...target);
    const obj = build(); scene.add(obj);
    if (fit) {
      const sph = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere());
      const vf = fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * w / h), d = sph.radius * fit / Math.sin(Math.min(vf, hf));
      camera.position.copy(sph.center).addScaledVector(new THREE.Vector3(...cam).normalize(), d);
      target = [sph.center.x, sph.center.y - sph.radius * drop, sph.center.z]; camera.lookAt(...target);
      key = [target[0] + 2, target[1] + 4.5, target[2] + 3];
    }
    F.spot(scene, { pos: key, target, intensity: 70, angle: 0.5, size: 1024 });
    F.rim(scene, [-3, 2.5, -2.5], rim, 2.5);
    if (floor) { F.shadowFloor(scene, 10, 0.32); scene.add(F.blob(1.1, 0.8, 0.45)); }
    F.envIntensity(scene, env);
    snapR.render(scene, camera);
    const url = snapR.domElement.toDataURL('image/png');
    scene.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    return url;
  };

  return F;
};
