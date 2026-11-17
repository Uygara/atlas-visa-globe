# Autopilot log

Newest run first. Each entry 10 lines or fewer. Playbook: `docs/AUTOPILOT.md`.

## Tried (what shipped and whether it moved the metric 4 weeks later)

| Date | Change | Target metric | Result after 4 weeks |
|------|--------|---------------|----------------------|

## Runs

### 2026-11-17 · weekly run 1 (no code shipped)
- Numbers unchanged from the setup entry below (same day): GA users 154, engaged 12%, SC 47 clicks / 17.4k impr.
  `.autopilot/metrics.tsv` did not exist; not created in the worktree (local history lives in the main checkout).
- Checked the walk findings. The `appendChild` JS error did not reproduce with plain headless Chrome on
  /alerts/, /about/, /etias/, /passport-validity/ (no pageerror), so it is probably from the walk tool's setup.
  "No h1" on the SPA shells is only the rendered DOM: `index.html` has a static `<h1>` inside `#root`. Both left.
- `audit-pages.js`: 0 errors, 10 warnings (404.html short description; no og:image on about, contact, passport,
  privacy, terms and TR twins). Small, left for a later run.
- Not done: ux-walker and a new walk (token budget; the first run mostly confirmed the setup findings).
- Next run: check /passport/cy/ and /passport/tz/ titles for CTR, og:image on the 5 static pages, and why the
  walk sees the `appendChild` error (compare with its flags in `tools/user-walk.js`).

### 2026-11-17 · setup (no changes shipped)
- Numbers (7 days to 11-16): GA users 154 (-26%), sessions 166, engaged 12%. Singapore 66 users with ~0 s
  sessions looks like a bot. Search Console 28 days: 47 clicks, 17.4k impressions, CTR 0.3%, avg position 17.2.
  `/sitemap.xml` still "read never".
- First walk found, for the first real run:
  - JS error `Cannot read properties of null (reading 'appendChild')` on /alerts/, /etias/, /passport-validity/, /about/.
  - No `<h1>` on `/`, `/tr/`, `/itinerary/`, `/transit-map/`, `/safety-map/` (SPA shells).
  - /etias/ served with an English `<title>` but the rendered title was Turkish in headless Chrome with an
    English browser language: check what switches it.
  - /passport/ on phones: ~200 tap targets under 32 px.
  - Lowest CTR with most impressions: `/` (504), `/passport/cy/` (175), `/tr/passport/ua/` (108).
