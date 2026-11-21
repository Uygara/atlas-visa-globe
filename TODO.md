# travelnow.info: açık işler

> Güncelleme: 2026-10-06 · **Yalnızca açık işler.** Biten iş silinir; ne yapıldığı `STATE.md`'de. Öncelik: **P1**
> sıradaki, **P2** yakında, **P3** sonra. Kurallar ve oturum rutini `CLAUDE.md`'de. Mobil: `MOBILE-SETUP.md`.
> Oturum başında: `node tools/analytics-report.js` (GA4 + Search Console, ~40 satır).

## ▶ Yeni oturumda buradan başla

0. **Özellik işleri `docs/ROADMAP.md`den** (Aşama 0 → 3). Sıradaki: **D10 doğruluk denetimi devamı** (ROADMAP): günlük denetimin 4 uyarısı (dijital göçebe vizeleri, pasaport geçerlilik
   kuralları, TR Schengen kontrol listesi, davet mektubu kuralları: resmî siteler bot engelliyor, tarayıcı panelinden oku);
   yatırımla vatandaşlıkta "Source (report)" satırlarını resmî sayfayla doğrula (GD, PT, GR, TR, EG, JO, KH, NR); BAE, Güney Kore ve Çin listeleri, ücretlerin resmî sayfalardan yeniden girilmesi
   (`verified` alanı), Nauru. Günlük denetim `node tools/audit-data.js`; sorun çıkarsa GitHub'da "data-audit" issue açılır.
   31 Aralık 2026: Kore K-ETA muafiyeti ve Çin vizesiz uygulaması bitiyor, uzatılmış mı bak. A3 paylaşılabilir kartlar. D6 İpek'te. iVisa canlı (19 Kasım): GA4'te
   `affiliate_click` olayını izle, 19 Aralık'ta tıklama ve sipariş sayısını yaz. 17 Aralık'ta `/visa/` sayfalarının etkisini ölç
   (`docs/autopilot-log.md` en üst kayıt).
1. **Android test APK'sını telefonda dene**: GitHub → Actions → "Android build" → son çalışma → `travelnow-debug-apk`.
   Telefonda "bilinmeyen kaynaklardan yükleme"ye izin verip kur. Hata/izlenim varsa yaz, düzeltirim.
2. **Google Play hesabı** açıldıysa: yükleme anahtarını üretip imzalı AAB'yi CI'dan alırım, kapalı test kanalını kurarız.
3. **AdMob** açıldıysa: uygulama kimliği ve banner birim kimliklerini bana ver, test kimliklerinin yerine koyarım.

## Senin yapacakların (hesap, ödeme, onay; benim yapamadıklarım)

- [ ] **P2 · E-posta adresleri herkese açık depoda (İpek ile birlikte, 2 dk)**: depo herkese açık ve her commit'te
      yazanın e-postası görünüyor. GitHub → Settings → Emails → "Keep my email addresses private" işaretle, sonra
      kendi bilgisayarında: `git config --global user.email "<GitHub'ın verdiği ...@users.noreply.github.com adresi>"`.
      Eski commit'lerdeki adres kalır. Depoyu gizliye almak da bir seçenek (Settings → General → Danger Zone);
      Cloudflare ve GitHub Actions çalışmaya devam eder, ama Actions ücretsiz dakikası ayda 2000'e iner.
- [ ] **P2 · Türkiye için çerez onayı**: Türkiye'den gelenlere artık yalnızca kişiselleştirilmemiş reklam gidiyor
      (04211e5e7), ama Google bunlarda da çerez kullanabiliyor. Tam çözüm bir onay penceresi; e-posta listesi
      açılmadan önce KVKK, VERBİS ve aydınlatma metnini bir hukukçuya bir kez kontrol ettir.

- [ ] **P1 · iVisa ödeme bilgisi (5 dk)**: ivisa.com/affiliates → giriş → Account → ödeme yöntemi (PayPal) ve bilgiler.
      Ödeme ayın 15'inde, en az 50 $ birikince yapılır. Komisyon oranını aynı sayfadaki şartlardan bana yaz.
      İsteğe bağlı: Assets → "Generate Custom Deep link" ile en çok ziyaret alan 5 ülke sayfası (ABD, Schengen,
      İngiltere, Kanada, Hindistan e-vize) için bağlantı üret, bana ver; ülke sayfalarında genel bağlantının yerine koyarım.
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
- [ ] **P2 · İkinci editör**: `docs/ONBOARDING.md` bölüm 1 (GitHub, GA, Search Console, Cloudflare davetleri).

- [ ] **P1 · GitHub gizli anahtarı (2 dk)**: github.com/Uygara/atlas-visa-globe → Settings → Secrets and variables →
      Actions → New repository secret → ad `FIREBASE_SERVICE_ACCOUNT`, değer: `.secrets/firebase-admin.json`
      dosyasının tüm içeriği. Bu olmadan günlük bildirimler gitmez (adım atlanır, hata vermez).
- [ ] **P1 · Firebase Console: telefonla giriş**: Authentication → Sign-in method → Phone → Etkinleştir; Settings →
      SMS region policy → yalnızca kullanıcı ülkeleri (sahte SMS maliyetine karşı). Kota dolarsa Blaze kararı senin.
- [ ] **P1 · Google Play Console hesabı (25 $)**: play.google.com/console, kişisel hesap, kimlik doğrulama. Yeni kişisel
      hesaplarda yayından önce **en az 12 test kullanıcısı 14 gün kesintisiz** kapalı testte olmalı: Android kullanan
      12 kişinin Gmail adresini topla. (Kuruluş hesabı bu şarttan muaf ama D-U-N-S numarası ister.)
- [ ] **P1 · AdMob hesabı**: admob.google.com, aynı Google hesabı. Bir Android uygulaması ekle ("henüz yayında değil"),
      bir Banner birimi oluştur; uygulama kimliğini ve birim kimliğini bana ver. Yayından sonra mağaza kaydına bağla.
- [ ] **P2 · Canlıda Google ile giriş (1 dk)**: travelnow.info/account/ → "Continue with Google". Açılır pencere
      otomatik test edilemiyor.
- [ ] **P2 · AdSense onaylanınca**: AdSense → Privacy & messaging → Avrupa (GDPR) mesajını aç. Gizlilik metni AB/BK/İsviçre
      için kişiselleştirilmiş reklamdan önce onay istendiğini söylüyor; bu açılmadan reklam o bölgede gösterilmemeli.
- [ ] **P3 · Apple Developer (99 $/yıl)**: Android'den sonra. Sonra Mac'te iOS derlemesi + Apple ile Giriş.

## Benim yapacaklarım

- [ ] **P3 · Birkaç Türkçe çeviri boşluğu**: hakkında sayfasının giriş paragrafı ve Schengen hesaplayıcıda iki cümle hiç
      çevrilmemiş (`node scripts/build-tr.js --todo`). `data/travel-advisories.js` resmi metin alıntısı; tireler orada kalır.
- [ ] **P1 · Play yükleme anahtarı + imzalı AAB**: Play hesabı açılınca. Anahtar `.secrets/`'ta kalır; sen 4 GitHub gizli
      anahtarı eklersin (`ANDROID_UPLOAD_*`), CI `travelnow-release-aab` üretir. Play App Signing açık olacak.
- [ ] **P2 · Mağaza ekran görüntüleri**: app/www'den headless Chrome ile, EN + TR, 6 adet (`store/play-listing.md` sonu).
- [ ] **P2 · Bildirim kuralı 3: son başvuru hatırlatması** (`applyPlan()` mantığı `backend/dispatch-push.js`'e).
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
