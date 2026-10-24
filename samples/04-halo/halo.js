// HALO shared chrome: icons, nav, footer, CSS/SVG ring renderer, health widgets, counters, orbit, cursor, progress.
const U = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
const ICONS = {
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>',
  thermo: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0Z"/><path d="M12 9v7"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  wave: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ne: '<path d="M7 17 17 7M8 7h9v9"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="3"/><path d="M21 10v4M6 10v4M9 10v4M12 10v4"/>',
  leaf: '<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15Z"/><path d="M5 19 13 11"/>',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" fill="currentColor" stroke="none"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/>',
  gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8Zm0 0s2-5 4.5-3.5S15 8 12 8Z"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  water: '<path d="M3 15c2 0 2-2 4.5-2S10 15 12 15s2-2 4.5-2S19 15 21 15M3 19c2 0 2-2 4.5-2S10 19 12 19s2-2 4.5-2S19 19 21 19"/><path d="M12 3s4 4 4 7a4 4 0 0 1-8 0c0-3 4-7 4-7Z"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="3"/><path d="M11 18h2"/>',
  cycle: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/>',
  home: '<path d="M4 11 12 4l8 7v9H4v-9Z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  flask: '<path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 9V3"/><path d="M7 15h10"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n] || ''}</svg>`;

/* ---------- the ring: a metal cylinder band drawn in SVG, with a sliding specular "spin" ---------- */
const FINISH = {
  ti: { name: 'Brushed Titanium', m: ['#6b717e', '#aab0bc', '#e4e7ee', '#ffffff'], i: ['#2e3139', '#5a5f6b', '#8e94a1'], price: 349 },
  gr: { name: 'Graphite', m: ['#121318', '#34363e', '#6e727d', '#c4c7d0'], i: ['#08090b', '#1e2026', '#3c3f48'], price: 399 },
  ro: { name: 'Rose Titanium', m: ['#7d4f47', '#c99383', '#f2cfc2', '#fff4ef'], i: ['#3b2622', '#6d4a42', '#a2766a'], price: 449 },
  bat: { name: 'Battery', m: ['#8a76d9', '#b9a8ff', '#ddd3ff', '#f4f0ff'], i: ['#4a3d8a', '#6f5fc0', '#9c8de6'] },
  pcb: { name: 'PCB', m: ['#2f8f73', '#5fc9a5', '#a8ecd5', '#e6fff6'], i: ['#1a4d3e', '#2e7a62', '#4ea88a'] },
  epx: { name: 'Epoxy', m: ['#ff9f84', '#ffc9b0', '#ffe5d9', '#ffffff'], i: ['#b8705e', '#e09a85', '#f5c2b2'] },
  au: { name: 'Aurum', m: ['#7a5a22', '#c79e52', '#f0d79c', '#fffaf0'], i: ['#3a2c12', '#6c5426', '#a3834a'], price: 549 }
};
let RID = 0;
function ringSVG({ finish = 'ti', k = .42, h = 96, t = 13, dur = 9, sensors = true } = {}) {
  const f = FINISH[finish] || FINISH.ti, id = 'r' + (++RID);
  const R = 180, cx = 200, r = R * k, Ri = R - t, ri = Ri * k, cy = r + 16, H = Math.round(cy + h + r + 16);
  const [c0, c1, c2, c3] = f.m, [i0, i1, i2] = f.i;
  const stops = [[0, c1], [.1, c2], [.16, c3], [.22, c2], [.38, c1], [.52, c0], [.66, c1], [.78, c2], [.84, c3], [.9, c2], [1, c1]]
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  const rimStops = [[0, c2], [.12, c3], [.3, c2], [.5, c1], [.7, c2], [.85, c3], [1, c2]].map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  const spin = (from) => `<animateTransform attributeName="gradientTransform" type="translate" from="${from} 0" to="${from + 2 * R} 0" dur="${dur}s" repeatCount="indefinite"/>`;
  const front = `M${cx - R},${cy} L${cx - R},${cy + h} A${R} ${r} 0 0 0 ${cx + R},${cy + h} L${cx + R},${cy} A${R} ${r} 0 0 1 ${cx - R},${cy} Z`;
  const rim = `M${cx - R},${cy} A${R} ${r} 0 1 0 ${cx + R},${cy} A${R} ${r} 0 1 0 ${cx - R},${cy} Z M${cx - Ri},${cy} A${Ri} ${ri} 0 1 0 ${cx + Ri},${cy} A${Ri} ${ri} 0 1 0 ${cx - Ri},${cy} Z`;
  const sy = cy - ri + h * .5;
  const sens = sensors ? `<g>
      <rect x="${cx - 46}" y="${sy - 13}" width="92" height="26" rx="13" fill="#0d0c12" opacity=".78"/>
      <rect x="${cx - 46}" y="${sy - 13}" width="92" height="9" rx="4.5" fill="#fff" opacity=".08"/>
      <circle cx="${cx - 24}" cy="${sy}" r="5" fill="#69f5bf"><animate attributeName="opacity" values="1;.35;1" dur="1.1s" repeatCount="indefinite"/></circle>
      <circle cx="${cx - 24}" cy="${sy}" r="12" fill="url(#${id}gl)"/>
      <circle cx="${cx - 6}" cy="${sy}" r="4" fill="#ff7b8a" opacity=".9"/>
      <circle cx="${cx + 12}" cy="${sy}" r="5" fill="#69f5bf"><animate attributeName="opacity" values=".4;1;.4" dur="1.1s" repeatCount="indefinite"/></circle>
      <circle cx="${cx + 12}" cy="${sy}" r="12" fill="url(#${id}gl)"/>
      <rect x="${cx + 24}" y="${sy - 4}" width="12" height="8" rx="3" fill="#2b2a33"/>
      <ellipse cx="${cx - 104}" cy="${sy - 6}" rx="9" ry="6" fill="${i0}" opacity=".9"/><ellipse cx="${cx - 104}" cy="${sy - 8}" rx="5" ry="2.5" fill="#fff" opacity=".18"/>
      <ellipse cx="${cx + 104}" cy="${sy - 6}" rx="9" ry="6" fill="${i0}" opacity=".9"/><ellipse cx="${cx + 104}" cy="${sy - 8}" rx="5" ry="2.5" fill="#fff" opacity=".18"/>
    </g>` : '';
  return `<svg class="ring" viewBox="0 0 400 ${H}" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="${id}m" gradientUnits="userSpaceOnUse" x1="${cx - R}" y1="0" x2="${cx + R}" y2="0" spreadMethod="repeat">${stops}${spin(0)}</linearGradient>
    <linearGradient id="${id}rm" gradientUnits="userSpaceOnUse" x1="${cx - R}" y1="0" x2="${cx + R}" y2="0" spreadMethod="repeat">${rimStops}${spin(-60)}</linearGradient>
    <linearGradient id="${id}sh" x1="0" x2="1"><stop offset="0" stop-color="#140f28" stop-opacity=".55"/><stop offset=".14" stop-color="#140f28" stop-opacity=".08"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#140f28" stop-opacity="0"/><stop offset=".92" stop-color="#140f28" stop-opacity=".2"/><stop offset="1" stop-color="#140f28" stop-opacity=".55"/></linearGradient>
    <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".22" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#2a1d5c" stop-opacity=".28"/></linearGradient>
    <linearGradient id="${id}in" x1="0" x2="1"><stop offset="0" stop-color="${i0}"/><stop offset=".3" stop-color="${i1}"/><stop offset=".5" stop-color="${i2}"/><stop offset=".7" stop-color="${i1}"/><stop offset="1" stop-color="${i0}"/></linearGradient>
    <linearGradient id="${id}iv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>
    <linearGradient id="${id}hl" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".95"/><stop offset=".6" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="${id}gl"><stop offset="0" stop-color="#69f5bf" stop-opacity=".75"/><stop offset="1" stop-color="#69f5bf" stop-opacity="0"/></radialGradient>
    <mask id="${id}k" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="${H}"><ellipse cx="${cx}" cy="${cy}" rx="${Ri}" ry="${ri}" fill="#fff"/><ellipse cx="${cx}" cy="${cy + h}" rx="${Ri}" ry="${ri}" fill="#000"/></mask>
  </defs>
  <g mask="url(#${id}k)"><rect x="0" y="0" width="400" height="${H}" fill="url(#${id}in)"/><rect x="0" y="0" width="400" height="${cy + h}" fill="url(#${id}iv)"/>${sens}</g>
  <path d="${front}" fill="url(#${id}m)"/><path d="${front}" fill="url(#${id}sh)"/><path d="${front}" fill="url(#${id}v)"/>
  <path d="M${cx - R + 3},${cy + 5} A${R - 3} ${r} 0 0 0 ${cx + R - 3},${cy + 5}" fill="none" stroke="url(#${id}hl)" stroke-width="2.4"/>
  <path d="M${cx - R + 6},${cy + h - 3} A${R - 6} ${r} 0 0 0 ${cx + R - 6},${cy + h - 3}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>
  <path d="${rim}" fill="url(#${id}rm)" fill-rule="evenodd"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${Ri}" ry="${ri}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${r}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>
</svg>`;
}

/* ---------- health widgets ---------- */
let WID = 0;
const COL = { lilac: ['#c9b8ff', '#8f78ff'], peach: ['#ffd2bf', '#f5896a'], mint: ['#b8f0dc', '#3fbf98'], sky: ['#b9d8ff', '#5b93f0'], au: ['#a58cff', '#ff9a7e'] };
function wRing(el) {
  const v = +el.dataset.v, max = +(el.dataset.max || 100), s = +(el.dataset.s || 200), sw = +(el.dataset.sw || 14), c = COL[el.dataset.c || 'au'], id = 'w' + (++WID);
  const rad = (s - sw) / 2 - 2, len = 2 * Math.PI * rad, to = len * (1 - v / max);
  el.classList.add('w-ring'); el.style.width = el.style.height = s + 'px'; el.style.setProperty('--fs', (el.dataset.fs || Math.round(s * .3)) + 'px');
  el.innerHTML = `<svg viewBox="0 0 ${s} ${s}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs>
    <circle cx="${s / 2}" cy="${s / 2}" r="${rad}" fill="none" stroke="rgba(36,35,44,.07)" stroke-width="${sw}"/>
    <circle class="draw" style="--len:${len};--to:${to}" cx="${s / 2}" cy="${s / 2}" r="${rad}" fill="none" stroke="url(#${id})" stroke-width="${sw}" stroke-linecap="round"/></svg>
    <div class="v"><b data-count="${v}">${v}</b><small>${el.dataset.label || ''}</small></div>`;
}
function wGauge(el) {
  const v = +el.dataset.v, s = +(el.dataset.s || 260), id = 'w' + (++WID), sw = +(el.dataset.sw || 16);
  const rad = s / 2 - sw, cx = s / 2, cy = s / 2 + 8, len = Math.PI * rad, to = len * (1 - v / 100);
  const ang = Math.PI * (1 - v / 100), dx = cx + rad * Math.cos(ang), dy = cy - rad * Math.sin(ang);
  let ticks = ''; for (let i = 0; i <= 20; i++) { const a = Math.PI * (1 - i / 20), r1 = rad - sw - 4, r2 = rad - sw - (i % 5 ? 9 : 15); ticks += `<line x1="${cx + r1 * Math.cos(a)}" y1="${cy - r1 * Math.sin(a)}" x2="${cx + r2 * Math.cos(a)}" y2="${cy - r2 * Math.sin(a)}" stroke="rgba(36,35,44,${i % 5 ? .14 : .3})" stroke-width="1.4" stroke-linecap="round"/>`; }
  el.style.width = s + 'px'; el.style.position = 'relative';
  el.innerHTML = `<svg viewBox="0 0 ${s} ${s / 2 + 22}" style="width:100%;display:block;overflow:visible"><defs><linearGradient id="${id}"><stop offset="0" stop-color="#ffc9b0"/><stop offset=".5" stop-color="#c9b8ff"/><stop offset="1" stop-color="#3fbf98"/></linearGradient></defs>
    <path d="M${cx - rad},${cy} A${rad} ${rad} 0 0 1 ${cx + rad},${cy}" fill="none" stroke="rgba(36,35,44,.07)" stroke-width="${sw}" stroke-linecap="round"/>
    <path class="draw" style="--len:${len};--to:${to}" d="M${cx - rad},${cy} A${rad} ${rad} 0 0 1 ${cx + rad},${cy}" fill="none" stroke="url(#${id})" stroke-width="${sw}" stroke-linecap="round"/>
    ${ticks}<circle cx="${dx}" cy="${dy}" r="${sw * .62}" fill="#fff" stroke="#3fbf98" stroke-width="3"/></svg>
    <div style="position:absolute;left:0;right:0;bottom:4px;text-align:center"><b class="num" style="font-size:${Math.round(s * .25)}px;line-height:1;display:block;font-weight:200" data-count="${v}">${v}</b><small style="font:600 10px/1 var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--dim)">${el.dataset.label || 'Readiness'}</small></div>`;
}
function wLine(el) {
  const pts = el.dataset.pts.split(',').map(Number), w = +(el.dataset.width || 520), h = +(el.dataset.h || 180), c = COL[el.dataset.c || 'lilac'], id = 'w' + (++WID);
  const pad = (Math.max(...pts) - Math.min(...pts)) * .25 || 1, mn = Math.min(...pts) - pad, mx = Math.max(...pts) + pad, px = i => 10 + i * (w - 20) / (pts.length - 1), py = v => h - 24 - (v - mn) / (mx - mn) * (h - 48);
  let d = `M${px(0)},${py(pts[0])}`;
  for (let i = 1; i < pts.length; i++) { const x0 = px(i - 1), x1 = px(i), m = (x0 + x1) / 2; d += ` C${m},${py(pts[i - 1])} ${m},${py(pts[i])} ${x1},${py(pts[i])}`; }
  const area = d + ` L${px(pts.length - 1)},${h} L${px(0)},${h} Z`;
  const grid = [0, 1, 2, 3].map(i => `<line x1="0" x2="${w}" y1="${16 + i * (h - 40) / 3}" y2="${16 + i * (h - 40) / 3}" stroke="rgba(36,35,44,.06)" stroke-dasharray="3 5"/>`).join('');
  const dots = el.dataset.dots === '0' ? '' : pts.map((v, i) => `<circle cx="${px(i)}" cy="${py(v)}" r="${i === pts.length - 1 ? 6 : 3}" fill="${i === pts.length - 1 ? c[1] : '#fff'}" stroke="${c[1]}" stroke-width="2"/>`).join('');
  const last = pts.length - 1;
  if (!el.style.width) el.style.width = w + 'px';
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;display:block;overflow:visible"><defs><linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}" stop-opacity=".75"/><stop offset="1" stop-color="${c[0]}" stop-opacity="0"/></linearGradient><linearGradient id="${id}l"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs>
    ${grid}<path d="${area}" fill="url(#${id}a)"/><path class="draw" style="--len:2000" d="${d}" fill="none" stroke="url(#${id}l)" stroke-width="3" stroke-linecap="round"/>${dots}
    <circle cx="${px(last)}" cy="${py(pts[last])}" r="14" fill="${c[1]}" opacity=".18"><animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite"/></circle></svg>`;
}
function wPulse(el) {
  const w = +(el.dataset.width || 300), h = +(el.dataset.h || 70), c = el.dataset.c || '#f5896a', id = 'w' + (++WID);
  let d = `M0,${h / 2}`; const beat = 100;
  for (let x = 0; x < w; x += beat) d += ` L${x + 30},${h / 2} l6,-6 l6,6 l6,0 l5,${h * .32} l7,-${h * .78} l7,${h * .62} l6,-${h * .16} l10,0 l7,-8 l8,8 L${x + beat},${h / 2}`;
  if (!el.style.width) el.style.width = w + 'px';
  el.innerHTML = `<svg class="pulse-line" viewBox="0 0 ${w} ${h}" style="width:100%;display:block;overflow:visible"><defs><linearGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".2"/></linearGradient></defs>
    <path d="${d}" fill="none" stroke="rgba(36,35,44,.08)" stroke-width="2"/><path class="l" pathLength="400" d="${d}" fill="none" stroke="url(#${id})" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px ${c})"/></svg>`;
}
function wHypno(el) {
  // sleep stages: 0 awake,1 REM,2 light,3 deep
  const seq = (el.dataset.seq || '0,0,2,2,3,3,3,2,2,1,1,2,3,3,2,2,2,1,1,1,2,2,3,2,2,1,1,0,2,2,1,1,1,2,2,1,1,1,0,0').split(',').map(Number);
  const w = +(el.dataset.width || 520), h = +(el.dataset.h || 150), bw = w / seq.length, cols = ['#ffc9b0', '#c9b8ff', '#b9d8ff', '#7d66f2'];
  const lh = (h - 20) / 4;
  if (!el.style.width) el.style.width = w + 'px';
  const cyy = st => st * lh + lh / 2; let sp = `M0,${cyy(seq[0])}`; seq.forEach((st, i) => { sp += ` V${cyy(st)} H${(i + 1) * bw}`; });
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;display:block"><path d="${sp}" fill="none" stroke="rgba(125,102,242,.35)" stroke-width="1.5"/>${[0, 1, 2, 3].map(i => `<line x1="0" x2="${w}" y1="${i * lh + lh / 2}" y2="${i * lh + lh / 2}" stroke="rgba(36,35,44,.05)"/>`).join('')}
  ${seq.map((s, i) => `<rect x="${i * bw}" y="${s * lh + 6}" width="${bw + .6}" height="${lh - 12}" rx="5" fill="${cols[s]}"><animate attributeName="opacity" values="0;1" dur=".4s" begin="${(i * .03).toFixed(2)}s" fill="freeze"/></rect>`).join('')}</svg>`;
}
const WIDGETS = { ring: wRing, gauge: wGauge, line: wLine, pulse: wPulse, hypno: wHypno };

/* ---------- chrome ---------- */
const PAGES = [['Ring', 'product.html'], ['App', 'app.html'], ['Science', 'science.html'], ['Sizing', 'sizing.html'], ['Membership', 'checkout.html']];
function halo(active, { bag = 0, progress = 18 } = {}) {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.outerHTML = `<nav class="nav"><a class="brand" href="home.html">HAL<span class="o"></span></a>
      <div class="links">${PAGES.map(([n, h]) => `<a href="${h}" class="${n === active ? 'on' : ''}">${n}</a>`).join('')}</div>
      <div class="r"><span class="pill">${ic('search')}</span><span class="pill">${ic('user')} Sign in</span><span class="pill dark">${ic('bag')} Bag${bag ? ` <b>${bag}</b>` : ''}</span></div></nav>`;
  });
  document.querySelectorAll('[data-ring]').forEach(el => {
    const o = el.dataset.ring.split('|'); el.insertAdjacentHTML('beforeend', ringSVG({ finish: o[0] || 'ti', k: +(o[1] || .42), h: +(o[2] || 96), sensors: o[3] !== '0', dur: +(o[4] || 9) }));
  });
  document.querySelectorAll('[data-w]').forEach(el => WIDGETS[el.dataset.w](el));
  document.querySelectorAll('[data-aurora]').forEach(el => {
    const spots = el.dataset.aurora.split(';').map(s => s.split(',').map(Number));
    el.classList.add('aurora');
    el.innerHTML = spots.map(([x, y, s, o]) => `<i style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;${o ? `opacity:${o}` : ''}"></i>`).join('');
  });
  document.querySelectorAll('[data-footer]').forEach(el => {
    el.outerHTML = `<footer class="f"><div class="panel glass soft">
      <div class="aurora" style="z-index:0"><i style="left:-120px;top:140px;width:520px;height:520px;opacity:.55"></i><i style="left:520px;top:300px;width:460px;height:460px;opacity:.5"></i><i style="left:900px;top:120px;width:420px;height:420px;opacity:.5"></i><i style="left:1100px;top:380px;width:420px;height:420px;opacity:.6"></i></div>
      <div class="cols">
        <div class="news"><span class="eyebrow">Sleep Letters</span><h3 style="margin-top:20px">One calm email,<br>every Sunday.</h3><p>Research notes, recovery rituals and early access to new finishes. No noise, ever.</p><div class="mail">you@calmmornings.com<b>${ic('arrow')}</b></div></div>
        <div><h5>Shop</h5><ul><li>HALO Ring Gen 3</li><li>Finishes</li><li>Free sizing kit</li><li>Membership</li><li>Gift cards</li></ul></div>
        <div><h5>Discover</h5><ul><li>The HALO app</li><li>Science & sensors</li><li>Research library</li><li>Member stories</li><li>Journal</li></ul></div>
        <div><h5>Support</h5><ul><li>Help centre</li><li>Shipping & returns</li><li>2-year warranty</li><li>Battery care</li><li>Contact us</li></ul></div>
      </div>
      <div class="big"><span class="au">halo</span></div></div>
      <div class="bot"><span>© 2026 HALO Health Labs · Copenhagen · A concept brand</span><span>Privacy · Terms · Accessibility · Cookies · Not a medical device</span><span>EN · €  ·  Free 30-day returns</span></div></footer>`;
  });
  document.querySelectorAll('[data-ic]').forEach(el => { if (el.className) { el.innerHTML = ic(el.dataset.ic); el.removeAttribute('data-ic'); } else el.outerHTML = ic(el.dataset.ic); });
  document.querySelectorAll('[data-img]').forEach(el => {
    const [id, w] = el.dataset.img.split('|');
    el.insertAdjacentHTML('afterbegin', `<img src="${U(id, w || 1400)}" alt="">`);
  });
  // scroll progress
  document.body.insertAdjacentHTML('afterbegin', `<div class="prog"><i style="--p:${progress}%"></i></div>`);
  const bar = document.querySelector('.prog i');
  addEventListener('scroll', () => { const m = document.documentElement.scrollHeight - innerHeight; if (m > 0) bar.style.setProperty('--p', Math.max(progress, scrollY / m * 100) + '%'); });
  // counters
  document.querySelectorAll('[data-count]').forEach(el => {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), t0 = performance.now(), d = 1300;
    const tick = t => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = (to * e).toFixed(dec); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  // cursor follows the mouse inside its section
  document.querySelectorAll('.cursor').forEach(c => {
    c.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 92 92"><path d="M20 30a32 32 0 0 1 52 0" fill="none" stroke="#7d66f2" stroke-width="1.4" stroke-linecap="round"/><path d="m68 23 4 7-8 1" fill="none" stroke="#7d66f2" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M72 62a32 32 0 0 1-52 0" fill="none" stroke="#7d66f2" stroke-width="1.4" stroke-linecap="round"/><path d="m24 69-4-7 8-1" fill="none" stroke="#7d66f2" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
    const host = c.offsetParent || document.body;
    host.addEventListener('mousemove', e => { const b = host.getBoundingClientRect(); c.style.left = e.clientX - b.left + 'px'; c.style.top = e.clientY - b.top + 'px'; });
  });
}

/* orbit: chips travel an ellipse around the ring; the back half dims and passes behind it */
function orbit(sel, { cx, cy, rx, ry, period = 90 }) {
  const chips = [...document.querySelectorAll(sel)], t0 = performance.now();
  const step = t => {
    chips.forEach(ch => {
      const a = (+ch.dataset.a) * Math.PI / 180 + (t - t0) / 1000 / period * 2 * Math.PI;
      const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a), z = Math.sin(a), s = .84 + .16 * (z + 1) / 2;
      ch.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) scale(${s.toFixed(3)})`;
      ch.style.zIndex = z < -.15 ? 2 : 8; ch.style.opacity = (.62 + .38 * (z + 1) / 2).toFixed(2);
      ch.style.filter = z < -.3 ? `blur(${(-z * 1.4).toFixed(1)}px)` : 'none';
    });
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
