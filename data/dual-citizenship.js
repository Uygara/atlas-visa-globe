// Dual-citizenship hints — surfaced as a one-line banner under the passport
// picker so users in known dual-eligible groups discover that they probably
// hold (or can apply for) a stronger second passport. Tap → enables Combine
// mode and pre-adds the secondary passport.
//
// EVERY ENTRY IS A REAL, SOURCED ELIGIBILITY PATH. We do NOT push acquisition
// — only point out a path the user may already have but never thought to use
// on the site. Combine mode then shows their *best* access across both.
//
// Schema:
//   DUAL_CITIZENSHIP_HINTS[primaryIso2] = {
//     suggest: "<secondary iso2>",
//     reason:  "<short EN explanation, neutral tone>",
//     reasonI18nKey: "<optional i18n key>",
//     source:  "<wikipedia url or equivalent>",
//     strength: "strong" | "common" | "narrow",
//       // strong  → most holders of the primary already hold the secondary
//       // common  → a sizeable subset; banner is "may also be eligible"
//       // narrow  → specific historical/descent path; banner says "may qualify"
//   }
//
// Anti-cases we deliberately DO NOT list (with reasons):
//   • TW → CN: PRC issues only "Mainland Travel Permits" to Taiwanese, not
//     passports usable for international travel. No travel upgrade.
//   • HK → GB(BN(O)): BN(O) is already a passport variant within GB on the
//     site (see data/passport-variants-gb.js); no need for a combine hint.
//   • IE → GB: Common Travel Area already covered by FOM rule. Combine adds
//     nothing for visa-policy purposes.
//
// To add an entry, cite an official nationality-law source (or the
// destination's Wikipedia article) and pick the most conservative strength.
window.DUAL_CITIZENSHIP_HINTS = {
  // Northern Cyprus (TRNC) → Republic of Cyprus (CY). The TRNC passport is
  // accepted by only a handful of states; nearly all TRNC residents who can
  // prove descent from pre-1974 RoC citizens are entitled to (and most
  // already hold) a Cypriot — and therefore EU — passport. This is the
  // strongest dual-eligibility case in the dataset; we surface it
  // automatically because the TRNC passport otherwise paints the map as
  // "no entry allowed" for almost every destination, which would be
  // misleading for the typical TRNC-resident user.
  // Source: https://en.wikipedia.org/wiki/Cypriot_nationality_law
  XN: {
    suggest: "CY",
    reason: "Most TRNC residents are entitled to a Republic of Cyprus passport (EU). Add it to see your real access.",
    source: "https://en.wikipedia.org/wiki/Cypriot_nationality_law",
    strength: "strong",
  },

  // Kosovo (XK) → Serbia (RS). Serbia disputes Kosovo's independence and
  // treats Kosovars as Serbian nationals; a substantial number of Kosovo
  // residents — especially Kosovo Serbs and ethnic Albanians who applied
  // through the procedure in Bujanovac — hold Serbian passports. Strength
  // "common" not "strong" because many Kosovars deliberately do not pursue
  // RS citizenship for political reasons.
  // Source: https://en.wikipedia.org/wiki/Serbian_nationality_law
  XK: {
    suggest: "RS",
    reason: "Many Kosovo residents are also eligible for a Serbian passport. If you hold one, add it for better access.",
    source: "https://en.wikipedia.org/wiki/Serbian_nationality_law",
    strength: "common",
  },

  // Palestine (PS) → Jordan (JO). West Bank Palestinians born before the
  // 1988 disengagement (and many of their descendants) retained Jordanian
  // citizenship; this is documented in Jordanian nationality law and the
  // 1988 disengagement act. Gazans and Jerusalemites mostly do NOT have
  // this path — "common" (not "strong") for that reason.
  // Source: https://en.wikipedia.org/wiki/Jordanian_nationality_law
  PS: {
    suggest: "JO",
    reason: "Many Palestinians (especially West Bank residents born pre-1988) also hold a Jordanian passport.",
    source: "https://en.wikipedia.org/wiki/Jordanian_nationality_law",
    strength: "common",
  },

  // Israel (IL) → Germany (DE). Article 116(2) of the Basic Law restores
  // German citizenship to descendants of those denaturalised by the Nazis;
  // the 2021 amendment broadened eligibility further. Many Israelis of
  // German-Jewish descent have used this path. "narrow" because eligibility
  // depends on specific descent — we don't want to suggest it to users who
  // can't actually claim it.
  // Source: https://en.wikipedia.org/wiki/German_nationality_law#Article_116(2)
  IL: {
    suggest: "DE",
    reason: "Descendants of those denaturalised by Nazi Germany (Art. 116) may also qualify for a German passport.",
    source: "https://en.wikipedia.org/wiki/German_nationality_law",
    strength: "narrow",
  },
};
