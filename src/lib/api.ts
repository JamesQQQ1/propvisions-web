// src/lib/api.ts
export type RunStatus = 'queued' | 'processing' | 'completed' | 'failed'
export type Usage = { count: number; limit: number; remaining: number }

/** v2 shapes: categories (materials) + trades (labour) */
export type MaterialCategory = {
  item_key: string
  gross_gbp?: number | string | null
  net_gbp?: number | string | null
  vat_gbp?: number | string | null
  subtotal_gbp?: number | string | null // fallback (gross)
  lines?: number | null
}

export type LabourTrade = {
  job_line_id?: string | null
  trade_key?: string | null
  trade_name?: string | null
  total_hours?: number | string | null
  crew_size?: number | string | null
  hourly_rate_gbp?: number | string | null
  labour_cost_gbp?: number | string | null
  ai_confidence?: number | string | null
  notes?: string | null
}

/** Matches what RoomCard v2 (materials+labour aggregates) consumes */
export type RefurbRoom = {
  id?: string
  detected_room_type?: string | null
  room_type?: string | null

  // imagery
  image_url?: string | null
  image_id?: string | null
  image_index?: number | null

  // v2 aggregates (can arrive as JSON string)
  materials?: MaterialCategory[] | string | null
  labour?: LabourTrade[] | string | null

  // v2 totals (prefer *_with_vat for UI)
  materials_total_with_vat_gbp?: number | string | null
  materials_total_gbp?: number | string | null
  labour_total_gbp?: number | string | null
  room_total_with_vat_gbp?: number | string | null
  room_total_gbp?: number | string | null
  room_confidence?: number | string | null

  // legacy fields kept for back-compat (not required by the new UI)
  wallpaper_or_paint_gbp?: number | string | null
  flooring_gbp?: number | string | null
  plumbing_gbp?: number | string | null
  electrics_gbp?: number | string | null
  mould_or_damp_gbp?: number | string | null
  structure_gbp?: number | string | null
  works?: Array<{
    category: string
    description?: string
    unit?: string
    qty?: number
    unit_rate_gbp?: number
    subtotal_gbp?: number
  }> | string | null
  estimated_total_gbp?: number | string | null

  // misc
  confidence?: number | null
  assumptions?: Record<string, any> | null
  risk_flags?: Record<string, boolean> | null

  // optional p70s
  p70_total_low_gbp?: number | string | null
  p70_total_high_gbp?: number | string | null
  totals?: {
    p70_total_low_gbp?: number | string | null
    p70_total_high_gbp?: number | string | null
    estimated_total_gbp?: number | string | null
  } | null
}

type AnalyzeKickoff = {
  run_id?: string
  execution_id?: string
  status?: string
  usage?: Usage
}

export type StatusResponse = {
  status: RunStatus
  run?: any
  error?: string
  property_id?: string | null
  property?: any
  financials?: Record<string, unknown> | null
  refurb_estimates?: RefurbRoom[]
  pdf_url?: string | null
  /** useful for debugging new model payloads */
  refurb_debug?: any
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(input, {
      cache: init?.cache ?? 'no-store',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      const e: any = new Error('Request aborted')
      e.code = 'ABORTED'
      throw e
    }
    const e: any = new Error(`Failed to fetch: ${err?.message || 'network error'}`)
    e.code = 'NETWORK'
    throw e
  }

  const text = await res.text()
  let json: any
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    if (!res.ok) {
      const err: any = new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
      err.status = res.status
      throw err
    }
    return text as any
  }

  if (!res.ok) {
    const err: any = new Error(json?.error || `HTTP ${res.status}`)
    err.status = res.status
    err.body = json
    if (json?.usage) err.usage = json.usage
    throw err
  }
  return json as T
}

export async function startAnalyze(url: string): Promise<{ run_id: string; execution_id: string; usage?: Usage }> {
  const payload = await fetchJson<AnalyzeKickoff>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })

  const run_id = payload.run_id
  const execution_id = payload.execution_id

  if (!run_id || !execution_id) {
    const err: any = new Error('Workflow did not return a valid run_id/execution_id')
    err.usage = (payload as any)?.usage
    throw err
  }

  return { run_id, execution_id, usage: payload.usage }
}

export async function getStatus(run_id: string): Promise<StatusResponse> {
  return await fetchJson<StatusResponse>(
    `/api/status?run_id=${encodeURIComponent(run_id)}`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    }
  )
}

export async function stopRun(
  run_id: string,
  execution_id: string
): Promise<{ ok: boolean; message?: string }> {
  // Align with client (demo page) which posts to /api/run/cancel
  const resp = await fetchJson<{ ok: boolean; message?: string }>(`/api/run/cancel`, {
    method: 'POST',
    body: JSON.stringify({ run_id, execution_id }),
  })
  return resp
}

export async function pollUntilDone(
  run_id: string,
  opts: {
    intervalMs?: number
    timeoutMs?: number | 0 | null // default below; pass 0/null to disable
    onTick?: (s: RunStatus) => void
    signal?: AbortSignal
  } = {}
): Promise<StatusResponse> {
  const baseInterval = Math.max(750, opts.intervalMs ?? 3000)

  // Default timeout = 1 hour (override by passing opts.timeoutMs; use 0/null to disable)
  const timeoutMs = opts.timeoutMs ?? 60 * 60 * 1000
  const startTs = Date.now()

  // Backoff state for transient errors
  let backoffMs = 0
  const backoffMax = 10_000 // cap at 10s

  while (true) {
    if (opts.signal?.aborted) {
      const e: any = new Error('Polling aborted')
      e.code = 'ABORTED'
      throw e
    }
    if (timeoutMs && Date.now() - startTs > timeoutMs) {
      throw new Error('Polling timed out')
    }

    try {
      const statusPayload = await getStatus(run_id) // no-store
      // Reset backoff after success
      backoffMs = 0

      const s = statusPayload.status
      opts.onTick?.(s)

      if (s === 'completed') return statusPayload
      if (s === 'failed') throw new Error(statusPayload.error || 'Run failed')

      // keep polling
      await new Promise((r) => setTimeout(r, baseInterval))
    } catch (e: any) {
      // Ignore user/navigation aborts
      if (e?.code === 'ABORTED' || e?.name === 'AbortError') throw e

      // Treat 404 as "queued" (race before status row exists)
      if (e?.status === 404) {
        opts.onTick?.('queued')
        await new Promise((r) => setTimeout(r, baseInterval))
        continue
      }

      // Transient errors: 5xx / 429 / 408 / network
      const transient =
        !e?.status || e.status >= 500 || e.status === 429 || e.status === 408 || e.code === 'NETWORK'
      if (transient) {
        backoffMs = backoffMs ? Math.min(backoffMs * 2, backoffMax) : baseInterval
        const jitter = Math.floor(Math.random() * 400)
        await new Promise((r) => setTimeout(r, backoffMs + jitter))
        continue
      }

      // Non-transient → bubble up
      throw e
    }
  }
}
