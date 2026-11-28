// usage-report.js: how many people use accounts and alerts. Counts only; no email address,
// phone number or user id is ever printed.
//
//   node tools/usage-report.js            accounts, alert watch lists, notification devices
//   node tools/usage-report.js --json     the same as one JSON line
//   node tools/usage-report.js --since 2026-11-27T06:00:00Z
//                                         only what was created after that moment, as one JSON line
//                                         (.github/workflows/signups.yml turns it into a GitHub notification)
//
// Credentials: .secrets/firebase-admin.json (the service account tools/analytics-report.js uses),
// or the FIREBASE_SERVICE_ACCOUNT env var holding the same JSON (GitHub Actions).
// Plain Node, no packages: the service-account JWT is signed with node:crypto.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const SA_FILE = path.join(ROOT, ".secrets", "firebase-admin.json");
const PROJECT = "travelnow-a0cf3";
const AS_JSON = process.argv.includes("--json");
const SINCE = (() => { const i = process.argv.indexOf("--since"); return i > 0 ? Date.parse(process.argv[i + 1]) : NaN; })();
const DAY = 864e5;
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");

function serviceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  return JSON.parse(fs.readFileSync(SA_FILE, "utf8"));
}

async function token(sa) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + unsigned + "." + sig });
  const j = await r.json();
  if (!j.access_token) throw new Error("token: " + JSON.stringify(j).slice(0, 160));
  return j.access_token;
}

async function api(tok, url, body) {
  const r = await fetch(url, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!r.ok) throw new Error(url.split("?")[0].split("/").slice(-2).join("/") + " " + r.status + ": " + JSON.stringify(j).slice(0, 160));
  return j;
}

// Firebase Authentication: every account with its creation and last sign-in time.
async function accounts(tok) {
  const out = [];
  let next = "";
  do {
    const j = await api(tok, `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:batchGet?maxResults=500` + (next ? "&nextPageToken=" + encodeURIComponent(next) : ""));
    for (const u of j.users || []) {
      out.push({ created: Number(u.createdAt) || 0, last: Number(u.lastLoginAt) || 0,
        providers: (u.providerUserInfo || []).map((p) => p.providerId).concat(u.phoneNumber && !(u.providerUserInfo || []).length ? ["phone"] : []) });
    }
    next = j.nextPageToken || "";
  } while (next);
  return out;
}

// Firestore users/{uid}: the synced settings. A non-empty atlas.watchlist is an alert watch list.
async function userDocs(tok) {
  const out = [];
  let next = "";
  do {
    const j = await api(tok, `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users?pageSize=300` + (next ? "&pageToken=" + encodeURIComponent(next) : ""));
    for (const d of j.documents || []) {
      const data = ((d.fields || {}).data || {}).mapValue || {};
      const f = data.fields || {};
      const raw = (k) => { const e = ((f[k] || {}).mapValue || {}).fields || {}; return e.v && e.v.stringValue != null ? e.v.stringValue : null; };
      let watch = [];
      try { const a = JSON.parse(raw("atlas.watchlist") || "[]"); if (Array.isArray(a)) watch = a; } catch (_) {}
      out.push({ passport: raw("atlas.passport") || "", watch: watch.length, created: Date.parse(d.createTime) || 0, updated: Date.parse(d.updateTime) || 0 });
    }
    next = j.nextPageToken || "";
  } while (next);
  return out;
}

// Firestore users/{uid}/devices/{token}: phones and browsers that accepted notifications.
async function devices(tok) {
  const rows = await api(tok, `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`,
    { structuredQuery: { from: [{ collectionId: "devices", allDescendants: true }] } });
  return rows.filter((r) => r.document).map((r) => {
    const f = r.document.fields || {};
    return { platform: (f.platform || {}).stringValue || "?", created: Date.parse(r.document.createTime) || 0, updated: Date.parse(r.document.updateTime) || 0 };
  });
}

// Firestore waitlist/{sha256}: the Schengen appointment-alert waiting list (/appointment-alert/).
// Only the answers are read here; the address field is never requested (mask). Agency pilot
// requests (product "agency") also carry the agency name and website, which are business details.
async function waitlist(tok) {
  const out = [];
  let next = "";
  const mask = ["price", "country", "city", "lang", "src", "product", "passport", "org", "site"].map((k) => "mask.fieldPaths=" + k).join("&");
  do {
    const j = await api(tok, `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/waitlist?pageSize=300&${mask}` + (next ? "&pageToken=" + encodeURIComponent(next) : ""));
    for (const d of j.documents || []) {
      const f = d.fields || {};
      const v = (k) => (f[k] || {}).stringValue || "?";
      out.push({ product: (f.product || {}).stringValue || "appt", passport: v("passport"), price: v("price"), country: v("country"), city: v("city"), lang: v("lang"), src: v("src"), org: v("org"), site: v("site"), created: Date.parse(d.createTime) || 0 });
    }
    next = j.nextPageToken || "";
  } while (next);
  return out;
}
const tally = (list, key) => list.reduce((m, x) => { m[x[key]] = (m[x[key]] || 0) + 1; return m; }, {});

function since(list, key, days) { const t = Date.now() - days * DAY; return list.filter((x) => x[key] >= t).length; }
function weekly(list, key, weeks) {
  const res = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const end = Date.now() - w * 7 * DAY, start = end - 7 * DAY;
    res.push(list.filter((x) => x[key] >= start && x[key] < end).length);
  }
  return res;
}

(async () => {
  const sa = serviceAccount();
  const tok = await token(sa);
  const result = {};
  const part = async (name, fn) => { try { result[name] = await fn(); } catch (e) { result[name] = { error: e.message }; } };
  await part("accounts", () => accounts(tok));
  await part("users", () => userDocs(tok));
  await part("devices", () => devices(tok));
  await part("waitlist", () => waitlist(tok));

  const A = Array.isArray(result.accounts) ? result.accounts : null;
  const U = Array.isArray(result.users) ? result.users : null;
  const D = Array.isArray(result.devices) ? result.devices : null;
  const W = Array.isArray(result.waitlist) ? result.waitlist : null;
  if (!Number.isNaN(SINCE)) {
    const fresh = (list, key) => list.filter((x) => x[key] > SINCE);
    const out = { since: new Date(SINCE).toISOString(), at: new Date().toISOString() };
    if (A) { const n = fresh(A, "created"); out.accounts = n.length; out.accountTotal = A.length;
      out.providers = n.reduce((m, a) => { for (const p of a.providers) m[p] = (m[p] || 0) + 1; return m; }, {}); } else out.accountsError = result.accounts.error;
    if (U) { out.watchlists = fresh(U, "created").filter((u) => u.watch > 0).length; out.watchlistTotal = U.filter((u) => u.watch > 0).length; } else out.usersError = result.users.error;
    if (D) { out.devices = fresh(D, "created").length; out.deviceTotal = D.length; } else out.devicesError = result.devices.error;
    if (W) {
      const A = W.filter((w) => w.product === "appt"), T = W.filter((w) => w.product === "pass");
      out.waitlist = fresh(A, "created").length; out.waitlistTotal = A.length;
      out.pass = fresh(T, "created").length; out.passTotal = T.length;
      const G = W.filter((w) => w.product === "agency");
      out.agency = fresh(G, "created").length; out.agencyTotal = G.length;
    } else out.waitlistError = result.waitlist.error;
    console.log(JSON.stringify(out));
    return;
  }
  const summary = {
    at: new Date().toISOString(),
    accounts: A ? { total: A.length, new1d: since(A, "created", 1), new7d: since(A, "created", 7), new30d: since(A, "created", 30),
      active30d: since(A, "last", 30), weeklyNew8: weekly(A, "created", 8),
      providers: A.reduce((m, a) => { for (const p of a.providers) m[p] = (m[p] || 0) + 1; return m; }, {}) } : result.accounts,
    alerts: U ? { syncedProfiles: U.length, withWatchlist: U.filter((u) => u.watch > 0).length,
      watchedCountries: U.reduce((s, u) => s + u.watch, 0),
      passports: U.filter((u) => u.watch > 0).reduce((m, u) => { const p = u.passport || "?"; m[p] = (m[p] || 0) + 1; return m; }, {}) } : result.users,
    devices: D ? { total: D.length, new1d: since(D, "created", 1), new7d: since(D, "created", 7), new30d: since(D, "created", 30),
      byPlatform: D.reduce((m, d) => { m[d.platform] = (m[d.platform] || 0) + 1; return m; }, {}) } : result.devices,
    waitlist: W ? (() => { const A = W.filter((w) => w.product === "appt"); return { total: A.length, new7d: since(A, "created", 7), new30d: since(A, "created", 30),
      paying: A.filter((w) => w.price !== "0").length, byPrice: tally(A, "price"), byCountry: tally(A, "country"),
      byCity: tally(A, "city"), bySource: tally(A, "src") }; })() : result.waitlist,
    travelPass: W ? (() => { const T = W.filter((w) => w.product === "pass"); return { total: T.length, new7d: since(T, "created", 7), new30d: since(T, "created", 30),
      paying: T.filter((w) => w.price !== "0").length, byPrice: tally(T, "price"), byLang: tally(T, "lang"),
      byPassport: tally(T, "passport"), bySource: tally(T, "src") }; })() : result.waitlist,
    agency: W ? (() => { const G = W.filter((w) => w.product === "agency"); return { total: G.length, new7d: since(G, "created", 7),
      byPrice: tally(G, "price"), list: G.sort((a, b) => b.created - a.created).slice(0, 20).map((g) => ({ org: g.org, site: g.site, country: g.country, price: g.price, lang: g.lang, created: new Date(g.created).toISOString().slice(0, 10) })) }; })() : result.waitlist,
  };
  if (AS_JSON) { console.log(JSON.stringify(summary)); return; }
  const a = summary.accounts, al = summary.alerts, d = summary.devices;
  console.log("Accounts: " + (a.error ? "error " + a.error : `${a.total} total · new 1d ${a.new1d} · 7d ${a.new7d} · 30d ${a.new30d} · signed in last 30d ${a.active30d}`));
  if (!a.error) console.log("  new per week (oldest→newest, 8 wk): " + a.weeklyNew8.join(" ") + " · providers " + JSON.stringify(a.providers));
  console.log("Alerts: " + (al.error ? "error " + al.error : `${al.withWatchlist} of ${al.syncedProfiles} synced profiles have a watch list (${al.watchedCountries} countries) · passports ${JSON.stringify(al.passports)}`));
  console.log("Notification devices: " + (d.error ? "error " + d.error : `${d.total} total · new 1d ${d.new1d} · 7d ${d.new7d} · 30d ${d.new30d} · ${JSON.stringify(d.byPlatform)}`));
  const w = summary.waitlist;
  console.log("Appointment-alert waiting list: " + (w.error ? "error " + w.error : `${w.total} total · new 7d ${w.new7d} · 30d ${w.new30d} · would pay ${w.paying} · price ${JSON.stringify(w.byPrice)}`));
  const tp = summary.travelPass;
  console.log("Travel Pass waiting list: " + (tp.error ? "error " + tp.error : `${tp.total} total · new 7d ${tp.new7d} · 30d ${tp.new30d} · would pay ${tp.paying} · option ${JSON.stringify(tp.byPrice)}`));
  if (!tp.error && tp.total) console.log("  lang " + JSON.stringify(tp.byLang) + " · passport " + JSON.stringify(tp.byPassport) + " · source " + JSON.stringify(tp.bySource));
  const ag = summary.agency;
  console.log("Agency pilot requests: " + (ag.error ? "error " + ag.error : `${ag.total} total · new 7d ${ag.new7d} · plan ${JSON.stringify(ag.byPrice)} (reply within 2 working days; email in Firebase console → waitlist)`));
  if (!ag.error) for (const g of ag.list) console.log(`  ${g.created} ${g.org} · ${g.site} · ${g.country} · ${g.price} · ${g.lang}`);
  if (!w.error && w.total) console.log("  country " + JSON.stringify(w.byCountry) + " · city " + JSON.stringify(w.byCity) + " · source " + JSON.stringify(w.bySource));
})().catch((e) => { console.error("usage-report: " + e.message); process.exit(1); });
