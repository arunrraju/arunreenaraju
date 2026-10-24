/* AZURE ESTATES — shared page bits (footer, photo helper) */
(function () {
  const U = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=82&w=${w}`;
  window.AZ = { U };
  // <div data-img="id" data-w="900"> → image
  document.querySelectorAll('[data-img]').forEach(el => {
    const id = el.dataset.img; if (!id) return;
    const im = new Image(); im.alt = el.dataset.alt || ''; im.src = U(id, el.dataset.w || 1200);
    if (el.dataset.pos) im.style.objectPosition = el.dataset.pos;
    el.prepend(im);
  });
  const f = document.querySelector('footer.f[data-footer]');
  if (f) f.innerHTML = `
    <div class="sunball"></div>
    <div class="g">
      <div><div class="logo" style="color:#fff"><i></i>AZURE</div>
        <p style="margin-top:26px;max-width:340px;color:#a9aaa8;font-size:15px">Architect-designed houses on the cliffs of the Mediterranean and the Pacific, for sale and for private stays. Every listing visited, measured and photographed by us.</p>
        <div class="news"><span>Private listings, before they list</span><span style="color:#fff">Subscribe →</span></div></div>
      <div><h4>Villas</h4><ul><li>For sale</li><li>Private rentals</li><li>Off-market</li><li>Sold archive</li><li>Portfolio map</li></ul></div>
      <div><h4>Coasts</h4><ul><li>Ibiza</li><li>Amalfi</li><li>Big Sur</li><li>Mani, Greece</li><li>Comporta</li></ul></div>
      <div><h4>Studio</h4><ul><li>Architects</li><li>Journal</li><li>Valuations</li><li>Careers</li><li>Press</li></ul></div>
      <div><h4>Offices</h4><ul><li>Ibiza · Passeig de Vara de Rey 14</li><li>Positano · Via Cristoforo Colombo 9</li><li>Carmel · Ocean Ave 210</li><li>London · 31 Mount Street</li></ul>
        <p style="margin-top:16px;font:500 13px/1 var(--mono);color:#fff">+34 971 000 418</p></div>
    </div>
    <div class="big"><b>AZURE</b> ESTATES</div>
    <div class="legal"><span>© 2026 Azure Estates S.L. · Concept project, fictional brand</span><span>Privacy · Terms · Energy certificates · AML policy</span><span>38°51′N 1°18′E</span></div>`;
})();
