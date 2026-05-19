# Atlas Visa Data — Daily Refresh Backend

This folder contains the scaffolding for keeping the visa policy data fresh
**every day, automatically**, by scraping Wikipedia's "Visa requirements for X
citizens" pages and rebuilding `data/passports.js`.

## How it works

```
┌─────────────────────────┐
│ GitHub Actions (cron)   │  ← runs every day at 06:00 UTC
│ "Daily visa refresh"    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ scraper.js              │  ← Node.js script
│  • fetches Wikipedia    │
│  • parses visa tables   │
│  • diffs vs yesterday   │
│  • writes JSON          │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ data/passports.js       │
│ data/changelog.js       │  ← updated, committed to git
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Cloudflare Pages /      │
│ Vercel auto-deploys     │  ← site rebuilds within ~30 s
└─────────────────────────┘
```

The result: every morning, the site shows today's visa data, and the
"Recently changed" feed reflects what actually shifted in the last 24 h.

## Files

- `scraper.js` — the main scraping script (Node.js, no dependencies beyond `node-fetch` and `cheerio`)
- `package.json` — npm dependencies
- `.github/workflows/daily-refresh.yml` — GitHub Actions cron config
- `data-schema.md` — the JSON schema expected by the frontend
- `README.md` — this file

## Setup (one-time, ~30 minutes)

### 1. Install Node.js locally
Download from [nodejs.org](https://nodejs.org). Verify with `node -v`.

### 2. Clone the project + install deps
```bash
cd backend
npm install
```

### 3. Try a dry run
```bash
node scraper.js --passport US --dry-run
```
You should see the parsed visa table for the US passport printed to stdout
without modifying any files.

### 4. Run for real
```bash
node scraper.js --all
```
This fetches all ~200 passports (takes ~5 min, rate-limited to be polite to
Wikipedia) and writes:
- `../data/passports.js` (replacing the static snapshot)
- `../data/changelog.js` (adding new entries for any status changes)

### 5. Push the workflow
Once you're happy with the local output, commit
`.github/workflows/daily-refresh.yml`. The Action will run automatically every
day at 06:00 UTC.

### 6. Deploy
The site itself is a static HTML build. Push to GitHub, connect to:
- **Cloudflare Pages** (recommended — free, fast CDN) — or
- **Vercel** / **Netlify**

Whenever the Action commits new data, the deployment redeploys within ~30 s.

## Why scrape Wikipedia instead of an official API?

| Source | Cost | Freshness | License |
|---|---|---|---|
| **Wikipedia** | Free | Updated by global community, usually within 24-48h of policy change | CC-BY-SA — fine for non-commercial; for commercial use attribute clearly |
| **IATA Timatic** | $$$$ ($5K+/month) | Real-time, airline-grade | Restrictive — used by airlines |
| **Henley & Partners API** | $$$ (request quote) | Quarterly updates | Commercial license |
| **iVisa Business API** | $$ (partner program) | Live | Commercial, requires affiliate agreement |

Wikipedia is the right starting point. If the site grows, upgrading to a paid
feed becomes worthwhile (and you can pay for it from affiliate revenue).
