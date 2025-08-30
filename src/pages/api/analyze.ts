// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

type ClaimRow = {
  allowed: boolean;
  remaining: number;
  count: number;
  limit: number;
  day: string; // DATE
};

// ===== ENV =====
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
const DAILY_RUN_LIMIT = parseInt(process.env.DAILY_RUN_LIMIT || '3', 10);

// If you want to allow fallback job IDs when n8n doesn't return them, set to "true"
const ALLOW_MISSING_RUN_IDS =
  (process.env.ALLOW_MISSING_RUN_IDS || 'false').toLowerCase() === 'true';

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
function nextUtcMidnightISO() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return next.toISOString();
}
async function readJsonLoose(resp: Response): Promise<{ obj: any; raw: string }> {
  const raw = await resp.text();
  try {
    return { obj: JSON.parse(raw), raw };
  } catch {
    return { obj: {}, raw };
  }
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

    // === Claim a credit atomically in DB (UTC day) ===
    const { data: claimRows, error: claimErr } = await supabase.rpc('claim_demo_credit', {
      p_ip_hash: ip_hash,
      p_ua: ua,
      p_token_prefix: null,                // pass a token prefix if you actually use it
      p_default_limit: DAILY_RUN_LIMIT,
    });

    if (claimErr) {
      console.error('USAGE_RPC_ERR', claimErr);
      return res.status(500).json({ error: 'usage_claim_failed', details: claimErr.message });
    }

    const claim: ClaimRow = Array.isArray(claimRows) ? claimRows[0] : claimRows;
    if (!claim || typeof claim.allowed !== 'boolean') {
      console.error('USAGE_RPC_BAD_SHAPE', claimRows);
      return res.status(500).json({ error: 'usage_claim_bad_response' });
    }

    if (!claim.allowed) {
      return res.status(429).json({
        error: 'limit_reached',
        limit: claim.limit,
        count: claim.count,
        reset_at: nextUtcMidnightISO(),
      });
    }

    // === Enqueue n8n (should immediately return run/execution IDs) ===
    const enqueue = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url,
        ip,
        ip_hash,
        ua,
        day: claim.day,           // UTC date the credit was claimed against
        source: 'propertyscout-ui',
      }),
    });

    if (!enqueue.ok) {
      const txt = await enqueue.text().catch(() => '');

      // Roll back one credit on failure
      await supabase.rpc('refund_demo_credit', { p_ip_hash: ip_hash }).catch((e) => {
        console.error('USAGE_REFUND_FAIL (enqueue not ok)', e?.message || e);
      });

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
      (ALLOW_MISSING_RUN_IDS ? `${ip_hash}-${claim.day}` : null); // deterministic fallback

    // Require both IDs unless fallback is explicitly allowed
    if ((!run_id || !execution_id) && !ALLOW_MISSING_RUN_IDS) {
      // Roll back one credit if the response is malformed
      await supabase.rpc('refund_demo_credit', { p_ip_hash: ip_hash }).catch((e) => {
        console.error('USAGE_REFUND_FAIL (missing IDs)', e?.message || e);
      });

      return res.status(502).json({
        error: 'n8n_missing_run_ids',
        message: 'Webhook response did not include run_id and/or execution_id as JSON keys.',
        received_keys: Object.keys(job || {}),
        raw: rawJob.slice(0, 800),
      });
    }

    // Success payload (keep snake_case + camelCase for compatibility)
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      status: 'queued',
      run_id: run_id ?? jobId,
      execution_id: execution_id ?? jobId,
      runId: run_id ?? jobId,
      executionId: execution_id ?? jobId,
      jobId: jobId ?? undefined,
      usage: {
        count: claim.count,                 // count after claiming this run
        limit: claim.limit,
        remaining: claim.remaining,
        reset_at: nextUtcMidnightISO(),     // always UTC midnight
      },
      route: 'analyze.ts',
    });
  } catch (e: any) {
    console.error('ANALYZE_HANDLER_ERR', e?.message || e);
    return res.status(500).json({ error: 'analyse_failed' });
  }
}
