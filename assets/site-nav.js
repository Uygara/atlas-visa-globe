// Site navigation — the ONE list every header reads.
//   • Browser: exposes window.SITE_NAV (SPA masthead in components/chrome.jsx,
//     static-page masthead in assets/site-chrome.js).
//   • Node: module.exports (scripts/partials.js stamps it into static HTML so
//     crawlers see real links without running JS).
// Order is priority order: when the bar is too narrow, items fold into "More"
// from the END of the list, so keep the most-used tools first.
(function (root) {
  // `g` is the group: maps and the planner, the two reference indexes, the two
  // rule checkers, then the specialist pages and the site itself. Every header
  // draws a divider where the group changes so twelve links read as four clusters.
  var NAV = [
    { href: "/",                          key: "nav.visa_map",    en: "Visa map",        g: 0 },
    { href: "/transit-map/",              key: "nav.transit_map", en: "Transit map",     g: 0 },
    { href: "/safety-map/",               key: "nav.safety_map",  en: "Safety map",      g: 0 },
    { href: "/itinerary/",                key: "nav.itinerary",   en: "Travel planner",  g: 0 },
    { href: "/passport/",                 key: "nav.passports",   en: "Passports",       g: 1 },
    { href: "/guides/",                   key: "nav.guides",      en: "Guides",          g: 1 },
    { href: "/schengen-calculator/",      key: "nav.schengen",    en: "Schengen calc",   g: 2 },
    { href: "/etias/",                    key: "nav.etias",       en: "ETIAS 2026",      g: 2 },
    { href: "/digital-nomad-visa/",       key: "nav.nomad",       en: "Nomad visas",     g: 3 },
    { href: "/citizenship-by-investment/", key: "nav.cbi",        en: "Second passport", g: 3 },
    { href: "/alerts/",                   key: "nav.alerts",      en: "Alerts",          g: 3 },
    { href: "/about/",                    key: "nav.about",       en: "About",           g: 3 }
  ];
  var SUPPORT = { href: "https://buymeacoffee.com/travelnowinfo", key: "nav.support", en: "Support" };

  // Pages that have a Turkish twin at /tr/<path> (scripts/build-tr.js writes the
  // hand-written ones, scripts/generate-seo.js the passport pages). English stays
  // at the root; both carry <link rel="alternate" hreflang> to each other. The
  // other interface languages (es, de, fr, ar) translate the English page in place.
  var TR_PAGES = [
    "/", "/about/", "/alerts/", "/citizenship-by-investment/", "/contact/",
    "/digital-nomad-visa/", "/esta-rules/", "/etias/", "/guides/",
    "/guides/etias-2026-explained/", "/guides/how-we-count/", "/guides/passport-validity-six-month-rule/",
    "/guides/schengen-90-180-rule/", "/guides/transit-visa-guide/",
    "/guides/visa-types-explained/", "/passport-validity/",
    "/schengen-calculator/", "/visa-checklist/tr-schengen/",
    "/visa-shortcuts/", "/passport/"
  ];
  function isTrPath(p) { return /^\/tr(\/|$)/.test(p); }
  function fromTr(p) { return isTrPath(p) ? (p.replace(/^\/tr(?=\/)/, "") || "/") : p; }
  // English path → its Turkish twin (every /passport/<iso>/ has one too).
  function hasTr(p) {
    // The iOS/Android app (app/) ships the English pages only and translates in place.
    if (typeof window !== "undefined" && window.ATLAS_APP) return false;
    return TR_PAGES.indexOf(p) !== -1 || /^\/passport\/[a-z]{2}\/$/.test(p);
  }
  function toTr(p) { return "/tr" + p; }
  // Where a link should point for a reader of `lang`.
  function localHref(href, lang) {
    return lang === "tr" && hasTr(href) ? toTr(href) : href;
  }

  // A link is "current" when the path matches exactly, or (for sections) when
  // the path lives underneath it — /guides/etias-2026-explained/ → Guides.
  function isCurrent(item, path) {
    path = fromTr(path);
    if (item.href === "/") return path === "/" || path === "/index.html";
    return path === item.href || path.indexOf(item.href) === 0;
  }

  var api = {
    NAV: NAV, SUPPORT: SUPPORT, isCurrent: isCurrent,
    TR_PAGES: TR_PAGES, hasTr: hasTr, toTr: toTr, fromTr: fromTr, isTrPath: isTrPath, localHref: localHref
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SITE_NAV = api;
})(this);
