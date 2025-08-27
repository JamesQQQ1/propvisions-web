// /src/pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

// ---- config via env ----
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const CONTACT_FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL || "PropVisions <no-reply@mail.propvisions.com>";
const DEFAULT_TO = process.env.CONTACT_DEFAULT_TO || "hello@propvisions.com";
const SALES_TO = process.env.CONTACT_SALES_TO || "sales@propvisions.com";
const SUPPORT_TO = process.env.CONTACT_SUPPORT_TO || "support@propvisions.com";
// reply-to for auto-ack (Option 1)
const REPLYTO_FOR_ACK = process.env.CONTACT_REPLYTO || "support@propvisions.com";

// cap to avoid abuse
const MAX_BODY = 10 * 1024; // 10KB

// clean up any bad env formatting
function cleanFrom(value?: string) {
  const s = (value || "").trim()
    .replace(/^['"]+|['"]+$/g, "")    // strip leading/trailing quotes
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
  const valid =
    /^[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+$/.test(s) ||
    /.+<[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+>/.test(s);
  return valid ? s : "no-reply@mail.propvisions.com";
}
const FROM_EMAIL = cleanFrom(CONTACT_FROM_EMAIL);

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

  const len = parseInt((req.headers["content-length"] as string) || "0", 10);
  if (Number.isFinite(len) && len > MAX_BODY) {
    return res.status(413).json({ error: "Payload too large" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    // honeypot
    if (body._hp && String(body._hp).trim().length > 0) {
      return res.status(200).json({ ok: true, skipped: "honeypot" });
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
    const bcc = [DEFAULT_TO]; // always copy hello@

    const subject = `New contact: ${topic} — ${name} (${company || "No company"})`;
    const text = `From: ${name} <${email}>
Company: ${company}
Role: ${role}
Phone: ${phone}
Topic: ${topic}
Source: ${body.source || "contact_page"}

Message:
${message}
`;

    if (!RESEND_API_KEY) {
      console.log("[contact] (DEV) Would send to:", to, "bcc:", bcc);
      console.log(text);
      return res.status(200).json({ ok: true, dev: true });
    }

    const resend = new Resend(RESEND_API_KEY);

    // 1) internal send (reply directly to the user)
    const internal = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      bcc,
      replyTo: email, // you can reply straight back to the sender from your internal copy
      subject,
      text,
    });

    // 2) auto-ack to sender — replyable to support@
    const ack = await resend.emails.send({
      from: FROM_EMAIL,                   // no-reply@mail.propvisions.com (verified)
      to: email,                          // user
      replyTo: REPLYTO_FOR_ACK,           // 🟢 replies go to support@propvisions.com
      subject: "Thanks — we got your message",
      text: `Hi ${name},

Thanks for getting in touch with PropVisions. We’ve received your message and will get back to you within one business day.

If it’s urgent, just reply to this email and it will reach our support team.

— PropVisions`,
    });

    return res.status(200).json({
      ok: true,
      internal: { id: (internal as any)?.data?.id ?? null, error: (internal as any)?.error ?? null },
      ack:      { id: (ack as any)?.data?.id ?? null, error: (ack as any)?.error ?? null },
    });
  } catch (err: any) {
    console.error("[contact] error:", err);
    return res.status(500).json({ error: err?.message || "Failed to send" });
  }
}
