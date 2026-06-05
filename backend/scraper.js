// scraper.js — daily refresh of visa policy data from Wikipedia.
//
// Run:
//   node scraper.js --all                  (refresh every passport)
//   node scraper.js --passport US          (single passport)
//   node scraper.js --passport US --dry-run (print JSON, don't write)
//
// Output: writes ../data/passports.js and updates ../data/changelog.js
//
// Polite scraping: 800 ms delay between requests, custom User-Agent,
// respects Wikipedia's robots.txt + API rate limits.

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

// [country name, wikipedia slug for "Visa_requirements_for_<slug>_citizens"]
// Wikipedia uses demonyms ("Turkish") not country names ("Turkey") for the URL.
const PASSPORT_TARGETS = [
  // Top tier
  ["Singapore", "Singaporean"], ["Japan", "Japanese"], ["South Korea", "South_Korean"],
  ["United Arab Emirates", "Emirati"],
  ["Germany", "German"], ["France", "French"], ["Italy", "Italian"], ["Spain", "Spanish"],
  ["Netherlands", "Dutch"], ["Belgium", "Belgian"], ["Denmark", "Danish"],
  ["Finland", "Finnish"], ["Ireland", "Irish"], ["Luxembourg", "Luxembourg"],
  ["Norway", "Norwegian"], ["Switzerland", "Swiss"], ["Austria", "Austrian"],
  ["Sweden", "Swedish"], ["Portugal", "Portuguese"], ["Greece", "Greek"],
  ["United Kingdom", "British"],
  ["Hungary", "Hungarian"], ["Malaysia", "Malaysian"], ["Poland", "Polish"],
  ["Czech Republic", "Czech"], ["Slovenia", "Slovenian"], ["Slovakia", "Slovak"],
  ["Lithuania", "Lithuanian"], ["Latvia", "Latvian"], ["Estonia", "Estonian"],
  ["Iceland", "Icelandic"], ["Malta", "Maltese"], ["Liechtenstein", "Liechtenstein"],
  ["Australia", "Australian"], ["New Zealand", "New_Zealand"],
  ["Canada", "Canadian"], ["United States", "United_States"],
  ["Croatia", "Croatian"], ["Cyprus", "Cypriot"],
  ["Romania", "Romanian"], ["Bulgaria", "Bulgarian"],
  // Strong mid-tier
  ["Argentina", "Argentine"], ["Chile", "Chilean"], ["Brazil", "Brazilian"],
  ["Uruguay", "Uruguayan"], ["Mexico", "Mexican"],
  ["Hong Kong", "Chinese_citizens_of_Hong_Kong"],
  ["Taiwan", "Taiwanese"], ["Israel", "Israeli"],
  ["Andorra", "Andorran"], ["Monaco", "Monégasque"], ["San Marino", "Sammarinese"],
  ["Vatican City", "Vatican_City"], ["Brunei", "Bruneian"],
  // Mid-tier
  ["Turkey", "Turkish"], ["Albania", "Albanian"], ["North Macedonia", "North_Macedonian"],
  ["Serbia", "Serbian"], ["Montenegro", "Montenegrin"],
  ["Bosnia and Herzegovina", "Bosnia_and_Herzegovina"],
  ["Moldova", "Moldovan"], ["Ukraine", "Ukrainian"], ["Georgia", "Georgian"],
  ["Russia", "Russian"], ["Kazakhstan", "Kazakhstani"], ["Belarus", "Belarusian"],
  ["Armenia", "Armenian"], ["Azerbaijan", "Azerbaijani"],
  ["South Africa", "South_African"], ["Mauritius", "Mauritian"],
  ["Seychelles", "Seychellois"], ["Botswana", "Botswana"], ["Namibia", "Namibian"],
  ["Costa Rica", "Costa_Rican"], ["Panama", "Panamanian"],
  ["Trinidad and Tobago", "Trinidad_and_Tobago"],
  ["Saint Kitts and Nevis", "Saint_Kitts_and_Nevis"],
  ["Antigua and Barbuda", "Antigua_and_Barbuda"],
  ["Bahamas", "Bahamian"], ["Barbados", "Barbadian"],
  // Weaker
  ["China", "Chinese"], ["India", "Indian"], ["Indonesia", "Indonesian"],
  ["Philippines", "Philippine"], ["Thailand", "Thai"], ["Vietnam", "Vietnamese"],
  ["Sri Lanka", "Sri_Lankan"], ["Nepal", "Nepalese"], ["Bangladesh", "Bangladeshi"],
  ["Pakistan", "Pakistani"], ["Myanmar", "Burmese"], ["Cambodia", "Cambodian"],
  ["Laos", "Laotian"],
  ["Saudi Arabia", "Saudi_Arabian"], ["Qatar", "Qatari"], ["Bahrain", "Bahraini"],
  ["Kuwait", "Kuwaiti"], ["Oman", "Omani"], ["Jordan", "Jordanian"],
  ["Lebanon", "Lebanese"],
  ["Egypt", "Egyptian"], ["Morocco", "Moroccan"], ["Tunisia", "Tunisian"],
  ["Algeria", "Algerian"], ["Libya", "Libyan"],
  ["Nigeria", "Nigerian"], ["Kenya", "Kenyan"], ["Ghana", "Ghanaian"],
  ["Ethiopia", "Ethiopian"], ["Tanzania", "Tanzanian"], ["Uganda", "Ugandan"],
  ["Rwanda", "Rwandan"], ["Cameroon", "Cameroonian"], ["Senegal", "Senegalese"],
  ["Côte d'Ivoire", "Ivorian"],
  // Bottom
  ["Iran", "Iranian"], ["Iraq", "Iraqi"], ["Syria", "Syrian"], ["Yemen", "Yemeni"],
  ["Afghanistan", "Afghan"], ["Somalia", "Somali"], ["Sudan", "Sudanese"],
  ["North Korea", "North_Korean"], ["Eritrea", "Eritrean"],
  // ── Second-pass coverage (smaller / less-traveled passports) ──
  ["Angola", "Angolan"], ["Benin", "Beninese"], ["Bhutan", "Bhutanese"],
  ["Bolivia", "Bolivian"], ["Botswana", "Botswana"],
  ["Burkina Faso", "Burkinabé"], ["Burundi", "Burundian"],
  ["Cabo Verde", "Cape_Verdean"], ["Cambodia", "Cambodian"],
  ["Central African Republic", "Central_African"], ["Chad", "Chadian"],
  ["Colombia", "Colombian"], ["Comoros", "Comorian"],
  ["Republic of the Congo", "Republic_of_the_Congo"],
  ["Democratic Republic of the Congo", "Democratic_Republic_of_the_Congo"],
  ["Cuba", "Cuban"], ["Djibouti", "Djiboutian"],
  ["Dominica", "Dominica"],
  ["Dominican Republic", "Dominican_Republic"],
  ["Ecuador", "Ecuadorian"], ["El Salvador", "Salvadoran"],
  ["Equatorial Guinea", "Equatorial_Guinean"], ["Eswatini", "Swazi"],
  ["Fiji", "Fijian"], ["Gabon", "Gabonese"], ["Gambia", "Gambian"],
  ["Grenada", "Grenadian"], ["Guatemala", "Guatemalan"],
  ["Guinea", "Guinean"], ["Guinea-Bissau", "Bissau-Guinean"],
  ["Guyana", "Guyanese"], ["Haiti", "Haitian"], ["Honduras", "Honduran"],
  ["Jamaica", "Jamaican"], ["Kiribati", "Kiribati"],
  ["Kyrgyzstan", "Kyrgyzstani"], ["Lesotho", "Lesotho"],
  ["Liberia", "Liberian"], ["Madagascar", "Malagasy"],
  ["Malawi", "Malawian"], ["Maldives", "Maldivian"],
  ["Mali", "Malian"], ["Marshall Islands", "Marshall_Islands"],
  ["Mauritania", "Mauritanian"], ["Micronesia", "Micronesian"],
  ["Mongolia", "Mongolian"], ["Mozambique", "Mozambican"],
  ["Nauru", "Nauruan"], ["Nicaragua", "Nicaraguan"],
  ["Niger", "Nigerien"], ["Palau", "Palauan"],
  ["Palestine", "Palestinian"], ["Papua New Guinea", "Papua_New_Guinean"],
  ["Paraguay", "Paraguayan"], ["Peru", "Peruvian"],
  ["Saint Lucia", "Saint_Lucian"],
  ["Saint Vincent and the Grenadines", "Saint_Vincent_and_the_Grenadines"],
  ["Samoa", "Samoan"], ["São Tomé and Príncipe", "Santomean"],
  ["Sierra Leone", "Sierra_Leonean"], ["Solomon Islands", "Solomon_Islands"],
  ["South Sudan", "South_Sudanese"], ["Suriname", "Surinamese"],
  ["Tajikistan", "Tajikistani"], ["Timor-Leste", "East_Timorese"],
  ["Togo", "Togolese"], ["Tonga", "Tongan"],
  ["Turkmenistan", "Turkmen"], ["Tuvalu", "Tuvaluan"],
  ["Uzbekistan", "Uzbekistani"], ["Vanuatu", "Vanuatuan"],
  ["Venezuela", "Venezuelan"], ["Zambia", "Zambian"],
  ["Zimbabwe", "Zimbabwean"], ["Belize", "Belizean"],
  ["Macao", "Macanese"],
  // ── Partially-recognised states with real Wikipedia visa pages ──
  ["Kosovo", "Kosovan"],
  ["Northern Cyprus", "Northern_Cypriot"],
];

const ISO_MAP = require("./iso-map.json"); // name → ISO2 mapping
const SOURCE_DIR = path.resolve(__dirname, "../data");

// Manual overrides for passports whose Wikipedia page does not use the standard
// "Country | Visa requirement" wikitable (so the parser cannot read it).
// Source: same Wikipedia article, transcribed by hand.
const MANUAL_OVERRIDES = {
  // Northern Cyprus: only Turkey accepts the TRNC passport visa-free.
  // Source: https://en.wikipedia.org/wiki/Visa_requirements_for_Northern_Cypriot_citizens
  // The Wikipedia table is non-standard (single destination), so the scraper output
  // would otherwise be empty.
  XN: {
    name: "Northern Cyprus",
    default: "vr",
    defaultDays: null,
    vf: [["TR", 90]],
    ev: [], voa: [],
  },
};

// ───────────────────────────────────────────────────────────────────────────
// Fetch + parse a single passport's Wikipedia page
async function scrapePassport(name, slug, titleOverride) {
  if (!slug) slug = name.replace(/\s+/g, "_").replace(/'/g, "%27");
  // titleOverride (when given) is the full underscored Wikipedia article title —
  // used for non-"…citizens" pages such as the British nationality-class lists
  // ("Visa_requirements_for_British_Overseas_citizens"). Otherwise build the
  // standard "…_citizens" path (or use the slug verbatim if it already has it).
  const path = titleOverride
    ? titleOverride
    : (slug.includes("citizens")
        ? `Visa_requirements_for_${slug}`
        : `Visa_requirements_for_${slug}_citizens`);
  const url = `https://en.wikipedia.org/wiki/${path}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AtlasVisaBot/1.0; +https://github.com/atlas-visa)",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${name} (${url})`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Wikipedia visa pages use a standard table with columns:
  // Country | Visa requirement | Allowed stay | Notes
  // Identified by class "wikitable" with the header text "Visa requirement".
  const result = { name, iso2: ISO_MAP[name], rows: [] };

  // Most pages head the status column "Visa requirement", but some use "Entry
  // requirement" (Canada) and the special-territory tables (Hong Kong / Macau /
  // Taiwan) use "Conditions of access". Accept all three, else we drop rows.
  const isStatusHdr = h => h.includes("visa requirement") || h.includes("entry requirement") ||
                           h.includes("conditions of access");
  // The destination column is "Country" or "Destination" on the main table and
  // "Territory" on the SAR/territories table.
  const isCountryHdr = h => h.includes("country") || h.includes("destination") || h.includes("territory");
  const isStayHdr = h => h.includes("allowed stay") || h.includes("max stay") ||
                         h.includes("stay duration") || h.includes("duration of stay") ||
                         h.includes("length of stay") || h.includes("period of stay") || h === "stay";

  // The MAIN visa table is authoritative. Pages also carry secondary tables:
  // some are regional/bilateral ones whose rows CONFLICT with the headline status
  // (e.g. India's "...nationals to visit the country" listed Malaysia as visa on
  // arrival) — those must never override the main table. Others legitimately ADD
  // destinations the main table omits: Hong Kong, Macau and Taiwan are listed in
  // a separate "special administrative regions / territories" table. So: process
  // the main table fully, then let later tables only FILL GAPS (dests not already
  // seen). That captures HK/Macau/Taiwan without reintroducing the Malaysia bug.
  const seen = new Set();
  const processTable = (tbl, headers, gapFillOnly) => {
    const countryIdx = headers.findIndex(isCountryHdr);
    const visaIdx = headers.findIndex(isStatusHdr);
    const stayIdx = headers.findIndex(isStayHdr);
    const notesIdx = headers.findIndex(h => h.includes("notes") || h.includes("note"));

    $(tbl).find("tr").slice(1).each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 2) return;
      // Strip footnote refs like [12] from the country name before mapping —
      // otherwise rows such as "Vietnam[295][296]" silently fail ISO lookup.
      const countryName = $(cells[countryIdx]).text().trim().replace(/\[[^\]]*\]/g, "").trim();
      const visaText = $(cells[visaIdx]).text().trim();
      const stayText = stayIdx >= 0 ? $(cells[stayIdx]).text().trim() : "";
      const notesText = notesIdx >= 0 ? $(cells[notesIdx]).text().trim() : "";

      const status = classifyVisaText(visaText);
      const days = parseDays(stayText);
      const destIso2 = ISO_MAP[countryName];
      if (!destIso2 || !status) return;
      if (gapFillOnly && seen.has(destIso2)) return; // never override the main table
      if (seen.has(destIso2)) return;
      seen.add(destIso2);
      const r = { destIso2, status, days, raw: visaText };
      const cond = notesText ? extractConditions(notesText, status) : [];
      if (cond.length) r.conditions = cond;
      result.rows.push(r);
    });
  };

  // Collect candidate tables (Country + status header). The main table is the
  // first one that also has an allowed-stay column; fall back to the first.
  const candidates = [];
  let mainTbl = null;
  $("table.wikitable").each((i, tbl) => {
    const headers = $(tbl).find("tr").first().find("th").map((_, th) => $(th).text().trim().toLowerCase()).get();
    if (!headers.some(isStatusHdr)) return;
    if (!headers.some(isCountryHdr)) return;
    candidates.push({ tbl, headers });
    if (!mainTbl && headers.some(isStayHdr)) mainTbl = { tbl, headers };
  });
  if (!mainTbl && candidates.length) mainTbl = candidates[0];

  if (mainTbl) {
    processTable(mainTbl.tbl, mainTbl.headers, false);
    // Gap-fill from the other tables (adds HK/Macau/Taiwan/territories only).
    for (const c of candidates) {
      if (c.tbl === mainTbl.tbl) continue;
      processTable(c.tbl, c.headers, true);
    }
  }

  return result;
}

// Map Wikipedia's wording to our 5-status taxonomy (vf / ev / voa / vr / ban)
function classifyVisaText(text) {
  // Normalize: lowercase, drop wiki footnote refs like [1], [note 2], collapse ws
  const t = text.toLowerCase()
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  // Order matters: check denials first, then specific permits, then generic "visa-free".
  // "ban" = the DESTINATION refuses this nationality outright (e.g. countries that
  // refuse Israeli citizens → "Admission refused"). NOTE: we deliberately do NOT
  // treat "Travel banned" as a ban — on Wikipedia that phrase marks an ORIGIN
  // government prohibiting its OWN citizens from a war zone (e.g. South Korea →
  // Syria/Yemen/Ukraine, shown as "eVisaTravel banned"). That is not a destination
  // entry refusal, and folding it into `ban` wrongly painted South Korea — one of
  // the strongest passports — as "no entry allowed" for 12 countries. The real
  // destination status sits before that phrase in the same cell, so dropping the
  // match lets it classify correctly (eVisa / visa-free / visa-required).
  if (t.includes("admission refused") || t.includes("entry refused") ||
      t.includes("entry banned") ||
      t.includes("no entry") || t.includes("entry prohibited") ||
      t.includes("not admitted")) return "ban";
  // "restricted" (admission/entry/travel) is NOT an outright ban — entry is
  // possible with special permission or a visa (e.g. India→Pakistan, where
  // pilgrimage/family visas are issued). Treat as visa-required.
  if (t.includes("admission restricted") || t.includes("entry restricted") ||
      t.includes("travel restricted")) return "vr";
  // eVisa variants — MUST be checked before "visa required" because phrases like
  // "Online Visa required" (Australia ETA, Canada eTA) would otherwise be miscategorised as vr.
  // Also covers brand-named electronic authorisations: ESTA / Visa Waiver Program
  // (US), eVisitor (Australia), NZeTA (New Zealand), K-ETA (South Korea).
  if (t.includes("evisa") || t.includes("e-visa") || t.includes("e visa") ||
      t.includes("electronic visa") || t.includes("electronic travel authorization") ||
      t.includes("electronic travel authorisation") || // British spelling (e.g. Australia ETA)
      t.includes("electronic travel authority") ||
      t.includes("eta required") || t.includes("eta approved") || t.includes("e-ta") ||
      t.includes(" eta ") || /^eta$/.test(t) || t.endsWith(" eta") || t.startsWith("eta ") ||
      t.includes("nzeta") || t.includes("k-eta") || t.includes("keta") || t.includes("evisitor") ||
      t.includes("visa waiver") ||
      t.includes("etias") || t.includes("online visa") || t.includes("electronic authorization") ||
      t.includes("e-travel") || t.includes("electronic system for travel authorization") ||
      t.includes("esta")) return "ev";
  if (t.includes("visa on arrival") || t.includes("voa") ||
      t.includes("visa issued on arrival") || t.includes("visa granted on arrival")) return "voa";
  if (t.includes("visa required") || t.includes("visa needed")) return "vr";
  if (t.includes("visa not required") || t.includes("freedom of movement") ||
      t.includes("visa-free") || t.includes("visa free") || t.includes("no visa required") ||
      t.includes("free movement") ||
      // ID-card travel within Europe (Schengen, EU, Western Balkans, Kosovo↔Albania)
      t.includes("id card") || t.includes("identity card") ||
      t.includes("national id") || t.includes("national identity") ||
      /^\d+\s*(days?|months?|years?)$/.test(t) ||
      /^visa not required for \d/.test(t)) return "vf";
  return null;
}

// Heuristic parser for the Notes column: looks for "holders of valid X visa
// can obtain Y" patterns and surfaces them as structured conditions. Returns
// an array of { ifHolds, then, days, note }. Defensive — returns [] when the
// note doesn't match a well-known pattern, so we never invent rules.
//
// Only emits a condition when the resulting status (`then`) is strictly
// better than the row's base status; otherwise the note isn't actionable.
function extractConditions(notesText, baseStatus) {
  if (!notesText) return [];
  const raw = notesText;
  const t = notesText.toLowerCase().replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
  if (!t) return [];
  // Anchor on a "valid X visa" pattern before doing more work.
  if (!/valid\s+[a-z]/.test(t)) return [];

  // Document-source keywords → ISO2 (or SCHENGEN / GCC virtual codes).
  // Each regex is paired with one or more codes; permanent-resident / green
  // card / "EEA" / "EU member" wording is treated as equivalent to a visa
  // for the same group. GCC matches any of the six Gulf states.
  const KEYWORDS = [
    // Schengen / EU / EEA — collapse to SCHENGEN since the visa policy is the
    // same. Catches "any Schengen state", "EU member state", "European Union",
    // "EEA national/visa", "European Economic Area", "EU long-stay".
    [/\bschengen\b/, ["SCHENGEN"]],
    [/\b(any\s+)?eu\s+(visa|residence|member|long.?stay)\b/, ["SCHENGEN"]],
    [/\beuropean\s+union\b/, ["SCHENGEN"]],
    [/\bee[ae]\s+(visa|national|residence|long.?stay)\b/, ["SCHENGEN"]],
    [/\beuropean\s+economic\s+area\b/, ["SCHENGEN"]],
    // US — visa, residence permit, green card, permanent resident
    [/\bunited\s+states\b|\bus\s+(visa|residence|green\s+card|permanent\s+resident)\b|\busa\b|\bamerican\s+(visa|residence|green\s+card)\b|\bgreen\s+card\b/, ["US"]],
    // UK — visa, residence permit, ILR
    [/\bunited\s+kingdom\b|\buk\s+(visa|residence|indefinite\s+leave)\b|\bbritish\s+(visa|residence)\b|\bindefinite\s+leave\s+to\s+remain\b/, ["GB"]],
    // Ireland
    [/\birish\s+(visa|residence|long.?stay)\b|\bireland\s+(visa|residence)\b/, ["IE"]],
    // Canada (incl. PR card)
    [/\bcanadian\s+(visa|residence|permanent\s+resident|pr\s+card)\b|\bcanada\s+(visa|residence)\b/, ["CA"]],
    // Japan
    [/\bjapanese\s+(visa|residence|long.?stay)\b|\bjapan\s+(visa|residence)\b/, ["JP"]],
    // Australia / New Zealand
    [/\baustralian\s+(visa|residence|pr)\b|\baustralia\s+(visa|residence)\b/, ["AU"]],
    [/\bnew\s+zealand\s+(visa|residence|pr)\b/, ["NZ"]],
    // South Korea
    [/\b(south\s+korean|korean)\s+(visa|residence)\b/, ["KR"]],
    // Singapore
    [/\bsingaporean?\s+(visa|residence|pr)\b|\bsingapore\s+(visa|residence)\b/, ["SG"]],
    // Germany / Switzerland on their own (some pages list specific Schengen
    // members rather than the umbrella Schengen term)
    [/\bgerman\s+(visa|residence)\b/, ["DE"]],
    [/\bswiss\s+(visa|residence)\b/, ["CH"]],
    // Israel
    [/\bisraeli?\s+(visa|residence)\b/, ["IL"]],
    // GCC umbrella → emit all six member states
    [/\bgcc\s+(visa|resident|residence|national)\b|\bgulf\s+cooperation\s+council\b/, ["AE","SA","KW","QA","BH","OM"]],
    // ASEAN-specific bilaterals are too varied to umbrella; surface only the
    // common per-state notes (already covered by individual keyword groups).
  ];
  const found = new Set();
  KEYWORDS.forEach(([re, codes]) => {
    if (re.test(t)) codes.forEach(c => found.add(c));
  });
  if (found.size === 0) return [];
  // Dedup: SCHENGEN already implies DE and CH (and 27 others). Drop the
  // narrow members so the UI shows one "Schengen" chip instead of three.
  if (found.has("SCHENGEN")) { found.delete("DE"); found.delete("CH"); }

  let then = null;
  if (/\b(evisa|e-visa|e\s+visa|electronic\s+visa|electronic\s+travel\s+authori[sz]ation)\b/.test(t)) then = "ev";
  else if (/\bvisa\s+on\s+arrival\b/.test(t)) then = "voa";
  else if (/\b(visa-?free|no\s+visa\s+required|without\s+a?\s*visa)\b/.test(t)) then = "vf";
  if (!then) return [];

  // Don't emit if the conditional path isn't actually an upgrade.
  const ORDER = { vf: 0, ev: 1, voa: 2, vr: 3 };
  if (ORDER[then] >= ORDER[baseStatus]) return [];

  let days = null;
  const m = t.match(/(\d+)\s*(day|month|year)/);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2];
    days = unit.startsWith("year") ? n * 365 : unit.startsWith("month") ? n * 30 : n;
  }

  return [{
    ifHolds: Array.from(found),
    then,
    days,
    note: raw.replace(/\[[^\]]*\]/g, "").trim(),
  }];
}

function parseDays(text) {
  if (!text) return null;
  const m = text.match(/(\d+)\s*(day|month|year)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("month")) return n * 30;
  if (unit.startsWith("year")) return n * 365;
  return n;
}

// ───────────────────────────────────────────────────────────────────────────
// Convert scraped rows into our compact passport schema (default + exceptions)
function buildPassportEntry(scrape) {
  const counts = { vf: 0, ev: 0, voa: 0, vr: 0, ban: 0 };
  scrape.rows.forEach(r => counts[r.status]++);
  // Whichever status is most common becomes the "default" — list the exceptions.
  // "ban" is never a sensible default (it's always a small minority), so exclude
  // it from the default election even in the unlikely event it tops the count.
  const def = Object.entries(counts)
    .filter(([s]) => s !== "ban")
    .sort((a, b) => b[1] - a[1])[0][0];
  const entry = {
    name: scrape.name,
    default: def,
    defaultDays: def === "vf" ? 90 : null,
  };
  ["vf", "ev", "voa", "vr", "ban"].forEach(s => {
    if (s === def) {
      // The default status is implied for most destinations and not listed. BUT a
      // visa-free destination with a NON-default stay (e.g. 30 days when the
      // default is 90) would otherwise inherit the wrong day count — this is why
      // Türkiye→South Africa and Canada→China showed "90 days" when both are 30.
      // Keep those as explicit exceptions so the real stay survives.
      if (def === "vf") {
        const odd = scrape.rows
          .filter(r => r.status === "vf" && r.days && r.days !== entry.defaultDays)
          .map(r => [r.destIso2, r.days]);
        if (odd.length) entry.vf = odd;
      }
      return;
    }
    entry[s] = scrape.rows
      .filter(r => r.status === s)
      .map(r => r.days ? [r.destIso2, r.days] : r.destIso2);
  });
  // Collect any conditional shortcuts the Notes parser found. Stored as a flat
  // map keyed by destination ISO2 so the frontend can look up in O(1).
  const cond = {};
  scrape.rows.forEach(r => {
    if (r.conditions && r.conditions.length) cond[r.destIso2] = r.conditions;
  });
  if (Object.keys(cond).length) entry.cond = cond;
  return [scrape.iso2, entry];
}

// ───────────────────────────────────────────────────────────────────────────
// Compute the changelog by diffing against the previous snapshot
function computeChangelog(prevData, newData) {
  const changes = [];
  for (const [iso2, np] of Object.entries(newData)) {
    const op = prevData[iso2];
    if (!op) continue;
    // Build flat status maps for both
    const flatten = (p) => {
      const m = {};
      ["vf", "ev", "voa", "vr", "ban"].forEach(s => (p[s] || []).forEach(e => {
        const code = Array.isArray(e) ? e[0] : e;
        m[code] = s;
      }));
      return m;
    };
    const oldMap = flatten(op);
    const newMap = flatten(np);
    for (const dest of new Set([...Object.keys(oldMap), ...Object.keys(newMap)])) {
      if (oldMap[dest] !== newMap[dest]) {
        changes.push({
          date: new Date().toISOString().slice(0, 10),
          passport: iso2,
          dest,
          from: oldMap[dest] || "vr",
          to: newMap[dest] || "vr",
        });
      }
    }
  }
  return changes;
}

// ───────────────────────────────────────────────────────────────────────────
// Main
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const all = args.includes("--all");
  const single = args.indexOf("--passport");
  let targets;
  if (all) targets = PASSPORT_TARGETS;
  else if (single >= 0) {
    const name = args[single + 1];
    const found = PASSPORT_TARGETS.find(t => t[0] === name);
    targets = [found || [name, null]];
  } else {
    console.log("Usage: node scraper.js --all | --passport <name> [--dry-run]");
    process.exit(1);
  }

  // Load the previous snapshot up-front so we can carry forward good data if a
  // scrape comes back empty (a parser/source change must never silently turn a
  // passport into "visa-free everywhere" — that's how the Canada bug shipped).
  const prevPath = path.join(SOURCE_DIR, "passports-snapshot.json");
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(prevPath, "utf8")); } catch (e) {}

  const collected = {};
  for (let i = 0; i < targets.length; i++) {
    const [name, slug] = targets[i];
    process.stdout.write(`[${i + 1}/${targets.length}] ${name}… `);
    try {
      const scrape = await scrapePassport(name, slug);
      const [iso2, entry] = buildPassportEntry(scrape);
      if (!iso2) {
        console.log(`✗ no ISO2 for "${name}" (check iso-map.json)`);
        continue;
      }
      // 0 rows means the table layout/headers changed — refuse the empty result
      // and keep yesterday's data instead of writing a bogus all-visa-free entry.
      if (scrape.rows.length === 0) {
        if (prev[iso2]) {
          collected[iso2] = prev[iso2];
          console.log(`⚠ 0 rows parsed — kept previous snapshot (table layout changed?)`);
        } else {
          console.log(`✗ 0 rows parsed and no previous data — skipped (check page table headers)`);
        }
        await new Promise(r => setTimeout(r, 1200));
        continue;
      }
      collected[iso2] = entry;
      console.log(`✓ ${scrape.rows.length} rows`);
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
    // Be polite — wait 1.2 s between requests
    await new Promise(r => setTimeout(r, 1200));
  }

  // Apply manual overrides for passports whose Wikipedia table is non-standard.
  for (const [iso, override] of Object.entries(MANUAL_OVERRIDES)) {
    collected[iso] = override;
    console.log(`✓ override applied for ${iso} (${override.name})`);
  }

  if (dryRun) {
    console.log("\n--- DRY RUN OUTPUT ---");
    console.log(JSON.stringify(collected, null, 2));
    return;
  }

  // Diff against previous snapshot for changelog (loaded up-front above)
  const changelog = computeChangelog(prev, collected);
  console.log(`\nDiff: ${changelog.length} status changes since yesterday`);

  // Write the new snapshot JSON
  fs.writeFileSync(prevPath, JSON.stringify(collected, null, 2));

  // Write the JS file the frontend expects
  const today = new Date().toISOString().slice(0, 10);
  const js =
    `// Auto-generated by backend/scraper.js — DO NOT EDIT BY HAND.\n` +
    `window.SNAPSHOT_DATE = "${today}";\n` +
    `const RAW_PASSPORTS = ${JSON.stringify(collected, null, 2)};\n` +
    fs.readFileSync(path.join(__dirname, "frontend-tail.js"), "utf8");
  fs.writeFileSync(path.join(SOURCE_DIR, "passports.js"), js);

  // Append today's changelog entries
  if (changelog.length > 0) {
    const changelogPath = path.join(SOURCE_DIR, "changelog.js");
    let existing = fs.readFileSync(changelogPath, "utf8");
    // Insert new entries at the top of the CHANGELOG array
    const newEntries = changelog.slice(0, 50).map(c =>
      `  {\n    date: "${c.date}",\n    title: "${c.passport} → ${c.dest}: ${c.from} → ${c.to}",\n    affects: { dest: "${c.dest}", passports: ["${c.passport}"] },\n    statusFrom: "${c.from}", statusTo: "${c.to}",\n  },`
    ).join("\n");
    existing = existing.replace("window.CHANGELOG = [", `window.CHANGELOG = [\n${newEntries}`);
    fs.writeFileSync(changelogPath, existing);
  }

  console.log(`\n✓ Wrote ${Object.keys(collected).length} passports + ${changelog.length} changelog entries.`);
}

// Only auto-run when invoked directly (node scraper.js …). When required as a
// module (e.g. by a targeted merge-regeneration helper), export the internals
// instead so callers can scrape a subset and merge without clobbering the rest.
if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}

module.exports = {
  scrapePassport, buildPassportEntry, classifyVisaText, parseDays,
  computeChangelog, PASSPORT_TARGETS, MANUAL_OVERRIDES, SOURCE_DIR,
};
