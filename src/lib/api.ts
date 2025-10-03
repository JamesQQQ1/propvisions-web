// src/lib/api.ts
export type RunStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type Usage = { count: number; limit: number; remaining: number };

export type MaterialCategory = {
  item_key: string;
  gross_gbp?: number | string | null;
  net_gbp?: number | string | null;
  vat_gbp?: number | string | null;
  subtotal_gbp?: number | string | null; // fallback (gross)
  lines?: number | null;
};

export type LabourTrade = {
  job_line_id?: string | null;
  trade_key?: string | null;
  trade_name?: string | null;
  total_hours?: number | string | null;
  crew_size?: number | string | null;
  hourly_rate_gbp?: number | string | null;
  labour_cost_gbp?: number | string | null;
  ai_confidence?: number | string | null;
  notes?: string | null;
};

export type RefurbRoom = {
  id?: string;
  detected_room_type?: string | null;
  room_type?: string | null;

  image_url?: string | null;
  image_id?: string | null;
  image_index?: number | null;

  materials?: MaterialCategory[] | string | null;
  labour?: LabourTrade[] | string | null;

  materials_total_with_vat_gbp?: number | string | null;
  materials_total_gbp?: number | string | null;
  labour_total_gbp?: number | string | null;
  room_total_with_vat_gbp?: number | string | null;
  room_total_gbp?: number | string | null;
  room_confidence?: number | string | null;

  // legacy/fallbacks
  wallpaper_or_paint_gbp?: number | string | null;
  flooring_gbp?: number | string | null;
  plumbing_gbp?: number | string | null;
  electrics_gbp?: number | string | null;
  mould_or_damp_gbp?: number | string | null;
  structure_gbp?: number | string | null;
  works?: Array<{
    category: string;
    description?: string;
    unit?: string;
    qty?: number;
    unit_rate_gbp?: number;
    subtotal_gbp?: number;
  }> | string | null;
  estimated_total_gbp?: number | string | null;

  confidence?: number | null;
  assumptions?: Record<string, any> | null;
  risk_flags?: Record<string, boolean> | null;

  p70_total_low_gbp?: number | string | null;
  p70_total_high_gbp?: number | string | null;
  totals?: {
    p70_total_low_gbp?: number | string | null;
    p70_total_high_gbp?: number | string | null;
    estimated_total_gbp?: number | string | null;
  } | null;
};

type AnalyzeKickoff = {
  run_id?: string;
  execution_id?: string;
  status?: string;
  usage?: Usage;
};

export type StatusResponse = {
  status: RunStatus;
  run?: any;
  error?: string;
  property_id?: string | null;
  property?: any;
  financials?: Record<string, unknown> | null;
  refurb_estimates?: RefurbRoom[];
  pdf_url?: string | null;
  refurb_debug?: any;
};

/* ───────── fetch helper ───────── */
async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, {
      cache: init?.cache ?? 'no-store',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      const e: any = new Error('Request aborted');
      e.code = 'ABORTED';
      throw e;
    }
    const e: any = new Error(`Failed to fetch: ${err?.message || 'network error'}`);
    e.code = 'NETWORK';
    throw e;
  }

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      const err: any = new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }
    return text as any;
  }

  if (!res.ok) {
    const err: any = new Error(json?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = json;
    if (json?.usage) err.usage = json.usage;
    throw err;
  }
  return json as T;
}

/* ───────── analyze + status APIs ───────── */
export async function startAnalyze(url: string): Promise<{ run_id: string; execution_id: string; usage?: Usage }> {
  const payload = await fetchJson<AnalyzeKickoff>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });

  const run_id = payload.run_id;
  const execution_id = payload.execution_id;

  if (!run_id || !execution_id) {
    const err: any = new Error('Workflow did not return a valid run_id/execution_id');
    err.usage = (payload as any)?.usage;
    throw err;
  }

  return { run_id, execution_id, usage: payload.usage };
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
    },
  );
}

export async function stopRun(
  run_id: string,
  execution_id: string,
): Promise<{ ok: boolean; message?: string }> {
  return await fetchJson<{ ok: boolean; message?: string }>(`/api/run/cancel`, {
    method: 'POST',
    body: JSON.stringify({ run_id, execution_id }),
  });
}

/** bump this whenever you redeploy so we can see in Console the new bundle loaded */
export const POLL_BUILD = 'pv-2025-10-03-D';

/* ───────── single, canonical poller (NO DUPLICATES) ───────── */
export async function pollUntilDone(
  run_id: string,
  opts: {
    intervalMs?: number;
    /** pass 0 or null to disable timeout completely */
    timeoutMs?: number | 0 | null;
    onTick?: (s: RunStatus) => void;
    signal?: AbortSignal;
  } = {},
): Promise<StatusResponse> {
  if (typeof window !== 'undefined' && !(window as any).__pv_poll_init_logged) {
    console.debug('[poll:init]', { POLL_BUILD, passedTimeout: opts.timeoutMs });
    (window as any).__pv_poll_init_logged = true;
  }

  const baseInterval = Math.max(750, opts.intervalMs ?? 3000);

  // 0/null => disabled, number => that number, otherwise default 1h
  const timeoutMs =
    opts.timeoutMs === 0 || opts.timeoutMs === null
      ? 0
      : typeof opts.timeoutMs === 'number'
      ? opts.timeoutMs
      : 60 * 60 * 1000;

  console.debug('[poll:config]', { POLL_BUILD, timeoutMs });

  const startTs = Date.now();
  let backoffMs = 0;
  const backoffMax = 10_000;

  while (true) {
    if (opts.signal?.aborted) {
      const e: any = new Error('Polling aborted');
      e.code = 'ABORTED';
      throw e;
    }

    if (timeoutMs !== 0 && Date.now() - startTs > timeoutMs) {
      throw new Error(`Polling timed out [${POLL_BUILD}]`);
    }

    try {
      const statusPayload = await getStatus(run_id);
      backoffMs = 0;

      const s = statusPayload.status;
      opts.onTick?.(s);

      if (s === 'completed') return statusPayload;
      if (s === 'failed') throw new Error(statusPayload.error || 'Run failed');

      await new Promise((r) => setTimeout(r, baseInterval));
    } catch (e: any) {
      if (e?.code === 'ABORTED' || e?.name === 'AbortError') throw e;

      // Treat any timeouts (edge/CDN/proxy wording) as transient
      const msg = (e?.message || '').toLowerCase();
      const bodyMsg = (e?.body && JSON.stringify(e.body).toLowerCase()) || '';
      const looksLikeEdgeTimeout =
        msg.includes('timed out') || msg.includes('timeout') ||
        bodyMsg.includes('timed out') || bodyMsg.includes('timeout');

      if (e?.status === 404 || looksLikeEdgeTimeout) {
        opts.onTick?.('queued');
        backoffMs = backoffMs ? Math.min(backoffMs * 2, backoffMax) : baseInterval;
        const jitter = Math.floor(Math.random() * 400);
        await new Promise((r) => setTimeout(r, backoffMs + jitter));
        continue;
      }

      const transient =
        !e?.status || e.status >= 500 || e.status === 429 || e.status === 408 || e.code === 'NETWORK';
      if (transient) {
        backoffMs = backoffMs ? Math.min(backoffMs * 2, backoffMax) : baseInterval;
        const jitter = Math.floor(Math.random() * 400);
        await new Promise((r) => setTimeout(r, backoffMs + jitter));
        continue;
      }

      throw e;
    }
  }
}
