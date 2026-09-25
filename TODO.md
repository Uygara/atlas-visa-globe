# travelnow.info: açık işler

> Güncelleme: 2026-09-26 · **Yalnızca açık işler.** Biten iş silinir; ne yapıldığı `STATE.md`'de. Öncelik: **P1**
> sıradaki, **P2** yakında, **P3** sonra. Kurallar ve oturum rutini `CLAUDE.md`'de. Mobil: `MOBILE-SETUP.md`.
> Oturum başında: `node tools/analytics-report.js` (GA4 + Search Console, ~40 satır).

## ▶ Yeni oturumda buradan başla

1. **Android test APK'sını telefonda dene**: GitHub → Actions → "Android build" → son çalışma → `travelnow-debug-apk`.
   Telefonda "bilinmeyen kaynaklardan yükleme"ye izin verip kur. Hata/izlenim varsa yaz, düzeltirim.
2. **Google Play hesabı** açıldıysa: yükleme anahtarını üretip imzalı AAB'yi CI'dan alırım, kapalı test kanalını kurarız.
3. **AdMob** açıldıysa: uygulama kimliği ve banner birim kimliklerini bana ver, test kimliklerinin yerine koyarım.

## Senin yapacakların (hesap, ödeme, onay; benim yapamadıklarım)

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
- [ ] **P2 · Cloudflare analitik anahtarı (isteğe bağlı)**: dash.cloudflare.com → My Profile → API Tokens → Create
      Token → Custom → izin "Account · Account Analytics · Read" → metni `.secrets/cloudflare-token.txt` dosyasına kaydet.
- [ ] **P2 · AdSense onaylanınca**: AdSense → Privacy & messaging → Avrupa (GDPR) mesajını aç. Gizlilik metni AB/BK/İsviçre
      için kişiselleştirilmiş reklamdan önce onay istendiğini söylüyor; bu açılmadan reklam o bölgede gösterilmemeli.
- [ ] **P3 · Apple Developer (99 $/yıl)**: Android'den sonra. Sonra Mac'te iOS derlemesi + Apple ile Giriş.

## Benim yapacaklarım

- [ ] **P1 · Tire temizliğini bitir**: iki ajan çalışıyordu (A: SPA metinleri, B: sayfalar + Türkçe ikizler). Sonucu uygula,
      `node tools/lint-copy.js` 0 olsun, testler + push. Bundan sonra yeni metinde tire yok (CLAUDE.md).
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

## Veri ve içerik

- [ ] **P2 · Vize ücreti verisi**: 80 çift; yüksek trafikli rotalar için genişlet.
- [ ] **P3 · Güvenlik haritası: ABD düzyazısı**: TR, IN gibi ülkelerde ABD paragrafları bölge notu gibi görünüyor.
- [ ] **P3 · Pasaport türleri: koşullu girişler** ("(biometric only)" satırları şu an dışarıda).
