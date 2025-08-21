// src/pages/api/demo-logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

const COOKIE_NAME = 'demo_session';
const COOKIE_DOMAIN = process.env.DEMO_COOKIE_DOMAIN; // e.g. .propvisions.com

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookie = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  });
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true });
}
