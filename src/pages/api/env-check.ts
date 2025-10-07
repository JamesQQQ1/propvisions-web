import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    // Supabase
    hasPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasPublicAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Legacy
    has_RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    RESEND_len: (process.env.RESEND_API_KEY || "").length,
    from_email: process.env.CONTACT_FROM_EMAIL || null,
    default_to: process.env.CONTACT_DEFAULT_TO || null,
    sales_to: process.env.CONTACT_SALES_TO || null,
    support_to: process.env.CONTACT_SUPPORT_TO || null,
    env: process.env.VERCEL_ENV || "unknown",
  });
}
