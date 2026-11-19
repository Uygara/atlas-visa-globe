// Exports the resolved visa dataset as open files for /open-data/.
// Run: node scripts/export-data.js
// Output: ./open-data/visa-matrix.csv, visa-matrix.json, passport-ranking.csv, changes.csv
//
// The data layer is loaded exactly as scripts/generate-seo.js loads it, so every row
// equals what the map and the passport pages show.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "open-data");
const SNAPSHOT = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "passports-snapshot.json"), "utf8"));

const DATA = (() => {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ["countries.js", "country-names.js", "passports.js", "visa-overrides.js", "mrz.js",
                   "passport-validity-rules.js", "travel-advisories.js", "visa-fees.js", "etias-rules.js",
                   "esta-rules.js", "transit-visa-rules.js", "changelog.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, "data", f), "utf8"), ctx, { filename: f });
  }
  return ctx;
})();

const STATUS_ORDER = ["idc", "vf", "eta", "ev", "voa", "vr", "ban"];
const STATUS_LABEL = {
  idc: "ID-card travel",
  vf: "Visa-free",
  eta: "Travel authorisation (online, before travel)",
  ev: "eVisa",
  voa: "Visa on arrival",
  vr: "Visa required (embassy or consulate)",
  ban: "Entry not permitted",
};

const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvLine = (arr) => arr.map(csvCell).join(",");
const countryName = (iso) => {
  DATA.ATLAS_LANG = "en";
  return (SNAPSHOT[iso] && SNAPSHOT[iso].name) || DATA.countryName(iso) || iso;
};

const destinations = DATA.COUNTRIES.filter((c) => c.continent !== "AN");
const passports = Object.keys(SNAPSHOT).sort();
const generated = DATA.SNAPSHOT_DATE || new Date().toISOString().slice(0, 10);

// Passport x destination, resolved like resolveAllRows() in generate-seo.js.
const matrixLines = [csvLine(["passport_iso2", "passport_name", "destination_iso2", "destination_name", "status", "days"])];
const matrixJson = {};
const counts = {};
let pairs = 0;
for (const p of passports) {
  const pname = countryName(p);
  const row = {};
  const tally = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
  for (const c of destinations) {
    if (c.iso2 === p) continue;
    const r = DATA.resolveStatus(p, c.iso2);
    if (!STATUS_ORDER.includes(r.status)) throw new Error(`unknown status ${r.status} for ${p}>${c.iso2}`);
    const days = r.days == null ? null : r.days;
    matrixLines.push(csvLine([p, pname, c.iso2, countryName(c.iso2), r.status, days]));
    row[c.iso2] = [r.status, days];
    tally[r.status]++;
    pairs++;
  }
  matrixJson[p] = row;
  counts[p] = tally;
}

// Ranking, same function the passport index uses.
const rankLines = [csvLine(["rank", "passport_iso2", "passport_name", "no_advance_visa_count", "easy_access_count", ...STATUS_ORDER.map((s) => s + "_count")])];
const ranked = passports.map((p) => ({ p, r: DATA.passportRank(p) })).filter((x) => x.r)
  .sort((a, b) => a.r.rank - b.r.rank || a.p.localeCompare(b.p));
for (const { p, r } of ranked) {
  rankLines.push(csvLine([r.rank, p, countryName(p), r.mobility, r.access, ...STATUS_ORDER.map((s) => counts[p][s])]));
}

// Changelog: one row per passport affected.
const changeLines = [csvLine(["date", "passport_iso2", "destination_iso2", "from", "to"])];
for (const e of DATA.CHANGELOG || []) {
  const a = e.affects || {};
  for (const p of a.passports || []) changeLines.push(csvLine([e.date, p, a.dest, e.statusFrom, e.statusTo]));
}

const json = {
  generated,
  source: "https://travelnow.info/open-data/",
  license: "CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)",
  statuses: STATUS_LABEL,
  passports: matrixJson,
};

fs.mkdirSync(OUT, { recursive: true });
const files = {
  "visa-matrix.csv": matrixLines.join("\n") + "\n",
  "visa-matrix.json": JSON.stringify(json),
  "passport-ranking.csv": rankLines.join("\n") + "\n",
  "changes.csv": changeLines.join("\n") + "\n",
};
const sizes = [];
for (const [name, body] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), body);
  sizes.push(`${name} ${(Buffer.byteLength(body) / 1024).toFixed(0)} KB`);
}
console.log(`open-data: ${passports.length} passports, ${pairs} pairs, ${changeLines.length - 1} changes (${generated}); ${sizes.join(", ")}`);
