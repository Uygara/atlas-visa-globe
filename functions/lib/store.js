// Helpers around the ATLAS_SUBSCRIBERS KV namespace. Key is the lower-cased
// email. Value is the JSON record below.
//
// Schema:
//   {
//     email:       "uygar@example.com",
//     tier:        "free" | "pro",
//     countries:   ["TR", "DE"],         // ISO2 codes
//     confirmedAt: 1716_336_000,          // unix seconds, set on email confirm
//     createdAt:   1716_335_900,
//     stripeCustomerId: "cus_...",        // present once user upgraded
//     stripeSubId:      "sub_...",
//     updatedAt:   ...,
//   }

const FREE_COUNTRY_LIMIT = 1;
const PRO_COUNTRY_LIMIT = 50; // sanity cap

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  // intentionally loose — Resend's deliverability check is the real gate
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeCountries(arr) {
  const seen = new Set();
  const out = [];
  for (const c of arr || []) {
    const code = String(c || "").trim().toUpperCase();
    if (!/^[A-Z]{2,3}$/.test(code)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

export function limitForTier(tier) {
  return tier === "pro" ? PRO_COUNTRY_LIMIT : FREE_COUNTRY_LIMIT;
}

export async function getSubscriber(kv, email) {
  const key = normalizeEmail(email);
  if (!key) return null;
  const raw = await kv.get(key);
  return raw ? JSON.parse(raw) : null;
}

export async function putSubscriber(kv, record) {
  const key = normalizeEmail(record.email);
  if (!key) throw new Error("email required");
  record.email = key;
  record.updatedAt = Math.floor(Date.now() / 1000);
  await kv.put(key, JSON.stringify(record));
  return record;
}

export async function deleteSubscriber(kv, email) {
  const key = normalizeEmail(email);
  if (!key) return;
  await kv.delete(key);
}

/** Walk the entire namespace. Cloudflare KV `list` is paginated. */
export async function listSubscribers(kv, { limit = 1000 } = {}) {
  const out = [];
  let cursor;
  do {
    const page = await kv.list({ cursor, limit: Math.min(limit, 1000) });
    for (const key of page.keys) {
      const raw = await kv.get(key.name);
      if (raw) {
        try { out.push(JSON.parse(raw)); } catch (e) {}
      }
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return out;
}
