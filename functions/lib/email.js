// Resend wrapper. Resend's REST API is `POST https://api.resend.com/emails`
// with bearer auth — no SDK needed, just fetch.

const ENDPOINT = "https://api.resend.com/emails";

/** Send a single transactional email. Returns the Resend response JSON. */
export async function sendEmail({ apiKey, from, to, subject, html, text, replyTo }) {
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  if (!from)   throw new Error("from address required");
  if (!to)     throw new Error("to address required");

  const body = { from, to, subject, html };
  if (text) body.text = text;
  if (replyTo) body.reply_to = replyTo;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend ${res.status}: ${errText}`);
  }
  return res.json();
}

/** Wrap arbitrary HTML in a minimal styled email shell. */
export function emailLayout({ title, body, footer }) {
  // Inline styles only — every email client strips <style>.
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f8ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a2236;line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8ff;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:12px;border:1px solid #e3eaf3;overflow:hidden;">
        <tr><td style="padding:24px 28px 0;">
          <div style="font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#1a2236;">travelnow.info</div>
          <div style="font-size:11px;color:#6b7591;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">travelnow.info</div>
        </td></tr>
        <tr><td style="padding:18px 28px 4px;font-size:20px;font-weight:600;color:#1a2236;">${title}</td></tr>
        <tr><td style="padding:0 28px 28px;font-size:14px;color:#3a4256;">${body}</td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #eef2f8;font-size:11px;color:#6b7591;">${footer || ""}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
