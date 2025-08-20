// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

type UsageRow = {
  id: string | number;
  ip_hash: string;
  day: string;          // date
  count: number;
  ua: string | null;
  last_at: string | null;
  limit_override?: number | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
const DAILY_RUN_LIMIT = parseInt(process.env.DAILY_RUN_LIMIT || '3', 10);
const USAGE_TZ = process.env.USAGE_TZ || 'Europe/London';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function getClientIp(req: NextApiRequest) {
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  return (req.headers['x-real-ip'] as string) || xff.split(',')[0] || req.socket.remoteAddress || '';
}
function hash(ip: string, ua: string) {
  return crypto.createHash('sha256').update(`${ip}::${ua}`).digest('hex');
}
function todayISO() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: USAGE_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}
function nextMidnightISO() {
  const plus36 = new Date(Date.now() + 36 * 3600 * 1000);
  const t = new Intl.DateTimeFormat('en-CA', { timeZone: USAGE_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(plus36);
  return `${t}T00:00:00Z`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: 'server_missing_supabase_env' });
    if (!N8N_WEBHOOK_URL) return res.status(500).json({ error: 'server_missing_n8n_webhook' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const url: string | undefined = body?.url;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'missing_url' });

    const ip = getClientIp(req) || '';
    const ua = (req.headers['user-agent'] as string) || '';
    const ip_hash = hash(ip, ua);
    const day = todayISO();

    // ensure usage row exists (tolerate empty table)
    const sel = await supabase.from<UsageRow>('demo_usage')
      .select('*').eq('ip_hash', ip_hash).eq('day', day).maybeSingle();
    if (sel.error) {
      console.error('USAGE_SELECT_ERR', sel.error);
      return res.status(500).json({ error: 'usage_select_failed' });
    }

    let row = sel.data;
    if (!row) {
      const ins = await supabase.from<UsageRow>('demo_usage')
        .insert({ ip_hash, day, count: 0, ua, last_at: null } as Partial<UsageRow>)
        .select('*').single();
      if (ins.error) {
        console.error('USAGE_INSERT_ERR', ins.error);
        return res.status(500).json({ error: 'usage_insert_failed' });
      }
      row = ins.data;
    }

    const limit = typeof row.limit_override === 'number' && row.limit_override !== null ? row.limit_override : DAILY_RUN_LIMIT;
    if ((row.count ?? 0) >= limit) {
      return res.status(429).json({ error: 'limit_reached', limit, count: row.count ?? 0, reset_at: nextMidnightISO() });
    }

    // increment first to avoid double submits
    const upd = await supabase.from<UsageRow>('demo_usage')
      .update({ count: (row.count ?? 0) + 1, last_at: new Date().toISOString() })
      .eq('id', row.id).select('*').single();
    if (upd.error) {
      console.error('USAGE_UPDATE_ERR', upd.error);
      return res.status(500).json({ error: 'usage_update_failed' });
    }

    // queue n8n job
    const resp = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, ip_hash, ua, day, source: 'propertyscout-ui' }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      // best-effort rollback of one count
      await supabase.from('demo_usage').update({ count: Math.max(0, (upd.data!.count ?? 1) - 1) }).eq('id', upd.data!.id);
      return res.status(502).json({ error: 'enqueue_failed', details: text.slice(0, 400) });
    }

    let job: any = null; try { job = await resp.json(); } catch {}
    return res.status(200).json({
      status: 'queued',
      jobId: job?.id || job?.jobId || upd.data!.id,
      usage: { count: upd.data!.count, limit, remaining: Math.max(0, limit - (upd.data!.count ?? 0)), reset_at: nextMidnightISO() },
      route: 'analyze.ts' // helps you confirm you’re hitting the z-route
    });
  } catch (e: any) {
    console.error('ANALYSE_ERR', e?.message || e);
    return res.status(500).json({ error: 'analyse_failed' });
  }
}
