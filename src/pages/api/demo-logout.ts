import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Clear the demo access cookie
  res.setHeader(
    "Set-Cookie",
    "demoAccessToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
  );
  return res.status(200).json({ ok: true });
}
