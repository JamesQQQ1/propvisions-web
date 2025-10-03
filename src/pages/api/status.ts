// src/pages/api/status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * STATUS ENDPOINT (runs-table canonical)
 * Accepts ?run_id=... OR ?property_id=...
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RUNS_TABLE = process.env.RUNS_TABLE || 'runs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---- config: set this true if labour costs in DB are VAT-inclusive charge-out rates
const LABOUR_PRICES_INCLUDE_VAT = true;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const toStr = (q: string | string[] | undefined) => (Array.isArray(q) ? q[0] : (q ?? ''));
const N = (x: any) => (Number.isFinite(+x) ? +x : 0);
const obj = <T = Record<string, unknown>>(x: any, fallback: T): T => (x && typeof x === 'object' ? (x as T) : fallback);

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

  price_gbp?: number | null;
  guide_price_gbp?: number | null;
  asking_price_gbp?: number | null;
  purchase_price_gbp?: number | null;
  monthly_rent_gbp?: number | null;
  annual_rent_gbp?: number | null;

  property_total_without_vat?: number | null;
  property_total_with_vat?: number | null;

  scenarios?: any;
  summary?: any;

  property_description?: string | null;
  features?: string[] | null;
  epc_rating_current?: string | null;
  epc_score_current?: number | null;
  epc_rating_potential?: string | null;
  epc_score_potential?: number | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  agent_email?: string | null;

  property_pdf?: string | null; // if you store a direct URL
};

type RoomMaterialsRow = {
  id: string;
  property_id: string;
  image_id: string | null;
  room_type: string | null;
  subtotals: {
    all?: { net?: number; vat?: number; gross?: number } | null;
    by_category?: Record<
      string,
      { net?: number; vat?: number; gross?: number; lines?: number | null }
    > | null;
  } | null;
};

type RoomLabourRow = {
  id: string;
  property_id: string;
  image_id: string | null;
  room_type: string | null;
  trade_key?: string | null;
  trade_name: string | null;
  crew_size?: number | null;
  trade_total_hours?: number | null;
  hourly_rate_gbp?: number | null;
  labour_cost_mean_charge?: number | null;
  job_line_id?: string | null;
  ai_confidence?: number | null;
  notes?: string | null;
};

type RunsRow = {
  run_id: string;
  property_id: string | null;
  status?: 'queued' | 'processing' | 'completed' | 'failed' | string | null;
  error?: string | null;
};

/* build per-room payload matching RefurbRoom + MaterialCategory + LabourTrade */
function buildRooms(
  mats: RoomMaterialsRow[],
  labs: RoomLabourRow[],
  property: PropertiesRow | null
) {
  const index = new Map<
    string,
    { image_id: string | null; room_type: string | null; materials_rows: RoomMaterialsRow[]; labour_rows: RoomLabourRow[] }
  >();

  const keyOf = (image_id?: string | null, room_type?: string | null) =>
    `${image_id ?? '-'}|${(room_type ?? '').toLowerCase()}`;

  for (const r of mats) {
    const k = keyOf(r.image_id, r.room_type);
    if (!index.has(k))
      index.set(k, { image_id: r.image_id ?? null, room_type: r.room_type ?? null, materials_rows: [], labour_rows: [] });
    index.get(k)!.materials_rows.push(r);
  }
  for (const r of labs) {
    const k = keyOf(r.image_id, r.room_type);
    if (!index.has(k))
      index.set(k, { image_id: r.image_id ?? null, room_type: r.room_type ?? null, materials_rows: [], labour_rows: [] });
    index.get(k)!.labour_rows.push(r);
  }

  const resolveImageUrl = (image_id: string | null): string | null => {
    if (!image_id) return null;
    const mapped = property?.images_map?.[image_id];
    if (mapped) return mapped;
    const m = image_id.match(/_(\d+)$/);
    const idx = m ? Number(m[1]) : NaN;
    const arr = property?.listing_images || [];
    if (Number.isFinite(idx) && idx >= 0 && idx < arr.length) return arr[idx];
    return null;
  };

  const out: any[] = [];
  Array.from(index.values()).forEach((group, idx) => {
    // Materials → MaterialCategory[]
    const materials: any[] = [];
    let materials_net = 0;
    let materials_vat = 0;
    let materials_gross = 0;

    for (const m of group.materials_rows) {
      const st = obj(m.subtotals, {});
      const all = obj(st.all, {});
      materials_net += N(all.net);
      materials_vat += N(all.vat);
      materials_gross += N(all.gross);

      const cats = obj(st.by_category, {} as NonNullable<RoomMaterialsRow['subtotals']>['by_category']);
      for (const [catKey, vals] of Object.entries(cats)) {
        const v = obj(vals, {});
        const net = N(v.net);
        const vat = N(v.vat);
        const gross = N(v.gross);
        const lines = (v as any)?.lines ?? null;
        materials.push({
          item_key: catKey,
          net_gbp: net || null,
          vat_gbp: vat || null,
          gross_gbp: gross || null,
          subtotal_gbp: gross || net || null,
          lines: lines ?? null,
        });
      }
    }

    // Labour → LabourTrade[]
    const labour: any[] = [];
    let labour_total = 0;
    for (const l of group.labour_rows) {
      const cost = N(l.labour_cost_mean_charge);
      labour_total += cost;
      labour.push({
        job_line_id: l.job_line_id ?? null,
        trade_key: l.trade_key ?? null,
        trade_name: l.trade_name ?? l.trade_key ?? 'Labour',
        total_hours: l.trade_total_hours ?? null,
        crew_size: l.crew_size ?? null,
        hourly_rate_gbp: l.hourly_rate_gbp ?? null,
        labour_cost_gbp: cost || null,
        ai_confidence: l.ai_confidence ?? null,
        notes: l.notes ?? null,
      });
    }

    const labour_with_vat = LABOUR_PRICES_INCLUDE_VAT ? labour_total : labour_total * 1.2;

    const room_total_ex_vat = materials_net + (LABOUR_PRICES_INCLUDE_VAT ? labour_total / 1.2 : labour_total);
    const room_total_inc_vat = materials_gross + labour_with_vat;

    const prettyRoomType =
      (group.room_type || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase()) || null;

    out.push({
      id: `room-${idx}`,
      image_id: group.image_id ?? null,
      image_url: resolveImageUrl(group.image_id ?? null),
      room_type: prettyRoomType,
      detected_room_type: prettyRoomType,
      materials: materials.length ? materials : null,
      labour: labour.length ? labour : null,
      materials_total_gbp: materials_net || materials_gross || null,
      materials_total_with_vat_gbp: materials_gross || null,
      labour_total_gbp: labour_total || null,
      room_total_gbp: room_total_ex_vat || null,
      room_total_with_vat_gbp: room_total_inc_vat || null,
    });
  });

  const order = ['kitchen', 'bathroom', 'living', 'sitting', 'reception', 'bedroom', 'hall', 'landing'];
  out.sort((a, b) => {
    const ia = order.findIndex((k) => (a.room_type || '').toLowerCase().includes(k));
    const ib = order.findIndex((k) => (b.room_type || '').toLowerCase().includes(k));
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured (Supabase env missing)' });
  }

  const run_id = toStr(req.query.run_id);
  let property_id = toStr(req.query.property_id);

  try {
    // Resolve via runs when run_id is provided
    let run: RunsRow | null = null;
    if (!property_id && run_id) {
      const r = await supabase
        .from<RunsRow>(RUNS_TABLE)
        .select('run_id,property_id,status,error')
        .eq('run_id', run_id)
        .maybeSingle();
      run = r.data || null;

      if (!run) {
        return res.status(200).json({ status: 'queued' as const, run: { run_id } });
      }
      if (run.status === 'failed') {
        return res.status(200).json({ status: 'failed' as const, error: run.error || 'Run failed', run });
      }
      if (!run.property_id || !UUID_RE.test(run.property_id)) {
        return res.status(200).json({ status: (run.status as any) || 'processing', run });
      }
      property_id = run.property_id;
    }

    if (!property_id || !UUID_RE.test(property_id)) {
      return res.status(400).json({ error: 'Provide a valid property_id (UUID) or a run_id that resolves to one' });
    }

    if (!run) {
      const r = await supabase
        .from<RunsRow>(RUNS_TABLE)
        .select('run_id,property_id,status,error')
        .eq('property_id', property_id)
        .order('run_id', { ascending: false })
        .limit(1)
        .maybeSingle();
      run = r.data || null;
    }

    // Fetch core objects
    const [propResp, matsResp, labsResp] = await Promise.all([
      supabase.from<PropertiesRow>('properties').select('*').eq('property_id', property_id).maybeSingle(),
      supabase.from<RoomMaterialsRow>('property_room_materials').select('*').eq('property_id', property_id),
      supabase.from<RoomLabourRow>('property_room_labour').select('*').eq('property_id', property_id),
    ]);

    if (propResp.error) {
      console.error('properties error', propResp.error);
      return res.status(500).json({ status: 'failed', error: 'Failed to fetch property', run });
    }
    if (matsResp.error) {
      console.error('materials error', matsResp.error);
      return res.status(500).json({ status: 'failed', error: 'Failed to fetch room materials', run });
    }
    if (labsResp.error) {
      console.error('labour error', labsResp.error);
      return res.status(500).json({ status: 'failed', error: 'Failed to fetch room labour', run });
    }

    const property = propResp.data ?? null;
    const mats = Array.isArray(matsResp.data) ? matsResp.data : [];
    const labs = Array.isArray(labsResp.data) ? labsResp.data : [];

    if (!property) {
      return res.status(200).json({ status: (run?.status as any) || 'processing', run, property_id });
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

    const pdf_url = property.property_pdf ?? null;

    const effectiveStatus =
      (run?.status as any) ||
      (refurb_estimates.length > 0 ? ('completed' as const) : ('processing' as const));

    return res.status(200).json({
      status: effectiveStatus,
      run: run ?? undefined,
      property_id,
      property,
      financials,
      refurb_estimates,
      pdf_url,
      refurb_debug: { materials_count: mats.length, labour_count: labs.length },
    });
  } catch (err: any) {
    console.error('STATUS_HANDLER_ERR', err?.message || err);
    return res.status(500).json({ status: 'failed', error: 'Unexpected server error' });
  }
}
