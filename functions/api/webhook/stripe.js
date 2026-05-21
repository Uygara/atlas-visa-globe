// POST /api/webhook/stripe
// Stripe webhook receiver. Activates Pro on successful checkout, downgrades
// on subscription deletion. Signature is verified using STRIPE_WEBHOOK_SECRET.

import { verifyStripeSignature } from "../../lib/stripe.js";
import { getSubscriber, putSubscriber, listSubscribers } from "../../lib/store.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  const rawBody = await request.text();
  const sigHeader = request.headers.get("Stripe-Signature");

  const ok = await verifyStripeSignature({
    secret: env.STRIPE_WEBHOOK_SECRET,
    header: sigHeader,
    body: rawBody,
  });
  if (!ok) {
    return new Response("invalid signature", { status: 400 });
  }

  let event;
  try { event = JSON.parse(rawBody); }
  catch (e) { return new Response("bad json", { status: 400 }); }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(env, event.data.object);
        break;
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
        await handleSubscriptionEnded(env, event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(env, event.data.object);
        break;
      default:
        // ignore everything else — we only care about lifecycle events
        break;
    }
  } catch (e) {
    return new Response("handler error: " + e.message, { status: 500 });
  }
  return new Response("ok", { status: 200 });
}

async function handleCheckoutCompleted(env, session) {
  const email = (session.metadata?.atlas_email || session.customer_email || "").toLowerCase();
  if (!email) return;
  const sub = await getSubscriber(env.ATLAS_SUBSCRIBERS, email);
  if (!sub) return;
  sub.tier = "pro";
  sub.stripeCustomerId = session.customer || sub.stripeCustomerId;
  sub.stripeSubId = session.subscription || sub.stripeSubId;
  await putSubscriber(env.ATLAS_SUBSCRIBERS, sub);
}

async function handleSubscriptionEnded(env, subscription) {
  // Find the subscriber by stripeSubId. Stripe rarely embeds the email here.
  const all = await listSubscribers(env.ATLAS_SUBSCRIBERS);
  const target = all.find(s => s.stripeSubId === subscription.id);
  if (!target) return;
  target.tier = "free";
  // Trim countries down to the free-tier limit so we don't keep emailing
  // them for every country after they cancel.
  if (target.countries.length > 1) target.countries = target.countries.slice(0, 1);
  target.stripeSubId = null;
  await putSubscriber(env.ATLAS_SUBSCRIBERS, target);
}

async function handleSubscriptionUpdated(env, subscription) {
  // If Stripe marks it active/trialing → keep them Pro. If status is
  // canceled/incomplete_expired → treat as ended.
  const ended = ["canceled", "incomplete_expired", "unpaid"].includes(subscription.status);
  if (ended) return handleSubscriptionEnded(env, subscription);
  // No-op otherwise — Pro stays Pro.
}
