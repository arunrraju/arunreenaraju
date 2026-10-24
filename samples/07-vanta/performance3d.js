// Telemetry: the Nordhalle Ring as a 3D ribbon with a speed wall (height = km/h), sector-coloured kerbs,
// Σ1 itself at T14 and the ghost lap marker.
Promise.all([loadV3(), document.fonts.ready]).then(([V]) => {
  const { THREE } = V;
  const el = document.getElementById('trk3d');
  const S = V.stage(el, { w: 820, h: 640, fov: 30, pos: [-0.6, 13.5, 22.5], target: [-1.1, 0.9, 0.6], bloom: [.55, .35, 2.4] });
  S.scene.environment = V.studioEnv(S.renderer, { k: .6 });
  V.studioLights(S.scene, { key: .6 });

  // centreline from the circuit drawing (svg units -> metres), with gentle elevation
  const TP = 'M140,450 L440,470 C540,478 600,440 580,384 C562,334 470,330 450,276 C430,220 480,170 550,170 L630,170 C700,170 720,124 688,92 C656,60 560,70 470,80 L280,100 C200,108 168,154 210,196 C250,236 240,280 176,292 C110,304 70,348 82,398 C92,440 112,448 140,450 Z';
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', TP);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.style.cssText = 'position:absolute;width:0;height:0'; svg.appendChild(p); document.body.appendChild(svg);
  const L = p.getTotalLength(), N = 420, pts = [];
  for (let i = 0; i < N; i++) {
    const q = p.getPointAtLength(i / N * L), u = i / N;
    pts.push(new THREE.Vector3((q.x - 395) / 40, .35 + .9 * Math.sin(u * Math.PI * 2 * 2 + .6) * .5 + .4 * Math.sin(u * Math.PI * 6), (q.y - 268) / 40));
  }
  svg.remove();
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  // speed model (same corners as the trace below)
  const CN = [[0.02, 170], [0.13, 96], [0.2, 142], [0.31, 118], [0.42, 210], [0.5, 84], [0.58, 160], [0.7, 251], [0.77, 128], [0.86, 104], [0.97, 150]];
  const speed = x => { let v = 334; CN.forEach(([c, m]) => { const d = x - c; v = Math.min(v, m + (d > 0 ? 520 : 900) * Math.sqrt(Math.abs(d)) * (d > 0 ? 1 : 1.4)); }); return Math.min(v, 334 - 6 * Math.sin(x * 40)); };
  const sectorCol = u => u < .33 ? new THREE.Color('#00e5ff') : u < .67 ? new THREE.Color('#ff2bd6') : new THREE.Color('#eef6ff');

  const M = 700, W = .32, up = new THREE.Vector3(0, 1, 0);
  const road = [], roadIdx = [], wall = [], wallCol = [], wallIdx = [];
  const frames = [];
  for (let i = 0; i <= M; i++) {
    const u = i / M, c = curve.getPointAt(u % 1), t = curve.getTangentAt(u % 1), n = new THREE.Vector3().crossVectors(up, t).normalize();
    frames.push({ c, n, t });
    const a = c.clone().addScaledVector(n, W), b = c.clone().addScaledVector(n, -W);
    road.push(a.x, a.y, a.z, b.x, b.y, b.z);
    const h = speed(u) / 334 * 1.1, col = sectorCol(u).multiplyScalar(.35 + speed(u) / 334 * .9);
    wall.push(c.x, c.y + .02, c.z, c.x, c.y + .02 + h, c.z);
    wallCol.push(col.r, col.g, col.b, 0, 0, 0);
    if (i < M) { const k = i * 2; roadIdx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); wallIdx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(road, 3)); rg.setIndex(roadIdx); rg.computeVertexNormals();
  const track = new THREE.Group(); S.scene.add(track);
  track.add(new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: '#0d1119', roughness: .55, metalness: .3, side: THREE.DoubleSide })));
  // speed wall: additive gradient curtain
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wall, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(wallCol, 3)); wg.setIndex(wallIdx);
  track.add(new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .42, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
  // top edge of the wall + kerb lines, coloured per sector
  for (const [u0, u1] of [[0, .33], [.33, .67], [.67, 1]]) {
    const edge = [], kl = [], kr = [];
    for (let i = Math.round(u0 * M); i <= Math.round(u1 * M); i++) {
      const f = frames[i], u = i / M;
      edge.push(f.c.clone().setY(f.c.y + .02 + speed(u) / 334 * 1.1));
      kl.push(f.c.clone().addScaledVector(f.n, W + .02).setY(f.c.y + .02)); kr.push(f.c.clone().addScaledVector(f.n, -W - .02).setY(f.c.y + .02));
    }
    const col = sectorCol((u0 + u1) / 2).getStyle();
    track.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge), 260, .02, 5), V.glowMat(col, 2.4)));
    track.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(kl), 260, .014, 4), V.glowMat(col, 1.4)));
    track.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(kr), 260, .014, 4), V.glowMat(col, 1.4)));
  }
  // supports under the elevated ribbon (pylons) + ground grid
  const pyl = new THREE.InstancedMesh(new THREE.CylinderGeometry(.025, .025, 1, 6), new THREE.MeshStandardMaterial({ color: '#1a2433', metalness: .6, roughness: .4 }), 70), m4 = new THREE.Matrix4();
  for (let i = 0; i < 70; i++) { const f = frames[Math.round(i / 70 * M)], h = f.c.y + .9; m4.compose(new THREE.Vector3(f.c.x, f.c.y - h / 2, f.c.z), new THREE.Quaternion(), new THREE.Vector3(1, h, 1)); pyl.setMatrixAt(i, m4); }
  track.add(pyl);
  const grid = new THREE.GridHelper(40, 80, '#0f3644', '#0a1d28'); grid.position.y = -.9; S.scene.add(grid);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshBasicMaterial({ color: '#00e5ff', transparent: true, opacity: .05, depthWrite: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = -.89; // (no glow disc)
  // start/finish gantry
  const sf = frames[Math.round(.06 * M)], gantry = new THREE.Group(); gantry.position.copy(sf.c); gantry.lookAt(sf.c.clone().add(sf.t)); track.add(gantry);
  for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(.03, .7, .03), V.glowMat('#ffffff', 1.5)); post.position.set(s * .42, .35, 0); gantry.add(post); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(.9, .05, .03), V.glowMat('#ffffff', 2)); beam.position.y = .7; gantry.add(beam);

  // Σ1 at T14 and the ghost
  const carU = .70, ghostU = .675;
  const mini = V.buildCar({ paint: 'cyan', rim: 'forged' }); mini.group.scale.setScalar(.2); track.add(mini.group);
  const place = (obj, u, lift = 0) => { const c = curve.getPointAt(u), t = curve.getTangentAt(u); obj.position.copy(c).setY(c.y + lift); obj.lookAt(c.clone().add(t).setY(c.y + lift)); obj.rotateY(-Math.PI / 2); };
  place(mini.group, carU, .005);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.5, .55, 48), V.glowMat('#00e5ff', 3)); halo.rotation.x = -Math.PI / 2; track.add(halo);
  const ghost = new THREE.Mesh(new THREE.SphereGeometry(.09, 20, 14), V.glowMat('#ff2bd6', 3)); track.add(ghost);
  const beamUp = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, 1.5, 6), V.glowMat('#00e5ff', 2)); track.add(beamUp);

  // DOM labels projected from 3D
  const labs = document.getElementById('tlabs'), host = el.getBoundingClientRect();
  const turns = [[.12, 'T1'], [.19, 'T2'], [.3, 'T4'], [.45, 'T7'], [.55, 'T9'], [.66, 'T12'], [.72, 'T14'], [.86, 'T19']];
  labs.innerHTML = turns.map(([, n]) => `<span class="tlab" data-n="${n}">${n}</span>`).join('') + '<span class="tlab sf">START / FINISH</span><span class="tlab car">T14 · CAR 047<b>297 km/h · 1.8 g</b></span>';
  const v = new THREE.Vector3();
  const proj = (vec) => { v.copy(vec).project(S.camera); return [(v.x + 1) / 2 * S.w, (1 - v.y) / 2 * S.h]; };
  const pin = () => {
    labs.querySelectorAll('[data-n]').forEach((e, i) => { const f = frames[Math.round(turns[i][0] * M)]; const [x, y] = proj(f.c.clone().addScaledVector(f.n, .75)); e.style.left = x + 'px'; e.style.top = y + 'px'; });
    const [sx, sy] = proj(sf.c.clone().setY(sf.c.y - .35)); const s = labs.querySelector('.sf'); s.style.left = sx + 'px'; s.style.top = (sy + 22) + 'px';
    const c = curve.getPointAt(carU); const [cx, cy] = proj(c.clone().setY(c.y + 1.5)); const cl = labs.querySelector('.car'); cl.style.left = cx + 'px'; cl.style.top = cy + 'px';
  };
  S.animate(t => {
    const u = (ghostU + t * .01) % 1, g = curve.getPointAt(u); ghost.position.copy(g).setY(g.y + .12);
    const c = curve.getPointAt(carU); halo.position.copy(c).setY(c.y + .01); halo.scale.setScalar(1 + .15 * Math.sin(t * 3));
    beamUp.position.copy(c).setY(c.y + .75);
    mini.spin(t * 20);
    track.rotation.y = Math.sin(t * .1) * .05;
    pin();
  }, { pose: 0, frames: 3 });
});
