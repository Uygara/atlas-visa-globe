# travelnow.info — açık işler

> Güncelleme: 2026-09-20 · Yalnızca **açık** işler burada. Biten işler
> `STATE.md` içindeki tur notlarında. Öncelik: **P1** sıradaki, **P2** yakında,
> **P3** sonra. Süre tahminleri tek kişilik iş içindir.
>
> Tasarım maddelerinin çoğu 13 tasarımcı karakterinin site incelemesinden
> çıktı (2026-09-20); köşeli parantezdeki sayı kaç tasarımcının aynı şeyi
> işaret ettiğini gösteriyor.

## Senin yapacakların (hesap açmam gereken yerler)

- [ ] **P1 · Firebase projesi** — `ACCOUNT-SETUP.md`'deki 6 adım (~15 dk, ücretsiz).
      Sonra config'i bana ver; üyeliği açıp canlıda test ederim.
- [ ] **P1 · Search Console** — sitemap'i yeniden gönder, `/guides/` ve
      `/safety-map/` için "dizine ekleme iste".
- [ ] **P2 · AdSense** — içerik + biraz organik trafik oluştuktan sonra yeniden başvur.
      (Önce aşağıdaki "boş reklam yuvası" ve "pasaport sayfası kimliği" maddeleri bitsin.)
- [ ] **P3 · Mağaza hesapları** — uygulamaya karar verince: Google Play 25 $ (tek sefer),
      Apple Developer 99 $/yıl.
- [ ] **P1 · Karar: e-posta uyarıları** — `/alerts/` formu canlıda 404 veriyor
      (`/api/subscribe` yok). Seçenekler: (a) formu gizle, (b) Firebase'den sonra
      hesaba bağlı uyarılar, (c) Cloudflare Worker + e-posta servisi kur.

## Site — tasarım incelemesinden (benim yapacaklarım)

- [ ] **P1 · Mobil ülke kartı başlığı kırpılıyor** [6 tasarımcı] — panel tutamağının
      altında kalıyor. Yapışkan başlık (bayrak + ülke + damga + kapat), kart üstüne
      `scroll-margin-top`. ~1 gün.
- [ ] **P1 · Boş reklam yuvası** [4] — Schengen hesaplayıcı ve araç sayfalarında
      dolmayan AdSense yuvası ~330 px boşluk bırakıyor; araçları katlamanın altına itiyor.
      Dolmazsa DOM'dan kaldır, araç sayfalarında reklamı ilk sonucun altına al. ~2 saat.
- [ ] **P1 · "138" ile "87" çelişkisi** [3] — panel "138 ulaşılabilir" derken pasaport
      sayfası "önceden vize almadan 87" diyor. Tek ana sayı + tek tanım, dört yüzeyde aynı. ~yarım gün.
- [ ] **P1 · Renk körlüğü** [3] — üç yeşil (vizesiz / seyahat izni / e-Vize) deuteranopide
      birbirine giriyor. Statü desenleri (tarama, nokta) + parlaklık farkı. ~1 gün.
- [ ] **P2 · Küre ölü duruyor** [2] — otomatik dönüş 60 sn sonra ve ani başlıyor; sürüklemede
      momentum yok; sürükleyip bırakınca yanlışlıkla kart açılıyor. Eşik 2,5 sn, rampalı hız,
      6 px tıklama koruması, damga basma animasyonu. ~1 gün.
- [ ] **P2 · Pasaport sayfalarında kimlik yok** [5] — Google'dan gelen ve AdSense'in baktığı
      sayfalar bunlar. Üstte bio-data kartı (bayrak + ülke + MRZ + sıralama), 5 istatistik
      kutusu yerine noktalı defter, altta "Haritada aç" çubuğu. ~1–2 gün.
- [ ] **P2 · Pasaport başına paylaşım görseli (OG)** [2] — 200 sayfa tek jenerik görseli
      paylaşıyor. Üretim betiğine kart üreticisi ekle (damga + sayı + MRZ). ~1 gün.
- [ ] **P2 · Tip ölçeği ve satır uzunluğu** [1] — iki CSS dosyasında ~33 farklı punto,
      10 farklı harf aralığı; metin sütunu 90+ karakter. Yedi basamaklı ölçek + 66ch. ~1 gün.
- [ ] **P2 · Erişilebilirlik** [1] — 11 px gri satırlar kontrast altında (4.5:1 yok),
      dokunma hedefleri 28–34 px, panel tutamağı klavyeye kapalı, `aria-live` yok. ~1 gün.
- [ ] **P1 · Dil etiketi ve hreflang** [1] — 224 sayfanın tamamı `<html lang="en">` ve
      sitemap'te hreflang yok; Türkçe içerik arama motoruna görünmüyor. Dil seçimi
      sunucudan/HTML'den gelsin. ~yarım gün.
- [ ] **P2 · Arapça (RTL)** [2] — `dir`/`lang` ayarlanmıyor, CSS tamamen fiziksel
      (left/right). Arapça şu an düzen olarak yok. ~1–2 gün.
- [ ] **P2 · Arapça yazı tipi ve eksik metinler** [1] — Arapçada tipografi sistem fontuna
      düşüyor, `letter-spacing` bitişik yazıyı koparıyor, panelin yarısı İngilizce kalıyor.
      Dil seçicide es/de/fr/ar "beta" olarak işaretlensin. ~1 gün.
- [ ] **P3 · Türkçe kırpmalar ve tarih/para biçimi** [1] — "Schengen hesap.", "Vize gerek."
      gibi sözlükte kısaltılmış metinler; düzyazıda ISO tarih (2026-05-22) ve çift para birimi.
      `Intl` ile biçimlendir. ~yarım gün.
- [ ] **P3 · Mobilde harita lejantı** [4] — küreyi kapatıyor; sheet içine tek satır çip şeridine taşı.
- [ ] **P3 · Marka işareti** [2] — dünya ikonu kategorinin en çok kopyalanan simgesi;
      `P<` (MRZ göstergesi) öneriliyor. ".info" mobilde kayboluyor.
- [ ] **P3 · Planlayıcıda tarih ve son başvuru** [2] — kalkış tarihi en altta ve opsiyonel;
      "işlem süresi + bugün > kalkış" uyarısı yok.
- [ ] **P3 · Transit haritasında IATA kodları / bacak bazlı sorgu** [1].
- [ ] **P3 · Rehber dizini ve menü** [2] — beş özdeş kutu yerine basılı içindekiler;
      11 eşit menü linkini gruplara böl.

## Güvenlik haritası (v2 yayına hazır, sıradakiler)

- [ ] **P2 · Kanada bölgesel uyarıları** — ülke sayfalarındaki bölge listeleri şu an
      alınmıyor (yalnızca "bölgesel uyarı var" bayrağı). HTML ayrıştırması gerekiyor.
- [ ] **P3 · Bölge eşleşmesini genişlet** — 64 ülkede 252 bölge eşleşti; kalanlar
      "sınıra 10 km" gibi sözel alanlar. Şehir/bölge adı sözlüğü eklenebilir.
- [ ] **P3 · Türkiye Dışişleri uyarıları** — otomatik isteklere kapalı (403);
      elle küratörlük ya da farklı kaynak gerekir.

## Mobil uygulama (üyelik açıldıktan sonra)

- [ ] **P2 · Capacitor iskeleti** — iOS + Android kabuğu, aynı web kodu, derleme adımı hazır.
- [ ] **P2 · Push bildirimleri** — yalnızca: (1) kendi pasaportun/izlediğin ülke için kural
      değişikliği, (2) planındaki ülkenin güvenlik seviyesi değişimi, (3) son başvuru
      hatırlatması. Metin kararın kendisi olsun: "Japonya: vizesiz → e-Vize · 1 Kasım'dan
      itibaren". Asla pazarlama, asla "bir şeyler değişti", gece sessiz, ülke başına günde 1.
- [ ] **P2 · Çevrimdışı** — kayıtlı pasaportun tam tablosu ve son bakılan kart cihazda;
      üstte "3 gün önceki veri" şeridi.
- [ ] **P3 · AdMob** — reklam damga ile ücret satırı arasına asla girmesin; liste sonu
      ve rehber araları. Açılışta tam ekran reklam yok.
- [ ] **P3 · Alt sekme çubuğu** — Harita · Planlayıcı · İzlenenler · Hesap.

## Veri ve içerik

- [ ] **P2 · Rehber makaleleri** — hedef aramalar için 3–5 yazı daha
      ("Türk pasaportu vizesiz ülkeler 2026", "transit vize rehberi" gibi).
- [ ] **P3 · es/de/fr/ar uzun metinler** — hukuki/SSS metinleri hâlâ İngilizce'ye düşüyor.
- [ ] **P3 · MRZ ülke adı** [1] — şerit `TURTURKEY` yazıyor; gerçek pasaportlarda `TURKIYE`.
      İsim alanı yerelleştirilmiş addan üretilsin.
- [ ] **P3 · Vize ücreti verisi** — 80 çift var; yüksek trafikli rotalar için genişlet.
