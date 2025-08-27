import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

// ---- config via env ----
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "PropVisions <no-reply@propvisions.onresend.com>";
const DEFAULT_TO = process.env.CONTACT_DEFAULT_TO || "hello@propvisions.com";
const SALES_TO = process.env.CONTACT_SALES_TO || "sales@propvisions.com";
const SUPPORT_TO = process.env.CONTACT_SUPPORT_TO || "support@propvisions.com";

// very small content-length cap to avoid abuse
const MAX_BODY = 10 * 1024; // 10KB

function pickRecipient(topic?: string) {
  const t = (topic || "").toLowerCase();
  if (t.includes("support")) return SUPPORT_TO;
  if (t.includes("product") || t.includes("sales") || t.includes("general")) return SALES_TO;
  if (t.includes("partnership")) return DEFAULT_TO;
  if (t.includes("press")) return DEFAULT_TO;
  return DEFAULT_TO;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // allow only POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // basic size guard
  const len = parseInt(req.headers["content-length"] || "0", 10);
  if (len > MAX_BODY) return res.status(413).json({ error: "Payload too large" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    // honeypot
    if (body.website && String(body.website).trim().length > 0) {
      // pretend success to hide anti-spam
      return res.status(200).json({ ok: true });
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const company = String(body.company || "").trim();
    const role = String(body.role || "").trim();
    const phone = String(body.phone || "").trim();
    const topic = String(body.topic || "General").trim();
    const message = String(body.message || "").trim();

    // validation
    if (name.length < 2) return res.status(400).json({ error: "Name is required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Valid email required" });
    if (message.length < 6) return res.status(400).json({ error: "Message too short" });

    const to = pickRecipient(topic);

    const subject = `New contact: ${topic} — ${name} (${company || "No company"})`;
    const text =
`From: ${name} <${email}>
Company: ${company}
Role: ${role}
Phone: ${phone}
Topic: ${topic}
Source: ${body.source || "unknown"}

Message:
${message}
`;

    // If no API key (local dev), log and succeed so the UI flows
    if (!RESEND_API_KEY) {
      console.log("[contact] (DEV) Would send to:", to);
      console.log(text);
      return res.status(200).json({ ok: true, dev: true });
    }

    const resend = new Resend(RESEND_API_KEY);

    // Send to internal alias
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      reply_to: email, // so you can reply directly
      subject,
      text,
    });

    // Optional: simple auto-ack to sender (comment out if not desired)
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Thanks — we got your message",
      text:
`Hi ${name},

Thanks for getting in touch with PropVisions AI. We’ve received your message and will get back to you within one business day.

If it’s urgent, feel free to reply to this email.

— PropVisions AI Ltd
`,
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[contact] error:", err);
    return res.status(500).json({ error: "Failed to send" });
  }
}
