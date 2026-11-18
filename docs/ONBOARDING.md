# Siteye ikinci editör olarak katılmak

Bu belge, travelnow.info üzerinde Claude ile çalışacak yeni bir kişi için. Kurulum bir kez yapılır, sonra iş
şöyle yürür: Claude'a Türkçe ne istediğini yazarsın, Claude değişikliği yapar, test eder, GitHub'a gönderir
ve Cloudflare yaklaşık 30 saniyede canlıya alır.

## 1. Site sahibinin yapacakları (yaklaşık 10 dakika)

1. **GitHub**: github.com/Uygara/atlas-visa-globe → Settings → Collaborators → Add people → yeni editörün
   GitHub kullanıcı adı. Davet e-postayla gider.
2. **Google Analytics**: Admin → Property access management → "+" → editörün Gmail adresi, rol "Viewer".
3. **Search Console**: Settings → Users and permissions → Add user → aynı adres, "Restricted".
4. **Cloudflare**: Manage account → Members → Invite → aynı adres, rol "Analytics" (yalnızca okuma).
5. **Firebase** (yalnızca hesap ve bildirim işleri yapacaksa): Project settings → Users and permissions →
   Add member → "Viewer".
6. **Gizli dosya**: `.secrets/firebase-admin.json` haftalık analiz betiği için gerekir. E-posta veya mesajla
   gönderme; yüz yüze USB ile ya da bir parola yöneticisinin paylaşım özelliğiyle ver. Bu dosya olmadan da
   çalışılabilir; o zaman analiz raporunun yalnızca Cloudflare kısmı çalışır (editör kendi Cloudflare
   anahtarını üretir, aşağıda).

## 2. Editörün yapacakları (bir kez, yaklaşık 30 dakika)

1. **Kendi Claude hesabın**: Hesap paylaşmak Anthropic koşullarına aykırı, bu yüzden kendi Pro veya Max
   aboneliğinle gir. Claude masaüstü uygulamasını kur, "Code" sekmesini kullanacaksın.
2. **Programlar**: Git (git-scm.com), Node.js 20 veya üstü (nodejs.org), Python 3 ve Google Chrome.
3. **GitHub**: hesap aç, gelen daveti kabul et.
4. **Depoyu indir** (terminalde):
   ```
   git clone https://github.com/Uygara/atlas-visa-globe.git
   cd atlas-visa-globe
   git config user.name "Adın Soyadın"
   git config user.email "github-e-postan"
   cd tools && npm ci && cd ../backend && npm ci && cd ..
   ```
5. **Gizli anahtarlar** (isteğe bağlı): proje klasöründe `.secrets` klasörü aç, site sahibinden aldığın
   `firebase-admin.json` dosyasını içine koy. Cloudflare için: dash.cloudflare.com → My Profile → API Tokens →
   Create Token → Custom → izin "Account · Account Analytics · Read" → metni `.secrets/cloudflare-token.txt`
   olarak kaydet. Windows dosya adının sonuna ".txt" ekleyebilir; adın tam olarak bu olduğundan emin ol.
6. **Claude'da klasörü aç**: Code sekmesinde proje klasörünü seç. Claude `CLAUDE.md` dosyasını kendiliğinden
   okur; yazım kuralları, test adımları ve "her işi gönder" alışkanlığı oradan gelir.

## 3. Günlük çalışma

- Oturuma "TODO.md ve docs/ROADMAP.md'ye bak, sıradaki işi yap" diye başlayabilir ya da doğrudan ne istediğini
  yazabilirsin ("Instagram için bu haftanın değişikliklerinden 3 gönderi taslağı hazırla" gibi).
- **Ortak yapılacaklar listesi** `docs/ROADMAP.md`. Yeni bir fikrin varsa Claude'a "bunu ROADMAP'e ekle" de.
  Owner-only adımlar (hesap, ödeme) `TODO.md`de.
- Claude her işi test edip `main` dalına gönderir. Haftalık otopilot da aynı dala gönderdiği için Claude
  göndermeden önce `git pull --rebase` yapar; çakışma olursa sana sorar.
- Aynı anda iki kişi aynı dosyada çalışmasın. Büyük bir işe başlarken site sahibine haber ver.
- **Asla**: `.secrets/` içeriğini commit etme ya da bir yere yapıştırma; kaynağı olmayan vize bilgisi yazma
  (ücret, süre, kural). Claude bunları zaten reddeder, ama bilmekte fayda var.

## 4. Instagram ve sosyal medya

- Hesabı kendi adına ya da "travelnow.info" adıyla aç. Logo ve uygulama simgeleri `assets/` ve `app/`
  klasörlerinde; Claude doğru boyutta dışa aktarabilir.
- Gönderi fikri: haftanın vize değişiklikleri (`data/changelog.js`), güvenlik uyarısı değişiklikleri, pasaport
  sıralaması kartları. ROADMAP'teki A4 maddesi bunları her hafta otomatik taslak olarak hazırlayacak; paylaşmak
  sana kalıyor.
- Paylaşımda veri gösteriyorsan tarih ve "kaynak: travelnow.info" ekle. Sitenin sesi sade ve doğrudur; abartılı
  slogan ve ünlem kullanılmaz (`CLAUDE.md` yazım kuralları).
