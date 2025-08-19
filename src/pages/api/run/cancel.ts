// src/pages/api/run/cancel.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { run_id } = (req.body ?? {}) as { run_id?: string }
  if (!run_id) return res.status(400).json({ error: 'Missing run_id' })

  const { data, error } = await supabase
    .from('runs')
    .update({ cancel_requested: true, updated_at: new Date().toISOString() })
    .eq('run_id', run_id)
    .select('run_id, cancel_requested')
    .maybeSingle()

  if (error) return res.status(500).json({ error: 'DB update failed' })
  if (!data) return res.status(404).json({ error: 'run_id not found' })
  return res.status(200).json({ ok: true, run_id: data.run_id, cancel_requested: data.cancel_requested })
}
