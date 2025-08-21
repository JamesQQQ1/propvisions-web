// src/pages/api/run/demo-debug.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { parseAllowedKeysFromEnv, extractUserCode, isAllowed } from "@/lib/demoAuth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { all, lowerSet } = parseAllowedKeysFromEnv();
  const provided = extractUserCode(req);
  const matches = provided ? isAllowed(provided, lowerSet) : null;

  res.status(200).json({
    ok: true,
    keys_loaded: all.length,
    keys_preview: all.map(k => ({ len: k.length, start: k[0], end: k[k.length - 1] })),
    provided_len: provided ? provided.length : 0,
    provided_preview: provided ? { start: provided[0], end: provided[provided.length - 1] } : null,
    matches,
    note: "Pass ?code=... or header x-demo-code to test.",
  });
}
