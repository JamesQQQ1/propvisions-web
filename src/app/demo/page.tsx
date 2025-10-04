// src/app/demo/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { pollUntilDone, type RunStatus, startAnalyze, POLL_BUILD } from '@/lib/api';
import RoomCard, { type RefurbRoom } from '@/components/RoomCard';
import FeedbackBar from '@/components/FeedbackBar';
import PDFViewer from '@/components/PDFViewer';
import FinancialSliders, {
  type Derived as SliderDerived,
  type Assumptions as SliderAssumptions,
} from '@/components/FinancialSliders';
import MetricsCards from '@/components/MetricsCards';

/* ---------- demo mode config (REQUIRED) ---------- */
const DEFAULT_DEMO_RUN_ID = '51767b89-2793-49ac-b578-da8063d59b2f';
console.debug('[demo-page] POLL_BUILD =', POLL_BUILD);

/* ---------- branding ---------- */
const LOGO_SRC = '/propvisions_logo.png';

/* ---------- tiny helpers ---------- */
const gbp0 = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});
const gbp2 = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
});
const pct1 = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1 });

const isFiniteNum = (n: unknown) => Number.isFinite(Number(n));
const n = (x: unknown) => (isFiniteNum(x) ? Number(x) : undefined);
const nz = (x: unknown) => (isFiniteNum(x) ? Number(x) : 0);
const £0 = (x?: unknown) => (x == null || x === '' ? '—' : gbp0.format(Number(x)));
const £2 = (x?: unknown) => (x == null || x === '' ? '—' : gbp2.format(Number(x)));
const pc = (x?: unknown) => (x == null || x === '' ? '—' : `${Number(x) * 100 % 1 ? Number(x).toFixed(2) : Number(x)}%`);
const pc1 = (x?: unknown) => (x == null || x === '' ? '—' : pct1.format(Number(x)));

const classNames = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

const titleize = (k: string) =>
  k
    .replace(/_/g, ' ')
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());

const pickPrice = (p: any): number =>
  Number(p?.purchase_price_gbp ?? 0) ||
  Number(p?.guide_price_gbp ?? 0) ||
  Number(p?.asking_price_gbp ?? 0) ||
  Number(p?.display_price_gbp ?? 0) ||
  0;

/* ---------- refurbishment totals helpers (keep logic, just richer display) ---------- */
function toInt(v: unknown) {
  const x = Math.round(Number(v ?? 0));
  return Number.isFinite(x) && x > 0 ? x : 0;
}
function roomV2Total(r: RefurbRoom): number {
  const direct = toInt(r.room_total_with_vat_gbp) || toInt(r.room_total_gbp);
  if (direct) return direct;
  const mat = toInt(r.materials_total_with_vat_gbp ?? r.materials_total_gbp);
  const lab = toInt(r.labour_total_gbp);
  return mat + lab;
}
function sumV2Totals(rows?: RefurbRoom[] | null) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((acc, r) => acc + roomV2Total(r), 0);
}

/** Pulls rollups from property.room_totals when available, else falls back to v2 sums */
function computeRefurbRollup(property: any, refurb_estimates: RefurbRoom[] | undefined | null) {
  const rows = Array.isArray(property?.room_totals) ? property.room_totals : [];
  const byType = (t: string) => rows.find((r: any) => r.type === t);
  const findOH = rows.find(
    (r: any) =>
      (r.room_name || '').toLowerCase().includes('overheads') ||
      (r.room_name || '').toLowerCase().includes('whole-house'),
  );

  const epc = byType('epc_totals');
  const rooms = byType('rooms_totals');
  const propertySum = rows.find((r: any) => 'property_total_with_vat' in r || 'property_total_without_vat' in r);

  const result = {
    rooms_total_with_vat: n(rooms?.rooms_total_with_vat) ?? undefined,
    rooms_total_without_vat: n(rooms?.rooms_total_without_vat) ?? undefined,
    epc_total_with_vat: n(epc?.epc_total_with_vat) ?? undefined,
    epc_total_without_vat: n(epc?.epc_total_without_vat) ?? undefined,
    overheads_with_vat: n(findOH?.total_with_vat) ?? undefined,
    overheads_without_vat: n(findOH?.total_without_vat) ?? undefined,
    property_total_with_vat: n(propertySum?.property_total_with_vat) ?? n(property?.property_total_with_vat) ?? n(property?.refurb_total_with_vat_gbp) ?? undefined,
    property_total_without_vat:
      n(propertySum?.property_total_without_vat) ?? n(property?.property_total_without_vat) ?? n(property?.refurb_total_without_vat_gbp) ?? undefined,
    // fallbacks from v2 per-room if needed
    v2_total_with_vat_fallback: sumV2Totals(refurb_estimates),
  };

  // If no explicit rooms_total_with_vat but we do have per-room v2, provide a backstop
  if (!result.rooms_total_with_vat && result.v2_total_with_vat_fallback) {
    result.rooms_total_with_vat = result.v2_total_with_vat_fallback;
  }

  return result;
}

/* ---------- inline visual micro components (no extra deps) ---------- */
function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'green' | 'red' | 'amber' | 'slate' | 'blue' }) {
  const m: Record<string, string> = {
    green: 'bg-green-50 text-green-700 ring-green-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  };
  return <span className={classNames('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ring-1', m[tone])}>{children}</span>;
}

function KPI({
  label,
  value,
  subtitle,
  tone,
  big = true,
}: {
  label: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: 'green' | 'red' | 'amber' | 'slate' | 'blue';
  big?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
        {tone && <Badge tone={tone}>{tone.toUpperCase()}</Badge>}
      </div>
      <div className={classNames('mt-1 font-semibold', big ? 'text-2xl' : 'text-lg')}>{value}</div>
      {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Tiny semicircle DSCR gauge (SVG only) */
function DSCRGauge({ value }: { value?: number }) {
  const v = Math.max(0, Math.min(2, Number(value ?? 0))); // cap 0..2
  const pct = v / 2; // 0..1 across the arc
  const angle = Math.PI * (1 + pct); // map 0..1 → pi..2pi
  const r = 42;
  const cx = 50;
  const cy = 50;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);

  const critical = v < 1.0;
  const ok = v >= 1.25;
  const tone = critical ? '#ef4444' : ok ? '#22c55e' : '#f59e0b';

  return (
    <div className="inline-flex items-center gap-3">
      <svg width="120" height="70" viewBox="0 0 100 60" aria-label="DSCR gauge">
        {/* background arc */}
        <path d="M8,50 A42,42 0 1 1 92,50" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
        {/* value arc */}
        <path
          d={`M8,50 A42,42 0 ${pct > 0.5 ? 1 : 0} 1 ${x},${y}`}
          fill="none"
          stroke={tone}
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* tick at 1.25 */}
        <path d="M63,14 L66,9" stroke="#9ca3af" strokeWidth="2" />
        {/* center text */}
        <text x="50" y="52" textAnchor="middle" fontSize="10" fill="#111827" fontWeight={700}>
          {value == null ? '—' : value.toFixed(2)}
        </text>
      </svg>
      <div className="text-sm">
        <div className="font-medium">DSCR (Month-1)</div>
        <div className="text-slate-600">≥ 1.25 preferred by lenders</div>
      </div>
    </div>
  );
}

/* ---------- status & progress ---------- */
function StatusBadge({ status }: { status?: RunStatus | 'idle' }) {
  const color =
    status === 'completed'
      ? 'bg-green-100 text-green-800 border-green-200'
      : status === 'failed'
      ? 'bg-red-100 text-red-800 border-red-200'
      : status === 'queued' || status === 'processing'
      ? 'bg-amber-100 text-amber-900 border-amber-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';

  return <span className={classNames('inline-block px-2 py-0.5 text-xs rounded border', color)}>{status || 'idle'}</span>;
}

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

/* =========================================================================================
   PAGE
========================================================================================= */
export default function Page() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<RunStatus | 'idle'>('idle');
  const [error, setError] = useState<string>();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [usage, setUsage] = useState<{ count: number; limit: number; remaining: number } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [data, setData] = useState<{
    property_id: string | null;
    property: any;
    financials: Record<string, unknown> | null;
    refurb_estimates: RefurbRoom[];
    pdf_url?: string | null;
    refurb_debug?: { materials_count?: number; labour_count?: number } | any;
    run?: any;
  } | null>(null);

  // DEMO
  const [useDemo, setUseDemo] = useState<boolean>(!!DEFAULT_DEMO_RUN_ID);
  const [demoRunId, setDemoRunId] = useState<string>(DEFAULT_DEMO_RUN_ID);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const usp = new URLSearchParams(window.location.search);
    const qRun = usp.get('run');
    if (qRun) {
      setUseDemo(true);
      setDemoRunId(qRun);
    }
  }, []);

  // Sliders
  const [slDerived, setSlDerived] = useState<SliderDerived | null>(null);
  const [slAssumptions, setSlAssumptions] = useState<SliderAssumptions | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>('All');
  const [sortKey, setSortKey] = useState<'total_desc' | 'total_asc' | 'room_asc'>('total_desc');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  // Run state
  const runIdRef = useRef<string | null>(null);
  const execIdRef = useRef<string | null>(null);
  const running = status === 'queued' || status === 'processing';
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const submittingRef = useRef(false);

  /* logout */
  async function handleLogout() {
    try {
      await fetch('/api/demo-logout', { method: 'POST' });
    } catch {}
    window.location.href = '/demo-access?next=/demo';
  }

  /* Load a run (DEMO) */
  async function loadDemoRun(theRunIdRaw: string) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const theRunId = (theRunIdRaw || '').trim();
      setShowDebug(false);
      setError(undefined);
      setData(null);
      setSlDerived(null);
      setSlAssumptions(null);
      setFilterType('All');
      setSortKey('total_desc');
      setMinConfidence(0);

      if (!theRunId) {
        setStatus('failed');
        setError('No demo run_id provided.');
        return;
      }
      abortRef.current?.abort();

      setStatus('queued');
      setProgress((p) => (p < 6 ? 6 : p));
      runIdRef.current = theRunId;
      execIdRef.current = null;

      const controller = new AbortController();
      abortRef.current = controller;

      const result: any = await pollUntilDone(theRunId, {
        intervalMs: 1500,
        timeoutMs: 0,
        onTick: (s) => setStatus(s),
        signal: controller.signal,
      });

      setStatus('completed');
      setProgress(100);
      setData({
        property_id: result.property_id ?? null,
        property: result.property ?? null,
        financials: result.financials ?? null,
        refurb_estimates: Array.isArray(result.refurb_estimates) ? (result.refurb_estimates as RefurbRoom[]) : [],
        pdf_url: result.pdf_url ?? null,
        refurb_debug: result.refurb_debug ?? undefined,
        run: result.run ?? undefined,
      });
    } catch (err: any) {
      console.error('[demo] loadDemoRun error:', err);
      setError(err?.message === 'Polling aborted' ? 'Cancelled.' : err?.message || 'Run failed');
      setStatus('failed');
    } finally {
      abortRef.current = null;
      setTimeout(() => {
        submittingRef.current = false;
      }, 300);
    }
  }

  /* kickoff */
  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setShowDebug(false);
      setError(undefined);
      setData(null);
      setSlDerived(null);
      setSlAssumptions(null);
      setFilterType('All');
      setSortKey('total_desc');
      setMinConfidence(0);

      if (useDemo) {
        await loadDemoRun(demoRunId);
        return;
      }

      if (usage && usage.remaining === 0) {
        setStatus('failed');
        setError('Daily demo limit reached.');
        return;
      }

      setStatus('queued');
      setProgress((p) => (p < 6 ? 6 : p));

      let kickoff: { run_id: string; execution_id?: string; usage?: any };
      try {
        kickoff = await startAnalyze(url);
      } catch (err: any) {
        setStatus('failed');
        setError(err?.message || 'Failed to start analysis');
        if (err?.usage) setUsage(err.usage as any);
        return;
      }
      if (kickoff.usage) setUsage(kickoff.usage as any);

      runIdRef.current = kickoff.run_id || null;
      execIdRef.current = kickoff.execution_id ?? null;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result: any = await pollUntilDone(kickoff.run_id, {
          intervalMs: 2500,
          timeoutMs: 0,
          onTick: (s) => setStatus(s),
          signal: controller.signal,
        });

        setStatus('completed');
        setProgress(100);
        setData({
          property_id: result.property_id ?? null,
          property: result.property ?? null,
          financials: result.financials ?? null,
          refurb_estimates: Array.isArray(result.refurb_estimates) ? (result.refurb_estimates as RefurbRoom[]) : [],
          pdf_url: result.pdf_url ?? null,
          refurb_debug: result.refurb_debug ?? undefined,
          run: result.run ?? undefined,
        });
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

  /* progress */
  const [progress, setProgress] = useState(0);
  const progressTickRef = useRef<NodeJS.Timeout | null>(null);
  const RAMP_MS = 100 * 60 * 1000;
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

  /* derived UI bits */
  const basePrice = useMemo(() => pickPrice(data?.property), [data?.property]);
  const baseRent = useMemo(() => Number((data?.financials as any)?.monthly_rent_gbp ?? 0) || 0, [data?.financials]);
  const baseRefurb = useMemo(() => sumV2Totals(data?.refurb_estimates), [data?.refurb_estimates]);

  const rollup = useMemo(() => computeRefurbRollup(data?.property, data?.refurb_estimates), [data?.property, data?.refurb_estimates]);

  const epc = data?.property
    ? {
        current: data.property.epc_rating_current ?? data.property.epc_rating ?? null,
        potential: data.property.epc_rating_potential ?? null,
        score_current: n(data.property.epc_score_current),
        score_potential: n(data.property.epc_score_potential),
      }
    : null;

  const services = data?.property?.services || {};
  const efficiency = data?.property?.efficiency || {};
  const dims = data?.property?.dimensions || {};

  const backendSummary = (data?.financials?.summary as any) || (data?.property?.summary as any) || null;
  const period = backendSummary?.period || null;
  const exitSell = backendSummary?.exit_sell || null;
  const exitRefi = backendSummary?.exit_refi_24m || null;

  const scenarios = (data?.financials?.scenarios as any) || (data?.property?.scenarios as any) || null;

  const roomTypes = useMemo(() => {
    const set = new Set<string>();
    (data?.refurb_estimates || []).forEach((r) => {
      const t = (r.detected_room_type || r.room_type || 'Other').toString();
      set.add(t.charAt(0).toUpperCase() + t.slice(1));
    });
    return ['All', ...Array.from(set).sort()];
  }, [data?.refurb_estimates]);

  const refinedRefurbs = useMemo(() => {
    let list = (data?.refurb_estimates || []) as RefurbRoom[];
    if (filterType !== 'All') {
      list = list.filter((r) => {
        const t = (r.detected_room_type || r.room_type || 'Other').toString();
        const norm = t.charAt(0).toUpperCase() + t.slice(1);
        return norm === filterType;
      });
    }
    list = list.filter((r) => (typeof (r as any).confidence === 'number' ? (r as any).confidence * 100 >= minConfidence : true));
    const byRoom = (r: RefurbRoom) => (r.detected_room_type || r.room_type || 'Other').toString().toLowerCase();
    list = [...list].sort((a, b) => {
      if (sortKey === 'total_desc') return roomV2Total(b) - roomV2Total(a);
      if (sortKey === 'total_asc') return roomV2Total(a) - roomV2Total(b);
      return byRoom(a).localeCompare(byRoom(b));
    });
    return list;
  }, [data?.refurb_estimates, filterType, sortKey, minConfidence]);

  const fallbackForMetrics = useMemo(() => {
    const F = (data?.financials || {}) as Record<string, any>;
    const maybe = (k: string) => (Number.isFinite(+F[k]) ? +F[k] : undefined);
    return {
      noiAnnual: maybe('annual_net_income_gbp'),
      totalInvestment: maybe('total_investment_gbp'),
      mortgageMonthly: maybe('mortgage_monthly_gbp'),
      cashflowMonthly:
        maybe('monthly_cashflow_gbp') ??
        (maybe('annual_net_income_gbp') ? ((maybe('annual_net_income_gbp') as number) / 12) : undefined),
      netYieldPct: maybe('net_yield_percent'),
      roiPctYear1: maybe('roi_percent'),
    };
  }, [data?.financials]);

  const kpis = useMemo(() => {
    const p = data?.property || {};
    return [
      {
        label: 'Displayed Price',
        value: £0(
          p.purchase_price_gbp ??
            p.guide_price_gbp ??
            p.asking_price_gbp ??
            p.display_price_gbp ??
            basePrice,
        ),
        subtitle: 'price',
      },
      {
        label: 'Guide Price',
        value: £0(p.guide_price_gbp),
      },
      {
        label: 'Purchase Price',
        value: £0(p.purchase_price_gbp),
      },
      {
        label: 'EPC Potential',
        value: epc?.potential ?? '—',
      },
    ];
  }, [data?.property, basePrice, epc?.potential]);

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Protected banner + logout */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
        <p className="text-sm text-slate-700">
          <span className="font-medium">Protected demo.</span> Use your <code>run_id</code> to preview a completed analysis.
        </p>
        <button onClick={handleLogout} className="text-sm rounded-md border px-3 py-1.5 hover:bg-white" title="Remove access cookie and go to unlock page">
          Logout
        </button>
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200 pb-3 pt-4 -mt-4">
        <div className="flex items-start md:items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Image src={LOGO_SRC} alt="PropVisions" width={120} height={32} priority className="h-9 w-auto md:h-10" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">PropVisions Demo</h1>
            </div>
            <p className="text-slate-600 mt-1">Paste a listing URL to start a new run, or toggle demo to load an existing <code>run_id</code>.</p>
            <ProgressBar percent={progress} show={status === 'queued' || status === 'processing'} />
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            {(status === 'queued' || status === 'processing') && (
              <span className="text-sm text-slate-600" aria-live="polite">
                Elapsed: {Math.floor(elapsedMs / 1000 / 60)}m {Math.floor((elapsedMs / 1000) % 60)}s
              </span>
            )}
            {running && (
              <button type="button" onClick={handleCancel} className="px-3 py-1.5 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">
                Stop
              </button>
            )}
          </div>
        </div>
      </header>

      {/* URL form + DEMO */}
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
          />
          <button
            type="submit"
            disabled={running || !url}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            title={!url ? 'Enter a URL or use demo run' : 'Analyze'}
          >
            {running ? 'Running…' : 'Analyze'}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="accent-blue-600" checked={useDemo} onChange={(e) => setUseDemo(e.target.checked)} />
            Use demo run
          </label>

          <input
            type="text"
            value={demoRunId}
            onChange={(e) => setDemoRunId(e.target.value.trim())}
            placeholder="demo run_id (UUID)"
            className="min-w-[22rem] flex-1 p-2 border rounded-md disabled:bg-slate-50"
            disabled={!useDemo}
          />

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              loadDemoRun((demoRunId || '').trim());
            }}
            disabled={!useDemo || !(demoRunId || '').trim()}
            className="px-3 py-2 bg-slate-200 rounded-md disabled:opacity-50"
            title="Load demo data using the run_id"
          >
            Load demo
          </button>
        </div>
      </section>

      {/* Error */}
      {error && <div role="alert" className="border border-red-200 bg-red-50 text-red-800 rounded-lg p-3">{error}</div>}

      {/* Results */}
      {status === 'completed' && data && (
        <div className="grid grid-cols-1 gap-6">
          {/* Property header */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">{data.property?.property_title || 'Untitled property'}</h2>
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
                  <span><strong>EPC:</strong> {epc?.current ?? '—'}</span>
                  <span><strong>Area:</strong> {dims?.floorplan_total_area_sqm ?? data.property?.floorplan_total_area_sqm ?? '—'} m²</span>
                </div>

                <div className="text-sm mt-3 flex items-center gap-3 flex-wrap">
                  {data.property?.listing_url ? (
                    <a className="text-blue-600 underline" href={data.property.listing_url} target="_blank" rel="noreferrer">
                      View listing
                    </a>
                  ) : (
                    <span className="text-slate-500">No listing URL</span>
                  )}

                  {data.property?.preview_url_investor_pack && (
                    <a
                      href={data.property.preview_url_investor_pack}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700"
                    >
                      Investor Pack
                    </a>
                  )}
                  {data.property?.preview_url_builders_quote && (
                    <a
                      href={data.property.preview_url_builders_quote}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg border px-3 py-1.5 hover:bg-slate-50"
                    >
                      Builder’s Quote
                    </a>
                  )}
                  {data.property?.brochure_urls?.[0] && (
                    <a
                      href={data.property.brochure_urls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg border px-3 py-1.5 hover:bg-slate-50"
                    >
                      Brochure (agent)
                    </a>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {kpis.map((k) => (
                    <KPI key={k.label} label={k.label} value={k.value} subtitle={k.subtitle} />
                  ))}
                </div>

                <FeedbackBar runId={runIdRef.current} propertyId={data.property_id} module="financials" />
              </div>

              <div>
                <div className="rounded-lg overflow-hidden border">
                  {data.property?.listing_images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.property.listing_images[0]} alt="Property" className="w-full h-48 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-slate-500">No image</div>
                  )}
                </div>

                <div className="mt-3 text-sm space-y-1">
                  <div>
                    <strong>Displayed Price:</strong>{' '}
                    {£0(
                      data.property?.purchase_price_gbp ??
                        data.property?.guide_price_gbp ??
                        data.property?.asking_price_gbp ??
                        data.property?.display_price_gbp,
                    )}{' '}
                    <span className="text-slate-500">(price)</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="mr-3">Guide: {£0(data.property?.guide_price_gbp)}</span>
                    <span className="mr-3">Purchase: {£0(data.property?.purchase_price_gbp)}</span>
                    <span>Asking: {£0(data.property?.asking_price_gbp)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Investor metrics headline */}
          <Section title="Investor Metrics">
            <p className="text-sm text-slate-600 mb-3">
              Backend-calculated metrics are authoritative. Sliders below are for visual scenarios.
            </p>
            {/* KPI Row: Yield on Cost, DSCR, Net Profit (sell), ROI (sell), Net Cash Left In (refi) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KPI
                label="Yield on cost"
                value={period?.yield_on_cost_percent != null ? `${Number(period.yield_on_cost_percent).toFixed(2)}%` : '—'}
                subtitle="At stabilised reference"
              />
              <KPI label="DSCR (Month-1)" value={exitRefi?.dscr_month1 != null ? exitRefi.dscr_month1.toFixed(2) : '—'} />
              <KPI label="Sell: Net profit" value={exitSell?.net_profit_gbp != null ? £0(exitSell.net_profit_gbp) : '—'} />
              <KPI label="Sell: ROI" value={exitSell?.roi_percent != null ? `${Number(exitSell.roi_percent).toFixed(2)}%` : '—'} />
              <KPI label="Refi: Cash left in" value={exitRefi?.net_cash_left_in_after_refi_gbp != null ? £0(exitRefi.net_cash_left_in_after_refi_gbp) : '—'} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6">
              <DSCRGauge value={n(exitRefi?.dscr_month1)} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KPI label="Rent (modelled/mo)" value={£0((data.financials as any)?.monthly_rent_gbp)} big={false} />
                <KPI label="Stabilised NOI (annual)" value={period?.rent_collected_gbp != null ? £0(period.rent_collected_gbp) : '—'} big={false} />
                <KPI label="Total cash in (period)" value={period?.total_cash_in_gbp != null ? £0(period.total_cash_in_gbp) : '—'} big={false} />
                <KPI label="ROI (period / annualised)" value={
                  period?.roi_period_percent != null
                    ? `${Number(period.roi_period_percent).toFixed(1)}% / ${Number(period.roi_annualised_percent ?? 0).toFixed(1)}%`
                    : '—'
                } big={false} />
              </div>
            </div>
          </Section>

          {/* Refurbishment — with rollups incl. Overheads + EPC */}
          <Section
            title="Refurbishment Estimates"
            right={
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <label className="text-xs text-slate-600">Filter:</label>
                <select className="text-sm border rounded-md px-2 py-1" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  {roomTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <label className="text-xs text-slate-600 ml-2">Sort:</label>
                <select className="text-sm border rounded-md px-2 py-1" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
                  <option value="total_desc">Total (high → low)</option>
                  <option value="total_asc">Total (low → high)</option>
                  <option value="room_asc">Room (A → Z)</option>
                </select>

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
            }
          >
            {Array.isArray(data.refurb_estimates) && data.refurb_estimates.length ? (
              <>
                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {refinedRefurbs.map((est, idx) => (
                    <RoomCard key={est.id ?? `${est.room_type}-${idx}`} room={est} runId={runIdRef.current} propertyId={data.property_id} />
                  ))}
                </div>

                {/* Rollup strip */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <KPI
                    label="Rooms total (incl. VAT)"
                    value={£0(rollup.rooms_total_with_vat)}
                    subtitle={rollup.rooms_total_without_vat ? `ex-VAT ${£0(rollup.rooms_total_without_vat)}` : undefined}
                  />
                  <KPI
                    label="Whole-house overheads"
                    value={rollup.overheads_with_vat != null ? £0(rollup.overheads_with_vat) : '—'}
                    subtitle={rollup.overheads_without_vat != null ? `ex-VAT ${£0(rollup.overheads_without_vat)}` : undefined}
                  />
                  <KPI
                    label="EPC works"
                    value={rollup.epc_total_with_vat != null ? £0(rollup.epc_total_with_vat) : '—'}
                    subtitle={rollup.epc_total_without_vat != null ? `ex-VAT ${£0(rollup.epc_total_without_vat)}` : undefined}
                  />
                  <KPI
                    label="Grand refurb (incl. VAT)"
                    value={
                      rollup.property_total_with_vat != null
                        ? £0(rollup.property_total_with_vat)
                        : £0(rollup.rooms_total_with_vat! + nz(rollup.overheads_with_vat) + nz(rollup.epc_total_with_vat))
                    }
                    subtitle={
                      rollup.property_total_without_vat != null
                        ? `ex-VAT ${£0(rollup.property_total_without_vat)}`
                        : undefined
                    }
                  />
                  <KPI
                    label="V2 fallback (incl. VAT)"
                    value={rollup.v2_total_with_vat_fallback ? £0(rollup.v2_total_with_vat_fallback) : '—'}
                    subtitle="if no rollups present"
                  />
                </div>

                {/* Totals table (with optional Overheads + EPC rows) */}
                <div className="overflow-x-auto">
                  <table className="w-full border text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="p-2 text-left">Room</th>
                        <th className="p-2 text-right">Materials (gross)</th>
                        <th className="p-2 text-right">Labour</th>
                        <th className="p-2 text-right">Room Total</th>
                        <th className="p-2 text-right">Conf.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.refurb_estimates.map((est, i) => {
                        const mat = toInt(est.materials_total_with_vat_gbp ?? est.materials_total_gbp);
                        const lab = toInt(est.labour_total_gbp);
                        const total = roomV2Total(est);
                        const conf =
                          typeof (est as any).confidence === 'number'
                            ? Math.round(((est as any).confidence as number) * 100)
                            : typeof (est as any).room_confidence === 'number'
                            ? Math.round(Number((est as any).room_confidence) * 100)
                            : null;
                        return (
                          <tr key={est.id ?? `row-${i}`} className="border-t">
                            <td className="p-2 capitalize">
                              {(est.detected_room_type || est.room_type || 'room').toString().replace(/_/g, ' ')}
                            </td>
                            <td className="p-2 text-right">{£0(mat)}</td>
                            <td className="p-2 text-right">{£0(lab)}</td>
                            <td className="p-2 text-right font-semibold">{£0(total)}</td>
                            <td className="p-2 text-right">{conf != null ? `${conf}%` : '—'}</td>
                          </tr>
                        );
                      })}

                      {/* Optional derived lines from room_totals */}
                      {Array.isArray(data.property?.room_totals) &&
                        data.property.room_totals
                          .filter((r: any) => (r.room_name || '').toLowerCase().includes('overheads'))
                          .map((r: any, i: number) => (
                            <tr key={`oh-${i}`} className="border-t bg-slate-50/50">
                              <td className="p-2">Whole-House Overheads</td>
                              <td className="p-2 text-right">—</td>
                              <td className="p-2 text-right">—</td>
                              <td className="p-2 text-right font-semibold">{£0(r.total_with_vat)}</td>
                              <td className="p-2 text-right">—</td>
                            </tr>
                          ))}
                      {Array.isArray(data.property?.room_totals) &&
                        data.property.room_totals
                          .filter((r: any) => r.type === 'epc_totals')
                          .map((r: any, i: number) => (
                            <tr key={`epc-${i}`} className="border-t bg-slate-50/50">
                              <td className="p-2">EPC Works</td>
                              <td className="p-2 text-right">—</td>
                              <td className="p-2 text-right">—</td>
                              <td className="p-2 text-right font-semibold">{£0(r.epc_total_with_vat)}</td>
                              <td className="p-2 text-right">—</td>
                            </tr>
                          ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-slate-50">
                        <td className="p-2 text-right font-medium">Totals</td>
                        <td className="p-2 text-right font-medium">
                          {£0(
                            data.refurb_estimates.reduce(
                              (a, r) => a + toInt(r.materials_total_with_vat_gbp ?? r.materials_total_gbp),
                              0,
                            ),
                          )}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {£0(data.refurb_estimates.reduce((a, r) => a + toInt(r.labour_total_gbp), 0))}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {£0(data.refurb_estimates.reduce((a, r) => a + roomV2Total(r), 0))}
                        </td>
                        <td className="p-2" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-700">
                <p className="font-medium">No refurbishment rows were saved for this property.</p>
                {data?.refurb_debug && (
                  <p className="text-sm mt-1">
                    Materials rows: <strong>{data.refurb_debug.materials_count ?? 0}</strong> · Labour rows: <strong>{data.refurb_debug.labour_count ?? 0}</strong>
                  </p>
                )}
              </div>
            )}
          </Section>

          {/* Rent estimate feedback */}
          <Section
            title="Rent Estimate"
            right={<span className="text-sm text-slate-600">Modelled: <strong>{£0((data.financials as any)?.monthly_rent_gbp)}</strong> / month</span>}
          >
            <p className="text-sm text-slate-600 mb-2">Tell us if this looks right based on your market knowledge.</p>
            <FeedbackBar runId={runIdRef.current} propertyId={data.property_id} module="rent" />
            {data.property?.rent_rationale && (
              <div className="mt-3 text-xs text-slate-600">
                <strong>Model notes:</strong> {data.property.rent_rationale}
              </div>
            )}
          </Section>

          {/* EPC + fabric and services */}
          <Section
            title="EPC & Fabric"
            right={<span className="text-sm text-slate-600">Rating: <strong>{epc?.current ?? '—'}</strong>{epc?.potential ? ` → ${epc.potential}` : ''}</span>}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-slate-600">Windows: <strong>{data.property?.windows ?? '—'}</strong></div>
                <div className="text-sm text-slate-600">Main fuel: <strong>{services?.main_fuel ?? '—'}</strong></div>
                <div className="text-sm text-slate-600">Gas: <strong>{services?.mains_gas_bool ? 'Yes' : services?.mains_gas_flag ?? '—'}</strong></div>
                <div className="text-sm text-slate-600">Lighting (low-energy): <strong>{services?.low_energy_lighting_pct != null ? `${services.low_energy_lighting_pct}%` : '—'}</strong></div>
                <div className="text-sm text-slate-600">Hot water: <strong>{data.property?.hot_water ?? '—'}</strong></div>
                <div className="text-sm text-slate-600">Heating: <strong>{data.property?.main_heat ?? '—'}</strong></div>
              </div>
              <div className="space-y-2">
                <div className="text-sm"><span className="text-slate-500">Roof:</span> <strong>{efficiency?.roof?.energy ?? '—'}</strong></div>
                <div className="text-sm"><span className="text-slate-500">Walls:</span> <strong>{efficiency?.walls?.energy ?? '—'}</strong></div>
                <div className="text-sm"><span className="text-slate-500">Windows:</span> <strong>{efficiency?.windows?.energy ?? '—'}</strong></div>
                <div className="text-sm"><span className="text-slate-500">Hot water:</span> <strong>{efficiency?.hot_water?.energy ?? '—'}</strong></div>
                <div className="text-sm"><span className="text-slate-500">Main heat:</span> <strong>{efficiency?.main_heat?.energy ?? '—'}</strong></div>
                <div className="text-xs text-slate-500">EPC works budget shown in Refurb rollup.</div>
              </div>
              <div className="flex items-center md:justify-end">
                <div className="text-sm">
                  {epc?.score_current != null && epc?.score_potential != null ? (
                    <>
                      <div className="font-medium mb-1">Score: {epc.score_current} → {epc.score_potential}</div>
                      <div className="h-2 w-56 bg-slate-200 rounded">
                        <div
                          className="h-2 bg-green-500 rounded"
                          style={{ width: `${Math.max(0, Math.min(100, (epc.score_current / epc.score_potential) * 100))}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Potential improvement toward B</div>
                    </>
                  ) : (
                    <div className="text-slate-500">No EPC score values</div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <FeedbackBar runId={runIdRef.current} propertyId={data.property_id} module="epc" />
            </div>
          </Section>

          {/* Financial sliders + backend-calculated tables */}
          <Section title="Financial Summary" right={data.pdf_url ? (
            <a href={`/api/pdf-proxy?url=${encodeURIComponent(data.pdf_url)}`} target="_blank" rel="noopener noreferrer" className="text-sm inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-slate-50">
              Download PDF
            </a>
          ) : null}
          >
            {/* Live assumptions sliders (unchanged) */}
            <div className="mb-4">
              <FinancialSliders
                priceGBP={basePrice}
                refurbTotalGBP={rollup.property_total_with_vat ?? baseRefurb}
                rentMonthlyGBP={baseRent}
                defaults={{}}
                onChange={(a, d) => {
                  setSlAssumptions(a);
                  setSlDerived(d);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('metrics:refresh'));
                  }
                }}
              />
              <div className="mt-2 flex items-center gap-3">
                <FeedbackBar runId={runIdRef.current} propertyId={data.property_id} module="financials" targetKey="assumptions" compact />
                <FeedbackBar runId={runIdRef.current} propertyId={data.property_id} module="financials" targetKey="outputs" compact />
              </div>
            </div>

            {/* Backend-calculated snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Period snapshot */}
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">Period Snapshot</h4>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <dt className="text-slate-600">Months: refurb / rented / bridge</dt>
                  <dd className="text-right">{period ? `${period.months_refurb} / ${period.months_rented} / ${period.months_on_bridge}` : '—'}</dd>
                  <dt className="text-slate-600">Total cash in</dt>
                  <dd className="text-right">{period ? £0(period.total_cash_in_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Rent collected</dt>
                  <dd className="text-right">{period ? £0(period.rent_collected_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Cashflow (period)</dt>
                  <dd className="text-right">{period ? £0(period.period_cashflow_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Yield on cost</dt>
                  <dd className="text-right">{period?.yield_on_cost_percent != null ? `${Number(period.yield_on_cost_percent).toFixed(2)}%` : '—'}</dd>
                  <dt className="text-slate-600">ROI (period / annualised)</dt>
                  <dd className="text-right">
                    {period?.roi_period_percent != null
                      ? `${Number(period.roi_period_percent).toFixed(2)}% / ${Number(period.roi_annualised_percent ?? 0).toFixed(2)}%`
                      : '—'}
                  </dd>
                </dl>
              </div>

              {/* Exit — Sell */}
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">Exit: Sell</h4>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <dt className="text-slate-600">Sale price</dt>
                  <dd className="text-right">{exitSell ? £0(exitSell.sale_price_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Selling costs</dt>
                  <dd className="text-right">{exitSell ? £0(exitSell.selling_costs_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Repay bridge</dt>
                  <dd className="text-right">{exitSell ? £0(exitSell.repay_bridge_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Net profit</dt>
                  <dd className="text-right">{exitSell ? £0(exitSell.net_profit_gbp) : '—'}</dd>
                  <dt className="text-slate-600">ROI</dt>
                  <dd className="text-right">{exitSell?.roi_percent != null ? `${Number(exitSell.roi_percent).toFixed(2)}%` : '—'}</dd>
                </dl>
              </div>

              {/* Exit — Refi 24m */}
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">Exit: Refi (24m)</h4>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <dt className="text-slate-600">Refi value</dt>
                  <dd className="text-right">{exitRefi ? £0(exitRefi.refi_value_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Final BTL loan</dt>
                  <dd className="text-right">{exitRefi ? £0(exitRefi.final_btl_loan_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Cash from refi after repay</dt>
                  <dd className="text-right">{exitRefi ? £0(exitRefi.cash_from_refi_after_repay_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Net cash left in</dt>
                  <dd className="text-right">{exitRefi ? £0(exitRefi.net_cash_left_in_after_refi_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Tot. 24m net cashflow</dt>
                  <dd className="text-right">{exitRefi ? £0(exitRefi.net_cashflow_24m_gbp) : '—'}</dd>
                  <dt className="text-slate-600">ROI (cash-on-cash 24m)</dt>
                  <dd className="text-right">
                    {exitRefi?.roi_cash_on_cash_percent_24m != null ? `${Number(exitRefi.roi_cash_on_cash_percent_24m).toFixed(2)}%` : '—'}
                  </dd>
                  <dt className="text-slate-600">DSCR (Month-1)</dt>
                  <dd className="text-right">{exitRefi?.dscr_month1 != null ? exitRefi.dscr_month1.toFixed(2) : '—'}</dd>
                </dl>
              </div>
            </div>

            {/* Backend-calculated "flat list" for anything else present in financials */}
            {data.financials ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 mt-4">
                {Object.entries(data.financials)
                  .filter(([k]) => !new Set(['id', 'property_id', 'created_at', 'updated_at', 'summary', 'scenarios']).has(k))
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b py-1 text-sm">
                      <dt className="capitalize text-slate-600">{titleize(k)}</dt>
                      <dd className="font-medium text-right">
                        {String(k).endsWith('_gbp') ? £0(v) : typeof v === 'number' ? v.toLocaleString() : String(v)}
                      </dd>
                    </div>
                  ))}
              </dl>
            ) : (
              <p className="text-slate-600">No financials found for this property yet.</p>
            )}

            <div className="mt-3">
              <FeedbackBar runId={runIdRef.current} propertyId={data.property_id} module="financials" />
            </div>
          </Section>

          {/* Report preview */}
          {data.pdf_url && (
            <Section title="Report Preview">
              <PDFViewer pdfUrl={`/api/pdf-proxy?url=${encodeURIComponent(data.pdf_url)}`} />
            </Section>
          )}

          {/* Scenarios (render safely) */}
          {(scenarios?.inputs || scenarios?.exit_sell || scenarios?.exit_refi_24m || scenarios?.period_no_refi) && (
            <Section title="Scenarios (backend)">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Inputs</h4>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {Object.entries(scenarios.inputs || {}).map(([k, v]) => (
                      <FragmentKV key={`in-${k}`} k={k} v={v} />
                    ))}
                  </dl>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Exit: Sell</h4>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {Object.entries(scenarios.exit_sell || {}).map(([k, v]) => (
                      <FragmentKV key={`sell-${k}`} k={k} v={v} />
                    ))}
                  </dl>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Exit: Refi (24m)</h4>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {Object.entries(scenarios.exit_refi_24m || {}).map(([k, v]) => (
                      <FragmentKV key={`refi-${k}`} k={k} v={v} />
                    ))}
                  </dl>
                </div>

                {/* Period (no-refi) */}
                {scenarios.period_no_refi && (
                  <div className="rounded-lg border p-4 lg:col-span-3">
                    <h4 className="font-semibold mb-2">Period (no refi)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-medium">Bridge</h5>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                          {Object.entries(scenarios.period_no_refi.bridge || {}).map(([k, v]) => (
                            <FragmentKV key={`bridge-${k}`} k={k} v={v} />
                          ))}
                        </dl>
                      </div>
                      <div>
                        <h5 className="font-medium">Works phase</h5>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                          {Object.entries(scenarios.period_no_refi.works_phase || {}).map(([k, v]) => (
                            <FragmentKV key={`works-${k}`} k={k} v={v} />
                          ))}
                        </dl>
                      </div>
                      <div>
                        <h5 className="font-medium">Operations during bridge</h5>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                          {Object.entries(scenarios.period_no_refi.operations_during_bridge || {}).map(([k, v]) => (
                            <FragmentKV key={`ops-${k}`} k={k} v={v} />
                          ))}
                        </dl>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Debug drawer */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <button className="text-sm rounded-md border px-3 py-1.5 hover:bg-slate-50" onClick={() => setShowDebug((s) => !s)}>
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
            {showDebug && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <pre className="bg-slate-50 p-3 rounded border overflow-auto">
                  <code>{JSON.stringify({ status, run: data?.run }, null, 2)}</code>
                </pre>
                <pre className="bg-slate-50 p-3 rounded border overflow-auto">
                  <code>{JSON.stringify({ property: data?.property, financials: data?.financials }, null, 2)}</code>
                </pre>
                <pre className="bg-slate-50 p-3 rounded border overflow-auto md:col-span-2">
                  <code>{JSON.stringify({ refurb_estimates: data?.refurb_estimates }, null, 2)}</code>
                </pre>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

/* ---------- small helper for scenarios table rows ---------- */
function FragmentKV({ k, v }: { k: string; v: any }) {
  const isMoney = k.endsWith('_gbp') || k.endsWith('_gbp_per_m') || /price|fee|cost|loan/i.test(k);
  const isPct = k.endsWith('_pct') || /rate|ltv|roi|yield|growth/i.test(k);
  const formatted =
    v == null
      ? '—'
      : typeof v === 'object'
      ? JSON.stringify(v)
      : isMoney
      ? gbp0.format(Number(v))
      : isPct
      ? `${(Number(v) * (String(v).includes('%') ? 1 : 100)).toFixed(2)}%`.replace('NaN%', '—')
      : Number.isFinite(Number(v))
      ? Number(v).toLocaleString()
      : String(v);
  return (
    <>
      <dt className="text-slate-600 capitalize">{titleize(k)}</dt>
      <dd className="text-right">{formatted}</dd>
    </>
  );
}
