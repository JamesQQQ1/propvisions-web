// src/pages/api/status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/** --- Env & Supabase admin client (server-only) --- */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
  auth: { persistSession: false },
})

/** --- Minimal table row types --- */
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

/** Legacy table (back-compat) */
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

/** New tables */
type RefurbRoomRow = {
  id: string
  property_id: string
  room_index: number
  room_type: string | null
  image_id: string | null
  image_index: number | null
  materials_total_gbp: number | null
  labour_total_gbp: number | null
  room_total_gbp: number | null
  room_confidence: number | null
}
type RefurbMaterialRow = {
  property_id: string
  room_index: number
  material_index: number
  job_line_id?: string | null
  item_key?: string | null
  unit?: string | null
  qty?: number | null
  unit_price_material_gbp?: number | null
  subtotal_gbp?: number | null
  waste_pct?: number | null
  units_to_buy?: number | null
  notes?: string | null
  assumed_area_m2?: number | null
  confidence?: number | null
}
type RefurbLabourRow = {
  property_id: string
  room_index: number
  labour_index: number
  job_line_id?: string | null
  trade_key?: string | null
  total_hours?: number | null
  crew_size?: number | null
  hourly_rate_gbp?: number | null
  labour_cost_gbp?: number | null
  ai_confidence?: number | null
  notes?: string | null
}

/** --- Helpers --- */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const toStringQuery = (q: string | string[] | undefined) =>
  Array.isArray(q) ? q[0] : (q ?? '')

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

/** Map by room_index for quick joins */
function indexByRoom<T extends { room_index: number }>(rows: T[]): Map<number, T[]> {
  const m = new Map<number, T[]>()
  rows.forEach(r => {
    const k = r.room_index
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push(r)
  })
  return m
}

/** Choose an image URL from listing_images using a possibly 1-based index */
function pickImageUrl(
  image_index: number | null,
  listing_images: string[] | null | undefined
): string | null {
  if (!listing_images || !listing_images.length || image_index == null) return null
  const idxs = [image_index, image_index - 1].filter(
    (n): n is number => typeof n === 'number' && n >= 0 && n < listing_images.length
  )
  for (const i of idxs) {
    const u = listing_images[i]
    if (u) return u
  }
  return null
}

/** Build display refurb rows from the NEW tables (includes materials + labour arrays) */
function buildRefurbFromNewTables(
  rooms: RefurbRoomRow[],
  mats: RefurbMaterialRow[],
  labs: RefurbLabourRow[],
  property: ReturnType<typeof normaliseProperty> | null
) {
  const byRoomMat = indexByRoom(mats || [])
  const byRoomLab = indexByRoom(labs || [])
  const images = property?.listing_images || null

  return (rooms || [])
    .sort((a, b) => (a.room_index ?? 0) - (b.room_index ?? 0))
    .map(r => {
      const materials = byRoomMat.get(r.room_index) || []
      const labour = byRoomLab.get(r.room_index) || []

      const image_url = pickImageUrl(r.image_index, images)

      // Totals: prefer explicit columns; UI can also sum line items if these are 0/NULL
      const materials_total_gbp = r.materials_total_gbp ?? null
      const labour_total_gbp = r.labour_total_gbp ?? null
      const room_total_gbp =
        r.room_total_gbp ??
        (materials_total_gbp ?? 0) + (labour_total_gbp ?? 0)

      return {
        id: r.id,
        detected_room_type: r.room_type ?? undefined,
        room_type: r.room_type ?? undefined,
        image_url,
        image_id: r.image_id ?? null,
        image_index: r.image_index ?? null,

        // v2 arrays (CRUCIAL so the UI can compute even when totals are missing)
        materials,
        labour,

        // explicit totals (if present)
        materials_total_gbp,
        labour_total_gbp,
        room_total_gbp,

        room_confidence: r.room_confidence ?? null,
        confidence: r.room_confidence ?? null,

        // keep a small "works" list for legacy readers (category + subtotal only)
        works: [
          ...materials.map(m => ({
            category: 'materials',
            description: m.item_key || 'material',
            unit: m.unit || '',
            qty: m.qty ?? undefined,
            unit_rate_gbp: m.unit_price_material_gbp ?? undefined,
            subtotal_gbp: m.subtotal_gbp ?? undefined,
          })),
          ...labour.map(l => ({
            category: l.trade_key || 'labour',
            description: l.notes || '',
            unit: 'hours',
            qty: l.total_hours ?? undefined,
            unit_rate_gbp: l.hourly_rate_gbp ?? undefined,
            subtotal_gbp: l.labour_cost_gbp ?? undefined,
          })),
        ],
      }
    })
}

/** If no rooms exist but materials/labour do, synthesize rooms grouped by room_index */
function synthesizeRoomsFromLines(
  mats: RefurbMaterialRow[],
  labs: RefurbLabourRow[],
  property: ReturnType<typeof normaliseProperty> | null,
  property_id: string
) {
  const byMat = indexByRoom(mats || [])
  const byLab = indexByRoom(labs || [])
  const roomIndexes = Array.from(new Set<number>([
    ...Array.from(byMat.keys()),
    ...Array.from(byLab.keys()),
  ]))

  const images = property?.listing_images || null

  return roomIndexes
    .sort((a, b) => a - b)
    .map(room_index => {
      const materials = byMat.get(room_index) || []
      const labour = byLab.get(room_index) || []

      const matSum = materials.reduce((a, m) => a + (m.subtotal_gbp ?? 0), 0)
      const labSum = labour.reduce((a, l) => a + (l.labour_cost_gbp ?? 0), 0)

      const image_index =
        materials[0]?.['image_index' as any] ??
        (labour[0] as any)?.image_index ?? null
      const image_url = pickImageUrl(
        typeof image_index === 'number' ? image_index : null,
        images
      )

      return {
        id: `syn-${property_id}-${room_index}`,
        detected_room_type: undefined,
        room_type: 'room',
        image_url,
        image_id: null,
        image_index: (typeof image_index === 'number' ? image_index : null),

        materials,
        labour,

        materials_total_gbp: matSum || null,
        labour_total_gbp: labSum || null,
        room_total_gbp: (matSum + labSum) || null,
        room_confidence: null,
        confidence: null,

        works: [
          ...materials.map(m => ({
            category: 'materials',
            description: m.item_key || 'material',
            unit: m.unit || '',
            qty: m.qty ?? undefined,
            unit_rate_gbp: m.unit_price_material_gbp ?? undefined,
            subtotal_gbp: m.subtotal_gbp ?? undefined,
          })),
          ...labour.map(l => ({
            category: l.trade_key || 'labour',
            description: l.notes || '',
            unit: 'hours',
            qty: l.total_hours ?? undefined,
            unit_rate_gbp: l.hourly_rate_gbp ?? undefined,
            subtotal_gbp: l.labour_cost_gbp ?? undefined,
          })),
        ],
      }
    })
}

/** --- API handler --- */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured (Supabase env missing)' })
  }

  // 1) Validate run_id
  const run_id = toStringQuery(req.query.run_id)
  if (!run_id) return res.status(400).json({ error: 'Missing run_id' })
  if (!UUID_RE.test(run_id)) {
    return res.status(400).json({ error: 'Invalid run_id format (must be UUID)' })
  }

  // 2) Look up the run row
  const runResp = await supabase
    .from<RunRow>('runs')
    .select('*')
    .eq('run_id', run_id)
    .maybeSingle()

  if (runResp.error) {
    console.error('Supabase runs query error:', runResp.error)
    return res.status(500).json({ error: 'Supabase runs query failed' })
  }
  const run = runResp.data
  if (!run) return res.status(404).json({ error: 'Run not found' })

  // 3) Status fan-out (always include pdf_url if present)
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

  // 4) Completed → fetch rows for UI
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
    supabase
      .from<FinancialsRow>('property_financials')
      .select('*')
      .eq('property_id', property_id)
      .maybeSingle(),
    supabase
      .from<PropertyRow>('properties')
      .select('*')
      .eq('id', property_id)
      .maybeSingle(),
  ])

  if (finResp.error || propResp.error) {
    console.error('Supabase fetch errors:', {
      fin: finResp.error, prop: propResp.error,
    })
    return res.status(500).json({ error: 'Supabase fetch error after completion' })
  }

  const property = normaliseProperty(propResp.data ?? null)

  // NEW refurb tables
  const [roomsResp, matsResp, labsResp] = await Promise.all([
    supabase.from<RefurbRoomRow>('refurb_rooms').select('*').eq('property_id', property_id),
    supabase.from<RefurbMaterialRow>('refurb_materials').select('*').eq('property_id', property_id),
    supabase.from<RefurbLabourRow>('refurb_labour').select('*').eq('property_id', property_id),
  ])

  let refurb_estimates: any[] = []
  let refurb_debug: any = {
    property_id,
    new_rooms_count: Array.isArray(roomsResp.data) ? roomsResp.data.length : 0,
    new_materials_count: Array.isArray(matsResp.data) ? matsResp.data.length : 0,
    new_labour_count: Array.isArray(labsResp.data) ? labsResp.data.length : 0,
    used: 'none',
  }

  const haveRooms = !roomsResp.error && Array.isArray(roomsResp.data) && roomsResp.data.length > 0
  const haveLines =
    (!matsResp.error && Array.isArray(matsResp.data) && matsResp.data.length > 0) ||
    (!labsResp.error && Array.isArray(labsResp.data) && labsResp.data.length > 0)

  if (haveRooms) {
    refurb_estimates = buildRefurbFromNewTables(
      roomsResp.data || [],
      matsResp.data || [],
      labsResp.data || [],
      property
    )
    refurb_debug.used = 'new_tables_rooms'
  } else if (haveLines) {
    refurb_estimates = synthesizeRoomsFromLines(
      matsResp.data || [],
      labsResp.data || [],
      property,
      property_id
    )
    refurb_debug.used = 'new_tables_synth'
  } else {
    // Legacy fallback
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

    // helper for debugging in Network tab (ignored by UI)
    refurb_debug,
  })
}
