// src/pages/api/demo-logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

const COOKIE_NAME = 'demo_session';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookie = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // expire immediately
  });
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true });
}
