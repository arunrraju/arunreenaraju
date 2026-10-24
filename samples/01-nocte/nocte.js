// Shared chrome for the NOCTÉ screens: icons, glass nav, rotating badge, footer, photo slots.
const U = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  menu: '<path d="M4 8h16M4 16h10"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  sparkle: '<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  gift: '<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8Zm0 0s2-5 4.5-3.5S15 8 12 8Z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`;

function nocte(active, { bag = 1 } = {}) {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.outerHTML = `<nav class="nav">
      <div class="links">${['Fragrances', 'Collections', 'Scent Finder', 'Atelier'].map(n => `<a class="${n === active ? 'on' : ''}">${n}</a>`).join('')}</div>
      <a class="brand">NOCT<i>É</i></a>
      <div class="r"><span class="pill">${ic('search')}</span><span class="pill">EN · €</span><span class="pill">Account</span><span class="pill solid">${ic('bag')} Bag <b>${bag}</b></span></div>
    </nav>`;
  });
  document.querySelectorAll('[data-badge]').forEach(el => {
    const txt = el.dataset.badge;
    el.outerHTML = `<div class="badge ${el.className}" style="${el.getAttribute('style') || ''}"><svg viewBox="0 0 150 150"><defs><path id="cp${txt.length}" d="M75,75 m-60,0 a60,60 0 1,1 120,0 a60,60 0 1,1 -120,0"/></defs><text><textPath href="#cp${txt.length}">${txt}</textPath></text></svg><div class="c">${ic(el.dataset.icon || 'arrow')}</div></div>`;
  });
  document.querySelectorAll('[data-footer]').forEach(el => {
    el.outerHTML = `<footer class="f">
      <div class="cols">
        <div class="news"><div class="mono gold" style="margin-bottom:22px">Le Cercle Nocté</div><p>Private previews, rare editions and invitations to our Paris atelier.</p><div class="field">Your email address<b>${ic('arrow')}</b></div></div>
        <div><h5>Maison</h5><ul><li>Our Atelier</li><li>The Perfumers</li><li>Journal</li><li>Boutiques</li><li>Careers</li></ul></div>
        <div><h5>Client Care</h5><ul><li>Book a consultation</li><li>Shipping & returns</li><li>Engraving</li><li>Refill your flacon</li><li>Contact</li></ul></div>
        <div><h5>Follow</h5><ul><li>Instagram</li><li>Pinterest</li><li>TikTok</li><li>YouTube</li></ul></div>
      </div>
      <div class="big"><span class="gold-text">Nocté</span></div>
      <div class="bot"><span>© 2026 Maison Nocté, Paris · A concept house</span><span>Privacy · Terms · Accessibility · Cookies</span><span>Paris · Dubai · Tokyo · New York</span></div>
    </footer>`;
  });
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic); });
  document.querySelectorAll('[data-img]').forEach(el => {
    const [id, w] = el.dataset.img.split('|');
    el.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1400)}" alt="">`);
  });
}
