import type { NextApiRequest, NextApiResponse } from 'next'
import { getAllowedKeys, isValidKey } from '@/lib/demoAuth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const keys = getAllowedKeys()
  const sample = (req.query.sample as string) || ''
  res.status(200).json({
    ok: true,
    allowed_keys_count: keys.length,
    preview: keys.slice(0, 5).map(k => ({ len: k.length, start: k[0], end: k[k.length - 1] })),
    sample_provided: sample || null,
    sample_matches: sample ? isValidKey(sample) : null,
  })
}
