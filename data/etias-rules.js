// ETIAS — European Travel Information and Authorization System.
//
// From late 2026 (per the latest EU timeline), every traveller from a
// Schengen-visa-exempt country will need an online ETIAS authorization
// before flying. €7 (free for under-18 / over-70), valid 3 years, tied
// to a single passport. Applications take minutes online; most are
// approved within 96 hours.
//
// EU citizens, EEA citizens (Iceland, Liechtenstein, Norway), Swiss
// citizens, and travellers who already need a Schengen visa (TR, IN,
// CN, RU, etc.) do NOT need ETIAS.
//
// Source: https://travel-europe.europa.eu/etias_en

window.ETIAS = {
  // Tentative launch date — has been pushed back several times. Last
  // officially-announced window: October 2026 (with a 6-month
  // transitional period during which non-compliance won't be a refusal
  // reason; full enforcement Q2 2027).
  launchDate: "2026-10-01",
  transitionEnds: "2027-04-01",
  fee: "€7",
  feeWaivedUnder: 18,
  feeWaivedOver: 70,
  validityYears: 3,
  shortStayLimit: "90 days in any 180",

  // ISO2 codes of nationalities that will need an ETIAS. This is the
  // full list of Schengen-visa-exempt third countries (i.e. those whose
  // citizens can currently enter Schengen visa-free for short stays
  // but are NOT EU/EEA/Swiss).
  // Source: Commission Implementing Regulation (EU) 2018/1806 Annex II.
  affectedNationalities: [
    "AL","AD","AG","AR","AU","BS","BB","BA","BR","BN","CA","CL","CO","CR",
    "DM","SV","GE","GD","GT","HN","HK","IL","JP","KI","XK","MO","MY","MH",
    "MU","MX","FM","MD","MC","ME","NZ","NI","MK","PA","PY","PE","KN","LC",
    "VC","SM","RS","SC","SG","SB","KR","TW","TL","TT","TV","AE","GB","US",
    "UY","VU","VA",
  ],

  // Schengen Area member states (where ETIAS authorization is checked
  // at entry). Updated 2024 to include Bulgaria + Romania.
  schengenStates: [
    "AT","BE","BG","HR","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IT",
    "LV","LI","LT","LU","MT","NL","NO","PL","PT","RO","SK","SI","ES","SE","CH",
  ],

  // Countries explicitly EXEMPT from ETIAS (EU/EEA/Swiss citizens have
  // freedom of movement; they don't apply).
  exemptNationalities: [
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE",
    "IS","IT","LV","LI","LT","LU","MT","NL","NO","PL","PT","RO","SK","SI",
    "ES","SE","CH",
  ],

  officialUrl:    "https://travel-europe.europa.eu/etias_en",
  applicationUrl: "https://travel-europe.europa.eu/etias/who-should-apply_en",
};

// ── Helpers ───────────────────────────────────────────────────────────
window.etiasStatus = function (passportIso, destIso) {
  if (!passportIso || !destIso) return null;
  const passport = String(passportIso).toUpperCase();
  const dest     = String(destIso).toUpperCase();
  if (!window.ETIAS.schengenStates.includes(dest)) return null;
  if (window.ETIAS.exemptNationalities.includes(passport)) {
    return { kind: "exempt", note: "EU/EEA/Swiss citizens are exempt — freedom of movement." };
  }
  if (window.ETIAS.affectedNationalities.includes(passport)) {
    return {
      kind: "required",
      launchDate: window.ETIAS.launchDate,
      fee: window.ETIAS.fee,
      validityYears: window.ETIAS.validityYears,
      url: window.ETIAS.applicationUrl,
    };
  }
  // Otherwise the traveller already needs a Schengen visa — no ETIAS layer.
  return { kind: "visa", note: "You already need a Schengen visa — ETIAS does not apply." };
};

// Days until launch (used for the countdown banner).
window.etiasDaysUntilLaunch = function (now = new Date()) {
  const launch = new Date(window.ETIAS.launchDate + "T00:00:00Z");
  const diff = launch.getTime() - now.getTime();
  return Math.round(diff / 86400000);
};
