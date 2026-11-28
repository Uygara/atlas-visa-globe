# travelnow.info: özellik envanteri

> Otopilot (`docs/AUTOPILOT.md`) ve el ile yapılan oturumlar işi buradan seçer. Bir madde bitince durumu
> `bitti` olur ve commit hash'i yazılır; tamamen bitenler bir ay sonra silinir. Yeni fikirler en alta,
> "Değerlendirilecek" bölümüne eklenir ve aşağıdaki ilkelere göre puanlanıp yukarı taşınır.

## İlkeler (her yeni özellik bu sorulardan geçer)

1. **Geri dönme sebebi.** Ziyaretçi bir kez gelip cevabını alıp gidiyor. Her özellik "bu kişi gelecek hafta
   neden tekrar gelsin?" sorusuna cevap vermeli. Tek seferlik bilgi sayfası, takip edilebilir bir şeye bağlanmalı.
2. **Pasaport kimliktir.** Kullanıcıyı pasaportuyla tanırız. Haber, uyarı ve öneri o pasaport için süzülür:
   Malezya pasaportu seçen kişi yalnızca Malezyalıları etkileyen değişikliği görür.
3. **Bilgi kullanıcıya gider.** Kullanıcının siteye bakmasını beklemeyiz; değişiklik olunca e-posta ve uygulama
   bildirimi gider. Her sayfada "bunu takip et" yolu vardır.
4. **Taze ve kaynaklı.** Her değişikliğin tarihi ve kaynağı görünür. Veri uydurulmaz; kaynağı olmayan bilgi yazılmaz.
5. **İnsanların deneyimi değerlidir.** Resmi kural ile sahadaki gerçek farklı olabilir. Kullanıcıların yazdığı
   deneyimler bu boşluğu doldurur, ama açıkça "kullanıcı deneyimi" diye etiketlenir ve denetlenir.
6. **Ücretsiz ve kendi kendine.** Para gerektirmeyen, elle bakım istemeyen çözüm seçilir. Sahibinden istenen
   adım (hesap, DNS, gizli anahtar) varsa `TODO.md` "Senin yapacakların"a tam komutuyla yazılır.

## Sıra

> **27 Kasım – 27 Aralık 2026: gelir testi, yeni özellik yok.** Schengen sigortası (AXA Schengen) ve randevu alarmı
> bekleme listesi canlıda; karar ölçütleri `docs/revenue-test.md`. Bu sürede aşağıdaki işlerden yalnızca veri doğruluğu
> (D10) ve hata düzeltmeleri yapılır.

Durum: `açık` · `sürüyor` · `bekliyor: <neyi>` · `bitti <hash>`

### Aşama 0: arama trafiği (gerekçe: `docs/GROWTH-ANALYSIS.md`)

- **D1 · Hedef ülke sayfaları `/visa/<kod>/`** · bitti 2e353afe1 · "<Ülke> visa requirements" aramalarında 13 bin
  gösterim, 0 tık. Pasaport seçme denetleyicisi, durum listeleri, "gitmeden önce" bloğu, SSS, EN + TR.
- **D2 · Pasaport sayfası başlıkları** · bitti 8ce7a3ffe · "<Ülke> passport: N countries without a visa (2026)",
  TR "<ülke> pasaportu ile vizesiz gidilen ülkeler". 4 hafta sonra Search Console'da karşılaştır.
- **D7 · AdSense betiğini geciktir** · bekliyor: AdSense onayı · İnceleme sırasında Google kodu `<head>`de arıyor;
  onaydan önce geciktirmek başvuruyu riske atar. Onaydan sonra ilk kaydırmada yükle.
- **D5 · Aylık pasaport gücü raporu** · bitti 2e353afe1 (kart görselleri A4'te) · `/reports/<yyyy-mm>/`, changelog'dan otomatik, EN + TR, Instagram
  ve Reddit için kart görselleri. Geri dönme sebebi ve bağlantı kazanma aracı.
- **D4 · Açık veri seti** · bitti 493be8162 · `/open-data/` + günlük CSV/JSON, CC BY-SA 4.0 (Wikipedia'dan türediği için).
- **D3 · Schengen hesaplayıcı: "ne zaman tekrar girebilirim"** · bitti (2026-11-19) · Tek tık cevap, paylaşılabilir bağlantı,
  EES ve ETIAS açıklaması (resmi kaynaklı). Yapıldı: "ne zaman tekrar gidebilirim" kartı, #trips= paylaşım bağlantısı,
  EES bölümü (travel-europe.europa.eu). Ölç: GA `schengen_share` olayı.
- **D6 · Gömülebilir vize denetleyicisi** · sürüyor · `<iframe>` veya küçük betik, altında bağlantı.
  Adım 1 (2026-11-20): `/embed/?to=&from=&lang=` sayfası, `_headers` ile çerçeveye izin, `/open-data/` üzerinde kod
  parçası. Adım 2 (2026-11-23): `/visa/<kod>/` sayfalarında (EN + TR) "bu kutuyu sitene ekle" bloğu. Sıradaki: GA4te `utm_source=embed` ölçümü (4 hafta sonra).
- **D8 · Veri kalitesi: varış formu eVisa sanılıyor** · kısmen bitti 5d853b274 · Maldivler'de ücretsiz IMUGA beyanı eVisa
  sayılıyordu; 140 pasaport yanlış görünüyordu (bc897c2c9 ile düzeldi). Aynı kalıp Tayland (TDAC), Kolombiya
  (Check-MIG) ve başkalarında olabilir; kaynaklı denetim `visa-data-auditor` ile. Kalıcı çözüm: scraper'da
  "arrival card / declaration" notunu eVisa saymamak. Kök neden bulundu: "Free visa on arrival" içindeki "e visa"
  (Palau, Gana, Lübnan, Tonga, BAE); scraper düzeltildi. Kalan, resmi kaynakla doğrulanacak pasaport listeleri
  (yalnızca Wikipedia'ya dayanıyor): Zambiya varışta vize 28 pasaport, Ermenistan 19, Moğolistan IN/KW,
  Kırgızistan ID/PH/ZA/VE, Ruanda herkese varışta vize, Lesotho e-vize portalı kapalı olabilir. Ayrıntı ve
  kaynaklar: otopilot `visa-data-auditor` ile yeniden üretir. Tayland, Kolombiya, Arnavutluk doğru (gerçek eVisa).
  ETA (2026-11-21): ABD, Kanada, Avustralya, Yeni Zelanda ve Birleşik Krallık için "eVisa → ETA" etiketi artık
  yalnızca resmî listelerdeki pasaportlara uygulanıyor (`ETA_ELIGIBLE`, `UK_VISA_NATIONALS`); 79 pasaport-ülke
  çifti düzeldi. Açık: Kanada'nın koşullu eTA ülkeleri (ABD vizesi varsa eTA) için ülke kartında not.

### Aşama 1: sahibinden bir şey gerektirmeyenler

- **R3 · Güvenlik uyarısı geçmişi** · bitti 3081d892d · `backend/fetch-advisories.js` her gün tarihli özet
  kaydeder (`data/advisory-history/`), böylece haftalık fark çıkarılabilir. Zamana duyarlı: geçmiş ne kadar erken
  birikmeye başlarsa R4 o kadar erken çalışır.
- **R2 · Yan panelde ülke haber akışı** · bitti 493be8162 (uyarı değişiklikleri ikinci günlük kayıtla dolmaya başlar) · Ülke kartında "Son değişiklikler": bu ülkenin pasaportunu ve bu
  ülkeye girişi etkileyen vize değişiklikleri (`data/changelog.js`), bu ülke hakkında yayımlanan güvenlik uyarısı
  değişiklikleri (R3) ve haberler (`data/visa-news.js`, şu an yalnızca 3 madde; kaynakları genişlet).
  Her maddede tarih ve kaynak bağlantısı. Seçili pasaporta göre süzülür.
- **A2 · Ortaklık metni** · bitti ec6d36259 · iVisa kutusundaki "devlet onaylı, 5–30 $" ifadesi kaynaksızdı; kaldırıldı.
  Ortak bağlantılar "partner link" olarak etiketlenir.

### Aşama 2: takip ve bildirim (sahibinden bir adım bekler)

- **R1 · Pasaporta göre takip** · bildirim kısmı canlı (2026-11-27, `FIREBASE_SERVICE_ACCOUNT` eklendi: web + uygulama push, pasaporta ve izleme listesine göre); e-posta kısmı bekliyor: Resend · Pasaport + istenen ülkeler seçilir; o pasaport için
  bir ülkenin kuralı değişince e-posta ve uygulama bildirimi gider. Eski `functions/api/` abonelik ve Stripe kodu
  2026-11-21'de silindi: site Workers'ta yalnızca statik dosya olarak yayında, o kod hiç çalışmıyordu (git geçmişinde
  duruyor). Abonelik uç noktası yeniden yazılacak. Altyapı var ama canlı değil:
  `backend/dispatch-alerts.js` (Resend + Cloudflare KV, ülke bazlı), `backend/dispatch-push.js` (FCM). Yapılacak:
  Firebase hesabındaki pasaport + izleme listesini tek abonelik kaynağı yapmak, değişiklikleri pasaporta göre
  süzmek, girişsiz e-posta aboneliği (çift onaylı), her e-postada tek tık abonelikten çıkma. Tercih: aboneleri
  Cloudflare KV yerine Firestore'da tutmak; böylece sahibinden yalnızca `RESEND_API_KEY` ve
  `FIREBASE_SERVICE_ACCOUNT` gizli anahtarları istenir (ikisi de `TODO.md`de).
- **R6 · "Takip et" düğmeleri** · kısmen bitti (2026-11-27) · Harita ülke kartında izleme yıldızı zaten vardı. `/visa/<kod>/` ve
  `/passport/<kod>/` (EN + TR) artık `/alerts/?watch=` ve `?p=` bağlantısı veriyor; sayfa ülkeyi listeye ekler, pasaportu yalnızca boşsa
  doldurur. Kalan: rehberler. Ölç: `/alerts/` girişleri (GA4).
- **R4 · Haftalık güvenlik özeti** · R1 + R3'e bağlı · Pasaportu veren devletin yayımladığı uyarılardan o hafta
  değişenler: "Bu hafta Birleşik Krallık, Türkiye'nin şu bölgelerine seyahati önermemeye başladı". Kapsanan
  kaynaklar: Birleşik Krallık FCDO, ABD, Kanada, Türkiye Dışişleri. Diğer pasaportlar için bu kaynakların
  özeti, açıkça "senin hükümetinin değil, şu ülkenin uyarısı" diye. Yeni kaynak eklemek ayrı madde (R4b).
- **A1 · Tek haftalık özet e-postası** · R1 + R4'e bağlı · Vize değişiklikleri, güvenlik özeti ve deneyimler tek
  e-postada. Kişi başına haftada en çok bir e-posta (acil değişiklik hariç).

### Aşama 3: topluluk

- **R5 · Deneyim paylaşımı** · bitti 2026-11-27, kurallar yayınlanınca açılır (bekliyor: hizmet hesabına Rules Admin rolü, `TODO.md`) · Harita ülke kartında kapalı "Gezgin deneyimleri" kutusu; `firestore.rules` + 26 emülatör testi, `.github/workflows/firestore-rules.yml`, haftalık `experiences-review.yml`. Ekran görüntüsü yükleme bilerek yok (pasaport numarası ve ad sızar). İlk tasarım: Pasaport → ülke çifti için kullanıcıların başvuru deneyimi
  (ne zaman, hangi yolla, kaç gün sürdü, ne sordular). Yan panelde blog benzeri akış. Kurallar: yalnızca giriş
  yapmış kullanıcı yazar; bağlantı ve kişisel veri (telefon, e-posta, pasaport no.) otomatik engellenir; uzunluk ve
  sıklık sınırı; "bildir" düğmesi, 3 bildirimde gizlenir; otopilot her hafta gizlenenleri ve şüphelileri inceler.
  Her yazı "kullanıcı deneyimi, resmi kural değil" etiketiyle ve tarihiyle görünür. `firestore.rules`, gizlilik
  ve koşullar sayfaları (EN + TR) aynı committe güncellenir.

### Aşama 4: dağıtım

- **A3 · Paylaşılabilir sonuç kartları** · bitti (2026-11-27) · `/visa/<kod>/` denetleyicisinde "Bu cevabı paylaş": telefonda paylaşım
  menüsüyle 1080x1350 görsel + `?p=` bağlantısı, masaüstünde bağlantı kopyalanır (`assets/share-card.js`). Ölç: GA4 `share_answer`.
  Sonraki adım ancak ölçüm gösterirse: `?p=` bağlantıları için çifte özel og:image (şu an genel görsel).
- **A4 · Instagram içerik hattı** · kısmen bitti (`scripts/social-cards.js`, aylık carousel + pasaport kartı) · Her hafta `changelog`dan otomatik gönderi taslakları (görsel + metin,
  EN + TR) `content/instagram/<tarih>/` klasörüne. Paylaşımı insan yapar.
- **A5 · Pasaport başına değişiklik akışı (RSS/JSON)** · bitti (2026-11-21) · `/passport/<kod>/feed.xml` ve
  `/tr/passport/<kod>/feed.xml`, `generate-seo.js` her gün yeniden yazar; pasaport sayfasında bağlantı ve
  `<link rel="alternate">`. Yalnızca haritanın hâlâ gösterdiği değişiklikler girer.
- **D9 · Changelog'da geri dönmüş kayıtlar** · bitti (2026-11-21) · `computeChangelog` listede olmayan ülkeyi "vr"
  sayıyordu, oysa pasaportun varsayılanı (ABD: vizesiz) geçerli; ABD → Letonya gibi olmayan değişiklikler yazıldı.
  Artık varsayılan kullanılıyor; her çalıştırmada `reconcile()` en yeni kaydı veriyle ve haritanın gösterdiğiyle
  uyuşmayan çiftleri siliyor (322 → 310). Test: `node backend/test-changelog.js`. Bu sırada bulunan veri hatası:
  Hindistan, Ukrayna, Moldova, Arnavutluk, Sri Lanka ve Bangladeş Birleşik Krallık için "ETA" görünüyordu; resmî
  vize vatandaşı listesine göre vize gerekli (`UK_VISA_NATIONALS`, `data/visa-overrides.js`).
- **D10 · Resmî kaynaklarla doğruluk denetimi** · sürüyor (2026-11-21) · İlke: haritanın gösterdiği her kural ya resmî
  listeyle tutarlı ya da gösterilmiyor. Bitti: Schengen (AB Ek II, 29 ülke), Birleşik Krallık, ABD, Kanada, Avustralya,
  Yeni Zelanda, Türkiye, Japonya, Tayland (Dışişleri listeleri, 15 Eylül 2026), ETIAS, ESTA; Wikipedia'dan çıkarılan koşullar ve doğrulanmamış ücretler kaldırıldı;
  günlük denetim `tools/audit-data.js` (sorun olursa "data-audit" issue). Kalan: BAE, Güney Kore, Çin, Hindistan e-vize listesi; ücretleri resmî sayfalardan `verified` tarihiyle yeniden girmek;
  Nauru'nun AB anlaşması yürürlükte mi.
  2026-11-27: oturum izni/vize ile giriş tablosu denetlendi (Grönland hatası düzeltildi, 40'a yakın dayanaksız satır
  kaldırıldı); aynı gün Gürcistan, Kolombiya, Fas, Körfez oturumu (artık hangi Körfez ülkesi seçiliyor) ve İrlanda'nın
  İngiltere vizesi programı (31 Aralık 2026'ya kadar) da eklendi.
  2026-11-27 (2): resmî başvuru bilgileri `data/official-sources.js`'te: ülke başına resmî portal, ücret, işlem süresi,
  kalış, kaynak bağlantısı ve son kontrol tarihi; /visa/ sayfalarında "Resmî başvuru bilgileri" kutusu ve GovernmentService
  yapılandırılmış verisi. İlk set: İngiltere, ABD (ESTA), Kanada, Avustralya, Güney Kore, Hindistan, Mısır, Kenya, Vietnam,
  29 Schengen ülkesi. Eklendi (2-3. tur): Türkiye, Japonya, Tayland, Suudi Arabistan, Gürcistan, Endonezya, Sri Lanka, Brezilya. Sıradaki: BAE (u.ae metin vermiyor), Katar, Azerbaycan ve Kamboçya (bot doğrulaması),
  Yeni Zelanda (sayfa hata veriyor), Meksika; ABD B1/B2 ücreti (travel.state.gov bot doğrulaması istiyor).
  Kalite süreci önerisi: her kuralda kaynak bağlantısı + son kontrol tarihi (detay kartında görünür), kullanıcı
  "bu yanlış" bildirimi, denetim testinde bilinen cevaplar listesi büyür.

## Değerlendirilecek

- **B1 · Acentelere markalı vize denetleyicisi** · doğrulanıyor (2026-11-28) · `/for-agencies/` pilot talebi + İpek'in görüşmeleri
  (`docs/revenue-test.md`). 5 "öderim" çıkarsa: API anahtarı ve alan adı kilidi, logo/renk ayarı, her cevapta kaynak ve kontrol
  tarihi, ülke bazlı değişiklik e-postası, abonelik ödemesi. Aynı anahtar sistemi geliştirici API'sine de açılır.

- Uygulamada veri tazeliği (mağaza güncellemesi olmadan JSON indirme), `TODO.md`de de var.
- Başvuru son tarihi hatırlatması: bitti (2026-11-27), `dispatch-push.js` push olarak gönderiyor (bir hafta önce + günü geldiğinde).
  E-postası Resend bekliyor; eski `dispatch-reminders.js` Cloudflare KV'ye bağlı ve çalışmıyor, R1 e-posta işiyle birlikte silinmeli.
- Pasaport + ülke çifti sayfaları (`/visa/mv/in/`): "<ülke> visa for <uyruk>" aramaları için. Şu an 404. (ux-walker 2026-11-20)
  Karar (2026-11-27): 40 bin benzer sayfa ince içerik riski. 17 Aralık GSC ölçümünde `/visa/<kod>/` sayfaları dizinlenmişse, yalnızca
  çok aranan ~400 çift için, üst sayfada olmayan bir şeyle (ücret, kaynak, deneyim) ve geri kalanı noindex.
- (bitti 2026-11-27) `/visa/<kod>/` telefonda cevap zaten ilk ekranda; Schengen hesaplayıcı boşken önce "seyahat ekle" formu.
