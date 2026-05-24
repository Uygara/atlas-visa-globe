// Destinations that require a formal Letter of Invitation (LOI) or
// equivalent sponsor letter as part of the visa application.
//
// Without this document the visa application can't even be filed.
// Third-party services (legal agencies, tourist invitation providers)
// fill the role for travellers without a personal contact in-country.

window.LOI_REQUIRED = {
  RU: {
    requiredFor: "*",
    note: "Russia requires a tourist invitation (vaucher) from a registered Russian tour operator OR a private business / personal invitation registered with Russian authorities. Tourist invitations are commonly bought online ($20-40) and emailed within hours.",
    typicalCost: "$20–40 (tourist) / $50–100 (business)",
    source: "https://en.wikipedia.org/wiki/Visa_policy_of_Russia",
  },
  BY: {
    requiredFor: "*",
    note: "Belarus requires an invitation letter from a Belarusian sponsor or licensed agency for most visa categories. Short-stay visa-free entry exists for visa-exempt nationals via Minsk Airport but only for stays up to 30 days.",
    typicalCost: "$30–60 (tourist agency)",
    source: "https://en.wikipedia.org/wiki/Visa_policy_of_Belarus",
  },
  TM: {
    requiredFor: "*",
    note: "Turkmenistan requires a Letter of Invitation (LOI) from an authorised Turkmen tour operator, which then must be approved by the State Migration Service. Process can take 10-15 working days.",
    typicalCost: "$100–250 (depending on agency)",
    source: "https://en.wikipedia.org/wiki/Visa_policy_of_Turkmenistan",
  },
  // UAE in specific categories — most short stays don't need LOI now (eVisa
  // or visa-free) but employment / long stay does.
};

window.loiRule = function (destIso2) {
  return window.LOI_REQUIRED[String(destIso2 || "").toUpperCase()] || null;
};
