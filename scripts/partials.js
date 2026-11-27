// Shared HTML partials for every static page: <head> assets, masthead, footer.
//
// Used by:
//   • scripts/apply-chrome.js — stamps them into the hand-written pages
//   • scripts/generate-seo.js — builds the ~200 passport pages with them
//
// The nav list itself lives in assets/site-nav.js so the React masthead and
// these static pages can never drift apart. Links are real <a href> in the
// HTML (crawlable without JS), the "All tools" panel included (it is `hidden`
// until opened); assets/site-chrome.js only adds behaviour (the two pop-over
// menus, mobile sheet, theme + language controls).

const { PRIMARY, GROUPS, SUPPORT, INSTAGRAM, isCurrent } = require("../assets/site-nav.js");
const { makeT, hasTr, toTr, hreflang } = require("./locales");

const ASSET_VERSION = "20261127u";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// The mark: a passport page opening its MRZ with "P<", over a dotted filler line.
const BRAND_MARK = `<svg class="brand-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.75" y="1.75" width="18.5" height="20.5" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6.4 14.6V6.8h2.9a2.4 2.4 0 0 1 0 4.8H6.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.9 7.3 13.9 10.7l3 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.4 18.3h11.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="0.1 2.3"/></svg>`;
const CARET = `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
  return `${lh ? lh + "\n" : ""}<link rel="stylesheet" href="/assets/fonts.css?v=${v}">
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
// aria-current and for the twin links. `i18n` adds the full language list
// (only pages that load data/static-i18n.js); pages with a Turkish twin get an
// EN/TR list that navigates between the twins. `lang: "tr"` renders the
// Turkish page: labels from the site dictionary, links to Turkish twins.
const UI_TR = { main: "Ana menü", home: "travelnow.info ana sayfa" };
function masthead({ path = "/", i18n = true, lang = "en" } = {}) {
  const t = makeT(lang);
  const u = (k, en) => (lang === "tr" ? UI_TR[k] : en);
  const href = (h) => (lang === "tr" && hasTr(h) ? toTr(h) : h);
  const cur = (it) => isCurrent(it, path) ? ' aria-current="page"' : "";
  const TOP = GROUPS.filter((g) => g.top), REST = GROUPS.filter((g) => !g.top);
  const toolOn = REST.some((g) => g.items.some((it) => isCurrent(it, path)));
  const toolLink = (it) => `            <li><a class="mh-tool" href="${href(it.href)}"${cur(it)}><span class="mh-tool-t">${esc(t(it.en))}</span>${it.den ? `<span class="mh-tool-d">${esc(t(it.den))}</span>` : ""}</a></li>`;
  // Groups marked `top` get their own dropdown; they and the primary links share one order (`pos`).
  const topMenu = (g, i) => `    <div class="mh-all mh-top">
      <button type="button" class="mh-link mh-all-btn mh-top-btn${g.items.some((it) => isCurrent(it, path)) ? " has-current" : ""}" aria-expanded="false" aria-controls="mh-top-panel-${i}">${esc(t(g.en))}${CARET}</button>
      <div class="mh-panel mh-top-panel" id="mh-top-panel-${i}" hidden>
        <ul>
${g.items.map(toolLink).join("\n")}
        </ul>
      </div>
    </div>`;
  const bar = [
    ...TOP.map((g, i) => ({ pos: g.pos, html: topMenu(g, i) })),
    ...PRIMARY.filter((it) => it.bar !== false).map((it) => ({ pos: it.pos, html: `    <ul class="mh-links"><li><a class="mh-link" href="${href(it.href)}"${cur(it)}>${esc(t(it.en))}</a></li></ul>` })),
  ].sort((a, b) => (a.pos || 99) - (b.pos || 99)).map((x) => x.html).join("\n");
  const MAPS = GROUPS.find((g) => g.maps);
  // The "All tools" panel: three groups, each link with its one-line description (when it has one).
  const groups = REST.map((g) => `        <div class="mh-grp">
          <p class="mh-grp-label">${esc(t(g.en))}</p>
          <ul>
${g.items.map((it) => `            <li><a class="mh-tool" href="${href(it.href)}"${cur(it)}><span class="mh-tool-t">${esc(t(it.en))}</span>${it.den ? `<span class="mh-tool-d">${esc(t(it.den))}</span>` : ""}</a></li>`).join("\n")}
          </ul>
        </div>`).join("\n");
  // Phone sheet: one heading per group (Maps, Tools, Read and explore).
  const sheetGroups = GROUPS.map((g) => `    <p class="mh-sheet-h">${esc(t(g.en))}</p>
    <ul class="mh-sheet-tools">
${g.items.map((it) => `      <li><a class="mh-sheet-tool" href="${href(it.href)}"${cur(it)}>${esc(t(it.en))}</a></li>`).join("\n")}
    </ul>`).join("\n");
  const sheet = PRIMARY.filter((it) => it.href !== "/").map((it) => `    <a class="mh-sheet-link" href="${href(it.href)}"${cur(it)}>${esc(t(it.en))}</a>`).join("\n");
  const langs = i18n ? LANGS : (hasTr(path) ? LANGS.filter(([c]) => c === "en" || c === "tr") : []);
  const langSelect = langs.length
    ? `<select class="lang-select" data-lang-select data-no-i18n aria-label="${esc(t("Language"))}">${langs.map(([c, n, beta]) => `<option value="${c}"${c === lang ? " selected" : ""}>${n}${beta ? " (beta)" : ""}</option>`).join("")}</select>`
    : "";
  const langList = langs.length
    ? `<p class="mh-grp-label">${esc(t("Language"))}</p>
      <ul class="mh-opts" data-no-i18n>${langs.map(([c, n, beta]) => `<li><button type="button" class="mh-opt" data-lang-set="${c}" aria-pressed="${c === lang}">${n}${beta ? " (beta)" : ""}</button></li>`).join("")}</ul>`
    : "";
  const themeOpts = `<div class="mh-opts-row" role="group" aria-label="${esc(t("Theme"))}"><button type="button" class="mh-opt" data-theme-set="light" aria-pressed="true">${esc(t("Light"))}</button><button type="button" class="mh-opt" data-theme-set="dark" aria-pressed="false">${esc(t("Dark"))}</button></div>`;
  // Phone bottom tab bar (< 900px, see chrome.css): four crawlable links and "More", which opens the sheet above.
  const TAB_LABELS = { "/": "Map", "/visa/": "Countries", "/itinerary/": "Planner", "/panel/": "My panel" };
  // The first tab is "Maps": it opens a small menu of the maps (visa, transit, safety, climate), like the desktop bar.
  const mapItems = MAPS.items;
  const onMap = mapItems.some((it) => isCurrent(it, path));
  const mapsTab = `  <div class="tb-maps">
    <button type="button" class="tb-item tb-maps-btn${onMap ? " has-current" : ""}" aria-expanded="false" aria-controls="tb-maps-panel">${esc(t(MAPS.en))}</button>
    <div class="tb-maps-panel" id="tb-maps-panel" hidden>
${mapItems.map((it) => `      <a class="tb-map" href="${href(it.href)}"${cur(it)}>${esc(t(it.en))}</a>`).join("\n")}
    </div>
  </div>`;
  const tabbar = `<nav class="tabbar" aria-label="${esc(t("Quick links"))}">
${mapsTab}
${PRIMARY.filter((it) => it.href !== "/").map((it) => `  <a class="tb-item" href="${href(it.href)}"${cur(it)}>${esc(t(TAB_LABELS[it.href] || it.en))}</a>`).join("\n")}
  <button type="button" class="tb-item tb-more" aria-expanded="false">${esc(t("More"))}</button>
</nav>`;
  return `<header class="masthead">
  <a class="brand" href="${href("/")}" aria-label="${u("home", "travelnow.info home")}">${BRAND_MARK}<span class="brand-word">travelnow<span class="brand-tld">.info</span></span></a>
  <nav class="mh-nav" aria-label="${u("main", "Main")}">
${bar}
${REST.length ? `    <div class="mh-all">
      <button type="button" class="mh-link mh-all-btn${toolOn ? " has-current" : ""}" aria-expanded="false" aria-controls="mh-all-panel">${esc(t("All tools"))}${CARET}</button>
      <div class="mh-panel mh-all-panel" id="mh-all-panel" hidden>
${groups}
      </div>
    </div>` : ""}
  </nav>
  <div class="mh-tools">
    <div class="mh-prefs">
      <button type="button" class="mh-prefs-btn" aria-expanded="false" aria-controls="mh-prefs-panel" aria-label="${esc(t("Language and theme"))}">${langs.length ? `<span data-lang-code data-no-i18n>${lang.toUpperCase()}</span><span aria-hidden="true" data-no-i18n> · </span>` : ""}<span data-theme-label="light">${esc(t("Light"))}</span><span data-theme-label="dark" hidden>${esc(t("Dark"))}</span>${CARET}</button>
      <div class="mh-panel mh-prefs-panel" id="mh-prefs-panel" hidden>
      ${langList}
      <p class="mh-grp-label">${esc(t("Theme"))}</p>
      ${themeOpts}
      </div>
    </div>
    <a class="mh-account" href="${href("/account/")}" data-account-link hidden><span class="mh-signin">${esc(t("Sign in"))}</span><span class="mh-acct-dot" aria-hidden="true"><span data-account-initial></span></span><span class="mh-acct-name">${esc(t("Account"))}</span></a>
  </div>
  <div class="mh-sheet">
${sheet}
${sheetGroups}
    <div class="mh-sheet-foot">${langSelect}${themeOpts}<a class="mh-sheet-ext" href="${INSTAGRAM.href}" target="_blank" rel="noopener" data-no-i18n aria-label="${esc(INSTAGRAM.en)}">Instagram</a><a class="mh-sheet-ext" href="${SUPPORT.href}" target="_blank" rel="noopener">${esc(t(SUPPORT.en))}</a></div>
  </div>
</header>
<div class="doc-band" aria-hidden="true"></div>
${tabbar}`;
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
      <p class="site-foot-about"><a href="mailto:hello@travelnow.info">hello@travelnow.info</a></p>
    </div>
${col("Maps", [["/", "Visa map"], ["/transit-map/", "Transit map"], ["/safety-map/", "Safety map"], ["/climate-map/", "Climate map"]])}
${col("Tools", [["/itinerary/", "Travel planner"], ["/panel/", "My panel"], ["/schengen-calculator/", "Schengen calc"], ["/etias/", "ETIAS 2026"], ["/passport-validity/", "Passport validity"], ["/alerts/", "Alerts"]])}
${col("Read", [["/guides/", "Guides"], ["/passport/", "All passports"], ["/visa/", "Visa by destination"], ["/visa-shortcuts/", "Visa shortcuts"], ["/digital-nomad-visa/", "Digital nomad visas"], ["/citizenship-by-investment/", "Citizenship by investment"], ["/open-data/", "Open data"]])}
${col("The project", [["/about/", "About"], ["/contact/", "Contact"], ["/privacy/", "Privacy"], ["/terms/", "Terms"], [SUPPORT.href, "Support"], ["https://www.instagram.com/travelnow.info/", "Instagram"], ["https://github.com/Uygara/atlas-visa-globe", "Source on GitHub"]])}
  </div>
</footer>`;
}

module.exports = { ASSET_VERSION, langHead, headAssets, masthead, footer, BRAND_MARK };
