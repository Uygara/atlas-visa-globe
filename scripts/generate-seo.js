// Generates the passport pages, in English and Turkish, plus sitemap.xml.
// Run: node scripts/generate-seo.js
// Output: ./passport/<iso2>/index.html (+ index)      English
//         ./tr/passport/<iso2>/index.html (+ index)   Turkish
//         ./sitemap.xml                               with hreflang alternates
//
// Each page is a real, indexable static HTML document with:
//   • A bio-data card (the site's passport identity: guilloche, real MRZ) and the
//     same headline number, ledger and ranking the interactive map shows —
//     computed by the SAME data layer (data/passports.js + visa-overrides.js,
//     run in a Node sandbox), so a page never disagrees with the map
//   • A unique, data-driven written analysis of THIS passport (rank, regional
//     strengths/weaknesses, notable destinations, FAQ) — genuine commentary on
//     top of the raw data, not a reproduced third-party table
//   • Every destination grouped by status, in compact columns
//   • Internal links to related passports + guides + tools
//   • OG / Twitter / canonical / hreflang / JSON-LD Article + FAQPage + breadcrumbs
//   • The shared masthead + footer + design-system CSS from scripts/partials.js
//
// The Turkish pages are written in Turkish (LOC.tr below), not machine-mangled
// English: Turkish searchers are the site's core audience, and text that only
// appears after client-side translation is invisible to crawlers.

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { headAssets, masthead, footer } = require("./partials");
const { TR_PAGES, hasTr, toTr } = require("./locales");

const ROOT       = path.resolve(__dirname, "..");
const SNAPSHOT   = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "passports-snapshot.json"), "utf8"));

// The browser data layer, loaded as-is: resolveStatus (ID-card travel, travel
// authorisations, hand-curated overrides, destination floors), tally,
// passportRank, the MRZ and the localized country names are exactly what the
// map shows.
const DATA = (() => {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  // The rule files below feed the "Before you go" block of the destination pages (/visa/<cc>/).
  for (const f of ["countries.js", "country-names.js", "passports.js", "visa-overrides.js", "mrz.js",
                   "passport-validity-rules.js", "travel-advisories.js", "visa-fees.js", "etias-rules.js",
                   "esta-rules.js", "transit-visa-rules.js", "affiliates.js", "changelog.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, "data", f), "utf8"), ctx, { filename: f });
  }
  return ctx;
})();
const COUNTRIES  = DATA.COUNTRIES;
// Absolute URLs everywhere (sitemap <loc>, canonicals, og:url). The sitemap
// protocol REQUIRES absolute URLs — relative ones are ignored by Google.
const SITE_URL   = process.env.SITE_URL || "https://travelnow.info";

const STATUS_ORDER = ["idc", "vf", "eta", "ev", "voa", "vr", "ban"];

// A curated set of high-interest destinations used to write the "notable"
// commentary. Naming the real resolved status for them is the curation/value-add
// Google looks for.
const MAJOR_DESTS = [
  "US", "GB", "DE", "FR", "IT", "ES", "NL", "CH", "CA", "AU", "NZ", "JP",
  "KR", "CN", "IN", "RU", "AE", "SA", "TH", "SG", "MY", "ID", "BR", "MX",
  "AR", "ZA", "EG", "TR", "GR",
];

// Destinations that need no consular visa arranged in advance.
const EASY = new Set(["idc", "vf", "eta", "voa"]);

// ─────────────────────────────────────────────────────────────────────────────
// Locale strings. Every user-visible sentence lives here, per language.
// ─────────────────────────────────────────────────────────────────────────────
const strong = (s) => `<strong>${s}</strong>`;

const LOC = {
  en: {
    code: "en", prefix: "", intl: "en",
    status: {
      idc: "ID card travel", vf: "Visa-free", eta: "Travel authorization", ev: "eVisa",
      voa: "Visa on arrival", vr: "Visa required", ban: "No entry allowed",
    },
    cont: { EU: "Europe", AS: "Asia", AF: "Africa", NA: "the Americas (North & Central)", SA: "South America", OC: "Oceania", AN: "Antarctica" },
    join: (a) => a.length <= 1 ? (a[0] || "") : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(", ")}, and ${a[a.length - 1]}`,
    upTo: (n) => `up to ${n} days`,
    crumbs: (name) => ({ home: "travelnow.info", passports: "Passports", here: name }),
    title: (name, mob) => `${name} passport visa-free countries 2026: ${mob} destinations without a visa`,
    description: (name, c, rank) => `Where can a ${name} passport take you? ${c.vf} visa-free, ${c.voa} visa on arrival, ${c.ev} eVisa, ${c.vr} visa required. Global rank #${rank}. Updated daily.`,
    h1: (name) => `${name} passport: visa-free countries and visa requirements`,
    subtitle: (n, rank, date) => `${n} destinations${rank ? `, global rank #${rank}` : ""}. Updated ${date}.`,
    feedLink: "Follow rule changes for this passport (RSS feed)",
    feedTitle: (name) => `${name} passport: visa rule changes`,
    feedDesc: (name) => `Destinations whose entry rule changed for ${name} passport holders, found by the daily comparison of public visa-policy sources (mainly Wikipedia). Check the official source before you travel.`,
    feedItem: (name, dest, from, to, date) => `${dest}: ${from} before, ${to} now, for ${name} passport holders. Seen in the daily data check on ${date}.`,
    scoreLabel: "destinations without a visa application",
    ofTotal: (n) => `of ${n}`,
    withEvisa: (n) => `${n} counting eVisas (apply online, no embassy visit)`,
    tallyLabel: "Visa status breakdown",
    ctaTop: "See every country on the interactive map →",
    ctaBar: (name) => `See the ${name} passport on the map`,
    ctaBarBtn: "Open the map →",
    guidesHead: "Helpful guides",
    guides: [
      ["/guides/visa-types-explained/", "Visa-free, eVisa, visa on arrival: what's the difference?"],
      ["/guides/schengen-90-180-rule/", "How the Schengen 90/180-day rule works"],
      ["/guides/passport-validity-six-month-rule/", "The six-month passport-validity rule"],
      ["/guides/how-we-count/", "How to read a passport's visa-free number"],
      ["/guides/", "All travel guides →"],
    ],
    allHead: (name) => `All destinations for a ${name} passport`,
    relatedHead: "Compare related passports",
    browseAll: (n) => `Or <a href="%ALL%">browse all ${n} passports</a>.`,
    faqHead: (name) => `${name} passport: frequently asked questions`,
    lead: (c) => {
      const easy = [
        `${c.vf} visa-free`,
        c.idc ? `${c.idc} with just a national ID card` : "",
        c.eta ? `${c.eta} with an online travel authorization` : "",
        `${c.voa} with a visa on arrival`,
      ].filter(Boolean);
      let h = `A ${strong(`${c.name} passport`)} currently gives its holder access to about ${strong(`${c.mob} of the ${c.total} destinations`)} we track without arranging a visa beforehand: ${LOC.en.join(easy)}.`;
      h += ` Beyond those, ${c.ev} destinations offer an eVisa you apply for online (counting them, that is ${strong(c.acc)} destinations with no embassy visit), and ${c.vr} still require a traditional embassy visa${c.ban ? `, while ${c.ban} refuse entry to this nationality` : ""}.`;
      if (c.rank) h += ` By visa-free access it ranks ${strong(`#${c.rank} of ${c.rankTotal}`)} passports worldwide.`;
      return h;
    },
    regional: (c) => `Looking at it region by region, the ${c.name} passport is strongest in ${strong(c.S)}, where ${c.Se} of ${c.St} countries are open without a prior visa, and most limited in ${strong(c.W)} (${c.We} of ${c.Wt}). The full regional picture: ${c.all}.`,
    easyMajors: (list) => `Among the destinations travellers ask about most, you can travel without a visa (or get one on arrival) to ${strong(LOC.en.join(list))}.`,
    hardMajors: (vr, ev) => {
      const parts = [];
      if (vr.length) parts.push(`a full visa to ${strong(LOC.en.join(vr))}`);
      if (ev.length) parts.push(`an eVisa for ${strong(LOC.en.join(ev))}`);
      return `You should plan ahead for ${LOC.en.join(parts)}. Sort these out before you book non-refundable travel.`;
    },
    howTo: `If a destination shows <em>eVisa</em> or <em>visa on arrival</em> below, you usually don't need to visit an embassy: an eVisa is applied for on the destination's official portal and arrives by email, while a visa on arrival is issued at the airport or land border (carry the fee and a passport valid for at least six months). Our <a href="%SHORTCUTS%">Visa Shortcuts</a> tool also shows when a visa or residence permit you already hold can unlock easier entry elsewhere.`,
    dest: { US: "the United States", DE: "Germany" },
    entry: (name, dest, r, key) => {
      const d = LOC.en.dest[key];
      const phrase = {
        idc: `can travel to ${d} with just a national ID card`,
        eta: `need no visa for ${d}, only an online travel authorization before departure`,
        vf: `can enter ${d} visa-free${r.days ? ` for up to ${r.days} days` : ""}`,
        voa: `can get a visa on arrival in ${d}`,
        ev: `need an eVisa for ${d} (applied for online before travel)`,
        vr: `need a visa for ${d} arranged in advance at an embassy or consulate`,
        ban: `are currently refused entry to ${d}`,
      }[r.status] || `should check the latest requirement for ${d}`;
      return key === "US"
        ? `Travellers on a ${name} passport ${phrase}. The US visa-waiver programme also requires an approved ESTA travel authorization even when no visa is needed: our ESTA checker covers who qualifies.`
        : `Germany stands in for the Schengen Area: holders of a ${name} passport ${phrase}. From 2026 the EU's ETIAS travel authorization also applies to many visa-free visitors: see our ETIAS checker.`;
    },
    faq: (c) => [
      { q: `How many countries can ${c.name} passport holders visit without a visa?`,
        a: `Around ${c.mob} of the ${c.total} destinations we track need no visa arranged in advance: ${LOC.en.join(c.easyParts)}. A further ${c.ev} offer an eVisa online.` },
      { q: `Do ${c.name} passport holders need a visa for the United States?`, a: LOC.en.entry(c.name, "US", c.usR, "US") },
      { q: `Can you travel to Europe (the Schengen Area) on a ${c.name} passport?`, a: LOC.en.entry(c.name, "DE", c.deR, "DE") },
      { q: `How is this ranked, and how current is the data?`,
        a: `Passports are ranked by how many destinations they can enter without applying for a visa: visa-free, with a national ID card, with an online travel authorization or with a visa on arrival (the same measure passport indexes use); ties are broken by eVisa access. It is the same number and the same ranking the interactive map shows. Figures are rebuilt every 24 hours from public visa-policy sources, so this page reflects the most recent change we have recorded. Always confirm with the destination's embassy before booking.` },
    ],
    easyParts: (c) => [
      `${c.vf} visa-free`,
      c.idc ? `${c.idc} with just a national ID card` : "",
      c.eta ? `${c.eta} with an online travel authorization` : "",
      `${c.voa} with a visa on arrival`,
    ].filter(Boolean),
    dirTitle: (y) => `Passport visa requirements directory ${y} · travelnow.info`,
    dirDesc: (n) => `Browse visa requirements and the global mobility ranking for ${n} passports. Updated daily from public visa-policy sources.`,
    dirH1: "Passport visa-requirement directory",
    dirIntro: `Every passport we track, ranked by ${strong("global mobility")}: the number of destinations you can enter without applying for a visa (visa-free, ID card, travel authorization or visa on arrival), ties broken by eVisa access. It is the same ranking the interactive map shows. Open any passport for a full country breakdown, regional analysis and FAQ. Figures are rebuilt every 24 hours. New here? Start with our <a href="%TYPES%">guide to visa types</a>.`,
    dirMeta: (n, date) => `${n} passports. Data refreshed ${date}.`,
    dirItem: (mob, rank) => `${mob} without a visa, rank #${rank}`,
    // Passport page: pointer to the inbound-visa page of the same country.
    toVisa: (name) => `Planning to visit ${theEn(name.iso, name.label)}? See who needs a visa to enter`,
  },

  tr: {
    code: "tr", prefix: "/tr", intl: "tr",
    status: {
      idc: "Kimlikle giriş", vf: "Vizesiz", eta: "Seyahat izni", ev: "e-Vize",
      voa: "Varışta vize", vr: "Vize gerekli", ban: "Girişe kapalı",
    },
    cont: { EU: "Avrupa", AS: "Asya", AF: "Afrika", NA: "Kuzey ve Orta Amerika", SA: "Güney Amerika", OC: "Okyanusya", AN: "Antarktika" },
    join: (a) => a.length <= 1 ? (a[0] || "") : `${a.slice(0, -1).join(", ")} ve ${a[a.length - 1]}`,
    upTo: (n) => `${n} güne kadar`,
    crumbs: (name) => ({ home: "travelnow.info", passports: "Pasaportlar", here: name }),
    title: (name, mob) => `${name} pasaportu ile vizesiz gidilen ülkeler 2026: ${mob} ülke`,
    description: (name, c, rank) => `${name} pasaportuyla nereye gidebilirsin? ${c.vf} vizesiz, ${c.voa} varışta vize, ${c.ev} e-Vize, ${c.vr} vize gerekli. Dünya sıralaması ${rank}. Her gün güncellenir.`,
    h1: (name) => `${name} pasaportu ile vizesiz gidilen ülkeler`,
    subtitle: (n, rank, date) => `${n} destinasyon${rank ? `, dünya sıralaması ${rank}` : ""}. Güncelleme ${date}.`,
    feedLink: "Bu pasaportun kural değişikliklerini takip et (RSS akışı)",
    feedTitle: (name) => `${name} pasaportu: vize kuralı değişiklikleri`,
    feedDesc: (name) => `${name} pasaportuyla giriş kuralı değişen ülkeler. Kamuya açık vize politikası kaynaklarının (çoğunlukla Wikipedia) günlük karşılaştırmasından. Yola çıkmadan önce resmî kaynağa bak.`,
    feedItem: (name, dest, from, to, date) => `${name} pasaportu için ${dest}: önce ${from}, şimdi ${to}. ${date} tarihli günlük veri kontrolünde görüldü.`,
    scoreLabel: "vize başvurusu gerektirmeyen destinasyon",
    ofTotal: (n) => `/ ${n}`,
    withEvisa: (n) => `e-Vize dahil ${n} (çevrimiçi başvuru, konsolosluğa gitmeden)`,
    tallyLabel: "Vize durumu dağılımı",
    ctaTop: "Tüm ülkeleri etkileşimli haritada gör →",
    ctaBar: (name) => `${name} pasaportunu haritada gör`,
    ctaBarBtn: "Haritayı aç →",
    guidesHead: "Faydalı rehberler",
    guides: [
      ["/guides/visa-types-explained/", "Vizesiz, e-Vize, varışta vize: fark nedir?"],
      ["/guides/schengen-90-180-rule/", "Schengen 90/180 gün kuralı nasıl işler?"],
      ["/guides/passport-validity-six-month-rule/", "Altı aylık pasaport geçerlilik kuralı"],
      ["/guides/how-we-count/", "Pasaportun vizesiz sayısı nasıl okunur?"],
      ["/guides/", "Tüm seyahat rehberleri →"],
    ],
    allHead: (name) => `${name} pasaportuyla gidilecek tüm destinasyonlar`,
    relatedHead: "İlgili pasaportları karşılaştır",
    browseAll: (n) => `Ya da <a href="%ALL%">tüm ${n} pasaporta göz at</a>.`,
    faqHead: (name) => `${name} pasaportu: sık sorulan sorular`,
    lead: (c) => {
      const easy = [
        `${c.vf} vizesiz`,
        c.idc ? `yalnızca ulusal kimlik kartıyla ${c.idc}` : "",
        c.eta ? `çevrimiçi seyahat iziniyle ${c.eta}` : "",
        `varışta vizeyle ${c.voa}`,
      ].filter(Boolean);
      let h = `${strong(`${c.name} pasaportu`)}, takip ettiğimiz ${c.total} destinasyondan yaklaşık ${strong(`${c.mob} tanesine`)} önceden vize almadan giriş sağlıyor: ${LOC.tr.join(easy)}.`;
      h += ` Bunların ötesinde ${c.ev} destinasyon çevrimiçi başvurulan e-Vize sunuyor; onları da sayarsan konsolosluğa gitmeden ${strong(c.acc)} destinasyona ulaşılıyor. ${c.vr} destinasyon ise hâlâ büyükelçilik vizesi istiyor${c.ban ? `, ${c.ban} destinasyon bu uyruğa girişe kapalı` : ""}.`;
      if (c.rank) h += ` Vizesiz erişimde dünya genelinde ${c.rankTotal} pasaport arasında ${strong(`${c.rank}.`)} sırada.`;
      return h;
    },
    regional: (c) => `Bölge bölge bakınca ${c.name} pasaportu en çok ${strong(c.S)} bölgesinde güçlü: ${c.St} ülkenin ${c.Se} tanesine önceden vize gerekmeden giriliyor. En sınırlı olduğu bölge ise ${strong(c.W)} (${c.Wt} ülkenin ${c.We} tanesi). Bölgelere göre tam dağılım: ${c.all}.`,
    easyMajors: (list) => `En çok sorulan destinasyonlar arasında ${strong(LOC.tr.join(list))} ülkelerine vizesiz (ya da varışta vizeyle) gidebilirsin.`,
    hardMajors: (vr, ev) => {
      const parts = [];
      if (vr.length) parts.push(`${strong(LOC.tr.join(vr))} için tam vize`);
      if (ev.length) parts.push(`${strong(LOC.tr.join(ev))} için e-Vize`);
      return `Şunlar için önceden plan yap: ${LOC.tr.join(parts)}. İade edilmeyen bilet almadan önce bunları hallet.`;
    },
    howTo: `Aşağıda <em>e-Vize</em> ya da <em>varışta vize</em> yazan ülkelerde genellikle büyükelçiliğe gitmen gerekmez: e-Vize, ülkenin resmî portalından başvurulur ve e-postayla gelir; varışta vize ise havalimanı veya kara sınırında verilir (ücreti ve en az altı ay geçerli pasaportunu yanında bulundur). <a href="%SHORTCUTS%">Vize kısayolları</a> aracımız, elindeki bir vize ya da oturum izninin başka ülkelerde girişi nasıl kolaylaştırdığını da gösterir.`,
    dest: { US: { dat: "ABD'ye", nom: "ABD" }, DE: { dat: "Almanya'ya", nom: "Almanya" } },
    entry: (name, dest, r, key) => {
      const d = LOC.tr.dest[key];
      const phrase = {
        idc: `${d.dat} yalnızca ulusal kimlik kartıyla girebilir`,
        eta: `${d.dat} vize gerekmeden, yalnızca çevrimiçi seyahat iziniyle girebilir`,
        vf: `${d.dat} vizesiz girebilir${r.days ? ` (en fazla ${r.days} gün)` : ""}`,
        voa: `${d.dat} girişte, varışta vize alabilir`,
        ev: `${d.dat} girmek için önceden çevrimiçi e-Vize almalı`,
        vr: `${d.dat} seyahatten önce büyükelçilik veya konsolosluktan vize almalı`,
      }[r.status];
      const sentence = r.status === "ban"
        ? `${name} pasaportu sahipleri için ${d.nom} girişi şu anda kapalı`
        : phrase ? `${name} pasaportu sahipleri ${phrase}` : `${name} pasaportu sahipleri ${d.nom} için güncel şartı kontrol etmeli`;
      return key === "US"
        ? `${sentence}. Vize gerekmeyen durumlarda bile ABD Vize Muafiyeti Programı onaylı bir ESTA seyahat izni ister: kimlerin uygun olduğunu ESTA denetleyicimiz gösterir.`
        : `Almanya, Schengen Bölgesi için temsilci ülke: ${sentence}. 2026'dan itibaren AB'nin ETIAS seyahat izni de vizesiz gelen birçok ziyaretçi için geçerli olacak: ETIAS denetleyicimize bak.`;
    },
    faq: (c) => [
      { q: `${c.name} pasaportuyla vizesiz kaç ülkeye gidilebilir?`,
        a: `Takip ettiğimiz ${c.total} destinasyondan yaklaşık ${c.mob} tanesi önceden vize gerektirmiyor: ${LOC.tr.join(c.easyParts)}. ${c.ev} destinasyon ise çevrimiçi e-Vize sunuyor.` },
      { q: `${c.name} pasaportuyla Amerika Birleşik Devletleri için vize gerekir mi?`, a: LOC.tr.entry(c.name, "US", c.usR, "US") },
      { q: `${c.name} pasaportuyla Avrupa'ya (Schengen Bölgesi) gidilebilir mi?`, a: LOC.tr.entry(c.name, "DE", c.deR, "DE") },
      { q: `Sıralama nasıl yapılıyor, veriler ne kadar güncel?`,
        a: `Pasaportlar, vize başvurusu yapmadan girebildikleri destinasyon sayısına göre sıralanır: vizesiz, ulusal kimlik kartıyla, çevrimiçi seyahat iziniyle ya da varışta vizeyle (pasaport endekslerinin de kullandığı ölçüt bu); eşitlikte e-Vize erişimi belirleyici olur. Etkileşimli haritanın gösterdiği sayı ve sıralamayla aynıdır. Rakamlar her 24 saatte bir kamuya açık vize politikası kaynaklarından yeniden oluşturulur; yani bu sayfa kaydettiğimiz en son değişikliği yansıtır. Rezervasyondan önce mutlaka gideceğin ülkenin büyükelçiliğinden doğrula.` },
    ],
    easyParts: (c) => [
      `${c.vf} vizesiz`,
      c.idc ? `yalnızca ulusal kimlik kartıyla ${c.idc}` : "",
      c.eta ? `çevrimiçi seyahat iziniyle ${c.eta}` : "",
      `varışta vizeyle ${c.voa}`,
    ].filter(Boolean),
    dirTitle: (y) => `Pasaport vize şartları rehberi ${y} · travelnow.info`,
    dirDesc: (n) => `${n} pasaportun vize şartlarına ve küresel hareketlilik sıralamasına göz at. Her gün kamuya açık vize politikası kaynaklarından güncellenir.`,
    dirH1: "Pasaport vize şartları rehberi",
    dirIntro: `Takip ettiğimiz her pasaport, ${strong("küresel hareketlilik")}e göre sıralı: yani vize başvurusu yapmadan girilebilen destinasyon sayısı (vizesiz, kimlikle, seyahat iziniyle ya da varışta vizeyle); eşitlikte e-Vize erişimi belirleyici. Etkileşimli haritadaki sıralamayla aynıdır. Ülke dökümü, bölgesel analiz ve sık sorulan sorular için herhangi bir pasaportu aç. Rakamlar her 24 saatte bir yenilenir. Yeni misin? <a href="%TYPES%">Vize türleri rehberimizle</a> başla.`,
    dirMeta: (n, date) => `${n} pasaport. Veri yenilenme tarihi ${date}.`,
    dirItem: (mob, rank) => `vizesiz ${mob}, ${rank}. sırada`,
    toVisa: (name) => `${name.label} ziyareti mi planlıyorsun? Hangi pasaportlara vize gerektiğini gör`,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const resolveStatus = (passportIso2, destIso2) => DATA.resolveStatus(passportIso2, destIso2);

// Localized country name (data/country-names.js reads window.ATLAS_LANG).
function cn(iso, lang) {
  DATA.ATLAS_LANG = lang;
  return DATA.countryName(iso);
}
// Passport display name: English uses the snapshot's name, Turkish the localized one.
function passportName(iso, lang) {
  return lang === "tr" ? cn(iso, "tr") : (SNAPSHOT[iso] && SNAPSHOT[iso].name) || cn(iso, "en");
}
// "20 September 2026" / "20 Eylül 2026" — ISO dates read as machine output in prose.
const fmtDate = (iso, lang) => new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
const sortCollator = (lang) => new Intl.Collator(lang === "tr" ? "tr" : "en");

// Resolve every destination the map counts (no own country, no Antarctica).
function resolveAllRows(passport, lang) {
  return COUNTRIES
    .filter(c => c.iso2 !== passport && c.continent !== "AN")
    .map(c => {
      const r = resolveStatus(passport, c.iso2);
      return { ...c, label: cn(c.iso2, lang), status: r.status, days: r.days };
    });
}

// ── Analysis prose + FAQ ─────────────────────────────────────────────────────
function buildProse(L, passport, name, rows, counts, ranks, lang) {
  const total = rows.length;
  const mob = DATA.mobilityScore(counts);
  const acc = DATA.accessScore(counts);
  const rankInfo = ranks.get(passport);
  const c = { ...counts, name, total, mob, acc, rank: rankInfo && rankInfo.rank, rankTotal: rankInfo && rankInfo.total };
  c.easyParts = L.easyParts(c);

  // Regional breakdown
  const byCont = {};
  rows.forEach(r => {
    if (r.continent === "AN") return;
    const b = byCont[r.continent] || (byCont[r.continent] = { easy: 0, total: 0 });
    b.total++;
    if (EASY.has(r.status)) b.easy++;
  });
  const regionLines = Object.keys(byCont)
    .map(k => ({ k, ...byCont[k], pct: byCont[k].easy / byCont[k].total }))
    .sort((a, b) => b.pct - a.pct);
  const S = regionLines[0], W = regionLines[regionLines.length - 1];

  // Notable destinations among the MAJOR set
  const major = MAJOR_DESTS.filter(iso => iso !== passport && SNAPSHOT[iso])
    .map(iso => ({ iso, ...resolveStatus(passport, iso) }));
  const nm = (iso) => cn(iso, lang);
  const easyMajors = major.filter(d => EASY.has(d.status)).map(d => nm(d.iso)).slice(0, 8);
  const visaMajors = major.filter(d => d.status === "vr").map(d => nm(d.iso)).slice(0, 6);
  const evisaMajors = major.filter(d => d.status === "ev").map(d => nm(d.iso)).slice(0, 5);

  const sub = (h) => h
    .replace("%SHORTCUTS%", lang === "tr" ? "/tr/visa-shortcuts/" : "/visa-shortcuts/")
    .replace("%TYPES%", lang === "tr" ? "/tr/guides/visa-types-explained/" : "/guides/visa-types-explained/");

  let html = `<section class="analysis">`;
  html += `<p class="lead">${L.lead(c)}</p>`;
  if (S && W && S.k !== W.k) {
    html += `<p>${L.regional({
      name, S: L.cont[S.k] || S.k, Se: S.easy, St: S.total, W: L.cont[W.k] || W.k, We: W.easy, Wt: W.total,
      all: regionLines.map(r => `${L.cont[r.k] || r.k} (${r.easy}/${r.total})`).join(", "),
    })}</p>`;
  }
  if (easyMajors.length) html += `<p>${L.easyMajors(easyMajors.map(escapeHtml))}</p>`;
  if (visaMajors.length || evisaMajors.length) html += `<p>${L.hardMajors(visaMajors.map(escapeHtml), evisaMajors.map(escapeHtml))}</p>`;
  html += `<p>${sub(L.howTo)}</p>`;
  html += `</section>`;

  c.usR = resolveStatus(passport, "US");
  c.deR = resolveStatus(passport, "DE");
  const faqs = L.faq(c);
  let faqHtml = `<section class="faq"><h2>${escapeHtml(L.faqHead(name))}</h2>`;
  faqs.forEach(f => { faqHtml += `<div class="qa"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`; });
  faqHtml += `</section>`;
  const faqSchema = {
    "@context": "https://schema.org", "@type": "FAQPage", "inLanguage": lang,
    "mainEntity": faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
  };
  return { proseHtml: html, faqHtml, faqSchema, mob, acc, rank: c.rank };
}

// ── Ads: rendered only when the slot id exists (data/ads.js) ─────────────────
function adConfig() {
  const adsJs = fs.readFileSync(path.join(ROOT, "data", "ads.js"), "utf8");
  const client = (adsJs.match(/clientId:\s*"([^"]*)"/) || [])[1] || "";
  const top = (adsJs.match(/seoTop:\s*"([^"]*)"/) || [])[1] || "";
  const bottom = (adsJs.match(/seoBottom:\s*"([^"]*)"/) || [])[1] || "";
  const unit = (slot) => (client && slot)
    ? `<div class="ad-slot"><ins class="adsbygoogle" style="display:block" data-ad-client="${client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`
    : "";
  return {
    loader: client ? `<script>(function(){try{var z=Intl.DateTimeFormat().resolvedOptions().timeZone||"";if(z==="Europe/Istanbul"||z==="Asia/Istanbul"||document.documentElement.lang==="tr")(window.adsbygoogle=window.adsbygoogle||[]).requestNonPersonalizedAds=1}catch(e){}})();</script><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>` : "",
    top: unit(top), bottom: unit(bottom),
  };
}

// ── One passport page ───────────────────────────────────────────────────────
function renderPage(passport, allPassports, ranks, lang, ads) {
  const L = LOC[lang];
  const pp = SNAPSHOT[passport];
  const country = COUNTRIES.find(c => c.iso2 === passport);
  if (!country || !pp) return null;
  const name = passportName(passport, lang);
  const slug = passport.toLowerCase();
  const enPath = `/passport/${slug}/`;
  const pagePath = L.prefix + enPath;
  const canonical = SITE_URL + pagePath;
  const today = new Date().toISOString().slice(0, 10);

  const rows = resolveAllRows(passport, lang);
  const counts = DATA.tally(passport);
  const collator = sortCollator(lang);
  rows.sort((a, b) => collator.compare(a.label, b.label));

  const { proseHtml, faqHtml, faqSchema, mob, acc, rank } = buildProse(L, passport, name, rows, counts, ranks, lang);
  const total = rows.length;
  const titleText = L.title(name, mob);
  const description = L.description(name, counts, rank || "?");
  // The passport's own social card (scripts/og-cards.js); the generic one until it exists.
  const ogCard = fs.existsSync(path.join(ROOT, "assets", "og", `${slug}-${lang}.png`));
  const ogImage = ogCard ? `${SITE_URL}/assets/og/${slug}-${lang}.png` : `${SITE_URL}/assets/og.png`;
  const ogAlt = `${name} · ${mob} ${L.scoreLabel}`;

  const P = (p) => (lang === "tr" && hasTr(p) ? toTr(p) : p);   // link into the same language
  const crumbs = L.crumbs(name);

  // Tally: ledger rows (only statuses that exist), each jumping to its group.
  const present = STATUS_ORDER.filter(s => counts[s] > 0);
  const swatch = (s) => `<span class="sw${s === "ban" ? " sw-ban" : ""}" data-s="${s}" style="--sw:var(--${s})" aria-hidden="true"></span>`;
  const bar = present.map(s => `<span${s === "ban" ? ' class="sw-ban"' : ""} style="flex:${counts[s]} 0 0;${s === "ban" ? "" : `background:var(--${s})`}"></span>`).join("");
  const ledger = present.map(s =>
    `<li><a class="lg-row" href="#g-${s}">${swatch(s)}<span class="lg-label">${escapeHtml(L.status[s])}</span><span class="lg-dots"></span><span class="lg-n">${counts[s]}</span></a></li>`
  ).join("");
  const tally = `<section class="tally" aria-label="${escapeHtml(L.tallyLabel)}">
    <div class="score"><span class="score-n">${mob}</span><span class="score-l">${escapeHtml(L.scoreLabel)}<br><span class="mono">${escapeHtml(L.ofTotal(total))}</span></span></div>
    ${acc > mob ? `<p class="score-sub">${escapeHtml(L.withEvisa(acc))}</p>` : ""}
    <div class="bar" aria-hidden="true">${bar}</div>
    <ul class="ledger">${ledger}</ul>
  </section>`;

  // Destinations, grouped by status in compact columns.
  const groups = present.map(s => {
    const items = rows.filter(r => r.status === s).map(r =>
      `<li><span class="flag" aria-hidden="true">${r.flag}</span> ${escapeHtml(r.label)}${r.days ? ` <span class="days">${escapeHtml(L.upTo(r.days))}</span>` : ""}</li>`
    ).join("");
    return `<section class="grp" id="g-${s}"><h3 class="grp-h">${swatch(s)}${escapeHtml(L.status[s])} <span class="n">${counts[s]}</span></h3><ul class="cols">${items}</ul></section>`;
  }).join("");

  // Related passports: same region + high-traffic anchors.
  const sameRegion = COUNTRIES.filter(c => c.continent === country.continent && c.iso2 !== passport && SNAPSHOT[c.iso2]).slice(0, 6).map(c => c.iso2);
  const anchors = ["US", "GB", "DE", "JP"].filter(iso => iso !== passport && SNAPSHOT[iso]);
  const related = Array.from(new Set([...sameRegion, ...anchors])).slice(0, 10);
  const otherPassports = related.map(iso => {
    const c = COUNTRIES.find(x => x.iso2 === iso);
    return c ? `<li><a href="../${iso.toLowerCase()}/"><span class="flag">${c.flag}</span> ${escapeHtml(passportName(iso, lang))}</a></li>` : "";
  }).join("");

  const guides = L.guides.map(([href, text]) => `<li><a href="${P(href)}">${escapeHtml(text)}</a></li>`).join("");
  const mapHref = `${lang === "tr" ? "/tr/" : "/"}?p=${passport}`;

  return `<!DOCTYPE html>
<html lang="${lang}"${lang === "tr" ? ' data-page-lang="tr"' : ""}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(titleText)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" type="application/rss+xml" title="${escapeHtml(L.feedTitle(name))}" href="${SITE_URL}${pagePath}feed.xml">
<meta name="author" content="Uygar Atalay">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:image" content="${ogImage}">${ogCard ? `
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(ogAlt)}">
<meta name="twitter:image:alt" content="${escapeHtml(ogAlt)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogImage}">
<meta property="og:title" content="${escapeHtml(titleText)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:locale" content="${lang === "tr" ? "tr_TR" : "en_US"}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:title" content="${escapeHtml(titleText)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${ads.loader}
<script src="/assets/analytics.js"></script>
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "inLanguage": lang,
  "headline": titleText,
  "description": description,
  "image": ogImage,
  "datePublished": today,
  "dateModified": today,
  "author": { "@type": "Person", "name": "Uygar Atalay" },
  "publisher": { "@type": "Organization", "name": "travelnow.info", "url": SITE_URL, "sameAs": ["https://www.instagram.com/travelnow.info/"] },
  "about": { "@type": "Country", "name": name },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "travelnow.info", "item": SITE_URL + (lang === "tr" ? "/tr/" : "/") },
      { "@type": "ListItem", "position": 2, "name": crumbs.passports, "item": SITE_URL + L.prefix + "/passport/" },
      { "@type": "ListItem", "position": 3, "name": name },
    ],
  },
})}</script>
<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
${headAssets({ enPath, lang })}
<style>.wrap{max-width:820px}</style>
</head>
<body class="has-map-cta">
${masthead({ path: enPath, i18n: false, lang })}
<div class="wrap">
  <p class="crumbs"><a href="${P("/")}">${crumbs.home}</a> › <a href="${P("/passport/")}">${escapeHtml(crumbs.passports)}</a> › ${escapeHtml(name)}</p>

  <header class="bio">
    <div class="bio-main">
      <span class="hero-flag flag" aria-hidden="true">${country.flag}</span>
      <div>
        <h1>${escapeHtml(L.h1(name))}</h1>
        <p class="subtitle">${escapeHtml(L.subtitle(total, rank, fmtDate(today, lang)))}</p>
      </div>
    </div>
  </header>

  <p class="visa-in"><a href="${P(`/visa/${slug}/`)}">${escapeHtml(L.toVisa({ iso: passport, label: name }))}</a></p>
  <p class="visa-in"><a href="${L.prefix}/passport/${slug}/feed.xml" type="application/rss+xml">${escapeHtml(L.feedLink)}</a></p>

  ${tally}

  ${proseHtml}

  <p class="cta-row"><a class="primary" href="${mapHref}">${escapeHtml(L.ctaTop)}</a></p>

  ${ads.top}

  <div class="related-guides">
    <h2>${escapeHtml(L.guidesHead)}</h2>
    <ul>${guides}</ul>
  </div>

  <h2>${escapeHtml(L.allHead(name))}</h2>
  ${groups}

  ${faqHtml}

  <div class="other-passports">
    <h2>${escapeHtml(L.relatedHead)}</h2>
    <ul>${otherPassports}</ul>
    <p class="fine" style="margin-top:14px;">${L.browseAll(allPassports.length).replace("%ALL%", P("/passport/"))}</p>
  </div>

  ${ads.bottom}
</div>
<div class="map-cta"><span>${escapeHtml(L.ctaBar(name))}</span><a class="btn btn-primary" href="${mapHref}">${escapeHtml(L.ctaBarBtn)}</a></div>
${footer({ lang })}
</body>
</html>`;
}

// ── Destination pages: who needs a visa to enter <country> ──────────────────
// /visa/<cc>/ answers the inbound question ("Maldives visa requirements") with
// the same resolver the passport pages use, read the other way round: for ONE
// destination, the status of every passport. Everything shown comes from data
// already in the repo; a "Before you go" line appears only when its source has
// an entry for this destination.
const THE_EN = new Set(["AE", "BS", "CF", "DO", "GB", "GM", "KM", "MH", "MV", "NL", "PH", "SB", "US"]);
function theEn(iso, label) { return THE_EN.has(iso) ? `the ${label}` : label; }

const FAQ_NATIONALITIES = ["US", "GB", "IN", "CN", "DE", "CA", "AU", "TR"];

const VLOC = {
  en: {
    crumb: "Visa requirements",
    title: (name, month) => `${name} visa requirements by nationality (${month}) · travelnow.info`,
    h1: (name) => `${name} visa requirements`,
    subtitle: (n, date) => `${n} passports compared. Updated ${date}.`,
    parts: {
      vf: (n) => `${n} visa-free`, idc: (n) => `${n} with a national ID card`,
      eta: (n) => `${n} with an online travel authorization`, ev: (n) => `${n} with an eVisa`,
      voa: (n) => `${n} with a visa on arrival`, vr: (n) => `${n} needing a visa in advance`,
      ban: (n) => `${n} refused entry`,
    },
    description: (the, parts) => `Who needs a visa for ${the}: ${LOC.en.join(parts)}. Check your passport, the passport-validity rule and the current travel advisory. Updated daily.`,
    lead: (the, n, parts) => `We compare ${n} passports for entry to ${the}: ${LOC.en.join(parts)}. Choose yours below to see the rule for your nationality.`,
    phrase: {
      idc: "no visa needed, a national ID card is enough", vf: "visa-free",
      eta: "no visa, but an online travel authorization is required", ev: "eVisa required, applied for online",
      voa: "visa on arrival", vr: "visa required, arranged in advance", ban: "entry not allowed",
    },
    days: (n) => `, up to ${n} days`,
    checkHead: "Check your passport",
    choose: "Choose your passport",
    who: (name) => `Citizens of ${name}`,
    more: "All destinations for this passport",
    mapBtn: "Open on the map →",
    scoreLabel: "passports can enter without a visa application",
    beforeHead: "Before you go",
    affHead: "Help with the application",
    affBody: (the) => `If your passport needs a visa for ${the}, iVisa can fill in and submit the application for you. It charges a service fee on top of the government fee, so applying yourself on the official site costs less.`,
    affBtn: "Apply with iVisa",
    affNote: "Sponsored. travelnow.info may earn a commission.",
    validity: (the, rule) => rule > 0
      ? `Passport validity: the minimum on record for ${the} is ${rule} months beyond your intended stay.`
      : `Passport validity: for ${the} the rule on record is that the passport must be valid for the length of your stay.`,
    validityLink: "Check your own passport date",
    advisory: (items) => `Travel advisories: ${items}.`,
    advisoryNames: { uk: "UK FCDO", us: "US State Department", ca: "Government of Canada" },
    levels: { 1: "normal precautions", 2: "increased caution", 3: "reconsider travel", 4: "do not travel" },
    advisoryMore: (date) => `Levels as of ${date}.`,
    safetyLink: "Open the safety map",
    feesHead: "Visa fees we have on record for some nationalities (from the official pages linked):",
    etias: (the, e, since) => `ETIAS: once it starts, visa-exempt travellers will need an ETIAS authorization for countries such as ${the} (fee ${e.fee}, valid ${e.validityYears} years). ${since ? `The EU has set the start for ${since}.` : "It is not in operation yet and the EU has not announced a start date."}`,
    etiasLink: "ETIAS checker",
    esta: (e) => `ESTA: travellers entering under the Visa Waiver Program need an approved ESTA (fee ${e.applicationFee}, valid ${e.validityYears} years).`,
    estaLink: "ESTA rules",
    transit: (area, names) => `Airport transit: nationalities that need a transit visa when changing planes in ${area}: ${names}. Exemptions apply.`,
    transitAll: "all nationalities",
    transitLink: "Open the transit map",
    schengen: "the Schengen Area",
    faqHead: (the) => `${the.charAt(0).toUpperCase() + the.slice(1)} entry: frequently asked questions`,
    faqQ: (name, the) => `Do citizens of ${name} need a visa for ${the}?`,
    faqA: {
      idc: (n, the) => `No visa is needed. Citizens of ${n} can enter ${the} with a national ID card.`,
      vf: (n, the, d) => `No. Citizens of ${n} can enter ${the} visa-free${d ? ` for up to ${d} days` : ""}.`,
      eta: (n, the) => `Not a visa, but citizens of ${n} need an online travel authorization for ${the} before departure.`,
      ev: (n, the) => `Yes, an eVisa. Citizens of ${n} apply online before travelling to ${the}.`,
      voa: (n, the, d) => `Not in advance. Citizens of ${n} can get a visa on arrival in ${the}${d ? ` (up to ${d} days)` : ""}.`,
      vr: (n, the) => `Yes. Citizens of ${n} need a visa for ${the} arranged in advance at an embassy or consulate.`,
      ban: (n, the) => `No. Entry to ${the} is currently not allowed for citizens of ${n}.`,
    },
    passportLink: (name) => `Travelling on a ${name} passport? See where it takes you`,
    relatedHead: "Other destinations in the same region",
    browseAll: (n, href) => `Or <a href="${href}">browse all ${n} destinations</a>.`,
    dirTitle: (y) => `Visa requirements by destination country ${y} · travelnow.info`,
    dirDesc: (n) => `Who needs a visa to enter ${n} countries and territories, by nationality. Updated daily from public visa-policy sources.`,
    dirH1: "Visa requirements by destination",
    dirIntro: "Pick the country you want to visit to see which passports can enter visa-free, with a visa on arrival, with an eVisa or only with a visa arranged in advance. Looking for the opposite view, where one passport can go? Use the <a href=\"%PASSPORTS%\">passport directory</a>.",
    dirMeta: (n, date) => `${n} destinations. Data refreshed ${date}.`,
  },

  tr: {
    crumb: "Vize şartları",
    title: (name, month) => `${name} vizesi: hangi pasaporta vize gerekir? (${month}) · travelnow.info`,
    h1: (name) => `${name} vize şartları`,
    subtitle: (n, date) => `${n} pasaport karşılaştırıldı. Güncelleme ${date}.`,
    parts: {
      vf: (n) => `${n} vizesiz`, idc: (n) => `${n} kimlikle`,
      eta: (n) => `${n} seyahat iziniyle`, ev: (n) => `${n} e-Vize ile`,
      voa: (n) => `${n} varışta vizeyle`, vr: (n) => `${n} önceden vizeyle`,
      ban: (n) => `${n} girişe kapalı`,
    },
    description: (name, n, parts) => `${name} vizesi kimlere gerekiyor? Takip ettiğimiz ${n} pasaport içinde: ${LOC.tr.join(parts)}. Pasaportunu, geçerlilik kuralını ve güncel seyahat uyarısını kontrol et. Her gün güncellenir.`,
    lead: (name, n, parts) => `${name} için ${n} pasaportun giriş şartını karşılaştırıyoruz: ${LOC.tr.join(parts)}. Kendi uyruğunun kuralını görmek için pasaportunu aşağıdan seç.`,
    phrase: {
      idc: "vize gerekmez, ulusal kimlik kartı yeterli", vf: "vizesiz",
      eta: "vize yok, ama çevrimiçi seyahat izni gerekli", ev: "e-Vize gerekli, çevrimiçi başvurulur",
      voa: "varışta vize", vr: "vize gerekli, önceden alınır", ban: "girişe kapalı",
    },
    days: (n) => `, ${n} güne kadar`,
    checkHead: "Pasaportunu kontrol et",
    choose: "Pasaportunu seç",
    who: (name) => `${name} pasaportu`,
    more: "Bu pasaportla gidilecek tüm destinasyonlar",
    mapBtn: "Haritada aç →",
    scoreLabel: "pasaport vize başvurusu yapmadan girebiliyor",
    beforeHead: "Gitmeden önce",
    affHead: "Başvuru için yardım",
    affBody: (label) => `Pasaportunla ${label} için vize gerekiyorsa iVisa başvuruyu senin yerine doldurup gönderebilir. Devlet harcının üstüne hizmet bedeli alır; resmi sitede kendin başvurursan daha ucuza gelir.`,
    affBtn: "iVisa ile başvur",
    affNote: "Sponsorlu. travelnow.info komisyon kazanabilir.",
    validity: (name, rule) => rule > 0
      ? `Pasaport geçerliliği: ${name} için kayıtlı en düşük süre, planladığın kalışın bitiminden sonra ${rule} aydır.`
      : `Pasaport geçerliliği: ${name} için kayıtlı kural, pasaportun kalış süresince geçerli olmasıdır.`,
    validityLink: "Kendi pasaport tarihini denetle",
    advisory: (items) => `Seyahat uyarıları: ${items}.`,
    advisoryNames: { uk: "Birleşik Krallık FCDO", us: "ABD Dışişleri", ca: "Kanada Hükümeti" },
    levels: { 1: "olağan önlemler", 2: "dikkatli ol", 3: "seyahati yeniden düşün", 4: "seyahat etme" },
    advisoryMore: (date) => `Seviyeler ${date} tarihli.`,
    safetyLink: "Güvenlik haritasını aç",
    feesHead: "Bazı uyruklar için kayıtlı vize ücretleri (bağlantılar resmî sayfalara gider):",
    etias: (name, e, since) => `ETIAS: başladığında, vizeden muaf yolcular ${name} gibi ülkeler için ETIAS izni almak zorunda olacak (ücret ${e.fee}, ${e.validityYears} yıl geçerli). ${since ? `AB başlangıç tarihini ${since} olarak açıkladı.` : "Henüz uygulanmıyor ve AB bir başlangıç tarihi açıklamadı."}`,
    etiasLink: "ETIAS denetleyicisi",
    esta: (e) => `ESTA: Vize Muafiyeti Programı ile giren yolcuların onaylı bir ESTA'sı olmalı (ücret ${e.applicationFee}, ${e.validityYears} yıl geçerli).`,
    estaLink: "ESTA kuralları",
    transit: (area, names) => `Havalimanı transiti: ${area} üzerinden aktarma yaparken transit vizesi gereken uyruklar: ${names}. Muafiyetler geçerli olabilir.`,
    transitAll: "tüm uyruklar",
    transitLink: "Transit haritasını aç",
    schengen: "Schengen Bölgesi",
    faqHead: (name) => `${name} girişi: sık sorulan sorular`,
    faqQ: (name, dest) => `${name} pasaportu sahipleri ${dest} için vize almalı mı?`,
    faqA: {
      idc: (n, d) => `Vize gerekmez. ${n} pasaportu sahipleri ${d} ülkesine ulusal kimlik kartıyla girebilir.`,
      vf: (n, d, days) => `Hayır. ${n} pasaportu sahipleri ${d} ülkesine vizesiz girebilir${days ? ` (en fazla ${days} gün)` : ""}.`,
      eta: (n, d) => `Vize değil, ama ${n} pasaportu sahipleri ${d} ülkesine gitmeden önce çevrimiçi seyahat izni almalı.`,
      ev: (n, d) => `Evet, e-Vize gerekir. ${n} pasaportu sahipleri ${d} seyahatinden önce çevrimiçi başvurur.`,
      voa: (n, d, days) => `Önceden gerekmez. ${n} pasaportu sahipleri ${d} ülkesine girişte, varışta vize alabilir${days ? ` (en fazla ${days} gün)` : ""}.`,
      vr: (n, d) => `Evet. ${n} pasaportu sahipleri ${d} için büyükelçilik veya konsolosluktan önceden vize almalı.`,
      ban: (n, d) => `Hayır. ${n} pasaportu sahipleri için ${d} girişi şu anda kapalı.`,
    },
    passportLink: (name) => `${name} pasaportuyla mı seyahat edeceksin? Nereye gidebildiğine bak`,
    relatedHead: "Aynı bölgedeki diğer destinasyonlar",
    browseAll: (n, href) => `Ya da <a href="${href}">tüm ${n} destinasyona göz at</a>.`,
    dirTitle: (y) => `Ülkeye göre vize şartları ${y} · travelnow.info`,
    dirDesc: (n) => `${n} ülke ve bölgeye girmek için hangi uyruğa vize gerektiğini gör. Her gün kamuya açık vize politikası kaynaklarından güncellenir.`,
    dirH1: "Gidilecek ülkeye göre vize şartları",
    dirIntro: "Gitmek istediğin ülkeyi seç: hangi pasaportların vizesiz, varışta vizeyle, e-Vize ile ya da yalnızca önceden alınan vizeyle girebildiğini göreceksin. Tersini mi arıyorsun, yani bir pasaportla nereye gidilir? <a href=\"%PASSPORTS%\">Pasaport rehberine</a> bak.",
    dirMeta: (n, date) => `${n} destinasyon. Veri yenilenme tarihi ${date}.`,
  },
};

// The status of every passport for one destination (cached across the two languages).
const _destRows = new Map();
function destRows(dest, allPassports) {
  if (!_destRows.has(dest)) {
    _destRows.set(dest, allPassports.filter(p => p !== dest).map(p => {
      const r = resolveStatus(p, dest);
      return { iso: p, status: r.status, days: r.days || 0 };
    }));
  }
  return _destRows.get(dest);
}

const fmtMonth = (iso, lang) => new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));

function renderDestPage(destCountry, allPassports, lang, ads) {
  const L = LOC[lang], V = VLOC[lang];
  const dest = destCountry.iso2;
  const slug = dest.toLowerCase();
  const enPath = `/visa/${slug}/`;
  const canonical = SITE_URL + L.prefix + enPath;
  const P = (p) => (lang === "tr" && hasTr(p) ? toTr(p) : p);
  const label = cn(dest, lang);
  const the = lang === "tr" ? label : theEn(dest, label);
  const snap = DATA.SNAPSHOT_DATE;
  const month = fmtMonth(snap, lang);
  const collator = sortCollator(lang);
  const flagOf = (iso) => (COUNTRIES.find(c => c.iso2 === iso) || {}).flag || "";

  const rows = destRows(dest, allPassports).map(r => ({ ...r, name: passportName(r.iso, lang) }));
  rows.sort((a, b) => collator.compare(a.name, b.name));
  const n = rows.length;
  const counts = {};
  STATUS_ORDER.forEach(s => { counts[s] = 0; });
  rows.forEach(r => { if (counts[r.status] != null) counts[r.status]++; });
  const present = STATUS_ORDER.filter(s => counts[s] > 0);
  const easy = rows.filter(r => EASY.has(r.status)).length;
  const partsAll = present.map(s => V.parts[s](counts[s]));
  const descOrder = ["vf", "voa", "ev", "vr", "eta", "idc", "ban"].filter(s => counts[s] > 0).slice(0, 4);
  const partsDesc = descOrder.map(s => V.parts[s](counts[s]));
  const titleText = V.title(label, month);
  const description = lang === "tr" ? V.description(label, n, partsDesc) : V.description(the, partsDesc);
  const pName = (iso) => passportName(iso, lang);
  const ppHref = (iso) => P(`/passport/${iso.toLowerCase()}/`);

  // Checker: this destination's column only (passport ISO2 → [status, days]).
  const chk = { p: {}, ph: V.phrase, days: V.days("{n}"), who: V.who("{name}"), pp: P("/passport/"), more: V.more, mapBase: `${lang === "tr" ? "/tr/" : "/"}` };
  rows.forEach(r => { chk.p[r.iso] = [r.status, r.days]; });
  const chkJson = JSON.stringify(chk).replace(/</g, "\\u003c");
  const options = rows.map(r => `<option value="${r.iso}">${escapeHtml(r.name)}</option>`).join("");

  const swatch = (s) => `<span class="sw${s === "ban" ? " sw-ban" : ""}" data-s="${s}" style="--sw:var(--${s})" aria-hidden="true"></span>`;
  const bar = present.map(s => `<span${s === "ban" ? ' class="sw-ban"' : ""} style="flex:${counts[s]} 0 0;${s === "ban" ? "" : `background:var(--${s})`}"></span>`).join("");
  const ledger = present.map(s =>
    `<li><a class="lg-row" href="#g-${s}">${swatch(s)}<span class="lg-label">${escapeHtml(L.status[s])}</span><span class="lg-dots"></span><span class="lg-n">${counts[s]}</span></a></li>`
  ).join("");
  const tally = `<section class="tally" aria-label="${escapeHtml(L.tallyLabel)}">
    <div class="score"><span class="score-n">${easy}</span><span class="score-l">${escapeHtml(V.scoreLabel)}<br><span class="mono">${escapeHtml(L.ofTotal(n))}</span></span></div>
    <div class="bar" aria-hidden="true">${bar}</div>
    <ul class="ledger">${ledger}</ul>
  </section>`;

  const groups = present.map(s => {
    const items = rows.filter(r => r.status === s).map(r =>
      `<li><span class="flag" aria-hidden="true">${flagOf(r.iso)}</span> <a href="${ppHref(r.iso)}">${escapeHtml(r.name)}</a>${r.days ? ` <span class="days">${escapeHtml(L.upTo(r.days))}</span>` : ""}</li>`
    ).join("");
    return `<details class="vl" id="g-${s}"><summary>${swatch(s)} ${escapeHtml(L.status[s])} <span class="n">${counts[s]}</span></summary><ul class="cols">${items}</ul></details>`;
  }).join("");

  // ── Before you go: only lines whose source has an entry for this destination ──
  const before = [];
  const rule = DATA.PASSPORT_VALIDITY && DATA.PASSPORT_VALIDITY[dest];
  if (rule != null) {
    before.push(`${escapeHtml(V.validity(the, rule))} <a href="${P("/passport-validity/")}">${escapeHtml(V.validityLink)}</a>.`);
  }
  const adv = DATA.TRAVEL_ADVISORIES && DATA.TRAVEL_ADVISORIES.countries && DATA.TRAVEL_ADVISORIES.countries[dest];
  if (adv) {
    const items = ["uk", "us", "ca"].filter(k => adv[k] && adv[k].level >= 1 && adv[k].level <= 4).map(k => {
      const nm = escapeHtml(V.advisoryNames[k]);
      const txt = `${nm}: ${escapeHtml(V.levels[adv[k].level])}`;
      return adv[k].url ? `<a href="${escapeHtml(adv[k].url)}" rel="nofollow noopener">${txt}</a>` : txt;
    });
    if (items.length) {
      before.push(`${V.advisory(items.join("; "))} ${escapeHtml(V.advisoryMore(fmtDate(DATA.TRAVEL_ADVISORIES.generated, lang)))} <a href="${P("/safety-map/")}">${escapeHtml(V.safetyLink)}</a>.`);
    }
  }
  const fees = [];
  Object.keys(DATA.VISA_FEES || {}).forEach(pp => {
    const e = DATA.visaFee(pp, dest); // verified entries only (data/visa-fees.js)
    if (e && e.fee && SNAPSHOT[pp]) fees.push({ pp, fee: e.fee, source: e.source, name: pName(pp) });
  });
  if (fees.length) {
    fees.sort((a, b) => collator.compare(a.name, b.name));
    const li = fees.map(f => `<li>${f.source ? `<a href="${escapeHtml(f.source)}" rel="nofollow noopener">${escapeHtml(f.name)}</a>` : escapeHtml(f.name)}: ${escapeHtml(f.fee)}</li>`).join("");
    before.push(`${escapeHtml(V.feesHead)}<ul class="fees">${li}</ul>`);
  }
  const ETIAS = DATA.ETIAS;
  if (ETIAS && ETIAS.schengenStates.includes(dest)) {
    before.push(`${escapeHtml(V.etias(lang === "tr" ? label : the, ETIAS, ETIAS.launchDate ? fmtDate(ETIAS.launchDate, lang) : null))} <a href="${P("/etias/")}">${escapeHtml(V.etiasLink)}</a>.`);
  }
  if (dest === "US" && DATA.ESTA) {
    before.push(`${escapeHtml(V.esta(DATA.ESTA))} <a href="${P("/esta-rules/")}">${escapeHtml(V.estaLink)}</a>.`);
  }
  const area = DATA.transitAreaForDest && DATA.transitAreaForDest(dest);
  const trRule = area && DATA.TRANSIT_RULES[area];
  if (trRule) {
    let names = null;
    if (trRule.requiredFor === "*") names = V.transitAll;
    else if (Array.isArray(trRule.requiredFor)) {
      const list = trRule.requiredFor.filter(iso => SNAPSHOT[iso] && iso !== dest).map(pName).sort(collator.compare);
      if (list.length) names = LOC[lang].join(list);
    }
    if (names) {
      const areaName = area === "SCHENGEN" ? V.schengen : (lang === "tr" ? cn(area, "tr") : theEn(area, cn(area, "en")));
      before.push(`${escapeHtml(V.transit(areaName, names))} <a href="${P("/transit-map/")}">${escapeHtml(V.transitLink)}</a>.`);
    }
  }
  const beforeHtml = before.length
    ? `<section class="before"><h2>${escapeHtml(V.beforeHead)}</h2><ul>${before.map(b => `<li>${b}</li>`).join("")}</ul></section>`
    : "";

  // Sponsored iVisa box, only where some passports need an eVisa, a visa on arrival or an embassy visa.
  const iv = (DATA.AFFILIATES || []).find(a => a.id === "ivisa" && a.url);
  const needVisa = (counts.ev || 0) + (counts.vr || 0) + (counts.voa || 0);
  const ivisaHtml = iv && needVisa
    ? `<section class="card aff"><h2>${escapeHtml(V.affHead)}</h2><p>${escapeHtml(V.affBody(the))}</p>` +
      `<p class="cta-row"><a class="primary" href="${escapeHtml(iv.url)}" target="_blank" rel="sponsored noopener noreferrer" ` +
      `onclick="window.gtag&&gtag('event','affiliate_click',{partner:'ivisa',destination:'${dest}',placement:'visa_page'})">${escapeHtml(V.affBtn)}</a></p>` +
      `<p class="ad-label">${escapeHtml(V.affNote)}</p></section>`
    : "";

  // ── FAQ: answered from the resolved status only ──
  const faqs = FAQ_NATIONALITIES.filter(iso => iso !== dest && SNAPSHOT[iso]).slice(0, 8).map(iso => {
    const r = rows.find(x => x.iso === iso);
    const nm = lang === "tr" ? pName(iso) : theEn(iso, pName(iso));
    const fn = V.faqA[r.status];
    return fn ? { q: V.faqQ(nm, lang === "tr" ? label : the), a: fn(nm, lang === "tr" ? label : the, r.days) } : null;
  }).filter(Boolean);
  const faqHtml = `<section class="faq"><h2>${escapeHtml(V.faqHead(lang === "tr" ? label : the))}</h2>${faqs.map(f => `<div class="qa"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`).join("")}</section>`;
  const faqSchema = {
    "@context": "https://schema.org", "@type": "FAQPage", "inLanguage": lang,
    "mainEntity": faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
  };
  const crumbSchema = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "travelnow.info", "item": SITE_URL + (lang === "tr" ? "/tr/" : "/") },
      { "@type": "ListItem", "position": 2, "name": V.crumb, "item": SITE_URL + L.prefix + "/visa/" },
      { "@type": "ListItem", "position": 3, "name": label },
    ],
  };

  // Related destinations: same continent, plus the way back to the passport page.
  const sameRegion = COUNTRIES.filter(c => c.continent === destCountry.continent && c.iso2 !== dest).slice(0, 8);
  const related = sameRegion.map(c => `<li><a href="../${c.iso2.toLowerCase()}/"><span class="flag">${c.flag}</span> ${escapeHtml(cn(c.iso2, lang))}</a></li>`).join("");
  const passportCta = SNAPSHOT[dest]
    ? `<p class="cta-row"><a class="primary" href="${ppHref(dest)}">${escapeHtml(V.passportLink(passportName(dest, lang)))}</a></p>`
    : "";
  const destCount = COUNTRIES.filter(c => c.continent !== "AN").length;

  return `<!DOCTYPE html>
<html lang="${lang}"${lang === "tr" ? ' data-page-lang="tr"' : ""}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(titleText)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<meta name="author" content="Uygar Atalay">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:image" content="${SITE_URL}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE_URL}/assets/og.png">
<meta property="og:title" content="${escapeHtml(titleText)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${lang === "tr" ? "tr_TR" : "en_US"}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:title" content="${escapeHtml(titleText)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${ads.loader}
<script src="/assets/analytics.js"></script>
<script type="application/ld+json">${JSON.stringify(crumbSchema)}</script>
<script type="application/ld+json">${JSON.stringify({
  // Who publishes this and how fresh the data is, for search engines and AI answers: dateModified is the
  // visa data snapshot the page was built from, datePublished the day these pages first went live.
  "@context": "https://schema.org", "@type": "WebPage", "url": canonical, "name": titleText, "inLanguage": lang,
  "datePublished": PAGE_TEMPLATE_DATE, "dateModified": snap,
  "about": { "@type": "Country", "name": label },
  "publisher": { "@type": "Organization", "name": "travelnow.info", "url": SITE_URL, "sameAs": ["https://www.instagram.com/travelnow.info/"] },
})}</script>
<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
${headAssets({ enPath, lang })}
<style>.wrap{max-width:820px}.checker{padding:20px 22px}.checker label{display:block;font-weight:650;margin-bottom:10px}.checker select{width:100%;max-width:420px}.chk-out{margin:12px 0 0;font-size:var(--fs-lg)}.chk-map{margin:14px 0 0}details.vl{margin:0 0 10px}details.vl .n{margin-inline-start:8px;font-family:var(--font-mono);font-size:var(--fs-xs);font-weight:500;color:var(--ink-3)}.before ul{padding-inline-start:20px}.before li{margin:0 0 10px;max-width:var(--measure)}.before .fees{columns:2 220px;margin:6px 0 0}.before .fees li{margin:0 0 4px}.aff p{max-width:var(--measure)}.aff .ad-label{margin:8px 0 0;font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--ink-3)}</style>
</head>
<body>
${masthead({ path: enPath, i18n: false, lang })}
<div class="wrap">
  <p class="crumbs"><a href="${P("/")}">travelnow.info</a> › <a href="${P("/visa/")}">${escapeHtml(V.crumb)}</a> › ${escapeHtml(label)}</p>

  <h1><span class="flag" aria-hidden="true">${destCountry.flag}</span> ${escapeHtml(V.h1(label))}</h1>
  <p class="subtitle">${escapeHtml(V.subtitle(n, fmtDate(snap, lang)))}</p>

  <section class="card checker" aria-label="${escapeHtml(V.checkHead)}">
    <label for="chk-sel">${escapeHtml(V.checkHead)}</label>
    <select id="chk-sel"><option value="">${escapeHtml(V.choose)}</option>${options}</select>
    <p class="chk-out" id="chk-out" aria-live="polite" hidden></p>
    <p class="chk-map"><a class="primary" id="chk-map" href="${lang === "tr" ? "/tr/" : "/"}">${escapeHtml(V.mapBtn)}</a></p>
  </section>
  <script type="application/json" id="chk-data">${chkJson}</script>
  <script>(function(){var d=JSON.parse(document.getElementById("chk-data").textContent),sel=document.getElementById("chk-sel"),out=document.getElementById("chk-out"),map=document.getElementById("chk-map");
sel.addEventListener("change",function(){var v=sel.value;if(!v||!d.p[v]){out.hidden=true;out.textContent="";map.href=d.mapBase;return}
var e=d.p[v],nm=sel.options[sel.selectedIndex].text,t=d.who.replace("{name}",nm)+": "+d.ph[e[0]]+(e[1]?d.days.replace("{n}",e[1]):"")+". ";
out.textContent=t;var a=document.createElement("a");a.href=d.pp+v.toLowerCase()+"/";a.textContent=d.more;out.appendChild(a);out.hidden=false;map.href=d.mapBase+"?p="+v});
// Answer straight away for a passport we already know: ?p=XX in the link, else the one chosen on the map
// (atlas.passport, read only; this page never writes it). The select stays editable.
(function(){var v="";try{v=(new URLSearchParams(location.search).get("p")||"").toUpperCase()}catch(x){}
if(!d.p[v]){try{var s=localStorage.getItem("atlas.passport")||"";try{s=JSON.parse(s)}catch(y){}v=String(s||"").toUpperCase()}catch(x){v=""}}
if(d.p[v]){sel.value=v;sel.dispatchEvent(new Event("change"))}})();
function openHash(){var h=location.hash.slice(1),el=h&&document.getElementById(h);if(el&&el.tagName==="DETAILS")el.open=true}
openHash();window.addEventListener("hashchange",openHash);
Array.prototype.forEach.call(document.querySelectorAll(".lg-row"),function(a){a.addEventListener("click",function(){var el=document.getElementById(a.getAttribute("href").slice(1));if(el)el.open=true})})})();</script>

  <p class="lead">${escapeHtml(lang === "tr" ? V.lead(label, n, partsAll) : V.lead(the, n, partsAll))}</p>

  ${tally}

  ${groups}

  ${beforeHtml}

  ${ivisaHtml}

  ${passportCta}

  ${faqHtml}

  <div class="other-passports">
    <h2>${escapeHtml(V.relatedHead)}</h2>
    <ul>${related}</ul>
    <p class="fine" style="margin-top:14px;">${V.browseAll(destCount, P("/visa/"))}</p>
  </div>

  ${ads.bottom}
</div>
${footer({ lang })}
</body>
</html>`;
}

function renderDestIndex(dests, lang) {
  const L = LOC[lang], V = VLOC[lang];
  const enPath = "/visa/";
  const canonical = SITE_URL + L.prefix + enPath;
  const collator = sortCollator(lang);
  const ordered = dests.map(c => ({ c, name: cn(c.iso2, lang) })).sort((a, b) => collator.compare(a.name, b.name));
  const items = ordered.map(({ c, name }) => `<li><a href="${c.iso2.toLowerCase()}/"><span class="flag">${c.flag}</span> <strong>${escapeHtml(name)}</strong></a></li>`).join("");
  const P = (p) => (lang === "tr" && hasTr(p) ? toTr(p) : p);
  const title = V.dirTitle(new Date().getFullYear());
  const description = V.dirDesc(dests.length);
  return `<!DOCTYPE html>
<html lang="${lang}"${lang === "tr" ? ' data-page-lang="tr"' : ""}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${SITE_URL}/assets/og.png">
<meta property="og:locale" content="${lang === "tr" ? "tr_TR" : "en_US"}">
${headAssets({ enPath, lang })}
<style>.wrap{max-width:880px}</style>
<script src="/assets/analytics.js"></script>
</head>
<body>
${masthead({ path: enPath, i18n: false, lang })}
<div class="wrap">
  <h1>${escapeHtml(V.dirH1)}</h1>
  <p class="intro">${V.dirIntro.replace("%PASSPORTS%", P("/passport/"))}</p>
  <p style="font-size:13px;color:var(--fg-mute);">${escapeHtml(V.dirMeta(dests.length, fmtDate(DATA.SNAPSHOT_DATE, lang)))}</p>
  <ul class="dir">${items}</ul>
</div>
${footer({ lang })}
</body>
</html>`;
}

// ── The directory page ──────────────────────────────────────────────────────
function renderIndex(allPassports, ranks, lang) {
  const L = LOC[lang];
  const enPath = "/passport/";
  const canonical = SITE_URL + L.prefix + enPath;
  const collator = sortCollator(lang);
  const ordered = [...allPassports].sort((a, b) => {
    const ra = ranks.get(a), rb = ranks.get(b);
    return (ra ? ra.rank : 999) - (rb ? rb.rank : 999) || collator.compare(passportName(a, lang), passportName(b, lang));
  });
  const items = ordered.map(iso => {
    const c = COUNTRIES.find(x => x.iso2 === iso);
    if (!c || !SNAPSHOT[iso]) return "";
    const ri = ranks.get(iso);
    return `<li><a href="${iso.toLowerCase()}/"><span class="flag">${c.flag}</span> <strong>${escapeHtml(passportName(iso, lang))}</strong></a> <span class="vf-count">${escapeHtml(L.dirItem(ri ? ri.mobility : "?", ri ? ri.rank : "?"))}</span></li>`;
  }).join("");
  const date = new Date().toISOString().slice(0, 10);
  const types = lang === "tr" ? "/tr/guides/visa-types-explained/" : "/guides/visa-types-explained/";

  return `<!DOCTYPE html>
<html lang="${lang}"${lang === "tr" ? ' data-page-lang="tr"' : ""}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(L.dirTitle(new Date().getFullYear()))}</title>
<meta name="description" content="${escapeHtml(L.dirDesc(allPassports.length))}">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<meta property="og:locale" content="${lang === "tr" ? "tr_TR" : "en_US"}">
${headAssets({ enPath, lang })}
<style>.wrap{max-width:880px}</style>
<script src="/assets/analytics.js"></script>
</head>
<body>
${masthead({ path: enPath, i18n: false, lang })}
<div class="wrap">
  <h1>${escapeHtml(L.dirH1)}</h1>
  <p class="intro">${L.dirIntro.replace("%TYPES%", types)}</p>
  <p style="font-size:13px;color:var(--fg-mute);">${escapeHtml(L.dirMeta(allPassports.length, fmtDate(date, lang)))}</p>
  <ul class="dir">${items}</ul>
</div>
${footer({ lang })}
</body>
</html>`;
}

// ── sitemap.xml — with hreflang alternates for every page that has a twin ───
// <lastmod> must be the date the page really changed: a sitemap that says "today" for every URL every day
// teaches Google to ignore it. Passport and destination pages take the newest data/changelog.js entry that
// affects them, or PAGE_TEMPLATE_DATE, whichever is later; other pages the last commit of their source file.
// Bump PAGE_TEMPLATE_DATE only when the passport/destination page content changes for everyone (new
// sections, new titles), not for styling or stamp changes. 2026-11-19: /visa/ pages and new passport titles.
const PAGE_TEMPLATE_DATE = "2026-11-19";
function gitDate(file) {
  try {
    return require("child_process").execSync(`git log -1 --format=%cs -- "${file}"`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch (e) { return ""; }
}
function lastmodResolver() {
  const today = new Date().toISOString().slice(0, 10);
  const tpl = PAGE_TEMPLATE_DATE;
  const byPassport = {}, byDest = {};
  let newest = "";
  for (const c of DATA.CHANGELOG || []) {
    if (!c || !c.date) continue;
    if (c.date > newest) newest = c.date;
    const d = c.affects && c.affects.dest;
    if (d && (!byDest[d] || c.date > byDest[d])) byDest[d] = c.date;
    for (const p of (c.affects && c.affects.passports) || []) if (!byPassport[p] || c.date > byPassport[p]) byPassport[p] = c.date;
  }
  const max = (...xs) => xs.filter(Boolean).sort().pop() || today;
  const cache = {};
  return (p) => {
    let m;
    if ((m = /^\/passport\/([a-z]{2})\/$/.exec(p))) return max(tpl, byPassport[m[1].toUpperCase()]);
    if ((m = /^\/visa\/([a-z]{2})\/$/.exec(p))) return max(tpl, byDest[m[1].toUpperCase()]);
    if (p === "/passport/" || p === "/visa/") return max(tpl, newest);
    if (!(p in cache)) cache[p] = gitDate(p.replace(/^\//, "") + "index.html") || today;
    return cache[p] > today ? today : cache[p];
  };
}

function renderSitemap(allPassports, destinations) {
  const lastmodOf = lastmodResolver();
  const guides = [
    "visa-types-explained", "schengen-90-180-rule", "etias-2026-explained",
    "transit-visa-guide", "passport-validity-six-month-rule", "how-we-count",
  ];
  // [english path, priority]
  const pages = [
    ["/", 1.0], ["/guides/", 0.9],
    ...guides.map(g => [`/guides/${g}/`, 0.85]),
    ["/alerts/", 0.7], ["/panel/", 0.7],["/digital-nomad-visa/", 0.9], ["/citizenship-by-investment/", 0.9],
    ["/transit-map/", 0.95], ["/safety-map/", 0.9], ["/etias/", 0.95], ["/passport-validity/", 0.95],
    ["/visa-shortcuts/", 0.9], ["/esta-rules/", 0.9], ["/visa-checklist/tr-schengen/", 0.9],
    ["/schengen-calculator/", 0.95], ["/itinerary/", 0.8], ["/about/", 0.6], ["/contact/", 0.5],
    ["/privacy/", 0.3], ["/terms/", 0.3], ["/passport/", 0.8],
    ...allPassports.map(iso => [`/passport/${iso.toLowerCase()}/`, 0.6]),
    ["/visa/", 0.8],
    ...destinations.map(c => [`/visa/${c.iso2.toLowerCase()}/`, 0.7]),
    ["/reports/", 0.7], ["/open-data/", 0.7],
    ...require("./generate-reports").reportUrls()
      .filter(u => !u.includes("/tr/") && /\/reports\/\d{4}-\d{2}\/$/.test(u))
      .map(u => [u.replace(SITE_URL, "").replace("https://travelnow.info", ""), 0.6]),
  ];
  const entry = (p, pri, prefix) => {
    const twin = hasTr(p);
    const alt = twin
      ? `<xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${p}"/>` +
        `<xhtml:link rel="alternate" hreflang="tr" href="${SITE_URL}${toTr(p)}"/>` +
        `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${p}"/>`
      : "";
    return `<url><loc>${SITE_URL}${prefix ? toTr(p) : p}</loc><lastmod>${lastmodOf(p)}</lastmod><priority>${pri.toFixed(2).replace(/0$/, "")}</priority>${alt}</url>`;
  };
  const urls = [];
  for (const [p, pri] of pages) {
    urls.push(entry(p, pri, false));
    if (hasTr(p)) urls.push(entry(p, Math.max(0.3, pri - 0.05), true));
  }
  // NOTE the namespace: sitemaps.org (with the "s"). A missing "s" makes Google
  // reject the whole file.
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
}

function computeRanks(allPassports) {
  const ranks = new Map();
  for (const iso of allPassports) {
    const r = DATA.passportRank(iso);
    if (r) ranks.set(iso, r);
  }
  return ranks;
}

// RSS 2.0 feed of this passport's changelog entries (roadmap A5): /passport/<cc>/feed.xml, /tr/passport/<cc>/feed.xml.
// Items come only from data/changelog.js (real day-over-day diffs); nothing is written by hand.
function renderFeed(passport, lang) {
  const L = LOC[lang];
  const name = passportName(passport, lang);
  const slug = passport.toLowerCase();
  const pageUrl = `${SITE_URL}${L.prefix}/passport/${slug}/`;
  const x = escapeHtml;
  const items = (DATA.CHANGELOG || [])
    .filter((e) => e.affects && (e.affects.passports || []).includes(passport) && L.status[e.statusFrom] && L.status[e.statusTo])
    // Only changes the map still shows: a later flip back to the default status is not logged, and
    // overrides (ETA, floors) can differ from the raw scrape. 21 of 322 entries failed this on 2026-11-21.
    .filter((e) => resolveStatus(passport, e.affects.dest).status === e.statusTo)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 50);
  const rfc = (d) => new Date(d + "T00:00:00Z").toUTCString();
  const body = items.map((e) => {
    const dest = cn(e.affects.dest, lang);
    const from = L.status[e.statusFrom], to = L.status[e.statusTo];
    // Mid-sentence labels in lower case ("Visa required" -> "visa required"); "eVisa" / "e-Vize" stay as they are.
    const lc = (t) => (/^[A-ZÇĞİÖŞÜ][a-zçğıöşü]/.test(t) ? t[0].toLocaleLowerCase(lang) + t.slice(1) : t);
    const link = `${SITE_URL}${L.prefix}/visa/${e.affects.dest.toLowerCase()}/`;
    return [
      "  <item>",
      `    <title>${x(`${dest}: ${from} → ${to}`)}</title>`,
      `    <link>${link}</link>`,
      `    <guid isPermaLink="false">travelnow-${passport}-${e.affects.dest}-${e.date}-${e.statusTo}</guid>`,
      `    <pubDate>${rfc(e.date)}</pubDate>`,
      `    <description>${x(L.feedItem(name, dest, lc(from), lc(to), fmtDate(e.date, lang)))}</description>`,
      "  </item>",
    ].join("\n");
  }).join("\n");
  const last = items.length ? rfc(items[0].date) : rfc("2026-05-21");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${x(L.feedTitle(name))}</title>
  <link>${pageUrl}</link>
  <description>${x(L.feedDesc(name))}</description>
  <language>${lang}</language>
  <lastBuildDate>${last}</lastBuildDate>
  <atom:link href="${pageUrl}feed.xml" rel="self" type="application/rss+xml"/>
${body}
</channel>
</rss>
`;
}

function main() {
  const allPassports = Object.keys(SNAPSHOT).sort();
  const ranks = computeRanks(allPassports);
  const ads = adConfig();
  let written = 0, destWritten = 0;
  const destinations = COUNTRIES.filter(c => c.continent !== "AN");

  for (const lang of ["en", "tr"]) {
    const L = LOC[lang];
    const outDir = path.join(ROOT, ...(L.prefix ? [L.prefix.slice(1)] : []), "passport");
    fs.mkdirSync(outDir, { recursive: true });
    for (const iso of allPassports) {
      const html = renderPage(iso, allPassports, ranks, lang, ads);
      if (!html) { console.log(`✗ skip ${iso} (no country / no data)`); continue; }
      const dir = path.join(outDir, iso.toLowerCase());
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), html);
      fs.writeFileSync(path.join(dir, "feed.xml"), renderFeed(iso, lang));
      written++;
    }
    fs.writeFileSync(path.join(outDir, "index.html"), renderIndex(allPassports, ranks, lang));

    // Destination pages: /visa/<cc>/ (who needs a visa to enter that country).
    const visaDir = path.join(ROOT, ...(L.prefix ? [L.prefix.slice(1)] : []), "visa");
    fs.mkdirSync(visaDir, { recursive: true });
    for (const c of destinations) {
      const dir = path.join(visaDir, c.iso2.toLowerCase());
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), renderDestPage(c, allPassports, lang, ads));
      destWritten++;
    }
    fs.writeFileSync(path.join(visaDir, "index.html"), renderDestIndex(destinations, lang));
  }

  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), renderSitemap(allPassports, destinations));

  const robotsPath = path.join(ROOT, "robots.txt");
  if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  }
  console.log(`✓ wrote ${written} passport pages (en + tr) + ${destWritten} destination pages + 4 directories + sitemap.xml`);
}

// `node scripts/generate-seo.js` writes the pages; scripts/og-cards.js requires this
// file for the same data layer and strings without writing anything.
if (require.main === module) main();
module.exports = { DATA, SNAPSHOT, LOC, computeRanks, passportName };
