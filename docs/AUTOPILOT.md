# Autopilot: the weekly growth agent

A scheduled Claude Code task runs this playbook. It reads the numbers, uses the site like a visitor, picks the
changes most likely to bring more visitors, ships them, and leaves notes for the next run. It works without the
owner. This file is the whole brief; the scheduled prompt only says "follow docs/AUTOPILOT.md".

Goal, in this order: more organic visitors (Search Console clicks, GA4 users from search and referrals),
visitors who stay (engaged sessions, pages per session), and a site with no broken parts.

## Hard rules

- **Never spend money.** No paid plans, trials that need a card, paid APIs, ads, domains. If a step needs money,
  write it in `TODO.md` "Senin yapacakların" with the reason and the expected gain, and move on.
- **Never invent visa data** (fees, rules, durations, dates, links). Every fact comes from a source already in the repo
  or a page fetched this run, and the source is cited in the commit message. Unsure means leave it out.
- No passwords, card numbers or one-time codes. Free accounts only when the sign-up needs nothing from the owner
  (no phone, no ID, no card). Otherwise it goes to `TODO.md` with the exact steps.
- No posting on social networks, forums or Reddit, no emails, no messages to people. Those look like spam and
  can get the domain flagged. Write a ready-to-paste draft in `.autopilot/drafts/` and list it in the run note instead.
- Writing style and Turkish rules in `CLAUDE.md` apply to every word. Run `node tools/lint-copy.js` on new copy.
- Legal pages: if data handling changes, update `/privacy/` and `/tr/privacy/` in the same commit.
- Do not touch `.secrets/`, `firestore.rules`, payment or account code unless the task is a bug fix there with a test.
- Do not delete pages that get impressions. Redirect instead (`_redirects`).
- Stop and leave the work uncommitted (note it in the run log) if tests fail twice on the same change.

## Token budget (the owner needs tokens for other work)

- Main session: plan, decide, review diffs, commit. Keep reads small (Grep, ranged Read).
- Mechanical or long work goes to Sonnet subagents (`model: sonnet`): `ux-walker` (visitor review),
  `autopilot-worker` (one scoped change), `site-bug-finder`, `visa-data-auditor`. Give each a brief file in the
  scratchpad; they reply in 8 lines or fewer and write details to disk.
- At most 3 shipped changes and 5 subagent calls per run. One big change beats five scattered ones.
- No screenshots in the main context unless a walk flagged that page. Prefer `walk.json` and text.

## The run

### 1. Read the state (5 min)
- `TODO.md` top block, the last 3 entries of `docs/autopilot-log.md`, and `.autopilot/metrics.tsv` (local history).
- `git pull --rebase origin main` in the working checkout first.

### 2. Numbers
- `node tools/analytics-report.js` (run it from the main checkout, which holds `.secrets/`).
- Append one line to `.autopilot/metrics.tsv`: date, GA users, sessions, engaged %, SC clicks, SC impressions,
  CTR, avg position. Compare with the previous rows, not only last week.
- Read the signals: pages with many impressions and low CTR (title/description work), queries at position 8 to 20
  (content depth, internal links), queries we have no page for (new page), traffic spikes from one country with
  0 s sessions (bots, ignore), referrers that send engaged visitors (more of what they link to).
- Cloudflare numbers need `.secrets/cloudflare-token.txt`. If it is missing, keep going; it is in `TODO.md`.

### 3. Use the site like a visitor
- `node tools/user-walk.js --sample 12` (live site, desktop and phone, English browser). Then
  `node tools/audit-pages.js` (static SEO audit) and, every fourth run, `node tools/user-walk.js --lang tr-TR`.
- Give `ux-walker` the walk output plus 2 or 3 journeys taken from the top queries ("a Kenyan passport holder
  checks where they can go without a visa", "someone plans 90 days in Schengen"). It reports where a visitor
  gets stuck, leaves, or doesn't find the answer.

### 4. Pick the work
Score every candidate: expected visitors gained per week, times confidence, divided by effort. Prefer, in order:
1. Broken things a visitor sees (JS errors, dead links, empty states, layout breaks on phones).
2. Search fixes on pages that already get impressions (titles, descriptions, h1, structured data, internal links,
   hreflang, sitemap problems, Core Web Vitals).
3. New pages for real queries we can answer from data already in the repo (passport, transit, advisories).
4. Features that make people come back or share (watchlists, alerts, shareable result cards).
5. Distribution that costs nothing and needs no human: sitemap/IndexNow pings, `llms.txt`, structured data,
   open-source data exports with a link back. The Android/iOS apps belong here too, but store accounts are the
   owner's (`TODO.md`); prepare builds and listings, don't open accounts.
Check `docs/autopilot-log.md` "Tried" so the same idea isn't shipped twice. Write the chosen 1 to 3 items with
the metric each should move.

### 5. Build
- One change per `autopilot-worker` brief: files, the exact goal, the tests to run, the rebuild order from `CLAUDE.md`.
- Review each diff yourself before committing. Run the tests in `CLAUDE.md` that touch the area, `node scripts/build-tr.js --check`,
  `node tools/audit-pages.js`, and `node tools/lint-copy.js`.
- Commit each change separately (English message, the metric it targets, sources for any data), then push to
  `main`. Cloudflare deploys in about 30 seconds.
- After the push, run `node tools/user-walk.js --sample 0` against the live site and check the changed pages.
  If the live site broke, revert that commit and push the revert at once.

### 6. Notes for next time
- Add a run entry at the top of `docs/autopilot-log.md` (10 lines or fewer): numbers vs last run, what shipped
  (commit hashes), what each should move, what was found but left, and anything the owner must do.
- Move owner-only steps to `TODO.md` "Senin yapacakların" with the exact command or click path. Refresh the
  "buradan başla" block. Keep `TODO.md` under ~90 lines.
- Once a change is 4 weeks old, record in the log whether its metric moved ("Tried" table), so the next runs
  learn which kinds of work pay off.

## Mid-week light run

A second, cheaper run on Thursdays does only steps 1, 3 (walk, no `ux-walker`) and 5 for one item: a bug the walk
found or the top pending item from the log. If the walk is clean and nothing is pending, it writes "clean" in
the log and stops. It should use well under a tenth of the weekly run's tokens.
