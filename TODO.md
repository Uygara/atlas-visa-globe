# travelnow.info — açık işler

> Güncelleme: 2026-09-21 · Yalnızca **açık** işler burada. Biten işler
> `STATE.md` içindeki tur notlarında. Öncelik: **P1** sıradaki, **P2** yakında,
> **P3** sonra. Süre tahminleri tek kişilik iş içindir.
>
> Tasarım maddelerinin çoğu 13 tasarımcı karakterinin site incelemesinden
> çıktı (2026-09-20); köşeli parantezdeki sayı kaç tasarımcının aynı şeyi
> işaret ettiğini gösteriyor.

## Senin yapacakların (hesap açmam gereken yerler)

- [ ] **P1 · Firebase projesi** — `ACCOUNT-SETUP.md`'deki 6 adım (~15 dk, ücretsiz).
      Sonra config'i bana ver; üyeliği açıp canlıda test ederim.
- [ ] **P1 · Search Console** — yayından sonra sitemap'i yeniden gönder (adresteki
      `sitemap.org` yazım hatası düzeldi, 200 pasaport için `/tr/` ikizleri ve hreflang
      eklendi), `/tr/`, `/guides/` ve `/safety-map/` için "dizine ekleme iste".
- [ ] **P2 · AdSense** — içerik + biraz organik trafik oluştuktan sonra yeniden başvur.
      (Boş reklam yuvaları kaldırıldı, pasaport sayfaları yenilendi; sırada trafik ve içerik var.)
- [ ] **P3 · Mağaza hesapları** — uygulamaya karar verince: Google Play 25 $ (tek sefer),
      Apple Developer 99 $/yıl.
- [ ] **P1 · Karar: e-posta uyarıları** — `/alerts/` formu canlıda 404 veriyor
      (`/api/subscribe` yok). Seçenekler: (a) formu gizle, (b) Firebase'den sonra
      hesaba bağlı uyarılar, (c) Cloudflare Worker + e-posta servisi kur.

## Site — tasarım incelemesinden (benim yapacaklarım)

- [ ] **P2 · Arapça (RTL)** [2] — `dir`/`lang` ayarlanmıyor, CSS tamamen fiziksel
      (left/right). Arapça şu an düzen olarak yok. ~1–2 gün.
- [ ] **P2 · Arapça yazı tipi ve eksik metinler** [1] — Arapçada tipografi sistem fontuna
      düşüyor, `letter-spacing` bitişik yazıyı koparıyor, panelin yarısı İngilizce kalıyor.
      Dil seçicide es/de/fr/ar "beta" olarak işaretlensin. ~1 gün.
- [ ] **P3 · Türkçe kırpmalar ve tarih/para biçimi** [1] — "Schengen hesap.", "Vize gerek."
      gibi sözlükte kısaltılmış metinler; düzyazıda ISO tarih (2026-05-22) ve çift para birimi.
      `Intl` ile biçimlendir. ~yarım gün.
- [ ] **P3 · Marka işareti** [2] — dünya ikonu kategorinin en çok kopyalanan simgesi;
      `P<` (MRZ göstergesi) öneriliyor. ".info" mobilde kayboluyor.
- [ ] **P3 · Planlayıcıda tarih ve son başvuru** [2] — kalkış tarihi en altta ve opsiyonel;
      "işlem süresi + bugün > kalkış" uyarısı yok.
- [ ] **P3 · Transit haritasında IATA kodları / bacak bazlı sorgu** [1].
- [ ] **P3 · Rehber dizini ve menü** [2] — beş özdeş kutu yerine basılı içindekiler;
      11 eşit menü linkini gruplara böl.
- [ ] **P3 · Paylaşım kartlarını yenile** — veri toplu değişince `node scripts/og-cards.js`
      (yalnızca sayısı değişen kartları çizer; yerel Chrome + Python/Pillow ister). Günlük
      iş bunu yapmıyor.
- [ ] **P3 · Ekran okuyucu turu** — VoiceOver/TalkBack ile harita, ülke kartı ve hesaplayıcıları
      bir kez dinle; canlı bölgeler (`aria-live`) ve odak sırası gerçek cihazda doğrulansın.
- [ ] **P2 · Gizlilik ve Koşullar'ın Türkçesi** — bu iki sayfa bilerek yalnızca İngilizce
      (hukuki metin; çeviriyi sen ya da bir avukat onaylamalı). Onaylanmış çeviri gelince
      `scripts/tr-strings/` altına eklenip `TR_PAGES`'e alınır.
- [ ] **P3 · Schengen rehberinde bir cümleyi doğrula** — "Bulgaristan, Romanya ve Kıbrıs son
      yıllarda tam üyeliğe girip çıkıyor" ifadesi güncel olmayabilir (Bulgaristan ve Romanya
      1 Ocak 2025'te tam üye oldu; Kıbrıs henüz değil). Doğruysa İngilizce metni düzelt,
      `node scripts/build-tr.js --todo guides/schengen-90-180-rule` Türkçesini yeniden ister.
- [ ] **P3 · Türkçe ikizler için CI denetimi** — `node scripts/build-tr.js --check` bir
      GitHub Actions adımı olsun; İngilizce sayfa değişip ikizi eskirse kırmızı görünsün.

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
- [ ] **P3 · Vize ücreti verisi** — 80 çift var; yüksek trafikli rotalar için genişlet.
