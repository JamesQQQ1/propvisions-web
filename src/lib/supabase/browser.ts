// lib/supabase/browser.ts
import { createClient } from '@supabase/supabase-js';

export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (browser).');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[Supabase FE]', { urlPrefix: url.slice(0, 30), anonPrefix: anon.slice(0, 8) + '…' });
  }

  return createClient(url, anon, {
    auth: { persistSession: true },
    global: { headers: { 'X-Client-Info': 'propertyscout-browser' } },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });
}
