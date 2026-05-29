// fetch-variants.js — auto-extract DIPLOMATIC-passport visa-free maps from
// Wikipedia's "Visa requirements for <X> citizens" articles, for the variant
// selector (most countries' diplomatic passports get far broader visa-free
// access than their ordinary ones — like Turkey's green/black passports).
//
// Why this is safe (no invented data): we anchor on the canonical sentence
// "Holders of <X> diplomatic/service/official passports may enter the
// following countries without a visa", take the {{flag|…}} list that follows,
// and only emit a country if we extract a plausibly-large list (≥ MIN). The
// strict anchor rejects unrelated tables, so we never ship a bogus map. The
// hand-curated TR entry in passport-variants.js is always preserved.
//
// Output → ../data/passport-variants-data.js (window.PASSPORT_VARIANTS_DATA),
// merged on top of the built-in maps by passport-variants.js at load.
//
// Run:
//   node fetch-variants.js            (writes the data file)
//   node fetch-variants.js --dry-run  (print summary, don't write)

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const OUT_PATH = path.join(__dirname, "..", "data", "passport-variants-data.js");
const ISO_MAP = JSON.parse(fs.readFileSync(path.join(__dirname, "iso-map.json"), "utf-8"));
const UA = "AtlasVisaGlobe/1.0 (https://travelnow.info; variants-refresh)";
const DRY_RUN = process.argv.includes("--dry-run");
const MIN = 25;        // below this, treat as a bad/empty parse → skip
const DELAY = 1100;    // polite pacing (Wikipedia rate-limits bursts)

// (Demonym/adjective used in the article title) → ISO2 of the passport.
const TARGETS = [
  ["Chinese", "CN"], ["Indian", "IN"], ["Russian", "RU"], ["Indonesian", "ID"],
  ["Pakistani", "PK"], ["Egyptian", "EG"], ["Filipino", "PH"], ["Vietnamese", "VN"],
  ["Thai", "TH"], ["Nigerian", "NG"], ["Brazilian", "BR"], ["Mexican", "MX"],
  ["South African", "ZA"], ["Kenyan", "KE"], ["Bangladeshi", "BD"],
  ["Kazakhstani", "KZ"], ["Ukrainian", "UA"], ["Argentine", "AR"],
  ["Colombian", "CO"], ["Peruvian", "PE"], ["Moroccan", "MA"], ["Algerian", "DZ"],
  ["Saudi Arabian", "SA"], ["Emirati", "AE"], ["Iranian", "IR"],
];

const ALIAS = {
  "Burma": "MM", "Myanmar": "MM", "East Timor": "TL", "Timor-Leste": "TL",
  "Ivory Coast": "CI", "Côte d'Ivoire": "CI", "North Korea": "KP", "South Korea": "KR",
  "Russia": "RU", "Cape Verde": "CV", "Republic of the Congo": "CG", "Congo": "CG",
  "DR Congo": "CD", "Democratic Republic of the Congo": "CD", "Eswatini": "SZ",
  "Swaziland": "SZ", "Palestine": "PS", "The Gambia": "GM", "Czech Republic": "CZ",
};
function nameToIso(raw) {
  const n = raw.replace(/\s+/g, " ").replace(/[’]/g, "'").trim();
  return ISO_MAP[n] || ALIAS[n] || null;
}
function flagsIn(text) {
  const out = new Set();
  const re = /\{\{flag(?:country|icon)?\|([^}|]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const iso = nameToIso(m[1]);
    if (iso) out.add(iso);
  }
  return [...out];
}

const ANCHOR = /[Hh]olders of [^.\n]{0,80}(diplomatic|service|official)[^.\n]{0,80}passports?[^.\n]{0,80}(without a visa|visa-free|may enter|do not require)/;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWikitext(adj) {
  const url = "https://en.wikipedia.org/w/api.php"
    + "?action=parse&prop=wikitext&format=json&formatversion=2&redirects=1"
    + "&page=" + encodeURIComponent("Visa requirements for " + adj + " citizens");
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  const txt = await r.text();
  try { return JSON.parse(txt)?.parse?.wikitext || ""; }
  catch (e) { throw new Error("non-JSON (rate limited?)"); }
}

async function extractDiplomatic(adj) {
  const wt = await fetchWikitext(adj);
  if (!wt) return null;
  const m = ANCHOR.exec(wt);
  if (!m) return null;
  const start = m.index;
  let end = wt.indexOf("\n==", start + 50);
  if (end < 0 || end - start > 6000) end = start + 6000;
  const list = flagsIn(wt.slice(start, end));
  return list.length >= MIN ? list : null;
}

function readPrevious() {
  try {
    const text = fs.readFileSync(OUT_PATH, "utf-8");
    const window = {};
    new Function("window", text)(window);
    return window.PASSPORT_VARIANTS_DATA || {};
  } catch (e) { return {}; }
}

(async () => {
  const out = readPrevious();      // keep previous on transient failure
  out.lastUpdated = new Date().toISOString().slice(0, 10);
  let ok = 0;
  for (const [adj, iso] of TARGETS) {
    try {
      const vf = await extractDiplomatic(adj);
      if (vf) {
        out[iso] = {
          diplomatik: {
            vf,
            source: "https://en.wikipedia.org/wiki/Visa_requirements_for_" + adj.replace(/ /g, "_") + "_citizens",
          },
        };
        ok++;
        console.log(`${iso}: diplomatic visa-free ${vf.length}`);
      } else {
        console.log(`${iso}: no parseable diplomatic section — skip`);
      }
    } catch (e) {
      console.warn(`${iso}: ${e.message} — keeping previous`);
    }
    await sleep(DELAY);
  }

  const body = [
    "// AUTO-GENERATED by backend/fetch-variants.js (daily cron) — do not edit by hand.",
    "// Diplomatic-passport visa-free maps extracted from Wikipedia 'Visa requirements",
    "// for <X> citizens' articles (strict-anchored; only confident parses emitted).",
    "// passport-variants.js merges these on top of its hand-curated entries.",
    "",
    "window.PASSPORT_VARIANTS_DATA = " + JSON.stringify(out, null, 1) + ";",
    "",
  ].join("\n");
  if (DRY_RUN) { console.log(`\n(${ok} countries) dry-run, not writing.`); return; }
  fs.writeFileSync(OUT_PATH, body);
  console.log(`\nWrote ${OUT_PATH} — ${ok} countries with diplomatic variants.`);
})().catch(e => { console.error(e); process.exit(1); });
