// Generates /passport/<iso2>/index.html for every passport in data/passports-snapshot.json.
// Run: node scripts/generate-seo.js
// Output: ./passport/<iso2>/index.html  +  ./sitemap.xml
//
// Each page is a real, indexable static HTML document with:
//   • A unique, data-driven written analysis of THIS passport (global mobility
//     rank, regional strengths/weaknesses, curated notable destinations, FAQ) —
//     so the page adds genuine commentary/curation on top of the raw data
//     instead of just reproducing a third-party table (AdSense "thin content").
//   • Visa counts and the global rank computed by the SAME data layer the map
//     uses (data/passports.js + visa-overrides.js, run in a Node sandbox), so a
//     passport page never disagrees with the map
//   • A full table of every destination + the resolved visa status
//   • Internal links to related passport pages + guides + tools (SEO + retention)
//   • OG / Twitter cards / canonical / JSON-LD Article + FAQPage + Breadcrumbs
//   • The shared masthead + footer + design-system CSS from scripts/partials.js

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { headAssets, masthead, footer } = require("./partials");

const ROOT       = path.resolve(__dirname, "..");
const SNAPSHOT   = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "passports-snapshot.json"), "utf8"));

// The browser data layer, loaded as-is: resolveStatus (ID-card travel, travel
// authorisations, hand-curated overrides, destination floors), tally and
// passportRank are exactly what the map shows.
const DATA = (() => {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ["countries.js", "passports.js", "visa-overrides.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, "data", f), "utf8"), ctx, { filename: f });
  }
  return ctx;
})();
const COUNTRIES  = DATA.COUNTRIES;
// Absolute URLs everywhere (sitemap <loc>, canonicals, og:url). The sitemap
// protocol REQUIRES absolute URLs — relative ones are ignored by Google, which
// was hurting discovery. Defaults to the live domain; override via SITE_URL.
const SITE_URL   = process.env.SITE_URL || "https://travelnow.info";

// Colours come from the design tokens (assets/tokens.css: --vf, --ev, …).
const STATUS_INFO = {
  idc: { label: "ID card travel",   note: "Travel on a national ID card" },
  vf:  { label: "Visa-free",        note: "No visa required" },
  eta: { label: "Travel authorization", note: "Online authorization before travel, no visa" },
  ev:  { label: "eVisa",            note: "Apply online before travel" },
  voa: { label: "Visa on arrival",  note: "Issued at the border" },
  vr:  { label: "Visa required",    note: "Apply at embassy or consulate" },
  ban: { label: "No entry allowed", note: "Entry refused to this nationality" },
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

// Same statuses and numbers as the map (see DATA above). snapshot is unused but
// kept in the signatures the page renderers already call.
function resolveStatus(passportIso2, destIso2) {
  return DATA.resolveStatus(passportIso2, destIso2);
}

// Destinations that need no consular visa arranged in advance.
const EASY = new Set(["idc", "vf", "eta", "voa"]);

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Resolve every destination the map counts (no own country, no Antarctica).
function resolveAllRows(passport) {
  return COUNTRIES
    .filter(c => c.iso2 !== passport && c.continent !== "AN")
    .map(c => {
      const r = resolveStatus(passport, c.iso2);
      return { ...c, status: r.status, days: r.days };
    });
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
  const visaFreeTotal = DATA.mobilityScore(counts);   // no advance visa needed
  const accessTotal = DATA.accessScore(counts);
  // "71 visa-free, 3 with an ID card, 13 with a visa on arrival"
  const easyParts = [
    `${counts.vf} visa-free`,
    counts.idc ? `${counts.idc} with just a national ID card` : "",
    counts.eta ? `${counts.eta} with an online travel authorization` : "",
    `${counts.voa} with a visa on arrival`,
  ].filter(Boolean);
  const rankInfo = ranks.get(passport);
  const rank = rankInfo ? rankInfo.rank : null;
  const rankTotal = rankInfo ? rankInfo.total : null;

  // Regional breakdown
  const byCont = {};
  rows.forEach(r => {
    if (r.continent === "AN") return; // Antarctica: not a normal destination
    const b = byCont[r.continent] || (byCont[r.continent] = { easy: 0, total: 0 });
    b.total++;
    if (EASY.has(r.status)) b.easy++;
  });
  const regionLines = Object.keys(byCont)
    .map(k => ({ k, ...byCont[k], pct: byCont[k].easy / byCont[k].total }))
    .sort((a, b) => b.pct - a.pct);
  const strongest = regionLines[0];
  const weakest = regionLines[regionLines.length - 1];

  // Curated notable destinations among the MAJOR set
  const majorResolved = MAJOR_DESTS
    .filter(iso => iso !== passport && snapshot[iso])
    .map(iso => ({ iso, ...resolveStatus(passport, iso) }));
  const easyMajors = majorResolved.filter(d => EASY.has(d.status))
    .map(d => nameOf(d.iso, snapshot)).slice(0, 8);
  const hardMajors = majorResolved.filter(d => d.status === "vr" || d.status === "ev")
    .map(d => ({ name: nameOf(d.iso, snapshot), status: d.status }));
  const visaMajors = hardMajors.filter(d => d.status === "vr").map(d => d.name).slice(0, 6);
  const evisaMajors = hardMajors.filter(d => d.status === "ev").map(d => d.name).slice(0, 5);

  // Representative checks for the FAQ
  const usR  = resolveStatus(passport, "US");
  const deR  = resolveStatus(passport, "DE");
  const statusPhrase = (r) => {
    if (r.status === "idc") return "can travel with just a national ID card";
    if (r.status === "eta") return "need no visa, only an online travel authorization before departure";
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
    ${listJoin(easyParts)}.`;
  html += ` Beyond those, ${counts.ev} destinations offer an eVisa you apply for online — counting them, that is
    <strong>${accessTotal}</strong> destinations with no embassy visit — and ${counts.vr}
    still require a traditional embassy visa${counts.ban ? `, while ${counts.ban} refuse entry to this nationality` : ""}.`;
  if (rank) {
    html += ` By visa-free access it ranks <strong>#${rank} of ${rankTotal}</strong> passports worldwide.`;
  }
  html += `</p>`;

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
      a: `Around ${visaFreeTotal} of the ${total} destinations we track need no visa arranged in advance — ${listJoin(easyParts)}. A further ${counts.ev} offer an eVisa online.`,
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
      a: `Passports are ranked by how many destinations they can enter without applying for a visa — visa-free, with a national ID card, with an online travel authorization or with a visa on arrival — the same measure passport indexes use; ties are broken by eVisa access. It is the same number and the same ranking the interactive map shows. Figures are rebuilt every 24 hours from public visa-policy sources, so this page reflects the most recent change we have recorded. Always confirm with the destination's embassy before booking.`,
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

function renderPage(passport, allPassports, snapshot, ranks) {
  const pp = snapshot[passport];
  const country = COUNTRIES.find(c => c.iso2 === passport);
  if (!country || !pp) return null;
  const name = pp.name;
  const flag = country.flag;
  const slug = passport.toLowerCase();

  const rows = resolveAllRows(passport);
  const counts = DATA.tally(passport);

  // Sort by how easy entry is, then alphabetically.
  const order = { idc: 0, vf: 1, eta: 2, ev: 3, voa: 4, vr: 5, ban: 6 };
  rows.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.name.localeCompare(b.name));

  const { proseHtml, faqHtml, faqSchema } = renderProse(passport, name, rows, counts, ranks, snapshot);

  const rankInfo = ranks.get(passport);
  const titleText = `${name} passport visa requirements 2026 — ${DATA.mobilityScore(counts)} destinations without a visa`;
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
    return `<li><a href="../${iso.toLowerCase()}/"><span class="flag">${c.flag}</span> ${escapeHtml(n)}</a></li>`;
  }).join("");

  const rowsHtml = rows.map(r => {
    const info = STATUS_INFO[r.status];
    if (!info) return "";
    const days = r.days ? `<span class="days">up to ${r.days} days</span>` : "";
    return `
      <tr class="row-${r.status}">
        <td class="flag">${r.flag}</td>
        <td class="name">${escapeHtml(r.name)}</td>
        <td class="status"><span class="sw${r.status === "ban" ? " sw-ban" : ""}" style="--sw:var(--${r.status})" aria-hidden="true"></span>${info.label} ${days}</td>
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
${headAssets()}
<style>.wrap{max-width:820px}</style>
</head>
<body>
${masthead({ path: "/passport/" + slug + "/", i18n: false })}
<div class="wrap">
  <p class="crumbs"><a href="/">travelnow.info</a> › <a href="/passport/">Passports</a> › ${escapeHtml(name)}</p>
  <header class="pp-hero">
    <span class="hero-flag flag" aria-hidden="true">${flag}</span>
    <div>
      <h1>${escapeHtml(name)} passport visa requirements</h1>
      <p class="subtitle">${rows.length} destinations${rankInfo ? ` · Global mobility rank #${rankInfo.rank}` : ""} · Updated ${today}</p>
    </div>
  </header>

  <section class="stats">
    ${counts.idc ? `<div class="stat idc"><div class="n">${counts.idc}</div><div class="l">ID card</div></div>` : ""}
    <div class="stat vf"><div class="n">${counts.vf}</div><div class="l">Visa-free</div></div>
    ${counts.eta ? `<div class="stat eta"><div class="n">${counts.eta}</div><div class="l">Travel auth.</div></div>` : ""}
    <div class="stat ev"><div class="n">${counts.ev}</div><div class="l">eVisa</div></div>
    <div class="stat voa"><div class="n">${counts.voa}</div><div class="l">On arrival</div></div>
    <div class="stat vr"><div class="n">${counts.vr}</div><div class="l">Visa required</div></div>
    ${counts.ban ? `<div class="stat ban"><div class="n">${counts.ban}</div><div class="l">No entry</div></div>` : ""}
  </section>

  ${proseHtml}

  <p class="cta-row"><a class="primary" href="/">See every country on the interactive map →</a></p>

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
    <p class="fine" style="margin-top:14px;">
      Or <a href="/passport/">browse all ${allPassports.length} passports</a>.
    </p>
  </div>

  ${adInsBottom}
</div>
${footer()}
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
    return `<li><a href="${iso.toLowerCase()}/"><span class="flag">${c.flag}</span> <strong>${escapeHtml(n)}</strong></a> <span class="vf-count">${ri ? ri.mobility : "?"} without a visa · #${ri ? ri.rank : "?"}</span></li>`;
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
${headAssets()}
<style>.wrap{max-width:880px}</style>
<script src="/assets/analytics.js"></script>
</head>
<body>
${masthead({ path: "/passport/", i18n: false })}
<div class="wrap">
  <h1>Passport visa-requirement directory</h1>
  <p class="intro">Every passport we track, ranked by <strong>global mobility</strong> — the number of destinations you
  can enter without applying for a visa (visa-free, ID card, travel authorization or visa on arrival), ties broken by
  eVisa access. It is the same ranking the interactive map shows. Open any passport for a full country
  breakdown, regional analysis and FAQ. Figures are rebuilt every 24 hours. New here? Start with our
  <a href="/guides/visa-types-explained/">guide to visa types</a>.</p>
  <p style="font-size:13px;color:var(--fg-mute);">${allPassports.length} passports · Data refreshed ${new Date().toISOString().slice(0,10)}</p>
  <ul class="dir">${items}</ul>
</div>
${footer()}
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
    `<url><loc>${base}/safety-map/</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`,
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

// Global ranking — the map's own passportRank(), so both always agree.
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
