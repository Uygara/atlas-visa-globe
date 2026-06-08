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
    cond: p.cond || null,   // optional: conditional shortcuts emitted by scraper
  };
  ["vf", "ev", "voa", "vr", "ban"].forEach(status => {
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

window._resolveStatusBase = function(passportIso2, destIso2) {
  if (passportIso2 === destIso2) return { status: "self", days: null };
  // Curated corrections (data/visa-overrides.js) win over scraped data — e.g.
  // nationalities ineligible for the Cuba e-visa that must use a consulate.
  const ov = window.STATUS_OVERRIDES && window.STATUS_OVERRIDES[passportIso2]
             && window.STATUS_OVERRIDES[passportIso2][destIso2];
  if (ov) return { status: ov.status, days: ov.days != null ? ov.days : null, note: ov.note || null };
  // Freedom of movement (EEA internal + UK–Ireland Common Travel Area): unlimited
  // stay, not a 90-day visa-free window. Surfaced as vf with no day cap + fom flag.
  if (window.isFreedomOfMovement && window.isFreedomOfMovement(passportIso2, destIso2))
    return { status: "vf", days: null, fom: true };
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

// Display reclassification: electronic travel authorizations (ESTA / eTA /
// NZeTA / UK ETA / eVisitor) are stored as `ev` by the scraper, but for those
// destinations the only electronic option IS an ETA — surface them as a distinct
// `eta` status (own colour + label). Keyed in data/visa-overrides.js so it can be
// curated without touching this file. resolveGroupStatus / tally / the globe all
// go through here, so they inherit the relabel.
window.resolveStatus = function(passportIso2, destIso2) {
  let r = window._resolveStatusBase(passportIso2, destIso2);
  if (window.applyEtaDisplay) r = window.applyEtaDisplay(r, destIso2);
  // ID-card travel (EEA / GCC / Mercosur / Western Balkans / TR bilaterals) — a
  // visa-free result becomes `idc` so "go on your ID card" gets its own colour.
  if (window.applyIdcDisplay) r = window.applyIdcDisplay(r, passportIso2, destIso2);
  // Destination floor (e.g. North Korea is visa-required for everyone) — corrects
  // strong passports that over-report visa-free for destinations missing from their
  // table. Applied last so it floors the final status.
  if (window.applyDestFloor) r = window.applyDestFloor(r, destIso2);
  return r;
};

window.tally = function(passportIso2) {
  const p = window.PASSPORTS[passportIso2];
  if (!p) return null;
  const counts = { idc: 0, vf: 0, eta: 0, ev: 0, voa: 0, vr: 0, ban: 0 };
  window.COUNTRIES.forEach(c => {
    if (c.iso2 === passportIso2) return;
    if (c.continent === "AN") return;
    const r = window.resolveStatus(passportIso2, c.iso2);
    if (counts[r.status] != null) counts[r.status]++;
  });
  return counts;
};

// Combine mode models ONE traveller who holds several passports. For each
// destination they may enter on whichever of their passports gives the best
// access, so the combined result is the BEST (least-restrictive) status across
// all held passports — holding more passports can only ever INCREASE access.
// (This previously returned the WORST case, which contradicted the on-site
// promise of "your best combined access" and confused reporters.) `via` reports
// which passport won so the UI can show "best via 🇬🇧".
const _ACCESS_RANK = { idc: 0, vf: 1, eta: 2, ev: 3, voa: 4, vr: 5, ban: 6 };
window.resolveGroupStatus = function(passports, destIso2) {
  if (!passports || passports.length === 0) return { status: "na", days: null };
  let best = null, bestRank = Infinity, via = null;
  for (const p of passports) {
    // Holding the destination's own passport ⇒ citizen of it ⇒ best possible.
    if (p === destIso2) return { status: "vf", days: null, fom: true, via: p };
    const r = window.resolveStatus(p, destIso2);
    const rank = _ACCESS_RANK[r.status];
    if (rank == null) continue;             // ignore na / self / unknown
    if (rank < bestRank) { bestRank = rank; best = r; via = p; }
  }
  if (!best) return { status: "na", days: null };
  return { status: best.status, days: best.days, fom: best.fom || false, note: best.note || null, via };
};

window.tallyGroup = function(passports) {
  if (!passports || passports.length === 0) return null;
  const counts = { idc: 0, vf: 0, eta: 0, ev: 0, voa: 0, vr: 0, ban: 0 };
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
  const counts = { idc: 0, vf: 0, eta: 0, ev: 0, voa: 0, vr: 0, ban: 0 };
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
