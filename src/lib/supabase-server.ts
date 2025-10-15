// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // SERVER ONLY
  {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'propertyscout-ui' } },
  }
)

// Optional: allow switching the runs table name via env
export const RUNS_TABLE = process.env.RUNS_TABLE || 'pipeline_runs';
