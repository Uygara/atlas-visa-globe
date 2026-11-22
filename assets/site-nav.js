// Site navigation — the ONE list every header reads.
//   • Browser: exposes window.SITE_NAV (SPA masthead in components/chrome.jsx,
//     static-page masthead in assets/site-chrome.js).
//   • Node: module.exports (scripts/partials.js stamps it into static HTML so
//     crawlers see real links without running JS).
// The top bar shows PRIMARY links, then each group marked `top` as its own dropdown (Maps), then the
// "All tools" button for the remaining GROUPS. Original note: everything else sits in GROUPS, behind the "All tools"
// button (a panel with three groups, each link with a one-line description).
// NAV is the same links as one flat list (PRIMARY first, then every group item);
// `g` is the group index, kept for code that reads the flat list.
(function (root) {
  var PRIMARY = [
    { href: "/",            key: "nav.visa_map",  en: "Visa map", bar: false },   // in the tab bar and phone sheet; on desktop it lives under Maps
    { href: "/visa/",       key: "nav.countries", en: "Countries" },
    { href: "/itinerary/",  key: "nav.itinerary", en: "Travel planner" },
    { href: "/panel/",      key: "nav.panel",     en: "My panel" }
  ];
  var GROUPS = [
    { key: "nav.grp_maps", en: "Maps", top: true, items: [
      { href: "/",             key: "nav.visa_map",    en: "Visa map",     dkey: "nav.d_visa",    den: "Where your passport goes without a visa" },
      { href: "/transit-map/", key: "nav.transit_map", en: "Transit map",  dkey: "nav.d_transit", den: "Is a visa needed to change planes" },
      { href: "/safety-map/",  key: "nav.safety_map",  en: "Safety map",   dkey: "nav.d_safety",  den: "Official travel advisories" }
    ] },
    { key: "nav.grp_calc", en: "Calculators", items: [
      { href: "/schengen-calculator/", key: "nav.schengen90",  en: "Schengen 90/180",   dkey: "nav.d_schengen", den: "How many days are left" },
      { href: "/passport-validity/",   key: "nav.validity",    en: "Passport validity", dkey: "nav.d_validity", den: "The 3-month and 6-month rules" },
      { href: "/etias/",               key: "nav.etias",       en: "ETIAS 2026",        dkey: "nav.d_etias",    den: "European travel authorization" }
    ] },
    { key: "nav.grp_read", en: "Read and explore", items: [
      { href: "/passport/",                  key: "nav.passports", en: "Passports" },
      { href: "/guides/",                    key: "nav.guides",    en: "Guides" },
      { href: "/digital-nomad-visa/",        key: "nav.nomad",     en: "Digital nomad visas" },
      { href: "/citizenship-by-investment/", key: "nav.cbi",       en: "Citizenship by investment" },
      { href: "/alerts/",                    key: "nav.alerts",    en: "Alerts" },
      { href: "/about/",                     key: "nav.about",     en: "About" }
    ] }
  ];
  var NAV = PRIMARY.map(function (it) { var c = {}; for (var k in it) c[k] = it[k]; c.g = 0; return c; });
  GROUPS.forEach(function (grp, gi) {
    grp.items.forEach(function (it) { if (it.href === "/") return; var c = {}; for (var k in it) c[k] = it[k]; c.g = gi + 1; NAV.push(c); });
  });
  var SUPPORT = { href: "https://buymeacoffee.com/travelnowinfo", key: "nav.support", en: "Support" };
  // The site's Instagram profile: in the footer and at the bottom of the phone menu sheet.
  var INSTAGRAM = { href: "https://www.instagram.com/travelnow.info/", key: "nav.instagram", en: "travelnow.info on Instagram" };

  // Pages that have a Turkish twin at /tr/<path> (scripts/build-tr.js writes the
  // hand-written ones, scripts/generate-seo.js the passport pages). English stays
  // at the root; both carry <link rel="alternate" hreflang> to each other. The
  // other interface languages (es, de, fr, ar) translate the English page in place.
  var TR_PAGES = [
    "/", "/about/", "/alerts/", "/panel/", "/citizenship-by-investment/", "/contact/",
    "/digital-nomad-visa/", "/esta-rules/", "/etias/", "/guides/", "/privacy/",
    "/guides/etias-2026-explained/", "/guides/how-we-count/", "/guides/passport-validity-six-month-rule/",
    "/guides/schengen-90-180-rule/", "/guides/transit-visa-guide/",
    "/guides/visa-types-explained/", "/passport-validity/",
    "/schengen-calculator/", "/visa-checklist/tr-schengen/",
    "/visa-shortcuts/", "/passport/", "/visa/", "/reports/", "/open-data/"
  ];
  function isTrPath(p) { return /^\/tr(\/|$)/.test(p); }
  function fromTr(p) { return isTrPath(p) ? (p.replace(/^\/tr(?=\/)/, "") || "/") : p; }
  // English path → its Turkish twin (every /passport/<iso>/ and /visa/<iso>/ has one too).
  function hasTr(p) {
    // The iOS/Android app (app/) ships the English pages only and translates in place.
    if (typeof window !== "undefined" && window.ATLAS_APP) return false;
    return TR_PAGES.indexOf(p) !== -1 || /^\/(passport|visa)\/[a-z]{2}\/$/.test(p) || /^\/reports\/\d{4}-\d{2}\/$/.test(p);
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
    NAV: NAV, PRIMARY: PRIMARY, GROUPS: GROUPS, SUPPORT: SUPPORT, INSTAGRAM: INSTAGRAM, isCurrent: isCurrent,
    TR_PAGES: TR_PAGES, hasTr: hasTr, toTr: toTr, fromTr: fromTr, isTrPath: isTrPath, localHref: localHref
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SITE_NAV = api;
})(this);
