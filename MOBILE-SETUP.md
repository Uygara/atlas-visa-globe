# travelnow.info — Mobil uygulama (iOS + Android) kurulum rehberi

Son güncelleme: 2026-09-24 · Firebase projesi: `travelnow-a0cf3` · Uygulama kimliği (bundle id / package): `info.travelnow.app`

## Ne hazır, ne değil

**Hazır (kodda, yerelde denendi):**
- `app/` — Capacitor 8 kabuğu. `npm run www` sitenin harita/planlayıcı/transit/güvenlik/Schengen/hesap
  sayfalarını `app/www`'e toplar (React, D3, yazı tipleri dahil; AdSense ve web analitiği yok), böylece
  uygulama **çevrimdışı** açılır. iOS (Swift Package Manager) ve Android projeleri üretildi
  (`app/ios`, `app/android`), simge ve açılış ekranı P< işaretinden çizildi.
- `assets/app-native.js` — alt sekme çubuğu, çevrimdışı/eski-veri şeridi, bildirim anahtarı
  (izni yalnızca kişi düğmeye basınca ister), rıza-önce AdMob afişi (yalnızca Planlayıcı ve Schengen sayfaları).
- Hesap: Google + e-posta/şifre + telefon (SMS kodu) + e-posta bağlantısı; uygulamada Google ve telefon
  yerel eklentiden (`@capacitor-firebase/authentication`) geçer.
- `backend/dispatch-push.js` — günlük bildirim göndericisi (kural değişikliği + güvenlik seviyesi),
  16 birim testi (`node backend/test-dispatch-push.js`).

**Henüz yok / denenmedi:**
- Hiçbir şey **gerçek cihazda** çalıştırılmadı (bu bilgisayarda Xcode/Android SDK yok).
- Telefonla giriş: Console'da açılmadı (adım 2) → kod hazır, canlıda denenmedi.
- Apple ile Giriş yok (aşağıda "App Store kuralı").

## 1. Firebase kurulumu — YAPILDI (2026-09-24)

Kayıtlı uygulamalar (`travelnow-a0cf3`, proje no 530717343321): Web `1:530717343321:web:282fd55bf13240ad733b48`,
iOS `…:ios:09f2aada09e1a1ab733b48`, Android `…:android:8d7a13d7066fd9e4733b48` (hepsi `info.travelnow.app`).
Web config `assets/account-config.js`'te; `GoogleService-Info.plist` ve `google-services.json` **commit'li**
(kamuya açık kimlikler; Mac'te derleme için gerekli). Google+e-posta/şifre açık (`firebase.json`), Firestore
`(default)` **eur3**'te, kurallar yayında, yetkili alan adları: `travelnow.info`, `www.travelnow.info`, `localhost`.
iOS'ta Google için URL şeması `Info.plist`'e eklendi (`node app/firebase-native.js`).
Canlı testte (localhost, gerçek Firebase): şifreyle kayıt → Firestore eşitleme → çıkış → yanlış şifre → giriş → veri
geri geldi → hesap silme. Yeniden kurmak gerekirse komutlar:

```bash
npx -y firebase-tools@latest apps:create WEB "travelnow web" --project travelnow-a0cf3
npx -y firebase-tools@latest apps:create IOS "travelnow iOS" --bundle-id info.travelnow.app --project travelnow-a0cf3
npx -y firebase-tools@latest apps:create ANDROID "travelnow Android" --package-name info.travelnow.app --project travelnow-a0cf3
npx -y firebase-tools@latest apps:sdkconfig WEB <WEB_APP_ID>          # → assets/account-config.js
npx -y firebase-tools@latest apps:sdkconfig IOS <IOS_APP_ID>          # → app/ios/App/App/GoogleService-Info.plist
npx -y firebase-tools@latest apps:sdkconfig ANDROID <ANDROID_APP_ID>  # → app/android/app/google-services.json
npx -y firebase-tools@latest deploy --only auth,firestore:rules       # firebase.json + firestore.rules
```

Ardından `cd app && node firebase-native.js` çalıştırılır (iOS URL şeması + Android kontrolü): `GoogleService-Info.plist` içindeki `REVERSED_CLIENT_ID`
değeri `app/ios/App/App/Info.plist`'e URL şeması olarak eklenir (Google girişi iOS'ta buna dönüyor).
Android için Firebase Console → Proje ayarları → Android uygulaması → **SHA-1** parmak izi eklenir
(`cd app/android && ./gradlew signingReport`).

## 2. Konsolda elle açılacaklar (sadece sen)

1. **Authentication → Sign-in method → Phone → Etkinleştir.** CLI ile açılamıyor (yalnızca Google,
   e-posta/şifre, anonim açılıyor; onlar `firebase.json`'da). **SMS bölge politikası**nı da ayarla (Authentication →
   Settings → SMS region policy): yalnızca kullanıcılarının olduğu ülkeler; yoksa toplu sahte SMS istekleri maliyet yaratır.
   SMS'in ücretsiz kotası sınırlı; kota üstü için **Blaze** (kullandıkça öde) plan gerekebilir — konsolda
   Authentication → Usage kısmında güncel sınırı gör. Test için Phone → "Test telefon numaraları" ekleyebilirsin.
2. Yetkili alan adları eklendi (not: `deploy --only auth` `authorizedDomains`'i uygulamıyor; ben CLI'nin kendi yardımcısıyla ekledim).
3. Push için: Firebase Console → Proje ayarları → **Hizmet hesapları → Yeni özel anahtar oluştur** → indirilen JSON'un
   tamamını GitHub repo → Settings → Secrets → `FIREBASE_SERVICE_ACCOUNT` olarak yapıştır. Bunu ekleyene kadar
   günlük iş bildirim adımını atlar (hata vermez).

## 3. Mac + Xcode (Apple tarafı)

Gerekenler: Mac, Xcode, **Apple Developer hesabı (99 $/yıl)**.

```bash
cd app && npm install && npm run ios      # www'yi üretir, cap sync, Xcode'u açar
```

Xcode'da (Signing & Capabilities): takım seç, **Push Notifications** yeteneğini ekle.
Firebase Console → Proje ayarları → Cloud Messaging → iOS uygulaması → **APNs kimlik doğrulama anahtarı (.p8)** yükle
(Apple Developer → Keys'ten oluşturulur). Sonra gerçek telefonda dene: Google girişi, telefon girişi, bildirim düğmesi.

**App Store kuralı (yayından önce çöz):** Google ile giriş sunan uygulama, eşdeğer bir gizlilik dostu seçenek de
sunmalı — pratikte **Apple ile Giriş** (kural 4.8). E-posta/şifre kendi hesabımız olduğu için kuralın kapsamı dışında
sayılabilir, ama incelemeciler çoğu zaman Apple ile Giriş ister. Riski sıfırlamak için eklenmeli (Firebase Auth destekliyor).

## 4. Android

```bash
cd app && npm run android      # Android Studio'yu açar (Windows'ta `npm run sync:android` yeterli)
```

Google Play Console hesabı (25 $ tek sefer) gerekir. `google-services.json` ve SHA-1 (adım 1) olmadan Google/telefon girişi çalışmaz.

## 5. AdMob (reklam)

Şu an **Google'ın test reklam kimlikleri** var (gerçek reklam göstermez, hesap gerekmez). Gerçeğe geçmek için:
1. AdMob hesabı aç → bir iOS bir Android uygulaması ekle → her birine **Banner** birimi oluştur.
2. Banner birim kimliklerini `assets/app-config.js` içine yaz.
3. **Uygulama** kimliklerini (`ca-app-pub-…~…`) `app/ios/App/App/Info.plist` (`GADApplicationIdentifier`) ve
   `app/android/app/src/main/res/values/strings.xml` (`admob_app_id`) içine yaz.
4. AdMob → Gizlilik ve mesajlaşma: **GDPR** ve (iOS için) **IDFA** mesajını oluştur (aksi halde AB'de reklam gitmez).

## 6. Yayın öncesi kontrol listesi

- Gizlilik politikası (`/privacy/`) uygulamayı, telefon numarasını, bildirim jetonunu ve AdMob'u anlatacak şekilde
  güncellendi (2026-09-24) — **avukat/sen okuyup onaylamalı**; mağaza formlarındaki "veri toplama" cevapları buna uymalı.
- Mağaza görselleri: ekran görüntüleri (telefon boyutları), açıklama, kategori (Seyahat), yaş sınırı.
- TestFlight (iOS) / iç test (Android) ile en az bir gerçek cihazda: çevrimdışı açılış, hesap, bildirim, reklam rızası.
- Veri tazeliği: uygulama günün verisini paketiyle taşır (şerit bunu gösterir). Uygulamayı **mağazadan güncellemeden**
  veriyi yenilemek istiyorsak ayrı bir karar gerekir (veriyi JSON'a ayırıp indirmek; Apple kural 2.5.2 "kod indirme" kaygısı
  yüzünden JS değil JSON olmalı). TODO.md'de.

## Sık işler

| İş | Komut |
|---|---|
| Siteyi uygulamaya kopyala (Windows) | `cd app && npm run sync:android` |
| Simge/açılış ekranını yeniden çiz | `cd app && npm run resources` |
| Bildirim kararlarını dene | `node backend/dispatch-push.js --fixture <dosya> --dry-run` |
| Bildirim testleri | `node backend/test-dispatch-push.js` |
| Hesap akışı testi (sahte arka uç) | `http://localhost:8000/account/?account=mock` |

Not: `cap sync ios` Windows'ta `symlink` hatası verir (Windows sembolik bağ izni ister) — iOS'u yalnızca Mac'te senkronla.
