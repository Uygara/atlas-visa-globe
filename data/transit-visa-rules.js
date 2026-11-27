// Airport transit visa rules — the rule travellers most often miss.
//
// Schengen, UK and a few other countries require a transit visa from
// certain passport holders even if they stay airside (don't exit the
// international transit zone). The result is people getting denied
// boarding at their origin airport because they didn't realise the
// rule applied — wasting flight, hotel and time.
//
// Schema for window.TRANSIT_RULES[transitArea]:
//   - label:         human label of the transit zone
//   - requiredFor:   array of ISO2 passports that need a transit visa
//                    (or "*" string meaning EVERY passport)
//   - exemptions:    array of conditions that release the requirement
//                    each: { holds: [iso|"SCHENGEN"|"USRES"|"UKRES"|...],
//                            note: short explainer }
//   - twovHours:     if a Transit-Without-Visa program exists, the cap
//                    in hours (e.g. Japan 72, Singapore 96, China 144).
//                    null if no such program.
//   - twovEligible:  array of ISO2 nationalities that qualify for TWOV.
//                    "*" = all passports.
//   - notes:         free-form caveats
//   - source:        official link (IATA, embassy or gov page)
//
// Lookup helper window.transitVisaRule(passportIso, transitArea) returns
// the resolution { needs: bool, exemptionMatched: object|null, twovApplies: bool,
// note: string, source: url } so callers can render a single banner.

window.TRANSIT_RULES = {

  // ─── Schengen Area (Type A airport transit visa) ─────────────────────
  // requiredFor = the EU-wide common list, Visa Code (Reg. 810/2009) Annex IV,
  // consolidated text read on EUR-Lex 2026-11-27: 12 nationalities. Sudan and
  // Syria are NOT on it; they sit on national lists (SCHENGEN_NATIONAL_ATV below).
  // Exemptions = Visa Code Article 3(5), same reading. A UK or Australian visa
  // does NOT exempt anyone from a Schengen ATV.
  SCHENGEN: {
    label: "Schengen (Type A airport transit)",
    kind: "atv",
    requiredFor: ["AF","BD","CD","ER","ET","GH","IR","IQ","NG","PK","SO","LK"],
    exemptions: [
      { holds: ["SCHENGEN","SCHENGEN-RES"], key: "schengen", note: "A valid Schengen visa (C or D) or a residence permit of a Schengen state" },
      { holds: ["IE","CY"],  key: "ie_cy",    note: "A valid visa or residence permit of Ireland or Cyprus" },
      { holds: ["US","CA","JP"], key: "us_ca_jp", leg: true, note: "A valid US, Canadian or Japanese visa, when flying to that country or another non-Schengen country, or coming back from it after using the visa" },
      { holds: ["US-RES","CA-RES","JP-RES","AD","SM"], key: "permits", note: "A residence permit of the US, Canada, Japan, Andorra or San Marino from the official list (Visa Code Annex V)" },
      { holds: ["EU-FAMILY"], key: "eu_family", note: "Family members of EU citizens" },
      { passportType: "diplomatic", key: "diplomatic", note: "Diplomatic passport holders and flight crew" },
    ],
    twovHours: null,
    twovEligible: [],
    notes: "The airport transit visa only covers staying airside. Landing in or flying on to another Schengen state, or changing airports, is entry and needs a Schengen visa.",
    source: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02009R0810-20200202",
  },

  // ─── United Kingdom (Direct Airside Transit Visa) ────────────────────
  // Nationality list: Schedule 1 of the Immigration (Passenger Transit Visa) Order 2014.
  GB: {
    label: "United Kingdom (Direct Airside Transit Visa, DATV)",
    kind: "atv",
    requiredFor: [ // fallback; data/transit-visa-data.js (legislation.gov.uk, daily) replaces it
      "AF","AL","AO","BD","BI","BW","BY","CD","CG","CI","CM","CN","CO","DM",
      "DZ","EG","ER","ET","GE","GH","GM","GN","GW","HN","IN","IQ","IR","JM",
      "JO","KE","LB","LC","LK","LR","LS","LY","MD","MK","MM","MN","MW","NA",
      "NG","NI","NP","NR","PK","PS","RS","RU","RW","SD","SL","SN","SO","SS",
      "SV","SY","SZ","TL","TR","TT","TZ","UG","VN","VU","XK","YE","ZA","ZW",
    ],
    // Exemptions: Article 4 of the Immigration (Passenger Transit Visa) Order 2014,
    // read on legislation.gov.uk 2026-11-27, plus gov.uk/transit-visa (ETA, visitor visa).
    exemptions: [
      { holds: ["US","CA","AU","NZ"], key: "gb_visa4", leg: true, note: "A valid visa for the US, Canada, Australia or New Zealand (or one that expired less than six months after you last entered with it)" },
      { holds: ["US-RES","CA-RES","AU-RES","NZ-RES"], key: "gb_pr", note: "Permanent residence of the US (green card), Canada, Australia or New Zealand" },
      { holds: ["SCHENGEN-RES"], key: "gb_eea", note: "A long-stay (D) visa or residence permit of an EEA state or Switzerland" },
      { holds: ["IE"], key: "gb_ie", note: "A valid Irish biometric visa" },
      { holds: ["GB"], key: "gb_own", note: "A UK Standard Visitor visa or an ETA" },
    ],
    twovHours: null, twovEligible: [],
    notes: "The DATV covers staying airside only. If you pass UK border control (for example to collect bags or change airports) you need a Visitor in Transit visa.",
    source: "https://www.legislation.gov.uk/uksi/2014/2702/article/4",
  },

  // ─── United States (no airside transit) ─────────────────────────────
  // Every passenger transiting a US airport must clear US immigration.
  // The C-1 transit visa is needed unless the passport is ESTA-eligible.
  US: {
    label: "United States (no airside transit anywhere)",
    kind: "visa",
    requiredFor: "*",
    exemptions: [
      { holds: ["ESTA"], note: "Visa Waiver Program nationalities can use ESTA, but you still clear immigration" },
      { holds: ["US"],   note: "Valid US visa (any class): covers transit too" },
    ],
    twovHours: null, twovEligible: [],
    notes: "No US airport has a sterile international transit zone. Even a 90-minute connection requires either an ESTA or a C-1 transit visa.",
    source: "https://travel.state.gov/content/travel/en/us-visas/other-visa-categories/transit-crew-visa.html",
  },

  // ─── Canada (no general airside transit; CTAS for select Chinese) ───
  CA: {
    label: "Canada (Transit Visa required; CTAS exception)",
    kind: "visa",
    requiredFor: "*",
    exemptions: [
      { holds: ["CA"], note: "Holders of a valid Canadian visa / eTA: covered" },
      { holds: ["CTAS-CN"], note: "China Transit Program: certain Chinese passport holders flying to/from the US via Vancouver YVR or Toronto YYZ" },
      { holds: ["CTAS-PH"], note: "Transit Without Visa Program: Filipino passport holders with valid US visa flying via YVR / YYZ" },
      { passportType: "diplomatic", note: "Diplomatic passport holders of select countries are exempt" },
    ],
    twovHours: null, twovEligible: [],
    notes: "Canada's general policy: transit through a Canadian airport = need a visa or eTA. CTAS / TWOV are narrow programs limited to specific airports + US itinerary.",
    source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/transit.html",
  },

  // ─── Japan (Shore Pass / 72h TWOV) ──────────────────────────────────
  JP: {
    label: "Japan (Shore Pass, up to 72h transit)",
    requiredFor: [], // no airside transit visa per se
    exemptions: [],
    twovHours: 72,
    twovEligible: "*",
    notes: "Up to 72-hour 'Shore Pass' allows airside or landside transit when continuing to a third country with a confirmed onward ticket. Issued at the airport on a case-by-case basis, not guaranteed.",
    source: "https://www.mofa.go.jp/j_info/visit/visa/short/landing.html",
  },

  // ─── Singapore (Visa-Free Transit Facility, 96h) ───────────────────
  // ICA VFTF page, read 2026-11-21: who may use the facility and, for Indian nationals only,
  // which third-country visas qualify. requiredFor (airside transit visa) not confirmed there.
  SG: {
    label: "Singapore (Visa-Free Transit Facility, 96h)",
    kind: "unverified",
    requiredFor: ["AF","BD","IN","MM","PK","CN","PS","SY","TM","UZ"],
    exemptions: [
      { holds: ["AU","CA","DE","JP","NZ","CH","GB","US"],
        note: "Indian nationals only: a visa or long-term pass of Australia, Canada, Germany, Japan, New Zealand, Switzerland, the UK or the US, valid at least one month from entry" },
    ],
    twovHours: 96,
    twovEligible: ["AM","AZ","BY","KZ","KG","MD","RU","TJ","UZ","GE","IN","TM","UA"],
    notes: "The facility covers nationals of the CIS states, Georgia, India, Turkmenistan and Ukraine, plus holders of a PRC Travel Document, Hong Kong Document of Identity or Macau Travel Permit. You need a confirmed onward ticket leaving Singapore within 96 hours.",
    source: "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements/visa-free-transit-facility",
  },

  // ─── China (240-hour visa-free transit) ─────────────────────────────
  // National Immigration Administration, page updated 2026-08-20, read 2026-11-21:
  // 240 hours, ordinary passports of 57 countries, 65 designated ports in 24 provinces.
  CN: {
    label: "China (240-hour visa-free transit at 65 designated ports)",
    requiredFor: [], // depends on the port and the onward journey
    exemptions: [],
    twovHours: 240,
    twovEligible: [
      "AL","AT","BY","BE","BA","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT","LV","LT","LU","MT","MC","ME",
      "NL","MK","NO","PL","PT","RO","RU","RS","SK","SI","ES","SE","CH","UA","GB","US","CA","AR","BR","CL","MX","AU","NZ",
      "BN","ID","JP","KG","QA","SG","KR","AE","VN",
    ],
    notes: "Up to 240 hours (10 days) without a visa for ordinary passports of 57 countries, with a confirmed onward ticket to a third country or region. Enter and leave through one of the 65 designated ports and stay within the permitted areas.",
    source: "https://en.nia.gov.cn/n147418/n147463/c183412/content.html",
  },

  // ─── Hong Kong (visa-free transit, generous) ────────────────────────
  HK: {
    label: "Hong Kong (visa-free transit, 7 to 14 days for most)",
    kind: "unverified",
    requiredFor: ["AF","AL","CU","KP","LA","MN","NG","SO","LK","TJ","TM","VN"],
    exemptions: [
      { holds: ["US","GB","CA","AU","JP","SCHENGEN"],
        note: "Holders of a valid US/UK/CA/AU/JP/Schengen visa often qualify for short visa-free transit" },
    ],
    twovHours: 168,
    twovEligible: "*",
    notes: "Hong Kong offers some of the most generous transit policies in Asia for travellers with confirmed onward tickets.",
    source: "https://www.immd.gov.hk/eng/services/visas/transit.html",
  },

  // ─── UAE (Dubai / Abu Dhabi transit) ────────────────────────────────
  AE: {
    label: "United Arab Emirates (airside transit fairly open)",
    requiredFor: [],
    exemptions: [],
    twovHours: null,
    twovEligible: [],
    notes: "Airside transit at Dubai DXB / Abu Dhabi AUH is generally visa-free for all nationalities as long as you stay in the transit area and don't clear immigration. A landside transit visa (48h or 96h) is also available cheaply if you want to exit the airport.",
    source: "https://www.smartservices.icp.gov.ae/",
  },

  // ─── Qatar (Doha) ───────────────────────────────────────────────────
  QA: {
    label: "Qatar (Doha airside transit)",
    requiredFor: [],
    exemptions: [],
    twovHours: null,
    twovEligible: [],
    notes: "Airside transit at Doha DOH is visa-free for all nationalities. Qatar also offers a 96-hour transit visa to exit the airport.",
    source: "https://www.qatarairways.com/en-gb/destinations/transit-visa.html",
  },

  // ─── Turkey (Istanbul) ──────────────────────────────────────────────
  TR: {
    label: "Türkiye (Istanbul airside transit)",
    requiredFor: [],
    exemptions: [],
    twovHours: null,
    twovEligible: [],
    notes: "Airside transit at Istanbul IST / SAW is visa-free for all nationalities. To leave the airport you need either a Turkish e-Visa (if eligible) or a regular visa.",
    source: "https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa",
  },
};

// ── Schengen national airport transit visa lists ─────────────────────────
// On top of the common list, single member states require an ATV from more
// nationalities (Visa Code Art. 3(2)). Source: Visa Code Handbook Annex 7B,
// version of 1 July 2026, as published by the Norwegian Directorate of
// Immigration (UDI). Read 2026-11-27. Keys are nationalities; values are the
// states (ISO2; the annex writes Greece as EL) where that nationality needs an
// ATV even airside. Cyprus is included: it keeps its own list.
// Re-read the annex when its date changes and update `asOf` + `checked`
// (tools/audit-data.js warns after 180 days).
window.SCHENGEN_NATIONAL_ATV = {
  asOf: "2026-07-01",
  checked: "2026-11-27",
  source: "https://www.udiregelverk.no/rettskilder/internasjonale-rettskilder/schengen2/visumhandboken/annex-07/",
  byNationality: {
    AM: ["CZ","PL"],
    AO: ["FR"],
    BF: ["ES"],
    BI: ["BE"],
    BO: ["FR"],
    CF: ["ES","FR","NL"],
    CG: ["GR","ES","FR"],
    CI: ["ES","FR"],
    CM: ["GR","ES","FR","CY"],
    CU: ["CZ","DE","ES","FR","NL","PL","CH"],
    DJ: ["ES"],
    DO: ["BE","FR"],
    DZ: ["CZ"],
    EG: ["CZ","ES","PL","RO"],
    GM: ["ES"],
    GN: ["BE","ES","FR","NL","PT"],
    GW: ["BE","ES","NL"],
    HT: ["BE","ES","FR"],
    IN: ["CZ","RO"],
    JO: ["DE"],
    KE: ["ES"],
    LB: ["CZ","DE","RO"],
    LR: ["ES"],
    LY: ["CZ"],
    MA: ["RO"],
    ML: ["CZ","DE","ES","FR"],
    MR: ["CZ","ES","FR","NL"],
    NE: ["CZ"],
    NP: ["BE","ES","FR","NL","RO"],
    PH: ["FR"],
    PS: ["BE","CZ","ES","FR","RO"],
    RU: ["CZ","ES","FR"],
    SD: ["BE","CZ","DE","GR","ES","FR","CY","NL"],
    SL: ["ES","FR","NL"],
    SN: ["ES","FR","IT","NL","PT"],
    SS: ["BE","CZ","DE","FR","NL"],
    SY: ["BE","CZ","DK","DE","GR","ES","FR","IT","NL","AT","RO","NO","CH"],
    TD: ["CZ","ES","FR","NL"],
    TG: ["ES","FR"],
    TJ: ["BE","ES","IT","RO"],
    TN: ["RO"],
    TR: ["BE","CZ","DE","ES","FR","CY","NL","NO","CH"],
    UZ: ["BE","ES","FR","IT","PT","RO"],
    YE: ["BE","CZ","ES","NL","RO"],
  },
  // Footnotes of the annex that change the answer for a nationality in one state.
  conditions: {
    "RU:FR": "France: only when the flight to France started in Armenia, Azerbaijan, Belarus, Egypt, Georgia, Moldova, Türkiye or Ukraine.",
    "JO:DE": "Germany: not needed with a valid visa for Australia, Israel or New Zealand and a ticket to that country (or home from it), if the onward flight leaves within 12 hours.",
    "HT:BE": "Belgium: ordinary passports only.",
    "YE:BE": "Belgium: ordinary passports only.",
    "PS:FR": "France: applies to the travel document for Palestinian refugees.",
  },
};

// States where `passport` needs an ATV airside: the common list covers every
// Schengen state; national lists add single states.
window.schengenAtvFor = function (passport, state) {
  const pp = String(passport || "").toUpperCase();
  const common = (window.TRANSIT_RULES.SCHENGEN.requiredFor || []).includes(pp);
  const nat = (window.SCHENGEN_NATIONAL_ATV.byNationality[pp] || []);
  if (state) {
    const st = String(state).toUpperCase();
    return { needs: common || nat.includes(st), basis: common ? "common" : (nat.includes(st) ? "national" : null),
      condition: window.SCHENGEN_NATIONAL_ATV.conditions[pp + ":" + st] || null };
  }
  return { needs: common, basis: common ? "common" : null, states: common ? null : nat.slice() };
};

// Apply auto-scraped overrides (data/transit-visa-data.js, refreshed daily).
// Loaded before this file when present; we merge the nationality lists over
// the built-in defaults so the map stays current without hand-editing.
if (window.TRANSIT_REQUIRED_OVERRIDES) {
  const ov = window.TRANSIT_REQUIRED_OVERRIDES;
  for (const area of Object.keys(ov)) {
    if (area === "lastUpdated") continue;
    if (window.TRANSIT_RULES[area] && Array.isArray(ov[area]) && ov[area].length) {
      window.TRANSIT_RULES[area].requiredFor = ov[area];
    }
  }
}

// ── Lookup helper ─────────────────────────────────────────────────────
// Given a (passportIso, transitArea, opts) returns:
//   { needs: bool, twov: bool, exemption: object|null, label, notes, source }
//
// opts.holds: array of ISO2 codes (or "SCHENGEN"/"US-RES"/etc.) that the
//   traveller also holds visas/residence permits for — used to check
//   exemptions.
window.transitVisaRule = function (passportIso, transitArea, opts) {
  const rule = window.TRANSIT_RULES[transitArea];
  if (!rule) return null;
  const passport = String(passportIso || "").toUpperCase();
  const held = new Set((opts?.holds || []).map(h => String(h).toUpperCase()));
  const state = opts && opts.state ? String(opts.state).toUpperCase() : null;

  // Default: no transit visa needed
  let needs = false, basis = null, condition = null, nationalStates = null;
  if (transitArea === "SCHENGEN") {
    const s = window.schengenAtvFor(passport, state);
    needs = s.needs; basis = s.basis; condition = s.condition || null;
    if (!state && s.states && s.states.length) nationalStates = s.states;
  } else if (rule.requiredFor === "*" && passport) needs = true;
  else if (Array.isArray(rule.requiredFor) && rule.requiredFor.includes(passport)) needs = true;
  if (needs && !basis) basis = rule.requiredFor === "*" ? "all" : "list";

  // Check exemptions
  let exemption = null;
  if (needs && rule.exemptions) {
    for (const ex of rule.exemptions) {
      const exHolds = (ex.holds || []).map(h => String(h).toUpperCase());
      if (exHolds.length && exHolds.some(h => held.has(h))) {
        exemption = ex; break;
      }
    }
  }

  // TWOV
  const twov = !!(rule.twovHours && (
    rule.twovEligible === "*" ||
    (Array.isArray(rule.twovEligible) && rule.twovEligible.includes(passport))
  ));

  return {
    transitArea,
    label: rule.label,
    kind: rule.kind || "atv",
    needs: needs && !exemption,
    basis,
    condition,
    nationalStates,
    exemption,
    exemptions: rule.exemptions || [],
    twov,
    twovHours: rule.twovHours || null,
    notes: rule.notes || "",
    source: (basis === "national" && window.SCHENGEN_NATIONAL_ATV.source) || rule.source || null,
  };
};

// ── Transit-map globe resolver ────────────────────────────────────────
// Maps any destination ISO2 to a single transit status for the standalone
// /transit-map/ globe, given the traveller's passport:
//   "self"    the passport's own country
//   "free"    you may change planes there without any visa (a rule we track,
//             or `generic`: you can even enter the country visa-free)
//   "twov"    no visa, but only via a time-limited Transit-Without-Visa programme
//   "auth"    no airside transit; you clear immigration with an electronic
//             authorisation (US ESTA, Canada eTA) instead of a visa
//   "atv"     an airport transit visa is needed even airside (Schengen ATV, UK DATV)
//   "vr"      no airside transit at all; a full transit or visitor visa is needed (US, Canada)
//   "unknown" not a country we hold transit rules for, and you need a visa to
//             enter it: airside transit is often allowed but we can't confirm it
//
// The countries with real rules are the Schengen states (common + national
// ATV lists) plus each hub key in TRANSIT_RULES that is itself an ISO2.

window.transitAreaForDest = function (destIso2) {
  const iso = String(destIso2 || "").toUpperCase();
  if (window.TRANSIT_RULES[iso]) return iso;          // direct hub country
  if (window.ETIAS && Array.isArray(window.ETIAS.schengenStates)
      && window.ETIAS.schengenStates.includes(iso)) return "SCHENGEN";
  return null;
};

const _TRANSIT_EASY_ENTRY = new Set(["self", "idc", "vf"]);
function _transitEntryStatus(pp, iso) {
  try { return window.resolveStatus ? (window.resolveStatus(pp, iso) || {}).status : null; } catch (e) { return null; }
}

window.transitStatusForGlobe = function (passport, destIso2, opts) {
  const pp = String(passport || "").toUpperCase();
  const iso = String(destIso2 || "").toUpperCase();
  if (pp && iso === pp) return { status: "self" };
  const area = window.transitAreaForDest(iso);
  const entry = _transitEntryStatus(pp, iso);
  if (!area) {
    // No transit rule tracked. If the passport can enter the country without a
    // visa, changing planes there is certainly fine. Otherwise we say we don't know.
    if (_TRANSIT_EASY_ENTRY.has(entry)) return { status: "free", generic: true, byEntry: true };
    return { status: "unknown", generic: true };
  }
  const res = window.transitVisaRule(pp, area, { ...(opts || {}), state: area === "SCHENGEN" ? iso : null });
  if (!res) return { status: "unknown", generic: true };
  const base = {
    area, state: area === "SCHENGEN" ? iso : null, label: res.label, kind: res.kind,
    twovHours: res.twovHours, basis: res.basis, condition: res.condition,
    exemption: res.exemption, exemptions: res.exemptions, notes: res.notes, source: res.source,
    byEntry: _TRANSIT_EASY_ENTRY.has(entry),
  };
  if (res.needs) {
    if (res.kind === "visa") {
      // US/Canada: everyone clears immigration. Visa-free passports need ESTA/eTA
      // (shown as "eta" on the visa map) or nothing at all.
      if (_TRANSIT_EASY_ENTRY.has(entry)) return { status: "free", ...base };
      if (entry === "eta") return { status: "auth", ...base };
      if (res.twov) return { status: "twov", ...base };
      return { status: "vr", ...base };
    }
    if (res.kind === "unverified") return { status: "unknown", ...base, unverified: true };
    return { status: "atv", ...base };
  }
  if (res.twov && !base.byEntry) return { status: "twov", ...base };
  return { status: "free", ...base };
};

// ── Connection check: from → via → to, by IATA airport code ───────────────
// The transit rules above are per country; a real ticket names airports. This maps
// the codes (data/airports.js) to countries, resolves the connection airport's
// rule for the passport, and adds what only the two flights around it can say:
//   • a trip that starts or ends in the connection country is entry, not transit
//   • an exemption of the form "valid X visa AND travelling to/from X" applies when
//     the trip really touches X (we say so; holding the visa is the traveller's part)
//   • a Transit-Without-Visa programme needs an onward ticket to a THIRD country
window.transitLeg = function (passport, fromCode, viaCode, toCode, opts) {
  const A = window.AIRPORTS || {};
  const ap = (c) => A[String(c || "").trim().toUpperCase()] || null;
  const from = ap(fromCode), via = ap(viaCode), to = ap(toCode);
  if (!via) return { error: "via" };
  const alias = (iso) => (window.TERRITORY_ALIAS && window.TERRITORY_ALIAS[iso]) || iso;
  const viaIso = alias(via[0]);
  const fromIso = from ? alias(from[0]) : null, toIso = to ? alias(to[0]) : null;
  const area = window.transitAreaForDest(viaIso);
  const status = window.transitStatusForGlobe(passport, viaIso, opts);
  const touches = [fromIso, toIso].filter(Boolean);
  const inSchengen = (iso) => !!(window.ETIAS && (window.ETIAS.schengenStates || []).includes(iso));
  // Inside the Schengen Area a hop between member states is no transit at all.
  const sameZone = (a, b) => a && b && (a === b || (area === "SCHENGEN" && inSchengen(a) && inSchengen(b)));
  const entry = touches.some((iso) => sameZone(iso, viaIso));
  const rule = area && window.TRANSIT_RULES[area];
  const legExemptions = !entry && rule && (status.status === "vr" || status.status === "atv")
    ? (rule.exemptions || []).filter((ex) => (ex.leg || /to\/from|to or from/i.test(ex.note || ""))
        && (ex.holds || []).some((h) => touches.includes(String(h).toUpperCase())))
    : [];
  const third = fromIso && toIso ? !(fromIso === toIso || sameZone(fromIso, viaIso) || sameZone(toIso, viaIso)) : null;
  return { from, via, to, viaIso, fromIso, toIso, area, status, entry, legExemptions, thirdCountry: third };
};

// Colours for the transit globe (hex so they resolve identically inside
// SVG fills and in both themes). "na" falls back to neutral land.
window.TRANSIT_GLOBE_COLOR = {
  self: "var(--self)",
  free: "var(--vf)",
  twov: "var(--eta)",
  auth: "var(--ev)",
  atv:  "var(--voa)",
  vr:   "var(--vr)",
  unknown: "var(--na)",
  na:   "var(--land)",
};

// Common transit hubs — used by the DetailCard "common transit hubs"
// widget to show a list of likely connections instead of asking the
// traveller to think of every possible hub. Ordered by global volume.
window.COMMON_TRANSIT_HUBS = [
  { area: "AE",       hubLabel: "Dubai / Abu Dhabi", airports: ["DXB","AUH"] },
  { area: "QA",       hubLabel: "Doha",              airports: ["DOH"] },
  { area: "TR",       hubLabel: "Istanbul",          airports: ["IST","SAW"] },
  { area: "SCHENGEN", state: "DE", hubLabel: "Frankfurt / Munich", airports: ["FRA","MUC"] },
  { area: "SCHENGEN", state: "NL", hubLabel: "Amsterdam", airports: ["AMS"] },
  { area: "SCHENGEN", state: "FR", hubLabel: "Paris", airports: ["CDG"] },
  { area: "SCHENGEN", state: "IT", hubLabel: "Rome / Milan", airports: ["FCO","MXP"] },
  { area: "SCHENGEN", state: "AT", hubLabel: "Vienna", airports: ["VIE"] },
  { area: "GB",       hubLabel: "London",            airports: ["LHR","LGW"] },
  { area: "US",       hubLabel: "United States",     airports: ["JFK","LAX","ORD","ATL"] },
  { area: "CA",       hubLabel: "Toronto / Vancouver", airports: ["YYZ","YVR"] },
  { area: "SG",       hubLabel: "Singapore",         airports: ["SIN"] },
  { area: "HK",       hubLabel: "Hong Kong",         airports: ["HKG"] },
  { area: "JP",       hubLabel: "Tokyo",             airports: ["NRT","HND"] },
  { area: "CN",       hubLabel: "Beijing / Shanghai", airports: ["PEK","PVG"] },
];
