// Countries that have historically refused or limited entry to travellers
// with an Israeli entry stamp in their passport. Israel itself stopped
// stamping passports in 2013 (uses a separate paper slip), but old stamps
// in your passport can still trigger refusal.
//
// Status flags:
//   strict:  hard refusal, well documented
//   relaxed: rule technically exists but enforcement is rare / relaxed
//   normalized: relations now normalized; rule no longer enforced

window.ISRAEL_STAMP_RISK = {
  IR: { level: "strict",     note: "Iran refuses entry to passports with any Israel stamp or sticker." },
  LB: { level: "strict",     note: "Lebanon refuses entry; even prior Israeli visa visible in old passports is grounds for refusal." },
  LY: { level: "strict",     note: "Libya refuses entry under standing visa policy." },
  SY: { level: "strict",     note: "Syria refuses entry on this basis." },
  YE: { level: "strict",     note: "Yemen refuses entry under standing policy." },
  // Saudi Arabia, UAE, Bahrain — normalized post-Abraham Accords (2020) /
  // Vision 2030 reforms.
  SA: { level: "normalized", note: "Since 2019 reforms / Abraham Accords adjacent policy, Israel stamps no longer block entry to Saudi Arabia. Verify if travelling on a visit visa." },
  AE: { level: "normalized", note: "UAE normalized relations with Israel in 2020 (Abraham Accords). Israeli stamps no longer block entry." },
  BH: { level: "normalized", note: "Bahrain normalized in 2020. Israeli stamps no longer block entry." },
  // Kuwait — historically strict, has relaxed in last few years; verify.
  KW: { level: "relaxed",    note: "Kuwait historically refused entry on this basis. Enforcement has relaxed in recent years but you should verify with the embassy before flying." },
  // Algeria, Iraq, Pakistan — case-by-case
  DZ: { level: "relaxed",    note: "Algeria's policy is inconsistent — Israeli stamps have led to refusal in some cases. Travel with a clean passport if possible." },
  IQ: { level: "relaxed",    note: "Iraq's policy is unclear and inconsistent; risk of refusal exists." },
  PK: { level: "relaxed",    note: "Pakistan does not officially recognise Israel; old Israeli stamps could complicate a visa application or border entry. Verify before travel." },
};

window.israelStampWarning = function (destIso2) {
  return window.ISRAEL_STAMP_RISK[String(destIso2 || "").toUpperCase()] || null;
};
