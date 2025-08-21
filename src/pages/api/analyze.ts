// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

type UsageRow = {
  id: number;
  ip_hash: string;
  day: string;         // YYYY-MM-DD
  count: number;
  ua: string | null;
  last_at: string | null;
  limit_override?: number | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
const DAILY_RUN_LIMIT = parseInt(process.env.DAILY_RUN_LIMIT || '3', 10);
const USAGE_TZ = process.env.USAGE_TZ || 'Europe/London';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function getClientIp(req: NextApiRequest) {
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  return (req.headers['x-real-ip'] as string) || xff.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

function hash(ip: string, ua: string) {
  return crypto.createHash('sha256').update(`${ip}::${ua}`).digest('hex');
}

function todayISO() {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: USAGE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return dtf.format(new Date()); // YYYY-MM-DD
}

function nextMidnightISO() {
  // Simple: “36 hours ahead, reset to 00:00Z” gives a safe next midnight window
  const plus36 = new Date(Date.now() + 36 * 3600 * 1000);
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: USAGE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(plus36);
  return `${ymd}T00:00:00Z`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: 'server_missing_supabase_env' });
    if (!N8N_WEBHOOK_URL) return res.status(500).json({ error: 'server_missing_n8n_webhook' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const url: string | undefined = body?.url;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'missing_url' });

    const ua = (req.headers['user-agent'] as string) || '';
    const ip = getClientIp(req) || '';
    const ip_hash = hash(ip, ua);
    const day = todayISO();

    // Fetch existing usage row (if any)
    const sel = await supabase
      .from<UsageRow>('demo_usage')
      .select('*')
      .eq('ip_hash', ip_hash)
      .eq('day', day)
      .maybeSingle();

    if (sel.error) {
      console.error('USAGE_SELECT_ERR', sel.error);
      return res.status(500).json({ error: 'usage_select_failed' });
    }

    let row = sel.data;

    // Use UPSERT to avoid unique-constraint races on (ip_hash, day)
    if (!row) {
      const upsert = await supabase
        .from<UsageRow>('demo_usage')
        .upsert(
          { ip_hash, day, count: 0, ua }, // do NOT set last_at at all; let it be null by default
          { onConflict: 'ip_hash,day' }
        )
        .select('*')
        .single();

      if (upsert.error) {
        console.error('USAGE_UPSERT_ERR', upsert.error);
        return res.status(500).json({ error: 'usage_insert_failed' });
      }
      row = upsert.data;
    }

    // Enforce limit (allow per-row override)
    const limit = (typeof row.limit_override === 'number' && row.limit_override !== null)
      ? row.limit_override
      : DAILY_RUN_LIMIT;

    if ((row.count ?? 0) >= limit) {
      return res.status(429).json({
        error: 'limit_reached',
        limit,
        count: row.count ?? 0,
        reset_at: nextMidnightISO()
      });
    }

    // Increment first to guard against double-submits
    const upd = await supabase
      .from<UsageRow>('demo_usage')
      .update({ count: (row.count ?? 0) + 1, last_at: new Date().toISOString(), ua })
      .eq('id', row.id)
      .select('*')
      .single();

    if (upd.error) {
      console.error('USAGE_UPDATE_ERR', upd.error);
      return res.status(500).json({ error: 'usage_update_failed' });
    }

    // Kick n8n
    const resp = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, ip_hash, ua, day, source: 'propertyscout-ui' })
    });

    if (!resp.ok) {
      const text = await resp.text();
      // Best-effort rollback one count if enqueue fails
      await supabase
        .from('demo_usage')
        .update({ count: Math.max(0, (upd.data!.count ?? 1) - 1) })
        .eq('id', upd.data!.id);
      return res.status(502).json({ error: 'enqueue_failed', details: text.slice(0, 400) });
    }

    let job: any = null;
    try { job = await resp.json(); } catch {}

    return res.status(200).json({
      status: 'queued',
      jobId: job?.id || job?.jobId || upd.data!.id,
      usage: {
        count: upd.data!.count,
        limit,
        remaining: Math.max(0, limit - (upd.data!.count ?? 0)),
        reset_at: nextMidnightISO()
      },
      route: 'analyze.ts'
    });
  } catch (e: any) {
    console.error('ANALYZE_ERR', e?.message || e);
    return res.status(500).json({ error: 'analyze_failed' });
  }
}
