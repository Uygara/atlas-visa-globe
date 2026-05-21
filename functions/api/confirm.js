// GET /api/confirm?token=<jwt>
// Verifies the token signed by /api/subscribe and flips confirmedAt on the
// stored record. Renders a tiny success page so the user has somewhere to land.

import { verifyToken } from "../lib/jwt.js";
import { getSubscriber, putSubscriber } from "../lib/store.js";

function renderPage({ title, body, tone = "ok" }) {
  const colour = tone === "error" ? "#ef4444" : "#22c55e";
  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Atlas</title>
<style>
  body { margin:0; background:#f4f8ff; color:#1a2236; font-family:-apple-system,system-ui,sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; line-height:1.55; }
  .card { max-width:480px; background:#fff; border:1px solid #e3eaf3; border-radius:14px; padding:28px 28px 24px; box-shadow:0 12px 32px rgba(36,60,100,0.06); }
  .dot { width:10px; height:10px; border-radius:50%; background:${colour}; box-shadow:0 0 12px ${colour}; display:inline-block; margin-right:8px; vertical-align:middle; }
  h1 { font-size:22px; margin:0 0 10px; letter-spacing:-0.01em; }
  p { font-size:14px; color:#3a4256; margin:0 0 14px; }
  a.btn { display:inline-block; padding:10px 18px; background:#60a5fa; color:#fff; text-decoration:none; border-radius:8px; font-weight:600; font-size:13px; margin-top:6px; }
</style></head><body>
<div class="card">
  <h1><span class="dot"></span>${title}</h1>
  ${body}
  <a class="btn" href="/">Back to Atlas</a>
</div></body></html>`;
  return new Response(html, {
    status: tone === "error" ? 400 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const u = new URL(request.url);
  const token = u.searchParams.get("token");
  if (!token) return renderPage({ title: "Missing token", body: "<p>This link looks broken.</p>", tone: "error" });

  let payload;
  try { payload = await verifyToken(token, env.JWT_SECRET); }
  catch (e) { return renderPage({ title: "Link expired", body: "<p>This confirmation link is no longer valid. Re-submit the form to get a fresh one.</p>", tone: "error" }); }

  if (payload.kind !== "confirm") {
    return renderPage({ title: "Wrong link", body: "<p>This token isn't a confirmation token.</p>", tone: "error" });
  }

  const sub = await getSubscriber(env.ATLAS_SUBSCRIBERS, payload.email);
  if (!sub) {
    return renderPage({ title: "Not found", body: "<p>We couldn't find a pending subscription for that address. Try subscribing again.</p>", tone: "error" });
  }

  sub.confirmedAt = sub.confirmedAt || Math.floor(Date.now() / 1000);
  await putSubscriber(env.ATLAS_SUBSCRIBERS, sub);

  const countries = sub.countries.join(", ");
  const upgradeLine = sub.tier === "pro"
    ? "<p>You're on the <strong>Pro</strong> plan — unlimited country watchlist.</p>"
    : "<p>You're on the <strong>free</strong> plan (1 country). <a href=\"/alerts/#upgrade\">Upgrade to Pro</a> for $2/month if you want to track more.</p>";

  return renderPage({
    title: "Subscription confirmed",
    body: `<p>You'll receive an email whenever the visa policy changes for: <strong>${countries}</strong>.</p>${upgradeLine}<p style="font-size:12px;color:#6b7591;">You can unsubscribe at any time via the link in every email.</p>`,
  });
}
