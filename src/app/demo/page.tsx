// src/app/demo/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { pollUntilDone, type RunStatus, startAnalyze } from '@/lib/api'

/* ---------- helpers ---------- */
function formatGBP(n?: number | string | null) {
  const v = typeof n === 'string' ? Number(n) : n
  return Number.isFinite(v as number) ? `£${Math.round(v as number).toLocaleString()}` : '—'
}
function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}
const HIDE_FIN_KEYS = new Set(['id', 'property_id', 'created_at', 'updated_at'])
const isMoneyKey = (k: string) => k.endsWith('_gbp')
const titleize = (k: string) => k.replace(/_/g, ' ')
const fmtValue = (k: string, v: unknown) => {
  if (v === null || v === undefined || v === '') return '—'
  if (k === 'roi_percent') return `${Number(v).toFixed(2)}%`
  if (isMoneyKey(k)) return formatGBP(v as any)
  if (typeof v === 'number') return v.toLocaleString()
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString() : String(v)
}

type Usage = { count: number; limit: number; remaining: number } | null

function StatusBadge({ status }: { status?: RunStatus | 'idle' }) {
  const color =
    status === 'completed'
      ? 'bg-green-100 text-green-800 border-green-200'
      : status === 'failed'
      ? 'bg-red-100 text-red-800 border-red-200'
      : status === 'queued' || status === 'processing'
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-gray-100 text-gray-800 border-gray-200'
  return (
    <span className={classNames('inline-block px-2 py-0.5 text-xs rounded border', color)}>
      {status || 'idle'}
    </span>
  )
}

/* ---------- tiny progress bar component ---------- */
function ProgressBar({ percent, show }: { percent: number; show: boolean }) {
  return (
    <div className={classNames('mt-3 w-full', !show && 'hidden')}>
      <div className="h-2 w-full bg-slate-200/70 rounded overflow-hidden">
        <div
          className="h-2 bg-blue-600 transition-[width] duration-300 ease-out will-change-[width]"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  )
}

/* ---------- page ---------- */
export default function Page() {
  const router = useRouter()

  // --- NEW: gate check
  const [gate, setGate] = useState<'checking' | 'ok' | 'denied'>('checking')
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/demo-auth', { method: 'GET', credentials: 'include' })
        if (!cancelled) setGate(res.ok ? 'ok' : 'denied')
        if (!res.ok) router.replace('/demo-access?next=/demo')
      } catch {
        if (!cancelled) {
          setGate('denied')
          router.replace('/demo-access?next=/demo')
        }
      }
    })()
    return () => { cancelled = true }
  }, [router])

  // while checking, render nothing (avoids flash)
  if (gate === 'checking') {
    return <main className="p-6 max-w-6xl mx-auto"><p className="text-slate-500">Loading…</p></main>
  }
  // if denied, we already redirected; render nothing
  if (gate === 'denied') return null

  // --- existing state
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<RunStatus | 'idle'>('idle')
  const [error, setError] = useState<string>()
  const [elapsedMs, setElapsedMs] = useState(0)
  const [usage, setUsage] = useState<Usage>(null)
  const [data, setData] = useState<{
    property_id: string | null
    property: any
    financials: Record<string, unknown> | null
    refurb_estimates: any[]
    pdf_url?: string | null
  } | null>(null)

  // Keep the current run + exec ids so Stop can hard-cancel via API
  const runIdRef = useRef<string | null>(null)
  const execIdRef = useRef<string | null>(null)

  const running = status === 'queued' || status === 'processing'
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const submittingRef = useRef(false) // client-side debounce

  /* ---------- PROGRESS: slow ramp for 5 minutes then snap ---------- */
  const [progress, setProgress] = useState(0)
  const progressTickRef = useRef<NodeJS.Timeout | null>(null)
  const RAMP_MS = 5 * 60 * 1000 // 5 minutes
  const MAX_DURING_RUN = 97 // never exceed this until complete

  // when running, track elapsed for label and for progress ramp
  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      return
    }
    startedAtRef.current = Date.now()
    setElapsedMs(0)
    timerRef.current = setInterval(() => {
      if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current)
    }, 250)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [running])

  // progress ramp controller
  useEffect(() => {
    if (!running) {
      if (progressTickRef.current) clearInterval(progressTickRef.current)
      progressTickRef.current = null
      return
    }

    // kick visible start
    setProgress((p) => (p < 6 ? 6 : p))

    progressTickRef.current = setInterval(() => {
      if (!startedAtRef.current) return
      const elapsed = Date.now() - startedAtRef.current
      const target = Math.min(MAX_DURING_RUN, (elapsed / RAMP_MS) * MAX_DURING_RUN)
      setProgress((p) => (p < target ? p + Math.min(0.8, target - p) : p))
    }, 300)

    return () => {
      if (progressTickRef.current) clearInterval(progressTickRef.current)
      progressTickRef.current = null
    }
  }, [running])

  // snap to 100 on completion; reset on failure/idle (when not running)
  useEffect(() => {
    if (status === 'completed') {
      setProgress(100)
    } else if ((status === 'failed' || status === 'idle') && !running) {
      setProgress(0)
    }
  }, [status, running])

  const elapsedLabel = useMemo(() => {
    const s = Math.floor(elapsedMs / 1000)
    const m = Math.floor(s / 60)
    const rs = s % 60
    return m ? `${m}m ${rs}s` : `${rs}s`
  }, [elapsedMs])

  const validUrl = useMemo(() => {
    try {
      if (!url) return false
      const u = new URL(url)
      return !!u.protocol && !!u.hostname
    } catch {
      return false
    }
  }, [url])

  const sampleUrls = [
    'https://auctions.savills.co.uk/auctions/19-august-2025-211/152-154-crockhamwell-road-woodley-reading-rg5-3jh-18173',
    'https://auctions.savills.co.uk/auctions/19-august-2025-211/9-seedhill-road-11942',
    'https://www.rightmove.co.uk/properties/123456789#/',
  ]

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true

    try {
      setError(undefined)
      setData(null)

      if (usage && usage.remaining === 0) {
        setStatus('failed')
        setError('Daily demo limit reached.')
        return
      }

      setStatus('queued')
      setProgress((p) => (p < 6 ? 6 : p)) // ensure bar shows immediately

      // Kick off the workflow; now captures execution_id (if available)
      let kickoff: { run_id: string; execution_id?: string; usage?: Usage }
      try {
        kickoff = await startAnalyze(url)
      } catch (err: any) {
        setStatus('failed')
        setError(err?.message || 'Failed to start analysis')
        if (err?.usage) setUsage(err.usage as Usage)
        return
      }

      if (kickoff.usage) setUsage(kickoff.usage as Usage)

      runIdRef.current = kickoff.run_id || null
      execIdRef.current = kickoff.execution_id ?? null

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const result: any = await pollUntilDone(kickoff.run_id, {
          intervalMs: 2500,
          timeoutMs: 10 * 60 * 1000,
          onTick: (s) => setStatus(s),
          signal: controller.signal,
        })

        setStatus('completed')
        setProgress(100) // snap to full on success
        setData({
          property_id: result.property_id ?? null,
          property: result.property ?? null,
          financials: result.financials ?? null,
          refurb_estimates: Array.isArray(result.refurb_estimates) ? result.refurb_estimates : [],
          pdf_url: result.pdf_url ?? null,
        })
      } catch (err: any) {
        setError(err?.message === 'Polling aborted' ? 'Cancelled.' : (err?.message || 'Run failed'))
        setStatus('failed')
      } finally {
        abortRef.current = null
      }
    } finally {
      setTimeout(() => {
        submittingRef.current = false
      }, 300)
    }
  }

  async function handleCancel() {
    const run_id = runIdRef.current
    const execution_id = execIdRef.current
    try {
      await fetch('/api/run/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id, execution_id }),
      })
    } catch {}
    abortRef.current?.abort()
    abortRef.current = null
    setStatus('failed')
    setError(execution_id ? 'Stop requested.' : 'Stopped locally (no execution id).')
  }

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">PropertyScout Demo</h1>
          <p className="text-slate-600">
            Paste a listing URL to generate valuations, refurb breakdown, and financials.
          </p>
          <ProgressBar percent={progress} show={status === 'queued' || status === 'processing'} />
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {(status === 'queued' || status === 'processing') && (
            <span className="text-sm text-slate-600">Elapsed: {elapsedLabel}</span>
          )}
        </div>
      </header>

      {/* Limit banner */}
      {usage && usage.remaining === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-900">Daily demo limit reached</h3>
          <p className="text-sm text-amber-900/80 mt-1">
            You have used {usage.count} of {usage.limit} runs for today. Please try again tomorrow or{' '}
            <Link href="/contact" className="underline">contact us</Link> for access.
          </p>
        </div>
      )}

      {/* URL form */}
      <section className="space-y-3">
        <form onSubmit={handleStart} className="flex gap-2">
          <input
            type="url"
            placeholder="https://… listing or auction URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={running || !validUrl || (usage ? usage.remaining === 0 : false)}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            title={!validUrl ? 'Enter a valid URL' : 'Analyze'}
          >
            {running ? 'Running…' : 'Analyze'}
          </button>
          {running && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
            >
              Stop
            </button>
          )}
        </form>

        {/* Samples */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Try a sample:</span>
          {[
            'https://auctions.savills.co.uk/auctions/19-august-2025-211/152-154-crockhamwell-road-woodley-reading-rg5-3jh-18173',
            'https://auctions.savills.co.uk/auctions/19-august-2025-211/9-seedhill-road-11942',
            'https://www.rightmove.co.uk/properties/123456789#/',
          ].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setUrl(s)}
              className="text-xs rounded-full border px-3 py-1 hover:bg-slate-50"
              title={s}
            >
              {new URL(s).hostname}
            </button>
          ))}
          {usage && (
            <span className="ml-auto text-xs text-slate-500">
              Usage today: <strong>{usage.count}</strong> / {usage.limit}
              {usage.remaining > 0 ? ` (${usage.remaining} left)` : ''}
            </span>
          )}
        </div>
      </section>

      {/* Errors */}
      {error && (
        <div className="border border-red-200 bg-red-50 text-red-800 rounded-lg p-3">{error}</div>
      )}

      {/* Results (unchanged) */}
      {status === 'completed' && data && (
        <div className="grid grid-cols-1 gap-6">
          {/* Property Card */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <h2 className="text-2xl font-semibold">
                  {data.property?.property_title || 'Untitled property'}
                </h2>
                <p className="text-slate-700">
                  {data.property?.address}
                  {data.property?.postcode ? `, ${data.property.postcode}` : ''}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-700 mt-1">
                  <span><strong>Type:</strong> {data.property?.property_type || '—'}</span>
                  <span><strong>Tenure:</strong> {data.property?.tenure || '—'}</span>
                  <span><strong>Beds:</strong> {data.property?.bedrooms ?? '—'}</span>
                  <span><strong>Baths:</strong> {data.property?.bathrooms ?? '—'}</span>
                  <span><strong>Receptions:</strong> {data.property?.receptions ?? '—'}</span>
                  <span><strong>EPC:</strong> {data.property?.epc_rating ?? '—'}</span>
                  <span><strong>Area:</strong> {data.property?.floor_area_sqm ?? '—'} m²</span>
                </div>
                <div className="text-sm mt-3 flex items-center gap-3">
                  {data.property?.listing_url ? (
                    <a
                      className="text-blue-600 underline"
                      href={data.property.listing_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View listing
                    </a>
                  ) : (
                    <span className="text-slate-500">No listing URL</span>
                  )}

                  {/* PDF download if available */}
                  {data.pdf_url && (
                    <a
                      href={data.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-lg bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
              </div>

              <div>
                <div className="rounded-lg overflow-hidden border">
                  {data.property?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.property.image_url}
                      alt="Property"
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-slate-500">
                      No image
                    </div>
                  )}
                </div>
                <div className="mt-3 text-sm space-y-1">
                  <div>
                    <strong>Displayed Price:</strong>{' '}
                    {formatGBP(data.property?.display_price_gbp)}{' '}
                    <span className="text-slate-500">
                      ({data.property?.price_label || 'unknown'})
                    </span>
                  </div>
                  <div className="text-slate-600">
                    <span className="mr-3">Purchase: {formatGBP(data.property?.purchase_price_gbp)}</span>
                    <span className="mr-3">Guide: {formatGBP(data.property?.guide_price_gbp)}</span>
                    <span>Asking: {formatGBP(data.property?.asking_price_gbp)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Financials */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">Financial Summary</h3>
              {data.pdf_url && (
                <a
                  href={data.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-slate-50"
                >
                  Download PDF
                </a>
              )}
            </div>
            {data.financials ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                {Object.entries(data.financials)
                  .filter(([k]) => !HIDE_FIN_KEYS.has(k))
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b py-1">
                      <dt className="capitalize text-slate-600">{titleize(k)}</dt>
                      <dd className="font-medium text-right">{fmtValue(k, v)}</dd>
                    </div>
                  ))}
              </dl>
            ) : (
              <p className="text-slate-600">No financials found for this property yet.</p>
            )}
          </section>

          {/* Refurbishment */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-3">Refurbishment Estimates</h3>
            {Array.isArray(data.refurb_estimates) && data.refurb_estimates.length ? (
              <div className="overflow-x-auto">
                <table className="w-full border text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-2 text-left">Room</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-right">Paint</th>
                      <th className="p-2 text-right">Floor</th>
                      <th className="p-2 text-right">Plumbing</th>
                      <th className="p-2 text-right">Electrics</th>
                      <th className="p-2 text-right">Mould/Damp</th>
                      <th className="p-2 text-right">Structure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.refurb_estimates.map((est) => (
                      <tr key={est.id ?? `${est.room_type}-${Math.random()}`} className="border-t">
                        <td className="p-2 capitalize">{est.room_type}</td>
                        <td className="p-2 text-right">{formatGBP(est.estimated_total_gbp)}</td>
                        <td className="p-2 text-right">{formatGBP(est.wallpaper_or_paint_gbp)}</td>
                        <td className="p-2 text-right">{formatGBP(est.flooring_gbp)}</td>
                        <td className="p-2 text-right">{formatGBP(est.plumbing_gbp)}</td>
                        <td className="p-2 text-right">{formatGBP(est.electrics_gbp)}</td>
                        <td className="p-2 text-right">{formatGBP(est.mould_or_damp_gbp)}</td>
                        <td className="p-2 text-right">{formatGBP(est.structure_gbp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-600">No refurbishment rows were saved for this property.</p>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
