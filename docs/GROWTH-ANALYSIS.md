# Neden tıklamıyorlar? Büyüme analizi (2026-11-19)

Kaynak: Search Console 90 gün (`node tools/gsc-deep.js`, ayrıntı `.autopilot/gsc-deep.json`), GA4 ve Cloudflare.
Otopilot bu belgeyi her 4 haftada bir yeni verilerle günceller.

## Rakamlar

- 90 günde **21.000 gösterim, 29 tıklama** (Search Console). Sitenin trafiği büyük ölçüde doğrudan ve
  yönlendirme (Reddit, Ekşi Sözlük, bülten); Google'dan gelen pay çok küçük.
- Gösterimlerin %65'i (13.600) **5 ile 10. sıra arasında**, yani ilk sayfada. Buna rağmen bu bantta tıklama 17.
  Sorun sıralama değil, **sonucun aranan şeye uymaması**.
- Mobilde tıklama oranı %2,3, masaüstünde %0,2.

## Bulgu 1: niyet uyuşmazlığı (en büyük kayıp)

| Arama | Gösterim | Sıra | Tık | Google'ın gösterdiği sayfa |
|---|---|---|---|---|
| maldives visa requirements | 9.245 | 9,4 | 0 | /passport/mv/ |
| hong kong visa requirements | 1.187 | 9,6 | 0 | /passport/hk/ |
| uruguay visa requirements | 934 | 8,7 | 0 | /passport/uy/ |
| oman visa requirements | 437 | 6,2 | 0 | /passport/om/ |
| malta visa requirements | 353 | 10,7 | 0 | /passport/mt/ |

Arayan kişi o ülkeyi **ziyaret etmek** istiyor ("Maldivler'e gitmek için vize lazım mı?"). Biz ona o ülkenin
**vatandaşlarının** nereye gidebileceğini gösteriyoruz. Başlık eşleştiği için Google bizi ilk sayfaya koyuyor,
kişi sonucu okuyup tıklamıyor. Siteden bu soruya cevap veren tek bir sayfa yok.

**Çözüm (D1, yapılıyor):** her ülke için `/visa/<kod>/` sayfası: "<Ülke> vize şartları: hangi pasaporta vize
gerekir". En üstte "pasaportunu seç" denetleyicisi, durumlara göre pasaport listeleri, ve repo verisinden
"gitmeden önce" bloğu (6 ay pasaport kuralı, güvenlik uyarısı, bilinen vize ücretleri, ETIAS/ESTA, transit).
Bu sayfa başka bir sitede tek yerde yok; özgünlüğü buradan geliyor.
Beklenti: 13 bin gösterimin %3'ü bile 90 günde yaklaşık 400 tıklama demek; bugünkünün 14 katı.

## Bulgu 2: pasaport sayfalarının başlığı yanlış aramayı hedefliyor

Pasaport sayfası başlığı "Maldives passport visa requirements". Asıl hedef olan "<ülke> passport visa free
countries" aramalarında 42. sıradayız (361 gösterim, 5 tık). D1 yayına girince pasaport sayfası başlığı
"<Ülke> passport: N countries without a visa (2026)" gibi bu aramaya dönmeli. Türkçede "<ülke> pasaportu ile
vizesiz gidilen ülkeler" tam ifadesi kullanılmalı (bu aramalardan tık geliyor). **D2.**

## Bulgu 3: Schengen hesaplayıcı aramaları büyük ve sabit, biz 50. sıradayız

"schengen calculator", "90 day rule calculator" ve türevleri 90 günde yaklaşık 1.200 gösterim, 50. sıra.
Sayfa doğru ama rakipler eski ve bağlantı almış. Kazanmak için hesaplayıcının yapmadığı bir şeyi yapmak
gerekiyor: "bugünden itibaren en erken ne zaman tekrar girebilirim", "bu tarihlerde gidebilir miyim" sorusuna
tek tık cevap, tarihleri bağlantıyla paylaşma, Birleşik Krallık/ABD/Türkiye vatandaşlarına göre örnekler.
Ayrıca EES (Avrupa giriş-çıkış sistemi) ve ETIAS açıklamaları resmi kaynakla eklenebilir. **D3.**

## Bulgu 4: siteye bağlantı veren yok (otorite düşük)

Pasaport sıralama aramalarında 40-50. sıralar içerik değil otorite sorunu. Ücretsiz bağlantı kazandıracak
"paylaşılabilir varlıklar":
- **Açık veri seti (D4):** günlük güncellenen pasaport × ülke tablosu (CSV/JSON), GitHub'da ve sitede, "kaynak
  göster" lisansıyla. Araştırmacı, gazeteci ve Kaggle kullanıcıları bağlantı verir.
- **Aylık "pasaport gücü değişti" raporu (D5):** changelog'dan otomatik: bu ay hangi pasaport kaç ülke kazandı
  veya kaybetti. Reddit, Ekşi Sözlük ve Instagram için hazır içerik; haber değeri var.
- **Gömülebilir vize denetleyicisi (D6):** gezi blogcularının yazılarına koyabileceği küçük kutu, alt kısmında
  bağlantı.

## Bulgu 5: hız

Pasaport sayfası HTML'i 40 kB, ama ziyaretçi 1,1 MB indiriyor; büyük kısmı her sayfada hemen yüklenen
AdSense betiği. Betiği sayfa boştayken veya ilk kaydırmada yüklemek Core Web Vitals'ı iyileştirir. **D7.**

## Sıra

D1 → D2 → D7 → D5 → D4 → D3 → D6. Her biri `docs/ROADMAP.md` "Aşama 0: arama trafiği" bölümünde.
