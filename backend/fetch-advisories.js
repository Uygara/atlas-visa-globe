// fetch-advisories.js — government travel-safety advisories → data/travel-advisories.js
//
// Data for the /safety-map/ page. Four official, machine-readable sources:
//
//   1. UK FCDO travel advice (Open Government Licence v3)
//      https://www.gov.uk/api/content/foreign-travel-advice/<country>
//      The freshest of the three governments — pages are revised within days of
//      protests, strikes, fires or border incidents. Gives: an alert status, the
//      dated change history (what actually changed, in one line), and the
//      "Areas where FCDO advises against travel" text, which names states,
//      provinces and departments we can put on the map.
//   2. U.S. Department of State travel advisories (public domain)
//      https://cadataapi.state.gov/api/TravelAdvisories
//      Level 1–4 per country, the named risk indicators, and the "Do Not Travel
//      To:" / "Reconsider Travel To:" area lists.
//   3. Government of Canada travel advice (Open Government Licence – Canada)
//      https://data.international.gc.ca/travel-voyage/index-alpha-eng.json
//      advisory-state 0–3 per country + a regional-advisory flag.
//   4. GDACS (EU JRC / UN OCHA) current orange & red disaster alerts —
//      earthquakes, storms, floods, wildfires, volcanoes, drought.
//
// Country levels are mapped onto one 1–4 ladder (1 normal precautions …
// 4 do not travel) and the map paints the STRICTER of the three governments;
// the detail card shows each source with its own date, so a stale advisory can
// never masquerade as fresh. Region names are matched against Natural Earth
// admin-1 units (data/admin1/index.json, built by tools/build-admin1.js);
// anything we cannot place on the map — "within 10km of the border with
// Syria" — is kept as text, never guessed at.
//
// Run:
//   node backend/fetch-advisories.js            (writes the file)
//   node backend/fetch-advisories.js --dry-run  (prints a summary only)
//   node backend/fetch-advisories.js --only=uk  (one source, for debugging)

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const OUT_PATH = path.join(__dirname, "..", "data", "travel-advisories.js");
const ADMIN1_INDEX = path.join(__dirname, "..", "data", "admin1", "index.json");
const UA = "travelnow.info/1.0 (+https://travelnow.info; travel-safety map)";
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY = (process.argv.find(a => a.startsWith("--only=")) || "").split("=")[1] || "";
const MIN_COUNTRIES = 150;      // below this, treat a source as broken
const UK_DELAY_MS = 250;        // polite pacing for ~220 gov.uk requests
const UPDATE_HISTORY = 6;       // dated "what changed" lines kept per country
const EVENT_MAX_AGE_DAYS = 45;

const US_URL = "https://cadataapi.state.gov/api/TravelAdvisories";
const CA_URL = "https://data.international.gc.ca/travel-voyage/index-alpha-eng.json";
const UK_INDEX = "https://www.gov.uk/api/content/foreign-travel-advice";
const TR_URL = "https://www.mfa.gov.tr/sub.tr.mfa?b3026181-6b8f-4fc6-9327-a5113446ce95=";
const GDACS_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;VO;WF;DR&alertlevel=Orange;Red";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);

async function getJson(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
}

// ─── Country names → ISO2 ─────────────────────────────────────────────────
// Each government spells countries its own way (and the State Department's
// `Category` holds FIPS codes, where Germany is GM), so we match on names.
const NAME_ALIASES = {
  "Burma (Myanmar)": "MM", "Burma": "MM", "Cabo Verde": "CV", "Cape Verde": "CV",
  "Cote d'Ivoire": "CI", "Côte d'Ivoire": "CI", "Czechia": "CZ", "Czech Republic": "CZ",
  "Democratic Republic of the Congo": "CD", "Republic of the Congo": "CG",
  "Congo, Democratic Republic of the": "CD", "Congo, Republic of the": "CG",
  "Congo (Democratic Republic)": "CD", "Congo": "CG",
  "Eswatini": "SZ", "The Bahamas": "BS", "Bahamas": "BS", "The Gambia": "GM",
  "Gambia": "GM", "Holy See": "VA", "Vatican City": "VA", "Kyrgyz Republic": "KG",
  "Laos": "LA", "Micronesia": "FM", "North Korea (Democratic People's Republic of Korea)": "KP",
  "North Korea": "KP", "South Korea": "KR", "Republic of Korea": "KR",
  "Russia": "RU", "Syria": "SY", "Taiwan": "TW", "Timor-Leste": "TL", "East Timor": "TL",
  "Turkey": "TR", "Türkiye": "TR", "Turkiye": "TR", "United Kingdom": "GB",
  "Vietnam": "VN", "West Bank and Gaza": "PS", "Israel, the West Bank and Gaza": "IL",
  "The Occupied Palestinian Territories": "PS", "Palestinian Territories": "PS",
  "Moldova": "MD", "Macau": "MO", "Macao": "MO", "Hong Kong": "HK",
  "Mainland China": "CN", "China": "CN", "Sao Tome and Principe": "ST",
  "São Tomé and Príncipe": "ST", "Saint Vincent and the Grenadines": "VC",
  "St Vincent and the Grenadines": "VC", "Saint Kitts and Nevis": "KN",
  "St Kitts and Nevis": "KN", "Saint Lucia": "LC", "St Lucia": "LC",
  "North Macedonia": "MK", "Bosnia and Herzegovina": "BA", "Brunei": "BN",
  "Iran": "IR", "Tanzania": "TZ", "Bolivia": "BO", "Venezuela": "VE",
  "Kosovo": "XK", "Curacao": "CW", "Curaçao": "CW", "Sint Maarten": "SX",
  "Cote d Ivoire": "CI", "The Kyrgyz Republic": "KG", "Kingdom of Denmark": "DK",
  "West Bank": "PS", "Gaza": "PS", "The Occupied Palestinian Territories (OPTs)": "PS",
};
// Combined pages ("Mainland China, Hong Kong & Macau - See Summaries") carry one
// entry per place; tell them apart by their FIPS code.
const US_FIPS_FALLBACK = { CH: "CN", HK: "HK", MC: "MO" };

function loadNameMap() {
  const names = new Map(Object.entries(NAME_ALIASES).map(([k, v]) => [k.toLowerCase(), v]));
  const w = {};
  new Function("window", fs.readFileSync(path.join(__dirname, "..", "data", "countries.js"), "utf8"))(w);
  for (const c of w.COUNTRIES || []) {
    const plain = c.name.replace(/\s*\(.*\)\s*$/, "").toLowerCase();
    if (!names.has(plain)) names.set(plain, c.iso2);
    if (!names.has(c.name.toLowerCase())) names.set(c.name.toLowerCase(), c.iso2);
  }
  try {
    for (const [name, iso] of Object.entries(require("./iso-map.json"))) {
      if (!names.has(name.toLowerCase())) names.set(name.toLowerCase(), iso);
    }
  } catch (e) {}
  return names;
}

// ─── Text helpers ─────────────────────────────────────────────────────────
const decodeEntities = (s) => String(s)
  .replace(/&#(\d+);/g, (_, n) => (n === "8239" || n === "160") ? " " : String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&(quot|ldquo|rdquo);/g, '"').replace(/&(apos|rsquo|lsquo);/g, "'")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const stripTags = (html) => decodeEntities(String(html || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
// Keep list items and headings as separate lines so directives stay attached
// to the areas they introduce.
const htmlToLines = (html) => decodeEntities(String(html || "")
  .replace(/<\s*(li|p|h[1-6]|br|tr|div)[^>]*>/gi, "\n")
  .replace(/<\/\s*(li|p|h[1-6]|tr|div)\s*>/gi, "\n")
  .replace(/<[^>]+>/g, " "))
  .split("\n").map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
const deburr = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[ıİ]/g, "i").replace(/[ğĞ]/g, "g").replace(/[şŞ]/g, "s").replace(/[çÇ]/g, "c")
  .replace(/[öÖ]/g, "o").replace(/[üÜ]/g, "u").toLowerCase();
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─── Region matching ──────────────────────────────────────────────────────
// Names too generic to match safely on their own.
const REGION_STOPWORDS = new Set([
  "north", "south", "east", "west", "central", "northern", "southern", "eastern",
  "western", "centre", "center", "capital", "coast", "district", "region", "island",
  "islands", "city", "province", "state", "department", "territory", "border", "delta",
]);
const REGION_NOISE = /^(before you travel|travel insurance|about fcdo|get travel advice|support from|find out more|areas where|your travel insurance|if you|this advice|read the|see|for more|the fcdo|follow)/i;

const WHOLE_COUNTRY = /\b(for any reason|the whole country|the entire country|all of the country)\b/i;

function buildRegionMatcher(units) {
  const entries = [];
  for (const u of units || []) {
    for (const raw of [u.nm, u.alt]) {
      if (!raw) continue;
      const clean = String(raw).replace(/\s*\(.*\)\s*$/, "").trim();
      const key = deburr(clean);
      if (!key || key.length < 4 || REGION_STOPWORDS.has(key)) continue;
      entries.push({ id: u.id, key, re: new RegExp(`(^|[^a-z0-9])${escapeRe(key)}($|[^a-z0-9])`) });
    }
  }
  // Longest names first so "South Sudan"-style overlaps resolve correctly.
  entries.sort((a, b) => b.key.length - a.key.length);
  return (text) => {
    let rest = " " + deburr(text) + " ";
    const ids = [];
    for (const e of entries) {
      if (ids.includes(e.id)) continue;
      if (e.re.test(rest)) {
        ids.push(e.id);
        rest = rest.replace(new RegExp(escapeRe(e.key), "g"), " ");
      }
    }
    return ids;
  };
}

// Walks advisory text, following "advises against all travel to …" style
// directives, and returns { level, ids, text } for each area block.
function parseRegions(lines, directives, matchRegions) {
  const out = [];
  let mode = 0;
  for (const line of lines) {
    if (REGION_NOISE.test(line)) { mode = 0; continue; }
    let hit = null;
    for (const d of directives) {
      const m = line.match(d.re);
      if (m && (hit == null || m.index < hit.index)) hit = { index: m.index, level: d.level, m };
    }
    if (hit) {
      const after = line.slice(hit.index + hit.m[0].length).trim();
      // "Do not travel to Burma for any reason due to …" covers the whole country: it
      // starts no list of areas, and the prose that follows is not one either.
      if (WHOLE_COUNTRY.test(after)) { mode = 0; continue; }
      mode = hit.level;
      // "…to: " introduces a list; anything else names the area inline.
      if (after && !/^[:：]?$/.test(after)) addBlock(out, mode, after, matchRegions);
      continue;
    }
    if (mode && line.length > 2) addBlock(out, mode, line, matchRegions);
  }
  return out;
}

function addBlock(out, level, text, matchRegions) {
  const clean = text.replace(/^[:\-–•\s]+/, "").trim();
  if (!clean || clean.length < 3) return;
  const ids = matchRegions(clean);
  const last = out[out.length - 1];
  // Merge consecutive unmatched sentences of the same level into one note.
  if (!ids.length && last && last.level === level && !last.ids.length && last.text.length < 220) {
    last.text = (last.text + " " + clean).slice(0, 300);
    return;
  }
  // Unmatched notes keep their first sentence: "within 10km of the border … terrorism. If you are in Syria, …"
  const shown = ids.length ? clean : (clean.match(/^.{20,}?[.!?](?=\s+[A-Z]|$)/) || [clean])[0];
  out.push({ level, ids, text: shown.slice(0, 300) });
}

function mergeRegions(entries) {
  const byId = new Map();
  const notes = [];
  for (const e of entries) {
    if (!e.ids.length) { notes.push({ level: e.level, text: e.text, src: e.src }); continue; }
    for (const id of e.ids) {
      const prev = byId.get(id);
      if (!prev || prev.level < e.level) byId.set(id, { id, level: e.level, text: e.text, src: e.src });
    }
  }
  return { regions: [...byId.values()].sort((a, b) => b.level - a.level || a.id.localeCompare(b.id)), notes: notes.slice(0, 6) };
}

// ─── UK FCDO ──────────────────────────────────────────────────────────────
const UK_LEVEL = {
  avoid_all_travel_to_whole_country: 4,
  avoid_all_but_essential_travel_to_whole_country: 3,
  avoid_all_travel_to_parts: 2,
  avoid_all_but_essential_travel_to_parts: 2,
};
const UK_DIRECTIVES = [
  { re: /advises against all travel to/i, level: 4 },
  { re: /advises against all but essential travel to/i, level: 3 },
];

async function fetchUK(names, admin1) {
  const index = await getJson(UK_INDEX);
  const children = (index.links && index.links.children) || [];
  const out = {};
  const unmatched = [];
  for (const child of children) {
    const country = (child.details && child.details.country) || {};
    const name = country.name || child.title || "";
    const iso = names.get(String(name).toLowerCase());
    if (!iso) { unmatched.push(name); continue; }
    let doc;
    try {
      doc = await getJson("https://www.gov.uk" + (child.api_path || "").replace("/api/content", "/api/content"));
    } catch (e) {
      console.warn(`  [uk] ${name}: ${e.message}`);
      await sleep(UK_DELAY_MS);
      continue;
    }
    const d = doc.details || {};
    const alerts = d.alert_status || [];
    const level = alerts.reduce((mx, a) => Math.max(mx, UK_LEVEL[a] || 1), 1);
    const warnings = (d.parts || []).find(p => p.slug === "warnings-and-insurance");
    const match = buildRegionMatcher(admin1[iso]);
    const regions = warnings
      ? parseRegions(htmlToLines(warnings.body), UK_DIRECTIVES, match).map(r => ({ ...r, src: "uk" }))
      : [];
    out[iso] = {
      level,
      alerts,
      updated: String(doc.public_updated_at || "").slice(0, 10),
      change: stripTags(d.change_description || "").slice(0, 200),
      updates: (d.change_history || []).slice(0, UPDATE_HISTORY).map(h => ({
        date: String(h.public_timestamp || "").slice(0, 10),
        note: stripTags(h.note || "").slice(0, 180),
      })).filter(u => u.date && u.note),
      url: "https://www.gov.uk" + (child.base_path || ""),
      _regions: regions,
    };
    await sleep(UK_DELAY_MS);
  }
  return { countries: out, unmatched };
}

// ─── U.S. State Department ─────────────────────────────────────────────────
const US_LEVEL_RE = /Level\s+([1-4])/i;
const US_RISKS = [
  ["crime", /\bcrime\b/i],
  ["terrorism", /\bterrorism\b/i],
  ["unrest", /\b(civil )?unrest\b/i],
  ["armed_conflict", /\barmed conflict\b|\bwar\b/i],
  ["kidnapping", /\bkidnapping|hostage/i],
  ["wrongful_detention", /\bwrongful detention|arbitrar(y|ily) (detain|detention|enforcement)/i],
  ["health", /\bhealth\b/i],
  ["natural_disaster", /\bnatural disaster/i],
  ["landmines", /\blandmine|unexploded ordnance/i],
];
const LEAD = String.raw`^(?:advisory summary:?\s*)?`;
const US_LEVEL_VERB = {
  1: new RegExp(LEAD + "exercise normal precautions\\b", "i"),
  2: new RegExp(LEAD + "exercise increased caution\\b", "i"),
  3: new RegExp(LEAD + "reconsider travel\\b", "i"),
  4: new RegExp(LEAD + "do not travel\\b", "i"),
};
const AREA_LEVEL_VERB = /\b(exercise increased caution|reconsider travel|do not travel)\s+(to|in|near|when)\b/i;
const US_DIRECTIVES = [
  { re: /do not travel to:?/i, level: 4 },
  { re: /reconsider travel to:?/i, level: 3 },
];

async function fetchUS(names, admin1) {
  const list = await getJson(US_URL);
  const out = {};
  const unmatched = [];
  for (const it of list) {
    const title = String(it.Title || "");
    const m = title.match(US_LEVEL_RE);
    if (!m) continue;
    const name = title.split(/\s+-\s+Level/i)[0].replace(/\s+Travel Advisory$/i, "").trim();
    const iso = names.get(name.toLowerCase())
      || (/See Summaries/i.test(name) && US_FIPS_FALLBACK[(it.Category || [])[0]]);
    if (!iso) { unmatched.push(name); continue; }
    const level = Number(m[1]);
    const text = stripTags(it.Summary);
    // Summaries open with a change note, then the country-wide sentence:
    // "Exercise increased caution in Mexico due to terrorism, crime, and
    // kidnapping." Only that sentence's "due to" clause is country-wide; later
    // level sentences ("Do Not Travel To: Cabo Delgado …") are about areas.
    const sentences = text.split(/(?<=\.)\s+/);
    const mainIdx = sentences.findIndex(x => US_LEVEL_VERB[level].test(x));
    const main = mainIdx >= 0 ? sentences[mainIdx] : "";
    const due = (main.match(/\bdue to (.+)$/i) || [])[1] || "";
    const risks = US_RISKS.filter(([, re]) => re.test(due)).map(([k]) => k);
    const areaSentences = mainIdx < 0 ? 0
      : sentences.slice(mainIdx + 1, mainIdx + 12).filter(x => AREA_LEVEL_VERB.test(x)).length;
    const match = buildRegionMatcher(admin1[iso]);
    const regions = parseRegions(htmlToLines(it.Summary), US_DIRECTIVES, match).map(r => ({ ...r, src: "us" }));
    const entry = {
      level,
      risks,
      regional: /\bsome areas have (increased|greater|higher) risk/i.test(text) || areaSentences > 0,
      updated: String(it.Updated || it.Published || "").slice(0, 10),
      url: it.Link,
      _regions: regions,
    };
    if (!out[iso] || out[iso].level < entry.level) out[iso] = entry;
  }
  return { countries: out, unmatched };
}

// ─── Government of Canada ─────────────────────────────────────────────────
async function fetchCA() {
  const j = await getJson(CA_URL);
  const out = {};
  for (const [iso, d] of Object.entries(j.data || {})) {
    const state = Number(d["advisory-state"]);
    if (!(state >= 0 && state <= 3)) continue;
    const slug = d.eng && d.eng["url-slug"];
    out[iso.toUpperCase()] = {
      level: state + 1,
      text: d.eng ? d.eng["advisory-text"] : "",
      change: d.eng ? String(d.eng["recent-updates"] || "").slice(0, 200) : "",
      regional: Number(d["has-regional-advisory"]) === 1,
      updated: String((d["date-published"] || {}).date || "").slice(0, 10),
      url: slug ? `https://travel.gc.ca/destinations/${slug}` : "https://travel.gc.ca/travelling/advisories",
    };
  }
  return { countries: out };
}

// The JSON above only says a country HAS regional advisories. Each country page
// lists them as headings — "<Area> - Avoid all travel" / "<Area> - Avoid
// non-essential travel", or "Regional Advisory - …" followed by a list of states:
//   <h3>Manipur - Avoid non-essential travel</h3><p>Avoid non-essential travel to Manipur …</p>
//   <h3>Regional advisory - Avoid all travel</h3><p>Avoid all travel to:</p><ul><li>the province of Balochistan</li>…
// Canada's ladder: "Avoid non-essential travel" = 3, "Avoid all travel" = 4.
// Areas defined by distance ("within 10 km of the border with Pakistan") name whole
// states only as where the strip runs, so they stay text and are never painted.
const CA_AREA_LEVEL = { "avoid all travel": 4, "avoid non-essential travel": 3 };
const CA_PARTIAL = /within\s+\d+\s*(?:km|kilomet|mile)|\bnear the border|\bborder(?:s| areas?)?\s+with\b|\balong the border/i;
const CA_HEAD = /^(.*?)\s*[-–]\s*(avoid all travel|avoid non-essential travel)\s*$/i;
const CA_CUT = /\b(excluding|excludes|except)\b/i;   // "Chiapas, excluding: the city of …" names Chiapas only

async function fetchCARegions(caCountries, admin1) {
  const out = {};
  let pages = 0;
  for (const [iso, c] of Object.entries(caCountries)) {
    if (!c.regional || !c.url || !/^https:\/\/travel\.gc\.ca\//.test(c.url)) continue;
    let html;
    try {
      const r = await fetch(c.url, { headers: { "User-Agent": UA, Accept: "text/html" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      html = await r.text();
    } catch (e) { console.warn("  [ca] " + iso + ": " + e.message); await sleep(UK_DELAY_MS); continue; }
    pages++;
    const $ = cheerio.load(html);
    const match = buildRegionMatcher(admin1[iso]);
    const blocks = [];
    $("h3").each((i, h) => {
      const m = CA_HEAD.exec($(h).text().replace(/\s+/g, " ").trim());
      if (!m) return;
      const level = CA_AREA_LEVEL[m[2].toLowerCase()];
      const lines = [];
      let el = $(h).next();
      while (el.length && !el.is("h2, h3")) {
        if (el.is("p")) lines.push(el.text().replace(/\s+/g, " ").trim());
        else el.find("li").each((k, li) => { if (!$(li).parents("li").length) lines.push($(li).text().replace(/\s+/g, " ").trim()); });
        el = el.next();
      }
      const whole = [m[1], ...lines].join(" ");
      const partial = CA_PARTIAL.test(whole);
      const named = /^regional advis/i.test(m[1]) ? [] : [m[1]];
      for (const line of lines) {
        if (!line || /^(this advisory (excludes|includes)|if you|for more|see )/i.test(line)) continue;
        // A lead sentence may name the area inline: "Avoid non-essential travel to Manipur due to …"
        const lead = /^avoid (?:all|non-essential) travel to\s+(?!the following|within|areas)(.+?)(?:\s+due to\b|\s+because\b|[:.]|$)/i.exec(line);
        named.push(lead ? lead[1] : (/^avoid (?:all|non-essential) travel/i.test(line) ? "" : line));
      }
      for (const t of named) {
        const head = String(t).split(CA_CUT)[0].trim();
        if (!head) continue;
        // distance-defined blocks stay words: an empty matcher keeps them as text notes
        addBlock(blocks, level, head, partial ? () => [] : match);
      }
    });
    if (blocks.length) out[iso] = blocks.map(b => ({ ...b, src: "ca" }));
    await sleep(UK_DELAY_MS * 3);
  }
  return { regions: out, pages };
}

// ─── Türkiye Foreign Ministry (T.C. Dışişleri Bakanlığı) ──────────────────
// No levels: the ministry publishes dated "Güvenlik ve Seyahat Duyurusu" / "Seyahat
// Uyarısı" pages per country ("Myanmar’a Yönelik Güvenlik ve Seyahat Duyurusu, 1 Kasım
// 2025"). We list the newest two per country as announcements — with their date, so
// an old one reads as old — and never fold them into the 1–4 level.
const TR_MONTHS = { ocak: 1, subat: 2, mart: 3, nisan: 4, mayis: 5, haziran: 6, temmuz: 7, agustos: 8, eylul: 9, ekim: 10, kasim: 11, aralik: 12 };
const TR_NAME_ALIASES = { "abd": "US", "kirgiz cumhuriyeti": "KG", "ekvator": "EC", "kuzey kibris": "XN" };

function loadTurkishNames() {
  const map = new Map(Object.entries(TR_NAME_ALIASES));
  const win = { addEventListener() {}, dispatchEvent() {} };
  const sandbox = { window: win, document: { documentElement: { getAttribute() { return null; }, setAttribute() {} } }, localStorage: { getItem: () => null }, navigator: { language: "tr" } };
  win.window = win;
  const run = (f) => new Function("window", "document", "localStorage", "navigator", fs.readFileSync(path.join(__dirname, "..", "data", f), "utf8"))(win, sandbox.document, sandbox.localStorage, sandbox.navigator);
  run("countries.js"); run("country-names.js");
  win.ATLAS_LANG = "tr";
  for (const c of win.COUNTRIES || []) { const n = win.countryName(c.iso2); if (n) map.set(deburr(n), c.iso2); }
  return map;
}

async function fetchTR() {
  const r = await fetch(TR_URL, { headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "tr" } });
  if (!r.ok) throw new Error("HTTP " + r.status + " " + TR_URL);
  const $ = cheerio.load(await r.text());
  const tr = loadTurkishNames();
  const out = {};
  let seen = 0;
  $("a").each((i, a) => {
    const text = $(a).text().replace(/\s+/g, " ").trim();
    const href = $(a).attr("href") || "";
    const dm = /,\s*(\d{1,2})\s+(\p{L}+)\s+(\d{4})\s*$/u.exec(text);
    if (!dm || !/(Duyuru|Uyar[ıi])/i.test(text) || !/\.tr\.mfa$/.test(href)) return;
    const month = TR_MONTHS[deburr(dm[2])];
    if (!month) return;
    seen++;
    const date = dm[3] + "-" + String(month).padStart(2, "0") + "-" + String(dm[1]).padStart(2, "0");
    const title = text.slice(0, dm.index).trim();
    // "İsrail’e ve Filistin’e Yönelik …", "Kırgız Cumhuriyeti’ne Yönelik …", "İtalya için …"
    const lead = title.split(/\s+(?:Yönelik|İlişkin|için)\b/i)[0];
    for (const part of lead.split(/\s+ve\s+/)) {
      const iso = tr.get(deburr(part.replace(/[’'][\p{L}]*$/u, "").trim()));
      if (!iso) continue;
      (out[iso] = out[iso] || []).push({ date, title, url: "https://www.mfa.gov.tr" + (href.startsWith("/") ? href : "/" + href) });
    }
  });
  for (const iso of Object.keys(out)) out[iso] = out[iso].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
  return { countries: out, seen };
}

// ─── GDACS current disaster alerts ────────────────────────────────────────
const GDACS_TYPE = { EQ: "earthquake", TC: "storm", FL: "flood", VO: "volcano", WF: "wildfire", DR: "drought" };

async function fetchEvents() {
  const j = await getJson(GDACS_URL);
  const cutoff = Date.now() - EVENT_MAX_AGE_DAYS * 86400_000;
  const byCountry = {};
  for (const f of j.features || []) {
    const p = f.properties || {};
    const type = GDACS_TYPE[p.eventtype];
    if (!type) continue;
    const from = String(p.fromdate || "").slice(0, 10);
    const to = String(p.todate || "").slice(0, 10);
    const when = new Date((to || from) + "T00:00:00Z").getTime();
    if (!when || when < cutoff) continue;
    const url = (p.url && (p.url.report || p.url.details)) || "https://www.gdacs.org/";
    const entry = {
      type,
      level: String(p.alertlevel || "").toLowerCase(),   // orange | red
      name: stripTags(p.eventname || p.name || "").slice(0, 80),
      from, to, url,
    };
    for (const c of p.affectedcountries || []) {
      const iso = String(c.iso2 || "").toUpperCase();
      if (!/^[A-Z]{2}$/.test(iso)) continue;
      (byCountry[iso] = byCountry[iso] || []).push(entry);
    }
  }
  for (const iso of Object.keys(byCountry)) {
    byCountry[iso] = byCountry[iso]
      .sort((a, b) => (b.to || b.from).localeCompare(a.to || a.from))
      .slice(0, 4);
  }
  return byCountry;
}

// ─── Merge + write ────────────────────────────────────────────────────────
function readPrevious() {
  try {
    const w = {};
    new Function("window", fs.readFileSync(OUT_PATH, "utf8"))(w);
    return w.TRAVEL_ADVISORIES || null;
  } catch (e) { return null; }
}
function perSource(prev, key) {
  const out = {};
  for (const [iso, c] of Object.entries((prev && prev.countries) || {})) if (c[key]) out[iso] = c[key];
  return out;
}

(async () => {
  const names = loadNameMap();
  const admin1 = JSON.parse(fs.readFileSync(ADMIN1_INDEX, "utf8"));
  const prev = readPrevious();
  const prevSources = (prev && prev.sources) || {};

  const sources = {
    uk: { name: "UK Foreign, Commonwealth & Development Office", url: "https://www.gov.uk/foreign-travel-advice", licence: "Open Government Licence v3.0", fetched: prevSources.uk && prevSources.uk.fetched },
    us: { name: "U.S. Department of State", url: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html", licence: "Public domain (U.S. Government work)", fetched: prevSources.us && prevSources.us.fetched },
    ca: { name: "Government of Canada", url: "https://travel.gc.ca/travelling/advisories", licence: "Open Government Licence – Canada", fetched: prevSources.ca && prevSources.ca.fetched },
    gdacs: { name: "GDACS (EU JRC / UN OCHA)", url: "https://www.gdacs.org/", licence: "Free reuse with attribution", fetched: prevSources.gdacs && prevSources.gdacs.fetched },
  };

  let uk = perSource(prev, "uk"), us = perSource(prev, "us"), ca = perSource(prev, "ca");
  let regionsPrev = {};
  for (const [iso, c] of Object.entries((prev && prev.countries) || {})) {
    if (c.regions || c.regionNotes) regionsPrev[iso] = { regions: c.regions || [], notes: c.regionNotes || [] };
  }
  const freshRegions = {};
  let events = {};
  for (const [iso, c] of Object.entries((prev && prev.countries) || {})) if (c.events) events[iso] = c.events;

  const want = (k) => !ONLY || ONLY === k;

  if (want("uk")) {
    try {
      console.log("UK FCDO…");
      const res = await fetchUK(names, admin1);
      const n = Object.keys(res.countries).length;
      if (n >= MIN_COUNTRIES) {
        for (const [iso, c] of Object.entries(res.countries)) {
          freshRegions[iso] = (freshRegions[iso] || []).concat(c._regions || []);
          delete c._regions;
        }
        uk = res.countries; sources.uk.fetched = today();
      } else console.warn(`  [uk] only ${n} countries — keeping previous`);
      console.log(`  ${n} countries` + (res.unmatched.length ? `; unmatched: ${res.unmatched.slice(0, 12).join(", ")}` : ""));
    } catch (e) { console.warn(`[uk] skipped: ${e.message}`); }
  }
  if (want("us")) {
    try {
      const res = await fetchUS(names, admin1);
      const n = Object.keys(res.countries).length;
      if (n >= MIN_COUNTRIES) {
        for (const [iso, c] of Object.entries(res.countries)) {
          freshRegions[iso] = (freshRegions[iso] || []).concat(c._regions || []);
          delete c._regions;
        }
        us = res.countries; sources.us.fetched = today();
      } else console.warn(`  [us] only ${n} countries — keeping previous`);
      console.log(`US State Dept: ${n} countries` + (res.unmatched.length ? `; unmatched: ${res.unmatched.slice(0, 12).join(", ")}` : ""));
    } catch (e) { console.warn(`[us] skipped: ${e.message}`); }
  }
  if (want("ca")) {
    try {
      const res = await fetchCA();
      const n = Object.keys(res.countries).length;
      if (n >= MIN_COUNTRIES) {
        ca = res.countries; sources.ca.fetched = today();
        // Area lists come from each country's page (only the ~60 with a regional advisory).
        try {
          const reg = await fetchCARegions(ca, admin1);
          for (const [iso, r] of Object.entries(reg.regions)) freshRegions[iso] = (freshRegions[iso] || []).concat(r);
          console.log(`  regional advisories read on ${reg.pages} country pages; areas found in ${Object.keys(reg.regions).length}`);
        } catch (e) { console.warn(`  [ca] regions skipped: ${e.message}`); }
      } else console.warn(`  [ca] only ${n} countries — keeping previous`);
      console.log(`Canada: ${n} countries`);
    } catch (e) { console.warn(`[ca] skipped: ${e.message}`); }
  }
  let mfa = {};
  for (const [iso, c] of Object.entries((prev && prev.countries) || {})) if (c.mfa) mfa[iso] = c.mfa;
  if (want("tr")) {
    try {
      const res = await fetchTR();
      if (res.seen >= 8) { mfa = res.countries; console.log(`Türkiye Foreign Ministry: ${res.seen} announcements → ${Object.keys(res.countries).length} countries`); }
      else console.warn(`  [tr] only ${res.seen} announcements — keeping previous`);
    } catch (e) { console.warn(`[tr] skipped: ${e.message}`); }
  }
  if (want("gdacs")) {
    try {
      const res = await fetchEvents();
      events = res; sources.gdacs.fetched = today();
      console.log(`GDACS: current alerts in ${Object.keys(res).length} countries`);
    } catch (e) { console.warn(`[gdacs] skipped: ${e.message}`); }
  }

  const countries = {};
  const isos = new Set([...Object.keys(uk), ...Object.keys(us), ...Object.keys(ca), ...Object.keys(events)]);
  for (const iso of isos) {
    const c = {};
    if (uk[iso]) c.uk = uk[iso];
    if (us[iso]) c.us = us[iso];
    if (ca[iso]) c.ca = ca[iso];
    if (events[iso]) c.events = events[iso];
    if (mfa[iso]) c.mfa = mfa[iso];
    c.level = Math.max(c.uk ? c.uk.level : 0, c.us ? c.us.level : 0, c.ca ? c.ca.level : 0) || 1;
    c.updated = [c.uk && c.uk.updated, c.us && c.us.updated, c.ca && c.ca.updated]
      .filter(Boolean).sort().pop() || null;
    const fresh = freshRegions[iso];
    const merged = fresh && fresh.length ? mergeRegions(fresh) : (regionsPrev[iso] || null);
    if (merged && merged.regions && merged.regions.length) c.regions = merged.regions;
    // A note that is no stricter than the whole country's own level says nothing new
    // ("Do not travel: Burma for any reason …" on a level-4 country is just its prose).
    const notes = merged && merged.notes ? merged.notes.filter(n => n.level > c.level) : [];
    if (notes.length) c.regionNotes = notes;
    countries[iso] = c;
  }

  const data = { generated: today(), sources, countries };

  const hist = [0, 0, 0, 0, 0];
  let withRegions = 0, regionUnits = 0, withEvents = 0;
  for (const c of Object.values(countries)) {
    hist[c.level]++;
    if (c.regions) { withRegions++; regionUnits += c.regions.length; }
    if (c.events) withEvents++;
  }
  console.log(`\nMerged ${Object.keys(countries).length} countries · levels 1–4: ${hist.slice(1).join(" / ")}`);
  console.log(`Regional warnings: ${regionUnits} mapped units across ${withRegions} countries · current events in ${withEvents}`);
  if (DRY_RUN) return;

  const text =
    "// Auto-generated by backend/fetch-advisories.js — DO NOT EDIT BY HAND.\n" +
    "// Government travel advisories (UK FCDO + U.S. State Department + Government\n" +
    "// of Canada) on one 1–4 ladder, `level` being the strictest of the three,\n" +
    "// plus mapped regional warnings and current GDACS disaster alerts.\n" +
    "window.TRAVEL_ADVISORIES = " + JSON.stringify(data) + ";\n";
  fs.writeFileSync(OUT_PATH, text);
  console.log(`Wrote ${OUT_PATH} (${(text.length / 1024).toFixed(0)} KB)`);
})().catch(e => { console.error(e); process.exit(1); });
