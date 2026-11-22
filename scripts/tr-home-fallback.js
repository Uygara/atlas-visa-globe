// Turkish counterpart of the crawlable <main class="seo-fallback"> block in
// index.html (the SPA shell). It sits under the framed globe on desktop and is
// what a crawler reads at /tr/. It mirrors the English block
// section for section; scripts/build-tr.js checks the two have the same links.

module.exports = `<main class="seo-fallback">
      <header class="hm-head">
        <h1>Her pasaport için vize şartları</h1>
        <p class="hm-lead">Pasaportunu seç; küre her ülkeyi bugün girmek için neye ihtiyacın olduğuna göre boyasın: <strong>vizesiz</strong>, <strong>e-Vize</strong>, <strong>varışta vize</strong> ya da <strong>vize gerekli</strong>. Ücretsiz, üyelik gerektirmez, veriler her gün kamuya açık kaynaklardan yenilenir.</p>
        <p>200'den fazla pasaportu ve 200'den fazla ülkeyi kapsıyoruz; her ülkenin ayrıntılı dökümü kendi sayfasında.</p>
      </header>

      <div id="home-picks"></div>

      <section class="hm-sec">
        <div class="hm-sec-head"><h2>Okumaya değer</h2><a href="/tr/guides/">Tüm rehberler →</a></div>
        <ul class="hm-cards">
          <li><a class="hm-card" href="/tr/guides/visa-types-explained/"><span class="hm-card-t">Vizesiz, e-Vize, varışta vize: aradaki fark gerçekte ne demek</span><span class="hm-card-d">Beş giriş kategorisi sade bir dille: vizesiz, seyahat izni (ESTA/ETIAS), e-Vize, varışta vize ve vize gerekli. Ayrıca yolcuların geri çevrilmesine yol açan hatalar.</span></a></li>
          <li><a class="hm-card" href="/tr/guides/schengen-90-180-rule/"><span class="hm-card-t">Schengen 90/180 gün kuralı gerçekte nasıl işler</span><span class="hm-card-d">Schengen 90/180 kuralı çözümlü örneklerle: kayan 180 günlük pencere, günleri nasıl sayarsın, sık yapılan hatalar ve süre aşımı nasıl cezalandırılır.</span></a></li>
          <li><a class="hm-card" href="/tr/guides/etias-2026-explained/"><span class="hm-card-t">2026'da ETIAS: kimler için gerekli ve vizeden farkı ne</span><span class="hm-card-d">AB'nin ETIAS seyahat izni için sade bir rehber: kimler için gerekli, kimler muaf, ne kadar tutuyor, ne kadar geçerli ve neden vize değil.</span></a></li>
          <li><a class="hm-card" href="/tr/guides/transit-visa-guide/"><span class="hm-card-t">Transit vizeler: aktarma ne zaman evrak gerektirir</span><span class="hm-card-d">Aktarma ne zaman transit vize gerektirir? Havaalanı içi (airside) ve dışı (landside) transit, yolcuları şaşırtan havaalanları ve bağlantını nasıl kontrol edeceğin, sade bir dille.</span></a></li>
          <li><a class="hm-card" href="/tr/guides/passport-validity-six-month-rule/"><span class="hm-card-t">Altı aylık pasaport geçerlilik kuralı</span><span class="hm-card-d">Geçerli bir pasaport neden yine de girişin reddedilmesine yol açabilir: altı ay kuralı, nasıl hesaplanır, hangi ülkeler üç ay ya da sıfır uygular ve ne zaman yenilemek gerekir.</span></a></li>
          <li><a class="hm-card" href="/tr/guides/how-we-count/"><span class="hm-card-t">Bir pasaportun vizesiz sayısı nasıl okunur</span><span class="hm-card-d">travelnow.info'daki ana sayının neyi saydığı, e-Vizelerin neden ayrı gösterildiği, pasaportların nasıl sıralandığı ve sayılarımızın diğer sıralamalardan neden farklı olabileceği.</span></a></li>
        </ul>
      </section>

      <section class="hm-sec">
        <h2>Ücretsiz vize araçları</h2>
        <ul class="hm-cards hm-tools">
          <li><a class="hm-card" href="/transit-map/"><span class="hm-card-t">Transit haritası</span><span class="hm-card-d">Vize gerektirmeden hangi havaalanlarından aktarma yapabileceğin</span></a></li>
          <li><a class="hm-card" href="/tr/schengen-calculator/"><span class="hm-card-t">Schengen 90/180 hesaplayıcı</span><span class="hm-card-d">Schengen Bölgesi'ndeki günlerini takip et</span></a></li>
          <li><a class="hm-card" href="/tr/etias/"><span class="hm-card-t">ETIAS kontrolü</span><span class="hm-card-d">AB'nin 2026 seyahat izni sana uygulanıyor mu?</span></a></li>
          <li><a class="hm-card" href="/tr/passport-validity/"><span class="hm-card-t">Pasaport geçerlilik kontrolü</span><span class="hm-card-d">6 ay kuralı, varış noktasına göre</span></a></li>
          <li><a class="hm-card" href="/itinerary/"><span class="hm-card-t">Seyahat planlayıcı</span><span class="hm-card-d">Çok duraklı bir gezi için vizeler, maliyetler ve süreler</span></a></li>
          <li><a class="hm-card" href="/tr/visa-shortcuts/"><span class="hm-card-t">Vize kestirmeleri</span><span class="hm-card-d">Elindeki vizelerle daha kolay giriş</span></a></li>
          <li><a class="hm-card" href="/tr/digital-nomad-visa/"><span class="hm-card-t">Dijital göçebe vizeleri</span><span class="hm-card-d">Uzaktan çalışırken yaşayabileceğin ülkeler</span></a></li>
          <li><a class="hm-card" href="/tr/citizenship-by-investment/"><span class="hm-card-t">Yatırımla vatandaşlık</span><span class="hm-card-d">Programlar, maliyetler ve her pasaportun açtığı kapılar</span></a></li>
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

      <section class="hm-sec hm-about">
        <h2>Veriler nasıl oluşturuluyor</h2>
        <p>Vize şartları her gün kamuya açık vize politikası sayfalarından ve resmî devlet kaynaklarından yeniden toplanıyor; üzerine resmî kaynaklarla kontrol edilen, elle hazırlanmış bir düzeltme katmanı biniyor. Transit vize listeleri Birleşik Krallık'ın Immigration (Passenger Transit Visa) Order düzenlemesinden ve AB Vize Tüzüğü'nden geliyor. Veri uydurmuyoruz: bir bilgi kaynaklandırılamıyorsa dışarıda bırakıyoruz. Rezervasyon yapmadan önce mutlaka varış ülkesinin büyükelçiliğine danış. <a href="/tr/about/">Hakkında</a>, <a href="/terms/">Koşullar</a> ve <a href="/tr/privacy/">Gizlilik</a> sayfalarımıza bak.</p>
        <p>travelnow.info, Uygar Atalay tarafından geliştirilen ve sürdürülen bağımsız bir projedir. Sorun ya da veri düzeltmesi mi var? <a href="mailto:hello@travelnow.info">hello@travelnow.info</a> adresine yaz.</p>
      </section>

      <nav>
        <a href="/tr/passport/">Tüm pasaportlar</a>
        <a href="/tr/guides/">Rehberler</a>
        <a href="/tr/about/">Hakkında</a>
        <a href="/tr/privacy/">Gizlilik</a>
        <a href="/terms/">Koşullar</a>
        <a href="/tr/contact/">İletişim</a>
      </nav>
    </main>`;module.exports = `<main class="seo-fallback">
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
          <li><a href="/tr/visa-shortcuts/" title="Elindeki vizelerle daha kolay giriş">Vize kestirmeleri</a></li>
          <li><a href="/tr/digital-nomad-visa/" title="Uzaktan çalışırken yaşayabileceğin ülkeler">Dijital göçebe vizeleri</a></li>
          <li><a href="/tr/citizenship-by-investment/" title="Programlar, maliyetler ve her pasaportun açtığı kapılar">Yatırımla vatandaşlık</a></li>
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
