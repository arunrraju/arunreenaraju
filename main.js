(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // TODO(content): your IANA time zone, e.g. 'Asia/Kolkata', 'Asia/Dubai', 'America/New_York'
  const TIME_ZONE = 'Asia/Kolkata';

  /* ───────────── Split hero name into letters ───────────── */
  let i = 0;
  $$('.hero__chars').forEach((el) => {
    const parts = el.textContent.trim().split(' ');
    el.textContent = '';
    parts.forEach((word, k) => {
      const w = document.createElement('span');
      w.className = 'word';
      for (const c of word) {
        const s = document.createElement('span');
        s.className = 'ch';
        s.style.setProperty('--i', i++);
        s.textContent = c;
        w.appendChild(s);
      }
      el.appendChild(w);
      if (k < parts.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ───────────── Fit the name to the full width ───────────── */
  const heroName = $('.hero__name');
  const firstLine = $('.hero__chars', heroName);
  const fitName = () => {
    heroName.style.fontSize = '';
    // On phones the name stacks one word per line, so fit the widest word instead of the whole line
    const stacked = innerWidth <= 760;
    const avail = heroName.clientWidth;
    const w = stacked
      ? Math.max(...$$('.word', heroName).map((x) => x.getBoundingClientRect().width))
      : firstLine.getBoundingClientRect().width;
    if (!w) return;
    const fs = parseFloat(getComputedStyle(heroName).fontSize) * (avail / w) * (stacked ? 0.98 : 1);
    const hero = $('.hero');
    const maxByHeight = (hero.clientHeight - $('.hero__meta').offsetHeight - 170) / (stacked ? 2.5 : 1.7);
    heroName.style.fontSize = `${Math.min(fs, maxByHeight).toFixed(1)}px`;
  };
  fitName();
  addEventListener('resize', fitName);
  if (document.fonts) document.fonts.ready.then(fitName);

  /* ───────────── Loader ───────────── */
  const countEl = $('[data-loader-count]');
  const loader = $('.loader');
  const ready = () => root.classList.add('is-ready');
  if (reduceMotion) {
    ready();
  } else {
    const start = performance.now();
    const minDur = 1400;
    let fontsDone = false;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { fontsDone = true; });
    setTimeout(() => { fontsDone = true; }, 2500);
    const tick = (now) => {
      let p = clamp((now - start) / minDur);
      if (!fontsDone) p = Math.min(p, 0.92);
      const eased = 1 - Math.pow(1 - p, 3);
      countEl.textContent = String(Math.round(eased * 100)).padStart(3, '0');
      loader.style.setProperty('--p', eased);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(ready, 180);
    };
    requestAnimationFrame(tick);
  }

  /* ───────────── Liquid chrome shader ───────────── */
  const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  const FRAG = `
    precision highp float;
    uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uOrb;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      for (int k = 0; k < 5; k++){ v += a * noise(p); p = m * p; a *= 0.5; }
      return v;
    }
    void main(){
      vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
      float t = uTime * 0.06;
      vec2 p = uv * 1.35;
      vec2 m = (uMouse - 0.5) * vec2(uRes.x / min(uRes.x, uRes.y), uRes.y / min(uRes.x, uRes.y));
      float pull = exp(-2.5 * dot(uv - m, uv - m));
      vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
      vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + 1.3 * t), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t));
      r += (m - uv) * pull * 0.35;
      vec2 b = p + 2.4 * r;
      float e = 0.006;
      float h0 = fbm(b);
      float hx = fbm(b + vec2(e, 0.0));
      float hy = fbm(b + vec2(0.0, e));
      vec3 n = normalize(vec3((h0 - hx) / e * 0.09, (h0 - hy) / e * 0.09, 1.0));

      // Chrome ball for the Metzee section
      float mask = 1.0;
      if (uOrb > 0.5) {
        float d = length(uv * 2.0);
        vec3 sn = vec3(uv * 2.0, sqrt(max(0.0, 1.0 - d * d)));
        n = normalize(sn * 1.4 + n * 0.6);
        mask = smoothstep(1.0, 0.985, d);
      }

      vec3 v = vec3(0.0, 0.0, 1.0);
      vec3 rv = reflect(-v, n);
      float sky = smoothstep(-0.35, 0.75, rv.y + 0.25 * sin(rv.x * 3.0 + t * 4.0));
      vec3 ground = vec3(0.015, 0.02, 0.035);
      vec3 horizon = vec3(0.32, 0.36, 0.44);
      vec3 zenith = vec3(0.92, 0.95, 1.0);
      vec3 env = mix(ground, horizon, smoothstep(0.0, 0.45, sky));
      env = mix(env, zenith, smoothstep(0.55, 1.0, sky));

      vec3 l = normalize(vec3(-0.35 + m.x * 0.4, 0.55 + m.y * 0.3, 0.75));
      float spec = pow(max(dot(reflect(-l, n), v), 0.0), 60.0);
      float fres = pow(1.0 - max(n.z, 0.0), 1.6);
      vec3 film = 0.5 + 0.5 * cos(6.28318 * (h0 * 1.6 + rv.x * 0.5 + rv.y * 0.3 + vec3(0.0, 0.33, 0.67)));
      film = mix(film, vec3(0.75, 0.82, 1.0), 0.35);

      vec3 col = env * 0.85 + film * fres * 0.75 + spec * 0.9;
      col = mix(col, col * vec3(0.92, 0.95, 1.08), 0.5);
      if (uOrb < 0.5) {
        float vig = smoothstep(1.35, 0.25, length(uv * vec2(0.9, 1.1)));
        col *= 0.35 + 0.65 * vig;
      }
      col = pow(col, vec3(0.95));
      gl_FragColor = vec4(col * mask, mask);
    }`;

  function chrome(canvas, { orb = false, scale = 0.6 } = {}) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) return;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    gl.uniform1f(gl.getUniformLocation(prog, 'uOrb'), orb ? 1 : 0);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2) * scale;
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    addEventListener('resize', resize);

    const mouse = { x: 0.62, y: 0.55, tx: 0.62, ty: 0.55 };
    addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
    }, { passive: true });

    let visible = true, raf = 0;
    const t0 = performance.now() - 20000;
    const frame = (now) => {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = visible && !reduceMotion ? requestAnimationFrame(frame) : 0;
    };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    }).observe(canvas);
    raf = requestAnimationFrame(frame);
  }
  chrome($('.hero__canvas'), { scale: 0.55 });
  chrome($('.metzee__canvas'), { orb: true, scale: 0.75 });

  /* ───────────── Scroll-driven pieces ───────────── */
  // About: words light up as you read
  const statement = $('[data-scrub-words]');
  const words = [];
  if (statement) {
    const text = statement.textContent.trim().replace(/\s+/g, ' ');
    statement.textContent = '';
    text.split(' ').forEach((w, k) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      statement.appendChild(s);
      if (k < text.split(' ').length - 1) statement.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  }

  const metzee = $('.metzee');
  const work = $('.work');
  const track = $('.work__track');
  const cards = $$('.card', track);
  const cur = $('[data-work-current]');
  $('[data-work-total]').textContent = cards.length;
  const desktop = matchMedia('(min-width: 761px)');

  const sizeWork = () => {
    if (!desktop.matches) { work.style.removeProperty('--work-h'); track.style.transform = ''; return; }
    const extra = track.scrollWidth - innerWidth;
    work.style.setProperty('--work-h', `${innerHeight + Math.max(0, extra)}px`);
  };
  sizeWork();
  addEventListener('resize', sizeWork);
  addEventListener('load', sizeWork);

  const onScroll = () => {
    const vh = innerHeight;
    if (words.length) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const lit = reduceMotion ? words.length : Math.round(p * words.length);
      words.forEach((w, k) => w.classList.toggle('on', k < lit));
    }
    if (metzee) {
      const r = metzee.getBoundingClientRect();
      const p = clamp(1 - r.top / vh);
      const out = clamp(-r.top / vh);
      metzee.style.setProperty('--orb', (0.55 + 0.45 * p).toFixed(4));
      metzee.style.setProperty('--word', (1.35 - 0.35 * p + out * 0.2).toFixed(4));
      metzee.style.setProperty('--word-o', clamp(1 - (out - 0.15) * 2.2).toFixed(3));
      metzee.style.setProperty('--orb-o', (1 - clamp((out - 0.15) * 1.6) * 0.6).toFixed(3));
    }
    if (desktop.matches && work) {
      const r = work.getBoundingClientRect();
      const span = work.offsetHeight - vh;
      const p = span > 0 ? clamp(-r.top / span) : 0;
      const extra = Math.max(0, track.scrollWidth - innerWidth);
      track.style.transform = `translate3d(${(-p * extra).toFixed(1)}px,0,0)`;
      cur.textContent = Math.min(cards.length, 1 + Math.floor(p * cards.length * 0.999));
    }
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  /* ───────────── Reveal on scroll ───────────── */
  const revealTargets = $$('.about .label, .facts__item, .metzee__body > *, .metzee__card, .work__head, .exp .label, .exp__row, .kit, .contact__body > *');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  revealTargets.forEach((el, k) => {
    el.classList.add('rv');
    el.style.transitionDelay = `${(k % 3) * 80}ms`;
    io.observe(el);
  });

  /* ───────────── Active nav link ───────────── */
  const navLinks = $$('.nav__links a');
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('is-active', a.hash === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => navIO.observe(s));

  /* ───────────── Cursor + magnetic buttons ───────────── */
  if (finePointer && !reduceMotion) {
    root.classList.add('has-cursor');
    const cursor = $('.cursor');
    const label = $('.cursor__label');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('a, button, [data-cursor]');
      cursor.classList.toggle('is-link', !!t);
      const text = t && t.dataset.cursor;
      cursor.classList.toggle('is-label', !!text);
      if (text) label.textContent = text;
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-link', 'is-label'));

    $$('[data-magnetic]').forEach((el) => {
      el.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)';
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ───────────── Theme ───────────── */
  const toggleTheme = () => {
    const current = root.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  };
  $$('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));

  /* ───────────── Copy email ───────────── */
  const copyEmail = async (btn) => {
    const value = btn.dataset.copy;
    const hint = $('.contact__email-hint', btn);
    try {
      await navigator.clipboard.writeText(value);
      if (hint) hint.textContent = 'Copied ✓';
    } catch (e) {
      const sel = getSelection();
      const range = document.createRange();
      range.selectNodeContents($('.contact__email-text', btn));
      sel.removeAllRanges(); sel.addRange(range);
      if (hint) hint.textContent = 'Selected, press ⌘C to copy';
    }
    if (hint) setTimeout(() => { hint.textContent = 'Click to copy'; }, 2400);
  };
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', () => copyEmail(btn)));

  /* ───────────── Footer year + local clock ───────────── */
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
  const clock = $('[data-clock]');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE, timeZoneName: 'short' });
  const tickClock = () => { if (clock) clock.textContent = fmt.format(new Date()); };
  tickClock();
  setInterval(tickClock, 20000);

  /* ───────────── Command menu (⌘K / Ctrl+K) ───────────── */
  const palette = $('.palette');
  const input = $('.palette__input', palette);
  const list = $('.palette__list', palette);
  const go = (hash) => () => $(hash)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  const commands = [
    { label: 'About', hint: 'Section', run: go('#about') },
    { label: 'Metzee', hint: 'Section', run: go('#metzee') },
    { label: 'Selected work', hint: 'Section', run: go('#work') },
    { label: 'Experience', hint: 'Section', run: go('#experience') },
    { label: 'Contact', hint: 'Section', run: go('#contact') },
    { label: 'Copy email address', hint: 'Action', run: () => copyEmail($('[data-copy]')) },
    { label: 'Switch light / dark', hint: 'Theme', run: toggleTheme },
    { label: 'Open résumé', hint: 'File', run: () => { location.href = 'resume.pdf'; } },
  ];
  let filtered = commands, active = 0;
  const render = () => {
    list.innerHTML = '';
    filtered.forEach((c, k) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(k === active));
      const a = document.createElement('span'); a.textContent = c.label;
      const b = document.createElement('span'); b.className = 'mono'; b.textContent = c.hint;
      li.append(a, b);
      li.addEventListener('mousemove', () => { if (active !== k) { active = k; render(); } });
      li.addEventListener('click', () => run(k));
      list.appendChild(li);
    });
  };
  const run = (k) => { const c = filtered[k]; palette.close(); if (c) c.run(); };
  const open = () => {
    if (palette.open) return;
    input.value = ''; filtered = commands; active = 0; render();
    palette.showModal(); input.focus();
  };
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    filtered = commands.filter((c) => (c.label + ' ' + c.hint).toLowerCase().includes(q));
    active = 0; render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(filtered.length - 1, active + 1); render(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); render(); }
    if (e.key === 'Enter') { e.preventDefault(); run(active); }
  });
  palette.addEventListener('click', (e) => { if (e.target === palette) palette.close(); });
  $$('[data-open-palette]').forEach((b) => b.addEventListener('click', open));
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.open ? palette.close() : open(); }
  });
})();
