// Visa news feed — auto-merged by backend/fetch-news.js.
// Only entries with VERIFIABLE specific sources survive:
//   • wiki:*  — scraped Wikipedia 'Visa policy of <country>' edit summaries
//   • fco:*   — UK Foreign Travel Advice Atom feed (gov.uk official)
//   • manual:* — hand-curated; the merge step rejects any manual whose
//                sourceUrl is just a domain homepage (no specific path).

window.VISA_NEWS = [
  {"id":"fco:31d5fee671", "date":"2026-07-25", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/saudi-arabia", "title":"Saudi Arabia", "summary":"Latest information on regional risks including the Saudi-Yemen border and threats from the Houthis (‘Warnings and insurance’ and ‘Regional risks’ pages).", "affects":{"passports":[], "destinations":["SA"]}, "severity":"warning"},
  {"id":"wiki:f1950b8f66", "date":"2026-06-30", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_Turkey", "title":"Turkey: Turkey expands visa-free travel for Algerians over 50", "summary":"", "affects":{"passports":[], "destinations":["TR"]}, "severity":"positive"},
  {"id":"wiki:a9823766e9", "date":"2026-05-20", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_Thailand", "title":"Thailand: All are under ASEAN and bilateral (It is a reciprocal visa free treatment, not unilateral)", "summary":"", "affects":{"passports":[], "destinations":["TH"]}, "severity":"positive"},
  {"id":"wiki:57ffb77f18", "date":"2026-05-11", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_Brazil", "title":"Brazil: Brazil has reciprocate visa free for China well before 11 May, and the bilateral memorandum of understanding p", "summary":"Brazil has reciprocate visa free for China well before 11 May, and the bilateral memorandum of understanding published on 7 May replaces the old interministerial ordinance.\nThe maximum period of stay is 30 days within 12 months.  It means Chinese citizens cannot depart and return to renew another 30 visa free entry unless he/she requested an extension at Federal Police within Brazil.  Your previous update is very misleading and badly written.", "affects":{"passports":["CN"], "destinations":["BR"]}, "severity":"positive"}
];
