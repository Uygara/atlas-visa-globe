// Visa news feed — auto-merged by backend/fetch-news.js.
// Only entries with VERIFIABLE specific sources survive:
//   • wiki:*  — scraped Wikipedia 'Visa policy of <country>' edit summaries
//   • fco:*   — UK Foreign Travel Advice Atom feed (gov.uk official)
//   • manual:* — hand-curated; the merge step rejects any manual whose
//                sourceUrl is just a domain homepage (no specific path).

window.VISA_NEWS = [
  {"id":"fco:cdc1df5930", "date":"2026-06-18", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/saudi-arabia", "title":"Saudi Arabia", "summary":"FCDO no longer advises against all but essential travel to Eastern Province and to Riyadh Province. FCDO continues to advise against all travel to within 10km of the border with Yemen, and all but essential travel to areas between 10km and 80km from the border with Yemen. Updated information about regional tensions (‘Warnings and insurance’ page).", "affects":{"passports":[], "destinations":["SA"]}, "severity":"warning"},
  {"id":"wiki:a9823766e9", "date":"2026-05-20", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_Thailand", "title":"Thailand: All are under ASEAN and bilateral (It is a reciprocal visa free treatment, not unilateral)", "summary":"", "affects":{"passports":[], "destinations":["TH"]}, "severity":"positive"},
  {"id":"wiki:57ffb77f18", "date":"2026-05-11", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_Brazil", "title":"Brazil: Brazil has reciprocate visa free for China well before 11 May, and the bilateral memorandum of understanding p", "summary":"Brazil has reciprocate visa free for China well before 11 May, and the bilateral memorandum of understanding published on 7 May replaces the old interministerial ordinance.\nThe maximum period of stay is 30 days within 12 months.  It means Chinese citizens cannot depart and return to renew another 30 visa free entry unless he/she requested an extension at Federal Police within Brazil.  Your previous update is very misleading and badly written.", "affects":{"passports":["CN"], "destinations":["BR"]}, "severity":"positive"}
];
