// src/pages/api/status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/* ---------------- Env & Supabase admin client (server-only) ---------------- */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
  auth: { persistSession: false },
})

/* ---------------- Minimal table row types (runs/properties/financials) ---------------- */
type RunRow = {
  run_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  property_id: string | null
  error_message: string | null
  pdf_url?: string | null
  received_at?: string | null
  finished_at?: string | null
}

type PropertyRow = {
  id: string
  property_title?: string | null
  address?: string | null
  postcode?: string | null
  property_type?: string | null
  tenure?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  receptions?: number | null
  floor_area_sqm?: number | null
  epc_rating?: string | null
  listing_url?: string | null
  auction_date?: string | null
  lot_number?: string | null
  agent_name?: string | null
  agent_phone?: string | null
  agent_email?: string | null
  listing_images?: string[] | null
  purchase_price_gbp?: number | null
  guide_price_gbp?: number | null
  asking_price_gbp?: number | null
  price_gbp?: number | null
}

type FinancialsRow = {
  property_id: string
  stamp_duty_gbp?: number
  legal_fees_gbp?: number
  survey_fees_gbp?: number
  insurance_annual_gbp?: number
  management_fees_gbp?: number
  refurbishment_contingency_gbp?: number
  total_investment_gbp?: number
  annual_gross_rent_gbp?: number
  annual_net_income_gbp?: number
  roi_percent?: number
  purchase_price_gbp?: number | null
  monthly_rent_gbp?: number | null
  total_refurbishment_gbp?: number | null
}

/* ---------------- Legacy refurb table (keep as last-resort fallback) ---------------- */
type LegacyRefurbRow = {
  id: string
  property_id: string
  room_type: string
  wallpaper_or_paint_gbp: number | null
  flooring_gbp: number | null
  plumbing_gbp: number | null
  electrics_gbp: number | null
  mould_or_damp_gbp: number | null
  structure_gbp: number | null
  estimated_total_gbp: number | null
  p70_total_low_gbp?: number | null
  p70_total_high_gbp?: number | null
  confidence?: number | null
  image_id?: string | null
}

/* ---------------- Your ACTUAL price tables (source of truth) ---------------- */
// NOTE: Columns are relaxed/optional so we can map robustly whatever exists now.
type MaterialPriceRow = {
  id: string
  property_id?: string | null
  run_id?: string | null
  job_line_id?: string | null

  // room grouping
  image_id?: string | null
  image_index?: number | null        // used for grouping + image choice
  room_type?: string | null

  // describing the item
  item_key?: string | null
  material?: string | null           // sometimes present
  spec?: string | null
  unit?: string | null

  // quantities
  qty?: number | null
  qty_with_waste?: number | null
  units_to_buy?: number | null

  // money
  unit_price_material_gbp?: number | null
  unit_price_withvat_gbp?: number | null
  subtotal_gbp?: number | null
  material_subtotal_gbp?: number | null

  // misc
  assumed_area_m2?: number | null
  dimensions?: any
  confidence?: number | null
  notes?: string | null

  created_at?: string | null
}

type LabourPriceRow = {
  id: string
  property_id?: string | null
  run_id?: string | null
  job_line_id?: string | null

  // room grouping
  image_id?: string | null
  image_index?: number | null
  room_type?: string | null

  // labour
  trade_key?: string | null
  total_hours?: number | null
  crew_size?: number | null
  hourly_rate_gbp?: number | null
  labour_cost_gbp?: number | null

  ai_confidence?: number | null
  notes?: string | null
  created_at?: string | null
}

/* ---------------- Helpers ---------------- */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const toStringQuery = (q: string | string[] | undefined) => (Array.isArray(q) ? q[0] : (q ?? ''))

function normaliseProperty(p: PropertyRow | null) {
  if (!p) return null
  const images = Array.isArray(p.listing_images) ? p.listing_images : []
  const image_url = images.length ? images[0] : null

  const display_price_gbp =
    p.purchase_price_gbp ?? p.guide_price_gbp ?? p.asking_price_gbp ?? p.price_gbp ?? null

  const price_label =
    p.purchase_price_gbp != null ? 'purchase_price_gbp'
      : p.guide_price_gbp != null ? 'guide_price_gbp'
      : p.asking_price_gbp != null ? 'asking_price_gbp'
      : p.price_gbp != null ? 'price_gbp'
      : 'unknown'

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
  }
}

function pickImageUrl(image_index: number | null | undefined, listing_images?: string[] | null) {
  if (!listing_images || listing_images.length === 0) return null
  if (image_index == null) return null
  // try as 0-based then (defensively) 1-based
  const candidates = [image_index, image_index - 1].filter(
    (n): n is number => typeof n === 'number' && n >= 0 && n < listing_images.length
  )
  for (const i of candidates) {
    const u = listing_images[i]
    if (u) return u
  }
  return null
}

const n = (x: any) => (Number.isFinite(+x) ? +x : 0)
const ni = (x: any) => {
  const v = Math.round(Number(x))
  return Number.isFinite(v) ? v : 0
}
const num = (x: any) => {
  const v = Number(x)
  return Number.isFinite(v) ? v : 0
}

/* ---------------- Build rooms from your price tables ---------------- */
function buildRoomsFromPriceTables(
  mats: MaterialPriceRow[],
  labs: LabourPriceRow[],
  property: ReturnType<typeof normaliseProperty> | null
) {
  type RoomAgg = {
    image_index: number | null
    room_type: string | null
    materials: MaterialPriceRow[]
    labour: LabourPriceRow[]
  }
  const map = new Map<string, RoomAgg>()

  const add = (key: string, image_index: number | null, room_type: string | null) => {
    if (!map.has(key)) map.set(key, { image_index, room_type, materials: [], labour: [] })
    return map.get(key)!
  }

  // Tolerant grouping: accept image_idx/room as alternates
  const keyFor = (x: { image_index?: any; room_type?: any } | any) => {
    const iiRaw = x?.image_index ?? x?.image_idx ?? null
    const ii = iiRaw != null ? Number(iiRaw) : null
    const rt = (x?.room_type ?? x?.room ?? '').toString().toLowerCase().trim()
    const k = `${ii != null ? `img:${ii}` : 'img:-'}|${rt || 'room'}`
    return { k, ii, rt: rt || 'room' }
  }

  for (const m of mats || []) {
    const { k, ii, rt } = keyFor(m as any)
    const agg = add(k, ii, rt)
    agg.materials.push(m)
  }
  for (const l of labs || []) {
    const { k, ii, rt } = keyFor(l as any)
    const agg = add(k, ii, rt)
    agg.labour.push(l)
  }

  const images = property?.listing_images || null

  const rooms = Array.from(map.values()).map((agg, idx) => {
    const image_url = pickImageUrl(agg.image_index, images)

    // Map to RoomCard v3 material lines (with subtotal fallback)
    const matLines = (agg.materials || []).map((m) => {
      const qty =
        m.qty_with_waste ??
        m.qty ??
        m.units_to_buy ??
        null

      const unitRate =
        m.unit_price_material_gbp ??
        m.unit_price_withvat_gbp ??
        null

      const subtotal =
        m.material_subtotal_gbp ??
        m.subtotal_gbp ??
        (unitRate != null && qty != null ? num(unitRate) * num(qty) : null)

      return {
        job_line_id: m.job_line_id ?? null,
        item_key: m.item_key || m.material || 'material',
        unit: m.unit || null,
        qty,
        unit_price_material_gbp: unitRate,
        subtotal_gbp: subtotal,
        waste_pct: null,
        units_to_buy: m.units_to_buy ?? null,
        notes: m.notes ?? null,
        assumed_area_m2: m.assumed_area_m2 ?? null,
        confidence: m.confidence ?? null,
      }
    })

    // Labour lines (with cost fallback)
    const labLines = (agg.labour || []).map((l) => {
      const hours = l.total_hours ?? null
      const crew  = l.crew_size ?? 1
      const rate  = l.hourly_rate_gbp ?? null
      const cost  = l.labour_cost_gbp ?? (hours != null && rate != null ? num(hours) * num(crew ?? 1) * num(rate) : null)

      return {
        job_line_id: l.job_line_id ?? null,
        trade_key: l.trade_key || 'labour',
        total_hours: hours,
        crew_size: crew,
        hourly_rate_gbp: rate,
        labour_cost_gbp: cost,
        ai_confidence: l.ai_confidence ?? null,
        notes: l.notes ?? null,
      }
    })

    const matTotal = matLines.reduce((a, m) => a + num(m.subtotal_gbp), 0)
    const labTotal = labLines.reduce((a, l) => a + num(l.labour_cost_gbp), 0)
    const total = matTotal + labTotal

    return {
      id: `rx-${idx}`,
      detected_room_type: agg.room_type ?? undefined,
      room_type: agg.room_type ?? undefined,

      image_url,
      image_id: null,
      image_index: agg.image_index ?? null,

      // v2 payload
      materials: matLines,
      labour: labLines,
      materials_total_gbp: matTotal || null,
      labour_total_gbp: labTotal || null,
      room_total_gbp: total || null,
      room_confidence: null,
      confidence: null,

      // legacy back-compat for the grid/table & filters
      estimated_total_gbp: total || null,
      works: [
        ...matLines.map((m) => ({
          category: 'materials',
          description: m.item_key || 'material',
          unit: m.unit || '',
          qty: n(m.qty) || undefined,
          unit_rate_gbp: n(m.unit_price_material_gbp) || undefined,
          subtotal_gbp: n(m.subtotal_gbp) || undefined,
        })),
        ...labLines.map((l) => ({
          category: (l.trade_key || 'labour'),
          description: l.notes || '',
          unit: 'hours',
          qty: n(l.total_hours) || undefined,
          unit_rate_gbp: n(l.hourly_rate_gbp) || undefined,
          subtotal_gbp: n(l.labour_cost_gbp) || undefined,
        })),
      ],
    }
  })

  return rooms
}

/* ---------------- API handler ---------------- */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured (Supabase env missing)' })
  }

  const run_id = toStringQuery(req.query.run_id)
  if (!run_id) return res.status(400).json({ error: 'Missing run_id' })
  if (!UUID_RE.test(run_id)) return res.status(400).json({ error: 'Invalid run_id format (must be UUID)' })

  // 1) Look up the run
  const runResp = await supabase.from<RunRow>('runs').select('*').eq('run_id', run_id).maybeSingle()
  if (runResp.error) {
    console.error('Supabase runs query error:', runResp.error)
    return res.status(500).json({ error: 'Supabase runs query failed' })
  }
  const run = runResp.data
  if (!run) return res.status(404).json({ error: 'Run not found' })

  if (run.status === 'failed') {
    return res.status(200).json({
      status: 'failed' as const,
      run,
      pdf_url: run.pdf_url ?? null,
      error: run.error_message ?? 'Unknown error',
    })
  }
  if (run.status !== 'completed') {
    return res.status(200).json({
      status: run.status,
      run,
      pdf_url: run.pdf_url ?? null,
    })
  }

  // 2) Completed → fetch rows
  const property_id = run.property_id
  if (!property_id) {
    return res.status(200).json({
      status: 'completed' as const,
      property_id: null,
      property: null,
      financials: null,
      refurb_estimates: [],
      pdf_url: run.pdf_url ?? null,
    })
  }

  const [finResp, propResp] = await Promise.all([
    supabase.from<FinancialsRow>('property_financials').select('*').eq('property_id', property_id).maybeSingle(),
    supabase.from<PropertyRow>('properties').select('*').eq('id', property_id).maybeSingle(),
  ])
  if (finResp.error || propResp.error) {
    console.error('Supabase fetch errors:', { fin: finResp.error, prop: propResp.error })
    return res.status(500).json({ error: 'Supabase fetch error after completion' })
  }
  const property = normaliseProperty(propResp.data ?? null)

  // 3) Read from ACTUAL price tables — try by run_id, then fallback by property_id
  const [matsByRun, labsByRun] = await Promise.all([
    supabase.from<MaterialPriceRow>('material_refurb_prices').select('*').eq('run_id', run_id),
    supabase.from<LabourPriceRow>('labour_refurb_prices').select('*').eq('run_id', run_id),
  ])

  let matsRows = Array.isArray(matsByRun.data) ? matsByRun.data : []
  let labsRows = Array.isArray(labsByRun.data) ? labsByRun.data : []

  let refurb_debug: any = {
    property_id,
    used: 'none',
    by_run: {
      material_rows: matsRows.length,
      labour_rows: labsRows.length,
      error: { mats: matsByRun.error || null, labs: labsByRun.error || null },
    },
    by_property: { material_rows: 0, labour_rows: 0, error: null },
  }

  if ((matsRows.length === 0 && labsRows.length === 0) && property_id) {
    const [matsByProp, labsByProp] = await Promise.all([
      supabase.from<MaterialPriceRow>('material_refurb_prices').select('*').eq('property_id', property_id),
      supabase.from<LabourPriceRow>('labour_refurb_prices').select('*').eq('property_id', property_id),
    ])
    matsRows = Array.isArray(matsByProp.data) ? matsByProp.data : []
    labsRows = Array.isArray(labsByProp.data) ? labsByProp.data : []
    refurb_debug.by_property = {
      material_rows: matsRows.length,
      labour_rows: labsRows.length,
      error: { mats: matsByProp.error || null, labs: labsByProp.error || null },
    }
  }

  let refurb_estimates: any[] = []

  if (matsRows.length > 0 || labsRows.length > 0) {
    refurb_estimates = buildRoomsFromPriceTables(matsRows, labsRows, property)
    refurb_debug.used = 'price_tables'
  } else {
    // Legacy fallback if nothing in price tables (by run or by property)
    const refurbResp = await supabase
      .from<LegacyRefurbRow>('refurb_estimates')
      .select('*')
      .eq('property_id', property_id)

    if (refurbResp.error) {
      console.error('Supabase refurb_estimates error:', refurbResp.error)
      return res.status(500).json({ error: 'Supabase refurb fetch error' })
    }
    refurb_estimates = Array.isArray(refurbResp.data) ? refurbResp.data : []
    refurb_debug.used = 'legacy_table'
    refurb_debug.legacy_count = refurb_estimates.length
  }

  return res.status(200).json({
    status: 'completed' as const,
    property_id,
    property,
    financials: finResp.data ?? null,
    refurb_estimates,
    pdf_url: run.pdf_url ?? null,
    refurb_debug, // inspect in Network tab if needed
  })
}
