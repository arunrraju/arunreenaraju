/* AETHER — shared Three.js kit (classic script; the page's module passes THREE in).
   window.A3D(THREE, {RoomEnvironment, RoundedBoxGeometry}) returns builders:
   stage(), earth(), stars(), capsule(), station(), moon(), orbit(), trail(), glow(), canvasTex(). */
window.__pending3d = 0;
window.A3D = function (THREE, X) {
  const TEX = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/';
  const loader = new THREE.TextureLoader();
  const cache = {};
  const load = (f, srgb) => cache[f] || (cache[f] = loader.loadAsync(TEX + f).then(t => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }));
  const BLUE = new THREE.Color('#3d8bff');

  /* ---------- stage: renderer + scene + camera, fixed pixel size ---------- */
  function stage(el, { w = el.clientWidth, h = el.clientHeight, fov = 30, env = true, exposure = 1 } = {}) {
    window.__pending3d++;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
    catch (e) { console.warn('webgl off', e); done(); return null; }
    renderer.setPixelRatio(1); renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    if (env && X.RoomEnvironment) {
      const pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(new X.RoomEnvironment(renderer), 0.04).texture;
    }
    const camera = new THREE.PerspectiveCamera(fov, w / h, 0.05, 400);
    let first = true, t0 = performance.now(), onFrame = () => {};
    function done() { if (--window.__pending3d <= 0) window.__ready3d = true; }
    function run(fn, ready = Promise.resolve()) {
      onFrame = fn;
      ready.catch(e => console.warn(e)).then(() => {
        const tick = () => {
          const t = (performance.now() - t0) / 1000;
          onFrame(t); renderer.render(scene, camera);
          if (first) { first = false; requestAnimationFrame(() => done()); }
          requestAnimationFrame(tick);
        };
        tick();
      });
    }
    return { renderer, scene, camera, run, w, h };
  }

  /* ---------- canvas texture helper ---------- */
  function canvasTex(w, h, draw, srgb = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  /* ---------- Earth: day / night city lights / clouds / ocean glint / Fresnel atmosphere ---------- */
  function earth({ radius = 1, sun = new THREE.Vector3(-1, 0.35, 0.6), seg = 96, lights = 1 } = {}) {
    const g = new THREE.Group();
    const U = { day: { value: null }, clouds: { value: null }, nrm: { value: null }, sun: { value: sun.clone().normalize() }, t: { value: 0 }, lights: { value: lights } };
    const mat = new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vT;
        void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vT=normalize(mat3(modelMatrix)*vec3(-position.z,0.,position.x));
          vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform sampler2D day, clouds, nrm; uniform vec3 sun; uniform float t, lights;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vT;
        float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
        void main(){
          vec3 N=normalize(vN); vec3 Tn=normalize(vT); vec3 B=normalize(cross(N,Tn));
          vec3 nm=texture2D(nrm,vUv).xyz*2.-1.; vec3 Np=normalize(Tn*nm.x*.28+B*nm.y*.28+N*nm.z);
          vec3 V=normalize(cameraPosition-vW); vec3 L=normalize(sun);
          vec3 d=texture2D(day,vUv).rgb;
          vec4 ct=texture2D(clouds,vUv+vec2(t*.0025,0.)); float cl=ct.a*ct.r;
          float df=dot(N,L); float dfp=max(dot(Np,L),0.)*smoothstep(-.05,.25,df);
          float dayMix=smoothstep(-.18,.2,df);
          float ocean=smoothstep(.0,.04,d.b-d.r*1.25);
          vec3 H=normalize(L+V); float spec=(pow(max(dot(N,H),0.),260.)*.9+pow(max(dot(N,H),0.),30.)*.08)*ocean*smoothstep(0.,.3,df)*(1.-cl);
          vec3 dayCol=d*dfp*1.9 + spec*vec3(1.,.86,.7);
          dayCol=mix(dayCol, vec3(.95,.97,1.)*max(df,0.)*1.25, cl*.9);
          float lum=dot(d,vec3(.33));
          float land=(1.-ocean)*(1.-smoothstep(.07,.16,lum));
          float cluster=n(vUv*vec2(160.,80.))*n(vUv*vec2(44.,22.)+3.); float sp=n(vUv*vec2(1100.,550.))*n(vUv*vec2(420.,210.)+9.); float city=smoothstep(.25,.6,cluster)*smoothstep(.3,.75,sp)*1.4+smoothstep(.5,.8,cluster)*.06;
          float lt=land*city*(1.-cl*.8)*lights;
          vec3 nightCol=vec3(1.,.68,.32)*lt*2.2 + vec3(.02,.04,.09)*cl*.25 + d*.01;
          vec3 col=mix(nightCol, dayCol, dayMix);
          float term=smoothstep(.3,0.,abs(df+.02)); 
          float fr=pow(1.-max(dot(N,V),0.),2.6); col+=vec3(.2,.5,1.)*fr*smoothstep(-.35,.55,df)*1.0;
          gl_FragColor=vec4(col,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, seg, seg / 2), mat);
    g.add(sphere);
    // outer atmosphere glow
    const atm = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.06, 64, 32), new THREE.ShaderMaterial({
      uniforms: { sun: U.sun },
      vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform vec3 sun; varying vec3 vN; varying vec3 vW;
        void main(){ vec3 V=normalize(cameraPosition-vW); vec3 N=normalize(vN);
          float r=dot(N,V); float a=pow(smoothstep(0.,.62,-r),1.0)*pow(1.-smoothstep(.0,.62,-r),.0);
          float edge=pow(clamp(1.+r*1.0,0.,1.),5.);
          float i=pow(smoothstep(.0,.33,-r),2.6);
          float s=smoothstep(-.5,.7,dot(N,normalize(sun)));
          vec3 c=mix(vec3(.08,.28,1.),vec3(.4,.68,1.),s);
          gl_FragColor=vec4(c*i*(0.05+.8*s),1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    }));
    g.add(atm);
    const ready = Promise.all([load('earth_atmos_2048.jpg', true), load('earth_clouds_1024.png'), load('earth_normal_2048.jpg')])
      .then(([a, c, nm]) => { U.day.value = a; U.clouds.value = c; U.nrm.value = nm; });
    return { group: g, sphere, uniforms: U, ready };
  }

  /* ---------- starfield ---------- */
  function stars({ count = 3500, radius = 120, size = 2.2, seed = 7 } = {}) {
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const pos = new Float32Array(count * 3), sz = new Float32Array(count), col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = radius * (0.8 + rnd() * 0.2), q = Math.sqrt(1 - u * u);
      pos.set([r * q * Math.cos(th), r * u, r * q * Math.sin(th)], i * 3);
      const b = Math.pow(rnd(), 6); sz[i] = 0.6 + b * size * 2.4;
      const tint = rnd(); const c = tint < .15 ? [1, .85, .7] : tint > .85 ? [.7, .82, 1] : [1, 1, 1];
      const k = 0.35 + b * 0.9 + rnd() * 0.25; col.set(c.map(v => v * k), i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { t: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; uniform float t;
        void main(){ vC=color*(.75+.25*sin(t*1.7+position.x*3.1)); vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=size; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vC; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.0,d); gl_FragColor=vec4(vC*a*a,1.); }`
    });
    const p = new THREE.Points(geo, mat); p.renderOrder = -10; return p;
  }

  /* ---------- glow sprite ---------- */
  function glow(color = '#9cc4ff', size = 1, strength = 1) {
    const t = canvasTex(256, 256, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.12, color); g.addColorStop(.4, 'rgba(40,90,200,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: strength }));
    s.scale.setScalar(size); return s;
  }

  /* ---------- orbit line + fading trail ---------- */
  function ellipse(a, b, n = 256, tilt = [0, 0, 0]) {
    const pts = []; for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(t) * a, 0, Math.sin(t) * b)); }
    const e = new THREE.Euler(...tilt); pts.forEach(p => p.applyEuler(e)); return pts;
  }
  function orbit(points, { color = '#3d8bff', opacity = .45, dashed = false } = {}) {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = dashed ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: .06, gapSize: .05, depthWrite: false })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    const l = new THREE.Line(geo, mat); if (dashed) l.computeLineDistances(); return l;
  }
  // trail: a tube of points behind a moving object, coloured fade (additive)
  function trail(len = 90, color = '#7fb2ff') {
    const pos = new Float32Array(len * 3), col = new Float32Array(len * 3); const c = new THREE.Color(color);
    for (let i = 0; i < len; i++) { const k = Math.pow(1 - i / len, 1.6); col.set([c.r * k, c.g * k, c.b * k], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    l.frustumCulled = false;
    l.update = (fn, t, step) => { for (let i = 0; i < len; i++) { const p = fn(t - i * step); pos.set([p.x, p.y, p.z], i * 3); } geo.attributes.position.needsUpdate = true; };
    return l;
  }

  /* ---------- materials ---------- */
  const M = {
    hull: () => new THREE.MeshPhysicalMaterial({ color: '#eef1f5', metalness: .05, roughness: .32, clearcoat: 1, clearcoatRoughness: .12 }),
    shield: () => new THREE.MeshPhysicalMaterial({ color: '#2a2622', metalness: .2, roughness: .7 }),
    foil: () => new THREE.MeshPhysicalMaterial({ color: '#d6a64a', metalness: 1, roughness: .28, bumpMap: crinkle(), bumpScale: 2, iridescence: .35, iridescenceIOR: 1.6 }),
    dark: () => new THREE.MeshPhysicalMaterial({ color: '#16181c', metalness: .8, roughness: .3, clearcoat: .6 }),
    steel: () => new THREE.MeshPhysicalMaterial({ color: '#9aa0a8', metalness: 1, roughness: .25 }),
    glass: () => new THREE.MeshPhysicalMaterial({ color: '#0a1220', metalness: .1, roughness: .02, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2 }),
    panel: () => new THREE.MeshPhysicalMaterial({ map: solarTex(), color: '#ffffff', metalness: .65, roughness: .3, clearcoat: 1, clearcoatRoughness: .1, iridescence: .5, iridescenceIOR: 1.3, side: THREE.DoubleSide }),
    emit: (c = '#3d8bff', k = 3) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false })
  };
  let _crinkle, _solar;
  function crinkle() {
    return _crinkle || (_crinkle = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#808080'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { c.strokeStyle = `rgba(${Math.random() < .5 ? 255 : 0},${Math.random() < .5 ? 255 : 0},${Math.random() < .5 ? 255 : 0},.18)`; c.lineWidth = 1 + Math.random() * 3; c.beginPath(); const x = Math.random() * w, y = Math.random() * h; c.moveTo(x, y); c.lineTo(x + (Math.random() - .5) * 60, y + (Math.random() - .5) * 60); c.stroke(); }
    }, false));
  }
  function solarTex() {
    return _solar || (_solar = (() => {
      const t = canvasTex(512, 128, (c, w, h) => {
        c.fillStyle = '#0b1530'; c.fillRect(0, 0, w, h);
        const cw = w / 16, ch = h / 4;
        for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) {
          const g = c.createLinearGradient(x * cw, y * ch, x * cw + cw, y * ch + ch);
          g.addColorStop(0, '#16305e'); g.addColorStop(1, '#0a1838'); c.fillStyle = g; c.fillRect(x * cw + 1.5, y * ch + 1.5, cw - 3, ch - 3);
          c.strokeStyle = 'rgba(160,190,255,.18)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x * cw + k * cw / 4, y * ch + 2); c.lineTo(x * cw + k * cw / 4, y * ch + ch - 2); c.stroke(); }
        }
        c.fillStyle = '#c9a24d'; c.fillRect(0, h / 2 - 1.5, w, 3);
      });
      t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
    })());
  }

  /* ---------- capsule: crew module + service module + solar wings ---------- */
  function lathe(pts, mat, seg = 64, phiStart = 0, phiLen = Math.PI * 2) {
    return new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg, phiStart, phiLen), mat);
  }
  const CREW = [[0, .02], [.47, .03], [.5, .06], [.5, .1], [.44, .3], [.33, .52], [.22, .7], [.2, .73], [.2, .8], [.17, .82], [.17, .9], [.12, .93], [0, .93]];
  function capsule({ wings = true, label = 'AETHER' } = {}) {
    const g = new THREE.Group();
    const hull = M.hull(), foil = M.foil(), dark = M.dark(), steel = M.steel();
    g.add(lathe(CREW, hull));
    g.add(lathe([[0, -.03], [.3, -.025], [.49, 0], [.51, .03], [.5, .06], [0, .06]], M.shield()));
    // docking ring & band seams
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.19, .018, 12, 48), steel); ring.rotation.x = Math.PI / 2; ring.position.y = .9; g.add(ring);
    [.18, .42].forEach(y => { const r = .5 - (y - .1) * .33 / .42 * 1.0; const s = new THREE.Mesh(new THREE.TorusGeometry(Math.max(.2, r * 1.0 - .005), .004, 6, 80), dark); s.rotation.x = Math.PI / 2; s.position.y = y; g.add(s); });
    // windows (glossy dark lozenges on the cone)
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2 + .4, y = .44, r = .355;
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .02, 24), M.glass());
      const fr = new THREE.Mesh(new THREE.TorusGeometry(.058, .008, 8, 24), dark);
      [w, fr].forEach(m => { m.position.set(Math.cos(a) * r, y, Math.sin(a) * r); g.add(m); });
      const nrm = new THREE.Vector3(Math.cos(a) * .82, .55, Math.sin(a) * .82);
      w.lookAt(w.position.clone().add(nrm)); w.rotateX(Math.PI / 2); fr.lookAt(fr.position.clone().add(nrm));
    }
    // RCS thruster blocks
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; const b = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .03), dark); b.position.set(Math.cos(a) * .41, .27, Math.sin(a) * .41); b.lookAt(0, .27, 0); g.add(b); }
    // service module
    const sm = new THREE.Group(); sm.position.y = -.02;
    sm.add(lathe([[0, -.66], [.4, -.66], [.44, -.62], [.44, -.06], [.46, -.05], [.46, 0], [0, 0]], foil));
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.452, .452, .1, 64, 1, true), hull); band.position.y = -.12; sm.add(band);
    // radiator ribs
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const r = new THREE.Mesh(new THREE.BoxGeometry(.012, .38, .012), steel); r.position.set(Math.cos(a) * .447, -.4, Math.sin(a) * .447); sm.add(r); }
    // label on band
    if (label) {
      const lt = canvasTex(1024, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#121418'; c.font = '600 34px Sora, Arial'; c.textBaseline = 'middle'; c.letterSpacing = '22px'; c.fillText(label, 40, h / 2 + 2); c.fillStyle = '#3d8bff'; c.fillRect(380, h / 2 - 2, 120, 4); });
      const lbl = new THREE.Mesh(new THREE.CylinderGeometry(.455, .455, .07, 64, 1, true, -.2, 2.4), new THREE.MeshPhysicalMaterial({ map: lt, transparent: true, roughness: .4, clearcoat: 1 }));
      lbl.position.y = -.12; sm.add(lbl);
    }
    // engine bell
    sm.add(lathe([[.08, -.64], [.1, -.7], [.16, -.84], [.22, -.95], [.215, -.955], [.155, -.84], [.095, -.7], [.075, -.64]], new THREE.MeshPhysicalMaterial({ color: '#5a5048', metalness: 1, roughness: .35, side: THREE.DoubleSide }), 48));
    const flame = new THREE.Mesh(new THREE.ConeGeometry(.17, .5, 32, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color('#7fb2ff').multiplyScalar(1.4), transparent: true, opacity: .0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    flame.position.y = -1.18; flame.rotation.x = Math.PI; sm.add(flame); g.userData.flame = flame;
    if (wings) {
      const pm = M.panel();
      for (let i = 0; i < 4; i++) {
        const arm = new THREE.Group(); arm.rotation.y = i / 4 * Math.PI * 2 + Math.PI / 4; arm.position.y = -.42;
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .2, 8), steel); strut.rotation.z = Math.PI / 2; strut.position.x = .55; arm.add(strut);
        for (let k = 0; k < 3; k++) {
          const p = new THREE.Mesh(new THREE.BoxGeometry(.42, .006, .3), pm); p.position.x = .86 + k * .44; arm.add(p);
          const e = new THREE.Mesh(new THREE.BoxGeometry(.43, .012, .012), steel); e.position.set(.86 + k * .44, 0, .15); arm.add(e);
          const e2 = e.clone(); e2.position.z = -.15; arm.add(e2);
        }
        arm.rotation.x = .18; sm.add(arm);
      }
    }
    g.add(sm);
    return g;
  }

  /* ---------- Moon: procedural craters on a canvas ---------- */
  function moonTex(seed = 3) {
    let s = seed; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const W = 2048, H = 1024;
    const mk = (fill) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = fill; x.fillRect(0, 0, W, H); return [c, x]; };
    const [ca, a] = mk('#9a9792'), [ch, h] = mk('#808080');
    const blob = (x, cx, cy, r, col, al, sy = 1) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(${col},${al})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, r, r * sy, 0, 0, 7); x.fill(); };
    // regolith mottling
    for (let i = 0; i < 4000; i++) { const v = R() < .5 ? '255,255,250' : '20,20,22'; blob(a, R() * W, R() * H, 3 + R() * 26, v, .05); blob(h, R() * W, R() * H, 2 + R() * 10, R() < .5 ? '255,255,255' : '0,0,0', .08); }
    // maria (dark basalt plains)
    for (let i = 0; i < 40; i++) blob(a, R() * W, H * (.1 + R() * .8), 60 + R() * 160, R() < .5 ? '60,60,64' : '200,198,192', .12);
    const maria = [[.55, .3, .07], [.82, .6, .06], [.9, .4, .05], [.18, .35, .12], [.27, .3, .08], [.33, .45, .09], [.22, .52, .07], [.4, .38, .06], [.12, .42, .06], [.3, .58, .05], [.62, .5, .04], [.7, .3, .03]];
    maria.forEach(([u, v, r]) => { for (let k = 0; k < 18; k++) blob(a, (u + (R() - .5) * r * 1.2) * W, (v + (R() - .5) * r * 1.6) * H, r * W * (.2 + R() * .4), '40,40,44', .42, .85); });
    // craters: albedo subtle, height = bowl + raised rim (bump does the shading)
    for (let i = 0; i < 1900; i++) {
      const r = Math.pow(R(), 5) * 70 + 1.5, cx = R() * W, cy = H * (.05 + R() * .9), sy = .95;
      blob(a, cx, cy, r * 1.05, '45,45,48', .16 + R() * .14, sy); if (R() < .35) blob(a, cx, cy, r * 1.9, '225,222,215', .07);
      const g = h.createRadialGradient(cx, cy, 0, cx, cy, r * 1.25);
      g.addColorStop(0, 'rgba(0,0,0,.3)'); g.addColorStop(.55, 'rgba(0,0,0,.14)'); g.addColorStop(.8, 'rgba(255,255,255,.2)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      h.fillStyle = g; h.beginPath(); h.ellipse(cx, cy, r * 1.25, r * 1.25 * sy, 0, 0, 7); h.fill();
      if (r > 30 && R() < .6) { blob(a, cx, cy, r * .2, '230,228,222', .35); for (let k = 0; k < 8; k++) { const an = R() * 7, l = r * (2 + R() * 6); a.strokeStyle = 'rgba(235,232,225,.035)'; a.lineWidth = 1 + R() * 2; a.beginPath(); a.moveTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); a.lineTo(cx + Math.cos(an) * l, cy + Math.sin(an) * l); a.stroke(); } }
    }
    for (let i = 0; i < 9000; i++) { const cx = R() * W, cy = R() * H, r = 1 + R() * 3.5; blob(h, cx, cy, r, '0,0,0', .35); blob(a, cx, cy, r * 1.3, R() < .3 ? '235,232,226' : '50,50,54', .12); }
    const map = new THREE.CanvasTexture(ca); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
    const bump = new THREE.CanvasTexture(ch);
    return { map, bump };
  }
  function moon({ radius = 1, seg = 128 } = {}) {
    const { map, bump } = moonTex();
    const m = new THREE.Mesh(new THREE.SphereGeometry(radius, seg, seg / 2), new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 1.1, roughness: 1, metalness: 0, envMapIntensity: .04 }));
    return m;
  }

  /* ---------- Station: rotating habitat ring, spine, arrays, docked capsule ---------- */
  function station() {
    const g = new THREE.Group(); const pt = canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#d4d8de'; c.fillRect(0, 0, w, h); for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) { const v = 200 + Math.random() * 40 | 0; c.fillStyle = 'rgb(' + v + ',' + (v + 3) + ',' + (v + 8) + ')'; c.fillRect(x * 32 + 1, y * 64 + 1, 30, 62); } c.strokeStyle = 'rgba(40,46,56,.55)'; c.lineWidth = 1.5; for (let x = 0; x <= 16; x++) { c.beginPath(); c.moveTo(x * 32, 0); c.lineTo(x * 32, h); c.stroke(); } for (let y = 0; y <= 4; y++) { c.beginPath(); c.moveTo(0, y * 64); c.lineTo(w, y * 64); c.stroke(); } c.fillStyle = 'rgba(30,34,40,.5)'; for (let i = 0; i < 60; i++) c.fillRect(Math.random() * w, Math.random() * h, 3, 3); }); pt.wrapS = pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(10, 2);
    const hull = new THREE.MeshPhysicalMaterial({ map: pt, color: '#c4c9d0', metalness: .25, roughness: .5, clearcoat: .5, clearcoatRoughness: .35, envMapIntensity: .55 }), steel = M.steel(), dark = M.dark(), foil = M.foil(), pm = M.panel();
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, 4.2, 32), steel); spine.rotation.z = Math.PI / 2; g.add(spine);
    // core modules along spine
    [[-.9, .26, .9], [.95, .24, .8], [0, .32, .5]].forEach(([x, r, l]) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 8, 32), x === 0 ? foil : hull); m.rotation.z = Math.PI / 2; m.position.x = x; g.add(m);
      for (let k = -1; k <= 1; k += 2) { const b = new THREE.Mesh(new THREE.TorusGeometry(r + .005, .012, 8, 48), dark); b.rotation.y = Math.PI / 2; b.position.x = x + k * l * .35; g.add(b); } });
    // habitat ring
    const ringG = new THREE.Group(); ringG.rotation.y = Math.PI / 2; g.add(ringG);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, .17, 32, 160), hull); ringG.add(ring);
    [1.43, 1.67].forEach(rr => { const sm = new THREE.Mesh(new THREE.TorusGeometry(rr, .03, 8, 160), steel); ringG.add(sm); });
    // windows on the ring (instanced, warm interior light)
    const win = new THREE.InstancedMesh(new THREE.BoxGeometry(.022, .012, .02), M.emit('#ffc98a', 1.1), 120); const d = new THREE.Object3D();
    for (let i = 0; i < 120; i++) { const a = i / 120 * Math.PI * 2; d.position.set(Math.cos(a) * 1.722, Math.sin(a) * 1.722, (i % 2 ? .05 : -.05)); d.rotation.set(0, 0, a); d.updateMatrix(); win.setMatrixAt(i, d.matrix); }
    ringG.add(win);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + .3; const s = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1.4, 16), steel); s.position.set(Math.cos(a) * .78, Math.sin(a) * .78, 0); s.rotation.z = a - Math.PI / 2; ringG.add(s);
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .12, 20), dark); p.position.set(Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0); p.rotation.z = a - Math.PI / 2; ringG.add(p); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .3, 32), hull); hub.rotation.z = Math.PI / 2; g.add(hub);
    // solar arrays at both ends
    [-2.1, 2.1].forEach(x => { for (let k = -1; k <= 1; k += 2) {
      const w = new THREE.Group(); w.position.x = x;
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 3.1, 8), steel); mast.position.z = k * 1.6; mast.rotation.x = Math.PI / 2; w.add(mast);
      for (let j = 0; j < 2; j++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.5, .008, 2.8), pm); p.position.set(j ? .3 : -.3, 0, k * 1.65); w.add(p); }
      w.rotation.x = .35; g.add(w);
    } });
    // radiators
    [-.4, .45].forEach(x => { const r = new THREE.Mesh(new THREE.BoxGeometry(.34, .8, .01), new THREE.MeshPhysicalMaterial({ color: '#8c939c', roughness: .45, metalness: .6, envMapIntensity: .5 })); r.position.set(x, -.62, 0); g.add(r); });
    // docked capsule
    const cap = capsule({ wings: false, label: '' }); cap.scale.setScalar(.42); cap.rotation.z = Math.PI / 2; cap.position.x = -2.48; g.add(cap);
    // beacon
    const bc = new THREE.Mesh(new THREE.SphereGeometry(.025, 12, 8), M.emit('#ff5a4a', 4)); bc.position.set(2.2, .14, 0); g.add(bc);
    g.userData.ring = ringG;
    return g;
  }

  /* ---------- simple light rig ---------- */
  function sunlight(scene, dir = [-5, 2, 3], k = 3.2) {
    const l = new THREE.DirectionalLight('#fff6ea', k); l.position.set(...dir); scene.add(l);
    const rim = new THREE.DirectionalLight('#5d9bff', 1.4); rim.position.set(-dir[0], -dir[1] * .3, -dir[2]); scene.add(rim);
    scene.add(new THREE.AmbientLight('#203050', .25));
    return l;
  }

  return { THREE, stage, earth, stars, capsule, station, moon, moonTex, orbit, ellipse, trail, glow, canvasTex, lathe, M, sunlight, CREW, BLUE, load };
};
