'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { pollUntilDone, type RunStatus, startAnalyze } from '@/lib/api';
import RoomCard, { RefurbRow } from '../../components/RoomCard';

/* ---------- branding ---------- */
const LOGO_SRC = '/propvisions_logo.png'; // lives in /public (note lowercase)

/* ---------- helpers ---------- */
function formatGBP(n?: number | string | null) {
  const v = typeof n === 'string' ? Number(n) : n;
  return Number.isFinite(v as number) ? `£${Math.round(v as number).toLocaleString()}` : '—';
}
function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}
const HIDE_FIN_KEYS = new Set(['id', 'property_id', 'created_at', 'updated_at']);
const isMoneyKey = (k: string) => k.endsWith('_gbp');
const titleize = (k: string) => k.replace(/_/g, ' ');
const fmtValue = (k: string, v: unknown) => {
  if (v === null || v === undefined || v === '') return '—';
  if (k === 'roi_percent') return `${Number(v).toFixed(2)}%`;
  if (isMoneyKey(k)) return formatGBP(v as any);
  if (typeof v === 'number') return v.toLocaleString();
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString() : String(v);
};
const toInt = (n: unknown) => {
  const v = Math.round(Number(n ?? 0));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

// ensure we always have an absolute URL for the PDF (prevents SPA routing back to /demo)
function normalizePdfUrl(maybeUrl?: string | null): string | null {
  if (!maybeUrl) return null;
  try {
    if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl; // already absolute
    return new URL(maybeUrl, window.location.origin).toString();
  } catch {
    return null;
  }
}

type Usage = { count: number; limit: number; remaining: number } | null;

function StatusBadge({ status }: { status?: RunStatus | 'idle' }) {
  const color =
    status === 'completed'
      ? 'bg-green-100 text-green-800 border-green-200'
      : status === 'failed'
      ? 'bg-red-100 text-red-800 border-red-200'
      : status === 'queued' || status === 'processing'
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <span className={classNames('inline-block px-2 py-0.5 text-xs rounded border', color)}>
      {status || 'idle'}
    </span>
  );
}

/* ---------- tiny progress bar component ---------- */
function ProgressBar({ percent, show }: { percent: number; show: boolean }) {
  return (
    <div className={classNames('mt-3 w-full', !show && 'hidden')} aria-hidden={!show}>
      <div className="h-2 w-full bg-slate-200/70 rounded overflow-hidden">
        <div
          className="h-2 bg-blue-600 transition-[width] duration-300 ease-out will-change-[width]"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

/* ---------- tiny feedback widget (local state; wire up later) ---------- */
function FeedbackBar({ onSubmit }: { onSubmit: (v: 'up' | 'down') => void }) {
  const [choice, setChoice] = useState<'up' | 'down' | null>(null);
  return (
    <div className="mt-4 flex items-center gap-2 text-sm">
      <span className="text-slate-600">Was this accurate?</span>
      <button
        type="button"
        onClick={() => {
          setChoice('up');
          onSubmit('up');
        }}
        className={classNames(
          'inline-flex items-center gap-1 rounded-md border px-2 py-1',
          choice === 'up' ? 'bg-green-50 border-green-200 text-green-700' : 'hover:bg-slate-50'
        )}
        aria-pressed={choice === 'up'}
      >
        <span aria-hidden>👍</span> Yes
      </button>
      <button
        type="button"
        onClick={() => {
          setChoice('down');
          onSubmit('down');
        }}
        className={classNames(
          'inline-flex items-center gap-1 rounded-md border px-2 py-1',
          choice === 'down' ? 'bg-red-50 border-red-200 text-red-700' : 'hover:bg-slate-50'
        )}
        aria-pressed={choice === 'down'}
      >
        <span aria-hidden>👎</span> No
      </button>
      {choice && (
        <span className="ml-2 text-slate-500">
          {choice === 'up' ? 'Thanks!' : 'Noted — we’ll use this to improve.'}
        </span>
      )}
    </div>
  );
}

/* ---------- page ---------- */
export default function Page() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<RunStatus | 'idle'>('idle');
  const [error, setError] = useState<string>();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [usage, setUsage] = useState<Usage>(null);
  const [data, setData] = useState<{
    property_id: string | null;
    property: any;
    financials: Record<string, unknown> | null;
    refurb_estimates: RefurbRow[];
    pdf_url?: string | null;
  } | null>(null);

  // UI state: filters + sort
  const [filterType, setFilterType] = useState<string>('All');
  const [sortKey, setSortKey] = useState<'total_desc' | 'total_asc' | 'room_asc'>('total_desc');
  const [minConfidence, setMinConfidence] = useState<number>(0); // 0..100

  // Keep the current run + exec ids so Stop can hard-cancel via API
  const runIdRef = useRef<string | null>(null);
  const execIdRef = useRef<string | null>(null);

  const running = status === 'queued' || status === 'processing';
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const submittingRef = useRef(false); // client-side debounce

  /* ---------- PROTECTED DEMO: logout control ---------- */
  async function handleLogout() {
    try {
      await fetch('/api/demo-logout', { method: 'POST' });
    } catch {}
    window.location.href = '/demo-access?next=/demo';
  }

  /* ---------- PROGRESS: slow ramp for 5 minutes then snap ---------- */
  const [progress, setProgress] = useState(0);
  const progressTickRef = useRef<NodeJS.Timeout | null>(null);
  const RAMP_MS = 5 * 60 * 1000; // 5 minutes
  const MAX_DURING_RUN = 97;

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    timerRef.current = setInterval(() => {
      if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current);
    }, 250);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [running]);

  useEffect(() => {
    if (!running) {
      if (progressTickRef.current) clearInterval(progressTickRef.current);
      progressTickRef.current = null;
      return;
    }
    setProgress((p) => (p < 6 ? 6 : p));
    progressTickRef.current = setInterval(() => {
      if (!startedAtRef.current) return;
      const elapsed = Date.now() - startedAtRef.current;
      const target = Math.min(MAX_DURING_RUN, (elapsed / RAMP_MS) * MAX_DURING_RUN);
      setProgress((p) => (p < target ? p + Math.min(0.8, target - p) : p));
    }, 300);
    return () => {
      if (progressTickRef.current) clearInterval(progressTickRef.current);
      progressTickRef.current = null;
    };
  }, [running]);

  useEffect(() => {
    if (status === 'completed') {
      setProgress(100);
    } else if ((status === 'failed' || status === 'idle') && !running) {
      setProgress(0);
    }
  }, [status, running]);

  const elapsedLabel = useMemo(() => {
    const s = Math.floor(elapsedMs / 1000);
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return m ? `${m}m ${rs}s` : `${rs}s`;
  }, [elapsedMs]);

  const validUrl = useMemo(() => {
    try {
      if (!url) return false;
      const u = new URL(url);
      return !!u.protocol && !!u.hostname;
    } catch {
      return false;
    }
  }, [url]);

  const sampleUrls = [
    'https://www.rightmove.co.uk/properties/123456789#/',
    'https://auctions.savills.co.uk/auctions/19-august-2025-211/9-seedhill-road-11942',
  ];

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      setError(undefined);
      setData(null);

      if (usage && usage.remaining === 0) {
        setStatus('failed');
        setError('Daily demo limit reached.');
        return;
      }

      setStatus('queued');
      setProgress((p) => (p < 6 ? 6 : p));

      let kickoff: { run_id: string; execution_id?: string; usage?: Usage };
      try {
        kickoff = await startAnalyze(url);
      } catch (err: any) {
        setStatus('failed');
        setError(err?.message || 'Failed to start analysis');
        if (err?.usage) setUsage(err.usage as Usage);
        return;
      }

      if (kickoff.usage) setUsage(kickoff.usage as Usage);

      runIdRef.current = kickoff.run_id || null;
      execIdRef.current = kickoff.execution_id ?? null;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result: any = await pollUntilDone(kickoff.run_id, {
          intervalMs: 2500,
          timeoutMs: 10 * 60 * 1000,
          onTick: (s) => setStatus(s),
          signal: controller.signal,
        });

        // normalize the returned pdf URL so it's absolute (avoids SPA redirecting you back to /demo)
        const resolvedPdf = typeof window !== 'undefined' ? normalizePdfUrl(result.pdf_url) : (result.pdf_url ?? null);

        setStatus('completed');
        setProgress(100);
        setData({
          property_id: result.property_id ?? null,
          property: result.property ?? null,
          financials: result.financials ?? null,
          refurb_estimates: Array.isArray(result.refurb_estimates) ? result.refurb_estimates : [],
          pdf_url: resolvedPdf,
        });
        console.log('PDF URL (resolved):', resolvedPdf);
      } catch (err: any) {
        setError(err?.message === 'Polling aborted' ? 'Cancelled.' : err?.message || 'Run failed');
        setStatus('failed');
      } finally {
        abortRef.current = null;
      }
    } finally {
      setTimeout(() => {
        submittingRef.current = false;
      }, 300);
    }
  }

  async function handleCancel() {
    const run_id = runIdRef.current;
    const execution_id = execIdRef.current;
    try {
      await fetch('/api/run/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id, execution_id }),
      });
    } catch {}
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('failed');
    setError(execution_id ? 'Stop requested.' : 'Stopped locally (no execution id).');
  }

  // Build filter chips and sorted/filtered refurb list
  const roomTypes = useMemo(() => {
    const set = new Set<string>();
    (data?.refurb_estimates || []).forEach((r) => {
      const t = (r.detected_room_type || r.room_type || 'Other').toString();
      set.add(t.charAt(0).toUpperCase() + t.slice(1));
    });
    return ['All', ...Array.from(set).sort()];
  }, [data?.refurb_estimates]);

  const refinedRefurbs = useMemo(() => {
    let list = (data?.refurb_estimates || []) as RefurbRow[];

    // drop zero/hidden rows
    list = list.filter((r) => {
      const catSum =
        toInt(r.wallpaper_or_paint_gbp) +
        toInt(r.flooring_gbp) +
        toInt(r.plumbing_gbp) +
        toInt(r.electrics_gbp) +
        toInt(r.mould_or_damp_gbp) +
        toInt(r.structure_gbp);
      const worksArr =
        Array.isArray(r.works)
          ? (r.works as any[])
          : typeof r.works === 'string'
            ? (() => { try { const p = JSON.parse(r.works as string); return Array.isArray(p) ? p : []; } catch { return []; } })()
            : [];
      const worksSum = worksArr.reduce((acc, w) => acc + toInt(w?.subtotal_gbp), 0);
      const total = Math.max(toInt(r.estimated_total_gbp), catSum, worksSum);
      return total > 0;
    });

    if (filterType !== 'All') {
      list = list.filter((r) => {
        const t = (r.detected_room_type || r.room_type || 'Other').toString();
        const norm = t.charAt(0).toUpperCase() + t.slice(1);
        return norm === filterType;
      });
    }

    // min confidence gate (0..100)
    list = list.filter((r) =>
      typeof r.confidence === 'number' ? r.confidence * 100 >= minConfidence : true
    );

    // Sort
    const totalOf = (r: RefurbRow) => {
      const catSum =
        toInt(r.wallpaper_or_paint_gbp) +
        toInt(r.flooring_gbp) +
        toInt(r.plumbing_gbp) +
        toInt(r.electrics_gbp) +
        toInt(r.mould_or_damp_gbp) +
        toInt(r.structure_gbp);
      const worksArr =
        Array.isArray(r.works)
          ? (r.works as any[])
          : typeof r.works === 'string'
            ? (() => { try { const p = JSON.parse(r.works as string); return Array.isArray(p) ? p : []; } catch { return []; } })()
            : [];
      const worksSum = worksArr.reduce((acc, w) => acc + toInt(w?.subtotal_gbp), 0);
      return Math.max(toInt(r.estimated_total_gbp), catSum, worksSum);
    };

    const byRoom = (r: RefurbRow) =>
      (r.detected_room_type || r.room_type || 'Other').toString().toLowerCase();

    list = [...list].sort((a, b) => {
      if (sortKey === 'total_desc') return totalOf(b) - totalOf(a);
      if (sortKey === 'total_asc') return totalOf(a) - totalOf(b);
      return byRoom(a).localeCompare(byRoom(b));
    });

    return list;
  }, [data?.refurb_estimates, filterType, sortKey, minConfidence]);

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Protected banner + logout */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
        <p className="text-sm text-slate-700">
          <span className="font-medium">Protected demo.</span> You’re seeing this page because you’ve unlocked it.
        </p>
        <button
          onClick={handleLogout}
          className="text-sm rounded-md border px-3 py-1.5 hover:bg-white"
          title="Remove access cookie and go to unlock page"
        >
          Logout
        </button>
      </div>

      {/* Header */}
      <header className="flex items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Image
              src={LOGO_SRC}
              alt="PropVisions"
              width={120}
              height={32}
              priority
              className="h-9 w-auto md:h-10"
            />
            <h1 className="text-3xl font-bold tracking-tight">PropVisions Demo</h1>
          </div>
          <p className="text-slate-600 mt-1">
            Paste a listing URL to generate valuations, refurb breakdown, and financials.
          </p>
          <ProgressBar percent={progress} show={status === 'queued' || status === 'processing'} />
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {(status === 'queued' || status === 'processing') && (
            <span className="text-sm text-slate-600" aria-live="polite">
              Elapsed: {elapsedLabel}
            </span>
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
        <form onSubmit={handleStart} className="flex gap-2" aria-label="Analyze property URL">
          <input
            type="url"
            placeholder="https://… listing or auction URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            inputMode="url"
            aria-invalid={!validUrl && url.length > 0}
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
          {sampleUrls.map((s) => (
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
        <div role="alert" className="border border-red-200 bg-red-50 text-red-800 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Results */}
      {status === 'completed' && data && (
        <div className="grid grid-cols-1 gap-6">
          {/* Property Card */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
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
                    <>
                      <a
                        href={data.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700"
                      >
                        Download PDF
                      </a>
                      {/* tiny debug chip so you can see what URL we resolved */}
                      <span className="ml-2 text-xs text-slate-500 break-all">{data.pdf_url}</span>
                    </>
                  )}
                </div>

                {/* quick feedback */}
                <FeedbackBar onSubmit={() => { /* TODO: POST to /api/feedback */ }} />
              </div>

              <div>
                <div className="rounded-lg overflow-hidden border">
                  {data.property?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.property.image_url}
                      alt="Property"
                      className="w-full h-48 object-cover"
                      loading="lazy"
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

          {/* Refurbishment */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-xl font-semibold">Refurbishment Estimates</h3>

              <div className="flex flex-wrap items-center gap-2 ml-auto">
                {/* Filter */}
                <label className="text-xs text-slate-600">Filter:</label>
                <select
                  className="text-sm border rounded-md px-2 py-1"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  {roomTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Sort */}
                <label className="text-xs text-slate-600 ml-2">Sort:</label>
                <select
                  className="text-sm border rounded-md px-2 py-1"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as any)}
                >
                  <option value="total_desc">Total (high → low)</option>
                  <option value="total_asc">Total (low → high)</option>
                  <option value="room_asc">Room (A → Z)</option>
                </select>

                {/* Confidence gate */}
                <label className="text-xs text-slate-600 ml-2">Min confidence:</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-28"
                  title={`${minConfidence}%`}
                />
                <span className="text-xs text-slate-600 w-10 text-right">{minConfidence}%</span>
              </div>
            </div>

            {Array.isArray(refinedRefurbs) && refinedRefurbs.length ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {refinedRefurbs.map((est, idx) => (
                    <RoomCard key={est.id ?? idx} room={est} />
                  ))}
                </div>

                {/* Totals table */}
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
                        <th className="p-2 text-right">Other</th>
                        <th className="p-2 text-right">Conf.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refinedRefurbs.map((est, i) => {
                        const paint = toInt(est.wallpaper_or_paint_gbp);
                        const floor = toInt(est.flooring_gbp);
                        const plumb = toInt(est.plumbing_gbp);
                        const elec = toInt(est.electrics_gbp);
                        const damp = toInt(est.mould_or_damp_gbp);
                        const struct = toInt(est.structure_gbp);
                        const catSum = paint + floor + plumb + elec + damp + struct;

                        const worksArr =
                          Array.isArray(est.works)
                            ? (est.works as any[])
                            : typeof est.works === 'string'
                              ? (() => { try { const p = JSON.parse(est.works as string); return Array.isArray(p) ? p : []; } catch { return []; } })()
                              : [];
                        const worksSum = worksArr.reduce((acc, w) => acc + toInt(w?.subtotal_gbp), 0);

                        const total = Math.max(toInt(est.estimated_total_gbp), catSum, worksSum);
                        const other = Math.max(0, total - catSum);
                        const conf = typeof est.confidence === 'number' ? Math.round(est.confidence * 100) : null;

                        return (
                          <tr key={est.id ?? `row-${i}`} className="border-t">
                            <td className="p-2 capitalize">
                              {(est.detected_room_type || est.room_type || 'room').replace(/_/g, ' ')}
                            </td>
                            <td className="p-2 text-right">{formatGBP(total)}</td>
                            <td className="p-2 text-right">{formatGBP(paint)}</td>
                            <td className="p-2 text-right">{formatGBP(floor)}</td>
                            <td className="p-2 text-right">{formatGBP(plumb)}</td>
                            <td className="p-2 text-right">{formatGBP(elec)}</td>
                            <td className="p-2 text-right">{formatGBP(damp)}</td>
                            <td className="p-2 text-right">{formatGBP(struct)}</td>
                            <td className="p-2 text-right">{formatGBP(other)}</td>
                            <td className="p-2 text-right">{conf !== null ? `${conf}%` : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-slate-600">No refurbishment rows were saved for this property.</p>
            )}
          </section>

          {/* Financials */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">Financial Summary</h3>
              {data.pdf_url && (
                <a
                  href={data.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
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

            {/* quick feedback */}
            <FeedbackBar onSubmit={() => { /* TODO: POST to /api/feedback */ }} />
          </section>
        </div>
      )}
    </main>
  );
}
