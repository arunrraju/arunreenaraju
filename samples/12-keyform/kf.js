// KEYFORM shared chrome: icons, ticker, nav, footer, seals, photos, CSS mini boards, waveforms.
const U = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  cart: '<path d="M3 4h2l2.4 11h10.8L21 7H6.2"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  gift: '<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8Zm0 0s2-5 4.5-3.5S15 8 12 8Z"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`;

/* layout (same as the WebGL board) for CSS mini boards */
const KF_ROWS = [
  [['esc',1,'x'],...Array.from({length:12},(_,i)=>['F'+(i+1),1,i>=4&&i<8?'m':'a']),['prt',1,'m'],['del',1,'m'],['knob',1,'knob']],
  [...'~1234567890-='.split('').map(c=>[c,1,'a']),['bksp',2,'m'],['home',1,'m']],
  [['tab',1.5,'m'],...'QWERTYUIOP[]'.split('').map(c=>[c,1,'a']),['\\',1.5,'a'],['pgup',1,'m']],
  [['caps',1.75,'m'],...'ASDFGHJKL;\''.split('').map(c=>[c,1,'a']),['enter',2.25,'x'],['pgdn',1,'m']],
  [['shift',2.25,'m'],...'ZXCVBNM,./'.split('').map(c=>[c,1,'a']),['shift',1.75,'m'],['↑',1,'y'],['end',1,'m']],
  [['ctrl',1.25,'m'],['opt',1.25,'m'],['cmd',1.25,'m'],['',6.25,'a'],['cmd',1,'m'],['fn',1,'m'],['ctrl',1,'m'],['←',1,'y'],['↓',1,'y'],['→',1,'y']]
];
const KF_CW = {
  paper:{a:'#f6f4ee',m:'#d0cdc4',x:'#ff5a1f',y:'#cbc3ff'},
  signal:{a:'#3a3a37',m:'#5e5d58',x:'#ff5a1f',y:'#efede8'},
  lilac:{a:'#efecff',m:'#cbc3ff',x:'#ff5a1f',y:'#8d82ea'},
  retro:{a:'#ebe2cd',m:'#a19c90',x:'#e0532c',y:'#5e8f86'},
  graphite:{a:'#4b4b49',m:'#2f2f2e',x:'#cbc3ff',y:'#ff5a1f'}
};
const KF_CASE = {
  silver:'linear-gradient(160deg,#f1f0ec,#cfcdc8 55%,#b3b1ab)', graphite:'linear-gradient(160deg,#5a5a5c,#38383a 60%,#262628)',
  orange:'linear-gradient(160deg,#ff8a5c,#ff5a1f 55%,#d9440f)', lilac:'linear-gradient(160deg,#e1dcff,#bdb4f7 60%,#9d93e6)', paper:'linear-gradient(160deg,#f7f5f0,#e7e4dd 60%,#d6d2ca)'
};
function miniBoard(el) {
  const W = +el.dataset.w || 420, cw = KF_CW[el.dataset.cw || 'paper'], cs = el.dataset.case || 'silver';
  const pad = W * 0.03, u = (W - pad * 2) / 16, gap = u * 0.06, H = pad * 2 + u * 6.2;
  el.classList.add('mb'); el.style.width = W + 'px'; el.style.height = H + 'px'; el.style.background = KF_CASE[cs]; el.style.borderRadius = (u * 0.42) + 'px';
  let h = '';
  KF_ROWS.forEach((row, r) => {
    let x = 0; const y = r === 0 ? 0 : 0.2 + r;
    row.forEach(([l, w, role]) => {
      const L = pad + x * u + gap, T = pad + y * u + gap, Wd = w * u - gap * 2, Hd = u - gap * 2;
      if (role === 'knob') h += `<i class="kn" style="left:${L + Wd * .08}px;top:${T + Hd * .08}px;width:${Wd * .84}px;height:${Hd * .84}px"></i>`;
      else h += `<i class="k" style="left:${L}px;top:${T}px;width:${Wd}px;height:${Hd}px;background:${cw[role]}"></i>`;
      x += w;
    });
  });
  el.innerHTML = h + el.innerHTML;
}

/* deterministic waveform bars */
function waveBars(el) {
  const n = +el.dataset.n || 80, seed = +el.dataset.seed || 1, kind = el.dataset.kind || 'thock';
  let s = seed * 9301 + 49297; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  let h = '';
  for (let i = 0; i < n; i++) {
    const ph = (i % 10) / 10; // a keystroke every 10 bars
    const env = kind === 'clack' ? Math.exp(-ph * 9) : kind === 'cream' ? Math.exp(-ph * 4.5) * 0.85 : Math.exp(-ph * 6);
    const v = Math.max(0.04, env * (0.55 + rnd() * 0.45));
    h += `<i style="height:${(v * 100).toFixed(1)}%"></i>`;
  }
  el.classList.add('wave'); el.innerHTML = h;
}

function keyform(active, { cart = 2 } = {}) {
  document.querySelectorAll('[data-tick]').forEach(el => {
    const items = ['Batch 07 ships 12 Nov', 'Free EU shipping over €150', '2-year warranty on every case', 'Hot-swap · no solder ever', 'Sound lab: 14 switches recorded', 'Made in Eindhoven, NL'];
    const run = [...items, ...items].map(t => `<span>${t}</span><i>●</i>`).join('');
    el.outerHTML = `<div class="tick"><div class="tr">${run}${run}</div></div>`;
  });
  document.querySelectorAll('[data-nav]').forEach(el => {
    const L = [['Boards', 'shop.html', '06'], ['Model 75', 'product.html', ''], ['Builder', 'builder.html', ''], ['Sound Lab', 'lab.html', 'new'], ['Journal', '#', '']];
    el.outerHTML = `<nav class="nav">
      <a class="logo" href="home.html">KEYFORM<b></b></a>
      <div class="links">${L.map(([n, h, s]) => `<a href="${h}" class="${n === active ? 'on' : ''}">${n}${s ? `<sup>${s}</sup>` : ''}</a>`).join('')}</div>
      <div class="r"><span class="pill">${ic('search')}</span><span class="pill">EN · €</span><span class="pill">Account</span><a href="cart.html" class="pill solid">${ic('cart')} Cart <b>${cart}</b></a></div>
    </nav>`;
  });
  document.querySelectorAll('[data-seal]').forEach(el => {
    const txt = el.dataset.seal, id = 'sp' + Math.random().toString(36).slice(2, 7);
    el.outerHTML = `<div class="seal ${el.className}" style="${el.getAttribute('style') || ''}"><svg viewBox="0 0 150 150"><defs><path id="${id}" d="M75,75 m-62,0 a62,62 0 1,1 124,0 a62,62 0 1,1 -124,0"/></defs><text><textPath href="#${id}">${txt}</textPath></text></svg><div class="c">${el.dataset.c || '07'}</div></div>`;
  });
  document.querySelectorAll('[data-foot]').forEach(el => {
    el.outerHTML = `<footer class="foot">
      <div class="top">
        <div class="news"><div class="lbl" style="color:var(--or);margin-bottom:20px">[ Batch alerts ]</div><p>Batches sell out in hours. Get a 24-hour head start on the next one.</p><div class="field">you@domain.eu<b>Notify me ${ic('arrow')}</b></div></div>
        <div><h5>Shop</h5><ul><li>Boards</li><li>Switches</li><li>Keycaps</li><li>Builder</li><li>Gift cards</li></ul></div>
        <div><h5>Support</h5><ul><li>Firmware &amp; VIA</li><li>Build guides</li><li>Shipping &amp; returns</li><li>Warranty</li><li>Contact the bench</li></ul></div>
        <div><h5>Studio</h5><ul><li>Sound Lab</li><li>Journal</li><li>Eindhoven workshop</li><li>Discord</li><li>Press kit</li></ul></div>
      </div>
      <div class="big">KEYFORM<i></i></div>
      <div class="bot"><span>© 2026 Keyform B.V. · A concept studio</span><span>Privacy · Terms · Cookies · Accessibility</span><span>EU · UK · CH · NO — ships in 48 h</span></div>
    </footer>`;
  });
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic); });
  document.querySelectorAll('[data-img]').forEach(el => {
    const [id, w] = el.dataset.img.split('|');
    el.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1200)}" alt="">`);
  });
  document.querySelectorAll('[data-mb]').forEach(miniBoard);
  document.querySelectorAll('[data-wave]').forEach(waveBars);
}
