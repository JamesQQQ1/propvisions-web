// src/pages/api/demo-auth.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { isValidKey, getAllowedKeys } from '@/lib/demoAuth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  const { key, next = '/demo' } = body

  if (typeof key !== 'string' || !key.trim()) {
    return res.status(400).json({ error: 'missing_key' })
  }

  // Debug count only (no secrets)
  console.log('[demo-auth] allowed_keys_count=', getAllowedKeys().length)

  if (!isValidKey(key)) {
    return res.status(401).json({ error: 'invalid_key' })
  }

  // Set cookie manually via header (works in pages/api)
  const cookieParts = [
    `demo_session=${encodeURIComponent('ok')}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${(Number(process.env.DEMO_SESSION_TTL_DAYS || '7') || 7) * 86400}`,
  ]
  if (process.env.DEMO_COOKIE_DOMAIN?.trim()) {
    cookieParts.push(`Domain=${process.env.DEMO_COOKIE_DOMAIN!.trim()}`)
  }
  res.setHeader('Set-Cookie', cookieParts.join('; '))

  return res.status(200).json({ ok: true, next })
}
