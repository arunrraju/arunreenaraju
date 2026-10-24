// Shared chrome for FORMA ATELIER screens: icons, nav, footer, photo slots, marquees.
const U = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  cube: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>',
  explode: '<rect x="8" y="3" width="8" height="5"/><rect x="8" y="16" width="8" height="5"/><path d="M12 9.5v5M3 12h4M17 12h4"/>',
  ruler: '<path d="m3 17 14-14 4 4L7 21l-4-4Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  ar: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M12 7 7.5 9.5v5L12 17l4.5-2.5v-5L12 7Z"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" fill="currentColor" stroke="none"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  gift: '<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
const MARK = '<svg viewBox="0 0 30 30"><circle cx="15" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2"/><rect x="6" y="20" width="18" height="6" fill="#b08d57"/></svg>';

function forma(active, { dark = false, cart = 2 } = {}) {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.outerHTML = `<nav class="nav ${dark ? 'dk' : ''}">
      <a class="logo">${MARK}FORMA<small>ATELIER</small></a>
      <div class="links">${['Collection', 'Configure', 'Room', 'Atelier', 'Journal'].map(n => `<a class="${n === active ? 'on' : ''}">${n}</a>`).join('')}</div>
      <div class="r"><span class="b">${ic('search')}</span><span class="b">EN · €</span><span class="b fill">Cart <i>${cart}</i></span></div>
    </nav>`;
  });
  document.querySelectorAll('[data-footer]').forEach(el => {
    el.outerHTML = `<footer class="f">
      <div class="cols">
        <div class="news"><div class="tag brass" style="margin-bottom:22px">The Salon list</div><p>Private previews of each new object, before it reaches the gallery floor.</p><div class="field">Your email address<b>${ic('arrow')}</b></div></div>
        <div><h5>Gallery</h5><ul><li>Collection 07</li><li>Archive editions</li><li>Commissions</li><li>Trade programme</li><li>Gift cards</li></ul></div>
        <div><h5>Client care</h5><ul><li>Book a private viewing</li><li>White-glove delivery</li><li>Fabric samples</li><li>Care &amp; restoration</li><li>Lifetime frame warranty</li></ul></div>
        <div><h5>Visit</h5><ul><li>Lisbon — Rua da Boavista 118</li><li>Milan — Via Solferino 27</li><li>Copenhagen — Bredgade 40</li><li>Instagram · Pinterest</li></ul></div>
      </div>
      <div class="big" data-fit="1344">FORMA</div>
      <div class="bot"><span>© 2027 Forma Atelier, Lisbon · A concept gallery</span><span>Privacy · Terms · Accessibility · Cookies</span><span>Each object signed &amp; numbered</span></div>
    </footer>`;
  });
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic); });
  document.querySelectorAll('[data-img]').forEach(el => {
    const [id, w] = el.dataset.img.split('|');
    el.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1400)}" alt="">`);
  });
  const fit = () => document.querySelectorAll('[data-fit]').forEach(el => { const rg = document.createRange(); rg.selectNodeContents(el); const w = rg.getBoundingClientRect().width, cs = parseFloat(getComputedStyle(el).fontSize); el.style.fontSize = (cs * (+el.dataset.fit) / w) + 'px'; });
  fit(); document.fonts.ready.then(fit); [300, 900, 1800].forEach(t => setTimeout(fit, t));
  document.querySelectorAll('.mq .tr').forEach(t => { t.innerHTML += t.innerHTML; });
}
