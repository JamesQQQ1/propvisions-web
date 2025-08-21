// src/pages/api/demo-debug.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { extractCode, getValidKeys } from '@/lib/demoAuth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const keys = getValidKeys()
  const preview = keys.slice(0, 3).map(k => ({ len: k.length, start: k[0], end: k[k.length - 1] }))
  let body: any = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch {} }
  const provided = extractCode(body)
  const matches = provided ? keys.includes(provided.toLowerCase()) : null

  res.status(200).json({
    ok: true,
    allowed_keys_count: keys.length,
    preview,
    provided_raw: provided ?? null,
    provided_len: provided?.length ?? null,
    matches,
    accepted_fields: ['code','accessCode','access_code','access-key','accessKey','key'],
    note: 'If allowed_keys_count is 0 here, set DEMO_ACCESS_KEYS in Vercel Project → Settings → Environment Variables and redeploy.',
  })
}
