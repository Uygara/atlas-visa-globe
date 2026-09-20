// Locale helpers for the statically generated pages.
//
// English lives at the root (/passport/tr/), Turkish at /tr/ (/tr/passport/tr/).
// Each page that has a twin carries <link rel="alternate" hreflang> to both, so
// search engines index the Turkish text (client-side translation is invisible
// to crawlers) and route Turkish searchers to it. The other four interface
// languages (es, de, fr, ar) stay client-side translations of the English page.
//
// Turkish UI strings for the shared masthead/footer are NOT duplicated here:
// they are read from data/static-i18n.js, the dictionary the site already uses,
// so a wording fix there reaches the generated pages too.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE_URL = process.env.SITE_URL || "https://travelnow.info";

// Which pages have a Turkish twin lives in assets/site-nav.js, shared with the
// browser (SPA masthead, language switch). SPA tools other than the visa map
// (transit, safety, planner) translate on the client and have no twin.
const { TR_PAGES, hasTr, toTr, fromTr, isTrPath } = require("../assets/site-nav.js");

// <link rel="alternate"> block for a page (en path given, e.g. "/passport/tr/").
function hreflang(enPath) {
  if (!hasTr(enPath)) return "";
  const en = SITE_URL + enPath, tr = SITE_URL + toTr(enPath);
  return [
    `<link rel="alternate" hreflang="en" href="${en}">`,
    `<link rel="alternate" hreflang="tr" href="${tr}">`,
    `<link rel="alternate" hreflang="x-default" href="${en}">`,
  ].join("\n");
}

// ── Turkish strings from the site's own dictionary ──────────────────────────
let _tr = null;
function trDictionary() {
  if (_tr) return _tr;
  const src = fs.readFileSync(path.join(ROOT, "data", "static-i18n.js"), "utf8");
  const dict = {};
  // Entries look like:  "Visa map": { tr:"Vize haritası", es:"…", … },
  // (some span lines: key on one line, value object on the next).
  const re = /^\s*"((?:[^"\\]|\\.)+)":\s*\{\s*tr:\s*"((?:[^"\\]|\\.)*)"/gm;
  let m;
  const unesc = (s) => s.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
  while ((m = re.exec(src))) dict[unesc(m[1]).replace(/\s+/g, " ").trim()] = unesc(m[2]);
  _tr = dict;
  return dict;
}

// t(lang)("English string") → Turkish when known, else the English string.
function makeT(lang) {
  if (lang !== "tr") return (s) => s;
  const dict = trDictionary();
  return (s) => dict[String(s).replace(/\s+/g, " ").trim()] || s;
}

module.exports = { SITE_URL, TR_PAGES, hasTr, toTr, fromTr, isTrPath, hreflang, makeT };
