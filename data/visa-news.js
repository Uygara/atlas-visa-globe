// Visa news feed — auto-merged by backend/fetch-news.js.
// Only entries with VERIFIABLE specific sources survive:
//   • wiki:*  — scraped Wikipedia 'Visa policy of <country>' edit summaries
//   • fco:*   — UK Foreign Travel Advice Atom feed (gov.uk official)
//   • manual:* — hand-curated; the merge step rejects any manual whose
//                sourceUrl is just a domain homepage (no specific path).

window.VISA_NEWS = [
  {"id":"fco:f273a4a687", "date":"2026-09-08", "source":"fco", "sourceUrl":"https://www.gov.uk/foreign-travel-advice/thailand", "title":"Thailand", "summary":"Updated information about visa requirements and the rainy season in Thailand ('Entry requirements' and 'Safety and security' pages).", "affects":{"passports":[], "destinations":["TH"]}, "severity":"neutral"},
  {"id":"wiki:127b44bc00", "date":"2026-08-01", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_the_Schengen_Area", "title":"the Schengen Area: Update. Burundi citizens now require a transit visa to Belgium.", "summary":"", "affects":{"passports":[], "destinations":[]}, "severity":"warning"},
  {"id":"wiki:da60578527", "date":"2026-07-26", "source":"wiki", "sourceUrl":"https://en.wikipedia.org/wiki/Visa_policy_of_Brazil", "title":"Brazil: There is no evidence that passportindex provides false information, even the number of ordinance is incorrect, ", "summary":"There is no evidence that passportindex provides false information, even the number of ordinance is incorrect, as the regulations have already been effect on federal police system and  there are plenty of people claimed visa free entry on social media.", "affects":{"passports":[], "destinations":["BR"]}, "severity":"positive"}
];
