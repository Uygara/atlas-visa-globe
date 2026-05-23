// POST /api/reminders
// Body: { email: string, reminders: [{ destIso, applyBy, label }] }
// Effect: stores a list of visa-application reminders on the Pro subscriber's
//   KV record. The daily backend/dispatch-reminders.js job picks them up and
//   sends "apply within N days" emails at T-7, T-3, and T-1.
//
// Auth: the email must already exist in KV with confirmedAt set AND
//   tier === "pro" (reminders are gated behind the Pro subscription).
//   No additional token is required — the existing subscribe-confirm flow
//   already proves the user owns the address. The endpoint only writes
//   reminders into a record that already exists for that email.

import { json, error } from "../lib/http.js";
import { getSubscriber, putSubscriber, normalizeEmail, isValidEmail } from "../lib/store.js";

const MAX_REMINDERS = 20;
const ISO_RE  = /^[A-Z]{2,3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function sanitiseItem(r) {
  return {
    destIso: String(r?.destIso || "").toUpperCase().slice(0, 3),
    applyBy: String(r?.applyBy || "").slice(0, 10),
    label:   String(r?.label   || "").slice(0, 200),
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); }
  catch (e) { return error(400, "invalid JSON body"); }

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return error(400, "invalid email");

  const raw = Array.isArray(body.reminders) ? body.reminders.slice(0, MAX_REMINDERS) : [];
  const items = raw.map(sanitiseItem)
    .filter(r => ISO_RE.test(r.destIso) && DATE_RE.test(r.applyBy));

  const sub = await getSubscriber(env.ATLAS_SUBSCRIBERS, email);
  if (!sub) {
    return error(404, "Email not subscribed. Subscribe at /alerts/ first, then come back.");
  }
  if (!sub.confirmedAt) {
    return error(403, "Email not confirmed yet. Click the confirmation link we sent.");
  }
  if (sub.tier !== "pro") {
    return error(402, "Application reminders are a Pro feature. Upgrade at /alerts/ to enable.");
  }

  sub.reminders = items;
  await putSubscriber(env.ATLAS_SUBSCRIBERS, sub);

  return json({ ok: true, count: items.length });
}

// GET /api/reminders?email=... — returns the saved reminder list for an email
// (only used by the /itinerary/ page to pre-fill on load; same Pro gate).
export async function onRequestGet(context) {
  const { request, env } = context;
  const u = new URL(request.url);
  const email = normalizeEmail(u.searchParams.get("email") || "");
  if (!isValidEmail(email)) return error(400, "invalid email");
  const sub = await getSubscriber(env.ATLAS_SUBSCRIBERS, email);
  if (!sub) return json({ ok: true, reminders: [], tier: "free" });
  return json({
    ok: true,
    reminders: Array.isArray(sub.reminders) ? sub.reminders : [],
    tier: sub.tier || "free",
    confirmed: !!sub.confirmedAt,
  });
}
