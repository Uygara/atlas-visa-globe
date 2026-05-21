// Generates /passport/<iso2>/index.html for every passport in data/passports-snapshot.json.
// Run: node scripts/generate-seo.js
// Output: ./passport/<iso2>/index.html  +  ./sitemap.xml
//
// Each page is a real, indexable static HTML document with:
//   • Visa counts (vf/ev/voa/vr) computed from live scraped data
//   • A full table of every destination + the resolved visa status
//   • Internal links to all other passport pages (SEO juice)
//   • OG / Twitter cards / canonical / JSON-LD breadcrumbs
//   • A "back to globe" link to the SPA root

const fs = require("fs");
const path = require("path");

const ROOT       = path.resolve(__dirname, "..");
const SNAPSHOT   = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "passports-snapshot.json"), "utf8"));
const COUNTRIES  = parseCountries(fs.readFileSync(path.join(ROOT, "data", "countries.js"), "utf8"));
const SITE_URL   = process.env.SITE_URL || ""; // e.g. "https://atlas.example.com" — leave empty for relative URLs

const STATUS_INFO = {
  vf:  { label: "Visa-free",       color: "#22c55e", note: "No visa required" },
  ev:  { label: "eVisa",           color: "#a3e635", note: "Apply online before travel" },
  voa: { label: "Visa on arrival", color: "#facc15", note: "Issued at the border" },
  vr:  { label: "Visa required",   color: "#ef4444", note: "Apply at embassy or consulate" },
};

function parseCountries(js) {
  // Extract { iso2, name, flag } from the COUNTRIES = [ ... ] array.
  const out = [];
  const re = /iso2:\s*"([A-Z]{2})",\s*name:\s*"([^"]+)"[^}]*flag:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(js))) {
    out.push({ iso2: m[1], name: m[2], flag: m[3] });
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
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderPage(passport, allPassports, snapshot) {
  const pp = snapshot[passport];
  const country = COUNTRIES.find(c => c.iso2 === passport);
  if (!country || !pp) return null;
  const name = pp.name;
  const flag = country.flag;
  const slug = passport.toLowerCase();

  // Resolve every destination
  const rows = COUNTRIES
    .filter(c => c.iso2 !== passport)
    .map(c => {
      const r = resolveStatus(passport, c.iso2, snapshot);
      return { ...c, status: r.status, days: r.days };
    });

  // Count statuses
  const counts = { vf: 0, ev: 0, voa: 0, vr: 0 };
  rows.forEach(r => { if (counts[r.status] != null) counts[r.status]++; });

  // Sort: vf, ev, voa, vr, then alpha
  const order = { vf: 0, ev: 1, voa: 2, vr: 3 };
  rows.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.name.localeCompare(b.name));

  const titleText = `${name} passport — visa requirements for ${rows.length} countries (2026)`;
  const description = `From a ${name} passport: ${counts.vf} visa-free, ${counts.ev} eVisa, ${counts.voa} visa on arrival, ${counts.vr} require a visa. Updated daily from Wikipedia.`;

  const canonical = SITE_URL ? `${SITE_URL}/passport/${slug}/` : `/passport/${slug}/`;

  // Ad configuration is read from ../data/ads.js at build time.
  // The file declares window.ADSENSE = { clientId, slots: { seoTop, seoBottom, … } }.
  // Until clientId is set, the ad markup is omitted entirely.
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

  // Pick a curated, on-topic set of 8–10 internal links instead of dumping all 200.
  // Google rewards relevance — too many links per page dilutes link equity and
  // looks like spam. We pick: same-region neighbours, plus 3 high-traffic anchors.
  const sameRegion = COUNTRIES
    .filter(c => c.continent === country.continent && c.iso2 !== passport && snapshot[c.iso2])
    .slice(0, 6)
    .map(c => c.iso2);
  const anchors = ["US", "GB", "DE", "JP"].filter(iso => iso !== passport && snapshot[iso]);
  const related = Array.from(new Set([...sameRegion, ...anchors])).slice(0, 10);
  const otherPassports = related.map(iso => {
    const c = COUNTRIES.find(x => x.iso2 === iso);
    const n = snapshot[iso]?.name || c?.name;
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
        <td class="name"><a href="https://en.wikipedia.org/wiki/Visa_requirements_for_${slug}_citizens#${encodeURIComponent(r.name)}" rel="noopener">${escapeHtml(r.name)}</a></td>
        <td class="status"><span class="dot" style="background:${info.color}"></span>${info.label} ${days}</td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(titleText)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/png" href="/assets/favicon.png">
<link rel="apple-touch-icon" href="/assets/favicon.png">
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
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": titleText,
  "description": description,
  "datePublished": new Date().toISOString().slice(0,10),
  "dateModified": new Date().toISOString().slice(0,10),
  "about": { "@type": "Country", "name": name },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Atlas", "item": SITE_URL || "/" },
      { "@type": "ListItem", "position": 2, "name": "Passports", "item": (SITE_URL || "") + "/passport/" },
      { "@type": "ListItem", "position": 3, "name": name + " passport" },
    ],
  },
})}</script>
<style>
  :root {
    --bg: #05070d; --panel: #111827; --fg: #e7ecf5; --fg-dim: #aab4c8; --fg-mute: #6b7591;
    --border: rgba(148,173,220,0.15);
    --vf: #22c55e; --ev: #a3e635; --voa: #facc15; --vr: #ef4444;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    background: var(--bg); color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    line-height: 1.5;
  }
  .wrap { max-width: 880px; margin: 0 auto; padding: 32px 20px; }
  header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
  .hero-flag { font-size: 48px; line-height: 1; }
  h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.01em; }
  .subtitle { margin: 4px 0 0 0; font-size: 13px; color: var(--fg-mute); }
  .stats {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
    background: var(--panel); border: 1px solid var(--border); border-radius: 12px;
    padding: 14px; margin: 16px 0 28px 0;
  }
  .stat { text-align: center; }
  .stat .n { font-size: 28px; font-weight: 600; }
  .stat .l { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--fg-mute); margin-top: 2px; }
  .stat.vf .n { color: var(--vf); }
  .stat.ev .n { color: var(--ev); }
  .stat.voa .n { color: var(--voa); }
  .stat.vr .n { color: var(--vr); }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13px; }
  th { font-size: 11px; color: var(--fg-mute); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
  td.flag { width: 32px; font-size: 18px; }
  td a { color: var(--fg); text-decoration: none; }
  td a:hover { text-decoration: underline; }
  td.status { color: var(--fg-dim); }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
  .days { color: var(--fg-mute); font-size: 11px; margin-left: 6px; }
  .back { display: inline-block; padding: 10px 16px; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; color: var(--fg); text-decoration: none; font-size: 13px; }
  .back:hover { border-color: var(--fg-dim); }
  footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border); font-size: 12px; color: var(--fg-mute); }
  .other-passports { margin-top: 30px; }
  .other-passports h2 { font-size: 14px; color: var(--fg-mute); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
  .other-passports ul { list-style: none; padding: 0; columns: 3; column-gap: 20px; font-size: 13px; }
  .other-passports li { margin-bottom: 4px; break-inside: avoid; }
  .other-passports a { color: var(--fg-dim); text-decoration: none; }
  .other-passports a:hover { color: var(--fg); }
  @media (max-width: 600px) {
    .stats { grid-template-columns: repeat(2, 1fr); }
    .other-passports ul { columns: 2; }
  }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="hero-flag" aria-hidden="true">${flag}</span>
    <div>
      <h1>${escapeHtml(name)} passport</h1>
      <p class="subtitle">Visa requirements for ${rows.length} countries · Updated ${new Date().toISOString().slice(0,10)}</p>
    </div>
  </header>

  <section class="stats">
    <div class="stat vf"><div class="n">${counts.vf}</div><div class="l">Visa-free</div></div>
    <div class="stat ev"><div class="n">${counts.ev}</div><div class="l">eVisa</div></div>
    <div class="stat voa"><div class="n">${counts.voa}</div><div class="l">On arrival</div></div>
    <div class="stat vr"><div class="n">${counts.vr}</div><div class="l">Visa required</div></div>
  </section>

  <p><a class="back" href="../../">← Explore on the interactive globe</a></p>

  ${adInsTop}

  <h2 style="margin-top:32px;font-size:16px;">All destinations</h2>
  <table>
    <thead><tr><th></th><th>Country</th><th>Status</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="other-passports">
    <h2>Related passports</h2>
    <ul>${otherPassports}</ul>
    <p style="font-size:12px;color:var(--fg-mute);margin-top:14px;">
      Or <a href="/passport/" style="color:var(--fg-dim);">browse all 200 passports</a>.
    </p>
  </div>

  ${adInsBottom}

  <footer>
    Data scraped daily from Wikipedia's "Visa requirements for ${escapeHtml(name)} citizens" article.
    Visa policies change frequently — always confirm with the destination's official embassy before booking.
  </footer>
</div>
</body>
</html>`;
}

function renderIndex(allPassports, snapshot) {
  const items = allPassports.map(iso => {
    const c = COUNTRIES.find(x => x.iso2 === iso);
    const n = snapshot[iso]?.name || c?.name;
    if (!c || !n) return "";
    // Compute vf count for quick browsing
    const counts = { vf: 0, ev: 0, voa: 0, vr: 0 };
    COUNTRIES.forEach(d => {
      if (d.iso2 === iso) return;
      const r = resolveStatus(iso, d.iso2, snapshot);
      if (counts[r.status] != null) counts[r.status]++;
    });
    return `<li><a href="${iso.toLowerCase()}/">${c.flag} <strong>${escapeHtml(n)}</strong></a> <span class="vf-count">${counts.vf} visa-free</span></li>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Passport visa requirements directory · Atlas</title>
<meta name="description" content="Browse visa requirements for ${allPassports.length} passports worldwide. Updated daily from Wikipedia.">
<link rel="canonical" href="${SITE_URL ? SITE_URL + "/passport/" : "/passport/"}">
<style>
  body { margin:0; background:#05070d; color:#e7ecf5; font-family:-apple-system,system-ui,sans-serif; line-height:1.5; }
  .wrap { max-width:880px; margin:0 auto; padding:32px 20px; }
  h1 { font-size:24px; font-weight:600; }
  ul { list-style:none; padding:0; columns:2; column-gap:24px; font-size:14px; }
  li { margin-bottom:8px; break-inside:avoid; }
  a { color:#e7ecf5; text-decoration:none; }
  a:hover { text-decoration:underline; }
  .vf-count { font-size:11px; color:#6b7591; margin-left:6px; }
  .back { display:inline-block; padding:10px 16px; background:#111827; border:1px solid rgba(148,173,220,0.15); border-radius:8px; color:#e7ecf5; text-decoration:none; font-size:13px; margin-bottom:20px; }
  @media (max-width:600px) { ul { columns:1; } }
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="../">← Back to globe</a>
  <h1>Passport directory</h1>
  <p>${allPassports.length} passports · Data refreshed ${new Date().toISOString().slice(0,10)}</p>
  <ul>${items}</ul>
</div>
</body>
</html>`;
}

function renderSitemap(allPassports) {
  const base = SITE_URL || "";
  const today = new Date().toISOString().slice(0,10);
  const urls = [
    `<url><loc>${base}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>`,
    `<url><loc>${base}/alerts/</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`,
    `<url><loc>${base}/digital-nomad-visa/</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`,
    `<url><loc>${base}/about/</loc><lastmod>${today}</lastmod><priority>0.5</priority></url>`,
    `<url><loc>${base}/privacy/</loc><lastmod>${today}</lastmod><priority>0.3</priority></url>`,
    `<url><loc>${base}/passport/</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`,
    ...allPassports.map(iso =>
      `<url><loc>${base}/passport/${iso.toLowerCase()}/</loc><lastmod>${today}</lastmod><priority>0.6</priority></url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function main() {
  const allPassports = Object.keys(SNAPSHOT).sort();
  const outDir = path.join(ROOT, "passport");
  fs.mkdirSync(outDir, { recursive: true });

  let written = 0;
  for (const iso of allPassports) {
    const html = renderPage(iso, allPassports, SNAPSHOT);
    if (!html) { console.log(`✗ skip ${iso} (no country / no data)`); continue; }
    const dir = path.join(outDir, iso.toLowerCase());
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
    written++;
  }

  // Directory index at /passport/
  fs.writeFileSync(path.join(outDir, "index.html"), renderIndex(allPassports, SNAPSHOT));

  // Sitemap at root
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), renderSitemap(allPassports));

  // robots.txt at root (idempotent)
  const robotsPath = path.join(ROOT, "robots.txt");
  if (!fs.existsSync(robotsPath)) {
    const robots = `User-agent: *\nAllow: /\n${SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : "Sitemap: /sitemap.xml\n"}`;
    fs.writeFileSync(robotsPath, robots);
  }

  console.log(`✓ wrote ${written} passport pages + index + sitemap.xml`);
}

main();
