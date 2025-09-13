// src/pages/api/status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/** --- Env & Supabase admin client (server-only) --- */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
  auth: { persistSession: false },
});

/** --- Minimal table row types (runs, property, financials) --- */
type RunRow = {
  run_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  property_id: string | null;
  error_message: string | null;
  pdf_url?: string | null;
  received_at?: string | null;
  finished_at?: string | null;
};

type PropertyRow = {
  id: string;
  property_title?: string | null;
  address?: string | null;
  postcode?: string | null;
  property_type?: string | null;
  tenure?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  receptions?: number | null;
  floor_area_sqm?: number | null;
  epc_rating?: string | null;
  listing_url?: string | null;
  auction_date?: string | null;
  lot_number?: string | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  agent_email?: string | null;
  listing_images?: string[] | null;
  purchase_price_gbp?: number | null;
  guide_price_gbp?: number | null;
  asking_price_gbp?: number | null;
  price_gbp?: number | null;
};

type FinancialsRow = {
  property_id: string;
  stamp_duty_gbp?: number;
  legal_fees_gbp?: number;
  survey_fees_gbp?: number;
  insurance_annual_gbp?: number;
  management_fees_gbp?: number;
  refurbishment_contingency_gbp?: number;
  total_investment_gbp?: number;
  annual_gross_rent_gbp?: number;
  annual_net_income_gbp?: number;
  roi_percent?: number;
  purchase_price_gbp?: number | null;
  monthly_rent_gbp?: number | null;
  total_refurbishment_gbp?: number | null;
};

/** --- Legacy refurb table (back-compat) --- */
type LegacyRefurbRow = {
  id: string;
  property_id: string;
  room_type: string;
  wallpaper_or_paint_gbp: number | null;
  flooring_gbp: number | null;
  plumbing_gbp: number | null;
  electrics_gbp: number | null;
  mould_or_damp_gbp: number | null;
  structure_gbp: number | null;
  estimated_total_gbp: number | null;
  p70_total_low_gbp?: number | null;
  p70_total_high_gbp?: number | null;
  confidence?: number | null;
  image_id?: string | null;
};

/** --- NEW SOURCE TABLES (your actual data) --- */
/** material_refurb_prices */
type MaterialPriceRow = {
  id: string;
  run_id?: string | null;
  property_id?: string | null;
  job_id?: string | null;
  job_line_id?: string | null;
  image_id?: string | null;
  image_run_key?: string | null;
  room_type?: string | null;         // may be null/unknown
  item_key?: string | null;          // sometimes 'material'/'item_key'
  material?: string | null;          // human name
  spec?: string | null;
  unit?: string | null;
  qty?: number | null;               // if present
  units_to_buy?: number | null;      // if present
  qty_with_waste?: number | null;    // if present
  unit_price_material_gbp?: number | null;
  material_subtotal_gbp?: number | null;
  assumed_area_m2?: number | null;
  dimensions?: any | null;
  created_at?: string | null;
};

/** labour_refurb_prices */
type LabourPriceRow = {
  id: string;
  run_id?: string | null;
  property_id?: string | null;
  job_id?: string | null;
  job_line_id?: string | null;
  image_id?: string | null;
  image_run_key?: string | null;
  room_type?: string | null;
  trade_key?: string | null;
  total_hours?: number | null;
  person_hours?: number | null;  // sometimes present
  crew_size?: number | null;
  hourly_rate_gbp?: number | null;
  labour_cost_gbp?: number | null;
  labour_cost_gbp_rounded?: number | null;
  ai_confidence?: number | null;
  notes?: string | null;
  created_at?: string | null;
};

/** --- Helpers --- */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const toStringQuery = (q: string | string[] | undefined) =>
  Array.isArray(q) ? q[0] : (q ?? '');

function normaliseProperty(p: PropertyRow | null) {
  if (!p) return null;
  const images = Array.isArray(p.listing_images) ? p.listing_images : [];
  const image_url = images.length ? images[0] : null;

  const display_price_gbp =
    p.purchase_price_gbp ?? p.guide_price_gbp ?? p.asking_price_gbp ?? p.price_gbp ?? null;

  const price_label =
    p.purchase_price_gbp != null ? 'purchase_price_gbp'
      : p.guide_price_gbp != null ? 'guide_price_gbp'
      : p.asking_price_gbp != null ? 'asking_price_gbp'
      : p.price_gbp != null ? 'price_gbp'
      : 'unknown';

  return {
    property_id: p.id,
    property_title: p.property_title ?? '',
    address: p.address ?? '',
    postcode: p.postcode ?? '',
    property_type: p.property_type ?? '',
    tenure: p.tenure ?? '',
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    receptions: p.receptions ?? null,
    floor_area_sqm: p.floor_area_sqm ?? null,
    epc_rating: p.epc_rating ?? null,
    listing_url: p.listing_url ?? '',
    auction_date: p.auction_date ?? '',
    lot_number: p.lot_number ?? '',
    agent_name: p.agent_name ?? '',
    agent_phone: p.agent_phone ?? '',
    agent_email: p.agent_email ?? '',
    listing_images: images,
    image_url,
    purchase_price_gbp: p.purchase_price_gbp ?? null,
    guide_price_gbp: p.guide_price_gbp ?? null,
    asking_price_gbp: p.asking_price_gbp ?? null,
    price_gbp: p.price_gbp ?? null,
    display_price_gbp,
    price_label,
  };
}

/** Pick image URL for an image_id if possible. Falls back to first listing image. */
function inferImageUrl(image_id: string | null | undefined, listing_images: string[] | null | undefined): string | null {
  if (!listing_images || !listing_images.length) return null;
  if (!image_id) return listing_images[0] || null;
  const id = String(image_id);
  if (/^https?:\/\//i.test(id)) return id;              // already a URL
  const bySubstring = listing_images.find(u => u.includes(id));
  return bySubstring || listing_images[0] || null;
}

/** Build "synthetic rooms" grouped by (image_id, room_type) */
function buildRoomsFromPriceTables(
  mats: MaterialPriceRow[],
  labs: LabourPriceRow[],
  property: ReturnType<typeof normaliseProperty> | null
) {
  type Group = {
    image_id: string | null;
    room_type: string | null;
    mats: MaterialPriceRow[];
    labs: LabourPriceRow[];
  };

  const groups = new Map<string, Group>();

  const put = (image_id: string | null, room_type: string | null) => {
    const key = `${image_id ?? 'noimg'}|${(room_type ?? 'room').toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, { image_id, room_type, mats: [], labs: [] });
    }
    return groups.get(key)!;
  };

  (mats || []).forEach(m => {
    put(m.image_id ?? null, m.room_type ?? null).mats.push(m);
  });
  (labs || []).forEach(l => {
    put(l.image_id ?? null, l.room_type ?? null).labs.push(l);
  });

  const images = property?.listing_images || null;

  // Transform to UI rows (compatible with RoomCard)
  const rows = Array.from(groups.values()).map((g, i) => {
    const image_url = inferImageUrl(g.image_id, images);

    // Materials → RoomCard.materials lines
    const materials = g.mats.map(m => ({
      job_line_id: m.job_line_id ?? null,
      item_key: (m.item_key || m.material || 'material') ?? undefined,
      unit: m.unit ?? undefined,
      qty: (m.qty ?? m.units_to_buy ?? m.qty_with_waste) ?? null,
      unit_price_material_gbp: m.unit_price_material_gbp ?? null,
      subtotal_gbp: m.material_subtotal_gbp ?? null,
      notes: m.spec || undefined,
      assumed_area_m2: m.assumed_area_m2 ?? null,
      confidence: null,
    }));

    // Labour → RoomCard.labour lines
    const labour = g.labs.map(l => {
      const hours = (l.total_hours ?? l.person_hours ?? 0) || 0;
      const crew = (l.crew_size ?? 1) || 1;
      const rate = (l.hourly_rate_gbp ?? 0) || 0;
      const subtotal =
        l.labour_cost_gbp ??
        l.labour_cost_gbp_rounded ??
        (hours * crew * rate);
      return {
        job_line_id: l.job_line_id ?? null,
        trade_key: l.trade_key ?? 'labour',
        total_hours: hours,
        crew_size: crew,
        hourly_rate_gbp: rate,
        labour_cost_gbp: subtotal ?? null,
        ai_confidence: l.ai_confidence ?? null,
        notes: l.notes ?? undefined,
      };
    });

    const matSum = materials.reduce((a, m) => a + (Number(m.subtotal_gbp) || 0), 0);
    const labSum = labour.reduce((a, l) => a + (Number(l.labour_cost_gbp) || 0), 0);
    const total = matSum + labSum;

    // Build a legacy-style "works" array so the old table also has something to show
    const works = [
      ...materials.map(m => ({
        category: 'materials',
        description: m.item_key || 'material',
        unit: m.unit || '',
        qty: (typeof m.qty === 'number' ? m.qty : null) || undefined,
        unit_rate_gbp: (typeof m.unit_price_material_gbp === 'number' ? m.unit_price_material_gbp : null) || undefined,
        subtotal_gbp: (typeof m.subtotal_gbp === 'number' ? m.subtotal_gbp : null) || undefined,
      })),
      ...labour.map(l => ({
        category: l.trade_key || 'labour',
        description: l.notes || '',
        unit: 'hours',
        qty: (typeof l.total_hours === 'number' ? l.total_hours : null) || undefined,
        unit_rate_gbp: (typeof l.hourly_rate_gbp === 'number' ? l.hourly_rate_gbp : null) || undefined,
        subtotal_gbp: (typeof l.labour_cost_gbp === 'number' ? l.labour_cost_gbp : null) || undefined,
      })),
    ];

    return {
      id: `grp-${i}`,
      detected_room_type: g.room_type ?? undefined,
      room_type: g.room_type ?? undefined,
      image_url,
      image_id: g.image_id ?? null,
      image_index: null,

      // v2 fields used by RoomCard
      materials,
      labour,
      materials_total_gbp: matSum,
      labour_total_gbp: labSum,
      room_total_gbp: total,
      room_confidence: null,
      confidence: null,

      // legacy helpers
      works,
      estimated_total_gbp: total,
    };
  });

  return rows;
}

/** --- API handler --- */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured (Supabase env missing)' });
  }

  // 1) Validate run_id
  const run_id = toStringQuery(req.query.run_id);
  if (!run_id) return res.status(400).json({ error: 'Missing run_id' });
  if (!UUID_RE.test(run_id)) {
    return res.status(400).json({ error: 'Invalid run_id format (must be UUID)' });
  }

  // 2) Look up the run row
  const runResp = await supabase.from<RunRow>('runs').select('*').eq('run_id', run_id).maybeSingle();

  if (runResp.error) {
    console.error('Supabase runs query error:', runResp.error);
    return res.status(500).json({ error: 'Supabase runs query failed' });
  }
  const run = runResp.data;
  if (!run) return res.status(404).json({ error: 'Run not found' });

  // status short-circuits
  if (run.status === 'failed') {
    return res.status(200).json({
      status: 'failed' as const,
      run,
      pdf_url: run.pdf_url ?? null,
      error: run.error_message ?? 'Unknown error',
    });
  }
  if (run.status !== 'completed') {
    return res.status(200).json({
      status: run.status,
      run,
      pdf_url: run.pdf_url ?? null,
    });
  }

  // 3) Completed → fetch rows for UI
  const property_id = run.property_id;

  if (!property_id) {
    return res.status(200).json({
      status: 'completed' as const,
      property_id: null,
      property: null,
      financials: null,
      refurb_estimates: [],
      pdf_url: run.pdf_url ?? null,
    });
  }

  const [finResp, propResp] = await Promise.all([
    supabase.from<FinancialsRow>('property_financials').select('*').eq('property_id', property_id).maybeSingle(),
    supabase.from<PropertyRow>('properties').select('*').eq('id', property_id).maybeSingle(),
  ]);

  if (finResp.error || propResp.error) {
    console.error('Supabase fetch errors:', { fin: finResp.error, prop: propResp.error });
    return res.status(500).json({ error: 'Supabase fetch error after completion' });
  }

  const property = normaliseProperty(propResp.data ?? null);

  // 4) NEW: read actual pricing tables keyed by this run
  const [matsResp, labsResp] = await Promise.all([
    supabase.from<MaterialPriceRow>('material_refurb_prices').select('*').eq('run_id', run_id),
    supabase.from<LabourPriceRow>('labour_refurb_prices').select('*').eq('run_id', run_id),
  ]);

  let refurb_estimates: any[] = [];
  let refurb_debug: any = {
    used: 'none',
    material_rows: Array.isArray(matsResp.data) ? matsResp.data.length : 0,
    labour_rows: Array.isArray(labsResp.data) ? labsResp.data.length : 0,
  };

  const havePriceTables =
    (!matsResp.error && Array.isArray(matsResp.data) && matsResp.data.length > 0) ||
    (!labsResp.error && Array.isArray(labsResp.data) && labsResp.data.length > 0);

  if (havePriceTables) {
    refurb_estimates = buildRoomsFromPriceTables(matsResp.data || [], labsResp.data || [], property);
    refurb_debug.used = 'price_tables_grouped';
  } else {
    // 5) Fallback to legacy table if nothing in price tables
    const refurbResp = await supabase
      .from<LegacyRefurbRow>('refurb_estimates')
      .select('*')
      .eq('property_id', property_id);

    if (refurbResp.error) {
      console.error('Supabase refurb_estimates error:', refurbResp.error);
      return res.status(500).json({ error: 'Supabase refurb fetch error' });
    }
    refurb_estimates = Array.isArray(refurbResp.data) ? refurbResp.data : [];
    refurb_debug.used = 'legacy_table';
    refurb_debug.legacy_count = refurb_estimates.length;
  }

  return res.status(200).json({
    status: 'completed' as const,
    property_id,
    property,
    financials: finResp.data ?? null,
    refurb_estimates,
    pdf_url: run.pdf_url ?? null,
    refurb_debug, // handy in Network tab
  });
}
