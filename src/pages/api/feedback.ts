import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      run_id, property_id, module, kind,
      target_id, target_key, vote, value_before, value_after, comment,
    } = req.body || {};

    if (!run_id || !property_id || !module || !kind) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { error } = await supabase.from('feedback_events').insert({
      run_id, property_id, module, kind,
      target_id: target_id ?? null,
      target_key: target_key ?? null,
      vote: vote ?? null,
      value_before: value_before ?? null,
      value_after: value_after ?? null,
      comment: comment ?? null,
    });
    if (error) return res.status(500).json({ error: error.message });

    // Return quick, fresh module-level metrics for this property (last 90 days)
    const metrics = await computeQuickApproval(supabase, property_id, 90);
    return res.status(200).json({ ok: true, metrics });
  } catch (e: any) {
    console.error('feedback error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function computeQuickApproval(client: any, property_id: string, days: number) {
  const sinceIso = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  let q = client
    .from('feedback_events')
    .select('module, vote, target_id, property_id, kind')
    .eq('kind', 'thumb')
    .gte('created_at', sinceIso);

  if (property_id) q = q.eq('property_id', property_id);

  const { data, error } = await q;
  if (error) return null;

  const base = { rent: { up: 0, down: 0 }, refurb: { up: 0, down: 0 }, epc: { up: 0, down: 0 }, financials: { up: 0, down: 0 } };
  const bucketRoom = new Map<string, { up: number; down: number }>();

  for (const r of data as any[]) {
    const m = r.module as keyof typeof base;
    const v = r.vote as 'up' | 'down' | null;
    if (m && v) base[m][v] += 1;
    if (m === 'refurb' && r.target_id) {
      const k = r.target_id as string;
      if (!bucketRoom.has(k)) bucketRoom.set(k, { up: 0, down: 0 });
      if (v === 'up') bucketRoom.get(k)!.up += 1;
      if (v === 'down') bucketRoom.get(k)!.down += 1;
    }
  }

  const rate = (u: number, d: number) => {
    const n = u + d;
    return { n, approval: n ? u / n : null };
  };

  const moduleApproval = {
    rent: rate(base.rent.up, base.rent.down),
    refurb: rate(base.refurb.up, base.refurb.down),
    epc: rate(base.epc.up, base.epc.down),
    financials: rate(base.financials.up, base.financials.down),
  };

  const refurbPerRoom = Object.fromEntries(
    [...bucketRoom.entries()].map(([k, v]) => {
      const n = v.up + v.down;
      return [k, { n, approval: n ? v.up / n : null }];
    })
  );

  return { windowDays: days, moduleApproval, refurbPerRoom };
}
