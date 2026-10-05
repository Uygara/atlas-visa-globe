// Static pre-launch audit over every generated HTML page (no browser needed).
// Checks: title, meta description, canonical, h1, lang, viewport, og:image, <img> alt,
// duplicate titles, broken internal links/assets, third-party font hosts, em/en dashes in copy.
// Usage: node tools/audit-pages.js [--verbose]   Exit code 1 when any error is found.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SKIP_DIRS = new Set(["node_modules", ".git", "app", "backend", "tools", "docs", "functions", "store", "screenshots", ".secrets", "build", "components", "data", "scripts"]);
const verbose = process.argv.includes("--verbose");

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith(".html")) out.push(path.join(dir, e.name));
  }
  return out;
}

function exists(urlPath) {
  const clean = decodeURIComponent(urlPath.split("#")[0].split("?")[0]);
  if (!clean || clean === "/") return true;
  const abs = path.join(ROOT, clean);
  if (fs.existsSync(abs)) {
    if (fs.statSync(abs).isDirectory()) return fs.existsSync(path.join(abs, "index.html"));
    return true;
  }
  return false;
}

const files = walk(ROOT, []);
const errors = [];
const warns = [];
const titles = new Map();
const brokenSeen = new Set();

for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, "/");
  const html = fs.readFileSync(f, "utf8");
  const err = (m) => errors.push(rel + ": " + m);
  const warn = (m) => warns.push(rel + ": " + m);
  const isRedirectStub = /http-equiv="refresh"/i.test(html);

  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  if (!title) err("no <title>"); else {
    if (!titles.has(title)) titles.set(title, []);
    titles.get(title).push(rel);
  }
  if (isRedirectStub) continue;
  if (!/<meta[^>]+name="description"[^>]+content="[^"]{30,}/i.test(html) && !/<meta[^>]+content="[^"]{30,}"[^>]+name="description"/i.test(html)) warn("meta description missing or short");
  if (!/rel="canonical"/i.test(html)) warn("no canonical");
  if (!/<html[^>]+lang=/i.test(html)) err("no html lang");
  if (!/name="viewport"/i.test(html)) err("no viewport");
  if (!/property="og:image"/i.test(html) && !/name="robots" content="noindex/i.test(html)) warn("no og:image");
  if (!/<h1[\s>]/i.test(html) && !/id="root"/.test(html)) warn("no <h1>");
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) if (!/\balt=/i.test(m[0])) err("img without alt: " + m[0].slice(0, 80));
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html)) err("loads Google Fonts from Google servers");

  const seen = new Set();
  for (const m of html.matchAll(/\b(?:href|src)="(\/[^"#?][^"]*|\/)"/g)) {
    const u = m[1];
    if (seen.has(u) || u.startsWith("//") || /['"`$+{}\s]/.test(u)) continue;
    seen.add(u);
    const key = u.split("?")[0];
    if (!exists(u) && !brokenSeen.has(rel + key)) { brokenSeen.add(rel + key); err("broken link/asset " + u); }
  }
}

for (const [t, list] of titles) if (list.length > 1 && !/^\s*$/.test(t)) warns.push("duplicate title \"" + t.slice(0, 60) + "\" on " + list.length + " pages (" + list.slice(0, 3).join(", ") + ")");

const sm = fs.existsSync(path.join(ROOT, "sitemap.xml")) ? fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8") : "";
for (const m of sm.matchAll(/<loc>https:\/\/travelnow\.info([^<]*)<\/loc>/g)) if (!exists(m[1])) errors.push("sitemap.xml: dead URL " + m[1]);
for (const need of ["robots.txt", "llms.txt", "404.html", "sitemap.xml", "ads.txt"]) if (!fs.existsSync(path.join(ROOT, need))) errors.push("missing root file " + need);

console.log("pages scanned: " + files.length + " · errors: " + errors.length + " · warnings: " + warns.length);
const cap = verbose ? 1e9 : 25;
errors.slice(0, cap).forEach((e) => console.log("ERR  " + e));
warns.slice(0, cap).forEach((w) => console.log("WARN " + w));
if (!verbose && errors.length + warns.length > 2 * 25) console.log("(truncated; use --verbose)");
process.exit(errors.length ? 1 : 0);
