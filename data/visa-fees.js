// Visa fees + processing times for high-traffic (passport → destination) pairs.
// This is *manually curated* — fees change and exchange rates drift, so each
// entry includes a `source` URL and `lastReviewed` ISO date.
//
// Schema (per pair):
//   fee:             string  — typical fee, formatted with currency (e.g. "$185 USD")
//   processingDays:  string  — typical processing window (e.g. "3–5 weeks")
//   validity:        string  — how long the visa stays valid (e.g. "10 years")
//   durationOfStay:  string  — max stay per visit (e.g. "180 days")
//   type:            string  — short label (e.g. "B1/B2 tourist", "eVisa")
//   source:          string  — embassy / official page
//   lastReviewed:    string  — ISO date
//   notes:           string  — optional caveat
//
// Lookup: window.visaFee("TR", "US") → object or null

window.VISA_FEES = {

  // ─── Turkish passport → destinations ────────────────────────────────────
  "TR": {
    "US": {
      fee: "$185 USD", processingDays: "3–8 weeks (interview wait varies)",
      validity: "10 years (multi-entry)", durationOfStay: "180 days/visit", type: "B1/B2 tourist",
      source: "https://tr.usembassy.gov/visas/", lastReviewed: "2026-05-22",
      notes: "Interview at US embassy in Ankara/Istanbul required. Wait times can exceed 6 months.",
    },
    "GB": {
      fee: "£115 GBP (~$144)", processingDays: "3 weeks standard",
      validity: "6 months (multi-entry)", durationOfStay: "180 days", type: "Standard Visitor",
      source: "https://www.gov.uk/standard-visitor", lastReviewed: "2026-05-22",
    },
    "DE": {
      fee: "€90 EUR (~$98)", processingDays: "15 days (up to 45 in peak season)",
      validity: "180 days", durationOfStay: "90 days in any 180", type: "Schengen Type C",
      source: "https://tuerkei.diplo.de/", lastReviewed: "2026-05-22",
      notes: "Same fee for ALL Schengen countries — apply to whichever you'll spend most time in.",
    },
    "FR": { fee: "€90 EUR (~$98)", processingDays: "15 days", validity: "180 days", durationOfStay: "90 days", type: "Schengen", source: "https://france-visas.gouv.fr/", lastReviewed: "2026-05-22" },
    "IT": { fee: "€90 EUR (~$98)", processingDays: "15 days", validity: "180 days", durationOfStay: "90 days", type: "Schengen", source: "https://vistoperitalia.esteri.it/", lastReviewed: "2026-05-22" },
    "ES": { fee: "€90 EUR (~$98)", processingDays: "15 days", validity: "180 days", durationOfStay: "90 days", type: "Schengen", source: "https://www.exteriores.gob.es/", lastReviewed: "2026-05-22" },
    "NL": { fee: "€90 EUR (~$98)", processingDays: "15 days", validity: "180 days", durationOfStay: "90 days", type: "Schengen", source: "https://www.netherlandsworldwide.nl/", lastReviewed: "2026-05-22" },
    "CA": {
      fee: "CAD $100 (~$73)", processingDays: "8–12 weeks",
      validity: "10 years (multi-entry)", durationOfStay: "180 days", type: "Visitor TRV",
      source: "https://www.canada.ca/en/immigration-refugees-citizenship.html", lastReviewed: "2026-05-22",
    },
    "AU": {
      fee: "AUD $20 service fee", processingDays: "1–3 days (online)",
      validity: "1 year (multi-entry)", durationOfStay: "90 days/visit", type: "ETA (subclass 601)",
      source: "https://immi.homeaffairs.gov.au/", lastReviewed: "2026-05-22",
      notes: "Turkish passport holders can apply for ETA online — no embassy visit.",
    },
    "CN": {
      fee: "$170 USD (Chinese embassy single entry)", processingDays: "4 working days standard",
      validity: "3 months from issue", durationOfStay: "30–60 days", type: "L tourist",
      source: "http://tr.china-embassy.gov.cn/", lastReviewed: "2026-05-22",
      notes: "10-year multi-entry available for $185.",
    },
    "RU": {
      fee: "$0 (free e-visa)", processingDays: "4 days",
      validity: "60 days from issue", durationOfStay: "16 days", type: "Unified e-visa",
      source: "https://evisa.kdmid.ru/", lastReviewed: "2026-05-22",
      notes: "Turkish citizens are visa-free up to 60 days — e-visa is for longer stays via specific entry points.",
    },
    "IN": {
      fee: "$25 USD (1 month) / $40 (1 year) / $80 (5 year)", processingDays: "3–5 days",
      validity: "Up to 5 years", durationOfStay: "90 days/visit", type: "eVisa Tourist",
      source: "https://indianvisaonline.gov.in/", lastReviewed: "2026-05-22",
    },
    "SA": {
      fee: "SAR 535 (~$143)", processingDays: "5–10 minutes (instant)",
      validity: "1 year (multi-entry)", durationOfStay: "90 days/visit (max 180 days/year)", type: "Tourist eVisa",
      source: "https://visa.visitsaudi.com/", lastReviewed: "2026-05-22",
    },
    "EG": {
      fee: "$25 USD", processingDays: "Instant–48 h",
      validity: "30 days", durationOfStay: "30 days", type: "Tourist eVisa",
      source: "https://www.visa2egypt.gov.eg/", lastReviewed: "2026-05-22",
    },
    "ZA": {
      fee: "$33 USD eVisa fee", processingDays: "Up to 10 working days",
      validity: "3 months", durationOfStay: "90 days", type: "eVisa",
      source: "https://www.dha.gov.za/", lastReviewed: "2026-05-22",
    },
    "KE": {
      fee: "$32 USD", processingDays: "2–3 days",
      validity: "90 days from issue", durationOfStay: "Up to 90 days", type: "Tourist eVisa",
      source: "https://etakenya.go.ke/", lastReviewed: "2026-05-22",
    },
  },

  // ─── US passport → destinations needing visa ──────────────────────────
  "US": {
    "CN": {
      fee: "$185 USD (10-year)", processingDays: "4 days standard",
      validity: "10 years (multi-entry)", durationOfStay: "60 days/visit", type: "L tourist",
      source: "https://www.china-embassy.gov.cn/", lastReviewed: "2026-05-22",
    },
    "RU": {
      fee: "$160 USD", processingDays: "10 working days (varies)",
      validity: "3 years", durationOfStay: "60 days/visit", type: "Tourist",
      source: "https://washington.mid.ru/en/", lastReviewed: "2026-05-22",
      notes: "Service is suspended for many US passport holders — check before applying.",
    },
    "CU": {
      fee: "$50 USD tourist card", processingDays: "Same day (online)",
      validity: "180 days", durationOfStay: "30 days", type: "Tourist card",
      source: "https://www.cubavisaservices.com/", lastReviewed: "2026-05-22",
      notes: "Restrictions for US persons under OFAC rules — see Treasury OFAC guidance.",
    },
    "IN": {
      fee: "$40 (1 yr) / $80 (5 yr)", processingDays: "3–5 days",
      validity: "Up to 5 years", durationOfStay: "180 days/visit", type: "eVisa Tourist",
      source: "https://indianvisaonline.gov.in/", lastReviewed: "2026-05-22",
    },
    "VN": {
      fee: "$25 USD", processingDays: "3 working days",
      validity: "90 days", durationOfStay: "90 days", type: "eVisa",
      source: "https://thithucdientu.gov.vn/", lastReviewed: "2026-05-22",
    },
    "BR": {
      fee: "$80.90 USD", processingDays: "5 days standard",
      validity: "10 years (multi-entry)", durationOfStay: "90 days", type: "VITUR",
      source: "https://www.vfsglobal.com/Brazil/USA/", lastReviewed: "2026-05-22",
      notes: "Reintroduced April 2025.",
    },
    "AR": {
      fee: "$200 USD reciprocity fee", processingDays: "Instant (online)",
      validity: "10 years", durationOfStay: "90 days/visit", type: "Reciprocity",
      source: "https://migraciones.gob.ar/", lastReviewed: "2026-05-22",
    },
  },

  // ─── UK passport → destinations needing visa ──────────────────────────
  "GB": {
    "CN": {
      fee: "£151 GBP", processingDays: "4 working days",
      validity: "Multiple entry, 10 years", durationOfStay: "60 days/visit", type: "L tourist",
      source: "http://www.china-embassy.org.uk/", lastReviewed: "2026-05-22",
    },
    "RU": {
      fee: "£185 GBP", processingDays: "10–20 working days",
      validity: "30 days", durationOfStay: "30 days", type: "Tourist",
      source: "https://uk.mid.ru/en/", lastReviewed: "2026-05-22",
    },
    "IN": {
      fee: "£77 GBP (5 yr eVisa)", processingDays: "3–5 days",
      validity: "5 years", durationOfStay: "90 days", type: "eVisa Tourist",
      source: "https://indianvisaonline.gov.in/", lastReviewed: "2026-05-22",
    },
    "US": {
      fee: "$21 ESTA", processingDays: "Minutes–72 h",
      validity: "2 years (multi-entry)", durationOfStay: "90 days/visit", type: "ESTA / Visa Waiver",
      source: "https://esta.cbp.dhs.gov/", lastReviewed: "2026-05-22",
    },
  },

  // ─── German (Schengen) passport → destinations needing visa ───────────
  "DE": {
    "CN": {
      fee: "€155 EUR", processingDays: "4 working days",
      validity: "10 years multi-entry", durationOfStay: "60 days/visit", type: "L tourist",
      source: "http://de.china-embassy.gov.cn/", lastReviewed: "2026-05-22",
    },
    "RU": {
      fee: "€80 EUR", processingDays: "10 working days",
      validity: "30 days", durationOfStay: "30 days", type: "Tourist",
      source: "https://russische-botschaft.ru/", lastReviewed: "2026-05-22",
    },
    "US": {
      fee: "$21 ESTA", processingDays: "Up to 72 h",
      validity: "2 years multi-entry", durationOfStay: "90 days/visit", type: "ESTA / Visa Waiver",
      source: "https://esta.cbp.dhs.gov/", lastReviewed: "2026-05-22",
    },
    "IN": {
      fee: "€10 (1 yr eVisa)", processingDays: "3 days",
      validity: "1 year", durationOfStay: "90 days/visit", type: "eVisa",
      source: "https://indianvisaonline.gov.in/", lastReviewed: "2026-05-22",
    },
  },

  // ─── Indian passport → destinations needing visa ──────────────────────
  "IN": {
    "US": {
      fee: "$185 USD", processingDays: "Wait times in India: 100+ days at most posts",
      validity: "10 years multi-entry", durationOfStay: "180 days", type: "B1/B2",
      source: "https://in.usembassy.gov/", lastReviewed: "2026-05-22",
    },
    "GB": {
      fee: "£115 GBP", processingDays: "3 weeks",
      validity: "6 months", durationOfStay: "180 days", type: "Standard Visitor",
      source: "https://www.gov.uk/standard-visitor", lastReviewed: "2026-05-22",
    },
    "DE": {
      fee: "€90 EUR", processingDays: "15–30 days",
      validity: "180 days", durationOfStay: "90 days in 180", type: "Schengen",
      source: "https://indien.diplo.de/", lastReviewed: "2026-05-22",
    },
    "AE": {
      fee: "$30 USD eVisa", processingDays: "3–4 days",
      validity: "60 days", durationOfStay: "30/60 days", type: "Tourist eVisa",
      source: "https://www.smartservices.icp.gov.ae/", lastReviewed: "2026-05-22",
    },
  },

  // ─── Chinese passport → destinations needing visa ─────────────────────
  "CN": {
    "US": {
      fee: "$185 USD", processingDays: "Wait times 60–120 days at most posts",
      validity: "10 years multi-entry", durationOfStay: "180 days/visit", type: "B1/B2 tourist",
      source: "https://china.usembassy-china.org.cn/", lastReviewed: "2026-05-24",
      notes: "Personal interview required at US consulate.",
    },
    "GB": {
      fee: "£115 GBP (~$144)", processingDays: "3 weeks (priority +£500 ≈ 5 days)",
      validity: "6 months / 2 / 5 / 10 years", durationOfStay: "180 days/visit", type: "Standard Visitor",
      source: "https://www.gov.uk/standard-visitor", lastReviewed: "2026-05-24",
    },
    "DE": {
      fee: "€90 EUR (~$98)", processingDays: "15–30 days",
      validity: "180 days", durationOfStay: "90 days in any 180", type: "Schengen Type C",
      source: "https://china.diplo.de/", lastReviewed: "2026-05-24",
      notes: "Apply via VFS Global service centres in Beijing / Shanghai / Guangzhou.",
    },
    "FR": {
      fee: "€90 EUR (~$98)", processingDays: "15 days", validity: "180 days",
      durationOfStay: "90 days", type: "Schengen Type C",
      source: "https://france-visas.gouv.fr/", lastReviewed: "2026-05-24",
    },
    "IT": {
      fee: "€90 EUR (~$98)", processingDays: "15 days", validity: "180 days",
      durationOfStay: "90 days", type: "Schengen Type C",
      source: "https://vistoperitalia.esteri.it/", lastReviewed: "2026-05-24",
    },
    "CA": {
      fee: "CAD $100 (~$73)", processingDays: "8–12 weeks",
      validity: "10 years multi-entry", durationOfStay: "180 days/visit", type: "Visitor TRV",
      source: "https://www.canada.ca/en/immigration-refugees-citizenship.html", lastReviewed: "2026-05-24",
    },
    "AU": {
      fee: "AUD $190 (~$125)", processingDays: "Up to 29 days (90% of cases)",
      validity: "1 year multi-entry", durationOfStay: "90 days/visit", type: "Visitor (subclass 600)",
      source: "https://immi.homeaffairs.gov.au/", lastReviewed: "2026-05-24",
      notes: "China is not eligible for ETA — full visitor visa required.",
    },
    "JP": {
      fee: "¥3000 (~$20)", processingDays: "5 working days",
      validity: "90 days from issue", durationOfStay: "15 / 30 / 90 days", type: "Temporary Visitor",
      source: "https://www.cn.emb-japan.go.jp/", lastReviewed: "2026-05-24",
      notes: "Group tour visa fee is lower; individual tourists need bank statements + itinerary.",
    },
    "KR": {
      fee: "KRW 40,000 (~$30)", processingDays: "3–5 business days",
      validity: "90 days from issue", durationOfStay: "30 / 90 days", type: "Short-term Visit (C-3)",
      source: "https://www.visa.go.kr/", lastReviewed: "2026-05-24",
      notes: "Group visa via authorised travel agency is faster + cheaper.",
    },
    "IN": {
      fee: "$25–80 USD (eVisa: 1mo / 1yr / 5yr)", processingDays: "3–5 days",
      validity: "Up to 5 years multi-entry", durationOfStay: "90 days/visit", type: "eVisa Tourist",
      source: "https://indianvisaonline.gov.in/", lastReviewed: "2026-05-24",
    },
    "RU": {
      fee: "$0 (free e-visa)", processingDays: "4 days",
      validity: "60 days from issue", durationOfStay: "16 days", type: "Unified e-visa",
      source: "https://evisa.kdmid.ru/", lastReviewed: "2026-05-24",
    },
  },

  // ─── Japanese passport → destinations needing visa ───────────────────
  "JP": {
    "RU": {
      fee: "¥0–6300 (free–single entry)", processingDays: "4–8 working days",
      validity: "3 months from issue", durationOfStay: "Up to 90 days", type: "Tourist (regular)",
      source: "https://www.ru.emb-japan.go.jp/", lastReviewed: "2026-05-24",
      notes: "Suspended for travel from Japan as of 2025. Verify current status before applying.",
    },
    "CN": {
      fee: "¥3000 (~$20)", processingDays: "4 working days",
      validity: "3 months from issue", durationOfStay: "30 days (single) / 60 (double)", type: "L tourist",
      source: "http://www.china-embassy.or.jp/", lastReviewed: "2026-05-24",
      notes: "Japan was excluded from China's visa-free list re-expansion. Verify before booking.",
    },
    "IN": {
      fee: "¥1850 ($12 USD eVisa for short stays)", processingDays: "3–5 days",
      validity: "Up to 5 years multi-entry", durationOfStay: "90 days", type: "eVisa Tourist",
      source: "https://indianvisaonline.gov.in/", lastReviewed: "2026-05-24",
    },
    "SA": {
      fee: "SAR 535 (~$143)", processingDays: "Instant",
      validity: "1 year multi-entry", durationOfStay: "90 days/visit", type: "Tourist eVisa",
      source: "https://visa.visitsaudi.com/", lastReviewed: "2026-05-24",
    },
    "PK": {
      fee: "$8 USD eVisa", processingDays: "7–10 days",
      validity: "3 months", durationOfStay: "30 days", type: "Tourist eVisa",
      source: "https://visa.nadra.gov.pk/", lastReviewed: "2026-05-24",
    },
    "EG": {
      fee: "$25 USD", processingDays: "Instant–48 h",
      validity: "30 days", durationOfStay: "30 days", type: "Tourist eVisa",
      source: "https://www.visa2egypt.gov.eg/", lastReviewed: "2026-05-24",
    },
    "CU": {
      fee: "¥3000 (~$20) Tourist Card", processingDays: "Same day at embassy",
      validity: "180 days", durationOfStay: "30 days", type: "Tourist Card",
      source: "https://misiones.cubaminrex.cu/en/japan", lastReviewed: "2026-05-24",
    },
  },

  // ─── South Korean passport → destinations needing visa ──────────────
  "KR": {
    "CN": {
      fee: "KRW 35,000 (~$26)", processingDays: "4 working days",
      validity: "3 months from issue", durationOfStay: "30 days (single)", type: "L tourist",
      source: "http://kr.china-embassy.gov.cn/", lastReviewed: "2026-05-24",
      notes: "Korea is on China's 30-day visa-free list as of 2024 — verify if you still need this.",
    },
    "RU": {
      fee: "$0 free / $50 expedited", processingDays: "10 working days",
      validity: "3 months", durationOfStay: "60 days", type: "Tourist",
      source: "https://russianembassy.org/page/visa-info", lastReviewed: "2026-05-24",
    },
    "IN": {
      fee: "$25–80 USD (eVisa tiers)", processingDays: "3–5 days",
      validity: "Up to 5 years multi-entry", durationOfStay: "90 days", type: "eVisa Tourist",
      source: "https://indianvisaonline.gov.in/", lastReviewed: "2026-05-24",
    },
    "SA": {
      fee: "SAR 535 (~$143)", processingDays: "Instant",
      validity: "1 year multi-entry", durationOfStay: "90 days/visit", type: "Tourist eVisa",
      source: "https://visa.visitsaudi.com/", lastReviewed: "2026-05-24",
    },
    "PK": {
      fee: "$8 USD eVisa", processingDays: "7–10 days",
      validity: "3 months", durationOfStay: "30 days", type: "Tourist eVisa",
      source: "https://visa.nadra.gov.pk/", lastReviewed: "2026-05-24",
    },
    "VN": {
      fee: "$25 USD eVisa", processingDays: "3 working days",
      validity: "90 days multi-entry", durationOfStay: "90 days", type: "eVisa",
      source: "https://evisa.xuatnhapcanh.gov.vn/", lastReviewed: "2026-05-24",
    },
    "EG": {
      fee: "$25 USD", processingDays: "Instant–48 h",
      validity: "30 days", durationOfStay: "30 days", type: "Tourist eVisa",
      source: "https://www.visa2egypt.gov.eg/", lastReviewed: "2026-05-24",
    },
    "CU": {
      fee: "KRW 30,000 (~$22) Tourist Card", processingDays: "Same day at consulate",
      validity: "180 days", durationOfStay: "30 days", type: "Tourist Card",
      source: "https://misiones.cubaminrex.cu/en/korea-republic", lastReviewed: "2026-05-24",
    },
    "AU": {
      fee: "AUD $20 service fee", processingDays: "1–3 days (online)",
      validity: "1 year multi-entry", durationOfStay: "90 days/visit", type: "ETA (subclass 601)",
      source: "https://immi.homeaffairs.gov.au/", lastReviewed: "2026-05-24",
    },
  },

  // ─── Brazilian passport → destinations needing visa ─────────────────
  "BR": {
    "US": {
      fee: "$185 USD", processingDays: "Wait times can exceed 1 year in São Paulo",
      validity: "10 years multi-entry", durationOfStay: "180 days/visit", type: "B1/B2",
      source: "https://br.usembassy.gov/", lastReviewed: "2026-05-24",
      notes: "Brazil-US visa interview waiver expanded in 2024 for renewals.",
    },
    "CA": {
      fee: "CAD $100 (~$73)", processingDays: "12–16 weeks",
      validity: "10 years multi-entry", durationOfStay: "180 days/visit", type: "Visitor TRV",
      source: "https://www.canada.ca/en/immigration-refugees-citizenship.html", lastReviewed: "2026-05-24",
      notes: "Visa-free pilot ended 2024 — full TRV again required.",
    },
    "AU": {
      fee: "AUD $190 (~$125)", processingDays: "Up to 29 days",
      validity: "1 year multi-entry", durationOfStay: "90 days/visit", type: "Visitor (subclass 600)",
      source: "https://immi.homeaffairs.gov.au/", lastReviewed: "2026-05-24",
    },
    "CN": {
      fee: "$185 USD (10-year)", processingDays: "4 working days",
      validity: "10 years multi-entry", durationOfStay: "60 days/visit", type: "L tourist",
      source: "http://br.china-embassy.gov.cn/", lastReviewed: "2026-05-24",
    },
    "IN": {
      fee: "$25–80 USD (eVisa tiers)", processingDays: "3–5 days",
      validity: "Up to 5 years multi-entry", durationOfStay: "90 days/visit", type: "eVisa Tourist",
      source: "https://indianvisaonline.gov.in/", lastReviewed: "2026-05-24",
    },
    "RU": {
      fee: "$0 free e-visa", processingDays: "4 days",
      validity: "60 days from issue", durationOfStay: "16 days", type: "Unified e-visa",
      source: "https://evisa.kdmid.ru/", lastReviewed: "2026-05-24",
    },
    "JP": {
      fee: "BRL 0 (free)", processingDays: "5 working days",
      validity: "3 months", durationOfStay: "Up to 90 days", type: "Temporary Visitor",
      source: "https://www.br.emb-japan.go.jp/", lastReviewed: "2026-05-24",
      notes: "Visa-free since September 2023 — visa entry no longer needed.",
    },
    "SA": {
      fee: "SAR 535 (~$143)", processingDays: "Instant",
      validity: "1 year multi-entry", durationOfStay: "90 days/visit", type: "Tourist eVisa",
      source: "https://visa.visitsaudi.com/", lastReviewed: "2026-05-24",
    },
    "EG": {
      fee: "$25 USD", processingDays: "Instant–48 h",
      validity: "30 days", durationOfStay: "30 days", type: "Tourist eVisa",
      source: "https://www.visa2egypt.gov.eg/", lastReviewed: "2026-05-24",
    },
    "GB": {
      fee: "£115 GBP (~$144)", processingDays: "3 weeks",
      validity: "6 months", durationOfStay: "180 days", type: "Standard Visitor",
      source: "https://www.gov.uk/standard-visitor", lastReviewed: "2026-05-24",
      notes: "Brazil holders need ETA from January 2025.",
    },
  },

  // ─── Emirati (UAE) passport → destinations needing visa ─────────────
  // UAE passport is one of the world's strongest — most countries are
  // visa-free or VoA. This block covers the few that still require visas.
  "AE": {
    "US": {
      fee: "$185 USD", processingDays: "3–8 weeks",
      validity: "10 years multi-entry", durationOfStay: "180 days/visit", type: "B1/B2",
      source: "https://ae.usembassy.gov/", lastReviewed: "2026-05-24",
    },
    "CA": {
      fee: "CAD $100 (~$73)", processingDays: "4 weeks",
      validity: "10 years multi-entry", durationOfStay: "180 days/visit", type: "Visitor TRV",
      source: "https://www.canada.ca/en/immigration-refugees-citizenship.html", lastReviewed: "2026-05-24",
    },
    "AU": {
      fee: "AUD $20 service fee", processingDays: "1–3 days (online)",
      validity: "1 year multi-entry", durationOfStay: "90 days/visit", type: "eVisitor (subclass 651)",
      source: "https://immi.homeaffairs.gov.au/", lastReviewed: "2026-05-24",
    },
    "IN": {
      fee: "$25–80 USD (eVisa tiers)", processingDays: "3–5 days",
      validity: "Up to 5 years multi-entry", durationOfStay: "90 days", type: "eVisa Tourist",
      source: "https://indianvisaonline.gov.in/", lastReviewed: "2026-05-24",
    },
    "CN": {
      fee: "$0 (visa-free since 2018 — info entry retained for clarity)",
      processingDays: "—", validity: "—", durationOfStay: "30 days visa-free",
      type: "Visa-free",
      source: "http://ae.china-embassy.gov.cn/", lastReviewed: "2026-05-24",
      notes: "UAE citizens enjoy 30-day visa-free entry to China since 2018 — no fee paid.",
    },
    "RU": {
      fee: "$0 (free e-visa)", processingDays: "4 days",
      validity: "60 days from issue", durationOfStay: "16 days", type: "Unified e-visa",
      source: "https://evisa.kdmid.ru/", lastReviewed: "2026-05-24",
    },
    "VN": {
      fee: "$25 USD eVisa", processingDays: "3 working days",
      validity: "90 days multi-entry", durationOfStay: "90 days", type: "eVisa",
      source: "https://evisa.xuatnhapcanh.gov.vn/", lastReviewed: "2026-05-24",
    },
    "PK": {
      fee: "$8 USD eVisa", processingDays: "7–10 days",
      validity: "3 months", durationOfStay: "30 days", type: "Tourist eVisa",
      source: "https://visa.nadra.gov.pk/", lastReviewed: "2026-05-24",
    },
  },
};

// Lookup helper. Returns the entry or null.
window.visaFee = function (passportIso, destIso) {
  if (!passportIso || !destIso) return null;
  const p = (passportIso || "").toUpperCase();
  const d = (destIso || "").toUpperCase();
  return window.VISA_FEES?.[p]?.[d] || null;
};
