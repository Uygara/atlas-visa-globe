// fetch-news.js — daily visa-news aggregator. Two sources:
//
//   1. Wikipedia revision history for "Visa policy of <country>" articles.
//      We pull recent edit summaries, filter for meaningful policy keywords
//      (visa-free, abolish, eVisa, fee, …), and emit one VISA_NEWS item per
//      hit. Destination is the article subject; passport scope defaults to
//      "all" unless the edit summary names a nationality (best-effort).
//
//   2. UK FCO foreign-travel-advice Atom feed at
//      https://www.gov.uk/foreign-travel-advice.atom — one item per country
//      update. Destination is the linked country; passport scope is "all".
//
// Output is merged into ../data/visa-news.js, preserving manual: items and
// deduplicating by stable id. Items older than NEWS_MAX_AGE_DAYS are pruned.
//
// Run:
//   node fetch-news.js              (live run, writes file)
//   node fetch-news.js --dry-run    (print, don't write)
//
// Wired into the daily cron in .github/workflows/daily-refresh.yml.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const OUT_PATH = path.join(__dirname, "..", "data", "visa-news.js");
const NEWS_MAX_AGE_DAYS = 120;        // keep last ~4 months
const REQUEST_DELAY_MS = 800;         // polite pacing
const UA = "AtlasVisaGlobe/1.0 (https://travelnow.info; contact via repo)";
const DRY_RUN = process.argv.includes("--dry-run");

// ─── Helpers ────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function sha(s) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 10);
}

function withinAge(dateStr) {
  if (!dateStr) return false;
  const ageMs = Date.now() - new Date(dateStr + "T00:00:00Z").getTime();
  return ageMs >= 0 && ageMs <= NEWS_MAX_AGE_DAYS * 86400_000;
}

// ─── Destination set ────────────────────────────────────────────────────
// Wikipedia "Visa policy of <country>" articles we'll poll. Kept tight on
// purpose — adding more is cheap but each one is an HTTP call per day.
const WIKI_DESTINATIONS = [
  ["United_States", "US"], ["United_Kingdom", "GB"], ["Canada", "CA"],
  ["Australia", "AU"], ["New_Zealand", "NZ"], ["Japan", "JP"],
  ["South_Korea", "KR"], ["China", "CN"], ["India", "IN"],
  ["Thailand", "TH"], ["Vietnam", "VN"], ["Indonesia", "ID"],
  ["Malaysia", "MY"], ["Singapore", "SG"], ["Philippines", "PH"],
  ["United_Arab_Emirates", "AE"], ["Saudi_Arabia", "SA"], ["Turkey", "TR"],
  ["Israel", "IL"], ["Egypt", "EG"], ["Morocco", "MA"], ["Kenya", "KE"],
  ["South_Africa", "ZA"], ["Brazil", "BR"], ["Argentina", "AR"],
  ["Mexico", "MX"], ["Russia", "RU"], ["Sri_Lanka", "LK"],
  ["the_Schengen_Area", "EU"],
];

// Keywords that suggest a *real* policy change in an edit summary. Each
// regex has to be specific enough that "Removed unnecessary spaces"-style
// section-format edits don't slip through.
const POSITIVE_KEYWORDS = [
  /visa[- ]free (entry|access|travel|treatment|agreement)/i,
  /visa[- ]free for /i,
  /abolish(ed|es|ing)? .*visa/i,
  /lift(ed|s)? .*(visa|ban|restriction)/i,
  /waiv(e|er|ed|ing) (the )?(visa|fee)/i,
  /visa (waiver|exemption) (granted|extended|introduc|added|expand)/i,
  /e[- ]?visa (introduc|launch|expand)/i,
  /(reduce|cut|drop|lower)\w* .*fee/i,
  /now (allow|permit|grant)/i,
  /(added|granted) to .*(visa[- ]free|exemption)/i,
];
const NEGATIVE_KEYWORDS = [
  /reimpos(e|ed|ing)/i,
  /reinstat(e|ed|ing)/i,
  /(now |newly )require[ds]? .*visa/i,
  /fee.*(increase|rais(ed|e)|hik(ed|e))/i,
  /tighten(ed|s|ing)?/i,
  /suspend(ed|s|ing)? .*(visa|policy|exemption)/i,
  /restrict(ed|ions)? .*(entry|visa)/i,
  /(removed|dropped) from .*(visa[- ]free|exemption)/i,
];
// Section-only / cosmetic edits that should never become news.
const NOISE_KEYWORDS = [
  /typo/i, /spelling/i, /fmt/i, /^rv\b/i, /revert/i, /wikilink/i,
  /punctuation/i, /grammar/i, /^cleanup/i, /^c\/e\b/i, /reference fix/i,
  /^ref(s)?\b/i, /add(ed)? ref/i, /citation/i, /^minor/i,
  /unnecessary space/i, /^update\.?$/i, /^reformat/i, /^copyedit/i,
  /^style\b/i, /^link fix/i, /^\s*$/,
];

// Section-marker pattern: Wikipedia edit comments often start with
// "/* Visa exemption */" with nothing meaningful after. Reject those.
function isSectionOnlyComment(c) {
  // Strip leading "/* ... */" then check if anything substantive remains.
  const stripped = c.replace(/\/\*[^*]*\*\//g, "").trim();
  return stripped.length < 8;
}

function classifyComment(comment) {
  if (!comment) return null;
  if (NOISE_KEYWORDS.some(r => r.test(comment))) return null;
  if (isSectionOnlyComment(comment)) return null;
  if (POSITIVE_KEYWORDS.some(r => r.test(comment))) return "positive";
  if (NEGATIVE_KEYWORDS.some(r => r.test(comment))) return "warning";
  return null;
}

// Best-effort: extract a 2-letter ISO from common phrasings like
// "Turkish nationals" or "Kenya passport holders". We resolve via a small
// demonym→ISO table to avoid false positives.
const DEMONYM_TO_ISO = {
  Turkish: "TR", Kenyan: "KE", Indian: "IN", Chinese: "CN", American: "US",
  British: "GB", Russian: "RU", Brazilian: "BR", Saudi: "SA", Emirati: "AE",
  Japanese: "JP", Korean: "KR", Thai: "TH", Indonesian: "ID", Filipino: "PH",
  Malaysian: "MY", Singaporean: "SG", Vietnamese: "VN", Mexican: "MX",
  Argentine: "AR", Australian: "AU", Canadian: "CA", German: "DE",
  French: "FR", Italian: "IT", Spanish: "ES", Dutch: "NL", Polish: "PL",
};

function extractPassports(text) {
  const found = new Set();
  for (const [d, iso] of Object.entries(DEMONYM_TO_ISO)) {
    if (new RegExp(`\\b${d}\\b`).test(text)) found.add(iso);
  }
  return [...found];
}

// ─── Wikipedia ──────────────────────────────────────────────────────────
async function fetchWikiRevisions(article) {
  const url = "https://en.wikipedia.org/w/api.php" +
    "?action=query&prop=revisions" +
    `&titles=Visa_policy_of_${encodeURIComponent(article)}` +
    "&rvprop=timestamp%7Ccomment%7Cuser&rvlimit=20&format=json";
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`Wiki ${article}: HTTP ${r.status}`);
  const j = await r.json();
  const pages = j?.query?.pages || {};
  const first = Object.values(pages)[0];
  return first?.revisions || [];
}

async function collectFromWiki() {
  const out = [];
  for (const [article, iso] of WIKI_DESTINATIONS) {
    try {
      const revs = await fetchWikiRevisions(article);
      for (const rev of revs) {
        const date = (rev.timestamp || "").slice(0, 10);
        if (!withinAge(date)) continue;
        const severity = classifyComment(rev.comment);
        if (!severity) continue;
        const passports = extractPassports(rev.comment);
        const articleHuman = article.replace(/_/g, " ");
        // Strip leading "/* Section */" prefix from the edit comment; keep
        // just the human-readable change description for the headline.
        const cleanComment = rev.comment
          .replace(/^\s*\/\*[^*]*\*\/\s*/g, "")
          .trim();
        const headline = cleanComment.slice(0, 110);
        const id = "wiki:" + sha(article + "|" + rev.timestamp);
        out.push({
          id,
          date,
          source: "wiki",
          sourceUrl: `https://en.wikipedia.org/wiki/Visa_policy_of_${article}`,
          title: `${articleHuman}: ${headline}`,
          summary: cleanComment.length > 110 ? cleanComment : "",
          affects: {
            passports,
            destinations: iso === "EU" ? [] : [iso],
          },
          severity,
        });
      }
    } catch (e) {
      console.warn(`[wiki] ${article} skipped: ${e.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }
  return out;
}

// ─── UK FCO ─────────────────────────────────────────────────────────────
// Maps country names found in FCO feed entries back to ISO2. We only need
// the popular destinations — the feed entry url contains a slug we can
// match too.
const FCO_SLUG_TO_ISO = {
  "united-states": "US", "thailand": "TH", "turkey": "TR", "egypt": "EG",
  "india": "IN", "japan": "JP", "indonesia": "ID", "vietnam": "VN",
  "morocco": "MA", "kenya": "KE", "south-africa": "ZA", "brazil": "BR",
  "argentina": "AR", "mexico": "MX", "russia": "RU", "china": "CN",
  "sri-lanka": "LK", "philippines": "PH", "malaysia": "MY",
  "australia": "AU", "new-zealand": "NZ", "canada": "CA",
  "uae": "AE", "united-arab-emirates": "AE", "saudi-arabia": "SA",
  "israel": "IL", "south-korea": "KR", "singapore": "SG",
};

async function collectFromFCO() {
  const out = [];
  const url = "https://www.gov.uk/foreign-travel-advice.atom";
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error(`FCO HTTP ${r.status}`);
    const xml = await r.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    $("entry").each((_, el) => {
      const title = $(el).find("title").first().text().trim();
      const summary = $(el).find("summary").first().text().trim();
      const link = $(el).find("link").attr("href") || "";
      const updated = $(el).find("updated").first().text().trim();
      const date = updated.slice(0, 10);
      if (!withinAge(date)) return;
      // Slug from URL: /foreign-travel-advice/thailand
      const slug = (link.match(/foreign-travel-advice\/([^/?#]+)/) || [])[1];
      const iso = FCO_SLUG_TO_ISO[slug];
      if (!iso) return; // skip countries we don't care about yet
      // Cheap relevance gate — skip updates that don't mention visa, entry
      // requirements, or border rules.
      const blob = (title + " " + summary).toLowerCase();
      if (!/visa|entry|passport|border|immigration|eta\b/.test(blob)) return;
      const id = "fco:" + sha(link + "|" + updated);
      out.push({
        id,
        date,
        source: "fco",
        sourceUrl: /^https?:\/\//.test(link)
          ? link
          : "https://www.gov.uk" + (link.startsWith("/") ? link : "/" + link),
        title: title.replace(/^Foreign travel advice — /, ""),
        summary: summary || "",
        affects: { passports: [], destinations: [iso] },
        severity: /closed|warning|do not travel|suspended|tighten/i.test(blob)
          ? "warning"
          : "neutral",
      });
    });
  } catch (e) {
    console.warn(`[fco] feed skipped: ${e.message}`);
  }
  return out;
}

// ─── Merge with existing file ───────────────────────────────────────────
// We re-read data/visa-news.js, preserve all manual:* items, then merge in
// the freshly collected wiki:* / fco:* items, deduped by id. Result is
// sorted by date desc and pruned to NEWS_MAX_AGE_DAYS.
function readExisting() {
  try {
    const text = fs.readFileSync(OUT_PATH, "utf-8");
    // The file assigns to window.VISA_NEWS. Evaluate in a tiny sandbox.
    const window = {};
    new Function("window", text)(window);
    return window.VISA_NEWS || [];
  } catch (e) {
    return [];
  }
}

function mergeAndPrune(existing, fresh) {
  const byId = new Map();
  // Existing items first — but only keep manual:* through dedup (auto items
  // get superseded by fresh batch).
  for (const it of existing) {
    if (it.id?.startsWith("manual:")) byId.set(it.id, it);
  }
  for (const it of fresh) {
    if (!byId.has(it.id)) byId.set(it.id, it);
  }
  return [...byId.values()]
    .filter(it => withinAge(it.date))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

function serialize(items) {
  const header = [
    "// Visa news feed — auto-merged by backend/fetch-news.js.",
    "// Manual:* entries are preserved; wiki:* and fco:* are refreshed daily.",
    "// See data/visa-news.js header in the repo for schema docs.",
    "",
    "window.VISA_NEWS = [",
  ].join("\n");
  const body = items.map(it =>
    "  " + JSON.stringify(it).replace(/,"/g, ', "')
  ).join(",\n");
  return header + "\n" + body + "\n];\n";
}

// ─── Main ───────────────────────────────────────────────────────────────
(async () => {
  console.log("Collecting Wikipedia revisions…");
  const wikiItems = await collectFromWiki();
  console.log(`  ${wikiItems.length} candidate edits`);
  console.log("Collecting UK FCO updates…");
  const fcoItems = await collectFromFCO();
  console.log(`  ${fcoItems.length} relevant FCO entries`);
  const existing = readExisting();
  console.log(`  ${existing.length} existing items (will preserve manuals)`);
  const merged = mergeAndPrune(existing, [...wikiItems, ...fcoItems]);
  console.log(`  ${merged.length} items after merge + prune`);
  const text = serialize(merged);
  if (DRY_RUN) {
    console.log("--- DRY RUN ---");
    console.log(text.slice(0, 2000));
    return;
  }
  fs.writeFileSync(OUT_PATH, text);
  console.log(`Wrote ${OUT_PATH}`);
})().catch(e => { console.error(e); process.exit(1); });
