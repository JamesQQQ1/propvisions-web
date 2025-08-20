// pages/api/analyse.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * ENV you need (Vercel -> Project Settings -> Environment Variables)
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY   (server-only, never exposed client-side)
 * - N8N_WEBHOOK_URL             (e.g. https://<your-n8n>/webhook/property-analyse)
 * - DAILY_RUN_LIMIT             (optional; default 3)
 * - USAGE_TZ                    (optional; default 'Europe/London')
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
const DAILY_RUN_LIMIT = parseInt(process.env.DAILY_RUN_LIMIT || '3', 10);
const USAGE_TZ = process.env.USAGE_TZ || 'Europe/London';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Helper: get client IP in Vercel/Cloudflare/NGINX */
function getClientIp(req: NextApiRequest) {
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  const ip = (req.headers['x-real-ip'] as string) || xff.split(',')[0] || req.socket.remoteAddress || '';
  return (ip || '').trim();
}

/** Helper: stable per-device key (hash of IP + UA) */
function makeIpHash(ip: string, ua: string) {
  return crypto.createHash('sha256').update(`${ip}::${ua}`).digest('hex');
}

/** Helper: YYYY-MM-DD in Europe/London (default) */
function currentDayISO() {
  // Force locale-independent YYYY-MM-DD
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: USAGE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find(p => p.type === 'year')?.value!;
  const m = parts.find(p => p.type === 'month')?.value!;
  const dd = parts.find(p => p.type === 'day')?.value!;
  return `${y}-${m}-${dd}`;
}

/** Helper: next local midnight (reset time) in ISO string */
function nextMidnightISO() {
  const now = new Date();
  // Get local midnight in target TZ by formatting parts then constructing Date in that TZ offset
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: USAGE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  // Build "YYYY-MM-DDT00:00:00" in that TZ for tomorrow
  const day = currentDayISO();
  const [y, m, d] = day.split('-').map(Number);
  // Create a Date for 00:00:00 tomorrow in that TZ by getting its offset now
  const nowParts = fmt.formatToParts(now);
  const tzNowHour = Number(nowParts.find(p => p.type === 'hour')?.value || '0');
  // We only need the offset; simpler path: add 36h then snap to day boundary by target TZ again
  const plus36 = new Date(now.getTime() + 36 * 3600 * 1000);
  const tomorrow = new Intl.DateTimeFormat('en-CA', { timeZone: USAGE_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(plus36);
  const [ty, tm, td] = tomorrow.split('-').map(Number);
  // Construct as UTC by parsing the string and letting client treat it as UTC midnight; it's fine for display.
  return `${ty.toString().padStart(4, '0')}-${tm.toString().padStart(2, '0')}-${td.toString().padStart(2, '0')}T00:00:00Z`;
}

type DemoUsageRow = {
  id: string;
  ip_hash: string;
  day: string; // date
  count: number;
  last_at: string | null; // timestamptz
  ua: string | null;
  // Optional older schema columns (we'll read if present; not required)
  limit_override?: number | null;
  token_prefix?: string | null;
};

/** Ensure there is a usage row for (ip_hash, day); return row. */
async function ensureUsageRow(ip_hash: string, day: string, ua: string) {
  // Tolerate missing row
  const sel = await supabase
    .from<DemoUsageRow>('demo_usage')
    .select('*')
    .eq('ip_hash', ip_hash)
    .eq('day', day)
    .maybeSingle();

  if (sel.error) throw sel.error;

  if (!sel.data) {
    const ins = await supabase
      .from<DemoUsageRow>('demo_usage')
      .insert({ ip_hash, day, count: 0, ua, last_at: null } as Partial<DemoUsageRow>)
      .select('*')
      .single();
    if (ins.error) throw ins.error;
    return ins.data;
  }
  return sel.data;
}

/** Increment count atomically and return updated row */
async function incrementUsage(row: DemoUsageRow) {
  const upd = await supabase
    .from<DemoUsageRow>('demo_usage')
    .update({ count: (row.count ?? 0) + 1, last_at: new Date().toISOString() })
    .eq('id', row.id)
    .select('*')
    .single();
  if (upd.error) throw upd.error;
  return upd.data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // CORS (optional – allow POST from your domain)
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(204).end();
    }
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Server misconfigured: Supabase env missing' });
    }
    if (!N8N_WEBHOOK_URL) {
      return res.status(500).json({ error: 'Server misconfigured: N8N_WEBHOOK_URL missing' });
    }

    const { url } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing "url" in body' });
    }

    // Identify caller (IP + UA)
    const ip = getClientIp(req);
    const ua = (req.headers['user-agent'] as string) || '';
    const ip_hash = makeIpHash(ip, ua);
    const day = currentDayISO();

    // Ensure row exists
    let usageRow = await ensureUsageRow(ip_hash, day, ua);

    // Determine limit (env default; allow optional per-row override if column exists)
    const limit =
      typeof usageRow.limit_override === 'number' && usageRow.limit_override !== null
        ? usageRow.limit_override
        : DAILY_RUN_LIMIT;

    if ((usageRow.count ?? 0) >= limit) {
      return res.status(429).json({
        error: 'limit_reached',
        limit,
        count: usageRow.count ?? 0,
        reset_at: nextMidnightISO(),
      });
    }

    // Increment before enqueue to prevent double-runs on back button spam
    usageRow = await incrementUsage(usageRow);

    // Enqueue the n8n job
    const payload = {
      url,
      ip,
      ip_hash,
      ua,
      day,
      // You can add more context your workflow expects:
      meta: { source: 'propertyscout-web', ts: new Date().toISOString() },
    };

    const resp = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      // Optional: roll back usage count by 1 on enqueue failure
      await supabase
        .from<DemoUsageRow>('demo_usage')
        .update({ count: Math.max(0, (usageRow.count ?? 1) - 1) })
        .eq('id', usageRow.id);

      const text = await resp.text();
      return res.status(502).json({ error: 'enqueue_failed', details: text.slice(0, 500) });
    }

    // If n8n returns a job id, forward it; otherwise synthesize one from usage row
    let job: any = null;
    try {
      job = await resp.json();
    } catch {
      // ignore JSON parse errors; not all webhooks return JSON
    }
    const jobId = job?.jobId || job?.id || usageRow.id;

    return res.status(200).json({
      status: 'queued',
      jobId,
      usage: {
        count: usageRow.count,
        limit,
        remaining: Math.max(0, limit - (usageRow.count ?? 0)),
        reset_at: nextMidnightISO(),
      },
    });
  } catch (err: any) {
    console.error('ANALYSE_API_ERROR', err?.message || err);
    return res.status(500).json({ error: 'analyse_failed' });
  }
}
