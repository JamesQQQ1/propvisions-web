// src/pages/api/metrics.ts
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

type FinancialsRow = {
  property_id: string;
  monthly_rent_gbp?: number | null;
  total_refurbishment_gbp?: number | null;
};

type OutcomeRow = {
  property_id: string;
  observed_at: string; // ISO date
  achieved_rent_gbp: number | null;
  refurb_invoice_total_gbp: number | null;
  epc_register_match: boolean | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const property_id =
    (Array.isArray(req.query.property_id) ? req.query.property_id[0] : req.query.property_id) || null;

  const windowDays =
    Number(Array.isArray(req.query.days) ? req.query.days[0] : req.query.days) || 90;

  const sinceIso = new Date(Date.now() - windowDays * 24 * 3600 * 1000).toISOString();

  /* ---------- 1) Thumbs -> module approval ---------- */
  let q = supabase
    .from('feedback_events')
    .select('module, vote, target_id, property_id, kind')
    .eq('kind', 'thumb')
    .gte('created_at', sinceIso);

  if (property_id) q = q.eq('property_id', property_id);

  const { data: thumbData, error: thumbErr } = await q;
  if (thumbErr) return res.status(500).json({ error: thumbErr.message });

  const rows = (thumbData || []) as ThumbRow[];

  const modAgg = new Map<string, { up: number; down: number }>();
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
    // approval is 0..1
  };

  const moduleApproval = Object.fromEntries(
    [...modAgg.entries()].map(([k, v]) => [k, rate(v.up, v.down)])
  );

  const refurbPerRoom = Object.fromEntries(
    [...roomAgg.entries()].map(([k, v]) => [k, rate(v.up, v.down)])
  );

  /* ---------- 2) Outcomes -> accuracy ---------- */
  let oq = supabase
    .from('property_outcomes')
    .select('property_id, observed_at, achieved_rent_gbp, refurb_invoice_total_gbp, epc_register_match')
    .gte('observed_at', sinceIso);

  if (property_id) oq = oq.eq('property_id', property_id);

  const { data: outData, error: outErr } = await oq;
  if (outErr) return res.status(500).json({ error: outErr.message });

  const outs = (outData || []) as OutcomeRow[];
  const ids = Array.from(new Set(outs.map((o) => o.property_id)));

  let finMap = new Map<string, FinancialsRow>();
  if (ids.length) {
    const { data: fins, error: finErr } = await supabase
      .from('property_financials')
      .select('property_id, monthly_rent_gbp, total_refurbishment_gbp')
      .in('property_id', ids);
    if (finErr) return res.status(500).json({ error: finErr.message });
    for (const f of (fins || []) as FinancialsRow[]) finMap.set(f.property_id, f);
  }

  function mape(pred: number[], actual: number[]) {
    const pairs = pred
      .map((p, i) => [p, actual[i]] as const)
      .filter(([p, a]) => Number.isFinite(p) && Number.isFinite(a) && Math.abs(a) > 1e-9);
    if (!pairs.length) return null;
    const err =
      pairs.reduce((acc, [p, a]) => acc + Math.abs((a - p) / a), 0) / pairs.length;
    return err; // 0..1 (e.g., 0.18 = 18%)
  }

  // Rent MAPE
  const rentPred: number[] = [];
  const rentAct: number[] = [];

  // Refurb MAPE
  const refPred: number[] = [];
  const refAct: number[] = [];

  // EPC accuracy
  let epcYes = 0;
  let epcNo = 0;

  for (const o of outs) {
    const f = finMap.get(o.property_id);
    if (o.achieved_rent_gbp != null && f?.monthly_rent_gbp != null) {
      rentPred.push(Number(f.monthly_rent_gbp));
      rentAct.push(Number(o.achieved_rent_gbp));
    }
    if (o.refurb_invoice_total_gbp != null && f?.total_refurbishment_gbp != null) {
      refPred.push(Number(f.total_refurbishment_gbp));
      refAct.push(Number(o.refurb_invoice_total_gbp));
    }
    if (typeof o.epc_register_match === 'boolean') {
      o.epc_register_match ? epcYes++ : epcNo++;
    }
  }

  const rent_mape = mape(rentPred, rentAct);         // 0..1 or null
  const refurb_mape = mape(refPred, refAct);         // 0..1 or null
  const epc_accuracy =
    epcYes + epcNo > 0 ? epcYes / (epcYes + epcNo) : null; // 0..1 or null

  return res.status(200).json({
    windowDays,
    moduleApproval,   // { rent:{n,approval}, refurb:{...}, epc:{...}, financials:{...} }
    refurbPerRoom,    // { <room_id>:{n,approval} }
    rent_mape,
    refurb_mape,
    epc_accuracy,
  });
}
