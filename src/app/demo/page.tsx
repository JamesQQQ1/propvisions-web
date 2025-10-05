// src/app/demo/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

import { pollUntilDone, type RunStatus, startAnalyze, POLL_BUILD } from '@/lib/api';
import RoomCard, { type RefurbRoom } from '@/components/RoomCard';
import FeedbackBar from '@/components/FeedbackBar';
import PDFViewer from '@/components/PDFViewer';
import FinancialSliders, {
  type Derived as SliderDerived,
  type Assumptions as SliderAssumptions,
} from '@/components/FinancialSliders';

/* ---------- demo mode config (REQUIRED) ---------- */
const DEFAULT_DEMO_RUN_ID = 'cb58fc95-6901-4463-8daf-984f45f680a7';
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
const titleize = (k: string) => k.replace(/_/g, ' ').replace(/\b([a-z])/g, (m) => m.toUpperCase());

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
  const direct = toInt((r as any).room_total_with_vat_gbp) || toInt((r as any).room_total_gbp);
  if (direct) return direct;
  const mat = toInt((r as any).materials_total_with_vat_gbp ?? (r as any).materials_total_gbp);
  const lab = toInt((r as any).labour_total_gbp);
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
    overheads_with_vat: n(findOH?.total_with_vat) ?? undefined,
    overheads_without_vat: n(findOH?.total_without_vat) ?? undefined,
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
  const s = (lbl || '').toLowerCase();
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
  const t = (type || '').trim().toLowerCase();
  const l = (label || '').trim().toLowerCase();
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


// Exterior bucket we allow even without floorplan mapping (often no labelled rooms)
const EXTERIOR_TYPES = new Set(['facade', 'exterior', 'garden', 'front', 'rear', 'outside']);

// Robust detection of totals/overheads/epc rows
function isOverheadsOrTotalsRow(t: any) {
  const type = String(t?.type ?? t?.room_type ?? '').toLowerCase();
  const name = String(t?.room_name ?? t?.label ?? '').toLowerCase();
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


// Normalise a room “type” to canonical tokens
function normaliseType(x?: string | null) {
  if (!x) return 'other';
  const raw = x.toString().trim().toLowerCase();
  const map: Record<string, string> = {
    lounge: 'living_room', reception: 'living_room', receptions: 'living_room', living: 'living_room', 'living room': 'living_room',
    wc: 'bathroom', cloakroom: 'bathroom', ensuite: 'bathroom', 'en-suite': 'bathroom', bath: 'bathroom',
    beds: 'bedroom', bed: 'bedroom', 'bed room': 'bedroom',
    hallway: 'hall', landing: 'hall', corridor: 'hall', stair: 'hall', stairs: 'hall',
    exterior: 'facade', front: 'facade', garden: 'facade',
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
  if (t.includes('facade') || t.includes('exterior') || t.includes('front') || t.includes('garden')) return 'facade';
  if (t.includes('facade exterior')) return 'facade';
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
  const lbl = (labelRaw || '').toString().trim().toLowerCase();
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
    if (labelPretty.toLowerCase().startsWith(title.toLowerCase())) return labelPretty;
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
function readMaterialsTotal(t: any) {
  return (
    toInt(t?.materials_total_with_vat_gbp) ||
    toInt(t?.materials_total_with_vat) ||
    toInt(t?.materials_total_gbp) ||
    toInt(t?.materials_total)
  );
}
function readLabourTotal(t: any) {
  return toInt(t?.labour_total_gbp ?? t?.labour_total);
}

/* ---------- Enhanced image & cost resolution ---------- */
function normalizeName(name?: string | null): string {
  if (!name) return '';
  let normalized = name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w_]/g, '');

  // Handle synonyms
  const synonyms: Record<string, string> = {
    'sitting_room': 'living_room',
    'lounge': 'living_room',
    'reception': 'living_room',
    'hall': 'hallway',
    'landing': 'hallway',
    'facade_exterior': 'facade',
    'garden_yard': 'garden'
  };

  return synonyms[normalized] || normalized;
}

function resolveRoomImages(roomName: string, roomType: string, property: any): string[] {
  const images = new Set<string>();
  const normalizedName = normalizeName(roomName);
  const normalizedType = normalizeName(roomType);

  // 1. Direct room name matches in image_urls_by_room
  Object.entries(property?.image_urls_by_room || {}).forEach(([name, urls]) => {
    if (normalizeName(name) === normalizedName) {
      (urls as string[]).forEach(url => url && images.add(url));
    }
  });

  // 2. Primary image by room name
  Object.entries(property?.primary_image_url_by_room || {}).forEach(([name, url]) => {
    if (normalizeName(name) === normalizedName && url) {
      images.add(url as string);
    }
  });

  // 3. Image IDs resolved via images_map
  Object.entries(property?.images_by_room || {}).forEach(([name, ids]) => {
    if (normalizeName(name) === normalizedName) {
      (ids as string[]).forEach(id => {
        const url = property?.images_map?.[id];
        if (url) images.add(url);
      });
    }
  });

  // 4. Room groups by route or name
  (property?.room_groups || []).forEach((group: any) => {
    const matchesRoute = normalizeName(group.route) === normalizedType;
    const matchesName = normalizeName(group.room_name) === normalizedName;

    if (matchesRoute || matchesName) {
      (group.image_urls || []).forEach((url: string) => url && images.add(url));
      if (group.primary_image_url) images.add(group.primary_image_url);

      // Resolve image_ids
      (group.image_ids || []).forEach((id: string) => {
        const url = property?.images_map?.[id];
        if (url) images.add(url);
      });
    }
  });

  // 5. Not in floorplan (for exterior rooms)
  if (['facade', 'garden', 'exterior'].includes(normalizedType)) {
    (property?.not_in_floorplan || []).forEach((item: any) => {
      if (normalizeName(item.route) === normalizedType) {
        (item.image_urls || []).forEach((url: string) => url && images.add(url));
        (item.image_ids || []).forEach((id: string) => {
          const url = property?.images_map?.[id];
          if (url) images.add(url);
        });
      }
    });
  }

  return Array.from(images);
}

function aggregateRoomCosts(roomName: string, roomType: string, refurbEstimates: any[], roomTotals: any[]) {
  const normalizedName = normalizeName(roomName);
  const normalizedType = normalizeName(roomType);

  // Find matching estimates
  const matchingEstimates = refurbEstimates.filter(est => {
    const estType = normalizeName(est.room_type || est.detected_room_type || '');
    return estType === normalizedType || estType === normalizedName;
  });

  let materials = 0, labour = 0, total = 0;
  let hasMaterials = false, hasLabour = false, hasTotal = false;

  matchingEstimates.forEach(est => {
    const matVal = toInt(est.materials_total_with_vat_gbp || est.materials_total_gbp);
    const labVal = toInt(est.labour_total_gbp);
    const totVal = toInt(est.room_total_with_vat_gbp || est.room_total_gbp);

    if (matVal > 0) { materials += matVal; hasMaterials = true; }
    if (labVal > 0) { labour += labVal; hasLabour = true; }
    if (totVal > 0) { total += totVal; hasTotal = true; }
  });

  // Fallback to room_totals
  if (!hasTotal && !hasMaterials && !hasLabour) {
    const fallback = roomTotals.find(rt => normalizeName(rt.room_name) === normalizedName);
    if (fallback?.total_with_vat) {
      total = toInt(fallback.total_with_vat);
      hasTotal = true;
    }
  }

  // Compute total if not provided but components exist
  if (!hasTotal && (hasMaterials || hasLabour)) {
    total = materials + labour;
    hasTotal = true;
  }

  return {
    materialsWithVat: hasMaterials ? materials : undefined,
    labour: hasLabour ? labour : undefined,
    totalWithVat: hasTotal ? total : undefined
  };
}

/* ---------- UI micro components ---------- */
function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'green' | 'red' | 'amber' | 'slate' | 'blue' }) {
  const m: Record<string, string> = {
    green: 'bg-green-50 text-green-800 ring-green-200/60 shadow-sm',
    red: 'bg-red-50 text-red-800 ring-red-200/60 shadow-sm',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200/60 shadow-sm',
    slate: 'bg-slate-50 text-slate-700 ring-slate-200/60 shadow-sm',
    blue: 'bg-blue-50 text-blue-800 ring-blue-200/60 shadow-sm',
  };
  return <span className={classNames('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1', m[tone])}>{children}</span>;
}
function KPI({
  label, value, subtitle, tone, big = true,
}: { label: string; value: React.ReactNode; subtitle?: React.ReactNode; tone?: 'green'|'red'|'amber'|'slate'|'blue'; big?: boolean; }) {
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
function Section({ title, children, right, desc }: { title: string; children: React.ReactNode; right?: React.ReactNode; desc?: string }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          {desc && <p className="text-sm text-slate-600 mt-0.5">{desc}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
/** Tiny semicircle DSCR gauge (SVG) */
function DSCRGauge({ value }: { value?: number }) {
  const raw = Number(value);
  const v = Number.isFinite(raw) ? Math.max(0, Math.min(2, raw)) : 0;
  const pct = v / 2;
  const angle = Math.PI * (1 + pct);
  const r = 42, cx = 50, cy = 50;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  const critical = v < 1.0;
  const ok = v >= 1.25;
  const tone = critical ? '#ef4444' : ok ? '#22c55e' : '#f59e0b';

  return (
    <div className="inline-flex items-center gap-3">
      <svg width="120" height="70" viewBox="0 0 100 60" aria-label="DSCR gauge">
        <path d="M8,50 A42,42 0 1 1 92,50" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
        <path d={`M8,50 A42,42 0 ${pct > 0.5 ? 1 : 0} 1 ${x},${y}`} fill="none" stroke={tone} strokeWidth="8" strokeLinecap="round" />
        <path d="M63,14 L66,9" stroke="#9ca3af" strokeWidth="2" />
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
/** Minimal bar chart (SVG) for 24m summary */
function MiniBars({ items }: { items: { label: string; value: number; fmt?: 'money'|'raw' }[] }) {
  const max = Math.max(1, ...items.map(i => Math.abs(i.value)));
  return (
    <div className="space-y-1">
      {items.map((it, i) => {
        const width = Math.round((Math.abs(it.value) / max) * 100);
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="w-28 text-xs text-slate-600">{it.label}</div>
            <div className="flex-1 h-3 bg-slate-100 rounded">
              <div className="h-3 rounded bg-blue-500" style={{ width: `${width}%` }} />
            </div>
            <div className="w-24 text-right text-xs tabular-nums">
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
        <div className="h-2 bg-blue-600 transition-[width] duration-300 ease-out will-change-[width]" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
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


function Carousel({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const list = (images || []).filter(Boolean);
  const src = list[idx] || NO_IMAGE_PLACEHOLDER;
  const go = (d: number) => setIdx((i) => (list.length ? (i + d + list.length) % list.length : 0));
  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-300">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={src === NO_IMAGE_PLACEHOLDER ? `${title} (image unavailable)` : title}
        className="w-full h-48 object-cover object-center"
        loading="lazy"
      />
      {list.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Prev image"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 backdrop-blur border border-white/20 text-slate-700 hover:bg-white hover:shadow-md transition-all duration-200 flex items-center justify-center font-medium"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 backdrop-blur border border-white/20 text-slate-700 hover:bg-white hover:shadow-md transition-all duration-200 flex items-center justify-center font-medium"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="inline-block bg-black/70 backdrop-blur text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              {idx + 1}/{list.length}
            </span>
          </div>
        </>
      )}
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
    if (qRun) { setUseDemo(true); setDemoRunId(qRun); }
  }, []);

  // Sliders
  const [slDerived, setSlDerived] = useState<SliderDerived | null>(null);
  const [slAssumptions, setSlAssumptions] = useState<SliderAssumptions | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>('All');
  const [sortKey, setSortKey] = useState<'total_desc' | 'total_asc' | 'room_asc' | 'room_order'>('room_order');
  const [minConfidence, setMinConfidence] = useState<number>(0);

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
  const exitSell = backendSummary?.exit_sell || null;
  const exitRefi = backendSummary?.exit_refi_24m || null;

  const scenarios = ((data?.financials as any)?.scenarios || (data?.property as any)?.scenarios || null) as any;

  /* ---------- media helpers (floorplans + EPC) ---------- */
  const floorplans: string[] = useMemo(() => {
    const p = data?.property || {};
    const arr = p.floorplan_images || p.floorplan_image_urls || p.floorplans || [];
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  }, [data?.property]);

  const epcImageUrl: string | null = useMemo(() => {
    const p = data?.property || {};
    return (p.epc_image_url || p.epc_certificate_image || p.epc?.image_url || null) || null;
  }, [data?.property]);

  const tops = useMemo(() => {
    const p = data?.property || {};
    return [
      { label: 'Displayed Price', value: money0(p.purchase_price_gbp ?? p.guide_price_gbp ?? p.asking_price_gbp ?? p.display_price_gbp), subtitle: 'price' },
      { label: 'Guide Price',     value: money0(p.guide_price_gbp) },
      { label: 'Purchase Price',  value: money0(p.purchase_price_gbp) },
      { label: 'EPC Potential',   value: String(p.epc_potential ?? p.epc_rating_potential ?? '—') },
    ];
  }, [data?.property]);
  

  /* ---------- FEEDBACK: restrict to relevant places ---------- */
  const showFinancialsFeedback = true; // one bar only, no duplicates
  const showRentFeedback = true;
  const showEpcFeedback  = true;

/* ---------- ROOM GROUPING & GALLERY (room_totals is the truth) ---------- */

type GroupedRoom = {
  key: string;
  room_type: string;
  room_label?: string | null;
  // merged numbers
  materials_total_with_vat_gbp?: number;
  materials_total_gbp?: number;
  labour_total_gbp?: number;
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
  const totals: any[] = Array.isArray(property?.room_totals) ? property.room_totals : [];
  const refurb: any[] = Array.isArray(refurbRows) ? refurbRows : [];
  // If exterior-type, collapse into a single bucket for the type
  // If exterior-type, collapse into a single bucket for the type
const forceExteriorKey = (ty: string) =>
(EXTERIOR_TYPES.has(ty) || ty === 'facade') ? `${ty}::` : null;
  // Global property images (used as a last-resort fallback for rooms with no images)
  const globalImages: string[] = Array.isArray(property?.listing_images)
    ? property.listing_images.filter(Boolean)
    : [];

    // Map of image_id -> image_url (adjust keys to your payload)
const imagesMap: Record<string, string> =
(isPlainObject(property?.images_map) && property.images_map) ||
(isPlainObject(property?.images_by_id) && property.images_by_id) ||
{};

// helpers
const isUrl = (s: any) => typeof s === 'string' && (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:'));
const resolveToUrls = (arr: unknown[]): string[] => {
const out: string[] = [];
for (const x of Array.isArray(arr) ? arr : []) {
  if (!x) continue;
  if (isUrl(x)) out.push(String(x));
  else if (typeof x === 'string' && imagesMap[x]) out.push(imagesMap[x]);
}
return Array.from(new Set(out));
};

  // 1) Identify which types have any floorplan-mapped rows.
  const floorplanByType = new Set<string>();
  for (const t of totals) {
    if (isOverheadsOrTotalsRow(t)) continue;
    const ty = normaliseType(t?.type ?? t?.room_type ?? 'other');
    if (isFloorplanMapped(t, ty)) {
      floorplanByType.add(ty);
    }
  }
  

  // 2) Build a map<canonicalKey, accumulator>
  type Acc = {
    key: string;
    type: string;
    label?: string | null;
    images: string[];
    mat?: number;
    lab?: number;
    tot?: number;
    confidence?: number | null;
    rep?: any;
    mergedCount: number;
    // marks to decide mapping/eligibility
    mapped: boolean;
    isExterior: boolean;
  };

  const acc = new Map<string, Acc>();

  // Helper to upsert/merge into the accumulator
  function upsert(key: string, type: string, src: any, opts?: { mapped?: boolean }) {
    if (!acc.has(key)) {
      acc.set(key, {
        key,
        type,
        label: extractLabelFromAny(src),
        images: [],
        mat: undefined,
        lab: undefined,
        tot: undefined,
        confidence: null,
        rep: null,
        mergedCount: 0,
        mapped: !!opts?.mapped,
        isExterior: EXTERIOR_TYPES.has(type),
      });
    }
    const a = acc.get(key)!;

    // Merge numbers (sum from refurb rows; prefer explicit totals from room_totals when present)
    const mat = readMaterialsTotal(src);
    const lab = readLabourTotal(src);
    const tot = readTotalWithVat(src);
    if (mat) a.mat = (a.mat ?? 0) + mat;
    if (lab) a.lab = (a.lab ?? 0) + lab;
    if (tot) a.tot = (a.tot ?? 0) + tot;

    // Confidence: keep max
    let conf: number | null = null;
    if (typeof src?.confidence === 'number') conf = Number(src.confidence);
    else if (typeof src?.room_confidence === 'number') conf = Number(src.room_confidence);
    if (typeof conf === 'number') {
      if (conf > 1 && conf <= 100) conf = conf / 100;
      a.confidence = Math.max(a.confidence ?? 0, conf);
    }

    // Images
    const imgs = collectImages(src);
    if (imgs.length) a.images = Array.from(new Set(a.images.concat(imgs)));

    // Representative row for RoomCard (strip images later to avoid double image rendering)
    if (!a.rep) a.rep = { ...src };

    a.mergedCount += 1;
    if (opts?.mapped) a.mapped = true;
  }

  // 3) Ingest floorplan-mapped totals first (these are the “truth”)
  for (const tot of totals) {
    if (isOverheadsOrTotalsRow(tot)) continue;
    const type = normaliseType(tot?.type ?? tot?.room_type ?? 'other');
    const maybeLabel = extractLabelFromAny(tot);
    if (SHOW_ONLY_FLOORPLAN_MAPPED && !isFloorplanMapped(tot, type) && !EXTERIOR_TYPES.has(type)) {
      // Unmapped totals are allowed ONLY if exterior.
      continue;
    }
    // If this looks like a per-type rollup (e.g., label "Bedroom") and we already
// have floorplan-mapped rooms of this type, skip it.
if (floorplanByType.has(type) && isTypeLabelOnly(type, maybeLabel)) continue;


    const key = forceExteriorKey(type) ?? canonicalMatchKey(tot, type);
    upsert(key, key.split('::')[0], tot, { mapped: isFloorplanMapped(tot, type) });


  }

  // 4) Merge refurb rows into the best matching key
  for (const est of refurb) {
    // Skip obvious non-rooms (defensive)
    const estType = normaliseType(est?.detected_room_type ?? est?.room_type ?? 'other');
    if (UNWANTED_TYPES.has(estType)) continue;

    // If there is a clear floorplan id/label, use it; otherwise we create/merge into generic,
    // but later we’ll suppress generic cards when labelled/id’d exist for that type.
    const k = canonicalMatchKey(est, estType);
    upsert(k, k.split('::')[0], est, { mapped: isFloorplanMapped(est, estType) });


  }

  const groups: GroupedRoom[] = [];

  // Build final list
for (const a of acc.values()) {
  // 5a) resolve gallery to URLs
  let gallery = resolveToUrls(a.images);

  // allow exterior/facade to borrow listing images if still empty
  if (!gallery.length && a.isExterior) {
    gallery = globalImages;
  }

  const primary = gallery[0] ?? NO_IMAGE_PLACEHOLDER;

  // Representative row for RoomCard (strip image fields so RoomCard doesn’t double-render)
  const { image_url: _iu, image_urls: _ius, images: _imgs, ...repForCard } = (a.rep ?? {}) as any;

  groups.push({
    key: a.key,
    room_type: a.type,
    room_label: a.label ?? null,
    materials_total_with_vat_gbp: a.mat ?? undefined,
    materials_total_gbp: a.mat ?? undefined,
    labour_total_gbp: a.lab ?? undefined,
    room_total_with_vat_gbp: a.tot ?? undefined,
    room_total_gbp: a.tot ?? undefined,
    confidence: a.confidence ?? null,
    images: gallery,                 // URLs only
    primaryImage: primary,           // URL or placeholder
    rep: repForCard as RefurbRoom,
    mergedCount: a.mergedCount,
    mapped: a.mapped,                // <-- NEW: carry mapped flag forward
  });
}

// --- SUPPRESS GENERIC "type::" CARDS WHEN SPECIFIC LABEL/ID CARDS EXIST ---
// Determine which types have at least one floorplan-mapped card
const hasMappedByType = new Set(
  groups.filter(g => g.mapped === true).map(g => g.room_type)
);

// Drop any UNMAPPED card for a type that already has a MAPPED card
const cleaned = groups.filter(g => !(g.mapped === false && hasMappedByType.has(g.room_type)));


return cleaned;
}


// === derive groupedRooms using enhanced image & cost resolution ===
const groupedRooms: GroupedRoom[] = useMemo(() => {
  if (!data?.property) return [];

  const logicalRooms = new Map<string, GroupedRoom>();

  // Process room_totals first (authoritative floorplan data)
  (data.property.room_totals || []).forEach((total: any) => {
    if (isOverheadsOrTotalsRow(total)) return;

    const roomType = normaliseType(total.type || total.room_type || 'other');
    const roomName = total.room_name || '';
    const key = `${roomType}::${roomName.toLowerCase()}`;

    const images = resolveRoomImages(roomName, roomType, data.property);
    const costs = aggregateRoomCosts(roomName, roomType, data.refurb_estimates || [], data.property.room_totals || []);

    // Create representative room for RoomCard
    const rep: RefurbRoom = {
      id: `room-${key}`,
      room_type: roomType,
      detected_room_type: roomType,
      room_label: roomName,
      materials: null,
      labour: null,
      materials_total_gbp: costs.materialsWithVat,
      materials_total_with_vat_gbp: costs.materialsWithVat,
      labour_total_gbp: costs.labour,
      room_total_gbp: costs.totalWithVat,
      room_total_with_vat_gbp: costs.totalWithVat,
    };

    logicalRooms.set(key, {
      key,
      room_type: roomType,
      room_label: roomName,
      materials_total_with_vat_gbp: costs.materialsWithVat,
      materials_total_gbp: costs.materialsWithVat,
      labour_total_gbp: costs.labour,
      room_total_with_vat_gbp: costs.totalWithVat,
      room_total_gbp: costs.totalWithVat,
      confidence: null,
      images,
      primaryImage: images[0] || NO_IMAGE_PLACEHOLDER,
      rep,
      mergedCount: 1,
      mapped: isFloorplanMapped(total, roomType)
    });
  });

  // Process refurb_estimates to fill gaps
  (data.refurb_estimates || []).forEach((est: any) => {
    const roomType = normaliseType(est.room_type || est.detected_room_type || 'other');
    const roomName = est.room_label || extractLabelFromAny(est) || '';
    const key = roomName ? `${roomType}::${roomName.toLowerCase()}` : `${roomType}::`;

    if (!logicalRooms.has(key)) {
      const images = resolveRoomImages(roomName, roomType, data.property);

      // Add estimate's own image if available
      if (est.image_url && !images.includes(est.image_url)) {
        images.push(est.image_url);
      }
      if (est.image_id && data.property.images_map?.[est.image_id]) {
        const url = data.property.images_map[est.image_id];
        if (!images.includes(url)) images.push(url);
      }

      const costs = aggregateRoomCosts(roomName, roomType, data.refurb_estimates || [], data.property.room_totals || []);

      // Create representative room for RoomCard
      const rep: RefurbRoom = {
        id: `room-${key}`,
        room_type: roomType,
        detected_room_type: roomType,
        room_label: roomName || null,
        materials: est.materials || null,
        labour: est.labour || null,
        materials_total_gbp: costs.materialsWithVat,
        materials_total_with_vat_gbp: costs.materialsWithVat,
        labour_total_gbp: costs.labour,
        room_total_gbp: costs.totalWithVat,
        room_total_with_vat_gbp: costs.totalWithVat,
      };

      logicalRooms.set(key, {
        key,
        room_type: roomType,
        room_label: roomName || null,
        materials_total_with_vat_gbp: costs.materialsWithVat,
        materials_total_gbp: costs.materialsWithVat,
        labour_total_gbp: costs.labour,
        room_total_with_vat_gbp: costs.totalWithVat,
        room_total_gbp: costs.totalWithVat,
        confidence: est.confidence || null,
        images,
        primaryImage: images[0] || NO_IMAGE_PLACEHOLDER,
        rep,
        mergedCount: 1,
        mapped: isFloorplanMapped(est, roomType)
      });
    }
  });

  // Convert to array and apply existing filters/sorting
  let list = Array.from(logicalRooms.values())
    .filter(g => !UNWANTED_TYPES.has(g.room_type));

  // Apply existing filters
  if (filterType !== 'All') {
    list = list.filter((g) => titleize(g.room_type) === filterType);
  }

  list = list.filter((g) =>
    typeof g.confidence === 'number'
      ? Math.round(g.confidence * 100) >= minConfidence
      : true
  );

  // Apply sorting (keep existing logic)
  list = [...list].sort((a, b) => {
    if (sortKey === 'total_desc')
      return (b.room_total_with_vat_gbp || 0) - (a.room_total_with_vat_gbp || 0);
    if (sortKey === 'total_asc')
      return (a.room_total_with_vat_gbp || 0) - (b.room_total_with_vat_gbp || 0);
    if (sortKey === 'room_order') {
      const order = ['kitchen', 'bathroom', 'living_room', 'bedroom', 'hallway', 'exterior', 'facade', 'garden'];
      const ia = order.findIndex((k) => a.room_type.includes(k));
      const ib = order.findIndex((k) => b.room_type.includes(k));
      const orderDiff = (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return orderDiff !== 0 ? orderDiff : a.key.localeCompare(b.key);
    }
    return a.key.localeCompare(b.key);
  });

  return list;
}, [data?.property, data?.refurb_estimates, filterType, sortKey, minConfidence]);

// === roomTypes for the filter dropdown (unchanged logic) ===
const roomTypes = useMemo(() => {
  const set = new Set<string>();
  groupedRooms.forEach((g) => set.add(titleize(g.room_type)));
  return ['All', ...Array.from(set).sort()];
}, [groupedRooms]);

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
    if (safe == null) return <div className="text-slate-500 text-sm">No data.</div>;
    if (Array.isArray(safe)) {
      return (
        <div className="space-y-2">
          {safe.map((row, i) => (
            <div key={i} className="rounded border p-2">
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
    return <div className="text-xs font-mono text-slate-700 break-all">{String(safe)}</div>;
  };

  /* ---------- UI ---------- */
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
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); loadDemoRun((demoRunId || '').trim()); }}
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
          <Section title="Property Overview" desc="Core listing facts and quick KPIs. Links and key documents are provided on the right.">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: facts */}
              <div className="lg:col-span-2 space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">{data.property?.property_title || 'Untitled property'}</h2>
                <p className="text-slate-700">
                  {data.property?.address}{data.property?.postcode ? `, ${data.property.postcode}` : ''}
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

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {tops.map((k) => (<KPI key={k.label} label={k.label} value={k.value} subtitle={k.subtitle} />))}
                </div>

                {/* Floorplan gallery */}
                {floorplans.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Floorplans</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {floorplans.slice(0, 6).map((src, i) => (
                        <div key={i} className="rounded-lg border overflow-hidden bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Floorplan ${i + 1}`} className="w-full h-44 object-contain bg-white" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2">
                  {/* Keep a single overview feedback if needed */}
                  <FeedbackBar runId={runIdRef.current} propertyId={data.property_id} module="financials" targetKey="overview" compact />
                </div>
              </div>

              {/* Right: media + links */}
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border">
                  {data.property?.listing_images?.[0]
                    ? (<img src={data.property.listing_images[0]} alt="Property" className="w-full h-48 object-cover" loading="lazy" />)
                    : (<div className="w-full h-48 flex items-center justify-center text-slate-500">No image</div>)}
                </div>

                <div className="text-sm space-y-1">
                  <div>
                    <strong>Displayed Price:</strong>{' '}
                    {money0(
                      data.property?.purchase_price_gbp ??
                      data.property?.guide_price_gbp ??
                      data.property?.asking_price_gbp ??
                      data.property?.display_price_gbp
                    )}{' '}
                    <span className="text-slate-500">({data.property?.price_label || 'price'})</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="mr-3">Guide: {money0(data.property?.guide_price_gbp)}</span>
                    <span className="mr-3">Purchase: {money0(data.property?.purchase_price_gbp)}</span>
                    <span>Asking: {money0(data.property?.asking_price_gbp)}</span>
                  </div>
                </div>

                {/* Links & documents */}
                <div className="rounded-lg border p-3">
                  <h4 className="text-sm font-medium mb-2 text-slate-700">Links & Documents</h4>
                  <div className="flex flex-col gap-2">
                    {data.property?.listing_url ? (
                      <a className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-slate-50" href={data.property.listing_url} target="_blank" rel="noreferrer">View Listing</a>
                    ) : <span className="text-slate-500">No listing URL</span>}
                    {data.property?.preview_url_investor_pack && (
                      <a className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700" href={data.property.preview_url_investor_pack} target="_blank" rel="noopener noreferrer">Investor Pack (PDF)</a>
                    )}
                    {data.property?.preview_url_builders_quote && (
                      <a className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-slate-50" href={data.property.preview_url_builders_quote} target="_blank" rel="noopener noreferrer">Builder’s Quote (PDF)</a>
                    )}
                    {data.property?.brochure_urls?.[0] && (
                      <a className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-slate-50" href={data.property.brochure_urls[0]} target="_blank" rel="noopener noreferrer">Agent Brochure</a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Investor metrics headline */}
          <Section
            title="Investor Metrics"
            desc="Backend-calculated metrics are authoritative. Sliders model sensitivities only. Yield on Cost uses stabilised rent and all-in project costs. DSCR shows month-one headroom post-refi."
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KPI label="Yield on cost" value={period?.yield_on_cost_percent != null ? `${Number(period.yield_on_cost_percent).toFixed(2)}%` : '—'} subtitle="At stabilised reference" />
              <KPI label="DSCR (Month-1)" value={exitRefi?.dscr_month1 != null ? exitRefi.dscr_month1.toFixed(2) : '—'} />
              <KPI label="Sell: Net profit" value={exitSell?.net_profit_gbp != null ? money0(exitSell.net_profit_gbp) : '—'} />
              <KPI label="Sell: ROI" value={exitSell?.roi_percent != null ? `${Number(exitSell.roi_percent).toFixed(2)}%` : '—'} />
              <KPI label="Refi: Cash left in" value={exitRefi?.net_cash_left_in_after_refi_gbp != null ? money0(exitRefi.net_cash_left_in_after_refi_gbp) : '—'} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6">
              <DSCRGauge value={n(exitRefi?.dscr_month1)} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KPI label="Rent (modelled/mo)" value={money0((data.financials as any)?.monthly_rent_gbp)} big={false} />
                <KPI label="Stabilised NOI (annual)" value={period?.rent_collected_gbp != null ? money0(period.rent_collected_gbp) : '—'} big={false} />
                <KPI label="Total cash in (period)" value={period?.total_cash_in_gbp != null ? money0(period.total_cash_in_gbp) : '—'} big={false} />
                <KPI
                  label="ROI (period / annualised)"
                  value={
                    period?.roi_period_percent != null
                      ? `${Number(period.roi_period_percent).toFixed(1)}% / ${Number(period.roi_annualised_percent ?? 0).toFixed(1)}%`
                      : '—'
                  }
                  big={false}
                />
              </div>
            </div>
          </Section>

          {/* Refurbishment */}
          <Section
            title="Refurbishment Estimates"
            desc="Rooms are grouped (materials + labour merged) and tagged by floorplan labels (e.g., Bedroom 1). If a room has costs but no photos, we show a clear placeholder. Extra photos appear as a small gallery."
            right={
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <label className="text-xs text-slate-600">Filter:</label>
                <select className="text-sm border rounded-md px-2 py-1" value={filterType} onChange={(e) => setFilterType(e.target.value)}> 
                  {roomTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>

                <label className="text-xs text-slate-600 ml-2">Sort:</label>
                <select className="text-sm border rounded-md px-2 py-1" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
                  <option value="room_order">Room order (logical)</option>
                  <option value="total_desc">Total (high → low)</option>
                  <option value="total_asc">Total (low → high)</option>
                  <option value="room_asc">Room (A → Z)</option>
                </select>

                <label className="text-xs text-slate-600 ml-2">Min confidence:</label>
                <input type="range" min={0} max={100} step={5} value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))} className="w-28" title={`${minConfidence}%`} />
                <span className="text-xs text-slate-600 w-10 text-right">{minConfidence}%</span>
              </div>
            }
          >
            {/* Programme note */}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 mb-3">
              <strong>Programme note:</strong> Works duration is tracked in Scenarios → <em>Period Snapshot</em>.
              {period?.months_refurb != null ? <> Current assumption: <strong>{Number(period.months_refurb)} months</strong>.</> : ' If not shown, the backend hasn’t provided a refurb duration for this run.'}
            </div>

            {/* Cards (grouped) */}
            {groupedRooms.length ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {groupedRooms.map((g, idx) => {
                    // We’ll pass a representative room to RoomCard but decorate the header + gallery here.
                    const title = prettyRoomNameFromKey(g.key);
                    const conf = typeof g.confidence === 'number' ? Math.round(g.confidence * 100) : null;
                    // strip media fields so RoomCard doesn't render another image block
                    const { image_url: _iu, image_urls: _ius, images: _imgs, ...repForCard } = (g.rep as any);


                    return (
                      <div key={g.key ?? idx} className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
                        {/* Top media: primary + thumbs */}
                        {/* Top media: single image + tiny arrows */}
<div className="p-3 border-b border-slate-100">
  <Carousel images={[g.primaryImage, ...g.images.slice(1)]} title={title} />
  {g.primaryImage === NO_IMAGE_PLACEHOLDER && (
    <div className="mt-2 text-center text-xs text-slate-500">
      Room costs estimated from analysis signals
    </div>
  )}
</div>


                        {/* Title + tag row */}
                        <div className="px-4 pt-3 pb-2 flex items-start justify-between">
                          <div className="text-base font-semibold text-slate-900 leading-tight">{title}</div>
                          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                            {g.room_label && <Badge tone="slate">{g.room_label}</Badge>}
                            {conf != null && <Badge tone={conf >= 80 ? 'green' : conf >= 50 ? 'amber' : 'red'}>{conf}%</Badge>}
                          </div>
                        </div>

                        {/* Body: totals + existing RoomCard breakdown (keeps your per-item UI) */}
                        <div className="px-4 pb-4">
                          <div className="mb-3 grid grid-cols-3 gap-3 text-xs">
                            <div className="rounded-lg border border-emerald-200 p-3 bg-emerald-50/50">
                              <div className="text-emerald-700 font-medium">Materials</div>
                              <div className="font-semibold text-emerald-900 mt-1">{money0(g.materials_total_with_vat_gbp ?? g.materials_total_gbp)}</div>
                            </div>
                            <div className="rounded-lg border border-purple-200 p-3 bg-purple-50/50">
                              <div className="text-purple-700 font-medium">Labour</div>
                              <div className="font-semibold text-purple-900 mt-1">{money0(g.labour_total_gbp)}</div>
                            </div>
                            <div className="rounded-lg border border-blue-200 p-3 bg-blue-50/50">
                              <div className="text-blue-700 font-medium">Total</div>
                              <div className="font-semibold text-blue-900 mt-1">{money0(g.room_total_with_vat_gbp ?? g.room_total_gbp)}</div>
                            </div>
                          </div>

                          {/* Keep your existing breakdown component for consistency */}

                          <RoomCard
  key={g.key}
  showImage={false}
  room={{
    ...repForCard,
    materials_total_with_vat_gbp: g.materials_total_with_vat_gbp ?? g.materials_total_gbp,
    labour_total_gbp: g.labour_total_gbp,
    room_total_with_vat_gbp: g.room_total_with_vat_gbp ?? g.room_total_gbp,
    room_label: g.room_label ?? undefined,
  } as any}
  runId={runIdRef.current}
  propertyId={data?.property_id}
/>



                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rollup strip */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <KPI label="Rooms total (incl. VAT)" value={money0(rollup.rooms_total_with_vat)} subtitle={rollup.rooms_total_without_vat ? `ex-VAT ${money0(rollup.rooms_total_without_vat)}` : undefined} />
                  <KPI label="Whole-house overheads" value={rollup.overheads_with_vat != null ? money0(rollup.overheads_with_vat) : '—'} subtitle={rollup.overheads_without_vat != null ? `ex-VAT ${money0(rollup.overheads_without_vat)}` : undefined} />
                  <KPI label="EPC works" value={rollup.epc_total_with_vat != null ? money0(rollup.epc_total_with_vat) : '—'} subtitle={rollup.epc_total_without_vat != null ? `ex-VAT ${money0(rollup.epc_total_without_vat)}` : undefined} />
                  <KPI
                    label="Grand refurb (incl. VAT)"
                    value={rollup.property_total_with_vat != null ? money0(rollup.property_total_with_vat) : money0((rollup.rooms_total_with_vat ?? 0) + nz(rollup.overheads_with_vat) + nz(rollup.epc_total_with_vat))}
                    subtitle={rollup.property_total_without_vat != null ? `ex-VAT ${money0(rollup.property_total_without_vat)}` : undefined}
                  />
                  <KPI label="V2 fallback (incl. VAT)" value={rollup.v2_total_with_vat_fallback ? money0(rollup.v2_total_with_vat_fallback) : '—'} subtitle="Displayed when project rollup is missing" />
                </div>

                {/* Totals table (from original rows; optional to keep) */}
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
                      {groupedRooms.map((g, i) => {
                        const conf = typeof g.confidence === 'number' ? Math.round(g.confidence * 100) : null;
                        return (
                          <tr key={g.key ?? `row-${i}`} className="border-t">
                            <td className="p-2 capitalize">{prettyRoomNameFromKey(g.key)}</td>
                            <td className="p-2 text-right">{money0(g.materials_total_with_vat_gbp ?? g.materials_total_gbp)}</td>
                            <td className="p-2 text-right">{money0(g.labour_total_gbp)}</td>
                            <td className="p-2 text-right font-semibold">{money0(g.room_total_with_vat_gbp ?? g.room_total_gbp)}</td>
                            <td className="p-2 text-right">{conf != null ? `${conf}%` : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-slate-50">
                        <td className="p-2 text-right font-medium">Totals</td>
                        <td className="p-2 text-right font-medium">
                          {money0(groupedRooms.reduce((a, r) => a + toInt(r.materials_total_with_vat_gbp ?? r.materials_total_gbp), 0))}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {money0(groupedRooms.reduce((a, r) => a + toInt(r.labour_total_gbp), 0))}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {money0(groupedRooms.reduce((a, r) => a + toInt(r.room_total_with_vat_gbp ?? r.room_total_gbp), 0))}
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
                  <p className="text-sm mt-1">Materials rows: <strong>{data.refurb_debug.materials_count ?? 0}</strong> · Labour rows: <strong>{data.refurb_debug.labour_count ?? 0}</strong></p>
                )}
              </div>
            )}
          </Section>

          {/* Rent estimate feedback */}
          <Section title="Rent Estimate" desc="Modelled view based on local comps and normalised assumptions. Use feedback to correct the model if this looks off.">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Modelled rent: <strong>{money0((data.financials as any)?.monthly_rent_gbp)}</strong> / month</div>
              {showRentFeedback && <FeedbackBar runId={runIdRef.current} propertyId={data.property_id} module="rent" />}
            </div>
            {data.property?.rent_rationale && (
              <div className="mt-3 text-xs text-slate-600"><strong>Model notes:</strong> {data.property.rent_rationale}</div>
            )}
          </Section>

          {/* EPC + fabric and services */}
          <Section
            title="EPC & Fabric"
            desc="Fabric & systems snapshot from EPC and listing cues. EPC budget sits in Refurb rollup."
            right={epcImageUrl ? (
              <div className="hidden md:block rounded-md overflow-hidden border ml-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={epcImageUrl} alt="EPC certificate" className="w-36 h-24 object-contain bg-white" />
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
                  {epcImageUrl && (
                    <div className="mb-3 md:hidden">
                      {/* Mobile EPC image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={epcImageUrl} alt="EPC certificate" className="w-40 h-28 object-contain border rounded bg-white" />
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
            <div className="mt-3">
              {showEpcFeedback && <FeedbackBar runId={runIdRef.current} propertyId={data.property_id} module="epc" />}
            </div>
          </Section>

          {/* Financial sliders + backend-calculated tables */}
          <Section
            title="Financial Summary"
            desc="Tweak core assumptions to see directional impact. Backend snapshot remains the source of truth."
            right={data.pdf_url ? (
              <a href={`/api/pdf-proxy?url=${encodeURIComponent(data.pdf_url)}`} target="_blank" rel="noopener noreferrer" className="text-sm inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-slate-50">
                Download PDF
              </a>
            ) : null}
          >
            <div className="mb-4">
              <FinancialSliders
                priceGBP={basePrice}
                refurbTotalGBP={rollup.property_total_with_vat ?? baseRefurb}
                rentMonthlyGBP={baseRent}
                defaults={{}}
                onChange={(a, d) => {
                  setSlAssumptions(a);
                  setSlDerived(d);
                  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('metrics:refresh'));
                }}
              />
              <div className="mt-2 flex items-center gap-3">
                {/* SINGLE feedback bar only (no duplicate thumbs in this section) */}
                <FeedbackBar runId={runIdRef.current} propertyId={data.property_id} module="financials" targetKey="summary" compact />
              </div>
            </div>

            {/* Backend snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Period snapshot */}
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">Period Snapshot</h4>
                <p className="text-xs text-slate-600 mb-2">
                  Captures the project set-up phase: cash in, rent collected during bridge, and resulting yield/ROI.
                </p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <dt className="text-slate-600">Months: refurb / rented / bridge</dt>
                  <dd className="text-right">{period ? `${period.months_refurb} / ${period.months_rented} / ${period.months_on_bridge}` : '—'}</dd>
                  <dt className="text-slate-600">Total cash in</dt>
                  <dd className="text-right">{period ? money0(period.total_cash_in_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Rent collected</dt>
                  <dd className="text-right">{period ? money0(period.rent_collected_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Cashflow (period)</dt>
                  <dd className="text-right">{period ? money0(period.period_cashflow_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Yield on cost</dt>
                  <dd className="text-right">{period?.yield_on_cost_percent != null ? `${Number(period.yield_on_cost_percent).toFixed(2)}%` : '—'}</dd>
                  <dt className="text-slate-600">ROI (period / annualised)</dt>
                  <dd className="text-right">{period?.roi_period_percent != null ? `${Number(period.roi_period_percent).toFixed(2)}% / ${Number(period.roi_annualised_percent ?? 0).toFixed(2)}%` : '—'}</dd>
                </dl>
              </div>

              {/* Exit — Sell */}
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">Exit: Sell</h4>
                <p className="text-xs text-slate-600 mb-2">
                  Assumes sale at stabilisation. ROI reflects cash invested vs net sale proceeds after costs.
                </p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <dt className="text-slate-600">Sale price</dt>
                  <dd className="text-right">{exitSell ? money0(exitSell.sale_price_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Selling costs</dt>
                  <dd className="text-right">{exitSell ? money0(exitSell.selling_costs_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Repay bridge</dt>
                  <dd className="text-right">{exitSell ? money0(exitSell.repay_bridge_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Net profit</dt>
                  <dd className="text-right">{exitSell ? money0(exitSell.net_profit_gbp) : '—'}</dd>
                  <dt className="text-slate-600">ROI</dt>
                  <dd className="text-right">{exitSell?.roi_percent != null ? `${Number(exitSell.roi_percent).toFixed(2)}%` : '—'}</dd>
                </dl>
              </div>

              {/* Exit — Refi 24m */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Exit: Refi (24m)</h4>
                  {exitRefi?.dscr_month1 != null && (
                    <Badge tone={exitRefi.dscr_month1 >= 1.25 ? 'green' : exitRefi.dscr_month1 >= 1.0 ? 'amber' : 'red'}>
                      {exitRefi.dscr_month1 >= 1.25 ? 'Lender-friendly' : exitRefi.dscr_month1 >= 1.0 ? 'Tight' : 'Below 1.0'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 mb-2">
                  Shows leverage and cash left in after refinance. DSCR month-one gauges headroom against interest + opex at the new mortgage.
                </p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <dt className="text-slate-600">Refi value</dt>
                  <dd className="text-right">{exitRefi ? money0(exitRefi.refi_value_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Final BTL loan</dt>
                  <dd className="text-right">{exitRefi ? money0(exitRefi.final_btl_loan_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Cash from refi after repay</dt>
                  <dd className="text-right">{exitRefi ? money0(exitRefi.cash_from_refi_after_repay_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Net cash left in</dt>
                  <dd className="text-right">{exitRefi ? money0(exitRefi.net_cash_left_in_after_refi_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Tot. 24m net cashflow</dt>
                  <dd className="text-right">{exitRefi ? money0(exitRefi.net_cashflow_24m_gbp) : '—'}</dd>
                  <dt className="text-slate-600">Cash-on-Cash (24m)</dt>
                  <dd className="text-right">{exitRefi?.roi_cash_on_cash_percent_24m != null ? `${Number(exitRefi.roi_cash_on_cash_percent_24m).toFixed(2)}%` : '—'}</dd>
                  <dt className="text-slate-600">DSCR (Month-1)</dt>
                  <dd className="text-right">{exitRefi?.dscr_month1 != null ? exitRefi.dscr_month1.toFixed(2) : '—'}</dd>
                </dl>

                {/* Mini bars if we have a totals object in scenarios */}
                {isPlainObject(tryParseJSON(scenarios?.exit_refi_24m?.totals_24m)) && (() => {
                  const t = tryParseJSON(scenarios.exit_refi_24m.totals_24m) as any;
                  const items = [
                    { label: 'Rent',     value: Number(t.rent_gbp ?? 0),     fmt: 'money' as const },
                    { label: 'Opex',     value: Number(t.opex_gbp ?? 0),     fmt: 'money' as const },
                    { label: 'Interest', value: Number(t.mortgage_interest_gbp ?? 0), fmt: 'money' as const },
                    { label: 'Net',      value: Number(t.net_cashflow_gbp ?? 0), fmt: 'money' as const },
                  ];
                  return <div className="mt-3"><MiniBars items={items} /></div>;
                })()}
              </div>
            </div>
          </Section>

          {/* Report preview */}
          {data.pdf_url && (
            <Section title="Report Preview" desc="Inline PDF viewer for the investor pack.">
              <PDFViewer pdfUrl={`/api/pdf-proxy?url=${encodeURIComponent(data.pdf_url)}`} />
            </Section>
          )}

          {/* Scenarios (backend) — PRO console */}
          {(scenarios?.inputs || scenarios?.exit_sell || scenarios?.exit_refi_24m || scenarios?.period_no_refi) && (
            <Section
              title="Scenarios (backend)"
              desc="Inputs feed two exit paths: a sale at stabilisation or a 24-month refinance. Each value is parsed from backend output. Click “Details” to expand embedded objects (e.g., fee breakdowns)."
            >
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900 mb-3">
                <strong>How to read this:</strong> <em>Inputs</em> are the starting assumptions (price, rent, opex). <em>Exit: Sell</em> shows a disposal case—use Net Profit and ROI to compare flips. <em>Exit: Refi</em> emphasises <strong>Net Cash Left In</strong> and <strong>DSCR</strong> for long-term holds. <em>Period (no refi)</em> shows bridge-phase cashflows when you don’t refinance.
              </div>
              <ScenariosTabs scenarios={scenarios} ScenarioKV={ScenarioKV} />
            </Section>
          )}

          {/* Debug drawer */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <button className="text-sm rounded-md border px-3 py-1.5 hover:bg-slate-50" onClick={() => setShowDebug((s) => !s)}>
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
            {showDebug && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <pre className="bg-slate-50 p-3 rounded border overflow-auto"><code>{JSON.stringify({ status, run: data?.run }, null, 2)}</code></pre>
                <pre className="bg-slate-50 p-3 rounded border overflow-auto"><code>{JSON.stringify({ property: data?.property, financials: data?.financials }, null, 2)}</code></pre>
                <pre className="bg-slate-50 p-3 rounded border overflow-auto md:col-span-2"><code>{JSON.stringify({ refurb_estimates: data?.refurb_estimates }, null, 2)}</code></pre>
              </div>
            )}
          </section>
        </div>
      )}
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
        <dt className="text-slate-600 capitalize">{prettifyKey(k)}</dt>
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
                  <div key={i} className="rounded border p-2">
                    {isPlainObject(row) ? (
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        {Object.entries(row).map(([kk, vv]) => (
                          <FragmentKV key={kk} k={kk} v={vv} formatCell={formatCell} prettifyKey={prettifyKey} />
                        ))}
                      </dl>
                    ) : <pre className="text-xs font-mono break-all">{String(row)}</pre>}
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
      <dt className="text-slate-600 capitalize">{prettifyKey(k)}</dt>
      <dd className="text-right">{formatCell(k, parsed)}</dd>
    </>
  );
}

function DetailsDrawer({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-right">
      <button onClick={() => setOpen((s) => !s)} className="text-xs rounded-md border px-2 py-1 hover:bg-slate-50">
        {open ? 'Hide' : label}
      </button>
      {open && <div className="mt-2 text-left">{children}</div>}
    </div>
  );
}

function ScenariosTabs({ scenarios, ScenarioKV }: { scenarios: any; ScenarioKV: ({ obj }: { obj: any }) => React.ReactElement }) {
  const [tab, setTab] = useState<'inputs'|'sell'|'refi'|'period'>('inputs');
  const TabBtn = ({ id, children }: { id: typeof tab; children: React.ReactNode }) => (
    <button
      onClick={() => setTab(id)}
      className={classNames(
        'px-3 py-1.5 rounded-md text-sm border',
        tab === id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50'
      )}
    >
      {children}
    </button>
  );

  // normalise nested objects/strings
  const inputs  = tryParseJSON(scenarios?.inputs);
  const sell    = tryParseJSON(scenarios?.exit_sell);
  const refi    = tryParseJSON(scenarios?.exit_refi_24m);
  const period  = tryParseJSON(scenarios?.period_no_refi);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <TabBtn id="inputs">Inputs</TabBtn>
        <TabBtn id="sell">Exit: Sell</TabBtn>
        <TabBtn id="refi">Exit: Refi (24m)</TabBtn>
        <TabBtn id="period">Period (no refi)</TabBtn>
      </div>

      <div className="rounded-lg border p-4 bg-white">
        {tab === 'inputs' && (
          <>
            <p className="text-sm text-slate-600 mb-3">Assumptions used to drive the scenarios below. Adjust in sliders to test sensitivities.</p>
            <ScenarioKV obj={inputs} />
          </>
        )}
        {tab === 'sell' && (
          <>
            <p className="text-sm text-slate-600 mb-3">Disposal economics assuming sale at stabilisation. Useful for flip comparisons.</p>
            <ScenarioKV obj={sell} />
          </>
        )}
        {tab === 'refi' && (
          <>
            <p className="text-sm text-slate-600 mb-3">Refinance outcome after ~24 months of operations. Key: DSCR, loan size, and cash left in.</p>
            <ScenarioKV obj={refi} />
          </>
        )}
        {tab === 'period' && (
          <>
            <p className="text-sm text-slate-600 mb-3">If no refinance occurs, this shows bridge facility, works phase, and operations during bridge.</p>
            {isPlainObject(period) ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h5 className="font-medium mb-1">Bridge</h5>
                  <ScenarioKV obj={(period as any).bridge} />
                </div>
                <div>
                  <h5 className="font-medium mb-1">Works phase</h5>
                  <ScenarioKV obj={(period as any).works_phase} />
                </div>
                <div>
                  <h5 className="font-medium mb-1">Operations during bridge</h5>
                  <ScenarioKV obj={(period as any).operations_during_bridge} />
                </div>
              </div>
            ) : <ScenarioKV obj={period} />}
          </>
        )}
      </div>
    </div>
  );
}
