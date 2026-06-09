# travelnow.info Pro — Visa Alerts Kurulum Rehberi

Tüm kod hazır ve `git push` ile canlıda. Reklamlar gibi, **sen hesapları
açana kadar hiçbir şey gözükmez/çalışmaz** — endpoint'ler 500 dönmez,
"not configured" mesajıyla zarifçe susarlar.

Bu rehbeti baştan sona uygula. Hepsi ~45 dakika. Sıralama önemli.

---

## 1. Cloudflare KV namespace (5 dk)

KV = Cloudflare'in serverless key-value veritabanı. Aboneleri burada tutuyoruz.

1. `https://dash.cloudflare.com` → sol menüde `Workers & Pages` → `KV`
2. `Create namespace` butonu → ad: `ATLAS_SUBSCRIBERS` → `Add`
3. Açılan listede yanındaki **Namespace ID**'yi kopyala (32 haneli hex)
4. Şimdi Pages projene bağla:
   - `Workers & Pages` → `atlas-visa-globe` projeni aç
   - `Settings` → `Functions` → `KV namespace bindings` → `Add binding`
   - **Variable name**: `ATLAS_SUBSCRIBERS` (tam olarak böyle yaz, kod buna bakıyor)
   - **KV namespace**: az önce oluşturduğun `ATLAS_SUBSCRIBERS`'ı seç
   - `Save`

---

## 2. Resend (transactional e-posta) — 10 dk

Resend = Stripe-vari minimalist e-posta API. Ücretsiz tier: 3000 mail/ay,
100/gün. travelnow.info gibi düşük hacim için bedava.

1. `https://resend.com/signup` → kayıt ol (Google ile giriş hızlı)
2. Sol menüde `Domains` → `Add Domain` → `travelnow.info` yaz
3. Resend sana 3 DNS kaydı verir (DKIM + SPF + DMARC olabilir). Hepsini
   Cloudflare DNS'e ekle:
   - Cloudflare dashboard → `travelnow.info` zone → `DNS` → `Records`
   - Her satır için `Add record` → type, name, value alanlarını Resend'in
     gösterdiği gibi gir → **Proxy status: DNS only** (turuncu bulut KAPALI)
4. Resend'de `Verify` butonuna bas → ~2 dk içinde yeşil tik
5. `https://resend.com/api-keys` → `Create API key`
   - Name: `atlas-production`
   - Permission: `Full access` (yeni Resend hesapları bunu sınırlıyor — `Sending access` da yeterli)
   - Domain: `travelnow.info`
   - Key'i kopyala (`re_...` ile başlar) — **bir daha gösterilmez**

---

## 3. Stripe (Pro üyelik ödemeleri) — 15 dk

1. `https://dashboard.stripe.com/register` → kayıt ol. Türkiye Stripe'ı
   doğrudan desteklemiyor → bunun yerine **Stripe travelnow.info** veya **Wise Business
   account** üzerinden açabilirsin. Alternatif: **Paddle** (Stripe yerine,
   benzer API ama Türkiye dahil 200 ülkeye merchant of record olarak hizmet
   eder). Bu rehber Stripe varsayıyor; Paddle istersen söyle, kodu güncellerim.
2. Test mode'da kal başlangıçta. Sol üstte `Test mode` toggle açık olsun.
3. `Products` → `+ Add product`:
   - Name: `travelnow.info Pro — Visa Alerts`
   - Description: `Unlimited countries on your visa-change watch-list.`
   - Pricing model: `Recurring`
   - Price: `$2.00 USD` / monthly
   - `Save product`
4. Açılan ürünün **Price ID**'sini kopyala (`price_...`)
5. Webhook ekle: `Developers` → `Webhooks` → `+ Add endpoint`
   - URL: `https://travelnow.info/api/webhook/stripe`
   - Events to listen: `checkout.session.completed`, `customer.subscription.deleted`,
     `customer.subscription.updated`, `customer.subscription.paused`
   - `Add endpoint`
   - Açılan sayfada **Signing secret** kısmında `Reveal` → kopyala (`whsec_...`)
6. Account settings → `Public Details` doldur (zorunlu, billing portal için):
   - Business name, support email, phone

---

## 4. JWT_SECRET (rastgele bir string) — 30 sn

Bu, alerts confirmation link'lerini imzalamak için kullanılan rastgele bir
anahtar. Tahmin edilemez ve yeterince uzun olmalı.

PowerShell:
```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```
Çıkan string'i kopyala. Bu değer **iki yerde aynı olmalı**: Cloudflare
Pages env (functions için) + GitHub Actions secrets (dispatcher için).

---

## 5. Cloudflare Pages — Functions env vars (5 dk)

Pages projenin `Settings` → `Environment variables` → `Production`:

| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` (production'a geçince `sk_live_...`) |
| `STRIPE_PRICE_ID` | `price_...` (3. adımda kopyaladığın) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (5. adımda kopyaladığın) |
| `RESEND_API_KEY` | `re_...` (2. adımdan) |
| `JWT_SECRET` | 4. adımdaki random string |
| `SITE_URL` | `https://travelnow.info` |
| `FROM_EMAIL` | `travelnow.info <alerts@travelnow.info>` |

Hepsini `Encrypt` olarak işaretle.

`Save`. **Yeniden deploy gerekir** — `Deployments` → en üstteki → `Retry deployment`.

---

## 6. GitHub Actions secrets (5 dk)

Dispatcher (günlük cron) Cloudflare KV'yi REST üzerinden okuyor + Resend'le
mail gönderiyor. Action secret'leri:

GitHub repo → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`:

| Secret | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → `Create Token` → template: `Read all resources` (veya custom: KV `Read` izni) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → herhangi bir zone sayfasında sağ alttaki Account ID |
| `CLOUDFLARE_KV_NAMESPACE_ID` | 1. adımda kopyaladığın namespace ID |
| `RESEND_API_KEY` | 2. adımdan |
| `JWT_SECRET` | 4. adımdaki **aynı** string |

Aynı sayfada `Variables` sekmesi → `New repository variable`:

| Variable | Value |
|---|---|
| `SITE_URL` | `https://travelnow.info` |
| `FROM_EMAIL` | `travelnow.info <alerts@travelnow.info>` |

---

## 7. Test (5 dk)

1. `https://travelnow.info/alerts/` aç
2. Email'ini gir, **1 ülke** seç (free tier), `Send confirmation email`
3. Inbox'unu kontrol et → "Confirm subscription" maili → linke tıkla → yeşil "Subscription confirmed" sayfası gelmeli
4. Pro tier test: aynı sayfada `travelnow.info Pro` kartına tıkla, 2 ülke daha seç,
   submit → Stripe Checkout açılır → test kartla öde:
   - Number: `4242 4242 4242 4242`
   - Expiry: gelecekte herhangi bir tarih
   - CVC: `123`
   - Postal: `12345`
5. Stripe başarılı → `?upgrade=ok` ile geri döner → "Payment successful" mesajı
6. Stripe dashboard → `Customers` → kullanıcını görmelisin (status: active subscription)

Hata varsa: Cloudflare Pages → `Logs` → `Functions` real-time error gösterir.

---

## 8. Test → Production geçişi (sen hazır olunca)

1. Stripe sol üstte `Test mode` toggle'ı **kapat** → live mode'a geç
2. Live mode'da `Products` → aynı ürünü tekrar oluştur, **live Price ID** al
3. Live mode'da `Webhooks` → aynı endpoint'i tekrar ekle, **live signing secret** al
4. Cloudflare Pages env vars'ı `sk_live_...`, live price ID, live webhook secret ile güncelle
5. `Retry deployment`

---

## Bana söyleyeceklerin

Hepsini bitirdikten sonra **TEK** şey bana lazım: doğrulama emaili çalıştı mı?
"hello@travelnow.info" çalışıyor mu? Eğer öyleyse Cloudflare Email Routing
adımını ben tetikleyebilirim — sadece şu cümleyi yaz:

> Email Routing kuruldu, hello@travelnow.info çalışıyor.

Sonra `about/` ve `privacy/` sayfalarında `hello@travelnow.info` adresini
GitHub linki yerine geri eklerim.

---

## Sorun çıkarsa

- **`Confirmation email sent` diyor ama mail gelmiyor**: Resend dashboard →
  `Emails` → son maile bak. `Bounce` ise domain doğrulaması yarım, `Delivered`
  ama spam'a düştüyse domain reputation düşük (DKIM/SPF kontrol et).
- **Stripe Checkout'a tıklıyor ama açılmıyor**: Pages Functions log'unda
  `STRIPE_PRICE_ID missing` mı? Env var'ı kaydet, yeniden deploy.
- **Webhook hata veriyor**: Stripe dashboard → `Developers` → `Webhooks` →
  endpoint detayı → son event'lere bak. `400 invalid signature` → webhook
  secret hatalı (Test mode ile Live mode secret'leri farklı, karıştırma).
- **Cron çalıştı ama mail atılmadı**: Action log'unda `[dispatch-alerts]
  skipping` görüyorsan → eksik secret var. `0 confirmed subscribers` → KV
  okuma izni eksik veya namespace ID yanlış.
