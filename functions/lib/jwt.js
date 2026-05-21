// Minimal HMAC-SHA256 token signer/verifier for our short-lived confirmation
// and unsubscribe links. We don't need full JWT — a base64url(header.payload)
// joined with a hex HMAC is enough and avoids pulling in jose.

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return new Uint8Array(sig);
}

/** Sign a payload with short TTL (default 24 h). Returns a compact token. */
export async function signToken(payload, secret, ttlSeconds = 86400) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const head = b64urlEncode(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const data = b64urlEncode(enc.encode(JSON.stringify(body)));
  const sig = b64urlEncode(await hmac(secret, `${head}.${data}`));
  return `${head}.${data}.${sig}`;
}

/** Verify a token. Throws on bad signature, returns the payload on success. */
export async function verifyToken(token, secret) {
  const parts = (token || "").split(".");
  if (parts.length !== 3) throw new Error("malformed token");
  const expected = b64urlEncode(await hmac(secret, `${parts[0]}.${parts[1]}`));
  if (expected !== parts[2]) throw new Error("bad signature");
  const payload = JSON.parse(dec.decode(b64urlDecode(parts[1])));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error("expired");
  }
  return payload;
}
