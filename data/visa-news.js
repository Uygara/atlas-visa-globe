// Visa news feed — auto-merged by backend/fetch-news.js.
// Only entries with VERIFIABLE specific sources survive:
//   • wiki:*  — scraped Wikipedia 'Visa policy of <country>' edit summaries
//   • fco:*   — UK Foreign Travel Advice Atom feed (gov.uk official)
//   • manual:* — hand-curated; the merge step rejects any manual whose
//                sourceUrl is just a domain homepage (no specific path).

window.VISA_NEWS = [
  {"id":"fco:5d82441bfe", "date":"2026-10-16", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/saudi-arabia", "title":"Saudi Arabia", "summary":"FCDO now advises against all but essential travel to Saudi Arabia. FCDO continues to advise against all travel to within 10km of the border with Yemen (‘Warnings and insurance’ page and ‘Regional risks’ page).", "affects":{"passports":[], "destinations":["SA"]}, "severity":"warning"},
  {"id":"fco:e6d15b7b78", "date":"2026-10-16", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/kenya", "title":"Kenya", "summary":"New information about Ebola screening (‘Entry requirements’ page).", "affects":{"passports":[], "destinations":["KE"]}, "severity":"neutral"},
  {"id":"fco:507cefac8c", "date":"2026-10-12", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/thailand", "title":"Thailand", "summary":"Updated information about visa requirements for travellers entering Thailand by land or air (‘Entry requirements’ page).", "affects":{"passports":[], "destinations":["TH"]}, "severity":"neutral"}
];
