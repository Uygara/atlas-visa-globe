// Search Console deep dive: why do impressions not turn into clicks?
// Pulls 90 days of page, query, page+query, country and device rows and prints a compact summary:
// impressions by position band, query templates (country names folded into <C>), the pages with the most
// impressions and their CTR, and queries ranked 5-20 (the ones a better page could win).
// Usage: node tools/gsc-deep.js [--days 90]   Writes .autopilot/gsc-deep.json for later runs.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const SA = path.join(ROOT, ".secrets", "firebase-admin.json");
const SITE = encodeURIComponent("sc-domain:travelnow.info");
const DAYS = (() => { const i = process.argv.indexOf("--days"); return i > 0 ? Number(process.argv[i + 1]) || 90 : 90; })();
const day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");

async function token() {
  const sa = JSON.parse(fs.readFileSync(SA, "utf8"));
  const now = Math.floor(Date.now() / 1000);
  const u = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = crypto.createSign("RSA-SHA256").update(u).sign(sa.private_key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + u + "." + sig });
  const j = await r.json();
  if (!j.access_token) throw new Error("token failed");
  return j.access_token;
}

async function query(tok, dims, rowLimit) {
  const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${SITE}/searchAnalytics/query`, {
    method: "POST", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate: day(DAYS + 3), endDate: day(3), dimensions: dims, rowLimit }) });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 200));
  return j.rows || [];
}

// Fold country names and demonyms into <C> so "kenya passport visa free" and "malaysia passport visa free" group.
function template(q) {
  let names = [];
  try {
    const src = fs.readFileSync(path.join(ROOT, "data", "countries.js"), "utf8");
    names = [...src.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1].toLowerCase());
  } catch (e) {}
  template.names = template.names || names.sort((a, b) => b.length - a.length);
  let t = " " + q.toLowerCase() + " ";
  for (const n of template.names) if (n.length > 3 && t.includes(" " + n)) t = t.split(n).join("<C>");
  t = t.replace(/\b20\d\d\b/g, "<Y>").replace(/\b(\w+)(n|ian|ese|ish|i)\s+passport/g, (m, a) => "<C> passport");
  return t.trim().replace(/\s+/g, " ");
}

(async () => {
  const tok = await token();
  const [pages, queries, pq, countries, devices] = await Promise.all([
    query(tok, ["page"], 500), query(tok, ["query"], 5000), query(tok, ["page", "query"], 5000),
    query(tok, ["country"], 30), query(tok, ["device"], 5)]);
  fs.mkdirSync(path.join(ROOT, ".autopilot"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, ".autopilot", "gsc-deep.json"), JSON.stringify({ at: new Date().toISOString(), days: DAYS, pages, queries, pq, countries, devices }));

  const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);
  console.log(`GSC ${DAYS}d: ${sum(queries, "clicks")} clicks / ${sum(queries, "impressions")} impr in ${queries.length} queries, ${pages.length} pages`);
  const bands = [[1, 3], [3, 5], [5, 10], [10, 20], [20, 50], [50, 999]];
  console.log("by position: " + bands.map(([a, b]) => {
    const rs = queries.filter((r) => r.position >= a && r.position < b);
    return `${a}-${b}: ${sum(rs, "impressions")} impr ${sum(rs, "clicks")} cl`;
  }).join(" · "));
  const tm = {};
  for (const r of queries) { const t = template(r.keys[0]); tm[t] = tm[t] || { i: 0, c: 0, p: 0, n: 0 }; tm[t].i += r.impressions; tm[t].c += r.clicks; tm[t].p += r.position * r.impressions; tm[t].n++; }
  console.log("query templates (impr, clicks, avg pos, #queries):");
  Object.entries(tm).sort((a, b) => b[1].i - a[1].i).slice(0, 25).forEach(([t, v]) => console.log(`  ${v.i}\t${v.c}\t${(v.p / v.i).toFixed(1)}\t${v.n}\t${t}`));
  console.log("top pages (impr, clicks, pos):");
  pages.sort((a, b) => b.impressions - a.impressions).slice(0, 20).forEach((r) => console.log(`  ${r.impressions}\t${r.clicks}\t${r.position.toFixed(1)}\t${r.keys[0].replace("https://travelnow.info", "")}`));
  console.log("countries: " + countries.slice(0, 10).map((r) => `${r.keys[0]} ${r.impressions}/${r.clicks}`).join(" · "));
  console.log("devices: " + devices.map((r) => `${r.keys[0]} ${r.impressions}/${r.clicks} pos ${r.position.toFixed(1)}`).join(" · "));
})().catch((e) => { console.error("gsc-deep failed:", e.message); process.exit(1); });
