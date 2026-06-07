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
