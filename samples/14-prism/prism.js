// PRISM shared chrome: nav, footer, grain
(function () {
  const page = document.body.dataset.page || '';
  const logo = `<svg viewBox="0 0 32 32"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9a6ff"/><stop offset=".5" stop-color="#8fe8f0"/><stop offset="1" stop-color="#ffb6dc"/></linearGradient></defs><path d="M16 2 29 26H3Z" fill="url(#lg)"/><path d="M16 2 20 26H3Z" fill="#14141c" opacity=".85"/></svg>`;
  const links = [['home', 'home.html', 'Prism One'], ['experiences', 'experiences.html', 'Experiences'], ['configure', 'configure.html', 'Fit & Configure'], ['compare', 'compare.html', 'Compare'], ['product', 'product.html', 'Tech specs']];
  const nav = document.querySelector('[data-nav]');
  if (nav) nav.outerHTML = `<header class="nav glass"><a class="logo" href="home.html">${logo}PRISM</a>
    <ul>${links.map(([k, h, t]) => `<li><a href="${h}" class="${k === page ? 'on' : ''}">${t}</a></li>`).join('')}</ul>
    <div class="r"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></span><a class="bagbtn" href="checkout.html">Bag <b>${document.body.dataset.bag || 1}</b></a></div></header>`;
  const foot = document.querySelector('[data-foot]');
  if (foot) foot.outerHTML = `<footer class="foot">
    <div class="top">
      <div><a class="logo" href="home.html">${logo}PRISM</a><p style="font-size:14px;color:var(--ink2);margin-top:18px;max-width:260px">Mixed reality, made light. Designed in Copenhagen, assembled in Eindhoven.</p>
        <div style="display:flex;gap:8px;margin-top:22px"><span class="chip"><span class="dot"></span>Studios open today</span></div></div>
      <div><h5>Shop</h5><ul><li>Prism One</li><li>Prism Air</li><li>Controllers</li><li>Lens inserts</li><li>Straps & seals</li></ul></div>
      <div><h5>Explore</h5><ul><li>Experiences</li><li>Prism OS 3</li><li>Developers</li><li>Fit studio</li><li>Journal</li></ul></div>
      <div><h5>Help</h5><ul><li>Book a demo</li><li>Shipping & returns</li><li>PrismCare+</li><li>Order status</li><li>Accessibility</li></ul></div>
      <div><h5>The Refraction letter</h5><p style="font-size:14px;color:var(--ink2)">Drops, early demos, new worlds. Twice a month, never more.</p><div class="news"><span>you@domain.com</span><b>Subscribe</b></div></div>
    </div>
    <div class="word chrome">PRISM</div>
    <div class="legal"><span>© 2026 Prism Reality ApS · Fictional brand, concept work</span><span>Privacy · Terms · Cookie settings · EU (EUR €)</span></div>
  </footer>`;
  if (!document.querySelector('.grain')) document.body.insertAdjacentHTML('beforeend', '<div class="grain"></div>');
})();
