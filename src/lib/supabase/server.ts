// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

export const supabaseServer = createClient(url, key, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'propertyscout-server' } },
});

// Legacy alias for existing code
export const supabaseAdmin = supabaseServer;
