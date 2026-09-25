// analytics-report.js: a short text report of the site's traffic, for the start of a session.
//
//   node tools/analytics-report.js            last 7 days vs the 7 before (GA4), 28 days (Search Console),
//                                             7 days (Cloudflare Web Analytics)
//   node tools/analytics-report.js --days 28  another window for GA4 and Cloudflare
//
// Credentials (never committed; .secrets/ is in .gitignore):
//   .secrets/firebase-admin.json   service account; it must be a Viewer on the GA4 property and a user on the
//                                  Search Console property (see TODO.md). One key serves both.
//   .secrets/cloudflare-token.txt  API token with "Account Analytics: Read" (optional).
// A source without access is reported as such and skipped, so the report always runs.
// Plain Node, no packages: the service-account JWT is signed with node:crypto.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const SA = path.join(ROOT, ".secrets", "firebase-admin.json");
const CF_TOKEN = path.join(ROOT, ".secrets", "cloudflare-token.txt");
const GA_PROPERTY = "540889655";
const GSC_SITE = "sc-domain:travelnow.info";
const CF_ACCOUNT = "a012b43ae2b6efe6430dbbf8a0209595";
const CF_SITE_TAG = "fb6af855fdef4b4aa222fb280e294432";
const DAYS = (() => { const i = process.argv.indexOf("--days"); return i > 0 ? Number(process.argv[i + 1]) || 7 : 7; })();

const day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const fmt = (n) => n == null ? "–" : Number(n) >= 1000 ? (Number(n) / 1000).toFixed(1) + "k" : String(Math.round(Number(n) * 10) / 10);
const pct = (a, b) => (!b ? "" : ((a - b) / b * 100 >= 0 ? " +" : " ") + Math.round((a - b) / b * 100) + "%");
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");

async function googleToken(scope) {
  const sa = JSON.parse(fs.readFileSync(SA, "utf8"));
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + unsigned + "." + sig });
  const j = await r.json();
  if (!j.access_token) throw new Error("token: " + JSON.stringify(j).slice(0, 160));
  return { token: j.access_token, email: sa.client_email };
}
async function call(url, token, body) {
  const r = await fetch(url, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!r.ok) throw new Error(r.status + " " + ((j.error && (j.error.message || j.error.status)) || JSON.stringify(j)).slice(0, 180));
  return j;
}

async function ga() {
  const { token, email } = await googleToken("https://www.googleapis.com/auth/analytics.readonly");
  const run = (body) => call(`https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY}:runReport`, token, body);
  const ranges = [{ startDate: day(DAYS), endDate: day(1), name: "now" }, { startDate: day(DAYS * 2), endDate: day(DAYS + 1), name: "before" }];
  const totals = await run({ dateRanges: ranges, metrics: ["activeUsers", "sessions", "screenPageViews", "averageSessionDuration", "engagementRate"].map((name) => ({ name })) });
  const val = (range, i) => { const row = (totals.rows || []).find((r) => (r.dimensionValues || []).some((d) => d.value === range)); return row ? Number(row.metricValues[i].value) : 0; };
  const names = ["users", "sessions", "views", "avg session (s)", "engaged %"];
  const out = [`GA4 (${DAYS} days to ${day(1)}, vs previous ${DAYS}):`];
  out.push("  " + names.map((n, i) => { const a = val("now", i), b = val("before", i); return `${n} ${i === 4 ? Math.round(a * 100) : fmt(a)}${pct(a, b)}`; }).join(" · "));
  const top = async (dim, metric, n, label) => {
    const r = await run({ dateRanges: [ranges[0]], dimensions: [{ name: dim }], metrics: [{ name: metric }], orderBys: [{ metric: { metricName: metric }, desc: true }], limit: n });
    out.push(`  ${label}: ` + (r.rows || []).map((x) => `${x.dimensionValues[0].value} ${fmt(x.metricValues[0].value)}`).join(" · "));
  };
  await top("pagePath", "screenPageViews", 10, "top pages");
  await top("country", "activeUsers", 8, "countries");
  await top("sessionSourceMedium", "sessions", 6, "sources");
  await top("deviceCategory", "activeUsers", 3, "devices");
  await top("language", "activeUsers", 6, "languages");
  return out;
}

async function gsc() {
  const { token } = await googleToken("https://www.googleapis.com/auth/webmasters.readonly");
  const site = encodeURIComponent(GSC_SITE);
  const q = (dims, n) => call(`https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`, token, { startDate: day(30), endDate: day(3), dimensions: dims, rowLimit: n });
  const all = await q([], 1);
  const t = (all.rows || [])[0] || {};
  const out = [`Search Console (${day(30)} to ${day(3)}; data lags ~3 days):`,
    `  clicks ${fmt(t.clicks || 0)} · impressions ${fmt(t.impressions || 0)} · CTR ${((t.ctr || 0) * 100).toFixed(1)}% · avg position ${t.position ? t.position.toFixed(1) : "–"}`];
  const qs = await q(["query"], 10);
  out.push("  queries: " + ((qs.rows || []).map((r) => `"${r.keys[0]}" ${r.clicks}/${r.impressions}`).join(" · ") || "none yet"));
  const ps = await q(["page"], 8);
  out.push("  pages: " + ((ps.rows || []).map((r) => `${r.keys[0].replace("https://travelnow.info", "")} ${r.clicks}/${r.impressions}`).join(" · ") || "none yet"));
  const sm = await call(`https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/sitemaps`, token);
  out.push("  sitemaps: " + ((sm.sitemap || []).map((s) => `${s.path.replace("https://travelnow.info", "")} read ${String(s.lastDownloaded || "never").slice(0, 10)}${s.errors > 0 ? " errors " + s.errors : ""}${s.warnings > 0 ? " warnings " + s.warnings : ""}`).join(" · ") || "none submitted"));
  return out;
}

async function cloudflare() {
  if (!fs.existsSync(CF_TOKEN)) return ["Cloudflare Web Analytics: no token (.secrets/cloudflare-token.txt), skipped"];
  const token = fs.readFileSync(CF_TOKEN, "utf8").trim();
  const since = new Date(Date.now() - DAYS * 864e5).toISOString();
  const query = `query($a:String!,$f:AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!){viewer{accounts(filter:{accountTag:$a}){
    total:rumPageloadEventsAdaptiveGroups(filter:$f,limit:1){count sum{visits}}
    paths:rumPageloadEventsAdaptiveGroups(filter:$f,limit:8,orderBy:[count_DESC]){count dimensions{requestPath}}
    countries:rumPageloadEventsAdaptiveGroups(filter:$f,limit:6,orderBy:[count_DESC]){count dimensions{countryName}}
    refs:rumPageloadEventsAdaptiveGroups(filter:$f,limit:6,orderBy:[count_DESC]){count dimensions{refererHost}}}}}`;
  const r = await fetch("https://api.cloudflare.com/client/v4/graphql", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { a: CF_ACCOUNT, f: { siteTag: CF_SITE_TAG, datetime_geq: since, bot: 0 } } }) });
  const j = await r.json();
  if (j.errors && j.errors.length) throw new Error(j.errors[0].message);
  const a = j.data.viewer.accounts[0];
  const tot = a.total[0] || { count: 0, sum: { visits: 0 } };
  const list = (rows, key) => rows.map((x) => `${x.dimensions[key] || "(direct)"} ${fmt(x.count)}`).join(" · ");
  return [`Cloudflare Web Analytics (${DAYS} days, bots excluded):`, `  visits ${fmt(tot.sum.visits)} · page views ${fmt(tot.count)}`,
    "  paths: " + list(a.paths, "requestPath"), "  countries: " + list(a.countries, "countryName"), "  referrers: " + list(a.refs, "refererHost")];
}

(async () => {
  for (const [name, fn] of [["GA4", ga], ["Search Console", gsc], ["Cloudflare", cloudflare]]) {
    try { console.log((await fn()).join("\n")); }
    catch (e) {
      const hint = /403|permission|PERMISSION_DENIED|User does not have/i.test(e.message)
        ? ` (give ${JSON.parse(fs.readFileSync(SA, "utf8")).client_email} read access, see TODO.md)` : "";
      console.log(`${name}: unavailable: ${e.message.slice(0, 140)}${hint}`);
    }
    console.log("");
  }
})();
