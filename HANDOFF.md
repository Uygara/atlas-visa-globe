# Atlas / travelnow.info — Project Handoff

Last updated: 2026-05-22. Live at <https://travelnow.info>. Source at
<https://github.com/Uygara/atlas-visa-globe>. Cloudflare Pages auto-deploys
on every push to `main` — usually ~30 seconds.

## What Atlas is

Single-page React app (UMD, no build step) + ~205 static SEO pages. It shows
visa requirements for 200+ passports on an interactive D3 globe. Data is
re-scraped daily from public visa-policy pages via a GitHub Actions cron.

Monetisation: Google AdSense (Auto Ads, pending approval as of 2026-05-22),
affiliate links (iVisa / Airalo / etc., empty until codes arrive), and a Pro
tier for paid email alerts ($2/mo via Stripe Checkout).

## What you're picking up — active issues from the user (2026-05-22)

All five issues from the previous handoff are SHIPPED in commits `0aeccf9`,
`5071bbf`, `6d20c58`:

1. ~~Mobile top-bar stability~~ — hamburger menu, no more side-scrolling.
2. ~~Theme default~~ — switched to light (returning users keep their pref).
3. ~~Mobile pinch-zoom~~ — `user-scalable=no` on the SPA only.
4. ~~i18n gaps~~ — DetailCard, Hover, AlertsCTA, VisaFeeBox, Affiliate,
   picker placeholders, group, zoom controls, legend, welcome overlay all
   wrapped in `window.t()`. Country names localised via
   `data/country-names.js` (TR full, ES/DE/FR/AR major). Static pages
   share `data/static-i18n.js` — one script does DOM walking + lang
   switcher, persists choice via `localStorage.atlas.lang`.
5. ~~2D wrap~~ — switched flat-mode projection from `geoNaturalEarth1` to
   `geoEquirectangular` with rotation-based horizontal pan. World cycles
   infinitely.

## New active issues (2026-05-23)

1. ~~Conditional / nested visa rules~~ — shipped in commits `4aab6ff` +
   `b1a5704`. Surface in DetailCard via `ConditionsBox`; data from
   `data/visa-conditions.js` (hand-curated) merged with scraper output
   on `PASSPORTS[iso2].cond` (extracted from Wikipedia Notes column by
   `extractConditions()` in `backend/scraper.js`). Manual entries win
   on key collision since they're verified + sourced. The scraper
   pattern needs to be exercised on the next daily refresh — verify
   the auto-extracted set on a known case (e.g. IN → TR) and broaden
   the keyword list if it misses obvious matches.

2. ~~Theme fixes / brand simplification~~ — shipped in `d228435`.
   Light-theme sphere now flips to ocean blue (CSS vars drive SVG
   gradient stops). Topbar / panel / mobile menu sheet drop the
   hardcoded dark backgrounds. Brand mark replaced with bare
   `travelnow.info` text. Favicon rewritten + PNG fallback dropped.
   Footer carries © year + 'All rights reserved'.

3. **Passport type variants (ordinary / service / diplomatic / special).**
   Many countries issue multiple passport types and the visa policy for
   each is very different. Turkey example: bordo (ordinary), hususi
   (yeşil — civil servants), hizmet (gri — service), siyah (diplomatic).
   Wikipedia has separate articles for each: 'Visa requirements for
   holders of Turkish diplomatic passports' etc. Atlas currently only
   reads the ordinary passport. Needs:
   - **Schema:** `PASSPORTS[iso2].variants = { ordinary: {...},
     diplomatic: {...}, service: {...} }` keyed identically to the
     current top-level fields.
   - **Scraper:** new `PASSPORT_TARGETS_VARIANTS` list with the
     diplomatic/service slugs (the Wikipedia URL pattern is well-known).
     Roughly +400 fetches at the current rate — ~8 minutes per daily
     cron run, acceptable.
   - **UI:** below the primary picker, when the active passport has
     variants populated, show a small segmented control (Bordo / Yeşil /
     Gri / Siyah for TR; Ordinary / Diplomatic / Service / Special for
     others). Default to ordinary. Persist choice in localStorage.
   - **i18n:** `passport_type.ordinary` / `.diplomatic` / `.service` /
     `.special` for the segmented control labels.
   - Affects the same recompute path as the regular picker — `tally`,
     `resolveStatus`, `resolveGroupStatus` need to look up the variant
     map first, then fall back to ordinary.

4. **Real multi-passport (dual citizenship) experience.** Inline
   "+ Compare with another passport" promotion shipped in `d228435`,
   but it currently piggybacks on `compareMode` (stripe overlay). For
   dual citizens the more useful question is "which passport should I
   use for this destination?" — i.e. surface the BEST of the two,
   not the diff. Possible UI:
   - When two passports are active, DetailCard could lead with a
     "Recommended: 🇹🇷 ordinary visa-free" pill and only secondarily
     show the second passport's status.
   - Group mode is a separate use case (family travel — worst-case
     visa). Keep distinct from dual citizenship.

## Older queued items — status

- ~~**Conditional rules — KEYWORDS expansion**~~ shipped `9d778d1`.
  EU/EEA, GCC, PR, ILR, green-card phrasings all match now.
- ~~**Citizenship-by-investment comparison page**~~ shipped `ad53111`.
  16-row table at /citizenship-by-investment/ with Caribbean + Malta
  + TR + UAE + Vanuatu etc. Hand-curated; re-verify every ~6 months
  as governments tweak thresholds.
- ~~**Pro tier apply-by reminders**~~ backend half shipped `76a7896`.
  /api/reminders POST + GET, backend/dispatch-reminders.js, daily
  cron step. **Open:** the /itinerary/ page still lacks the "Email
  me reminders" form that POSTs to the new endpoint — small UI
  change for next session.
- ~~**Static-page i18n tail strings**~~ shipped `1fcc8bd` for /about/
  and /privacy/ paragraphs that are plain text (no inline tags).
  **Open:** mixed-content paragraphs with embedded `<a>` / `<strong>`
  still fall through to English on those pages and the alerts /
  itinerary forms. Adding `data-i18n-key` attributes on those
  elements + an HTML-key dictionary entry would close the gap.
- ~~**Visa-fee database expansion**~~ shipped `4adff03`. CN / JP / KR
  / BR / AE source passports each cover ~10 destinations; 50 new
  rows total. Next: Southeast Asian sources (TH / VN / ID / PH) and
  African sources (NG / EG / KE) once traffic justifies.

## Setup items the user still needs to do (no code involved)

Tracked in ALERTS-SETUP.md. Status:

| Step | Status | Action |
|---|---|---|
| Google AdSense | Submitted 2026-05-21, in review | Wait. Code is on every page; auto ads will fill once approved. |
| Cloudflare Email Routing | Not done | 5 min — set `hello@travelnow.info` forward to personal inbox; then we can wire it back into /about/ + /privacy/ contact lines. |
| iVisa affiliate | Pending | Wait for code → paste into `data/affiliates.js`. |
| Airalo affiliate | Pending | Wait for code → paste into `data/affiliates.js`. |
| Stripe + Resend + Cloudflare KV (for Pro alerts + reminders) | Not done | ~45 min — follow ALERTS-SETUP.md. Once configured, both `dispatch-alerts` and `dispatch-reminders` start sending. |
| Search Console | Done — sitemap submitted | Google indexes ~1 week. /citizenship-by-investment/ was added to sitemap.xml + scripts/generate-seo.js so it'll appear on the next refresh. |

## New active issues (2026-05-24)

1. **Passport expiry reminder email (Pro tier).** Users who entered a
   passport on the SPA could opt in to "remind me 6/3/1 month before my
   passport expires". Many countries require ≥6 months validity at entry,
   so missing the window blocks travel.
   - **Capture:** add a "Save my passport details" form somewhere (likely
     under the picker, or in the Pro upgrade page) that takes
     `{passportIso, expiryDate}` and POSTs to `/api/passport-expiry`.
   - **Store:** new field on the subscriber KV record:
     `passport: { iso2, expiry, addedAt }`.
   - **Dispatch:** extend `backend/dispatch-reminders.js` (or new sibling)
     to scan for `expiry - today ∈ {180, 90, 30, 7}` days and send a
     templated email with the renewal embassy link.
   - **Pro-gate** like the itinerary reminders.

## Open follow-ups (small, not blocking)

- /itinerary/ → wire the "Email me reminders" form to POST to
  /api/reminders. UI: under the .ics download, a small "Pro:
  email me 7/3/1 days before each apply-by" section that reads
  email from localStorage and shows the Pro upgrade CTA if the
  subscriber's tier is "free".
- Static-page mixed-content paragraphs (about/privacy) — switch
  to `data-i18n-key` attribute + DICT_HTML entry so we can
  translate paragraphs that embed `<a>` / `<strong>`.
- Passport type variants beyond Türkiye — scraper extension to
  read the `Visa_requirements_for_holders_of_<adj>_diplomatic_passports`
  Wikipedia articles and populate
  `PASSPORTS[iso2].variants.diplomatic/.service` for the major
  passports (CN, IN, RU, etc.) so the framework shipped in
  `b72896a` lights up automatically.

## What's done — quick map of the codebase

### Top-level structure

```
/
├─ index.html                  # SPA shell (loads /app.jsx + /components/*.jsx)
├─ app.jsx                     # Main App + TopNav + WelcomeOverlay + SettingsButton + LangSwitcher
├─ 404.html                    # Custom 404 with fuzzy "did you mean?" passport suggestions
├─ ads.txt                     # Google AdSense ownership line
├─ sitemap.xml                 # Regenerated by scripts/generate-seo.js
├─ robots.txt                  # Cloudflare-managed
├─ components/
│  ├─ globe.jsx                # D3 globe + MicroStateMarkers + HoverCard + ZoomControls
│  └─ panel.jsx                # Side panel: PassportPicker, GroupPicker, DirectionToggle, Tally, CountrySearch, DetailCard, AdSlot, AlertsCTA, AffiliatePartners, VisaFeeBox, Changelog, PanelFooter
├─ data/
│  ├─ countries.js             # 206 countries: id (numeric), iso2, name, continent, flag, lat/lon
│  ├─ passports.js             # AUTO-GENERATED by scraper. RAW_PASSPORTS + resolveStatus + resolveGroupStatus + tally + tallyIncoming + tallyGroup + TERRITORY_ALIAS
│  ├─ passports-snapshot.json  # Yesterday's scrape, used for diff
│  ├─ changelog.js             # Today's diff entries (auto-populated)
│  ├─ digital-nomad-visas.js   # Hand-curated 38 DN visa programs
│  ├─ visa-fees.js             # Hand-curated visa fee/timing data per (passport, dest) pair (~50 pairs so far)
│  ├─ affiliates.js            # 5 affiliate slots, URLs empty until user has codes
│  ├─ ads.js                   # AdSense clientId + slot IDs (clientId set, slot IDs empty)
│  └─ i18n.js                  # T dictionary: en, tr, es, de, fr, ar. window.t(key, vars) helper.
├─ backend/
│  ├─ scraper.js               # Wikipedia scraper, runs daily via GH Actions
│  ├─ frontend-tail.js         # Appended after scraper rewrites passports.js
│  ├─ dispatch-alerts.js       # GH Actions cron: reads KV, sends per-subscriber digest via Resend
│  ├─ iso-map.json             # Name → ISO2 mapping for the scraper
│  ├─ package.json             # node-fetch + cheerio
│  └─ README.md
├─ scripts/
│  ├─ generate-seo.js          # Emits /passport/<iso>/index.html for all 200 passports + sitemap.xml
│  └─ make-og.py               # Generates /assets/og.png + favicon.png + favicon.svg
├─ functions/                  # Cloudflare Pages Functions (backend for alerts)
│  ├─ api/
│  │  ├─ subscribe.js          # POST: store + send confirmation email
│  │  ├─ confirm.js            # GET ?token=...: flip confirmedAt
│  │  ├─ unsubscribe.js        # GET ?token=...: remove + cancel Stripe sub
│  │  ├─ upgrade.js            # POST: start Stripe Checkout for $2/mo Pro
│  │  ├─ portal.js             # POST: Stripe billing portal URL
│  │  └─ webhook/stripe.js     # Stripe webhook: lifecycle events
│  └─ lib/
│     ├─ jwt.js                # Web Crypto HMAC-SHA256 token signer
│     ├─ store.js              # ATLAS_SUBSCRIBERS KV wrapper
│     ├─ email.js              # Resend API wrapper
│     ├─ stripe.js             # Stripe REST client + webhook sig verify
│     └─ http.js               # Tiny json/error/redirect helpers
├─ assets/
│  ├─ og.png                   # 1200×630 social card
│  ├─ favicon.png + .svg       # White + light-blue minimal world-map
├─ alerts/index.html           # Subscribe to visa-change alerts
├─ schengen-calculator/index.html  # 90/180 calculator, localStorage, .ics-capable
├─ itinerary/index.html        # Multi-stop visa planner + departure date + .ics
├─ digital-nomad-visa/index.html  # 38-country DN visa comparison table
├─ about/index.html
├─ privacy/index.html
├─ passport/index.html         # Auto-generated directory of all 200 passports
├─ passport/<iso>/index.html   # ×200, regenerated daily
├─ .github/workflows/daily-refresh.yml  # Cron: scrape + regen SEO + dispatch alerts
└─ ALERTS-SETUP.md             # User-facing setup guide (Turkish) for the alerts backend
```

### Key conventions

- **No build step.** All scripts loaded as `<script src>` or `<script type="text/babel">`.
  Edit `.jsx` directly, Babel transforms in-browser at runtime.
- **i18n.** Wrap any user-visible string in `window.t("namespace.key")`. Add the
  key in `data/i18n.js` for every language (or just `en` — others fall back).
  React components must subscribe to `atlas:lang` events to re-render on
  language switch — see TopNav / Panel for the pattern.
- **Status taxonomy.** Four statuses + two specials:
  `vf` visa-free · `ev` eVisa · `voa` visa on arrival · `vr` visa required ·
  `self` (home country) · `na` (no data). Strictness order is `vf < ev < voa < vr`.
- **Compare mode visualisation.** When two passports are selected and their
  status for a country differs, the country renders with an SVG diagonal
  stripe pattern `url(#stripe-{primary}-{compare})`. 12 patterns defined in
  globe.jsx's `<defs>`.
- **Group mode.** Up to 4 passports — `window.resolveGroupStatus` returns the
  **worst** status across the group ("worst-case visa").
- **Territory aliases.** `EH→MA`, `GL→DK`, `FK→GB`, `PR→US`, `NC/PF/TF→FR` —
  dependent territories inherit parent visa policy. Defined in `passports.js`
  (window.TERRITORY_ALIAS) and mirrored in `scripts/generate-seo.js`.
- **Topology.** `world-atlas@2.0.2/countries-50m.json` (~750 KB). Loaded
  on demand by globe.jsx. Includes Kosovo / N. Cyprus / Palestine / HK / Macao
  as separate polygons.
- **Cache safety.** `<meta http-equiv="Cache-Control" content="no-cache, must-revalidate">`
  is on `index.html` so Cloudflare doesn't pin a stale HTML for hours after a deploy.
- **PowerShell quirks.** This is a Windows machine. `git pull --rebase` then
  `git add -A` then `git commit` then `git push origin main` is the working pattern.
  Bash on Windows works for `grep`. Long PowerShell outputs (commit hooks) flood
  the context — pipe through `Select-Object -Last N`.

### Recent (the last few sessions) — already shipped

- Scraper migrated from JS scaffolding to a real Wikipedia parser. ID-card
  travel is recognised. eVisa keyword checked before "visa required" string.
- 50m topology + Kosovo/N.Cyprus + 200 scraped passports + manual override
  for N.Cyprus (Wikipedia table is non-standard).
- Group / family travel mode (multi-passport intersection).
- Reverse view (incoming — "who can visit me visa-free").
- Schengen 90/180 calculator at /schengen-calculator/.
- Itinerary visa planner at /itinerary/ with departure-date reminders + .ics.
- Digital-nomad-visa explorer at /digital-nomad-visa/ — 38 programs, sortable.
- Visa fee + processing-time database for TR/US/GB/DE/IN at common destinations.
- Premium alerts system (frontend + Pages Functions + Stripe + Resend + cron).
- Top nav bar replacing the corner settings button. 6-language i18n.
- Compare-mode diagonal stripe fills.
- Custom 404 with fuzzy "did you mean?" suggestions.
- /about/, /privacy/, ads.txt for AdSense compliance.

## Setup the user still needs to do (no code involved)

Tracked in `ALERTS-SETUP.md`. Status at handoff:

| Step | Status | Action |
|---|---|---|
| Google AdSense | **Submitted 2026-05-21**, in review (1-3 weeks typical) | Wait. Code is already on every page. |
| Cloudflare Email Routing | Not done | 5 min — set `hello@travelnow.info` to forward to personal inbox |
| iVisa affiliate | Applied, pending | Wait for code; paste into `data/affiliates.js` |
| Airalo affiliate | Applied, pending | Wait for code; paste into `data/affiliates.js` |
| Stripe + Resend + Cloudflare KV (for Pro alerts) | Not done | ~45 min — follow ALERTS-SETUP.md. User has Italian Revolut → Stripe works directly. |
| Search Console submission | Done — submitted sitemap.xml | Google will index over ~1 week |

## Roadmap — agreed but not yet built

The user explicitly chose these for "later":

- **Citizenship-by-investment comparison page.** Malta (€1M), Türkiye ($400K),
  Karayipler ($100K), Portugal Golden Visa (retired), Vanuatu, Antigua. High
  affiliate value (law firms pay $500-2000 per qualified lead). Page would
  rank for "best second passport", "citizenship by investment 2026" etc.
- **Visa application reminder email channel.** The .ics download works.
  Next step: when Pro tier ships, also offer reminder emails 7/3/1 day before
  the apply-by date. Reuse the existing dispatcher.
- **Full static-page i18n** (alerts/schengen/itinerary/etc. landing pages
  translated, not just the SPA UI).
- **More cities/countries in the visa-fee database.** Currently only TR/US/
  GB/DE/IN source passports are seeded — about 50 pairs total. Useful next:
  CN, JP, KR, BR, AE source passports for ~10 popular destinations each.

## How to pick up

1. Read this file end to end.
2. Read `app.jsx` (~800 lines, has all top-level state + TopNav + Settings + Welcome).
3. Read `components/panel.jsx` for the side panel + DetailCard.
4. Read `components/globe.jsx` only when changing the map itself.
5. Read `data/i18n.js` to understand which strings are translated.
6. Verify the live site: open <https://travelnow.info> in incognito, check the
   nav bar, language switcher, compare mode, and group mode.
7. Tackle issues 1-5 above in order. Each is independent.

### Working pattern for changes

```powershell
# Edit files
# (no build step — Babel transforms .jsx in-browser)

# Regen SEO if you touched data/ or scripts/generate-seo.js
cd "C:\Users\uygar\Downloads\CLAUDE TRAVEL WEBSITE"
node scripts/generate-seo.js

# Commit + push (Cloudflare auto-deploys)
git pull --rebase origin main
git add -A
git -c user.email="atlas-bot@local" -c user.name="atlas-bot" commit -m "feat: ..."
git push origin main
```

The user wants pushes to happen automatically every time something ships.
Tell them which commit hash landed, and that Cloudflare deploys in ~30 s.

### Tone the user expects

- **Turkish is the working language.** All conversation is in Turkish; code
  comments stay English. Headings / bullets can mix.
- **No fake / placeholder data.** Never invent visa rules, affiliate links,
  or business numbers. If something can't be done without their account,
  say so and stop.
- **Trust but show your work.** Explain *why* a change works (or doesn't).
  Concrete file/line references beat hand-waving.
- **Don't ask for plan approval mid-task.** They've authorised feature work
  and pushes — just ship. Surface decisions when there's a real trade-off
  (e.g. "Stripe vs Paddle", "dark vs light default").
