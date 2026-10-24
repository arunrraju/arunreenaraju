// Shared chrome for the SONORA screens: nav, footer, icons, photo slots, waveforms, frequency bars.
const U = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  left: '<path d="M20 12H4M10 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  play: '<path d="M7 4v16l13-8L7 4Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" stroke="none"/>',
  prev: '<path d="M18 5v14L8 12l10-7ZM6 5v14" />',
  next: '<path d="M6 5v14l10-7L6 5ZM18 5v14" />',
  check: '<path d="m5 12 5 5L20 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  lock: '<rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  repeat: '<path d="M4 9h13l-3-3M20 15H7l3 3"/>',
  shuffle: '<path d="M4 7h4l8 10h4M4 17h4l2-2.5M14 9.5 16 7h4M18 5l2 2-2 2M18 15l2 2-2 2"/>',
  vol: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
  bt: '<path d="m7 7 10 10-5 4V3l5 4L7 17"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  leaf: '<path d="M5 19C5 9 11 5 20 4c0 9-4 15-14 15M5 19l8-8"/>',
  tool: '<path d="M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9a4 4 0 0 1-2-2Z"/>',
  bat: '<rect x="3" y="7" width="16" height="10"/><path d="M21 10v4"/><path d="M6 10h8v4H6z" fill="currentColor"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`;

// tiny seeded random so waveforms are identical on every render
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function waveSvg(n, progress, h, seed, opts = {}) {
  const r = rng(seed); const w = 1000; const step = w / n; const bw = step * (opts.fill || .55);
  let out = '';
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = .35 + .65 * Math.abs(Math.sin(t * Math.PI * (opts.phr || 3.2) + seed)) * (.6 + .4 * Math.sin(t * 17 + seed));
    const v = Math.max(.06, Math.min(1, env * (.45 + r() * .75)));
    const bh = v * h; const y = (h - bh) / 2;
    const played = t < progress; const near = Math.abs(t - progress) < .025;
    const col = played ? (opts.played || 'var(--sig)') : (opts.rest || 'rgba(11,11,11,.22)');
    out += `<rect x="${(i * step).toFixed(2)}" y="${y.toFixed(1)}" width="${bw.toFixed(2)}" height="${bh.toFixed(1)}" fill="${col}"${near ? ' class="hot"' : ''}/>`;
  }
  return `<svg class="wave" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">${out}</svg>`;
}

function sonora(active, { cart = 1, light = false } = {}) {
  const links = [['01', 'Headphones'], ['02', 'Speakers'], ['03', 'Listening Room'], ['04', 'Configure'], ['05', 'Studio']];
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.outerHTML = `<nav class="nav${light ? ' light' : ''}">
      <a class="brand"><i></i>SONORA</a>
      <div class="links">${links.map(([n, l]) => `<a class="${l === active ? 'on' : ''}"><span>${n}</span>${l}</a>`).join('')}</div>
      <div class="r"><span class="clock"><i></i>Zürich 14:32 CET</span><span>${ic('search')}</span><span>EN / €</span><span class="cart">Cart <b>${cart}</b></span></div>
    </nav>`;
  });
  document.querySelectorAll('[data-footer]').forEach(el => {
    el.outerHTML = `<footer class="f">
      <div class="top">
        <div class="news"><div class="mono"><span class="sig">■</span> Sonora Bulletin</div><p>Firmware notes, lab measurements and listening sessions. Once a month.</p><div class="field">name@domain.ch<b>Subscribe ${ic('arrow')}</b></div></div>
        <div class="col"><h5>Products</h5><ul><li>Kontur H1</li><li>Kontur Studio</li><li>Fels S3 Monitors</li><li>Tram P1</li><li>Kubus R2</li></ul></div>
        <div class="col"><h5>Service</h5><ul><li>Spare parts</li><li>Repairs · 10 years</li><li>Trade-in</li><li>Firmware</li><li>Contact</li></ul></div>
        <div class="col"><h5>Studio</h5><ul><li>The lab</li><li>Measurements</li><li>Showrooms</li><li>Careers</li><li>Press kit</li></ul></div>
      </div>
      <div class="big">SONORA<i></i></div>
      <div class="bot"><span>© 2026 Sonora Akustik AG · A concept brand</span><span>Hardturmstrasse 161 · 8005 Zürich · CH</span><span>Privacy · Terms · Warranty · Imprint</span></div>
    </footer>`;
  });
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic); });
  document.querySelectorAll('[data-img]').forEach(el => {
    const [id, w] = el.dataset.img.split('|');
    el.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1400)}" alt="">`);
  });
  // data-wave="bars|progress|height|seed" (+ data-rest / data-played colours)
  document.querySelectorAll('[data-wave]').forEach(el => {
    const [n, p, h, s] = el.dataset.wave.split('|').map(Number);
    el.innerHTML = waveSvg(n, p, h, s, { rest: el.dataset.rest, played: el.dataset.played, fill: el.dataset.fill && +el.dataset.fill });
  });
  // data-bars="count|seed" animated frequency bars
  document.querySelectorAll('[data-bars]').forEach(el => {
    const [n, s] = el.dataset.bars.split('|').map(Number); const r = rng(s || 7);
    el.classList.add('bars');
    el.innerHTML = Array.from({ length: n }, (_, i) => {
      const base = .25 + .75 * Math.pow(Math.sin((i / n) * Math.PI * .9 + .2), 1.2) * (.55 + r() * .45);
      return `<s style="height:${(base * 100).toFixed(0)}%;animation-duration:${(.6 + r() * .9).toFixed(2)}s;animation-delay:-${(r() * 2).toFixed(2)}s"></s>`;
    }).join('');
  });
  if (!document.querySelector('.gridlines') && !document.body.hasAttribute('data-nogrid')) document.body.insertAdjacentHTML('afterbegin', '<div class="gridlines"></div>');
}
