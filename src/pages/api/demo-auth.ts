// src/pages/api/demo-auth.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { isValidKey, getAllowedKeys } from '@/lib/demoAuth'

// Accepts { key } or { code } or { accessKey } or { password }, or "x-demo-key" header.
// Returns keys_count so you can see if the env var was loaded.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {})
  let input =
    (body.key ?? body.code ?? body.accessKey ?? body.password ?? '').toString().trim()

  if (!input && typeof req.headers['x-demo-key'] === 'string') {
    input = (req.headers['x-demo-key'] as string).trim()
  }
  const next = (body.next ?? '/demo').toString()

  const keysCount = getAllowedKeys().length
  console.log('[demo-auth] allowed_keys_count =', keysCount)

  if (!input) {
    return res.status(400).json({ error: 'missing_key', keys_count: keysCount })
  }
  if (!isValidKey(input)) {
    return res.status(401).json({ error: 'invalid_key', keys_count: keysCount })
  }

  // Set cookie (works on pages/api)
  const parts = [
    `demo_session=${encodeURIComponent('ok')}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${(Number(process.env.DEMO_SESSION_TTL_DAYS || '7') || 7) * 86400}`,
  ]
  const domain = process.env.DEMO_COOKIE_DOMAIN?.trim()
  if (domain) parts.push(`Domain=${domain}`)
  res.setHeader('Set-Cookie', parts.join('; '))

  return res.status(200).json({ ok: true, next, keys_count: keysCount })
}

function safeParse(s: string) {
  try { return JSON.parse(s) } catch { return {} }
}
