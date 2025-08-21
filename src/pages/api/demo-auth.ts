// pages/api/demo-auth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSession } from '../../lib/demoAuth';

const RAW_KEYS = process.env.DEMO_ACCESS_KEYS || '';
const KEYS = RAW_KEYS.split(',').map(s => s.trim()).filter(Boolean);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!RAW_KEYS) return res.status(500).json({ error: 'server_missing_demo_keys' });

  const { key } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'missing_key' });

  const ok = KEYS.includes(key);
  if (!ok) return res.status(401).json({ error: 'invalid_key' });

  const token = createSession(key);
  const ttlDays = parseInt(process.env.DEMO_SESSION_TTL_DAYS || '7', 10);
  const maxAge = ttlDays * 24 * 60 * 60;

  res.setHeader('Set-Cookie', [
    `demo_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
  ]);

  return res.status(200).json({ ok: true });
}
