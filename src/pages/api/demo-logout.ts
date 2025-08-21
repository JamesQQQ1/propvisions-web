// pages/api/demo-logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Set-Cookie', [
    `demo_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  ]);
  return res.status(200).json({ ok: true });
}
