# travelnow.info — instructions for Claude Code

Static site + React SPA + Capacitor app. Live: https://travelnow.info · Repo: Uygara/atlas-visa-globe ·
Cloudflare deploys every push to `main` (~30 s). Daily data refresh: `.github/workflows/daily-refresh.yml`.

## Working with the owner
- The owner writes Turkish → **reply in Turkish**. Code comments and commit messages in English.
- **Never invent visa data** (fees, rules, numbers, links). If a fact can't be sourced, say so and leave it out.
- The site should run itself: don't hand the owner verification chores — automate them. Owner-only steps
  (accounts, payments, console clicks, logins) go in `TODO.md` "Senin yapacakların", with the exact command.
- The owner wants shipped work pushed. Test first, then commit and push; report the commit hash.

## Writing style (every language, every visible word: pages, UI strings, emails, notifications, store text)
The owner's rule: nothing may read like AI-generated text. Write like a careful human editor.
- **No em dash (—) or en dash (–) as punctuation.** Use a full stop, comma, colon, semicolon or brackets.
  An en dash inside a number range (9–17) is fine. Check new copy with `node tools/lint-copy.js`.
- Plain, specific, professional sentences. Say what the thing does; no hype.
- Banned: "seamless", "robust", "leverage", "delve", "unlock", "empower", "elevate", "game-changer",
  "In today's world", "Whether you're X or Y", "It's worth noting", "rest assured", "navigate the complexities",
  "comprehensive guide", rhetorical triplets, exclamation marks, emoji in body text, Title Case Headings.
- Don't pad: no summary that repeats the paragraph above it, no "In conclusion".
- Turkish: natural Turkish, not translated English word order. UI uses "sen"; legal pages use "siz".
- Legal text (privacy, terms): claim only what the code really does. If you change data handling
  (analytics, ads, accounts, notifications), update `/privacy/` and its Turkish twin in the same commit.

## Session protocol (sessions get long and expensive, so keep every step light)
**Start:** read `TODO.md` only (its first block says where to begin), then run
`node tools/analytics-report.js` (GA4 + Search Console + Cloudflare in ~40 lines; the owner wants traffic
followed) and mention anything notable in one line. `STATE.md` is short on purpose; older history is in
`docs/STATE-archive.md`: grep it, never read it whole. `HANDOFF.md` and `ACCOUNT-SETUP.md` are archives.
**During (token budget):**
- Read files by range (offset/limit) or Grep; never `cat` big files or `grep -r` the repo from Bash.
- Edit files with the Edit tool. Rewriting a file you already read/edited with `sed`/`cat >>`/a script makes the
  harness echo the whole file back. For scratch scripts, write them once with Write and run them.
- Pipe command output through `tail`/`cut`; test scripts print one line per check.
- Delegate big mechanical work (translations, copy sweeps, reviews) to `sonnet` subagents with a brief file in
  the scratchpad; they write JSON results to disk and reply in ≤8 lines. Apply the JSON yourself.
- Use analytics via the report script, not dashboard screenshots.
**End (before the last message):**
1. `TODO.md`: delete what is closed, add what appeared, refresh the "buradan başla" block. Keep it under ~90 lines.
2. `STATE.md`: add a ≤12-line round note (what shipped + gotchas) at the top of the round list. No code-level detail.
3. If the daily data commits changed passport numbers since the last cards: `node scripts/og-cards.js`
   (needs local Chrome + Pillow; commit the PNGs with `run_in_background`).
4. Commit, push, and give the owner the next-session list in ≤5 lines.
Save durable lessons in memory (the auto-memory folder), not in this file.

## Where things are
- `index.html`, `itinerary/`, `transit-map/`, `safety-map/` — SPA shells; JSX in `components/` + `app.jsx`
  → compiled to `build/*.js` by `cd tools && node build.js` (CI also does it). Shared data layer: `data/*.js`.
- Static pages get masthead/footer from `scripts/partials.js` via `node scripts/apply-chrome.js`.
  Turkish twins at `/tr/…`: `node scripts/build-tr.js` (`--check` fails on a stale twin; text in `scripts/tr-strings/`).
  Passport pages (EN + TR) and `sitemap.xml`: `node scripts/generate-seo.js`.
  **Rebuild order after editing pages:** `tools/build.js` → `apply-chrome.js` → `build-tr.js` → `generate-seo.js`.
- Data jobs (`backend/`): `scraper.js` (visa maps), `fetch-variants.js` (diplomatic/official passports),
  `fetch-advisories.js` (safety map), `fetch-transit.js`, `fetch-airports.js`, `dispatch-push.js` (app push).
- App: `app/` (Capacitor) — see `MOBILE-SETUP.md`. `assets/app-native.js` runs only inside it.
- Accounts: `assets/account*.js`, rules `firestore.rules`, `firebase.json`. Try without Firebase: `/account/?account=mock`.
- Cache stamps: when a JS/CSS asset changes, bump `ASSET_VERSION` in `scripts/partials.js` and the `?v=` stamps
  (`git grep -l "<old stamp>"`), then run the rebuild order above.

## Tests
`node tools/test-account-sync.js` · `node backend/test-dispatch-push.js` · `node scripts/build-tr.js --check`.
UI: puppeteer-core in `tools/` against `python -m http.server 8000` (launch config "Static site (Python)"; the
app bundle is "App www (Python)" on 8001).

## Gotchas (each cost a debugging round)
- Bash tool halves `\\`: write patch scripts with the **Write** tool, never a heredoc, when they hold regexes or `\n`.
  `String.prototype.replace(str, str)` treats `$$`/`$&` in the replacement — pass a function.
- Many repo files are **CRLF**; anchors containing `\n` fail. Normalise or match single lines.
- All compiled JSX shares one global scope: top-level function names become `window` props. Call shared helpers via `window.`.
- Git Bash rewrites `/paths` in arguments. `git add` of the ~400 generated pages is slow: commit with `run_in_background`.
- Never drive the built-in browser's first tab if the owner has the Firebase console open there.
- `cap sync ios` fails on Windows (symlinks): sync iOS on a Mac; Android sync works here.
