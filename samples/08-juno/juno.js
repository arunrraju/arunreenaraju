// JUNO shared chrome: flavour data, CSS cans, SVG fruit, nav, wavy marquee, stickers, footer.
const U = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const INK = '#1a1230';
const FL = {
  sun:   { name: 'Sun Riot',    sub: 'Blood orange · Ashwagandha',      c: '#ff7a1a', c2: '#ffd23f', t: INK, fruit: 'orange',     mood: 'Calm-up',  price: 32 },
  pink:  { name: 'Pink Fizz',   sub: 'Grapefruit · Hibiscus · Reishi',  c: '#ff8fc7', c2: '#ff3d7f', t: INK, fruit: 'grapefruit', mood: 'Glow',     price: 32 },
  lime:  { name: 'Lime Wire',   sub: 'Lime · Ginger · Lion’s mane',     c: '#c6f432', c2: '#2647ff', t: INK, fruit: 'lime',       mood: 'Focus',    price: 32 },
  blue:  { name: 'Blue Hour',   sub: 'Blueberry · Butterfly pea · L-theanine', c: '#2647ff', c2: '#ff8fc7', t: '#fff6e6', fruit: 'berry', mood: 'Unwind', price: 34 },
  peach: { name: 'Peach Party', sub: 'White peach · Rhodiola',          c: '#ffb38a', c2: '#ff7a1a', t: INK, fruit: 'peach',      mood: 'Lift',     price: 29 },
  yuzu:  { name: 'Yuzu Yes',    sub: 'Yuzu · Ginseng · Mint',           c: '#ffe14a', c2: '#c6f432', t: INK, fruit: 'lemon',      mood: 'Energy',   price: 34 },
};

// ---------- SVG fruit (viewBox 0 0 100 100, thick ink outline) ----------
const citrus = (rind, flesh) => `<circle cx="50" cy="50" r="45" fill="${rind}" stroke="${INK}" stroke-width="4"/><circle cx="50" cy="50" r="37" fill="#fff6e6"/><circle cx="50" cy="50" r="33" fill="${flesh}"/>` +
  [0, 45, 90, 135].map(a => `<line x1="50" y1="17" x2="50" y2="83" stroke="#fff6e6" stroke-width="3.2" stroke-linecap="round" transform="rotate(${a} 50 50)"/>`).join('') +
  `<circle cx="50" cy="50" r="5" fill="#fff6e6"/><ellipse cx="34" cy="30" rx="7" ry="3.5" fill="#fff" opacity=".55" transform="rotate(-35 34 30)"/>`;
const FRUIT = {
  orange: citrus('#ff7a1a', '#ffa83d'),
  grapefruit: citrus('#ff8fc7', '#ff4f86'),
  lime: citrus('#5cbf2a', '#c6f432'),
  lemon: citrus('#ffd23f', '#fff09a'),
  berry: `<g stroke="${INK}" stroke-width="4"><circle cx="36" cy="58" r="22" fill="#2647ff"/><circle cx="64" cy="44" r="20" fill="#4a6bff"/></g><path d="M64 30l3 5 5-2-2 5 4 3-6 1" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="28" cy="50" r="5" fill="#fff" opacity=".6"/><circle cx="58" cy="37" r="4" fill="#fff" opacity=".6"/>`,
  peach: `<path d="M50 88C22 88 12 66 14 52 16 34 32 26 50 34 68 26 84 34 86 52 88 66 78 88 50 88Z" fill="#ffb38a" stroke="${INK}" stroke-width="4"/><path d="M50 36c-4 14-4 34 0 50" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M50 34C52 18 66 10 80 12 76 26 64 32 50 34Z" fill="#5cbf2a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><ellipse cx="30" cy="54" rx="7" ry="11" fill="#ff7a1a" opacity=".45"/>`,
  leaf: `<path d="M12 88C14 44 44 14 88 12 86 58 56 86 12 88Z" fill="#5cbf2a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M16 84C40 60 58 42 80 20" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  sparkle: `<path d="M50 4C54 36 64 46 96 50 64 54 54 64 50 96 46 64 36 54 4 50 36 46 46 36 50 4Z" fill="currentColor" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  flower: `<g stroke="${INK}" stroke-width="4">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="50" cy="26" rx="14" ry="22" fill="#ff3d7f" transform="rotate(${a} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="12" fill="#ffd23f"/></g>`,
  ginger: `<path d="M18 62c0-14 12-18 22-16 2-12 14-20 24-12 10-6 22 2 18 14 10 6 6 22-6 22-6 10-22 10-28 2-12 8-30 4-30-10Z" fill="#f2c27a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M40 56c4 2 8 2 12 0M60 50c4 2 8 2 10 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  mushroom: `<path d="M10 52C10 26 30 12 50 12s40 14 40 40Z" fill="#ff7a1a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M38 52v26c0 6 24 6 24 0V52" fill="#fff6e6" stroke="${INK}" stroke-width="4"/><circle cx="34" cy="32" r="6" fill="#fff6e6"/><circle cx="60" cy="26" r="5" fill="#fff6e6"/><circle cx="70" cy="40" r="4" fill="#fff6e6"/>`,
  mint: `<path d="M50 92V40" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M50 60C30 64 16 52 18 34 36 32 50 42 50 60Z" fill="#5cbf2a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M50 46C70 50 84 38 82 20 64 18 50 28 50 46Z" fill="#7fd33c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
};
const fruit = (k, size = 80, extra = '') => `<svg class="fr" width="${size}" height="${size}" viewBox="0 0 100 100" ${extra}>${FRUIT[k]}</svg>`;

// ---------- CSS can (scale with font-size; 1em = width/10) ----------
function can(k, size = 16, cls = '', style = '') {
  const f = FL[k];
  return `<div class="can ${cls}" style="font-size:${size}px;--c:${f.c};--c2:${f.c2};--t:${f.t};${style}">
    <i class="lid"></i>
    <div class="bd">
      <i class="rim t"></i>
      <svg class="wav" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="M0 20 Q 25 0 50 20 T 100 20 T 150 20 T 200 20 V40 H0Z" fill="var(--c2)"/></svg>
      <b class="wm">juno</b>
      <div class="blob"><svg viewBox="0 0 100 100" class="bl"><path d="M50 4C72 4 96 20 94 48 92 78 70 96 46 94 20 92 4 72 6 46 8 20 28 4 50 4Z" fill="var(--c2)" stroke="${INK}" stroke-width="3"/></svg>${fruit(f.fruit, 100)}</div>
      <span class="nm">${f.name}</span>
      <span class="sm">Sparkling botanical tonic · 330 ml</span>
      <i class="rim b"></i>
    </div>
  </div>`;
}

// top-down can lid for the build grid
const lid = k => `<div class="lidtop" style="--c:${FL[k].c};--c2:${FL[k].c2}"><i></i><b>juno</b></div>`;

const ICONS = {
  bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 5-7 8-7s7 2 8 7"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="m5 12 5 5L20 7"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  gift: '<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8Zm0 0s2-5 4.5-3.5S15 8 12 8Z"/>',
  pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  repeat: '<path d="M4 11V9a4 4 0 0 1 4-4h11M16 2l3 3-3 3M20 13v2a4 4 0 0 1-4 4H5M8 22l-3-3 3-3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  leaf: '<path d="M5 19C5 10 11 5 20 4c0 9-5 15-15 15Z"/><path d="M5 19 13 11"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>', drag: '<path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" stroke-width="3"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
const stars = (n = 5) => `<span class="stars">${Array.from({ length: n }, () => ic('star')).join('')}</span>`;

// wavy marquee: text on an animated wave path
function wave(text, { color = '#fff6e6', size = 74, amp = 26, h = 170, dur = 26 } = {}) {
  const id = 'wv' + Math.random().toString(36).slice(2, 7);
  let d = `M -200 ${h / 2}`; for (let x = -200; x < 3200; x += 240) d += ` q 60 ${-amp * 2} 120 0 t 120 0`;
  const t = Array(8).fill(text).join(' ');
  return `<svg class="wavy" viewBox="0 0 1440 ${h}" width="1440" height="${h}" preserveAspectRatio="xMidYMid slice"><defs><path id="${id}" d="${d}"/></defs>
    <text style="font:400 ${size}px Caprasimo;fill:${color}"><textPath href="#${id}" startOffset="0">${t}<animate attributeName="startOffset" from="0" to="-1680" dur="${dur}s" repeatCount="indefinite"/></textPath></text></svg>`;
}

function juno(active, { cart = 3 } = {}) {
  document.querySelectorAll('[data-can]').forEach(el => {
    const [k, s] = el.dataset.can.split('|');
    el.outerHTML = can(k, +(s || 16), el.className, el.getAttribute('style') || '');
  });
  document.querySelectorAll('[data-fruit]').forEach(el => {
    const [k, s] = el.dataset.fruit.split('|');
    el.outerHTML = `<span class="fly ${el.className}" style="${el.getAttribute('style') || ''}">${fruit(k, +(s || 80))}</span>`;
  });
  document.querySelectorAll('[data-lid]').forEach(el => { el.outerHTML = lid(el.dataset.lid); });
  document.querySelectorAll('[data-wave]').forEach(el => {
    const o = JSON.parse(el.dataset.opts || '{}');
    el.innerHTML = wave(el.dataset.wave, o);
  });
  document.querySelectorAll('[data-sticker]').forEach(el => {
    const txt = el.dataset.sticker, n = 'sk' + Math.random().toString(36).slice(2, 7);
    el.innerHTML = `<svg viewBox="0 0 160 160" class="spin"><defs><path id="${n}" d="M80,80 m-58,0 a58,58 0 1,1 116,0 a58,58 0 1,1 -116,0"/></defs><text><textPath href="#${n}">${txt}</textPath></text></svg><div class="c">${el.dataset.center || '✦'}</div>`;
    el.classList.add('sticker');
  });
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.outerHTML = `<div class="announce"><div class="t">${Array(4).fill('<span>Free delivery on 2+ packs</span><i>✸</i><span>Subscribe &amp; save 15% forever</span><i>✸</i><span>New: Blue Hour with L-theanine</span><i>✸</i><span>Plastic-free, infinitely recyclable cans</span><i>✸</i>').join('')}</div></div>
    <nav class="nav">
      <a class="logo">juno<sup>®</sup></a>
      <div class="links">${['Shop', 'Build a box', 'Our story', 'Sip Club', 'Find us'].map(n => `<a class="${n === active ? 'on' : ''}">${n}</a>`).join('')}</div>
      <div class="r"><span class="pill">${ic('search')}</span><span class="pill">${ic('user')}</span><span class="pill cart">${ic('bag')} Cart <b>${cart}</b></span></div>
    </nav>`;
  });
  document.querySelectorAll('[data-footer]').forEach(el => {
    el.outerHTML = `<footer class="f">
      <svg class="edge" viewBox="0 0 1440 80" preserveAspectRatio="none"><path d="M0 80V40 Q 60 0 120 40 T 240 40 T 360 40 T 480 40 T 600 40 T 720 40 T 840 40 T 960 40 T 1080 40 T 1200 40 T 1320 40 T 1440 40 V80Z" fill="#ff7a1a"/></svg>
      <div class="cans">${can('pink', 13, 'r1')}${can('lime', 13, 'r2')}${can('sun', 13, 'r3')}${can('blue', 13, 'r4')}${can('yuzu', 13, 'r5')}</div>
      <div class="cols">
        <div class="news"><h4>Get the <em>fizz-letter.</em></h4><p>New flavours, drops and the odd terrible pun. Twice a month, never boring.</p><div class="field">your@email.com<b>Sign me up ${ic('arrow')}</b></div><small>10% off your first box. Unsubscribe in one click.</small></div>
        <div><h5>Shop</h5><ul><li>All flavours</li><li>Build a box</li><li>Mixed party pack</li><li>Subscriptions</li><li>Gift cards</li></ul></div>
        <div><h5>Juno</h5><ul><li>Our story</li><li>Botanicals</li><li>Sustainability</li><li>Sip Club events</li><li>Wholesale</li></ul></div>
        <div><h5>Help</h5><ul><li>FAQs</li><li>Delivery</li><li>Manage subscription</li><li>Contact us</li><li>Stockists</li></ul></div>
      </div>
      <div class="big">juno<span>fizz that does stuff</span></div>
      <div class="bot"><span>© 2026 Juno Tonics GmbH · Berlin · A concept brand</span><span>Privacy · Terms · Cookies · Accessibility</span><span>Instagram · TikTok · Pinterest</span></div>
    </footer>`;
  });
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic); });
  document.querySelectorAll('[data-stars]').forEach(el => { el.outerHTML = stars(+el.dataset.stars || 5); });
  document.querySelectorAll('[data-img]').forEach(el => {
    const [id, w] = el.dataset.img.split('|');
    el.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1200)}" alt="">`);
  });
  // rising bubbles
  document.querySelectorAll('[data-bubbles]').forEach(el => {
    const n = +el.dataset.bubbles || 24; let h = '';
    for (let i = 0; i < n; i++) {
      const s = 8 + ((i * 37) % 34), x = (i * 61) % 100, d = 6 + (i % 7), dl = -((i * 1.7) % d), y = (i * 47) % 100;
      h += `<i style="width:${s}px;height:${s}px;left:${x}%;top:${y}%;animation-duration:${d}s;animation-delay:${dl}s"></i>`;
    }
    el.innerHTML = h; el.classList.add('bubbles');
  });
}
