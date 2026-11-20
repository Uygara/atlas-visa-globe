// ETIAS — European Travel Information and Authorization System.
//
// Not in operation yet (official site, read 2026-11-21): "ETIAS is currently not in
// operation ... The European Union will inform about the specific date for the start of
// ETIAS several months prior to its launch." When it starts: EUR 20 (free under 18 and
// over 70), valid 3 years or until the passport expires, for visa-exempt travellers to
// 30 European countries (the 29 Schengen states and Cyprus). Most applications are
// processed within minutes; otherwise a decision within 4 days (up to 14 or 30 days if
// more information or an interview is requested).
//
// EU citizens, EEA citizens (Iceland, Liechtenstein, Norway), Swiss
// citizens, and travellers who already need a Schengen visa (TR, IN,
// CN, RU, etc.) do NOT need ETIAS.
//
// Source: https://travel-europe.europa.eu/etias_en

window.ETIAS = {
  // null until the EU announces a start date. Pages say "no start date announced".
  // The old value "2026-10-01" made /etias/ claim ETIAS had launched; it has not.
  launchDate: null,
  transitionEnds: null,
  checked: "2026-11-21",
  fee: "€20",
  feeWaivedUnder: 18,
  feeWaivedOver: 70,
  validityYears: 3,
  shortStayLimit: "90 days in any 180",

  // ISO2 codes of nationalities that will need an ETIAS. This is the
  // full list of Schengen-visa-exempt third countries (i.e. those whose
  // citizens can currently enter Schengen visa-free for short stays
  // but are NOT EU/EEA/Swiss).
  // Source: Commission Implementing Regulation (EU) 2018/1806 Annex II.
  // Annex II of Regulation (EU) 2018/1806 (consolidated 2025-12-30), the same list as
  // window.SCHENGEN_ANNEX_II in data/visa-overrides.js. Nauru (footnote 11, agreement not
  // confirmed in force) and Vanuatu (removed from Annex II) are not on it. Audit 2026-11-21:
  // the old list missed UA, PW, WS, TO and VE and still had VU.
  affectedNationalities: [
    "AD","AE","AG","AL","AR","AU","BA","BB","BN","BR","BS","CA","CL","CO",
    "CR","DM","FM","GB","GD","GE","GT","HK","HN","IL","JP","KI","KN","KR",
    "LC","MC","MD","ME","MH","MK","MO","MU","MX","MY","NI","NZ","PA","PE",
    "PW","PY","RS","SB","SC","SG","SM","SV","TL","TO","TT","TV","TW","UA",
    "US","UY","VA","VC","VE","WS","XK",
  ],

  // The 30 countries that will require ETIAS: the 29 Schengen states and Cyprus
  // (official site: "30 European countries"; a stay in Cyprus is counted separately
  // from the 90/180 days in the others).
  schengenStates: [
    "AT","BE","BG","HR","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IT",
    "LV","LI","LT","LU","MT","NL","NO","PL","PT","RO","SK","SI","ES","SE","CH","CY",
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
    return { kind: "exempt", note: "EU/EEA/Swiss citizens are exempt: freedom of movement." };
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
  return { kind: "visa", note: "You already need a Schengen visa. ETIAS does not apply." };
};

// Days until launch (used for the countdown banner).
window.etiasDaysUntilLaunch = function (now = new Date()) {
  if (!window.ETIAS.launchDate) return null;
  const launch = new Date(window.ETIAS.launchDate + "T00:00:00Z");
  const diff = launch.getTime() - now.getTime();
  return Math.round(diff / 86400000);
};
