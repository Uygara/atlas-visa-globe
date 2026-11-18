# travelnow.info: özellik envanteri

> Otopilot (`docs/AUTOPILOT.md`) ve el ile yapılan oturumlar işi buradan seçer. Bir madde bitince durumu
> `bitti` olur ve commit hash'i yazılır; tamamen bitenler bir ay sonra silinir. Yeni fikirler en alta,
> "Değerlendirilecek" bölümüne eklenir ve aşağıdaki ilkelere göre puanlanıp yukarı taşınır.

## İlkeler (her yeni özellik bu sorulardan geçer)

1. **Geri dönme sebebi.** Ziyaretçi bir kez gelip cevabını alıp gidiyor. Her özellik "bu kişi gelecek hafta
   neden tekrar gelsin?" sorusuna cevap vermeli. Tek seferlik bilgi sayfası, takip edilebilir bir şeye bağlanmalı.
2. **Pasaport kimliktir.** Kullanıcıyı pasaportuyla tanırız. Haber, uyarı ve öneri o pasaport için süzülür:
   Malezya pasaportu seçen kişi yalnızca Malezyalıları etkileyen değişikliği görür.
3. **Bilgi kullanıcıya gider.** Kullanıcının siteye bakmasını beklemeyiz; değişiklik olunca e-posta ve uygulama
   bildirimi gider. Her sayfada "bunu takip et" yolu vardır.
4. **Taze ve kaynaklı.** Her değişikliğin tarihi ve kaynağı görünür. Veri uydurulmaz; kaynağı olmayan bilgi yazılmaz.
5. **İnsanların deneyimi değerlidir.** Resmi kural ile sahadaki gerçek farklı olabilir. Kullanıcıların yazdığı
   deneyimler bu boşluğu doldurur, ama açıkça "kullanıcı deneyimi" diye etiketlenir ve denetlenir.
6. **Ücretsiz ve kendi kendine.** Para gerektirmeyen, elle bakım istemeyen çözüm seçilir. Sahibinden istenen
   adım (hesap, DNS, gizli anahtar) varsa `TODO.md` "Senin yapacakların"a tam komutuyla yazılır.

## Sıra

Durum: `açık` · `sürüyor` · `bekliyor: <neyi>` · `bitti <hash>`

### Aşama 1: sahibinden bir şey gerektirmeyenler

- **R3 · Güvenlik uyarısı geçmişi** · bitti (bkz. log) · `backend/fetch-advisories.js` her gün tarihli özet
  kaydeder (`data/advisory-history/`), böylece haftalık fark çıkarılabilir. Zamana duyarlı: geçmiş ne kadar erken
  birikmeye başlarsa R4 o kadar erken çalışır.
- **R2 · Yan panelde ülke haber akışı** · açık · Ülke kartında "Son değişiklikler": bu ülkenin pasaportunu ve bu
  ülkeye girişi etkileyen vize değişiklikleri (`data/changelog.js`), bu ülke hakkında yayımlanan güvenlik uyarısı
  değişiklikleri (R3) ve haberler (`data/visa-news.js`, şu an yalnızca 3 madde; kaynakları genişlet).
  Her maddede tarih ve kaynak bağlantısı. Seçili pasaporta göre süzülür.
- **A2 · Ortaklık metni** · bitti (bkz. log) · iVisa kutusundaki "devlet onaylı, 5–30 $" ifadesi kaynaksızdı; kaldırıldı.
  Ortak bağlantılar "partner link" olarak etiketlenir.

### Aşama 2: takip ve bildirim (sahibinden bir adım bekler)

- **R1 · Pasaporta göre takip** · bekliyor: e-posta servisi · Pasaport + istenen ülkeler seçilir; o pasaport için
  bir ülkenin kuralı değişince e-posta ve uygulama bildirimi gider. Altyapı var ama canlı değil:
  `backend/dispatch-alerts.js` (Resend + Cloudflare KV, ülke bazlı), `backend/dispatch-push.js` (FCM). Yapılacak:
  Firebase hesabındaki pasaport + izleme listesini tek abonelik kaynağı yapmak, değişiklikleri pasaporta göre
  süzmek, girişsiz e-posta aboneliği (çift onaylı), her e-postada tek tık abonelikten çıkma. Tercih: aboneleri
  Cloudflare KV yerine Firestore'da tutmak; böylece sahibinden yalnızca `RESEND_API_KEY` ve
  `FIREBASE_SERVICE_ACCOUNT` gizli anahtarları istenir (ikisi de `TODO.md`de).
- **R6 · "Takip et" düğmeleri** · R1'e bağlı · Ülke kartı, pasaport sayfaları, rehberler ve uygulamada.
- **R4 · Haftalık güvenlik özeti** · R1 + R3'e bağlı · Pasaportu veren devletin yayımladığı uyarılardan o hafta
  değişenler: "Bu hafta Birleşik Krallık, Türkiye'nin şu bölgelerine seyahati önermemeye başladı". Kapsanan
  kaynaklar: Birleşik Krallık FCDO, ABD, Kanada, Türkiye Dışişleri. Diğer pasaportlar için bu kaynakların
  özeti, açıkça "senin hükümetinin değil, şu ülkenin uyarısı" diye. Yeni kaynak eklemek ayrı madde (R4b).
- **A1 · Tek haftalık özet e-postası** · R1 + R4'e bağlı · Vize değişiklikleri, güvenlik özeti ve deneyimler tek
  e-postada. Kişi başına haftada en çok bir e-posta (acil değişiklik hariç).

### Aşama 3: topluluk

- **R5 · Deneyim paylaşımı** · açık (R1 sonrası) · Pasaport → ülke çifti için kullanıcıların başvuru deneyimi
  (ne zaman, hangi yolla, kaç gün sürdü, ne sordular). Yan panelde blog benzeri akış. Kurallar: yalnızca giriş
  yapmış kullanıcı yazar; bağlantı ve kişisel veri (telefon, e-posta, pasaport no.) otomatik engellenir; uzunluk ve
  sıklık sınırı; "bildir" düğmesi, 3 bildirimde gizlenir; otopilot her hafta gizlenenleri ve şüphelileri inceler.
  Her yazı "kullanıcı deneyimi, resmi kural değil" etiketiyle ve tarihiyle görünür. `firestore.rules`, gizlilik
  ve koşullar sayfaları (EN + TR) aynı committe güncellenir.

### Aşama 4: dağıtım

- **A3 · Paylaşılabilir sonuç kartları** · açık · Pasaport → ülke sonucu için görsel kart ve kısa bağlantı.
- **A4 · Instagram içerik hattı** · açık · Her hafta `changelog`dan otomatik gönderi taslakları (görsel + metin,
  EN + TR) `content/instagram/<tarih>/` klasörüne. Paylaşımı insan yapar.
- **A5 · Pasaport başına değişiklik akışı (RSS/JSON)** · açık · `/passport/<kod>/feed.xml`.

## Değerlendirilecek

- Uygulamada veri tazeliği (mağaza güncellemesi olmadan JSON indirme), `TODO.md`de de var.
- Başvuru son tarihi hatırlatması (`backend/dispatch-reminders.js` var, girişli hesaplara bağlanmalı).
