// src/app/demo/page.tsx
'use client';

/*
  PropertyScout — Investor View (Pro)
  ------------------------------------------------------------
  Goals
  - Make scenarios first-class: clear presets + explainers + sensitivity sliders
  - Surface key investor KPIs up top with plain-English context
  - Deep dive panels for Refurb, Scenarios (Period / Exit Sell / Exit Refi 24m), EPC, Media
  - Download actions (Investor Pack / Builder Quote)
  - Accessible, mobile-first, production-ready Tailwind + shadcn/ui

  Drop-in replacement for the previous demo page. Keeps the same demo-run loader
  but completely revamps the presentation layer and adds interactive sensitivities.
*/

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// --- shadcn/ui --- //
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Icons (lucide-react)
import { Download, FileText, BarChart3, Home, Building2, PoundSterling, Ruler, Fuel, Settings2, Info, ExternalLink, Construction, LineChart, Gauge, Building, TrendingUp, ShieldCheck, Banknote, BadgeInfo } from 'lucide-react';

// --- existing API helpers (unchanged) --- //
import { pollUntilDone, type RunStatus, startAnalyze, POLL_BUILD } from '@/lib/api';

/* ---------- demo mode config (REQUIRED) ---------- */
const DEFAULT_DEMO_RUN_ID = '51767b89-2793-49ac-b578-da8063d59b2f';

/* ---------- branding ---------- */
const LOGO_SRC = '/propvisions_logo.png';

/* ---------- helpers ---------- */
const gbpFmt0 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const gbpFmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 });
const pctFmt = (v?: number | null) => (v == null ? '—' : `${(v * 100).toFixed(2)}%`);
const pctWhole = (v?: number | null) => (v == null ? '—' : `${(v * 100).toFixed(0)}%`);
const pctLabel = (v?: number | null) => (v == null ? '—' : `${Number(v).toFixed(2)}%`);
const n0 = (v?: number | null) => (v == null ? '—' : Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 }));
const money0 = (v?: number | null) => (v == null ? '—' : gbpFmt0.format(Number(v)));
const money2 = (v?: number | null) => (v == null ? '—' : gbpFmt.format(Number(v)));
const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

function pickPrice(p: any): number {
  return (
    Number(p?.purchase_price_gbp ?? 0) ||
    Number(p?.guide_price_gbp ?? 0) ||
    Number(p?.asking_price_gbp ?? 0) ||
    Number(p?.price_gbp ?? 0) ||
    0
  );
}

function kpiBadge(text: string, tone: 'ok' | 'warn' | 'bad' | 'info' = 'info') {
  const map: Record<string, string> = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-900 border-amber-200',
    bad: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return <span className={cx('text-[11px] px-2 py-0.5 rounded-full border', map[tone])}>{text}</span>;
}

/* ---------- tiny progress bar ---------- */
function ProgressBar({ percent, show }: { percent: number; show: boolean }) {
  return (
    <div className={cx('mt-3 w-full', !show && 'hidden')} aria-hidden={!show}>
      <div className="h-2 w-full bg-slate-200/70 rounded overflow-hidden">
        <div
          className="h-2 bg-blue-600 transition-[width] duration-300 ease-out will-change-[width]"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

/* ---------- local types ---------- */
interface RefurbRoomV2 {
  id: string;
  image_id?: string | null;
  image_url?: string | null;
  room_type?: string | null;
  detected_room_type?: string | null;
  materials_total_gbp?: number | null;
  materials_total_with_vat_gbp?: number | null;
  labour_total_gbp?: number | null;
  room_total_gbp?: number | null;
  room_total_with_vat_gbp?: number | null;
  materials?: any[] | null;
  labour?: any[] | null;
}

/* ---------- totals helpers ---------- */
function roomV2Total(r: RefurbRoomV2): number {
  const direct = Math.round(
    Number(r.room_total_with_vat_gbp ?? 0) || Number(r.room_total_gbp ?? 0)
  );
  if (direct) return direct;
  const mat = Math.round(
    Number(r.materials_total_with_vat_gbp ?? r.materials_total_gbp ?? 0)
  );
  const lab = Math.round(Number(r.labour_total_gbp ?? 0));
  return mat + lab;
}

function sumV2Totals(rows: RefurbRoomV2[] | undefined | null): number {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((acc, r) => acc + roomV2Total(r), 0);
}

/* ---------- Scenario maths (lightweight) ---------- */
function computeScenario(
  base: {
    purchasePrice: number;
    refurbCost: number;
    sdlt: number;
    annualRent: number;
    annualOpex?: number; // if not given, assume 25% of rent as conservative netting
  },
  overrides?: Partial<{ purchasePrice: number; refurbCost: number; annualRent: number }>
) {
  const purchasePrice = overrides?.purchasePrice ?? base.purchasePrice;
  const refurbCost = overrides?.refurbCost ?? base.refurbCost;
  const annualRent = overrides?.annualRent ?? base.annualRent;
  const feesOther = 0; // could be extended to include legal/surveys/insurance if supplied
  const allInCost = purchasePrice + refurbCost + base.sdlt + feesOther;

  // Assume opex ~ 22% by default unless overridden by base. This is a presentational KPI only.
  const opex = base.annualOpex ?? Math.max(annualRent * 0.22, 0);
  const management = annualRent * 0.1; // 10% mgmt default (presentational)
  const noi = Math.max(annualRent - opex - management, 0);
  const yieldOnCost = allInCost > 0 ? noi / allInCost : 0;

  return { purchasePrice, refurbCost, annualRent, allInCost, opex, management, noi, yieldOnCost };
}

/* ---------- page ---------- */
export default function Page() {
  // --- data & run state --- //
  const [status, setStatus] = useState<RunStatus | 'idle'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [progress, setProgress] = useState(0);
  const [useDemo, setUseDemo] = useState<boolean>(!!DEFAULT_DEMO_RUN_ID);
  const [demoRunId, setDemoRunId] = useState<string>(DEFAULT_DEMO_RUN_ID);
  const [url, setUrl] = useState('');

  const [data, setData] = useState<{
    property_id: string | null;
    property: any | null;
    financials: Record<string, any> | null;
    refurb_estimates: RefurbRoomV2[];
    pdf_url?: string | null;
    run?: any;
  } | null>(null);

  const runIdRef = useRef<string | null>(null);
  const execIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const running = status === 'queued' || status === 'processing';

  // On load: allow ?run=
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const usp = new URLSearchParams(window.location.search);
    const qRun = usp.get('run');
    if (qRun) {
      setUseDemo(true);
      setDemoRunId(qRun);
    }
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!running) return;
    startedAtRef.current = Date.now();
    const t = setInterval(() => setElapsedMs(Date.now() - (startedAtRef.current || Date.now())), 250);
    return () => clearInterval(t);
  }, [running]);

  // Progress ramp
  useEffect(() => {
    if (!running) return;
    setProgress((p) => (p < 6 ? 6 : p));
    const RAMP_MS = 100 * 60 * 1000; // very slow ramp for long jobs
    const MAX = 97;
    const t = setInterval(() => {
      const elapsed = Date.now() - (startedAtRef.current || Date.now());
      const target = Math.min(MAX, (elapsed / RAMP_MS) * MAX);
      setProgress((p) => (p < target ? p + Math.min(0.8, target - p) : p));
    }, 300);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (status === 'completed') setProgress(100);
    if ((status === 'failed' || status === 'idle') && !running) setProgress(0);
  }, [status, running]);

  async function loadDemoRun(theRunIdRaw: string) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const theRunId = (theRunIdRaw || '').trim();
      if (!theRunId) {
        setStatus('failed');
        setError('No demo run_id provided.');
        return;
      }
      abortRef.current?.abort();
      setStatus('queued');
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
      setData({
        property_id: result.property_id ?? null,
        property: result.property ?? null,
        financials: result.financials ?? null,
        refurb_estimates: Array.isArray(result.refurb_estimates) ? (result.refurb_estimates as RefurbRoomV2[]) : [],
        pdf_url: result.pdf_url ?? null,
        run: result.run ?? undefined,
      });
    } catch (err: any) {
      setError(err?.message || 'Run failed');
      setStatus('failed');
    } finally {
      abortRef.current = null;
      setTimeout(() => {
        submittingRef.current = false;
      }, 300);
    }
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setError(null);
      setData(null);
      if (useDemo) {
        await loadDemoRun(demoRunId);
        return;
      }
      setStatus('queued');
      setProgress((p) => (p < 6 ? 6 : p));
      let kickoff: { run_id: string; execution_id?: string };
      try {
        kickoff = await startAnalyze(url);
      } catch (err: any) {
        setStatus('failed');
        setError(err?.message || 'Failed to start analysis');
        return;
      }
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
        setData({
          property_id: result.property_id ?? null,
          property: result.property ?? null,
          financials: result.financials ?? null,
          refurb_estimates: Array.isArray(result.refurb_estimates) ? (result.refurb_estimates as RefurbRoomV2[]) : [],
          pdf_url: result.pdf_url ?? null,
          run: result.run ?? undefined,
        });
      } catch (err: any) {
        setError(err?.message || 'Run failed');
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

  function handleCancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('failed');
    setError('Cancelled.');
  }

  // ---------- Derived UI data ---------- //
  const prop = data?.property ?? null;
  const fin = data?.financials ?? null;
  const refurbs = (data?.refurb_estimates ?? []) as RefurbRoomV2[];

  const purchasePrice = useMemo(() => pickPrice(prop), [prop]);
  const monthlyRent = useMemo(() => Number(fin?.monthly_rent_gbp ?? prop?.monthly_rent_gbp ?? 0), [fin, prop]);
  const annualRent = useMemo(() => Number(fin?.annual_rent_gbp ?? prop?.annual_rent_gbp ?? monthlyRent * 12), [fin, prop, monthlyRent]);
  const sdlt = useMemo(() => Number(prop?.scenarios?.inputs?.sdlt_gbp ?? fin?.scenarios?.inputs?.sdlt_gbp ?? 0), [prop, fin]);
  const refurbWithVat = useMemo(
    () => Number(prop?.property_total_with_vat ?? fin?.refurb_total_with_vat_gbp ?? sumV2Totals(refurbs)),
    [prop, fin, refurbs]
  );

  const kpis = useMemo(() => {
    const period = prop?.summary?.period ?? fin?.summary?.period ?? {};
    const exitSell = prop?.summary?.exit_sell ?? fin?.summary?.exit_sell ?? {};
    const exitRefi = prop?.summary?.exit_refi_24m ?? fin?.summary?.exit_refi_24m ?? {};

    return {
      yieldOnCost: period?.yield_on_cost_percent, // already % number, not 0-1
      roiAnnualised: period?.roi_annualised_percent,
      roiPeriod: period?.roi_period_percent,
      periodCashflow: period?.period_cashflow_gbp,
      salePrice: exitSell?.sale_price_gbp,
      roiSell: exitSell?.roi_percent,
      dscr: exitRefi?.dscr_month1,
      netCashLeftIn: exitRefi?.net_cash_left_in_after_refi_gbp,
    };
  }, [prop, fin]);

  // Sensitivities
  const [rentAdj, setRentAdj] = useState(100); // %
  const [refurbAdj, setRefurbAdj] = useState(100); // %
  const [priceAdj, setPriceAdj] = useState(100); // %

  const scenarioBase = useMemo(() => computeScenario({
    purchasePrice,
    refurbCost: refurbWithVat,
    sdlt,
    annualRent,
    annualOpex: prop?.scenarios?.period_no_refi?.reference_stabilised?.net_annual_if_full_year_gbp
      ? Math.max(annualRent - Number(prop?.scenarios?.period_no_refi?.reference_stabilised?.net_annual_if_full_year_gbp), 0)
      : undefined,
  }), [purchasePrice, refurbWithVat, sdlt, annualRent, prop]);

  const scenarioAdj = useMemo(() =>
    computeScenario(
      { purchasePrice, refurbCost: refurbWithVat, sdlt, annualRent },
      {
        purchasePrice: (priceAdj / 100) * purchasePrice,
        refurbCost: (refurbAdj / 100) * refurbWithVat,
        annualRent: (rentAdj / 100) * annualRent,
      }
    ), [purchasePrice, refurbWithVat, sdlt, annualRent, rentAdj, refurbAdj, priceAdj]
  );

  // Room filter/sort
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('All');
  const [sortKey, setSortKey] = useState<'total_desc' | 'total_asc' | 'room_asc'>('total_desc');
  const roomTypes = useMemo(() => {
    const set = new Set<string>();
    (refurbs || []).forEach((r) => set.add(((r.detected_room_type || r.room_type || 'Other') + '').replace(/\b\w/g, (c) => c.toUpperCase())));
    return ['All', ...Array.from(set).sort()];
  }, [refurbs]);

  const refinedRefurbs = useMemo(() => {
    let list = [...(refurbs || [])];
    if (roomTypeFilter !== 'All') {
      list = list.filter((r) => ((r.detected_room_type || r.room_type || 'Other') + '').toLowerCase() === roomTypeFilter.toLowerCase());
    }
    const byRoom = (r: RefurbRoomV2) => (r.detected_room_type || r.room_type || 'Other').toString().toLowerCase();
    list.sort((a, b) => {
      if (sortKey === 'total_desc') return roomV2Total(b) - roomV2Total(a);
      if (sortKey === 'total_asc') return roomV2Total(a) - roomV2Total(b);
      return byRoom(a).localeCompare(byRoom(b));
    });
    return list;
  }, [refurbs, roomTypeFilter, sortKey]);

  // ---------- UI ---------- //
  return (
    <TooltipProvider>
      <main className="min-h-screen bg-slate-50">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
            <Image src={LOGO_SRC} alt="PropertyScout" width={120} height={32} className="h-8 w-auto" />
            <div className="flex-1" />
            <div className="hidden md:flex items-center gap-3 text-xs text-slate-600">
              <span>Build: {POLL_BUILD}</span>
              {status !== 'idle' && (
                <span className={cx('px-2 py-0.5 rounded border',
                  status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-900 border-amber-200'
                )}>{status}</span>
              )}
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 pb-3">
            <ProgressBar percent={progress} show={status === 'queued' || status === 'processing'} />
          </div>
        </header>

        {/* Hero + actions */}
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* URL / Run controls */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleStart} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
                <Input
                  type="url"
                  placeholder="Paste a listing or auction URL…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required={!useDemo}
                />
                <div className="flex items-center gap-3 justify-end">
                  <Label className="flex items-center gap-2 text-slate-600 text-xs">
                    <input type="checkbox" className="accent-blue-600" checked={useDemo} onChange={(e) => setUseDemo(e.target.checked)} />
                    Use demo run
                  </Label>
                  <Input
                    value={demoRunId}
                    onChange={(e) => setDemoRunId(e.target.value)}
                    className="w-[280px]"
                    placeholder="demo run_id (UUID)"
                    disabled={!useDemo}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  {running && (
                    <Button type="button" variant="secondary" onClick={handleCancel}>Stop</Button>
                  )}
                  <Button type="submit" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {running ? 'Running…' : 'Analyze'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Property Summary Header */}
          {status === 'completed' && data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                        <Home className="h-6 w-6 text-slate-400" />
                        {prop?.property_title || 'Untitled property'}
                      </CardTitle>
                      <p className="text-slate-600 mt-1">
                        {prop?.address}{prop?.postcode ? `, ${prop.postcode}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary" className="gap-1"><Building2 className="h-3.5 w-3.5" /> {prop?.property_type || '—'}</Badge>
                        <Badge variant="secondary">Tenure: {prop?.tenure || '—'}</Badge>
                        <Badge variant="secondary">Beds: {prop?.bedrooms ?? '—'}</Badge>
                        <Badge variant="secondary">Baths: {prop?.bathrooms ?? '—'}</Badge>
                        <Badge variant="secondary" className="gap-1"><Ruler className="h-3.5 w-3.5" /> {n0(prop?.floorplan_total_area_sqm)} m²</Badge>
                        <Badge variant="secondary" className="gap-1"><Fuel className="h-3.5 w-3.5" /> EPC: {prop?.epc_rating_current ?? '—'} ({prop?.epc_score_current ?? '—'})</Badge>
                      </div>
                    </div>
                    {prop?.listing_images?.[0] && (
                      <div className="relative h-28 w-40 overflow-hidden rounded-xl border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={prop.listing_images[0]} alt="Primary" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {prop?.features?.length ? (
                    <div className="flex flex-wrap gap-2 py-2">
                      {prop.features.map((f: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full border bg-white text-slate-700">{f}</span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <Stat label="Guide / Purchase" value={money0(purchasePrice)} icon={<PoundSterling className="h-4 w-4" />} />
                    <Stat label="Refurb (incl. VAT)" value={money0(refurbWithVat)} icon={<Construction className="h-4 w-4" />} />
                    <Stat label="Rent / month" value={money0(monthlyRent)} icon={<Banknote className="h-4 w-4" />} />
                    <Stat label="Rent / year" value={money0(annualRent)} icon={<Banknote className="h-4 w-4" />} />
                  </div>
                </CardContent>
              </Card>

              {/* KPI Column */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-slate-400" /> Investor KPIs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Yield on Cost</span>
                    <div className="flex items-center gap-2">
                      {kpiBadge(kpis.yieldOnCost != null ? `${Number(kpis.yieldOnCost).toFixed(2)}%` : '—', 'ok')}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent>NOI ÷ (Price + Refurb + SDLT + fees). Based on stabilised year net income.</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">ROI (annualised)</span>
                    {kpiBadge(kpis.roiAnnualised != null ? `${Number(kpis.roiAnnualised).toFixed(2)}%` : '—', 'info')}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Period Cashflow</span>
                    <span className="font-medium">{money0(kpis.periodCashflow)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Exit — Sell ROI</span>
                    {kpiBadge(kpis.roiSell != null ? `${Number(kpis.roiSell).toFixed(2)}%` : '—', 'ok')}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Exit — Refi DSCR (Month 1)</span>
                    {kpis.dscr != null ? (
                      <span className={cx('font-medium', Number(kpis.dscr) >= 1.2 ? 'text-emerald-700' : 'text-rose-700')}>
                        {Number(kpis.dscr).toFixed(2)}
                      </span>
                    ) : '—'}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Net Cash Left In (post-refi)</span>
                    <span className="font-medium">{money0(kpis.netCashLeftIn)}</span>
                  </div>

                  {/* Downloads */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {prop?.preview_url_investor_pack && (
                      <Button asChild variant="secondary" className="gap-2 w-full">
                        <Link href={prop.preview_url_investor_pack} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4" /> Investor Pack
                        </Link>
                      </Button>
                    )}
                    {prop?.preview_url_builders_quote && (
                      <Button asChild variant="secondary" className="gap-2 w-full">
                        <Link href={prop.preview_url_builders_quote} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" /> Builder Quote
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Scenario Studio */}
          {status === 'completed' && data && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-slate-400" /> Scenario Studio
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Explore sensitivities and exits. Scenarios are computed from the analysis inputs and presented in
                  plain English so investors (and lenders) can follow the logic.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sliders */}
                  <div className="space-y-6">
                    <SliderBlock
                      label="Rent"
                      value={rentAdj}
                      onChange={setRentAdj}
                      prefix="−20%"
                      suffix="+20%"
                      help="Adjust expected monthly/annual rent relative to the estimate."
                    />
                    <SliderBlock
                      label="Refurb Cost"
                      value={refurbAdj}
                      onChange={setRefurbAdj}
                      prefix="−20%"
                      suffix="+20%"
                      help="Adjust total refurb (incl. VAT)."
                    />
                    <SliderBlock
                      label="Purchase Price"
                      value={priceAdj}
                      onChange={setPriceAdj}
                      prefix="−10%"
                      suffix="+10%"
                      min={90}
                      max={110}
                      step={1}
                      help="Adjust agreed purchase price."
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="secondary" size="sm" onClick={() => { setRentAdj(90); setRefurbAdj(110); setPriceAdj(100); }}>Conservative</Button>
                      <Button variant="secondary" size="sm" onClick={() => { setRentAdj(100); setRefurbAdj(100); setPriceAdj(100); }}>Base</Button>
                      <Button variant="secondary" size="sm" onClick={() => { setRentAdj(110); setRefurbAdj(90); setPriceAdj(100); }}>Upside</Button>
                    </div>
                  </div>

                  {/* Headline KPIs */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <KpiPanel title="Stabilised (reference)" subtitle="Assumes full-year net income at stabilisation.">
                      <KpiRow label="All-in Cost" value={money0(scenarioBase.allInCost)} />
                      <KpiRow label="NOI (annual)" value={money0(scenarioBase.noi)} />
                      <KpiRow label="Yield on Cost" value={pctLabel(scenarioBase.yieldOnCost * 100)} />
                    </KpiPanel>
                    <KpiPanel title="With Adjustments" subtitle="Reflects the sliders above.">
                      <KpiRow label="All-in Cost" value={money0(scenarioAdj.allInCost)} />
                      <KpiRow label="NOI (annual)" value={money0(scenarioAdj.noi)} />
                      <KpiRow label="Yield on Cost" value={pctLabel(scenarioAdj.yieldOnCost * 100)} tone={scenarioAdj.yieldOnCost >= scenarioBase.yieldOnCost ? 'ok' : 'bad'} />
                    </KpiPanel>

                    {/* Exit tabs */}
                    <div className="md:col-span-2">
                      <Tabs defaultValue="period" className="w-full">
                        <TabsList>
                          <TabsTrigger value="period">Period (Bridge + Works)</TabsTrigger>
                          <TabsTrigger value="sell">Exit: Sell</TabsTrigger>
                          <TabsTrigger value="refi">Exit: Refi (24m)</TabsTrigger>
                        </TabsList>
                        <TabsContent value="period" className="mt-4">
                          <PeriodPanel prop={prop} fin={fin} />
                        </TabsContent>
                        <TabsContent value="sell" className="mt-4">
                          <SellPanel prop={prop} fin={fin} />
                        </TabsContent>
                        <TabsContent value="refi" className="mt-4">
                          <RefiPanel prop={prop} fin={fin} />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deep Dive: Refurb */}
          {status === 'completed' && data && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Construction className="h-5 w-5 text-slate-400" /> Refurbishment Breakdown
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Room-by-room costs derived from listing photos. Materials and labour subtotals include VAT where available.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-xs text-slate-600">Filter:</span>
                  {roomTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setRoomTypeFilter(t)}
                      className={cx(
                        'text-xs px-3 py-1 rounded-full border',
                        roomTypeFilter === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-2 text-xs">
                    <span>Sort:</span>
                    <button onClick={() => setSortKey('total_desc')} className={cx('px-2 py-1 rounded border', sortKey === 'total_desc' && 'bg-slate-800 text-white')}>High→Low</button>
                    <button onClick={() => setSortKey('total_asc')} className={cx('px-2 py-1 rounded border', sortKey === 'total_asc' && 'bg-slate-800 text-white')}>Low→High</button>
                    <button onClick={() => setSortKey('room_asc')} className={cx('px-2 py-1 rounded border', sortKey === 'room_asc' && 'bg-slate-800 text-white')}>Room A→Z</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {refinedRefurbs.map((r) => (
                    <RefurbCard key={r.id} r={r} />
                  ))}
                </div>

                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">Total (rooms detected)</div>
                  <div className="font-semibold">{money0(sumV2Totals(refurbs))}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* EPC & Services */}
          {status === 'completed' && data && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-slate-400" /> EPC & Services</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EpcKV label="Current Rating" value={`${prop?.epc_rating_current ?? '—'} (${prop?.epc_score_current ?? '—'})`} />
                  <EpcKV label="Potential Rating" value={`${prop?.epc_rating_potential ?? '—'} (${prop?.epc_score_potential ?? '—'})`} />
                  <EpcKV label="Heating" value={prop?.main_heat || '—'} />
                  <EpcKV label="Hot Water" value={prop?.hot_water || '—'} />
                  <EpcKV label="Windows" value={prop?.windows || '—'} />
                  <EpcKV label="Low-energy lighting" value={prop?.services?.low_energy_lighting_pct != null ? `${prop.services.low_energy_lighting_pct}%` : '—'} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BadgeInfo className="h-5 w-5 text-slate-400" /> Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    This is an investor-focused snapshot generated from the listing, photos and public records. Figures are
                    indicative; always seek quotes and legal advice before purchase. Use the Scenario Studio to see how
                    assumptions affect returns.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Media */}
          {status === 'completed' && data && prop?.listing_images?.length ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-slate-400" /> Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {prop.listing_images.map((src: string, i: number) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`photo-${i + 1}`} className="h-36 w-full object-cover transition group-hover:scale-105" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Debug / raw links */}
          {status === 'completed' && data && (
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {prop?.listing_url && (
                <Link href={prop.listing_url} target="_blank" className="inline-flex items-center gap-1 underline">
                  View original listing <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
              {data?.run?.id && <span>Run id: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{data.run.id}</code></span>}
              <span>Elapsed: {Math.floor(elapsedMs / 1000 / 60)}m {Math.floor((elapsedMs / 1000) % 60)}s</span>
            </div>
          )}

          {/* Empty state */}
          {status === 'idle' && (
            <Card className="mt-6">
              <CardContent className="py-12 text-center space-y-3">
                <p className="text-lg font-medium">Paste a URL and click Analyze to generate an investor snapshot.</p>
                <p className="text-slate-600">Or toggle "Use demo run" and load the prefilled UUID to explore the UI.</p>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {error && (
            <Card className="mt-6 border-rose-200 bg-rose-50">
              <CardContent className="pt-6 text-rose-800">{error}</CardContent>
            </Card>
          )}
        </div>
      </main>
    </TooltipProvider>
  );
}

/* --------------------------- Small UI helpers --------------------------- */
function Stat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-slate-600 flex items-center gap-2">{icon}{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function SliderBlock({ label, value, onChange, prefix, suffix, min = 80, max = 120, step = 1, help }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">{label}</div>
        <div className="text-sm text-slate-700">{value}%</div>
      </div>
      <Slider className="mt-3" min={min} max={max} step={step} value={[value]} onValueChange={(v) => onChange(v[0])} />
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{prefix}</span>
        <span>{suffix}</span>
      </div>
      {help && <div className="mt-2 text-xs text-slate-500">{help}</div>}
    </div>
  );
}

function KpiPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="font-medium">{title}</div>
      </div>
      {subtitle && <div className="text-xs text-slate-500 mb-3">{subtitle}</div>}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function KpiRow({ label, value, tone = 'info' }: { label: string; value: string | number; tone?: 'ok' | 'bad' | 'info' }) {
  const toneCls = tone === 'ok' ? 'text-emerald-700' : tone === 'bad' ? 'text-rose-700' : 'text-slate-800';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={cx('font-medium', toneCls)}>{value}</span>
    </div>
  );
}

function RefurbCard({ r }: { r: RefurbRoomV2 }) {
  const total = roomV2Total(r);
  const rt = (r.detected_room_type || r.room_type || 'Room') as string;
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {r.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.image_url} alt={rt} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-slate-100 flex items-center justify-center text-slate-400">No image</div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">{rt}</div>
          <div className="text-sm font-semibold">{money0(total)}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border p-2 bg-slate-50">
            <div className="text-slate-600">Materials</div>
            <div className="font-medium">{money0(r.materials_total_with_vat_gbp ?? r.materials_total_gbp)}</div>
          </div>
          <div className="rounded border p-2 bg-slate-50">
            <div className="text-slate-600">Labour</div>
            <div className="font-medium">{money0(r.labour_total_gbp)}</div>
          </div>
        </div>

        {/* Detail dialog */}
        {(r.materials?.length || r.labour?.length) ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="w-full mt-1">View line items</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{rt} — Line Items</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-auto pr-2">
                {r.materials?.length ? (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Materials</div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {r.materials.map((m: any, i: number) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span className="truncate">{m.item_key}</span>
                          <span>{money0(m.gross_gbp ?? m.subtotal_gbp ?? m.net_gbp)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {r.labour?.length ? (
                  <div>
                    <div className="text-sm font-medium mb-2">Labour</div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {r.labour.map((l: any, i: number) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span className="truncate">{l.trade_name}</span>
                          <span>{money0(l.labour_cost_gbp)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
    </div>
  );
}

function EpcKV({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border p-3 bg-white">
      <div className="text-xs text-slate-600">{label}</div>
      <div className="font-medium mt-1">{value}</div>
    </div>
  );
}

/* --------------------------- Scenario panels --------------------------- */
function PeriodPanel({ prop, fin }: { prop: any; fin: any }) {
  const p = prop?.summary?.period ?? fin?.summary?.period ?? {};
  const pn = prop?.scenarios?.period_no_refi ?? fin?.scenarios?.period_no_refi ?? {};
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-medium mb-2">Timeline</div>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>Months on bridge: <strong>{p?.months_on_bridge ?? '—'}</strong></li>
          <li>Refurb months: <strong>{p?.months_refurb ?? '—'}</strong></li>
          <li>Months rented during bridge: <strong>{p?.months_rented ?? pn?.operations_during_bridge?.months_rented ?? '—'}</strong></li>
        </ul>
        <Separator className="my-3" />
        <div className="text-sm font-medium mb-2">Cash In</div>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>Total cash in (period): <strong>{money0(p?.total_cash_in_gbp ?? pn?.total_cash_in_gbp)}</strong></li>
          <li>Deposit: <strong>{money0(pn?.bridge?.deposit_gbp)}</strong></li>
          <li>Works phase (ins/utility/contingency): <strong>{money0((pn?.works_phase?.insurance_gbp ?? 0) + (pn?.works_phase?.utilities_gbp ?? 0) + (pn?.works_phase?.contingency_gbp ?? 0))}</strong></li>
        </ul>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-medium mb-2">Cashflow</div>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>Rent collected during bridge: <strong>{money0(p?.rent_collected_gbp ?? pn?.operations_during_bridge?.rent_collected_gbp)}</strong></li>
          <li>Opex during bridge: <strong>{money0(pn?.operations_during_bridge?.opex_gbp?.total_opex)}</strong></li>
          <li>Bridge interest (total): <strong>{money0(pn?.bridge?.interest_gbp?.total)}</strong></li>
          <li>Period cashflow: <strong>{money0(p?.period_cashflow_gbp)}</strong></li>
        </ul>
        <Separator className="my-3" />
        <div className="text-sm font-medium mb-2">Yield / ROI</div>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>Yield on cost (stabilised): <strong>{p?.yield_on_cost_percent != null ? `${Number(p.yield_on_cost_percent).toFixed(2)}%` : '—'}</strong></li>
          <li>ROI (period): <strong>{p?.roi_period_percent != null ? `${Number(p.roi_period_percent).toFixed(2)}%` : '—'}</strong></li>
          <li>ROI (annualised): <strong>{p?.roi_annualised_percent != null ? `${Number(p.roi_annualised_percent).toFixed(2)}%` : '—'}</strong></li>
        </ul>
      </div>
    </div>
  );
}

function SellPanel({ prop, fin }: { prop: any; fin: any }) {
  const s = prop?.summary?.exit_sell ?? fin?.summary?.exit_sell ?? {};
  const se = prop?.scenarios?.exit_sell ?? fin?.scenarios?.exit_sell ?? {};
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-medium mb-2">Sale Basics</div>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>Assumed sale price: <strong>{money0(s?.sale_price_gbp ?? se?.sale_price_gbp)}</strong></li>
          <li>Agent fee %: <strong>{se?.agent_fee_pct != null ? `${(Number(se.agent_fee_pct) * 100).toFixed(2)}%` : '—'}</strong></li>
          <li>Legal fees: <strong>{money0(se?.legal_fees_gbp)}</strong></li>
          <li>Selling costs (total): <strong>{money0(s?.selling_costs_gbp ?? se?.selling_costs_gbp)}</strong></li>
        </ul>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-medium mb-2">Outcomes</div>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>Repay bridge: <strong>{money0(s?.repay_bridge_gbp ?? se?.repay_bridge_gbp)}</strong></li>
          <li>Net profit: <strong>{money0(s?.net_profit_gbp ?? se?.net_profit_gbp)}</strong></li>
          <li>ROI: <strong>{s?.roi_percent != null ? `${Number(s.roi_percent).toFixed(2)}%` : (se?.roi_percent != null ? `${Number(se.roi_percent).toFixed(2)}%` : '—')}</strong></li>
        </ul>
      </div>
    </div>
  );
}

function RefiPanel({ prop, fin }: { prop: any; fin: any }) {
  const r = prop?.summary?.exit_refi_24m ?? fin?.summary?.exit_refi_24m ?? {};
  const re = prop?.scenarios?.exit_refi_24m ?? fin?.scenarios?.exit_refi_24m ?? {};
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-medium mb-2">BTL Terms</div>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>Refi value: <strong>{money0(r?.refi_value_gbp ?? re?.refi_value_gbp)}</strong></li>
          <li>LTV: <strong>{re?.ltv != null ? `${(Number(re.ltv) * 100).toFixed(0)}%` : '—'}</strong></li>
          <li>Rate: <strong>{re?.rate_annual != null ? `${(Number(re.rate_annual) * 100).toFixed(2)}%` : '—'}</strong></li>
          <li>Final BTL loan: <strong>{money0(r?.final_btl_loan_gbp ?? re?.final_btl_loan_gbp)}</strong></li>
          <li>Product fee: <strong>{money0(re?.product_fee_gbp)}</strong> {re?.product_fee_added_to_loan ? '(added to loan)' : ''}</li>
        </ul>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-medium mb-2">Affordability & Cash</div>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>DSCR (Month 1): <strong>{r?.dscr_month1 != null ? Number(r.dscr_month1).toFixed(2) : '—'}</strong></li>
          <li>Cash from refi (after repay): <strong>{money0(r?.cash_from_refi_after_repay_gbp ?? re?.cash_from_refi_after_repay_gbp)}</strong></li>
          <li>Net cash left in: <strong>{money0(r?.net_cash_left_in_after_refi_gbp ?? re?.net_cash_left_in_after_refi_gbp)}</strong></li>
          <li>24m rent: <strong>{money0(r?.rent_24m_gbp ?? re?.totals_24m?.rent_gbp)}</strong></li>
          <li>24m opex: <strong>{money0(r?.opex_24m_gbp ?? re?.totals_24m?.opex_gbp)}</strong></li>
          <li>24m mortgage interest: <strong>{money0(r?.mortgage_interest_24m_gbp ?? re?.totals_24m?.mortgage_interest_gbp)}</strong></li>
          <li>24m net cashflow: <strong>{money0(r?.net_cashflow_24m_gbp ?? re?.totals_24m?.net_cashflow_gbp)}</strong></li>
        </ul>
      </div>
    </div>
  );
}
