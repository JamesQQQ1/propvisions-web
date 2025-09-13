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

/* ---------------- Source-of-truth price tables ---------------- */
type MaterialPriceRow = {
  id: string
  property_id?: string | null
  run_id?: string | null
  job_line_id?: string | null
  image_id?: string | null
  image_index?: number | null
  room_type?: string | null
  item_key?: string | null
  material?: string | null
  spec?: string | null
  unit?: string | null
  qty_raw?: number | null
  qty_with_waste?: number | null
  qty?: number | null
  units_to_buy?: number | null
  unit_price_material_gbp?: number | null
  unit_price_withvat_gbp?: number | null
  subtotal_gbp?: number | null
  material_subtotal_gbp?: number | null
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
  image_id?: string | null
  image_index?: number | null
  room_type?: string | null
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
const num = (x: any) => (Number.isFinite(+x) ? +x : 0)

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
  if (!listing_images || !listing_images.length) return null
  if (image_index == null) return null
  const i0 = image_index
  const i1 = image_index - 1
  const cand = [i0, i1].filter((i): i is number => Number.isInteger(i) && i >= 0 && i < listing_images.length)
  for (const i of cand) {
    const u = listing_images[i]
    if (u) return u
  }
  return null
}

function sampleRows<T extends { id?: any; property_id?: any; run_id?: any; room_type?: any; image_index?: any }>(
  xs: T[] | null | undefined
) {
  return (Array.isArray(xs) ? xs : [])
    .slice(0, 3)
    .map(r => ({
      id: (r as any).id,
      property_id: (r as any).property_id ?? null,
      run_id: (r as any).run_id ?? null,
      room_type: (r as any).room_type ?? (r as any).room ?? null,
      image_index: (r as any).image_index ?? (r as any).image_idx ?? null,
    }))
}

/* ---------------- Build rooms from price tables ---------------- */
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

  const keyFor = (x: { image_index?: any; room_type?: any } | any) => {
    const iiRaw = x?.image_index ?? x?.image_idx ?? null
    const ii = iiRaw != null ? Number(iiRaw) : null
    const rt = (x?.room_type ?? x?.room ?? 'room').toString().toLowerCase().trim() || 'room'
    const k = `${ii != null ? `img:${ii}` : 'img:-'}|${rt}`
    return { k, ii, rt }
  }

  const add = (key: string, image_index: number | null, room_type: string | null) => {
    if (!map.has(key)) map.set(key, { image_index, room_type, materials: [], labour: [] })
    return map.get(key)!
  }

  for (const m of mats || []) {
    const { k, ii, rt } = keyFor(m)
    add(k, ii, rt).materials.push(m)
  }
  for (const l of labs || []) {
    const { k, ii, rt } = keyFor(l)
    add(k, ii, rt).labour.push(l)
  }

  const images = property?.listing_images || null

  return Array.from(map.values()).map((agg, idx) => {
    const image_url = pickImageUrl(agg.image_index, images)

    const matLines = (agg.materials || []).map((m) => {
      const qty =
        m.qty_with_waste ??
        m.qty_raw ??
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

    const materials_total = matLines.reduce((a, m) => a + num(m.subtotal_gbp), 0)
    const labour_total    = labLines.reduce((a, l) => a + num(l.labour_cost_gbp), 0)
    const total           = materials_total + labour_total

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
      materials_total_gbp: materials_total || null,
      labour_total_gbp: labour_total || null,
      room_total_gbp: total || null,
      room_confidence: null,
      confidence: null,

      // legacy-like works array so your grid stays happy
      estimated_total_gbp: total || null,
      works: [
        ...matLines.map((m) => ({
          category: 'materials',
          description: m.item_key || 'material',
          unit: m.unit || '',
          qty: num(m.qty) || undefined,
          unit_rate_gbp: num(m.unit_price_material_gbp) || undefined,
          subtotal_gbp: num(m.subtotal_gbp) || undefined,
        })),
        ...labLines.map((l) => ({
          category: (l.trade_key || 'labour'),
          description: l.notes || '',
          unit: 'hours',
          qty: num(l.total_hours) || undefined,
          unit_rate_gbp: num(l.hourly_rate_gbp) || undefined,
          subtotal_gbp: num(l.labour_cost_gbp) || undefined,
        })),
      ],
    }
  })
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

  const debug = toStringQuery(req.query.debug) === '1'
  let property_id = toStringQuery(req.query.property_id)
  const run_id = toStringQuery(req.query.run_id)

  // Property-first: if property_id not given, we only *resolve* it from run_id
  if (!property_id) {
    if (!run_id) return res.status(400).json({ error: 'Provide property_id (preferred) or run_id' })
    if (!UUID_RE.test(run_id)) return res.status(400).json({ error: 'Invalid run_id format (UUID required)' })
    const runResp = await supabase.from<RunRow>('runs').select('run_id,status,property_id,pdf_url').eq('run_id', run_id).maybeSingle()
    if (runResp.error) {
      console.error('Supabase runs query error:', runResp.error)
      return res.status(500).json({ error: 'Supabase runs query failed' })
    }
    if (!runResp.data || !runResp.data.property_id) {
      return res.status(404).json({ error: 'Run not found or missing property_id' })
    }
    property_id = runResp.data.property_id
  }

  // Fetch property + financials (optional if missing)
  const [finResp, propResp] = await Promise.all([
    supabase.from<FinancialsRow>('property_financials').select('*').eq('property_id', property_id).maybeSingle(),
    supabase.from<PropertyRow>('properties').select('*').eq('id', property_id).maybeSingle(),
  ])
  if (finResp.error || propResp.error) {
    console.error('Supabase fetch errors:', { fin: finResp.error, prop: propResp.error })
    return res.status(500).json({ error: 'Supabase fetch error' })
  }
  const property = normaliseProperty(propResp.data ?? null)

  // Price tables STRICTLY by property_id
  const [matsResp, labsResp] = await Promise.all([
    supabase.from<MaterialPriceRow>('material_refurb_prices').select('*').eq('property_id', property_id),
    supabase.from<LabourPriceRow>('labour_refurb_prices').select('*').eq('property_id', property_id),
  ])

  const mats = Array.isArray(matsResp.data) ? matsResp.data : []
  const labs = Array.isArray(labsResp.data) ? labsResp.data : []

  const refurb_estimates = (mats.length || labs.length)
    ? buildRoomsFromPriceTables(mats, labs, property)
    : []

  const refurb_debug: any = {
    used: 'price_tables_by_property',
    property_id,
    counts: {
      materials: mats.length,
      labour: labs.length,
      errors: { mats: matsResp.error || null, labour: labsResp.error || null },
      samples: {
        materials: sampleRows(mats),
        labour: sampleRows(labs),
      },
    },
    env: { supabase_url_tail: (SUPABASE_URL || '').slice(-10) },
  }

  // Optional deeper debug: return first 10 raw rows (trimmed fields only)
  if (debug) {
    const trimMat = (r: MaterialPriceRow) => ({
      id: r.id, property_id: r.property_id, run_id: r.run_id,
      room_type: r.room_type, image_index: r.image_index,
      item_key: r.item_key ?? r.material ?? null,
      qty_with_waste: r.qty_with_waste, qty_raw: r.qty_raw, qty: r.qty, units_to_buy: r.units_to_buy,
      unit_price_material_gbp: r.unit_price_material_gbp, material_subtotal_gbp: r.material_subtotal_gbp,
      subtotal_gbp: r.subtotal_gbp, created_at: r.created_at,
    })
    const trimLab = (r: LabourPriceRow) => ({
      id: r.id, property_id: r.property_id, run_id: r.run_id,
      room_type: r.room_type, image_index: r.image_index,
      trade_key: r.trade_key, total_hours: r.total_hours, crew_size: r.crew_size,
      hourly_rate_gbp: r.hourly_rate_gbp, labour_cost_gbp: r.labour_cost_gbp, created_at: r.created_at,
    })
    refurb_debug.raw_preview = {
      materials: mats.slice(0, 10).map(trimMat),
      labour: labs.slice(0, 10).map(trimLab),
    }
  }

  return res.status(200).json({
    status: 'completed' as const,
    property_id,
    property,
    financials: finResp.data ?? null,
    refurb_estimates,
    pdf_url: null, // not managed here; keep if you attach PDFs elsewhere
    refurb_debug,
  })
}
