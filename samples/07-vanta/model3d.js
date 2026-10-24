// Engineering page: (1) exploded Σ1 — skin lifted off the carbon tub, structural pack of instanced cells, four motors;
// (2) aero side view with glowing streamlines + flow particles.
Promise.all([loadV3(), document.fonts.ready]).then(([V]) => {
  const { THREE } = V;
  let pending = 2; const done = () => { if (--pending === 0) window.__ready3dAll = true; };

  /* ---------------- exploded view ---------------- */
  {
    const el = document.getElementById('ex3d');
    const S = V.stage(el, { w: 1040, h: 1100, fov: 27.5, pos: [8.4, 6.6, 8.6], target: [-0.1, 1.05, 0.1], bloom: [.5, .35, 3.0] });
    const car = V.buildCar({ paint: 'cyan', rim: 'forged', caliper: '#ff2bd6' });
    const root = new THREE.Group(); root.add(car.group); S.scene.add(root);
    const ch = V.buildChassis({ glowCells: .2 }); car.group.add(ch.group);
    ch.tub.add(car.interior);
    V.studioLights(S.scene, { key: .5 });
    V.addFloor(S.scene, root, { radius: 10, opacity: .9, edge: false, shadow: .7 });
    // blueprint guides between the layers
    const dash = new THREE.LineDashedMaterial({ color: '#00e5ff', dashSize: .08, gapSize: .07, transparent: true, opacity: .55 });
    const guides = new THREE.Group(); car.group.add(guides);
    for (const [x, z] of [[-1.05, -.62], [-1.05, .62], [1.25, -.62], [1.25, .62]]) {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, .2, z), new THREE.Vector3(x, 2.1, z)]);
      const l = new THREE.Line(g, dash); l.computeLineDistances(); guides.add(l);
    }
    // a scanning plane sweeping through the stack
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.6), new THREE.MeshBasicMaterial({ color: '#00e5ff', transparent: true, opacity: .06, side: THREE.DoubleSide, depthWrite: false }));
    scan.rotation.x = -Math.PI / 2; car.group.add(scan);
    const scanEdge = new THREE.Mesh(new THREE.BoxGeometry(5.6, .006, .012), V.glowMat('#00e5ff', 2)); car.group.add(scanEdge);

    const pose = (t, e) => { // e: explode amount 0..1
      car.shell.position.y = 1.55 * e; car.glass.position.y = .32 * e; car.spine.position.y = 0;
      ch.tub.position.y = .72 * e;
      car.wheels.forEach(w => { const s = Math.sign(w.position.z); w.position.z = s * (V.WHEELS[Math.abs(w.position.x) > 1.38 && w.position.x > 0 ? 0 : 1].z + .5 * e); });
      ch.motors.children.forEach(m => { const s = Math.sign(m.position.z); m.position.z = s * (V.WHEELS[m.position.x > 0 ? 0 : 1].z - .42 + .25 * e); });
      guides.visible = e > .5;
      const sy = .3 + ((t * .35) % 1) * 2.4; scan.position.y = sy; scanEdge.position.set(0, sy, 1.3);
    };
    const tags = { t1: [-0.5, 2.4, -0.3], t2: [-0.2, 1.42, -0.55], t3: [-0.6, .3, -0.62] };
    const v = new THREE.Vector3(), svg = document.getElementById('exlinks'), off = el.getBoundingClientRect(), host = el.parentElement.getBoundingClientRect();
    const ox = off.left - host.left, oy = off.top - host.top;
    const link = () => {
      let h = '';
      for (const [id, p] of Object.entries(tags)) {
        v.set(...p); car.group.localToWorld(v); v.project(S.camera);
        const x = ox + (v.x + 1) / 2 * S.w, y = oy + (1 - v.y) / 2 * S.h, t = document.getElementById(id);
        const L = t.dataset.side === 'l', tx = L ? t.offsetLeft + t.offsetWidth + 2 : t.offsetLeft - 2, ty = t.offsetTop + 24, c = id === 't2' ? '#ff2bd6' : '#00e5ff';
        h += `<path d="M${tx},${ty} H${tx + (L ? 60 : -60)} L${x},${y}" fill="none" stroke="${c}" stroke-width="1" stroke-opacity=".75"/><circle cx="${x}" cy="${y}" r="5" fill="#05070d" stroke="${c}" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="14" fill="none" stroke="${c}" stroke-opacity=".35"/>`;
      }
      svg.innerHTML = h;
    };
    S.animate(t => {
      root.rotation.y = 0.2 + Math.sin(t * .15) * .25;
      pose(t, 1);
      link();
    }, { pose: 1.2, frames: 3 });
  }

  /* ---------------- aero streamlines ---------------- */
  {
    const el = document.getElementById('aero3d');
    const S = V.stage(el, { w: 1312, h: 560, fov: 19, pos: [3.4, 1.15, 12.6], target: [-0.15, .62, 0], bloom: [.55, .35, 2.6] });
    const car = V.buildCar({ paint: 'silver', rim: 'aero', caliper: '#00e5ff' });
    car.aero.children.filter(c => c.rotation && Math.abs(c.rotation.z - .08) < .001).forEach(w => { w.rotation.z = .24; }); // wing in attack
    S.scene.add(car.group);
    V.studioLights(S.scene, { key: .5 });
    V.addFloor(S.scene, car.group, { radius: 6.5, opacity: .88, edge: false });
    // surface height along the centreline (body or canopy, whichever is higher)
    const topAt = x => {
      if (x > V.X1 || x < V.X0) return 0;
      let y = V.bodyPoint(x, Math.PI / 2, false)[1];
      if (x > -1.8 && x < 1.02) y = Math.max(y, V.canopyPoint(x, Math.PI / 2)[1]);
      return y;
    };
    const smooth = (f, x, r = .45) => { let s = 0, w = 0; for (let i = -16; i <= 16; i++) { const k = Math.exp(-(i * i) / 70); s += f(x + i * r / 16) * k; w += k; } return s / w; };
    const lines = new THREE.Group(); S.scene.add(lines);
    const curves = [];
    const H = x => Math.max(.32, smooth(topAt, x, 1.0));
    for (const z of [-.18, .18]) for (let L = 0; L < 6; L++) {
      const pts = [], off = .06 + L * .17 + (z > 0 ? .07 : 0);
      for (let i = 0; i <= 110; i++) {
        const x = 7 - i / 110 * 15;
        let y = off + H(x) * (1 - L * .1) + L * .05;
        if (x < -1.75) y += (.5 - L * .07) * Math.min(1, (-1.75 - x) / 1.8) ** .8; // wing upwash
        pts.push(new THREE.Vector3(x, y, z));
      }
      const c = new THREE.CatmullRomCurve3(pts); curves.push(c);
      const hot = L === 1 && z < 0;
      lines.add(new THREE.Mesh(new THREE.TubeGeometry(c, 200, hot ? .009 : .0072, 5), V.glowMat(hot ? '#ff2bd6' : '#00e5ff', hot ? 2.6 : 1.5 - L * .17)));
    }
    // underfloor (ground effect) lines
    for (const z of [-.5, 0, .5]) {
      const pts = []; for (let i = 0; i <= 60; i++) { const x = 6.5 - i / 60 * 14; const under = x < V.X1 && x > V.X0; pts.push(new THREE.Vector3(x, under ? .075 + (x < -1.6 ? (-1.6 - x) * .2 : 0) : .1, z)); }
      const c = new THREE.CatmullRomCurve3(pts); curves.push(c);
      lines.add(new THREE.Mesh(new THREE.TubeGeometry(c, 120, .005, 5), V.glowMat('#7ff4ff', 1.4)));
    }
    // flow particles
    const NP = 110, parts = new THREE.InstancedMesh(new THREE.SphereGeometry(.016, 8, 6), V.glowMat('#dffcff', 2.6), NP), m4 = new THREE.Matrix4();
    const pd = Array.from({ length: NP }, (_, i) => ({ c: curves[i % curves.length], o: (i * .6180339) % 1 }));
    S.scene.add(parts);
    S.animate(t => {
      pd.forEach((p, i) => { const u = (p.o + t * .16) % 1, q = p.c.getPointAt(u); m4.makeTranslation(q.x, q.y, q.z); parts.setMatrixAt(i, m4); });
      parts.instanceMatrix.needsUpdate = true;
      car.spin(t * 9);
    }, { pose: 0.4, frames: 3 });
  }
});
