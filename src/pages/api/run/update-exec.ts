// /pages/api/run/update-exec.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

function norm(v?: string | null) {
  if (!v) return ''
  return String(v).trim().replace(/^=+/, '').replace(/^"+|"+$/g, '')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const raw_run_id = (req.body?.run_id ?? '') as string
    const raw_exec_id = (req.body?.execution_id ?? '') as string
    const status = (req.body?.status ?? 'processing') as string

    const run_id = norm(raw_run_id)
    const execution_id = norm(raw_exec_id)

    if (!/^[0-9a-f-]{36}$/i.test(run_id)) {
      return res.status(400).json({ error: 'Invalid run_id format', raw_run_id })
    }

    // upsert
    const { data, error } = await supabase
      .from('runs')
      .upsert(
        { run_id, execution_id, status, cancel_requested: false },
        { onConflict: 'run_id' }
      )
      .select('*')
      .single()

    if (error) throw error

    // helpful echo for debugging in n8n
    return res.status(200).json({
      ok: true,
      row: data,
      echo: { raw_run_id, run_id, raw_exec_id, execution_id, status },
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'server error' })
  }
}
