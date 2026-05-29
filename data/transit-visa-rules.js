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
  // Source: EU Visa Code Annex IV; updated 2024.
  // Pakistanis transiting Frankfurt → Toronto without leaving airside
  // STILL need Schengen ATV unless an exemption applies. This is the
  // single most-missed rule.
  SCHENGEN: {
    label: "Schengen (Type A airport transit)",
    requiredFor: ["AF","BD","ER","ET","GH","IR","IQ","NG","PK","SO","LK","SD","SY"],
    exemptions: [
      { holds: ["US","CA","JP","GB"], note: "Holders of a valid US, Canadian, Japanese or UK visa (or residence permit) are exempt" },
      { holds: ["SCHENGEN"],          note: "Schengen visa or residence permit holders are exempt" },
      { holds: ["AU"],                note: "Australian residence permit holders are exempt" },
      { passportType: "diplomatic",   note: "Diplomatic passport holders are exempt" },
      { holds: ["EEA"],               note: "EEA (Iceland, Liechtenstein, Norway) residents are exempt" },
    ],
    twovHours: null,
    twovEligible: [],
    notes: "Individual Schengen states may add nationalities to the ATV list. Verify with the embassy of the transit country before flying.",
    source: "https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en",
  },

  // ─── United Kingdom (Direct Airside Transit Visa) ────────────────────
  // The UK list is broader than Schengen's — covers ~35 nationalities.
  // Source: gov.uk visit-uk-in-transit
  GB: {
    label: "United Kingdom (Direct Airside Transit Visa — DATV)",
    requiredFor: [
      "AF","BD","BY","BI","CM","CN","CU","CD","ER","ET","GH","IR","IQ","JO",
      "KE","LB","LR","LY","ML","MD","MM","NG","KP","PK","PS","SL","SO","LK",
      "SD","SY","TJ","TM","UZ","YE","ZW",
    ],
    exemptions: [
      { holds: ["US"],         note: "Valid US visa AND travelling to/from the US (within 6 months) — exempt" },
      { holds: ["CA"],         note: "Valid Canadian visa AND travelling to/from Canada — exempt" },
      { holds: ["AU"],         note: "Valid Australian visa AND travelling to/from Australia — exempt" },
      { holds: ["NZ"],         note: "Valid New Zealand visa AND travelling to/from New Zealand — exempt" },
      { holds: ["SCHENGEN"],   note: "Schengen visa Cat C/D AND travelling to/from a Schengen state (within 6 months) — exempt" },
      { holds: ["IE"],         note: "Irish biometric visa Cat C/D — exempt" },
      { passportType: "diplomatic", note: "Diplomatic / service passport in some cases — verify with carrier" },
    ],
    twovHours: null, twovEligible: [],
    notes: "DATV is NOT a landside visa — to leave the airport you need a Visitor in Transit Visa instead. Always check before connecting through London Heathrow.",
    source: "https://www.gov.uk/transit-visa",
  },

  // ─── United States (no airside transit) ─────────────────────────────
  // Every passenger transiting a US airport must clear US immigration.
  // The C-1 transit visa is needed unless the passport is ESTA-eligible.
  US: {
    label: "United States (no airside transit anywhere)",
    requiredFor: "*",
    exemptions: [
      { holds: ["ESTA"], note: "Visa Waiver Program nationalities (39 countries) can use ESTA — but you still clear immigration" },
      { holds: ["US"],   note: "Valid US visa (any class) — covers transit too" },
    ],
    twovHours: null, twovEligible: [],
    notes: "No US airport has a sterile international transit zone. Even a 90-minute connection requires either an ESTA or a C-1 transit visa.",
    source: "https://travel.state.gov/content/travel/en/us-visas/other-visa-categories/transit-crew-visa.html",
  },

  // ─── Canada (no general airside transit; CTAS for select Chinese) ───
  CA: {
    label: "Canada (Transit Visa required; CTAS exception)",
    requiredFor: "*",
    exemptions: [
      { holds: ["CA"], note: "Holders of a valid Canadian visa / eTA — covered" },
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
    label: "Japan (Shore Pass — up to 72h transit)",
    requiredFor: [], // no airside transit visa per se
    exemptions: [],
    twovHours: 72,
    twovEligible: "*",
    notes: "Up to 72-hour 'Shore Pass' allows airside or landside transit when continuing to a third country with a confirmed onward ticket. Issued at the airport on a case-by-case basis — not guaranteed.",
    source: "https://www.mofa.go.jp/j_info/visit/visa/short/landing.html",
  },

  // ─── Singapore (Visa-Free Transit Facility — 96h) ───────────────────
  SG: {
    label: "Singapore (Visa-Free Transit Facility — 96h)",
    requiredFor: ["AF","BD","IN","MM","PK","CN","PS","SY","TM","UZ"],
    exemptions: [
      { holds: ["US","GB","CA","AU","NZ","JP","KR","DE","CH","SCHENGEN"],
        note: "VFTF 96h: holders of valid US/UK/CA/AU/NZ/JP/KR/DE/CH/Schengen visa or residence permit can transit visa-free for up to 96 hours" },
    ],
    twovHours: 96,
    twovEligible: ["AF","BD","IN","MM","PK","CN","PS","SY","TM","UZ"],
    notes: "Must hold a confirmed onward ticket within 96 hours and a valid visa/permit of one of the listed third countries.",
    source: "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements/visa-free-transit-facility",
  },

  // ─── China (144-hour visa-free transit at select cities) ────────────
  CN: {
    label: "China (144-hour visa-free transit at major airports)",
    requiredFor: [], // depends on the city of transit
    exemptions: [],
    twovHours: 144,
    twovEligible: [
      // 54 nationalities eligible for 144h TWOV as of 2024
      "AT","BE","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT","LV","LT","LU","MT","NL","PL","PT","SK","SI","ES","SE","CH","BG","RO","HR","CY","NO","LI",
      "RU","GB","US","CA","BR","MX","AR","CL","RS","ME","MK","BA","AL",
      "JP","KR","SG","BN","AE","QA",
      "AU","NZ",
    ],
    notes: "144h TWOV is valid only when entering AND leaving via specific airports/ports (Beijing PEK, Shanghai PVG/SHA, Guangzhou CAN, etc.) AND continuing to a third country. Confirmed onward ticket required.",
    source: "https://en.wikipedia.org/wiki/Transit_without_visa#China",
  },

  // ─── Hong Kong (visa-free transit, generous) ────────────────────────
  HK: {
    label: "Hong Kong (visa-free transit — 7 to 14 days for most)",
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
    label: "Qatar — Doha airside transit",
    requiredFor: [],
    exemptions: [],
    twovHours: null,
    twovEligible: [],
    notes: "Airside transit at Doha DOH is visa-free for all nationalities. Qatar also offers a 96-hour transit visa to exit the airport.",
    source: "https://www.qatarairways.com/en-gb/destinations/transit-visa.html",
  },

  // ─── Turkey (Istanbul) ──────────────────────────────────────────────
  TR: {
    label: "Türkiye — Istanbul airside transit",
    requiredFor: [],
    exemptions: [],
    twovHours: null,
    twovEligible: [],
    notes: "Airside transit at Istanbul IST / SAW is visa-free for all nationalities. To leave the airport you need either a Turkish e-Visa (if eligible) or a regular visa.",
    source: "https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa",
  },
};

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

  // Default: no transit visa needed
  let needs = false;
  if (rule.requiredFor === "*" && passport) needs = true;
  else if (Array.isArray(rule.requiredFor) && rule.requiredFor.includes(passport)) needs = true;

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
    needs: needs && !exemption,
    exemption,
    twov,
    twovHours: rule.twovHours || null,
    notes: rule.notes || "",
    source: rule.source || null,
  };
};

// ── Transit-map globe resolver ────────────────────────────────────────
// Maps any destination ISO2 to a single transit status for the standalone
// /transit-map/ globe, given the traveller's passport:
//   "self"  — the passport's own country
//   "vr"    — a transit visa IS required (red)
//   "twov"  — no transit visa, but only via a time-limited Transit-Without-
//             Visa programme (amber); twovHours carries the cap
//   "free"  — airside transit open / no transit visa needed (green)
//   "na"    — not a country we hold transit rules for (neutral land)
//
// The countries we can colour are the Schengen states (resolved via the
// SCHENGEN rule) plus each standalone hub key in TRANSIT_RULES that is
// itself an ISO2 (GB/US/CA/JP/SG/CN/HK/AE/QA/TR).

window.transitAreaForDest = function (destIso2) {
  const iso = String(destIso2 || "").toUpperCase();
  if (window.TRANSIT_RULES[iso]) return iso;          // direct hub country
  if (window.ETIAS && Array.isArray(window.ETIAS.schengenStates)
      && window.ETIAS.schengenStates.includes(iso)) return "SCHENGEN";
  return null;
};

window.transitStatusForGlobe = function (passport, destIso2, opts) {
  const pp = String(passport || "").toUpperCase();
  const iso = String(destIso2 || "").toUpperCase();
  if (pp && iso === pp) return { status: "self" };
  const area = window.transitAreaForDest(iso);
  if (!area) return { status: "na" };
  const res = window.transitVisaRule(pp, area, opts);
  if (!res) return { status: "na" };
  const base = {
    area, label: res.label, twovHours: res.twovHours,
    exemption: res.exemption, notes: res.notes, source: res.source,
  };
  if (res.needs) return { status: "vr", ...base };
  if (res.twov)  return { status: "twov", ...base };
  return { status: "free", ...base };
};

// Colours for the transit globe (hex so they resolve identically inside
// SVG fills and in both themes). "na" falls back to neutral land.
window.TRANSIT_GLOBE_COLOR = {
  self: "#60a5fa",
  free: "#22c55e",
  twov: "#f59e0b",
  vr:   "#ef4444",
  na:   "var(--land)",
};

// Common transit hubs — used by the DetailCard "common transit hubs"
// widget to show a list of likely connections instead of asking the
// traveller to think of every possible hub. Ordered by global volume.
window.COMMON_TRANSIT_HUBS = [
  { area: "AE",       hubLabel: "Dubai / Abu Dhabi", airports: ["DXB","AUH"] },
  { area: "QA",       hubLabel: "Doha",              airports: ["DOH"] },
  { area: "TR",       hubLabel: "Istanbul",          airports: ["IST","SAW"] },
  { area: "SCHENGEN", hubLabel: "Frankfurt / Amsterdam / Paris", airports: ["FRA","AMS","CDG"] },
  { area: "GB",       hubLabel: "London",            airports: ["LHR","LGW"] },
  { area: "US",       hubLabel: "United States",     airports: ["JFK","LAX","ORD","ATL"] },
  { area: "CA",       hubLabel: "Toronto / Vancouver", airports: ["YYZ","YVR"] },
  { area: "SG",       hubLabel: "Singapore",         airports: ["SIN"] },
  { area: "HK",       hubLabel: "Hong Kong",         airports: ["HKG"] },
  { area: "JP",       hubLabel: "Tokyo",             airports: ["NRT","HND"] },
  { area: "CN",       hubLabel: "Beijing / Shanghai", airports: ["PEK","PVG"] },
];
