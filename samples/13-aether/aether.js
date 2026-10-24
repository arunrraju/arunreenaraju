// AETHER shared chrome: icons, nav with mission clock, footer, photo slots.
const U = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  heart: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  rot: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bank: '<path d="M3 10h18L12 4 3 10Z"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
  card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10Z"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  zap: '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>',
  wave: '<path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  star: '<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3Z"/>'
};
const ic = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
const LOGO = `<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="7" fill="#f4f2ec"/><ellipse cx="20" cy="20" rx="18" ry="7" stroke="#3d8bff" stroke-width="1.3" transform="rotate(-24 20 20)"/><circle cx="35.5" cy="13" r="2" fill="#3d8bff"/></svg>`;

document.querySelectorAll('[data-icon]').forEach(e => e.insertAdjacentHTML('afterbegin', ic(e.dataset.icon)));
document.querySelectorAll('[data-img]').forEach(e => { const [id, w] = e.dataset.img.split('|'); e.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1400)}" alt="" loading="eager">`); });

const nav = document.querySelector('[data-nav]');
if (nav) {
  const on = nav.dataset.nav;
  const L = [['missions', 'Missions', 'missions.html'], ['mission', 'Lunar flyby', 'mission.html'], ['training', 'Training', 'training.html'], ['station', 'Halcyon', 'home.html#station'], ['store', 'Store', 'checkout.html']];
  nav.className = 'nav';
  nav.innerHTML = `<a class="logo" href="home.html">${LOGO}AETHER</a>
    <nav class="links">${L.map(([k, t, h]) => `<a href="${h}" class="${k === on ? 'on' : ''}">${t}</a>`).join('')}</nav>
    <div class="clock"><span><span class="live">●</span>&nbsp; NEXT LAUNCH <b>AE-14</b></span><span>T− <b id="tminus">141 : 06 : 12 : 40</b></span><span>UTC <b id="utc">21:48:07</b></span></div>
    <a class="btn ${nav.dataset.cta === 'ghost' ? 'ghost' : 'pri'} sm" href="booking.html">Reserve a seat ${ic('arrow')}</a>`;
  const pad = n => String(n).padStart(2, '0');
  let s = 141 * 86400 + 6 * 3600 + 12 * 60 + 40;
  setInterval(() => { s--; const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); const el = document.getElementById('tminus'); if (el) el.textContent = `${d} : ${pad(h)} : ${pad(m)} : ${pad(s % 60)}`; const u = new Date(); const ue = document.getElementById('utc'); if (ue) ue.textContent = `${pad(u.getUTCHours())}:${pad(u.getUTCMinutes())}:${pad(u.getUTCSeconds())}`; }, 1000);
}

const foot = document.querySelector('[data-foot]');
if (foot) {
  foot.className = 'foot';
  foot.innerHTML = `<div class="top">
    <div class="news"><h4>Launch notices</h4><p>One email when a seat opens. Nothing else, ever.</p><form onsubmit="return false"><input placeholder="you@domain.com"><button class="btn blue sm">Notify me ${ic('arrow')}</button></form>
      <div class="mono" style="margin-top:26px">Mission control · Lisbon · Kourou · Halcyon (412 km)</div></div>
    <div><h4>Fly</h4><ul><li>Meridian — 3-day orbital</li><li>Halcyon — station stay</li><li>Selene — lunar flyby</li><li>Charter a full capsule</li><li>Gift a seat</li></ul></div>
    <div><h4>Prepare</h4><ul><li>Medical standards</li><li>16-week training</li><li>Zero-g weekends</li><li>Families & guests</li><li>Insurance & escrow</li></ul></div>
    <div><h4>Aether</h4><ul><li>Safety record</li><li>Flight engineering</li><li>Mission store</li><li>Careers — 214 open</li><li>Press room</li></ul></div>
  </div>
  <div class="big">AETHER</div><div class="limb"></div>
  <div class="legal"><span>© 2026 Aether Orbital S.A. · Fictional concept</span><span>Seats are subject to medical clearance · Deposits held in escrow</span><span>Privacy · Terms · Accessibility</span></div>`;
}
