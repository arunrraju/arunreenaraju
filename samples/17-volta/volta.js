// Shared chrome for the VOLTA screens: icons, slanted nav, footer, photo slots, speed lines.
const U = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" fill="currentColor" stroke="none"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="1.5"/><path d="M21 10v4"/><path d="M6 10v4M9 10v4M12 10v4"/>',
  gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 18 4-6"/>',
  mountain: '<path d="m3 19 6-10 4 6 2-3 6 7H3Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
const BOLT = '<svg viewBox="0 0 20 26"><path d="M12 0 0 15h7l-3 11L20 9h-8l4-9Z" fill="#e6ff00"/></svg>';

function volta(active, { bag = 1, cta = 'Book a test ride' } = {}) {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.outerHTML = `<nav class="nav">
      <a class="logo">VOLTA${BOLT}</a>
      <div class="links">${['Bikes', 'Urban', 'Gravel', 'Configure', 'Accessories', 'Test ride'].map(n => `<a class="${n === active ? 'on' : ''}">${n}</a>`).join('')}</div>
      <div class="r"><span class="chip">${ic('search')}</span><span class="chip"><span class="bat"><i></i></span>EN · €</span><span class="chip">${ic('user')}</span>
      <span class="cta">${ic('bolt')} ${cta}</span><span class="bag">${ic('bag')}<b>${bag}</b></span></div>
    </nav>`;
  });
  document.querySelectorAll('[data-footer]').forEach(el => {
    el.outerHTML = `<footer class="f">
      <div class="cols">
        <div class="news"><div class="idx" style="margin-bottom:24px">VOLTA Signal · monthly</div><p>Night routes, firmware drops &amp; first rides on new frames.</p><div class="field">your@email.com<b>${ic('arrow')}</b></div></div>
        <div><h5>Ride</h5><ul><li>Urban line-up</li><li>Gravel line-up</li><li>S-Pedelec 45</li><li>Configurator</li><li>Accessories</li></ul></div>
        <div><h5>Own</h5><ul><li>Book a test ride</li><li>Service &amp; firmware</li><li>Battery care</li><li>Lease via employer</li><li>Warranty · 5 years</li></ul></div>
        <div><h5>Studios</h5><ul><li>Amsterdam · Westerpark</li><li>Berlin · Kreuzberg</li><li>Copenhagen · Vesterbro</li><li>Milan · Isola</li><li>Paris · Canal St-Martin</li></ul></div>
      </div>
      <div class="big">VOLTA</div>
      <div class="stats"><div><b>14</b><span>Studios</span></div><div><b>2.1M</b><span>KM ridden / month</span></div><div><b class="volt">4.8★</b><span>11,240 reviews</span></div></div>
      <div class="bot"><span>© 2026 VOLTA Mobility B.V. · Amsterdam · A concept brand</span><span>Privacy · Terms · Cookies · Accessibility · Recalls</span><span>Firmware V-OS 4.2 · All systems nominal <span class="volt blink">●</span></span></div>
    </footer>`;
  });
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic); });
  document.querySelectorAll('[data-img]').forEach(el => {
    const [id, w] = el.dataset.img.split('|');
    el.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1400)}" alt="">`);
  });
  // procedural speed lines: <div class="speed" data-n="24" data-top="0" data-h="100"></div>
  document.querySelectorAll('.speed[data-n]').forEach(el => {
    const n = +el.dataset.n; let seed = n * 13 + 7; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    let html = '';
    for (let i = 0; i < n; i++) {
      const y = r() * 100, w = 120 + r() * 520, yel = r() < .35;
      html += `<i style="top:${y.toFixed(1)}%;left:${(r() * 100).toFixed(1)}%;width:${w.toFixed(0)}px;height:${r() < .2 ? 3 : 1}px;--c:${yel ? 'rgba(230,255,0,.75)' : 'rgba(220,232,255,.45)'};--s:${(0.9 + r() * 1.8).toFixed(2)}s;--dl:-${(r() * 2).toFixed(2)}s"></i>`;
    }
    el.innerHTML = html;
  });
}
