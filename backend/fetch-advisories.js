// fetch-advisories.js — government travel-safety advisories → data/travel-advisories.js
//
// Data for the /safety-map/ page. Two official, machine-readable sources:
//
//   1. U.S. Department of State travel advisories (public domain)
//      https://cadataapi.state.gov/api/TravelAdvisories
//      Level 1–4 per country + the risk indicators named in the summary
//      ("due to crime, terrorism, and kidnapping") + whether some areas carry a
//      higher level than the country as a whole.
//   2. Government of Canada travel advice (Open Government Licence – Canada)
//      https://data.international.gc.ca/travel-voyage/index-alpha-eng.json
//      advisory-state 0–3 per country + a regional-advisory flag.
//
// Both scales are mapped onto one 1–4 ladder:
//   1 normal precautions · 2 increased caution · 3 reconsider / avoid
//   non-essential travel · 4 do not travel / avoid all travel
// The map colours each country by the STRICTER of the two, and the detail card
// shows both sources side by side, so a disagreement is visible, not hidden.
//
// Nothing is invented: a country missing from a source simply has no entry for
// that source. If a source fails or returns implausibly little, the previous
// file's data for that source is kept.
//
// Run:
//   node backend/fetch-advisories.js            (writes the file)
//   node backend/fetch-advisories.js --dry-run  (prints a summary only)

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const OUT_PATH = path.join(__dirname, "..", "data", "travel-advisories.js");
const UA = "travelnow.info/1.0 (+https://travelnow.info; travel-safety map)";
const DRY_RUN = process.argv.includes("--dry-run");
const MIN_COUNTRIES = 150; // below this, treat the source as broken

const US_URL = "https://cadataapi.state.gov/api/TravelAdvisories";
const CA_URL = "https://data.international.gc.ca/travel-voyage/index-alpha-eng.json";

// ─── Country names → ISO2 ─────────────────────────────────────────────────
// State Department titles use their own spellings (and FIPS codes in
// `Category`, which differ from ISO: Germany = GM), so we match on names.
const NAME_ALIASES = {
  "Burma (Myanmar)": "MM", "Burma": "MM", "Cabo Verde": "CV", "Cape Verde": "CV",
  "Cote d'Ivoire": "CI", "Côte d'Ivoire": "CI", "Czechia": "CZ", "Czech Republic": "CZ",
  "Democratic Republic of the Congo": "CD", "Republic of the Congo": "CG",
  "Congo, Democratic Republic of the": "CD", "Congo, Republic of the": "CG",
  "Eswatini": "SZ", "The Bahamas": "BS", "Bahamas": "BS", "The Gambia": "GM",
  "Gambia": "GM", "Holy See": "VA", "Vatican City": "VA", "Kyrgyz Republic": "KG",
  "Laos": "LA", "Micronesia": "FM", "North Korea (Democratic People's Republic of Korea)": "KP",
  "North Korea": "KP", "South Korea": "KR", "Republic of Korea": "KR",
  "Russia": "RU", "Syria": "SY", "Taiwan": "TW", "Timor-Leste": "TL",
  "Turkey": "TR", "Türkiye": "TR", "Turkiye": "TR", "United Kingdom": "GB",
  "Vietnam": "VN", "West Bank and Gaza": "PS", "Israel, the West Bank and Gaza": "IL",
  "Palestinian Territories": "PS", "Moldova": "MD", "Macau": "MO", "Hong Kong": "HK",
  "Mainland China": "CN", "China": "CN", "Sao Tome and Principe": "ST",
  "São Tomé and Príncipe": "ST", "Saint Vincent and the Grenadines": "VC",
  "St Vincent and the Grenadines": "VC", "Saint Kitts and Nevis": "KN",
  "St Kitts and Nevis": "KN", "Saint Lucia": "LC", "St Lucia": "LC",
  "North Macedonia": "MK", "Bosnia and Herzegovina": "BA", "Brunei": "BN",
  "Iran": "IR", "Tanzania": "TZ", "Bolivia": "BO", "Venezuela": "VE",
  "Kosovo": "XK", "Curacao": "CW", "Curaçao": "CW", "Sint Maarten": "SX",
  "Cote d Ivoire": "CI", "The Kyrgyz Republic": "KG", "Kingdom of Denmark": "DK",
  "West Bank": "PS", "Gaza": "PS",
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

// ─── U.S. State Department ─────────────────────────────────────────────────
const US_LEVEL_RE = /Level\s+([1-4])/i;
// Risk indicators the State Department names in its summaries.
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
// The sentence that states the country-wide level starts with that level's verb.
const LEAD = String.raw`^(?:advisory summary:?\s*)?`;
const US_LEVEL_VERB = {
  1: new RegExp(LEAD + "exercise normal precautions\\b", "i"),
  2: new RegExp(LEAD + "exercise increased caution\\b", "i"),
  3: new RegExp(LEAD + "reconsider travel\\b", "i"),
  4: new RegExp(LEAD + "do not travel\\b", "i"),
};
const AREA_LEVEL_VERB = /\b(exercise increased caution|reconsider travel|do not travel)\s+(to|in|near|when)\b/i;

const decodeEntities = (s) => s
  .replace(/&#(\d+);/g, (_, n) => (n === "8239" || n === "160") ? " " : String.fromCharCode(Number(n)))
  .replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#8217;|&#39;/g, "'")
  .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
const stripTags = (html) => decodeEntities(String(html || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

async function fetchUS(names) {
  const r = await fetch(US_URL, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!r.ok) throw new Error(`US HTTP ${r.status}`);
  const list = await r.json();
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
    const entry = {
      level,
      risks,
      regional: /\bsome areas have (increased|greater|higher) risk/i.test(text) || areaSentences > 0,
      updated: String(it.Updated || it.Published || "").slice(0, 10),
      url: it.Link,
    };
    // A few countries appear twice (e.g. a territory page); keep the stricter.
    if (!out[iso] || out[iso].level < entry.level) out[iso] = entry;
  }
  return { countries: out, unmatched };
}

// ─── Government of Canada ─────────────────────────────────────────────────
async function fetchCA() {
  const r = await fetch(CA_URL, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!r.ok) throw new Error(`CA HTTP ${r.status}`);
  const j = await r.json();
  const out = {};
  for (const [iso, d] of Object.entries(j.data || {})) {
    const state = Number(d["advisory-state"]);
    if (!(state >= 0 && state <= 3)) continue;
    const slug = d.eng && d.eng["url-slug"];
    out[iso.toUpperCase()] = {
      level: state + 1,
      text: d.eng ? d.eng["advisory-text"] : "",
      regional: Number(d["has-regional-advisory"]) === 1,
      updated: String((d["date-published"] || {}).date || "").slice(0, 10),
      url: slug ? `https://travel.gc.ca/destinations/${slug}` : "https://travel.gc.ca/travelling/advisories",
    };
  }
  return { countries: out };
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
  const prev = readPrevious();
  const today = new Date().toISOString().slice(0, 10);

  let us = perSource(prev, "us"), ca = perSource(prev, "ca");
  let usFetched = prev && prev.sources && prev.sources.us && prev.sources.us.fetched;
  let caFetched = prev && prev.sources && prev.sources.ca && prev.sources.ca.fetched;
  try {
    const res = await fetchUS(names);
    const n = Object.keys(res.countries).length;
    if (n >= MIN_COUNTRIES) { us = res.countries; usFetched = today; }
    else console.warn(`[us] only ${n} countries parsed — keeping previous`);
    console.log(`US State Dept: ${n} countries` + (res.unmatched.length ? `; unmatched: ${res.unmatched.join(", ")}` : ""));
  } catch (e) { console.warn(`[us] skipped: ${e.message}`); }
  try {
    const res = await fetchCA();
    const n = Object.keys(res.countries).length;
    if (n >= MIN_COUNTRIES) { ca = res.countries; caFetched = today; }
    else console.warn(`[ca] only ${n} countries parsed — keeping previous`);
    console.log(`Canada: ${n} countries`);
  } catch (e) { console.warn(`[ca] skipped: ${e.message}`); }

  const countries = {};
  for (const iso of new Set([...Object.keys(us), ...Object.keys(ca)])) {
    const c = {};
    if (us[iso]) c.us = us[iso];
    if (ca[iso]) c.ca = ca[iso];
    c.level = Math.max(c.us ? c.us.level : 0, c.ca ? c.ca.level : 0);
    countries[iso] = c;
  }

  const data = {
    generated: today,
    sources: {
      us: { name: "U.S. Department of State", url: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html", licence: "Public domain (U.S. Government work)", fetched: usFetched || null },
      ca: { name: "Government of Canada", url: "https://travel.gc.ca/travelling/advisories", licence: "Open Government Licence – Canada", fetched: caFetched || null },
    },
    countries,
  };

  const hist = [0, 0, 0, 0, 0];
  Object.values(countries).forEach(c => hist[c.level]++);
  console.log(`Merged ${Object.keys(countries).length} countries · by level 1–4: ${hist.slice(1).join(" / ")}`);
  if (DRY_RUN) return;

  const text =
    "// Auto-generated by backend/fetch-advisories.js — DO NOT EDIT BY HAND.\n" +
    "// Government travel advisories (U.S. State Department + Government of Canada)\n" +
    "// mapped to one 1–4 ladder; `level` is the stricter of the two sources.\n" +
    "window.TRAVEL_ADVISORIES = " + JSON.stringify(data) + ";\n";
  fs.writeFileSync(OUT_PATH, text);
  console.log(`Wrote ${OUT_PATH} (${(text.length / 1024).toFixed(0)} KB)`);
})().catch(e => { console.error(e); process.exit(1); });
