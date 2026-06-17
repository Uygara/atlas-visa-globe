// Generates /passport/<iso2>/index.html for every passport in data/passports-snapshot.json.
// Run: node scripts/generate-seo.js
// Output: ./passport/<iso2>/index.html  +  ./sitemap.xml
//
// Each page is a real, indexable static HTML document with:
//   • A unique, data-driven written analysis of THIS passport (global mobility
//     rank, regional strengths/weaknesses, curated notable destinations, FAQ) —
//     so the page adds genuine commentary/curation on top of the raw data
//     instead of just reproducing a third-party table (AdSense "thin content").
//   • Visa counts (vf/ev/voa/vr) computed from live scraped data
//   • A full table of every destination + the resolved visa status
//   • Internal links to related passport pages + guides + tools (SEO + retention)
//   • OG / Twitter cards / canonical / JSON-LD Article + FAQPage + Breadcrumbs
//   • A consistent site footer (About / Guides / Privacy / Terms / Contact)

const fs = require("fs");
const path = require("path");

const ROOT       = path.resolve(__dirname, "..");
const SNAPSHOT   = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "passports-snapshot.json"), "utf8"));
const COUNTRIES  = parseCountries(fs.readFileSync(path.join(ROOT, "data", "countries.js"), "utf8"));
// Absolute URLs everywhere (sitemap <loc>, canonicals, og:url). The sitemap
// protocol REQUIRES absolute URLs — relative ones are ignored by Google, which
// was hurting discovery. Defaults to the live domain; override via SITE_URL.
const SITE_URL   = process.env.SITE_URL || "https://travelnow.info";

const STATUS_INFO = {
  vf:  { label: "Visa-free",        color: "#22c55e", note: "No visa required" },
  ev:  { label: "eVisa",            color: "#a3e635", note: "Apply online before travel" },
  voa: { label: "Visa on arrival",  color: "#facc15", note: "Issued at the border" },
  vr:  { label: "Visa required",    color: "#ef4444", note: "Apply at embassy or consulate" },
  ban: { label: "No entry allowed", color: "#7f1020", note: "Entry refused to this nationality" },
};

// Human continent names for the regional-breakdown prose.
const CONTINENT_NAME = {
  EU: "Europe", AS: "Asia", AF: "Africa",
  NA: "the Americas (North & Central)", SA: "South America",
  OC: "Oceania", AN: "Antarctica",
};

// A curated set of high-interest destinations used to write the "notable"
// commentary. These are the places readers most often ask about — naming the
// real resolved status for them is the curation/value-add Google looks for.
const MAJOR_DESTS = [
  "US", "GB", "DE", "FR", "IT", "ES", "NL", "CH", "CA", "AU", "NZ", "JP",
  "KR", "CN", "IN", "RU", "AE", "SA", "TH", "SG", "MY", "ID", "BR", "MX",
  "AR", "ZA", "EG", "TR", "GR",
];

function parseCountries(js) {
  // Extract { iso2, name, flag, continent } from the COUNTRIES = [ ... ] array.
  const out = [];
  const re = /iso2:\s*"([A-Z]{2})",\s*name:\s*"([^"]+)"[^}]*continent:\s*"([A-Z]{2})"[^}]*flag:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(js))) {
    out.push({ iso2: m[1], name: m[2], continent: m[3], flag: m[4] });
  }
  return out;
}

// Dependent territories inherit their parent country's visa policy.
const TERRITORY_ALIAS = {
  EH: "MA", GL: "DK", FK: "GB", PR: "US",
  NC: "FR", PF: "FR", TF: "FR",
};

function resolveStatus(passportIso2, destIso2, snapshot) {
  if (passportIso2 === destIso2) return { status: "self", days: null };
  if (TERRITORY_ALIAS[destIso2] && TERRITORY_ALIAS[destIso2] !== passportIso2) {
    destIso2 = TERRITORY_ALIAS[destIso2];
  }
  const p = snapshot[passportIso2];
  if (!p) return { status: "na", days: null };
  for (const s of ["vf", "ev", "voa", "vr"]) {
    for (const entry of (p[s] || [])) {
      const code = Array.isArray(entry) ? entry[0] : entry;
      const days = Array.isArray(entry) ? entry[1] : null;
      if (code === destIso2) return { status: s, days };
    }
  }
  if (p.default === "vf") return { status: "vf", days: p.defaultDays || null };
  return { status: p.default || "na", days: null };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Resolve every (non-self) destination once and return enriched rows.
function resolveAllRows(passport, snapshot) {
  return COUNTRIES
    .filter(c => c.iso2 !== passport)
    .map(c => {
      const r = resolveStatus(passport, c.iso2, snapshot);
      return { ...c, status: r.status, days: r.days };
    });
}

function countStatuses(rows) {
  const counts = { vf: 0, ev: 0, voa: 0, vr: 0, ban: 0 };
  rows.forEach(r => { if (counts[r.status] != null) counts[r.status]++; });
  return counts;
}

// Mobility score = destinations reachable WITHOUT arranging a visa in advance
// (visa-free + visa on arrival). This is the standard "passport power" metric.
function mobilityScore(counts) {
  return counts.vf + counts.voa;
}

function nameOf(iso, snapshot) {
  const c = COUNTRIES.find(x => x.iso2 === iso);
  return (snapshot[iso] && snapshot[iso].name) || (c && c.name) || iso;
}

function listJoin(names) {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return names[0] + " and " + names[1];
  return names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
}

// ── The value-add: a unique, data-driven written analysis of this passport ──
function renderProse(passport, name, rows, counts, ranks, snapshot) {
  const total = rows.length;
  const visaFreeTotal = counts.vf + counts.voa;   // no advance visa needed
  const rankInfo = ranks.get(passport);
  const rank = rankInfo ? rankInfo.rank : null;
  const rankTotal = rankInfo ? rankInfo.total : null;

  // Regional breakdown
  const byCont = {};
  rows.forEach(r => {
    if (r.continent === "AN") return; // Antarctica: not a normal destination
    const b = byCont[r.continent] || (byCont[r.continent] = { easy: 0, total: 0 });
    b.total++;
    if (r.status === "vf" || r.status === "voa") b.easy++;
  });
  const regionLines = Object.keys(byCont)
    .map(k => ({ k, ...byCont[k], pct: byCont[k].easy / byCont[k].total }))
    .sort((a, b) => b.pct - a.pct);
  const strongest = regionLines[0];
  const weakest = regionLines[regionLines.length - 1];

  // Curated notable destinations among the MAJOR set
  const majorResolved = MAJOR_DESTS
    .filter(iso => iso !== passport && snapshot[iso])
    .map(iso => ({ iso, ...resolveStatus(passport, iso, snapshot) }));
  const easyMajors = majorResolved.filter(d => d.status === "vf" || d.status === "voa")
    .map(d => nameOf(d.iso, snapshot)).slice(0, 8);
  const hardMajors = majorResolved.filter(d => d.status === "vr" || d.status === "ev")
    .map(d => ({ name: nameOf(d.iso, snapshot), status: d.status }));
  const visaMajors = hardMajors.filter(d => d.status === "vr").map(d => d.name).slice(0, 6);
  const evisaMajors = hardMajors.filter(d => d.status === "ev").map(d => d.name).slice(0, 5);

  // Representative checks for the FAQ
  const usR  = resolveStatus(passport, "US", snapshot);
  const deR  = resolveStatus(passport, "DE", snapshot);
  const statusPhrase = (r) => {
    if (r.status === "vf")  return "can enter visa-free" + (r.days ? ` for up to ${r.days} days` : "");
    if (r.status === "voa") return "can get a visa on arrival";
    if (r.status === "ev")  return "need an eVisa (applied for online before travel)";
    if (r.status === "vr")  return "need a visa arranged in advance at an embassy or consulate";
    if (r.status === "ban") return "are currently refused entry";
    return "should check the latest requirement";
  };

  const regionStr = regionLines.map(r =>
    `${CONTINENT_NAME[r.k] || r.k} (${r.easy}/${r.total})`
  ).join(", ");

  // ── Build the prose ──
  let html = `<section class="analysis">`;

  // Lead
  html += `<p class="lead">A <strong>${escapeHtml(name)} passport</strong> currently gives its holder access to about
    <strong>${visaFreeTotal} of the ${total} destinations</strong> we track without arranging a visa beforehand —
    ${counts.vf} visa-free and ${counts.voa} with a visa on arrival.`;
  if (rank) {
    html += ` On that measure it sits around <strong>#${rank} of ${rankTotal}</strong> passports worldwide.`;
  }
  html += ` Beyond those, ${counts.ev} destinations offer an eVisa you apply for online, and ${counts.vr}
    still require a traditional embassy visa${counts.ban ? `, while ${counts.ban} refuse entry to this nationality` : ""}.</p>`;

  // Regional
  if (strongest && weakest && strongest.k !== weakest.k) {
    html += `<p>Looking at it region by region, the ${escapeHtml(name)} passport is strongest in
      <strong>${CONTINENT_NAME[strongest.k] || strongest.k}</strong>, where ${strongest.easy} of ${strongest.total}
      countries are open without a prior visa, and most limited in
      <strong>${CONTINENT_NAME[weakest.k] || weakest.k}</strong> (${weakest.easy} of ${weakest.total}).
      The full regional picture: ${regionStr}.</p>`;
  }

  // Notable easy
  if (easyMajors.length) {
    html += `<p>Among the destinations travellers ask about most, you can travel without a visa (or get one on arrival) to
      <strong>${escapeHtml(listJoin(easyMajors))}</strong>.</p>`;
  }
  // Notable hard
  if (visaMajors.length || evisaMajors.length) {
    html += `<p>You should plan ahead for `;
    const parts = [];
    if (visaMajors.length) parts.push(`a full visa to <strong>${escapeHtml(listJoin(visaMajors))}</strong>`);
    if (evisaMajors.length) parts.push(`an eVisa for <strong>${escapeHtml(listJoin(evisaMajors))}</strong>`);
    html += listJoin(parts) + `. Sort these out before you book non-refundable travel.</p>`;
  }

  // How to travel more easily
  html += `<p>If a destination shows <em>eVisa</em> or <em>visa on arrival</em> below, you usually don't need to visit an
    embassy: an eVisa is applied for on the destination's official portal and arrives by email, while a visa on arrival
    is issued at the airport or land border (carry the fee and a passport valid for at least six months). Our
    <a href="/visa-shortcuts/">Visa Shortcuts</a> tool also shows when a visa or residence permit you already hold can
    unlock easier entry elsewhere.</p>`;

  html += `</section>`;

  // ── FAQ (also emitted as FAQPage structured data) ──
  const faqs = [
    {
      q: `How many countries can ${name} passport holders visit without a visa?`,
      a: `Around ${visaFreeTotal} of the ${total} destinations we track need no visa arranged in advance — ${counts.vf} are visa-free and ${counts.voa} grant a visa on arrival. A further ${counts.ev} offer an eVisa online.`,
    },
    {
      q: `Do ${name} passport holders need a visa for the United States?`,
      a: `Travellers on a ${name} passport ${statusPhrase(usR)} for the United States. The US visa-waiver programme also requires an approved ESTA travel authorization even when no visa is needed — our ESTA checker covers who qualifies.`,
    },
    {
      q: `Can you travel to Europe (the Schengen Area) on a ${name} passport?`,
      a: `For Germany, a representative Schengen country, holders of a ${name} passport ${statusPhrase(deR)}. From 2026 the EU's ETIAS travel authorization also applies to many visa-free visitors — see our ETIAS checker.`,
    },
    {
      q: `How is this ranked, and how current is the data?`,
      a: `The ranking compares passports by how many destinations they reach without a visa arranged in advance (visa-free plus visa on arrival). Figures are rebuilt every 24 hours from public visa-policy sources, so this page reflects the most recent change we have recorded. Always confirm with the destination's embassy before booking.`,
    },
  ];

  let faqHtml = `<section class="faq"><h2>${escapeHtml(name)} passport — frequently asked questions</h2>`;
  faqs.forEach(f => {
    faqHtml += `<div class="qa"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`;
  });
  faqHtml += `</section>`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  return { proseHtml: html, faqHtml, faqSchema, mobility: visaFreeTotal, rank };
}

// Shared footer used across generated pages — gives every page real navigation,
// an author/maintainer line, and links to the legitimacy pages. This is part of
// looking like a maintained publisher rather than an auto-generated table dump.
function siteFooter() {
  return `
  <footer class="site-footer">
    <nav class="footer-nav">
      <a href="/">Home</a>
      <a href="/passport/">All passports</a>
      <a href="/guides/">Guides</a>
      <a href="/about/">About</a>
      <a href="/privacy/">Privacy</a>
      <a href="/terms/">Terms</a>
      <a href="/contact/">Contact</a>
    </nav>
    <p class="footer-note">travelnow.info is an independent travel-information project maintained by Uygar Atalay.
    Visa rules change frequently — always confirm with the destination's official embassy or consulate before you book.
    Data is refreshed every 24 hours from public visa-policy sources.</p>
  </footer>`;
}

function renderPage(passport, allPassports, snapshot, ranks) {
  const pp = snapshot[passport];
  const country = COUNTRIES.find(c => c.iso2 === passport);
  if (!country || !pp) return null;
  const name = pp.name;
  const flag = country.flag;
  const slug = passport.toLowerCase();

  const rows = resolveAllRows(passport, snapshot);
  const counts = countStatuses(rows);

  // Sort: vf, ev, voa, vr, then alpha
  const order = { vf: 0, ev: 1, voa: 2, vr: 3, ban: 4 };
  rows.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.name.localeCompare(b.name));

  const { proseHtml, faqHtml, faqSchema } = renderProse(passport, name, rows, counts, ranks, snapshot);

  const rankInfo = ranks.get(passport);
  const titleText = `${name} passport visa requirements 2026 — ${counts.vf + counts.voa} visa-free destinations`;
  const description = `Where can a ${name} passport take you? ${counts.vf} visa-free, ${counts.voa} visa on arrival, ${counts.ev} eVisa, ${counts.vr} visa required. Global rank #${rankInfo ? rankInfo.rank : "?"}. Updated daily.`;

  const canonical = SITE_URL ? `${SITE_URL}/passport/${slug}/` : `/passport/${slug}/`;

  // Ad configuration is read from ../data/ads.js at build time.
  const adsJs = fs.readFileSync(path.join(ROOT, "data", "ads.js"), "utf8");
  const adsenseClient = (adsJs.match(/clientId:\s*"([^"]*)"/) || [])[1] || "";
  const slotTop       = (adsJs.match(/seoTop:\s*"([^"]*)"/) || [])[1] || "";
  const slotBottom    = (adsJs.match(/seoBottom:\s*"([^"]*)"/) || [])[1] || "";
  const adsenseLoader = adsenseClient
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}" crossorigin="anonymous"></script>`
    : "";
  const adInsTop = (adsenseClient && slotTop)
    ? `<div class="ad-slot"><ins class="adsbygoogle" style="display:block" data-ad-client="${adsenseClient}" data-ad-slot="${slotTop}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`
    : "";
  const adInsBottom = (adsenseClient && slotBottom)
    ? `<div class="ad-slot"><ins class="adsbygoogle" style="display:block" data-ad-client="${adsenseClient}" data-ad-slot="${slotBottom}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`
    : "";

  // Curated, on-topic internal links (same-region + high-traffic anchors).
  const sameRegion = COUNTRIES
    .filter(c => c.continent === country.continent && c.iso2 !== passport && snapshot[c.iso2])
    .slice(0, 6)
    .map(c => c.iso2);
  const anchors = ["US", "GB", "DE", "JP"].filter(iso => iso !== passport && snapshot[iso]);
  const related = Array.from(new Set([...sameRegion, ...anchors])).slice(0, 10);
  const otherPassports = related.map(iso => {
    const c = COUNTRIES.find(x => x.iso2 === iso);
    const n = snapshot[iso] && snapshot[iso].name || (c && c.name);
    if (!c || !n) return "";
    return `<li><a href="../${iso.toLowerCase()}/">${c.flag} ${escapeHtml(n)}</a></li>`;
  }).join("");

  const rowsHtml = rows.map(r => {
    const info = STATUS_INFO[r.status];
    if (!info) return "";
    const days = r.days ? `<span class="days">up to ${r.days} days</span>` : "";
    return `
      <tr class="row-${r.status}">
        <td class="flag">${r.flag}</td>
        <td class="name">${escapeHtml(r.name)}</td>
        <td class="status"><span class="dot" style="background:${info.color}"></span>${info.label} ${days}</td>
      </tr>`;
  }).join("");

  const today = new Date().toISOString().slice(0, 10);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(titleText)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<meta name="author" content="Uygar Atalay">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" href="/assets/favicon.svg">
<meta property="og:image" content="${SITE_URL || ""}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE_URL || ""}/assets/og.png">
<meta property="og:title" content="${escapeHtml(titleText)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
${SITE_URL ? `<meta property="og:url" content="${canonical}">` : ""}
<meta name="twitter:title" content="${escapeHtml(titleText)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${adsenseLoader}
<script src="/assets/analytics.js"></script>
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": titleText,
  "description": description,
  "datePublished": today,
  "dateModified": today,
  "author": { "@type": "Person", "name": "Uygar Atalay" },
  "publisher": { "@type": "Organization", "name": "travelnow.info", "url": SITE_URL || "/" },
  "about": { "@type": "Country", "name": name },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "travelnow.info", "item": SITE_URL || "/" },
      { "@type": "ListItem", "position": 2, "name": "Passports", "item": (SITE_URL || "") + "/passport/" },
      { "@type": "ListItem", "position": 3, "name": name + " passport" },
    ],
  },
})}</script>
<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
<style>
  :root {
    --bg: #05070d; --panel: #111827; --fg: #e7ecf5; --fg-dim: #aab4c8; --fg-mute: #6b7591;
    --border: rgba(148,173,220,0.15); --link:#60a5fa;
    --vf: #22c55e; --ev: #a3e635; --voa: #facc15; --vr: #ef4444;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    background: var(--bg); color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    line-height: 1.6;
  }
  .wrap { max-width: 820px; margin: 0 auto; padding: 28px 20px; }
  .crumbs { font-size:12px; color:var(--fg-mute); margin-bottom:18px; }
  .crumbs a { color:var(--fg-mute); }
  header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
  .hero-flag { font-size: 48px; line-height: 1; }
  h1 { margin: 0; font-size: 25px; font-weight: 600; letter-spacing: -0.01em; }
  .subtitle { margin: 4px 0 0 0; font-size: 13px; color: var(--fg-mute); }
  .stats {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
    background: var(--panel); border: 1px solid var(--border); border-radius: 12px;
    padding: 14px; margin: 16px 0 26px 0;
  }
  .stat { text-align: center; }
  .stat .n { font-size: 28px; font-weight: 600; }
  .stat .l { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--fg-mute); margin-top: 2px; }
  .stat.vf .n { color: var(--vf); } .stat.ev .n { color: var(--ev); }
  .stat.voa .n { color: var(--voa); } .stat.vr .n { color: var(--vr); }
  .analysis p, .faq p { font-size: 15px; color: var(--fg-dim); margin: 0 0 14px; }
  .analysis .lead { font-size: 16px; color: var(--fg); }
  .analysis a, .faq a { color: var(--link); }
  h2 { font-size: 19px; margin: 34px 0 12px; }
  .faq .qa { margin-bottom: 16px; }
  .faq h3 { font-size: 15px; margin: 0 0 4px; color: #fff; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13px; }
  th { font-size: 11px; color: var(--fg-mute); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
  td.flag { width: 32px; font-size: 18px; }
  td.status { color: var(--fg-dim); }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
  .days { color: var(--fg-mute); font-size: 11px; margin-left: 6px; }
  .back { display: inline-block; padding: 10px 16px; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; color: var(--fg); text-decoration: none; font-size: 13px; }
  .back:hover { border-color: var(--fg-dim); }
  .ad-slot { margin: 22px 0; min-height: 1px; }
  .other-passports { margin-top: 30px; }
  .other-passports h2 { font-size: 14px; color: var(--fg-mute); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
  .other-passports ul { list-style: none; padding: 0; columns: 3; column-gap: 20px; font-size: 13px; }
  .other-passports li { margin-bottom: 4px; break-inside: avoid; }
  .other-passports a { color: var(--fg-dim); text-decoration: none; }
  .other-passports a:hover { color: var(--fg); }
  .related-guides { background:var(--panel); border:1px solid var(--border); border-radius:12px; padding:16px 18px; margin:26px 0; }
  .related-guides h2 { margin:0 0 8px; font-size:14px; }
  .related-guides ul { margin:0; padding-left:18px; font-size:14px; }
  .related-guides a { color:var(--link); }
  .site-footer { margin-top: 44px; padding-top: 22px; border-top: 1px solid var(--border); }
  .footer-nav { display:flex; flex-wrap:wrap; gap:14px; font-size:13px; margin-bottom:12px; }
  .footer-nav a { color: var(--fg-dim); text-decoration:none; }
  .footer-nav a:hover { color: var(--fg); }
  .footer-note { font-size:12px; color: var(--fg-mute); line-height:1.6; }
  @media (max-width: 600px) {
    .stats { grid-template-columns: repeat(2, 1fr); }
    .other-passports ul { columns: 2; }
  }
</style>
</head>
<body>
<div class="wrap">
  <p class="crumbs"><a href="/">travelnow.info</a> › <a href="/passport/">Passports</a> › ${escapeHtml(name)}</p>
  <header>
    <span class="hero-flag" aria-hidden="true">${flag}</span>
    <div>
      <h1>${escapeHtml(name)} passport visa requirements</h1>
      <p class="subtitle">${rows.length} destinations${rankInfo ? ` · Global mobility rank #${rankInfo.rank}` : ""} · Updated ${today}</p>
    </div>
  </header>

  <section class="stats">
    <div class="stat vf"><div class="n">${counts.vf}</div><div class="l">Visa-free</div></div>
    <div class="stat ev"><div class="n">${counts.ev}</div><div class="l">eVisa</div></div>
    <div class="stat voa"><div class="n">${counts.voa}</div><div class="l">On arrival</div></div>
    <div class="stat vr"><div class="n">${counts.vr}</div><div class="l">Visa required</div></div>
  </section>

  ${proseHtml}

  <p><a class="back" href="../../">🌍 See it on the interactive globe</a></p>

  ${adInsTop}

  <div class="related-guides">
    <h2>Helpful guides</h2>
    <ul>
      <li><a href="/guides/visa-types-explained/">Visa-free, eVisa, visa on arrival — what's the difference?</a></li>
      <li><a href="/guides/schengen-90-180-rule/">How the Schengen 90/180-day rule works</a></li>
      <li><a href="/guides/passport-validity-six-month-rule/">The six-month passport-validity rule</a></li>
      <li><a href="/guides/">All travel guides →</a></li>
    </ul>
  </div>

  <h2>All destinations for a ${escapeHtml(name)} passport</h2>
  <table>
    <thead><tr><th></th><th>Country</th><th>Status</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  ${faqHtml}

  <div class="other-passports">
    <h2>Compare related passports</h2>
    <ul>${otherPassports}</ul>
    <p style="font-size:12px;color:var(--fg-mute);margin-top:14px;">
      Or <a href="/passport/" style="color:var(--fg-dim);">browse all ${allPassports.length} passports</a>.
    </p>
  </div>

  ${adInsBottom}

  ${siteFooter()}
</div>
</body>
</html>`;
}

function renderIndex(allPassports, snapshot, ranks) {
  // Sort the directory by mobility rank so the strongest passports lead.
  const ordered = [...allPassports].sort((a, b) => {
    const ra = ranks.get(a), rb = ranks.get(b);
    return (ra ? ra.rank : 999) - (rb ? rb.rank : 999);
  });
  const items = ordered.map(iso => {
    const c = COUNTRIES.find(x => x.iso2 === iso);
    const n = snapshot[iso] && snapshot[iso].name || (c && c.name);
    if (!c || !n) return "";
    const ri = ranks.get(iso);
    return `<li><a href="${iso.toLowerCase()}/">${c.flag} <strong>${escapeHtml(n)}</strong></a> <span class="vf-count">${ri ? ri.mobility : "?"} visa-free/VoA · #${ri ? ri.rank : "?"}</span></li>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Passport visa requirements directory ${new Date().getFullYear()} · travelnow.info</title>
<meta name="description" content="Browse visa requirements and the global mobility ranking for ${allPassports.length} passports. Updated daily from public visa-policy sources.">
<link rel="canonical" href="${SITE_URL ? SITE_URL + "/passport/" : "/passport/"}">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<style>
  :root { --link:#60a5fa; --fg-dim:#aab4c8; --fg-mute:#6b7591; --border:rgba(148,173,220,0.15); }
  body { margin:0; background:#05070d; color:#e7ecf5; font-family:-apple-system,system-ui,sans-serif; line-height:1.6; }
  .wrap { max-width:880px; margin:0 auto; padding:32px 20px; }
  h1 { font-size:25px; font-weight:600; }
  .intro { font-size:15px; color:var(--fg-dim); max-width:640px; }
  .intro a { color:var(--link); }
  ul.dir { list-style:none; padding:0; columns:2; column-gap:24px; font-size:14px; margin-top:22px; }
  ul.dir li { margin-bottom:8px; break-inside:avoid; }
  ul.dir a { color:#e7ecf5; text-decoration:none; }
  ul.dir a:hover { text-decoration:underline; }
  .vf-count { font-size:11px; color:var(--fg-mute); margin-left:6px; }
  .back { display:inline-block; padding:10px 16px; background:#111827; border:1px solid var(--border); border-radius:8px; color:#e7ecf5; text-decoration:none; font-size:13px; margin-bottom:20px; }
  .site-footer { margin-top:44px; padding-top:22px; border-top:1px solid var(--border); }
  .footer-nav { display:flex; flex-wrap:wrap; gap:14px; font-size:13px; margin-bottom:12px; }
  .footer-nav a { color:var(--fg-dim); text-decoration:none; }
  .footer-note { font-size:12px; color:var(--fg-mute); }
  @media (max-width:600px) { ul.dir { columns:1; } }
</style>
<script src="/assets/analytics.js"></script>
</head>
<body>
<div class="wrap">
  <a class="back" href="../">← Back to the globe</a>
  <h1>Passport visa-requirement directory</h1>
  <p class="intro">Every passport we track, ranked by <strong>global mobility</strong> — the number of destinations you
  can enter without arranging a visa in advance (visa-free plus visa on arrival). Open any passport for a full country
  breakdown, regional analysis and FAQ. Figures are rebuilt every 24 hours. New here? Start with our
  <a href="/guides/visa-types-explained/">guide to visa types</a>.</p>
  <p style="font-size:13px;color:var(--fg-mute);">${allPassports.length} passports · Data refreshed ${new Date().toISOString().slice(0,10)}</p>
  <ul class="dir">${items}</ul>
  ${siteFooter()}
</div>
</body>
</html>`;
}

function renderSitemap(allPassports) {
  const base = SITE_URL || "";
  const today = new Date().toISOString().slice(0,10);
  const guides = [
    "visa-types-explained", "schengen-90-180-rule", "etias-2026-explained",
    "transit-visa-guide", "passport-validity-six-month-rule",
  ];
  const urls = [
    `<url><loc>${base}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>`,
    `<url><loc>${base}/guides/</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`,
    ...guides.map(g => `<url><loc>${base}/guides/${g}/</loc><lastmod>${today}</lastmod><priority>0.85</priority></url>`),
    `<url><loc>${base}/alerts/</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`,
    `<url><loc>${base}/digital-nomad-visa/</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`,
    `<url><loc>${base}/citizenship-by-investment/</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`,
    `<url><loc>${base}/transit-map/</loc><lastmod>${today}</lastmod><priority>0.95</priority></url>`,
    `<url><loc>${base}/etias/</loc><lastmod>${today}</lastmod><priority>0.95</priority></url>`,
    `<url><loc>${base}/passport-validity/</loc><lastmod>${today}</lastmod><priority>0.95</priority></url>`,
    `<url><loc>${base}/visa-shortcuts/</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`,
    `<url><loc>${base}/esta-rules/</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`,
    `<url><loc>${base}/visa-checklist/tr-schengen/</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`,
    `<url><loc>${base}/schengen-calculator/</loc><lastmod>${today}</lastmod><priority>0.95</priority></url>`,
    `<url><loc>${base}/itinerary/</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`,
    `<url><loc>${base}/about/</loc><lastmod>${today}</lastmod><priority>0.6</priority></url>`,
    `<url><loc>${base}/contact/</loc><lastmod>${today}</lastmod><priority>0.5</priority></url>`,
    `<url><loc>${base}/privacy/</loc><lastmod>${today}</lastmod><priority>0.3</priority></url>`,
    `<url><loc>${base}/terms/</loc><lastmod>${today}</lastmod><priority>0.3</priority></url>`,
    `<url><loc>${base}/passport/</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`,
    ...allPassports.map(iso =>
      `<url><loc>${base}/passport/${iso.toLowerCase()}/</loc><lastmod>${today}</lastmod><priority>0.6</priority></url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

// Compute a global mobility ranking across all passports so each page can state
// its real standing (genuine, derived data — not invented).
function computeRanks(allPassports, snapshot) {
  const scored = allPassports.map(iso => {
    const counts = countStatuses(resolveAllRows(iso, snapshot));
    return { iso, mobility: mobilityScore(counts) };
  }).sort((a, b) => b.mobility - a.mobility);
  const ranks = new Map();
  scored.forEach((s, i) => {
    ranks.set(s.iso, { rank: i + 1, total: scored.length, mobility: s.mobility });
  });
  return ranks;
}

function main() {
  const allPassports = Object.keys(SNAPSHOT).sort();
  const ranks = computeRanks(allPassports, SNAPSHOT);
  const outDir = path.join(ROOT, "passport");
  fs.mkdirSync(outDir, { recursive: true });

  let written = 0;
  for (const iso of allPassports) {
    const html = renderPage(iso, allPassports, SNAPSHOT, ranks);
    if (!html) { console.log(`✗ skip ${iso} (no country / no data)`); continue; }
    const dir = path.join(outDir, iso.toLowerCase());
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
    written++;
  }

  fs.writeFileSync(path.join(outDir, "index.html"), renderIndex(allPassports, SNAPSHOT, ranks));
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), renderSitemap(allPassports));

  const robotsPath = path.join(ROOT, "robots.txt");
  if (!fs.existsSync(robotsPath)) {
    const robots = `User-agent: *\nAllow: /\n${SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : "Sitemap: /sitemap.xml\n"}`;
    fs.writeFileSync(robotsPath, robots);
  }

  console.log(`✓ wrote ${written} passport pages + index + sitemap.xml`);
}

main();
