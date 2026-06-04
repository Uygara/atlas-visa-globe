# Atlas / travelnow.info — Session handoff (current state)

> **Updated:** 2026-06-04 · **Live:** <https://travelnow.info> · **Repo:** <https://github.com/Uygara/atlas-visa-globe>
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

- **Reddit feedback round 4 (FIXED) — data accuracy push:**
  - **Scraper gap-fill for territories.** Hong Kong, Macau and Taiwan live in a
    *secondary* Wikipedia table ("Territory" / "Conditions of access" headers),
    which the round-3 "main table only" rule skipped → they fell to each
    passport's default for everyone. New logic: process the main table fully,
    then add ONLY destinations it omits from later tables. Now India→Hong Kong =
    eVisa, India→Macau = visa-free, Antigua→Taiwan = visa required. Does NOT
    reintroduce the Malaysia bug (secondary tables can't override the main one).
  - **Visa-free day counts.** A visa-free destination with a non-90-day stay used
    to silently inherit 90. `buildPassportEntry` now keeps those as explicit
    exceptions → Türkiye→South Africa and Canada→China correctly show 30 days.
    (This is why the re-scrape diff was ~2700 entries — granularity, not real
    changes; changelog reverted.)
  - **"Restricted" ≠ banned.** "admission/entry/travel restricted" now maps to
    visa-required, not `ban`. India→Pakistan is no longer "no entry allowed"
    (pilgrimage/family visas exist). Only "refused/banned/prohibited" stays `ban`.
  - **Override + caveat layer grew** (`data/visa-overrides.js`):
    - Canada→South Korea → visa-free (K-ETA waived through 31 Dec 2026; was eVisa).
    - **Entry-mode caveats** (`ENTRY_CAVEATS`, shown as a ⚠️ line in the detail
      card via `window.entryCaveat`): India eVisa = airports/seaports only (land
      borders need a sticker visa), Russia visa-free limited to some airports,
      Canada eTA air-only, South Africa e-Visa airport-only, China visa-free
      "temporary through 2026". Addresses the "land vs air entry" feedback.
    - `resolveStatus` now passes an override `note` through to the detail card.
  - Verified every disputed pair against Wikipedia first (Saudi→ZA/UG were already
    correct = eVisa; India→New Zealand correctly visa-required — NZeTA is only for
    visa-waiver nationals, India isn't one — so those two needed no change).
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
  - **Mobile bottom-sheet drag (took 3 passes — the real cause was layout).**
    Symptoms reported in order: can't pull up → can't pull down → doesn't move at
    all. Root cause: `.panel` is a column flexbox and `.sheet-handle` had the
    default `flex-shrink:1`, so once panel content overflowed the handle collapsed
    to ~5px — an almost untappable sliver (this, not the JS, was the whole
    problem). A mis-step in pass 2 (`pointer-events:none` on the grabber) then
    made even that sliver pass touches through to the content → fully dead.
    Final fix: `flex:none` on the handle (keeps a full 34px target) + drop
    pointer-events:none (keep touch-action:none so iOS doesn't treat the press as
    a scroll) + snap on release using the last dragged height (`lastH`) instead of
    re-reading getBoundingClientRect (which returns the pre-transition height and
    snapped back). Verified both directions + tap-cycle via coordinate hit-testing.
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
- `data/visa-overrides.js` — hand-curated layer consulted by `resolveStatus`
  before scraped data; survives the daily re-scrape; loaded after passports.js in
  every SPA page. Holds: `STATUS_OVERRIDES[pass][dest]` (Cuba e-visa ineligibility,
  Canada→Korea K-ETA waiver), the `isFreedomOfMovement` rule (EEA + UK–Ireland
  CTA), and `ENTRY_CAVEATS` + `entryCaveat()` (land-vs-air / time-limited notes
  shown as a ⚠️ line in the detail card). **This is where most future hand
  corrections should go** — it never gets clobbered by the cron.
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

## Reddit feedback — status tracker (as of round 4)

**DONE / shipped:**
- "No entry allowed" status (`ban`) — Israel & co. · UK→Ireland freedom of movement
- India→Malaysia 30-day visa-free (was VoA) · Cuba e-visa ineligible list (PH etc.)
- ETA ≠ visa-free: US (VWP/ESTA), Australia (eVisitor), NZ (NZeTA), UK ETA, K-ETA
- HK / Macau / Taiwan now resolve correctly (gap-fill) · visa-free day counts
  (TR→ZA, CA→CN = 30) · India→Pakistan = visa-required not banned
- Canada→Korea visa-free (K-ETA waiver) · Canada→China 30 days + "until 2026" note
- Entry-mode caveats (India eVisa land border, Russia/Canada/SA/China) in detail card
- Passport-combo bar more discoverable · mobile bottom-sheet drag (both directions)

**Already correct (reporter mistaken):** Saudi→South Africa/Uganda = eVisa (not
visa-free); India→New Zealand = visa-required (NZeTA is only for visa-waiver
nationals). Antigua→Taiwan was wrong → now fixed (visa-required).

**PENDING / roadmap (bigger features, NOT yet built):**
1. **Multiple passport *classes / travel documents*.** Reporters want BNO / BOC /
   BOTC (British nationality classes), plus alien passports / refugee travel
   documents. We only have a small *diplomatic* variant layer
   (`data/passport-variants*.js`). This needs a new data model (a passport can
   have several "classes", each with its own visa map) + a class picker in the
   panel. Sizeable; needs sourced per-class data.
2. **Residence-permit holder mode.** "I hold a US green card / EU permit — where
   does that get me?" Partly expressible via `data/visa-conditions.js`
   (`ifHolds: ["US","SCHENGEN",…]`), which already powers the "if you also hold X
   visa" shortcuts in the detail card. Roadmap: a dedicated "add a residence
   permit" control that recomputes the whole map, not just per-country shortcuts.
3. **Entry-mode modelling (beyond notes).** We added *caveat notes*; a fuller
   model would store mode-specific statuses (air vs land/sea). Probably overkill —
   notes likely enough.
4. **Dual-citizenship "combo".** Compare mode already shows "which passport is
   better per country" and Combine (group) shows best-of. If reporters still miss
   it, the gap is naming/onboarding, not capability — consider a one-time tip.
5. **Expand `visa-conditions.js`** (US/Schengen-visa exemptions, transit/layover
   rules) — hand-curated, high trust value, currently only a handful of entries.

## Open-sourcing the repo — decision notes (owner asked)
- **Secrets are safe to publish:** all live secrets are GitHub Actions Secrets
  (`${{ secrets.* }}`), `.gitignore` excludes `.env*`/`.dev.vars*`; no real keys
  committed. The only public-by-design value is the AdSense publisher id in
  `data/ads.js` (already visible in served HTML). Minor risk: a clone embedding
  your pub-id for click-fraud → could get your AdSense account banned. If
  open-sourcing, move the id to a build-time/runtime config kept out of the repo.
- **Profit is still possible** — the moat is the domain, traffic, brand and SEO,
  not the code (it's a scraper + static site). But a permissive licence (MIT)
  lets anyone host a clone with their own ads. Use **AGPL-3.0** (or
  source-available) to discourage closed commercial clones.
- **"Will I get hacked?"** Publishing client code reveals nothing new (it's all in
  the browser already). The real risk is **malicious PRs** from strangers — so:
  protect `main` (require PR review, no direct pushes), never give push access,
  review every PR line-by-line (watch for exfiltration / crypto-miners / ad
  fraud), keep the cron's secrets in protected env only.
- **Recommendation:** if you want the free help, either (a) keep it private and add
  the one vetted dev as a collaborator, or (b) open-source under AGPL with branch
  protection + careful review. Don't MIT-license it while you still hope to monetise.

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
