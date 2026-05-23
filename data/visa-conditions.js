// Conditional visa rules — "if you also hold X, you get a better status".
//
// Wikipedia's tables frequently list secondary paths next to the headline
// status. The scraper currently only captures the headline, so visitors miss
// real-world shortcuts ("Indian citizens normally need a visa for Türkiye, but
// holders of a valid US, UK, Ireland or Schengen visa can obtain an eVisa").
// This file is the hand-curated source for those callouts until the scraper
// learns to parse them on its own.
//
// Schema:
//   VISA_CONDITIONS[passportIso2][destIso2] = [
//     {
//       ifHolds: ["US","GB","IE","SCHENGEN"], // ISO2 codes; SCHENGEN is a virtual entry
//       then:    "ev",                         // resulting status
//       days:    30,                           // allowed stay (optional)
//       note:    "Online eVisa application is enough.",  // free-text, optional
//       source:  "https://www.evisa.gov.tr/...",         // citation URL
//     },
//   ]
//
// The virtual "SCHENGEN" code means "any Schengen-area state visa", treated
// as a single bucket in the UI ("Schengen visa" / "Schengen vizesi").
//
// Add only cases verified against an official or Wikipedia source. When the
// scraper is taught to read conditions (see HANDOFF), this file becomes the
// authoritative override layer.

window.VISA_CONDITIONS = {
  // ─── India ─────────────────────────────────────────────────────────────
  IN: {
    TR: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "ev",
      days: 30,
      note: "Geçerli ABD / Birleşik Krallık / İrlanda veya Schengen vizesi/oturumu olanlar e-Vize alabilir.",
      noteEn: "Holders of a valid US, UK, Irish or Schengen visa or residence permit can obtain an eVisa online.",
      source: "https://www.evisa.gov.tr/en/info/who-is-eligible-to-apply/",
    }],
    MX: [{
      ifHolds: ["US", "GB", "CA", "JP", "SCHENGEN"],
      then: "vf",
      days: 180,
      note: "Geçerli ABD, Birleşik Krallık, Kanada, Japonya veya Schengen vizesi olanlar vizesiz giriş yapabilir.",
      noteEn: "Visa-free entry for holders of a valid US, UK, Canadian, Japanese or Schengen visa.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Mexico",
    }],
    BA: [{
      ifHolds: ["US", "GB", "SCHENGEN"],
      then: "vf",
      days: 30,
      note: "Geçerli çok girişli Schengen, ABD veya BK vizesi olanlar 30 güne kadar vizesiz giriş yapabilir.",
      noteEn: "Visa-free up to 30 days for holders of a valid multi-entry Schengen, US or UK visa.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Bosnia_and_Herzegovina",
    }],
    AL: [{
      ifHolds: ["US", "GB", "SCHENGEN"],
      then: "vf",
      days: 90,
      note: "Geçerli çok girişli Schengen, ABD veya BK vizesi olanlar 90 güne kadar vizesiz girebilir.",
      noteEn: "Visa-free up to 90 days for holders of a valid multi-entry Schengen, US or UK visa.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Albania",
    }],
    ME: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "vf",
      days: 30,
      note: "Geçerli çok girişli Schengen, ABD, BK veya İrlanda vizesi olanlar vizesiz giriş yapabilir.",
      noteEn: "Visa-free entry for holders of a valid multi-entry Schengen, US, UK or Irish visa.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Montenegro",
    }],
    GE: [{
      ifHolds: ["US", "GB", "IE", "CA", "AU", "JP", "IL", "SCHENGEN"],
      then: "vf",
      days: 90,
      note: "Geçerli ABD, BK, İrlanda, Kanada, Avustralya, Japonya, İsrail veya Schengen vizesi/oturumu olanlar vizesiz giriş yapabilir.",
      noteEn: "Visa-free entry for holders of a valid US, UK, Irish, Canadian, Australian, Japanese, Israeli, or Schengen visa or residence permit.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Georgia",
    }],
    SG: [{
      ifHolds: ["US", "GB", "AU", "CA", "JP", "KR", "DE", "CH", "SCHENGEN"],
      then: "vf",
      days: 96,
      note: "Geçerli ABD/BK/Avustralya/Kanada/Japonya/Schengen/İsviçre vizesi ve onaylı dönüş bileti ile transit vizesi olmadan 96 saate kadar kalabilir.",
      noteEn: "Up to 96-hour visa-free transit for holders of a valid US, UK, Australian, Canadian, Japanese, Korean, German, Swiss or Schengen visa with confirmed onward ticket.",
      source: "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements",
    }],
    OM: [{
      ifHolds: ["US", "GB", "JP", "AU", "CA", "SCHENGEN"],
      then: "ev",
      days: 14,
      note: "Belirli ülkelerin geçerli vizesini taşıyanlar e-Vize uygunluğu kazanır.",
      noteEn: "Holders of a valid US, UK, Japanese, Australian, Canadian or Schengen visa can apply for an eVisa.",
      source: "https://evisa.rop.gov.om/",
    }],
  },

  // ─── Pakistan ──────────────────────────────────────────────────────────
  PK: {
    TR: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "ev",
      days: 30,
      note: "Geçerli ABD / BK / İrlanda veya Schengen vizesi/oturumu olanlar e-Vize alabilir.",
      noteEn: "Holders of a valid US, UK, Irish or Schengen visa or residence permit can obtain an eVisa.",
      source: "https://www.evisa.gov.tr/en/info/who-is-eligible-to-apply/",
    }],
    GE: [{
      ifHolds: ["US", "GB", "IE", "CA", "AU", "JP", "IL", "SCHENGEN"],
      then: "vf",
      days: 90,
      note: "Geçerli ABD, BK, İrlanda, Kanada, Avustralya, Japonya, İsrail veya Schengen vizesi olanlar vizesiz giriş yapabilir.",
      noteEn: "Visa-free entry for holders of a valid US, UK, Irish, Canadian, Australian, Japanese, Israeli, or Schengen visa.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Georgia",
    }],
    OM: [{
      ifHolds: ["US", "GB", "JP", "AU", "CA", "SCHENGEN"],
      then: "ev",
      days: 14,
      note: "Belirli ülkelerin geçerli vizesini taşıyanlar e-Vize uygunluğu kazanır.",
      noteEn: "Holders of a valid US, UK, Japanese, Australian, Canadian or Schengen visa can apply for an eVisa.",
      source: "https://evisa.rop.gov.om/",
    }],
  },

  // ─── China ─────────────────────────────────────────────────────────────
  CN: {
    TR: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "ev",
      days: 30,
      note: "Geçerli ABD / BK / İrlanda veya Schengen vizesi/oturumu olanlar e-Vize alabilir.",
      noteEn: "Holders of a valid US, UK, Irish or Schengen visa or residence permit can obtain an eVisa.",
      source: "https://www.evisa.gov.tr/en/info/who-is-eligible-to-apply/",
    }],
    MX: [{
      ifHolds: ["US", "GB", "CA", "JP", "SCHENGEN"],
      then: "vf",
      days: 180,
      note: "Geçerli ABD, BK, Kanada, Japonya veya Schengen vizesi olanlar vizesiz giriş yapabilir.",
      noteEn: "Visa-free for holders of a valid US, UK, Canadian, Japanese or Schengen visa.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Mexico",
    }],
    BA: [{
      ifHolds: ["US", "GB", "SCHENGEN"],
      then: "vf",
      days: 30,
      note: "Geçerli çok girişli Schengen, ABD veya BK vizesi olanlar 30 güne kadar vizesiz girebilir.",
      noteEn: "Visa-free up to 30 days for holders of a valid multi-entry Schengen, US or UK visa.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Bosnia_and_Herzegovina",
    }],
    AL: [{
      ifHolds: ["US", "GB", "SCHENGEN"],
      then: "vf",
      days: 90,
      note: "Geçerli çok girişli Schengen, ABD veya BK vizesi olanlar 90 güne kadar vizesiz girebilir.",
      noteEn: "Visa-free up to 90 days for holders of a valid multi-entry Schengen, US or UK visa.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Albania",
    }],
    ME: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "vf",
      days: 30,
      note: "Geçerli çok girişli Schengen, ABD, BK veya İrlanda vizesi olanlar vizesiz giriş yapabilir.",
      noteEn: "Visa-free entry for holders of a valid multi-entry Schengen, US, UK or Irish visa.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Montenegro",
    }],
  },

  // ─── Indonesia / Philippines / Vietnam ────────────────────────────────
  ID: {
    TR: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "ev",
      days: 30,
      note: "Geçerli ABD / BK / İrlanda veya Schengen vizesi/oturumu olanlar e-Vize alabilir.",
      noteEn: "Holders of a valid US, UK, Irish or Schengen visa or residence permit can obtain an eVisa.",
      source: "https://www.evisa.gov.tr/en/info/who-is-eligible-to-apply/",
    }],
  },
  PH: {
    TR: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "ev",
      days: 30,
      note: "Geçerli ABD / BK / İrlanda veya Schengen vizesi/oturumu olanlar e-Vize alabilir.",
      noteEn: "Holders of a valid US, UK, Irish or Schengen visa or residence permit can obtain an eVisa.",
      source: "https://www.evisa.gov.tr/en/info/who-is-eligible-to-apply/",
    }],
  },
  VN: {
    TR: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "ev",
      days: 30,
      note: "Geçerli ABD / BK / İrlanda veya Schengen vizesi/oturumu olanlar e-Vize alabilir.",
      noteEn: "Holders of a valid US, UK, Irish or Schengen visa or residence permit can obtain an eVisa.",
      source: "https://www.evisa.gov.tr/en/info/who-is-eligible-to-apply/",
    }],
  },

  // ─── Egypt / Jordan / Saudi Arabia / Iran etc. ────────────────────────
  EG: {
    TR: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "ev",
      days: 30,
      note: "Geçerli ABD / BK / İrlanda veya Schengen vizesi/oturumu olanlar e-Vize alabilir.",
      noteEn: "Holders of a valid US, UK, Irish or Schengen visa or residence permit can obtain an eVisa.",
      source: "https://www.evisa.gov.tr/en/info/who-is-eligible-to-apply/",
    }],
    GE: [{
      ifHolds: ["US", "GB", "IE", "CA", "AU", "JP", "IL", "SCHENGEN"],
      then: "vf",
      days: 90,
      note: "Geçerli ABD, BK, İrlanda, Kanada, Avustralya, Japonya, İsrail veya Schengen vizesi olanlar vizesiz girebilir.",
      noteEn: "Visa-free entry for holders of a valid US, UK, Irish, Canadian, Australian, Japanese, Israeli, or Schengen visa.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Georgia",
    }],
  },

  // ─── Algeria / Morocco / Tunisia / etc. → TR e-Vize pattern ───────────
  DZ: {
    TR: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "ev", days: 30,
      note: "Geçerli ABD / BK / İrlanda veya Schengen vizesi/oturumu olanlar e-Vize alabilir.",
      noteEn: "Holders of a valid US, UK, Irish or Schengen visa or residence permit can obtain an eVisa.",
      source: "https://www.evisa.gov.tr/en/info/who-is-eligible-to-apply/",
    }],
  },
  IQ: {
    TR: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "ev", days: 30,
      note: "Geçerli ABD / BK / İrlanda veya Schengen vizesi/oturumu olanlar e-Vize alabilir.",
      noteEn: "Holders of a valid US, UK, Irish or Schengen visa or residence permit can obtain an eVisa.",
      source: "https://www.evisa.gov.tr/en/info/who-is-eligible-to-apply/",
    }],
  },

  // ─── Russia ────────────────────────────────────────────────────────────
  RU: {
    GE: [{
      ifHolds: ["US", "GB", "IE", "SCHENGEN"],
      then: "vf",
      days: 90,
      note: "Belirli ülkelerin geçerli vizesini taşıyan Rus vatandaşları da vizesiz girebilir (Gürcistan tek taraflı uygulama).",
      noteEn: "Russian citizens benefit from Georgia's broad visa-free entry; valid US, UK, Irish or Schengen visa holders qualify.",
      source: "https://en.wikipedia.org/wiki/Visa_policy_of_Georgia",
    }],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────
// Returns the array of conditional rows for a given (passport, destination)
// pair, or null if none. Walks territory aliases (e.g. PR→US) so that a
// dependent territory inherits its parent's conditional table.
window.visaCondition = function (passportIso2, destIso2) {
  if (!passportIso2 || !destIso2) return null;
  const aliased = (window.TERRITORY_ALIAS && window.TERRITORY_ALIAS[destIso2]) || destIso2;
  const table = window.VISA_CONDITIONS[passportIso2];
  if (!table) return null;
  return table[aliased] || table[destIso2] || null;
};

// Human-readable list of the `ifHolds` codes for the active language.
// "SCHENGEN" stays as a single label even though it isn't a country ISO.
window.conditionHoldsLabels = function (codes) {
  if (!codes || !codes.length) return [];
  return codes.map(code => {
    if (code === "SCHENGEN") {
      const lang = window.ATLAS_LANG || "en";
      return ({ tr: "Schengen", en: "Schengen", es: "Schengen", de: "Schengen",
                fr: "Schengen", ar: "شنغن" })[lang] || "Schengen";
    }
    return (window.countryName && window.countryName(code)) || code;
  });
};
