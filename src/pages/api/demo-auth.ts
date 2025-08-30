// src/pages/api/demo-auth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

type Resp =
  | { ok: true }
  | { error: "method_not_allowed" | "missing_code" | "invalid_code" | "server_missing_demo_codes" };

function parseAllowedKeysFromEnv(): { all: string[]; lowerSet: Set<string> } {
  // Primary envs
  const rawPrimary =
    process.env.DEMO_ACCESS_KEYS ||
    process.env.NEXT_PUBLIC_DEMO_ACCESS_KEYS ||
    "";

  // Back-compat: also allow DEMO_CODE / DEMO_CODES
  const single = (process.env.DEMO_CODE || "").trim();
  const multi = (process.env.DEMO_CODES || "").trim();

  const list = [
    ...rawPrimary.split(/[,\s]+/g).map(s => s.trim()),
    ...multi.split(/[,\s]+/g).map(s => s.trim()),
    single,
  ].filter(Boolean);

  const dedup = Array.from(new Set(list));
  const lowerSet = new Set(dedup.map(s => s.toLowerCase()));
  return { all: dedup, lowerSet };
}

function safeJsonParse(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}

/** Accepts code from JSON body, query, or x-demo-code header. */
function extractUserCode(req: NextApiRequest): string | null {
  const headerCode = (req.headers["x-demo-code"] as string | undefined)?.trim() || "";

  const bodyRaw = typeof req.body === "string" ? safeJsonParse(req.body) : (req.body || {});
  const bodyCode = String(bodyRaw?.code ?? bodyRaw?.accessCode ?? bodyRaw?.key ?? "").trim();

  const q = req.query || {};
  const queryCode = String((q.code ?? q.accessCode ?? q.key) ?? "").trim();

  return [headerCode, bodyCode, queryCode].find(Boolean) || null;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { all, lowerSet } = parseAllowedKeysFromEnv();
  if (!all.length) {
    return res.status(500).json({ error: "server_missing_demo_codes" });
  }

  const code = extractUserCode(req);
  if (!code) {
    return res.status(400).json({ error: "missing_code" });
  }

  const ok = lowerSet.has(code.toLowerCase());
  if (!ok) {
    return res.status(401).json({ error: "invalid_code" });
  }

  const isProd = process.env.NODE_ENV === "production";
  const cookie = serialize("ps_demo", "ok", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    sameSite: "lax",
    secure: isProd, // allow on localhost
  });

  res.setHeader("Set-Cookie", cookie);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ ok: true });
}
