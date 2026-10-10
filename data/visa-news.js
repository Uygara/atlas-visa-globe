// Visa news feed — auto-merged by backend/fetch-news.js.
// Only entries with VERIFIABLE specific sources survive:
//   • wiki:*  — scraped Wikipedia 'Visa policy of <country>' edit summaries
//   • fco:*   — UK Foreign Travel Advice Atom feed (gov.uk official)
//   • manual:* — hand-curated; the merge step rejects any manual whose
//                sourceUrl is just a domain homepage (no specific path).

window.VISA_NEWS = [
  {"id":"fco:29d7a48aee", "date":"2026-10-09", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/kenya", "title":"Kenya", "summary":"New information about mandatory travel health insurance requirement for foreign visitors staying in Kenya (‘Entry requirements’ page).", "affects":{"passports":[], "destinations":["KE"]}, "severity":"neutral"},
  {"id":"fco:6fdf475a3d", "date":"2026-10-07", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/india", "title":"India", "summary":"This travel advice has been reviewed for accuracy, with minor amendments made throughout, including updated information on access permits, scams, trekking in India, air and rail travel, India-Pakistan border area and Western India and healthcare in India (‘Entry requirements’,‘Safety and security’ and ‘Health’ pages).", "affects":{"passports":[], "destinations":["IN"]}, "severity":"neutral"},
  {"id":"wiki:127b44bc00", "date":"2026-08-01", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_the_Schengen_Area", "title":"the Schengen Area: Update. Burundi citizens now require a transit visa to Belgium.", "summary":"", "affects":{"passports":["BI"], "destinations":["BE"]}, "severity":"warning"}
];
