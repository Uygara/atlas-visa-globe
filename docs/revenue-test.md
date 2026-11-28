# Gelir testi: Schengen sigortası, randevu alarmı, Travel Pass (27 Kasım – 27 Aralık 2026)

Amaç: reklam dışında para getirecek bir yol var mı, 30 günde ölçmek. Bu sürede başka yeni özellik eklenmez.

## Ne canlıda
- **Sigorta kutusu** (AXA Schengen): `/visa-checklist/tr-schengen/`, `/schengen-calculator/` ve 29 Schengen ülkesinin
  `/visa/<cc>/` sayfaları (EN + TR). Bağlantı `/go/axa-schengen` (EN) ve `/go/axa-schengen-tr` (TR) üzerinden gider;
  gerçek ortaklık bağlantısı yalnızca `_redirects` ve `go/*/index.html` içinde durur.
  Tradedoubler onayı gelene kadar bağlantı komisyonsuz (yalnızca `utm_source=travelnow`); tıklama yine ölçülür.
- **Randevu alarmı bekleme listesi**: `/appointment-alert/` ve `/tr/appointment-alert/`. Hizmet yok; sayfa bunu açıkça
  söylüyor. Kayıtlar Firestore `waitlist/{sha256(e-posta)}`; web'den okunamaz, aynı adres iki kez yazılamaz.
  KVKK aydınlatma metni sayfada, gizlilik politikası EN + TR güncel.
- **Travel Pass bekleme listesi (global, yalnızca İngilizce)**: `/travel-pass/`. Sık seyahat edenler için yıllık plan
  fikri: kaydedilen seyahatlerden gün sayımı ve süre aşımı uyarısı, pasaport/vize bitiş hatırlatması, aile için birden çok
  pasaport, izin verilen yerlerde randevu alarmı. Seçenekler: 3 $/ay, 29 $/yıl, 49 $/yıl (5 kişiye kadar), "yalnızca
  ücretsizse". Kayıt `waitlist/{sha256("pass:" + e-posta)}`, `product: "pass"`, sitede seçilmiş pasaport kodu.
  Bağlantılar: İngilizce pasaport sayfaları (200 pasaport) ve Schengen hesaplayıcısı (EN + TR).
  Bugün ücretsiz olan her şey (harita, hesaplayıcı, uyarılar) ücretsiz kalır; Pass yalnızca yeni şeyler ekler.

## Nasıl okunur
- `node tools/analytics-report.js` → "revenue test" satırı: `affiliate_click` (iVisa + AXA birlikte), `waitlist_cta`,
  `waitlist_signup`, bekleme listesi sayfa görüntülemesi.
- `node tools/usage-report.js` → "Appointment-alert waiting list" ve "Travel Pass waiting list": toplam, 7/30 gün, ödemeye razı olan, fiyat, ülke,
  şehir, kaynak dağılımı. Yeni kayıtlar 2 saatte bir "signup" issue'suna yorum olarak düşer.
- GA4 Explore: `affiliate_click` olayını `partner` parametresine göre ayır (axa-schengen / ivisa).

## 27 Aralık'ta karar ölçütleri
| Ölçüt | Devam | Bırak |
|---|---|---|
| Randevu alarmı kaydı (30 gün) | ≥ 100 | < 30 |
| Bunlardan 99 TL ve üstü diyen | ≥ %40 | < %20 |
| Sayfa ziyaretinden kayda dönüşüm | ≥ %8 | < %3 |
| AXA tıklaması (30 gün) | ≥ 150 | < 40 |
| Travel Pass kaydı (30 gün) | ≥ 100 | < 30 |
| Bunlardan ücretli seçenek seçen | ≥ %40 | < %20 |
| Ücretli seçeneklerin yıllık payı (29 $ + 49 $) | ≥ %50 | yalnızca aylık seçiliyorsa yıllık fiyat zayıf |

**TR mi global mi:** iki listenin "ücretli seçenek seçen kayıt / sayfa görüntüleme" oranını karşılaştır. Global taraf
daha düşük dönüşümle bile daha çok kayıt getiriyorsa (İngilizce trafik çok daha büyük) yön global abonelik olur.
TR tarafı çok daha yüksek dönüşüm ve ödeme isteği gösteriyorsa yön Türk başvuru sahibine özel hizmettir.

Arada kalırsa bir ay daha ölç; trafik çok düşükse (bekleme listesi < 300 görüntüleme) sonuç anlamsızdır, önce trafik sorunu.

## Acente pilotu (28 Kasım'da eklendi)
Yön değişikliği: bireysel abonelik bugünkü trafikle (haftada ~124 kullanıcı) ayda 100 
- Travel Pass'in çoğu parçası bugün ücretsiz olan özelliklerin üstüne kurulu. Ücretsiz uyarılarla yetinen bir kitle
  bulunursa bu sonucun kendisi bilgidir: o zaman abonelik değil, sigorta ve başvuru ortaklıkları ana gelir olur.
- Diğer global ve düzenli gelir yolu B2B: doğrulanmış vize verisini seyahat acentelerine, İK/relocation şirketlerine
  ve uygulamalara API olarak satmak. Bu testte kurulmuyor; 27 Aralık kararından sonra ele alınacak.
- Randevu alarmının yasal ve güvenilir bir veri kaynağı henüz yok. VFS/iData kazımak kullanım şartlarına aykırı; kullanıcı
  bildirimi ve resmî duyurular daha yavaş. Talep çıkarsa önce bu soru çözülmeli, sonra ödeme altyapısı.
- AXA Schengen'in komisyon oranı herkese açık değil ("pazarlığa açık"). Gerçek oran Tradedoubler onayından sonra görülecek.
ı geçemez; gelir bizim trafiğimize
bağlı olmayan B2B taraftan gelmeli. Fikir sıralaması: https://claude.ai/artifact/H1xTamcQnFG5wvfRFYCGfX
- `/for-agencies/` (EN + TR, "siz" diliyle): acentenin logosuyla çalışan vize denetleyicisi için pilot talebi.
  Başlangıç 19 $/ay, Acente 49 $/ay, "önce konuşalım", "yalnızca ücretsizse". Kayıt `waitlist/{sha256("agency:" + e-posta)}`,
  `product: "agency"`, `org`, `site`. `node tools/usage-report.js` "Agency pilot requests" satırı acente adlarını listeler;
  e-posta Firebase konsolunda. Sayfa her talebe iki iş günü içinde dönüş sözü veriyor.
- Asıl doğrulama satış görüşmesi: İpek 40 acente ve 10 vize danışmanına bu sayfanın bağlantısıyla yazar.
  Ölçüt (4 hafta): 5 yazılı "öderim" ya da 3 ücretli pilot → markalı sürüm ve ödeme kurulur. 0-1 → B2B yönü yeniden düşünülür.
- Markalı sürüm, kaynak etiketi ve değişiklik e-postası henüz yok; sayfa bunları "acente sürümü" olarak anlatıyor.

## Bilinen sınırlar
- Travel Pass'in çoğu parçası bugün ücretsiz olan özelliklerin üstüne kurulu. Ücretsiz uyarılarla yetinen bir kitle
  bulunursa bu sonucun kendisi bilgidir: o zaman abonelik değil, sigorta ve başvuru ortaklıkları ana gelir olur.
- Diğer global ve düzenli gelir yolu B2B: doğrulanmış vize verisini seyahat acentelerine, İK/relocation şirketlerine
  ve uygulamalara API olarak satmak. Bu testte kurulmuyor; 27 Aralık kararından sonra ele alınacak.
- Randevu alarmının yasal ve güvenilir bir veri kaynağı henüz yok. VFS/iData kazımak kullanım şartlarına aykırı; kullanıcı
  bildirimi ve resmî duyurular daha yavaş. Talep çıkarsa önce bu soru çözülmeli, sonra ödeme altyapısı.
- AXA Schengen'in komisyon oranı herkese açık değil ("pazarlığa açık"). Gerçek oran Tradedoubler onayından sonra görülecek.
