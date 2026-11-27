// experiences-review.js: weekly review of traveller experiences (roadmap R5).
//
//   node tools/experiences-review.js              counts, posts of the last 7 days, hidden posts
//   node tools/experiences-review.js --auto       also hides any post that matches the personal-data
//                                                  pattern again (the site checks on write; this is the second look)
//   node tools/experiences-review.js --delete <id>  removes one post (a human or the autopilot decides)
//
// Credentials as in tools/usage-report.js: .secrets/firebase-admin.json or the FIREBASE_SERVICE_ACCOUNT
// env var. Plain Node. Post text is printed only for visible posts (they are public on the site anyway);
// hidden posts print their id, pair and report count, never the text.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const PROJECT = "travelnow-a0cf3";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const AUTO = process.argv.includes("--auto");
const DEL = (() => { const i = process.argv.indexOf("--delete"); return i > 0 ? process.argv[i + 1] : null; })();
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");

// The pattern the page and firestore.rules use.
const win = {};
require("vm").runInNewContext(fs.readFileSync(path.join(ROOT, "assets/experiences.js"), "utf8"), { window: win, localStorage: { getItem: () => null, setItem() {} }, Date, JSON, Number, String, RegExp, Promise, setTimeout });
const PII = new RegExp(win.ATLAS_EXPERIENCES.PII, "i");

function serviceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  return JSON.parse(fs.readFileSync(path.join(ROOT, ".secrets", "firebase-admin.json"), "utf8"));
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
const val = (f) => f == null ? null : f.stringValue ?? (f.integerValue != null ? Number(f.integerValue) : f.booleanValue ?? f.timestampValue ?? null);

async function main() {
  let sa;
  try { sa = serviceAccount(); } catch (e) { console.log("No service account (.secrets/firebase-admin.json or FIREBASE_SERVICE_ACCOUNT): skipped."); return; }
  const tk = await token(sa), H = { Authorization: "Bearer " + tk };
  if (DEL) {
    const r = await fetch(`${BASE}/experiences/${encodeURIComponent(DEL)}`, { method: "DELETE", headers: H });
    console.log(r.ok ? `deleted ${DEL}` : `delete failed ${r.status}`); return;
  }
  const docs = []; let page = "";
  do {
    const r = await fetch(`${BASE}/experiences?pageSize=300${page ? "&pageToken=" + page : ""}`, { headers: H });
    const j = await r.json();
    if (j.error) throw new Error(JSON.stringify(j.error).slice(0, 200));
    (j.documents || []).forEach((d) => docs.push({ id: d.name.split("/").pop(), name: d.name, f: d.fields || {} }));
    page = j.nextPageToken || "";
  } while (page);
  const week = Date.now() - 7 * 864e5;
  const rows = docs.map((d) => ({ id: d.id, name: d.name, pair: val(d.f.pair), route: val(d.f.route), visible: val(d.f.visible) !== false, reports: val(d.f.reports) || 0,
    text: val(d.f.text) || "", at: Date.parse(val(d.f.createdAt) || 0) || 0 }));
  const hidden = rows.filter((r) => !r.visible), recent = rows.filter((r) => r.at >= week);
  console.log(`experiences: ${rows.length} total, ${rows.filter((r) => r.visible).length} visible, ${hidden.length} hidden, ${recent.length} new in 7 days`);
  recent.filter((r) => r.visible).forEach((r) => console.log(`  new ${r.id} [${r.route}] ${r.text.slice(0, 160).replace(/\s+/g, " ")}`));
  hidden.forEach((r) => console.log(`  hidden ${r.id} (${r.pair}, ${r.reports} reports)`));
  const bad = rows.filter((r) => r.visible && PII.test(r.text));
  bad.forEach((r) => console.log(`  personal data pattern in ${r.id}`));
  if (AUTO) for (const r of bad) {
    const u = `https://firestore.googleapis.com/v1/${r.name}?updateMask.fieldPaths=visible`;
    const x = await fetch(u, { method: "PATCH", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ fields: { visible: { booleanValue: false } } }) });
    console.log(`  ${x.ok ? "hid" : "hide failed " + x.status} ${r.id}`);
  }
}
main().catch((e) => { console.error(e.message); process.exit(1); });
