// This file is appended to the auto-generated RAW_PASSPORTS definition by the
// scraper. It contains the normalize + resolve logic that the frontend uses.
// Keep in sync with the manual data/passports.js if you change the schema.

window.PASSPORTS = {};
Object.entries(RAW_PASSPORTS).forEach(([iso2, p]) => {
  const norm = {
    iso2,
    name: p.name,
    rank: p.rank || null,
    default: p.default,
    defaultDays: p.defaultDays || null,
    map: {},
  };
  ["vf", "ev", "voa", "vr"].forEach(status => {
    (p[status] || []).forEach(entry => {
      let code, days = null;
      if (Array.isArray(entry)) { code = entry[0]; days = entry[1]; }
      else { code = entry; }
      norm.map[code] = { status, days };
    });
  });
  window.PASSPORTS[iso2] = norm;
});

// Dependent territories that have no Wikipedia "Visa requirements for X citizens"
// page of their own. For visa purposes they inherit the parent country's policy:
//   EH (Western Sahara)        → MA (Morocco — administers it)
//   GL (Greenland)             → DK (Danish kingdom; passport policy follows DK)
//   FK (Falkland Islands)      → GB (British overseas territory)
//   PR (Puerto Rico)           → US (US territory, US visa rules)
//   NC (New Caledonia)         → FR (French overseas territory)
//   PF (French Polynesia)      → FR
//   TF (French Southern Territories) → FR
// (AQ Antarctica is left as-is; no normal visa policy applies.)
window.TERRITORY_ALIAS = {
  EH: "MA", GL: "DK", FK: "GB", PR: "US",
  NC: "FR", PF: "FR", TF: "FR",
};

window.resolveStatus = function(passportIso2, destIso2) {
  if (passportIso2 === destIso2) return { status: "self", days: null };
  // If the destination is a dependent territory, look up its parent's status instead.
  const aliased = window.TERRITORY_ALIAS && window.TERRITORY_ALIAS[destIso2];
  if (aliased && aliased !== passportIso2) destIso2 = aliased;
  let p = window.PASSPORTS[passportIso2];
  if (!p) return { status: "na", days: null };
  let hops = 0;
  while (p && p.templated && p.template && hops++ < 5) {
    const base = window.PASSPORTS[p.template];
    if (!base) return { status: "na", days: null };
    p = base;
  }
  if (!p) return { status: "na", days: null };
  if (p.map && p.map[destIso2]) return p.map[destIso2];
  if (p.default === "vf") return { status: "vf", days: p.defaultDays };
  return { status: p.default || "na", days: null };
};

window.tally = function(passportIso2) {
  const p = window.PASSPORTS[passportIso2];
  if (!p) return null;
  const counts = { vf: 0, ev: 0, voa: 0, vr: 0 };
  window.COUNTRIES.forEach(c => {
    if (c.iso2 === passportIso2) return;
    if (c.continent === "AN") return;
    const r = window.resolveStatus(passportIso2, c.iso2);
    if (counts[r.status] != null) counts[r.status]++;
  });
  return counts;
};

const _GROUP_ORDER = { self: 0, vf: 0, ev: 1, voa: 2, vr: 3, na: 0 };
window.resolveGroupStatus = function(passports, destIso2) {
  if (!passports || passports.length === 0) return { status: "na", days: null };
  let worst = 0, days = null;
  for (const p of passports) {
    const r = window.resolveStatus(p, destIso2);
    const score = _GROUP_ORDER[r.status] ?? 0;
    if (score > worst) { worst = score; days = r.days; }
    if (worst === 3) break;
  }
  const status = ["vf", "ev", "voa", "vr"][worst] || "vf";
  return { status, days };
};

window.tallyGroup = function(passports) {
  if (!passports || passports.length === 0) return null;
  const counts = { vf: 0, ev: 0, voa: 0, vr: 0 };
  const own = new Set(passports);
  window.COUNTRIES.forEach(c => {
    if (own.has(c.iso2)) return;
    if (c.continent === "AN") return;
    const r = window.resolveGroupStatus(passports, c.iso2);
    if (counts[r.status] != null) counts[r.status]++;
  });
  return counts;
};

window.tallyIncoming = function(myIso2) {
  if (!window.PASSPORTS[myIso2]) return null;
  const counts = { vf: 0, ev: 0, voa: 0, vr: 0 };
  window.COUNTRIES.forEach(c => {
    if (c.iso2 === myIso2) return;
    if (c.continent === "AN") return;
    const r = window.resolveStatus(c.iso2, myIso2);
    if (counts[r.status] != null) counts[r.status]++;
  });
  return counts;
};

window.PASSPORT_LIST = Object.values(window.PASSPORTS)
  .sort((a, b) => a.name.localeCompare(b.name));
