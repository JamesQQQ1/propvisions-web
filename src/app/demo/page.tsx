// src/app/demo/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

import { pollUntilDone, type RunStatus, startAnalyze, POLL_BUILD } from '@/lib/api';
import RoomCard from '@/components/RoomCard';
import FloatingChatButton from '@/components/FloatingChatButton';
import MissingRoomRequestsCard, { useMissingRoomRequests, type PendingUpload } from '@/components/MissingRoomRequestsCard';
import type { RefurbRoom } from '@/types/refurb';
import type { UiRoom } from '@/lib/rooms';
import { buildUiRooms, safeLower, normalizeLabel, formatCurrency } from '@/lib/rooms';
import PDFViewer from '@/components/PDFViewer';
import FinancialSliders, {
  type Derived as SliderDerived,
  type Assumptions as SliderAssumptions,
} from '@/components/FinancialSliders';
import InvestorDashboard from '@/components/InvestorDashboard';

/* ---------- Tooltip component ---------- */
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <span className="group relative inline-block cursor-help">
      {children}
      <span className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-2 text-xs text-white bg-slate-800 dark:bg-slate-700 rounded-lg shadow-lg -left-24 top-full">
        {text}
      </span>
    </span>
  );
}

/* ---------- Professional Image Gallery with Carousel ---------- */
function ImageGallery({ isOpen, onClose, images, title, startIndex = 0 }: { isOpen: boolean; onClose: () => void; images: string[]; title: string; startIndex?: number }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
    }
  }, [isOpen, startIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen || images.length === 0) return null;

  const goToPrevious = () => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  const goToNext = () => setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute inset-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-md border-b border-white/10">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/70">{currentIndex + 1} / {images.length}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close gallery"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Image */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[currentIndex]}
            alt={`${title} ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="p-4 bg-black/50 backdrop-blur-md border-t border-white/10">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={classNames(
                    'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                    i === currentIndex
                      ? 'border-blue-500 ring-2 ring-blue-500/50 scale-105'
                      : 'border-white/20 hover:border-white/40'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- demo mode config (REQUIRED) ---------- */
const DEFAULT_DEMO_RUN_ID = '04faa6d2-6111-4ab5-a374-457d0a8fc4fb';
console.debug('[demo-page] POLL_BUILD =', POLL_BUILD);

/* ---------- branding ---------- */
const LOGO_SRC = '/propvisions_logo.png';

/* ---------- number/format helpers ---------- */
const nfGBP0 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const nfGBP2 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const isFiniteNum = (n: unknown) => Number.isFinite(Number(n));
const n  = (x: unknown) => (isFiniteNum(x) ? Number(x) : undefined);
const nz = (x: unknown) => (isFiniteNum(x) ? Number(x) : 0);

const money0 = (x?: unknown) => (x == null || x === '' ? '—' : nfGBP0.format(Number(x)));
const money2 = (x?: unknown) => (x == null || x === '' ? '—' : nfGBP2.format(Number(x)));

const classNames = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const titleize = (k: string | null | undefined) => {
  if (!k || typeof k !== 'string') return '';
  return k.replace(/_/g, ' ').replace(/\b([a-z])/g, (m) => m.toUpperCase());
};

const tryParseJSON = (v: unknown) => {
  if (typeof v === 'string' && v.trim().length && /^[\[{]/.test(v.trim())) {
    try { return JSON.parse(v); } catch { /* ignore */ }
  }
  return v;
};
const isPlainObject = (x: any) => x && typeof x === 'object' && !Array.isArray(x);

/* ---------- price pick ---------- */
const pickPrice = (p: any): number =>
  Number(p?.purchase_price_gbp ?? 0) ||
  Number(p?.guide_price_gbp ?? 0) ||
  Number(p?.asking_price_gbp ?? 0) ||
  Number(p?.display_price_gbp ?? 0) ||
  0;

/* ---------- refurbishment totals helpers ---------- */
function toInt(v: unknown) {
  const x = Math.round(Number(v ?? 0));
  return Number.isFinite(x) && x > 0 ? x : 0;
}
function roomV2Total(r: RefurbRoom): number {
  return toInt((r as any).room_total_with_vat_gbp) || toInt((r as any).room_total_gbp);
}
function sumV2Totals(rows?: RefurbRoom[] | null) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((acc, r) => acc + roomV2Total(r), 0);
}
/** Pulls rollups from property.room_totals when available, else falls back to v2 sums */
function computeRefurbRollup(property: any, refurb_estimates: RefurbRoom[] | undefined | null) {
  const rows = Array.isArray(property?.room_totals) ? property.room_totals : [];
  const byType = (t: string) => rows.find((r: any) => r.type === t);

  const epc = byType('epc_totals');
  const rooms = byType('rooms_totals');
  const overheads = byType('overheads_totals'); // Use type='overheads_totals' instead of searching room_name
  const propertySum = rows.find((r: any) => 'property_total_with_vat' in r || 'property_total_without_vat' in r);

  const result: {
    rooms_total_with_vat?: number;
    rooms_total_without_vat?: number;
    epc_total_with_vat?: number;
    epc_total_without_vat?: number;
    overheads_with_vat?: number;
    overheads_without_vat?: number;
    property_total_with_vat?: number;
    property_total_without_vat?: number;
    v2_total_with_vat_fallback?: number;
  } = {
    rooms_total_with_vat: n(rooms?.rooms_total_with_vat) ?? undefined,
    rooms_total_without_vat: n(rooms?.rooms_total_without_vat) ?? undefined,
    epc_total_with_vat: n(epc?.epc_total_with_vat) ?? undefined,
    epc_total_without_vat: n(epc?.epc_total_without_vat) ?? undefined,
    overheads_with_vat: n(overheads?.overheads_total_with_vat) ?? undefined,
    overheads_without_vat: n(overheads?.overheads_total_without_vat) ?? undefined,
    property_total_with_vat:
      n(propertySum?.property_total_with_vat) ??
      n(property?.property_total_with_vat) ??
      n(property?.refurb_total_with_vat_gbp) ??
      undefined,
    property_total_without_vat:
      n(propertySum?.property_total_without_vat) ??
      n(property?.property_total_without_vat) ??
      n(property?.refurb_total_without_vat_gbp) ??
      undefined,
    v2_total_with_vat_fallback: sumV2Totals(refurb_estimates),
  };

  if (!result.rooms_total_with_vat && result.v2_total_with_vat_fallback) {
    result.rooms_total_with_vat = result.v2_total_with_vat_fallback;
  }

  return result;
}

/* ---------- room grouping: constants & canonical helpers (STRICT) ---------- */
// infer a room type from a free-text label (used when backend says type: "room")
function inferTypeFromLabel(lbl?: string | null) {
  const s = safeLower(lbl);
  if (!s) return null;
  if (s.includes('kitchen')) return 'kitchen';
  if (s.includes('bed')) return 'bedroom';
  if (s.includes('bath') || s.includes('toilet') || s.includes('ensuite') || s.includes('en-suite')) return 'bathroom';
  if (s.includes('reception') || s.includes('lounge') || s.includes('living')) return 'living_room';
  if (s.includes('hall') || s.includes('landing') || s.includes('stairs')) return 'hall';
  if (s.includes('utility')) return 'utility';
  if (s.includes('garage')) return 'garage';
  if (s.includes('garden') || s.includes('facade') || s.includes('exterior') || s.includes('outside') || s.includes('front') || s.includes('rear')) return 'facade';
  return null;
}

// true when the label is basically just the type name (e.g., label "Bedroom" with type "bedroom")
// -> smells like a per-type rollup rather than a specific mapped room
function isTypeLabelOnly(type: string, label?: string | null) {
  const t = safeLower(type).trim();
  const l = safeLower(label).trim();
  if (!t || !l) return false;
  const canon = (x: string) => x.replace(/_/g, ' ').replace(/\s+/g, ' ').replace(/s\b/, '').trim();
  return canon(l) === canon(t);
}


// When true, only render rooms that are mapped to the floorplan (label or id).
const SHOW_ONLY_FLOORPLAN_MAPPED = true;

// Any of these should never become a “room card”.
const UNWANTED_TYPES = new Set([
  'rooms_totals', 'epc_totals', 'epc', 'overheads', 'whole-house', 'whole_house', 'wholehouse', 'property_totals',
  'unmapped'
]);


// Exterior types - keep separate, don't merge
const EXTERIOR_TYPES = new Set(['facade', 'exterior', 'garden', 'front', 'rear', 'outside', 'roof']);

// Robust detection of totals/overheads/epc rows
function isOverheadsOrTotalsRow(t: any) {
  const type = safeLower(String(t?.type ?? t?.room_type ?? ''));
  const name = safeLower(String(t?.room_name ?? t?.label ?? ''));
  if (UNWANTED_TYPES.has(type)) return true;
  if (name.includes('overhead') || name.includes('whole-house') || name.includes('whole house')) return true;
  return false;
}

// Did the backend tie this row to a specific floorplan room?
//  - TRUE if we have a numeric/id index
//  - TRUE if label exists and is NOT just the type name (e.g., "Bedroom 2" or "Sitting Room")
//  - FALSE for type-only rollups like "Bedroom" or "Kitchen"
function isFloorplanMapped(row: any, typeHint?: string) {
  const id = row?.floorplan_room_id ?? row?.room_index ?? row?.index ?? null;
  if (id !== null && id !== undefined && `${id}` !== '') return true;

  const label = extractLabelFromAny(row);
  const type  = normaliseType(row?.type ?? row?.room_type ?? typeHint ?? 'other');

  if (!label || !label.toString().trim()) return false;

  // If the label is basically the type name ("Bedroom", "Kitchen"), treat as UNMAPPED.
  return !isTypeLabelOnly(type, label);
}


// Normalise a room "type" to canonical tokens
// Note: Keep exterior types (facade, garden, roof, etc.) distinct - do NOT merge them
function normaliseType(x?: string | null) {
  if (!x || typeof x !== 'string') return 'other';
  const raw = safeLower(x).trim();
  const map: Record<string, string> = {
    lounge: 'living_room', reception: 'living_room', receptions: 'living_room', living: 'living_room', 'living room': 'living_room',
    wc: 'bathroom', cloakroom: 'bathroom', ensuite: 'bathroom', 'en-suite': 'bathroom', bath: 'bathroom',
    beds: 'bedroom', bed: 'bedroom', 'bed room': 'bedroom',
    hallway: 'hall', landing: 'hall', corridor: 'hall', stair: 'hall', stairs: 'hall',
    // Keep exterior types distinct
    outside: 'exterior',
  };
  if (map[raw]) return map[raw];
  const t = raw.replace(/\s+/g, '_');
  if (t.includes('bed')) return 'bedroom';
  if (t.includes('kitchen')) return 'kitchen';
  if (t.includes('bath') || t.includes('toilet') || t.includes('ensuite') || t.includes('en-suite')) return 'bathroom';
  if (t.includes('reception') || t.includes('lounge') || t.includes('living')) return 'living_room';
  if (t.includes('hall') || t.includes('landing') || t.includes('stairs')) return 'hall';
  if (t.includes('utility')) return 'utility';
  if (t.includes('store') || t.includes('cupboard')) return 'store';
  if (t.includes('garage')) return 'garage';
  // Keep exterior types distinct - don't merge
  if (t.includes('roof')) return 'roof';
  if (t.includes('garden')) return 'garden';
  if (t.includes('facade')) return 'facade';
  if (t === '(unmapped)' || t === 'unmapped') return 'unmapped';
  return t;
}

function extractLabelFromAny(estOrTot: any): string | null {
  return (
    estOrTot?.floorplan_room_label ||
    estOrTot?.room_label ||
    estOrTot?.room_name ||
    estOrTot?.label ||
    null
  );
}

function extractIndexFromAny(estOrTot: any): number | null {
  const idxRaw =
    estOrTot?.floorplan_room_id ??
    estOrTot?.room_index ??
    estOrTot?.index ??
    estOrTot?.order ??
    null;

  // Treat null/undefined/'' as *no index*, not 0.
  if (idxRaw === null || idxRaw === undefined || idxRaw === '') return null;

  const n = Number(idxRaw);
  return Number.isFinite(n) ? n : null;
}

// Prefer floorplan id → else label → else index; include type
function canonicalMatchKey(payload: any, fallbackType?: string) {
  const labelRaw = extractLabelFromAny(payload);
  const typeRaw = payload?.type ?? payload?.room_type ?? fallbackType ?? 'other';

  // Start from backend type
  let t = normaliseType(typeRaw);

  // If backend said "room" or "other", try to infer from the label
  if (t === 'room' || t === 'other') {
    const inferred = inferTypeFromLabel(labelRaw || undefined);
    if (inferred) t = inferred;
  }

  const id = extractIndexFromAny(payload);     // floorplan_room_id if present
  const lbl = safeLower(labelRaw?.toString()).trim();
  if (id != null) return `${t}::id:${id}`;
  if (lbl)       return `${t}::label:${lbl}`;
  return `${t}::`; // generic (later suppressed when labelled/id’d rooms exist)
}


function prettyRoomNameFromKey(key: string) {
  const [t, rest] = key.split('::');
  const title = t.replace(/_/g, ' ').replace(/\b([a-z])/g, (m) => m.toUpperCase());
  if (!rest) return title;
  if (rest.startsWith('label:')) {
    const label = rest.slice('label:'.length).replace(/_/g, ' ');
    const labelPretty = label.replace(/\b([a-z])/g, (m) => m.toUpperCase());
    if (safeLower(labelPretty).startsWith(safeLower(title))) return labelPretty;
    return `${title} — ${labelPretty}`;
  }
  if (rest.startsWith('id:')) return `${title} ${rest.slice('id:'.length)}`;
  return title;
}

function collectImages(est: any): string[] {
  const imgs: string[] = [];
  if (est?.image_url) imgs.push(est.image_url);
  if (Array.isArray(est?.image_urls)) imgs.push(...est.image_urls.filter(Boolean));
  if (Array.isArray(est?.images)) imgs.push(...est.images.filter(Boolean));
  if (Array.isArray(est?.floorplan_image_urls)) imgs.push(...est.floorplan_image_urls.filter(Boolean));
  return Array.from(new Set(imgs.filter(Boolean)));
}

function readTotalWithVat(t: any) {
  return (
    toInt(t?.room_total_with_vat_gbp) ||
    toInt(t?.room_total_with_vat) ||
    toInt(t?.total_with_vat) ||
    toInt(t?.total_gbp) ||
    toInt(t?.total)
  );
}


/* ---------- UI micro components ---------- */
function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'green' | 'red' | 'amber' | 'slate' | 'blue' }) {
  const m: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 ring-green-200/60 dark:ring-green-800/60 shadow-sm',
    red: 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 ring-red-200/60 dark:ring-red-800/60 shadow-sm',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 ring-amber-200/60 dark:ring-amber-800/60 shadow-sm',
    slate: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 ring-blue-200/60 dark:ring-blue-800/60 shadow-sm',
  };
  return <span className={classNames('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1', m[tone])}>{children}</span>;
}
function KPI({
  label, value, subtitle, tone, big = true,
}: { label: React.ReactNode; value: React.ReactNode; subtitle?: React.ReactNode; tone?: 'green'|'red'|'amber'|'slate'|'blue'; big?: boolean; }) {
  return (
    <div className="group rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-5 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 shadow-lg hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 leading-tight">{label}</div>
        {tone && <Badge tone={tone}>{tone.toUpperCase()}</Badge>}
      </div>
      <div className={classNames('font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-none mb-1', big ? 'text-4xl' : 'text-2xl')}>{value}</div>
      {subtitle && <div className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{subtitle}</div>}
    </div>
  );
}
function Section({ title, children, right, desc }: { title: string; children: React.ReactNode; right?: React.ReactNode; desc?: string }) {
  return (
    <section className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-start md:items-center justify-between mb-6 pb-6 border-b-2 border-slate-100 dark:border-slate-800">
        <div className="flex-1">
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-2 tracking-tight leading-tight">{title}</h3>
          {desc && <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl font-medium">{desc}</p>}
        </div>
        {right && <div className="ml-4">{right}</div>}
      </div>
      {children}
    </section>
  );
}
/** Minimal bar chart (SVG) for 24m summary */
function MiniBars({ items }: { items: { label: string; value: number; fmt?: 'money'|'raw' }[] }) {
  const max = Math.max(1, ...items.map(i => Math.abs(i.value)));
  return (
    <div className="space-y-1">
      {items.map((it, i) => {
        const width = Math.round((Math.abs(it.value) / max) * 100);
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="w-28 text-xs text-slate-600 dark:text-slate-400">{it.label}</div>
            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded">
              <div className="h-3 rounded bg-blue-500 dark:bg-blue-400" style={{ width: `${width}%` }} />
            </div>
            <div className="w-24 text-right text-xs tabular-nums text-slate-900 dark:text-slate-100">
              {it.fmt === 'money' ? money0(it.value) : it.value.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- status & progress ---------- */
function StatusBadge({ status }: { status?: RunStatus | 'idle' }) {
  const color =
    status === 'completed'
      ? 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
      : status === 'failed'
      ? 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
      : status === 'queued' || status === 'processing'
      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  return <span className={classNames('inline-block px-2 py-0.5 text-xs rounded border', color)}>{status || 'idle'}</span>;
}
function ProgressBar({ percent, show }: { percent: number; show: boolean }) {
  return (
    <div className={classNames('mt-3 w-full', !show && 'hidden')} aria-hidden={!show}>
      <div className="h-2 w-full bg-slate-200/70 dark:bg-slate-700/70 rounded overflow-hidden">
        <div className="h-2 bg-blue-600 dark:bg-blue-500 transition-[width] duration-300 ease-out will-change-[width]" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}

// Placeholder used when a room has costs but no photos (module-scope so Carousel can use it)
const NO_IMAGE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f1f5f9;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <g transform="translate(320,210)">
      <circle cx="0" cy="-30" r="24" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M-12,-38 L-12,-30 L-6,-24 L6,-30 L12,-30 L12,-38 Z" fill="#94a3b8"/>
      <circle cx="-6" cy="-33" r="3" fill="#64748b"/>
      <text x="0" y="15" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="500" fill="#64748b" text-anchor="middle">No image available</text>
      <text x="0" y="35" font-family="system-ui,-apple-system,sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">Costs estimated from room analysis</text>
    </g>
    <rect x="1" y="1" width="638" height="418" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="8,4"/>
  </svg>`);




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
    if (qRun) { setUseDemo(true); setDemoRunId(qRun); }
  }, []);

  // Sliders
  const [slDerived, setSlDerived] = useState<SliderDerived | null>(null);
  const [slAssumptions, setSlAssumptions] = useState<SliderAssumptions | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>('All');
  const [sortKey, setSortKey] = useState<'total_desc' | 'total_asc' | 'room_asc' | 'room_order'>('room_order');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  // Modals
  const [epcModalOpen, setEpcModalOpen] = useState(false);
  const [floorplanModalOpen, setFloorplanModalOpen] = useState(false);
  const [listingGalleryOpen, setListingGalleryOpen] = useState(false);
  const [listingGalleryStartIndex, setListingGalleryStartIndex] = useState(0);

  /* ---------- New Helpers ---------- */
  function normName(s?: string | null): string {
    if (!s || typeof s !== 'string') return '';
    let norm = safeLower(s).trim().replace(/\s+/g, '_').replace(/[^\w_]/g, '');

    const synonyms: Record<string, string> = {
      'sitting_room': 'living_room',
      'lounge': 'living_room',
      'living_room': 'living_room',
      'hall': 'hallway',
      'hallway': 'hallway',
      'wc': 'bathroom',
      'toilet': 'bathroom',
      'cloakroom': 'bathroom',
      'facade': 'facade_exterior',
      'facade_exterior': 'facade_exterior',
      'front_exterior': 'facade_exterior'
    };

    return synonyms[norm] || norm;
  }

  function extractIndex(label?: string | null): number | null {
    if (!label) return null;
    const match = label.match(/\b(?:bed(?:room)?|br)\s*(\d+)\b/i);
    return match ? parseInt(match[1], 10) : null;
  }

  function logicalKey(type?: string | null, name?: string | null): string {
    return `${normName(type || name || '')}::${safeLower(name)}`;
  }

  function dedupeUrls(urls: string[]): string[] {
    const seen = new Set<string>();
    return urls.filter(url => {
      if (!url) return false;
      const norm = safeLower(url).trim().replace(/\/+$/, '');
      if (seen.has(norm)) return false;
      seen.add(norm);
      return true;
    });
  }

  // Run state
  const runIdRef = useRef<string | null>(null);
  const execIdRef = useRef<string | null>(null);
  const running = status === 'queued' || status === 'processing';
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const submittingRef = useRef(false);

  /* logout */
  async function handleLogout() {
    try { await fetch('/api/demo-logout', { method: 'POST' }); } catch {}
    window.location.href = '/demo-access?next=/demo';
  }

  /* Load a run (DEMO) */
  async function loadDemoRun(theRunIdRaw: string) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const theRunId = (theRunIdRaw || '').trim();
      setShowDebug(false); setError(undefined); setData(null);
      setSlDerived(null); setSlAssumptions(null);
      setFilterType('All'); setSortKey('room_order'); setMinConfidence(0);

      if (!theRunId) { setStatus('failed'); setError('No demo run_id provided.'); return; }
      abortRef.current?.abort();

      setStatus('queued'); setProgress((p) => (p < 6 ? 6 : p));
      runIdRef.current = theRunId; execIdRef.current = null;

      const controller = new AbortController();
      abortRef.current = controller;

      const result: any = await pollUntilDone(theRunId, {
        intervalMs: 1500,
        timeoutMs: 0,
        onTick: (s) => setStatus(s),
        signal: controller.signal,
      });

      setStatus('completed'); setProgress(100);
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
      setTimeout(() => { submittingRef.current = false; }, 300);
    }
  }

  /* kickoff */
  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setShowDebug(false); setError(undefined); setData(null);
      setSlDerived(null); setSlAssumptions(null);
      setFilterType('All'); setSortKey('room_order'); setMinConfidence(0);

      if (useDemo) { await loadDemoRun(demoRunId); return; }

      if (usage && usage.remaining === 0) { setStatus('failed'); setError('Daily demo limit reached.'); return; }

      setStatus('queued'); setProgress((p) => (p < 6 ? 6 : p));

      let kickoff: { run_id: string; execution_id?: string; usage?: any };
      try { kickoff = await startAnalyze(url); }
      catch (err: any) {
        setStatus('failed'); setError(err?.message || 'Failed to start analysis');
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

        setStatus('completed'); setProgress(100);
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
      } finally { abortRef.current = null; }
    } finally {
      setTimeout(() => { submittingRef.current = false; }, 300);
    }
  }

  async function handleCancel() {
    const run_id = runIdRef.current;
    const execution_id = execIdRef.current;
    try {
      await fetch('/api/run/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ run_id, execution_id }) });
    } catch {}
    abortRef.current?.abort(); abortRef.current = null;
    setStatus('failed');
    setError(execution_id ? 'Stop requested.' : 'Stopped locally (no execution id).');
  }

  /* progress */
  const [progress, setProgress] = useState(0);
  const progressTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const RAMP_MS = 100 * 60 * 1000;
  const MAX_DURING_RUN = 97;

  useEffect(() => {
    if (!running) { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; return; }
    startedAtRef.current = Date.now(); setElapsedMs(0);
    timerRef.current = setInterval(() => { if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current); }, 250);
    return () => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; };
  }, [running]);

  useEffect(() => {
    if (!running) { if (progressTickRef.current) clearInterval(progressTickRef.current); progressTickRef.current = null; return; }
    setProgress((p) => (p < 6 ? 6 : p));
    progressTickRef.current = setInterval(() => {
      if (!startedAtRef.current) return;
      const elapsed = Date.now() - startedAtRef.current;
      const target = Math.min(MAX_DURING_RUN, (elapsed / RAMP_MS) * MAX_DURING_RUN);
      setProgress((p) => (p < target ? p + Math.min(0.8, target - p) : p));
    }, 300);
    return () => { if (progressTickRef.current) clearInterval(progressTickRef.current); progressTickRef.current = null; };
  }, [running]);

  useEffect(() => {
    if (status === 'completed') setProgress(100);
    else if ((status === 'failed' || status === 'idle') && !running) setProgress(0);
  }, [status, running]);

  /* derived */
  const basePrice  = useMemo(() => pickPrice(data?.property), [data?.property]);
  const baseRent   = useMemo(() => Number((data?.financials as any)?.monthly_rent_gbp ?? 0) || 0, [data?.financials]);
  const baseRefurb = useMemo(() => sumV2Totals(data?.refurb_estimates), [data?.refurb_estimates]);
  const rollup     = useMemo(() => computeRefurbRollup(data?.property, data?.refurb_estimates), [data?.property, data?.refurb_estimates]);

  // New refurb data processing using properties-only approach with robust joins
  const uiRooms = useMemo(() => {
    if (!data?.property) return [];
    return buildUiRooms(data.property);
  }, [data?.property]);

  const hasRefurbData = uiRooms.length > 0;

  // Missing room requests (realtime)
  const { requests: missingRoomRequests } = useMissingRoomRequests(data?.property_id || '');

  // Map missing room requests to tiles
  const roomUploadsMap = useMemo(() => {
    const map = new Map<string, PendingUpload[]>();

    missingRoomRequests.forEach((req) => {
      // Priority matching as per spec:
      // 1. fingerprint_key exact match (if available)
      // 2. room_type + room_index match
      // 3. Normalized room_label + floor match
      // 4. Route fallback

      const matchingRoom = uiRooms.find(room => {
        // 1. fingerprint_key exact match
        if (req.fingerprint_key && room.room_name === req.fingerprint_key) {
          return true;
        }

        // 2. room_type + room_index match (construct key like "bedroom::id:2")
        if (req.room_type && req.room_index != null) {
          const typeKey = `${normaliseType(req.room_type)}::id:${req.room_index}`;
          if (room.room_name === typeKey) {
            return true;
          }
        }

        // 3. Normalized room_label + floor match (key like "bedroom::label:master bedroom")
        if (req.room_label) {
          const normLabel = safeLower(req.room_label).trim();
          const labelKey = `${normaliseType(req.room_type || 'room')}::label:${normLabel}`;
          if (room.room_name === labelKey) {
            return true;
          }

          // Also try matching by display_name for rooms that might not have exact key match
          const roomDisplayNorm = safeLower(room.display_name).trim();
          if (normLabel === roomDisplayNorm) {
            // Check floor match if specified
            if (req.floor) {
              return safeLower(room.floor).trim() === safeLower(req.floor).trim();
            }
            return true;
          }
        }

        // 4. Route fallback
        if (req.route && room.room_name === req.route) {
          return true;
        }

        return false;
      });

      if (matchingRoom && matchingRoom.room_name) {
        const existing = map.get(matchingRoom.room_name) || [];
        map.set(matchingRoom.room_name, [...existing, req]);
      }
    });

    return map;
  }, [missingRoomRequests, uiRooms]);

  const epc = data?.property ? {
    current: data.property.epc_rating_current ?? data.property.epc_rating ?? null,
    potential: data.property.epc_rating_potential ?? null,
    score_current: n(data.property.epc_score_current),
    score_potential: n(data.property.epc_score_potential),
  } : null;

  const services   = data?.property?.services || {};
  const efficiency = data?.property?.efficiency || {};
  const dims       = data?.property?.dimensions || {};

  const backendSummary = (data?.financials as any)?.summary || (data?.property as any)?.summary || null;
  const period   = backendSummary?.period || null;

  /* ---------- media helpers (floorplans + EPC) ---------- */
  const floorplans: string[] = useMemo(() => {
    const p = data?.property || {};
    const arr = p.floorplan_urls || p.floorplan_images || p.floorplan_image_urls || p.floorplans || [];
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  }, [data?.property]);

  const epcImages: string[] = useMemo(() => {
    const p = data?.property || {};
    // Support both plural (epc_image_urls) and singular (epc_image_url) for backward compatibility
    const urls = p.epc_image_urls || (p.epc_image_url ? [p.epc_image_url] : null) || (p.epc_certificate_image ? [p.epc_certificate_image] : null) || (p.epc?.image_url ? [p.epc.image_url] : null) || [];
    return Array.isArray(urls) ? urls.filter(Boolean) : [];
  }, [data?.property]);

  const tops = useMemo(() => {
    const p = data?.property || {};
    // Determine which price label to use
    const priceLabel = p.purchase_price_gbp ? 'Purchase Price' : p.guide_price_gbp ? 'Guide Price' : p.asking_price_gbp ? 'Asking Price' : 'Display Price';
    const priceValue = p.purchase_price_gbp ?? p.guide_price_gbp ?? p.asking_price_gbp ?? p.display_price_gbp;

    return [
      { label: priceLabel, value: money0(priceValue), subtitle: 'acquisition' },
      { label: 'Post-Refurb Valuation', value: money0(p.post_refurb_valuation_gbp), subtitle: 'estimated ARV' },
      { label: 'Monthly Rent', value: money0(p.monthly_rent_gbp ?? (data?.financials as any)?.monthly_rent_gbp), subtitle: `annual: ${money0(p.annual_rent_gbp ?? (data?.financials as any)?.annual_rent_gbp)}` },
      { label: 'EPC Rating', value: `${p.epc_rating_current ?? p.epc_rating ?? '—'} → ${p.epc_rating_potential ?? '—'}`, subtitle: epc?.score_current && epc?.score_potential ? `scores: ${epc.score_current} → ${epc.score_potential}` : undefined },
    ];
  }, [data?.property, data?.financials, epc]);

/* ---------- ROOM GROUPING & GALLERY (room_totals is the truth) ---------- */

type GroupedRoom = {
  key: string;
  room_type: string;
  room_label?: string | null;
  // merged numbers
  room_total_with_vat_gbp?: number;
  room_total_gbp?: number;
  confidence?: number | null;
  // images
  images: string[];
  primaryImage: string;
  // representative row (for RoomCard consumption)
  rep: RefurbRoom;
  // count of merged source rows (refurb rows matched into this total)
  mergedCount: number;
  // NEW: is this card tied to a floorplan room (id/label)?
  mapped: boolean;
};


function buildRoomGroups(property: any, refurbRows: RefurbRoom[]) {
  // Build price lookup maps
  const roomTotals: any[] = Array.isArray(property?.room_totals) ? property.room_totals : [];
  const imagesMap: Record<string, string> = property?.images_map || {};

  const priceByImageId = new Map<string, any>();
  const priceByName = new Map<string, any>();

  for (const total of roomTotals) {
    if (isOverheadsOrTotalsRow(total)) continue;

    // Index by image_id if present
    if (total.image_id) {
      priceByImageId.set(total.image_id, total);
    }

    // Index by normalized name
    const normName = safeLower(total.room_name || total.label || '').trim();
    if (normName) {
      priceByName.set(normName, total);
    }
  }

  console.log('[buildRoomGroups] Price maps:', {
    byImageId: Array.from(priceByImageId.keys()),
    byName: Array.from(priceByName.keys())
  });

  // Helper to resolve image IDs to URLs
  const resolveImages = (imageIds: string[], imageUrls: string[]): string[] => {
    const urls: string[] = [];
    for (const id of imageIds || []) {
      if (imagesMap[id]) urls.push(imagesMap[id]);
    }
    for (const url of imageUrls || []) {
      if (url) urls.push(url);
    }
    return Array.from(new Set(urls));
  };

  // Helper to find price for a room
  const findPrice = (imageIds: string[], predictedRoom: string) => {
    // Try image_id match first
    for (const imgId of imageIds || []) {
      const price = priceByImageId.get(imgId);
      if (price) return price;
    }

    // Fallback to name match
    const normName = safeLower(predictedRoom || '').trim();
    return priceByName.get(normName) || null;
  };

  // Build renderable rooms array
  const renderableRooms: any[] = [];
  const seenImageIds = new Set<string>();

  // 1) Process interior rooms from floorplan_min
  const floorplanMin: any[] = Array.isArray(property?.floorplan_min) ? property.floorplan_min : [];
  console.log('[buildRoomGroups] floorplan_min items:', floorplanMin.length);

  for (const fp of floorplanMin) {
    const imageIds = fp.image_ids || [];
    const imageUrls = fp.image_urls || [];
    const images = resolveImages(imageIds, imageUrls);

    // Skip if we've already seen this image
    const firstImageId = imageIds[0];
    if (firstImageId && seenImageIds.has(firstImageId)) continue;
    if (firstImageId) seenImageIds.add(firstImageId);

    const roomName = fp.room_name || fp.label || fp.room_type;
    const price = findPrice(imageIds, roomName);
    const displayName = price?.room_name || roomName || 'Unknown';

    if (images.length > 0 || (price && readTotalWithVat(price) > 0)) {
      renderableRooms.push({
        kind: 'interior',
        displayName,
        imageIds,
        images,
        price,
        route: fp.route || null,
        predicted_room: fp.room_type,
      });
    }
  }

  // 2) Process exterior rooms from not_in_floorplan (EACH AS SEPARATE CARD - DO NOT MERGE)
  const notInFloorplan: any[] = Array.isArray(property?.not_in_floorplan) ? property.not_in_floorplan : [];
  console.log('[buildRoomGroups] not_in_floorplan items:', notInFloorplan.length, notInFloorplan);

  for (const item of notInFloorplan) {
    if (!item) continue;

    const imageIds = item.image_ids || [];
    const imageUrls = item.image_urls || [];
    const images = resolveImages(imageIds, imageUrls);

    // Skip if we've already seen this image
    const firstImageId = imageIds[0];
    if (firstImageId && seenImageIds.has(firstImageId)) continue;
    if (firstImageId) seenImageIds.add(firstImageId);

    const price = findPrice(imageIds, item.predicted_room || item.route);
    const displayName = price?.room_name || titleize(item.predicted_room || item.route || 'Exterior');

    if (images.length > 0 || (price && readTotalWithVat(price) > 0)) {
      renderableRooms.push({
        kind: 'exterior',
        displayName,
        imageIds,
        images,
        price,
        route: item.route,
        predicted_room: item.predicted_room,
      });
    }
  }

  // 3) Add priced-only rooms (no images, but have cost)
  for (const total of roomTotals) {
    if (isOverheadsOrTotalsRow(total)) continue;

    const totalValue = readTotalWithVat(total);
    if (!totalValue || totalValue === 0) continue;

    // Check if already added (by image_id)
    if (total.image_id && seenImageIds.has(total.image_id)) continue;

    renderableRooms.push({
      kind: 'priced-only',
      displayName: total.room_name || 'Unknown Room',
      imageIds: [],
      images: [],
      price: total,
      route: null,
      predicted_room: null,
    });
  }

  // Debug log
  console.table(renderableRooms.map(r => ({
    name: r.displayName,
    kind: r.kind,
    imgs: r.imageIds.join(','),
    price: r.price?.room_total_with_vat_gbp ?? r.price?.room_total_with_vat ?? r.price?.total_with_vat ?? null
  })));

  // Convert to GroupedRoom format
  const groups: GroupedRoom[] = renderableRooms.map((r, idx) => {
    const totalWithVat = r.price ? (readTotalWithVat(r.price) || 0) : 0;

    return {
      key: `${r.kind}-${idx}-${r.displayName}`,
      room_type: r.predicted_room || r.route || 'other',
      room_label: r.displayName,
      room_total_with_vat_gbp: totalWithVat,
      room_total_gbp: r.price?.room_total_gbp || r.price?.room_total_without_vat || r.price?.total_without_vat || totalWithVat / 1.2,
      confidence: r.price?.confidence || null,
      images: r.images,
      primaryImage: r.images[0] || NO_IMAGE_PLACEHOLDER,
      rep: (r.price || {}) as RefurbRoom,
      mergedCount: 1,
      mapped: false,
    };
  });

  return groups;
}



// === derive groupedRooms from floorplan only (no unmapped) ===
// Group and process the RefurbRoom[] into logical room cards
  const logicalRooms = useMemo(() => {
    if (!data?.property) return [];

    // A) Build canonical room list from floorplan_min
    const canonicalRooms: Array<{
      key: string;
      label: string;
      type: string;
      floor?: string | null;
      images: string[];
      extras: string[];
      costs: { totalWithVat?: number };
    }> = [];

    // Index maps for bedrooms
    const bedIndexByLabel = new Map<string, number>();
    const imageIdToBedIndex = new Map<string, number>();
    const imageUrlToBedIndex = new Map<string, number>();

    // Build interior rooms from floorplan_min
    (data.property.floorplan_min || []).forEach((fp: any) => {
      const type = normName(fp.room_type);
      const label = fp.room_name || '';
      const key = logicalKey(type, label);

      if (!canonicalRooms.find(r => r.key === key)) {
        canonicalRooms.push({
          key,
          label,
          type,
          floor: fp.floor,
          images: [],
          extras: [],
          costs: {}
        });

        // Track bedroom indices
        if (type === 'bedroom') {
          const idx = extractIndex(label);
          if (idx !== null) {
            bedIndexByLabel.set(safeLower(label), idx);
          }
        }
      }
    });

    // Add exterior rooms if they have images
    const exteriorTypes = ['facade_exterior', 'garden', 'exterior'];
    exteriorTypes.forEach(extType => {
      const hasData = (data.property.room_groups || []).some((g: any) => normName(g.route) === extType) ||
                     (data.property.not_in_floorplan || []).some((n: any) => normName(n.route) === extType);

      if (hasData) {
        const key = logicalKey(extType, '');
        if (!canonicalRooms.find(r => r.key === key)) {
          canonicalRooms.push({
            key,
            label: extType.replace('_', ' ').replace(/\b\w/g, m => m.toUpperCase()),
            type: extType,
            images: [],
            extras: [],
            costs: {}
          });
        }
      }
    });

    // C) Image aggregation per canonical room
    canonicalRooms.forEach(room => {
      const images: string[] = [];

      // 1. From image_urls_by_room
      (data.property.image_urls_by_room?.[room.label] || []).forEach((url: string) => images.push(url));

      // 2. From primary_image_url_by_room
      const primary = data.property.primary_image_url_by_room?.[room.label];
      if (primary) images.push(primary);

      // 3. From images_by_room -> resolve via images_map
      (data.property.images_by_room?.[room.label] || []).forEach((id: string) => {
        const url = data.property.images_map?.[id];
        if (url) images.push(url);
      });

      // 4. From room_groups
      (data.property.room_groups || []).forEach((group: any) => {
        const matchesRoute = normName(group.route) === room.type;
        const matchesName = group.room_name && normName(group.room_name) === normName(room.label);
        const isBedroomMatch = room.type === 'bedroom' && normName(group.route) === 'bedroom' &&
                              group.room_name && safeLower(group.room_name) === safeLower(room.label);

        if (matchesRoute || matchesName || isBedroomMatch) {
          (group.image_urls || []).forEach((url: string) => images.push(url));
          if (group.primary_image_url) images.push(group.primary_image_url);
          (group.image_ids || []).forEach((id: string) => {
            const url = data.property.images_map?.[id];
            if (url) images.push(url);
          });
        }
      });

      // 5. From not_in_floorplan (for exterior rooms)
      if (['facade_exterior', 'garden', 'exterior'].includes(room.type)) {
        (data.property.not_in_floorplan || []).forEach((item: any) => {
          if (normName(item.route) === room.type) {
            (item.image_urls || []).forEach((url: string) => images.push(url));
            (item.image_ids || []).forEach((id: string) => {
              const url = data.property.images_map?.[id];
              if (url) images.push(url);
            });
          }
        });
      }

      room.images = dedupeUrls(images);

      // Build bedroom image maps
      if (room.type === 'bedroom') {
        const bedIdx = bedIndexByLabel.get(safeLower(room.label));
        if (bedIdx !== null && bedIdx !== undefined) {
          // Map image IDs and URLs to this bedroom index
          (data.property.images_by_room?.[room.label] || []).forEach((id: string) => {
            imageIdToBedIndex.set(id, bedIdx);
          });
          room.images.forEach(url => {
            imageUrlToBedIndex.set(url, bedIdx);
          });
        }
      }
    });

    // D) Estimate matching and merging
    const estimateCounts = new Map<string, number>();

    function matchEstimate(est: any): string | null {
      const estType = normName(est.room_type || est.detected_room_type || '');

      // 1. Image-based (strongest, for bedrooms)
      if (est.image_id && data?.property?.images_map?.[est.image_id]) {
        const url = data.property.images_map[est.image_id];
        const bedIdx = imageIdToBedIndex.get(est.image_id);
        if (bedIdx !== null && bedIdx !== undefined) {
          const room = canonicalRooms.find(r => r.type === 'bedroom' && extractIndex(r.label) === bedIdx);
          if (room) return room.key;
        }
        // Non-bedroom image match
        const room = canonicalRooms.find(r => r.images.includes(url));
        if (room) return room.key;
      }

      if (est.image_url) {
        const bedIdx = imageUrlToBedIndex.get(est.image_url);
        if (bedIdx !== null && bedIdx !== undefined) {
          const room = canonicalRooms.find(r => r.type === 'bedroom' && extractIndex(r.label) === bedIdx);
          if (room) return room.key;
        }
        const room = canonicalRooms.find(r => r.images.includes(est.image_url));
        if (room) return room.key;
      }

      // 2. Label/Index-based
      if (estType === 'bedroom') {
        const estIndex = extractIndex(est.room_name || '');
        if (estIndex !== null) {
          const room = canonicalRooms.find(r => r.type === 'bedroom' && extractIndex(r.label) === estIndex);
          if (room) return room.key;
        }
      }

      // 3. Type-only fallback
      const typeMatches = canonicalRooms.filter(r => r.type === estType);
      if (typeMatches.length === 1) return typeMatches[0].key;
      if (typeMatches.length > 1) {
        // Choose room with fewest estimates
        const leastUsed = typeMatches.reduce((min, current) => {
          const minCount = estimateCounts.get(min.key) || 0;
          const currentCount = estimateCounts.get(current.key) || 0;
          return currentCount < minCount ? current : min;
        });
        return leastUsed.key;
      }

      return null;
    }

    // Process estimates
    (data.refurb_estimates || []).forEach((est: any) => {
      const roomKey = matchEstimate(est);
      if (!roomKey) return;

      const room = canonicalRooms.find(r => r.key === roomKey);
      if (!room) return;

      estimateCounts.set(roomKey, (estimateCounts.get(roomKey) || 0) + 1);

      // Merge costs with null-safe math
      const t_sub = est.room_total_with_vat_gbp ?? est.room_total_gbp ?? 0;

      room.costs.totalWithVat = (room.costs.totalWithVat ?? 0) + t_sub;

      // Check for extra images
      if (est.image_url && !room.images.includes(est.image_url)) {
        room.extras.push(est.image_url);
      }
      if (est.image_id && data?.property?.images_map?.[est.image_id]) {
        const url = data.property.images_map[est.image_id];
        if (!room.images.includes(url)) {
          room.extras.push(url);
        }
      }
    });

    // Fallback to room_totals
    (data.property.room_totals || []).forEach((tot: any) => {
      if (tot.type !== 'room') return;

      let room: any = null;

      if (normName(tot.room_name).includes('bedroom')) {
        const idx = extractIndex(tot.room_name);
        if (idx !== null) {
          room = canonicalRooms.find(r => r.type === 'bedroom' && extractIndex(r.label) === idx);
        }
      } else {
        const key = logicalKey(null, tot.room_name);
        room = canonicalRooms.find(r => r.key === key);
      }

      if (room && !estimateCounts.has(room.key) && (room.costs.totalWithVat ?? 0) === 0) {
        room.costs.totalWithVat = tot.total_with_vat ?? 0;
      }
    });

    // Convert to final format
    const result = canonicalRooms.map(room => ({
      key: room.key,
      label: room.label,
      type: room.type,
      floor: room.floor,
      images: room.images,
      extrasCount: room.extras.length,
      costs: room.costs
    }));

    // F) Sort by display order, then bedroom index
    const displayOrder = ['kitchen', 'bathroom', 'bedroom', 'living_room', 'hallway', 'facade_exterior', 'garden', 'exterior', 'other'];

    return result.sort((a, b) => {
      const ia = displayOrder.indexOf(a.type);
      const ib = displayOrder.indexOf(b.type);
      const orderDiff = (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      if (orderDiff !== 0) return orderDiff;

      // Within bedrooms, sort by index
      if (a.type === 'bedroom' && b.type === 'bedroom') {
        const idxA = extractIndex(a.label) ?? 99;
        const idxB = extractIndex(b.label) ?? 99;
        return idxA - idxB;
      }

      return a.key.localeCompare(b.key);
    });
  }, [data?.property, data?.refurb_estimates]);

  // Apply filters to UI rooms (properties-only data)
  const filteredRooms = useMemo(() => {
    let list = [...uiRooms];

    // Apply existing filters
    list = list.filter(room => !UNWANTED_TYPES.has(room.room_type || ''));

    if (filterType !== 'All') {
      list = list.filter((room) => titleize(room.room_type) === filterType);
    }

    // Note: confidence filtering removed as new UiRoom doesn't have confidence scores

    // Apply sorting
    if (sortKey === 'total_desc') {
      list = [...list].sort((a, b) => (b.total_with_vat ?? 0) - (a.total_with_vat ?? 0));
    } else if (sortKey === 'total_asc') {
      list = [...list].sort((a, b) => (a.total_with_vat ?? 0) - (b.total_with_vat ?? 0));
    }

    return list;
  }, [uiRooms, filterType, sortKey]);

// === roomTypes for the filter dropdown (unchanged logic) ===
const roomTypes = useMemo(() => {
  const set = new Set<string>();
  filteredRooms.forEach((room) => {
    const roomType = titleize(room.room_type);
    if (roomType) set.add(roomType);
  });
  return ['All', ...Array.from(set).sort()];
}, [filteredRooms]);

/* ---------- scenarios helpers (labels & render) ---------- */




  /* ---------- scenarios helpers (labels & render) ---------- */
  const labelMap: Record<string, { label?: string; hint?: string; fmt?: 'money'|'pct'|'raw' }> = {
    // Inputs
    purchase_price_gbp: { label: 'Purchase Price', hint: 'Assumed acquisition price', fmt: 'money' },
    refurb_cost_gbp:    { label: 'Refurb Budget',  hint: 'Incl. VAT unless stated', fmt: 'money' },
    annual_rent_gbp:    { label: 'Annual Rent',    hint: 'Gross scheduled rent', fmt: 'money' },
    monthly_rent_gbp:   { label: 'Monthly Rent',   hint: 'Gross scheduled monthly rent', fmt: 'money' },
    ground_rent_gbp:    { label: 'Ground Rent',    hint: 'Annual ground rent (if leasehold)', fmt: 'money' },
    service_charge_gbp: { label: 'Service Charge', hint: 'Annual charge (if applicable)', fmt: 'money' },
    sdlt_gbp:           { label: 'Stamp Duty',     hint: 'Stamp Duty Land Tax', fmt: 'money' },
    stamp_duty_gbp:     { label: 'Stamp Duty',     hint: 'Stamp Duty Land Tax', fmt: 'money' },


    // Exit: Sell
    sale_price_gbp:     { label: 'Sale Price', fmt: 'money' },
    selling_costs_gbp:  { label: 'Selling Costs', fmt: 'money' },
    net_profit_gbp:     { label: 'Net Profit', fmt: 'money' },
    roi_percent:        { label: 'ROI', fmt: 'pct' },

    // Exit: Refi
    ltv:                                { label: 'LTV', fmt: 'pct' },
    dscr_month1:                        { label: 'DSCR (Month-1)', fmt: 'raw' },
    refi_value_gbp:                     { label: 'Refi Value', fmt: 'money' },
    final_btl_loan_gbp:                 { label: 'Final BTL Loan', fmt: 'money' },
    net_cash_left_in_after_refi_gbp:    { label: 'Net Cash Left In', fmt: 'money' },
    roi_cash_on_cash_percent_24m:       { label: 'Cash-on-Cash (24m)', fmt: 'pct' },

    // Period (no refi)
    facility_loan_gbp:  { label: 'Bridge Facility', fmt: 'money' },
    deposit_gbp:        { label: 'Deposit', fmt: 'money' },
    interest_gbp:       { label: 'Interest', fmt: 'money' },
  };
  const prettifyKey = (k: string) => labelMap[k]?.label || titleize(/_gbp(_per_m)?$/.test(k) ? k.replace(/_gbp(_per_m)?$/,'') : k).replace(/_/g,' ');
  const formatCell = (k: string, v: any) => {
    const meta = labelMap[k];
    const fmt = meta?.fmt;
    if (v == null) return '—';
    if (fmt === 'money' || /_gbp(_per_m)?$/.test(k) || /price|fee|cost|loan/i.test(k)) return money0(v);
    if (fmt === 'pct'   || /_pct$/.test(k) || /rate|ltv|roi|yield|growth/i.test(k)) return `${(Number(v) * (String(v).includes('%') ? 1 : 100)).toFixed(2)}%`.replace('NaN%', '—');
    if (typeof v === 'number') return v.toLocaleString();
    return String(v);
  };

  const ScenarioKV = ({ obj }: { obj: any }) => {
    const safe = tryParseJSON(obj);
    if (safe == null) return <div className="text-slate-500 dark:text-slate-400 text-sm">No data.</div>;
    if (Array.isArray(safe)) {
      return (
        <div className="space-y-2">
          {safe.map((row, i) => (
            <div key={i} className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-2">
              <ScenarioKV obj={row} />
            </div>
          ))}
        </div>
      );
    }
    if (isPlainObject(safe)) {
      return (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {Object.entries(safe as Record<string, any>).map(([k, v]) => (
            <FragmentKV key={k} k={k} v={v} formatCell={formatCell} prettifyKey={prettifyKey} />
          ))}
        </dl>
      );
    }
    return <div className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{String(safe)}</div>;
  };

  /* ---------- UI ---------- */
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30 dark:opacity-20 pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8 relative z-10">
        {/* Protected banner + logout */}
        <div className="flex items-center justify-between rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 px-6 py-4 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              <span className="font-bold">Protected Demo</span> – Use your unique <code className="px-2 py-1 bg-white/70 dark:bg-slate-800/90 rounded text-xs font-mono font-semibold">run_id</code> to preview completed property analysis
            </p>
          </div>
          <button onClick={handleLogout} className="text-sm font-semibold rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-md hover:shadow-lg" title="Sign out and return to access page">
            Sign Out
          </button>
        </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-2 border-slate-200 dark:border-slate-700 shadow-xl rounded-b-2xl px-8 py-6">
        <div className="flex items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <Image src={LOGO_SRC} alt="PropVisions Logo" width={140} height={36} priority className="h-12 w-auto md:h-14" />
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight">PropVisions Demo</h1>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 tracking-wide">AI-POWERED PROPERTY INVESTMENT ANALYSIS</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 max-w-2xl font-medium leading-relaxed">Paste a property listing URL to start a new analysis, or toggle demo mode to load an existing <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded text-xs font-mono font-semibold">run_id</code> result.</p>
            <ProgressBar percent={progress} show={status === 'queued' || status === 'processing'} />
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            {(status === 'queued' || status === 'processing') && (
              <span className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
                Elapsed: {Math.floor(elapsedMs / 1000 / 60)}m {Math.floor((elapsedMs / 1000) % 60)}s
              </span>
            )}
            {running && (
              <button type="button" onClick={handleCancel} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
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
            className="flex-1 p-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
            required
            inputMode="url"
          />
          <button
            type="submit"
            disabled={running || !url}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all"
            title={!url ? 'Enter a URL or use demo run' : 'Analyze'}
          >
            {running ? 'Running…' : 'Analyze'}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <input type="checkbox" className="accent-blue-600 dark:accent-blue-500 w-4 h-4 rounded" checked={useDemo} onChange={(e) => setUseDemo(e.target.checked)} />
            Use demo run
          </label>

          <input
            type="text"
            value={demoRunId}
            onChange={(e) => setDemoRunId(e.target.value.trim())}
            placeholder="demo run_id (UUID)"
            className="min-w-[22rem] flex-1 p-2 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-md disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
            disabled={!useDemo}
          />

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); loadDemoRun((demoRunId || '').trim()); }}
            disabled={!useDemo || !(demoRunId || '').trim()}
            className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
            title="Load demo data using the run_id"
          >
            Load demo
          </button>
        </div>
      </section>

      {/* Error */}
      {error && <div role="alert" className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 rounded-lg p-3 font-medium">{error}</div>}

      {/* Results */}
      {status === 'completed' && data && (
        <div className="grid grid-cols-1 gap-6">
          {/* Property header */}
          <Section title="Property Overview" desc="Comprehensive listing details, key property metrics, and essential documentation. Review the property specifications and investment highlights below.">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: facts */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">{data.property?.property_title || 'Untitled property'}</h2>
                <p className="text-base text-slate-700 dark:text-slate-300 font-medium">
                  {data.property?.address}{data.property?.postcode ? `, ${data.property.postcode}` : ''}
                </p>

                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-700 dark:text-slate-300 mt-3">
                  <span><strong>Type:</strong> {data.property?.property_type || '—'}</span>
                  <span><strong>Tenure:</strong> {data.property?.tenure || '—'}</span>
                  <span><strong>Beds:</strong> {data.property?.bedrooms ?? '—'}</span>
                  <span><strong>Baths:</strong> {data.property?.bathrooms ?? '—'}</span>
                  <span><strong>Receptions:</strong> {data.property?.receptions ?? '—'}</span>
                  <span>
                    <strong>
                      <Tooltip text="Energy Performance Certificate rating. Measures property energy efficiency from A (best) to G (worst).">
                        <span>EPC:</span>
                      </Tooltip>
                    </strong> {epc?.current ?? '—'}
                  </span>
                  <span><strong>Area:</strong> {dims?.floorplan_total_area_sqm ?? data.property?.floorplan_total_area_sqm ?? '—'} m²{dims?.floorplan_total_area_sq_ft ?? data.property?.floorplan_total_area_sq_ft ? ` / ${dims?.floorplan_total_area_sq_ft ?? data.property?.floorplan_total_area_sq_ft} sq ft` : ''}</span>
                </div>

                {/* Agent info */}
                {(data.property?.agent_name || data.property?.agent_phone || data.property?.agent_email) && (
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Agent:</span>
                    {data.property?.agent_name && (
                      <Badge tone="slate">{data.property.agent_name}</Badge>
                    )}
                    {data.property?.agent_phone && (
                      <a href={`tel:${data.property.agent_phone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{data.property.agent_phone}</a>
                    )}
                    {data.property?.agent_email && (
                      <a href={`mailto:${data.property.agent_email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{data.property.agent_email}</a>
                    )}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {tops.map((k) => (<KPI key={k.label} label={k.label} value={k.value} subtitle={k.subtitle} />))}
                </div>

                {/* Floorplan gallery */}
                {floorplans && floorplans.length > 0 ? (
                  <div className="mt-6">
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-4 tracking-tight">Property Floorplans</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {floorplans.slice(0, 6).map((src, i) => (
                        <button
                          key={i}
                          onClick={() => setFloorplanModalOpen(true)}
                          className="rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg cursor-pointer"
                          title="Click to view full size"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Floorplan ${i + 1}`} className="w-full h-44 object-contain bg-white dark:bg-slate-900 p-2" loading="lazy" />
                        </button>
                      ))}
                    </div>
                    {floorplans.length > 6 && (
                      <button
                        onClick={() => setFloorplanModalOpen(true)}
                        className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View all {floorplans.length} floorplans →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">No floorplans available for this property</p>
                  </div>
                )}

              </div>

              {/* Right: media + links */}
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  {data.property?.listing_images?.[0]
                    ? (<img src={data.property.listing_images[0]} alt="Property" className="w-full h-48 object-cover" loading="lazy" />)
                    : (<div className="w-full h-48 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">No image</div>)}
                </div>

                <div className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                  <div>
                    <strong>Displayed Price:</strong>{' '}
                    {money0(
                      data.property?.purchase_price_gbp ??
                      data.property?.guide_price_gbp ??
                      data.property?.asking_price_gbp ??
                      data.property?.display_price_gbp
                    )}{' '}
                    <span className="text-slate-500 dark:text-slate-400">({data.property?.price_label || 'price'})</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    <span className="mr-3">Guide: {money0(data.property?.guide_price_gbp)}</span>
                    <span className="mr-3">Purchase: {money0(data.property?.purchase_price_gbp)}</span>
                    <span>Asking: {money0(data.property?.asking_price_gbp)}</span>
                  </div>
                </div>

                {/* Links & documents */}
                <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                  <h4 className="text-base font-bold mb-3 text-slate-900 dark:text-slate-50 tracking-tight">Links & Documents</h4>
                  <div className="flex flex-col gap-3">
                    {data.property?.listing_url ? (
                      <a className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-sm hover:shadow-md font-semibold text-sm" href={data.property.listing_url} target="_blank" rel="noreferrer">View Original Listing</a>
                    ) : <span className="text-slate-500 text-sm">No listing URL</span>}
                    {data.property?.preview_url_investor_pack && (
                      <a className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-4 py-2.5 hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm" href={data.property.preview_url_investor_pack} target="_blank" rel="noopener noreferrer">Investor Pack (PDF)</a>
                    )}
                    {data.property?.preview_url_builders_quote && (
                      <a className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-sm hover:shadow-md font-semibold text-sm" href={data.property.preview_url_builders_quote} target="_blank" rel="noopener noreferrer">Builder's Quote (PDF)</a>
                    )}
                    {data.property?.brochure_urls?.[0] && (
                      <a className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-sm hover:shadow-md font-semibold text-sm" href={data.property.brochure_urls[0]} target="_blank" rel="noopener noreferrer">Agent Brochure (PDF)</a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Missing Room Requests Card */}
          {data.property_id && <MissingRoomRequestsCard propertyId={data.property_id} />}

          {/* Refurbishment */}
          {/* IMPORTANT: This section uses ONLY the properties payload. Do not query labour/material tables. */}
          <Section
            title="Refurbishment Budget Breakdown"
            desc="Detailed room-by-room renovation cost estimates. All amounts include VAT (Value Added Tax at 20%) unless marked 'ex VAT'. Costs are AI-estimated from property images and UK market rates. Rooms with £0 budget require no refurbishment work. Use filters below to view specific room types or sort by cost."
            right={
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <label className="text-xs text-slate-600 dark:text-slate-400">Filter:</label>
                <select className="text-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  {roomTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>

                <label className="text-xs text-slate-600 dark:text-slate-400 ml-2">Sort:</label>
                <select className="text-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
                  <option value="room_order">Room order (logical)</option>
                  <option value="total_desc">Total (high → low)</option>
                  <option value="total_asc">Total (low → high)</option>
                  <option value="room_asc">Room (A → Z)</option>
                </select>

                <label className="text-xs text-slate-600 dark:text-slate-400 ml-2">Min confidence:</label>
                <input type="range" min={0} max={100} step={5} value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))} className="w-28 accent-blue-600 dark:accent-blue-500" title={`${minConfidence}%`} />
                <span className="text-xs text-slate-600 dark:text-slate-400 w-10 text-right">{minConfidence}%</span>
              </div>
            }
          >
            {/* Programme note */}
            <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-700 dark:text-slate-300 mb-3">
              <strong>Programme note:</strong> Works duration is tracked in Scenarios → <em>Period Snapshot</em>.
              {period?.months_refurb != null ? <> Current assumption: <strong>{Number(period.months_refurb)} months</strong>.</> : " If not shown, the backend hasn't provided a refurb duration for this run."}
            </div>

            {/* Cards (floorplan-ordered) */}
            {hasRefurbData ? (
              <>
                {/* Room Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredRooms.map((room) => (
                    <RoomCard
                      key={room.room_name}
                      room={room}
                      showCharts={true}
                      allRooms={uiRooms}
                      pendingUploads={roomUploadsMap.get(room.room_name || '') || []}
                    />
                  ))}
                </div>

                {/* Rollup strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <KPI
                    label="Rooms Total"
                    value={money0(rollup.rooms_total_with_vat)}
                    subtitle={rollup.rooms_total_without_vat ? `ex-VAT: ${money0(rollup.rooms_total_without_vat)}` : undefined}
                    tone="blue"
                  />
                  <KPI
                    label="Overheads"
                    value={rollup.overheads_with_vat != null ? money0(rollup.overheads_with_vat) : '—'}
                    subtitle={rollup.overheads_without_vat != null ? `ex-VAT: ${money0(rollup.overheads_without_vat)}` : 'Whole-house costs'}
                    tone="amber"
                  />
                  <KPI
                    label="EPC Works"
                    value={rollup.epc_total_with_vat != null ? money0(rollup.epc_total_with_vat) : '—'}
                    subtitle={rollup.epc_total_without_vat != null ? `ex-VAT: ${money0(rollup.epc_total_without_vat)}` : 'Energy efficiency upgrades'}
                    tone="green"
                  />
                  <KPI
                    label="Total Refurbishment"
                    value={rollup.property_total_with_vat != null ? money0(rollup.property_total_with_vat) : money0((rollup.rooms_total_with_vat ?? 0) + nz(rollup.overheads_with_vat) + nz(rollup.epc_total_with_vat))}
                    subtitle={rollup.property_total_without_vat != null ? `ex-VAT: ${money0(rollup.property_total_without_vat)}` : undefined}
                    tone="slate"
                  />
                </div>

                {/* Totals table (from original rows; optional to keep) */}
                <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                        <th className="p-4 text-left text-slate-900 dark:text-slate-50 font-bold">Room</th>
                        <th className="p-4 text-right text-slate-900 dark:text-slate-50 font-bold">Total (with VAT)</th>
                        <th className="p-4 text-right text-slate-900 dark:text-slate-50 font-bold">Total (ex VAT)</th>
                        <th className="p-4 text-right text-slate-900 dark:text-slate-50 font-bold">Conf.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uiRooms.map((room) => (
                        <tr key={room.room_name} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 capitalize text-slate-900 dark:text-slate-100 font-medium">{room.display_name}</td>
                          <td className="p-4 text-right font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(room.total_with_vat ?? 0)}</td>
                          <td className="p-4 text-right text-slate-700 dark:text-slate-300">{formatCurrency(room.total_without_vat || 0)}</td>
                          <td className="p-4 text-right text-slate-700 dark:text-slate-300">—</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        <td className="p-4 text-right font-bold text-slate-900 dark:text-slate-50">Totals</td>
                        <td className="p-4 text-right font-bold text-slate-900 dark:text-slate-50">
                          {formatCurrency(uiRooms.reduce((a, r) => a + (r.total_with_vat ?? 0), 0))}
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(uiRooms.reduce((a, r) => a + (r.total_without_vat || 0), 0))}
                        </td>
                        <td className="p-4" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            ) : (
              <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 text-slate-700 dark:text-slate-300">
                <p className="font-medium">No refurbishment data found in properties payload.</p>
                <p className="text-sm mt-1">Check that floorplan_min and room_totals are included in the properties object.</p>
              </div>
            )}
          </Section>

          {/* Listing Images Gallery */}
          {data.property?.listing_images && data.property.listing_images.length > 0 && (
            <Section title="Property Images" desc="High-resolution property photos. Click any image to open the interactive gallery with navigation.">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {data.property.listing_images.slice(0, 12).map((src: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      setListingGalleryStartIndex(i);
                      setListingGalleryOpen(true);
                    }}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:scale-[1.02] hover:shadow-2xl group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Property image ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <div className="bg-white/90 dark:bg-slate-900/90 rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform">
                        <svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      {i + 1} / {data.property.listing_images.length}
                    </div>
                  </button>
                ))}
              </div>
              {data.property.listing_images.length > 12 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setListingGalleryStartIndex(0);
                      setListingGalleryOpen(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    View all {data.property.listing_images.length} images →
                  </button>
                </div>
              )}
            </Section>
          )}

          {/* Rent estimate feedback */}
          <Section title="Rent Estimate" desc="Modelled view based on local comps and normalised assumptions. Use feedback to correct the model if this looks off.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <KPI
                label="Monthly Rent"
                value={money0(data.property?.monthly_rent_gbp ?? (data.financials as any)?.monthly_rent_gbp)}
                subtitle="Gross rental income per month"
                big={false}
              />
              <KPI
                label="Annual Rent"
                value={money0(data.property?.annual_rent_gbp ?? (data.financials as any)?.annual_rent_gbp ?? ((data.property?.monthly_rent_gbp ?? (data.financials as any)?.monthly_rent_gbp) ? (data.property?.monthly_rent_gbp ?? (data.financials as any)?.monthly_rent_gbp) * 12 : null))}
                subtitle="Total annual rental income"
                big={false}
              />
            </div>
            {data.property?.rent_rationale && (
              <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-700 dark:text-slate-300 mb-3">
                <strong className="text-slate-900 dark:text-slate-100">Rationale:</strong> {data.property.rent_rationale}
              </div>
            )}
          </Section>

          {/* EPC + fabric and services */}
          <Section
            title="EPC & Building Fabric"
            desc="Energy Performance Certificate (EPC) shows the property's energy efficiency rating from A (most efficient) to G (least efficient). The fabric section details heating systems, insulation, windows, and building construction. EPC improvement costs are included in the total refurbishment budget above."
            right={epcImages.length > 0 ? (
              <div className="hidden md:flex gap-2 ml-4">
                {epcImages.slice(0, 2).map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setEpcModalOpen(true)}
                    className="rounded-md overflow-hidden border hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                    title="Click to view full size"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`EPC certificate ${i + 1}`} className="w-36 h-24 object-contain bg-white" />
                  </button>
                ))}
                {epcImages.length > 2 && (
                  <button
                    onClick={() => setEpcModalOpen(true)}
                    className="flex items-center justify-center w-36 h-24 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-sm text-slate-600 dark:text-slate-400 font-medium"
                  >
                    +{epcImages.length - 2} more
                  </button>
                )}
              </div>
            ) : null}
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
                  {epcImages.length > 0 && (
                    <div className="mb-3 md:hidden flex gap-2 flex-wrap">
                      {/* Mobile EPC images */}
                      {epcImages.slice(0, 2).map((src, i) => (
                        <button
                          key={i}
                          onClick={() => setEpcModalOpen(true)}
                          className="rounded-md overflow-hidden border hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                          title="Click to view full size"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`EPC certificate ${i + 1}`} className="w-40 h-28 object-contain border rounded bg-white" />
                        </button>
                      ))}
                      {epcImages.length > 2 && (
                        <button
                          onClick={() => setEpcModalOpen(true)}
                          className="flex items-center justify-center w-40 h-28 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-sm text-slate-600 dark:text-slate-400 font-medium"
                        >
                          +{epcImages.length - 2} more
                        </button>
                      )}
                    </div>
                  )}
                  {epc?.score_current != null && epc?.score_potential != null ? (
                    <>
                      <div className="font-medium mb-1">Score: {epc.score_current} → {epc.score_potential}</div>
                      <div className="h-2 w-56 bg-slate-200 rounded">
                        <div className="h-2 bg-green-500 rounded" style={{ width: `${Math.max(0, Math.min(100, (epc.score_current / Math.max(epc.score_potential || 1, 1)) * 100))}%` }} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Potential improvement toward B</div>
                    </>
                  ) : (<div className="text-slate-500">No EPC score values</div>)}
                </div>
              </div>
            </div>
          </Section>

          {/* NEW: Investor Dashboard with live calculations */}
          {data && (
            <InvestorDashboard
              payload={data}
              onSaveScenario={(overrides, kpis) => {
                console.log('Save scenario:', { overrides, kpis });
                // TODO: Implement save to analysis_scenarios table
              }}
            />
          )}


          {/* Report preview */}
          {data.pdf_url && (
            <Section title="Report Preview" desc="Inline PDF viewer for the investor pack.">
              <PDFViewer pdfUrl={`/api/pdf-proxy?url=${encodeURIComponent(data.pdf_url)}`} />
            </Section>
          )}

          {/* Debug drawer */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4">
            <button className="text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setShowDebug((s) => !s)}>
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
            {showDebug && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <pre className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 rounded border border-slate-200 dark:border-slate-700 overflow-auto"><code>{JSON.stringify({ status, run: data?.run }, null, 2)}</code></pre>
                <pre className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 rounded border border-slate-200 dark:border-slate-700 overflow-auto"><code>{JSON.stringify({ property: data?.property, financials: data?.financials }, null, 2)}</code></pre>
                <pre className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 rounded border border-slate-200 dark:border-slate-700 overflow-auto md:col-span-2"><code>{JSON.stringify({ refurb_estimates: data?.refurb_estimates }, null, 2)}</code></pre>
                <pre className="bg-amber-50 dark:bg-amber-950/30 text-slate-900 dark:text-slate-100 p-3 rounded border border-amber-300 dark:border-amber-800 overflow-auto md:col-span-2">
                  <div className="font-bold text-amber-900 dark:text-amber-200 mb-2">Missing Room Requests (from Supabase):</div>
                  <code>{JSON.stringify({
                    property_id: data?.property_id,
                    api_url: `/api/missing-rooms?property_id=${encodeURIComponent(data?.property_id || '')}&status=pending`,
                    missing_room_requests: missingRoomRequests,
                    roomUploadsMap_size: roomUploadsMap.size,
                    roomUploadsMap_entries: Array.from(roomUploadsMap.entries()).map(([key, uploads]) => ({
                      room_key: key,
                      uploads: uploads.map(u => ({ id: u.id, room_label: u.room_label, room_type: u.room_type, floor: u.floor, fingerprint_key: u.fingerprint_key, status: u.status, upload_url: u.upload_url }))
                    }))
                  }, null, 2)}</code>
                </pre>
                <pre className="bg-blue-50 p-3 rounded border border-blue-300 overflow-auto md:col-span-2">
                  <div className="font-bold text-blue-900 mb-2">UI Rooms (for matching):</div>
                  <code>{JSON.stringify({
                    uiRooms_count: uiRooms.length,
                    uiRooms: uiRooms.map(r => ({ room_name: r.room_name, display_name: r.display_name, floor: r.floor, room_type: r.room_type }))
                  }, null, 2)}</code>
                </pre>
                <pre className="bg-green-50 p-3 rounded border border-green-300 overflow-auto md:col-span-2">
                  <div className="font-bold text-green-900 mb-2">Not In Floorplan (exterior items):</div>
                  <code>{JSON.stringify({
                    not_in_floorplan: data?.property?.not_in_floorplan || []
                  }, null, 2)}</code>
                </pre>
              </div>
            )}
          </section>
        </div>
      )}

      </div>

      {/* Floating Chatbot - only show when we have property data */}
      {data?.property_id && (
        <FloatingChatButton propertyId={data.property_id} />
      )}

      {/* Image Galleries */}
      <ImageGallery
        isOpen={epcModalOpen}
        onClose={() => setEpcModalOpen(false)}
        images={epcImages}
        title="EPC Certificates"
      />
      <ImageGallery
        isOpen={floorplanModalOpen}
        onClose={() => setFloorplanModalOpen(false)}
        images={floorplans}
        title="Floorplans"
      />
      <ImageGallery
        isOpen={listingGalleryOpen}
        onClose={() => setListingGalleryOpen(false)}
        images={data?.property?.listing_images || []}
        title="Property Images"
        startIndex={listingGalleryStartIndex}
      />
    </main>
  );
}

/* ---------- small helpers ---------- */
function FragmentKV({ k, v, formatCell, prettifyKey }: { k: string; v: any; formatCell: (k: string, v: any) => string; prettifyKey: (k: string) => string }) {
  const parsed = tryParseJSON(v);
  const isObj = isPlainObject(parsed);
  const isArr = Array.isArray(parsed);

  if (isObj || isArr) {
    return (
      <>
        <dt className="text-slate-600 dark:text-slate-400 capitalize">{prettifyKey(k)}</dt>
        <dd className="text-right">
          <DetailsDrawer label="Details">
            {isObj && (
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                {Object.entries(parsed as Record<string, any>).map(([kk, vv]) => (
                  <FragmentKV key={kk} k={kk} v={vv} formatCell={formatCell} prettifyKey={prettifyKey} />
                ))}
              </dl>
            )}
            {isArr && (
              <div className="space-y-1">
                {(parsed as any[]).map((row, i) => (
                  <div key={i} className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-2">
                    {isPlainObject(row) ? (
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        {Object.entries(row).map(([kk, vv]) => (
                          <FragmentKV key={kk} k={kk} v={vv} formatCell={formatCell} prettifyKey={prettifyKey} />
                        ))}
                      </dl>
                    ) : <pre className="text-xs font-mono text-slate-900 dark:text-slate-100 break-all">{String(row)}</pre>}
                  </div>
                ))}
              </div>
            )}
          </DetailsDrawer>
        </dd>
      </>
    );
  }

  return (
    <>
      <dt className="text-slate-600 dark:text-slate-400 capitalize">{prettifyKey(k)}</dt>
      <dd className="text-right text-slate-900 dark:text-slate-100 font-medium">{formatCell(k, parsed)}</dd>
    </>
  );
}

function DetailsDrawer({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-right">
      <button onClick={() => setOpen((s) => !s)} className="text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
        {open ? 'Hide' : label}
      </button>
      {open && <div className="mt-2 text-left">{children}</div>}
    </div>
  );
}

