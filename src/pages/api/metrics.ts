import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

type ThumbRow = {
  module: 'rent' | 'refurb' | 'epc' | 'financials';
  vote: 'up' | 'down' | null;
  target_id: string | null;
  property_id: string | null;
  kind: 'thumb' | 'edit' | 'confirm';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const property_id =
    (Array.isArray(req.query.property_id) ? req.query.property_id[0] : req.query.property_id) || null;

  const windowDays =
    Number(Array.isArray(req.query.days) ? req.query.days[0] : req.query.days) || 90;

  const sinceIso = new Date(Date.now() - windowDays * 24 * 3600 * 1000).toISOString();

  let q = supabase
    .from('feedback_events')
    .select('module, vote, target_id, property_id, kind')
    .eq('kind', 'thumb')
    .gte('created_at', sinceIso);

  if (property_id) q = q.eq('property_id', property_id);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });

  const rows = (data || []) as ThumbRow[];

  // Aggregate by module
  const modAgg = new Map<string, { up: number; down: number }>();
  // Aggregate per refurb row
  const roomAgg = new Map<string, { up: number; down: number }>();

  for (const r of rows) {
    const m = r.module as string;
    const v = r.vote;
    if (m && v) {
      if (!modAgg.has(m)) modAgg.set(m, { up: 0, down: 0 });
      const ref = modAgg.get(m)!;
      if (v === 'up') ref.up++;
      if (v === 'down') ref.down++;
    }
    if (r.module === 'refurb' && r.target_id) {
      const k = r.target_id;
      if (!roomAgg.has(k)) roomAgg.set(k, { up: 0, down: 0 });
      const ref = roomAgg.get(k)!;
      if (r.vote === 'up') ref.up++;
      if (r.vote === 'down') ref.down++;
    }
  }

  const rate = (u: number, d: number) => {
    const n = u + d;
    return { n, approval: n ? u / n : null };
  };

  const moduleApproval = Object.fromEntries(
    [...modAgg.entries()].map(([k, v]) => [k, rate(v.up, v.down)])
  );

  const refurbPerRoom = Object.fromEntries(
    [...roomAgg.entries()].map(([k, v]) => [k, rate(v.up, v.down)])
  );

  return res.status(200).json({
    windowDays,
    moduleApproval,   // { rent:{n,approval}, refurb:{...}, epc:{...}, financials:{...} }
    refurbPerRoom,    // { <room_id>:{n,approval} }
    rent_mape: null,
    refurb_mape: null,
    epc_accuracy: null,
  });
}
