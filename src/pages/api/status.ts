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
  pdf_url?: string | null                 // ⬅️ add this
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

type RefurbEstimateRow = {
  id: string
  property_id: string
  room_type: string
  wallpaper_or_paint_gbp: number
  flooring_gbp: number
  plumbing_gbp: number
  electrics_gbp: number
  mould_or_damp_gbp: number
  structure_gbp: number
  estimated_total_gbp: number
  p70_total_low_gbp?: number | null
  p70_total_high_gbp?: number | null
  confidence?: number | null
  image_id?: string | null
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

  // 2) Look up the run row (filter by run_id)
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

  // 3) Status fan-out (ALWAYS include pdf_url if present)
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

  const [finResp, propResp, refurbResp] = await Promise.all([
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
    supabase
      .from<RefurbEstimateRow>('refurb_estimates')
      .select('*')
      .eq('property_id', property_id),
  ])

  if (finResp.error || propResp.error || refurbResp.error) {
    console.error('Supabase fetch errors:', {
      fin: finResp.error, prop: propResp.error, refurb: refurbResp.error,
    })
    return res.status(500).json({ error: 'Supabase fetch error after completion' })
  }

  return res.status(200).json({
    status: 'completed' as const,
    property_id,
    property: normaliseProperty(propResp.data ?? null),
    financials: finResp.data ?? null,
    refurb_estimates: Array.isArray(refurbResp.data) ? refurbResp.data : [],
    pdf_url: run.pdf_url ?? null,           // ⬅️ front-end will render the Download button
  })
}
