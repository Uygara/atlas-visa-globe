// Turkish <title> and meta descriptions for the pages scripts/build-tr.js turns
// into /tr/… twins. Each is a translation of the page's English title/description
// (the English stays the source of truth — when it changes, change the entry here).
// `h1` overrides the JSON-LD headline where the visible <h1> reads differently.
//
// Keep terminology aligned with data/static-i18n.js ("vizesiz skoru", "Altın
// Vize", "Vize Kestirmeleri", "e-Vize", "Varışta vize").

module.exports = {
  "/": {
    title: "travelnow.info: her pasaport için vize gereklilikleri",
    description: "200'den fazla pasaport için etkileşimli vize küresi. Her gün Vikipedi'den yenilenir. Pasaportunla nerelere vizesiz, e-Vize veya varışta vizeyle gidebildiğini, nerelerde vize gerektiğini gör.",
    ogDescription: "200'den fazla pasaportun vize gerekliliklerini etkileşimli bir küre üzerinde gör. Ücretsiz, her gün Vikipedi'den yenilenir.",
  },
  "/privacy/": {
    title: "Gizlilik Politikası · travelnow.info",
    description: "travelnow.info ve uygulamasının hangi kişisel verileri, neden ve ne kadar süre işlediği; verilerine nasıl erişip silebileceğin.",
  },
  "/about/": {
    title: "travelnow.info hakkında",
    description: "travelnow.info, dünya genelinde 200'den fazla pasaportu kapsayan, her gün yenilenen ücretsiz bir vize gereklilikleri aracıdır.",
  },
  "/alerts/": {
    title: "Vize değişiklik uyarıları · travelnow.info",
    description: "İlgilendiğin ülkenin vize politikası değiştiğinde e-posta al. Bir ülke için ücretsiz, sınırsız takip ayda 2 $.",
    ogDescription: "İlgilendiğin ülkenin vize politikası değiştiğinde e-posta al.",
  },
  "/citizenship-by-investment/": {
    title: "Yatırımla Vatandaşlık 2026: tüm aktif programlar karşılaştırmalı · travelnow.info",
    description: "2026'da yürürlükte olan tüm yatırımla vatandaşlık ve altın vize programları: asgari yatırım, uygun yollar, süre, vizesiz skoru, aile kapsamı. Sıralanabilir, her gün gözden geçirilir.",
    ogTitle: "Yatırımla Vatandaşlık 2026: tüm aktif programlar",
    ogDescription: "Asgari yatırım, uygun yollar, süre, vizesiz skoru, aile kapsamı. Tüm tablo tek yerde.",
  },
  "/contact/": {
    title: "travelnow.info ile iletişim",
    description: "travelnow.info ile iletişime geç: veri düzeltmeleri, geri bildirim ve iş birliği talepleri. Uygar Atalay tarafından yürütülüyor.",
    ogDescription: "Düzeltme, geri bildirim veya iş birliği için travelnow.info'nun yürütücüsüne ulaş.",
  },
  "/digital-nomad-visa/": {
    title: "Dijital Göçebe Vizeleri: 38 ülke karşılaştırması (2026) · travelnow.info",
    description: "2026'daki tüm dijital göçebe vizeleri: gelir şartları, harçlar, süre, vergi avantajları ve aile uygunluğu. Sıralanabilir, her gün yenilenir.",
    ogTitle: "Dijital Göçebe Vizeleri: 38 ülke karşılaştırması (2026)",
    ogDescription: "Gelir şartları, harçlar, süre, vergi avantajları. Tüm tablo tek yerde.",
  },
  "/esta-rules/": {
    title: "ESTA Diskalifiye Kontrolü: Vize Muafiyeti Programı'ndan gerçekten yararlanabilir misin? · travelnow.info",
    description: "Ücretsiz ESTA uygunluk ve diskalifiye kontrolü. 2011 sonrası İran/Irak/Suriye/Libya/Sudan/Somali/Yemen/Küba/Kuzey Kore seyahatleri, çifte vatandaşlık, önceki tutuklamalar. VWP'ye uygun pasaport sahiplerini programın dışına iten tüm kurallar.",
    ogTitle: "ESTA Diskalifiye Kontrolü: Vize Muafiyeti Programı kuralları",
    ogDescription: "VWP'ye uygun olmak, gerçekten hak kazandığın anlamına gelmez. ESTA için ödeme yapmadan önce diskalifiye nedenlerini kontrol et.",
  },
  "/etias/": {
    title: "ETIAS 2026: Kimler için gerekli, ne zaman başlıyor, ne kadar tutuyor · travelnow.info",
    description: "ETIAS 2026'nın sonlarında başlıyor. 7 €, 3 yıl geçerli. ABD, Birleşik Krallık, Kanada, Avustralya, Japonya, Brezilya ve 60'tan fazla başka uyruğun Schengen'e girmek için ETIAS izni alması gerekecek. Ücretsiz kontrol aracı.",
    ogTitle: "ETIAS 2026: Kim için gerekli, ne zaman",
    ogDescription: "Schengen'e vizesiz giriş için gereken 7 € tutarında çevrimiçi izin. Canlı geri sayım + uyruğa göre kontrol.",
    h1: "ETIAS: Avrupa'nın yeni seyahat otorizasyonu",
  },
  "/guides/": {
    title: "Seyahat ve vize rehberleri · travelnow.info",
    description: "Yolcuları en çok yanıltan kurallar için sade rehberler: vize türleri, Schengen 90/180 gün kuralı, ETIAS, transit vizeler ve altı aylık pasaport kuralı.",
    ogDescription: "Vizeler, Schengen günleri, ETIAS, transit vizeler ve pasaport geçerliliği için açık, pratik rehberler.",
  },
  "/guides/how-we-count/": {
    title: "Pasaportun vizesiz sayısı nasıl okunur (ve neyi sayıyoruz)",
    description: "travelnow.info'daki ana sayının neyi saydığı, e-Vizelerin neden ayrı gösterildiği, pasaportların nasıl sıralandığı ve sayılarımızın diğer sıralamalardan neden farklı olabileceği.",
    ogTitle: "Pasaportun vizesiz sayısı nasıl okunur",
    ogDescription: "Neyin sayıldığı, neyin sayılmadığı, pasaportların nasıl sıralandığı ve iki sıralamanın neden ikisinin de doğru olabileceği.",
  },
  "/guides/etias-2026-explained/": {
    title: "2026'da ETIAS: kimler için gerekli, ne kadar tutuyor, vizeden farkı ne",
    description: "AB'nin ETIAS seyahat izni için sade bir rehber: kimler için gerekli, kimler muaf, ne kadar tutuyor, ne kadar geçerli ve neden vize değil.",
    ogTitle: "2026'da ETIAS: kimler için gerekli ve vizeden farkı ne",
    ogDescription: "AB'nin yeni seyahat izni: kimi kapsıyor, ne kadar tutuyor ve ne olmadığı.",
  },
  "/guides/passport-validity-six-month-rule/": {
    title: "Altı aylık pasaport geçerlilik kuralı, açıklamalı",
    description: "Geçerli bir pasaport neden yine de girişin reddedilmesine yol açabilir: altı ay kuralı, nasıl hesaplanır, hangi ülkeler üç ay ya da sıfır uygular ve ne zaman yenilemek gerekir.",
    ogTitle: "Altı aylık pasaport geçerlilik kuralı",
    ogDescription: "Geçerli bir pasaport neden yine de reddedilebilir, kural nasıl hesaplanır ve üç ay ne zaman yeter.",
  },
  "/guides/schengen-90-180-rule/": {
    title: "Schengen 90/180 gün kuralı gerçekte nasıl işler (örneklerle)",
    description: "Schengen 90/180 kuralı çözümlü örneklerle: kayan 180 günlük pencere, günleri nasıl sayarsın, sık yapılan hatalar ve süre aşımı nasıl cezalandırılır.",
    ogTitle: "Schengen 90/180 gün kuralı gerçekte nasıl işler",
    ogDescription: "Kayan 180 günlük pencere çözümlü örneklerle ve “90 gün kal, 90 gün dışarıda ol” anlayışının neden yanlış olduğu.",
  },
  "/guides/transit-visa-guide/": {
    title: "Transit vizeler açıklandı: aktarma ne zaman evrak gerektirir",
    description: "Aktarma ne zaman transit vize gerektirir? Havaalanı içi (airside) ve dışı (landside) transit, yolcuları şaşırtan havaalanları ve bağlantını nasıl kontrol edeceğin, sade bir dille.",
    ogTitle: "Transit vizeler: aktarma ne zaman evrak gerektirir",
    ogDescription: "Airside ve landside farkı, yolcuları şaşırtan havaalanları ve bağlantının vize gerektirip gerektirmediğini anlama yolu.",
  },
  "/guides/visa-types-explained/": {
    title: "Vizesiz, e-Vize, varışta vize: aradaki fark gerçekte ne demek",
    description: "Beş giriş kategorisi sade bir dille: vizesiz, seyahat izni (ESTA/ETIAS), e-Vize, varışta vize ve vize gerekli. Ayrıca yolcuların geri çevrilmesine yol açan hatalar.",
    ogTitle: "Vizesiz, e-Vize, varışta vize: fark ne?",
    ogDescription: "Beş giriş kategorisi, her birinin gerçekte ne gerektirdiği ve yolcuların geri çevrilmesine yol açan hatalar.",
  },
  "/passport-validity/": {
    title: "Pasaport Geçerlilik Kontrolü: 6 ay kuralı, ülkeye göre · travelnow.info",
    description: "Pasaportun kabul edilecek mi? Varış ülkesine göre pasaport geçerlilik kuralları (Schengen'de 3 ay, Asya, Orta Doğu ve Afrika'nın çoğunda 6 ay). Pasaportunun bitiş tarihini gir, her ülke için net bir ✓ ya da ✗ gör.",
    ogTitle: "Pasaport Geçerlilik Kontrolü: ülkeye göre 6 ay kuralı",
    ogDescription: "Uçağa alınmama riskine karşı her ülkenin pasaport geçerlilik kuralını kontrol et ve pasaportunun uygun olup olmadığını gör.",
  },
  "/schengen-calculator/": {
    title: "Schengen 90/180 Gün Hesaplayıcı: ücretsiz, anında · travelnow.info",
    description: "Ücretsiz Schengen kısa kalış hesaplayıcı. Geçmiş seyahatlerini ekle, son 180 günde 90 günün kaçını kullandığını tam olarak gör ve kuralın içinde kalacak şekilde gelecek seyahatleri planla.",
    ogTitle: "Schengen 90/180 Gün Hesaplayıcı",
    ogDescription: "Schengen kısa kalış günlerini takip et, kuralı çiğnemeden gelecek seyahatleri planla.",
  },
  "/visa-checklist/tr-schengen/": {
    title: "Türk Vatandaşları için Schengen Vize Kontrol Listesi (2026) · travelnow.info",
    description: "2026'da Türk pasaportu sahipleri için eksiksiz Schengen Tip C turist vizesi belge listesi. Sigorta, mali belgeler, çalışma yazıları, biyometrik randevu, her kalem resmî kaynaklarıyla.",
    ogTitle: "Schengen Vize Kontrol Listesi: Türk Vatandaşları 2026",
    ogDescription: "Türkiye'den Schengen turist vizesi için gereken tüm belgeler; çalışan, serbest çalışan, öğrenci, emekli ve reşit olmayanlar için koşullu kurallarla.",
  },
  "/visa-shortcuts/": {
    title: "Vize Kestirmeleri: elindeki vizelerle daha kolay vize yolları · travelnow.info",
    description: "ABD, Birleşik Krallık, İrlanda veya Schengen vizesi taşımak, normalde tam vize gerektirecek ülkelere vizesiz ya da e-Vize ile girişe çoğu zaman imkân verir. Her kestirmenin pasaporta göre gezilebilir dizini.",
    ogTitle: "Vize Kestirmeleri: elindeki vizelerle daha kolay giriş",
    ogDescription: "Hindistan pasaportu + ABD vizesi = Türkiye e-Vizesi. Çin pasaportu + Schengen vizesi = Meksika vizesiz. Her kestirme, pasaporta göre.",
  },
};
