// Turkish counterpart of the crawlable <main class="seo-fallback"> block in
// index.html (the SPA shell). React replaces #root on mount, so this is what a
// crawler — or a visitor without JS — reads at /tr/. It mirrors the English block
// section for section; scripts/build-tr.js checks the two have the same links.

const passports = [
  ["tr", "Türkiye"], ["us", "Amerika Birleşik Devletleri"], ["gb", "Birleşik Krallık"], ["de", "Almanya"],
  ["in", "Hindistan"], ["cn", "Çin"], ["ng", "Nijerya"], ["br", "Brezilya"], ["ph", "Filipinler"], ["pk", "Pakistan"],
];

module.exports = `<main class="seo-fallback">
      <h1>travelnow.info — Her pasaport için vize gereklilikleri</h1>
      <p>Pasaportunu seç; etkileşimli bir küre her ülkeyi bugün girmek için ihtiyacın olana göre boyar: <strong>vizesiz</strong>, <strong>e-Vize</strong>, <strong>varışta vize</strong> ya da <strong>vize gerekli</strong>. Ücretsiz, üyelik yok ve vize verileri her gün kamuya açık kaynaklardan yenileniyor.</p>
      <p>200'den fazla pasaportu ve 200'den fazla varış noktasını kapsıyoruz; ayrıca havaalanı transit vizeleri, Schengen 90/180 gün kuralı, AB'nin yeni ETIAS izni, 6 aylık pasaport geçerlilik kuralı ve çok duraklı seyahat planlama için ücretsiz araçlar sunuyoruz. Her ülkenin ayrıca kendi sayfası ve eksiksiz bir vize gereklilikleri dökümü var.</p>

      <h2>Popüler pasaportlar</h2>
      <ul>
${passports.map(([iso, name]) => `        <li><a href="/tr/passport/${iso}/">${name} pasaportu vize gereklilikleri</a></li>`).join("\n")}
        <li><a href="/tr/passport/">→ 200'den fazla pasaportun tümüne göz at</a></li>
      </ul>

      <h2>Ücretsiz vize araçları</h2>
      <ul>
        <li><a href="/transit-map/">Transit Haritası</a> — vize gerektirmeden hangi havaalanlarından aktarma yapabileceğin</li>
        <li><a href="/tr/schengen-calculator/">Schengen 90/180 Hesaplayıcı</a> — Schengen Bölgesi'ndeki günlerini takip et</li>
        <li><a href="/tr/etias/">ETIAS Kontrolü</a> — AB'nin 2026 seyahat izni sana uygulanıyor mu?</li>
        <li><a href="/tr/passport-validity/">Pasaport Geçerlilik Kontrolü</a> — 6 ay kuralı, varış noktasına göre</li>
        <li><a href="/itinerary/">Seyahat Planlayıcı</a> — çok duraklı bir gezi için vizeler, maliyetler ve süreler</li>
        <li><a href="/tr/visa-shortcuts/">Vize Kestirmeleri</a> — elindeki vizelerle daha kolay giriş</li>
        <li><a href="/tr/digital-nomad-visa/">Dijital Göçebe Vizeleri</a> · <a href="/tr/citizenship-by-investment/">Yatırımla Vatandaşlık</a></li>
      </ul>

      <h2>Seyahat rehberleri</h2>
      <ul>
        <li><a href="/tr/guides/visa-types-explained/">Vizesiz, e-Vize, varışta vize — aradaki fark gerçekte ne demek</a></li>
        <li><a href="/tr/guides/schengen-90-180-rule/">Schengen 90/180 gün kuralı gerçekte nasıl işler</a></li>
        <li><a href="/tr/guides/etias-2026-explained/">2026'da ETIAS: kimler için gerekli ve vizeden farkı ne</a></li>
        <li><a href="/tr/guides/transit-visa-guide/">Transit vizeler: aktarma ne zaman evrak gerektirir</a></li>
        <li><a href="/tr/guides/passport-validity-six-month-rule/">Altı aylık pasaport geçerlilik kuralı</a> · <a href="/tr/guides/">tüm rehberler →</a></li>
      </ul>

      <h2>Veriler nasıl oluşturuluyor</h2>
      <p>Vize gereklilikleri her gün kamuya açık vize politikası sayfalarından ve resmî devlet kaynaklarından yeniden toplanıyor; üzerine resmî kaynaklarla kontrol edilen, elle hazırlanmış bir düzeltme katmanı biniyor. Transit vize listeleri Birleşik Krallık'ın Immigration (Passenger Transit Visa) Order düzenlemesinden ve AB Vize Tüzüğü'nden geliyor. Veri uydurmuyoruz: bir bilgi kaynaklandırılamıyorsa dışarıda bırakıyoruz. Rezervasyon yapmadan önce mutlaka varış ülkesinin büyükelçiliğine danış — <a href="/tr/about/">Hakkında</a>, <a href="/terms/">Koşullar</a> ve <a href="/privacy/">Gizlilik</a> sayfalarımıza bak.</p>
      <p>travelnow.info, Uygar Atalay tarafından geliştirilen ve sürdürülen bağımsız bir projedir. Sorun ya da veri düzeltmesi mi var? <a href="mailto:hello@travelnow.info">hello@travelnow.info</a> adresine yaz.</p>
      <p>Etkileşimli harita yükleniyor… görünmezse JavaScript'i etkinleştir.</p>

      <nav>
        <a href="/tr/passport/">Tüm pasaportlar</a>
        <a href="/tr/guides/">Rehberler</a>
        <a href="/tr/about/">Hakkında</a>
        <a href="/privacy/">Gizlilik</a>
        <a href="/terms/">Koşullar</a>
        <a href="/tr/contact/">İletişim</a>
      </nav>
    </main>`;
