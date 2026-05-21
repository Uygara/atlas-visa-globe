// POST /api/portal
// Body: { email: string }
// Returns a one-shot Stripe Billing Portal URL so Pro users can manage / cancel
// their subscription themselves.

import { json, error } from "../lib/http.js";
import { getSubscriber, normalizeEmail, isValidEmail } from "../lib/store.js";
import { createBillingPortal } from "../lib/stripe.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch (e) { return error(400, "invalid JSON body"); }

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return error(400, "invalid email");

  const sub = await getSubscriber(env.ATLAS_SUBSCRIBERS, email);
  if (!sub || !sub.stripeCustomerId) {
    return error(404, "no Pro subscription found for that address");
  }

  const siteUrl = env.SITE_URL || "https://travelnow.info";
  let session;
  try {
    session = await createBillingPortal(env, {
      customer: sub.stripeCustomerId,
      return_url: `${siteUrl}/alerts/`,
    });
  } catch (e) {
    return error(502, "stripe portal error: " + e.message);
  }
  return json({ url: session.url });
}
