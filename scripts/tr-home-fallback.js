// Turkish counterpart of the crawlable <main class="seo-fallback"> block in
// index.html (the SPA shell). It sits under the framed globe on desktop and is
// what a crawler reads at /tr/. It mirrors the English block
// section for section; scripts/build-tr.js checks the two have the same links.

module.exports = `<main class="seo-fallback">
      <header class="hm-head">
        <h1>Her pasaport için vize şartları</h1>
        <p>200'den fazla pasaport ve ülke. Vize verileri her gün resmî ve kamuya açık kaynaklardan yenilenir.</p>
      </header>

      <div class="hm-top">
        <div id="home-picks"></div>
        <div id="home-panel-more"></div>
      </div>

      <section class="hm-sec">
        <div class="hm-sec-head"><h2>Okumaya değer</h2><a href="/tr/guides/">Tüm rehberler →</a></div>
        <ul class="hm-cards">
          <li><a class="hm-card" href="/tr/guides/visa-types-explained/"><span class="hm-card-t">Vizesiz, e-Vize, varışta vize: aradaki fark gerçekte ne demek</span><span class="hm-card-d">Beş giriş kategorisi sade bir dille: vizesiz, seyahat izni (ESTA/ETIAS), e-Vize, varışta vize ve vize gerekli. Ayrıca yolcuların geri çevrilmesine yol açan hatalar.</span></a></li>
          <li><a class="hm-card" href="/tr/guides/schengen-90-180-rule/"><span class="hm-card-t">Schengen 90/180 gün kuralı gerçekte nasıl işler</span><span class="hm-card-d">Schengen 90/180 kuralı çözümlü örneklerle: kayan 180 günlük pencere, günleri nasıl sayarsın, sık yapılan hatalar ve süre aşımı nasıl cezalandırılır.</span></a></li>
          <li><a class="hm-card" href="/tr/guides/etias-2026-explained/"><span class="hm-card-t">2026'da ETIAS: kimler için gerekli ve vizeden farkı ne</span><span class="hm-card-d">AB'nin ETIAS seyahat izni için sade bir rehber: kimler için gerekli, kimler muaf, ne kadar tutuyor, ne kadar geçerli ve neden vize değil.</span></a></li>
        </ul>
      </section>

      <section class="hm-sec">
        <h2>Ücretsiz vize araçları</h2>
        <ul class="hm-chips">
          <li><a href="/transit-map/" title="Vize gerektirmeden hangi havaalanlarından aktarma yapabileceğin">Transit haritası</a></li>
          <li><a href="/tr/schengen-calculator/" title="Schengen Bölgesi'ndeki günlerini takip et">Schengen 90/180 hesaplayıcı</a></li>
          <li><a href="/tr/etias/" title="AB'nin 2026 seyahat izni sana uygulanıyor mu?">ETIAS kontrolü</a></li>
          <li><a href="/tr/passport-validity/" title="6 ay kuralı, varış noktasına göre">Pasaport geçerlilik kontrolü</a></li>
          <li><a href="/itinerary/" title="Çok duraklı bir gezi için vizeler, maliyetler ve süreler">Seyahat planlayıcı</a></li>
          <li><a href="/tr/visa-shortcuts/" title="Elindeki vizelerle daha kolay giriş">Vize kısayolları</a></li>
          <li><a href="/tr/digital-nomad-visa/" title="Uzaktan çalışırken yaşayabileceğin ülkeler">Dijital göçebe vizeleri</a></li>
          <li><a href="/tr/citizenship-by-investment/" title="Programlar, maliyetler ve her pasaportun açtığı kapılar">Yatırımla vatandaşlık</a></li>
        </ul>
      </section>

      <section class="hm-sec">
        <h2>Ülkeye göre vize şartları</h2>
        <ul class="hm-chips">
          <li><a href="/tr/visa/mv/">Maldivler vize şartları</a></li>
          <li><a href="/tr/visa/hk/">Hong Kong vize şartları</a></li>
          <li><a href="/tr/visa/us/">Amerika Birleşik Devletleri vize şartları</a></li>
          <li><a href="/tr/visa/gb/">Birleşik Krallık vize şartları</a></li>
          <li><a href="/tr/visa/jp/">Japonya vize şartları</a></li>
          <li><a href="/tr/visa/th/">Tayland vize şartları</a></li>
          <li><a href="/tr/visa/cy/">Kıbrıs vize şartları</a></li>
          <li><a href="/tr/visa/mt/">Malta vize şartları</a></li>
          <li><a href="/tr/visa/om/">Umman vize şartları</a></li>
          <li><a href="/tr/visa/uy/">Uruguay vize şartları</a></li>
          <li><a href="/tr/visa/">Tüm ülkeler →</a></li>
        </ul>
      </section>

      <section class="hm-sec">
        <h2>Popüler pasaportlar</h2>
        <ul class="hm-chips">
          <li><a href="/tr/passport/tr/">Türkiye pasaportu</a></li>
          <li><a href="/tr/passport/us/">Amerika Birleşik Devletleri pasaportu</a></li>
          <li><a href="/tr/passport/gb/">Birleşik Krallık pasaportu</a></li>
          <li><a href="/tr/passport/de/">Almanya pasaportu</a></li>
          <li><a href="/tr/passport/in/">Hindistan pasaportu</a></li>
          <li><a href="/tr/passport/cn/">Çin pasaportu</a></li>
          <li><a href="/tr/passport/ng/">Nijerya pasaportu</a></li>
          <li><a href="/tr/passport/br/">Brezilya pasaportu</a></li>
          <li><a href="/tr/passport/ph/">Filipinler pasaportu</a></li>
          <li><a href="/tr/passport/pk/">Pakistan pasaportu</a></li>
          <li><a href="/tr/passport/">200'den fazla pasaportun tümü →</a></li>
        </ul>
      </section>

      <p class="hm-about">Veri uydurmuyoruz: kaynağı olmayan bilgiyi yayımlamıyoruz. Rezervasyondan önce mutlaka büyükelçiliğe danış. <a href="/tr/about/">Veriler nasıl oluşturuluyor</a> · <a href="mailto:hello@travelnow.info">hello@travelnow.info</a></p>

      <nav>
        <a href="/tr/passport/">Tüm pasaportlar</a>
        <a href="/tr/guides/">Rehberler</a>
        <a href="/tr/about/">Hakkında</a>
        <a href="/tr/privacy/">Gizlilik</a>
        <a href="/terms/">Koşullar</a>
        <a href="/tr/contact/">İletişim</a>
      </nav>
    </main>`;
