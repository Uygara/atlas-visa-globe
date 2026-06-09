# travelnow.info — Yayina Alma Rehberi (Adim Adim)

Hicbir kod yazmana gerek yok. Asagidaki adimlari sirayla uygula, ~15 dakikada
siten internette canli olur. Adres: `https://<senin-projen>.pages.dev`

Sirasi onemli:
1. GitHub hesabi + repo
2. Bu klasoru GitHub'a yukle
3. Cloudflare Pages'a bagla
4. (Opsiyonel) Kendi alan adin
5. (Opsiyonel) Gunluk otomatik vize guncellemesi
6. (Sonra) Affiliate kodlarini yapistir

---

## 1. GitHub hesabi + bos bir repo

1. `https://github.com` adresine git, hesabin yoksa ac (`Sign up`).
2. Sag ust kosedeki `+` → `New repository`.
3. Doldur:
   - **Repository name:** `atlas-visa-globe` (istedigin ismi koy)
   - **Visibility:** `Public` sec (Cloudflare ucretsiz plani icin daha kolay).
   - Asagidaki kutucuklarin **hicbirini** isaretleme (README/gitignore vs.).
4. `Create repository` bas. Acilan sayfada URL'i kopyala — ornek:
   `https://github.com/kullanici-adin/atlas-visa-globe.git`

---

## 2. Bu klasoru GitHub'a yukle

PowerShell ac (Baslat menu → "PowerShell" yaz → enter). Su komutlari **tek tek**
sirayla yapistir:

```powershell
cd "C:\Users\uygar\Downloads\CLAUDE TRAVEL WEBSITE"
git init
git add .
git commit -m "Initial commit: travelnow.info visa globe"
git branch -M main
git remote add origin https://github.com/KULLANICI-ADIN/atlas-visa-globe.git
git push -u origin main
```

> `KULLANICI-ADIN` ve repo ismini kendine gore degistir.

Eger ilk `git push`ta kullanici adi / sifre sorarsa: GitHub artik sifre kabul
etmiyor. Yapacagin: `https://github.com/settings/tokens` → `Generate new token (classic)`
→ `repo` kutusunu isaretle → olusturduktan sonra cikan uzun string'i sifre yerine
yapistir. Bir kere yapistir, Windows hatirlar.

Push bittikten sonra repo sayfasini tarayicida yenile — tum dosyalarin gelmis olmasi lazim.

---

## 3. Cloudflare Pages'a bagla (ucretsiz)

1. `https://dash.cloudflare.com` adresine git, yoksa hesap ac.
2. Sol menuden **Workers & Pages**.
3. `Create application` → `Pages` sekmesi → `Connect to Git`.
4. GitHub'i bagla (ilk seferde yetki sayfasi acilir → `Authorize`).
5. Repo listesinden `atlas-visa-globe`'u sec → `Begin setup`.
6. Build ayarlari:
   - **Project name:** `atlas-visa-globe` (URL'in bir parcasi olur)
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** (bos birak)
   - **Build output directory:** `/` (slash)
7. `Save and Deploy`. ~30 saniye sonra `https://atlas-visa-globe.pages.dev`
   adresi calisir olacak.

Bundan sonra **her `git push`'tan sonra** Cloudflare otomatik yeniden deploy
eder. Hicbir sey yapmana gerek yok.

---

## 4. (Opsiyonel) Kendi alan adin

`atlas.com.tr` gibi bir adres istiyorsan:

1. Cloudflare Pages projende `Custom domains` sekmesine git.
2. `Set up a custom domain` → alan adini yaz → Cloudflare DNS kurulumunu kendi
   gosterecek. Eger alan adini Cloudflare Registrar'dan aldiysan otomatik baglanir.
3. Baska bir kayit sirketinden (Namecheap, GoDaddy vs.) aldiysan: Cloudflare'in
   verdigi 2 nameserver'i kayit sirketinin panelinde "Nameservers" alanina yaz.
   Yaklasik 1 saat icinde calisir.

Alan adi ~$10/yil. Kayit sirketleri: Cloudflare Registrar (en ucuz), Namecheap, GoDaddy.

---

## 5. Gunluk otomatik vize guncellemesi (GitHub Actions)

Zaten hazirim — `.github/workflows/daily-refresh.yml` dosyasi her gun 06:00 UTC'de
Wikipedia'yi tarar, degisiklikleri commit'ler. Tek yapman gereken bir kere izin vermek:

1. GitHub'da repo sayfasinda `Settings` → sol menuden `Actions` → `General`.
2. Sayfayi en asagi kaydir → **Workflow permissions** bolumu.
3. `Read and write permissions` sec.
4. `Allow GitHub Actions to create and approve pull requests` kutusunu isaretle.
5. `Save`.

Hemen test etmek istersen: repo sayfasinda `Actions` sekmesi → `Daily visa refresh`
→ `Run workflow` butonu. ~5 dakika icinde tamamlanir, varsa data degisiklikleri
otomatik commit'lenir, Cloudflare yeniden deploy eder.

Eger `SITE_URL` degiskenini de ayarlamak istersen (SEO kanonik URL'leri icin):
`Settings` → `Secrets and variables` → `Actions` → `Variables` sekmesi → `New variable`
→ Ad: `SITE_URL`, Deger: `https://atlas-visa-globe.pages.dev` (veya kendi alan adin).

---

## 6. Affiliate (komisyon) kodlarini ekleme — sen aciyorsun

Suanda `data/affiliates.js` dosyasindaki tum URL'ler **bos**. Site bunlari
gosterMIYOR (taahhudun: sahte/yer tutucu link olmasin).

Adimlarin:

### iVisa (en yuksek oncelik — vize basvurusu komisyonu)
1. `https://www.ivisa.com/affiliates` adresine git, `Apply now`.
2. Onay 1-3 gun. Onaylandiginda sana bir referral link template'i verirler,
   ornek: `https://www.ivisa.com/?affId=12345`.
3. `data/affiliates.js` dosyasinda `id: "ivisa"` satirini bul, `url:` alanini doldur:
   ```js
   url: "https://www.ivisa.com/?affId=SENIN_ID_NUMARAN&destination={DEST}",
   ```
   `{DEST}` token'ini olduğu gibi birak — site otomatik olarak destinasyon ulke
   kodunu yapistirir (ornek `TR`, `US`, `JP`).

### SafetyWing (seyahat sigortasi, herkes icin)
1. `https://safetywing.com/affiliates` → basvuru. Onay 1-2 gun.
2. Verdikleri URL'i `id: "safetywing"` satirina yapistir.

### Airalo (eSIM)
1. `https://www.airalo.com/partners` → basvuru.
2. URL'i `id: "airalo"` satirina yapistir.

### VisaHQ + Wise (opsiyonel)
- VisaHQ: `https://www.visahq.com/partners`
- Wise: `https://wise.com/refer` (kendi referal linkin)

Her partner ekledikten sonra:
```powershell
cd "C:\Users\uygar\Downloads\CLAUDE TRAVEL WEBSITE"
git add data/affiliates.js
git commit -m "affiliates: add iVisa referral code"
git push
```
Cloudflare otomatik deploy eder, ~30 saniye sonra canlida gozukur.

---

## 7. Yerel olarak sitenin nasil gorundugune bak (opsiyonel)

PowerShell:
```powershell
cd "C:\Users\uygar\Downloads\CLAUDE TRAVEL WEBSITE"
python -m http.server 8000
```
Tarayici → `http://localhost:8000`. SEO sayfalari: `http://localhost:8000/passport/tr/`

---

## Hata cikarsa

- **`git push` hatasi: "remote: Permission denied"** → 2. adimdaki Personal Access
  Token'i tekrar olustur ve sifre yerine yapistir.
- **Cloudflare deploy 404 veriyor** → `Build output directory` `/` (slash) olmali,
  bos birakma.
- **Site acildi ama 198 pasaport yok, eskileri var** → tarayicida Ctrl+Shift+R yap
  (sert refresh — cache temizlenir).
- **GitHub Actions kirmizi `X` veriyor** → `Settings → Actions → General → Workflow
  permissions` ayarini kontrol et (5. adim).
