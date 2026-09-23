// build-www.js — assemble app/www, the web content the iOS/Android app ships.
//
//   node build-www.js
//
// The app is the site's own single-page tools (visa map, transit map, safety map,
// travel planner, schengen calculator, account) running from the device, so they
// work offline. This copies them from the repo root and makes them app-safe:
//
//   • CDN libraries (React, D3, topojson, world topology), Google Fonts and the
//     flag-emoji font are downloaded once (app/.cache) and served from /vendor.
//   • AdSense, GA and Matomo are removed — the app uses AdMob and no web tracker.
//   • The Turkish-twin redirect is removed (ATLAS_APP makes site-nav.js keep every
//     language in place) and every link to a bundled directory page is rewritten
//     from "/itinerary/" to "/itinerary/index.html": Capacitor's local server
//     answers any extension-less path with the root index.html.
//   • Links to pages that are NOT bundled (guides, passport pages, privacy …) are
//     turned into https://travelnow.info/… by assets/app-native.js at click time.
//   • assets/app-native.js + assets/app.css are injected into every page.
//
// Needs network on the first run (vendor downloads); later runs use app/.cache.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const WWW = path.join(__dirname, "www");
const CACHE = path.join(__dirname, ".cache");

// Directory pages that ship in the app (each is <dir>/index.html). "" = root.
const PAGES = ["", "itinerary", "transit-map", "safety-map", "account", "schengen-calculator"];
// Directories copied whole. assets/og (social cards, 25 MB) has no use in the app.
const COPY_DIRS = ["assets", "build", "data"];
const SKIP = [/^assets[\\/]og([\\/]|$)/, /(^|[\\/])\.DS_Store$/];

const LIBS = [
  ["d3.min.js", "https://unpkg.com/d3@7.8.5/dist/d3.min.js"],
  ["topojson-client.min.js", "https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js"],
  ["react.production.min.js", "https://unpkg.com/react@18.3.1/umd/react.production.min.js"],
  ["react-dom.production.min.js", "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"],
  ["countries-110m.json", "https://unpkg.com/world-atlas@2.0.2/countries-110m.json"],
  ["TwemojiCountryFlags.woff2", "https://cdn.jsdelivr.net/npm/country-flag-emoji-polyfill@0.1.8/dist/TwemojiCountryFlags.woff2"],
];
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function get(url, ua) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": ua || "travelnow-app-build" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return resolve(get(new URL(res.headers.location, url).href, ua));
      if (res.statusCode !== 200) return reject(new Error(res.statusCode + " " + url));
      const chunks = []; res.on("data", (c) => chunks.push(c)); res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}
async function cached(name, url, ua) {
  const f = path.join(CACHE, name);
  if (fs.existsSync(f)) return fs.readFileSync(f);
  const b = await get(url, ua);
  fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(f, b);
  return b;
}

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function copyDir(src, dst, rel) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (SKIP.some((re) => re.test(r))) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d, r); else fs.copyFileSync(s, d);
  }
}
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// "/itinerary/" → "/itinerary/index.html" wherever it is a quoted URL.
const DIRS = PAGES.filter(Boolean).join("|");
const DIR_LINK = new RegExp("([\"'`(=])/(" + DIRS + ")/(?=[?#\"'`)\\s>])", "g");
function rewriteText(s) {
  return s
    .replace(DIR_LINK, "$1/$2/index.html")
    .replace(/https:\/\/unpkg\.com\/world-atlas@2\.0\.2\/countries-110m\.json/g, "/vendor/countries-110m.json")
    .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/country-flag-emoji-polyfill@0\.1\.8\/dist\/TwemojiCountryFlags\.woff2/g, "/vendor/TwemojiCountryFlags.woff2");
}

function transformHtml(html, fontLink) {
  let h = html;
  // Libraries → local copies (drop the SRI hash: the file is ours now).
  for (const [name, url] of LIBS.slice(0, 4)) {
    h = h.replace(new RegExp('<script src="' + url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"[^>]*></script>', "g"), '<script src="/vendor/' + name + '"></script>');
  }
  // AdSense (multi-line async tag) and web analytics: not in the app.
  h = h.replace(/<script[^>]*pagead2\.googlesyndication\.com[^>]*>\s*<\/script>/g, "");
  h = h.replace(/<script[^>]*src="\/?assets\/analytics\.js"[^>]*><\/script>/g, "");
  // Turkish-twin redirect and canonical/hreflang: meaningless inside the app.
  h = h.replace(/<script>try\{if\(localStorage\.getItem\("atlas\.lang"\)==="tr"\)location\.replace\([^<]*<\/script>/g, "");
  h = h.replace(/<link rel="(canonical|alternate)"[^>]*>\s*/g, "");
  // Fonts: Google → the vendored stylesheet.
  h = h.replace(/<link rel="preconnect"[^>]*>\s*/g, "");
  h = h.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*"[^>]*>/g, fontLink);
  // Safe areas need viewport-fit=cover; the app sets its own zoom rules.
  h = h.replace(/<meta name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />');
  // App flag first in <head>, native bridge + tab bar last in <body>.
  h = h.replace(/<head>/, '<head>\n<script>window.ATLAS_APP=true;document.documentElement.classList.add("in-app");</script>');
  h = h.replace(/<\/head>/, '<link rel="stylesheet" href="/assets/app.css" />\n</head>');
  h = h.replace(/<\/body>/, '<script src="/assets/app-config.js"></script>\n<script src="/assets/app-native.js"></script>\n</body>');
  return rewriteText(h);
}

// Google Fonts CSS → local woff2 files + one stylesheet (identical blocks merged).
async function vendorFonts(htmlSources) {
  const urls = new Set();
  for (const h of htmlSources) for (const m of h.matchAll(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/g)) urls.add(m[0].replace(/&amp;/g, "&"));
  const blocks = new Set();
  const outDir = path.join(WWW, "vendor", "fonts");
  fs.mkdirSync(outDir, { recursive: true });
  for (const u of urls) {
    const css = (await cached("gf-" + crypto.createHash("md5").update(u).digest("hex") + ".css", u, CHROME_UA)).toString("utf8");
    for (let block of css.match(/@font-face\s*\{[^}]*\}/g) || []) {
      const m = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(block);
      if (m) {
        const name = crypto.createHash("md5").update(m[1]).digest("hex").slice(0, 12) + ".woff2";
        fs.writeFileSync(path.join(outDir, name), await cached("font-" + name, m[1], CHROME_UA));
        block = block.replace(m[1], "/vendor/fonts/" + name);
      }
      blocks.add(block);
    }
  }
  fs.writeFileSync(path.join(WWW, "vendor", "fonts.css"), [...blocks].join("\n") + "\n");
  return '<link rel="stylesheet" href="/vendor/fonts.css" />';
}

(async () => {
  rmrf(WWW);
  fs.mkdirSync(path.join(WWW, "vendor"), { recursive: true });

  for (const d of COPY_DIRS) copyDir(path.join(ROOT, d), path.join(WWW, d), d);
  for (const [name, url] of LIBS) fs.writeFileSync(path.join(WWW, "vendor", name), await cached(name, url));

  const pageFiles = PAGES.map((p) => [path.join(ROOT, p, "index.html"), path.join(WWW, p, "index.html")]);
  const sources = pageFiles.map(([src]) => fs.readFileSync(src, "utf8"));
  const fontLink = await vendorFonts(sources);
  pageFiles.forEach(([, dst], i) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, transformHtml(sources[i], fontLink)); });

  // JS/CSS under www: rewrite bundled-page links and CDN URLs.
  let rewritten = 0;
  for (const f of walk(WWW, [])) {
    if (!/\.(js|css)$/.test(f) || f.includes(path.join("www", "vendor"))) continue;
    const before = fs.readFileSync(f, "utf8"), after = rewriteText(before);
    if (after !== before) { fs.writeFileSync(f, after); rewritten++; }
  }

  // The generated native projects read this to know which paths are local.
  fs.writeFileSync(path.join(WWW, "bundled-pages.json"), JSON.stringify(PAGES.filter(Boolean).map((p) => "/" + p + "/").concat("/")));
  const size = walk(WWW, []).reduce((n, f) => n + fs.statSync(f).size, 0);
  console.log(`app/www ready: ${PAGES.length} pages, ${rewritten} files rewritten, ${(size / 1048576).toFixed(1)} MB`);
})().catch((e) => { console.error(e); process.exit(1); });
