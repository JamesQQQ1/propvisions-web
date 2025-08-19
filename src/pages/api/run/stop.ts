// src/pages/api/stop.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Optional: if you have an n8n API key, we can ask n8n to stop immediately.
const N8N_BASE_URL = process.env.N8N_BASE_URL // e.g. https://jamesqqq.app.n8n.cloud
const N8N_API_KEY  = process.env.N8N_API_KEY  // Personal API Key from n8n (User Settings)

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { run_id, execution_id } = (req.body ?? {}) as { run_id?: string; execution_id?: string }
  if (!run_id && !execution_id) return res.status(400).json({ error: 'Missing run_id or execution_id' })

  // 1) Try to stop in n8n (if configured)
  let n8nStopped: boolean | undefined
  if (N8N_BASE_URL && N8N_API_KEY && execution_id) {
    try {
      const resp = await fetch(`${N8N_BASE_URL}/rest/executions-current/${encodeURIComponent(execution_id)}/stop`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Accept': 'application/json',
        },
      })
      n8nStopped = resp.ok
    } catch {
      n8nStopped = false
    }
  }

  // 2) Set cancel flag in DB so “Check Cancel” nodes short-circuit
  let cancelFlagged: boolean | undefined
  if (supabase && run_id) {
    const { error } = await supabase
      .from('runs')
      .update({ cancel_requested: true })
      .eq('run_id', run_id)

    cancelFlagged = !error
  }

  return res.status(200).json({
    ok: true,
    n8nStopped: n8nStopped ?? null,
    cancelFlagged: cancelFlagged ?? null,
    message: n8nStopped
      ? 'Stop requested in n8n and cancel flag set.'
      : 'Cancel flag set; n8n stop not called or not configured.',
  })
}
