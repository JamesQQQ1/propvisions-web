// --- This seems to just perform the demo usage count, double check. --- \\

// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

type UsageRow = {
  id: string | number;
  ip_hash: string;
  day: string;                // YYYY-MM-DD (DATE)
  count: number | null;
  ua: string | null;
  last_at: string | null;     // timestamptz
  limit_override?: number | null;
};

// ===== ENV =====
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
const DAILY_RUN_LIMIT = parseInt(process.env.DAILY_RUN_LIMIT || '3', 10);
const USAGE_TZ = process.env.USAGE_TZ || 'Europe/London';

// If you want to allow fallback job IDs when n8n doesn't return them, set to "true"
const ALLOW_MISSING_RUN_IDS = (process.env.ALLOW_MISSING_RUN_IDS || 'false').toLowerCase() === 'true';

// ===== SUPABASE (service role; bypasses RLS) =====
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ===== HELPERS =====
function getClientIp(req: NextApiRequest) {
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  const real = (req.headers['x-real-ip'] as string) || '';
  return real || (xff.split(',')[0] || '').trim() || req.socket.remoteAddress || '';
}
function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}
function todayISO() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: USAGE_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}
function nextMidnightISO() {
  // Compute "tomorrow midnight" in USAGE_TZ and return as UTC ISO string
  const now = new Date();
  const localNow = new Date(now.toLocaleString('en-US', { timeZone: USAGE_TZ }));
  const midnight = new Date(localNow);
  midnight.setDate(localNow.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  const offsetMs = localNow.getTime() - now.getTime();
  return new Date(midnight.getTime() - offsetMs).toISOString();
}
async function readJsonLoose(resp: Response): Promise<{obj: any; raw: string}> {
  const raw = await resp.text();
  try { return { obj: JSON.parse(raw), raw }; } catch { return { obj: {}, raw }; }
}

// ===== HANDLER =====
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: 'server_missing_supabase_env' });
    if (!N8N_WEBHOOK_URL) return res.status(500).json({ error: 'server_missing_n8n_webhook' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const url: string | undefined = body?.url;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'missing_url' });

    // Identify caller
    const ua = (req.headers['user-agent'] as string) || '';
    const ip = getClientIp(req) || '';
    const ip_hash = sha256(`${ip}::${ua}`);
    const day = todayISO();

    // === Ensure usage row exists (race-safe) ===
    const upsert = await supabase
      .from<UsageRow>('demo_usage')
      .upsert(
        { ip_hash, day, count: 0, ua },                 // don't set last_at on insert
        { onConflict: 'ip_hash,day', ignoreDuplicates: false }
      )
      .select('*')
      .single();

    if (upsert.error) {
      console.error('USAGE_UPSERT_ERR', upsert.error);
      return res.status(500).json({ error: 'usage_insert_failed', details: upsert.error.message });
    }

    const row = upsert.data!;
    const currentCount = row.count ?? 0;
    const limit = (typeof row.limit_override === 'number' && row.limit_override !== null) ? row.limit_override : DAILY_RUN_LIMIT;

    if (currentCount >= limit) {
      return res.status(429).json({ error: 'limit_reached', limit, count: currentCount, reset_at: nextMidnightISO() });
    }

    // === Increment first (prevents double-submits burning extra runs) ===
    const inc = await supabase
      .from<UsageRow>('demo_usage')
      .update({ count: currentCount + 1, last_at: new Date().toISOString(), ua })
      .eq('ip_hash', ip_hash)
      .eq('day', day)
      .select('*')
      .single();

    if (inc.error) {
      console.error('USAGE_UPDATE_ERR', inc.error);
      return res.status(500).json({ error: 'usage_update_failed', details: inc.error.message });
    }

    const usageNow = inc.data!;

    // === Enqueue n8n (Respond Start should immediately return run_id + execution_id) ===
    const enqueue = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url,
        ip,
        ip_hash,
        ua,
        day,
        source: 'propertyscout-ui',
      }),
    });

    if (!enqueue.ok) {
      const txt = await enqueue.text().catch(() => '');
      // best-effort rollback of one count
      await supabase.from('demo_usage')
        .update({ count: Math.max(0, (usageNow.count ?? 1) - 1) })
        .eq('ip_hash', ip_hash)
        .eq('day', day);
      return res.status(502).json({ error: 'enqueue_failed', details: txt.slice(0, 600) });
    }

    const { obj: job, raw: rawJob } = await readJsonLoose(enqueue);

    // Normalize fields coming back from n8n (support several common shapes)
    const run_id =
      job?.run_id ??
      job?.runId ??
      job?.data?.run_id ??
      job?.data?.runId ??
      null;

    const execution_id =
      job?.execution_id ??
      job?.executionId ??
      job?.data?.execution_id ??
      job?.data?.executionId ??
      null;

    const jobId =
      job?.jobId ??
      job?.id ??
      job?.data?.jobId ??
      job?.data?.id ??
      // final fallback: our own usage row id (only used if ALLOW_MISSING_RUN_IDS is true)
      (ALLOW_MISSING_RUN_IDS ? String(usageNow.id) : null);

    // Require both IDs for your polling flow (unless fallback is explicitly allowed)
    if ((!run_id || !execution_id) && !ALLOW_MISSING_RUN_IDS) {
      return res.status(502).json({
        error: 'n8n_missing_run_ids',
        message: 'Webhook response did not include run_id and/or execution_id as JSON keys.',
        received_keys: Object.keys(job || {}),
        raw: rawJob.slice(0, 800), // aid debugging without huge logs
      });
    }

    // Success payload (keep snake_case + camelCase for compatibility)
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      status: 'queued',
      // canonical snake_case used by your existing polling
      run_id: run_id ?? jobId,
      execution_id: execution_id ?? jobId,
      // mirrors for any newer client code
      runId: run_id ?? jobId,
      executionId: execution_id ?? jobId,
      jobId: jobId ?? undefined,
      usage: {
        count: usageNow.count ?? 0,
        limit,
        remaining: Math.max(0, limit - (usageNow.count ?? 0)),
        reset_at: nextMidnightISO(),
      },
      route: 'analyze.ts',
    });
  } catch (e: any) {
    console.error('ANALYZE_HANDLER_ERR', e?.message || e);
    return res.status(500).json({ error: 'analyse_failed' });
  }
}
