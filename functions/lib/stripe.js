// Stripe REST client over plain fetch. We use a tiny subset of the API so
// pulling in the official 200 KB SDK isn't worth it.
//
// All endpoints expect form-urlencoded bodies, NOT JSON.

const BASE = "https://api.stripe.com/v1";

function form(obj, prefix = "") {
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => parts.push(form({ [i]: item }, key)));
    } else if (typeof v === "object") {
      parts.push(form(v, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
    }
  }
  return parts.join("&");
}

async function stripeFetch(env, path, { method = "POST", body } = {}) {
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? form(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Stripe ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export function createCheckoutSession(env, params) {
  return stripeFetch(env, "/checkout/sessions", { body: params });
}

export function createBillingPortal(env, params) {
  return stripeFetch(env, "/billing_portal/sessions", { body: params });
}

export function getSubscription(env, id) {
  return stripeFetch(env, `/subscriptions/${id}`, { method: "GET" });
}

export function getCustomer(env, id) {
  return stripeFetch(env, `/customers/${id}`, { method: "GET" });
}

// Webhook signature verification.
// Stripe sends a `Stripe-Signature` header like
//   t=1716336000,v1=<hex>,v1=<hex>
// We HMAC-SHA256 the literal `${t}.${body}` and compare against any v1.
const enc = new TextEncoder();
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function bytesToHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyStripeSignature({ secret, header, body, toleranceSec = 300 }) {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(
    header.split(",").map(p => p.split("=", 2)).map(([k, v]) => [k.trim(), v])
  );
  // header may have multiple v1 values — split() above only kept the last;
  // re-scan for all signatures:
  const sigs = header.split(",")
    .map(p => p.trim())
    .filter(p => p.startsWith("v1="))
    .map(p => p.slice(3));
  const t = parts.t;
  if (!t || sigs.length === 0) return false;

  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;

  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const expected = bytesToHex(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${body}`)));
  return sigs.some(s => timingSafeEqual(s, expected));
}
