// POST /api/subscribe
// Body: { email: string, countries: string[] }
// Effect: stores a pending record in KV (or updates an existing one) and sends
// a confirmation email with a signed link. Free tier is capped at 1 country;
// the cap is enforced again on confirm + on upgrade.

import { signToken } from "../lib/jwt.js";
import { json, error } from "../lib/http.js";
import { sendEmail, emailLayout } from "../lib/email.js";
import {
  getSubscriber, putSubscriber, normalizeEmail, isValidEmail,
  normalizeCountries, limitForTier,
} from "../lib/store.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch (e) { return error(400, "invalid JSON body"); }

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return error(400, "invalid email");

  const countries = normalizeCountries(body.countries);
  if (countries.length === 0) return error(400, "select at least one country");

  // Re-use the existing tier if the user is already in KV (so they don't lose
  // Pro when they re-submit the form to change countries).
  const existing = await getSubscriber(env.ATLAS_SUBSCRIBERS, email);
  const tier = existing?.tier || "free";
  const max = limitForTier(tier);
  if (countries.length > max) {
    return error(402, tier === "free"
      ? "Free tier covers 1 country. Upgrade to Pro for unlimited."
      : `Pro tier limit is ${max} countries.`);
  }

  const now = Math.floor(Date.now() / 1000);
  const record = {
    email,
    tier,
    countries,
    confirmedAt: existing?.confirmedAt || null,
    createdAt:   existing?.createdAt   || now,
    stripeCustomerId: existing?.stripeCustomerId || null,
    stripeSubId:      existing?.stripeSubId      || null,
  };
  await putSubscriber(env.ATLAS_SUBSCRIBERS, record);

  // Always send a fresh confirmation link — it's also a "you've changed your
  // selections" notice.
  const token = await signToken({ email, kind: "confirm" }, env.JWT_SECRET, 86400);
  const url = `${env.SITE_URL || "https://travelnow.info"}/api/confirm?token=${encodeURIComponent(token)}`;
  const countryNames = countries.join(", ");
  const html = emailLayout({
    title: existing?.confirmedAt ? "Subscription updated" : "Confirm your visa alerts",
    body: `
      <p>You requested alerts for visa-policy changes affecting these countries:</p>
      <p style="background:#f4f8ff;border-radius:8px;padding:12px 14px;font-family:ui-monospace,monospace;font-size:13px;color:#1a2236;">
        ${countryNames}
      </p>
      <p>Click the button below to confirm. Without confirmation we'll never email you again.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${url}" style="display:inline-block;background:#60a5fa;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Confirm subscription</a>
      </p>
      <p style="font-size:12px;color:#6b7591;">Link expires in 24 hours.</p>`,
    footer: `If you didn't request this, ignore this email — your address won't be added.`,
  });

  try {
    await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.FROM_EMAIL || "Atlas <alerts@travelnow.info>",
      to: email,
      subject: "Confirm your Atlas visa alerts",
      html,
    });
  } catch (e) {
    return error(502, "could not send confirmation email: " + e.message);
  }

  return json({ ok: true, message: "Confirmation email sent. Check your inbox." });
}
