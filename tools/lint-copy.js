// lint-copy.js: finds AI-sounding punctuation and phrases in user-visible text.
//
//   node tools/lint-copy.js            summary per file
//   node tools/lint-copy.js --list     every hit with its line
//   node tools/lint-copy.js path ...   only these files
//
// Scans the strings people read: static pages (text outside tags), the SPA and
// static dictionaries, Turkish strings, page generators. Code and HTML comments are
// skipped (a `//` counts as a comment only after whitespace or punctuation, so URLs
// in strings stay scanned). Exit code 1 when
// something is found, so it can gate a commit or a CI step later.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const LIST = process.argv.includes("--list");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const RULES = [
  ["em dash", /—/g],
  ["en dash as punctuation", /\s–\s/g],
  ["banned phrase", /\b(seamless(ly)?|robust|leverag(e|ing)|delve|unlock(s|ing)? the|empower|elevate your|game[- ]changer|in today's world|whether you're|it's worth noting|rest assured|navigate the complexities|comprehensive guide)\b/gi],
];
const SKIP_DIRS = new Set(["node_modules", ".git", "app", "build", "backend", "tools", ".secrets", ".agents", ".claude", "passport", "store"]);

function files() {
  if (only.length) return only.map((f) => path.resolve(f));
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !(dir === ROOT && e.name === "tr")) walk(path.join(dir, e.name)); continue; }
      if (/\.html$/.test(e.name)) out.push(path.join(dir, e.name));
    }
  };
  walk(ROOT);
  for (const f of ["data/i18n.js", "data/static-i18n.js", "data/visa-fees-i18n.js", "scripts/partials.js", "scripts/generate-seo.js", "scripts/tr-meta.js", "scripts/tr-home-fallback.js"]) out.push(path.join(ROOT, f));
  for (const f of fs.readdirSync(path.join(ROOT, "scripts", "tr-strings"))) out.push(path.join(ROOT, "scripts", "tr-strings", f));
  for (const f of fs.readdirSync(path.join(ROOT, "components"))) out.push(path.join(ROOT, "components", f));
  out.push(path.join(ROOT, "app.jsx"));
  for (const f of ["assets/account-page.js", "assets/alerts-page.js", "assets/push-text.js", "assets/app-native.js"]) out.push(path.join(ROOT, f));
  return out.filter((f) => fs.existsSync(f));
}

let total = 0;
const rows = [];
for (const f of files()) {
  const rel = path.relative(ROOT, f).replace(/\\/g, "/");
  const html = /\.html$/.test(f);
  // Blank out comments (keeping line breaks so line numbers stay right).
  const blank = (m) => m.replace(/[^\n]/g, " ");
  let src = fs.readFileSync(f, "utf8").replace(html ? /<!--[\s\S]*?-->/g : /\/\*[\s\S]*?\*\//g, blank);
  if (!html) src = src.replace(/(^|[\s;,({])\/\/[^\n]*/gm, (m, pre) => pre + blank(m.slice(pre.length)));
  const lines = src.split(/\r?\n/);
  let n = 0;
  lines.forEach((line, i) => {
    const t = line.trim();
    if (/^(\/\/|\*|\/\*)/.test(t)) return;                       // comment lines
    const text = html ? line.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ") : line;
    for (const [name, re] of RULES) {
      const m = text.match(re);
      if (!m) continue;
      n += m.length;
      if (LIST) rows.push(`${rel}:${i + 1}  [${name}]  ${t.slice(0, 140)}`);
    }
  });
  if (n) { total += n; if (!LIST) rows.push(String(n).padStart(5) + "  " + rel); }
}
console.log(rows.sort((a, b) => LIST ? a.localeCompare(b) : parseInt(b) - parseInt(a)).join("\n"));
console.log(`\n${total} hit(s)`);
process.exit(total ? 1 : 0);
