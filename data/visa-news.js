// Visa news feed — auto-merged by backend/fetch-news.js.
// Only entries with VERIFIABLE specific sources survive:
//   • wiki:*  — scraped Wikipedia 'Visa policy of <country>' edit summaries
//   • fco:*   — UK Foreign Travel Advice Atom feed (gov.uk official)
//   • manual:* — hand-curated; the merge step rejects any manual whose
//                sourceUrl is just a domain homepage (no specific path).

window.VISA_NEWS = [
  {"id":"fco:fa834f5e0b", "date":"2026-09-20", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/saudi-arabia", "title":"Saudi Arabia", "summary":"The Foreign, Commonwealth and Development Office (FCDO) advice against all but essential travel extends to include the cities of Abha and Khamis Mushait in Aseer province. The FCDO continues to advise against all travel to within 10km of the border with Yemen and all but essential travel to areas between 10km and 80km from the border with Yemen.  ('Warnings and insurance' and 'Regional risks')", "affects":{"passports":[], "destinations":["SA"]}, "severity":"warning"},
  {"id":"fco:b24c4f465a", "date":"2026-09-18", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/thailand", "title":"Thailand", "summary":"Updated information on visa exemption scheme, business ownership and deportation ('Entry requirements' and ‘Safety and security’ pages)", "affects":{"passports":[], "destinations":["TH"]}, "severity":"neutral"},
  {"id":"wiki:127b44bc00", "date":"2026-08-01", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_the_Schengen_Area", "title":"the Schengen Area: Update. Burundi citizens now require a transit visa to Belgium.", "summary":"", "affects":{"passports":["BI"], "destinations":["BE"]}, "severity":"warning"}
];
