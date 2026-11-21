#!/usr/bin/env node
// Daily accuracy audit (runs in .github/workflows/daily-refresh.yml; a failure opens a GitHub issue).
// Checks the data layer the site actually shows against the official lists encoded in
// data/visa-overrides.js and data/etias-rules.js, flags rules about to expire and official
// lists that have not been re-read for too long. One line per check; exit 1 on any FAIL.
//
//   node tools/audit-data.js
//
// When an official list changes, update it in the data file AND its date in OFFICIAL_LISTS here.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ["countries.js", "country-names.js", "passports.js", "visa-overrides.js", "visa-conditions.js",
                 "visa-fees.js", "etias-rules.js", "esta-rules.js", "changelog.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, "data", f), "utf8"), ctx, { filename: f });
}
const SNAP = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "passports-snapshot.json"), "utf8"));
const P = Object.keys(SNAP);
const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
const days = (iso) => Math.round((new Date(iso + "T00:00:00Z") - today) / 86400000);

let fails = 0, warns = 0;
const ok = (name, detail = "") => console.log(`ok    ${name}${detail ? ": " + detail : ""}`);
const fail = (name, detail) => { fails++; console.log(`FAIL  ${name}: ${detail}`); };
const warn = (name, detail) => { warns++; console.log(`WARN  ${name}: ${detail}`); };
const check = (name, bad, detail) => (bad.length ? fail(name, `${bad.length} ${detail}: ${bad.slice(0, 12).join(" ")}`) : ok(name));
const st = (p, d) => (ctx.resolveStatus(p, d) || {}).status;

// 1. Rules with an end date. Past the date: FAIL. Within 30 days: WARN.
const EXPIRING = [
  { what: "Korea K-ETA waiver (CA → KR override, data/visa-overrides.js)", ends: "2026-12-31" },
  { what: "China unilateral visa-free scheme (ENTRY_CAVEATS.CN note)", ends: "2026-12-31" },
];
for (const e of EXPIRING) {
  const d = days(e.ends);
  if (d < 0) fail("expiry", `${e.what} ended ${e.ends}; re-check the official source and update the data`);
  else if (d <= 30) warn("expiry", `${e.what} ends ${e.ends} (${d} days); check for an extension`);
  else ok("expiry", `${e.what} ends ${e.ends}`);
}

// 2. Official lists: re-read at least every 180 days (WARN), 365 days (FAIL).
const OFFICIAL_LISTS = [
  { what: "Schengen Annex II (Reg. 2018/1806)", checked: "2026-11-21", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02018R1806-20251230" },
  { what: "UK visa national list", checked: "2026-11-21", url: "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-visitor-visa-national-list" },
  { what: "US Visa Waiver Program countries", checked: "2026-11-21", url: "https://www.dhs.gov/visa-waiver-program" },
  { what: "Canada eTA list + select visa-required countries", checked: "2026-11-21", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/entry-requirements-country.html" },
  { what: "Australia ETA 601 + eVisitor 651 passports", checked: "2026-11-21", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601" },
  { what: "New Zealand visa waiver countries", checked: "2026-11-21", url: "https://www.immigration.govt.nz/visit/what-you-need-to-visit-new-zealand/visa-waiver-countries-and-territories/" },
  { what: "ETIAS status and fee", checked: "2026-11-21", url: "https://travel-europe.europa.eu/en/etias" },
  { what: "ESTA fee", checked: "2026-11-21", url: "https://www.cbp.gov/travel/international-visitors/esta" },
  { what: "Thailand exemption and VoA lists (MFA, 15 Sep 2026)", checked: "2026-11-21", url: "https://image.mfa.go.th/mfa/0/zE6021nSnu/0303/%E0%B8%9C.30.pdf" },
];
for (const l of OFFICIAL_LISTS) {
  const age = -days(l.checked);
  if (age > 365) fail("official list", `${l.what} last read ${l.checked} (${age} days ago): ${l.url}`);
  else if (age > 180) warn("official list", `${l.what} last read ${l.checked} (${age} days ago): ${l.url}`);
}
ok("official lists", `${OFFICIAL_LISTS.length} tracked`);

// 3. Invariants on what the map shows.
const EU = new Set(["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","CH"]);
{
  const bad = [];
  for (const p of P) {
    if (EU.has(p) || p === "NR") continue;
    for (const d of ctx.SCHENGEN_AREA) {
      const s = st(p, d), free = s === "vf" || s === "idc";
      if (s === "ban" || s === "self") continue;
      if (free !== ctx.SCHENGEN_ANNEX_II.has(p)) bad.push(`${p}>${d}:${s}`);
    }
  }
  check("schengen common list", bad, "pairs disagree with Annex II");
}
{
  const bad = [];
  for (const p of P) {
    for (const d of ["US", "CA", "AU", "NZ"]) if (p !== d && st(p, d) === "eta" && !ctx.ETA_ELIGIBLE[d].has(p)) bad.push(`${p}>${d}`);
    if (p !== "GB" && st(p, "GB") === "eta" && ctx.UK_VISA_NATIONALS.has(p)) bad.push(`${p}>GB`);
  }
  check("eta only for official lists", bad, "ETA shown for a passport not on the list");
}
{
  const a = [...ctx.ETIAS.affectedNationalities].sort().join(","), b = [...ctx.SCHENGEN_ANNEX_II].sort().join(",");
  check("etias list = annex II", a === b ? [] : ["lists differ"], "");
  if (ctx.ETIAS.launchDate && days(ctx.ETIAS.launchDate) < 0) warn("etias", `launchDate ${ctx.ETIAS.launchDate} has passed; confirm ETIAS really started and update the page copy`);
}
{
  const bad = [];
  for (const [p, t] of Object.entries(ctx.VISA_FEES || {})) for (const d of Object.keys(t)) {
    const e = ctx.visaFee(p, d);
    if (e && !e.verified) bad.push(`${p}>${d}`);
  }
  check("fees shown only when verified", bad, "unverified fees reachable");
}
{
  const R = { idc: 0, vf: 1, eta: 2, ev: 3, voa: 4, vr: 5, ban: 6 };
  const bad = [];
  for (const [p, t] of Object.entries(ctx.VISA_CONDITIONS)) for (const d of Object.keys(t)) {
    for (const row of ctx.visaCondition(p, d) || []) if ((R[row.then] ?? 9) >= (R[st(p, d)] ?? 9)) bad.push(`${p}>${d}`);
    for (const row of t[d]) if (!row.source) bad.push(`${p}>${d}:no source`);
  }
  check("conditions improve the shown status and cite a source", bad, "rows");
}
{
  const bad = [];
  for (const p of P) {
    if (p === "TH") continue;
    const r = ctx.resolveStatus(p, "TH"), e = ctx.TH_ENTRY[p];
    if (r.status === "ban") continue;
    if (e ? (r.status !== e.status || (r.days || null) !== e.days) : (r.status === "vf" || r.status === "voa" || r.status === "idc")) bad.push(`${p}:${r.status}/${r.days}`);
  }
  check("thailand matches the MFA lists", bad, "passports");
}
{
  const { reconcile, loadResolver } = require(path.join(ROOT, "backend", "changelog.js"));
  const n = ctx.CHANGELOG.length, m = reconcile(ctx.CHANGELOG, SNAP, loadResolver()).length;
  check("changelog matches the map", n === m ? [] : [`${n - m} broken`], "entries");
}

console.log(`${fails} failed, ${warns} warnings`);
process.exit(fails ? 1 : 0);
