import type { NextApiRequest, NextApiResponse } from "next";
import { clearAccessCookie, json } from "@/lib/demoAuth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Set-Cookie", clearAccessCookie());
  return json(res, 200, { ok: true });
}
