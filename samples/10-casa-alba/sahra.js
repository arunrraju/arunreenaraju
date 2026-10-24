/* SAHRA — shared chrome: nav, footer, cursor follow, small motion helpers */
(function () {
  const U = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w || 1200}`;
  window.SU = U;
  const logo = `<svg viewBox="0 0 32 32" fill="none"><path d="M3 24a13 13 0 0 1 26 0" stroke="url(#lg)" stroke-width="1.4"/><path d="M9.5 24a6.5 13 0 0 1 13 0M3 24h26M5.2 17.5h21.6M9.4 12h13.2" stroke="url(#lg)" stroke-width=".9" opacity=".75"/><circle cx="25.5" cy="5.5" r="1.4" fill="#ffd9a0"/><path d="M25.5 2.2v6.6M22.2 5.5h6.6" stroke="#ffd9a0" stroke-width=".5"/><defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#ffe2b2"/><stop offset="1" stop-color="#c98a4b"/></linearGradient></defs></svg>`;
  window.SAHRA_LOGO = logo;
  document.querySelectorAll('[data-nav]').forEach(h => {
    const on = h.dataset.nav, night = h.dataset.mode === 'night';
    const items = [['suites', 'Suites', 'suites.html'], ['experiences', 'Experiences', 'experiences.html'], ['night', 'The Night Sky', 'experiences.html'], ['map', 'Reserve map', 'suites.html'], ['journal', 'Journal', 'home.html']];
    h.className = 'nav';
    h.innerHTML = `<a class="logo" href="home.html">${logo}<span>SAHRA<small>DESERT SANCTUARY</small></span></a>
      <ul>${items.map(i => `<li class="${i[0] === on ? 'on' : ''}"><a href="${i[2]}">${i[1]}</a></li>`).join('')}</ul><div class="sp"></div>
      <div class="dn glass ${night ? 'night' : ''}"><span>${night ? 'Night · 22:14' : 'Day · 17:42'}</span><span class="track"><span class="knob"></span></span></div>
      <a class="btn" href="booking.html">Reserve <span class="ar">→</span></a>`;
  });
  document.querySelectorAll('[data-foot]').forEach(f => {
    f.className = 'foot';
    f.innerHTML = `<div class="wrap"><div class="big">SAHRA</div>
      <div class="cols">
        <div><a class="logo" href="home.html">${logo}<span>SAHRA<small>DESERT SANCTUARY</small></span></a><p style="margin-top:26px;max-width:300px">Thirty glass domes on a 412 km² private reserve at the edge of the Empty Quarter. Adults only. Open October to April.</p><p class="coords" style="margin-top:22px">20°47′N · 56°31′E · ALT 212 M</p></div>
        <div><h5>Stay</h5><ul><li>Dune Dome</li><li>Oasis Dome</li><li>Crest Observatory</li><li>The Sahra Pavilion</li></ul></div>
        <div><h5>Explore</h5><ul><li>Night Sky Programme</li><li>Dune Dinners</li><li>Sand &amp; Salt Spa</li><li>Getting here</li></ul></div>
        <div><h5>House</h5><ul><li>Our dark-sky pledge</li><li>Careers</li><li>Press</li><li>Gift a night</li></ul></div>
        <div><h5>Letters from the dunes</h5><p>One letter each new moon: what's rising, what's blooming, which domes are free.</p><div class="news"><span>your@email.com</span><span style="color:var(--sand2)">Subscribe →</span></div></div>
      </div>
      <div class="base"><span>© 2026 Sahra Desert Sanctuary · A concept for portfolio purposes</span><span>Next new moon · 9 Nov · 03:02 GST</span><span>Privacy · Terms · Accessibility</span></div></div>`;
  });
  // cursor follows the pointer inside its section (static position kept for stills)
  document.querySelectorAll('.cursor').forEach(c => {
    const host = c.parentElement; host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); c.style.left = (e.clientX - r.left) + 'px'; c.style.top = (e.clientY - r.top) + 'px'; });
  });
  // marquee duplication
  document.querySelectorAll('.marq .tr').forEach(t => { t.innerHTML += t.innerHTML; });
})();
