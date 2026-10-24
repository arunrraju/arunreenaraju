// Configurator: the live Σ1 model. Paint swatches, rim cards and camera presets drive the 3D car.
const CFG_PAINTS = [
  ['void', 'Void Black', 'Incl.'], ['cyan', 'Ion Cyan', '+ €42,000'], ['magenta', 'Magenta Flux', '+ €64,000'],
  ['white', 'Arctic Pearl', '+ €38,000'], ['ember', 'Ember', '+ €42,000'], ['violet', 'Ultraviolet', '+ €71,000']
];
const CFG_RIMS = [['blade', 'Blade', 'Incl.'], ['forged', 'Forged Y', '+ €38,500'], ['aero', 'Aero Disc', '+ €16,000']];
const CAMS = { // [position, target, degrees label]
  tq: [[9.3, 2.35, 8.7], [0.15, .95, 0], 34], frt: [[12.5, 1.4, 0.8], [0, .3, 0], 4], side: [[0.2, 1.4, 13], [0, .3, 0], 90],
  rear: [[-10, 2.4, 7], [0, .3, 0], 146], top: [[0.4, 14, 1.2], [0, 0, 0], 0]
};
let cfgState = { paint: 'magenta', rim: 'forged' };

Promise.all([loadV3(), document.fonts.ready]).then(([V]) => {
  const { THREE } = V;
  const el = document.getElementById('cfg3d');
  const S = V.stage(el, { w: 988, h: 1004, fov: 24, pos: CAMS.tq[0], target: CAMS.tq[1], bloom: [.5, .35, 3.0] });
  const car = V.buildCar({ paint: cfgState.paint, rim: cfgState.rim, caliper: '#00e5ff' });
  const turn = new THREE.Group(); turn.add(car.group); S.scene.add(turn);
  V.studioLights(S.scene, { key: .45 });
  const fl = V.addFloor(S.scene, turn, { radius: 10, opacity: .86, edge: false });
  // turntable
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.05, .014, 6, 200), V.glowMat('#ff2bd6', 1.6)); ring.rotation.x = -Math.PI / 2; ring.position.y = .006; S.scene.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.35, .006, 6, 200), V.glowMat('#00e5ff', 1.1)); ring2.rotation.x = -Math.PI / 2; ring2.position.y = .006; S.scene.add(ring2);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(3.04, 120), new THREE.MeshPhysicalMaterial({ color: '#0a0d14', metalness: .6, roughness: .35, clearcoat: 1, transparent: true, opacity: .55 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = .002; S.scene.add(disc);
  const notch = new THREE.Mesh(new THREE.BoxGeometry(.16, .01, .16), V.glowMat('#ff2bd6', 3)); notch.rotation.y = Math.PI / 4; S.scene.add(notch);

  // rim thumbnails rendered from the same 3D wheels (offscreen, then disposed)
  {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); r.setSize(168, 168); r.setPixelRatio(1);
    r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Scene(); sc.environment = V.studioEnv(r, {});
    sc.add(new THREE.HemisphereLight('#ffffff', '#000000', .6));
    const cam = new THREE.PerspectiveCamera(22, 1, .1, 20); cam.position.set(.55, .25, 1.85); cam.lookAt(0, 0, 0);
    const urls = {};
    for (const [k] of CFG_RIMS) {
      const w = V.buildWheel({ r: .355, w: .27, rim: k, caliper: '#00e5ff' }); sc.add(w);
      r.render(sc, cam); urls[k] = r.domElement.toDataURL('image/png'); sc.remove(w);
    }
    r.dispose();
    document.getElementById('wheels').innerHTML = CFG_RIMS.map(([k, n, p]) => `<div data-rim="${k}" class="${k === cfgState.rim ? 'on' : ''}"><img src="${urls[k]}" alt=""><b>${n}</b><small>${p}</small></div>`).join('');
  }
  // paint swatches
  document.getElementById('paints').innerHTML = CFG_PAINTS.map(([k]) => {
    const h = V.PAINTS[k].hex, c = new THREE.Color(h), hi = c.clone().lerp(new THREE.Color('#ffffff'), .55).getStyle(), lo = c.clone().multiplyScalar(.18).getStyle();
    return `<div class="sw ${k === cfgState.paint ? 'on' : ''}" data-paint="${k}"><div style="background:linear-gradient(135deg,${hi},${h} 48%,${lo})"></div></div>`;
  }).join('');
  const setPaint = k => {
    cfgState.paint = k; car.setPaint(k);
    const [, name, price] = CFG_PAINTS.find(p => p[0] === k);
    document.querySelectorAll('#paints .sw').forEach(s => s.classList.toggle('on', s.dataset.paint === k));
    document.getElementById('pn').textContent = name; document.getElementById('pp').textContent = price;
    const pn = document.getElementById('pname'); pn.textContent = name; pn.dataset.t = name;
  };
  document.getElementById('paints').addEventListener('click', e => { const s = e.target.closest('.sw'); if (s) setPaint(s.dataset.paint); });
  document.getElementById('wheels').addEventListener('click', e => {
    const c = e.target.closest('[data-rim]'); if (!c) return;
    cfgState.rim = c.dataset.rim; car.setRim(c.dataset.rim); fl.reclone();
    document.querySelectorAll('#wheels>div').forEach(d => d.classList.toggle('on', d === c));
  });
  // camera presets (eased)
  let camFrom = null, camTo = CAMS.tq, camT = 1;
  document.getElementById('cams').addEventListener('click', e => {
    const s = e.target.closest('[data-cam]'); if (!s) return;
    camFrom = [S.camera.position.toArray(), S.camera.userData.target.toArray()]; camTo = CAMS[s.dataset.cam]; camT = 0;
    document.querySelectorAll('#cams span').forEach(x => x.classList.toggle('on', x === s));
    document.getElementById('deg').textContent = camTo[2];
  });
  // drag to rotate
  let drag = null, spinV = 0, yaw = -0.12;
  el.addEventListener('pointerdown', e => { drag = e.clientX; });
  addEventListener('pointerup', () => { drag = null; });
  addEventListener('pointermove', e => { if (drag !== null) { spinV = (e.clientX - drag) * .0002; yaw += (e.clientX - drag) * .006; drag = e.clientX; } });

  // hotspots: caliper, wing, canopy
  const hots = { h1: [1.42, .52, 1.0], h2: [-1.95, 1.2, .55], h3: [0.25, 1.1, .3] };
  const v = new THREE.Vector3(), lines = document.getElementById('hotlinks');
  const pin = () => {
    for (const [id, p] of Object.entries(hots)) {
      v.set(...p); car.group.localToWorld(v); v.project(S.camera);
      const e = document.getElementById(id); e.style.left = ((v.x + 1) / 2 * S.w) + 'px'; e.style.top = ((1 - v.y) / 2 * S.h) + 'px';
    }
    const h1 = document.getElementById('h1'), tip = document.getElementById('tip');
    const x1 = parseFloat(h1.style.left), y1 = parseFloat(h1.style.top), tx = tip.offsetLeft, ty = tip.offsetTop + tip.offsetHeight - 20;
    lines.innerHTML = `<path d="M${tx},${ty} H${tx - 30} L${x1 + 16},${y1 - 16}" fill="none" stroke="#ff2bd6" stroke-width="1" stroke-dasharray="4 4"/>`;
    v.set(-.3, .95, .9); car.group.localToWorld(v); v.project(S.camera);
    const c = document.querySelector('.stage .cursor'); c.style.left = ((v.x + 1) / 2 * S.w - 55) + 'px'; c.style.top = ((1 - v.y) / 2 * S.h - 55) + 'px';
  };
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  let last = 0;
  S.animate(t => {
    const dt = Math.min(.05, t - last); last = t;
    if (drag === null) yaw += .05 * dt;
    turn.rotation.y = yaw; ring.rotation.z = t * .2; notch.position.set(Math.cos(-yaw) * 3.05, .008, Math.sin(-yaw) * 3.05);
    if (camT < 1 && camFrom) {
      camT = Math.min(1, camT + dt / 1.1); const k = ease(camT);
      S.camera.position.fromArray(camFrom[0]).lerp(new THREE.Vector3(...camTo[0]), k);
      S.camera.userData.target.fromArray(camFrom[1]).lerp(new THREE.Vector3(...camTo[1]), k);
      S.camera.lookAt(S.camera.userData.target);
    }
    pin();
  }, { pose: 0, frames: 3 });
});
