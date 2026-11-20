// Generates the monthly "passport power" reports, in English and Turkish.
// Run: node scripts/generate-reports.js
// Output: ./reports/<yyyy-mm>/index.html (+ ./reports/index.html)        English
//         ./tr/reports/<yyyy-mm>/index.html (+ ./tr/reports/index.html)  Turkish
//
// Built only from data/changelog.js (day-over-day diffs of the visa data).
// Within a month, each (passport, destination) pair is netted: first statusFrom,
// last statusTo; a change that was reversed in the same month is dropped.
// sitemap.xml is written by generate-seo.js, which can call reportUrls().

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { headAssets, masthead, footer } = require("./partials");

const ROOT = path.resolve(__dirname, "..");
const SITE_URL = process.env.SITE_URL || "https://travelnow.info";
const FIRST_MONTH = "2026-06";
const EASY = new Set(["idc", "vf", "eta", "voa"]);
const TOP = 10;

const DATA = (() => {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ["changelog.js", "countries.js", "country-names.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, "data", f), "utf8"), ctx, { filename: f });
  }
  return ctx;
})();
const CHANGELOG = DATA.CHANGELOG;
const FLAG = {};
for (const c of DATA.COUNTRIES) FLAG[c.iso2] = c.flag;

function cn(iso, lang) {
  DATA.ATLAS_LANG = lang;
  return DATA.countryName(iso);
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// ── Locale strings ───────────────────────────────────────────────────────────
const LOC = {
  en: {
    prefix: "", intl: "en-GB", ogLocale: "en_US",
    status: {
      idc: "ID card travel", vf: "Visa-free", eta: "Travel authorization", ev: "eVisa",
      voa: "Visa on arrival", vr: "Visa required", ban: "No entry allowed",
    },
    plural: (n, one, many) => `${n} ${n === 1 ? one : many}`,
    title: (m) => `Passport power changes, ${m}: which passports gained and lost visa-free access`,
    h1: (m) => `Passport power changes, ${m}`,
    desc: (m, s) => `${s.changes} visa-policy changes recorded in ${m}, affecting ${s.passports} passports and ${s.dests} destinations. Which passports gained and lost visa-free access.`,
    crumbs: { home: "travelnow.info", reports: "Monthly reports" },
    soFar: (m, date) => `${m} so far (data to ${date})`,
    partial: (date) => `This month is not over. The report covers changes recorded up to ${date}.`,
    intro: (m, s, soFar) =>
      `${soFar ? "So far in" : "In"} ${m}, our daily snapshot recorded ${s.changes} visa-policy ${s.changes === 1 ? "change" : "changes"} affecting ${s.passports} ${s.passports === 1 ? "passport" : "passports"} and ${s.dests} ${s.dests === 1 ? "destination" : "destinations"}. ` +
      `Counted as destinations that need no visa arranged in advance (visa-free, ID card travel, travel authorization and visa on arrival), ${s.gainers} ${s.gainers === 1 ? "passport" : "passports"} gained on balance and ${s.losers} lost.`,
    empty: "No changes were recorded this month.",
    gainsH: "Biggest gains",
    lossesH: "Biggest losses",
    gainsNote: "Passports ranked by the net change in destinations with easy access (visa-free, ID card travel, travel authorization or visa on arrival).",
    noneGain: "No passport gained easy access on balance.",
    noneLoss: "No passport lost easy access on balance.",
    net: (n) => `${n > 0 ? "+" : "-"}${Math.abs(n)}`,
    netTitle: (n) => `${Math.abs(n)} ${Math.abs(n) === 1 ? "destination" : "destinations"} ${n > 0 ? "gained" : "lost"}, net`,
    destsH: "Destinations that changed their rules",
    destsNote: (n) => `${n} ${n === 1 ? "destination" : "destinations"}, most changes first. Each line shows the passport and the status before and after.`,
    methodH: "How to read this",
    method: "These are changes recorded in our daily snapshot of public visa-policy data (Wikipedia's visa requirement articles). A change can reflect a correction in the source rather than a new rule. Check the destination's official site before you travel.",
    methodNet: "Within a month, a change that was later reversed is left out, so only the net result is counted.",
    prev: (m) => `Previous: ${m}`,
    next: (m) => `Next: ${m}`,
    allReports: "All monthly reports",
    indexTitle: "Monthly passport power reports: visa-free access gained and lost",
    indexH1: "Monthly passport power reports",
    indexDesc: "Month-by-month reports on which passports gained and lost visa-free access, built from our daily snapshots of public visa-policy data.",
    indexIntro: "Each report lists the passports that gained or lost easy access to destinations during the month, and the destinations that changed their rules. The data comes from our daily snapshots of public visa-policy data.",
    indexLine: (s, g, l) => `${s.changes} ${s.changes === 1 ? "change" : "changes"}, ${s.passports} ${s.passports === 1 ? "passport" : "passports"}, ${s.dests} ${s.dests === 1 ? "destination" : "destinations"}.` +
      `${g ? ` Biggest gain: ${g.name} (${g.net > 0 ? "+" : ""}${g.net}).` : ""}${l ? ` Biggest loss: ${l.name} (${l.net}).` : ""}`,
    soFarShort: (date) => `so far, data to ${date}`,
    passportsAll: "Passport directory",
    visaWord: "visa rules",
  },
  tr: {
    prefix: "/tr", intl: "tr-TR", ogLocale: "tr_TR",
    status: {
      idc: "Kimlikle giriş", vf: "Vizesiz", eta: "Seyahat izni", ev: "e-Vize",
      voa: "Varışta vize", vr: "Vize gerekli", ban: "Girişe kapalı",
    },
    title: (m) => `${m} pasaport gücü değişimleri: hangi pasaport vizesiz erişim kazandı, kaybetti`,
    h1: (m) => `${m} pasaport gücü değişimleri`,
    desc: (m, s) => `${m} ayında kaydedilen ${s.changes} vize politikası değişikliği, ${s.passports} pasaportu ve ${s.dests} varış ülkesini etkiledi. Hangi pasaport vizesiz erişim kazandı, hangisi kaybetti.`,
    crumbs: { home: "travelnow.info", reports: "Aylık raporlar" },
    soFar: (m, date) => `${m} (şimdiye kadar, veri ${date} tarihine kadar)`,
    partial: (date) => `Bu ay henüz bitmedi. Rapor, ${date} tarihine kadar kaydedilen değişiklikleri kapsar.`,
    intro: (m, s, soFar) =>
      `${m} ${soFar ? "ayında şimdiye kadar" : "ayında"} günlük verimiz ${s.passports} pasaportu ve ${s.dests} varış ülkesini etkileyen ${s.changes} vize politikası değişikliği kaydetti. ` +
      `Önceden vize alınmasını gerektirmeyen ülkeler (vizesiz, kimlikle giriş, seyahat izni ve varışta vize) sayıldığında ${s.gainers} pasaport genel olarak kazandı, ${s.losers} pasaport kaybetti.`,
    empty: "Bu ay hiç değişiklik kaydedilmedi.",
    gainsH: "En çok kazananlar",
    lossesH: "En çok kaybedenler",
    gainsNote: "Pasaportlar, kolay erişimli ülke sayısındaki net değişime göre sıralandı (vizesiz, kimlikle giriş, seyahat izni veya varışta vize).",
    noneGain: "Genel olarak kolay erişim kazanan pasaport olmadı.",
    noneLoss: "Genel olarak kolay erişim kaybeden pasaport olmadı.",
    net: (n) => `${n > 0 ? "+" : "-"}${Math.abs(n)}`,
    netTitle: (n) => `Net ${Math.abs(n)} ülke ${n > 0 ? "kazanıldı" : "kaybedildi"}`,
    destsH: "Kurallarını değiştiren ülkeler",
    destsNote: (n) => `${n} ülke, en çok değişiklik olan başta. Her satırda pasaport ile önceki ve sonraki durum görünür.`,
    methodH: "Nasıl okunmalı",
    method: "Bunlar, herkese açık vize politikası verilerinin (Wikipedia'nın vize gerekliliği maddeleri) günlük kaydında görülen değişikliklerdir. Bir değişiklik yeni bir kuralı değil, kaynaktaki bir düzeltmeyi yansıtıyor olabilir. Yola çıkmadan önce gideceğin ülkenin resmi sitesine bak.",
    methodNet: "Bir ay içinde sonradan geri alınan değişiklikler dışarıda bırakılır, yani yalnızca net sonuç sayılır.",
    prev: (m) => `Önceki: ${m}`,
    next: (m) => `Sonraki: ${m}`,
    allReports: "Tüm aylık raporlar",
    indexTitle: "Aylık pasaport gücü raporları: kazanılan ve kaybedilen vizesiz erişim",
    indexH1: "Aylık pasaport gücü raporları",
    indexDesc: "Hangi pasaportların vizesiz erişim kazandığını ve kaybettiğini ay ay gösteren raporlar. Herkese açık vize politikası verilerinin günlük kaydından üretilir.",
    indexIntro: "Her rapor, ay boyunca ülkelere kolay erişimi artan ya da azalan pasaportları ve kurallarını değiştiren ülkeleri listeler. Veriler, herkese açık vize politikası verilerinin günlük kaydından gelir.",
    indexLine: (s, g, l) => `${s.changes} değişiklik, ${s.passports} pasaport, ${s.dests} ülke.` +
      `${g ? ` En çok kazanan: ${g.name} (${g.net > 0 ? "+" : ""}${g.net}).` : ""}${l ? ` En çok kaybeden: ${l.name} (${l.net}).` : ""}`,
    soFarShort: (date) => `şimdiye kadar, veri ${date} tarihine kadar`,
    passportsAll: "Pasaport rehberi",
    visaWord: "vize kuralları",
  },
};

const monthLabel = (ym, lang) =>
  new Intl.DateTimeFormat(LOC[lang].intl, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(ym + "-01T00:00:00Z"));
const dateLabel = (iso, lang) =>
  new Intl.DateTimeFormat(LOC[lang].intl, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));

// ── Analysis ─────────────────────────────────────────────────────────────────
function analyse() {
  const byMonth = new Map();
  for (const e of CHANGELOG) {
    const ym = e.date.slice(0, 7);
    if (ym < FIRST_MONTH) continue;
    if (!byMonth.has(ym)) byMonth.set(ym, []);
    byMonth.get(ym).push(e);
  }
  const lastDataDate = CHANGELOG.reduce((m, e) => (e.date > m ? e.date : m), "");
  const currentYm = lastDataDate.slice(0, 7);
  const months = [];
  let rawTotal = 0, netTotal = 0, droppedTotal = 0;
  for (const ym of [...byMonth.keys()].sort()) {
    const entries = byMonth.get(ym).slice().sort((a, b) => a.date.localeCompare(b.date));
    // Net each (passport, dest) pair: first from, last to.
    const pairs = new Map();
    let raw = 0;
    for (const e of entries) {
      for (const p of e.affects.passports) {
        raw++;
        const k = p + ">" + e.affects.dest;
        const cur = pairs.get(k);
        if (!cur) pairs.set(k, { passport: p, dest: e.affects.dest, from: e.statusFrom, to: e.statusTo });
        else cur.to = e.statusTo;
      }
    }
    const net = [...pairs.values()].filter((x) => x.from !== x.to);
    const perPassport = new Map();
    const perDest = new Map();
    for (const x of net) {
      const delta = (EASY.has(x.to) ? 1 : 0) - (EASY.has(x.from) ? 1 : 0);
      perPassport.set(x.passport, (perPassport.get(x.passport) || 0) + delta);
      if (!perDest.has(x.dest)) perDest.set(x.dest, []);
      perDest.get(x.dest).push(x);
    }
    const passportsAffected = new Set(net.map((x) => x.passport));
    const stats = {
      changes: net.length,
      passports: passportsAffected.size,
      dests: perDest.size,
      gainers: [...perPassport.values()].filter((v) => v > 0).length,
      losers: [...perPassport.values()].filter((v) => v < 0).length,
    };
    const lastDate = entries[entries.length - 1].date;
    months.push({ ym, net, perPassport, perDest, stats, lastDate, partial: ym === currentYm, raw });
    rawTotal += raw; netTotal += net.length; droppedTotal += raw - net.length;
  }
  return { months, rawTotal, netTotal, droppedTotal };
}

// ── Rendering ────────────────────────────────────────────────────────────────
function ranked(month, lang, dir) {
  const rows = [...month.perPassport.entries()].filter(([, v]) => (dir > 0 ? v > 0 : v < 0))
    .map(([iso, v]) => ({ iso, net: v, name: cn(iso, lang) || iso }));
  const coll = new Intl.Collator(LOC[lang].intl);
  rows.sort((a, b) => (dir > 0 ? b.net - a.net : a.net - b.net) || coll.compare(a.name, b.name));
  return rows;
}

function monthUrlPath(ym, lang) { return `${LOC[lang].prefix}/reports/${ym}/`; }

function page({ lang, enPath, title, desc, body, jsonld, ogTitle }) {
  const L = LOC[lang];
  const canonical = SITE_URL + L.prefix + enPath;
  const ogImage = `${SITE_URL}/assets/og.png`;
  return `<!DOCTYPE html>
<html lang="${lang}"${lang === "tr" ? ' data-page-lang="tr"' : ""}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${SITE_URL}${enPath}">
<link rel="alternate" hreflang="tr" href="${SITE_URL}/tr${enPath}">
<link rel="alternate" hreflang="x-default" href="${SITE_URL}${enPath}">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:title" content="${esc(ogTitle || title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:locale" content="${L.ogLocale}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle || title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImage}">
<script>(function(){try{var z=Intl.DateTimeFormat().resolvedOptions().timeZone||"";if(z==="Europe/Istanbul"||z==="Asia/Istanbul"||document.documentElement.lang==="tr")(window.adsbygoogle=window.adsbygoogle||[]).requestNonPersonalizedAds=1}catch(e){}})();</script><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2617798720306957" crossorigin="anonymous"></script>
<script src="/assets/analytics.js"></script>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<!-- chrome:head -->
${lang === "tr" ? '<script>try{localStorage.setItem("atlas.lang","tr")}catch(e){}</script>' : '<script>try{if(localStorage.getItem("atlas.lang")==="tr")location.replace("/tr"+location.pathname+location.search+location.hash)}catch(e){}</script>'}
${headAssets({ enPath: null, lang })}
<!-- /chrome:head -->
<style>.wrap{max-width:820px}.rep-list{list-style:none;margin:0 0 8px;padding:0}.rep-list li{padding:5px 0;border-bottom:1px solid var(--rule)}.rep-net{display:inline-block;min-width:2.2em;font-weight:600;font-variant-numeric:tabular-nums}.rep-dest{margin:18px 0 4px;font-size:var(--fs-md)}.rep-nav{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:32px}</style>
</head>
<body>
<!-- chrome:masthead -->
${masthead({ path: enPath, i18n: false, lang })}
<!-- /chrome:masthead -->
${body}
<!-- chrome:footer -->
${footer({ lang })}
<!-- /chrome:footer -->
</body>
</html>
`;
}

function renderMonth(m, all, lang) {
  const L = LOC[lang];
  const enPath = `/reports/${m.ym}/`;
  const label = monthLabel(m.ym, lang);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const mName = lang === "tr" ? cap(label) : label;
  const idx = all.findIndex((x) => x.ym === m.ym);
  const prev = all[idx - 1], next = all[idx + 1];
  const href = (p) => L.prefix + p;
  const pLink = (r) => `<li><span class="rep-net" title="${esc(L.netTitle(r.net))}">${L.net(r.net)}</span> <a href="${href(`/passport/${r.iso.toLowerCase()}/`)}"><span class="flag" aria-hidden="true">${FLAG[r.iso] || ""}</span> ${esc(r.name)}</a></li>`;
  const list = (rows, none) => rows.length ? `<ul class="rep-list">${rows.slice(0, TOP).map(pLink).join("")}</ul>` : `<p>${none}</p>`;

  const coll = new Intl.Collator(L.intl);
  const dests = [...m.perDest.entries()].map(([d, xs]) => ({ d, name: cn(d, lang) || d, xs }))
    .sort((a, b) => b.xs.length - a.xs.length || coll.compare(a.name, b.name));
  const destHtml = dests.map(({ d, name, xs }) => {
    const items = xs.slice().sort((a, b) => coll.compare(cn(a.passport, lang) || a.passport, cn(b.passport, lang) || b.passport))
      .map((x) => `<li><a href="${href(`/passport/${x.passport.toLowerCase()}/`)}"><span class="flag" aria-hidden="true">${FLAG[x.passport] || ""}</span> ${esc(cn(x.passport, lang) || x.passport)}</a>: ${esc(L.status[x.from] || x.from)} → ${esc(L.status[x.to] || x.to)}</li>`).join("");
    return `<h3 class="rep-dest"><a href="${href(`/visa/${d.toLowerCase()}/`)}"><span class="flag" aria-hidden="true">${FLAG[d] || ""}</span> ${esc(name)}</a></h3><ul class="rep-list">${items}</ul>`;
  }).join("\n");

  const date = dateLabel(m.lastDate, lang);
  const title = L.title(mName);
  const desc = L.desc(mName, m.stats);
  const navLinks = [
    prev ? `<a href="${href(`/reports/${prev.ym}/`)}">&larr; ${esc(L.prev(lang === "tr" ? cap(monthLabel(prev.ym, lang)) : monthLabel(prev.ym, lang)))}</a>` : "<span></span>",
    next ? `<a href="${href(`/reports/${next.ym}/`)}">${esc(L.next(lang === "tr" ? cap(monthLabel(next.ym, lang)) : monthLabel(next.ym, lang)))} &rarr;</a>` : "<span></span>",
  ].join("");

  const body = `<div class="wrap">
  <p class="crumbs"><a href="${href("/")}">${L.crumbs.home}</a> › <a href="${href("/reports/")}">${esc(L.crumbs.reports)}</a> › ${esc(mName)}</p>
  <h1>${esc(L.h1(mName))}</h1>
  ${m.partial ? `<p class="meta">${esc(L.partial(date))}</p>` : ""}
  <p>${esc(L.intro(mName, m.stats, m.partial))}</p>

  <h2>${L.gainsH}</h2>
  <p class="meta">${esc(L.gainsNote)}</p>
  ${list(ranked(m, lang, 1), L.noneGain)}

  <h2>${L.lossesH}</h2>
  ${list(ranked(m, lang, -1), L.noneLoss)}

  <h2>${L.destsH}</h2>
  <p class="meta">${esc(L.destsNote(dests.length))}</p>
  ${destHtml}

  <h2>${L.methodH}</h2>
  <p>${esc(L.method)} ${esc(L.methodNet)}</p>

  <div class="rep-nav">${navLinks}</div>
  <p><a href="${href("/reports/")}">${L.allReports}</a></p>
  <p><a href="${href("/passport/")}">${L.passportsAll}</a></p>
</div>`;

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Article",
    inLanguage: lang,
    headline: title,
    description: desc,
    image: `${SITE_URL}/assets/og.png`,
    datePublished: m.lastDate,
    dateModified: m.lastDate,
    author: { "@type": "Person", name: "Uygar Atalay" },
    publisher: { "@type": "Organization", name: "travelnow.info", url: SITE_URL, sameAs: ["https://www.instagram.com/travelnow.info/"] },
    mainEntityOfPage: SITE_URL + L.prefix + enPath,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "travelnow.info", item: SITE_URL + (lang === "tr" ? "/tr/" : "/") },
        { "@type": "ListItem", position: 2, name: L.crumbs.reports, item: SITE_URL + L.prefix + "/reports/" },
        { "@type": "ListItem", position: 3, name: mName },
      ],
    },
  };
  return page({ lang, enPath, title, desc, body, jsonld });
}

function renderIndex(all, lang) {
  const L = LOC[lang];
  const href = (p) => L.prefix + p;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const items = all.slice().reverse().map((m) => {
    const g = ranked(m, lang, 1)[0], l = ranked(m, lang, -1)[0];
    const label = lang === "tr" ? cap(monthLabel(m.ym, lang)) : monthLabel(m.ym, lang);
    const tag = m.partial ? ` (${L.soFarShort(dateLabel(m.lastDate, lang))})` : "";
    return `<li><a href="${href(`/reports/${m.ym}/`)}"><strong>${esc(label)}</strong></a>${esc(tag)}<br>${esc(L.indexLine(m.stats, g, l))}</li>`;
  }).join("");
  const body = `<div class="wrap">
  <p class="crumbs"><a href="${href("/")}">${L.crumbs.home}</a> › ${esc(L.crumbs.reports)}</p>
  <h1>${esc(L.indexH1)}</h1>
  <p>${esc(L.indexIntro)}</p>
  <ul class="rep-list">${items}</ul>
</div>`;
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    inLanguage: lang,
    name: L.indexTitle,
    description: L.indexDesc,
    url: SITE_URL + L.prefix + "/reports/",
  };
  return page({ lang, enPath: "/reports/", title: L.indexTitle, desc: L.indexDesc, body, jsonld });
}

function write(rel, html) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function reportUrls() {
  const { months } = analyse();
  const urls = [];
  for (const lang of ["en", "tr"]) {
    urls.push(`${SITE_URL}${LOC[lang].prefix}/reports/`);
    for (const m of months) urls.push(`${SITE_URL}${monthUrlPath(m.ym, lang)}`);
  }
  return urls;
}

function main() {
  const { months, rawTotal, netTotal, droppedTotal } = analyse();
  for (const lang of ["en", "tr"]) {
    const base = lang === "tr" ? "tr/reports" : "reports";
    write(`${base}/index.html`, renderIndex(months, lang));
    for (const m of months) write(`${base}/${m.ym}/index.html`, renderMonth(m, months, lang));
  }
  console.log(`reports: ${months.length} months, ${months.length * 2 + 2} pages; ${rawTotal} raw pair-changes, ${netTotal} kept, ${droppedTotal} netted out`);
}

module.exports = { reportUrls, analyse };
if (require.main === module) main();
