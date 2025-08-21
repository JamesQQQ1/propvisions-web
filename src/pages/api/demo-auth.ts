// src/pages/api/demo-auth.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { extractCode, getValidKeys, isCodeAllowed, json, logDebug, makeAccessCookie } from '@/lib/demoAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'method_not_allowed' })
  }

  // Parse body safely (in case client sent raw string)
  let body: any = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = { _raw: body } }
  }

  const provided = extractCode(body)
  const keys = getValidKeys()
  logDebug('attempt', {
    provided_present: !!provided,
    allowed_keys_count: keys.length,
  })

  if (!keys.length) {
    // Misconfigured env on the server
    return json(res, 500, { ok: false, error: 'server_not_configured', hint: 'Set DEMO_ACCESS_KEYS in Vercel' })
  }

  if (!provided) {
    return json(res, 400, { ok: false, error: 'missing_code', accepted_fields: ['code','accessCode','access_code','access-key','accessKey','key'] })
  }

  if (!isCodeAllowed(provided)) {
    return json(res, 401, { ok: false, error: 'invalid_code' })
  }

  // Success: set cookie
  res.setHeader('Set-Cookie', makeAccessCookie('1'))
  return json(res, 200, { ok: true })
}
