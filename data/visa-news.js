// Visa news feed — auto-merged by backend/fetch-news.js.
// Only entries with VERIFIABLE specific sources survive:
//   • wiki:*  — scraped Wikipedia 'Visa policy of <country>' edit summaries
//   • fco:*   — UK Foreign Travel Advice Atom feed (gov.uk official)
//   • manual:* — hand-curated; the merge step rejects any manual whose
//                sourceUrl is just a domain homepage (no specific path).

window.VISA_NEWS = [
  {"id":"fco:e6d15b7b78", "date":"2026-10-16", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/kenya", "title":"Kenya", "summary":"New information about Ebola screening (‘Entry requirements’ page).", "affects":{"passports":[], "destinations":["KE"]}, "severity":"neutral"}
];
