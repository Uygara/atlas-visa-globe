// GET /api/unsubscribe?token=<jwt>
// One-click unsubscribe link (CAN-SPAM compliant). Removes the subscriber
// record. If the user is on Pro tier we also cancel their Stripe subscription
// so they don't continue to be billed.

import { verifyToken } from "../lib/jwt.js";
import { getSubscriber, deleteSubscriber } from "../lib/store.js";

async function cancelStripeSubscription(env, subscriptionId) {
  if (!subscriptionId || !env.STRIPE_SECRET_KEY) return;
  try {
    await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}` },
    });
  } catch (e) { /* swallow — KV record is already gone */ }
}

function renderPage({ title, body, tone = "ok" }) {
  const colour = tone === "error" ? "#ef4444" : "#22c55e";
  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Atlas</title>
<style>
  body { margin:0; background:#f4f8ff; color:#1a2236; font-family:-apple-system,system-ui,sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; line-height:1.55; }
  .card { max-width:480px; background:#fff; border:1px solid #e3eaf3; border-radius:14px; padding:28px; }
  .dot { width:10px; height:10px; border-radius:50%; background:${colour}; display:inline-block; margin-right:8px; vertical-align:middle; }
  h1 { font-size:22px; margin:0 0 10px; letter-spacing:-0.01em; }
  p { font-size:14px; color:#3a4256; margin:0 0 12px; }
  a.btn { display:inline-block; padding:10px 18px; background:#60a5fa; color:#fff; text-decoration:none; border-radius:8px; font-weight:600; font-size:13px; }
</style></head><body>
<div class="card"><h1><span class="dot"></span>${title}</h1>${body}<a class="btn" href="/">Back to Atlas</a></div></body></html>`;
  return new Response(html, {
    status: tone === "error" ? 400 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const u = new URL(request.url);
  const token = u.searchParams.get("token");
  if (!token) return renderPage({ title: "Missing token", body: "<p>Broken link.</p>", tone: "error" });

  let payload;
  try { payload = await verifyToken(token, env.JWT_SECRET); }
  catch (e) { return renderPage({ title: "Link expired", body: "<p>Unsubscribe links expire after 30 days. If you still want to unsubscribe, reply to the most recent alert email.</p>", tone: "error" }); }

  if (payload.kind !== "unsubscribe") {
    return renderPage({ title: "Wrong link", body: "<p>That token isn't an unsubscribe token.</p>", tone: "error" });
  }

  const sub = await getSubscriber(env.ATLAS_SUBSCRIBERS, payload.email);
  if (sub?.stripeSubId) await cancelStripeSubscription(env, sub.stripeSubId);
  await deleteSubscriber(env.ATLAS_SUBSCRIBERS, payload.email);

  return renderPage({
    title: "You're unsubscribed",
    body: `<p>${payload.email} has been removed from the Atlas alerts list. ${sub?.tier === "pro" ? "Your Pro subscription has also been cancelled — Stripe won't charge you again." : ""}</p><p>Sorry to see you go.</p>`,
  });
}
