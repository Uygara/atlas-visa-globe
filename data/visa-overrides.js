// Curated corrections layer — consulted by resolveStatus (backend/frontend-tail.js)
// BEFORE the scraped data, so these survive the daily re-scrape (which only
// rewrites passports.js). Add ONLY entries backed by an authoritative source —
// never invent visa data.

// ───────────────────────────────────────────────────────────────────────────
// 1) Per-pair status overrides.  STATUS_OVERRIDES[passportIso2][destIso2] = { status, days }
//
// Cuba e-visa (tarjeta del turista): a fixed list of nationalities is INELIGIBLE
// for the online e-visa and must apply in person at a Cuban embassy/consulate
// (= visa required). Wikipedia lists Cuba as "eVisa" for these passports, which
// is misleading. Source: https://cubavisa.uk/countries-that-need-to-apply-directly
// (the list is set by the Cuban government and applies to all e-visa providers;
// confirmed by the reporter against the official https://evisacuba.cu portal).
const CUBA_EVISA_INELIGIBLE = [
  "AF", // Afghanistan
  "DZ", // Algeria
  "BD", // Bangladesh
  "CM", // Cameroon
  "ER", // Eritrea
  "ET", // Ethiopia
  "GH", // Ghana
  "GN", // Guinea
  "HT", // Haiti
  "IR", // Iran
  "IQ", // Iraq
  "KE", // Kenya
  "NP", // Nepal
  "NG", // Nigeria
  "PK", // Pakistan
  "PH", // Philippines
  "SL", // Sierra Leone
  "SO", // Somalia
  "LK", // Sri Lanka
  "SY", // Syria
  "UZ", // Uzbekistan
  "YE", // Yemen
];

window.STATUS_OVERRIDES = window.STATUS_OVERRIDES || {};
CUBA_EVISA_INELIGIBLE.forEach((pp) => {
  (window.STATUS_OVERRIDES[pp] = window.STATUS_OVERRIDES[pp] || {})["CU"] = { status: "vr", days: null };
});

// South Korea waived its K-ETA for many nationalities (incl. Canada, the US, the
// EU, UK, Japan, Australia, …) through 31 Dec 2026 — during the waiver they enter
// visa-free. Wikipedia still lists Canada under "ETA", which is why CA→KR read
// eVisa while US→KR read visa-free. Align Canada to the current reality.
(window.STATUS_OVERRIDES["CA"] = window.STATUS_OVERRIDES["CA"] || {})["KR"] = {
  status: "vf", days: 90,
  note: "K-ETA requirement temporarily waived through 31 Dec 2026 — visa-free for now.",
};

// Israeli passport — states with no diplomatic relations with Israel that refuse
// Israeli passport holders entry outright. Wikipedia's "Visa requirements for
// Israeli citizens" marks these "Travel illegal under Israeli law" — origin-side
// phrasing the scraper classifies as null (skips) — but the well-documented,
// PRACTICAL reality is mutual: these countries do not admit an Israeli passport at
// all, so the answer to "can I enter?" is no. Marked `ban` (no entry allowed).
// Deliberately NOT applied to "Admission restricted" destinations (Malaysia,
// Pakistan, Saudi Arabia): the source distinguishes them, and they permit
// case-by-case entry with special permission, so those correctly stay `vr`.
// (Also distinct from origin-only *temporary* travel advisories — e.g. South Korea
// → war zones — which we leave as the destination's real visa status.)
// Source: https://en.wikipedia.org/wiki/Visa_requirements_for_Israeli_citizens (verified 2026-06-06).
const ISRAEL_NO_ENTRY = ["IR", "IQ", "LB", "SY", "YE"];
ISRAEL_NO_ENTRY.forEach((dest) => {
  (window.STATUS_OVERRIDES["IL"] = window.STATUS_OVERRIDES["IL"] || {})[dest] = { status: "ban", days: null };
});

// ───────────────────────────────────────────────────────────────────────────
// 2) Freedom of movement.  Within the EEA (EU + Iceland / Liechtenstein /
// Norway) plus Switzerland, and inside the UK–Ireland Common Travel Area,
// citizens may live, work and stay indefinitely — this is NOT a time-boxed
// "visa-free 90 days" stay. We still surface it as visa-free (it's the best
// possible access) but with no day cap and an `fom` flag so the UI can label it
// "Freedom of movement" instead of inventing a 90-day limit.
const FOM_EEA = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE", // EU 27
  "IS","LI","NO", // EEA non-EU
  "CH",            // Switzerland (bilateral FoM with the EU/EEA)
]);
const CTA = new Set(["GB", "IE"]); // UK–Ireland Common Travel Area

window.isFreedomOfMovement = function (passportIso2, destIso2) {
  if (!passportIso2 || passportIso2 === destIso2) return false;
  if (FOM_EEA.has(passportIso2) && FOM_EEA.has(destIso2)) return true;
  if (CTA.has(passportIso2) && CTA.has(destIso2)) return true;
  return false;
};

// ───────────────────────────────────────────────────────────────────────────
// 2b) ID-card travel. Some travellers don't even need a passport — a national
// identity card is enough. Wikipedia's status column rarely encodes this (it
// just says "Visa not required" / "Freedom of movement"), so it's curated here
// from the relevant agreements. We surface these as a distinct `idc` status (own
// colour + label) because "you can go on your ID card" is materially easier than
// ordinary visa-free. Sourced blocs:
//   • EEA + Switzerland — EU/EEA citizens travel internally on a national ID card.
//   • GCC (Gulf) — citizens of the six states travel between them on an ID card.
//   • Mercosur — member/associate citizens travel internally on a national ID doc.
//   • Western Balkans — mutual ID-card travel (bilateral agreements / Open Balkan).
//   • Bilateral: Türkiye ↔ Georgia / Ukraine / Northern Cyprus (ID-card agreements).
const IDC_GCC      = new Set(["BH", "KW", "OM", "QA", "SA", "AE"]);
const IDC_MERCOSUR = new Set(["AR", "BO", "BR", "CL", "CO", "EC", "PY", "PE", "UY"]);
const IDC_BALKANS  = new Set(["AL", "BA", "XK", "ME", "MK", "RS"]);
const IDC_BILATERAL = new Set(["TR>GE", "GE>TR", "TR>UA", "UA>TR", "TR>XN", "XN>TR"]);
window.isIdCardTravel = function (passportIso2, destIso2) {
  if (!passportIso2 || passportIso2 === destIso2) return false;
  if (FOM_EEA.has(passportIso2) && FOM_EEA.has(destIso2)) return true; // EEA + CH internal
  if (IDC_GCC.has(passportIso2) && IDC_GCC.has(destIso2)) return true;
  if (IDC_MERCOSUR.has(passportIso2) && IDC_MERCOSUR.has(destIso2)) return true;
  if (IDC_BALKANS.has(passportIso2) && IDC_BALKANS.has(destIso2)) return true;
  return IDC_BILATERAL.has(passportIso2 + ">" + destIso2);
};
// Upgrade a visa-free result to `idc` when ID-card travel applies. Only ever
// upgrades `vf` (the easiest tier) — never overrides eVisa/VoA/visa-required, so
// if a bloc member still needs a visa for a particular partner, the scraped data
// wins. Keeps any `fom` flag so the EEA detail card can still say "no time limit".
window.applyIdcDisplay = function (r, passportIso2, destIso2) {
  if (!r || r.status !== "vf") return r;
  if (window.isIdCardTravel(passportIso2, destIso2)) return { ...r, status: "idc" };
  return r;
};

// ───────────────────────────────────────────────────────────────────────────
// 3) Entry-mode caveats. Our status answers "do I need a visa", but for some
// destinations the answer depends on HOW you arrive (air vs land/sea), or the
// permission is time-limited. These are surfaced as a small caveat line in the
// detail card. Keyed by destination ISO2; `whenStatus` limits the note to the
// statuses it actually applies to (omit = always). Sourced, not invented.
window.ENTRY_CAVEATS = {
  IN: { whenStatus: ["ev"],
        note: "Hindistan e-Vizesi yalnızca belirli hava/deniz limanlarından girişte geçerli — kara sınırlarında (ör. Attari–Wagah) etiket vize gerekir.",
        noteEn: "India's eVisa is valid only at designated airports/seaports — land borders (e.g. Attari–Wagah) require a sticker visa." },
  RU: { whenStatus: ["vf", "ev"],
        note: "Bazı vizesiz / e-vize girişleri yalnızca belirli havalimanlarıyla sınırlıdır.",
        noteEn: "Some visa-free / e-visa entries are limited to specific airports only." },
  CA: { whenStatus: ["ev"],
        note: "eTA yalnızca hava yoluyla girişte gerekir; ABD'den kara/deniz yoluyla girişte gerekmez.",
        noteEn: "The eTA is needed for air arrivals only; entering by land/sea from the US doesn't require it." },
  ZA: { whenStatus: ["ev"],
        note: "Güney Afrika e-Vizesi yalnızca havalimanından girişte geçerlidir.",
        noteEn: "South Africa's e-Visa is valid for entry via airports only." },
  CN: { whenStatus: ["vf"],
        note: "Vizesiz giriş geçici bir uygulamadır — şu an 31 Aralık 2026'ya kadar yürürlükte.",
        noteEn: "Visa-free entry is a temporary scheme, currently in effect through 31 Dec 2026." },
};

// Return the caveat note for a (destination, status) pair, or null. Language-aware.
window.entryCaveat = function (destIso2, status) {
  const c = window.ENTRY_CAVEATS[destIso2];
  if (!c) return null;
  if (c.whenStatus && status && c.whenStatus.indexOf(status) === -1) return null;
  const lang = window.ATLAS_LANG || "en";
  return lang === "tr" ? (c.note || c.noteEn) : (c.noteEn || c.note);
};

// ───────────────────────────────────────────────────────────────────────────
// 4) Electronic Travel Authorization (ETA) display bucket. The scraper stores
// ESTA (US), eTA (Canada), eVisitor/ETA (Australia), NZeTA (New Zealand) and the
// UK ETA as `ev` (eVisa). But an ETA is lighter than a full eVisa — a quick
// online pre-authorization, not a consular application — and reporters rightly
// noted it shouldn't read as "eVisa" (let alone "visa-free"). For each of these
// destinations the ONLY electronic option IS an ETA, so any `ev` result to them
// is reclassified to a distinct `eta` status (own colour + label). This is a
// pure DISPLAY relabel keyed on the destination — no re-scrape, no invented data:
// the scraper already determined WHICH passports get the electronic option.
window.ETA_DESTS = { US: 1, CA: 1, AU: 1, NZ: 1, GB: 1 };
window.applyEtaDisplay = function (r, destIso2) {
  if (!r || r.status !== "ev") return r;
  const d = (window.TERRITORY_ALIAS && window.TERRITORY_ALIAS[destIso2]) || destIso2;
  if (window.ETA_DESTS[d] || window.ETA_DESTS[destIso2]) return { ...r, status: "eta" };
  return r;
};

// ───────────────────────────────────────────────────────────────────────────
// 5) Destination "visa floor". The compact data only lists a passport's
// EXCEPTIONS; everything else inherits that passport's default. For a strong
// passport whose default is `vf`, a destination missing from its Wikipedia table
// then wrongly reads visa-free. North Korea is the textbook case — its table
// omits some nationalities, so e.g. Israel (default vf) resolved IL→North Korea
// as "visa-free", which a reporter correctly flagged. In reality NO nationality
// enters North Korea visa-free: every foreign visitor needs a DPRK visa arranged
// through an approved tour. So floor it to visa-required whenever the resolved
// status is anything easier. Source: Visa policy of North Korea (no visa-exempt
// nationalities). Add a destination here ONLY when it's truly visa-required for all.
//
// AQ (Antarctica): no nationality enters visa-free. Visitors from Antarctic
// Treaty parties need a permit from their own government (US: NSF, UK: FCDO,
// AU: AAD, etc.); visitors from non-parties need authorisation from a Treaty
// state. Strong passports (default `vf`) were wrongly reading "visa-free" for
// AQ because the Wikipedia tables don't list it. Floor it to `vr`. tally* still
// excludes AQ (continent === "AN") so it doesn't pad anyone's score; this is
// purely a globe-paint correctness fix. Source: Visa policy of Antarctica
// (Wikipedia) — Antarctic Treaty Article VII, every visit needs prior permit.
window.VISA_REQUIRED_DESTS = { KP: 1, AQ: 1 };
const _FLOOR_EASY = { idc: 1, vf: 1, eta: 1, ev: 1, voa: 1 };
window.applyDestFloor = function (r, destIso2) {
  if (!r || r.status === "self") return r;
  if (window.VISA_REQUIRED_DESTS[destIso2] && _FLOOR_EASY[r.status]) {
    return { status: "vr", days: null };
  }
  return r;
};

// ───────────────────────────────────────────────────────────────────────────
// 6) Residence-permit / second-document upgrades. A traveller who *also* holds
// a Schengen residence permit / US Green Card / UK ILR / Canadian or
// Australian PR / GCC residence often qualifies for an easier status to many
// destinations (e.g. an Indian passport holder with a Schengen residence gets
// visa-free or eVisa to many places). The per-destination upgrade paths are
// already encoded in `data/visa-conditions.js` (used by the detail card). This
// layer applies the SAME rules across the whole map when the user activates
// permits via the panel picker — repainting the globe instead of only showing
// callouts inside one country's detail card.
//
// Source of truth: visa-conditions.js (hand-curated against the destination's
// official "Visa policy of <country>" page). The 6 blocs we expose are the
// ones that appear in real-world bilateral rules; per-country permits are too
// rare and too varied to surface as separate UI options without diluting the
// list.
//
// Activation: `window.ATLAS_RESIDENCE_PERMITS = ["SCHENGEN", "US", ...]` (Set
// or Array). The picker in panel.jsx writes this; resolveStatus consults it.
window.RESIDENCE_PERMIT_BLOCS = ["SCHENGEN", "US", "GB", "CA", "AU", "GCC"];
// GCC expands to its six member states for `ifHolds` matching (visa-conditions
// stores GCC rules per-member).
const _GCC_MEMBERS = ["AE", "SA", "KW", "QA", "BH", "OM"];
// Schengen Area as of 2025: 29 states. NOT the same as EEA (no IE, no CY).
const _SCHENGEN_AREA = new Set([
  "AT","BE","BG","HR","CZ","DK","EE","FI","FR","DE","GR","HU","IT","LV","LT",
  "LU","MT","NL","PL","PT","RO","SK","SI","ES","SE", // EU members in Schengen
  "IS","LI","NO","CH",                                // EFTA Schengen members
]);

const _ACCESS_BETTER = { idc: 0, vf: 1, eta: 2, ev: 3, voa: 4, vr: 5, ban: 6 };

// Global "any-passport" permit upgrades. visa-conditions.js encodes per-passport
// shortcuts (IN→TR ev if you hold US/GB/SCHENGEN, etc.) but those entries are
// thin for some blocs — only 8 CA, 6 AU, 0 GCC rules exist. So toggling a CA or
// AU permit visibly does nothing for most users. This table fixes that by
// listing destinations whose published visa policy says "holders of a valid
// {US/GB/CA/AU/SCHENGEN/GCC} visa or residence enter visa-free (or eVisa) —
// regardless of nationality." Every entry is sourced against the destination's
// "Visa policy of X" Wikipedia article. We deliberately keep this conservative;
// the per-passport rules in visa-conditions.js still override when present.
//
// Shape: bloc → destIso2 → { status, days }
// Schengen is omitted here because the dedicated 29-state Schengen-Area
// block above already handles internal Schengen-permit travel.
window._PERMIT_GLOBAL_UPGRADES = {
  // US visa or Green Card. Sources: Wikipedia "Visa policy of <country>".
  US: {
    MX: { status: "vf", days: 180 },   // Mexico — any valid US visa.
    BS: { status: "vf", days: 90 },    // Bahamas.
    BZ: { status: "vf", days: 30 },    // Belize.
    CR: { status: "vf", days: 30 },    // Costa Rica (with valid US/CA/SCHENGEN/UK visa).
    PA: { status: "vf", days: 180 },   // Panama.
    DO: { status: "vf", days: 30 },    // Dominican Republic.
    SV: { status: "vf", days: 90 },    // El Salvador (CA-4).
    HN: { status: "vf", days: 90 },    // Honduras.
    NI: { status: "vf", days: 90 },    // Nicaragua.
    CO: { status: "vf", days: 90 },    // Colombia.
    PE: { status: "vf", days: 180 },   // Peru.
    GT: { status: "vf", days: 90 },    // Guatemala.
    GE: { status: "vf", days: 90 },    // Georgia — any valid Schengen/US/UK/etc.
    BA: { status: "vf", days: 30 },    // Bosnia & Herzegovina.
    AL: { status: "vf", days: 90 },    // Albania.
    ME: { status: "vf", days: 30 },    // Montenegro.
    MK: { status: "vf", days: 15 },    // North Macedonia.
    RS: { status: "vf", days: 90 },    // Serbia.
    XK: { status: "vf", days: 15 },    // Kosovo.
    MD: { status: "vf", days: 90 },    // Moldova.
    PH: { status: "vf", days: 14 },    // Philippines (US visa exempts visa).
    TW: { status: "vf", days: 30 },    // Taiwan (valid US/UK/CA/EU/JP visa).
    OM: { status: "vf", days: 14 },    // Oman.
    QA: { status: "ev", days: 30 },    // Qatar — eVisa-on-arrival with US visa.
    TR: { status: "ev", days: 30 },    // Türkiye — Stamp/eVisa available with US visa.
  },
  // UK visa or ILR — substantially overlaps with the US set in the Western
  // Balkans / Caucasus / Caribbean.
  GB: {
    GE: { status: "vf", days: 90 },
    BA: { status: "vf", days: 30 },
    AL: { status: "vf", days: 90 },
    ME: { status: "vf", days: 30 },
    MK: { status: "vf", days: 15 },
    RS: { status: "vf", days: 90 },
    XK: { status: "vf", days: 15 },
    MD: { status: "vf", days: 90 },
    TR: { status: "ev", days: 30 },
    QA: { status: "ev", days: 30 },
    OM: { status: "vf", days: 14 },
    PA: { status: "vf", days: 180 },
    CR: { status: "vf", days: 30 },
    TW: { status: "vf", days: 30 },
    PH: { status: "vf", days: 14 },
  },
  // Canadian PR or valid visa. Narrower than the US/UK lists.
  CA: {
    MX: { status: "vf", days: 180 },
    PA: { status: "vf", days: 180 },
    CR: { status: "vf", days: 30 },
    BA: { status: "vf", days: 30 },
    AL: { status: "vf", days: 90 },
    ME: { status: "vf", days: 30 },
    MK: { status: "vf", days: 15 },
    GE: { status: "vf", days: 90 },
    PH: { status: "vf", days: 14 },
    TW: { status: "vf", days: 30 },
    TR: { status: "ev", days: 30 },
  },
  // Australian / NZ PR or visa.
  AU: {
    PA: { status: "vf", days: 180 },
    CR: { status: "vf", days: 30 },
    GE: { status: "vf", days: 90 },
    BA: { status: "vf", days: 30 },
    AL: { status: "vf", days: 90 },
    ME: { status: "vf", days: 30 },
    MK: { status: "vf", days: 15 },
    TW: { status: "vf", days: 30 },
    PH: { status: "vf", days: 14 },
    TR: { status: "ev", days: 30 },
  },
  // GCC residence (UAE/SA/Kuwait/Qatar/Bahrain/Oman). The applyResidenceUpgrade
  // permit expansion turns "GCC" into the 6 individual member codes; this
  // global table is keyed on each member so each member's permit triggers
  // the same upgrades.
  AE: {
    GE: { status: "vf", days: 90 },    // Georgia — any GCC residence.
    AL: { status: "vf", days: 90 },
    ME: { status: "vf", days: 30 },
    MA: { status: "vf", days: 90 },    // Morocco (GCC residents).
    TN: { status: "vf", days: 90 },    // Tunisia.
    JO: { status: "voa", days: 60 },   // Jordan — VoA waived for GCC.
    EG: { status: "voa", days: 30 },   // Egypt VoA confirmed for GCC.
    TR: { status: "ev", days: 30 },
  },
  SA: {
    GE: { status: "vf", days: 90 }, AL: { status: "vf", days: 90 },
    ME: { status: "vf", days: 30 }, MA: { status: "vf", days: 90 },
    TN: { status: "vf", days: 90 }, JO: { status: "voa", days: 60 },
    EG: { status: "voa", days: 30 }, TR: { status: "ev", days: 30 },
  },
  KW: {
    GE: { status: "vf", days: 90 }, AL: { status: "vf", days: 90 },
    ME: { status: "vf", days: 30 }, MA: { status: "vf", days: 90 },
    TN: { status: "vf", days: 90 }, JO: { status: "voa", days: 60 },
    EG: { status: "voa", days: 30 }, TR: { status: "ev", days: 30 },
  },
  QA: {
    GE: { status: "vf", days: 90 }, AL: { status: "vf", days: 90 },
    ME: { status: "vf", days: 30 }, MA: { status: "vf", days: 90 },
    TN: { status: "vf", days: 90 }, JO: { status: "voa", days: 60 },
    EG: { status: "voa", days: 30 }, TR: { status: "ev", days: 30 },
  },
  BH: {
    GE: { status: "vf", days: 90 }, AL: { status: "vf", days: 90 },
    ME: { status: "vf", days: 30 }, MA: { status: "vf", days: 90 },
    TN: { status: "vf", days: 90 }, JO: { status: "voa", days: 60 },
    EG: { status: "voa", days: 30 }, TR: { status: "ev", days: 30 },
  },
  OM: {
    GE: { status: "vf", days: 90 }, AL: { status: "vf", days: 90 },
    ME: { status: "vf", days: 30 }, MA: { status: "vf", days: 90 },
    TN: { status: "vf", days: 90 }, JO: { status: "voa", days: 60 },
    EG: { status: "voa", days: 30 }, TR: { status: "ev", days: 30 },
  },
};
window.applyResidenceUpgrade = function (r, passportIso2, destIso2) {
  if (!r) return r;
  const permits = window.ATLAS_RESIDENCE_PERMITS;
  if (!permits || (Array.isArray(permits) ? permits.length === 0 : permits.size === 0)) return r;
  // Already at the easiest tier — nothing to upgrade.
  if (r.status === "idc" || r.status === "self") return r;
  // Expand the held-permits set: GCC → each member; SCHENGEN stays virtual
  // (matches the ifHolds: ["SCHENGEN"] convention).
  const held = new Set();
  const add = (k) => {
    if (k === "GCC") _GCC_MEMBERS.forEach(m => held.add(m));
    else held.add(k);
  };
  (Array.isArray(permits) ? permits : Array.from(permits)).forEach(add);

  let best = r, bestRank = _ACCESS_BETTER[r.status] ?? 99, via = null;

  // Schengen permit → Schengen-internal visa-free travel (90/180), regardless
  // of the per-passport visa rule. Mirrors the well-known "Schengen residence
  // permit can substitute for a short-stay visa" rule. NOTE: Schengen Area is
  // narrower than EEA — Ireland and Cyprus are EU but NOT in Schengen, so a
  // Schengen permit does NOT grant visa-free entry there. Bulgaria and Romania
  // joined Schengen in March 2024 (air/sea) and full land in 2025.
  if (held.has("SCHENGEN") && _SCHENGEN_AREA.has(destIso2)) {
    if (_ACCESS_BETTER.vf < bestRank) {
      best = { status: "vf", days: 90 };
      bestRank = _ACCESS_BETTER.vf;
      via = "SCHENGEN";
    }
  }

  // Global per-bloc upgrades — applies to ANY nationality whose passport
  // doesn't already have a better status. Held bloc codes (US/GB/CA/AU + the
  // 6 GCC members after expansion) each carry a small destination map; pick
  // the best upgrade across them.
  if (window._PERMIT_GLOBAL_UPGRADES) {
    for (const code of held) {
      const m = window._PERMIT_GLOBAL_UPGRADES[code];
      if (!m) continue;
      const up = m[destIso2];
      if (!up) continue;
      const rank = _ACCESS_BETTER[up.status] ?? 99;
      if (rank < bestRank) {
        best = { status: up.status, days: up.days || null };
        bestRank = rank;
        via = code;
      }
    }
  }

  // visa-conditions rules: per-destination "if you hold X" upgrades.
  if (window.VISA_CONDITIONS) {
    const rules = window.VISA_CONDITIONS[passportIso2] && window.VISA_CONDITIONS[passportIso2][destIso2];
    if (rules) {
      for (const rule of rules) {
        // Does any held permit satisfy this rule?
        const codes = rule.ifHolds || [];
        const hit = codes.find(c => held.has(c));
        if (!hit) continue;
        const rank = _ACCESS_BETTER[rule.then] ?? 99;
        if (rank < bestRank) {
          best = { status: rule.then, days: rule.days || null };
          bestRank = rank;
          via = hit; // remember which permit triggered it
        }
      }
    }
  }

  if (via) best = { ...best, upgradedBy: via };
  return best;
};
