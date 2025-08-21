// src/pages/api/demo-auth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { parseAllowedKeysFromEnv, extractUserCode, isAllowed } from "@/lib/demoAuth";

const COOKIE_NAME = "ps_demo";
const COOKIE_VALUE = "ok";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST" && req.method !== "GET") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: "method_not_allowed" });
    }

    const { all, lowerSet } = parseAllowedKeysFromEnv();
    if (!all.length) {
      return res.status(500).json({
        ok: false,
        error: "server_not_configured",
        hint: "Set DEMO_ACCESS_KEYS in your environment (comma or space separated)"
      });
    }

    const provided = extractUserCode(req);

    // Diagnostics (safe): only lengths + first/last char — no secrets
    const diag = {
      allowed_keys_count: all.length,
      provided_len: provided ? provided.length : 0,
      provided_preview: provided ? { start: provided[0], end: provided[provided.length - 1] } : null,
      method: req.method,
    };

    if (!provided) {
      return res.status(400).json({ ok: false, error: "missing_code", ...diag });
    }

    if (!isAllowed(provided, lowerSet)) {
      return res.status(401).json({ ok: false, error: "invalid_code", ...diag });
    }

    // Success → set cookie
    const secure = process.env.NODE_ENV === "production";
    // Set-Cookie header (string form for broad compatibility)
    const cookie = [
      `${COOKIE_NAME}=${COOKIE_VALUE}`,
      "Path=/",
      `Max-Age=${COOKIE_MAX_AGE}`,
      "SameSite=Lax",
      secure ? "Secure" : "",
      "HttpOnly"
    ].filter(Boolean).join("; ");

    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ ok: true, message: "granted", ...diag });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: "server_error", detail: String(e?.message || e) });
  }
}
