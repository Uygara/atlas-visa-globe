// Recently-changed visa policies — populated daily by the GitHub Actions cron.
// Each entry is a real diff between yesterday's and today's Wikipedia snapshot.
//
// Reset on 2026-05-21 because earlier entries reflected our own scraper/data
// migrations (adding Kosovo, fixing the classifier, etc.) rather than real
// policy changes. From now on this file only accumulates genuine day-over-day
// differences detected by backend/scraper.js → computeChangelog().

window.CHANGELOG = [];
