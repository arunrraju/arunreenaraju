(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // Intro animation
  requestAnimationFrame(() => document.body.classList.add('is-loaded'));

  // Theme toggle
  const toggleTheme = () => {
    const current = root.dataset.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  };
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));

  // Nav background once scrolled, and active section link
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const navLinks = [...document.querySelectorAll('.nav__links a')];
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach((s) => sectionObserver.observe(s));

  // Reveal on scroll
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealObserver.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 60}ms`;
    revealObserver.observe(el);
  });

  // Count-up stats
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = Number(el.dataset.count);
      countObserver.unobserve(el);
      if (reduceMotion) { el.textContent = target; return; }
      const start = performance.now();
      const dur = 1600;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => countObserver.observe(el));

  // Cursor spotlight + work preview that follows the pointer
  if (finePointer && !reduceMotion) {
    const preview = document.querySelector('.work__preview');
    const inner = preview && preview.querySelector('.work__preview-inner');
    let px = 0, py = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => {
      px += (tx - px) * 0.18; py += (ty - py) * 0.18;
      if (preview) preview.style.translate = `${px}px ${py}px`;
      raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    window.addEventListener('pointermove', (e) => {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    document.querySelectorAll('.work__item').forEach((item) => {
      item.addEventListener('pointerenter', () => {
        // Swap the gradient for a real image by adding data-image="/assets/work/x.jpg" on the <li>.
        inner.style.setProperty('--h', item.dataset.hue || 18);
        inner.style.backgroundImage = item.dataset.image ? `url("${item.dataset.image}")` : '';
        inner.firstElementChild.textContent = item.dataset.image ? '' : item.querySelector('.work__title').textContent;
        preview.classList.add('is-on');
      });
      item.addEventListener('pointerleave', () => preview.classList.remove('is-on'));
    });
  }

  // Copy email
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const hint = btn.querySelector('.contact__email-hint');
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
        hint.textContent = 'Copied to clipboard ✓';
      } catch (e) {
        window.location.href = 'mailto:' + value;
      }
      setTimeout(() => { hint.textContent = 'Click to copy'; }, 2200);
    });
  });

  // Footer year + live local clock
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
  const clock = document.querySelector('[data-clock]');
  // TODO(content): set to your own IANA time zone, e.g. 'Asia/Kolkata' or 'America/New_York'
  const TIME_ZONE = 'Asia/Kolkata';
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE, timeZoneName: 'short' });
  const tickClock = () => { if (clock) clock.textContent = fmt.format(new Date()); };
  tickClock();
  setInterval(tickClock, 30_000);

  // Command palette (⌘K / Ctrl+K)
  const palette = document.querySelector('.palette');
  const input = palette.querySelector('.palette__input');
  const list = palette.querySelector('.palette__list');
  const email = document.querySelector('[data-copy]')?.dataset.copy;
  const go = (hash) => () => document.querySelector(hash)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  const commands = [
    { label: 'Go to About', hint: 'Section', run: go('#about') },
    { label: 'Go to Metzee', hint: 'Section', run: go('#metzee') },
    { label: 'Go to Selected work', hint: 'Section', run: go('#work') },
    { label: 'Go to Experience', hint: 'Section', run: go('#experience') },
    { label: 'Go to Contact', hint: 'Section', run: go('#contact') },
    { label: 'Copy email address', hint: 'Action', run: () => navigator.clipboard?.writeText(email) },
    { label: 'Download résumé', hint: 'File', run: () => { window.location.href = '/resume.pdf'; } },
    { label: 'Toggle light / dark', hint: 'Theme', run: toggleTheme },
    { label: 'Open GitHub', hint: 'Link', run: () => window.open('https://github.com/arunrraju', '_blank', 'noopener') },
  ];
  let filtered = commands;
  let active = 0;
  const render = () => {
    list.innerHTML = '';
    filtered.forEach((c, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      li.innerHTML = `<span></span><span class="mono"></span>`;
      li.firstChild.textContent = c.label;
      li.lastChild.textContent = c.hint;
      li.addEventListener('mousemove', () => { if (active !== i) { active = i; render(); } });
      li.addEventListener('click', () => run(i));
      list.appendChild(li);
    });
  };
  const run = (i) => { const c = filtered[i]; palette.close(); if (c) c.run(); };
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
  document.querySelectorAll('[data-open-palette]').forEach((b) => b.addEventListener('click', open));
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.open ? palette.close() : open(); }
  });
})();
