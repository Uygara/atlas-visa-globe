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

  // A link is "current" when the path matches exactly, or (for sections) when
  // the path lives underneath it — /guides/etias-2026-explained/ → Guides.
  function isCurrent(item, path) {
    if (item.href === "/") return path === "/" || path === "/index.html";
    return path === item.href || path.indexOf(item.href) === 0;
  }

  var api = { NAV: NAV, SUPPORT: SUPPORT, isCurrent: isCurrent };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SITE_NAV = api;
})(this);
