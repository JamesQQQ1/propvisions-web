// src/pages/api/demo-auth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

const DEMO_ACCESS_KEY = process.env.DEMO_ACCESS_KEY || 'letmein';
const COOKIE_NAME = 'demo_session';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { key, next } = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
  if (!key || key !== DEMO_ACCESS_KEY) {
    return res.status(401).json({ error: 'invalid_key' });
  }

  const cookie = serialize(COOKIE_NAME, 'ok', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 6, // 6 hours
  });

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true, next: typeof next === 'string' ? next : '/demo' });
}
