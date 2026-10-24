/* AZURE ESTATES — shared Three.js kit (classic script; each page's inline module passes THREE in).
   window.AZ3D(THREE, {RoundedBoxGeometry}) returns builders:
   stage(), site(), villa(), plinth(), floors(), coast(), water(), sea(), olive(), cypress(). */
window.__pending3d = 0;
window.AZ3D = function (THREE, X) {
  const RB = X.RoundedBoxGeometry;
  const C = c => new THREE.Color(c);
  function done() { if (--window.__pending3d <= 0) window.__ready3d = true; }
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- environment: gradient sky with a sun, baked to PMREM ---------- */
  function makeEnv(renderer, kind) {
    const P = {
      golden: { top: '#86a9c4', hor: '#ffd3a1', bot: '#33505c', sun: '#ffb46a', dir: [-0.85, 0.22, 0.35] },
      day: { top: '#9cc0dc', hor: '#f6f2ea', bot: '#7d7a72', sun: '#fff1da', dir: [-0.5, 0.6, 0.45] },
    }[kind] || {};
    const s = new THREE.Scene();
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: C(P.top) }, hor: { value: C(P.hor) }, bot: { value: C(P.bot) }, sunCol: { value: C(P.sun) }, sun: { value: new THREE.Vector3(...P.dir).normalize() } },
      vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform vec3 top,hor,bot,sunCol,sun;varying vec3 vP;void main(){float y=vP.y;vec3 c=y>0.?mix(hor,top,pow(y,.55)):mix(hor,bot,pow(-y,.45));float d=max(dot(vP,sun),0.);c+=sunCol*(pow(d,90.)*6.+pow(d,8.)*.5);gl_FragColor=vec4(c,1.);}',
    });
    s.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), mat));
    // a few soft "softbox" strips so glass and clearcoat pick up crisp highlights
    const strip = new THREE.MeshBasicMaterial({ color: C('#ffffff').multiplyScalar(2.2) });
    [[-20, 18, 30, 0.4], [25, 22, -20, -0.3]].forEach(([x, y, z, r]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(30, 3), strip); m.position.set(x, y, z); m.lookAt(0, 0, 0); m.rotation.z += r; s.add(m); });
    const pm = new THREE.PMREMGenerator(renderer);
    const t = pm.fromScene(s, 0.02).texture; pm.dispose();
    return t;
  }

  /* ---------- stage: renderer + scene + camera at a fixed pixel size ---------- */
  function stage(el, { w = el.clientWidth, h = el.clientHeight, fov = 30, exposure = 1, shadows = true, env = 'golden', envIntensity = 1, staticShadows = false } = {}) {
    window.__pending3d++;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
    catch (e) { console.warn('webgl off', e); done(); return null; }
    renderer.setPixelRatio(1); renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    if (shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
    renderer.domElement.style.display = 'block';
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.environment = makeEnv(renderer, env);
    const camera = new THREE.PerspectiveCamera(fov, w / h, 0.5, 3000);
    const pins = [];
    const v = new THREE.Vector3();
    function placePins() {
      for (const p of pins) {
        (p.obj ? p.obj.getWorldPosition(v) : v.copy(p.at));
        v.project(camera);
        const x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
        p.el.style.left = x.toFixed(1) + 'px'; p.el.style.top = y.toFixed(1) + 'px';
      }
    }
    function pin(at, elx) { pins.push(at.isObject3D ? { obj: at, el: elx } : { at: at.clone(), el: elx }); }
    let first = true, frames = 0, t0 = performance.now(), onFrame = () => {};
    function run(fn) {
      onFrame = fn;
      scene.traverse(o => { const m = o.material; if (m && 'envMapIntensity' in m && !m.userData.keepEnv) m.envMapIntensity = envIntensity; });
      const tick = () => {
        const t = (performance.now() - t0) / 1000;
        onFrame(t);
        if (staticShadows && frames > 2) renderer.shadowMap.autoUpdate = false;
        renderer.render(scene, camera); frames++;
        placePins();
        if (first) { first = false; requestAnimationFrame(() => requestAnimationFrame(done)); }
        requestAnimationFrame(tick);
      };
      tick();
    }
    return { renderer, scene, camera, run, pin, w, h };
  }

  /* ---------- lights ---------- */
  function lights(scene, kind = 'golden', { size = 34, at = [-60, 20, 22], target = [0, 0, 0], map = 2048 } = {}) {
    const golden = kind === 'golden';
    const hemi = new THREE.HemisphereLight(golden ? '#bcd3e6' : '#dfeaf3', golden ? '#c9a27a' : '#cfc3b0', golden ? 0.42 : 1.3);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(golden ? '#ffc48a' : '#fff4e2', golden ? 6.2 : 3.2);
    sun.position.set(...at); sun.target.position.set(...target);
    sun.castShadow = true; sun.shadow.mapSize.set(map, map);
    Object.assign(sun.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: 260 }); sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    scene.add(sun, sun.target);
    return { hemi, sun };
  }

  /* ---------- canvas textures ---------- */
  function canvasTex(w, h, draw, srgb = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    return t;
  }
  const texCache = {};
  function travertine() {
    return texCache.trav || (texCache.trav = canvasTex(512, 512, (g, w, h) => {
      const r = rng(7);
      g.fillStyle = '#ddd0b6'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${150 + r() * 60},${125 + r() * 50},${90 + r() * 40},${0.05 + r() * 0.1})`; g.fillRect(0, r() * h, w, 1 + r() * 6); }
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,95,60,${r() * 0.25})`; g.fillRect(r() * w, r() * h, 1 + r() * 4, 1); }
      // paver joints, 4 x 2 slabs per tile
      g.strokeStyle = 'rgba(150,128,96,.55)'; g.lineWidth = 2;
      for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); }
      for (let j = 0; j <= 2; j++) { g.beginPath(); g.moveTo(0, j * h / 2); g.lineTo(w, j * h / 2); g.stroke(); }
    }));
  }
  function plaster() {
    return texCache.pl || (texCache.pl = canvasTex(256, 256, (g, w, h) => {
      const r = rng(3); g.fillStyle = '#f3f0ea'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) { const v = 225 + r() * 30 | 0; g.fillStyle = `rgba(${v},${v - 3},${v - 8},.35)`; g.fillRect(r() * w, r() * h, 2, 2); }
    }));
  }
  function woodTex() {
    return texCache.wd || (texCache.wd = canvasTex(256, 256, (g, w, h) => {
      const r = rng(11); g.fillStyle = '#9a6b47'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(70,40,20,.22)' : 'rgba(255,220,180,.08)'; g.fillRect(0, i * 16, w, 15); }
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(60,35,18,${r() * 0.25})`; g.fillRect(r() * w, r() * h, 20 + r() * 80, 1); }
    }));
  }
  function texFor(base, rx, ry) { const t = base.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return t; }

  /* ---------- materials ---------- */
  function mats(kind = 'golden') {
    const golden = kind === 'golden';
    return {
      concrete: new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.86, map: plaster() }),
      white: new THREE.MeshStandardMaterial({ color: '#f7f5f0', roughness: 0.7 }),
      trav: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.72, map: travertine() }),
      travPlain: new THREE.MeshStandardMaterial({ color: '#d8c7a9', roughness: 0.78 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#56808c', metalness: 0.15, roughness: 0.04, transparent: true, opacity: 0.46, envMapIntensity: 2.6, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false, userData: { keepEnv: true } }),
      rail: new THREE.MeshPhysicalMaterial({ color: '#cfe3e6', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.22, envMapIntensity: 2, depthWrite: false, userData: { keepEnv: true } }),
      frame: new THREE.MeshStandardMaterial({ color: '#141619', roughness: 0.35, metalness: 0.55 }),
      wood: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.62, map: woodTex() }),
      glow: new THREE.MeshStandardMaterial({ color: '#f5e2c4', emissive: golden ? '#ffc583' : '#fff0d8', emissiveIntensity: golden ? 0.85 : 0.35, roughness: 0.9 }),
      lamp: new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffd39a', emissiveIntensity: 3 }),
      linen: new THREE.MeshStandardMaterial({ color: '#efe8dc', roughness: 0.95 }),
      sand: new THREE.MeshStandardMaterial({ color: '#cdb491', roughness: 0.9 }),
      dark: new THREE.MeshStandardMaterial({ color: '#2a2c2e', roughness: 0.6 }),
      teak: new THREE.MeshStandardMaterial({ color: '#8a5f3e', roughness: 0.55 }),
      leaf: new THREE.MeshStandardMaterial({ color: '#7e8b5c', roughness: 0.9, flatShading: true }),
      leaf2: new THREE.MeshStandardMaterial({ color: '#6c7a4f', roughness: 0.9, flatShading: true }),
      cypress: new THREE.MeshStandardMaterial({ color: '#3f4a32', roughness: 0.95, flatShading: true }),
      trunk: new THREE.MeshStandardMaterial({ color: '#6c5b49', roughness: 0.95, flatShading: true }),
      lavender: new THREE.MeshStandardMaterial({ color: '#9089b8', roughness: 1, flatShading: true }),
      tile: new THREE.MeshStandardMaterial({ color: '#2d8ea3', roughness: 0.4 }),
      rug: new THREE.MeshStandardMaterial({ color: '#cbb796', roughness: 1 }),
      blue: new THREE.MeshStandardMaterial({ color: '#0f5e7a', roughness: 0.5 }),
    };
  }

  /* box by bounds */
  function B(parent, mat, x0, x1, y0, y1, z0, z1, { r = 0, cast = true, recv = true } = {}) {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0;
    const geo = r && RB ? new RB(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.castShadow = cast; m.receiveShadow = recv;
    parent.add(m); return m;
  }

  /* ---------- water shaders ---------- */
  const CAUSTIC = `
    float caus(vec2 uv,float time){
      vec2 p=mod(uv*6.28318,6.28318)-250.;vec2 i=p;float c=1.;float inten=.005;
      for(int n=0;n<4;n++){float t=time*(1.-(3.5/float(n+1)));i=p+vec2(cos(t-i.x)+sin(t+i.y),sin(t-i.y)+cos(t+i.x));
        c+=1./length(vec2(p.x/(sin(i.x+t)/inten),p.y/(cos(i.y+t)/inten)));}
      c/=4.;c=1.17-pow(c,1.4);return pow(abs(c),8.);}`;
  const VS = 'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
  function water({ deep = '#08708c', shallow = '#2fcfd6', sky = '#ffe0bd', sun = [-0.85, 0.3, 0.35], scale = 0.11, alpha = 0.95 } = {}) {
    return new THREE.ShaderMaterial({
      transparent: alpha < 1, depthWrite: true,
      uniforms: { uT: { value: 0 }, uDeep: { value: C(deep) }, uShal: { value: C(shallow) }, uSky: { value: C(sky) }, uSun: { value: new THREE.Vector3(...sun).normalize() }, uS: { value: scale }, uA: { value: alpha } },
      vertexShader: VS,
      fragmentShader: `uniform float uT,uS,uA;uniform vec3 uDeep,uShal,uSky,uSun;varying vec3 vW;${CAUSTIC}
        void main(){vec3 V=normalize(cameraPosition-vW);vec2 p=vW.xz;float t=uT;
          vec3 n=normalize(vec3(sin(p.x*1.7+t*1.3)*.035+sin(p.y*2.3-t)*.03,1.,cos(p.y*1.9+t*1.1)*.035+sin(p.x*2.9+t*.7)*.03));
          float c=caus(p*uS,t*.32);
          vec3 col=mix(uDeep,uShal,.55+.25*sin(p.x*.21+p.y*.13));
          col+=vec3(.8,1.,1.)*min(c,1.)*.6;
          float fr=pow(1.-max(dot(n,V),0.),3.);
          col=mix(col,uSky,fr*.4);
          vec3 R=reflect(-V,n);col+=vec3(1.,.92,.75)*pow(max(dot(R,uSun),0.),160.)*2.5;
          gl_FragColor=vec4(col,uA);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
  }
  function sea({ deep = '#0a4a64', mid = '#0f6a88', shallow = '#38aeb9', haze = '#f1d9bd', sun = [-0.85, 0.22, 0.35], fade = [380, 900], shore = 0 } = {}) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uT: { value: 0 }, uDeep: { value: C(deep) }, uMid: { value: C(mid) }, uShal: { value: C(shallow) }, uHaze: { value: C(haze) }, uSun: { value: new THREE.Vector3(...sun).normalize() }, uF: { value: new THREE.Vector2(...fade) }, uShore: { value: shore } },
      vertexShader: VS,
      fragmentShader: `uniform float uT,uShore;uniform vec2 uF;uniform vec3 uDeep,uMid,uShal,uHaze,uSun;varying vec3 vW;${CAUSTIC}
        float coast(float x){return 9.*sin(x*.045)+6.*sin(x*.11+1.)+3.*sin(x*.27+2.);}
        void main(){vec3 V=normalize(cameraPosition-vW);vec2 p=vW.xz;float t=uT;
          vec3 n=normalize(vec3(sin(p.x*.8+t)*.05+sin(p.x*2.1+p.y*1.3+t*1.7)*.035+sin(p.x*5.3-p.y*3.1+t*2.9)*.02,1.,
                                cos(p.y*.9-t*1.2)*.05+sin(p.y*2.4-p.x*1.1+t*1.5)*.035+cos(p.y*6.1+p.x*2.2-t*3.)*.02));
          float d=length(vW.xz-cameraPosition.xz);
          float near=uShore>.5? 1.-smoothstep(0.,26.,p.y-coast(p.x)) : 1.-smoothstep(10.,70.,length(p));
          vec3 col=mix(uDeep,uMid,.5+.5*sin(p.x*.02+p.y*.03));
          col=mix(col,uShal,near*.85);
          col+=vec3(.7,1.,1.)*min(caus(p*.035,t*.25),1.)*.1*near;
          float fr=pow(1.-max(dot(n,V),0.),4.);
          col=mix(col,uHaze,fr*.5);
          vec3 R=reflect(-V,n);float s=pow(max(dot(R,uSun),0.),70.);col+=vec3(1.,.82,.55)*s*1.8;
          float a=1.-smoothstep(uF.x,uF.y,d);
          col=mix(col,uHaze,smoothstep(uF.x*.6,uF.y,d)*.8);
          gl_FragColor=vec4(col,a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
  }

  /* ---------- vegetation ---------- */
  function olive(M, r, s = 1) {
    const g = new THREE.Group();
    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 1.6, 7), M.trunk); t1.position.y = 0.8; t1.rotation.z = (r() - 0.5) * 0.4; t1.castShadow = true; g.add(t1);
    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 1.4, 6), M.trunk); t2.position.set(0.25, 2, 0); t2.rotation.z = -0.5; t2.castShadow = true; g.add(t2);
    const t3 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 1.3, 6), M.trunk); t3.position.set(-0.3, 2, 0.1); t3.rotation.z = 0.6; t3.castShadow = true; g.add(t3);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r(), rad = 0.6 + r() * 0.9;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + r() * 0.6, 1), r() > 0.5 ? M.leaf : M.leaf2);
      m.position.set(Math.cos(a) * rad, 2.7 + r() * 0.9, Math.sin(a) * rad); m.scale.set(1.25, 0.72, 1.15);
      m.rotation.set(r(), r(), r()); m.castShadow = true; m.receiveShadow = true; g.add(m);
    }
    g.scale.setScalar(s); g.rotation.y = r() * 6;
    return g;
  }
  function cypress(M, r, h = 7) {
    const g = new THREE.Group();
    const pts = []; for (let i = 0; i <= 10; i++) { const y = i / 10; pts.push(new THREE.Vector2(Math.sin(Math.PI * Math.pow(y, 0.75)) * 0.75 * (1 - y * 0.25) + 0.02, y * h)); }
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 9), M.cypress); m.castShadow = true; m.receiveShadow = true; g.add(m);
    return g;
  }
  function shrub(M, mat, r, s = 1) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 * s, 1), mat); m.scale.y = 0.65; m.castShadow = true; m.rotation.y = r() * 6; return m; }

  /* ---------- furniture ---------- */
  function lounger(M, x, z, ry = 0) {
    const g = new THREE.Group();
    B(g, M.white, -0.36, 0.36, 0.08, 0.3, -1.0, 1.0, { r: 0.05 });
    B(g, M.linen, -0.33, 0.33, 0.3, 0.42, -0.95, 0.35, { r: 0.05 });
    const back = B(g, M.linen, -0.33, 0.33, -0.06, 0.06, 0, 0.8, { r: 0.05 }); back.position.set(0, 0.62, 0.62); back.rotation.x = -0.95;
    B(g, M.linen, -0.25, 0.25, 0.5, 0.62, 0.65, 0.85, { r: 0.05 });
    g.position.set(x, 0, z); g.rotation.y = ry; return g;
  }
  function umbrella(M, x, z, open = 1) {
    const g = new THREE.Group();
    B(g, M.dark, -0.04, 0.04, 0, 2.5, -0.04, 0.04);
    B(g, M.trav, -0.35, 0.35, 0, 0.12, -0.35, 0.35);
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.7 * open, 0.45, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#f1e9da', roughness: 0.95, side: THREE.DoubleSide }));
    c.position.y = 2.55; c.castShadow = true; g.add(c);
    g.position.set(x, 0, z); return g;
  }
  function sofa(M, x0, x1, z0, z1, mat) {
    const g = new THREE.Group();
    B(g, mat || M.linen, x0, x1, 0, 0.42, z0, z1, { r: 0.08 });
    B(g, mat || M.linen, x0, x1, 0.42, 0.85, z0, z0 + 0.22, { r: 0.08 });
    return g;
  }
  function table(M, x0, x1, z0, z1, h = 0.75, top = M.teak) {
    const g = new THREE.Group();
    B(g, top, x0, x1, h - 0.06, h, z0, z1, { r: 0.02 });
    [[x0 + 0.1, z0 + 0.1], [x1 - 0.1, z0 + 0.1], [x0 + 0.1, z1 - 0.1], [x1 - 0.1, z1 - 0.1]].forEach(([x, z]) => B(g, M.dark, x - 0.03, x + 0.03, 0, h - 0.06, z - 0.03, z + 0.03));
    return g;
  }
  function chairsAround(M, g, x0, x1, z0, z1) {
    const n = Math.max(2, Math.round((x1 - x0) / 0.8));
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * (x1 - x0) / n;
      B(g, M.linen, x - 0.22, x + 0.22, 0.42, 0.5, z0 - 0.62, z0 - 0.18, { r: 0.03 }); B(g, M.teak, x - 0.22, x + 0.22, 0, 0.42, z0 - 0.6, z0 - 0.2);
      B(g, M.linen, x - 0.22, x + 0.22, 0.42, 0.5, z1 + 0.18, z1 + 0.62, { r: 0.03 }); B(g, M.teak, x - 0.22, x + 0.22, 0, 0.42, z1 + 0.2, z1 + 0.6);
    }
  }
  function bed(M, cx, cz, rot = 0) {
    const g = new THREE.Group();
    B(g, M.teak, -0.95, 0.95, 0, 0.3, -1.1, 1.1);
    B(g, M.linen, -0.9, 0.9, 0.3, 0.55, -1.05, 1.05, { r: 0.08 });
    B(g, M.sand, -0.92, 0.92, 0.54, 0.6, 0.1, 0.9, { r: 0.03 });
    B(g, M.white, -0.8, -0.1, 0.55, 0.75, -1.0, -0.65, { r: 0.08 }); B(g, M.white, 0.1, 0.8, 0.55, 0.75, -1.0, -0.65, { r: 0.08 });
    B(g, M.wood, -1.0, 1.0, 0, 1.1, -1.25, -1.1);
    B(g, M.teak, -1.55, -1.1, 0, 0.45, -1.1, -0.65); B(g, M.teak, 1.1, 1.55, 0, 0.45, -1.1, -0.65);
    g.position.set(cx, 0, cz); g.rotation.y = rot; return g;
  }
  function pergola(M, x0, x1, z0, z1, h = 2.9) {
    const g = new THREE.Group();
    [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(([x, z]) => B(g, M.frame, x - 0.08, x + 0.08, 0, h, z - 0.08, z + 0.08));
    B(g, M.frame, x0 - 0.1, x1 + 0.1, h - 0.18, h, z0 - 0.08, z0 + 0.08); B(g, M.frame, x0 - 0.1, x1 + 0.1, h - 0.18, h, z1 - 0.08, z1 + 0.08);
    for (let x = x0 + 0.15; x < x1; x += 0.38) B(g, M.wood, x - 0.06, x + 0.06, h, h + 0.16, z0 - 0.3, z1 + 0.3);
    return g;
  }

  /* glass wall along x or z with black mullions */
  function glazing(g, M, axis, a0, a1, fixed, y0, y1, step = 2.2, opt = {}) {
    if (axis === 'x') B(g, M.glass, a0, a1, y0, y1, fixed - 0.03, fixed + 0.03, { cast: false, recv: false });
    else B(g, M.glass, fixed - 0.03, fixed + 0.03, y0, y1, a0, a1, { cast: false, recv: false });
    const n = Math.max(1, Math.round((a1 - a0) / step));
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * i / n;
      if (axis === 'x') B(g, M.frame, a - 0.05, a + 0.05, y0, y1, fixed - 0.07, fixed + 0.07);
      else B(g, M.frame, fixed - 0.07, fixed + 0.07, y0, y1, a - 0.05, a + 0.05);
    }
    if (axis === 'x') { B(g, M.frame, a0, a1, y0, y0 + 0.08, fixed - 0.08, fixed + 0.08); B(g, M.frame, a0, a1, y1 - 0.08, y1, fixed - 0.08, fixed + 0.08); }
    else { B(g, M.frame, fixed - 0.08, fixed + 0.08, y0, y0 + 0.08, a0, a1); B(g, M.frame, fixed - 0.08, fixed + 0.08, y1 - 0.08, y1, a0, a1); }
  }

  /* ---------- the villa: pool deck + two cantilevered volumes ----------
     terrace top y = 0, footprint x[-20,20] z[-12,11]; pool x[-16,2] z[4,10.6] (infinity edge at z=10.6) */
  function villa(M, { r = rng(5), upperLift = 0, waterMat, cutaway = false } = {}) {
    const g = new THREE.Group(); const parts = {};
    // deck
    const deck = new THREE.Group(); g.add(deck);
    const dk = (x0, x1, z0, z1, top = 0) => { const m = B(deck, M.trav, x0, x1, -0.6, top, z0, z1, { cast: false }); m.material = M.trav.clone(); m.material.map = texFor(travertine(), (x1 - x0) / 4, (z1 - z0) / 4); return m; };
    dk(-20, 20, -12, 4); dk(-20, -16, 4, 11); dk(2, 20, 4, 11);
    B(deck, M.travPlain, -16, 2, -0.6, -0.14, 10.6, 11, { cast: false });       // infinity weir
    B(deck, M.tile, -16, 2, -0.6, -0.55, 4, 10.6, { cast: false });           // basin floor
    const wm = waterMat || water();
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(18, 6.6), wm); pool.rotation.x = -Math.PI / 2; pool.position.set(-7, -0.08, 7.3); pool.receiveShadow = true; g.add(pool);
    parts.water = wm;
    // spill film down the infinity edge
    const spill = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.9), new THREE.MeshPhysicalMaterial({ color: '#7fd3d9', roughness: 0.05, transparent: true, opacity: 0.55, envMapIntensity: 2 }));
    spill.position.set(-7, -0.55, 11.02); g.add(spill);
    // pool step + coping line
    B(deck, M.white, -16, 2, -0.02, 0.04, 3.85, 4.0, { cast: false });

    // ground floor volume x[-6,16] z[-9,0] y 0..3.6
    const gf = new THREE.Group(); g.add(gf); parts.ground = gf;
    B(gf, M.trav, -6, 16.4, 0, 3.6, -9.6, -9.0);                       // travertine back wall
    B(gf, M.concrete, 15.6, 16.4, 0, 3.6, -9.0, 0.3);                   // solid east wall
    glazing(gf, M, 'x', -6, 15.6, 0, 0.02, 3.55, 2.15);                  // front glazing
    glazing(gf, M, 'z', -9, 0, -6, 0.02, 3.55, 2.25);                    // west glazing
    // interior: warm back wall, living room, kitchen island, pendants
    B(gf, M.glow, -5.8, 15.5, 0.02, 3.5, -8.98, -8.9, { cast: false });
    B(gf, M.rug, -4.5, 2.5, 0.02, 0.04, -6.8, -2.2, { cast: false });
    gf.add(sofa(M, -4, 2, -6.4, -5.3)); gf.add(sofa(M, -4.4, -3.4, -5.3, -2.6));
    B(gf, M.teak, -1.5, 0.8, 0, 0.36, -4.4, -3.2, { r: 0.04 });
    B(gf, M.white, 6, 10.5, 0, 0.95, -5.6, -4.4, { r: 0.04 }); B(gf, M.dark, 6, 15.4, 0, 0.92, -8.9, -8.2);
    gf.add(table(M, 6.2, 10.2, -2.6, -1.4)); chairsAround(M, gf, 6.4, 10, -2.6, -1.4);
    [6.8, 8.2, 9.6].forEach(x => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), M.lamp); l.position.set(x, 2.6, -2); gf.add(l); B(gf, M.dark, x - 0.01, x + 0.01, 2.7, 3.6, -2.01, -1.99, { cast: false }); });
    B(gf, M.blue, -1.2, 1.6, 1.0, 2.6, -8.88, -8.84, { cast: false });   // artwork
    // ceiling slab with deep overhang (its own part so the model can lift it)
    const slab = new THREE.Group(); g.add(slab); parts.slab = slab;
    B(slab, M.concrete, -7, 17, 3.6, 4.05, -10, 1.6, { r: 0.04 });
    B(slab, M.wood, -6.9, 16.9, 3.58, 3.6, -0.2, 1.55, { cast: false });  // timber soffit strip

    // upper volume: cantilevers west over the pool, x[-14,8] z[-7.5,0.5] y 4.05..7.4
    const up = new THREE.Group(); g.add(up); parts.upper = up;
    const y0 = 4.05, y1 = 7.4;
    B(up, M.concrete, -14, 8, y0, y0 + 0.55, -7.5, 0.5, { r: 0.03 });   // floor band
    if (!cutaway) B(up, M.concrete, -14, 8, y1 - 0.5, y1, -7.5, 0.5, { r: 0.03 });    // roof band
    else { [[-5, -6.9, -0.6], [-1, -6.9, -0.6], [4, -6.9, -2.2]].forEach(([x, z0, z1]) => { B(up, M.white, x - 0.08, x + 0.08, y0 + 0.55, y1 - 0.5, z0, z1 - 1.2); }); B(up, M.white, -5, -1, y0 + 0.55, y1 - 0.5, -3.1, -2.95); B(up, M.white, -4.6, -2.6, y0 + 0.55, y0 + 1.15, -6.6, -5.6, { r: 0.25 }); B(up, M.wood, -4.8, -1.3, y0 + 0.55, y1 - 1.0, -2.6, -2.1); }
    B(up, M.concrete, -14, -13.3, y0, y1, -7.5, 0.5, { r: 0.03 });       // west end
    B(up, M.concrete, 7.3, 8, y0, y1, -7.5, 0.5, { r: 0.03 });           // east end
    B(up, M.concrete, -14, 8, y0, y1, -7.5, -6.9);                      // back wall
    glazing(up, M, 'x', -13.3, 7.3, -0.1, y0 + 0.55, y1 - 0.5, 2.0);   // ribbon window, recessed
    B(up, M.glow, -13.2, 7.2, y0 + 0.55, y1 - 0.5, -6.88, -6.8, { cast: false });
    const fy = y0 + 0.55;
    const b1 = bed(M, -9.5, -5.2); b1.position.y = fy; up.add(b1);
    const b2 = bed(M, 2.5, -5.2); b2.position.y = fy; up.add(b2);
    B(up, M.rug, -12, -7, fy, fy + 0.02, -4.4, -1.4, { cast: false });
    [[-3.5, -6.5], [5.5, -6.5]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), M.lamp); l.position.set(x, fy + 1.6, z); up.add(l); });
    // travertine fins on the cantilever face
    for (let x = -13; x < 7.4; x += 4.1) B(up, M.travPlain, x, x + 0.18, y0 + 0.55, y1 - 0.5, 0.0, 0.55);
    // roof terrace: glass balustrade + pergola + solar strip
    if (!cutaway) {
    B(up, M.rail, -14, -2, y1, y1 + 1.05, 0.42, 0.48, { cast: false, recv: false });
    B(up, M.frame, -14, -2, y1 + 1.0, y1 + 1.06, 0.4, 0.5);
    const pg = pergola(M, -12.5, -6.5, -6.6, -1.2, 2.5); pg.position.y = y1; up.add(pg);
    const rl = lounger(M, -4, -4.5, Math.PI); rl.position.y = y1; up.add(rl);
    }
    up.position.y = upperLift;

    // stair/chimney tower in travertine (anchors the composition)
    B(g, M.trav, 10.5, 13.5, 0, 9.4, -11.6, -8.2, { r: 0.03 });
    B(g, M.frame, 11.2, 12.8, 4.8, 8.6, -8.22, -8.16);

    // terrace furniture: loungers + umbrellas between glass and pool
    [-14.5, -12.5, -10.5, -8.5, -4.5, -2.5].forEach((x, i) => g.add(lounger(M, x, 2.2, Math.PI)));
    [-11.5, -3.5].forEach(x => g.add(umbrella(M, x, 1.2)));
    // dining pergola on the east deck
    g.add(pergola(M, 6, 13.5, 4.8, 9.6));
    g.add(table(M, 7.4, 12, 6.6, 7.8)); chairsAround(M, g, 7.6, 11.8, 6.6, 7.8);
    // outdoor lounge (sofa block) by the east wall
    g.add(sofa(M, 14.6, 19, 1.4, 2.4)); g.add(sofa(M, 18.2, 19.2, 2.4, 5)); B(g, M.teak, 15.6, 17.4, 0, 0.32, 3, 4.2, { r: 0.04 });
    // planters + lavender
    [[-19, -10], [-19, -4], [18.5, -11], [3, 10.4]].forEach(([x, z]) => {
      B(g, M.trav, x - 0.8, x + 0.8, 0, 0.55, z - 0.8, z + 0.8, { r: 0.03 });
      for (let i = 0; i < 5; i++) { const s = shrub(M, M.lavender, r, 0.7 + r() * 0.3); s.position.set(x + (r() - 0.5), 0.75, z + (r() - 0.5)); g.add(s); }
    });
    // olives + cypresses
    [[-18, -1.5, 1.15], [17.8, 9.2, 1.0], [-18.5, 8.6, 0.95], [16.5, -6, 0.9]].forEach(([x, z, s]) => { const o = olive(M, r, s); o.position.set(x, 0, z); g.add(o); });
    [[-4, -11.2, 8], [-1.5, -11.4, 9.5], [1, -11.1, 7.2], [17.5, -10.5, 8.5]].forEach(([x, z, h]) => { const c = cypress(M, r, h); c.position.set(x, 0, z); g.add(c); });
    // glass balustrade on the cliff edges
    B(g, M.rail, -20, -16, 0, 1.05, 10.92, 10.98, { cast: false, recv: false }); B(g, M.rail, 2, 20, 0, 1.05, 10.92, 10.98, { cast: false, recv: false });
    return { group: g, parts };
  }

  /* ---------- cliff: stacked strata below the terrace ---------- */
  function strata(M, { layers = 10, H = 2.7, top = -0.6, rect = [-22, 22, -14, 12.5], spread = 1.6, seed = 21, cut = false, colors = ['#cdb791', '#b59a74', '#c7ae88', '#a68b67', '#bea47e', '#9a815f'] } = {}) {
    const g = new THREE.Group(); const r = rng(seed);
    for (let i = 0; i < layers; i++) {
      const grow = cut ? 0 : i * spread + (r() - 0.35) * 2.2;
      const [x0, x1, z0, z1] = [rect[0] - grow * (0.8 + r() * 0.5), rect[1] + grow * (0.8 + r() * 0.5), rect[2] - grow * 1.6, rect[3] + grow * (0.35 + r() * 0.25)];
      const pts = [];
      const jit = cut ? 0 : 1.1 + i * 0.12;
      const edge = (ax, az, bx, bz) => { const n = Math.max(2, Math.round(Math.hypot(bx - ax, bz - az) / (cut ? 6 : 1.5))); for (let k = 0; k < n; k++) { const t = k / n; pts.push(new THREE.Vector2(ax + (bx - ax) * t + (r() - 0.5) * jit, -(az + (bz - az) * t + (r() - 0.5) * jit))); } };
      edge(x0, z1, x1, z1); edge(x1, z1, x1, z0); edge(x1, z0, x0, z0); edge(x0, z0, x0, z1);
      const shape = new THREE.Shape(pts);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: H - 0.3, bevelEnabled: true, bevelThickness: 0.15, bevelSize: cut ? 0.06 : 0.35, bevelSegments: 1, steps: 1 });
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.92, flatShading: !cut }));
      m.position.y = top - (i + 1) * H + 0.15; m.castShadow = i < 2; m.receiveShadow = true;
      g.add(m);
    }
    return g;
  }
  /* full hero site: cliff + sea + distant headlands */
  function site(M, { seaY = -27, layers = 10 } = {}) {
    const g = new THREE.Group();
    g.add(strata(M, { layers, H: (-0.6 - seaY) / layers, spread: 0.28 }));
    const r = rng(9);
    for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + r() * 2.4, 0), new THREE.MeshStandardMaterial({ color: ['#bda47f', '#cbb591', '#a99070'][i % 3], roughness: 1, flatShading: true })); b.position.set(-30 + r() * 64, seaY + 0.2, 15 + r() * 8); b.rotation.set(r() * 3, r() * 3, r() * 3); b.castShadow = true; g.add(b); }
    for (let i = 0; i < 46; i++) { const sh = shrub(M, r() > 0.5 ? M.leaf : M.leaf2, r, 0.7 + r() * 0.9); sh.scale.x = 1.6; const L = 1 + (r() * 6 | 0); const H = (-0.6 - seaY) / layers; sh.position.set(-24 + r() * 50, -0.6 - L * H + 0.15 + 0.3, 12.8 + L * 0.28 + r() * 1.2); g.add(sh); }
    const sm = sea();
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), sm); s.rotation.x = -Math.PI / 2; s.position.y = seaY; s.renderOrder = -1; g.add(s);
    // distant headlands in aerial haze
    const hz = [['#d9b9a0', 0.9], ['#cfae98', 0.85], ['#e3c6ad', 0.8]];
    [[-300, -520, 160, 11, 0], [140, -600, 260, 15, 1], [420, -480, 140, 8, 2], [-620, -420, 180, 9, 2]].forEach(([x, z, w, h, k]) => {
      const pts = []; const n = 14; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector2(-w / 2 + t * w, Math.pow(Math.sin(t * Math.PI), 0.8) * h * (0.75 + r() * 0.35))); }
      pts.push(new THREE.Vector2(w / 2, -2), new THREE.Vector2(-w / 2, -2));
      const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), new THREE.MeshBasicMaterial({ color: hz[k][0], transparent: true, opacity: hz[k][1], fog: false }));
      m.position.set(x, seaY, z); m.lookAt(x * 0.2, seaY, 400); g.add(m);
    });
    return { group: g, sea: sm };
  }

  /* ---------- floor-by-floor dollhouse ---------- */
  const PLAN = [
    { name: 'Spa level', code: 'L−1', fp: [-6, 16, -9, 0], rooms: [
      ['Spa pool', 'spa', -6, 4, -9, 0], ['Hammam', 'bath', 4, 8, -9, -4.5], ['Gym', 'gym', 4, 10, -4.5, 0], ['Cinema', 'cinema', 8, 16, -9, -4.5], ['Cellar', 'wine', 10, 13, -4.5, 0], ['Stair', 'stair', 13, 16, -4.5, 0]] },
    { name: 'Ground', code: 'L0', fp: [-6, 16, -9, 0], rooms: [
      ['Living', 'living', -6, 5, -9, 0], ['Kitchen', 'kitchen', 5, 11, -9, -4.5], ['Dining', 'dining', 5, 11, -4.5, 0], ['Library', 'study', 11, 16, -9, -4.5], ['Stair', 'stair', 13, 16, -4.5, 0], ['Guest WC', 'wc', 11, 13, -4.5, 0]] },
    { name: 'Upper', code: 'L1', fp: [-14, 8, -7.5, 0.5], rooms: [
      ['Principal suite', 'bed', -14, -5, -7.5, 0.5], ['Bath', 'bath', -5, -1, -7.5, -3], ['Dressing', 'closet', -5, -1, -3, 0.5], ['Bedroom II', 'bed', -1, 4, -7.5, 0.5], ['Bedroom III', 'bed', 4, 8, -7.5, -2.5], ['Stair', 'stair', 4, 8, -2.5, 0.5]] },
    { name: 'Sky terrace', code: 'R', fp: [-14, 8, -7.5, 0.5], rooms: [
      ['Sky terrace', 'terrace', -14, 4, -7.5, 0.5], ['Stair', 'stair', 4, 8, -2.5, 0.5]] },
  ];
  function floors(M, { gap = 6.2, highlight = 'Principal suite', waterMat } = {}) {
    const root = new THREE.Group(); const levels = []; const labels = [];
    const hiMat = new THREE.MeshStandardMaterial({ color: '#7cc7d6', emissive: '#2aa7c4', emissiveIntensity: 0.35, transparent: true, opacity: 0.55 });
    PLAN.forEach((L, li) => {
      const g = new THREE.Group(); g.position.y = li * gap; root.add(g); levels.push(g);
      const [fx0, fx1, fz0, fz1] = L.fp, WH = L.code === 'R' ? 1.1 : 2.5;
      // slab: oak floor inside, travertine edge
      B(g, M.concrete, fx0 - 0.25, fx1 + 0.25, -0.45, -0.05, fz0 - 0.25, fz1 + 0.25, { r: 0.04 });
      const fl = B(g, M.wood, fx0, fx1, -0.05, 0, fz0, fz1, { cast: false }); fl.material = M.wood.clone(); fl.material.color.set(L.code === 'R' ? '#c9b48f' : '#e2c7a2'); fl.material.map = texFor(woodTex(), (fx1 - fx0) / 3, (fz1 - fz0) / 3);
      if (L.code === 'R') fl.material = Object.assign(M.trav.clone(), { map: texFor(travertine(), (fx1 - fx0) / 4, (fz1 - fz0) / 4) });
      // perimeter: glass to the sea (front z1 + west), solid at back/east
      if (L.code !== 'R') {
        B(g, M.concrete, fx0, fx1, 0, WH, fz0, fz0 + 0.22);
        B(g, M.concrete, fx1 - 0.22, fx1, 0, WH, fz0, fz1);
        glazing(g, M, 'x', fx0, fx1 - 0.22, fz1 - 0.05, 0, WH, 2.2);
        glazing(g, M, 'z', fz0, fz1, fx0 + 0.05, 0, WH, 2.2);
      } else {
        B(g, M.rail, fx0, fx1, 0, 1.05, fz1 - 0.04, fz1, { cast: false, recv: false }); B(g, M.rail, fx0, fx0 + 0.04, 0, 1.05, fz0, fz1, { cast: false, recv: false });
        B(g, M.concrete, fx0, fx1, 0, 0.5, fz0, fz0 + 0.2);
      }
      // interior walls with door gaps (deduped)
      const seen = new Set();
      const wall = (ax, az, bx, bz) => {
        const k = [ax, az, bx, bz].map(v => v.toFixed(2)).join(); if (seen.has(k)) return; seen.add(k);
        const len = Math.hypot(bx - ax, bz - az); if (len < 0.5) return;
        const gapW = len > 2.6 ? 1.0 : 0; const mid = len * 0.62;
        const segs = gapW ? [[0, mid - gapW / 2], [mid + gapW / 2, len]] : [[0, len]];
        segs.forEach(([s0, s1]) => {
          const p0 = s0 / len, p1 = s1 / len;
          const x0 = ax + (bx - ax) * p0, x1 = ax + (bx - ax) * p1, z0 = az + (bz - az) * p0, z1 = az + (bz - az) * p1;
          B(g, M.white, Math.min(x0, x1) - 0.08, Math.max(x0, x1) + 0.08, 0, WH, Math.min(z0, z1) - 0.08, Math.max(z0, z1) + 0.08);
        });
      };
      L.rooms.forEach(([name, type, x0, x1, z0, z1]) => {
        if (L.code !== 'R' || type === 'stair') {
          if (x0 > fx0 + 0.1) wall(x0, z0, x0, z1); if (x1 < fx1 - 0.1) wall(x1, z0, x1, z1);
          if (z0 > fz0 + 0.1) wall(x0, z0, x1, z0); if (z1 < fz1 - 0.1) wall(x0, z1, x1, z1);
        }
        furnish(g, M, type, x0, x1, z0, z1, waterMat);
        if (name === highlight) B(g, hiMat, x0 + 0.12, x1 - 0.12, 0.01, 0.05, z0 + 0.12, z1 - 0.12, { cast: false, recv: false });
        if (type !== 'stair' || li === 0) labels.push({ name, level: L.code, type, sqm: Math.round((x1 - x0) * (z1 - z0)), at: new THREE.Vector3((x0 + x1) / 2, li * gap + (L.code === 'R' ? 1.6 : 2.9), (z0 + z1) / 2) });
      });
    });
    return { group: root, levels, labels, plan: PLAN };
  }
  function furnish(g, M, type, x0, x1, z0, z1, waterMat) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
    const add = o => { g.add(o); return o; };
    switch (type) {
      case 'living':
        B(g, M.rug, cx - 3, cx + 2.5, 0, 0.02, cz - 2.2, cz + 2, { cast: false });
        add(sofa(M, cx - 2.6, cx + 1.8, cz - 2.4, cz - 1.4)); add(sofa(M, cx - 3.4, cx - 2.4, cz - 1.4, cz + 1.4));
        B(g, M.teak, cx - 1.2, cx + 0.8, 0, 0.36, cz - 0.4, cz + 0.8, { r: 0.04 });
        B(g, M.dark, cx - 1.6, cx + 1.6, 0, 0.5, z0 + 0.25, z0 + 0.7); B(g, M.blue, cx - 1.2, cx + 1.2, 0.9, 2.1, z0 + 0.22, z0 + 0.26, { cast: false });
        add(olive(M, rng(4), 0.38)).position.set(x1 - 1, 0, z1 - 1); break;
      case 'kitchen':
        B(g, M.dark, x0 + 0.3, x1 - 0.3, 0, 0.92, z0 + 0.25, z0 + 0.9); B(g, M.dark, x0 + 0.3, x1 - 0.3, 1.6, 2.3, z0 + 0.25, z0 + 0.6);
        B(g, M.trav, cx - 1.6, cx + 1.6, 0, 0.95, cz - 0.1, cz + 0.9, { r: 0.03 }); break;
      case 'dining':
        add(table(M, cx - 1.8, cx + 1.8, cz - 0.5, cz + 0.5)); chairsAround(M, g, cx - 1.6, cx + 1.6, cz - 0.5, cz + 0.5);
        [-1, 0, 1].forEach(k => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), M.lamp); l.position.set(cx + k * 1.1, 1.75, cz); g.add(l); }); break;
      case 'study':
        B(g, M.wood, x0 + 0.25, x1 - 0.25, 0, 2.3, z0 + 0.25, z0 + 0.6); B(g, M.teak, cx - 1, cx + 1, 0.7, 0.76, cz, cz + 0.8); B(g, M.linen, cx - 1.4, cx - 0.4, 0, 0.7, cz + 1.2, cz + 2.1, { r: 0.1 }); break;
      case 'bed':
        add(bed(M, cx, z0 + 1.6)); B(g, M.rug, cx - 1.6, cx + 1.6, 0, 0.02, z0 + 2.2, Math.min(z1 - 0.4, z0 + 4.6), { cast: false });
        if (w > 6) { add(sofa(M, x0 + 0.6, x0 + 1.5, cz + 0.4, cz + 2.4)); add(lounger(M, x1 - 1.5, z1 - 1.4, Math.PI)); } break;
      case 'bath': {
        B(g, M.white, x0 + 0.4, x0 + 2.2, 0, 0.6, cz - 0.5, cz + 0.5, { r: 0.25 });
        const wtr = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), M.tile); wtr.rotation.x = -Math.PI / 2; wtr.position.set(x0 + 1.3, 0.61, cz); g.add(wtr);
        B(g, M.trav, x1 - 0.8, x1 - 0.25, 0, 0.85, z0 + 0.5, z0 + 2.6); break; }
      case 'closet': B(g, M.wood, x0 + 0.25, x1 - 0.25, 0, 2.3, z0 + 0.25, z0 + 0.8); B(g, M.trav, cx - 0.7, cx + 0.7, 0, 0.9, cz, cz + 0.8, { r: 0.04 }); break;
      case 'wc': B(g, M.trav, x0 + 0.3, x1 - 0.3, 0, 0.85, z0 + 0.25, z0 + 0.8); break;
      case 'stair': for (let i = 0; i < 10; i++) B(g, M.trav, x0 + 0.3, x1 - 0.3, 0, 0.18 * (i + 1), z0 + 0.3 + i * (d - 0.6) / 10, z0 + 0.3 + (i + 1) * (d - 0.6) / 10, { cast: false }); break;
      case 'gym': [0, 1, 2].forEach(k => B(g, M.dark, x0 + 0.6 + k * 1.8, x0 + 1.8 + k * 1.8, 0, 0.6, cz - 0.4, cz + 0.6, { r: 0.05 })); B(g, M.rug, x0 + 0.4, x1 - 0.4, 0, 0.02, z1 - 1.4, z1 - 0.3, { cast: false }); break;
      case 'cinema':
        B(g, M.lamp, x0 + 0.6, x1 - 0.6, 0.6, 2.2, z0 + 0.24, z0 + 0.28, { cast: false });
        [0, 1].forEach(rw => { for (let k = 0; k < 4; k++) { const x = x0 + 1.1 + k * 1.6; add(sofa(M, x, x + 1.2, z0 + 2 + rw * 1.2, z0 + 2.9 + rw * 1.2, M.dark)); } }); break;
      case 'wine': for (let k = 0; k < 3; k++) B(g, M.wood, x0 + 0.3, x1 - 0.3, 0, 2.2, z0 + 0.3 + k * 1.4, z0 + 0.7 + k * 1.4); break;
      case 'spa': {
        B(g, M.tile, x0 + 1, x1 - 1.2, 0, 0.06, z0 + 1.4, z1 - 2.4, { cast: false });
        const wm = waterMat || water({ sky: '#e9f3f4' });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 2.2 - 0.2, d - 3.8 - 0.2), wm); p.rotation.x = -Math.PI / 2; p.position.set((x0 + 1 + x1 - 1.2) / 2, 0.08, (z0 + 1.4 + z1 - 2.4) / 2); g.add(p);
        B(g, M.trav, x0 + 0.8, x1 - 1, 0, 0.12, z0 + 1.2, z0 + 1.4); B(g, M.trav, x0 + 0.8, x1 - 1, 0, 0.12, z1 - 2.4, z1 - 2.2);
        [x0 + 1.5, x0 + 3.5, x0 + 5.5].forEach(x => add(lounger(M, x, z1 - 1.2, Math.PI))); break; }
      case 'terrace': {
        B(g, M.tile, x0 + 1, x0 + 7, 0, 0.05, z0 + 1, z0 + 4, { cast: false });
        const wm = waterMat || water({ sky: '#e9f3f4' });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 2.8), wm); p.rotation.x = -Math.PI / 2; p.position.set(x0 + 4, 0.08, z0 + 2.5); g.add(p);
        B(g, M.trav, x0 + 0.8, x0 + 7.2, 0, 0.45, z0 + 0.8, z0 + 1); B(g, M.trav, x0 + 0.8, x0 + 7.2, 0, 0.45, z0 + 4, z0 + 4.2); B(g, M.trav, x0 + 7, x0 + 7.2, 0, 0.45, z0 + 1, z0 + 4);
        add(pergola(M, x0 + 9, x0 + 15, z0 + 1, z0 + 6.2, 2.5));
        add(table(M, x0 + 10.2, x0 + 13.8, z0 + 3, z0 + 4.1)); chairsAround(M, g, x0 + 10.4, x0 + 13.6, z0 + 3, z0 + 4.1);
        [x0 + 1.5, x0 + 3.5, x0 + 5.5].forEach(x => add(lounger(M, x, z1 - 1.6, Math.PI)));
        for (let i = 0; i < 6; i++) { const s = shrub(M, M.lavender, rng(30 + i), 0.9); s.position.set(x0 + 16.5, 0.3, z0 + 0.7 + i * 1.2); g.add(s); }
        break; }
    }
  }

  /* ---------- portfolio coastline: contour terraces + villa markers ---------- */
  function coastF(x) { return 9 * Math.sin(x * 0.045) + 6 * Math.sin(x * 0.11 + 1) + 3 * Math.sin(x * 0.27 + 2); }
  function coast(M, { levels = 9, step = 1.6, span = 190, back = -150 } = {}) {
    const g = new THREE.Group(); const r = rng(44);
    const cols = ['#e6dac3', '#ddcdb0', '#d6c3a2', '#cfba96', '#e3d6bd', '#d9c8a8', '#efe7d7', '#f3eee3', '#f7f4ec'];
    for (let k = 0; k < levels; k++) {
      const pts = []; const off = k * 5.5 + k * k * 0.6;
      for (let x = -span; x <= span; x += 3) { pts.push(new THREE.Vector2(x, -(coastF(x) - off + Math.sin(x * 0.19 + k * 1.7) * (1.2 + k * 0.4)))); }
      pts.push(new THREE.Vector2(span, -back), new THREE.Vector2(-span, -back));
      const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: step, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.4, bevelSegments: 1 });
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cols[k % cols.length], roughness: 0.95 }));
      m.position.y = k * step; m.receiveShadow = true; m.castShadow = true; g.add(m);
    }
    // islets
    [[-150, 64, 7], [-136, 74, 3.5], [88, 52, 9], [100, 44, 3]].forEach(([x, z, rad]) => {
      for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(rad * (1 - k * 0.3), rad * (1 - k * 0.3) + 0.4, step, 18), new THREE.MeshStandardMaterial({ color: cols[k + 1], roughness: 0.95, flatShading: true })); c.position.set(x + k * 0.6, k * step + step / 2, z - k * 0.4); c.castShadow = c.receiveShadow = true; g.add(c); }
    });
    return { group: g, f: coastF, height: (x, z) => { let k = 0; for (let i = 0; i < levels; i++) if (z < coastF(x) - (i * 5.5 + i * i * 0.6) - 1.5) k = i + 1; return k * step; } };
  }
  function miniVilla(M, s = 1, rot = 0) {
    const g = new THREE.Group();
    B(g, M.trav, -2.4, 2.4, 0, 0.3, -1.6, 2.2);
    B(g, M.white, -1.8, 1.4, 0.3, 1.5, -1.4, 0.2);
    B(g, M.white, -2.2, 0.8, 1.5, 2.5, -1.2, 0.5);
    B(g, M.glass, -1.7, 1.3, 0.4, 1.4, 0.18, 0.24, { cast: false });
    B(g, M.tile, -1.8, 1.0, 0.3, 0.34, 0.7, 1.9, { cast: false });
    g.scale.setScalar(s); g.rotation.y = rot; return g;
  }
  function pinMesh(color = '#0f5e7a', h = 6) {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 6), new THREE.MeshStandardMaterial({ color: '#111' })); stem.position.y = h / 2; g.add(stem);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), new THREE.MeshPhysicalMaterial({ color, roughness: 0.15, clearcoat: 1, emissive: color, emissiveIntensity: 0.25 })); head.position.y = h; head.castShadow = true; g.add(head);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
    g.userData.head = head; g.userData.ring = ring;
    return g;
  }
  function boat(M) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.25, 4, 8, 1), M.white); hull.rotation.z = Math.PI / 2; hull.scale.set(1, 1, 0.6); hull.position.y = 0.3; g.add(hull);
    B(g, M.white, -0.6, 0.8, 0.5, 1.0, -0.35, 0.35);
    const wake = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35 })); wake.rotation.x = -Math.PI / 2; wake.position.set(-7.5, 0.05, 0); g.add(wake);
    return g;
  }

  return { stage, lights, mats, B, water, sea, villa, strata, site, floors, coast, miniVilla, pinMesh, boat, olive, cypress, rng, canvasTex, PLAN };
};
