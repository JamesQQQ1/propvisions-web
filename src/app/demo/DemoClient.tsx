'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
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

export default function DemoClient() {
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

  const runIdRef = useRef<string | null>(null)
  const execIdRef = useRef<string | null>(null)

  const running = status === 'queued' || status === 'processing'
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const submittingRef = useRef(false)

  const [progress, setProgress] = useState(0)
  const progressTickRef = useRef<NodeJS.Timeout | null>(null)
  const RAMP_MS = 5 * 60 * 1000
  const MAX_DURING_RUN = 97

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

  useEffect(() => {
    if (!running) {
      if (progressTickRef.current) clearInterval(progressTickRef.current)
      progressTickRef.current = null
      return
    }
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

  useEffect(() => {
    if (status === 'completed') setProgress(100)
    else if ((status === 'failed' || status === 'idle') && !running) setProgress(0)
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
      setProgress((p) => (p < 6 ? 6 : p))
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
        setProgress(100)
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
      setTimeout(() => { submittingRef.current = false }, 300)
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

      {usage && usage.remaining === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-900">Daily demo limit reached</h3>
          <p className="text-sm text-amber-900/80 mt-1">
            You have used {usage.count} of {usage.limit} runs for today. Please try again tomorrow or{' '}
            <Link href="/contact" className="underline">contact us</Link> for access.
          </p>
        </div>
      )}

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

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-800 rounded-lg p-3">{error}</div>
      )}

      {status === 'completed' && data && (
        <div className="grid grid-cols-1 gap-6">
          {/* Property Card, Financials, Refurbishment — unchanged from your file */}
          {/* ... keep your existing JSX here exactly as you had it ... */}
        </div>
      )}
    </main>
  )
}
