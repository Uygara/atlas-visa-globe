// Site navigation — the ONE list every header reads.
//   • Browser: exposes window.SITE_NAV (SPA masthead in components/chrome.jsx,
//     static-page masthead in assets/site-chrome.js).
//   • Node: module.exports (scripts/partials.js stamps it into static HTML so
//     crawlers see real links without running JS).
// Order is priority order: when the bar is too narrow, items fold into "More"
// from the END of the list, so keep the most-used tools first.
(function (root) {
  var NAV = [
    { href: "/",                          key: "nav.visa_map",    en: "Visa map" },
    { href: "/transit-map/",              key: "nav.transit_map", en: "Transit map" },
    { href: "/safety-map/",               key: "nav.safety_map",  en: "Safety map" },
    { href: "/itinerary/",                key: "nav.itinerary",   en: "Travel planner" },
    { href: "/schengen-calculator/",      key: "nav.schengen",    en: "Schengen calc" },
    { href: "/etias/",                    key: "nav.etias",       en: "ETIAS 2026" },
    { href: "/passport/",                 key: "nav.passports",   en: "Passports" },
    { href: "/guides/",                   key: "nav.guides",      en: "Guides" },
    { href: "/digital-nomad-visa/",       key: "nav.nomad",       en: "Nomad visas" },
    { href: "/citizenship-by-investment/", key: "nav.cbi",        en: "Second passport" },
    { href: "/alerts/",                   key: "nav.alerts",      en: "Alerts" },
    { href: "/about/",                    key: "nav.about",       en: "About" }
  ];
  var SUPPORT = { href: "https://buymeacoffee.com/travelnowinfo", key: "nav.support", en: "Support" };

  // Pages that have a Turkish twin at /tr/<path> (scripts/build-tr.js writes the
  // hand-written ones, scripts/generate-seo.js the passport pages). English stays
  // at the root; both carry <link rel="alternate" hreflang> to each other. The
  // other interface languages (es, de, fr, ar) translate the English page in place.
  var TR_PAGES = [
    "/", "/about/", "/alerts/", "/citizenship-by-investment/", "/contact/",
    "/digital-nomad-visa/", "/esta-rules/", "/etias/", "/guides/",
    "/guides/etias-2026-explained/", "/guides/passport-validity-six-month-rule/",
    "/guides/schengen-90-180-rule/", "/guides/transit-visa-guide/",
    "/guides/visa-types-explained/", "/passport-validity/",
    "/schengen-calculator/", "/visa-checklist/tr-schengen/",
    "/visa-shortcuts/", "/passport/"
  ];
  function isTrPath(p) { return /^\/tr(\/|$)/.test(p); }
  function fromTr(p) { return isTrPath(p) ? (p.replace(/^\/tr(?=\/)/, "") || "/") : p; }
  // English path → its Turkish twin (every /passport/<iso>/ has one too).
  function hasTr(p) {
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
