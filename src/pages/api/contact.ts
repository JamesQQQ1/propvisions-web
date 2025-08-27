// /src/pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

// ---- config via env ----
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL || "PropVisions <no-reply@propvisions.onresend.com>";
const DEFAULT_TO = process.env.CONTACT_DEFAULT_TO || "hello@propvisions.com";
const SALES_TO = process.env.CONTACT_SALES_TO || "sales@propvisions.com";
const SUPPORT_TO = process.env.CONTACT_SUPPORT_TO || "support@propvisions.com";

// small cap to avoid abuse
const MAX_BODY = 10 * 1024; // 10KB

function pickRecipient(topic?: string) {
  const t = (topic || "").toLowerCase();
  if (t.includes("support")) return SUPPORT_TO;
  if (t.includes("product") || t.includes("sales") || t.includes("general")) return SALES_TO;
  if (t.includes("partnership") || t.includes("press")) return DEFAULT_TO;
  return DEFAULT_TO;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // content-length guard (fetch sets it; in some cases it can be absent)
  const len = parseInt((req.headers["content-length"] as string) || "0", 10);
  if (Number.isFinite(len) && len > MAX_BODY) {
    return res.status(413).json({ error: "Payload too large" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    // honeypot
    if (body.website && String(body.website).trim().length > 0) {
      return res.status(200).json({ ok: true });
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const company = String(body.company || "").trim();
    const role = String(body.role || "").trim();
    const phone = String(body.phone || "").trim();
    const topic = String(body.topic || "General").trim();
    const message = String(body.message || "").trim();

    if (name.length < 2) return res.status(400).json({ error: "Name is required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Valid email required" });
    if (message.length < 6) return res.status(400).json({ error: "Message too short" });

    const to = pickRecipient(topic);

    const subject = `New contact: ${topic} — ${name} (${company || "No company"})`;
    const text = `From: ${name} <${email}>
Company: ${company}
Role: ${role}
Phone: ${phone}
Topic: ${topic}
Source: ${body.source || "unknown"}

Message:
${message}
`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px">New contact</h2>
        <p><strong>Topic:</strong> ${topic}</p>
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ""}
        ${role ? `<p><strong>Role:</strong> ${role}</p>` : ""}
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        <pre style="white-space:pre-wrap;background:#f6f7f9;padding:12px;border-radius:8px">${message}</pre>
      </div>
    `;

    // Dev fallback
    if (!RESEND_API_KEY) {
      console.log("[contact] (DEV) Would send to:", to);
      console.log(text);
      return res.status(200).json({ ok: true, dev: true });
    }

    const resend = new Resend(RESEND_API_KEY);

    // 1) send to internal mailbox
    const internal = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: email, // ✅ correct key
      subject,
      text,
      html,
    });

    // 2) auto-ack to sender (optional)
    const ack = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Thanks — we got your message",
      text: `Hi ${name},

Thanks for getting in touch with PropVisions. We’ve received your message and will get back to you within one business day.

If it’s urgent, feel free to reply to this email.

— PropVisions`,
    });

    return res.status(200).json({ ok: true, internal, ack });
  } catch (err: any) {
    // try to bubble up Resend error details if present
    const msg =
      err?.message ||
      err?.name ||
      (typeof err === "string" ? err : "Failed to send");
    console.error("[contact] error:", err);
    return res.status(500).json({ error: msg });
  }
}
