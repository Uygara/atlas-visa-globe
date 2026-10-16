// Visa news feed — auto-merged by backend/fetch-news.js.
// Only entries with VERIFIABLE specific sources survive:
//   • wiki:*  — scraped Wikipedia 'Visa policy of <country>' edit summaries
//   • fco:*   — UK Foreign Travel Advice Atom feed (gov.uk official)
//   • manual:* — hand-curated; the merge step rejects any manual whose
//                sourceUrl is just a domain homepage (no specific path).

window.VISA_NEWS = [
  {"id":"fco:3bb21f04a4", "date":"2026-10-13", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/kenya", "title":"Kenya", "summary":"Updated information about travel health insurance requirements for entry into Kenya (See ‘Mandatory Travel Insurance’ on the ‘Entry requirements’ page).", "affects":{"passports":[], "destinations":["KE"]}, "severity":"neutral"},
  {"id":"fco:507cefac8c", "date":"2026-10-12", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/thailand", "title":"Thailand", "summary":"Updated information about visa requirements for travellers entering Thailand by land or air (‘Entry requirements’ page).", "affects":{"passports":[], "destinations":["TH"]}, "severity":"neutral"}
];
