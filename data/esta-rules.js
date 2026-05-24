// ESTA — Electronic System for Travel Authorization (USA).
//
// VWP-eligible nationals can enter the US for ≤90 days with an ESTA
// instead of a full B1/B2 visa. But several disqualifiers throw you
// out of the program even if your passport is on the list:
//   - Travel to Iran, Iraq, Syria, Libya, Sudan, Somalia, Yemen, Cuba,
//     North Korea since 2011 (sometimes since 2021 for Cuba)
//   - Dual citizenship of those countries
//   - Prior US visa refusal / overstay
//   - Criminal record (arrests, even without conviction)
//   - Passport not e-passport (chip)
//
// If disqualified, the only path is a full B1/B2 visa application
// from a US consulate — wait times can exceed a year.
//
// Source: https://esta.cbp.dhs.gov/

window.ESTA = {
  vwpCountries: [
    // 41 VWP members as of 2024 (Israel + Qatar + Croatia + Romania
    // added most recently)
    "AD","AT","AU","BE","BN","HR","CL","CZ","DK","EE","FI","FR","DE",
    "GR","HU","IS","IE","IL","IT","JP","KR","LV","LI","LT","LU","MT",
    "MC","NL","NZ","NO","PL","PT","QA","RO","SM","SG","SK","SI","ES",
    "SE","CH","GB","TW",
  ],
  disqualifierCountries: ["IR","IQ","SY","LY","SD","SO","YE","CU","KP"],
  source: "https://esta.cbp.dhs.gov/",
  applicationFee: "$21 USD",
  validityYears: 2,
};

window.estaEligible = function (passportIso) {
  return window.ESTA.vwpCountries.includes(String(passportIso || "").toUpperCase());
};
