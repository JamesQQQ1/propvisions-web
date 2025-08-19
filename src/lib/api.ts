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
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const text = await res.text()
  let json: any
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`) as any
      ;(err as any).status = res.status
      throw err
    }
    return text as any
  }
  if (!res.ok) {
    const err = new Error(json?.error || `HTTP ${res.status}`) as any
    err.status = res.status
    err.body = json
    if (json?.usage) (err as any).usage = json.usage
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
    ;(err as any).usage = (payload as any)?.usage
    throw err
  }

  return { run_id, execution_id, usage: payload.usage }
}

export async function getStatus(run_id: string): Promise<StatusResponse> {
  return await fetchJson<StatusResponse>(`/api/status?run_id=${encodeURIComponent(run_id)}`)
}

export async function stopRun(run_id: string, execution_id: string): Promise<{ ok: boolean; message?: string }> {
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
    timeoutMs?: number
    onTick?: (s: RunStatus) => void
    signal?: AbortSignal
  } = {}
): Promise<StatusResponse> {
  const intervalMs = Math.max(750, opts.intervalMs ?? 2500)
  const timeoutMs = opts.timeoutMs ?? 10 * 60 * 1000
  const started = Date.now()

  while (true) {
    if (opts.signal?.aborted) throw new Error('Polling aborted')
    if (timeoutMs && Date.now() - started > timeoutMs) throw new Error('Polling timed out')

    let statusPayload: StatusResponse | undefined
    try {
      statusPayload = await getStatus(run_id)
    } catch (e: any) {
      if (e?.status === 404) {
        opts.onTick?.('queued')
        await new Promise((r) => setTimeout(r, intervalMs))
        continue
      }
      throw e
    }

    const s = statusPayload.status
    opts.onTick?.(s)

    if (s === 'completed') return statusPayload
    if (s === 'failed') throw new Error(statusPayload.error || 'Run failed')

    await new Promise((r) => setTimeout(r, intervalMs))
  }
}
