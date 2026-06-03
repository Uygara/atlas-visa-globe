# Atlas / travelnow.info — Session handoff (current state)

> **Updated:** 2026-06-03 · **Live:** <https://travelnow.info> · **Repo:** <https://github.com/Uygara/atlas-visa-globe>
> Cloudflare Pages auto-deploys every push to `main` (~30 s).
> Working language with the owner: **Turkish.** Code comments: English.
> Hard rule: **never invent visa data.** No fake fees/rules/numbers — if a fact
> can't be sourced, say so and leave it out.

---

## What the site is
A no-build site: a client-rendered React SPA homepage (UMD React + in-browser
Babel, no bundler) + ~200 static SEO pages. Pick your passport → an interactive
D3 globe paints every country by visa status (visa-free / eVisa / visa-on-arrival
/ visa required / no-entry-allowed). Visa data re-scraped daily from public sources via a GitHub
Actions cron. Monetisation: Google AdSense (was REJECTED "needs improvement" —
see below) + empty affiliate slots. There is NO live payment (Premium UI was
removed; backend code is dormant).

---

## Current state — what's live right now

**Three globe experiences** (all reuse `components/globe.jsx`):
1. **Home `/`** — visa globe + side panel. Pick passport, tap a country for a
   detail card (status, fee, visa shortcuts, passport-validity, transit warning,
   news). Side panel order: passport picker → direction → tally → search →
   compare/group modes → collapsible **"For you"** block (weekly digest,
   passport pulse, watchlist, travel-planner CTA, today's pick, news feed).
2. **`/transit-map/`** — transit-visa globe. Whole world: green = airside
   transit open (most countries), red = transit visa required (Schengen ATV /
   UK DATV / US C-1 …), amber = time-limited TWOV. Click a country = its
   transit detail.
3. **`/itinerary/`** — full SPA "Travel planner" (globe-left / panel-right).
   Tap countries to add stops; route draws as numbered markers + dashed
   great-circle arcs; panel shows per-stop visa+fee, total cost, application
   order, apply-by reminders, **.ics download**, share URL, and **Print/PDF**.

**Tools (static pages):** schengen-calculator (90/180 + Article-24 cascade),
etias, digital-nomad-visa, citizenship-by-investment, alerts (free, 3-country),
about, privacy. visa-shortcuts + passport-validity + esta-rules pages still
exist (SEO) but are **de-tabbed** — their info now surfaces in the home detail
card. `/transit-visa/` 301-redirects to `/transit-map/` (via `_redirects`).

**Top nav:** Transit map · Travel planner · Schengen + **Tools ▾** (ETIAS,
Nomad visas, Second passport, Alerts). Settings ⚙ holds lang / theme / 3D-2D /
compare / group. A `?` button reopens the intro.

**i18n:** 6 languages (en/tr/es/de/fr/ar). SPA uses `window.t()` (`data/i18n.js`).
Static pages use `data/static-i18n.js` — a DOM text-node walker keyed on the
English source string, with: a MutationObserver (translates JS-rendered content
live), `data-i18n-html` (whole-paragraph innerHTML for sentences split by
`<strong>`/`<a>`), and whitespace-normalised lookup (matches multi-line
paragraphs). **TR is complete across all pages** (verified by audit). es/de/fr/ar
have the highest-visibility body copy; long legal/FAQ prose still falls back to
EN in those four (engine ready — just add dict entries).

---

## What we did this arc, and how

- **Reddit feedback round 3 (FIXED):**
  - **New curated override layer `data/visa-overrides.js`** — consulted by
    `resolveStatus` BEFORE the scraped data, so corrections survive the daily
    re-scrape (which only rewrites passports.js). Loaded in all SPA HTML pages
    right after passports.js. Holds: (a) `STATUS_OVERRIDES[pass][dest]` and
    (b) a freedom-of-movement rule.
  - **Cuba e-visa ineligibility.** 22 nationalities (Philippines, Pakistan,
    Nigeria, Iran, …) can't use the Cuba e-visa and must apply at a consulate —
    Wikipedia lists them as "eVisa". Overridden to `vr`. Source:
    cubavisa.uk/countries-that-need-to-apply-directly (confirmed vs evisacuba.cu).
  - **Freedom of movement.** EEA-internal (EU + IS/LI/NO + CH) and the UK–Ireland
    CTA are now shown as visa-free with NO day cap + an `fom` flag → the detail
    card reads "Freedom of movement / no time limit" instead of inventing
    "visa-free 90 days" (the Reddit UK→Ireland complaint). i18n `detail.fom*`.
  - **Scraper root-cause fixes (re-scraped):** (1) process EXACTLY ONE table —
    the main visa table (Country + status + allowed-stay) — because secondary
    regional tables polluted data (India→Malaysia wrongly read "visa on arrival";
    now correctly visa-free 30d). (2) strip footnotes from the destination name
    before ISO lookup (Vietnam[295] was silently dropped). (3) iso-map: "United
    Kingdom and Crown dependencies"→GB (fixes UK ETA showing as visa-free for
    AU/NZ), + FSM / British Virgin Islands / The Bahamas.
  - **Passport combos more discoverable.** The compare/group bar was a tiny
    "MODES" label nobody found; now a titled card "Hold more than one passport?"
    with a one-line explainer and Compare / Combine buttons.
  - **Mobile bottom-sheet drag.** iOS fires pointercancel (not pointerup) when it
    reclassifies a touch as a scroll; without handling it `dragging` stayed stuck.
    Added a pointercancel handler + sticky, bigger grabber. Follow-up: the sheet
    then couldn't be dragged *down* — the visible grabber span had the default
    `touch-action:auto`, so iOS treated a downward press on it as a panel scroll
    and cancelled the gesture (upward worked only because a full sheet has nothing
    to scroll). Fixed with `pointer-events:none; touch-action:none` on the grabber
    so the press routes to the handle (touch-action:none) and both directions drag.
- **Reddit feedback round 2 (FIXED):**
  - **New 5th status `ban` ("No entry allowed").** Countries that refuse a
    nationality entirely (e.g. 10 countries refuse Israeli citizens; some refuse
    Iranians) used to show as plain "Visa required". Added `ban` across the whole
    stack: scraper classifier ("admission refused/restricted", "entry banned",
    "no entry" → `ban`, never elected as default), `buildPassportEntry`,
    `frontend-tail.js` (norm/tally/group), `globe.jsx` STATUS_COLOR/HEX/stripes,
    `panel.jsx` tally row (only shown when count>0) + VisaFeeBox suppressed for
    bans, `--ban: #7f1020` dark-crimson CSS var, i18n `status.ban` in all 6 langs.
    Now: 28 passports carry ≥1 ban (IL=10).
  - **ESTA & friends now eVisa, not visa-free.** The classifier missed several
    electronic-authorisation brand names, so US ("Visa Waiver Program"),
    Australia ("eVisitor"), New Zealand ("NZeTA") fell through to default `vf`.
    Added visa-waiver / evisitor / nzeta / k-eta to the eVisa matcher. US/AU/NZ
    now correctly read `ev` for VWP passports (DE/GB/JP/FR/SG…).
  - **iPhone: dropdowns/menus now collapse on tap-outside.** Outside-close used
    `mousedown`, which iOS Safari doesn't fire on non-button taps, so the Tools
    dropdown and hamburger sheet couldn't be dismissed by tapping away. Switched
    to `pointerdown` (fires for touch) and added the same tap-outside-to-close to
    the hamburger sheet (`headerRef`).
  - Required a full re-scrape (classifier changes only affect new data). The
    bulk reclassification diff was kept OUT of the changelog feed (reverted
    `changelog.js`) since these are taxonomy fixes, not real-world visa changes.
- **Canada data bug (Reddit feedback, FIXED):** Canada showed "visa-free
  everywhere". Root cause was a silent scraper failure: Canada's Wikipedia page
  heads its column **"Entry requirement"** (not "Visa requirement"), so the
  table matcher found nothing → 0 rows → `buildPassportEntry` fell to
  `default:vf` with empty exceptions (logged as `✓ 0 rows`, no alarm), and the
  bad result persisted in the snapshot day after day. Fixes in `scraper.js`:
  (a) matcher accepts "entry requirement"; (b) **0-row guard** now carries
  forward the previous snapshot instead of writing an all-visa-free entry;
  (c) added British "Electronic Travel Authorisation" spelling. `iso-map.json`:
  added "Australia/Denmark/France and territories" name variants (these were
  also silently dropped → Australia wrongly vf). Canada now: 85 exceptions
  (RU=vr, IN/AU=ev, etc.). Regenerated surgically (Canada only, date preserved).
- **Onboarding/UX:** intro modal shows first; passport is remembered
  (localStorage `atlas.passport`) instead of always re-detecting; one-time
  "tap a country" coach hint; floating + collapsed "Recently changed" feed
  (top-left, doesn't cover globe); visible compare/group mode bar; mobile
  draggable bottom-sheet (peek/half/full snaps).
- **Transit correctness:** the UK DATV list was wrong (omitted Turkey!). Now
  pulled from the authoritative **legislation.gov.uk Schedule 1** XML by
  `backend/fetch-transit.js` → `data/transit-visa-data.js` (70 nationalities,
  Turkey included). Schengen ATV = EU common list.
- **Passport variants** (diplomatic): `backend/fetch-variants.js` scrapes the
  canonical "Holders of X diplomatic passports may enter…" Wikipedia section
  (strict anchor + ≥25 threshold → no false data). Currently CN/RU/ID; merged
  into `data/passport-variants.js` without clobbering the hand-curated TR entry.
  Most countries don't publish a parseable list, so coverage stays small by
  design (row-level scraping gave misleadingly-tiny sets → deliberately skipped).
- **SEO/AdSense (the big push):**
  - Homepage was an empty SPA shell to crawlers → added real crawlable content
    INSIDE `#root` (H1, intro, 10 passport links, tool links, "how data is
    built"); React replaces it on mount. `<noscript>` hides the loading pulse.
  - sitemap + canonicals were **relative** (Google ignores those) → fixed
    `scripts/generate-seo.js` to default `SITE_URL=https://travelnow.info`;
    regenerated all 200 pages + sitemap as absolute URLs. robots.txt absolute.
  - Removed the empty Premium/Pro UI from the alerts page (looked
    "under construction" = an AdSense trigger).

---

## Key files
- `index.html` — SPA shell + crawlable static content + script loads (cache-bust
  `?v=YYYYMMDDx` on the 3 JSX tags; **bump it when you change app.jsx / panel.jsx /
  globe.jsx**).
- `app.jsx` — App root, TopNav, IntroHook, CoachHint, Settings, detection.
- `components/panel.jsx` — side panel + DetailCard + all widgets + ForYouSection
  + MobileSheetHandle + Changelog/News/Watchlist/Pulse/Digest/DailySuggestion.
- `components/globe.jsx` — D3 globe; optional decoupling props `fillResolver`,
  `hoverRenderer`, `arcs`, `stopMarkers` (used by transit-map + itinerary).
- `components/transit-map.jsx`, `components/itinerary-app.jsx` — the two SPA pages.
- `data/i18n.js` (SPA dict), `data/static-i18n.js` (static-page engine + dict).
- `data/visa-overrides.js` — hand-curated corrections (Cuba e-visa ineligibility,
  freedom-of-movement) consulted by `resolveStatus` before scraped data; survives
  the daily re-scrape. Loaded after passports.js in every SPA page.
- `data/*.js` — countries, passports (scraper-generated), transit-visa-rules +
  -data, passport-variants + -data, visa-news, destination-tips, etias-rules, etc.
- `backend/` — `scraper.js` (daily visa data), `fetch-news.js`, `fetch-transit.js`,
  `fetch-variants.js`, dispatch-*. Wired in `.github/workflows/daily-refresh.yml`.
- `scripts/generate-seo.js` — builds `/passport/<iso>/` pages + sitemap.

## Quirks / gotchas
- **Preview tool aggressively caches no-query data files** (`data/*.js`), so the
  in-browser preview often shows stale i18n/data. Always confirm against the
  SERVED file (`fetch(... ?bust=)`); production is fine (no-cache meta + Cloudflare).
- The daily cron rewrites passports.js / changelog.js / visa-news.js /
  transit-visa-data.js / passport-variants-data.js / sitemap and commits as
  `atlas-bot`. It also re-adds dated sitemap lastmods.
- `node -c` can't lint `.jsx` (Babel-transformed in browser) — verify JSX via
  the preview instead.
- Commit/push pattern (Windows): `git -c user.email=atlas-bot@local -c
  user.name=atlas-bot commit -m "…"` then `git pull --rebase origin main && git push`.

---

## Why no traffic / AdSense rejection — diagnosis (root causes)
1. Homepage was crawler-empty (FIXED) and sitemap/canonicals were relative
   (FIXED) → pages weren't being discovered/indexed.
2. Brand-new domain, **zero backlinks, no promotion** → SEO needs weeks + active
   distribution.
3. Passport pages are data-table-heavy with little unique prose → Google may
   treat them as thin/template pages; AdSense wants original written content.

## NEXT — prioritised
1. **Content (do this; it's the lever):**
   - Add a unique intro paragraph + ranking/highlights to each `/passport/<iso>/`
     page in `scripts/generate-seo.js` (fix the "thin pages" problem).
   - Write 3–5 real guide articles targeting search queries
     ("Türk pasaportu vizesiz ülkeler 2026", "Schengen 90/180 nasıl hesaplanır",
     "transit vize rehberi"). These are the only realistic organic-traffic source.
2. **Owner actions (not code):**
   - Google Search Console: resubmit sitemap + "Request Indexing" on `/` and key
     pages (do now that crawlable content + absolute URLs shipped).
   - **Distribution: the owner has already posted to Reddit** (this session).
     Continue: Ekşi, X (screen-recording/GIF of the globe), Product Hunt (launch
     once guides are live so visitors land on a full site), niche travel forums.
   - Reapply to AdSense ~2–4 weeks after content + some organic traffic exist.
3. **Later:** finish es/de/fr/ar for long legal/FAQ prose; re-enable Premium
   (wire Stripe + ungate) once there's traffic to monetise; expand visa-fee DB
   and diplomatic-variant coverage as sources allow.

## Reddit launch (posted) — assets used
- Hook: "Pasaportunla nereye vizesiz gidebilirsin — interaktif harita" /
  EN: "I built a free interactive globe that shows where your passport gets you
  visa-free — updated daily."
- Best media = a 10–15 s **screen-recording / GIF** of picking a passport and the
  globe painting (link in first comment, not the post body, on link-averse subs).
- Subreddits: r/solotravel, r/travel, r/digitalnomad, r/passports, r/Turkey.
- Tone: "I made this, hope it's useful" — not promotional.
