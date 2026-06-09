// dispatch-alerts.js
// Runs after the daily scrape inside GitHub Actions. Reads:
//   - the changelog the scraper just regenerated  (../data/changelog.js)
//   - the travelnow.info subscribers KV namespace          (via the Cloudflare REST API)
// For every confirmed subscriber it builds a per-recipient digest of the
// changes that affect their watch-list and sends one email via Resend.
//
// Required env vars (all GitHub Actions secrets):
//   CLOUDFLARE_API_TOKEN        — read access to the KV namespace
//   CLOUDFLARE_ACCOUNT_ID
//   CLOUDFLARE_KV_NAMESPACE_ID  — the ATLAS_SUBSCRIBERS namespace id
//   RESEND_API_KEY
//   JWT_SECRET                  — same value as the Pages Function env var
//   SITE_URL                    — e.g. https://travelnow.info
//   FROM_EMAIL                  — e.g. "travelnow.info <alerts@travelnow.info>"

const fs   = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");

// ── Read today's changelog ────────────────────────────────────────────────
// data/changelog.js declares `window.CHANGELOG = [ ... ]`. We don't have a
// browser here — pluck the literal array by stripping the prelude.
function loadChangelog() {
  const raw = fs.readFileSync(path.join(ROOT, "data", "changelog.js"), "utf8");
  const start = raw.indexOf("[");
  const end   = raw.lastIndexOf("]");
  if (start < 0 || end < 0) return [];
  const jsonish = raw.slice(start, end + 1);
  // Convert JS object literals → JSON: quote keys, allow trailing commas.
  // The file is hand-shaped by the scraper so the simple eval-via-Function
  // works and is acceptable for our own data.
  // eslint-disable-next-line no-new-func
  return new Function(`return ${jsonish};`)();
}

// ── List subscribers from Cloudflare KV via REST ──────────────────────────
async function cfFetch(env, path, opts = {}) {
  const url = `https://api.cloudflare.com/client/v4${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Authorization": `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Cloudflare ${path} → ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function listSubscribers(env) {
  const base = `/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${env.CLOUDFLARE_KV_NAMESPACE_ID}`;
  const out = [];
  let cursor;
  do {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=1000` : "?limit=1000";
    const page = await cfFetch(env, `${base}/keys${q}`);
    for (const k of page.result || []) {
      const v = await cfFetch(env, `${base}/values/${encodeURIComponent(k.name)}`).catch(() => null);
      // KV values endpoint returns raw text on success — we need to re-fetch raw.
      // The /values/ endpoint above returns JSON wrapping; switch to raw fetch.
      const raw = await fetch(
        `https://api.cloudflare.com/client/v4${base}/values/${encodeURIComponent(k.name)}`,
        { headers: { "Authorization": `Bearer ${env.CLOUDFLARE_API_TOKEN}` } }
      ).then(r => r.ok ? r.text() : null).catch(() => null);
      if (raw) {
        try { out.push(JSON.parse(raw)); } catch (e) {}
      }
    }
    cursor = page.result_info?.cursor;
  } while (cursor);
  return out;
}

// ── Token signer (matches functions/lib/jwt.js) ───────────────────────────
function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function signToken(payload, secret, ttlSec = 30 * 86400) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec };
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const data = b64url(JSON.stringify(body));
  const sig = b64url(crypto.createHmac("sha256", secret).update(`${head}.${data}`).digest());
  return `${head}.${data}.${sig}`;
}

// ── Build the per-subscriber digest ───────────────────────────────────────
function statusLabel(s) {
  return ({ vf: "Visa-free", ev: "eVisa", voa: "Visa on arrival", vr: "Visa required" })[s] || s;
}
function digestFor(subscriber, changes) {
  const isoSet = new Set(subscriber.countries.map(c => c.toUpperCase()));
  // Match any entry where the passport OR destination is in the watch-list.
  return changes.filter(c => {
    const ps = (c.affects?.passports || []).map(x => x.toUpperCase());
    const dest = (c.affects?.dest || "").toUpperCase();
    return ps.some(p => isoSet.has(p)) || isoSet.has(dest);
  });
}

function renderDigestEmail({ subscriber, changes, unsubscribeUrl, siteUrl }) {
  const rows = changes.map(c => {
    const fromL = statusLabel(c.statusFrom);
    const toL = statusLabel(c.statusTo);
    const ps = (c.affects?.passports || []).join(", ");
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f8;">
          <div style="font-weight:600;font-size:14px;color:#1a2236;">${ps} → ${c.affects?.dest || ""}</div>
          <div style="font-size:12px;color:#3a4256;margin-top:2px;">${fromL} → <strong>${toL}</strong></div>
          <div style="font-size:11px;color:#6b7591;margin-top:4px;">${c.date}</div>
        </td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;background:#f4f8ff;font-family:-apple-system,system-ui,sans-serif;color:#1a2236;line-height:1.55;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff;border-radius:12px;border:1px solid #e3eaf3;overflow:hidden;">
        <tr><td style="padding:24px 28px 4px;">
          <div style="font-size:18px;font-weight:700;color:#1a2236;">travelnow.info alerts</div>
          <div style="font-size:11px;color:#6b7591;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">${changes.length} change${changes.length === 1 ? "" : "s"} in your watch-list</div>
        </td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #eef2f8;font-size:12px;color:#6b7591;">
          <a href="${siteUrl}/" style="color:#60a5fa;text-decoration:none;">View on travelnow.info →</a><br>
          <a href="${unsubscribeUrl}" style="color:#6b7591;">Unsubscribe</a> · subscriber: ${subscriber.email}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return html;
}

async function sendEmail({ env, to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || "travelnow.info <alerts@travelnow.info>",
      to, subject, html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const env = process.env;
  const required = ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_KV_NAMESPACE_ID", "RESEND_API_KEY", "JWT_SECRET"];
  const missing = required.filter(k => !env[k]);
  if (missing.length) {
    console.log(`[dispatch-alerts] skipping — missing env: ${missing.join(", ")}`);
    return;
  }

  const changes = loadChangelog();
  if (changes.length === 0) {
    console.log("[dispatch-alerts] no changes today, nothing to send");
    return;
  }
  // Keep only today's entries to avoid resending old diffs.
  const today = new Date().toISOString().slice(0, 10);
  const todays = changes.filter(c => c.date === today);
  if (todays.length === 0) {
    console.log("[dispatch-alerts] no entries dated today");
    return;
  }

  const subs = await listSubscribers(env);
  const confirmed = subs.filter(s => s.confirmedAt);
  console.log(`[dispatch-alerts] ${subs.length} subscribers (${confirmed.length} confirmed), ${todays.length} changes today`);

  const siteUrl = env.SITE_URL || "https://travelnow.info";
  let sent = 0;
  for (const sub of confirmed) {
    const matches = digestFor(sub, todays);
    if (matches.length === 0) continue;

    const unsubToken = signToken({ email: sub.email, kind: "unsubscribe" }, env.JWT_SECRET);
    const unsubscribeUrl = `${siteUrl}/api/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

    const html = renderDigestEmail({ subscriber: sub, changes: matches, unsubscribeUrl, siteUrl });
    const subject = matches.length === 1
      ? `Visa update: ${matches[0].affects.passports?.[0]} → ${matches[0].affects.dest}`
      : `${matches.length} visa policy changes affecting your watch-list`;

    try {
      await sendEmail({ env, to: sub.email, subject, html });
      sent++;
    } catch (e) {
      console.error(`[dispatch-alerts] failed to send to ${sub.email}: ${e.message}`);
    }
    // Be polite — Resend free tier is 10/sec
    await new Promise(r => setTimeout(r, 120));
  }
  console.log(`[dispatch-alerts] sent ${sent} digests`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
