// Visa news feed — auto-merged by backend/fetch-news.js.
// Only entries with VERIFIABLE specific sources survive:
//   • wiki:*  — scraped Wikipedia 'Visa policy of <country>' edit summaries
//   • fco:*   — UK Foreign Travel Advice Atom feed (gov.uk official)
//   • manual:* — hand-curated; the merge step rejects any manual whose
//                sourceUrl is just a domain homepage (no specific path).

window.VISA_NEWS = [
  {"id":"wiki:257750a90c", "date":"2026-11-01", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_Russia", "title":"Russia: Russia and India have decided not to continue working on an agreement on visa-free travel for tourist groups. ", "summary":"Russia and India have decided not to continue working on an agreement on visa-free travel for tourist groups. https://news.cgtn.com/news/2026-10-31/news-1RGzH9mBkm4/p.html", "affects":{"passports":[], "destinations":["RU"]}, "severity":"positive"},
  {"id":"wiki:2468dec698", "date":"2026-11-01", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_Russia", "title":"Russia: Montenegro. visa free for all passports utill 30 December 2026 https://montenegro.mid.ru/ru/novosti/press-cent", "summary":"Montenegro. visa free for all passports utill 30 December 2026 https://montenegro.mid.ru/ru/novosti/press-centre/o_predstoyashchem_izmenenii_poryadka_poseshcheniya_rossiyskoy_federatsii_grazhdanami_chernogorii/", "affects":{"passports":[], "destinations":["RU"]}, "severity":"positive"}
];
