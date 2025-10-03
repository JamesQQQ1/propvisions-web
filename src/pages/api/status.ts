// src/pages/api/status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * STATUS ENDPOINT (runs-table canonical)
 * - Accepts ?run_id=... OR ?property_id=...
 * - If run_id is given, resolve property_id from the runs table.
 * - Returns property + refurb_estimates + financials when available.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RUNS_TABLE = process.env.RUNS_TABLE || 'runs'; // <-- change to your table if different

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* ────────── helpers ────────── */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const toStr = (q: string | string[] | undefined) => (Array.isArray(q) ? q[0] : (q ?? ''));
const num = (x: any) => (Number.isFinite(+x) ? +x : 0);
const safeObj = <T = Record<string, unknown>>(x: any, fallback: T): T =>
  x && typeof x === 'object' ? (x as T) : fallback;

/* ────────── table shapes ────────── */
type PropertiesRow = {
  property_id: string;
  property_title?: string | null;
  address?: string | null;
  postcode?: string | null;
  property_type?: string | null;
  tenure?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  receptions?: number | null;

  listing_url?: string | null;
  listing_images?: string[] | null;
  floorplan_urls?: string[] | null;
  epc_image_urls?: string[] | null;

  images_map?: Record<string, string> | null;

  // commercial bits we surface in "financials"
  price_gbp?: number | null;
  guide_price_gbp?: number | null;
  asking_price_gbp?: number | null;
  purchase_price_gbp?: number | null;
  monthly_rent_gbp?: number | null;
  annual_rent_gbp?: number | null;

  // refurbishment totals
  property_total_without_vat?: number | null;
  property_total_with_vat?: number | null;

  // optional blobs we pass through
  scenarios?: any;
  summary?: any;

  // misc we show in PDF later
  property_description?: string | null;
  features?: string[] | null;
  epc_rating_current?: string | null;
  epc_score_current?: number | null;
  epc_rating_potential?: string | null;
  epc_score_potential?: number | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  agent_email?: string | null;
};

type RoomMaterialsRow = {
  id: string;
  property_id: string;
  image_id: string | null;
  room_type: string | null;
  subtotals: {
    all?: { net?: number; vat?: number; gross?: number } | null;
    by_category?: Record<string, { net?: number; vat?: number; gross?: number; lines?: number | null }> | null;
  } | null;
};

type RoomLabourRow = {
  id: string;
  property_id: string;
  image_id: string | null;
  room_type: string | null;
  trade_name: string | null;
  crew_size?: number | null;
  trade_total_hours?: number | null;
  labour_cost_mean_charge?: number | null;
};

type RunsRow = {
  run_id: string;
  property_id: string | null;
  status?: 'queued' | 'processing' | 'completed' | 'failed' | string | null;
  error?: string | null;
};

/* ────────── normalisers ────────── */
function buildRooms(
  mats: RoomMaterialsRow[],
  labs: RoomLabourRow[],
  property: PropertiesRow | null
) {
  const map = new Map<
    string,
    { image_id: string | null; room_type: string | null; materials_rows: RoomMaterialsRow[]; labour_rows: RoomLabourRow[] }
  >();
  const keyOf = (image_id: string | null | undefined, room_type: string | null | undefined) =>
    `${image_id ?? '-'}|${(room_type ?? '').toLowerCase()}`;

  for (const r of mats) {
    const k = keyOf(r.image_id, r.room_type);
    if (!map.has(k)) map.set(k, { image_id: r.image_id ?? null, room_type: r.room_type ?? null, materials_rows: [], labour_rows: [] });
    map.get(k)!.materials_rows.push(r);
  }
  for (const r of labs) {
    const k = keyOf(r.image_id, r.room_type);
    if (!map.has(k)) map.set(k, { image_id: r.image_id ?? null, room_type: r.room_type ?? null, materials_rows: [], labour_rows: [] });
    map.get(k)!.labour_rows.push(r);
  }

  const out: any[] = [];
  Array.from(map.values()).forEach((agg, idx) => {
    const matLines: any[] = [];
    let matGross = 0, matNet = 0, matVat = 0;

    for (const m of agg.materials_rows) {
      const st = safeObj(m.subtotals, {});
      const all = safeObj(st.all, {});
      matGross += num(all.gross);
      matNet += num(all.net);
      matVat += num(all.vat);

      const cats = safeObj(st.by_category, {} as NonNullable<RoomMaterialsRow['subtotals']>['by_category']);
      for (const [cat, vals] of Object.entries(cats)) {
        const gross = num((vals as any)?.gross);
        if (gross > 0) matLines.push({ item_key: cat.replace(/_/g, ' '), subtotal_gbp: gross });
      }
    }

    const labLines: any[] = [];
    let labourTotal = 0;
    for (const l of agg.labour_rows) {
      const cost = num(l.labour_cost_mean_charge);
      labourTotal += cost;
      labLines.push({
        trade_key: l.trade_name || 'Labour',
        crew_size: l.crew_size ?? 1,
        total_hours: l.trade_total_hours ?? null,
        labour_cost_gbp: cost,
      });
    }

    const roomTotalGross = num(matGross) + num(labourTotal);
    const niceType = (agg.room_type || '')?.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) || null;

    out.push({
      id: `room-${idx}`,
      image_id: agg.image_id ?? null,
      image_url: null, // (optional) map via images_map if you want
      room_type: niceType,
      detected_room_type: niceType,
      materials: matLines.length ? matLines : null,
      labour: labLines.length ? labLines : null,
      materials_total_gbp: matNet || matGross || null,
      materials_total_with_vat_gbp: matGross || null,
      labour_total_gbp: labourTotal || null,
      room_total_gbp: roomTotalGross || null,
      room_total_with_vat_gbp: roomTotalGross || null,
    });
  });

  // sort lightly
  const order = ['kitchen', 'bathroom', 'living', 'sitting', 'bedroom'];
  out.sort((a, b) => {
    const ia = order.findIndex((k) => (a.room_type || '').toLowerCase().includes(k));
    const ib = order.findIndex((k) => (b.room_type || '').toLowerCase().includes(k));
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return out;
}

/* ────────── handler ────────── */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Server not configured (Supabase env missing)' });

  const run_id = toStr(req.query.run_id);
  let property_id = toStr(req.query.property_id);

  try {
    // Resolve via runs table when run_id is provided
    if (!property_id && run_id) {
      const r = await supabase
        .from<RunsRow>(RUNS_TABLE)
        .select('property_id,status,error')
        .eq('run_id', run_id)
        .maybeSingle();

      const run = r.data || null;

      if (!run) {
        // No row yet; still spinning up
        return res.status(200).json({ status: 'processing' as const, run: { run_id } });
      }
      if (run.status === 'failed') {
        return res.status(200).json({ status: 'failed' as const, error: run.error || 'Run failed', run: { run_id } });
      }
      if (!run.property_id || !UUID_RE.test(run.property_id)) {
        // Run exists but property not ready
        return res.status(200).json({ status: 'processing' as const, run: { run_id } });
      }
      property_id = run.property_id;
    }

    if (!property_id || !UUID_RE.test(property_id)) {
      return res.status(400).json({ error: 'Provide a valid property_id (UUID) or a run_id that resolves to one' });
    }

    // ---- Fetch core objects ----
    const [propResp, matsResp, labsResp] = await Promise.all([
      supabase.from<PropertiesRow>('properties').select('*').eq('property_id', property_id).maybeSingle(),
      supabase.from<RoomMaterialsRow>('property_room_materials').select('*').eq('property_id', property_id),
      supabase.from<RoomLabourRow>('property_room_labour').select('*').eq('property_id', property_id),
    ]);

    if (propResp.error) {
      console.error('properties error', propResp.error);
      return res.status(500).json({ status: 'failed', error: 'Failed to fetch property' });
    }
    if (matsResp.error) {
      console.error('materials error', matsResp.error);
      return res.status(500).json({ status: 'failed', error: 'Failed to fetch room materials' });
    }
    if (labsResp.error) {
      console.error('labour error', labsResp.error);
      return res.status(500).json({ status: 'failed', error: 'Failed to fetch room labour' });
    }

    const property = propResp.data ?? null;
    const mats = Array.isArray(matsResp.data) ? matsResp.data : [];
    const labs = Array.isArray(labsResp.data) ? labsResp.data : [];

    // Property row might lag a bit after the run row exists
    if (!property) {
      return res.status(200).json({ status: 'processing' as const, run: { run_id, property_id } });
    }

    const refurb_estimates = buildRooms(mats, labs, property);

    const financials = {
      guide_price_gbp: property.guide_price_gbp ?? null,
      asking_price_gbp: property.asking_price_gbp ?? null,
      purchase_price_gbp: property.purchase_price_gbp ?? property.price_gbp ?? null,
      monthly_rent_gbp: property.monthly_rent_gbp ?? null,
      annual_rent_gbp: property.annual_rent_gbp ?? null,
      refurb_total_with_vat_gbp: property.property_total_with_vat ?? null,
      refurb_total_without_vat_gbp: property.property_total_without_vat ?? null,
      summary: property.summary ?? null,
      scenarios: property.scenarios ?? null,
    };

    const pdf_url = (property as any)?.property_pdf ?? null;

    return res.status(200).json({
      status: 'completed' as const,
      property_id,
      property,
      financials,
      refurb_estimates,
      pdf_url,
    });
  } catch (err: any) {
    console.error('STATUS_HANDLER_ERR', err?.message || err);
    return res.status(500).json({ status: 'failed', error: 'Unexpected server error' });
  }
}
