// Shared chrome for the OROMO screens: icons, nav, stamps, CSS coffee bags, beans, footer, photo slots.
const U = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  nose: '<path d="M12 3c0 6-4 9-4 12a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3"/><path d="M9 18c-1.5 0-3-1-3-2.5M15 18c1.5 0 3-1 3-2.5"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 14 10"/>',
  mountain: '<path d="m3 19 6-10 4 6 3-4 5 8H3Z"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  reset: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  pin: '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" fill="currentColor"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  thermo: '<path d="M14 14V5a2 2 0 0 0-4 0v9a4 4 0 1 0 4 0Z"/>',
  scale: '<rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 14V9h10v5"/>',
  gift: '<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8Zm0 0s2-5 4.5-3.5S15 8 12 8Z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
const UL = '<svg viewBox="0 0 200 14" preserveAspectRatio="none"><path d="M3 9 C 40 2, 80 13, 120 6 S 180 4, 197 8"/></svg>';

// bag: name|origin|label colour|bag colour|notes|roast 1-5|weight|label text colour|blob2|blob3
function bagHTML(spec, w) {
  const [nm, or, lc = '#c65d3b', bc = '#c9a877', nt = '', r = 3, wt = '250 G', lt = '#2b1a12', b2 = '#e0a93b', b3 = '#8fa58a'] = spec.split('|');
  const dots = [1, 2, 3, 4, 5].map(i => `<i class="${i <= +r ? 'f' : ''}"></i>`).join('');
  return `<div class="bd"></div><div class="tie"></div><div class="valve"></div>
    <div class="lb" style="--lc:${lc};--lt:${lt};--lb2:${b2};--lb3:${b3}"><span class="blob"></span><span class="blob b2"></span>
      <div class="br"><span>Oromo</span><span>No.${(nm.length * 7 + 11) % 90 + 10}</span></div>
      <div class="nm">${nm}</div><div class="or">${or}</div><div class="nt">${nt}</div>
      <div class="ft"><span>${wt}</span><span class="rl">${dots}</span></div></div>`;
}

function stampHTML(txt, core, cls = '') {
  const id = 'sp' + Math.random().toString(36).slice(2, 7);
  return `<svg class="ring" viewBox="0 0 170 170"><defs><path id="${id}" d="M85,85 m-66,0 a66,66 0 1,1 132,0 a66,66 0 1,1 -132,0"/></defs><circle cx="85" cy="85" r="82" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 5" opacity=".6"/><text fill="currentColor"><textPath href="#${id}" textLength="410">${txt}</textPath></text></svg><div class="core">${core}</div>`;
}

function oromo(active, { cart = 2 } = {}) {
  document.querySelectorAll('[data-nav]').forEach(el => {
    const msg = ['Roasted every Monday in <b>Lisbon</b>', 'Free shipping over <b>€40</b> across the EU', 'New harvest: <b>Gesha Village, Bench Maji</b>', 'Subscribers save <b>15%</b> · pause anytime', 'Direct trade · <b>37 farms</b> · 3 countries'];
    el.outerHTML = `<div class="ann"><div class="run">${[...msg, ...msg, ...msg, ...msg].map(m => `<span>✺ ${m}</span>`).join('')}</div></div>
    <nav class="nav">
      <div class="links">${['Shop coffee', 'Subscribe', 'Origins', 'Brew guides', 'Café'].map(n => `<a class="${n === active ? 'on' : ''}">${n}</a>`).join('')}</div>
      <a class="logo"><span class="mk"></span><span>Oromo<em>.</em></span></a>
      <div class="r"><span class="p">${ic('search')}</span><span class="p">${ic('user')} Account</span><span class="p solid">${ic('bag')} Cart <b>${cart}</b></span></div>
    </nav>`;
  });
  document.querySelectorAll('[data-stamp]').forEach(el => {
    el.classList.add('stamp');
    el.innerHTML = stampHTML(el.dataset.stamp, el.innerHTML);
  });
  document.querySelectorAll('[data-bag]').forEach(el => {
    const w = +el.dataset.w || 260;
    el.classList.add('bag');
    el.style.width = w + 'px'; el.style.height = Math.round(w * 1.42) + 'px'; el.style.fontSize = (w / 26) + 'px';
    if (el.dataset.bc) el.style.setProperty('--bc', el.dataset.bc);
    el.innerHTML = bagHTML(el.dataset.bag, w);
  });
  document.querySelectorAll('[data-ul]').forEach(el => { el.classList.add('ul'); el.insertAdjacentHTML('beforeend', UL); });
  document.querySelectorAll('[data-beans]').forEach(el => {
    const pts = el.dataset.beans.split(';').map(s => s.split(',').map(Number));
    el.innerHTML += pts.map(([x, y, r, s = 1], i) => `<i class="bean fl" style="left:${x}px;top:${y}px;transform:rotate(${r}deg) scale(${s});animation-delay:${-i * .7}s;${s < .8 ? 'filter:blur(1.5px);' : ''}"></i>`).join('');
  });
  document.querySelectorAll('[data-footer]').forEach(el => {
    el.outerHTML = `<footer class="foot tear-t">
      <div class="top">
        <div class="news"><div class="eyebrow" style="color:var(--mustard);margin-bottom:20px">The Monday Letter</div><p>Roast notes, new arrivals &amp; letters from the farms. Once a week, never more.</p><div class="field">your@email.com<b>${ic('arrow')}</b></div></div>
        <div><h5>Coffee</h5><ul><li>Shop all</li><li>Subscriptions</li><li>Gift cards</li><li>Espresso</li><li>Decaf</li><li>Wholesale</li></ul></div>
        <div><h5>Oromo</h5><ul><li>Our farms</li><li>Impact report 2026</li><li>The roastery</li><li>Café · Rua da Boavista 84</li><li>Journal</li></ul></div>
        <div><h5>Help</h5><ul><li>Brew guides</li><li>Shipping &amp; returns</li><li>Manage subscription</li><li>Contact</li><li>Instagram · TikTok</li></ul></div>
      </div>
      <div class="big"><span>oromo</span><div class="stamp" style="width:230px;height:230px;color:var(--mustard)">${stampHTML('Roasted weekly in Lisbon ✺ Direct trade ✺ ', 'since<br>2019')}</div></div>
      <div class="bot"><span>© 2026 Oromo Coffee Roasters, Lisbon · A concept brand</span><span>Privacy · Terms · Accessibility · Cookies</span><span>Lisbon · Sidama · Huila · Nyeri</span></div>
    </footer>`;
  });
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic); });
  document.querySelectorAll('[data-img]').forEach(el => {
    const [id, w] = el.dataset.img.split('|');
    el.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1400)}" alt="">`);
  });
}

// radar chart (axes labels, values 0-10, optional compare values)
function radar(el, labels, vals, cmp, { size = 460, col = '#c65d3b' } = {}) {
  const c = size / 2, R = size / 2 - 70, n = labels.length;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [c + Math.cos(a) * R * v / 10, c + Math.sin(a) * R * v / 10]; };
  let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="overflow:visible">`;
  for (let k = 2; k <= 10; k += 2) s += `<polygon points="${labels.map((_, i) => pt(i, k).join(',')).join(' ')}" fill="${k === 10 ? 'rgba(43,26,18,.03)' : 'none'}" stroke="rgba(43,26,18,${k === 10 ? .35 : .14})" stroke-width="${k === 10 ? 1.5 : 1}" stroke-dasharray="${k === 10 ? '' : '3 4'}"/>`;
  labels.forEach((_, i) => { const [x, y] = pt(i, 10); s += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="rgba(43,26,18,.14)"/>`; });
  if (cmp) s += `<polygon points="${cmp.map((v, i) => pt(i, v).join(',')).join(' ')}" fill="rgba(143,165,138,.35)" stroke="#6f8a6a" stroke-width="2" stroke-dasharray="6 5"/>`;
  s += `<polygon class="rd" points="${vals.map((v, i) => pt(i, v).join(',')).join(' ')}" fill="${col}" fill-opacity=".42" stroke="${col}" stroke-width="3" stroke-linejoin="round"/>`;
  vals.forEach((v, i) => { const [x, y] = pt(i, v); s += `<circle cx="${x}" cy="${y}" r="6" fill="#f6eedf" stroke="#2b1a12" stroke-width="2"/>`; });
  labels.forEach((l, i) => { const [x, y] = pt(i, 12.6); s += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" style="font:italic 400 19px Fraunces;fill:#2b1a12">${l}</text><text x="${x}" y="${y + 20}" text-anchor="middle" style="font:700 10px 'DM Sans';letter-spacing:2px;fill:#9a8370">${vals[i].toFixed(1)}</text>`; });
  el.innerHTML = s + '</svg>';
}
