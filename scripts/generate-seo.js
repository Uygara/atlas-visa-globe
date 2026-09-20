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
  for (const f of ["countries.js", "country-names.js", "passports.js", "visa-overrides.js", "mrz.js"]) {
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
    docBand: "PASSPORT · PASAPORT · PASSEPORT",
    crumbs: (name) => ({ home: "travelnow.info", passports: "Passports", here: name }),
    title: (name, mob) => `${name} passport visa requirements 2026 — ${mob} destinations without a visa`,
    description: (name, c, rank) => `Where can a ${name} passport take you? ${c.vf} visa-free, ${c.voa} visa on arrival, ${c.ev} eVisa, ${c.vr} visa required. Global rank #${rank}. Updated daily.`,
    h1: (name) => `${name} passport visa requirements`,
    subtitle: (n, rank, date) => `${n} destinations${rank ? ` · Global rank #${rank}` : ""} · Updated ${date}`,
    scoreLabel: "destinations without a visa application",
    ofTotal: (n) => `of ${n}`,
    withEvisa: (n) => `${n} counting eVisas (apply online, no embassy visit)`,
    tallyLabel: "Visa status breakdown",
    ctaTop: "See every country on the interactive map →",
    ctaBar: (name) => `See the ${name} passport on the map`,
    ctaBarBtn: "Open the map →",
    guidesHead: "Helpful guides",
    guides: [
      ["/guides/visa-types-explained/", "Visa-free, eVisa, visa on arrival — what's the difference?"],
      ["/guides/schengen-90-180-rule/", "How the Schengen 90/180-day rule works"],
      ["/guides/passport-validity-six-month-rule/", "The six-month passport-validity rule"],
      ["/guides/", "All travel guides →"],
    ],
    allHead: (name) => `All destinations for a ${name} passport`,
    relatedHead: "Compare related passports",
    browseAll: (n) => `Or <a href="%ALL%">browse all ${n} passports</a>.`,
    faqHead: (name) => `${name} passport — frequently asked questions`,
    lead: (c) => {
      const easy = [
        `${c.vf} visa-free`,
        c.idc ? `${c.idc} with just a national ID card` : "",
        c.eta ? `${c.eta} with an online travel authorization` : "",
        `${c.voa} with a visa on arrival`,
      ].filter(Boolean);
      let h = `A ${strong(`${c.name} passport`)} currently gives its holder access to about ${strong(`${c.mob} of the ${c.total} destinations`)} we track without arranging a visa beforehand — ${LOC.en.join(easy)}.`;
      h += ` Beyond those, ${c.ev} destinations offer an eVisa you apply for online — counting them, that is ${strong(c.acc)} destinations with no embassy visit — and ${c.vr} still require a traditional embassy visa${c.ban ? `, while ${c.ban} refuse entry to this nationality` : ""}.`;
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
        ? `Travellers on a ${name} passport ${phrase}. The US visa-waiver programme also requires an approved ESTA travel authorization even when no visa is needed — our ESTA checker covers who qualifies.`
        : `Germany stands in for the Schengen Area: holders of a ${name} passport ${phrase}. From 2026 the EU's ETIAS travel authorization also applies to many visa-free visitors — see our ETIAS checker.`;
    },
    faq: (c) => [
      { q: `How many countries can ${c.name} passport holders visit without a visa?`,
        a: `Around ${c.mob} of the ${c.total} destinations we track need no visa arranged in advance — ${LOC.en.join(c.easyParts)}. A further ${c.ev} offer an eVisa online.` },
      { q: `Do ${c.name} passport holders need a visa for the United States?`, a: LOC.en.entry(c.name, "US", c.usR, "US") },
      { q: `Can you travel to Europe (the Schengen Area) on a ${c.name} passport?`, a: LOC.en.entry(c.name, "DE", c.deR, "DE") },
      { q: `How is this ranked, and how current is the data?`,
        a: `Passports are ranked by how many destinations they can enter without applying for a visa — visa-free, with a national ID card, with an online travel authorization or with a visa on arrival — the same measure passport indexes use; ties are broken by eVisa access. It is the same number and the same ranking the interactive map shows. Figures are rebuilt every 24 hours from public visa-policy sources, so this page reflects the most recent change we have recorded. Always confirm with the destination's embassy before booking.` },
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
    dirIntro: `Every passport we track, ranked by ${strong("global mobility")} — the number of destinations you can enter without applying for a visa (visa-free, ID card, travel authorization or visa on arrival), ties broken by eVisa access. It is the same ranking the interactive map shows. Open any passport for a full country breakdown, regional analysis and FAQ. Figures are rebuilt every 24 hours. New here? Start with our <a href="%TYPES%">guide to visa types</a>.`,
    dirMeta: (n, date) => `${n} passports · Data refreshed ${date}`,
    dirItem: (mob, rank) => `${mob} without a visa · #${rank}`,
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
    docBand: "PASSPORT · PASAPORT · PASSEPORT",
    crumbs: (name) => ({ home: "travelnow.info", passports: "Pasaportlar", here: name }),
    title: (name, mob) => `${name} pasaportu vize şartları 2026 — vize gerekmeyen ${mob} destinasyon`,
    description: (name, c, rank) => `${name} pasaportuyla nereye gidebilirsin? ${c.vf} vizesiz, ${c.voa} varışta vize, ${c.ev} e-Vize, ${c.vr} vize gerekli. Dünya sıralaması ${rank}. Her gün güncellenir.`,
    h1: (name) => `${name} pasaportu vize şartları`,
    subtitle: (n, rank, date) => `${n} destinasyon${rank ? ` · Dünya sıralaması ${rank}.` : ""} · Güncelleme ${date}`,
    scoreLabel: "vize başvurusu gerektirmeyen destinasyon",
    ofTotal: (n) => `/ ${n}`,
    withEvisa: (n) => `e-Vize dahil ${n} (çevrimiçi başvuru, konsolosluğa gitmeden)`,
    tallyLabel: "Vize durumu dağılımı",
    ctaTop: "Tüm ülkeleri etkileşimli haritada gör →",
    ctaBar: (name) => `${name} pasaportunu haritada gör`,
    ctaBarBtn: "Haritayı aç →",
    guidesHead: "Faydalı rehberler",
    guides: [
      ["/guides/visa-types-explained/", "Vizesiz, e-Vize, varışta vize — fark nedir?"],
      ["/guides/schengen-90-180-rule/", "Schengen 90/180 gün kuralı nasıl işler?"],
      ["/guides/passport-validity-six-month-rule/", "Altı aylık pasaport geçerlilik kuralı"],
      ["/guides/", "Tüm seyahat rehberleri →"],
    ],
    allHead: (name) => `${name} pasaportuyla gidilecek tüm destinasyonlar`,
    relatedHead: "İlgili pasaportları karşılaştır",
    browseAll: (n) => `Ya da <a href="%ALL%">tüm ${n} pasaporta göz at</a>.`,
    faqHead: (name) => `${name} pasaportu — sık sorulan sorular`,
    lead: (c) => {
      const easy = [
        `${c.vf} vizesiz`,
        c.idc ? `yalnızca ulusal kimlik kartıyla ${c.idc}` : "",
        c.eta ? `çevrimiçi seyahat iziniyle ${c.eta}` : "",
        `varışta vizeyle ${c.voa}`,
      ].filter(Boolean);
      let h = `${strong(`${c.name} pasaportu`)}, takip ettiğimiz ${c.total} destinasyondan yaklaşık ${strong(`${c.mob} tanesine`)} önceden vize almadan giriş sağlıyor — ${LOC.tr.join(easy)}.`;
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
        ? `${sentence}. Vize gerekmeyen durumlarda bile ABD Vize Muafiyeti Programı onaylı bir ESTA seyahat izni ister — kimlerin uygun olduğunu ESTA denetleyicimiz gösterir.`
        : `Almanya, Schengen Bölgesi için temsilci ülke: ${sentence}. 2026'dan itibaren AB'nin ETIAS seyahat izni de vizesiz gelen birçok ziyaretçi için geçerli olacak — ETIAS denetleyicimize bak.`;
    },
    faq: (c) => [
      { q: `${c.name} pasaportuyla vizesiz kaç ülkeye gidilebilir?`,
        a: `Takip ettiğimiz ${c.total} destinasyondan yaklaşık ${c.mob} tanesi önceden vize gerektirmiyor — ${LOC.tr.join(c.easyParts)}. ${c.ev} destinasyon ise çevrimiçi e-Vize sunuyor.` },
      { q: `${c.name} pasaportuyla Amerika Birleşik Devletleri için vize gerekir mi?`, a: LOC.tr.entry(c.name, "US", c.usR, "US") },
      { q: `${c.name} pasaportuyla Avrupa'ya (Schengen Bölgesi) gidilebilir mi?`, a: LOC.tr.entry(c.name, "DE", c.deR, "DE") },
      { q: `Sıralama nasıl yapılıyor, veriler ne kadar güncel?`,
        a: `Pasaportlar, vize başvurusu yapmadan girebildikleri destinasyon sayısına göre sıralanır — vizesiz, ulusal kimlik kartıyla, çevrimiçi seyahat iziniyle ya da varışta vizeyle — pasaport endekslerinin de kullandığı ölçüt bu; eşitlikte e-Vize erişimi belirleyici olur. Etkileşimli haritanın gösterdiği sayı ve sıralamayla aynıdır. Rakamlar her 24 saatte bir kamuya açık vize politikası kaynaklarından yeniden oluşturulur; yani bu sayfa kaydettiğimiz en son değişikliği yansıtır. Rezervasyondan önce mutlaka gideceğin ülkenin büyükelçiliğinden doğrula.` },
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
    dirIntro: `Takip ettiğimiz her pasaport, ${strong("küresel hareketlilik")}e göre sıralı — yani vize başvurusu yapmadan girilebilen destinasyon sayısı (vizesiz, kimlikle, seyahat iziniyle ya da varışta vizeyle); eşitlikte e-Vize erişimi belirleyici. Etkileşimli haritadaki sıralamayla aynıdır. Ülke dökümü, bölgesel analiz ve sık sorulan sorular için herhangi bir pasaportu aç. Rakamlar her 24 saatte bir yenilenir. Yeni misin? <a href="%TYPES%">Vize türleri rehberimizle</a> başla.`,
    dirMeta: (n, date) => `${n} pasaport · Veri yenilenme tarihi ${date}`,
    dirItem: (mob, rank) => `vizesiz ${mob} · ${rank}. sıra`,
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
    loader: client ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>` : "",
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
  const mrz = DATA.mrzLines(passport);

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
<meta name="author" content="Uygar Atalay">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" href="/assets/favicon.svg">
<meta property="og:image" content="${SITE_URL}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE_URL}/assets/og.png">
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
  "datePublished": today,
  "dateModified": today,
  "author": { "@type": "Person", "name": "Uygar Atalay" },
  "publisher": { "@type": "Organization", "name": "travelnow.info", "url": SITE_URL },
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
    <div class="bio-doc">${L.docBand}</div>
    <div class="bio-main">
      <span class="hero-flag flag" aria-hidden="true">${country.flag}</span>
      <div>
        <h1>${escapeHtml(L.h1(name))}</h1>
        <p class="subtitle">${escapeHtml(L.subtitle(total, rank, today))}</p>
      </div>
    </div>
    <div class="mrz" aria-hidden="true"><span>${escapeHtml(mrz[0])}</span><span>${escapeHtml(mrz[1])}</span></div>
  </header>

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
  <p style="font-size:13px;color:var(--fg-mute);">${escapeHtml(L.dirMeta(allPassports.length, date))}</p>
  <ul class="dir">${items}</ul>
</div>
${footer({ lang })}
</body>
</html>`;
}

// ── sitemap.xml — with hreflang alternates for every page that has a twin ───
function renderSitemap(allPassports) {
  const today = new Date().toISOString().slice(0, 10);
  const guides = [
    "visa-types-explained", "schengen-90-180-rule", "etias-2026-explained",
    "transit-visa-guide", "passport-validity-six-month-rule",
  ];
  // [english path, priority]
  const pages = [
    ["/", 1.0], ["/guides/", 0.9],
    ...guides.map(g => [`/guides/${g}/`, 0.85]),
    ["/alerts/", 0.7], ["/digital-nomad-visa/", 0.9], ["/citizenship-by-investment/", 0.9],
    ["/transit-map/", 0.95], ["/safety-map/", 0.9], ["/etias/", 0.95], ["/passport-validity/", 0.95],
    ["/visa-shortcuts/", 0.9], ["/esta-rules/", 0.9], ["/visa-checklist/tr-schengen/", 0.9],
    ["/schengen-calculator/", 0.95], ["/itinerary/", 0.8], ["/about/", 0.6], ["/contact/", 0.5],
    ["/privacy/", 0.3], ["/terms/", 0.3], ["/passport/", 0.8],
    ...allPassports.map(iso => [`/passport/${iso.toLowerCase()}/`, 0.6]),
  ];
  const entry = (p, pri, prefix) => {
    const twin = hasTr(p);
    const alt = twin
      ? `<xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${p}"/>` +
        `<xhtml:link rel="alternate" hreflang="tr" href="${SITE_URL}${toTr(p)}"/>` +
        `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${p}"/>`
      : "";
    return `<url><loc>${SITE_URL}${prefix ? toTr(p) : p}</loc><lastmod>${today}</lastmod><priority>${pri.toFixed(2).replace(/0$/, "")}</priority>${alt}</url>`;
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

function main() {
  const allPassports = Object.keys(SNAPSHOT).sort();
  const ranks = computeRanks(allPassports);
  const ads = adConfig();
  let written = 0;

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
      written++;
    }
    fs.writeFileSync(path.join(outDir, "index.html"), renderIndex(allPassports, ranks, lang));
  }

  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), renderSitemap(allPassports));

  const robotsPath = path.join(ROOT, "robots.txt");
  if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  }
  console.log(`✓ wrote ${written} passport pages (en + tr) + 2 directories + sitemap.xml`);
}

main();
