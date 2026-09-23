# travelnow.info — instructions for Claude Code

Static site + React SPA + Capacitor app. Live: https://travelnow.info · Repo: Uygara/atlas-visa-globe ·
Cloudflare deploys every push to `main` (~30 s). Daily data refresh: `.github/workflows/daily-refresh.yml`.

## Working with the owner
- The owner writes Turkish → **reply in Turkish**. Code comments and commit messages in English.
- **Never invent visa data** (fees, rules, numbers, links). If a fact can't be sourced, say so and leave it out.
- The site should run itself: don't hand the owner verification chores — automate them. Owner-only steps
  (accounts, payments, console clicks, logins) go in `TODO.md` "Senin yapacakların", with the exact command.
- The owner wants shipped work pushed. Test first, then commit and push; report the commit hash.

## Session protocol (sessions get long and expensive — keep the start light)
**Start:** read `TODO.md` only (≈90 lines; its first block says where to begin). Do **not** read `STATE.md`
whole (1000+ lines): `grep` it by topic when you need history. `HANDOFF.md` is old (May); ignore it.
**During:** small verified steps; use headless Chrome for UI checks (see Gotchas).
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
