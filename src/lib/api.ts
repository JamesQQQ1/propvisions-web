// src/lib/api.ts
export type RunStatus = 'queued' | 'processing' | 'completed' | 'failed'

export type Usage = { count: number; limit: number; remaining: number }

type AnalyzeKickoff = {
  run_id?: string
  execution_id?: string
  status?: string
  usage?: Usage
}

type StatusResponse = {
  status: RunStatus
  run?: any
  error?: string
  property_id?: string | null
  property?: any
  financials?: Record<string, unknown> | null
  refurb_estimates?: any[]
  pdf_url?: string | null
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(input, {
      // prevent caching unless caller overrides
      cache: init?.cache ?? 'no-store',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
  } catch (err: any) {
    // Network / CORS / offline / aborted
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
    // OK but not JSON
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
  const resp = await fetchJson<{ ok: boolean; message?: string }>(`/api/stop`, {
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
