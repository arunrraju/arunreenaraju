// KEYFORM shared WebGL kit: stage (renderer + light), procedural 75% keyboard, giant switch.
window.KF3D = function (THREE, RoomEnvironment, mergeGeometries) {

const COLORWAYS = {
  paper:    { name: 'Paper',      alpha: '#f4f2ec', mod: '#cfccc3', acc: '#ff5a1f', acc2: '#cbc3ff', la: '#2b2b2b', lm: '#2b2b2b', lacc: '#fff4ec', lacc2: '#2b2b2b' },
  signal:   { name: 'Signal',     alpha: '#3a3a37', mod: '#5e5d58', acc: '#ff5a1f', acc2: '#efede8', la: '#efede8', lm: '#ffb08f', lacc: '#2b2b2b', lacc2: '#2b2b2b' },
  lilac:    { name: 'Lilac Haze', alpha: '#efecff', mod: '#cbc3ff', acc: '#ff5a1f', acc2: '#8d82ea', la: '#3b3570', lm: '#3b3570', lacc: '#ffffff', lacc2: '#ffffff' },
  retro:    { name: 'Retro 84',   alpha: '#ebe2cd', mod: '#a19c90', acc: '#e0532c', acc2: '#5e8f86', la: '#3a352c', lm: '#f6f1e4', lacc: '#ffffff', lacc2: '#ffffff' },
  graphite: { name: 'Graphite',   alpha: '#4b4b49', mod: '#2f2f2e', acc: '#cbc3ff', acc2: '#ff5a1f', la: '#ecebe5', lm: '#b9b6ae', lacc: '#2b2b2b', lacc2: '#ffffff' }
};
const CASES = {
  silver:   { name: 'Raw Silver',    c: '#e4e2de', m: 0.85, r: 0.36 },
  graphite: { name: 'Graphite',      c: '#4a4a4d', m: 0.8, r: 0.4 },
  orange:   { name: 'Safety Orange', c: '#ff5a1f', m: 0.7, r: 0.32 },
  lilac:    { name: 'Lilac',         c: '#bdb4f7', m: 0.7, r: 0.32 },
  paper:    { name: 'Paper White',   c: '#ebe8e1', m: 0.12, r: 0.5 }
};

/* ---------- stage ---------- */
function stage(canvas, { w, h, fov = 30, pos = [0, 12, 16], target = [0, 0, 0], exposure = 1.0, shadows = true, env = 0.85 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environmentIntensity = env; // r160 ignores, materials use envMapIntensity
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 300);
  camera.position.set(...pos);
  const tgt = new THREE.Vector3(...target);
  camera.lookAt(tgt);
  const key = new THREE.DirectionalLight(0xfff0e0, 2.4);
  key.position.set(-7, 16, 9);
  if (shadows) {
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -13, right: 13, top: 11, bottom: -11, near: 1, far: 50 });
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 5;
  }
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd9d3ff, 1.6); rim.position.set(9, 7, -12); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(10, 4, 10); scene.add(fill);
  let frames = 0;
  return {
    renderer, scene, camera, key, rim, target: tgt,
    loop(fn) {
      const t0 = performance.now();
      const tick = () => {
        const t = (performance.now() - t0) / 1000;
        fn && fn(t);
        renderer.render(scene, camera);
        if (++frames === 2) window.__ready3d = true;
        requestAnimationFrame(tick);
      };
      tick();
    }
  };
}

/* soft contact shadow + real shadow catcher */
function ground(scene, { sx = 26, sz = 13, y = -0.02, strength = 0.5, catcher = 0.16 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, `rgba(40,36,32,${strength})`); gr.addColorStop(0.45, `rgba(40,36,32,${strength * 0.45})`); gr.addColorStop(1, 'rgba(40,36,32,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false }));
  blob.rotation.x = -Math.PI / 2; blob.scale.set(sx, sz, 1); blob.position.y = y; blob.renderOrder = -1;
  scene.add(blob);
  let shadow = null;
  if (catcher) {
    shadow = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: catcher }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = y + 0.005; shadow.receiveShadow = true; scene.add(shadow);
  }
  return { blob, shadow };
}

/* ---------- keycap geometry: lofted rounded-rect rings, sculpted sides, dished top ---------- */
function rrPoint(w, d, r, i, cs) {
  const c = Math.floor(i / (cs + 1)), j = i % (cs + 1);
  const a = (c + j / cs) * Math.PI / 2;
  const sx = (c === 0 || c === 3) ? 1 : -1, sz = (c === 0 || c === 1) ? 1 : -1;
  return [sx * (w / 2 - r) + r * Math.cos(a), sz * (d / 2 - r) + r * Math.sin(a)];
}
function capGeo(wu, { H = 0.48, cs = 5 } = {}) {
  const bw = wu - 0.07, bd = 0.93, tw = wu - 0.31, td = 0.7, rb = 0.07, rt = 0.11, dish = 0.04, back = 0.04;
  const P = 4 * (cs + 1);
  const rings = [];
  // sculpted sides (slight convex bulge)
  [0, 0.22, 0.45, 0.68, 0.86, 0.96].forEach(t => {
    const e = 1 - Math.pow(1 - t, 1.35);
    rings.push({ w: bw + (tw + 0.02 - bw) * e, d: bd + (td + 0.02 - bd) * e, r: rb + (rt - rb) * e, y: t * (H - 0.035), z: -back * e, top: 0 });
  });
  rings.push({ w: tw + 0.008, d: td + 0.008, r: rt, y: H - 0.012, z: -back, top: 1 }); // fillet
  [0.96, 0.82, 0.64, 0.45, 0.25, 0.08].forEach(k => {
    rings.push({ w: tw * k, d: td * k, r: Math.max(rt * k, 0.004), y: H - dish * (1 - k * k), z: -back, top: 1 });
  });
  const pos = [], kuv = [], ktop = [], idx = [];
  rings.forEach(R => {
    for (let i = 0; i < P; i++) {
      const [x, z] = rrPoint(R.w, R.d, R.r, i, cs);
      pos.push(x, R.y, z + R.z);
      kuv.push((x + tw / 2) / td, (z + td / 2) / td);
      ktop.push(R.top);
    }
  });
  // centre point
  const ci = pos.length / 3; pos.push(0, H - dish, -back); kuv.push(tw / 2 / td, 0.5); ktop.push(1);
  for (let a = 0; a < rings.length - 1; a++) for (let i = 0; i < P; i++) {
    const i2 = (i + 1) % P, A = a * P + i, B = a * P + i2, C = (a + 1) * P + i2, D = (a + 1) * P + i;
    idx.push(A, C, B, A, D, C);
  }
  const last = (rings.length - 1) * P;
  for (let i = 0; i < P; i++) idx.push(last + i, ci, last + (i + 1) % P);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('kuv', new THREE.Float32BufferAttribute(kuv, 2));
  g.setAttribute('ktop', new THREE.Float32BufferAttribute(ktop, 1));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/* legend-aware keycap material (PBT: matte, a touch of sheen) */
function capMaterial(atlas) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.52, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.6, sheen: 0.35, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffffff'), envMapIntensity: 0.9 });
  m.onBeforeCompile = s => {
    s.uniforms.legAtlas = { value: atlas };
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>
attribute vec2 kuv; attribute float ktop; attribute float legIdx; attribute vec3 legCol;
varying vec2 vKuv; varying float vKtop; varying float vLeg; varying vec3 vLegCol;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vKuv = kuv; vKtop = ktop; vLeg = legIdx; vLegCol = legCol;`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D legAtlas; varying vec2 vKuv; varying float vKtop; varying float vLeg; varying vec3 vLegCol;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
if (vKtop > 0.5 && vLeg > -0.5 && vKuv.x > 0.0 && vKuv.x < 1.0 && vKuv.y > 0.0 && vKuv.y < 1.0) {
  float lc = mod(floor(vLeg + 0.5), 16.0); float lr = floor((floor(vLeg + 0.5)) / 16.0);
  vec2 luv = vec2((lc + vKuv.x) / 16.0, 1.0 - (lr + vKuv.y) / 16.0);
  float la = texture2D(legAtlas, luv).a;
  diffuseColor.rgb = mix(diffuseColor.rgb, vLegCol, la);
}`);
  };
  m.customProgramCacheKey = () => 'kfcap';
  return m;
}

/* ---------- 75% layout ---------- */
const A = 'alpha', M = 'mod', X = 'acc', Y = 'acc2', S = 'space';
const ROWS = [
  [['esc', 1, X], ['F1', 1, A], ['F2', 1, A], ['F3', 1, A], ['F4', 1, A], ['F5', 1, M], ['F6', 1, M], ['F7', 1, M], ['F8', 1, M], ['F9', 1, A], ['F10', 1, A], ['F11', 1, A], ['F12', 1, A], ['prt', 1, M], ['del', 1, M], ['KNOB', 1, 'knob']],
  [['~', 1, A], ['1', 1, A], ['2', 1, A], ['3', 1, A], ['4', 1, A], ['5', 1, A], ['6', 1, A], ['7', 1, A], ['8', 1, A], ['9', 1, A], ['0', 1, A], ['-', 1, A], ['=', 1, A], ['delete', 2, M], ['home', 1, M]],
  [['tab', 1.5, M], ['Q', 1, A], ['W', 1, A], ['E', 1, A], ['R', 1, A], ['T', 1, A], ['Y', 1, A], ['U', 1, A], ['I', 1, A], ['O', 1, A], ['P', 1, A], ['[', 1, A], [']', 1, A], ['\\', 1.5, A], ['pg up', 1, M]],
  [['caps', 1.75, M], ['A', 1, A], ['S', 1, A], ['D', 1, A], ['F', 1, A], ['G', 1, A], ['H', 1, A], ['J', 1, A], ['K', 1, A], ['L', 1, A], [';', 1, A], ["'", 1, A], ['enter', 2.25, X], ['pg dn', 1, M]],
  [['shift', 2.25, M], ['Z', 1, A], ['X', 1, A], ['C', 1, A], ['V', 1, A], ['B', 1, A], ['N', 1, A], ['M', 1, A], [',', 1, A], ['.', 1, A], ['/', 1, A], ['shift', 1.75, M], ['↑', 1, Y], ['end', 1, M]],
  [['ctrl', 1.25, M], ['opt', 1.25, M], ['cmd', 1.25, M], ['', 6.25, S], ['cmd', 1, M], ['fn', 1, M], ['ctrl', 1, M], ['←', 1, Y], ['↓', 1, Y], ['→', 1, Y]]
];
function layout() {
  const keys = [];
  ROWS.forEach((row, r) => {
    let x = -8;
    const z = r === 0 ? -2.6 : -3.1 + 0.2 + r + 0.5;
    row.forEach(([label, w, role]) => { keys.push({ label, w, role, x: x + w / 2, z, row: r }); x += w; });
  });
  return keys;
}

function drawLegend(g, cx, cy, k) {
  const C = 128, L = k.label;
  g.save(); g.translate(cx, cy);
  if (k.role === S || k.role === 'knob' || !L) { g.restore(); return; }
  g.fillStyle = '#fff';
  if (k.role === Y && /[←↑→↓]/.test(L)) { g.font = '600 50px "JetBrains Mono"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L, C / 2, C / 2 + 2); }
  else if (L.length === 1 || /^F\d/.test(L)) {
    g.font = (L.length > 1 ? '700 36px' : '700 56px') + ' "JetBrains Mono"'; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText(L, 20, 14);
  } else if (L === 'esc') {
    g.font = '700 38px "Space Grotesk"'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('esc', 18, 16);
    g.beginPath(); g.arc(100, 100, 7, 0, Math.PI * 2); g.fill();
  } else if (L === 'enter') {
    g.font = '700 32px "Space Grotesk"'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('enter ↵', 16, 108);
  } else {
    g.font = '700 30px "Space Grotesk"'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(L, 16, 108);
  }
  g.restore();
}

/* ---------- keyboard ---------- */
async function buildBoard({ colorway = 'paper', caseColor = 'silver', loose = [], hold = {} } = {}) {
  try { await Promise.all(['600 40px "JetBrains Mono"', '700 40px "Space Grotesk"', '600 40px "Space Grotesk"'].map(f => document.fonts.load(f))); } catch (e) {}
  const root = new THREE.Group();
  const layers = [];
  const mk = name => { const g = new THREE.Group(); g.name = name; root.add(g); layers.push(g); return g; };
  const Lcase = mk('case'), Lfoam = mk('foam'), Lpcb = mk('pcb'), Lplate = mk('plate'), Lsw = mk('switches'), Lcaps = mk('keycaps');

  const keys = layout().filter(k => k.role !== 'knob');
  const knobSlot = layout().find(k => k.role === 'knob');
  const looseKeys = loose.map(l => ({ label: l.label, w: 1, role: l.role || A, loose: l }));
  const all = [...keys, ...looseKeys];

  // legend atlas
  const atlasC = document.createElement('canvas'); atlasC.width = atlasC.height = 2048;
  const ag = atlasC.getContext('2d');
  all.forEach((k, i) => { k.cell = i; drawLegend(ag, (i % 16) * 128, Math.floor(i / 16) * 128, k); });
  const atlas = new THREE.CanvasTexture(atlasC); atlas.anisotropy = 8;
  const capMat = capMaterial(atlas);

  // ----- case: bevelled extruded tray -----
  const caseMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.3, clearcoat: 0.35, clearcoatRoughness: 0.35, envMapIntensity: 1.6 });
  const rr = (w, d, r, P = THREE.Shape) => {
    const s = new P(), x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
    s.lineTo(x + w, y + d - r); s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2);
    s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI);
    s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    return s;
  };
  const bev = 0.1;
  const outer = rr(16.9 - 2 * bev, 7.1 - 2 * bev, 0.42);
  outer.holes.push(rr(16.15 + 2 * bev, 6.35 + 2 * bev, 0.12 + bev, THREE.Path));
  const wallG = new THREE.ExtrudeGeometry(outer, { depth: 1.05, bevelEnabled: true, bevelThickness: 0.09, bevelSize: bev, bevelSegments: 5, curveSegments: 10 });
  wallG.rotateX(-Math.PI / 2); wallG.translate(0, 0.09, 0);
  const walls = new THREE.Mesh(wallG, caseMat); walls.castShadow = walls.receiveShadow = true; Lcase.add(walls);
  const floorG = new THREE.ExtrudeGeometry(rr(16.4, 6.6, 0.2), { depth: 0.3, bevelEnabled: false });
  floorG.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorG, caseMat); floor.receiveShadow = true; Lcase.add(floor);
  // orange anodised badge bar + engraved wordmark on the front face
  const badge = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.06), new THREE.MeshPhysicalMaterial({ color: '#ff5a1f', metalness: 0.6, roughness: 0.3, clearcoat: 0.6 }));
  badge.position.set(6.6, 0.6, 3.56); Lcase.add(badge);
  const dc = document.createElement('canvas'); dc.width = 1024; dc.height = 64;
  const dg = dc.getContext('2d'); dg.fillStyle = 'rgba(30,30,30,.55)'; dg.font = '700 40px "Space Grotesk"'; dg.textBaseline = 'middle';
  dg.fillText('KEYFORM', 6, 34); dg.font = '500 26px "JetBrains Mono"'; dg.fillText('KF—75 / 6063-T6 / BATCH 07', 250, 35);
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.4), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(dc), transparent: true, metalness: 0.4, roughness: 0.6, depthWrite: false }));
  decal.position.set(-4.7, 0.6, 3.547); Lcase.add(decal);

  // ----- foam (lilac poron) -----
  const foam = new THREE.Mesh(new THREE.BoxGeometry(16.05, 0.12, 6.28), new THREE.MeshStandardMaterial({ color: '#cbc3ff', roughness: 0.95 }));
  foam.position.y = 0.38; foam.receiveShadow = true; Lfoam.add(foam);

  // ----- PCB with pads + traces -----
  const pc = document.createElement('canvas'); pc.width = 2048; pc.height = 800;
  const pg = pc.getContext('2d'); pg.fillStyle = '#26282a'; pg.fillRect(0, 0, 2048, 800);
  const U = 2048 / 16;
  pg.strokeStyle = 'rgba(255,170,90,.28)'; pg.lineWidth = 3;
  for (let i = 0; i < 46; i++) { const y = 30 + i * 16.5; pg.beginPath(); pg.moveTo(0, y); for (let x = 0; x < 2048; x += 180) pg.lineTo(x + 90, y + ((x / 180) % 2 ? 10 : -10)); pg.stroke(); }
  keys.forEach(k => {
    const px = (k.x + 8) * U, py = (k.z + 3.1) / 6.2 * 800;
    pg.fillStyle = '#d9b26a'; pg.beginPath(); pg.arc(px - 18, py - 14, 9, 0, 7); pg.arc(px + 24, py - 6, 9, 0, 7); pg.fill();
    pg.strokeStyle = '#d9b26a'; pg.lineWidth = 3; pg.strokeRect(px - 34, py - 34, 68, 68);
    pg.fillStyle = '#efede8'; pg.beginPath(); pg.arc(px, py + 18, 4, 0, 7); pg.fill();
  });
  pg.fillStyle = 'rgba(239,237,232,.7)'; pg.font = '600 22px "JetBrains Mono"'; pg.fillText('KF75-HS REV.C  ·  5-PIN HOT-SWAP  ·  QMK/VIA  ·  MADE IN EU', 40, 785);
  const pcbTex = new THREE.CanvasTexture(pc); pcbTex.colorSpace = THREE.SRGBColorSpace; pcbTex.anisotropy = 8;
  const pcbM = new THREE.MeshStandardMaterial({ map: pcbTex, roughness: 0.55, metalness: 0.2 });
  const pcbSide = new THREE.MeshStandardMaterial({ color: '#26282a', roughness: 0.6 });
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(16, 0.08, 6.2), [pcbSide, pcbSide, pcbM, pcbSide, pcbSide, pcbSide]);
  pcb.position.y = 0.52; pcb.castShadow = pcb.receiveShadow = true; Lpcb.add(pcb);

  // ----- plate: brass with 14 mm switch cut-outs + gasket tabs -----
  const plateS = rr(16.05, 6.25, 0.1);
  keys.forEach(k => { const h = new THREE.Path(), s = 0.37; h.moveTo(k.x - s, -k.z - s); h.lineTo(k.x + s, -k.z - s); h.lineTo(k.x + s, -k.z + s); h.lineTo(k.x - s, -k.z + s); h.lineTo(k.x - s, -k.z - s); plateS.holes.push(h); });
  const plateG = new THREE.ExtrudeGeometry(plateS, { depth: 0.07, bevelEnabled: false, curveSegments: 4 });
  plateG.rotateX(-Math.PI / 2);
  const brass = new THREE.MeshPhysicalMaterial({ color: '#e8c27a', metalness: 0.75, roughness: 0.3, clearcoat: 0.4, envMapIntensity: 1.6 });
  const plate = new THREE.Mesh(plateG, brass); plate.position.y = 0.78; plate.castShadow = plate.receiveShadow = true; Lplate.add(plate);
  const gasketM = new THREE.MeshStandardMaterial({ color: '#ff8a5c', roughness: 0.9 });
  [[-6, -3.18], [-2, -3.18], [2, -3.18], [6, -3.18], [-6, 3.18], [-2, 3.18], [2, 3.18], [6, 3.18]].forEach(([x, z]) => {
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.2), gasketM); g.position.set(x, 0.815, z); Lplate.add(g);
  });

  // ----- switches (instanced housing + stem) -----
  const housingG = mergeGeometries([
    new THREE.BoxGeometry(0.6, 0.26, 0.6).translate(0, -0.13, 0),
    new THREE.CylinderGeometry(0.27, 0.3, 0.17, 4, 1).rotateY(Math.PI / 4).translate(0, 0.085, 0),
    new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8).translate(-0.12, -0.32, -0.1),
    new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8).translate(0.14, -0.32, -0.02)
  ]);
  const stemG = mergeGeometries([new THREE.BoxGeometry(0.17, 0.2, 0.055), new THREE.BoxGeometry(0.055, 0.2, 0.17), new THREE.BoxGeometry(0.27, 0.07, 0.22).translate(0, -0.11, 0)]);
  const housing = new THREE.InstancedMesh(housingG, new THREE.MeshPhysicalMaterial({ color: '#f1efe9', roughness: 0.25, metalness: 0, clearcoat: 0.5, transparent: true, opacity: 0.92 }), keys.length);
  const stems = new THREE.InstancedMesh(stemG, new THREE.MeshPhysicalMaterial({ color: '#ff5a1f', roughness: 0.35, clearcoat: 0.4 }), keys.length);
  housing.castShadow = stems.castShadow = true;
  const mm = new THREE.Matrix4();
  keys.forEach((k, i) => { mm.makeTranslation(k.x, 0.98, k.z); housing.setMatrixAt(i, mm); mm.makeTranslation(k.x, 1.2, k.z); stems.setMatrixAt(i, mm); });
  Lsw.add(housing, stems);

  // ----- keycaps (instanced per unit width) -----
  const CAP_Y = 1.13;
  const meshes = [];
  const groupBy = (list, parent) => {
    const by = {};
    list.forEach(k => (by[k.w] ??= []).push(k));
    Object.entries(by).forEach(([w, ks]) => {
      const g = capGeo(+w), n = ks.length;
      const li = new Float32Array(n), lc = new Float32Array(n * 3);
      ks.forEach((k, j) => { li[j] = k.label ? k.cell : -1; k.j = j; });
      g.setAttribute('legIdx', new THREE.InstancedBufferAttribute(li, 1));
      g.setAttribute('legCol', new THREE.InstancedBufferAttribute(lc, 3));
      const im = new THREE.InstancedMesh(g, capMat, n);
      im.castShadow = im.receiveShadow = true;
      ks.forEach(k => k.mesh = im);
      parent.add(im); meshes.push(im);
    });
  };
  groupBy(keys, Lcaps);
  const looseGroup = new THREE.Group(); root.add(looseGroup);
  if (looseKeys.length) groupBy(looseKeys, looseGroup);

  // knob: knurled anodised cylinder
  const knob = new THREE.Group();
  const knurl = new THREE.CylinderGeometry(0.4, 0.42, 0.62, 60, 1);
  const p = knurl.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z); if (r > 0.3) { const f = 1 + 0.025 * Math.sign(Math.sin(a * 30)); p.setX(i, x * f); p.setZ(i, z * f); } }
  knurl.computeVertexNormals();
  const knobMat = new THREE.MeshPhysicalMaterial({ color: '#ff5a1f', metalness: 0.3, roughness: 0.32, clearcoat: 0.8, envMapIntensity: 1.3 });
  const kb = new THREE.Mesh(knurl, knobMat); kb.castShadow = true; knob.add(kb);
  const kt = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.04, 48), new THREE.MeshPhysicalMaterial({ color: '#ff7a45', metalness: 0.4, roughness: 0.2, clearcoat: 1 })); kt.position.y = 0.33; knob.add(kt);
  const dot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.18), new THREE.MeshBasicMaterial({ color: '#ffffff' })); dot.position.set(0, 0.35, -0.2); knob.add(dot);
  knob.position.set(knobSlot.x, CAP_Y + 0.31, knobSlot.z);
  Lcaps.add(knob);

  // ----- state & api -----
  const tm = new THREE.Matrix4(), tq = new THREE.Quaternion(), te = new THREE.Euler(), ts = new THREE.Vector3(1, 1, 1), tv = new THREE.Vector3();
  const col = new THREE.Color();
  keys.forEach((k, i) => { k.press = hold[k.label] ?? 0; k.hold = hold[k.label]; k.last = -9; k.seed = (i * 7919) % 97 / 97; });
  const api = {
    root, layers, keys, knob, loose: looseKeys, caseMat, explode: 0, layerGap: [0, 1.25, 2.45, 3.7, 4.95, 6.5],
    setColorway(name) {
      const cw = COLORWAYS[name] || name; api.cw = cw;
      all.forEach(k => {
        const role = k.role === S ? 'alpha' : k.role;
        k.mesh.setColorAt(k.j, col.set(cw[role] || cw.alpha));
        const lcol = col.set(role === 'acc' ? cw.lacc : role === 'acc2' ? cw.lacc2 : role === 'mod' ? cw.lm : cw.la);
        const a = k.mesh.geometry.attributes.legCol; a.setXYZ(k.j, lcol.r, lcol.g, lcol.b); a.needsUpdate = true;
      });
      meshes.forEach(m => m.instanceColor.needsUpdate = true);
    },
    setCase(name) {
      const c = CASES[name] || name; api.caseName = name;
      caseMat.color.set(c.c); caseMat.metalness = c.m; caseMat.roughness = c.r;
      knobMat.color.set(name === 'orange' ? '#2f2f2f' : '#ff5a1f');
      badge.material.color.set(name === 'orange' ? '#f4f2ec' : '#ff5a1f');
    },
    setExplode(e) { api.explode = e; layers.forEach((L, i) => L.position.y = api.layerGap[i] * e); },
    seq: 'KEYFORM TYPES LIKE IT WAS MACHINED FOR YOU ',
    update(t, { typing = true } = {}) {
      if (typing) {
        const ci = Math.floor(t * 7.5) % api.seq.length, ch = api.seq[ci];
        if (ci !== api._ci) { api._ci = ci; const k = keys.find(k => ch === ' ' ? k.role === S : k.label === ch); if (k) k.last = t; }
      }
      keys.forEach(k => {
        const p = k.hold !== undefined ? k.hold : Math.max(0, 1 - (t - k.last) / 0.22) ** 0.6;
        k.press = p;
        tv.set(k.x, CAP_Y - Math.max(p, 0) * 0.19, k.z); ts.setScalar(p < 0 ? 0.0001 : 1); tm.compose(tv, tq.identity(), ts); k.mesh.setMatrixAt(k.j, tm); ts.setScalar(1);
      });
      looseKeys.forEach((k, i) => {
        const L = k.loose, f = Math.sin(t * 0.9 + i * 1.7);
        tv.set(L.pos[0], L.pos[1] + f * 0.25, L.pos[2]);
        te.set(L.rot[0] + f * 0.08, L.rot[1] + t * (L.spin || 0), L.rot[2]); tq.setFromEuler(te);
        const sc = L.scale || 1; ts.set(sc, sc, sc);
        tm.compose(tv, tq, ts); k.mesh.setMatrixAt(k.j, tm); ts.set(1, 1, 1);
      });
      knob.rotation.y = t * 0.4;
      meshes.forEach(m => m.instanceMatrix.needsUpdate = true);
    },
    anchor(layer, x = 0, y = 0, z = 0) { const v = new THREE.Vector3(x, y, z); layers[layer].localToWorld(v); return v; }
  };
  api.setColorway(colorway); api.setCase(caseColor); api.update(0, { typing: false });
  return api;
}

/* project a world point to css pixels of a canvas */
function toScreen(v, camera, w, h) {
  const p = v.clone().project(camera);
  return [(p.x * 0.5 + 0.5) * w, (-p.y * 0.5 + 0.5) * h];
}

/* ---------- giant switch, cut in half ---------- */
function buildSwitch({ stem = '#ff5a1f', cut = true } = {}) {
  const root = new THREE.Group();
  const clip = cut ? [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)] : [];
  const parts = {};
  const shell = (w, d, h, t, r) => {
    const rr = (w, d, r, P) => { const s = new P(), x = -w / 2, y = -d / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + d - r); s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2); s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI); s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s; };
    const s = rr(w, d, r, THREE.Shape); s.holes.push(rr(w - 2 * t, d - 2 * t, Math.max(r - t, 0.05), THREE.Path));
    const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3, curveSegments: 8 });
    g.rotateX(-Math.PI / 2); return g;
  };
  const cap = (w, d, t, r) => { const g = new THREE.BoxGeometry(w, t, d); return g; };
  // bottom housing (milky nylon)
  const nylon = new THREE.MeshPhysicalMaterial({ color: '#f3f1ec', roughness: 0.42, clearcoat: 0.3, clippingPlanes: clip, side: THREE.DoubleSide });
  const bottom = new THREE.Group();
  bottom.add(new THREE.Mesh(shell(6, 6, 2.2, 0.35, 0.5), nylon));
  const floor = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.35, 5.6), nylon); floor.position.y = 0.17; bottom.add(floor);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 1.9, 40), nylon); pole.position.y = -0.6; bottom.add(pole);
  const pinM = new THREE.MeshPhysicalMaterial({ color: '#efcd85', metalness: 0.8, roughness: 0.28, clearcoat: 0.5, envMapIntensity: 1.5, clippingPlanes: clip });
  [[-1.6, -1.2], [1.9, -0.4]].forEach(([x, z]) => { const pn = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 2.2, 20), pinM); pn.position.set(x, -0.6, z); bottom.add(pn); });
  bottom.children.forEach(m => { m.castShadow = true; m.receiveShadow = true; });
  root.add(bottom); parts.bottom = bottom;
  // leaf contacts (gold)
  const leaf = new THREE.Group();
  const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.9, 1.3), pinM); l1.position.set(-1.9, 1.2, 1.2); l1.rotation.z = 0.08;
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 1.3), pinM); l2.position.set(-1.55, 1.1, 1.2); l2.rotation.z = -0.12;
  leaf.add(l1, l2); root.add(leaf); parts.leaf = leaf;
  // spring: steel helix
  class Helix extends THREE.Curve { getPoint(t, o = new THREE.Vector3()) { const a = t * Math.PI * 2 * 9; return o.set(Math.cos(a) * 1.0, 0.45 + t * 3.0, Math.sin(a) * 1.0); } }
  const spring = new THREE.Mesh(new THREE.TubeGeometry(new Helix(), 520, 0.09, 10, false), new THREE.MeshPhysicalMaterial({ color: '#cfd2d6', metalness: 1, roughness: 0.18, clippingPlanes: clip }));
  spring.castShadow = true; root.add(spring); parts.spring = spring;
  // stem
  const stemM = new THREE.MeshPhysicalMaterial({ color: stem, roughness: 0.3, clearcoat: 0.6, clippingPlanes: clip, side: THREE.DoubleSide });
  const st = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 2.0), stemM); body.position.y = 2.6;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.6, 40, 1, true), stemM); tube.position.y = 1.9;
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.0, 0.42), stemM); c1.position.y = 4.0;
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.0, 1.25), stemM); c2.position.y = 4.0;
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 1.0), stemM); legs.position.set(-1.25, 1.7, 1.2);
  st.add(body, tube, c1, c2, legs); st.children.forEach(m => m.castShadow = true);
  root.add(st); parts.stem = st;
  // top housing (clear polycarbonate)
  const pcM = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.06, metalness: 0, transmission: 0, transparent: true, opacity: 0.32, clearcoat: 1, clippingPlanes: clip, side: THREE.DoubleSide, depthWrite: false });
  const top = new THREE.Group();
  const ts = new THREE.Mesh(shell(6.05, 6.05, 1.4, 0.3, 0.55), pcM); ts.position.y = 2.25;
  const tl = new THREE.Mesh(cap(6.0, 6.0, 0.3), pcM); tl.position.y = 3.75;
  top.add(ts, tl); root.add(top); parts.top = top;
  // fake "cut face" outlines so the section reads
  return { root, parts };
}

return { THREE, COLORWAYS, CASES, stage, ground, capGeo, layout, buildBoard, toScreen, buildSwitch };
};
