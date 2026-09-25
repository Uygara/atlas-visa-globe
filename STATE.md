# Atlas / travelnow.info — Session handoff (current state)

> **Updated:** 2026-09-24 · (start sessions from `TODO.md`; this file is history — grep it, don't read it whole) · **Live:** <https://travelnow.info> · **Repo:** <https://github.com/Uygara/atlas-visa-globe>
> Cloudflare Pages auto-deploys every push to `main` (~30 s).
> Working language with the owner: **Turkish.** Code comments: English.
> Hard rule: **never invent visa data.** No fake fees/rules/numbers — if a fact
> can't be sourced, say so and leave it out.

---

## What the site is
A static site: a client-rendered React SPA homepage (UMD React, JSX precompiled
by `tools/build.js` into `build/*.js` — see Round 10) + ~200 static SEO pages. Pick your passport → an interactive
D3 globe paints every country by visa status (visa-free / eVisa / visa-on-arrival
/ visa required / no-entry-allowed). Visa data re-scraped daily from public sources via a GitHub
Actions cron. Monetisation: Google AdSense (was REJECTED "needs improvement" —
see below) + empty affiliate slots. There is NO live payment (Premium UI was
removed; backend code is dormant).

---

## Current state — what's live right now

**Four globe experiences** (all reuse `components/globe.jsx`):
1. **Home `/`** — visa globe + side panel. Pick passport, tap a country for a
   detail card (status, fee, visa shortcuts, passport-validity, transit note
   for THIS destination, Schengen 90/180 + checklist links, news). Side panel
   order: passport picker → direction → tally (tapping a row lists its
   countries) → search → compare/group modes → collapsible **"For you"** block
   (weekly digest, passport pulse, watchlist, travel-planner CTA, news feed for
   the passport). Opens straight onto the map — no intro/welcome/geolocation
   popups; new visitors get a time-zone passport guess marked inline.
2. **`/transit-map/`** — transit-visa globe. Whole world: green = airside
   transit open (most countries), red = transit visa required (Schengen ATV /
   UK DATV / US C-1 …), amber = time-limited TWOV. Click a country = its
   transit detail.
3. **`/safety-map/`** (beta) — travel-safety globe: every country coloured by
   government advisories (UK FCDO + U.S. State Dept + Government of Canada,
   strictest of the three, 1–4) in its OWN ink ramp (`--risk1…4`; the visa
   green must never read as "safe" here). Pick a country and its provinces are
   drawn from `data/admin1/<ISO2>.json` and shaded by the advisory that names
   them. Detail card: per-source level + how old it is, regional warnings,
   areas that exist only as words, GDACS disaster alerts, and the FCDO change
   history ("what changed, when"). Data: `backend/fetch-advisories.js` →
   `data/travel-advisories.js` (daily cron); boundaries built once by
   `tools/build-admin1.js` (Natural Earth 10m, public domain).
4. **`/itinerary/`** — full SPA "Travel planner" (globe-left / panel-right).
   Tap countries to add stops; route draws as numbered markers + dashed
   great-circle arcs; panel shows per-stop visa+fee, total cost, application
   order, apply-by reminders, **.ics download**, share URL, and **Print/PDF**.

**Tools (static pages):** schengen-calculator (90/180 + Article-24 cascade),
etias, digital-nomad-visa, citizenship-by-investment, alerts (free, 3-country),
about, privacy. visa-shortcuts + passport-validity + esta-rules pages still
exist (SEO) but are **de-tabbed** — their info now surfaces in the home detail
card. `/transit-visa/` 301-redirects to `/transit-map/` (via `_redirects`).

**Top nav (every page, one list):** Visa map · Transit map · Safety map · Travel planner ·
Schengen calc · ETIAS 2026 · Passports · Guides · Nomad visas · Second passport ·
Alerts · About — defined once in `assets/site-nav.js`. Links that don't fit fold
into **More ▾** from the end (priority+). Always-visible controls: 3D/2D (globe
apps), light/dark, language, Support. `?` reopens the intro (home, desktop).

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

- **Round 14 (2026-09-25/26: alerts on the web, honest privacy page, four-language review, fluid sheet, Android CI):**
  - Alerts = account + notifications. `/alerts/` picks passport + ≤20 watched countries (synced keys) and turns on
    FCM web push (`assets/push-web.js`, `/firebase-messaging-sw.js`, default VAPID key); devices `platform:"web"`,
    dispatcher adds `webpush.fcmOptions.link`. Shared texts `assets/push-text.js` (app-native uses them too).
  - Privacy rewritten short and true (12 sections, GDPR/UK/KVKK/California) + `/tr/privacy/` (formal "siz"). Matomo
    removed; GA4 consent mode denied by region (EU/EEA, GB, CH, TR) so no cookies there. Legal pages use `.wrap.legal`.
  - es/de/fr/ar: 4 sonnet "native" reviews (176 fixes) + fill of every static dictionary entry (689). French = "tu".
  - Mobile sheet: 1:1 drag, rubber band, velocity projection (0.998), spring with velocity handoff, catchable.
  - Firebase: service account key in `.secrets/` (ignored); APIs analyticsdata/searchconsole enabled; the SA is GA4 Viewer
    + GSC Full user → `tools/analytics-report.js`. Sitemap submitted to the domain property; indexing requested
    for /tr/, /guides/, /safety-map/, /guides/how-we-count/. Debug keystore shared + SHA registered; `android.yml`.
  - Writing rule (no em dashes, no AI phrasing) in CLAUDE.md; `tools/lint-copy.js`; site-wide dash sweep by 2 agents.
- **Round 13 (2026-09-24 — Firebase sign-in, the mobile app, every passport's types, push):**
  - Pushed the 9 design commits (merged 3 daily-refresh commits; generated pages regenerated, not hand-merged).
    Schengen guide: BG/RO are full members (air/sea Mar 2024, land 1 Jan 2025), CY is not yet — when the Council
    admits Cyprus update `_SCHENGEN_AREA` (`data/visa-overrides.js`), the guide, `tr-strings/guide-schengen.js`.
  - **Accounts:** Google, email + password (+reset), phone (SMS code, invisible reCAPTCHA), emailed link;
    native Google/phone through `@capacitor-firebase/authentication` (`skipNativeAuth`, then `signInWithCredential`);
    `users/{uid}/devices/{token}` push tokens (rules allow platform/lang/tz/updatedAt + the job's `sent`/`lastPush`);
    `firebase.json` + `.firebaserc` (project `travelnow-a0cf3`) deploy providers and rules. **Not live:** the CLI is
    not logged in (owner must run `firebase login`), no apps registered, phone auth needs the console switch.
    Firebase plugin installed (`firebase@firebase`, skills in `~/.claude/plugins/marketplaces/firebase`).
  - **Passport types for all:** `backend/fetch-variants.js` rewritten. Sources: destination pages ("Visa policy of X",
    D/O/S/Sp legend, footnote numbers via legend, `*` = VoA only if legend says so, EU/GCC/ASEAN group entries,
    "any country (except …)"), the Schengen page's per-state lists (`parseSchengen`; member states *redirect* to that
    page — a title check skips any other redirect), passport pages (parentheticals, type tables) and the old
    consolidated-list anchor (CN 142, RU 124, ID 113 ⊇ before). D → `diplomatik`, O/S/Sp/C/PA → `hizmet`; qualified
    entries ("(biometric only)") are dropped. 200 passports get both; the picker shows one only when it opens ≥5
    destinations the ordinary map lacks (`_VARIANT_MIN_GAIN`, lazy). TR (hand-curated) and GB classes untouched.
  - **App (`app/`):** Capacitor 8, iOS (SPM) + Android generated, `build-www.js` bundles the pages offline (vendored
    React/D3/fonts, no AdSense/analytics, `/dir/` → `/dir/index.html` because Capacitor answers extension-less paths
    with the root page), `assets/app-native.js` (tab bar, offline strip, push on demand, consented AdMob banner on
    Planner/Schengen only, test IDs). Never run on a device. See `MOBILE-SETUP.md`.
  - **Push:** `backend/dispatch-push.js` (visa change for own passport, safety level change for watched/planned
    countries; ≤1/device/day, quiet 21–08 local, sent-once ledger); runs in the daily job when the secret exists.
  - **Safety map:** Canada area lists (per-country pages), Turkish Foreign Ministry announcements (dated, no level),
    region notes no stricter than the country level dropped (376 → 236).
  - **Transit map:** connection check by IATA codes (`data/airports.js`, weekly refresh) + `transitLeg()`.
  - Share cards re-rendered (400). Privacy page extended for phone/push/AdMob (owner should review).
  - **Firebase went live (same evening):** CLI login done by the owner; Web/iOS/Android apps registered, configs
    written (plist/json committed), `deploy --only auth` enabled Google + email/password (email-link and phone have no
    CLI switch: email-link UI removed, phone waits for the console), Firestore `(default)` in **eur3** (the first
    deploy created it in nam5 by default — deleted while empty and recreated; `firebase.json` now pins the location),
    rules deployed, authorized domains added through firebase-tools' own `gcp/auth` helper (needs `setActiveAccount`
    first; `deploy --only auth` ignores `authorizedDomains`). Verified on localhost against the real project:
    sign-up, sync round trip, wrong password, delete. Not testable headless: Google popup, reCAPTCHA/SMS (added a 90 s
    give-up so the form never hangs). Accounts are now ON for every visitor (config no longer null).
  - Workflow: `tr/passport/` was never staged by the cron — fixed. `CLAUDE.md` + a short `TODO.md` now start sessions.
- **Round 12 (2026-09-20/21 — the design-review items, Turkish mirror):**
  - **One headline number.** The panel, pass card, compare strip, passport pages
    and the rank all lead with `mobilityScore` = destinations you can enter
    *without a visa application* (TR 87, rank #93); `accessScore` (eVisa counted,
    138) is the small secondary line. Rank sorts by mobility, then access.
  - **Colour-blind safe statuses.** `--vf` / `--vr` re-picked so visa-free and
    visa-required differ in luminance, and the three greens/oranges that collapsed
    under deuteranopia carry SVG textures (eta = diagonal lines, ev = dots,
    vr = hatch) on the globe and the legend swatches. Checked with a Machado
    simulation sheet before/after.
  - **Mobile.** Country card title pins under the sheet handle
    (`.entry-top` sticky), tapping a country raises the sheet to 48%
    (`window.atlasSheet.ensure`), legend is one scrollable row, zoom buttons are
    hidden on touch. 18 empty `<ins data-ad-slot="">` removed from 9 pages.
  - **Passport pages redesigned** (`scripts/generate-seo.js`, `assets/site.css`):
    bio-data card with the MRZ (`data/mrz.js`, shared with the panel — Türkiye
    prints `TURKIYE`), dotted ledger instead of five stat boxes, status groups,
    sticky "open on the map" bar linking to `/?p=ISO` (the SPA now reads `?p=`).
  - **Turkish mirror.** Search engines can't see the client-side translation, so
    every page in `TR_PAGES` (`assets/site-nav.js` — one list for browser + Node)
    has a real Turkish twin at `/tr/<path>` with `<html lang="tr">`, hreflang
    both ways and a Turkish title/description: the 200 passport pages
    (generated by `generate-seo.js`, `LOC.en/LOC.tr`), the visa map (`/tr/`, the
    SPA shell with a hand-written crawlable fallback in
    `scripts/tr-home-fallback.js`) and 17 hand-written pages built by
    **`scripts/build-tr.js`**. Its text comes from `scripts/tr-strings/*.js`
    (one entry per paragraph, keyed by a hash of the English source — change the
    English and the page fails the build until re-translated) and then from the
    browser dictionary `data/static-i18n.js` run in jsdom. Anything still English
    fails the build. `scripts/tr-meta.js` holds the Turkish titles/descriptions.
    Privacy and Terms are deliberately English-only (legal text). Language
    routing: a head script sends a reader whose stored choice is Turkish from an
    English page to its twin; landing on a twin stores `atlas.lang=tr`; the
    language select (`assets/site-chrome.js`, SPA `setLang`) navigates between
    the twins and keeps `?p=`/hash. es/de/fr/ar still translate the English page
    in place. `sitemap.xml` lists both with `xhtml:link` alternates — and its
    namespace typo (`sitemap.org`) is fixed.
  - **Keep the twins fresh:** after editing a hand-written page run
    `node scripts/apply-chrome.js && node scripts/build-tr.js && node scripts/generate-seo.js`
    (`node scripts/build-tr.js --todo <page>` lists the English still to translate;
    `--check` exits 1 when a twin is stale). `tools/` gained `jsdom`.
  - **The globe feels alive** (`components/globe.jsx`): a released drag keeps
    gliding (friction, velocity from the last 120 ms), the idle spin starts after
    2.5 s (was 60 s) and eases in/out, a press that moved > 6 px is a drag and never
    selects, the verdict stamp presses onto the card (`stamp-press`). Time-based
    with a capped step; holds still while a country is focused/hovered, in a hidden
    tab and under `prefers-reduced-motion`.
  - **Per-passport social cards** (`scripts/og-cards.js`, `assets/og/<iso>-<lang>.png`,
    400 files, ~25 KB each): flag + name, headline number, rank stamp, MRZ and the
    status bar, drawn by headless Chrome from the site's own tokens and fonts, then
    palette-squeezed by `scripts/quantize-og.py`. Passport pages point `og:image` at
    their own card (generic image if missing). Cards show the *month*, and are only
    re-rendered when their numbers change (`assets/og/manifest.json`): re-run
    `node scripts/og-cards.js` after a batch of visa-data changes — the daily job
    does not. Needs local Chrome + Python/Pillow; `tools/` gained `puppeteer-core`.
  - **Type scale.** ~33 pixel sizes and 10 letter-spacings collapsed into tokens
    (`--fs-2xs … --fs-5xl`, `--ls-tight/caps/label/wide`, `--measure: 66ch` in
    `tokens.css`; 214 + 32 declarations rewritten by rule, every value moves <= 4 px).
    Running text stops at 66 characters; long-form guide paragraphs are 17 px.
    `html[lang="ar"]` zeroes the tracking tokens.
  - **Accessibility.** Contrast: `--ink-3` darkened to >= 4.5:1 on every paper tone,
    `--ink-4` no longer used for text, foil as text is `--foil-ink` (5.6:1; plain
    `--foil` is decoration). Touch: 44 px targets on `(pointer: coarse)` (header
    controls grow a hit area instead of a box). Skip link on every page (SPA: to the
    panel; static: injected by `site-chrome.js`, translated by `static-i18n.js`);
    the mobile sheet handle is a labelled focusable button (arrows/Home/End/Enter);
    live regions on the score, the country verdict and every calculator result.
    Not yet done: a real screen-reader pass (VoiceOver/TalkBack).
  - **Arabic (RTL) and the other beta languages.** Layout: every physical
    `left/right` in `site.css`/`app-shell.css`/`chrome.css` (and the few in JSX)
    became a logical property (`margin-inline-start`, `border-inline-start`,
    `text-align: start`, `inset-inline-*`), so `dir="rtl"` mirrors the panel, the
    callouts and the lists; identical in LTR. MRZ and codes are `direction: ltr`.
    Type: `html[lang="ar"]` puts IBM Plex Sans Arabic behind Sofia Sans (font link
    in `partials.js` + the SPA shells) and zeroes the tracking. English text left
    inside an Arabic static page gets its own direction (`static-i18n.js`
    `fixMixedDirection`, cleared on leaving Arabic) instead of a full stop on the
    wrong end. Text: es/de/fr/ar were missing ~175 of the 366 SPA keys (safety map,
    planner, transit map, change feed…): all filled (`data/i18n.js`, placeholders
    checked), tail-country names fall back to `Intl.DisplayNames`. es/de/fr/ar are
    labelled "(beta)" in every language select (`LANGS` in `i18n.js`/`partials.js`).
    Still English in those languages: passport-variant labels
    (`data/passport-variants.js`), long static-page prose beyond the dictionary.
  - **Brand.** The globe-on-a-cover mark (the category's most copied symbol) is
    replaced by a passport page opening its MRZ: "P<" over a dotted filler line
    (`BRAND_MARK` in `partials.js`, `BrandMark` in `chrome.jsx`, the SPA loading
    marks). The favicon is the same P< as a navy tile with a gold chevron;
    `node scripts/make-icons.js` draws `favicon.svg/png`, `apple-touch-icon.png`
    (180, full-bleed) and `icon-512.png` (for the app). `scripts/make-og.py` (which
    would have overwritten them) is gone; the generic social image `assets/og.png` and
    `assets/og/home-tr.png` now come from `og-cards.js` (home card, versioned
    separately). ".info" stays visible on phones (hidden only below 370 px).
  - **Planner.** The departure date moved from step 3 to step 2 and says what a date
    buys; `applyPlan()` (apply-by = processing + 7 days) is computed once and feeds both
    the date row — which now shows a red "not enough time at normal speed" note naming
    the stops whose deadline has passed — and the reminders list.
  - **Dates and labels.** ISO dates in prose became "21 September 2026" / "21 Eylül
    2026" (`fmtDate` in `generate-seo.js`, the "Last reviewed" lines on 7 static pages);
    the truncated Turkish nav/status labels ("Schengen hesap.", "Vize gerek.") are full
    words. Mixed-currency fee strings in `visa-fees.js` stay as curated.
  - **Menu and guide index.** The twelve equal masthead links are four groups
    (`g` in `assets/site-nav.js`: maps + planner | Passports, Guides | Schengen,
    ETIAS | nomad, second passport, alerts, about); the first link of a group gets
    `mh-grp-start` — a divider in the bar (drawn on the item's own box so the
    priority+ measurement counts it), a rule in the More menu and the phone sheet.
    `/guides/` is a numbered table of contents in three groups with reading times
    instead of five identical cards.
  - **Gotcha (caught before push):** all compiled JSX shares one global scope, so
    a top-level `function mrzLines` in `panel.jsx` replaced `window.mrzLines`
    (from `data/mrz.js`) and recursed forever. Call shared helpers through
    `window.` and rebuild `build/*.js` (`cd tools && node build.js`) before
    testing the SPA.
- Rounds 11 and older (safety map v2, persona reviews, AdSense rejection fixes, data audits, Reddit rounds):
  see `docs/STATE-archive.md`.
---

## Key files
- `index.html` — SPA shell + crawlable static content + script loads. The
  `/build/*.js?v=<hash>` tags are rewritten by `tools/build.js`; data/CSS files
  still use the manual `?v=YYYYMMDDx` (`ASSET_VERSION` in `scripts/partials.js`).
- `tools/build.js` — compiles `app.jsx` + `components/*.jsx` → `build/*.js`.
  `.github/workflows/build.yml` re-runs it on pushes that touch JSX.
- `assets/account*.js`, `account/index.html`, `firestore.rules`, `ACCOUNT-SETUP.md` — accounts.
- `TODO.md` — open work only (Round 12). `tools/build-admin1.js` → `data/admin1/`.
- `components/safety-map.jsx`, `backend/fetch-advisories.js`, `data/travel-advisories.js` — safety map.
- `assets/tokens.css` / `chrome.css` / `app-shell.css` / `site.css` — the design
  system (see Round 9). `assets/site-nav.js` — the one nav list (browser + Node).
- `components/chrome.jsx` — shared masthead, ViewToggle/ThemeToggle/LangSelect,
  theme store, MobileSheetHandle, Caption/Swatch/Dot. Load BEFORE globe.jsx.
- `scripts/partials.js` + `scripts/apply-chrome.js` — static-page head/masthead/footer.
- `app.jsx` — App root, IntroDialog ("?" only), MapKey, time-zone passport guess.
- `components/panel.jsx` — side panel (passport data page + MRZ, ledger,
  DetailCard entry stamp) + all widgets + ForYouSection +
  Changelog/News/Watchlist/Pulse/Digest, FilterList, TransitVisaHint, SchengenHelp.
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
- `data/passport-variants.js` — variant framework. Two variant modes now:
  **overlay** (diplomatic/service — only ADD access, fall back to ordinary) and
  **`mode:"full"`** (British nationality classes — a COMPLETE map with its own
  `default`; unlisted dest uses the class default, never the strong ordinary map).
  Merges `PASSPORT_VARIANTS_DATA` (diplomatic) + `PASSPORT_VARIANTS_GB` (BOTC/BOC).
- `data/passport-variants-gb.js` — **AUTO-GENERATED** sourced BOTC/BOC maps
  (`window.PASSPORT_VARIANTS_GB`). Regenerate: `node backend/fetch-british-classes.js`.
- `data/*.js` — countries, passports (scraper-generated), transit-visa-rules +
  -data, passport-variants + -data, visa-news, destination-tips, etias-rules, etc.
- `backend/scraper.js` — daily visa data. Now also **exported as a module**
  (guarded `main()` behind `require.main`) + a `titleOverride` param on
  `scrapePassport`, so helpers can reuse it. The `ban` classifier intentionally
  does NOT match `"travel banned"` (origin advisory, not a destination refusal).
- `backend/fetch-british-classes.js` — scrapes the BOTC/BOC Wikipedia tables →
  `data/passport-variants-gb.js`. Refuses <50-row parses (never thin data).
- `backend/` — `fetch-news.js`, `fetch-transit.js`, `fetch-variants.js`,
  dispatch-*. Wired in `.github/workflows/daily-refresh.yml`.
- `scripts/generate-seo.js` — builds `/passport/<iso>/` pages + sitemap.

## Quirks / gotchas
- **JSX is precompiled.** Edit `.jsx`, then `cd tools && npm ci && node build.js`
  (or let the "Build JSX" Action do it after push). Output mirrors the old
  in-browser Babel: ES5, and every file is a classic script in ONE global scope —
  a top-level `const foo` becomes `window.foo`. Never reuse a name a data file
  sets on `window` (a `const feeText` helper once overwrote `window.feeText` →
  infinite recursion → blank page).
- The browser pane's time zone is Europe/Berlin, so a fresh visit guesses 🇩🇪.
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