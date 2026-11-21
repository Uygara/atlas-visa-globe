// Destinations where a formal Letter of Invitation (LOI) or sponsor is part of the
// visa process for many travellers. Reviewed 2026-11-21 against official sources;
// costs of third-party invitations are not shown because no official figure exists.
//   RU: Russian MFA e-visa portal, https://electronic-visa.kdmid.ru/index_en.html
//       ("Nationals of 64 foreign States", "no need for any invitations").
//   BY: Belarus MFA, https://www.mfa.gov.by/en/visa/general/evisa/ (e-visa for 68 countries,
//       issued "without providing any visa support documents").
//   TM: GOV.UK travel advice, entry requirements, updated 2026-10-21,
//       https://www.gov.uk/foreign-travel-advice/turkmenistan/entry-requirements

window.LOI_REQUIRED = {
  RU: {
    requiredFor: "*",
    note: "Russia's e-visa (64 nationalities, up to 30 days) needs no invitation. Other nationalities, and longer or other types of visa, still need an invitation or tourist voucher from a Russian host or registered tour operator.",
    noteTr: "Rusya'nın e-vizesi (64 ülke vatandaşı, en fazla 30 gün) davet gerektirmez. Diğer ülke vatandaşları ve daha uzun ya da farklı türdeki vizeler için hâlâ Rusya'daki bir ev sahibinden ya da kayıtlı bir tur şirketinden davet veya turist vauçeri gerekir.",
    source: "https://electronic-visa.kdmid.ru/index_en.html",
  },
  BY: {
    requiredFor: "*",
    note: "Belarus issues a 30-day e-visa to ordinary passport holders of 68 countries without any visa support documents. Other visas need an invitation or other support document from a Belarusian host.",
    noteTr: "Belarus, 68 ülkenin umuma mahsus pasaport sahiplerine destek belgesi istemeden 30 günlük e-vize veriyor. Diğer vizeler için Belarus'taki bir ev sahibinden davet ya da başka bir destek belgesi gerekir.",
    source: "https://www.mfa.gov.by/en/visa/general/evisa/",
  },
  TM: {
    requiredFor: "*",
    note: "Tourists and conference visitors get an e-visa through a sponsoring tour agency or organiser, which replaced the old letter of invitation. For any other purpose a sponsoring organisation must still apply for a letter of invitation.",
    noteTr: "Turistler ve konferans katılımcıları e-vizeyi sponsor bir tur şirketi ya da organizatör aracılığıyla alıyor; bu, eski davet mektubunun yerini aldı. Diğer amaçlar için sponsor bir kuruluşun hâlâ davet mektubu başvurusu yapması gerekir.",
    source: "https://www.gov.uk/foreign-travel-advice/turkmenistan/entry-requirements",
  },
};

window.loiRule = function (destIso2) {
  return window.LOI_REQUIRED[String(destIso2 || "").toUpperCase()] || null;
};
