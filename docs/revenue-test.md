# Gelir testi: Schengen sigortası + randevu alarmı (27 Kasım – 27 Aralık 2026)

Amaç: reklam dışında para getirecek bir yol var mı, 30 günde ölçmek. Bu sürede başka yeni özellik eklenmez.

## Ne canlıda
- **Sigorta kutusu** (AXA Schengen): `/visa-checklist/tr-schengen/`, `/schengen-calculator/` ve 29 Schengen ülkesinin
  `/visa/<cc>/` sayfaları (EN + TR). Bağlantı `/go/axa-schengen` (EN) ve `/go/axa-schengen-tr` (TR) üzerinden gider;
  gerçek ortaklık bağlantısı yalnızca `_redirects` ve `go/*/index.html` içinde durur.
  Tradedoubler onayı gelene kadar bağlantı komisyonsuz (yalnızca `utm_source=travelnow`); tıklama yine ölçülür.
- **Randevu alarmı bekleme listesi**: `/appointment-alert/` ve `/tr/appointment-alert/`. Hizmet yok; sayfa bunu açıkça
  söylüyor. Kayıtlar Firestore `waitlist/{sha256(e-posta)}`; web'den okunamaz, aynı adres iki kez yazılamaz.
  KVKK aydınlatma metni sayfada, gizlilik politikası EN + TR güncel.

## Nasıl okunur
- `node tools/analytics-report.js` → "revenue test" satırı: `affiliate_click` (iVisa + AXA birlikte), `waitlist_cta`,
  `waitlist_signup`, bekleme listesi sayfa görüntülemesi.
- `node tools/usage-report.js` → "Appointment-alert waiting list": toplam, 7/30 gün, ödemeye razı olan, fiyat, ülke,
  şehir, kaynak dağılımı. Yeni kayıtlar 2 saatte bir "signup" issue'suna yorum olarak düşer.
- GA4 Explore: `affiliate_click` olayını `partner` parametresine göre ayır (axa-schengen / ivisa).

## 27 Aralık'ta karar ölçütleri
| Ölçüt | Devam | Bırak |
|---|---|---|
| Bekleme listesi kaydı (30 gün) | ≥ 100 | < 30 |
| Bunlardan 99 TL ve üstü diyen | ≥ %40 | < %20 |
| Sayfa ziyaretinden kayda dönüşüm | ≥ %8 | < %3 |
| AXA tıklaması (30 gün) | ≥ 150 | < 40 |

Arada kalırsa bir ay daha ölç; trafik çok düşükse (bekleme listesi < 300 görüntüleme) sonuç anlamsızdır, önce trafik sorunu.

## Bilinen sınırlar
- Randevu alarmının yasal ve güvenilir bir veri kaynağı henüz yok. VFS/iData kazımak kullanım şartlarına aykırı; kullanıcı
  bildirimi ve resmî duyurular daha yavaş. Talep çıkarsa önce bu soru çözülmeli, sonra ödeme altyapısı.
- AXA Schengen'in komisyon oranı herkese açık değil ("pazarlığa açık"). Gerçek oran Tradedoubler onayından sonra görülecek.
