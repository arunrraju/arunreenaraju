// OCÉANE shared UI: logo, compass roses, nav, footer, number tickers.
(function () {
  const logo = (c = 'currentColor') => `<svg viewBox="0 0 40 40" fill="none" stroke="${c}" stroke-width="1.1"><circle cx="20" cy="20" r="18.5" opacity=".5"/><circle cx="20" cy="20" r="13" opacity=".25"/><path d="M20 2v36M2 20h36" opacity=".25"/><path d="M20 4l3.2 12.8L36 20l-12.8 3.2L20 36l-3.2-12.8L4 20l12.8-3.2z" fill="${c}" fill-opacity=".12"/><path d="M20 4l3.2 12.8L20 20z" fill="#c9a45c" stroke="none"/><path d="M8 26c4 2.4 8 2.4 12 0s8-2.4 12 0" stroke="#c9a45c"/></svg>`;
  window.O_logo = logo;
  function compass(size, o = {}) {
    const r = size / 2, ticks = [];
    for (let i = 0; i < 120; i++) { const a = i * 3 * Math.PI / 180, L = i % 10 === 0 ? 14 : i % 5 === 0 ? 9 : 5; ticks.push(`<line x1="${r + Math.sin(a) * (r - 6)}" y1="${r - Math.cos(a) * (r - 6)}" x2="${r + Math.sin(a) * (r - 6 - L)}" y2="${r - Math.cos(a) * (r - 6 - L)}"/>`); }
    const lbl = []; for (let i = 0; i < 12; i++) { const a = i * 30 * Math.PI / 180, rr = r - 34; lbl.push(`<text x="${r + Math.sin(a) * rr}" y="${r - Math.cos(a) * rr + 4}" text-anchor="middle">${['N', '030', '060', 'E', '120', '150', 'S', '210', '240', 'W', '300', '330'][i]}</text>`); }
    const star = (rad, w, rot, fill) => { let d = ''; for (let i = 0; i < 4; i++) { const a = (rot + i * 90) * Math.PI / 180, b1 = a + Math.PI / 4, b2 = a - Math.PI / 4; d += `M${r} ${r}L${r + Math.sin(b2) * w} ${r - Math.cos(b2) * w}L${r + Math.sin(a) * rad} ${r - Math.cos(a) * rad}L${r + Math.sin(b1) * w} ${r - Math.cos(b1) * w}Z`; } return `<path d="${d}" fill="${fill}"/>`; };
    return `<svg class="compass" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">
      <circle cx="${r}" cy="${r}" r="${r - 2}" stroke="${o.c || 'rgba(244,241,234,.35)'}"/><circle cx="${r}" cy="${r}" r="${r - 22}" stroke="${o.c || 'rgba(244,241,234,.18)'}"/>
      <g stroke="${o.c || 'rgba(244,241,234,.5)'}" stroke-width="1">${ticks.join('')}</g>
      <g fill="${o.t || 'rgba(244,241,234,.6)'}" font-family="IBM Plex Mono" font-size="${Math.max(8, size / 26)}" letter-spacing="1">${lbl.join('')}</g>
      ${star(r - 48, (r - 48) * .14, 45, 'rgba(201,164,92,.35)')}${star(r - 40, (r - 40) * .16, 0, 'url(#cg' + size + ')')}
      <defs><linearGradient id="cg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d9a0"/><stop offset=".5" stop-color="#c9a45c"/><stop offset="1" stop-color="#7d5a28"/></linearGradient></defs>
      <circle cx="${r}" cy="${r}" r="4" fill="#0b1f33" stroke="#e8cf94"/></svg>`;
  }
  window.O_compass = compass;
  const NAV = [['Charter', 'home.html', 'home'], ['Fleet', 'fleet.html', 'fleet'], ['Itineraries', 'itinerary.html', 'itinerary'], ['Experiences', 'experiences.html', 'experiences'], ['Yacht sales', 'fleet.html#sales', 'sales'], ['Journal', '#', 'j']];
  document.querySelectorAll('[data-nav]').forEach(el => {
    const on = el.dataset.nav;
    el.classList.add('nav'); if (el.dataset.glass !== undefined) el.classList.add('glassbar'); if (el.dataset.light !== undefined) el.classList.add('light');
    el.innerHTML = `<a class="logo" href="home.html">${logo()}<div>OCÉANE<small>Yachting · Est. 2009</small></div></a>
      <nav class="links">${NAV.map(n => `<a href="${n[1]}" class="${n[2] === on ? 'on' : ''}">${n[0]}</a>`).join('')}</nav>
      <div class="right"><span style="opacity:.7">EN · €</span><span class="flags"><i class="fl fl-O"></i><i class="fl fl-C"></i><i class="fl fl-E"></i></span><span>+377 98 06 41 20</span><a class="btn ${el.dataset.btn || 'brassbtn'} sm" href="enquire.html">Enquire</a></div>`;
  });
  document.querySelectorAll('[data-foot]').forEach(el => {
    el.className = 'foot';
    el.innerHTML = `<div class="coords">43°44′02″N · 7°25′26″E — PORT HERCULE, MONACO</div><div class="w">
      <div class="cols">
        <div><a class="logo" style="margin-bottom:26px">${logo()}<div>OCÉANE<small>Yachting · Est. 2009</small></div></a><p class="dim" style="max-width:330px;font-size:15px">Superyacht charter, management and sales across the Mediterranean and the Caribbean. Thirty-eight yachts, one standard of service.</p>
          <div style="display:flex;gap:10px;margin-top:26px"><span class="flags"><i class="fl fl-O"></i><i class="fl fl-C"></i><i class="fl fl-E"></i><i class="fl fl-A"></i><i class="fl fl-N"></i><i class="fl fl-E"></i></span></div></div>
        <div><h5>Charter</h5><ul><li>The fleet</li><li>Itinerary builder</li><li>Experiences</li><li>Charter guide & APA</li><li>Corporate events</li></ul></div>
        <div><h5>Sales & care</h5><ul><li>Yachts for sale</li><li>New build</li><li>Management</li><li>Crew placement</li><li>Valuation</li></ul></div>
        <div><h5>Offices</h5><ul class="office"><li><b>Monaco</b><span>Quai Antoine 1er</span></li><li><b>Palma</b><span>Paseo Marítimo 44</span></li><li><b>St Barths</b><span>Rue de la République</span></li></ul></div>
        <div><h5>The log — monthly</h5><p class="dim" style="font-size:14.5px">New yachts, open weeks and season notes, written by our captains.</p><div class="news"><span>Your email</span><span style="color:var(--brass)">Subscribe →</span></div></div>
      </div>
      <div class="big">OCÉANE</div>
      <div class="legal"><span>© 2026 Océane Yachting SAM · Concept</span><span>MYBA charter terms · Privacy · Cookies</span><span>Made at sea level</span></div></div>`;
  });
  document.querySelectorAll('[data-compass]').forEach(el => { el.innerHTML = compass(+el.dataset.compass, { c: el.dataset.c, t: el.dataset.t }); });
  document.querySelectorAll('[data-logo]').forEach(el => { el.innerHTML = logo(el.dataset.logo || 'currentColor'); });
})();
