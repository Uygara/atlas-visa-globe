// IndexNow: tell Bing (and Yandex, Seznam, Naver) which pages changed, so they recrawl within hours instead of weeks.
// Bing's index feeds ChatGPT search, Copilot and DuckDuckGo, so this is the cheapest route into AI answers.
// Reads sitemap.xml and submits every URL whose <lastmod> is within the last N days (default 2).
// The key file at the site root (<key>.txt) proves we own the host.
// Usage: node scripts/indexnow.js [--days 2] [--all] [--dry]
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HOST = "travelnow.info";
const KEY = "28d94706c69da0a490017c3724f6b549";
const arg = (name) => process.argv.includes(name);
const DAYS = (() => { const i = process.argv.indexOf("--days"); return i > 0 ? Number(process.argv[i + 1]) || 2 : 2; })();

function changedUrls() {
  const xml = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  const since = new Date(Date.now() - DAYS * 864e5).toISOString().slice(0, 10);
  const out = [];
  for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)) {
    if (arg("--all") || m[2] >= since) out.push(m[1]);
  }
  return out;
}

async function main() {
  if (!fs.existsSync(path.join(ROOT, `${KEY}.txt`))) throw new Error(`key file ${KEY}.txt missing at the repo root`);
  const urls = changedUrls();
  console.log(`indexnow: ${urls.length} URL(s) ${arg("--all") ? "(all)" : `changed in the last ${DAYS} day(s)`}`);
  if (!urls.length || arg("--dry")) return;
  for (let i = 0; i < urls.length; i += 10000) {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(i, i + 10000) }),
    });
    // 200 = accepted, 202 = accepted, key check pending. Anything else is logged, never fatal.
    console.log(`indexnow: HTTP ${r.status} ${r.status >= 300 ? (await r.text()).slice(0, 200) : ""}`.trim());
  }
}

main().catch((e) => { console.log("indexnow: failed, " + e.message); });
