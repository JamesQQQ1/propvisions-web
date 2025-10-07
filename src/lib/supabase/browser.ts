// lib/supabase/browser.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

if (process.env.NODE_ENV === 'development') {
  console.info('[Supabase]', { url: url.slice(0, 30), anonKey: anon.slice(0, 8) + '…' });
}

export const supabaseBrowser = createClient(url, anon, {
  auth: { persistSession: true },
  global: { headers: { 'X-Client-Info': 'propertyscout-browser' } },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});
