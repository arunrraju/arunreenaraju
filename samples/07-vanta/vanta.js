// VANTA — shared HUD chrome: nav, footer, icons, photo slots, gauges (the car itself is real 3D: vanta3d.js), counters, boot text.
const U = (id, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  lock: '<rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  cal: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  rot: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/>',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  wave: '<path d="M2 12h3l2-6 4 12 3-9 2 3h6"/>',
  menu: '<path d="M4 8h16M4 16h10"/>'
};
const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24">${ICONS[n]}</svg>`;

/* ---------- arc gauge ---------- */
function gauge({ v = 70, label = '', val = '', unit = '', color = '#00e5ff', size = 220, ticks = 40 }) {
  const r = 88, C = Math.PI * 2 * r, arc = C * .75, on = arc * v / 100;
  let t = '';
  for (let i = 0; i <= ticks; i++) { const a = (135 + i * 270 / ticks) * Math.PI / 180, big = i % 5 === 0, r1 = big ? 98 : 101; t += `<line x1="${110 + r1 * Math.cos(a)}" y1="${110 + r1 * Math.sin(a)}" x2="${110 + 106 * Math.cos(a)}" y2="${110 + 106 * Math.sin(a)}" stroke="${i / ticks * 100 <= v ? color : '#2a3448'}" stroke-width="${big ? 2 : 1}"/>`; }
  return `<svg class="gauge" viewBox="0 0 220 220" width="${size}" height="${size}">${t}
    <circle cx="110" cy="110" r="${r}" fill="none" stroke="#141c2c" stroke-width="6" stroke-dasharray="${arc} ${C}" transform="rotate(135 110 110)"/>
    <circle class="arcfill" cx="110" cy="110" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="butt" stroke-dasharray="${on} ${C}" style="--on:${on};--C:${C};filter:drop-shadow(0 0 6px ${color})" transform="rotate(135 110 110)"/>
    <circle cx="110" cy="110" r="66" fill="none" stroke="#1a2336" stroke-dasharray="2 4"/>
    <text x="110" y="108" text-anchor="middle" class="gv">${val}</text>
    <text x="110" y="130" text-anchor="middle" class="gu">${unit}</text>
    <text x="110" y="196" text-anchor="middle" class="gl">${label}</text></svg>`;
}

const LOGO = `<svg viewBox="0 0 40 40" class="logo-mark"><path d="M4 6h32L20 34Z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 11h16l-8 14Z" fill="#00e5ff"/></svg>`;

function vanta(active) {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.outerHTML = `<nav class="hud-nav">
      <a class="brand">${LOGO}<span>VANTA</span><small>Σ1</small></a>
      <div class="links">${[['Σ1', 'home'], ['Engineering', 'model'], ['Configure', 'configure'], ['Telemetry', 'performance'], ['Experience', 'experience']].map(([n, k], i) => `<a class="${k === active ? 'on' : ''}"><em>0${i + 1}</em>${n}</a>`).join('')}</div>
      <div class="r"><span class="sys"><i></i>SYS ONLINE</span><span class="alloc">ALLOC <b>62</b>/99</span><a class="btn sm">Reserve ${ic('arrow')}</a></div>
    </nav>`;
  });
  document.querySelectorAll('[data-footer]').forEach(el => {
    el.outerHTML = `<footer class="vf">
      <div class="vf-top">
        <div class="news"><div class="lbl cy">// Transmission list</div><p>Chassis reveals, test-day invitations and allocation windows. Signal only, no noise.</p><div class="field"><span>pilot@yourdomain.com</span><b>${ic('arrow')}</b></div></div>
        <div><h5>Σ1</h5><ul><li>Overview</li><li>Engineering</li><li>Configurator</li><li>Telemetry</li><li>Reserve</li></ul></div>
        <div><h5>Owners</h5><ul><li>Hangar locations</li><li>Track programme</li><li>Concierge 24/7</li><li>Over-air updates</li><li>Warranty</li></ul></div>
        <div><h5>Company</h5><ul><li>Manifesto</li><li>Laboratory</li><li>Careers</li><li>Press kit</li><li>Contact</li></ul></div>
      </div>
      <div class="vf-big"><span data-t="VANTA">VANTA</span><i class="scanbar"></i></div>
      <div class="vf-bot"><span>© 2026 VANTA Automobili GmbH · Concept brand</span><span>Privacy · Terms · Cookies · Imprint</span><span class="mono">BUILD 26.10.4 · LAT 48.137 LON 11.575</span></div>
    </footer>`;
  });
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic, el.className); });
  document.querySelectorAll('[data-gauge]').forEach(el => { el.innerHTML = gauge(JSON.parse(el.dataset.gauge)); });
  document.querySelectorAll('[data-img]').forEach(el => {
    const [id, w] = el.dataset.img.split('|');
    el.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1600)}" alt="">`);
  });
  // counting telemetry numbers: count up from zero, land on the printed value
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, t0 = performance.now(), dur = 1100;
    const fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const step = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(end * e); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
