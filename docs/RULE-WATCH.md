# Rule watch: catching visa rule changes the same day

The daily Wikipedia scrape is slow to reflect new rules (Montenegro → Türkiye was suspended in the
Official Gazette on 27 Nov 2026 and Wikipedia still said visa-free a day later). The rule watch closes
that gap without letting a script write visa data.

## What runs

- `.github/workflows/rule-watch.yml`, every six hours, runs `backend/watch-sources.js`. It reads:
  - official pages (Türkiye MFA lists in both directions, European Commission visa policy, ETIAS,
    UK visa nationals and ETA pages) and stores their visible text; a changed line is reported;
  - Türkiye's Official Gazette of the day: new entries that mention visas or passports;
  - Google News searches in Turkish and English: new headlines, as leads only.
- Anything new goes into the one open GitHub issue labelled `rule-change` (new comment per run).
  GitHub emails the owner. A page that fails three checks in a row is reported once.
- A scheduled Claude task works through the open issue every morning, following this file.

## How to handle a `rule-change` issue

1. For each item, find the **official** source: the Official Gazette act, the ministry page, the
   government announcement. A news article is never enough on its own. If no official text can be
   read, leave the data alone and say so in the issue.
2. Decide what changes: passport, destination, new status (`vf`, `voa`, `ev`, `eta`, `vr`, `ban`),
   days, start date, which passport types (ordinary only, or diplomatic too). A rule that starts in the
   future is not applied before its date; note it in `TODO.md` with the date instead.
3. Apply it in `data/visa-overrides.js` as a `STATUS_OVERRIDES` row with a comment that names the act,
   its number and date, and a short `note`. Add the pair to "recent official rule changes" in
   `tools/audit-data.js`, so the audit fails if a later scrape or edit undoes it.
4. Run `node tools/audit-data.js`, the rebuild order from `CLAUDE.md`, commit with the source in the
   message, `git pull --rebase`, push.
5. Comment on the issue with what was applied and the commit hash, and close it. Close it too when
   nothing in it was a real rule change (most news leads are not).
6. When Wikipedia catches up and the scraped value matches, the override can stay; it is harmless.

Noise: if one watched page changes on every run without a real edit (a date, a counter), tighten
`htmlToLines` in `backend/watch-sources.js` for that page rather than ignoring the issue.
