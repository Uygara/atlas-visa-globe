// fetch-variants.js — diplomatic and official/service passport access for every
// passport, taken from Wikipedia. Most countries issue passports besides the
// ordinary one (India: diplomatic, official; Türkiye: green, grey, black) and
// those get visa-free entry to far more places, so the passport picker offers
// them as "types" (data/passport-variants.js).
//
// Two kinds of Wikipedia page carry the facts, and we read both:
//   1. DESTINATION pages, "Visa policy of <X>" — a "Non-ordinary passports"
//      section listing, per nationality, which passport kinds may enter X
//      without a visa (<li><a>Albania</a><sup>D O S</sup></li>, D = diplomatic,
//      O/S/Sp/C/PA = official/service/special/consular). ~150 pages have one.
//   2. PASSPORT pages, "Visa requirements for <X> citizens" — a "Non-ordinary
//      passports" section with "Country (diplomatic or service passports)"
//      prose, "Type of passport | Visa-free access" tables, or country tables.
//
// No invented data: an entry is only emitted when the page names the country
// AND the passport kind explicitly (or, for an unmarked entry, the section's own
// lead sentence names it). Numeric footnotes are resolved against the section's
// legend — an entry whose legend says "temporarily suspended" is dropped, "*"
// is honoured only when the legend says visa on arrival. Group entries (EU,
// GCC, ASEAN) are expanded from fixed member lists, honouring "(except …)".
// A page we cannot parse contributes nothing; if too many pages fail to fetch
// the previous data file is kept untouched.
//
// Output → ../data/passport-variants-data.js (window.PASSPORT_VARIANTS_DATA),
// merged under any hand-curated entry by data/passport-variants.js.
//
// Run:
//   node fetch-variants.js            (fetch + write)
//   node fetch-variants.js --dry-run  (print the summary, don't write)
//   VARIANTS_CACHE=<dir> node …       (cache fetched pages on disk; dev only)

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const OUT_PATH = path.join(__dirname, "..", "data", "passport-variants-data.js");
const ISO_MAP = JSON.parse(fs.readFileSync(path.join(__dirname, "iso-map.json"), "utf-8"));
const UA = "AtlasVisaGlobe/1.0 (https://travelnow.info; variants-refresh)";
const DRY_RUN = process.argv.includes("--dry-run");
const CACHE = process.env.VARIANTS_CACHE || null;
const DELAY = 1300;          // polite pacing (Wikipedia rate-limits bursts hard)
const MAX_FAIL_RATIO = 0.08; // more failed fetches than this → keep the old file
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── names → ISO ──────────────────────────────────────────────────────────
const ALIAS = {
  "Burma": "MM", "Myanmar": "MM", "East Timor": "TL", "Timor-Leste": "TL",
  "Ivory Coast": "CI", "Côte d'Ivoire": "CI", "North Korea": "KP", "South Korea": "KR",
  "Cape Verde": "CV", "Cabo Verde": "CV", "Republic of the Congo": "CG", "Congo": "CG",
  "DR Congo": "CD", "Democratic Republic of the Congo": "CD", "Eswatini": "SZ",
  "Swaziland": "SZ", "Palestine": "PS", "State of Palestine": "PS", "The Gambia": "GM",
  "Gambia": "GM", "Czech Republic": "CZ", "Czechia": "CZ", "Türkiye": "TR", "Turkey": "TR",
  "Bahamas": "BS", "The Bahamas": "BS", "Macao": "MO", "Macau": "MO", "Hong Kong": "HK",
  "Federated States of Micronesia": "FM", "Micronesia": "FM", "Kosovo": "XK",
  "Vatican City": "VA", "Holy See": "VA", "Republic of Ireland": "IE", "Ireland": "IE",
  "North Macedonia": "MK", "Macedonia": "MK", "São Tomé and Príncipe": "ST",
  "Sao Tome and Principe": "ST", "Saint Kitts and Nevis": "KN", "Saint Lucia": "LC",
  "Saint Vincent and the Grenadines": "VC", "Antigua and Barbuda": "AG",
  "Trinidad and Tobago": "TT", "Bosnia and Herzegovina": "BA", "Brunei": "BN",
  "Laos": "LA", "Vietnam": "VN", "Syria": "SY", "Iran": "IR", "Russia": "RU",
  "Moldova": "MD", "Bolivia": "BO", "Venezuela": "VE", "Tanzania": "TZ",
  "Kyrgyzstan": "KG", "China": "CN", "People's Republic of China": "CN",
  "Mainland China": "CN", "Taiwan": "TW", "Republic of China": "TW",
  "United States": "US", "United Kingdom": "GB", "United Arab Emirates": "AE",
  "Netherlands": "NL", "Philippines": "PH", "Maldives": "MV", "Comoros": "KM",
  "Marshall Islands": "MH", "Solomon Islands": "SB", "Cook Islands": "CK", "Georgia (country)": "GE",
};
function nameToIso(raw) {
  if (!raw) return null;
  const n = raw.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").replace(/[’]/g, "'").replace(/^the\s+/i, "").trim();
  return ISO_MAP[n] || ALIAS[n] || ISO_MAP["The " + n] || null;
}

// Groups that appear as a single entry; expanded from fixed, uncontested lists.
const GROUPS = [
  [/european union|\bEU\b/i, "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split(" ")],
  [/gulf cooperation council|\bGCC\b/i, "BH KW OM QA SA AE".split(" ")],
  [/asean|association of southeast asian nations/i, "BN KH ID LA MY MM PH SG TH VN".split(" ")],
];
function groupOf(text) {
  for (const [re, members] of GROUPS) if (re.test(text)) return members;
  return null;
}

// ── which passport kinds ─────────────────────────────────────────────────
// D = diplomatic → variant "diplomatik"; everything else (official, service,
// special, consular, public affairs) → variant "hizmet".
function catsFromText(t) {
  const c = new Set(); t = (t || "").toLowerCase();
  if (/diplomat/.test(t)) c.add("D");
  if (/official|service|special|consular|public affairs|all (categories|non-ordinary)/.test(t)) c.add("S");
  return c;
}
function catsFromLetters(tokens) {
  const c = new Set();
  for (const k of tokens) {
    if (k === "D") c.add("D");
    else if (/^(O|S|Sp|C|PA)$/.test(k)) c.add("S");
  }
  return c;
}

// ── fetching ─────────────────────────────────────────────────────────────
async function fetchPage(title) {
  const file = CACHE && path.join(CACHE, encodeURIComponent(title).replace(/%/g, "_") + ".json");
  if (file && fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8"));
  const url = "https://en.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&redirects=1&prop=text"
    + "&page=" + encodeURIComponent(title);
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      const j = JSON.parse(await r.text());
      let out;
      if (j.error && j.error.code === "missingtitle") out = { missing: true };
      else if (j.error) throw new Error(j.error.code);
      else out = { html: j.parse.text, title: j.parse.title };
      if (file) { fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(file, JSON.stringify(out)); }
      await sleep(DELAY);
      return out;
    } catch (e) { last = e; await sleep(3500 * (attempt + 1)); }
  }
  throw last;
}

// ── sections ─────────────────────────────────────────────────────────────
const HEAD_RE = /non-ordinary|(diplomatic|official|service|special)[a-z, ]*passports?/i;
const HEAD_SKIP = /mission|visas?\s*$|area/i;

// Elements of every heading section that talks about non-ordinary passports.
function sections($) {
  const out = [];
  $("h2,h3,h4").each((i, h) => {
    const text = $(h).text().replace(/\[edit\]/g, "").trim();
    if (!HEAD_RE.test(text) || HEAD_SKIP.test(text)) return;
    const level = Number(h.tagName.slice(1));
    const wrap = $(h).closest(".mw-heading").length ? $(h).closest(".mw-heading") : $(h);
    const nodes = [];
    let el = wrap.next();
    while (el.length) {
      const hh = el.is(".mw-heading") ? el.find("h2,h3,h4").first() : el.is("h2,h3,h4") ? el : null;
      if (hh && hh.length && Number(hh.get(0).tagName.slice(1)) <= level) break;
      nodes.push(el);
      el = el.next();
    }
    out.push({ heading: text, nodes });
  });
  return out;
}

const txt = ($, el) => $(el).text().replace(/\s+/g, " ").trim();

// "1 - 30 days  2 - 14 days  3 - Temporarily suspended" → { "1": {days:30}, "3": {skip:true} }
function legendOf(text) {
  const map = {};
  const re = /(?:^|\s)(\d{1,2})\s*[-–]\s*(\D[^]*?)(?=\s\d{1,2}\s*[-–]\s|$)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const body = m[2];
    if (/suspend|not (available|valid|accepted)|refused|no longer/i.test(body)) map[m[1]] = { skip: true };
    else { const d = /(\d+)\s*days?/i.exec(body); if (d) map[m[1]] = { days: Number(d[1]) }; }
  }
  return map;
}

// A parenthetical after a name that narrows the exemption: we can't show a condition, so we skip the name.
const QUALIFIER = /biometric|only|secured|suspend|temporar|except|limited|tourist|tourism|business|official (?:travel|visit)/i;

// ── destination side: the Schengen Area page ─────────────────────────────
// "Visa policy of Austria" (and every other member state) redirects to one page
// whose "Holders of non-ordinary passports" table lists, per state, the
// nationalities its diplomatic/official holders may bring in without a visa:
//   "Austria: Azerbaijan, Bolivia, …; and only diplomatic passports of Armenia, …"
//   "Belgium, Luxembourg, Netherlands: Bolivia, …"      (several states, one list)
// Left of ";and only diplomatic" = diplomatic AND official/service; right = diplomatic only.
// The first block ("except for:") lists Annex-II nationals who are NOT exempt — it
// only ever removes access, which an overlay can't express, so it is ignored.
function parseSchengen($, unknown) {
  const entries = [];
  $("li").each((i, li) => {
    const $li = $(li);
    const lead = $li.closest("ul").prev().text().replace(/\s+/g, " ");
    if (!/in addition, holders of diplomatic and official passports of the following countries/i.test(lead)) return;
    const t = $li.clone().find("sup").remove().end().text().replace(/\s+/g, " ").trim();
    const colon = t.indexOf(":");
    if (colon < 0) return;
    const states = t.slice(0, colon).split(/,|\band\b/).map((s) => nameToIso(s.trim())).filter(Boolean);
    const parts = t.slice(colon + 1).split(/;?\s*and only diplomatic passports of/i);
    [[parts[0], new Set(["D", "S"])], [parts[1], new Set(["D"])]].forEach(([list, cats]) => {
      if (!list) return;
      list.split(/,|\band\b/).forEach((raw) => {
        const name = raw.trim();
        if (!name || QUALIFIER.test((/\(([^)]*)\)/.exec(name) || [])[1] || "")) return;
        const nat = nameToIso(name.replace(/\([^)]*\)/g, "").trim());
        if (!nat) { if (!/order of malta/i.test(name)) unknown.add(name); return; }
        states.forEach((dest) => entries.push({ nat, dest, cats, status: "vf", days: null }));
      });
    });
  });
  return entries;
}

// ── destination side ─────────────────────────────────────────────────────
// → { entries: [{ nat, cats, status, days }], universal: [{ cats, except, status, days }], unknown: Set }
function parseDestination($, destIso, unknown) {
  const entries = [], universal = [];
  for (const sec of sections($)) {
    const secText = sec.nodes.map((n) => txt($, n)).join(" ");
    const legend = legendOf(secText);
    const starIsVoa = /\*\s*[-–]\s*not visa[- ]exempt[^.]{0,80}visa on arrival/i.test(secText);
    // The lead sentence names the kinds an unmarked entry stands for.
    let defCats = new Set();
    for (const n of sec.nodes) {
      const t = txt($, n);
      if (n.is("p") && /holders of|may enter/i.test(t) && /passport/i.test(t)) { defCats = catsFromText(t.split(/passports? of the following|of the following/i)[0]); break; }
    }
    if (!defCats.size) defCats = catsFromText(sec.heading);

    for (const n of sec.nodes) {
      const isList = n.is("table, ul, ol");
      if (isList) {
        n.find("li").each((i, li) => {
          const $li = $(li);
          if ($li.find("li").length) return;               // outer wrapper, not an entry
          if ($li.closest(".reflist, .references, ol.references").length || /^cite_note/.test($li.attr("id") || "")) return;
          // A nationality entry is a short name (plus footnote letters). Dates, "A: b, c" lists and
          // sentences belong to some other list in the same section — never guess from those.
          const shape = $li.clone().find("sup").remove().end().text().replace(/\s+/g, " ").trim();
          if (!shape || shape.length > 90 || /\d{4}|:/.test(shape)) return;
          const a = $li.find("a").first();
          const title = a.attr("title") || a.text() || $li.text();
          const tokens = [];
          $li.find("sup").each((k, s) => { if ($(s).hasClass("reference")) return; tokens.push(...$(s).text().trim().split(/[\s,]+/).filter(Boolean)); });
          let cats = catsFromLetters(tokens);
          if (!cats.size) cats = new Set(defCats);
          if (!cats.size) return;
          let status = "vf", days = null;
          if (tokens.includes("*")) { if (!starIsVoa) return; status = "voa"; }
          let skip = false;
          for (const k of tokens) { const l = legend[k]; if (l && l.skip) skip = true; if (l && l.days) days = l.days; }
          if (skip) return;
          const liText = $li.text();
          const grp = groupOf(title) || groupOf(liText.split("(")[0]);
          const exc = new Set();
          const em = /\(\s*except\s+([^)]*)\)/i.exec(liText);
          if (em) em[1].split(/,|;|\band\b/).forEach((s) => { const c = nameToIso(s.trim()); if (c) exc.add(c); });
          if (grp) { grp.forEach((c) => { if (!exc.has(c)) entries.push({ nat: c, cats, status, days }); }); return; }
          const nat = nameToIso(title);
          if (!nat) { unknown.add(title); return; }
          entries.push({ nat, cats, status, days });
        });
        continue;
      }
      if (!n.is("p")) continue;
      const t = txt($, n);
      if (!/holders of/i.test(t) || !/passport/i.test(t) || /^[A-Z]\s*[-–]/.test(t)) continue;
      const lead = t.split(/passports?\s+(?:of|issued by)\b/i)[0];
      const cats = catsFromText(lead);
      if (!cats.size) continue;
      const isUniversal = /passports?\s+of\s+any\s+(other\s+)?(country|nation|state)/i.test(t);
      let seenOf = false, paren = 0, inExcept = false;
      const inc = [], exc = new Set();
      const days = {};
      n.contents().each((k, node) => {
        if (node.type === "text") {
          const s = node.data;
          if (/passports?\s+(of|issued by)\b/i.test(s)) seenOf = true;
          if (/\(\s*except\b/i.test(s) || (paren > 0 && /\bexcept\b/i.test(s))) inExcept = true;
          for (const ch of s) { if (ch === "(") paren++; else if (ch === ")") { paren = Math.max(0, paren - 1); if (paren === 0) inExcept = false; } }
          return;
        }
        if (node.tagName !== "a") return;
        const title = $(node).attr("title") || $(node).text();
        if (/^cite_note|#cite/.test($(node).attr("href") || "")) return;
        const codes = groupOf(title) || (nameToIso(title) ? [nameToIso(title)] : null);
        if (!codes) { if (seenOf && /^[A-Z]/.test(title) && !/passport|visa|diplom/i.test(title)) unknown.add(title); return; }
        if (inExcept) { codes.forEach((c) => exc.add(c)); return; }
        if (!seenOf && !isUniversal) return;
        const next = node.next && node.next.type === "text" ? node.next.data : "";
        // "(biometric only)", "(tourism only)" … are conditions we can't represent: leave the entry out.
        if (QUALIFIER.test((/^\s*\(([^)]*)\)/.exec(next) || [])[1] || "")) return;
        const dm = /^\s*\(\s*(\d+)\s*days?/i.exec(next);
        codes.forEach((c) => { inc.push(c); if (dm) days[c] = Number(dm[1]); });
      });
      if (isUniversal) universal.push({ cats, except: exc, status: "vf", days: null });
      else inc.forEach((c) => { if (!exc.has(c)) entries.push({ nat: c, cats, status: "vf", days: days[c] || null }); });
    }
  }
  return { entries, universal };
}

// ── passport side ────────────────────────────────────────────────────────
// Split at top-level commas/semicolons only: "(diplomatic, official or service passports)"
// must stay in one piece.
function splitTop(text) {
  const out = []; let depth = 0, cur = "";
  for (const ch of text) {
    if (ch === "(") depth++; else if (ch === ")") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === ";") && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out;
}

// "Azerbaijan (diplomatic or service passports), Egypt (diplomatic passports), …"
// works on plain text, so linked and unlinked names read the same way.
function parentheticals(text, unknown) {
  const out = [];
  for (const seg of splitTop(text.replace(/\[[^\]]*\]/g, ""))) {
    const m = /^(.*?)\s*\(([^()]*passports?[^()]*)\)\s*(?:\([^()]*\))?\s*$/i.exec(seg.trim());
    if (!m) continue;
    let name = m[1].replace(/^.*?(?:\s[-–—]\s|:\s)/, "").replace(/^(?:and|the)\s+/i, "").trim();
    const cats = catsFromText(m[2]);
    if (!name || !cats.size || QUALIFIER.test(m[2].replace(/passports?/gi, ""))) continue;
    const dest = nameToIso(name);
    if (dest) out.push({ dest, cats, status: "vf", days: null });
    else if (name.length < 40 && /^[A-Z]/.test(name)) unknown.add(name);
  }
  return out;
}

// Some passport pages (China, Russia, Indonesia …) have one consolidated list under a
// sentence like "Holders of Russian diplomatic passports may enter the following
// countries without a visa". Strict anchor: the list is only read after that sentence
// and only when it is plausibly a full list (>= MIN_LIST countries), so an unrelated
// table can never be taken for it.
const ANCHOR = /(holders of [^.\n]{0,80}(diplomatic|service|official)[^.\n]{0,90}passports?|(diplomatic|service|official)[ ,/a-z]{0,40}passport holders)[^.\n]{0,90}(without a visa|visa[- ]free|may enter|do not require|have visa)/i;
const MIN_LIST = 25;
function parseAnchorList($) {
  let start = null, m = null;
  $("p, li, dd").each((i, el) => { if (start) return; const t = $(el).text().replace(/\s+/g, " "); const x = ANCHOR.exec(t); if (x && t.length < 400) { start = $(el); m = x; } });
  if (!start) return [];
  const cats = catsFromText(m[0]);
  if (!cats.size) return [];
  const dests = new Set();
  let el = start, chars = 0;
  while (el.length && chars < 6000) {
    if (el.is(".mw-heading, h2, h3, h4")) break;
    el.find("a[title]").each((i, a) => { const c = nameToIso($(a).attr("title")); if (c) dests.add(c); });
    chars += el.text().length;
    el = el.next();
    if (!el.length && start.parent().length && start.parent().is("li, dd, ul, dl")) { el = start.parent().next(); start = start.parent(); }
  }
  return dests.size >= MIN_LIST ? [...dests].map((dest) => ({ dest, cats, status: "vf", days: null })) : [];
}

// → [{ dest, cats, status, days }]
function parseSource($, natIso, unknown) {
  const out = parseAnchorList($);
  for (const sec of sections($)) {
    if (/turkish special/i.test(sec.heading)) continue;      // hand-curated (TR)
    const leadCats = (() => {
      for (const n of sec.nodes) { const t = txt($, n); if (n.is("p") && /passport/i.test(t)) { const c = catsFromText(t); if (c.size) return c; } }
      return catsFromText(sec.heading);
    })();
    const headCats = catsFromText(sec.heading);
    for (const n of sec.nodes) {
      // (a) prose and lists: "Country (diplomatic or service passports)"; and the universal
      //     "Holders of diplomatic or service passports of any country have visa-free access to A, B and C".
      if (n.is("p, ul, ol")) {
        const texts = n.is("p") ? [txt($, n)] : n.find("li").map((i, li) => ($(li).find("li").length ? null : txt($, li))).get().filter(Boolean);
        for (const t of texts) {
          parentheticals(t, unknown).forEach((x) => out.push(x));
          const um = /passports?\s+of\s+any\s+(?:other\s+)?(?:country|nation|state)[^.]*?\b(?:access to|enter)\s+(.*?)(?:\.|$)/i.exec(t);
          if (um) {
            const cats = catsFromText(t.slice(0, um.index + 12));
            if (cats.size) um[1].split(/,|\band\b/).forEach((nm) => { const dest = nameToIso(nm.replace(/\([^)]*\)/g, "").trim()); if (dest) out.push({ dest, cats, status: "vf", days: null }); });
          }
        }
      }
      // (b) tables
      if (n.is("table")) {
        n.find("tr").each((i, tr) => {
          const cells = $(tr).children("td,th");
          if (cells.length < 2) return;
          const first = txt($, cells.get(0)), second = $(cells.get(1));
          // "Type of passport | Visa-free access": first cell = kinds, second = comma list of names
          if (/passport/i.test(first) && first.length < 90 && !$(cells.get(0)).find("a[title]").length) {
            const cats = catsFromText(first);
            if (!cats.size) return;
            const names = new Set();
            second.text().split(/[,;]|\band\b/).forEach((s) => { const c = nameToIso(s.replace(/\(.*?\)/g, "").replace(/\[[^\]]*\]/g, "").trim()); if (c) names.add(c); });
            names.forEach((dest) => out.push({ dest, cats, status: "vf", days: null }));
            return;
          }
          // "Country | allowed stay …" under a heading that names the kinds
          const a = $(cells.get(0)).find("a").first();
          const dest = nameToIso(a.attr("title") || a.text() || first);
          if (!dest) return;
          const cats = headCats.size ? headCats : leadCats;
          if (!cats.size) return;
          const rowText = txt($, tr);
          const dm = /(\d+)\s*days?/i.exec(rowText);
          if (/visa|refus|not|no entry/i.test(rowText) && !/no visa|not required|visa[- ]free|without/i.test(rowText) && !dm) return;
          out.push({ dest, cats, status: "vf", days: dm ? Number(dm[1]) : null });
        });
      }
    }
  }
  return out;
}

// ── main ─────────────────────────────────────────────────────────────────
function loadCountries() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "data", "countries.js"), "utf-8"), ctx);
  return ctx.window.COUNTRIES;
}
function readPrevious() {
  try {
    const w = {}; new Function("window", fs.readFileSync(OUT_PATH, "utf-8"))(w);
    return w.PASSPORT_VARIANTS_DATA || {};
  } catch (e) { return {}; }
}

async function main() {
  const { PASSPORT_TARGETS } = require("./scraper.js");
  const countries = loadCountries();
  const natSlug = {};                       // iso → wikipedia slug of "Visa requirements for <slug>"
  PASSPORT_TARGETS.forEach(([name, slug]) => { const iso = ISO_MAP[name]; if (iso) natSlug[iso] = slug; });
  const nations = Object.keys(natSlug);

  const agg = {};                           // nat → { D: {dest→{status,days}}, S: {…} }
  const prov = [];                          // dev only: where each entry came from
  const add = (nat, dest, cats, status, days, why) => {
    if (!nat || !dest || nat === dest) return;
    if (process.env.VARIANTS_DEBUG) prov.push([nat, dest, [...cats].join(""), status, days, why]);
    const a = agg[nat] || (agg[nat] = { D: {}, S: {} });
    cats.forEach((c) => {
      const cur = a[c][dest];
      if (!cur || (cur.status === "voa" && status === "vf")) a[c][dest] = { status, days: days || (cur && cur.days) || null };
      else if (!cur.days && days) cur.days = days;
    });
  };
  const unknown = new Set();
  const stats = { destPages: 0, destWithSection: 0, srcPages: 0, srcWithSection: 0, failed: 0, requested: 0 };
  const universalRules = [];
  let schengenDone = false;

  // 1. destination pages
  for (const c of countries) {
    if (c.continent === "AN") continue;
    const tries = [`Visa policy of ${c.name}`, `Visa policy of the ${c.name}`];
    if (c.iso2 === "CN") tries.unshift("Visa policy of mainland China");
    let got = null, tried = null;
    for (const title of tries) {
      stats.requested++;
      try { const p = await fetchPage(title); if (!p.missing) { got = p; tried = title; break; } } catch (e) { stats.failed++; console.warn(`  ! ${title}: ${e.message}`); break; }
    }
    if (!got) continue;
    stats.destPages++;
    // Member states of a bloc redirect to the bloc's page. The Schengen page is read once,
    // with its own parser; any other redirect would credit one country's rules to another.
    const norm = (t) => String(t).replace(/^Visa policy of (the )?/i, "").toLowerCase();
    if (/schengen area$/i.test(got.title)) {
      if (!schengenDone) {
        schengenDone = true;
        const es = parseSchengen(cheerio.load(got.html), unknown);
        if (es.length) stats.destWithSection++;
        es.forEach((e) => add(e.nat, e.dest, e.cats, e.status, e.days, "schengen"));
      }
      continue;
    }
    if (norm(got.title) !== norm(tried)) { console.warn(`  ~ ${tried} → ${got.title}: redirect, skipped`); continue; }
    const r = parseDestination(cheerio.load(got.html), c.iso2, unknown);
    if (r.entries.length || r.universal.length) stats.destWithSection++;
    r.entries.forEach((e) => add(e.nat, c.iso2, e.cats, e.status, e.days, "dest:" + tried));
    r.universal.forEach((u) => universalRules.push({ dest: c.iso2, ...u }));
  }
  // "diplomatic passports of any country may enter" → every nationality except the named ones
  universalRules.forEach((u) => nations.forEach((nat) => { if (!u.except.has(nat)) add(nat, u.dest, u.cats, u.status, u.days, "universal:" + u.dest); }));

  // 2. passport pages
  for (const nat of nations) {
    const slug = natSlug[nat];
    const title = slug.includes("citizens") ? `Visa requirements for ${slug.replace(/_/g, " ")}` : `Visa requirements for ${slug.replace(/_/g, " ")} citizens`;
    stats.requested++;
    let p;
    try { p = await fetchPage(title); } catch (e) { stats.failed++; console.warn(`  ! ${title}: ${e.message}`); continue; }
    if (p.missing) continue;
    stats.srcPages++;
    const items = parseSource(cheerio.load(p.html), nat, unknown);
    if (items.length) stats.srcWithSection++;
    items.forEach((e) => add(nat, e.dest, e.cats, e.status, e.days, "passport-page:" + nat));
  }

  if (stats.failed / Math.max(1, stats.requested) > MAX_FAIL_RATIO) {
    console.error(`Too many failed fetches (${stats.failed}/${stats.requested}) — keeping the previous data file.`);
    process.exit(1);
  }

  // 3. write
  const valid = new Set(countries.map((c) => c.iso2));
  const out = { lastUpdated: new Date().toISOString().slice(0, 10) };
  let variants = 0;
  const pack = (m) => {
    const vf = [], voa = [];
    Object.keys(m).filter((d) => valid.has(d)).sort().forEach((d) => {
      const e = m[d]; const item = e.days ? [d, e.days] : d;
      (e.status === "voa" ? voa : vf).push(item);
    });
    return { vf, voa };
  };
  const noPassport = [];
  Object.keys(agg).sort().forEach((nat) => {
    // A nationality named by a destination page but not in the app's passport list has no map to overlay on.
    if (!natSlug[nat]) { noPassport.push(nat); return; }
    const src = "https://en.wikipedia.org/wiki/" + (natSlug[nat].includes("citizens") ? "Visa_requirements_for_" + natSlug[nat] : `Visa_requirements_for_${natSlug[nat]}_citizens`);
    const entry = {};
    if (Object.keys(agg[nat].D).length) { entry.diplomatik = { ...pack(agg[nat].D), source: src }; variants++; }
    if (Object.keys(agg[nat].S).length) { entry.hizmet = { ...pack(agg[nat].S), source: src }; variants++; }
    if (Object.keys(entry).length) out[nat] = entry;
  });

  console.log(`\nDestination pages ${stats.destPages} (${stats.destWithSection} with a non-ordinary section), passport pages ${stats.srcPages} (${stats.srcWithSection} with one).`);
  console.log(`${Object.keys(out).length - 1} passports, ${variants} variants; ${universalRules.length} universal rules; ${stats.failed} failed fetches.`);
  if (noPassport.length) console.log(`Skipped (no passport page): ${noPassport.join(" ")}`);
  if (unknown.size) console.log(`Unmapped names (${unknown.size}): ${[...unknown].slice(0, 60).join(" | ")}`);
  if (process.env.VARIANTS_DEBUG) fs.writeFileSync(process.env.VARIANTS_DEBUG, JSON.stringify(prov));
  if (DRY_RUN) { console.log("(dry-run, not writing)"); return out; }

  // One list per line: 200 passports × 2 variants stays readable in a diff.
  const lines = Object.keys(out).map((k) => {
    if (k === "lastUpdated") return ` "lastUpdated": ${JSON.stringify(out[k])}`;
    const v = out[k];
    const parts = Object.keys(v).map((vk) => `  ${JSON.stringify(vk)}: ${JSON.stringify(v[vk])}`);
    return ` ${JSON.stringify(k)}: {\n${parts.join(",\n")}\n }`;
  });
  const body = [
    "// AUTO-GENERATED by backend/fetch-variants.js (daily cron) — do not edit by hand.",
    "// Diplomatic (diplomatik) and official/service/special (hizmet) passport access,",
    "// read from the 'Non-ordinary passports' sections of Wikipedia's visa-policy and",
    "// visa-requirements pages (destination and passport side). Only what a page names",
    "// explicitly is emitted. passport-variants.js merges these under hand-curated entries.",
    "",
    "window.PASSPORT_VARIANTS_DATA = {\n" + lines.join(",\n") + "\n};",
    "",
  ].join("\n");
  fs.writeFileSync(OUT_PATH, body);
  console.log(`Wrote ${OUT_PATH}`);
  if (process.env.VARIANTS_DEBUG) fs.writeFileSync(process.env.VARIANTS_DEBUG, JSON.stringify(prov));
  return out;
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { main, parseDestination, parseSource, parseSchengen, nameToIso, catsFromText, legendOf };
