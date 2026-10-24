// Home hero: Σ1 on a studio turntable inside a receding light tunnel, speed streaks flowing past.
Promise.all([loadV3(), document.fonts.load('700 300px "Chakra Petch"').catch(() => 0)]).then(([V]) => {
  const { THREE } = V;
  const el = document.getElementById('hero3d');
  const S = V.stage(el, { w: 1440, h: 1080, fov: 22, pos: [8.6, 2.0, 7.7], target: [-0.5, 0.8, 0.3], bloom: [.45, .35, 3.0] });
  const car = V.buildCar({ paint: 'void', rim: 'blade', caliper: '#ff2bd6' });
  const turn = new THREE.Group(); turn.add(car.group); S.scene.add(turn);
  V.studioLights(S.scene);
  V.addFloor(S.scene, turn, { radius: 11, opacity: .85, edge: false });

  // turntable: glowing rim + tick ring
  const ringMat = V.glowMat('#00e5ff', 1.3);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.15, .012, 6, 200), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = .006; S.scene.add(ring);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.13, 160), new THREE.MeshBasicMaterial({ color: '#0b1a24', transparent: true, opacity: .6 })); ring2.rotation.x = -Math.PI / 2; ring2.position.y = .004; S.scene.add(ring2);
  const tickG = new THREE.BoxGeometry(.012, .002, 1), ticks = new THREE.InstancedMesh(tickG, V.glowMat('#7ff4ff', .7), 180), m4 = new THREE.Matrix4();
  for (let i = 0; i < 180; i++) {
    const a = i / 180 * Math.PI * 2, L = i % 15 === 0 ? .32 : .12, r = 3.3 + L / 2;
    m4.compose(new THREE.Vector3(Math.cos(a) * r, .006, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a + Math.PI / 2, 0)), new THREE.Vector3(1, 1, L));
    ticks.setMatrixAt(i, m4);
  }
  S.scene.add(ticks);
  // magenta sweep arc on the turntable
  const arc = new THREE.Mesh(new THREE.TorusGeometry(3.15, .022, 6, 80, Math.PI * .35), V.glowMat('#ff2bd6', 3)); arc.rotation.x = -Math.PI / 2; arc.position.y = .008; S.scene.add(arc);

  // light tunnel: portal frames receding along -x behind the car
  const tunnel = new THREE.Group(); S.scene.add(tunnel);
  const frame = (x, k, col, near) => {
    const g = new THREE.Group(), m = V.glowMat(col, k), W = 9, H = 4.4, t = .035;
    const bar = (w, h, px, py, pz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(t, h, w), m); b.position.set(0, py, pz); g.add(b); };
    bar(W, t, 0, H, 0); if (near) bar(t, H, 0, H / 2, W / 2); bar(t, H, 0, H / 2, -W / 2);
    // chamfered corners
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(t, t, 1.1), m); c.position.set(0, H - .38, s * (W / 2 - .38)); c.rotation.x = s * Math.PI / 4; g.add(c); }
    g.position.x = x; tunnel.add(g);
  };
  for (let i = 0; i < 16; i++) frame(-8.5 - i * 3.6, (i ? 2.2 : 1.1) * Math.pow(1 - i / 18, 1.5) + .12, i % 5 === 2 ? '#ff2bd6' : '#00e5ff', i > 3);
  // speed streaks
  const N = 70, streakG = new THREE.BoxGeometry(1, .014, .014);
  const streaks = new THREE.InstancedMesh(streakG, V.glowMat('#bff8ff', 2.4), N), sdata = [];
  const streaksM = new THREE.InstancedMesh(streakG, V.glowMat('#ff2bd6', 2.6), 14);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const place = (im, i, d) => { m4.compose(new THREE.Vector3(d.x, d.y, d.z), new THREE.Quaternion(), new THREE.Vector3(d.len, 1, 1)); im.setMatrixAt(i, m4); };
  for (let i = 0; i < N + 14; i++) {
    const wall = rnd(); let y, z;
    if (wall < .4) { y = .3 + rnd() * 4.3; z = (rnd() < .5 ? -1 : 1) * (4.3 + rnd() * .4); }
    else if (wall < .7) { y = 4.3 + rnd() * .4; z = (rnd() - .5) * 8.6; }
    else { y = .02; z = (rnd() < .5 ? -1 : 1) * (3.6 + rnd() * 1.6); }
    sdata.push({ x: -60 + rnd() * 66, y, z, len: 1 + rnd() * 5, v: 14 + rnd() * 26 });
  }
  S.scene.add(streaks, streaksM);

  // giant outlined VELOCITY standing in the tunnel behind the car (real 3D type, catches bloom)
  {
    const tex = V.canvasTex(2048, 420, (x, w, h) => {
      x.font = '700 330px "Chakra Petch"'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineWidth = 5; x.strokeStyle = '#ffffff'; x.shadowColor = '#00e5ff'; x.shadowBlur = 18; x.strokeText('VELOCITY', w / 2, h / 2 + 10);
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,229,255,.32)'); g.addColorStop(1, 'rgba(0,229,255,0)'); x.fillStyle = g; x.shadowBlur = 0; x.fillText('VELOCITY', w / 2, h / 2 + 10);
      x.save(); x.beginPath(); x.rect(0, h * .36, w, h * .1); x.clip(); x.strokeStyle = '#ff2bd6'; x.lineWidth = 6; x.strokeText('VELOCITY', w / 2 + 22, h / 2 + 10); x.restore();
    });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.repeat.set(1, 1);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, color: new THREE.Color('#9ff6ff').multiplyScalar(.85), toneMapped: false, depthWrite: false });
    const word = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6 * 420 / 2048), mat);
    word.position.set(-5.8, 1.42, -4.4); word.lookAt(S.camera.position.x, 1.42, S.camera.position.z); S.scene.add(word);
  }

  // callouts: project 3D anchors to the hero's pixel space
  const anchors = { co1: [2.27, .44, .3], co4: [1.42, .2, 0.95], co5: [-1.33, .2, 1.0] };
  const v = new THREE.Vector3();
  const pin = () => {
    for (const [id, p] of Object.entries(anchors)) {
      v.set(...p); car.group.localToWorld(v); v.project(S.camera);
      const e = document.getElementById(id); if (!e) continue;
      e.style.left = ((v.x + 1) / 2 * S.w) + 'px'; e.style.top = ((1 - v.y) / 2 * S.h) + 'px';
    }
    v.set(-.4, .9, 1.0); car.group.localToWorld(v); v.project(S.camera);
    const c = document.getElementById('cur'); if (c) { c.style.left = ((v.x + 1) / 2 * S.w - 55) + 'px'; c.style.top = ((1 - v.y) / 2 * S.h - 55) + 'px'; }
  };

  S.animate(t => {
    turn.rotation.y = -0.18 + Math.sin(t * .12) * 0.35;
    ring.rotation.z = t * .1; arc.rotation.z = -t * .6 + 2.2; ticks.rotation.y = t * .05;
    sdata.forEach((d, i) => {
      const x = ((d.x + t * d.v + 60) % 66) - 60;
      place(i < N ? streaks : streaksM, i < N ? i : i - N, { ...d, x });
    });
    streaks.instanceMatrix.needsUpdate = true; streaksM.instanceMatrix.needsUpdate = true;
    pin();
  }, { pose: 0, frames: 3 });
});
