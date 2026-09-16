# travelnow.info — Üyelik (Firebase) Kurulum Rehberi

Üyelik kodu hazır ve sitede, ama **kapalı**. `assets/account-config.js` içinde
Firebase ayarı olmadığı sürece hiçbir şey görünmez, Firebase'e bağlanılmaz ve
herkesin kayıtları kendi tarayıcısında kalır.

Açınca ziyaretçiler **Google ile** ya da **e-postayla gelen tek kullanımlık
bağlantıyla** (şifresiz) giriş yapar. Pasaport, pasaport türü, oturum izinleri,
izlenen ülkeler, seyahat planı, Schengen hesaplayıcı seyahatleri, dil ve tema
tüm cihazlarında eşitlenir. Hesap sayfası: `https://travelnow.info/account/`
(verileri indir, çıkış, hesabı sil).

Süre: ~15 dakika. Ücret: yok (Spark planı, kart gerekmez).

---

## 1. Firebase projesi (3 dk)

1. <https://console.firebase.google.com> → **Proje oluştur**
2. Ad: `travelnow` (ne istersen) → Google Analytics **kapalı** → **Proje oluştur**

## 2. Web uygulaması ve ayarlar (3 dk)

1. Proje ana sayfası → **</>** (Web) simgesi → takma ad `travelnow-web`
   → "Firebase Hosting" kutusunu **işaretleme** → **Uygulamayı kaydet**
2. Ekranda şuna benzer bir kod çıkar:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "travelnow-xxxx.firebaseapp.com",
     projectId: "travelnow-xxxx",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "1:...:web:..."
   };
   ```
3. Bu bloğu bana gönder (ya da `assets/account-config.js` dosyasındaki
   `window.ACCOUNT_CONFIG = null;` satırını bu değerlerle değiştir).
   **Bu değerler gizli değil** — tarayıcıya zaten gönderilir; erişimi
   güvenlik kuralları (adım 5) korur.

## 3. Giriş yöntemleri (4 dk)

**Build → Authentication → Başlayın → Sign-in method** sekmesi:

1. **Google** → Etkinleştir → "Proje destek e-postası"nı seç → **Kaydet**
2. **E-posta/Şifre** → Etkinleştir → hemen altındaki
   **E-posta bağlantısı (şifresiz oturum açma)** anahtarını da aç → **Kaydet**
   (Şifre ile kayıt kullanmıyoruz; sadece bağlantı.)

## 4. Yetkili alan adı (1 dk)

**Authentication → Ayarlar (Settings) → Yetkili alan adları (Authorized domains)**
→ **Alan adı ekle** → `travelnow.info` (varsa `www.travelnow.info` da).
`localhost` zaten ekli gelir.

## 5. Veritabanı + güvenlik kuralları (4 dk)

1. **Build → Firestore Database → Veritabanı oluştur**
2. Konum: **eur3 (europe-west)** — gizlilik sayfası "AB'de" diyor, lütfen
   Avrupa bölgesi seç. (Sonradan değiştirilemez.)
3. **Üretim modunda başlat** → Oluştur
4. **Kurallar (Rules)** sekmesi → içeriği tamamen sil → repodaki
   `firestore.rules` dosyasının içeriğini yapıştır → **Yayınla**

## 6. (İsteğe bağlı) E-posta şablonu

**Authentication → Templates → E-posta adresi doğrulama / oturum açma
bağlantısı** → dili **Türkçe** yap, gönderen adını `travelnow.info` yap.

---

## Bittiğinde

Bana adım 2'deki ayarları ver. Ben:
- `assets/account-config.js`'e yazıp yayınlarım,
- canlı sitede Google ve e-posta bağlantısıyla girişi, iki cihaz arası
  eşitlemeyi ve hesap silmeyi test ederim.

## Nasıl çalışıyor (kısa)

- Tarayıcıdaki `localStorage` her zamanki gibi çalışma kopyası. Giriş yapan
  kişinin verisi Firestore'da tek bir belge: `users/{uid}`.
- Her anahtar için "en son yazılan kazanır"; giriş yapmadan önce kaydedilmiş
  izleme listesi buluttakiyle birleştirilir, kaybolmaz
  (`assets/account-sync.js`, testler: `node tools/test-account-sync.js`).
- Firebase SDK yalnızca üyelik açıkken ve sayfa açıldığında yüklenir
  (Auth + Firestore Lite).
- Firebase projesi olmadan yerelde denemek için:
  `http://localhost:8000/account/?account=mock`
