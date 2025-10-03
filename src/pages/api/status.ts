// src/pages/api/status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * STATUS ENDPOINT
 * - Accepts ?run_id=... (legacy) or ?property_id=... (preferred).
 * - Reads from:
 *    - properties
 *    - property_room_materials
 *    - property_room_labour
 * - Shapes a UI-ready payload: property + refurb_estimates[]
 *
 * Notes:
 * - Materials table provides category subtotals; we emit pseudo "material lines"
 *   so RoomCard can render something meaningful.
 * - Labour table is already per-trade; we map to labour lines directly.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}
const supabase = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
  auth: { persistSession: false },
})

/* ───────────── helpers ───────────── */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const toStringQuery = (q: string | string[] | undefined) => (Array.isArray(q) ? q[0] : (q ?? ''))

const num = (x: any) => (Number.isFinite(+x) ? +x : 0)
const safeObj = <T = Record<string, unknown>>(x: any, fallback: T): T =>
  x && typeof x === 'object' ? (x as T) : fallback

/* ───────────── types (table shapes) ───────────── */
type PropertiesRow = {
  property_id: string
  property_title?: string | null
  address?: string | null
  postcode?: string | null
  property_type?: string | null
  tenure?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  receptions?: number | null

  listing_url?: string | null
  listing_images?: string[] | null
  floorplan_urls?: string[] | null
  epc_image_urls?: string[] | null

  // image helpers
  images_map?: Record<string, string> | null
  image_urls_by_room?: Record<string, string[]> | null
  primary_image_url_by_room?: Record<string, string> | null

  // commercial bits we surface in "financials"
  price_gbp?: number | null
  guide_price_gbp?: number | null
  asking_price_gbp?: number | null
  purchase_price_gbp?: number | null
  monthly_rent_gbp?: number | null
  annual_rent_gbp?: number | null

  // refurbishment totals (already computed)
  property_total_without_vat?: number | null
  property_total_with_vat?: number | null

  // optional scenario/summary blobs (we’ll pass through if present)
  scenarios?: any
  summary?: any

  // compatibility with run-based polling (if you store it)
  last_run_id?: string | null

  // misc we show in PDF later
  property_description?: string | null
  features?: string[] | null
  epc_rating_current?: string | null
  epc_score_current?: number | null
  epc_rating_potential?: string | null
  epc_score_potential?: number | null
  agent_name?: string | null
  agent_phone?: string | null
  agent_email?: string | null
}

type RoomMaterialsRow = {
  id: string
  property_id: string
  image_id: string | null
  room_type: string | null  // e.g., "Kitchen", "Living Room", "Bathroom"
  subtotals: {
    all?: { net?: number; vat?: number; gross?: number } | null
    by_category?: Record<
      string,
      { net?: number; vat?: number; gross?: number; lines?: number | null }
    > | null
  } | null
  created_at?: string | null
  updated_at?: string | null
}

type RoomLabourRow = {
  id: string
  property_id: string
  image_id: string | null
  room_type: string | null // e.g., "kitchen", "bathroom"
  trade_name: string | null // e.g., "Electricians and electrical fitters"
  crew_size?: number | null
  trade_total_hours?: number | null
  labour_cost_mean_charge?: number | null // already currency
  created_at?: string | null
  updated_at?: string | null
}

/* ───────────── shape for the UI (matches your RoomCard) ───────────── */
type RefurbRoom = {
  id?: string
  detected_room_type?: string | null
  room_type?: string | null
  image_url?: string | null
  image_id?: string | null
  image_index?: number | null

  // pseudo-lines from category subtotals
  materials?: Array<{
    item_key?: string
    subtotal_gbp?: number | string | null
  }> | null

  labour?: Array<{
    trade_key?: string | null
    crew_size?: number | string | null
    total_hours?: number | string | null
    labour_cost_gbp?: number | string | null
  }> | null

  materials_total_gbp?: number | string | null
  materials_total_with_vat_gbp?: number | string | null
  labour_total_gbp?: number | string | null
  room_total_gbp?: number | string | null
  room_total_with_vat_gbp?: number | string | null
}

/* ───────────── normalisers ───────────── */
function findImageUrl(
  image_id: string | null | undefined,
  p: PropertiesRow | null
): string | null {
  if (!image_id || !p) return null
  const url = safeObj(p.images_map, {} as Record<string, string>)[image_id]
  if (typeof url === 'string' && url) return url
  // Fallback: if listing_images provided and image_id ends with _N, try index
  const m = /_(\d+)$/.exec(image_id)
  const idx = m ? Math.max(0, +m[1] - 1) : -1
  const imgs = Array.isArray(p.listing_images) ? p.listing_images : []
  return idx >= 0 && idx < imgs.length ? imgs[idx] : null
}

function titleCaseRoom(rt: string | null | undefined) {
  if (!rt) return null
  return rt
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim()
}

/** Merge property_room_materials + property_room_labour into RefurbRoom[] */
function buildRooms(
  mats: RoomMaterialsRow[],
  labs: RoomLabourRow[],
  property: PropertiesRow | null
): RefurbRoom[] {
  type Agg = {
    image_id: string | null
    room_type: string | null
    materials_rows: RoomMaterialsRow[]
    labour_rows: RoomLabourRow[]
  }
  const map = new Map<string, Agg>()
  const keyOf = (image_id: string | null | undefined, room_type: string | null | undefined) =>
    `${image_id ?? '-'}|${(room_type ?? '').toLowerCase()}`

  for (const r of mats || []) {
    const k = keyOf(r.image_id, r.room_type)
    if (!map.has(k)) map.set(k, { image_id: r.image_id ?? null, room_type: r.room_type ?? null, materials_rows: [], labour_rows: [] })
    map.get(k)!.materials_rows.push(r)
  }
  for (const r of labs || []) {
    const k = keyOf(r.image_id, r.room_type)
    if (!map.has(k)) map.set(k, { image_id: r.image_id ?? null, room_type: r.room_type ?? null, materials_rows: [], labour_rows: [] })
    map.get(k)!.labour_rows.push(r)
  }

  const out: RefurbRoom[] = []

  Array.from(map.values()).forEach((agg, idx) => {
    // MATERIALS → pseudo lines from category subtotals
    const matLines: RefurbRoom['materials'] = []
    let matGross = 0
    let matNet = 0
    let matVat = 0

    for (const m of agg.materials_rows) {
      const st = safeObj(m.subtotals, {})
      const all = safeObj(st.all, {})
      matGross += num(all.gross)
      matNet += num(all.net)
      matVat += num(all.vat)

      const cats = safeObj(st.by_category, {} as NonNullable<RoomMaterialsRow['subtotals']>['by_category'])
      for (const [cat, vals] of Object.entries(cats || {})) {
        const gross = num((vals as any)?.gross)
        if (gross > 0) {
          matLines!.push({
            item_key: cat.replace(/_/g, ' '),
            subtotal_gbp: gross,
          })
        }
      }
    }

    // LABOUR → one line per trade_name row
    const labLines: RefurbRoom['labour'] = []
    let labourTotal = 0
    for (const l of agg.labour_rows) {
      const cost = num(l.labour_cost_mean_charge)
      labourTotal += cost
      labLines!.push({
        trade_key: l.trade_name || 'Labour',
        crew_size: l.crew_size ?? 1,
        total_hours: l.trade_total_hours ?? null,
        labour_cost_gbp: cost,
      })
    }

    const imageUrl = findImageUrl(agg.image_id, property)
    const roomType = titleCaseRoom(agg.room_type) || null
    const materialsTotalGross = matGross || null
    const roomTotalGross = num(materialsTotalGross) + num(labourTotal)

    out.push({
      id: `room-${idx}`,
      image_id: agg.image_id ?? null,
      image_url: imageUrl,
      room_type: roomType,
      detected_room_type: roomType,

      materials: matLines?.length ? matLines : null,
      labour: labLines?.length ? labLines : null,

      materials_total_gbp: matNet || materialsTotalGross, // keep something even if net missing
      materials_total_with_vat_gbp: materialsTotalGross,
      labour_total_gbp: labourTotal || null,
      room_total_gbp: roomTotalGross || null,
      room_total_with_vat_gbp: roomTotalGross || null,
    })
  })

  // Sort: kitchen, bathroom, living, bedrooms, then others (nice UX)
  const order = ['kitchen', 'bathroom', 'living', 'sitting', 'bedroom']
  out.sort((a, b) => {
    const ia = order.findIndex((k) => (a.room_type || '').toLowerCase().includes(k))
    const ib = order.findIndex((k) => (b.room_type || '').toLowerCase().includes(k))
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  return out
}

/* ───────────── handler ───────────── */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }) }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Server not configured (Supabase env missing)' })

  const run_id = toStringQuery(req.query.run_id)
  let property_id = toStringQuery(req.query.property_id)

  try {
    // Legacy polling path: resolve run -> property_id if caller only sends run_id
    if (!property_id && run_id) {
      // Prefer direct lookup on properties.last_run_id (cheap, one table)
      const p = await supabase.from<PropertiesRow>('properties')
        .select('property_id')
        .eq('last_run_id', run_id)
        .maybeSingle()

      if (p.data?.property_id) {
        property_id = p.data.property_id
      } else {
        // If your n8n creates some other "runs" table, you can resolve here.
        // We treat the absence as "still processing".
        return res.status(200).json({ status: 'processing' as const, run: { run_id } })
      }
    }

    if (!property_id || !UUID_RE.test(property_id)) {
      return res.status(400).json({ error: 'Provide a valid property_id (UUID) or a run_id that resolves to one' })
    }

    // ---- Fetch core objects ----
    const [propResp, matsResp, labsResp] = await Promise.all([
      supabase.from<PropertiesRow>('properties').select('*').eq('property_id', property_id).maybeSingle(),
      supabase.from<RoomMaterialsRow>('property_room_materials').select('*').eq('property_id', property_id),
      supabase.from<RoomLabourRow>('property_room_labour').select('*').eq('property_id', property_id),
    ])

    if (propResp.error) {
      console.error('properties error', propResp.error)
      return res.status(500).json({ status: 'failed', error: 'Failed to fetch property' })
    }
    if (matsResp.error) {
      console.error('materials error', matsResp.error)
      return res.status(500).json({ status: 'failed', error: 'Failed to fetch room materials' })
    }
    if (labsResp.error) {
      console.error('labour error', labsResp.error)
      return res.status(500).json({ status: 'failed', error: 'Failed to fetch room labour' })
    }

    const property = propResp.data ?? null
    const mats = Array.isArray(matsResp.data) ? matsResp.data : []
    const labs = Array.isArray(labsResp.data) ? labsResp.data : []

    // If property isn’t present yet but run exists → still processing
    if (!property) {
      return res.status(200).json({ status: 'processing' as const, run: { run_id, property_id: null } })
    }

    // ---- Build rooms for the UI ----
    const refurb_estimates = buildRooms(mats, labs, property)

    // ---- Synthesise a compact "financials" block from properties row ----
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
    }

    // Optional PDF url fields you’re storing (we’ll pass through if you add later)
    const pdf_url = (property as any)?.property_pdf ?? null

    return res.status(200).json({
      status: 'completed' as const,
      property_id,
      property,
      financials,
      refurb_estimates,
      pdf_url,
    })
  } catch (err: any) {
    console.error('STATUS_HANDLER_ERR', err?.message || err)
    return res.status(500).json({ status: 'failed', error: 'Unexpected server error' })
  }
}
