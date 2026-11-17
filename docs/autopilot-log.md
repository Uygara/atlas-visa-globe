# Autopilot log

Newest run first. Each entry 10 lines or fewer. Playbook: `docs/AUTOPILOT.md`.

## Tried (what shipped and whether it moved the metric 4 weeks later)

| Date | Change | Target metric | Result after 4 weeks |
|------|--------|---------------|----------------------|

## Runs

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
