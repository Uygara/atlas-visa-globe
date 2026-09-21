// Shared HTML partials for every static page: <head> assets, masthead, footer.
//
// Used by:
//   • scripts/apply-chrome.js — stamps them into the hand-written pages
//   • scripts/generate-seo.js — builds the ~200 passport pages with them
//
// The nav list itself lives in assets/site-nav.js so the React masthead and
// these static pages can never drift apart. Links are real <a href> in the
// HTML (crawlable without JS); assets/site-chrome.js only adds behaviour
// (overflow "More" menu, mobile sheet, theme + language controls).

const { NAV, SUPPORT, isCurrent } = require("../assets/site-nav.js");
const { makeT, hasTr, toTr, hreflang } = require("./locales");

const ASSET_VERSION = "20260920c";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// The mark: a passport page opening its MRZ with "P<", over a dotted filler line.
const BRAND_MARK = `<svg class="brand-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.75" y="1.75" width="18.5" height="20.5" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6.4 14.6V6.8h2.9a2.4 2.4 0 0 1 0 4.8H6.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.9 7.3 13.9 10.7l3 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.4 18.3h11.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="0.1 2.3"/></svg>`;
const CARET = `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SUN = `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="currentColor"/><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M8 1.2v1.7M8 13.1v1.7M1.2 8h1.7M13.1 8h1.7M3.2 3.2l1.2 1.2M11.6 11.6l1.2 1.2M12.8 3.2l-1.2 1.2M4.4 11.6l-1.2 1.2"/></g></svg>`;
const MOON = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8z" fill="currentColor"/></svg>`;
const USER = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="5.6" r="2.9" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2.6 14.2c.7-2.8 2.8-4.3 5.4-4.3s4.7 1.5 5.4 4.3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
const MENU = `<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><path d="M3 5.5h12M3 9h12M3 12.5h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

// The last flag marks languages that are not fully translated yet (shown as "beta").
const LANGS = [["en", "English"], ["tr", "Türkçe"], ["es", "Español", 1], ["de", "Deutsch", 1], ["fr", "Français", 1], ["ar", "العربية", 1]];

// The hreflang alternates for a page that has a Turkish twin, plus the language
// routing: a reader who chose Turkish is sent from an English page to its twin
// before anything paints, and landing on a Turkish page makes Turkish the stored
// choice. `enPath` is the page's English URL path. Empty for pages without a twin.
function langHead({ enPath = null, lang = "en" } = {}) {
  if (!enPath || !hasTr(enPath)) return "";
  const route = lang === "tr"
    ? `<script>try{localStorage.setItem("atlas.lang","tr")}catch(e){}</script>`
    : `<script>try{if(localStorage.getItem("atlas.lang")==="tr")location.replace("/tr"+location.pathname+location.search+location.hash)}catch(e){}</script>`;
  return hreflang(enPath) + "\n" + route;
}

// Fonts + design-system stylesheets + the pre-paint theme switch (after the
// language block above when the page has a Turkish twin).
function headAssets({ enPath = null, lang = "en" } = {}) {
  const v = ASSET_VERSION;
  const lh = langHead({ enPath, lang });
  return `${lh ? lh + "\n" : ""}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sofia+Sans:ital,wght@0,400..700;1,400..600&family=Sofia+Sans+Extra+Condensed:wght@600..850&family=DM+Mono:wght@400;500&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/tokens.css?v=${v}">
<link rel="stylesheet" href="/assets/chrome.css?v=${v}">
<link rel="stylesheet" href="/assets/site.css?v=${v}">
<script>try{if((JSON.parse(localStorage.getItem("atlas.tweaks")||"{}")).background==="dark")document.documentElement.classList.add("theme-dark")}catch(e){}</script>
<script src="/assets/account-config.js?v=${v}"></script>
<script src="/assets/account-sync.js?v=${v}"></script>
<script src="/assets/account.js?v=${v}"></script>
<script src="/assets/site-chrome.js?v=${v}" defer></script>`;
}

// `path` is the page's ENGLISH URL path ("/guides/", "/passport/tr/") for
// aria-current and for the twin links. `i18n` adds the full language select
// (only pages that load data/static-i18n.js); pages with a Turkish twin get an
// EN/TR select that navigates between the twins. `lang: "tr"` renders the
// Turkish page: labels from the site dictionary, links to Turkish twins.
const UI_TR = { menu: "Menü", theme: "Tema", light: "Açık", dark: "Koyu", lang: "Dil", account: "Hesap", main: "Ana menü", home: "travelnow.info ana sayfa" };
function masthead({ path = "/", i18n = true, lang = "en" } = {}) {
  const t = makeT(lang);
  const u = (k, en) => (lang === "tr" ? UI_TR[k] : en);
  const href = (h) => (lang === "tr" && hasTr(h) ? toTr(h) : h);
  const cur = (it) => isCurrent(it, path) ? ' aria-current="page"' : "";
  // The first link of each group carries `mh-grp-start` (a divider in the bar and the menus).
  const start = (i) => (i > 0 && NAV[i].g !== NAV[i - 1].g ? " mh-grp-start" : "");
  const links = NAV.map((it, i) => `      <li${start(i) ? ` class="${start(i).trim()}"` : ""}><a class="mh-link" href="${href(it.href)}"${cur(it)}>${esc(t(it.en))}</a></li>`).join("\n");
  const sheet = NAV.map((it, i) => `    <a class="mh-sheet-link${start(i)}" href="${href(it.href)}"${cur(it)}>${esc(t(it.en))}</a>`).join("\n");
  const langs = i18n ? LANGS : (hasTr(path) ? LANGS.filter(([c]) => c === "en" || c === "tr") : []);
  const langSelect = langs.length
    ? `<select class="lang-select" data-lang-select aria-label="${u("lang", "Language")}">${langs.map(([c, n, beta]) => `<option value="${c}"${c === lang ? " selected" : ""}>${c.toUpperCase()} · ${n}${beta ? " (beta)" : ""}</option>`).join("")}</select>`
    : "";
  return `<header class="masthead">
  <a class="brand" href="${href("/")}" aria-label="${u("home", "travelnow.info home")}">${BRAND_MARK}<span class="brand-word">travelnow<span class="brand-tld">.info</span></span></a>
  <nav class="mh-nav" aria-label="${u("main", "Main")}">
    <ul class="mh-links">
${links}
    </ul>
    <div class="mh-more" hidden>
      <button type="button" class="mh-link mh-more-btn" aria-expanded="false">${esc(t("More"))}${CARET}</button>
      <ul class="mh-menu" hidden></ul>
    </div>
  </nav>
  <div class="mh-tools" data-no-i18n>
    <a class="mh-account" href="/account/" data-account-link hidden aria-label="${u("account", "Account")}" title="${u("account", "Account")}">${USER}<span data-account-initial></span></a>
    <div class="seg" role="group" aria-label="${u("theme", "Theme")}"><button type="button" data-theme-set="light" aria-pressed="true" aria-label="${u("light", "Light")}" title="${u("light", "Light")}">${SUN}</button><button type="button" data-theme-set="dark" aria-pressed="false" aria-label="${u("dark", "Dark")}" title="${u("dark", "Dark")}">${MOON}</button></div>
    ${langSelect}
    <a class="mh-support" href="${SUPPORT.href}" target="_blank" rel="noopener">${esc(t(SUPPORT.en))}</a>
  </div>
  <button type="button" class="mh-burger" aria-label="${u("menu", "Menu")}" aria-expanded="false">${MENU}</button>
  <div class="mh-sheet">
${sheet}
    <div class="mh-sheet-foot" data-no-i18n>${langSelect}<a class="mh-support" style="display:inline-block" href="${SUPPORT.href}" target="_blank" rel="noopener">${esc(t(SUPPORT.en))}</a></div>
  </div>
</header>
<div class="doc-band" aria-hidden="true"></div>`;
}

function footer({ lang = "en" } = {}) {
  const t = makeT(lang);
  const href = (h) => (lang === "tr" && hasTr(h) ? toTr(h) : h);
  const col = (title, items) => `    <div>
      <h2>${esc(t(title))}</h2>
      <ul>
${items.map(([h, label]) => `        <li><a href="${href(h)}">${esc(t(label))}</a></li>`).join("\n")}
      </ul>
    </div>`;
  return `<footer class="site-foot">
  <div class="site-foot-inner">
    <div>
      <a class="brand" href="${href("/")}" aria-label="travelnow.info">${BRAND_MARK}<span class="brand-word">travelnow<span class="brand-tld">.info</span></span></a>
      <p class="site-foot-about">${esc(t("An independent visa atlas, built and maintained by Uygar Atalay. Corrections and questions:"))} <a href="mailto:hello@travelnow.info">hello@travelnow.info</a></p>
    </div>
${col("Tools", [["/", "Visa map"], ["/transit-map/", "Transit map"], ["/itinerary/", "Travel planner"], ["/schengen-calculator/", "Schengen calc"], ["/etias/", "ETIAS 2026"], ["/passport-validity/", "Passport validity"], ["/alerts/", "Alerts"]])}
${col("Read", [["/guides/", "Guides"], ["/passport/", "All passports"], ["/visa-shortcuts/", "Visa shortcuts"], ["/digital-nomad-visa/", "Nomad visas"], ["/citizenship-by-investment/", "Second passport"]])}
${col("The project", [["/about/", "About"], ["/contact/", "Contact"], ["/privacy/", "Privacy"], ["/terms/", "Terms"], ["https://github.com/Uygara/atlas-visa-globe", "Source on GitHub"]])}
    <p class="site-foot-note">${esc(t("Visa rules change often — always confirm with the destination's embassy or consulate before you book. Data is rebuilt every 24 hours from public visa-policy sources."))}</p>
  </div>
</footer>`;
}

module.exports = { ASSET_VERSION, langHead, headAssets, masthead, footer, BRAND_MARK };
