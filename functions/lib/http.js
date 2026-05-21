// Tiny response helpers so handlers stay readable.

export const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });

export const error = (status, message) =>
  json({ error: message }, { status });

export const redirect = (url, status = 302) =>
  new Response(null, { status, headers: { Location: url } });

/** Same-origin only — frontend never crosses origins so we keep it tight. */
export function withCors(res) {
  res.headers.set("Vary", "Origin");
  return res;
}
