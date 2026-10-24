/* MOCHI MONSTERS — shared chrome (nav + footer). Classic script, load in <head>. */
(function () {

  const links = [['shop', 'shop.html', 'Shop'], ['unbox', 'unbox.html', 'Blind boxes'], ['drops', 'drops.html', 'Drops', 'NEW'], ['character', 'character.html', 'Studio'], ['club', 'home.html#club', 'Mochi Club']];
  const nav = on => `<a class="logo" href="home.html"><span class="mk"></span><span>mochi monsters<small>ART TOYS · EST. 2019</small></span></a>
    <div class="links">${links.map(l => `<a href="${l[1]}" class="${l[0] === on ? 'on' : ''}">${l[2]}${l[3] ? `<span class="n">${l[3]}</span>` : ''}</a>`).join('')}</div>
    <div class="sp"></div>
    <div class="search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>Search monsters, artists…</div>
    <a class="ico" href="#"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2b2240" stroke-width="2.4" stroke-linecap="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></a>
    <a class="ico" href="#"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2b2240" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></a>
    <a class="bag" href="cart.html">Bag <b>3</b></a>`;

  const foot = `<i class="blob" style="width:420px;height:420px;background:#ffb59a;left:-120px;top:-140px"></i><i class="blob" style="width:380px;height:380px;background:#9fe3c6;right:-80px;top:120px"></i>
    <div class="cols" style="position:relative">
      <div class="club"><h3>Join the Mochi Club</h3><p>First dibs on drops, a secret-odds boost on your birthday box, and zero spam — just one squishy email a week.</p><div class="in"><span>you@email.com</span><b>Count me in</b></div></div>
      <div><h4>Shop</h4><ul><li>New arrivals</li><li>Blind boxes</li><li>Sealed cases</li><li>Mega 40 cm</li><li>Gift cards</li></ul></div>
      <div><h4>Collect</h4><ul><li>Drop calendar</li><li>Artists</li><li>Trade corner</li><li>Odds & rarity</li><li>Care guide</li></ul></div>
      <div><h4>Help</h4><ul><li>Shipping (EU 2–4 days)</li><li>Returns & doubles</li><li>Raffle rules</li><li>Contact the crew</li><li>Wholesale</li></ul></div>
    </div>
    <div class="big" style="position:relative">mochi monsters</div>
    <div class="legal" style="position:relative"><span>© 2026 Mochi Monsters Studio · Lisbon & Osaka · Designer toys for ages 15+</span><span>Privacy · Terms · Cookie settings · EN / € EUR</span></div>`;

  addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('nav.nav').forEach(n => { n.innerHTML = nav(n.dataset.on); });
    document.querySelectorAll('footer.foot').forEach(f => { if (!f.innerHTML.trim()) f.innerHTML = foot; });
  });
})();
