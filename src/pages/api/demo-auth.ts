// src/pages/api/demo-auth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { verifySession, signSession } from '@/lib/demoAuth';

const COOKIE_NAME = 'demo_session';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method || 'GET';

  // -------- GET /api/demo-auth  ->  status check (used by the client page) --------
  if (method === 'GET') {
    const token = req.cookies[COOKIE_NAME];
    const session = verifySession(token);
    if (!session) return res.status(401).json({ ok: false, error: 'unauthorized' });
    return res.status(200).json({ ok: true, session });
  }

  // -------- POST /api/demo-auth  ->  set cookie if key matches --------
  if (method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const key = (body?.key || '').toString().trim();

    const raw = (process.env.DEMO_ACCESS_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
    const valid = new Set(raw);
    if (!key || !valid.has(key)) {
      return res.status(401).json({ error: 'invalid_key' });
    }

    const ttlDays = parseInt(process.env.DEMO_SESSION_TTL_DAYS || '7', 10);
    const maxAge = ttlDays * 24 * 60 * 60;

    const token = signSession({ key }); // signed JWS
    res.setHeader('Set-Cookie', serialize(COOKIE_NAME, token, { ...COOKIE_OPTS, maxAge }));

    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method_not_allowed' });
}
