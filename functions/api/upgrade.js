// POST /api/upgrade
// Body: { email: string }
// Looks the subscriber up and starts a Stripe Checkout session for Atlas Pro.
// Response: { url } — caller redirects.

import { json, error } from "../lib/http.js";
import { getSubscriber, putSubscriber, normalizeEmail, isValidEmail } from "../lib/store.js";
import { createCheckoutSession } from "../lib/stripe.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch (e) { return error(400, "invalid JSON body"); }

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return error(400, "invalid email");
  if (!env.STRIPE_PRICE_ID) return error(500, "STRIPE_PRICE_ID not configured");

  const sub = await getSubscriber(env.ATLAS_SUBSCRIBERS, email);
  if (!sub) return error(404, "subscriber not found — send the confirmation form first");

  const siteUrl = env.SITE_URL || "https://travelnow.info";
  let session;
  try {
    session = await createCheckoutSession(env, {
      mode: "subscription",
      "line_items[0][price]":    env.STRIPE_PRICE_ID,
      "line_items[0][quantity]": 1,
      customer_email: email,
      success_url: `${siteUrl}/alerts/?upgrade=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:   `${siteUrl}/alerts/?upgrade=cancelled`,
      allow_promotion_codes: "true",
      "subscription_data[metadata][atlas_email]": email,
      "metadata[atlas_email]": email,
    });
  } catch (e) {
    return error(502, "stripe checkout error: " + e.message);
  }

  // Stash session id so the webhook can correlate even if customer_email later differs.
  sub.lastCheckoutSessionId = session.id;
  await putSubscriber(env.ATLAS_SUBSCRIBERS, sub);

  return json({ url: session.url });
}
