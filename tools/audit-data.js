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
                 "visa-fees.js", "etias-rules.js", "esta-rules.js", "changelog.js", "official-sources.js",
                 "transit-visa-data.js", "transit-visa-rules.js"]) {
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
  { what: "North Macedonia visa-or-permit holder entry (_PERMIT_GLOBAL_UPGRADES MK rows)", ends: "2026-12-31" },
  { what: "Ireland Short Stay Visa Waiver Programme (IE rows in data/visa-conditions.js)", ends: "2026-12-31" },
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
  // Hand-curated datasets: update `checked` here (and the date shown on the page) after each review.
  { what: "Citizenship by investment (data/citizenship-by-investment.js, /citizenship-by-investment/)", checked: "2026-11-21", url: "data/citizenship-by-investment.js" },
  { what: "Digital nomad visas (data/digital-nomad-visas.js, /digital-nomad-visa/)", checked: "2026-05-22", url: "data/digital-nomad-visas.js" },
  { what: "Passport validity rules (data/passport-validity-rules.js, /passport-validity/)", checked: "2026-11-21", url: "data/passport-validity-rules.js" },
  { what: "Turkish Schengen visa checklist (data/visa-checklists.js)", checked: "2026-11-21", url: "/visa-checklist/tr-schengen/" },
  { what: "Transit hubs other than Schengen/UK (data/transit-visa-rules.js)", checked: "2026-11-21", url: "data/transit-visa-rules.js" },
  { what: "Schengen airport transit visa common list and exemptions (Visa Code Annex IV, Art. 3)", checked: "2026-11-27", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02009R0810-20200202" },
  { what: "Schengen national airport transit visa lists (Visa Code Handbook Annex 7B, SCHENGEN_NATIONAL_ATV)", checked: ctx.SCHENGEN_NATIONAL_ATV.checked, url: ctx.SCHENGEN_NATIONAL_ATV.source },
  { what: "UK DATV exemptions (Transit Visa Order 2014, art. 4)", checked: "2026-11-27", url: "https://www.legislation.gov.uk/uksi/2014/2702/article/4" },
  { what: "Turkish MFA visa list for Turkish citizens (TR_MFA_ROWS)", checked: "2026-11-27", url: ctx.TR_MFA_SOURCE },
  { what: "Ireland transit visa list", checked: "2026-11-27", url: "https://www.irishimmigration.ie/at-the-border/transit-including-transfer-visa-advice/" },
  { what: "Australia transit without visa list", checked: "2026-11-27", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/transit-771/travellers-eligible-to-transit-without-visa" },
  { what: "New Zealand transit visa waiver list", checked: "2026-11-27", url: "https://www.immigration.govt.nz/visit/transiting-through-new-zealand/transit-visa-waiver-countries-and-territories/" },
  { what: "Singapore transit rule (ICA)", checked: "2026-11-27", url: "https://www.ica.gov.sg/enter-transit-depart/transiting-singapore" },
  { what: "Invitation-letter rules (data/loi-required.js)", checked: "2026-11-21", url: "data/loi-required.js" },
  { what: "Residence-permit upgrades (_PERMIT_GLOBAL_UPGRADES in data/visa-overrides.js)", checked: "2026-11-27", url: "data/visa-overrides.js" },
  { what: "Greenland entry for Schengen residence-permit holders (Danish Immigration Service)", checked: "2026-11-27", url: "https://www.nyidanmark.dk/en-GB/You-want-to-apply/short-stay-visa/Visa-to-the-Faroe-Island-or-Greenland" },
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
  // Residence permits: known answers from official sources, re-checked on every run.
  const withPermit = (p, d, permits) => {
    ctx.ATLAS_RESIDENCE_PERMITS = permits;
    try { return (ctx.resolveStatus(p, d) || {}).status; } finally { ctx.ATLAS_RESIDENCE_PERMITS = []; }
  };
  const CASES = [
    // [passport, dest, permits, expected status, why]
    ["TR", "GL", ["SCHENGEN"], "vf", "Schengen permit opens Greenland since 20 Mar 2026"],
    ["TR", "GL", [], "vr", "Turkish passport alone needs a Greenland visa"],
    ["TR", "DE", ["SCHENGEN"], "vf", "Schengen permit inside Schengen"],
    ["TR", "IE", ["SCHENGEN"], "vr", "Ireland is outside Schengen"],
    ["TR", "CY", ["SCHENGEN"], "vr", "Cyprus is outside Schengen"],
    ["TR", "ME", ["SCHENGEN"], "vf", "Montenegro accepts Schengen visas and permits"],
    ["TR", "ME", ["GCC"], "vr", "Montenegro does not list GCC permits"],
    ["TR", "MX", ["SCHENGEN"], "ev", "Mexico takes only PERMANENT Schengen permits: caveat, no repaint"],
    ["IN", "XK", ["US"], "vr", "Kosovo accepts only Schengen documents"],
    ["IN", "XK", ["SCHENGEN"], "vf", "Kosovo accepts Schengen documents"],
    ["IN", "AL", ["CA"], "ev", "Albania does not list Canada"],
    ["TR", "AE", ["GCC-AE"], "vf", "UAE permit: home state"],
    ["TR", "OM", ["GCC-AE"], ctx.resolveStatus("TR", "OM").status, "Oman: no general GCC-resident rule"],
    ["IN", "SA", ["GCC-AE"], "ev", "Saudi e-visa for GCC residents"],
    ["IN", "KW", ["GCC-AE"], "voa", "Kuwait VoA for GCC residents since Aug 2025"],
    ["IR", "BH", ["GCC-AE"], ctx.resolveStatus("IR", "BH").status, "Bahrain excludes Iranians"],
    ["IN", "AE", ["GCC"], ctx.resolveStatus("IN", "AE").status, "GCC without a chosen state: no home"],
    ["PK", "GE", ["SCHENGEN"], "vf", "Georgia accepts EU/EFTA documents"],
    ["XK", "GE", ["US"], ctx.resolveStatus("XK", "GE").status, "Georgia refuses Kosovo passports"],
    ["IN", "CO", ["US"], "vf", "Colombia list includes India"],
    ["PK", "CO", ["US"], ctx.resolveStatus("PK", "CO").status, "Colombia list excludes Pakistan"],
    ["TR", "IE", ["GB"], "vr", "Irish waiver needs a UK C visa: card only, no repaint"],
  ];
  const bad = CASES.filter(([p, d, h, want]) => withPermit(p, d, h) !== want)
    .map(([p, d, h, want, why]) => `${p}>${d}+${h.join("/") || "none"}=${withPermit(p, d, h)} (want ${want}: ${why})`);
  check("residence-permit answers", bad, "wrong");
  const STATUSES = new Set(["vf", "eta", "ev", "voa"]), badRows = [];
  for (const [bloc, m] of Object.entries(ctx._PERMIT_GLOBAL_UPGRADES || {}))
    for (const [d, r] of Object.entries(m)) if (!STATUSES.has(r.status) || !ctx.byIso2[d]) badRows.push(`${bloc}>${d}`);
  check("permit table rows valid", badRows, "rows");
}
{
  // Airport transit: known answers from the official lists, re-checked on every run.
  const CASES = [
    // [passport, transit country, expected status, why]
    ["TR", "DE", "atv", "Annex 7B: Germany lists Turkey"],
    ["TR", "NL", "atv", "Annex 7B: Netherlands lists Turkey"],
    ["TR", "FR", "atv", "Annex 7B: France lists Turkey"],
    ["TR", "BE", "atv", "Annex 7B: Belgium lists Turkey"],
    ["TR", "ES", "atv", "Annex 7B: Spain lists Turkey"],
    ["TR", "CZ", "atv", "Annex 7B: Czechia lists Turkey"],
    ["TR", "CH", "atv", "Annex 7B: Switzerland lists Turkey"],
    ["TR", "NO", "atv", "Annex 7B: Norway lists Turkey"],
    ["TR", "IT", "free", "Italy has no ATV for Turkish citizens"],
    ["TR", "AT", "free", "Austria has no ATV for Turkish citizens"],
    ["TR", "GR", "free", "Greece has no ATV for Turkish citizens"],
    ["TR", "GB", "atv", "UK DATV list (Transit Visa Order 2014, Schedule 1) includes Turkey"],
    ["TR", "US", "vr", "US has no airside transit; Turkish citizens need a visa"],
    ["DE", "US", "auth", "Visa Waiver passports need ESTA"],
    ["US", "DE", "free", "Visa-free into Schengen"],
    ["PK", "IT", "atv", "Pakistan is on the EU-wide list (Annex IV)"],
    ["SY", "DE", "atv", "Annex 7B: Germany lists Syria"],
    ["SY", "PT", "free", "Syria is not on the EU-wide list; Portugal has no national ATV for it"],
    ["IN", "CZ", "atv", "Annex 7B: Czechia lists India"],
    ["IN", "DE", "free", "Germany dropped India from its list"],
    ["RU", "FR", "atv", "Annex 7B: France lists Russia (conditional)"],
    ["EG", "ES", "atv", "Annex 7B: Spain lists Egypt"],
    ["TR", "IE", "twov", "Dublin: no transit visa for Turkey, but only via Terminal 2, 04:00 to 20:00"],
    ["ZA", "IE", "atv", "Ireland's transit visa list includes South Africa"],
    ["TR", "AU", "atv", "Australia: Turkey is not on the transit-without-visa list"],
    ["DE", "AU", "twov", "Australia: Germany may transit without a visa for 8 hours"],
    ["TR", "NZ", "atv", "New Zealand: Turkey is not a (transit) visa waiver country"],
    ["DE", "NZ", "auth", "New Zealand: visa waiver passports transit with an NZeTA"],
    ["CN", "NZ", "auth", "New Zealand: China is on the transit visa waiver list"],
    ["TR", "SG", "free", "Singapore: no specific requirements to transit airside"],
    ["DE", "PR", "auth", "Puerto Rico follows the US rule"],
  ];
  const bad = CASES.filter(([p, d, want]) => (ctx.transitStatusForGlobe(p, d) || {}).status !== want)
    .map(([p, d, want, why]) => `${p}>${d}=${(ctx.transitStatusForGlobe(p, d) || {}).status} (want ${want}: ${why})`);
  check("airport transit answers", bad, "wrong");
  // Turkish passport: rows taken from the Turkish MFA list (TR_MFA_ROWS in data/visa-overrides.js) and two
  // rows that already matched it. vf may show as idc where an ID-card agreement exists.
  const trWant = { ...ctx.TR_MFA_ROWS, RU: { status: "ev", days: 30 }, TH: { status: "vf", days: 30 } };
  const trBad = Object.entries(trWant).filter(([d, w]) => {
    const r = ctx.resolveStatus("TR", d) || {};
    const st = r.status === "idc" ? "vf" : r.status;
    return st !== w.status || (w.days != null && r.days !== w.days);
  }).map(([d, w]) => `TR>${d}=${(ctx.resolveStatus("TR", d) || {}).status}/${(ctx.resolveStatus("TR", d) || {}).days} (want ${w.status}/${w.days})`);
  check("turkish passport answers (MFA list)", trBad, "wrong");
  const ANNEX_IV = "AF BD CD ER ET GH IR IQ NG PK SO LK";
  const common = (ctx.TRANSIT_RULES.SCHENGEN.requiredFor || []).slice().sort().join(" ");
  check("Schengen ATV common list = Visa Code Annex IV", common === ANNEX_IV.split(" ").sort().join(" ") ? [] : [common], "differs");
  const S = new Set(ctx.ETIAS.schengenStates), badStates = [];
  for (const [n, list] of Object.entries(ctx.SCHENGEN_NATIONAL_ATV.byNationality))
    for (const st of list) if (!S.has(st) || !ctx.byIso2[n]) badStates.push(`${n}>${st}`);
  check("national ATV rows valid", badStates, "rows");
}
{
  const { reconcile, loadResolver } = require(path.join(ROOT, "backend", "changelog.js"));
  const n = ctx.CHANGELOG.length, m = reconcile(ctx.CHANGELOG, SNAP, loadResolver()).length;
  check("changelog matches the map", n === m ? [] : [`${n - m} broken`], "entries");
}

{
  // Official application facts (data/official-sources.js): every entry names an https page and the
  // date it was read; fee rows that feed structured data carry a number and an ISO currency.
  const KINDS = new Set(["fee", "processing", "stay", "validity", "note"]), bad = [], stale = [];
  for (const [d, e] of Object.entries(ctx.OFFICIAL_SOURCES || {})) {
    if (!ctx.byIso2[d] && d !== "SCHENGEN") bad.push(`${d}: unknown country`);
    if (!e.portal || !/^https:\/\//.test(e.portal.url || "") || !e.portal.name) bad.push(`${d}: portal`);
    if (!/^https:\/\//.test(e.source || "")) bad.push(`${d}: source`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.checked || "") || days(e.checked) > 0) bad.push(`${d}: checked date`);
    else if (days(e.checked) < -120) stale.push(`${d} read ${e.checked}`);
    if (!Array.isArray(e.rows) || !e.rows.length) bad.push(`${d}: no rows`);
    for (const r of e.rows || []) {
      if (!KINDS.has(r.k) || !r.en || !r.tr) bad.push(`${d}: row ${r.k}`);
      if (r.price != null && (!(r.price > 0) || !/^[A-Z]{3}$/.test(r.cur || ""))) bad.push(`${d}: price ${r.price} ${r.cur}`);
      if (/[\u2013\u2014]/.test((r.en || "") + (r.tr || "")) && !/\d\u2013\d/.test(r.en + r.tr)) bad.push(`${d}: dash in copy`);
    }
  }
  check("official sources well formed", bad, "problems");
  if (stale.length) warn("official sources older than 120 days, read the page again", stale.join(", "));
  else ok("official sources fresh", `${Object.keys(ctx.OFFICIAL_SOURCES || {}).length} destinations`);
}
// Official links still answer (CI only: the daily workflow has open network; local runs skip it).
// Many government sites answer bots with 403/429 or a challenge page, so only a 404/410 or a dead
// host counts as broken, and even that is a warning: the entry must be read again by hand.
(async () => {
  if (process.env.CI) {
    const urls = new Set();
    for (const e of Object.values(ctx.OFFICIAL_SOURCES || {})) { urls.add(e.portal.url); urls.add(e.source); }
    const dead = [];
    for (const u of urls) {
      try {
        const r = await fetch(u, { redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "user-agent": "Mozilla/5.0 (travelnow.info link check)" } });
        if (r.status === 404 || r.status === 410) dead.push(`${u} (${r.status})`);
      } catch (err) { dead.push(`${u} (${err.cause?.code || err.name})`); }
    }
    if (dead.length) warn("official links not answering", dead.join(" "));
    else ok("official links answer", `${urls.size} urls`);
  }
  console.log(`${fails} failed, ${warns} warnings`);
  process.exit(fails ? 1 : 0);
})();
