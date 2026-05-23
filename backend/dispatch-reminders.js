// dispatch-reminders.js
// Companion to dispatch-alerts.js. Runs daily inside GitHub Actions and sends
// "apply-by" reminder emails to Pro subscribers who saved a multi-stop
// itinerary via POST /api/reminders.
//
// For each confirmed Pro subscriber with a non-empty reminders[] array we
// look for items whose applyBy date is T-7, T-3 or T-1 from today and send
// one consolidated email per subscriber per day. Past items are surfaced as
// "deadline today" if applyBy === today.
//
// Same env-var contract as dispatch-alerts.js:
//   CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_KV_NAMESPACE_ID
//   RESEND_API_KEY / JWT_SECRET / SITE_URL / FROM_EMAIL

const crypto = require("crypto");

// ── Cloudflare KV helpers (raw fetch — same trick dispatch-alerts uses) ──
async function cfKVList(env) {
  const base = `/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${env.CLOUDFLARE_KV_NAMESPACE_ID}`;
  const out = [];
  let cursor;
  do {
    const url = `https://api.cloudflare.com${base}/keys${cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=1000` : "?limit=1000"}`;
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
    });
    if (!res.ok) throw new Error(`KV list → ${res.status}: ${await res.text()}`);
    const j = await res.json();
    for (const k of j.result || []) {
      const raw = await fetch(
        `https://api.cloudflare.com${base}/values/${encodeURIComponent(k.name)}`,
        { headers: { "Authorization": `Bearer ${env.CLOUDFLARE_API_TOKEN}` } }
      ).then(r => r.ok ? r.text() : null).catch(() => null);
      if (raw) {
        try { out.push(JSON.parse(raw)); } catch (e) {}
      }
    }
    cursor = j.result_info?.cursor;
  } while (cursor);
  return out;
}

// ── Date helpers ──────────────────────────────────────────────────────────
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(yyyymmdd, ref) {
  const a = new Date(yyyymmdd + "T00:00:00Z").getTime();
  const b = new Date(ref      + "T00:00:00Z").getTime();
  return Math.round((a - b) / 86400000);
}

// ── Email render ──────────────────────────────────────────────────────────
function urgencyLabel(daysOut) {
  if (daysOut <= 0)  return "Apply today";
  if (daysOut === 1) return "Apply tomorrow";
  if (daysOut === 3) return "3 days left to apply";
  if (daysOut === 7) return "1 week left to apply";
  return `${daysOut} days left`;
}

function renderReminderEmail({ subscriber, items, siteUrl, unsubscribeUrl }) {
  const rows = items.map(({ item, daysOut }) => {
    const urgent = daysOut <= 1;
    return `
      <tr>
        <td style="padding:12px 14px;border-bottom:1px solid #eef2f8;">
          <div style="font-size:11px;color:${urgent ? "#a02018" : "#0e7a3a"};letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">
            ${urgencyLabel(daysOut)}
          </div>
          <div style="font-size:14px;font-weight:600;color:#1a2236;margin-top:4px;">
            ${item.destIso} · ${(item.label || "Visa application").replace(/[<>]/g, "")}
          </div>
          <div style="font-size:12px;color:#3a4256;margin-top:2px;">
            Apply by ${item.applyBy}
          </div>
        </td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;background:#f4f8ff;font-family:-apple-system,system-ui,sans-serif;color:#1a2236;line-height:1.55;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff;border-radius:12px;border:1px solid #e3eaf3;overflow:hidden;">
        <tr><td style="padding:24px 28px 4px;">
          <div style="font-size:18px;font-weight:700;color:#1a2236;">Visa application reminder</div>
          <div style="font-size:11px;color:#6b7591;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">
            ${items.length} item${items.length === 1 ? "" : "s"} from your itinerary
          </div>
        </td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #eef2f8;font-size:12px;color:#6b7591;">
          <a href="${siteUrl}/itinerary/" style="color:#60a5fa;text-decoration:none;">Open your itinerary →</a><br>
          <a href="${unsubscribeUrl}" style="color:#6b7591;">Unsubscribe</a> · Pro subscriber: ${subscriber.email}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
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

async function sendEmail({ env, to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || "Atlas <alerts@travelnow.info>",
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
    console.log(`[dispatch-reminders] skipping — missing env: ${missing.join(", ")}`);
    return;
  }

  const today = todayUTC();
  const subs = await cfKVList(env);
  const proWithItems = subs.filter(s =>
    s && s.confirmedAt && s.tier === "pro"
    && Array.isArray(s.reminders) && s.reminders.length > 0);
  console.log(`[dispatch-reminders] ${proWithItems.length} pro subscribers with itineraries`);

  // For each subscriber, find items whose applyBy ∈ { today, today+1, today+3,
  // today+7 }. Past items not surfaced — once the apply-by passes we stop
  // nagging (the user either applied or missed the window).
  const TRIGGER_OFFSETS = [0, 1, 3, 7];
  const siteUrl = env.SITE_URL || "https://travelnow.info";
  let sent = 0;

  for (const sub of proWithItems) {
    const due = sub.reminders
      .map(item => ({ item, daysOut: daysBetween(item.applyBy, today) }))
      .filter(x => TRIGGER_OFFSETS.includes(x.daysOut))
      .sort((a, b) => a.daysOut - b.daysOut);
    if (due.length === 0) continue;

    const unsubToken = signToken({ email: sub.email, kind: "unsubscribe" }, env.JWT_SECRET);
    const unsubscribeUrl = `${siteUrl}/api/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
    const html = renderReminderEmail({ subscriber: sub, items: due, siteUrl, unsubscribeUrl });
    const subject = due.length === 1
      ? `Visa apply-by ${due[0].item.applyBy}: ${due[0].item.destIso}`
      : `${due.length} visa apply-by reminders`;

    try {
      await sendEmail({ env, to: sub.email, subject, html });
      sent++;
    } catch (e) {
      console.error(`[dispatch-reminders] failed to send to ${sub.email}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 120)); // 10/s Resend cap
  }

  console.log(`[dispatch-reminders] sent ${sent} reminder emails`);
}

main().catch(e => { console.error(e); process.exit(1); });
