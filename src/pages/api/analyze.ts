// src/pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

/** ---------- Env ---------- */
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL // e.g. https://jamesqqq.app.n8n.cloud/webhook-test/analyse
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEMO_DAILY_LIMIT = Number(process.env.DEMO_DAILY_LIMIT ?? 3)

// tiny duplicate-click window: if the last request was under this ago, ignore second one
const MIN_GAP_MS = Number(process.env.DEMO_MIN_GAP_MS ?? 900)

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars')
}

const supabase = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
  auth: { persistSession: false },
})

type UsageRow = {
  id: number
  ip_hash: string
  day: string
  count: number
  last_at: string | null
  ua: string | null
  limit_override?: number | null
}

type UsagePayload = {
  count: number
  limit: number
  remaining: number
}

function getClientIp(req: NextApiRequest) {
  const xff = (req.headers['x-forwarded-for'] || '') as string
  const ip =
    xff.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    (req.socket.remoteAddress || '').replace('::ffff:', '')
  return ip || '0.0.0.0'
}

function hashIp(ip: string) {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!N8N_WEBHOOK_URL) return res.status(500).json({ error: 'N8N webhook not configured' })

  const { url } = (req.body ?? {}) as { url?: string }
  if (!url) return res.status(400).json({ error: 'Missing `url`' })

  const ip = getClientIp(req)
  const ip_hash = hashIp(ip)
  const day = new Date().toISOString().slice(0, 10)
  const ua = String(req.headers['user-agent'] || '')
  const nowIso = new Date().toISOString()

  // 1) ensure usage row exists (count is NOT incremented here)
  let usageRow: UsageRow | null = null
  {
    const sel = await supabase
      .from<UsageRow>('demo_usage')
      .select('*')
      .eq('ip_hash', ip_hash)
      .eq('day', day)
      .maybeSingle()

    if (sel.error) return res.status(500).json({ error: 'Usage read failed' })

    if (!sel.data) {
      const ins = await supabase
        .from<UsageRow>('demo_usage')
        .insert({ ip_hash, day, count: 0, ua, last_at: null })
        .select('*')
        .single()
      if (ins.error) return res.status(500).json({ error: 'Usage init failed' })
      usageRow = ins.data
    } else {
      usageRow = sel.data
    }
  }

  const effectiveLimit = usageRow?.limit_override ?? DEMO_DAILY_LIMIT
  const alreadyUsed = usageRow?.count ?? 0

  // small debounce: if last_at < MIN_GAP_MS ago, refuse without increment
  if (usageRow?.last_at) {
    const delta = Date.now() - new Date(usageRow.last_at).getTime()
    if (delta >= 0 && delta < MIN_GAP_MS) {
      const usage: UsagePayload = {
        count: alreadyUsed,
        limit: effectiveLimit,
        remaining: Math.max(0, effectiveLimit - alreadyUsed),
      }
      return res.status(429).json({ error: 'Please wait a moment before trying again', usage })
    }
  }

  // if at/over limit, block without increment
  if (alreadyUsed >= effectiveLimit) {
    const usage: UsagePayload = {
      count: alreadyUsed,
      limit: effectiveLimit,
      remaining: 0,
    }
    return res.status(429).json({ error: 'Daily demo limit reached', usage })
  }

  // 2) kick workflow first
  let kickoffJson: any
  try {
    const wfRes = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const bodyText = await wfRes.text()
    try {
      kickoffJson = bodyText ? JSON.parse(bodyText) : {}
    } catch {
      if (!wfRes.ok) {
        const usage: UsagePayload = {
          count: alreadyUsed,
          limit: effectiveLimit,
          remaining: Math.max(0, effectiveLimit - alreadyUsed),
        }
        return res.status(502).json({ error: `Workflow failed: ${bodyText.slice(0, 200)}`, usage })
      }
      kickoffJson = {}
    }
    if (!wfRes.ok) {
      const usage: UsagePayload = {
        count: alreadyUsed,
        limit: effectiveLimit,
        remaining: Math.max(0, effectiveLimit - alreadyUsed),
      }
      return res.status(502).json({ error: kickoffJson?.error || 'Workflow failed to start', usage })
    }
  } catch {
    const usage: UsagePayload = {
      count: alreadyUsed,
      limit: effectiveLimit,
      remaining: Math.max(0, effectiveLimit - alreadyUsed),
    }
    return res.status(502).json({ error: 'Could not reach workflow', usage })
  }

  // 3) pull run_id + execution_id from n8n response
  const run_id: string | undefined = kickoffJson?.run_id
  const execution_id: string | undefined = kickoffJson?.execution_id

  if (!run_id || !execution_id) {
    const usage: UsagePayload = {
      count: alreadyUsed,
      limit: effectiveLimit,
      remaining: Math.max(0, effectiveLimit - alreadyUsed),
    }
    return res.status(502).json({ error: 'Workflow did not return run_id/execution_id', usage })
  }

  // 4) increment AFTER acceptance (and refresh last_at)
  {
    const upd = await supabase
      .from<UsageRow>('demo_usage')
      .update({
        count: alreadyUsed + 1,
        last_at: nowIso,
        ua,
      })
      .eq('ip_hash', ip_hash)
      .eq('day', day)
      .select('*')
      .single()

    if (upd.error) {
      const usage: UsagePayload = {
        count: alreadyUsed,
        limit: effectiveLimit,
        remaining: Math.max(0, effectiveLimit - alreadyUsed),
      }
      return res.status(500).json({ error: 'Usage increment failed', usage })
    }
    usageRow = upd.data
  }

  const usage: UsagePayload = {
    count: usageRow!.count,
    limit: effectiveLimit,
    remaining: Math.max(0, effectiveLimit - usageRow!.count),
  }

  return res.status(200).json({
    run_id,
    execution_id,
    status: 'accepted',
    usage,
  })
}
