# Atlas / travelnow.info — Session handoff (current state)

> **Updated:** 2026-09-20 · **Live:** <https://travelnow.info> · **Repo:** <https://github.com/Uygara/atlas-visa-globe>
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
  - **Gotcha (caught before push):** all compiled JSX shares one global scope, so
    a top-level `function mrzLines` in `panel.jsx` replaced `window.mrzLines`
    (from `data/mrz.js`) and recursed forever. Call shared helpers through
    `window.` and rebuild `build/*.js` (`cd tools && node build.js`) before
    testing the SPA.
- **Round 11 (2026-09-20 — safety map v2, 13-designer review, open-work list):**
  - **Safety map v2.** The US reissues some advisories yearly (Germany read
    "updated May 2025") and one border province coloured a whole country.
    Added **UK FCDO** (OGL v3) — the freshest source, with a dated change
    history that reads as a current-events feed — and mapped the regional
    warnings: FCDO's "areas we advise against travel to" plus the State
    Department's "Do Not Travel To:" lists are matched against Natural Earth
    admin-1 names, giving **252 mapped provinces in 64 countries**. Areas that
    exist only as words ("within 10 km of the border with Syria") stay text.
    Added **GDACS** orange/red disaster alerts, per-source freshness ("13 months
    ago" flagged), and the map's own colour ramp. `globe.jsx` gained an optional
    `regionFeatures`/`regionFill` overlay.
  - **13 designer personas** (brand, data-viz, mobile, a11y, typography, growth,
    gov-service, motion, travel UX, cartography, social, RTL, an AI-slop critic)
    each reviewed the live site from screenshots in
    `tools/`-independent scratch captures. All 13 scored it **3/10** on
    "looks AI-generated" and named the same signatures (MRZ strip, ledger,
    stamp). The consensus problems are in `TODO.md`; the loudest: mobile detail
    card's title is clipped by the sheet handle (8×), empty ad slot on tool
    pages (5×), passport pages carry none of the identity (5×), mobile legend
    eats the globe (5×), "138 accessible" vs "87 without a visa" (3×),
    colour-blind-unsafe status palette (3×), and every page shipping
    `<html lang="en">` with no hreflang.
  - **`TODO.md`** — the open-work list (owner tasks, site, safety map, app,
    data). Keep it current; closed items belong in these round notes.
- **Round 10 (2026-09-16 — relevance, personas, mobile, build step, accounts, safety map):**
  - **News relevance.** `affects.passports: []` used to mean "everyone", so a
    Burundi transit-visa edit showed under every passport. Now items surface only
    where they NAME the passport/destination; "Latest for <passport>" = that
    passport's CHANGELOG diffs (90 d) + news naming it. `fetch-news.js` scopes
    nationality from all country names/demonyms tied to people, maps Schengen
    summaries to the member state named, rejects editor-debate summaries.
    `backend/changelog.js` folds edit-war flip-flops (A→B→A within 14 days) into
    their net change; wired into `scraper.js` (log 210 → 172). Removed "Today's
    pick" + `destination-tips.js` (had per-passport visa claims hard-coded).
  - **Persona walkthrough findings shipped** (owner picked): filter → country
    list; ONE rank + total everywhere (`accessScore`/`mobilityScore`/
    `passportRank` in `frontend-tail.js`; `generate-seo.js` now runs the browser
    data layer in a Node `vm`, so /passport/ pages match the map — TR was 75 vs
    71 visa-free, #91 vs #95 → #96); destination-only transit note; Schengen
    links; fee strings translated (`data/visa-fees-i18n.js`, TR); no entry
    popups (intro only via "?"; no geolocation/Nominatim).
    NOT chosen by owner (still open): collapsing passport type / residence
    permit, first-visit single step, hiding the broken alerts signup.
  - **Mobile:** globe fits the strip above the bottom sheet (was centred behind
    it); thumb-sized segmented controls on touch screens.
  - **Build step** (`tools/`): JSX → `build/*.js`, production React, no Babel in
    the browser. See Quirks.
  - **Accounts (Firebase), code complete but OFF** until `assets/account-config.js`
    gets a config (owner creates the project: `ACCOUNT-SETUP.md`). Google or email
    link sign-in; `/account/` page (saved items, download, sign out, delete);
    localStorage stays the working copy, one Firestore doc `users/{uid}` merged
    per key, newest write wins (`assets/account-sync.js`, tests
    `node tools/test-account-sync.js`); rules in `firestore.rules`. Test without
    Firebase: `localhost:8000/…?account=mock`. The real Firebase path is untested
    until the project exists.
  - **Safety map** — see "Current state" 3.
- **Round 9 (2026-09-15 — "looks like every other AI site" → own visual identity + front-end architecture):**
  Owner: the UI read as generic AI output. Diagnosis: Geist + mono uppercase
  micro-labels, Tailwind's default palette as status colours (green-400,
  lime-400, yellow-400…), glassmorphism + starfield + radial glow, emoji as
  icons, slogan copy ("Your passport, your map."), and ~20 pages each with a
  private copy-pasted palette + 3 different top navs.
  - **Visual language = the travel document.** Light theme = visa page (pale
    security paper, blue-black ink, hairline rules); dark = passport cover (navy
    board, gold-foil accent). Status colours are printed inks, no glow. Type:
    Sofia Sans (UI/body) + Sofia Sans Extra Condensed (display) + DM Mono (data).
    Signature elements: passport picker as a **bio data page with a generated
    MRZ** (issuing state + real status counts + snapshot date), tally as a
    **ledger** with dotted leaders, a country's verdict as a tilted **entry
    stamp**, **guilloche** strip/band, hatched "no entry" fill (map + key), a
    "404 · entry not recorded" stamp, § section numbers on guides. Flag emoji
    render on Windows via the Twemoji country-flag subset font.
  - **Architecture:** `assets/tokens.css` (all colours/type for both themes;
    legacy `--bg/--fg/--panel…` names aliased) → `assets/chrome.css`
    (masthead, segmented controls, buttons, fields) → `assets/app-shell.css`
    (globe apps) or `assets/site.css` (documents). `components/chrome.jsx` is the
    shared React masthead/theme/lang/sheet for all three globe apps (replaced 3
    TopNavs + 3 injected <style> blocks). Static pages get real-HTML masthead +
    footer stamped from `scripts/partials.js` by `node scripts/apply-chrome.js`
    (between `<!-- chrome:* -->` markers); `assets/site-chrome.js` adds the
    More menu, mobile sheet, theme + language. `data/static-i18n.js` no longer
    injects its own palette/floating switcher on stamped pages.
  - **Generator:** `scripts/generate-seo.js` now uses the same partials + site.css.
    Passport pages were NOT regenerated locally (local main was 95 data commits
    behind origin) — the daily cron re-renders all 200 with the new template on
    its next run after push.
  - Copy: new intro (all 6 languages) — factual headline, 3 numbered steps,
    signed by the maintainer. New nav/footer strings added to both dictionaries.
  - Small fixes on the way: unfilled AdSense units no longer leave a 280px hole;
    detail card scrolls into view when a country is picked; globe no longer
    logs negative SVG sizes on a narrow first paint; watchlist storage listener
    leak; itinerary CTA flags (stops are ISO strings).
  - **To change the nav/footer:** edit `assets/site-nav.js` / `scripts/partials.js`,
    run `node scripts/apply-chrome.js`, bump `ASSET_VERSION` + the `?v=` stamps.

- **Round 8 (2026-06-17 — AdSense "Low value content" rejection → real-publisher overhaul):**
  AdSense rejected the site for "Low value content / thin content". Root cause
  per Google's own policy text: the ~200 `/passport/<iso>/` pages reproduced
  third-party (Wikipedia) data as a bare table "without additional commentary,
  curation, or otherwise adding value". Fixes shipped:
  - **`scripts/generate-seo.js` rewritten to add unique, data-driven prose** to
    every passport page: a global **mobility ranking** (computed across all
    passports from the snapshot — vf+voa = "destinations reachable without a
    prior visa"), a lead paragraph stating the rank, a **per-continent regional
    breakdown** (strongest/weakest region), **curated notable destinations**
    (named MAJOR_DESTS resolved to their real status — "you can go to Japan,
    Thailand…" / "plan ahead for the US, UK, Germany…"), a "how to travel more
    easily" para, and a **4-question FAQ emitted as FAQPage JSON-LD**. All from
    real data — no invented facts. Article schema now carries author (Uygar
    Atalay) + publisher. Re-ran → 200 pages regenerated. The daily cron runs this
    generator, so the enrichment self-heals each night.
  - **5 hand-written evergreen guides** under `/guides/` (the high-value original
    content Google actually wants): visa-types-explained, schengen-90-180-rule,
    etias-2026-explained, transit-visa-guide, passport-validity-six-month-rule.
    Each ~700-1200 words, author byline, Article+FAQ schema, internal links to
    tools + passport pages. `/guides/` index added.
  - **Legitimacy / de-AI pages:** new `/contact/` (real address **hello@travelnow.info**)
    and `/terms/` (Terms of Use + accuracy disclaimer + liability). About rewritten
    with a real **"Who's behind this" founder byline (Uygar Atalay)** + methodology
    ("we never invent data") + real email; Privacy got the real email + Terms link
    + refreshed date. Removed all "a dedicated email is being set up" placeholders.
  - **Consistent site footer** (Home · All passports · Guides · About · Privacy ·
    Terms · Contact + "maintained by Uygar Atalay") added to every static + generated
    page; homepage crawlable `#root` got the guides list + footer nav + founder line.
  - **Security:** new `_headers` (Cloudflare) — X-Content-Type-Options, X-Frame-Options
    SAMEORIGIN, Referrer-Policy, Permissions-Policy (geolocation=self only), HSTS.
    Deliberately no strict CSP (would break inline Babel + CDN React/D3/AdSense).
  - **sitemap.xml** now includes /guides/ (+5 articles), /contact/, /terms/.
  - **Owner decisions this round:** contact = hello@travelnow.info (owner must flip
    on Cloudflare Email Routing for travelnow.info → personal inbox); identity =
    real name "Uygar Atalay" (inferred from the buymeacoffee.com/uygaratalay handle —
    correct if wrong). **Owner still to do:** (1) enable Email Routing so hello@ works;
    (2) after deploy, in Search Console resubmit sitemap + Request Indexing on /,
    /guides/* and a few passport pages; (3) wait ~1-2 wks for re-crawl, then
    **request AdSense review** from the dashboard.

- **Round 7g (2026-06-12 — incoming-mode territory fix + KP→US verified):**
  - **KP→US incoming = vr is CORRECT** — owner questioned it; Wikipedia's
    "Visa requirements for North Korean citizens" US row reads plain
    "Visa required" (the 2017 US entry ban on DPRK nationals was revoked
    in 2021; the June 2025 suspension list doesn't include KP). De facto
    approvals ≈ zero, but the source says vr → we show vr (no-invent).
  - **Greenland "no data" in incoming mode FIXED.** `TERRITORY_ALIAS`
    only aliased the DESTINATION side; with a territory as ORIGIN
    (incoming mode) there's no PASSPORTS entry → painted `na`. Added a
    passport-side alias at the TOP of `_resolveStatusBase` (before the
    self check) in backend/frontend-tail.js + the served copy in
    data/passports.js: Greenlanders are Danish citizens, Puerto Ricans
    are US citizens, etc. Verified incoming-with-US: GL paints eta
    (DK→US ESTA), PR paints self, NC/FK eta, EH vr (MA); GL→DK = self,
    GL→DE = fom. Cache-bust → 20260612b. NOTE: frontend-tail.js is the
    source — the daily cron re-appends it, so the fix survives re-scrapes.

- **Round 7f (2026-06-12 — US→North Korea, visa-data-auditor agent run):**
  - Owner flagged US→KP showing `vr` while Wikipedia reads "Travel
    restricted". Ran the **visa-data-auditor agent** in detail. Verdict:
    the cell is "Travel restricted by U.S. government" — an ORIGIN-side
    legal prohibition (Geographic Travel Restriction, 22 CFR 51.63, since
    Sept 2017: US passports are INVALID for DPRK travel without a special
    State Dept validation granted only for national-security reasons). For
    a US tourist the truthful answer is "you cannot go" = **ban**, not
    "get a visa" = vr.
  - Fix per agent recommendation: **single targeted override**
    `STATUS_OVERRIDES["US"]["KP"] = ban` in data/visa-overrides.js (with
    source). NO classifier change — the generic "restricted"→vr rule is
    correct for the destination-side cases the agent re-verified: IN→PK
    "Admission restricted" (pilgrim visas exist), KR→KP "Particular visit
    regime", IL→MY/PK/SA. Agent also verified `applyDestFloor` passes
    `ban` through (the KP floor's _FLOOR_EASY map has no ban key), and
    that in a 15-passport sample ONLY the US has the
    "restricted by [origin] government" phrasing.
  - Verified on globe: US→KP paints ban; US tally vr 12 / ban 6; IN→PK,
    KR→KP, GB→KP, IL→KP all unchanged. Cache-bust → 20260612a.

- **Round 7e (2026-06-11 — FULL 200-passport audit + complete re-scrape):**
  - Owner: "çok fazla yanlış var, kalıcı çözüm istiyorum." Built
    `backend/audit-dropped.js` (one-shot, read-only): fetches ALL 202 target
    pages, lists every ISO-mapped cell `classifyVisaText` nulls (= silently
    dropped → wrong default paint), plus a global phrase histogram.
  - **First pass found ~140 dropped cells across ~25 phrases.** Added
    classifier rules (each verified against its actual passport→dest pairs):
    ban ← "visa issuance ban" (ML→UA), "illegal under israeli law"
    (IL→IR/IQ/LB/SY/YE), exact-cell "travel banned" / "travel prohibited"
    (IQ→IL, MY→IL/KP — EQUALITY check so KR's "eVisaTravel banned" advisory
    suffix cells stay unaffected); vr ← special permission/authorization/
    permit, visa restricted, partial visa restrictions, particular visit
    regime (KR↔KP), travel certificate (TW), invitation required,
    visa de facto required, affidavit of identity; ev ← "electronical travel
    authorization" (K-ETA wording, 20 pages), "tourist card" (Cuba, 13),
    "e600 visa" (AU), "e-tourist card" (SR), electronic entry visa,
    pre-enrolment (CI); voa ← "visa on arrvival" [sic]; vf ← exact
    "indefinite" (PW→US COFA).
  - **Full re-scrape `node scraper.js --all`:** 202/202 OK (XN kept manual
    override), 423 status changes vs snapshot — taxonomy noise, so
    changelog.js reverted (established pattern). passports.js +
    passports-snapshot.json regenerated wholesale.
  - **Re-audit after fix: 0 dropped cells in all 200 pages** (two 1-off
    leftovers — ER→BI typo cell, PW→US "Indefinite" — fixed + targeted
    regen of ER/PW). 35-pair spot-check suite: all pass (the 5 apparent
    fails were wrong expectations: AU dest relabels ev→eta by design,
    AU/NZ→KZ main-table vf beats the border-zone secondary table, TR→DE is
    genuinely vr). 200 passports, 0 thin maps. Cache-bust → 20260611b.
  - Note for future sessions: re-run `audit-dropped.js`-style sweeps after
    any classifier change; Wikipedia invents new cell wordings regularly
    and a null classification is ALWAYS a silent data bug.

- **Round 7d (2026-06-11 — silently-dropped-rows audit, classifier fixes):**
  - Owner flagged US→Gabon (Wikipedia: "Visa Issuance Suspended", we showed
    something else). Root cause class: `classifyVisaText` returned **null**
    for unrecognised cell wording and the row was SILENTLY DROPPED → the
    destination fell to the passport's default (vf 90 for the US) — the
    exact "default-fallback over-report" failure mode again, but at the
    classifier level rather than a missing table.
  - **US page had 8 dropped rows**, all wrongly painting vf/90:
    Chad + Gabon "Visa Issuance Suspended" (now → **ban**: no visas being
    issued = entry impossible), Marshall Is. / Micronesia / Palau "Right of
    abode" (COFA; now → **vf**), Samoa "Entry permit on arrival" + Solomon
    Is. "Free Visitor's permit on arrival" (now → **voa**), Seychelles
    "Electronic Border System" (now → **ev**).
  - Scanned 8 more major passports for dropped rows: GB/TR/JP = 0 clean;
    **DE→Israel + FR→Israel "ETA-IL"** were dropped (wrongly vf; now → ev),
    **FR→Cape Verde "EASE"** and **FR→PNG "Easy Visitor Permit"** → ev.
    The IN/CN/BR drops are all non-ISO micro-territories (Tokelau, Jan
    Mayen, BIOT, Tristan da Cunha, SGSSI, American Samoa, SADR, Clipperton)
    that aren't in countries.js — harmless, never painted.
  - Classifier additions in `backend/scraper.js`: "issuance suspended" /
    "visa suspended" → ban · "right of abode" → vf · "permit on arrival" →
    voa · "electronic border system" / "eta-il" / "^ease\\b" (word-boundary
    guarded — substring would hit "disease") / "easy visitor permit" → ev.
  - **Targeted merge-regen of US + DE + FR** into data/passports.js (brace-
    counting splice; 200 passports intact). The nightly cron self-heals the
    remaining ~190 passports with the new classifier. Cache-bust → 20260611a.
  - Verified on the globe: US→Gabon/Chad paint ban dark-red; US tally now
    vf 117 / ban 5; DE→IL = ev. Console clean.

- **Round 7c (same day — site-bug-finder agent run + fixes):**
  - Owner reported TR+GreenCard→US stays red and Schengen→Andorra stays red,
    and asked for a distinct colour for permit-unlocked countries. **Ran the
    `site-bug-finder` agent** — it confirmed all three and proposed the fixes
    which were then applied:
  - **`_PERMIT_HOME_TERRITORY`** (visa-overrides.js): each bloc's own
    territory unlocks on its own permit — US GC→US, ILR→GB, PR→CA, AU/NZ
    PR→AU+NZ (AU PR gets NZ residence-class visa on arrival; the reverse
    NZ-PR→AU does NOT hold, caveat in comment), GCC→its 6 members (picker
    can't know which member, accepted over-paint documented in comment).
    Status `vf`, days null (resident re-entry), tagged `upgradedBy`.
  - **`_SCHENGEN_ADJACENT`** = AD/MC/SM/VA added to the Schengen-permit
    branch (de-facto inside the Schengen travel zone: AD only reachable via
    FR/ES, MC follows French rules, SM/VA open borders with IT). vf 90.
    IE verified still `vr` (genuinely not Schengen).
  - **Permit-hatch globe visual:** any `r.upgradedBy` destination now paints
    `url(#permit-<status>)` — status colour with thin brand-blue diagonal
    hatching (4 new SVG patterns next to the compare-stripe defs in
    globe.jsx) — so "mine by passport" vs "mine via permit" reads at a
    glance. Legend gains an "Unlocked by your permit" row (CSS
    repeating-linear-gradient swatch), shown only while permits are active.
    `status.permit` i18n ×6. Cache-bust bumped to 20260610d.
  - Verified end-to-end in the real UI: TR + US-permit checkbox → US and MX
    paint `url(#permit-vf)`, DE correctly stays `vr`, legend row appears,
    console clean.

- **Round 7b (same day, follow-up fixes):**
  - **"Permit toggle doesn't repaint" — root cause was CACHE, not React.**
    Verified live in the real UI (IN + US-permit checkbox flips Mexico vr→vf
    instantly). Production failure: `data/*.js` script tags had NO cache-bust
    query, so returning visitors ran new app code against a stale cached
    `visa-overrides.js` (missing `_PERMIT_GLOBAL_UPGRADES`) and the toggles
    silently no-op'd. Fix: `?v=` stamps on i18n / passports / visa-overrides /
    visa-conditions / dual-citizenship script tags — **bump them together with
    the JSX stamp whenever those files change.**
  - **XN (TRNC) default `ban` → `vr`** in `data/passports.js` + scraper
    MANUAL_OVERRIDES. Wikipedia lists only TR for entry, but "rest of world =
    entry refused" was wrong framing: most states have no visa regime for the
    document (PK/AZ host TRNC representative offices and reportedly accept
    visa applications), so `vr` ("needs a visa, often unobtainable") is
    accurate. XN now: 1 idc (TR) + 204 vr + 0 ban.
  - **Limited-recognition audit — no other TRNC-like cases.** XK (53 vf),
    TW (73 vf), PS, SO all have real scraped maps; Abkhazia / S. Ossetia /
    Transnistria / Somaliland have no ISO codes → out of scope; EH is
    destination-only (aliased to MA). Documented, nothing to change.
  - **BMC link updated** to `buymeacoffee.com/travelnowinfo` (app.jsx nav chip
    + /about). Old `uygaratalay` handle is dead — grep shows zero leftovers.
  - **US-traveler quick picks.** `PopularDestinations` in panel.jsx: when the
    US passport is active (outgoing, non-group), 8 one-tap chips — Mexico,
    Canada, UK, France, Italy, Dominican Rep., Japan, Spain (top US outbound
    markets per NTTO stats; stable, no scraping) — each with a live status
    dot; tap opens that country's detail card. Extensible per-passport via
    `_POPULAR_DESTS`. `popular.title` i18n ×6.

- **Round 7 (this session, 2026-06-10):**
  - **Flat top nav + About + ☕ Support on every page.** About + Buy Me a
    Coffee were buried in the panel footer (only visible after scrolling the
    side panel) — most homepage visitors never saw them. Removed the
    `Tools ▾` dropdown; its 4 items (ETIAS, Nomad, Second passport, Alerts)
    now live inline in the bar, and `About` + a `☕ Support` chip live next to
    them. The Support chip uses an amber accent (`#f59e0b` ring) so it
    actually gets seen without shouting. Desktop: 9 inline links; horizontal
    scroll on narrow laptops (no scrollbar). Mobile: hamburger sheet auto-
    stacks them all via existing `.menu-open` rules. `nav.support` i18n in
    en / tr / es / de / fr / ar.
  - **Residence-permit map now repaints for US / UK / CA / AU / GCC.** Root
    cause: `data/visa-conditions.js` had 25 SCHENGEN rules but only 8 CA, 6
    AU, 0 GCC rules — so toggling those blocs visibly did nothing for most
    users. Added global `_PERMIT_GLOBAL_UPGRADES` in `data/visa-overrides.js`:
    ~20-25 destinations per bloc whose published visa policy admits "holders
    of a valid X visa or residence" regardless of nationality (Western
    Balkans, Caucasus, Caribbean, Central America, TR-ev, Oman, Qatar-ev, …).
    Wired into `applyResidenceUpgrade` between the Schengen-Area block and
    per-passport visa-conditions. Verified end-to-end: IN+US→Bahamas vf,
    IN+US→Colombia vf, IN+US→Oman vf, IN+AU→Georgia vf, PH+GCC→Albania vf.
  - **Dual-citizenship hint banner.** New `data/dual-citizenship.js` with 4
    sourced entries (XN→CY *strong*, XK→RS *common*, PS→JO *common*, IL→DE
    Art 116 *narrow*). `DualCitizenshipHint` in `panel.jsx` renders a quiet
    1-line banner under the passport picker when the user's primary is in
    the map; the CTA flips to Combine mode and preloads `[primary,
    secondary]` so the globe repaints with their BEST access. Solves the
    long-standing TRNC problem (TRNC passport recognised by only ~3 states →
    map painted almost entirely `ban`, but most TRNC residents *also* hold a
    Republic of Cyprus passport). Anti-cases (TW→CN no usable PRC option,
    HK→BN(O) already a passport variant, IE↔GB CTA already handled by FOM)
    documented in-file so they don't get re-added by mistake. `dual.*` i18n
    in all 6 langs.
  - **Antarctica visa-free over-report fixed.** Strong default-vf passports
    (DE/JP/US/...) were painting AQ as visa-free because Wikipedia tables
    omit it. Added `AQ` to `VISA_REQUIRED_DESTS` — every visitor needs a
    permit from an Antarctic Treaty party (Article VII). `tally` still
    excludes AQ (`continent === "AN"`) so tallies don't change; this is
    purely a globe-paint correctness fix. Verified: DE→AQ now `vr`.
  - **`site-bug-finder` subagent** (`.claude/agents/site-bug-finder.md`).
    Read-only sibling to `visa-data-auditor` and `no-entry-verifier`: drives
    the local preview, exercises core flows (passport pick → globe paint,
    permit toggles, Compare / Combine, mobile bottom-sheet drag, tap-outside
    dismissal, i18n key fallbacks), reports a P0/P1/P2 punch list. Never
    edits or pushes — reporter not fixer.
  - **Google Ads creatives.** `scripts/generate-ads.py` (Pillow) produces 4
    PNGs at the dialog's spec sizes (1.91:1 landscape 1200×628, 1:1 square
    1200×1200, 4:5 portrait 960×1200, 9:16 tall 1080×1920). Each is a
    dark-navy gradient + starfield + wireframe globe with status-coloured
    dots (vf/eta/ev/voa/vr); the wordmark + tagline are typographic-led, no
    crude continent outline. All under 250 KB. Replaces the rejected
    "Atlas + bad world map" creative; ready to upload from the repo root.
  - **Language detection — clarified, no code change.** Owner asked. Order
    is `localStorage > navigator.language[:2] > "en"` (`data/i18n.js:1193`).
    Geolocation is **not** used for language (only for passport detection).
    `navigator.language` doesn't require user permission so the "what if
    they deny location?" case is a non-issue — fallback already English.

- **Round 6 follow-ups (this session, 2026-06-09):**
  - **Residence-permit picker (the headline feature).** A reporter living in
    Italy on a Türk passport asked: "if I add my Italian residence permit, how
    does the map change?" Built a global 6-bloc picker — **Schengen / US / UK
    / Canada / Australia-NZ / GCC** — in the side panel (collapsed by default,
    one-click chips). Activating any bloc:
    - Sets `window.ATLAS_RESIDENCE_PERMITS` (and persists to localStorage
      `atlas.permits`); the resolveStatus chain now calls
      `applyResidenceUpgrade()` between `applyIdcDisplay` and `applyDestFloor`.
    - Schengen permit ⇒ visa-free 90d to any Schengen Area dest (precisely the
      29-state Area, NOT EEA — `_SCHENGEN_AREA` excludes Ireland and Cyprus
      because they're EU-but-not-Schengen and a permit doesn't actually open
      entry there).
    - Other permits ⇒ swap to whatever upgrade the per-destination
      `visa-conditions.js` rule promises (already authored against the
      destination's "Visa policy of <country>" page, so no new sourcing). GCC
      expands to its 6 members so `ifHolds:["AE"]`-style rules also match.
    - Tags `r.upgradedBy = "<bloc>"` so the detail card shows a sky-blue
      banner explaining WHY the country lit up (e.g. "Unlocked by your
      Schengen permit"). New i18n: `permits.*` + `detail.via_permit_*` × 6
      languages. Globe `useMemo` deps now include `residencePermits` so the
      whole map repaints when chips toggle.
    - Same-tick correctness: `setResidencePermits` writes the global
      SYNCHRONOUSLY *before* the React state update so the immediate re-render
      sees the new value (a useEffect mirror would lag by one render and the
      first paint would be stale).
    - Verified end-to-end: TR baseline 73 visa-free → +Schengen permit 102
      visa-free (+29 countries unlocked), 66 visa-required → 37. TR→DE/IT/FR/
      GR/PT correctly flip to vf-via-Schengen; TR→IE/CY correctly stay
      visa-required (Schengen ≠ EEA). IN→TR vr→ev, IN→MX vr→vf (both
      Schengen-permit upgrades sourced in visa-conditions.js). North Korea
      floor still wins (no permit can override "visa-required for all").
  - **Buy Me a Coffee link** added to /about under "Why it's free" →
    `https://buymeacoffee.com/uygaratalay`. Doesn't conflict with AdSense.
  - **Branding de-AI'd.** Old `<title>` "Atlas — Where can your passport take
    you?" looked AI-template-y and "Atlas" wasn't a real brand. Bulk
    word-boundary `sed` replaced `Atlas` → `travelnow.info` across all HTML/JS/
    JSX/MD (zero non-brand uses survived). Homepage title is now
    **"travelnow.info — Visa requirements for every passport"**; OG/Twitter/
    canonical/breadcrumb + per-page SEO titles regenerated for all 200 passport
    pages. About → "About travelnow.info"; Privacy → "Privacy Policy ·
    travelnow.info" (cleaned the leftover " / TravelNow" doubling).
  - **Analytics installed.** `assets/analytics.js` (one shared loader) defines
    `dataLayer`/`gtag` then injects GA4 (G-YVQRDY5YXH, IP anonymised) + Matomo
    Tag Manager (cloud container `L8Pi0F9e`) — both only on the production
    hostname; never fires on localhost/preview. Loader added to every static
    `<head>` (16 pages) and to `scripts/generate-seo.js` so the 200
    auto-generated passport pages get it too. Privacy page updated to disclose
    `_ga*` / `_pk_*` cookies. Owner action remaining for Matomo: console steps
    1-14 (configure the History Change trigger for SPA tracking — out-of-code
    work in the Matomo dashboard).
  - **Fake-news guard.** Reporter flagged "China extends 30-day visa-free
    transit to Türkiye + 8 others" — verified against Wikipedia, TR is NOT on
    China's visa-free list. Root cause: 8 hand-curated `manual:*` items in
    `data/visa-news.js` had source URLs that were just domain homepages
    (e.g. `fmprc.gov.cn/eng/`) — unverifiable. Dropped all 8; kept the
    auto-scraped `wiki:*`/`fco:*` entries. `backend/fetch-news.js` now has
    `isVerifiableManual()` — refuses any manual entry whose sourceUrl is a
    domain root or language homepage (`/`, `/en/`, `/eng/`, …).

- **Reddit feedback round 5 (FIXED) — this session (2026-06-05):**
  - **Combine mode was BACKWARDS (the headline bug).** A reporter noted the site
    promises "combine several to see your best combined access" but combining
    *reduced* access. Root cause: `resolveGroupStatus` in `backend/frontend-tail.js`
    (and the copy appended into `data/passports.js`) returned the **worst** status
    across the held passports (an old "group travel — where can we ALL go" model).
    The product intent is ONE person holding several passports → they enter on
    whichever passport is best. Rewrote it to return the **best** (least-restrictive)
    status + a `via` field (which passport wins). `tallyGroup` now increases with
    more passports (TR solo vf 76 → TR+DE 133). UI: the per-passport breakdown in
    the detail card highlights the winning passport with a "best" badge
    (`detail.best_passport`); settings + tally copy de-"strictest"-ified across all
    6 langs (`settings.group_*`, `tally.group_label`, `tally.worst_case`).
  - **2D/3D + dark/light were undiscoverable.** They lived only inside the gear
    popover — and on mobile the gear itself was buried two levels deep (hamburger →
    gear → popover). Pulled the control cluster (`.rhs`) OUT of the collapsible
    `.topbar-sheet` so it's always on the bar, and added always-visible inline
    `InlineModeToggle` (3D/2D) + new `InlineThemeToggle` (sun/moon, dark/light)
    next to the gear. Mobile: cluster stays on the bar (verified 375px = no
    overflow), the non-essential "?" help is hidden (`.help-btn-wrap`). Gear kept
    for language + compare/combine.
  - **British passport CLASSES shipped (BOTC + BOC).** Long-standing request
    ("support the different classes of British passport"). Built a sourced,
    full-map variant: `backend/fetch-british-classes.js` scrapes the dedicated
    Wikipedia tables → `data/passport-variants-gb.js` (`window.PASSPORT_VARIANTS_GB`).
    Extended the variant framework: a variant can now be `mode:"full"` — a COMPLETE
    map with its OWN default, so a weaker class doesn't inherit the strong British
    Citizen access (the old overlay-on-ordinary fallback would have). `passport-
    variants.js` merges them under GB; the GB "ordinary" is relabelled
    **British Citizen**, so the picker reads *British Citizen · BOTC · BOC*. Verified
    they diverge correctly (US: ev→vr→vr; TR: vf→ev→vr; tally vf 124→102→95).
    Wired into index.html + the daily cron. **BN(O), British subjects, British
    protected persons: NO parseable Wikipedia table exists → deliberately omitted
    (never invent).** Same for alien/refugee travel documents.
  - **Bogus "no entry" bans fixed (data-integrity bug I found while auditing).**
    The ban classifier matched `"travel banned"`, but on Wikipedia that phrase is
    an **origin**-government prohibition (e.g. South Korea → Syria/Yemen/Ukraine,
    cells read `"eVisaTravel banned"`), NOT a destination refusal. It painted
    South Korea — a top-5 passport — as "no entry allowed" for **12** countries.
    Removed `"travel banned"` from the ban branch (kept "admission/entry refused",
    "entry banned", "no entry", "entry prohibited", "not admitted"). Targeted
    merge-regen of the 22 ban-carrying passports (`scraper.js` now exports its
    internals + guards `main()` behind `require.main`): KR 12→0, Iraq 1→0; every
    genuine "Admission refused" ban (US=3, TW=2, IL=7, RU=7, …) preserved. KR→Syria
    now correctly = eVisa, →Ukraine = visa-free, etc. Snapshot still 200 passports,
    no empty entries. The nightly `--all` cron self-heals the rest with the same fix.
  - **Verified the rest of the round-4/5 reports against the live source — all
    already correct (reporters out of date or misread eVisa as visa-free):**
    TR→South Africa = "Visa not required" 30d (SA added Türkiye; our `vf 30` is
    right, special/green falls through to the same). ZA→Saudi = "eVisa/VoA",
    UG→Saudi = "eVisa", RU→Saudi = "Visa not required" — i.e. only Russia is
    visa-free, exactly as we show. India→Malaysia vf 30, →Macau vf, →Hong Kong =
    "Electronic Travel Authorization" (ev). No changes needed; documented.

- **Round 5 follow-ups (same session):**
  - **Combine now supports up to 10 passports** (was 4) — `MAX` in `GroupPicker`
    (`components/panel.jsx`). Addresses "can you combine more than 4, like up to 10?".
  - **Top-right gear → plain language switcher.** Since 2D/3D + dark/light are now
    always-visible inline toggles and compare/combine live in the panel, the gear
    popover was redundant. `SettingsButton` (`app.jsx`) is now just a globe + current
    language code that opens the language list (no more mode/theme/compare/group
    duplication). `header.live` i18n key dropped; unused `settings.*`/`nav.mode`/
    `nav.settings` keys are now orphaned (harmless).
  - **Removed the pulsing "Live" badge** in the panel header — looked AI-template-y.
    Now a quiet "Updated <date>" (`header.updated`, 6 langs; no animated dot).
  - **New `eta` status — "Travel authorization".** ESTA / Canada eTA / Australia
    ETA-eVisitor / NZeTA / UK ETA were lumped into `ev` (eVisa); reporters wanted
    them distinct (lighter than an eVisa, definitely not visa-free). Added a 6th
    status with its own teal colour (`--eta:#2dd4bf`) + label. Implemented as a
    DISPLAY relabel, NOT a re-scrape: `data/visa-overrides.js` has `ETA_DESTS`
    {US,CA,AU,NZ,GB} + `applyEtaDisplay()`, and `resolveStatus` (wrapped as
    `_resolveStatusBase` + a thin `resolveStatus` that calls `applyEtaDisplay`)
    relabels any `ev`→`eta` for those destinations. The scraper already knew WHICH
    passports get the electronic option (stored `ev`), so no data is invented and
    no re-scrape is needed — `passports.js` was rebuilt from the snapshot + the new
    `frontend-tail.js`. Wired through: `_ACCESS_RANK` (vf<eta<ev<voa<vr<ban), tally
    counts (`eta:0`), globe `STATUS_COLOR`/`STATUS_HEX`/compare-stripes, panel Tally
    row (shown only when >0) + detail note, Legend, `status.eta`/`detail.note.eta`
    in 6 langs. Verified: DE→US/CA/AU/NZ/GB = eta; IN→US stays vr (India isn't VWP).
  - **"No entry allowed" colour darkened** from crimson `#7f1020` to near-black
    blood-red `#3a0510` (CSS `--ban` + `STATUS_HEX.ban`) so it's unmistakably
    distinct from the `vr` red. `ban` + `eta` both added to the on-globe Legend.
  - **Combine cap is 10** (see above) — and Legend/tally now cover all 6 statuses.
  - **ads.txt "not found" (AdSense) — diagnosed, NOT a code bug.** `https://travelnow.info/ads.txt`
    serves HTTP 200 `text/plain` with the correct `google.com, pub-2617798720306957,
    DIRECT, f08c47fec0942fa0` line. The alert is stale-crawl or Cloudflare bot
    protection challenging Google's AdsBot. Owner actions: (1) in AdSense confirm the
    site URL is the apex `travelnow.info` (NOT `www`, which currently 522s); (2) in
    Cloudflare, allow verified bots / don't challenge AdsBot; (3) re-request review —
    the status can lag days–weeks. Also note: Cloudflare serves a *managed* robots.txt
    (AI-bot block) that overrides the repo's simple one — Google `*` is still allowed.
  - **"No entry" audit + a verifier agent.** Source-checked the famous refusal
    cases against Wikipedia. Found the scraper SILENTLY DROPS rows whose cell reads
    **"Travel illegal under Israeli law"** (classifies to null) — that hid Israel →
    **Iran / Iraq / Lebanon / Syria / Yemen** (permanent mutual non-recognition; the
    destinations don't admit Israeli passports). Added them as sourced `ban`
    overrides in `data/visa-overrides.js` (`ISRAEL_NO_ENTRY`); IL now shows 12
    no-entry vs 7. Deliberately left as `vr`: Israel→Malaysia/Pakistan/Saudi
    ("Admission restricted" — case-by-case permission) and Azerbaijan→Armenia
    ("Special permit required"). Kosovo→Armenia/Cuba were already `ban`. Built
    `.claude/agents/no-entry-verifier.md` — a read-only subagent that codifies this
    check (refused→ban, restricted→vr, origin-advisory→keep dest status; cite the
    source cell; propose overrides for human review, never push). Spawn it to audit
    more passports.
  - **New `idc` status — "ID-card travel" (7th status, sky blue `--idc:#38bdf8`).**
    Some travellers need only a national ID card, not a passport. The scraper can't
    source this (the status column just says "Visa not required" / "Freedom of
    movement" — verified: DE/AR/SA/AL pages have ZERO "ID card" cells), so it's a
    CURATED rule in `data/visa-overrides.js` (`isIdCardTravel` + `applyIdcDisplay`,
    a vf→idc display upgrade) covering documented blocs: EEA+CH internal (reuses
    `FOM_EEA`), GCC, Mercosur, Western Balkans, and TR↔{GE,UA,XN} bilaterals. Ranks
    as the BEST access (idc<vf<eta<ev<voa<vr<ban). Wired through the same surface as
    eta (rank, tally counts, globe colour/hex/stripes, panel tally row + detail note,
    legend, 6-lang `status.idc`/`detail.note.idc`). EEA-internal keeps its `fom` flag
    (detail still says "no time limit") but now paints idc. Verified: DE→FR/SA→AE/
    TR→GE = idc; DE→US still eta; DE→JP still vf.
  - **TRNC (Northern Cyprus) passport corrected.** Wikipedia: "accepted as a travel
    document by only three countries" — table lists only Turkey. Changed the XN
    MANUAL_OVERRIDE default `vr`→`ban` (keep Turkey, which is actually idc — "a valid
    ID card is enough"). XN now: 1 idc (TR) + 204 ban. Other diplomatically-
    unrecognised passports (Kosovo, Taiwan) are still widely ACCEPTED for travel, so
    they are NOT bans — only TRNC is a genuine "passport not accepted" case here.
  - **North Korea over-report fixed + a data-accuracy auditor agent.** A reporter
    flagged Israel→North Korea reading "visa-free". Root cause: the compact data
    only lists EXCEPTIONS, so a passport with `default:"vf"` (Israel, +2 others)
    over-reports any restrictive destination MISSING from its table. North Korea is
    visa-required for EVERYONE (no visa-exempt nationalities), so added a
    `VISA_REQUIRED_DESTS` floor + `applyDestFloor()` in `data/visa-overrides.js`
    (wired into the `resolveStatus` chain after eta/idc): any "easy" result to KP is
    floored to `vr`. IL→KP now `vr`; 0 passports over-report KP. Built
    `.claude/agents/visa-data-auditor.md` and ran it on the other suspicious
    restrictive-destination fallbacks (Algeria/Sudan/Yemen/Nauru/CAR/Congo/Mali ×14
    pairs) — it source-verified ALL as actually correct (e.g. Algeria really exempts
    MY/SC, CAR is visa-free for IL, Mali exempts UAE/HK/Macau), preventing 14 WRONG
    overrides. Lesson: a missing-from-map destination usually just equals the
    passport's (correct) default — only floor destinations that exempt NOBODY.
    Add more `VISA_REQUIRED_DESTS` only when the source confirms zero exemptions.
  - **AdSense (browser attempt):** drove the Chrome extension; found the AdSense
    account (pub-2617…) is NOT under `uygaratly@gmail.com` (that login gets "Access
    denied / doesn't have access to this AdSense account"). Cloudflare IS under
    uygaratly (saw the `atlas-visa-globe` Pages project + `travelnow.info` zone). So
    the ads.txt fix is blocked on knowing which Google account owns AdSense; the
    Cloudflare `www` 522 + bot fixes are doable once the dash stops timing out. The
    extension's tab-group creation is also flaky ("No group with id").

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

## Reddit feedback — status tracker (as of round 5)

**DONE / shipped:**
- **Combine = best access** (was worst) · **2D/3D + dark/light surfaced** inline on
  the bar (desktop + mobile) · **British classes BOTC + BOC** (sourced full maps)
- **Korea-style origin "Travel banned" no longer shows as "no entry"** (classifier +
  22-passport regen) — genuine destination refusals (IL/RU/US/TW …) preserved
- "No entry allowed" status (`ban`) — Israel & co. · UK→Ireland freedom of movement
- India→Malaysia 30-day visa-free (was VoA) · Cuba e-visa ineligible list (PH etc.)
- ETA ≠ visa-free: US (VWP/ESTA), Australia (eVisitor), NZ (NZeTA), UK ETA, K-ETA
- HK / Macau / Taiwan resolve correctly (gap-fill) · visa-free day counts
  (TR→ZA, CA→CN = 30) · India→Pakistan = visa-required not banned
- Canada→Korea visa-free (K-ETA waiver) · Canada→China 30 days + "until 2026" note
- Entry-mode caveats (India eVisa land border, Russia/Canada/SA/China) in detail card
- Passport-combo bar more discoverable · mobile bottom-sheet drag (both directions)

**Verified already-correct vs the LIVE source (reporter out of date / misread):**
- TR→South Africa = "Visa not required" 30d (our `vf 30` is right; SA added Türkiye)
- Saudi: ZA→SA / UG→SA = "eVisa", RU→SA = "Visa not required" — only Russia is
  visa-free (ex-GCC), exactly as we show; "eVisa" was being misread as "visa-free"
- India→New Zealand = visa-required (NZeTA only for visa-waiver nationals)
- India→Hong Kong = Electronic Travel Authorization (`ev`), →Macau = visa-free
- Antigua→Taiwan = visa-required (fixed round 4)

**PENDING / roadmap (NOT built — mostly source-limited):**
1. **More British classes / other travel documents.** BOTC + BOC shipped. **BN(O)**
   (the big Hong-Kong ask), British subjects, British protected persons, and
   alien/refugee travel documents have **no parseable Wikipedia visa table**, so
   they're omitted on purpose (the no-invent rule). If an authoritative machine-
   readable source appears, add it to `backend/fetch-british-classes.js` and it
   flows through the existing `mode:"full"` variant path. Other countries' service/
   special classes would use the same path.
2. **Residence-permit holder mode** ("I hold a US green card / EU permit — where
   does that get me?"). Partly expressible via `data/visa-conditions.js`
   (`ifHolds:["US","SCHENGEN",…]`, already powers the detail-card "if you also hold
   X" shortcuts). Roadmap: a dedicated "add a residence permit" control that
   recomputes the WHOLE map. Same shape as the variant picker — good next feature.
3. **Distinct "travel authorization" (ETA) category.** ETAs are currently folded
   into `ev` (so they're not shown as visa-free — the core complaint is satisfied).
   A 6th status splitting ESTA/eTA/ETIAS/K-ETA/NZeTA from real eVisas would be more
   precise but touches scraper + colors + legend + i18n×6 + tally. Deferred.
4. **Entry-mode modelling (beyond notes).** Caveat notes cover air-vs-land today; a
   full per-mode status model is probably overkill.
5. **Expand `visa-conditions.js`** (US/Schengen-visa exemptions, transit/layover) —
   hand-curated, high trust value, currently only a handful of entries.

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
3. **Owner decisions waiting (Round 10):** create the Firebase project
   (`ACCOUNT-SETUP.md`) → paste config → test live; the alerts email signup
   (`/api/subscribe`) returns 404 live — hide it or wire accounts/alerts; mobile
   app route (Capacitor + AdMob) once accounts exist.
4. **Later:** finish es/de/fr/ar for long legal/FAQ prose; re-enable Premium
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
