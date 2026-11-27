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
      ifHolds: ["US", "GB", "AU", "CA", "JP", "NZ", "DE", "CH"],
      then: "vf",
      days: 4, // 96 hours (ICA Visa-Free Transit Facility)
      note: "ABD, BK, Avustralya, Kanada, Japonya, Yeni Zelanda, Almanya veya İsviçre'nin verdiği, girişte en az 1 ay geçerli bir vize ya da uzun süreli izin ve 96 saat içinde Singapur'dan çıkan uçak, feribot veya kruvaziyer biletiyle vizesiz transit: en fazla 96 saat, uzatılamaz.",
      noteEn: "Visa-free transit of up to 96 hours with a visa or long-term pass issued by, or valid for, the US, UK, Australia, Canada, Japan, New Zealand, Germany or Switzerland, valid for at least 1 month on entry, and an onward air, ferry or cruise ticket leaving Singapore within 96 hours. It cannot be extended.",
      source: "https://www.ica.gov.sg/information-and-e-services/entry-and-departure/entering-singapore/entry-requirements/visa-free-transit-facility",
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

  // Russia → Georgia removed 2026-11-21: Russian citizens enter Georgia visa-free without
  // any other visa, so the "if you hold a US/UK/Schengen visa" row described nothing.
};

// Canada's eTA for "select visa-required countries": an eTA instead of a visa for people who
// held a Canadian visitor visa in the past 10 years or hold a valid US nonimmigrant visa, only
// when flying to or through a Canadian airport. Source: IRCC, page details 2026-10-30.
// The "held a Canadian visa" path can't be expressed as ifHolds, so the note states it.
(function () {
  const row = {
    ifHolds: ["US"],
    then: "eta",
    note: "Son 10 yılda Kanada ziyaretçi vizesi aldıysan ya da geçerli bir ABD vizen (göçmen olmayan) varsa vize yerine eTA alabilirsin. Bu yalnızca Kanada'ya uçakla gelirken veya bir Kanada havalimanında aktarma yaparken geçerli; kara ya da deniz yoluyla gelirken ziyaretçi vizesi gerekir.",
    noteEn: "If you held a Canadian visitor visa in the past 10 years or hold a valid US nonimmigrant visa, you can get an eTA instead of a visa. This applies only when flying to or through a Canadian airport; arriving by land or sea still needs a visitor visa.",
    source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta/eligibility/eta-x.html",
  };
  ["AG", "AR", "BR", "CR", "MX", "MA", "PA", "PH", "KN", "LC", "VC", "SC", "TH", "TT", "UY"].forEach(function (p) {
    const t = window.VISA_CONDITIONS[p] = window.VISA_CONDITIONS[p] || {};
    (t.CA = t.CA || []).push(Object.assign({}, row));
  });
})();

// ── Helpers ────────────────────────────────────────────────────────────────
// Returns the array of conditional rows for a given (passport, destination)
// pair, or null if none. Walks territory aliases (e.g. PR→US) so that a
// dependent territory inherits its parent's conditional table. Merges two
// sources:
//   1. Hand-curated VISA_CONDITIONS in this file (richer notes + sources).
//   2. Scraper output stored on PASSPORTS[iso2].cond (auto-extracted from
//      Wikipedia Notes columns).
// Manual entries win on key collision because they're verified.
// Ireland's Short Stay Visa Waiver Programme: nationals of the listed countries who entered the UK
// on a UK short-stay (C) visa may visit Ireland for up to 90 days within their UK permission. It
// does not cover UK residence permits (BRP, D visas) or the UK ETA, so the row is card-only and
// never repaints the map for the "UK ILR / visa" bloc. Due to end 31 December 2026.
// Saudi Arabia, Bahrain, Kuwait, Oman, Qatar and Peru are listed but now travel to the UK on an
// ETA, which does not count, so they are left out. Ukraine is visa-free for Ireland.
// Source: Irish Immigration Service Delivery, read 2026-11-27.
(function () {
  const src = "https://www.irishimmigration.ie/coming-to-visit-ireland/short-stay-visa-waiver-programme/";
  ["BA", "XK", "ME", "MK", "RS", "TR", "IN", "ID", "KZ", "CN", "PH", "TH", "UZ", "VN", "CO"].forEach((p) => {
    const t = (window.VISA_CONDITIONS[p] = window.VISA_CONDITIONS[p] || {});
    (t.IE = t.IE || []).push({
      ifHolds: ["GB"], then: "vf", days: 90, cardOnly: true,
      note: "Birleşik Krallık'a kısa süreli (C) İngiltere vizesiyle giriş yaptıysan, İngiltere'deki izin süren içinde İrlanda'ya 90 güne kadar vizesiz gidebilirsin. Önce İngiltere'ye girmen gerekir; İngiltere oturum kartı ya da ETA geçerli değil. Program 31 Aralık 2026'da bitiyor.",
      noteEn: "If you entered the UK on a UK short-stay (C) visa, you can visit Ireland visa-free for up to 90 days within your UK permission. You must enter the UK first; a UK residence card or ETA does not count. The programme ends on 31 December 2026.",
      source: src,
    });
  });
})();

window.visaCondition = function (passportIso2, destIso2) {
  if (!passportIso2 || !destIso2) return null;
  const aliased = (window.TERRITORY_ALIAS && window.TERRITORY_ALIAS[destIso2]) || destIso2;
  const manualTable = window.VISA_CONDITIONS[passportIso2] || {};
  const manual = manualTable[aliased] || manualTable[destIso2] || null;
  // Scraped rows (PASSPORTS[p].cond, parsed from Wikipedia notes) are NOT shown: an audit on
  // 2026-11-21 found claims such as Morocco → Canada "visa-free for 3650 days with a US visa"
  // (really an eTA) and raw wiki CSS in notes. Only hand-checked, sourced rows reach the card.
  if (!manual) return null;
  // A row is only worth showing when it improves on what the map already shows.
  const R = { idc: 0, vf: 1, eta: 2, ev: 3, voa: 4, vr: 5, ban: 6 };
  const base = window.resolveStatus ? (window.resolveStatus(passportIso2, destIso2) || {}).status : null;
  const rows = manual.filter((row) => !base || (R[row.then] ?? 9) < (R[base] ?? 9));
  return rows.length ? rows : null;
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
