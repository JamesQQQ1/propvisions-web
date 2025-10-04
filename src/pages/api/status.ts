// src/pages/api/status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * STATUS ENDPOINT (runs-table canonical)
 * Accepts ?run_id=... OR ?property_id=...
 * - Normal path: run_id -> runs.property_id -> properties/materials/labour
 * - Demo fallback: if no runs row and run_id looks like a UUID that matches a properties row,
 *   treat run_id as property_id directly so demo data renders without the runs table.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RUNS_TABLE = process.env.RUNS_TABLE || 'runs';

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
const obj = <T = Record<string, unknown>>(x: any, fallback: T): T =>
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

/* ────────── normaliser: build RefurbRoom[] ────────── */
function buildRooms(
  mats: RoomMaterialsRow[],
  labs: RoomLabourRow[],
  property: PropertiesRow | null
) {
  const index = new Map<
    string,
    {
      image_id: string | null;
      room_type: string | null;
      materials_rows: RoomMaterialsRow[];
      labour_rows: RoomLabourRow[];
    }
  >();

  const keyOf = (image_id?: string | null, room_type?: string | null) =>
    `${image_id ?? '-'}|${(room_type ?? '').toLowerCase()}`;

  for (const r of mats) {
    const k = keyOf(r.image_id, r.room_type);
    if (!index.has(k)) {
      index.set(k, {
        image_id: r.image_id ?? null,
        room_type: r.room_type ?? null,
        materials_rows: [],
        labour_rows: [],
      });
    }
    index.get(k)!.materials_rows.push(r);
  }

  for (const r of labs) {
    const k = keyOf(r.image_id, r.room_type);
    if (!index.has(k)) {
      index.set(k, {
        image_id: r.image_id ?? null,
        room_type: r.room_type ?? null,
        materials_rows: [],
        labour_rows: [],
      });
    }
    index.get(k)!.labour_rows.push(r);
  }

  const resolveImageUrl = (image_id: string | null): string | null => {
    if (!image_id) return null;
    const mapped = property?.images_map?.[image_id];
    if (mapped) return mapped;
    // heuristic: supports ids like "..._3" to index into listing_images
    const m = image_id.match(/_(\d+)$/);
    const idx = m ? Number(m[1]) : NaN;
    const arr = property?.listing_images || [];
    if (Number.isFinite(idx) && idx >= 0 && idx < arr.length) return arr[idx];
    return null;
  };

  const out: any[] = [];

  Array.from(index.values()).forEach((group, idx) => {
    // Materials
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

      const cats = obj(
        st.by_category,
        {} as NonNullable<RoomMaterialsRow['subtotals']>['by_category']
      );
      for (const [catKey, vals] of Object.entries(cats)) {
        const v = obj(vals, {});
        materials.push({
          item_key: catKey,
          net_gbp: N(v.net) || null,
          vat_gbp: N(v.vat) || null,
          gross_gbp: N(v.gross) || null,
          subtotal_gbp: N(v.gross) || N(v.net) || null,
          lines: (v as any)?.lines ?? null,
        });
      }
    }

    // Labour
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
    const room_total_ex_vat =
      materials_net + (LABOUR_PRICES_INCLUDE_VAT ? labour_total / 1.2 : labour_total);
    const room_total_inc_vat = materials_gross + labour_inc_vat;

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

  // Nice ordering
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

  try {
    // --- Fallback 0: If there's no property_id and the run_id looks like a UUID,
    // try using run_id as a property_id (useful for demo data with no runs row).
    if (!property_id && run_id && UUID_RE.test(run_id)) {
      const probe = await supabase
        .from<{ property_id: string }>('properties')
        .select('property_id')
        .eq('property_id', run_id)
        .maybeSingle();
      if (probe.data?.property_id) {
        property_id = probe.data.property_id;
      }
    }

    // Resolve via runs when run_id is provided and we still don't have property_id
    let run: RunsRow | null = null;
    if (!property_id && run_id) {
      const r = await supabase
        .from<RunsRow>(RUNS_TABLE)
        .select('run_id,property_id,status,error')
        .eq('run_id', run_id)
        .maybeSingle();
      run = r.data || null;

      if (!run) {
        // No runs row yet: keep client polling but include the run_id back
        return res.status(200).json({ status: 'queued' as const, run: { run_id } });
      }
      if (run.status === 'failed') {
        return res
          .status(200)
          .json({ status: 'failed' as const, error: run.error || 'Run failed', run });
      }
      if (!run.property_id || !UUID_RE.test(run.property_id)) {
        return res.status(200).json({ status: (run.status as any) || 'processing', run });
      }
      property_id = run.property_id;
    }

    if (!property_id || !UUID_RE.test(property_id)) {
      return res
        .status(400)
        .json({ error: 'Provide a valid property_id (UUID) or a run_id that resolves to one' });
    }

    // If we still don't have a run row, try to find a recent one by property_id (optional)
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

    // ---- Fetch core objects ----
    const [propResp, matsResp, labsResp] = await Promise.all([
      supabase
        .from<PropertiesRow>('properties')
        .select('*')
        .eq('property_id', property_id)
        .maybeSingle(),
      supabase
        .from<RoomMaterialsRow>('property_room_materials')
        .select('*')
        .eq('property_id', property_id),
      supabase
        .from<RoomLabourRow>('property_room_labour')
        .select('*')
        .eq('property_id', property_id),
    ]);

    if (propResp.error) {
      console.error('properties error', propResp.error);
      return res.status(500).json({ status: 'failed', error: 'Failed to fetch property', run });
    }
    if (matsResp.error) {
      console.error('materials error', matsResp.error);
      return res
        .status(500)
        .json({ status: 'failed', error: 'Failed to fetch room materials', run });
    }
    if (labsResp.error) {
      console.error('labour error', labsResp.error);
      return res.status(500).json({ status: 'failed', error: 'Failed to fetch room labour', run });
    }

    const property = propResp.data ?? null;
    const mats = Array.isArray(matsResp.data) ? matsResp.data : [];
    const labs = Array.isArray(labsResp.data) ? labsResp.data : [];

    // If property row not yet present, keep polling
    if (!property) {
      return res
        .status(200)
        .json({ status: (run?.status as any) || 'processing', run, property_id });
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

    // Deterministic/stable status for demo:
    // - If run says failed/completed, trust it.
    // - Otherwise, once the property row exists, mark completed so the UI renders (even if no rooms).
    let effectiveStatus: 'queued' | 'processing' | 'completed' | 'failed' =
      (run?.status as any) || 'processing';
    if (run?.status === 'failed') {
      effectiveStatus = 'failed';
    } else if (run?.status === 'completed') {
      effectiveStatus = 'completed';
    } else if (property) {
      effectiveStatus = 'completed';
    }

    // Include a synthetic run object when there's no actual runs row (stops UI flicker)
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
