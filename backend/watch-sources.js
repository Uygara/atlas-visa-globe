// watch-sources.js
// Rule-change watch: reads official visa pages and news searches several times a day and writes a
// report of anything new. It NEVER edits visa data. A person or Claude reads the report (a GitHub
// issue labelled "rule-change", opened by .github/workflows/rule-watch.yml), checks the official
// source and only then changes data/visa-overrides.js. Playbook: docs/RULE-WATCH.md.
//
// Three kinds of source:
//   page    — an official page. Its visible text is stored in backend/watch/<id>.txt; when the text
//             changes, the added and removed lines go into the report.
//   gazette — Türkiye's Official Gazette index of the day; new entries that mention visas or
//             passports go into the report.
//   news    — Google News RSS searches; new headlines go into the report as leads, never as facts.
//
// Usage: node watch-sources.js            (writes ../watch-report.md only when something is new)
//        node watch-sources.js --dry-run  (prints, writes nothing)

const fs = require("fs");
const path = require("path");
// node-fetch, not the built-in fetch: the Turkish MFA answers 403 to the built-in one from GitHub
// runners, while backend/fetch-advisories.js (node-fetch) reads the same site every day.
const fetch = require("node-fetch");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(__dirname, "watch");
const STATE = path.join(DIR, "state.json");
const REPORT = path.join(ROOT, "watch-report.md");
const DRY = process.argv.includes("--dry-run");
const UA = "travelnow.info/1.0 (+https://travelnow.info; visa rule watch)";

const PAGES = [
  { id: "tr-mfa-turkish-citizens", name: "Türkiye MFA: visa rules for Turkish citizens",
    url: "https://www.mfa.gov.tr/turk-vatandaslarinin-tabi-oldugu-vize-uygulamalari.tr.mfa" },
  { id: "tr-mfa-foreigners", name: "Türkiye MFA: visa regime for foreigners entering Türkiye",
    url: "https://www.mfa.gov.tr/yabancilarin-tabi-oldugu-vize-rejimi.tr.mfa" },
  { id: "tr-mfa-foreigners-en", name: "Türkiye MFA: visa information for foreigners (EN)",
    url: "https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa" },
  { id: "eu-visa-policy", name: "European Commission: Schengen visa policy",
    url: "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en" },
  { id: "eu-council-visa-policy", name: "Council of the EU: EU visa policy (suspension mechanism, new waivers)",
    url: "https://www.consilium.europa.eu/en/policies/eu-visa-policy/" },
  { id: "uk-visitor-visa-list", name: "UK: visa nationals list (Immigration Rules Appendix Visitor: Visa national list)",
    url: "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-visitor-visa-national-list" },
  { id: "uk-eta", name: "UK: who needs an ETA",
    url: "https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta" },
];

const KEYWORDS = /vize|pasaport|seyahat belgesi|vatandaşlarına|muafiyet/i;

const NEWS = [
  { q: '"vize muafiyeti"', hl: "tr", gl: "TR" },
  { q: '"vize zorunluluğu"', hl: "tr", gl: "TR" },
  { q: '"vizesiz" yeni karar', hl: "tr", gl: "TR" },
  { q: '"visa-free" citizens new rule', hl: "en-US", gl: "US" },
  { q: '"visa requirement" citizens introduces OR suspends OR reinstates', hl: "en-US", gl: "US" },
  { q: '"visa exemption" suspended OR extended OR abolished', hl: "en-US", gl: "US" },
];
const NEWS_MAX_AGE_H = 48;
const NEWS_MAX_ITEMS = 15;
// Only headlines that say something changed; "visa-free countries list 2026" articles are not leads.
const NEWS_CHANGE = /suspend|reinstat|introduc|abolish|scrap|lift|waive|end[s]? visa|new visa|from (1|\d+) |askıya|kaldır|getir|başlıyor|başladı|sona er|muafiyet(i)? (tanı|uzat)|zorunluluğu/i;

// ── text helpers ───────────────────────────────────────────────────────────
function decode(s) {
  return s
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

// Visible text, one block per line. Dates, counters and tokens that change on every load are
// dropped so that only real edits show up.
function htmlToLines(html) {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    // No "form" here: ASP.NET sites such as mfa.gov.tr put the whole page inside one <form>.
    .replace(/<(script|style|noscript|svg|head|nav|footer)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|tr|h[1-6]|table|ul|ol|section|article|dd|dt)>|<br\s*\/?>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<[^>]+>/g, " ");
  s = decode(s);
  return s.split("\n")
    .map((l) => l.replace(/\s+/g, " ").replace(/(\s*\|\s*)+$/, "").trim())
    .filter((l) => l.length >= 12 && /[a-zçğıöşü]{3}/i.test(l));
}

function lineDiff(oldLines, newLines) {
  const a = new Set(oldLines), b = new Set(newLines);
  return { added: newLines.filter((l) => !a.has(l)), removed: oldLines.filter((l) => !b.has(l)) };
}

async function get(url, accept = "text/html") {
  const r = await fetch(url, { timeout: 30000, redirect: "follow",
    headers: { "User-Agent": UA, Accept: accept, "Accept-Language": "tr,en;q=0.8" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch { return { pages: {}, seen: [] }; }
}

// ── sources ────────────────────────────────────────────────────────────────
async function checkPage(p, st, out) {
  const rec = st.pages[p.id] || (st.pages[p.id] = { fails: 0 });
  const file = path.join(DIR, `${p.id}.txt`);
  let lines;
  try {
    lines = htmlToLines(await get(p.url));
    if (lines.length < 5) throw new Error(`only ${lines.length} text lines`);
  } catch (e) {
    rec.fails = (rec.fails || 0) + 1;
    rec.lastError = String(e.message || e);
    console.log(`FAIL  ${p.id}: ${rec.lastError} (${rec.fails} in a row)`);
    // Say it once, on the third failure in a row, so a dead link is fixed but never nags.
    if (rec.fails === 3) out.broken.push(`- ${p.name}: ${rec.lastError}, 3 checks in a row. ${p.url}`);
    return;
  }
  rec.fails = 0; delete rec.lastError;
  rec.checked = new Date().toISOString();
  const prev = fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n").filter(Boolean) : null;
  if (!DRY) fs.writeFileSync(file, lines.join("\n") + "\n");
  if (!prev) { console.log(`base  ${p.id}: ${lines.length} lines stored`); return; }
  const d = lineDiff(prev, lines);
  if (!d.added.length && !d.removed.length) { console.log(`same  ${p.id}`); return; }
  rec.changed = rec.checked;
  console.log(`DIFF  ${p.id}: +${d.added.length} -${d.removed.length}`);
  const cap = (arr, sign) => arr.slice(0, 40).map((l) => `${sign} ${l.slice(0, 300)}`).join("\n") +
    (arr.length > 40 ? `\n${sign} … ${arr.length - 40} more lines` : "");
  out.pages.push(`### ${p.name}\n${p.url}\n\n\`\`\`diff\n${[cap(d.removed, "-"), cap(d.added, "+")].filter(Boolean).join("\n")}\n\`\`\``);
}

async function checkGazette(st, out) {
  const now = new Date(Date.now() + 3 * 3600e3); // Türkiye time: the Gazette is dated by it
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const url = `https://www.resmigazete.gov.tr/eskiler/${ymd.slice(0, 4)}/${ymd.slice(4, 6)}/${ymd}.htm`;
  const rec = st.pages.gazette || (st.pages.gazette = { fails: 0 });
  let html;
  try { html = await get(url); } catch (e) {
    try { html = await get("https://www.resmigazete.gov.tr/"); } catch (e2) {
      rec.fails = (rec.fails || 0) + 1;
      console.log(`FAIL  gazette: ${e2.message} (${rec.fails} in a row)`);
      if (rec.fails === 3) out.broken.push(`- Official Gazette: ${e2.message}, 3 checks in a row. ${url}`);
      return;
    }
  }
  rec.fails = 0; rec.checked = new Date().toISOString();
  const seen = new Set(st.seen);
  const hits = [];
  let links = 0;
  // Each entry is a link to the act; keep the link text that mentions visas or passports.
  for (const m of html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = decode(m[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    links++;
    if (text.length < 15 || !KEYWORDS.test(text)) continue;
    const href = new URL(m[1], url).href;
    const key = `rg:${href}`;
    if (seen.has(key)) continue;
    st.seen.push(key);
    hits.push(`- ${text} (${href})`);
  }
  console.log(`gazette ${ymd}: ${links} links, ${hits.length} new visa or passport entries`);
  if (hits.length) out.gazette.push(...hits);
}

async function checkNews(st, out) {
  const seen = new Set(st.seen);
  const cutoff = Date.now() - NEWS_MAX_AGE_H * 3600e3;
  const items = [];
  for (const n of NEWS) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(n.q + " when:2d")}&hl=${n.hl}&gl=${n.gl}&ceid=${n.gl}:${n.hl.split("-")[0]}`;
    let xml;
    // Google News answers 503 to quick bursts: space the searches and retry once.
    await new Promise((r) => setTimeout(r, 3000));
    try { xml = await get(url, "application/rss+xml"); } catch (e) {
      await new Promise((r) => setTimeout(r, 15000));
      try { xml = await get(url, "application/rss+xml"); } catch (e2) { console.log(`FAIL  news ${n.q}: ${e2.message}`); continue; }
    }
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const pick = (tag) => { const x = m[1].match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return x ? decode(x[1].replace(/<!\[CDATA\[|\]\]>/g, "")).trim() : ""; };
      const title = pick("title"), link = pick("link"), date = Date.parse(pick("pubDate"));
      if (!title || !link || (date && date < cutoff) || !NEWS_CHANGE.test(title)) continue;
      const key = `news:${title.toLowerCase().replace(/\W+/g, " ").trim().slice(0, 120)}`;
      if (seen.has(key)) continue;
      seen.add(key); st.seen.push(key);
      items.push({ title, link, date: date ? new Date(date).toISOString().slice(0, 10) : "" });
    }
  }
  console.log(`news: ${items.length} new headlines`);
  out.news.push(...items.slice(0, NEWS_MAX_ITEMS).map((i) => `- ${i.date} ${i.title} (${i.link})`));
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  if (!DRY) fs.mkdirSync(DIR, { recursive: true });
  const st = loadState();
  const first = !Object.keys(st.pages).length;
  const out = { pages: [], gazette: [], news: [], broken: [] };
  for (const p of PAGES) await checkPage(p, st, out);
  await checkGazette(st, out);
  await checkNews(st, out);
  st.seen = st.seen.slice(-3000);
  if (!DRY) fs.writeFileSync(STATE, JSON.stringify(st, null, 1) + "\n");

  // The first run only stores the baseline; old headlines are not news.
  if (first) { console.log("first run: baseline stored, no report"); return; }
  const parts = [];
  if (out.pages.length) parts.push(`## Official pages that changed\n\n${out.pages.join("\n\n")}`);
  if (out.gazette.length) parts.push(`## Official Gazette (Türkiye): new visa or passport entries\n\n${out.gazette.join("\n")}`);
  if (out.news.length) parts.push(`## News leads (not a source: confirm on an official page first)\n\n${out.news.join("\n")}`);
  if (out.broken.length) parts.push(`## Watched pages that could not be read\n\n${out.broken.join("\n")}`);
  if (!parts.length) { console.log("nothing new"); return; }
  const body = `Rule watch, ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC. ` +
    `Follow docs/RULE-WATCH.md: confirm each change on the official page, then add it to data/visa-overrides.js ` +
    `with the source and a check in tools/audit-data.js. Close this issue when done or when nothing applies.\n\n` +
    parts.join("\n\n") + "\n";
  if (DRY) console.log(body); else fs.writeFileSync(REPORT, body);
  console.log(`report: ${out.pages.length} pages, ${out.gazette.length} gazette, ${out.news.length} news, ${out.broken.length} broken`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { htmlToLines, lineDiff };
