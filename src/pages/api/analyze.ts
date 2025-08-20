// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

type UsageRow = {
  id: string | number;
  ip_hash: string;
  day: string;                // stored as DATE in PG
  count: number | null;
  ua: string | null;
  last_at: string | null;     // timestamptz
  limit_override?: number | null;
};

// ---- ENV ----
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
const DAILY_RUN_LIMIT = parseInt(process.env.DAILY_RUN_LIMIT || '3', 10);
const USAGE_TZ = process.env.USAGE_TZ || 'Europe/London';

// ---- CLIENT (service role; RLS bypass for this table) ----
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ---- HELPERS ----
function getClientIp(req: NextApiRequest) {
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  const real = (req.headers['x-real-ip'] as string) || '';
  return real || (xff.split(',')[0] || '').trim() || req.socket.remoteAddress || '';
}
function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}
function todayISO() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: USAGE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;
  return `${y}-${m}-${d}`; // YYYY-MM-DD
}
function nextMidnightISO() {
  // compute "tomorrow midnight" in USAGE_TZ, return ISO UTC string
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: USAGE_TZ }));
  const midnight = new Date(local);
  midnight.setDate(local.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  // Convert that local wall-clock back to UTC ISO
  const offsetMs = local.getTime() - now.getTime(); // difference local vs system
  const utcGuess = new Date(midnight.getTime() - offsetMs);
  return utcGuess.toISOString();
}

// ---- HANDLER ----
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Basic method/health
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    // Env guards
    if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: 'server_missing_supabase_env' });
    if (!N8N_WEBHOOK_URL) return res.status(500).json({ error: 'server_missing_n8n_webhook' });

    // Parse body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const url: string | undefined = body?.url;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'missing_url' });

    // Identify client (anonymous quota)
    const ip = getClientIp(req) || '';
    const ua = (req.headers['user-agent'] as string) || '';
    const ip_hash = sha256(`${ip}::${ua}`);
    const day = todayISO();

    // Ensure usage row exists (RACE-SAFE via upsert on unique (ip_hash, day))
    const upsert = await supabase
      .from<UsageRow>('demo_usage')
      .upsert(
        { ip_hash, day, count: 0, ua, last_at: null } as Partial<UsageRow>,
        { onConflict: 'ip_hash,day', ignoreDuplicates: false }
      )
      .select('*')
      .single();

    if (upsert.error) {
      console.error('USAGE_UPSERT_ERR', upsert.error);
      return res.status(500).json({ error: 'usage_insert_failed', details: upsert.error.message });
    }

    let row = upsert.data!;
    const currentCount = row.count ?? 0;
    const limit = (typeof row.limit_override === 'number' && row.limit_override !== null)
      ? row.limit_override
      : DAILY_RUN_LIMIT;

    if (currentCount >= limit) {
      return res.status(429).json({
        error: 'limit_reached',
        limit,
        count: currentCount,
        reset_at: nextMidnightISO(),
      });
    }

    // Increment first to reduce double-submits
    const upd = await supabase
      .from<UsageRow>('demo_usage')
      .update({ count: currentCount + 1, last_at: new Date().toISOString() })
      .eq('ip_hash', ip_hash)
      .eq('day', day)
      .select('*')
      .single();

    if (upd.error) {
      console.error('USAGE_UPDATE_ERR', upd.error);
      return res.status(500).json({ error: 'usage_update_failed', details: upd.error.message });
    }

    const updated = upd.data!;
    // Kick n8n job
    const enqueue = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url,
        ip_hash,
        ua,
        day,
        source: 'propertyscout-ui',
      }),
    });

    if (!enqueue.ok) {
      const text = await enqueue.text().catch(() => '');
      // Best-effort rollback one count to avoid burning quota on failed enqueue
      await supabase
        .from('demo_usage')
        .update({ count: Math.max(0, (updated.count ?? 1) - 1) })
        .eq('ip_hash', ip_hash)
        .eq('day', day);
      return res.status(502).json({ error: 'enqueue_failed', details: text.slice(0, 500) });
    }

    let job: any = null;
    try { job = await enqueue.json(); } catch {}

    // Success
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      status: 'queued',
      jobId: job?.id || job?.jobId || updated.id,
      usage: {
        count: updated.count ?? 0,
        limit,
        remaining: Math.max(0, limit - (updated.count ?? 0)),
        reset_at: nextMidnightISO(),
      },
      route: 'analyze.ts',
    });
  } catch (e: any) {
    console.error('ANALYZE_HANDLER_ERR', e?.message || e);
    return res.status(500).json({ error: 'analyse_failed' });
  }
}
