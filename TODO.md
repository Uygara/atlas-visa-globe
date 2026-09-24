# travelnow.info — açık işler

> Güncelleme: 2026-09-24 (akşam: Firebase kuruldu) · **Yalnızca açık işler.** Biten iş bu listeden silinir; ne yapıldığı `STATE.md`'de
> tur notunda. Öncelik: **P1** sıradaki, **P2** yakında, **P3** sonra. Her oturum sonunda bu liste güncellenir
> (kurallar `CLAUDE.md`'de). Mobil ayrıntılar: `MOBILE-SETUP.md`.

## ▶ Yeni oturumda buradan başla

Firebase kuruldu ve canlıya çıktı: e-posta/şifre + Google açık, hesaplar sitede AÇIK, Firestore `eur3`'te,
kurallar yayında. Sıradaki:

1. **Telefonla giriş** — sen Console'da Phone'u açınca ben canlıda dener (gerçek numara gerekir; test numarası da olur).
2. **Apple ile Giriş** (App Store 4.8) — Apple Developer hesabı gelince.
3. **Mac'te ilk iOS derlemesi + gerçek cihaz turu** (Mac ve Apple hesabı gerekir; `MOBILE-SETUP.md` §3).

## Senin yapacakların

- [ ] **P1 · Canlıda Google ile giriş (1 dk)** — travelnow.info/account/ → "Google ile devam et". Açılır pencere
      etkileşimli olduğu için otomatik deneyemedim; `travelnow.info` yetkili alan adı olarak eklendi.
- [ ] **P1 · Firebase Console: telefon girişi** — Authentication → Sign-in method → **Phone** → Etkinleştir
      (CLI ile açılamıyor). Açarken **SMS bölge politikası** ayarla (yalnızca gerçek kullanıcı ülkeleri; aksi halde SMS
      dolandırıcılığına açık) ve SMS ücretsiz kotası dolarsa **Blaze** kararı senin.
- [ ] **P1 · Karar: e-posta uyarıları** — `/alerts/` formu canlıda 404 veriyor (`/api/subscribe` yok).
      Seçenekler: (a) formu gizle, (b) uyarıları hesaba/bildirime bağla (uygulamada push var, en doğrusu bu),
      (c) Cloudflare Worker + e-posta servisi kur. Önerim (b) + formu o zamana dek gizlemek.
- [ ] **P1 · Search Console** — yayından sonra sitemap'i yeniden gönder; `/tr/`, `/guides/`, `/safety-map/`
      için "dizine ekleme iste".
- [ ] **P2 · Push için GitHub gizli anahtarı** — Firebase Console → Proje ayarları → Hizmet hesapları → Yeni özel
      anahtar → JSON'un tamamını repo Secrets'a `FIREBASE_SERVICE_ACCOUNT` diye ekle. Eklenene dek bildirim adımı atlanır.
- [ ] **P2 · Gizlilik metnini onayla** — `/privacy/` 2026-09-24'te uygulama (telefon, bildirim jetonu, AdMob)
      için genişletildi; mağaza formlarındaki cevaplar buna uymalı. Türkçesi hâlâ yok (hukuki metin; sen ya da
      avukat onaylayınca `scripts/tr-strings/` + `TR_PAGES`).
- [ ] **P2 · Mağaza/reklam hesapları** — Apple Developer 99 $/yıl, Google Play 25 $ (tek sefer), AdMob (ücretsiz).
- [ ] **P2 · AdSense** — içerik + biraz organik trafik oluşunca yeniden başvur.
- [ ] **P3 · es/de/fr/ar okuyucusu** — SPA metinleri tam ama ana dili konuşan biri okumadı; bulununca "beta" bayrağı kalkar.

## Benim yapacaklarım — mobil uygulama

- [ ] **P1 · Telefon girişini canlıda dene** — Phone açılınca (yukarıda); reCAPTCHA + SMS akışı headless'ta çözülmüyor.
- [ ] **P1 · Apple ile Giriş** — Google sunduğumuz için App Store 4.8; Firebase Auth `apple.com` sağlayıcısı + native.
- [ ] **P2 · Gerçek cihaz turu** (Mac) — çevrimdışı açılış, güvenli alan/sekme çubuğu, hesap, bildirim, reklam rızası; mağaza ekran görüntüleri.
- [ ] **P2 · Bildirim kuralı 3: son başvuru hatırlatması** — planlayıcının `applyPlan()` mantığı Node'a taşınıp
      `backend/dispatch-push.js`'e üçüncü kural olarak eklenecek (kural 1 ve 2 hazır).
- [ ] **P2 · Uygulamada veri tazeliği kararı** — veri şimdi pakette (şerit tarihi gösterir). Mağaza güncellemesi
      olmadan yenilemek için veriyi mantıktan ayırıp **JSON** indirmek gerekir (Apple 2.5.2: kod değil veri).
- [ ] **P3 · Bildirime dokununca ülkeye git** (`?p=` + ülke), evrensel bağlantılar; bildirim tercihleri (sessiz saat).
- [ ] **P3 · Uygulamada alt sekme adları** — 5 sekme dar telefonlarda kısalıyor mu, gerçek cihazda bak.

## Site

- [ ] **P2 · Rehber yazıları (2–4 daha)** — "Nasıl sayıyoruz" yazıldı (`/guides/how-we-count/`, sitenin kendi
      tanımlarına dayanıyor). Kalan adaylar: ESTA/eTA/UK ETA/ETIAS karşılaştırması (ücret ve tarih **yazma**, resmi
      sayfaya bağla), "pasaportta boş sayfa ve hasar kuralı", "e-Vize sahte siteleri nasıl ayırt edilir".
      Yeni sayfa için: `TR_PAGES` (assets/site-nav.js), `scripts/tr-meta.js`, `scripts/tr-strings/`, `guides/index.html`,
      `generate-seo.js` (sitemap + "Faydalı rehberler"), sonra rebuild sırası (CLAUDE.md).
- [ ] **P3 · Pasaport türü etiketleri** — `passportVariantLabel` yalnızca tr/en; es/de/fr/ar İngilizce görünüyor.
- [ ] **P3 · Telefon gönderimi sırasında diğer giriş formları kilitleniyor** — `run()` tüm düğmeleri `busy` yapıyor;
      reCAPTCHA takılırsa 90 sn'lik zaman aşımına kadar e-posta/şifre de kullanılamıyor. Telefon için ayrı bayrak.
- [ ] **P3 · Ekran okuyucu turu** — VoiceOver/TalkBack ile harita, ülke kartı, hesaplayıcılar, yeni transit kutusu.
- [ ] **P3 · Türkçe ikizler için CI denetimi** — `node scripts/build-tr.js --check` bir GitHub Actions adımı olsun.

## Veri ve içerik

- [ ] **P2 · Vize ücreti verisi** — 80 çift var; yüksek trafikli rotalar için genişlet.
- [ ] **P3 · Güvenlik haritası: ABD düzyazısı** — TR, IN gibi bazı ülkelerde ABD metninin paragrafları "bölge notu"
      gibi görünüyor (`parseRegions`, ABD dizisi); ayrıştırıcıyı sıkılaştır.
- [ ] **P3 · Güvenlik haritası: il altı sınırlar** — kalan bölge notları şehir/yol/sınır şeridi; il (admin-1)
      eşleştirmenin tavanına ulaşıldı. Devam etmek admin-2 sınırları demek (büyük iş, düşük getiri).
- [ ] **P3 · Pasaport türleri: koşullu girişler** — "(biometric only)" gibi koşullu satırlar şu an dışarıda; koşullu gösterim.
- [ ] **P3 · es/de/fr/ar uzun metinler** — hukuki/SSS metinleri hâlâ İngilizce'ye düşüyor.
