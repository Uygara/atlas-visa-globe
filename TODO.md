# travelnow.info: açık işler

> Güncelleme: 2026-11-27 · **Yalnızca açık işler.** Biten iş silinir; ne yapıldığı `STATE.md`'de. Öncelik: **P1**
> sıradaki, **P2** yakında, **P3** sonra. Kurallar ve oturum rutini `CLAUDE.md`'de. Mobil: `MOBILE-SETUP.md`.
> Oturum başında: `node tools/analytics-report.js` (GA4 + Search Console, ~40 satır).

## ▶ Yeni oturumda buradan başla

0. **Özellik işleri `docs/ROADMAP.md`den** (Aşama 0 → 3). Sıradaki: **D10 doğruluk denetimi devamı** (ROADMAP): dijital göçebe vizelerinin kalan 31 programı (resmî sayfalar bot engelliyor, tarayıcı panelinden oku;
   denetim uyarısı bunu bekliyor);
   resmî başvuru bilgilerini (`data/official-sources.js`, şu an 15 kayıt + Schengen) sıradaki ülkelere genişlet (liste ROADMAP D10);
   yatırımla vatandaşlıkta "Source (report)" satırlarını resmî sayfayla doğrula (GD, PT, GR, TR, EG, JO, KH, NR); BAE, Güney Kore ve Çin listeleri, Nauru. 31 Aralık 2026'da İrlanda'nın İngiltere vizesi programı ve Kuzey Makedonya'nın vize/oturum muafiyeti de bitiyor (denetim uyarır). Günlük denetim `node tools/audit-data.js`; sorun çıkarsa GitHub'da "data-audit" issue açılır.
   31 Aralık 2026: Kore K-ETA muafiyeti ve Çin vizesiz uygulaması bitiyor, uzatılmış mı bak. D6 İpek'te. Bildirimler canlı (27 Kasım): `node tools/usage-report.js` ile push cihaz sayısını izle;
   ROADMAP R6'nın kalanı (rehberlerde "bildirim al"), A3 ölçümü (GA4 `share_answer`), R5 deneyimleri (`node tools/experiences-review.js`). iVisa canlı (19 Kasım): GA4'te
   `affiliate_click` olayını izle, 19 Aralık'ta tıklama ve sipariş sayısını yaz. 17 Aralık'ta `/visa/` sayfalarının etkisini ölç
   (`docs/autopilot-log.md` en üst kayıt).
   Transit haritası (27 Kasım): Schengen ATV listeleri ülke bazında; Annex 7B yeni sürüm çıkınca (udiregelverk.no annex-07)
   `SCHENGEN_NATIONAL_ATV`'yi güncelle. Takip edilmeyen hub'lar (AU, NZ, MX, IE, KR…) gri; resmî kaynakla eklenebilir.
1. **Android test APK'sını telefonda dene**: GitHub → Actions → "Android build" → son çalışma → `travelnow-debug-apk`.
   Telefonda "bilinmeyen kaynaklardan yükleme"ye izin verip kur. Hata/izlenim varsa yaz, düzeltirim.
2. **Google Play hesabı** açıldıysa: yükleme anahtarını üretip imzalı AAB'yi CI'dan alırım, kapalı test kanalını kurarız.

## Senin yapacakların (hesap, ödeme, onay; benim yapamadıklarım)

- [ ] **P3 · Google Ads (karar senin)**: hesap 646-445-2494 açık ama kampanya yok, ödeme yöntemi yok, para çıkmaz.
      Google'ın "300 $ kredi"si önce aynı tutarda harcama ister; bedava değil. Harcamak istersen plan hazır:
      `docs/ads/google-ads-plan.md` (anahtar kelimeler, reklam metni, günde 10 $). Bana "Google Ads'i kur" de.
- [ ] **P2 · E-posta adresleri herkese açık depoda (İpek ile birlikte, 2 dk)**: depo herkese açık ve her commit'te
      yazanın e-postası görünüyor. Senin GitHub'ında "Keep my email addresses private" zaten açık; kalan tek adım kendi
      bilgisayarında: `git config --global user.email "58884301+Uygara@users.noreply.github.com"`. İpek de aynısını yapmalı.
      Eski commit'lerdeki adres kalır. Depoyu gizliye almak da bir seçenek (Settings → General → Danger Zone);
      Cloudflare ve GitHub Actions çalışmaya devam eder, ama Actions ücretsiz dakikası ayda 2000'e iner.
- [ ] **P2 · Türkiye için çerez onayı**: Türkiye'den gelenlere artık yalnızca kişiselleştirilmemiş reklam gidiyor
      (04211e5e7), ama Google bunlarda da çerez kullanabiliyor. Tam çözüm bir onay penceresi; e-posta listesi
      açılmadan önce KVKK, VERBİS ve aydınlatma metnini bir hukukçuya bir kez kontrol ettir.

- [ ] **P2 · iVisa komisyon oranı (1 dk)**: ödeme bilgisi girildi (27 Kasım). ivisa.com/affiliates'ta oturum açıkken
      gerçek komisyon oranını bana yaz (herkese açık sayfa "en fazla %20", ilk tıklama, 365 gün çerez diyor). İsteğe bağlı:
      Assets → "Generate Custom Deep link" ile ABD, Schengen, İngiltere, Kanada, Hindistan e-vize bağlantıları; ülke sayfalarına koyarım.
- [ ] **P1 · E-posta bildirimleri için Resend (ücretsiz plan)**: resend.com → kayıt → Domains → travelnow.info ekle →
      verdiği DNS kayıtlarını Cloudflare → DNS'e gir → API Keys → Create (Sending access) → GitHub → Settings →
      Secrets → Actions → `RESEND_API_KEY`. Pasaport bazlı uyarılar (ROADMAP R1) bunu bekliyor.
- [ ] **P1 · Instagram'ı siteye bağla (15 dk, ücretsiz)**: böylece onayladığın gönderiler kendiliğinden paylaşılır.
      1) Instagram uygulaması → Ayarlar → Hesap türü → Profesyonel hesaba geç → "Creator" ya da "Business".
      2) developers.facebook.com → My Apps → Create app → "Other" → "Business" türü → ad: travelnow-publisher.
      3) Uygulamada Instagram ürününü ekle → "API setup with Instagram login" → "Generate access tokens" → "Add
         account" ile @travelnow.info'yu ekle (izinler: instagram_business_basic, instagram_business_content_publish,
         instagram_business_manage_comments) → "Generate token". Uygulamayı yayına almak ya da App Review gerekmez.
      4) Çıkan uzun anahtarı iki yere koy: GitHub → Settings → Secrets → Actions → `IG_TOKEN`, ve bilgisayarda
         `.secrets/instagram-token.txt`. Sonra bana "Instagram bağlandı" yaz; `node scripts/ig-publish.js --check`
         ile denerim. Şifre paylaşmana gerek yok.
- [ ] **P1 · Yeni stildeki 4 Instagram gönderisini onayla**: `social/queue/` (24, 26, 28 Kasım, 5 Aralık); görseller yenilendiği için onay sıfırlandı.
- [ ] **P3 · GA4'te hatalı özel boyut (10 sn)**: Özel tanımlar listesinde "passport destination via method platform"
      adlı, `campaign` parametresine bağlı bir boyut var (beş doğru boyut ayrıca kuruldu). Arşivlemek geri alınamadığı için
      bıraktım; satırdaki üç nokta → Archive. Zararı yok, yalnızca listede kafa karıştırır.
- [ ] **P2 · İkinci editör**: `docs/ONBOARDING.md` bölüm 1 (GitHub, GA, Search Console, Cloudflare davetleri).

- [ ] **P1 · Google Play Console hesabı (25 $)**: play.google.com/console, kişisel hesap, kimlik doğrulama. Yeni kişisel
      hesaplarda yayından önce **en az 12 test kullanıcısı 14 gün kesintisiz** kapalı testte olmalı: Android kullanan
      12 kişinin Gmail adresini topla. (Kuruluş hesabı bu şarttan muaf ama D-U-N-S numarası ister.)
- [ ] **P2 · AdMob mağaza bağlantısı (yayından sonra)**: AdMob → Apps → travelnow Android/iOS → Add store. Bağlanana kadar
      "Limited ad serving" görünür. Uygulamalar, Banner birimleri ve AB onay (GDPR) mesajı 27 Kasım'da kuruldu.
- [ ] **P2 · Canlıda Google ile giriş (1 dk)**: travelnow.info/account/ → "Continue with Google". Açılır pencere
      otomatik test edilemiyor.
- [ ] **P1 · AdSense yeniden başvuru (14 Aralık'tan önce)**: AdSense 14 Kasım'da "hesap 30 gün içinde etkinleştirilmezse
      devre dışı kalır" e-postası gönderdi (yaklaşık 14 Aralık). Devre dışı kalırsa yeniden etkinleştirilebilir, ama 10-13 Aralık
      arası başvurmak daha temiz. Siteler sayfasında tek ret var: 17 Haziran, "Low value content"; ads.txt durumu o tarihten
      kalma "Not found" (dosya depoda var, başvuruyla yenilenir). Başvurmadan önce: Search Console →
      Sayfalar'da dizinlenen sayfa sayısına bak (sitemap 22-23 Kasım'da gönderildi), site adresi AdSense'te `travelnow.info`
      (www değil) olmalı. www yönlendirmesi 22 Kasım'da düzeldi.
- [ ] **P2 · AdSense onaylanınca**: AdSense → Privacy & messaging → Avrupa (GDPR) mesajını aç. Gizlilik metni AB/BK/İsviçre
      için kişiselleştirilmiş reklamdan önce onay istendiğini söylüyor; bu açılmadan reklam o bölgede gösterilmemeli.
- [ ] **P3 · Apple Developer (99 $/yıl)**: Android'den sonra. Sonra Mac'te iOS derlemesi + Apple ile Giriş.

## Benim yapacaklarım

- [ ] **P3 · Birkaç Türkçe çeviri boşluğu**: hakkında sayfasının giriş paragrafı ve Schengen hesaplayıcıda iki cümle hiç
      çevrilmemiş (`node scripts/build-tr.js --todo`). `data/travel-advisories.js` resmi metin alıntısı; tireler orada kalır.
- [ ] **P1 · Reklam onayını geri alma düğmesi (mağazadan önce)**: AdMob GDPR mesajı yayında; AB kuralı kullanıcının onayı
      sonradan değiştirebilmesini istiyor. Uygulamada "Reklam gizliliği" bağlantısı → `AdMob.showPrivacyOptionsForm()` (yalnızca
      `privacyOptionsRequirementStatus` REQUIRED iken göster). iOS için AdMob'da IDFA açıklama mesajı da iOS derlemesiyle birlikte.
- [ ] **P1 · Play yükleme anahtarı + imzalı AAB**: Play hesabı açılınca. Anahtar `.secrets/`'ta kalır; sen 4 GitHub gizli
      anahtarı eklersin (`ANDROID_UPLOAD_*`), CI `travelnow-release-aab` üretir. Play App Signing açık olacak.
      Telefonla giriş Android'de çalışsın diye yükleme ve Play imza anahtarlarının SHA-1'ini Firebase → Proje ayarları →
      Android uygulamasına ekle (Phone sağlayıcısı 27 Kasım'da açıldı, SMS yalnızca 24 ülkeye izinli).
- [ ] **P2 · Mağaza ekran görüntüleri**: app/www'den headless Chrome ile, EN + TR, 6 adet (`store/play-listing.md` sonu).
- [ ] **P2 · Rehber yazıları**: Search Console'daki aramalar çoğunlukla "<ülke> passport visa free countries". Pasaport
      sayfaları bunu hedefliyor; ek olarak ESTA/eTA/UK ETA/ETIAS karşılaştırması (ücret ve tarih yazmadan) ve
      "e-Vize sahte siteleri" yazıları.
- [ ] **P2 · Uygulamada veri tazeliği**: veri pakette; mağaza güncellemesi olmadan yenilemek için veriyi JSON olarak indirme.
- [ ] **P3 · "beta" etiketini kaldırma kararı**: es/de/fr/ar ajan incelemesinden geçti ve sözlük tam; pasaport sayfalarının
      gövde metni hâlâ yalnızca EN/TR. İstersen etiketi kaldırırım.
- [ ] **P3 · Telefon formu**: gönderim sürerken diğer giriş formları da kilitleniyor (`run()` ortak `busy`).
- [ ] **P3 · Ekran okuyucu turu**, **Türkçe ikizler için CI denetimi** (`build-tr.js --check` Actions adımı).

- [ ] **P2 · Kütüphaneleri kendi sunucuna al**: d3, react, topojson `unpkg`'den, bayrak yazı tipi jsDelivr'den geliyor.
      Uygulama paketi bunları zaten yerel kopyalıyor (`app/build-www.js`); sitede de aynısı hız, kesintiye dayanıklılık
      ve ziyaretçi IP'sinin üçüncü tarafa gitmemesi için iyi olur. Babel/SRI kullanımına dikkat.
- [ ] **P2 · og:image eksik sayfalar**: hakkında, iletişim, pasaport dizini, gizlilik, koşullar (+ TR ikizleri), `404.html` açıklaması.
- [ ] **P2 · Search Console'da site haritası "hiç okunmadı"**: günlük raporda `read never`. Birkaç gün sonra hâlâ öyleyse
      yeniden gönder ve kapsam raporuna bak.
- [ ] **P2 · Trafik düşüşü**: son 7 günde kullanıcı -%43 (99), etkileşim %28. Tek kaynak ABD ve doğrudan trafik; rehber
      yazıları ve pasaport sayfaları ana kaldıraç (yukarıdaki "Rehber yazıları" maddesi).
- [ ] **P3 · Uygulama cilası (cihazda test sonrası)**: dokunma alanı ≥44 px taraması, klavye açılınca alan örtülmesi,
      boş ekran metinleri (izleme listesi, planlanan gezi), hata ve çevrimdışı durumlar, hafif titreşim (haptics).

## Veri ve içerik

- [ ] **P2 · Vize ücreti verisi**: 80 çift; yüksek trafikli rotalar için genişlet.
- [ ] **P3 · Güvenlik haritası: ABD düzyazısı**: TR, IN gibi ülkelerde ABD paragrafları bölge notu gibi görünüyor.
- [ ] **P3 · Pasaport türleri: koşullu girişler** ("(biometric only)" satırları şu an dışarıda).
