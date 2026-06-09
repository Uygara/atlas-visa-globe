// Visa news feed — auto-merged by backend/fetch-news.js.
// Only entries with VERIFIABLE specific sources survive:
//   • wiki:*  — scraped Wikipedia "Visa policy of <country>" edit summaries
//   • fco:*   — UK Foreign Travel Advice Atom feed (gov.uk official)
//   • manual:* — hand-curated; must cite a SPECIFIC press release URL (the
//                merge step in fetch-news.js rejects manual items whose
//                sourceUrl is just a domain homepage with no path).
// Older manual entries were removed after a reader correctly flagged a wrong
// claim (Türkiye on China's visa-free list) — Wikipedia confirms TR is not on
// either of China's current visa-free regimes. We now refuse to publish
// hand-claimed news that isn't tied to a specific government/press URL.

window.VISA_NEWS = [
  {"id":"fco:f49a39571c", "date":"2026-06-04", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/india", "title":"India", "summary":"Addition of  information about entry requirements for those entering from Ebola-affected regions ('Entry requirements' page).", "affects":{"passports":[], "destinations":["IN"]}, "severity":"neutral"},
  {"id":"fco:8b25aa53ea", "date":"2026-06-02", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/canada", "title":"Canada", "summary":"Addition of  information about entry requirements for those entering from Ebola-affected regions ('Entry requirements' page).", "affects":{"passports":[], "destinations":["CA"]}, "severity":"neutral"},
  {"id":"wiki:a9823766e9", "date":"2026-05-20", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_Thailand", "title":"Thailand: All are under ASEAN and bilateral (It is a reciprocal visa free treatment, not unilateral)", "summary":"", "affects":{"passports":[], "destinations":["TH"]}, "severity":"positive"},
  {"id":"wiki:57ffb77f18", "date":"2026-05-11", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_Brazil", "title":"Brazil: Brazil has reciprocate visa free for China well before 11 May, and the bilateral memorandum of understanding p", "summary":"Brazil has reciprocate visa free for China well before 11 May, and the bilateral memorandum of understanding published on 7 May replaces the old interministerial ordinance.\nThe maximum period of stay is 30 days within 12 months.  It means Chinese citizens cannot depart and return to renew another 30 visa free entry unless he/she requested an extension at Federal Police within Brazil.  Your previous update is very misleading and badly written.", "affects":{"passports":["CN"], "destinations":["BR"]}, "severity":"positive"},
  {"id":"wiki:4625692d06", "date":"2026-02-22", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_Russia", "title":"Russia: Mauritania. Visa free for diplomatic and service passports from 30.04.26   Update.  https://mid.ru/ru/foreign_", "summary":"Mauritania. Visa free for diplomatic and service passports from 30.04.26   Update.  https://mid.ru/ru/foreign_policy/international_contracts/international_contracts/2_contract/63051/", "affects":{"passports":[], "destinations":["RU"]}, "severity":"positive"}
];
