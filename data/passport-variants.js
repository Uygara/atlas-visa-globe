// Passport type variants — diplomatic / service / special passports get
// dramatically different visa treatment than the ordinary passport. Most
// passports we ship today only carry the ordinary policy because that's
// the only Wikipedia article the scraper currently reads.
//
// This file is the hand-curated bootstrap for the variant framework:
//   - A short list of countries with their best-known variant deltas.
//   - resolveVariantStatus() / tallyVariant() — frontend helpers that
//     overlay the variant entries onto the ordinary map, falling back to
//     ordinary when a destination isn't enumerated.
//
// Each variant entry mirrors the compact schema of the main passports.js:
//   { vf: [iso|[iso,days], …], ev: [...], voa: [...], vr: [...] }
//
// A scraper extension (HANDOFF backlog) will eventually replace this with
// auto-extracted variant maps; until then hand-curated entries are the
// authoritative source and merged on top of any scraped data.

window.PASSPORT_VARIANTS = {

  // ─── Türkiye ──────────────────────────────────────────────────────────
  // Bordo (ordinary) is the default seen elsewhere in passports.js.
  // Hususi (yeşil) and Hizmet (gri) carry broad Schengen / EU exemptions.
  // Diplomatik (siyah) is the widest — visa-free to most of the world.
  TR: {
    hususi: {
      label:   "Hususi (Yeşil)",
      labelEn: "Special (Green)",
      sub:     "Devlet memurları ve emeklileri",
      subEn:   "Civil servants and retirees",
      source:  "https://www.mfa.gov.tr/yesil-pasaport-hamillerine-yonelik-vize-uygulamalari.tr.mfa",
      // Schengen Area (29) + EU + Western Balkans + South Caucasus + a few
      // other agreements give green-passport holders visa-free entry for up
      // to 90 days.
      vf: [
        ["AT",90],["BE",90],["BG",90],["HR",90],["CY",90],["CZ",90],
        ["DK",90],["EE",90],["FI",90],["FR",90],["DE",90],["GR",90],
        ["HU",90],["IS",90],["IE",90],["IT",90],["LV",90],["LI",90],
        ["LT",90],["LU",90],["MT",90],["NL",90],["NO",90],["PL",90],
        ["PT",90],["RO",90],["SK",90],["SI",90],["ES",90],["SE",90],
        ["CH",90],
        // Western Balkans / wider Europe
        ["AL",90],["AD",90],["BA",90],["MC",90],["ME",90],["MK",90],
        ["MD",90],["RS",90],["SM",90],["VA",90],["XK",90],
        // South Caucasus + Central Asia agreements
        ["AM",180],["AZ",30],["GE",365],["KZ",30],["KG",60],["UZ",60],
        // Other notable bilaterals
        ["JP",90],["KR",90],["MY",90],["SG",90],["TH",30],
      ],
      ev: [], voa: [], vr: [],
    },
    hizmet: {
      label:   "Hizmet (Gri)",
      labelEn: "Service (Grey)",
      sub:     "Resmi görevle seyahat eden personel",
      subEn:   "Official-duty travel",
      source:  "https://www.mfa.gov.tr/visa-information-for-holders-of-turkish-service-passports.en.mfa",
      vf: [
        ["AT",90],["BE",90],["BG",90],["HR",90],["CY",90],["CZ",90],
        ["DK",90],["EE",90],["FI",90],["FR",90],["DE",90],["GR",90],
        ["HU",90],["IS",90],["IE",90],["IT",90],["LV",90],["LI",90],
        ["LT",90],["LU",90],["MT",90],["NL",90],["NO",90],["PL",90],
        ["PT",90],["RO",90],["SK",90],["SI",90],["ES",90],["SE",90],
        ["CH",90],
        ["AL",90],["AD",90],["BA",90],["MC",90],["ME",90],["MK",90],
        ["MD",90],["RS",90],["SM",90],["VA",90],["XK",90],
        ["AM",180],["GE",365],["KZ",30],["KG",60],
        ["JP",90],["KR",90],["MY",90],["SG",90],
      ],
      ev: [], voa: [], vr: [],
    },
    diplomatik: {
      label:   "Diplomatik (Siyah)",
      labelEn: "Diplomatic (Black)",
      sub:     "Diplomatik temsilciler",
      subEn:   "Diplomatic officials",
      source:  "https://en.wikipedia.org/wiki/Visa_requirements_for_holders_of_Turkish_diplomatic_passports",
      // Diplomatic holders are visa-free to most of the world. The list below
      // captures the well-known headline destinations (Schengen + major
      // economies). Anything not listed falls back to ordinary, with the UI
      // surfacing a "verify with embassy" hint for ambiguity.
      vf: [
        // Schengen / Europe
        ["AT",90],["BE",90],["BG",90],["HR",90],["CY",90],["CZ",90],
        ["DK",90],["EE",90],["FI",90],["FR",90],["DE",90],["GR",90],
        ["HU",90],["IS",90],["IE",90],["IT",90],["LV",90],["LI",90],
        ["LT",90],["LU",90],["MT",90],["NL",90],["NO",90],["PL",90],
        ["PT",90],["RO",90],["SK",90],["SI",90],["ES",90],["SE",90],
        ["CH",90],["GB",180],
        // Wider Europe + Balkans
        ["AL",90],["AD",90],["BA",90],["BY",30],["MC",90],["ME",90],
        ["MK",90],["MD",90],["RS",90],["SM",90],["VA",90],["XK",90],
        ["UA",90],["RU",90],
        // South Caucasus / Central Asia / Middle East
        ["AM",180],["AZ",90],["GE",365],["IL",90],["IR",90],["JO",90],
        ["KZ",90],["KG",90],["LB",90],["UZ",60],["TM",30],["TJ",90],
        ["PK",90],["AE",90],["QA",30],["KW",90],["OM",30],["BH",30],
        ["SA",30],
        // East / SE Asia
        ["CN",30],["JP",90],["KR",90],["IN",90],["BD",30],["LK",30],
        ["TH",90],["MY",90],["SG",90],["ID",30],["PH",30],["VN",90],
        ["MM",28],["KH",30],["LA",30],["MN",90],["NP",30],
        // Africa
        ["EG",90],["MA",90],["TN",90],["DZ",90],["LY",30],["SD",30],
        ["KE",30],["TZ",90],["UG",90],["ZA",90],["ET",30],["NG",90],
        // Americas
        ["BR",90],["AR",90],["CL",90],["MX",180],["CO",90],["VE",90],
        ["PE",90],["UY",90],["BO",30],["EC",90],["PY",90],
        // Oceania
        ["NZ",90],["FJ",30],
      ],
      ev: [], voa: [], vr: [],
    },
  },

  // Other countries — placeholder so the scraper extension can land entries
  // here without changing the schema. Hand-add common cases on demand:
  //   CN: { diplomatic: {...}, service: {...} },
  //   IN: { diplomatic: {...}, service: {...} },
  //   RU: { diplomatic: {...}, service: {...} },
  //   etc.
};

// ── Helpers ────────────────────────────────────────────────────────────────
// Build a fast lookup for a variant entry on first access.
function _ensureVariantMap(v) {
  if (v._map) return v._map;
  const m = {};
  ["vf","ev","voa","vr"].forEach(s => (v[s]||[]).forEach(e => {
    const code = Array.isArray(e) ? e[0] : e;
    const days = Array.isArray(e) ? e[1] : null;
    m[code] = { status: s, days };
  }));
  v._map = m;
  return m;
}

// Returns the list of variant keys defined for a passport (excluding the
// implicit "ordinary"). Used by the UI to decide whether to render the
// variant segmented control.
window.passportVariants = function (passportIso2) {
  const v = window.PASSPORT_VARIANTS[passportIso2];
  if (!v) return [];
  return Object.keys(v);
};

// Returns the human label for a variant in the active language.
window.passportVariantLabel = function (passportIso2, variantKey) {
  if (!variantKey || variantKey === "ordinary") {
    return (window.ATLAS_LANG === "tr") ? "Bordo (Umuma Mahsus)" : "Ordinary";
  }
  const entry = window.PASSPORT_VARIANTS[passportIso2]
    && window.PASSPORT_VARIANTS[passportIso2][variantKey];
  if (!entry) return variantKey;
  const lang = window.ATLAS_LANG || "en";
  return lang === "tr" ? (entry.label || variantKey) : (entry.labelEn || entry.label || variantKey);
};

// Resolve status honouring the chosen variant. Variant entries override
// the ordinary map; missing destinations fall back to ordinary.
window.resolveVariantStatus = function (passportIso2, destIso2, variantKey) {
  // Self / NA short-circuits stay the same.
  if (passportIso2 === destIso2) return { status: "self", days: null };
  if (!variantKey || variantKey === "ordinary") {
    return window.resolveStatus(passportIso2, destIso2);
  }
  const v = window.PASSPORT_VARIANTS[passportIso2]
    && window.PASSPORT_VARIANTS[passportIso2][variantKey];
  if (!v) return window.resolveStatus(passportIso2, destIso2);
  const aliased = (window.TERRITORY_ALIAS && window.TERRITORY_ALIAS[destIso2]) || destIso2;
  const map = _ensureVariantMap(v);
  if (map[aliased]) return map[aliased];
  if (map[destIso2]) return map[destIso2];
  return window.resolveStatus(passportIso2, destIso2);
};

// Variant-aware tally. Walks every country and counts variant-resolved
// statuses. Same shape as window.tally().
window.tallyVariant = function (passportIso2, variantKey) {
  if (!passportIso2) return null;
  if (!variantKey || variantKey === "ordinary") return window.tally(passportIso2);
  const counts = { vf: 0, ev: 0, voa: 0, vr: 0 };
  window.COUNTRIES.forEach(c => {
    if (c.iso2 === passportIso2) return;
    if (c.continent === "AN") return;
    const r = window.resolveVariantStatus(passportIso2, c.iso2, variantKey);
    if (counts[r.status] != null) counts[r.status]++;
  });
  return counts;
};
