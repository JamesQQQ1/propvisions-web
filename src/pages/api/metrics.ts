// src/pages/api/metrics.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

type ModuleStat = { n: number; approval: number | null };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  const days = clampInt(parseInt((req.query.days as string) ?? '90', 10), 1, 365);
  const propertyId = (req.query.property_id as string) || null;
  const sinceIso = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  try {
    // 1) Thumbs-based module approval from feedback_events
    const { data: fbRows, error: fbErr } = await supabase
      .from('feedback_events')
      .select('module, vote, target_id, property_id, kind, created_at')
      .eq('kind', 'thumb')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false });
    if (fbErr) throw fbErr;

    // Filter by property if requested
    const fb = (propertyId ? fbRows?.filter(r => r.property_id === propertyId) : fbRows) || [];

    const base: Record<'rent'|'refurb'|'epc'|'financials', { up: number; down: number }> = {
      rent: { up: 0, down: 0 },
      refurb: { up: 0, down: 0 },
      epc: { up: 0, down: 0 },
      financials: { up: 0, down: 0 },
    };
    const bucketRoom = new Map<string, { up: number; down: number }>();

    for (const r of fb as any[]) {
      const m = r.module as keyof typeof base;
      const v = r.vote as 'up' | 'down' | null;
      if (!m || !v) continue;
      base[m][v] += 1;
      if (m === 'refurb' && r.target_id) {
        const k = r.target_id as string;
        if (!bucketRoom.has(k)) bucketRoom.set(k, { up: 0, down: 0 });
        if (v === 'up') bucketRoom.get(k)!.up += 1;
        if (v === 'down') bucketRoom.get(k)!.down += 1;
      }
    }

    const rate = (u: number, d: number): ModuleStat => {
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

    // 2) Outcomes-backed metrics (optional)
    // Rent MAPE: requires achieved_rent_gbp and a predicted rent to compare.
    // For now, we assume you log predicted mid-rent into property_outcomes.predicted_rent_gbp (if you have it).
    // If you don't have it yet, we'll return null and the dashboard will use approval% fallback.
    let rent_mape: number | null = null;

    {
      const selCols = 'achieved_rent_gbp, predicted_rent_gbp, observed_at, property_id';
      let q = supabase
        .from('property_outcomes')
        .select(selCols)
        .not('achieved_rent_gbp', 'is', null)
        .not('predicted_rent_gbp', 'is', null)
        .gte('observed_at', sinceIso);

      if (propertyId) q = q.eq('property_id', propertyId);

      const { data: outRows, error: outErr } = await q;
      if (outErr) {
        // don't throw; outcomes are optional
        console.warn('[metrics] outcomes rent query error', outErr.message);
      } else if (outRows && outRows.length) {
        const pairs = (outRows as any[]).filter(r =>
          Number.isFinite(r.achieved_rent_gbp) && Number.isFinite(r.predicted_rent_gbp)
        );
        if (pairs.length) {
          const mape = average(
            pairs.map((r) => {
              const A = Math.max(1e-9, +r.achieved_rent_gbp);
              const P = Math.max(1e-9, +r.predicted_rent_gbp);
              return Math.abs(P - A) / A;
            })
          );
          rent_mape = mape; // 0..1
        }
      }
    }

    // EPC accuracy: share of rows with epc_register_match = true
    let epc_accuracy: number | null = null;
    {
      let q = supabase
        .from('property_outcomes')
        .select('epc_register_match, observed_at, property_id')
        .not('epc_register_match', 'is', null)
        .gte('observed_at', sinceIso);

      if (propertyId) q = q.eq('property_id', propertyId);

      const { data: epcRows, error: epcErr } = await q;
      if (epcErr) {
        console.warn('[metrics] outcomes epc query error', epcErr.message);
      } else if (epcRows && epcRows.length) {
        const n = epcRows.length;
        const correct = epcRows.filter((r: any) => !!r.epc_register_match).length;
        epc_accuracy = n ? correct / n : null;
      }
    }

    // Refurb MAPE (if you later log invoices with predicted totals)
    // Here we look for refurb_invoice_total_gbp and predicted_refurb_total_gbp.
    let refurb_mape: number | null = null;
    {
      let q = supabase
        .from('property_outcomes')
        .select('refurb_invoice_total_gbp, predicted_refurb_total_gbp, observed_at, property_id')
        .not('refurb_invoice_total_gbp', 'is', null)
        .not('predicted_refurb_total_gbp', 'is', null)
        .gte('observed_at', sinceIso);

      if (propertyId) q = q.eq('property_id', propertyId);

      const { data: rr, error: rErr } = await q;
      if (rErr) {
        console.warn('[metrics] refurb mape query error', rErr.message);
      } else if (rr && rr.length) {
        const pairs = (rr as any[]).filter(r =>
          Number.isFinite(r.refurb_invoice_total_gbp) && Number.isFinite(r.predicted_refurb_total_gbp)
        );
        if (pairs.length) {
          const mape = average(
            pairs.map((r) => {
              const A = Math.max(1e-9, +r.refurb_invoice_total_gbp);
              const P = Math.max(1e-9, +r.predicted_refurb_total_gbp);
              return Math.abs(P - A) / A;
            })
          );
          refurb_mape = mape;
        }
      }
    }

    return res.status(200).json({
      windowDays: days,
      moduleApproval,
      refurbPerRoom,
      rent_mape,
      refurb_mape,
      epc_accuracy,
    });
  } catch (e: any) {
    console.error('metrics error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

function clampInt(v: number, lo: number, hi: number) {
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}
function average(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
}
