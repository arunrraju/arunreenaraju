// Shared chrome for the VOIDWORKS screens: nav, footer, photos, tickers, countdowns, motion ghosts, flat garment drawings.
const U = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  bag: '<path d="M4 8h16l-1 13H5L4 8Z"/><path d="M9 8V5h6v3"/>',
  arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  minus: '<path d="M4 12h16"/>',
  x: '<path d="M5 5l14 14M19 5 5 19"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  heart: '<path d="M12 20 4 12a4.5 4.5 0 0 1 8-5 4.5 4.5 0 0 1 8 5l-8 8Z"/>',
  truck: '<path d="M2 6h12v10H2zM14 10h5l3 3v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  lock: '<rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  star: '<path d="m12 3 2.7 6 6.3.6-4.8 4.2 1.5 6.2L12 16.8 6.3 20l1.5-6.2L3 9.6 9.3 9 12 3Z" fill="currentColor"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z"/><path d="M10 21h4"/>',
  play: '<path d="M7 4v16l13-8L7 4Z" fill="currentColor"/>',
  grid: '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/>',
  ticket: '<path d="M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V7Z"/><path d="M14 7v12" stroke-dasharray="2 2"/>',
  cam: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`;

const GARMENTS = {
  hoodie: '<path d="M62 40 80 30q20 26 40 0l18 10 36 38 14 100-22 4-14-80-2 108H50l-2-108-14 80-22-4 14-100Z"/><path class="s" d="M80 30q20-38 40 0M72 150h56l8 36H64Z"/><path class="s" d="M92 56v40M108 56v40"/>',
  tee: '<path d="M60 26 86 16q14 16 28 0l26 10 42 32-20 30-18-10v132H56V78l-18 10-20-30Z"/><path class="s" d="M86 16q14 26 28 0M56 196h88"/>',
  cargo: '<path d="M58 14h84l12 196h-40l-14-130-14 130H46Z"/><path class="s" d="M58 30h84M50 110h28v42H50ZM122 110h28v42h-28ZM100 30v50"/>',
  beanie: '<path d="M46 150q0-104 54-104t54 104Z"/><path d="M40 140h120v52H40Z"/><circle cx="100" cy="36" r="18"/><path class="s" d="M52 152v34M66 152v34M80 152v34M94 152v34M108 152v34M122 152v34M136 152v34M150 152v34"/>',
  tote: '<path d="M44 84h112l8 126H36Z"/><path class="s" d="M74 84q0-56 26-56t26 56M44 104h112"/>',
  cap: '<path d="M30 136q0-82 74-82t74 82Z"/><path d="M30 136q80 6 168 22-6 18-40 14L30 150Z"/><path class="s" d="M104 54v82M66 68l18 68M142 68l-18 68"/><circle cx="104" cy="54" r="6"/>',
  jacket: '<path d="M60 26 84 18l16 10 16-10 24 8 40 40 10 120-24 4-12-90v120H56V100l-12 90-24-4 10-120Z"/><path class="s" d="M100 28v186M70 120h22M108 120h22M84 18l16 40 16-40"/>',
  sock: '<path d="M76 14h56v120l30 34q10 26-16 34l-50-16q-20-8-20-30Z"/><path class="s" d="M76 34h56M76 48h56"/>'
};
const garment = (n, cls = '') => `<svg class="garm ${cls}" viewBox="0 0 200 220">${GARMENTS[n]}</svg>`;

function void_(active, { bag = 2 } = {}) {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.outerHTML = `<div class="topbar"><span>EU · €</span><div class="c"><span>■ Drop 07 “Null Signal” — Fri 18:00 CET</span><span>Free express over €200</span><span>No restocks. Ever.</span></div><span>Account · Raffles (1)</span></div>
    <nav class="nav">
      <a class="logo"><i></i>VOIDWORKS</a>
      <div class="links">${[['Drop 07', 1], ['Shop'], ['Raffle'], ['Lookbook'], ['Archive'], ['Community']].map(([n, b]) => `<a class="${n === active ? 'on' : ''}">${n}${b ? '<span class="n">LIVE</span>' : ''}</a>`).join('')}</div>
      <div class="r"><span class="search">Search pieces ${ic('search')}</span><span>${ic('heart')}</span><span class="bag">${ic('bag')} Bag <b>${bag}</b></span></div>
    </nav>`;
  });
  document.querySelectorAll('[data-footer]').forEach(el => {
    el.outerHTML = `<footer class="f">
      <div class="join"><div><div class="mono lime" style="margin-bottom:18px">■ The Void List — 41,280 members</div><h3>Get the drop <span>before</span><br>it gets got.</h3><div class="fld"><span>you@email.com</span><b>JOIN ${ic('arrow')}</b></div></div>
        <div class="r"><p>Early access 15 minutes before every drop, raffle reminders by SMS, and zero newsletters about “our journey”. Unsubscribe whenever. We won't cry.</p><div class="barcode l" style="width:100%"></div><div class="mono" style="color:#9a9992;display:flex;justify-content:space-between"><span>VW—2027—0007—NS</span><span>BERLIN / 52.52°N 13.40°E</span></div></div></div>
      <div class="cols">
        <div><h5>Shop</h5><ul><li>Drop 07 — Null Signal</li><li>Hoodies</li><li>Jackets</li><li>Cargos</li><li>Tees & Tops</li></ul></div>
        <div><h5>Drops</h5><ul><li>Raffle entries</li><li>Drop calendar</li><li>Archive 01—06</li><li>Sizing lab</li></ul></div>
        <div><h5>Help</h5><ul><li>Shipping — 48h EU</li><li>Returns — 14 days</li><li>Track order</li><li>Bot policy</li></ul></div>
        <div><h5>Void</h5><ul><li>About the label</li><li>Studio Berlin</li><li>Stockists (9)</li><li>Careers</li></ul></div>
        <div><h5>Follow</h5><ul><li>Instagram ↗</li><li>TikTok ↗</li><li>Discord ↗</li><li>Are.na ↗</li></ul></div>
      </div>
      <div class="big">Void<span>■</span>works</div>
      <div class="bot"><span>© 2027 Voidworks Studio GmbH · A concept label</span><span>Privacy · Terms · Imprint · Cookies</span><span>Made in Porto · Sewn by 14 people</span></div>
    </footer>`;
  });
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic); });
  document.querySelectorAll('[data-g]').forEach(el => { el.insertAdjacentHTML('afterbegin', garment(el.dataset.g, el.dataset.gc || '')); });
  document.querySelectorAll('[data-img]').forEach(el => {
    const [id, w, pos] = el.dataset.img.split('|');
    el.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1200)}" alt=""${pos ? ` style="object-position:${pos}"` : ''}>`);
  });
  // motion-blur ghosts behind a photo
  document.querySelectorAll('[data-ghost]').forEach(el => {
    const img = el.querySelector('img');
    [[-60, .35, 10], [-130, .18, 22]].forEach(([x, o, b]) => {
      const g = img.cloneNode();
      g.style.cssText += `;transform:translateX(${x}px);opacity:${o};filter:grayscale(1) blur(${b}px)`;
      el.appendChild(g);
    });
  });
  document.querySelectorAll('.tick .t').forEach(t => { t.innerHTML += t.innerHTML; });
  // countdowns: data-cd = seconds remaining
  const pad = n => String(n).padStart(2, '0');
  const cds = [...document.querySelectorAll('[data-cd]')].map(el => ({ el, s: +el.dataset.cd }));
  const draw = () => cds.forEach(c => {
    const s = c.s, v = { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
    for (const k in v) c.el.querySelectorAll(`[data-u="${k}"]`).forEach(n => n.textContent = pad(v[k]));
  });
  draw();
  setInterval(() => { cds.forEach(c => c.s > 0 && c.s--); draw(); }, 1000);
}
