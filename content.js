/* Fills the page from content.json (edited through Pages CMS), then starts main.js.
   The HTML already holds the same content, so the page still works if the file can't load. */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const list = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);
  const text = (sel, v) => { const el = $(sel); if (el && v) el.textContent = v; };
  const html = (sel, v) => { const el = $(sel); if (el && v) el.innerHTML = v; };
  const isExternal = (url) => /^https?:/i.test(url);
  // The big outlined character on a work card: one letter, or a number up to two digits
  const glyph = (v) => { const t = String(v ?? '').trim(); return (t.match(/^\d{1,2}/) || [t.charAt(0)])[0].toUpperCase(); };

  // Gradient sets for the generated work art, used in turn.
  const PALETTES = [
    ['#9db8ff', '#e2b8ff', '#0d1430'], ['#ffc6a6', '#ff8fb1', '#2a0f1c'], ['#a6ffe0', '#8fd0ff', '#06201d'],
    ['#f4f0c8', '#c9b8ff', '#1a1630'], ['#ffd59e', '#9ec9ff', '#101a24'], ['#c8b6ff', '#ffb8d9', '#1b1030'],
  ];
  const SIZES = { tall: 'g-tall', half: 'g-half', hero: 'g-hero', wide: 'g-wide', full: 'g-full' };

  const row = (r, indent) => `
${indent}<li class="exp__row">
${indent}  <span class="exp__when mono">${esc(r.when)}</span>
${indent}  <span class="exp__role">${esc(r.role)}</span>
${indent}  <span class="exp__org">${esc(r.org)}</span>
${indent}  <span class="exp__note">${esc(r.note)}</span>
${indent}</li>`;

  function render(c) {
    const company = c.metzee?.url ? 'Metzee' : '';

    if (c.hero) {
      const h = c.hero;
      const linkCompany = (line) => esc(line).replace(company || '\0', `<a class="iri" href="#metzee">${company}</a>`);
      if (list(h.intro).length) html('.hero__intro', list(h.intro).map((l) => `<span class="split">${linkCompany(l)}</span>`).join(''));
      const idx = [['Role', h.role], ['Based', h.based], ['Focus', h.focus]].filter(([, v]) => v)
        .map(([k, v]) => `<li><span>${k}</span><span>${esc(v)}</span></li>`);
      if (h.status) idx.push(`<li><span>Status</span><span><i class="pulse" aria-hidden="true"></i>${esc(h.status)}</span></li>`);
      if (idx.length) html('.hero__index', idx.join(''));
    }

    if (c.portrait) {
      const img = $('.portrait__frame img');
      if (img && c.portrait.image) { img.src = c.portrait.image; img.alt = c.portrait.alt || ''; }
      text('.portrait__caption', c.portrait.caption);
    }

    if (c.about) {
      text('.about__statement', c.about.bio);
      if (list(c.about.facts).length) {
        html('.facts', list(c.about.facts).map((f) => `<div class="facts__item"><dt class="mono">${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join(''));
      }
    }

    if (c.metzee) {
      const m = c.metzee;
      if (m.since) html('.metzee__body > .label', `<span class="label__dot"></span>The company · Founder · ${esc(m.since)} to now`);
      if (m.lede) {
        const lede = esc(m.lede);
        const hi = m.highlight && esc(m.highlight);
        html('.metzee__lede', hi && lede.includes(hi) ? lede.replace(hi, `<span class="iri">${hi}</span>`) : lede);
      }
      if (list(m.cards).length) {
        html('.metzee__grid', list(m.cards).map((k) => `<article class="metzee__card"><h3 class="mono">${esc(k.title)}</h3><p>${esc(k.text)}</p></article>`).join(''));
      }
      const visit = $('.metzee__body .pill');
      if (visit && m.url) visit.href = m.url;
    }

    if (list(c.work).length) {
      html('.work__track', list(c.work).map((w, i) => {
        const [a, b, cc] = PALETTES[i % PALETTES.length];
        // Clicking a card opens its case panel (main.js); links to other sites live only inside it.
        const href = `#work-${i + 1}`;
        const art = w.image ? ` style="--img:url('${esc(w.image)}')"` : '';
        const tags = list(w.tags).map((t) => `<span>${esc(t)}</span>`).join('');
        return `
          <li class="card" style="--a:${a};--b:${b};--c:${cc}">
            <a class="card__link" href="${esc(href)}" data-case="${i}" data-cursor="Open">
              <div class="card__art"${art}><span class="card__glyph">${esc(glyph(w.letter || w.title))}</span></div>
              <div class="card__meta">
                <h3 class="card__title">${esc(w.title)}</h3>
                <p class="card__desc">${esc(w.description)}</p>
                <p class="card__tags mono">${tags}</p>
              </div>
            </a>
          </li>`;
      }).join(''));
    }

    if (list(c.gallery).length) {
      html('.gallery__grid', list(c.gallery).map((g, i) => {
        const n = String(i + 1).padStart(2, '0');
        return `
        <li class="gallery__item ${SIZES[g.size] || 'g-half'}">
          <button class="gallery__btn" type="button" data-lightbox="${i}" data-cursor="Open">
            <figure class="photo" data-photo-label="Photo ${n} · ${esc(g.image)}">
              <img src="${esc(g.image)}" alt="${esc(g.alt)}" loading="lazy" decoding="async">
            </figure>
          </button>
          <p class="gallery__cap mono"><span>${n}</span><span>${esc(g.caption)}</span></p>
        </li>`;
      }).join(''));
    }

    if (list(c.experience).length) html('#experience > .exp__list', list(c.experience).map((r) => row(r, '        ')).join(''));
    if (list(c.education).length) html('[data-education]', list(c.education).map((r) => row(r, '          ')).join(''));
    if (list(c.toolkit).length) html('.kit__list', list(c.toolkit).map((t) => `<li>${esc(t)}</li>`).join(''));

    if (c.contact) {
      const k = c.contact;
      text('.contact__lede', k.lede);
      if (k.email) {
        const btn = $('[data-copy]');
        if (btn) btn.dataset.copy = k.email;
        text('.contact__email-text', k.email);
        const orb = $('.contact__orb');
        if (orb) orb.href = `mailto:${k.email}`;
      }
      if (list(k.socials).length) {
        html('.socials', list(k.socials).filter((s) => s.url).map((s) => {
          const ext = isExternal(s.url) ? ' rel="me noopener" target="_blank"' : '';
          return `<li><a href="${esc(s.url)}"${ext}>${esc(s.label)} <span aria-hidden="true">↗</span></a></li>`;
        }).join(''));
      }
    }
  }

  const start = () => {
    const s = document.createElement('script');
    s.src = 'main.js';
    document.body.appendChild(s);
  };

  fetch('content.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((c) => { if (c) { render(c); window.siteContent = c; } })
    .catch(() => {})
    .finally(start);
})();
