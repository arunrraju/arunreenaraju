// Shared chrome for ÉCLAT screens: icons, nav, footer, seal, facet ornament, sparkles, photo slots.
const U = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  gift: '<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8Zm0 0s2-5 4.5-3.5S15 8 12 8Z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
  loupe: '<circle cx="10" cy="10" r="6"/><path d="m20 20-5.5-5.5M10 7v6M7 10h6"/>',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" fill="currentColor" stroke="none"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="1"/><path d="m16 10 5-3v10l-5-3"/>',
  diamond: '<path d="M6 4h12l3 5-9 11L3 9l3-5Z"/><path d="M3 9h18M9 4l3 16 3-16"/>',
  leaf: '<path d="M5 19C5 10 11 5 20 4c-1 9-6 15-15 15Z"/><path d="M5 19 13 11"/>',
  sparkle: '<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
// brilliant cut seen from above, for ornaments and diagrams
function facetSVG() {
  const P = (r, a) => [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  let s = '';
  const T = k => P(26, k * Math.PI / 4), S = k => P(36, (k + .5) * Math.PI / 4), G = j => P(48, j * Math.PI / 8);
  s += `<circle cx="50" cy="50" r="48"/>`;
  s += `<polygon points="${[...Array(8)].map((_, k) => T(k).join(',')).join(' ')}"/>`;
  for (let k = 0; k < 8; k++) {
    s += `<path d="M${T(k)}L${S(k)}L${T(k + 1)}M${T(k)}L${G(2 * k)}M${S(k)}L${G(2 * k)}M${S(k)}L${G(2 * k + 1)}M${S(k)}L${G(2 * k + 2)}"/>`;
    s += `<path d="M50,50L${G(2 * k)}" opacity=".35"/>`;
  }
  return `<svg viewBox="0 0 100 100">${s}</svg>`;
}
const SHAPES = {
  round: '<circle cx="20" cy="20" r="14"/><polygon points="20,10 27,13 30,20 27,27 20,30 13,27 10,20 13,13" opacity=".6"/>',
  oval: '<ellipse cx="20" cy="20" rx="11" ry="16"/><ellipse cx="20" cy="20" rx="6" ry="9" opacity=".6"/>',
  emerald: '<polygon points="13,4 27,4 32,9 32,31 27,36 13,36 8,31 8,9"/><polygon points="16,10 24,10 26,12 26,28 24,30 16,30 14,28 14,12" opacity=".6"/>',
  cushion: '<rect x="7" y="6" width="26" height="28" rx="9"/><rect x="13" y="12" width="14" height="16" rx="4" opacity=".6"/>',
  pear: '<path d="M20 4c7 8 12 14 12 21a12 12 0 0 1-24 0c0-7 5-13 12-21Z"/><path d="M20 14c3 4 5 7 5 11a5 5 0 0 1-10 0c0-4 2-7 5-11Z" opacity=".6"/>'
};
const shape = (n, cls = '') => `<svg class="shp ${cls}" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.2">${SHAPES[n]}</svg>`;

function eclat(active, { bag = 1 } = {}) {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.outerHTML = `<nav class="nav">
      <div class="l">${['High Jewellery', 'Engagement', 'Coloured Stones', 'Bespoke'].map(n => `<a class="${n === active ? 'on' : ''}">${n}</a>`).join('')}</div>
      <a class="brand"><b>ÉCLAT</b><small>HAUTE JOAILLERIE · PARIS</small></a>
      <div class="r"><a class="${active === 'Salon' ? 'on' : ''}">Private Salon</a><span class="pill">${ic('search')}</span><span class="pill">${ic('user')}</span><span class="pill solid">${ic('bag')} Bag <b>${bag}</b></span></div>
    </nav>`;
  });
  document.querySelectorAll('[data-seal]').forEach(el => {
    const txt = el.dataset.seal, id = 'sp' + Math.random().toString(36).slice(2, 7);
    el.innerHTML = `<svg viewBox="0 0 150 150"><defs><path id="${id}" d="M75,75 m-62,0 a62,62 0 1,1 124,0 a62,62 0 1,1 -124,0"/></defs><text><textPath href="#${id}">${txt}</textPath></text></svg><div class="c">${ic(el.dataset.icon || 'diamond')}</div>`;
    el.classList.add('seal');
  });
  document.querySelectorAll('[data-facet]').forEach(el => { el.classList.add('facet'); el.innerHTML = facetSVG(); });
  document.querySelectorAll('[data-shape]').forEach(el => { el.outerHTML = shape(el.dataset.shape, el.className); });
  document.querySelectorAll('[data-footer]').forEach(el => {
    el.outerHTML = `<footer class="f">
      <div class="facet" style="width:900px;height:900px;right:-260px;top:-300px;opacity:.35">${facetSVG()}</div>
      <div class="cols">
        <div class="news"><div class="eyebrow" style="margin-bottom:26px">Le Cercle Éclat</div><p>First sight of new high-jewellery pieces, and invitations to the Paris salon.</p><div class="field">Your email address<b>${ic('arrow')}</b></div></div>
        <div><h5>Maison</h5><ul><li>The Atelier, Paris</li><li>Lab-grown, explained</li><li>Our gem cutters</li><li>Journal</li><li>Careers</li></ul></div>
        <div><h5>Client care</h5><ul><li>Book a private viewing</li><li>Ring size guide</li><li>Lifetime care & resizing</li><li>Certificates & insurance</li><li>Contact a concierge</li></ul></div>
        <div><h5>Salons</h5><ul><li>Paris · 14 Rue de la Paix</li><li>London · Mount Street</li><li>Dubai · Gate Village</li><li>Singapore · Orchard</li><li>Virtual salon</li></ul></div>
      </div>
      <div class="big plat">ÉCLAT</div>
      <div class="bot"><span>© 2026 Maison Éclat SAS · Concept house · All stones lab-grown or traceably sourced</span><span class="pay"><span>VISA</span><span>MASTERCARD</span><span>AMEX</span><span>WIRE</span></span><span>Privacy · Terms · Accessibility</span></div>
    </footer>`;
  });
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic); });
  document.querySelectorAll('[data-img]').forEach(el => {
    const [id, w, pos] = el.dataset.img.split('|');
    el.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1400)}" alt=""${pos ? ` style="object-position:${pos}"` : ''}>`);
    el.classList.add('ph');
  });
  // sparkles: data-sparkles="count" scatters twinkling stars inside the element
  document.querySelectorAll('[data-sparkles]').forEach(el => {
    let seed = (window.__spk = (window.__spk || 0) + 1) * 7919 + 13; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const n = +el.dataset.sparkles; let h = '';
    for (let i = 0; i < n; i++) h += `<i class="spk${rnd() < .3 ? ' g' : ''}" style="left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 100).toFixed(1)}%;--s:${(8 + rnd() ** 2 * 26).toFixed(0)}px;--d:${(2 + rnd() * 3).toFixed(1)}s;--dl:-${(rnd() * 4).toFixed(1)}s"></i>`;
    el.insertAdjacentHTML('beforeend', h);
  });
}
