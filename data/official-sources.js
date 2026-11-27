// Official application facts per DESTINATION, read by hand from the government's own page.
// Nothing here comes from Wikipedia, aggregators or memory. A field we could not read on the
// official page is left out, never guessed. Every entry carries the page it was read from and the
// date it was read; `node tools/audit-data.js` warns when an entry is older than 120 days and
// its CI run (env CI) warns about links that no longer answer.
//
// Schema (keyed by destination ISO2, or SCHENGEN for every Schengen state):
//   portal:  { name, url }     the official place to apply (visa centre, e-visa or ETA portal)
//   rows:    [{ k, en, tr, price?, cur? }]
//              k = "fee" | "processing" | "stay" | "validity" | "note"
//              en / tr = the sentence fragment shown on the page (no trailing full stop)
//              price + cur (ISO 4217) only on "fee" rows; they feed the structured data
//   source:  url the facts were read from (may equal portal.url)
//   checked: ISO date of the reading
//
// Lookup: window.officialSource("GB") -> entry or null

window.OFFICIAL_SOURCES = {
  GB: {
    portal: { name: "GOV.UK, Standard Visitor visa", url: "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa" },
    rows: [
      { k: "fee", en: "Standard Visitor visa £135", tr: "Standart Ziyaretçi vizesi 135 £", price: 135, cur: "GBP" },
      { k: "fee", en: "long-term Standard Visitor visa £506 (2 years), £903 (5 years), £1,128 (10 years)", tr: "uzun dönem Standart Ziyaretçi vizesi 506 £ (2 yıl), 903 £ (5 yıl), 1.128 £ (10 yıl)" },
      { k: "processing", en: "usually a decision within 3 weeks of the application, the identity appointment and the documents", tr: "başvuru, kimlik randevusu ve belgeler tamamlandıktan sonra genellikle 3 hafta içinde karar" },
      { k: "stay", en: "up to 6 months per visit", tr: "ziyaret başına en fazla 6 ay" },
      { k: "note", en: "apply online, then attend an appointment at a visa application centre; the earliest you can apply is 3 months before travel", tr: "başvuru internetten yapılır, ardından vize başvuru merkezinde randevuya gidilir; en erken yolculuktan 3 ay önce başvurulabilir" },
    ],
    source: "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa",
    checked: "2026-11-27",
  },
  CA: {
    portal: { name: "Government of Canada, eTA", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta/apply.html" },
    rows: [
      { k: "fee", en: "eTA CAD 7 (non-refundable)", tr: "eTA 7 CAD (iade edilmez)", price: 7, cur: "CAD" },
      { k: "note", en: "the eTA is for visa-exempt nationalities travelling by air; it needs a valid passport, an email address and a card for payment", tr: "eTA, vizeden muaf uyrukların uçakla yolculuğu içindir; geçerli pasaport, e-posta adresi ve ödeme kartı gerekir" },
    ],
    source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta/apply.html",
    checked: "2026-11-27",
  },
  AU: {
    portal: { name: "Australian Department of Home Affairs, subclass 601 ETA", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601" },
    rows: [
      { k: "stay", en: "up to 3 months each time you enter", tr: "her girişte en fazla 3 ay" },
      { k: "validity", en: "12 months, multiple entries", tr: "12 ay, çoklu giriş" },
    ],
    source: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601",
    checked: "2026-11-27",
  },
  US: {
    portal: { name: "U.S. Customs and Border Protection, ESTA", url: "https://esta.cbp.dhs.gov/" },
    rows: [
      { k: "fee", en: "ESTA USD 40.62 (USD 10.62 to apply, USD 30 more if approved)", tr: "ESTA 40,62 USD (başvuruda 10,62 USD, onaylanırsa 30 USD daha)", price: 40.62, cur: "USD" },
      { k: "validity", en: "2 years", tr: "2 yıl" },
      { k: "note", en: "only for Visa Waiver Program nationalities with an e-Passport; an approved ESTA does not guarantee admission, the CBP officer decides on arrival", tr: "yalnızca Vize Muafiyeti Programı ülkelerinin çipli pasaport (e-Passport) sahipleri içindir; onaylı ESTA girişi garanti etmez, kararı varışta CBP memuru verir" },
    ],
    source: "https://esta.cbp.dhs.gov/",
    checked: "2026-11-19",
  },
  KR: {
    portal: { name: "Korea Ministry of Justice, K-ETA", url: "https://www.k-eta.go.kr/" },
    rows: [
      { k: "fee", en: "K-ETA KRW 10,000 plus a 3% online payment charge, not refunded if refused", tr: "K-ETA 10.000 KRW ve %3 internet ödeme ücreti, ret hâlinde iade edilmez", price: 10000, cur: "KRW" },
      { k: "processing", en: "usually 72 hours, sometimes longer; there is no express service", tr: "genellikle 72 saat, bazen daha uzun; hızlandırılmış hizmet yok" },
      { k: "validity", en: "3 years, multiple uses (shorter if the passport expires sooner)", tr: "3 yıl, birden çok kullanım (pasaport daha erken bitiyorsa o tarihe kadar)" },
      { k: "note", en: "approval is needed before boarding; the length of each stay is set by the visa-free rule for your nationality, not by the K-ETA", tr: "onay uçağa ya da gemiye binmeden önce alınmalı; her kalışın süresini K-ETA değil, uyruğuna uygulanan vizesiz kalış kuralı belirler" },
    ],
    source: "https://www.k-eta.go.kr/portal/guide/viewetaapplication.do",
    checked: "2026-11-27",
  },
  IN: {
    portal: { name: "Government of India, e-Visa", url: "https://indianvisaonline.gov.in/evisa/tvoa.html" },
    rows: [
      { k: "note", en: "the Government of India charges no emergency or express fee for an e-Visa; sites that offer one are not official", tr: "Hindistan hükümeti e-vize için acil ya da ekspres ücret almaz; bunu sunan siteler resmî değildir" },
      { k: "note", en: "foreigners also complete the e-Arrival card online within 72 hours before arrival; it is arrival information, not a visa", tr: "yabancılar ayrıca varıştan önceki 72 saat içinde internetten e-Arrival kartını doldurur; bu bir vize değil, varış bilgisidir" },
    ],
    source: "https://indianvisaonline.gov.in/evisa/tvoa.html",
    checked: "2026-11-27",
  },
  EG: {
    portal: { name: "Egypt e-Visa Portal", url: "https://www.visa2egypt.gov.eg/eVisa/Home" },
    rows: [
      { k: "note", en: "create the application at least 7 days before departure and pay by Visa, MasterCard or another debit card", tr: "başvuruyu yolculuktan en az 7 gün önce oluştur; ödeme Visa, MasterCard ya da başka bir banka kartıyla yapılır" },
    ],
    source: "https://www.visa2egypt.gov.eg/eVisa/Home",
    checked: "2026-11-27",
  },
  KE: {
    portal: { name: "Kenya Directorate of Immigration Services, eTA", url: "https://etakenya.go.ke/" },
    rows: [
      { k: "processing", en: "usually 3 days; an urgent service exists, but apply at least 2 weeks before travel", tr: "genellikle 3 gün; acil işlem hizmeti var, yine de yolculuktan en az 2 hafta önce başvur" },
    ],
    source: "https://etakenya.go.ke/general-information",
    checked: "2026-11-27",
  },
  VN: {
    portal: { name: "Vietnam Immigration Department, e-Visa", url: "https://evisa.gov.vn/" },
    rows: [
      { k: "note", en: "apply and pay on this site; the result arrives by email or on the e-Visa homepage", tr: "başvuru ve ödeme bu sitede yapılır; sonuç e-postayla ya da e-vize ana sayfasında bildirilir" },
    ],
    source: "https://evisa.gov.vn/",
    checked: "2026-11-27",
  },
  TR: {
    portal: { name: "Republic of Türkiye e-Visa", url: "https://www.evisa.gov.tr/en/" },
    rows: [
      { k: "note", en: "the e-Visa covers tourism and commerce only; for work or study apply at a Turkish embassy or consulate", tr: "e-vize yalnızca turizm ve ticaret amaçlı yolculuk içindir; çalışma ya da eğitim için Türk büyükelçiliği veya konsolosluğuna başvurulur" },
      { k: "processing", en: "issued online after the form and the fee payment, in about three minutes", tr: "form doldurulup ücret ödendikten sonra internetten, yaklaşık üç dakikada verilir" },
    ],
    source: "https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa",
    checked: "2026-11-27",
  },
  JP: {
    portal: { name: "Ministry of Foreign Affairs of Japan, JAPAN eVISA", url: "https://www.mofa.go.jp/j_info/visit/visa/visaonline.html" },
    rows: [
      { k: "stay", en: "visa-exempt nationalities get 90 days on arrival, except Indonesia and Thailand (15 days) and Brunei and Qatar (30 days)", tr: "vizeden muaf uyruklara girişte 90 gün verilir; Endonezya ve Tayland 15 gün, Brunei ve Katar 30 gün" },
      { k: "note", en: "the eVISA is a single-entry tourist visa for ordinary passports, open only to people living in the countries listed on the page", tr: "eVISA, umuma mahsus pasaport sahiplerine verilen tek girişli turist vizesidir; yalnızca sayfada sayılan ülkelerde yaşayanlar başvurabilir" },
    ],
    source: "https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html",
    checked: "2026-11-27",
  },
  TH: {
    portal: { name: "Thai e-Visa official website", url: "https://www.thaievisa.go.th/" },
    rows: [
      { k: "fee", en: "visa fees are not refunded, even if the visa is refused", tr: "vize ücretleri, vize reddedilse de iade edilmez" },
      { k: "note", en: "apply only while you are outside Thailand; no documents are handed in person, and the approval email is shown to the airline and to immigration", tr: "başvuru yalnızca Tayland dışındayken yapılır; belgeler elden teslim edilmez, onay e-postası havayoluna ve göç memuruna gösterilir" },
    ],
    source: "https://www.thaievisa.go.th/",
    checked: "2026-11-27",
  },
  SA: {
    portal: { name: "Saudi eVisa (Visit Saudi)", url: "https://visa.visitsaudi.com/" },
    rows: [
      { k: "validity", en: "1 year, multiple entries", tr: "1 yıl, çoklu giriş" },
      { k: "stay", en: "up to 90 days in the country", tr: "ülkede en fazla 90 gün" },
      { k: "note", en: "covers tourism, events, family visits and Umrah (not Hajj); it does not cover study", tr: "turizm, etkinlik, aile ziyareti ve umreyi kapsar (hac hariç); eğitim için geçerli değildir" },
    ],
    source: "https://visa.visitsaudi.com/",
    checked: "2026-11-27",
  },
  GE: {
    portal: { name: "Georgia e-Visa portal", url: "https://www.evisa.gov.ge/GeoVisa/en/VisaApp" },
    rows: [
      { k: "stay", en: "short visits of less than 90 days only", tr: "yalnızca 90 günden kısa ziyaretler" },
      { k: "note", en: "the passport must be valid at least 3 months beyond the visa, the form asks you to confirm travel insurance, and the details are checked at the border", tr: "pasaport vizenin bitişinden en az 3 ay sonrasına kadar geçerli olmalı, form seyahat sigortası onayı ister ve bilgiler sınırda denetlenir" },
    ],
    source: "https://www.evisa.gov.ge/GeoVisa/en/VisaApp",
    checked: "2026-11-27",
  },
  ID: {
    portal: { name: "Indonesia Directorate General of Immigration, eVisa", url: "https://evisa.imigrasi.go.id/" },
    rows: [
      { k: "note", en: "every traveller must submit an arrival card within 3 days before arriving; it can be filed on this site", tr: "her yolcu varıştan önceki 3 gün içinde varış kartı göndermek zorunda; bu sitede doldurulabilir" },
      { k: "note", en: "the electronic visa on arrival (e-VOA) can be applied for in advance, for up to 5 people at once; pay by Mastercard, Visa, JCB or SIMPONI", tr: "elektronik varışta vize (e-VOA) önceden alınabilir, tek seferde en fazla 5 kişi için; ödeme Mastercard, Visa, JCB ya da SIMPONI ile" },
    ],
    source: "https://evisa.imigrasi.go.id/",
    checked: "2026-11-27",
  },
  LK: {
    portal: { name: "Sri Lanka Department of Immigration and Emigration, ETA", url: "https://www.eta.gov.lk/slvisa/" },
    rows: [
      { k: "fee", en: "free tourist ETA for 30 days since 25 May 2026 for nationals of 40 countries, among them Türkiye, the UK, the US, India, China, Russia and most of western Europe", tr: "25 Mayıs 2026'dan beri 40 ülkenin vatandaşlarına 30 günlük ücretsiz turist ETA'sı; aralarında Türkiye, Birleşik Krallık, ABD, Hindistan, Çin, Rusya ve Batı Avrupa'nın çoğu var" },
      { k: "note", en: "every foreign visitor, including those 40 nationalities, needs an ETA before arriving", tr: "bu 40 ülke dâhil her yabancı ziyaretçinin varıştan önce ETA alması gerekir" },
    ],
    source: "https://www.eta.gov.lk/slvisa/",
    checked: "2026-11-27",
  },
  BR: {
    portal: { name: "Brazil e-Visa portal (VFS)", url: "https://brazil.vfsevisa.com/" },
    rows: [
      { k: "fee", en: "e-Visa USD 80.90 for citizens of Australia, Canada and the United States", tr: "Avustralya, Kanada ve ABD vatandaşları için e-vize 80,90 USD", price: 80.9, cur: "USD" },
      { k: "stay", en: "up to 90 days, for tourism or business", tr: "turizm ya da iş için en fazla 90 gün" },
      { k: "processing", en: "the e-Visa arrives by email within a few days when the requirements are met", tr: "şartlar sağlanırsa e-vize birkaç gün içinde e-postayla gelir" },
      { k: "note", en: "required for those three nationalities since 10 April 2025; the passport must be valid for the whole trip with 2 blank visa pages", tr: "bu üç uyruk için 10 Nisan 2025'ten beri zorunlu; pasaport yolculuk boyunca geçerli olmalı ve 2 boş vize sayfası bulunmalı" },
    ],
    source: "https://www.gov.br/mre/pt-br/consulado-miami/information-about-visas-in-english/electronic-visitor-visa-e-visa",
    checked: "2026-11-27",
  },
  // One entry for every Schengen state (list from data/etias-rules.js): the fee and the processing
  // rules are set by the EU Visa Code, the application goes to the consulate of the main destination.
  SCHENGEN: {
    portal: { name: "European Commission, applying for a Schengen visa", url: "https://home-affairs.ec.europa.eu/policies/schengen/schengen-visas/applying-schengen-visa_en" },
    rows: [
      { k: "fee", en: "Schengen visa EUR 90 for adults, EUR 45 for children aged 6 to 12", tr: "Schengen vizesi yetişkinler için 90 EUR, 6 ile 12 yaş arası çocuklar için 45 EUR", price: 90, cur: "EUR" },
      { k: "fee", en: "visa service centres may add their own service fee", tr: "vize başvuru merkezleri kendi hizmet bedellerini ekleyebilir" },
      { k: "processing", en: "normally 15 days, up to 45 days if more checks or documents are needed", tr: "normalde 15 gün, ek inceleme ya da belge gerekirse 45 güne kadar" },
      { k: "stay", en: "up to 90 days in any 180-day period across the Schengen area", tr: "Schengen alanında herhangi bir 180 günlük dönemde en fazla 90 gün" },
      { k: "note", en: "apply at least 15 days and no more than 6 months before the trip", tr: "başvuru yolculuktan en az 15 gün, en fazla 6 ay önce yapılır" },
    ],
    source: "https://home-affairs.ec.europa.eu/policies/schengen/schengen-visas/applying-schengen-visa_en",
    checked: "2026-11-27",
  },
};

window.officialSource = function (destIso) {
  const d = String(destIso || "").toUpperCase(), all = window.OFFICIAL_SOURCES || {};
  if (all[d]) return all[d];
  const schengen = window.ETIAS && window.ETIAS.schengenStates;
  return (schengen && schengen.includes(d) && all.SCHENGEN) || null;
};
