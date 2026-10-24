// KAIROS shared chrome: icons, nav, footer, live clocks, photo slots.
const U = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  left: '<path d="M20 12H4M10 6l-6 6 6 6"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  zoom: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>'
};
const ic = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
const LOGO = `<svg viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="13.5" stroke="#c9d1dc" stroke-width="1"/><circle cx="15" cy="15" r="9" stroke="#5b8cff" stroke-width="1" stroke-dasharray="1 2.2"/><path d="M15 3.5v4M15 22.5v4M3.5 15h4M22.5 15h4" stroke="#c9d1dc"/><path d="M15 15 19.5 9" stroke="#eef2f7" stroke-width="1.3"/><circle cx="15" cy="15" r="1.4" fill="#5b8cff"/></svg>`;
function miniClock(off = 0) {
  return `<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="14" fill="none" stroke="rgba(201,209,220,.35)"/><path class="mini-hand" d="M15 15V8" stroke="#eef2f7" stroke-width="1.4" style="transform:rotate(${off * 30}deg)"/><path class="mini-hand" d="M15 15V5" stroke="#c9d1dc" style="transform:rotate(${off * 47 % 360}deg)"/><path class="tick-s" d="M15 17V3.5" stroke="#5b8cff"/><circle cx="15" cy="15" r="1.3" fill="#5b8cff"/></svg>`;
}

function nav(on, progress = .3) {
  const L = [['collection.html', '01', 'Collection'], ['product.html', '02', 'Meridian'], ['configurator.html', '03', 'Configure'], ['manufacture.html', '04', 'Manufacture'], ['appointment.html', '05', 'Boutiques']];
  return `<nav class="nav" style="--p:${progress}">
    <a class="logo" href="home.html">${LOGO}KAIROS</a>
    <div class="links">${L.map(([h, n, t]) => `<a href="${h}" class="${on === h ? 'on' : ''}"><i>${n}</i>${t}</a>`).join('')}</div>
    <div class="r"><span class="clock live">GVA <b data-clock>23:41:07</b></span><a class="ic" href="#">${ic('search')}</a><a class="ic" href="appointment.html">${ic('bag')}<em>1</em></a></div>
  </nav>`;
}
function footer() {
  return `<footer class="foot"><div class="grid-bg" style="opacity:.6"></div>
    <div class="cols" style="position:relative">
      <div><a class="logo" href="home.html">${LOGO}KAIROS</a><p style="margin-top:26px;color:var(--dim);max-width:330px;font-size:14px">Independent haute horlogerie, Genève. Twelve watchmakers, one calibre family, never more than 140 watches a year.</p>
        <div class="news"><span>Collector letter — quarterly</span>${ic('arrow')}</div></div>
      <div><h5>Collection</h5><ul><li>Meridian Tourbillon</li><li>Nocturne Squelette</li><li>Aurora Rose</li><li>Equinox Platine</li><li>Kairos Zéro</li></ul></div>
      <div><h5>Maison</h5><ul><li>The Manufacture</li><li>Calibre KC-1</li><li>Atelier journal</li><li>Certificates</li></ul></div>
      <div><h5>Service</h5><ul><li>Book a viewing</li><li>After-sales</li><li>Warranty · 8 years</li><li>Contact</li></ul></div>
      <div><h5>Boutiques · local time</h5><div class="clocks" style="flex-direction:column;gap:14px">
        <div>${miniClock(11)}GENÈVE · QUAI DES HORLOGERS</div><div>${miniClock(11)}PARIS · RUE DU MAIL 7</div><div>${miniClock(7)}TOKYO · GINZA 6-CHŌME</div><div>${miniClock(2)}DUBAI · DIFC GATE</div></div></div>
    </div>
    <div class="big">KAIROS</div>
    <div class="legal" style="position:relative"><span>© 2026 Kairos Horlogerie SA · Concept project</span><span>Δ +0.8 s / day · COSC +  Poinçon de Genève</span><span>Privacy · Terms · Accessibility</span></div>
  </footer>`;
}

function chrome() {
  document.querySelectorAll('[data-nav]').forEach(el => el.outerHTML = nav(el.dataset.nav, el.dataset.p || .3));
  document.querySelectorAll('[data-foot]').forEach(el => el.outerHTML = footer());
  document.querySelectorAll('[data-ic]').forEach(el => el.outerHTML = ic(el.dataset.ic));
  document.querySelectorAll('[data-img]').forEach(el => { if (!el.querySelector('img')) el.insertAdjacentHTML('afterbegin', `<img src="${U(el.dataset.img, +el.dataset.w || 1400)}" alt="">`); });
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const d = new Date(); const t = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    document.querySelectorAll('[data-clock]').forEach(e => e.textContent = t);
    document.querySelectorAll('[data-sec]').forEach(e => e.textContent = pad(d.getSeconds()));
    document.querySelectorAll('[data-ms]').forEach(e => e.textContent = String(d.getMilliseconds()).padStart(3, '0').slice(0, 1));
  };
  tick(); setInterval(tick, 100);
}
chrome();

// leader lines from projected 3D anchors to fixed labels: defs = [{k:'tourbillon', to:[x,y], elbow:'h'|'v'}]
function callouts(svg, pts, defs) {
  svg.innerHTML = defs.map(d => {
    const p = pts[d.k]; if (!p) return '';
    const [x, y] = p, [tx, ty] = d.to, mx = d.elbow === 'v' ? x : tx + (d.pad || 0);
    const my = d.elbow === 'v' ? ty : y;
    const e = d.elbow === 'v' ? `${x},${ty}` : `${(x + tx) / 2 + (d.bend || 0)},${y} ${(x + tx) / 2 + (d.bend || 0)},${ty}`;
    return `<polyline points="${x},${y} ${e} ${tx},${ty}"/><circle class="o" cx="${x}" cy="${y}" r="9"/><circle class="d" cx="${x}" cy="${y}" r="3"/><circle cx="${tx}" cy="${ty}" r="2" fill="#c9d1dc"/>`;
  }).join('');
}

