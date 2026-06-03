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
