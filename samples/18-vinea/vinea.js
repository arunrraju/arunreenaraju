/* Domaine Vinea — shared UI ornaments (crest, wax seals, bottle illustrations) */
(function () {
  const crest = (c = 'currentColor') => `<svg viewBox="0 0 100 110" fill="none" aria-hidden="true">
    <g fill="${c}">${[0, 1, 2, 3, 4, 5].map(i => { const a = 200 + i * 22; return `<ellipse cx="${50 + Math.cos(a * Math.PI / 180) * 44}" cy="${58 + Math.sin(a * Math.PI / 180) * -40 + 6}" rx="3.2" ry="8" transform="rotate(${a - 90 + 180} ${50 + Math.cos(a * Math.PI / 180) * 44} ${58 + Math.sin(a * Math.PI / 180) * -40 + 6})"/><ellipse cx="${50 - Math.cos(a * Math.PI / 180) * 44}" cy="${58 + Math.sin(a * Math.PI / 180) * -40 + 6}" rx="3.2" ry="8" transform="rotate(${-(a - 90 + 180)} ${50 - Math.cos(a * Math.PI / 180) * 44} ${58 + Math.sin(a * Math.PI / 180) * -40 + 6})"/>`; }).join('')}</g>
    <path d="M24 24h52v34c0 20-14 32-26 40C38 90 24 78 24 58z" stroke="${c}" stroke-width="2.2"/>
    <path d="M29 29h42v28c0 16-11 26-21 33C40 83 29 73 29 57z" stroke="${c}" stroke-width=".8"/>
    <g fill="${c}"><circle cx="41" cy="48" r="3.6"/><circle cx="48.5" cy="48" r="3.6"/><circle cx="56" cy="48" r="3.6"/><circle cx="63.5" cy="48" r="3.6"/><circle cx="44.7" cy="54.5" r="3.6"/><circle cx="52.2" cy="54.5" r="3.6"/><circle cx="59.7" cy="54.5" r="3.6"/><circle cx="48.5" cy="61" r="3.6"/><circle cx="56" cy="61" r="3.6"/><circle cx="52.2" cy="67.5" r="3.6"/>
    <ellipse cx="60" cy="37" rx="7" ry="3.4" transform="rotate(-28 60 37)"/><circle cx="34" cy="16" r="2.2"/><circle cx="42" cy="14" r="2.2"/><circle cx="50" cy="11" r="2.6"/><circle cx="58" cy="14" r="2.2"/><circle cx="66" cy="16" r="2.2"/></g>
    <path d="M52 44c0-5 2-9 6-11" stroke="${c}" stroke-width="1.6"/></svg>`;
  document.querySelectorAll('[data-crest]').forEach(el => el.innerHTML = crest(el.dataset.crest || 'currentColor'));

  /* wax seal: irregular blob + ring text */
  let sid = 0;
  document.querySelectorAll('[data-seal]').forEach(el => {
    const id = 'ws' + (sid++); const txt = el.dataset.seal || 'DOMAINE VINEA · GRAND CRU · MDCCCXII ·';
    const mono = el.dataset.mono || 'V'; const col = el.dataset.color || '#7a1426';
    let s = 3 + sid; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const pts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; const R = 46 + r() * 4 - (i % 7 === 0 ? 3 : 0); pts.push([50 + Math.cos(a) * R, 50 + Math.sin(a) * R]); }
    const d = 'M' + pts.map((p, i) => { const n = pts[(i + 1) % pts.length]; return `${p[0].toFixed(1)},${p[1].toFixed(1)} Q${((p[0] + n[0]) / 2 + (r() - .5) * 3).toFixed(1)},${((p[1] + n[1]) / 2 + (r() - .5) * 3).toFixed(1)} `; }).join('') + 'Z';
    el.innerHTML = `<svg viewBox="0 0 100 100"><defs><radialGradient id="${id}g" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#c2384e"/><stop offset=".45" stop-color="${col}"/><stop offset="1" stop-color="#2a050c"/></radialGradient>
      <radialGradient id="${id}i" cx="60%" cy="65%" r="60%"><stop offset="0" stop-color="#3a0610"/><stop offset="1" stop-color="${col}"/></radialGradient><path id="${id}p" d="M50,50 m-29,0 a29,29 0 1,1 58,0 a29,29 0 1,1 -58,0"/></defs>
      <path d="${d}" fill="url(#${id}g)"/><circle cx="50" cy="50" r="35" fill="url(#${id}i)" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/><circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,190,190,.25)" stroke-width=".6" transform="translate(-.6,-.6)"/>
      <g class="ring"><text font-family="Karla" font-weight="700" font-size="6.2" letter-spacing="1.6" fill="rgba(255,215,205,.55)"><textPath href="#${id}p">${txt}</textPath></text></g>
      <text x="50" y="${mono.length > 1 ? 56 : 61}" text-anchor="middle" font-family="Libre Caslon Display" font-size="${mono.length > 2 ? 15 : 30}" fill="#2a040b" opacity=".75" transform="translate(.8,.8)">${mono}</text>
      <text x="50" y="${mono.length > 1 ? 56 : 61}" text-anchor="middle" font-family="Libre Caslon Display" font-size="${mono.length > 2 ? 15 : 30}" fill="rgba(255,200,195,.42)">${mono}</text></svg>`;
  });

  /* bottle illustrations for product cards */
  const shapes = {
    burgundy: 'M18,380 Q18,392 30,392 L90,392 Q102,392 102,380 L102,218 C102,160 74,146 74,104 L74,34 L76,31 L76,18 Q76,13 71,13 L49,13 Q44,13 44,18 L44,31 L46,34 L46,104 C46,146 18,160 18,218 Z',
    bordeaux: 'M20,380 Q20,392 32,392 L88,392 Q100,392 100,380 L100,150 C100,124 74,122 74,100 L74,34 L76,31 L76,18 Q76,13 71,13 L49,13 Q44,13 44,18 L44,31 L46,34 L46,100 C46,122 20,124 20,150 Z',
    sparkling: 'M16,380 Q16,392 28,392 L92,392 Q104,392 104,380 L104,232 C104,150 72,140 72,96 L72,36 L76,32 L76,18 Q76,13 71,13 L49,13 Q44,13 44,18 L44,32 L48,36 L48,96 C48,140 16,150 16,232 Z'
  };
  const pal = {
    red: { g1: '#0b1a10', g2: '#1f3d26', wine: '#2a0710', cap: '#5a0f1f', capH: '#9b2c40', shape: 'burgundy', lab: '#efe4d0', ink: '#3a1018' },
    old: { g1: '#0d130c', g2: '#26331f', wine: '#2a0a0c', cap: '#2b1a12', capH: '#7a5a3a', shape: 'burgundy', lab: '#e5d3b0', ink: '#3a1a10' },
    rose: { g1: '#e9a59a', g2: '#fbd9cc', wine: '#e99a8e', cap: '#d9b48a', capH: '#f7e3c0', shape: 'bordeaux', lab: '#f6ece0', ink: '#7a2a32' },
    spark: { g1: '#081109', g2: '#20331f', wine: '#0b140b', cap: '#a8854e', capH: '#ecd39a', shape: 'sparkling', lab: '#14100e', ink: '#d8bd85' },
    bdn: { g1: '#0b1209', g2: '#1d2d1a', wine: '#0b140b', cap: '#151012', capH: '#5a4a40', shape: 'sparkling', lab: '#efe4d0', ink: '#2a1414' }
  };
  let bid = 0;
  document.querySelectorAll('[data-bottle]').forEach(el => {
    const p = pal[el.dataset.bottle] || pal.red; const id = 'b' + (bid++); const sh = shapes[p.shape];
    const name = el.dataset.name || 'Clos des Ombres', yr = el.dataset.year || '2019', cru = el.dataset.cru || 'Grand Cru';
    const capEnd = p.shape === 'sparkling' ? 132 : 78; const lt = p.shape === 'sparkling' ? 250 : p.shape === 'bordeaux' ? 214 : 250;
    el.innerHTML = `<svg viewBox="0 0 120 400" preserveAspectRatio="xMidYMax meet"><defs>
      <linearGradient id="${id}a" x1="0" x2="1"><stop offset="0" stop-color="${p.g1}"/><stop offset=".22" stop-color="${p.g2}"/><stop offset=".34" stop-color="${p.g1}"/><stop offset=".78" stop-color="${p.g1}"/><stop offset=".9" stop-color="${p.g2}"/><stop offset="1" stop-color="${p.g1}"/></linearGradient>
      <linearGradient id="${id}c" x1="0" x2="1"><stop offset="0" stop-color="${p.cap}"/><stop offset=".3" stop-color="${p.capH}"/><stop offset=".55" stop-color="${p.cap}"/><stop offset="1" stop-color="#140507"/></linearGradient>
      <linearGradient id="${id}l" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
      <clipPath id="${id}k"><path d="${sh}"/></clipPath></defs>
      <path d="${sh}" fill="url(#${id}a)"/>
      <g clip-path="url(#${id}k)">
        <rect x="0" y="${p.shape === 'bordeaux' ? 140 : 190}" width="120" height="210" fill="${p.wine}" opacity="${el.dataset.bottle === 'rose' ? .55 : .35}"/>
        <rect x="0" y="0" width="120" height="${capEnd}" fill="url(#${id}c)"/>
        <rect x="0" y="${capEnd - 6}" width="120" height="2" fill="${p.capH}" opacity=".8"/><rect x="0" y="${capEnd - 11}" width="120" height="1" fill="${p.capH}" opacity=".6"/>
        <rect x="14" y="${lt}" width="92" height="112" fill="${p.lab}"/>
        <rect x="19" y="${lt + 5}" width="82" height="102" fill="none" stroke="${p.ink}" stroke-opacity=".55" stroke-width=".7"/>
        <rect x="14" y="${lt}" width="92" height="112" fill="url(#${id}l)"/>
        <rect x="27" y="0" width="7" height="400" fill="#fff" opacity="${el.dataset.bottle === 'rose' ? .45 : .16}"/><rect x="37" y="0" width="2" height="400" fill="#fff" opacity=".1"/><rect x="88" y="0" width="3" height="400" fill="#fff" opacity=".08"/>
      </g>
      <g fill="${p.ink}" text-anchor="middle">
        <path transform="translate(54 ${lt + 12}) scale(.12)" d="M24 24h52v34c0 20-14 32-26 40C38 90 24 78 24 58z" fill="none" stroke="${p.ink}" stroke-width="6"/>
        <text x="60" y="${lt + 37}" font-family="Karla" font-weight="700" font-size="4.6" letter-spacing="1.4">DOMAINE VINEA</text>
        <text x="60" y="${lt + 54}" font-family="Libre Caslon Display" font-size="${name.length > 15 ? 8.4 : 10}">${name}</text>
        <text x="60" y="${lt + 65}" font-family="Libre Caslon Text" font-style="italic" font-size="6">${cru}</text>
        <text x="60" y="${lt + 92}" font-family="Libre Caslon Display" font-size="20">${yr}</text>
      </g></svg>`;
  });

  /* ripple-split letters for animated headlines */
  document.querySelectorAll('[data-split]').forEach(el => {
    el.innerHTML = el.textContent.split('').map((c, i) => `<span class="ch" style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  });
})();
