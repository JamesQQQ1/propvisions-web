// src/pages/api/status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * STATUS ENDPOINT (runs-table canonical, STRICT by default)
 * - Normal path: run_id -> runs.property_id -> (when runs.status === 'completed') fetch properties/materials/labour
 * - Optional demo fallback (disabled by default): if enabled AND no runs row yet,
 *   treat run_id as property_id so demos can render.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RUNS_TABLE = process.env.RUNS_TABLE || 'runs';

// Strict gating waits for runs.status === 'completed' before returning any property data
const STRICT_RUN_GATING = (process.env.STRICT_RUN_GATING ?? 'true') !== 'false';
// Allow legacy/demo fallback (run_id as property_id) only if explicitly enabled OR ?demo=1
const ALLOW_DEMO_FALLBACK = (process.env.ALLOW_DEMO_FALLBACK ?? 'false') === 'true';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// If your labour figures are VAT-inclusive charge-out rates, set true.
// If they are ex-VAT and you want to show inc-VAT totals, set false (adds 20%).
const LABOUR_PRICES_INCLUDE_VAT = true;

/* ────────── helpers ────────── */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const toStr = (q: string | string[] | undefined) => (Array.isArray(q) ? q[0] : (q ?? ''));
const N = (x: any) => (Number.isFinite(+x) ? +x : 0);
const obj = <T = Record<string, unknown>>(x: any, fallback: T): T => (x && typeof x === 'object' ? (x as T) : fallback);

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

  property_pdf?: string | null;
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

/* ────────── normaliser: build RefurbRoom[] ────────── */
function buildRooms(mats: RoomMaterialsRow[], labs: RoomLabourRow[], property: PropertiesRow | null) {
  const index = new Map<
    string,
    { image_id: string | null; room_type: string | null; materials_rows: RoomMaterialsRow[]; labour_rows: RoomLabourRow[] }
  >();

  const keyOf = (image_id?: string | null, room_type?: string | null) => `${image_id ?? '-'}|${(room_type ?? '').toLowerCase()}`;

  for (const r of mats) {
    const k = keyOf(r.image_id, r.room_type);
    if (!index.has(k)) index.set(k, { image_id: r.image_id ?? null, room_type: r.room_type ?? null, materials_rows: [], labour_rows: [] });
    index.get(k)!.materials_rows.push(r);
  }

  for (const r of labs) {
    const k = keyOf(r.image_id, r.room_type);
    if (!index.has(k)) index.set(k, { image_id: r.image_id ?? null, room_type: r.room_type ?? null, materials_rows: [], labour_rows: [] });
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
    const materials: any[] = [];
    let materials_net = 0, materials_vat = 0, materials_gross = 0;

    for (const m of group.materials_rows) {
      const st = obj(m.subtotals, { all: null, by_category: null });
      const all = obj(st.all, { net: 0, vat: 0, gross: 0 });
      materials_net += N(all.net);
      materials_vat += N(all.vat);
      materials_gross += N(all.gross);

      const cats = obj(st.by_category, {} as NonNullable<RoomMaterialsRow['subtotals']>['by_category']);
      for (const [catKey, vals] of Object.entries(cats || {})) {
        const v = obj(vals, { net: 0, vat: 0, gross: 0, lines: 0 });
        materials.push({
          item_key: catKey,
          net_gbp: N(v.net) || null,
          vat_gbp: N(v.vat) || null,
          gross_gbp: N(v.gross) || null,
          subtotal_gbp: N(v.gross) || N(v.net) || null,
          lines: v.lines ?? null,
        });
      }
    }

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

    const labour_inc_vat = LABOUR_PRICES_INCLUDE_VAT ? labour_total : labour_total * 1.2;
    const room_total_ex_vat = materials_net + (LABOUR_PRICES_INCLUDE_VAT ? labour_total / 1.2 : labour_total);
    const room_total_inc_vat = materials_gross + labour_inc_vat;

    const prettyRoomType = (group.room_type || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) || null;

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

/* ────────── handler ────────── */
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
  const demoParam = toStr(req.query.demo);
  const allowDemo = demoParam === '1' || demoParam === 'true' || ALLOW_DEMO_FALLBACK;

  try {
    let run: RunsRow | null = null;

    // ── Resolve/gate by RUN row first (STRICT by default) ─────────────────────
    if (run_id) {
      // (Optional) demo fallback: interpret run_id as property_id ONLY if demo allowed and it's a UUID
      if (!property_id && allowDemo && UUID_RE.test(run_id)) {
        const probe = await supabase.from('properties')
          .select('property_id').eq('property_id', run_id).maybeSingle();
        if (probe.data?.property_id) property_id = probe.data.property_id;
      }

      // Fetch the run row
      const r = await supabase
        .from(RUNS_TABLE)
        .select('run_id,property_id,status,error')
        .eq('run_id', run_id)
        .maybeSingle();
      run = r.data || null;

      // If STRICT gating: do not proceed to property fetch until status === 'completed'
      if (STRICT_RUN_GATING) {
        if (!run) {
          return res.status(200).json({ status: 'queued' as const, run: { run_id } });
        }
        if (run.status === 'failed') {
          return res.status(200).json({ status: 'failed' as const, error: run.error || 'Run failed', run });
        }
        if (run.status !== 'completed') {
          return res.status(200).json({ status: (run.status as any) || 'processing', run });
        }
        // Completed: ensure property_id is known
        property_id = property_id || run.property_id || '';
      } else {
        // Non-strict mode: if we have a run but it's not completed, still gate unless demo fallback
        if (run && run.status === 'failed') {
          return res.status(200).json({ status: 'failed' as const, error: run.error || 'Run failed', run });
        }
        if (!allowDemo && run && run.status !== 'completed') {
          return res.status(200).json({ status: (run.status as any) || 'processing', run });
        }
        property_id = property_id || run?.property_id || property_id; // pass through in demo
      }
    }

    // Must have a valid property_id by here to fetch data
    if (!property_id || !UUID_RE.test(property_id)) {
      // If we got here with a run row in strict mode, return its status; otherwise generic message
      return res.status(400).json({ error: 'Provide a valid property_id (UUID) or a run_id that resolves to one' });
    }

    // ── Now (and only now) fetch the heavy tables ─────────────────────────────
    const [propResp, matsResp, labsResp] = await Promise.all([
      supabase.from('properties').select('*').eq('property_id', property_id).maybeSingle(),
      supabase.from('property_room_materials').select('*').eq('property_id', property_id),
      supabase.from('property_room_labour').select('*').eq('property_id', property_id),
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

    // In rare cases a completed run row might precede the property upsert by milliseconds
    if (!property) {
      // keep polling client-side
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

    // With strict gating, reaching this point implies completion.
    const effectiveStatus: 'completed' = 'completed';
    const runForResponse = run ?? (run_id ? { run_id, property_id, status: effectiveStatus } : undefined);

    return res.status(200).json({
      status: effectiveStatus,
      run: runForResponse,
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
