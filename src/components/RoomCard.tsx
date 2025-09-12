'use client';

import { useMemo, useState } from 'react';
import FeedbackBar from './FeedbackBar';

/* =========================
   Types (v2 + legacy)
========================= */
type MaterialLine = {
  job_line_id?: string | null;
  item_key?: string;
  unit?: string;
  qty?: number | string | null;
  unit_price_material_gbp?: number | string | null;
  subtotal_gbp?: number | string | null;
  waste_pct?: number | string | null;
  units_to_buy?: number | string | null;
  notes?: string | null;
  assumed_area_m2?: number | string | null;
  confidence?: number | string | null;
};

type LabourLine = {
  job_line_id?: string | null;
  trade_key?: string | null;
  total_hours?: number | string | null;
  crew_size?: number | string | null;
  hourly_rate_gbp?: number | string | null;
  labour_cost_gbp?: number | string | null;
  ai_confidence?: number | string | null;
  notes?: string | null;
};

type LegacyWork = {
  category: string;
  description?: string;
  unit?: string;
  qty?: number;
  unit_rate_gbp?: number;
  subtotal_gbp?: number;
};

export type RefurbRoom = {
  // Common
  id?: string;
  detected_room_type?: string | null;
  room_type?: string | null;

  // Image support (either direct URL or only an image_id/index)
  image_url?: string | null;
  image_id?: string | null;
  image_index?: number | null;

  // NEW model fields
  materials?: MaterialLine[] | string | null;
  labour?: LabourLine[] | string | null;
  materials_total_gbp?: number | string | null;
  labour_total_gbp?: number | string | null;
  room_total_gbp?: number | string | null;
  room_confidence?: number | string | null;

  // Legacy totals (kept for back-compat display)
  wallpaper_or_paint_gbp?: number | string | null;
  flooring_gbp?: number | string | null;
  plumbing_gbp?: number | string | null;
  electrics_gbp?: number | string | null;
  mould_or_damp_gbp?: number | string | null;
  structure_gbp?: number | string | null;

  // Legacy itemised works
  works?: LegacyWork[] | string | null;

  // Meta
  confidence?: number | null; // legacy
  assumptions?: Record<string, any> | null;
  risk_flags?: Record<string, boolean> | null;

  // Optional p70 fields (either at root or inside assumptions/totals)
  p70_total_low_gbp?: number | string | null;
  p70_total_high_gbp?: number | string | null;
  totals?: {
    p70_total_low_gbp?: number | string | null;
    p70_total_high_gbp?: number | string | null;
    estimated_total_gbp?: number | string | null;
  } | null;
};

/* =========================
   Helpers
========================= */
function toNum(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
function toInt(n: unknown): number {
  const v = Math.round(Number(n ?? 0));
  return Number.isFinite(v) ? v : 0;
}
function clamp01(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
function formatGBP(n?: number | string | null) {
  const v = typeof n === 'string' ? Number(n) : n;
  return Number.isFinite(v as number) ? `£${Math.round(v as number).toLocaleString()}` : '—';
}
function pct(n?: number | string | null) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `${Math.round(clamp01(v) * 100)}%`;
}
function parseArray<T = unknown>(x: T[] | string | null | undefined): T[] {
  if (Array.isArray(x)) return x;
  if (typeof x === 'string') {
    try {
      const j = JSON.parse(x);
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }
  return [];
}
const LABEL_MAP: Record<string, string> = {
  carpet_m2: 'Carpet',
  laminate_floor_m2: 'Laminate floor',
  vinyl_floor_m2: 'Vinyl floor',
  wood_floor_m2: 'Wood floor',
  tile_floor_m2: 'Tiled floor',
  wall_repaint_m2: 'Wall repaint',
  ceiling_repaint_m2: 'Ceiling repaint',
  stain_blocker_coat_m2: 'Stain blocker',
  wall_plaster_repair_m2: 'Wall plaster repair',
  ceiling_plaster_repair_m2: 'Ceiling plaster repair',
  pendant_replace_item: 'Pendant light (replace)',
  downlight_item: 'Downlight',
  socket_faceplate_replace_item: 'Socket faceplate (replace)',
  switch_faceplate_replace_item: 'Switch faceplate (replace)',
  radiator_repaint_item: 'Radiator (repaint)',
  radiator_replace_item: 'Radiator (replace)',
  trv_replace_item: 'TRV (replace)',
  curtain_pole_install_item: 'Curtain pole (install)',
  blind_install_item: 'Blind (install)',
  smoke_alarm_install_item: 'Smoke alarm (install)',
  extractor_fan_install_item: 'Extractor fan (install)',
  silicone_replace_lm: 'Silicone (replace)',
  levelling_compound_m2: 'Levelling compound',
  external_light_fitting_item: 'External light fitting',
  handrail_item: 'Handrail',
};
function labelForItemKey(k?: string) {
  if (!k) return 'item';
  const norm = k.toLowerCase().trim();
  if (LABEL_MAP[norm]) return LABEL_MAP[norm];
  return norm.replace(/_/g, ' ');
}

/* =========================
   Component
========================= */
export default function RoomCard({
  room,
  runId,
  propertyId,
}: {
  room: RefurbRoom;
  runId?: string | null;
  propertyId?: string | null;
}) {
  const [open, setOpen] = useState(false);

  // Signature so it’s easy to confirm live bundle in console
  console.log('RoomCard v3 (materials+labour) loaded');

  // Title & image
  const title = (room.detected_room_type || room.room_type || 'room').replace(/_/g, ' ');
  const img =
    typeof room.image_url === 'string' && room.image_url.trim()
      ? room.image_url
      : null; // no implicit storage URL guessing — safe placeholder if null

  // Risk flags (truthy only)
  const riskFlags = Object.entries(room.risk_flags || {}).filter(([, v]) => !!v);

  // Parse v2 arrays (robust to string payloads)
  const materials = useMemo<MaterialLine[]>(
    () => parseArray<MaterialLine>(room.materials),
    [room.materials]
  );
  const labour = useMemo<LabourLine[]>(
    () => parseArray<LabourLine>(room.labour),
    [room.labour]
  );

  // Legacy works (still displayed if present)
  const legacyWorks = useMemo<LegacyWork[]>(
    () => parseArray<LegacyWork>(room.works),
    [room.works]
  );

  // Totals (prefer v2 explicit totals, else compute, else legacy best-effort)
  const v2Mat = toInt(room.materials_total_gbp);
  const v2Lab = toInt(room.labour_total_gbp);
  const v2Room = toInt(room.room_total_gbp);

  const computedMat = materials.reduce((a, m) => a + toInt(m.subtotal_gbp), 0);
  const computedLab = labour.reduce((a, l) => a + toInt(l.labour_cost_gbp), 0);
  const computedRoom = computedMat + computedLab;

  const legacyCats =
    toInt(room.wallpaper_or_paint_gbp) +
    toInt(room.flooring_gbp) +
    toInt(room.plumbing_gbp) +
    toInt(room.electrics_gbp) +
    toInt(room.mould_or_damp_gbp) +
    toInt(room.structure_gbp);

  const legacyWorksSum = legacyWorks.reduce((a, w) => a + toInt(w.subtotal_gbp), 0);

  const materialsTotal = v2Mat || computedMat || 0;
  const labourTotal = v2Lab || computedLab || 0;
  const total =
    v2Room || computedRoom || Math.max(legacyCats, legacyWorksSum, toInt(room.estimated_total_gbp));

  // “Other” = any gap vs legacy 6-category sum (purely informational)
  const other = Math.max(0, total - legacyCats);

  // Confidence (prefer v2 room_confidence, else legacy confidence)
  const conf =
    room.room_confidence != null
      ? clamp01(room.room_confidence)
      : room.confidence != null
      ? clamp01(room.confidence)
      : null;

  // Early exit: hide zero rows (keeps grid clean)
  if (!total || total <= 0) return null;

  // Optional p70 range (wherever it appears)
  const p70Low =
    room.p70_total_low_gbp ??
    room.totals?.p70_total_low_gbp ??
    room.assumptions?.p70_total_low_gbp ??
    null;
  const p70High =
    room.p70_total_high_gbp ??
    room.totals?.p70_total_high_gbp ??
    room.assumptions?.p70_total_high_gbp ??
    null;

  return (
    <div className="group rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative w-full aspect-[16/9] bg-slate-100 overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No image
          </div>
        )}

        {/* Top-left: room name */}
        <div className="absolute top-2 left-2">
          <span className="inline-block text-[11px] tracking-wide uppercase bg-white/85 backdrop-blur px-2 py-1 rounded-full border border-slate-200 shadow-sm">
            {title}
          </span>
        </div>

        {/* Top-right: total */}
        <div className="absolute top-2 right-2">
          <span className="inline-block text-[11px] bg-black/70 text-white px-2 py-1 rounded-full shadow-sm">
            Total {formatGBP(total)}
          </span>
        </div>

        {/* Confidence bar */}
        {conf !== null && (
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="h-2 w-full bg-white/70 backdrop-blur rounded">
              <div
                className="h-2 rounded bg-blue-600 transition-[width] duration-500"
                style={{ width: `${Math.round(conf * 100)}%` }}
                aria-label={`Confidence ${pct(conf)}`}
                title={`Confidence ${pct(conf)}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Tags / chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {conf !== null && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
              Confidence {pct(conf)}
            </span>
          )}
          {materialsTotal > 0 && (
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
              Materials {formatGBP(materialsTotal)}
            </span>
          )}
          {labourTotal > 0 && (
            <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-full">
              Labour {formatGBP(labourTotal)}
            </span>
          )}
          {other > 0 && (
            <span
              className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-full"
              title="Items outside the six legacy categories"
            >
              Other {formatGBP(other)}
            </span>
          )}
          {riskFlags.map(([k]) => (
            <span
              key={k}
              className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full"
              title="Potential risk"
            >
              {k.replace(/_/g, ' ')}
            </span>
          ))}
          <span className="ml-auto text-[11px] text-slate-500" title="Regional cost basis">
            {room.assumptions?.location_basis || ''}
          </span>
        </div>

        {/* Legacy compact subtotals (only render if any > 0) */}
        {(legacyCats > 0) && (
          <div className="text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
            <div>Paint: {formatGBP(room.wallpaper_or_paint_gbp)}</div>
            <div>Floor: {formatGBP(room.flooring_gbp)}</div>
            <div>Plumbing: {formatGBP(room.plumbing_gbp)}</div>
            <div>Electrics: {formatGBP(room.electrics_gbp)}</div>
            <div>Damp/Mould: {formatGBP(room.mould_or_damp_gbp)}</div>
            <div>Structure: {formatGBP(room.structure_gbp)}</div>
          </div>
        )}

        {/* Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setOpen((x) => !x)}
            className="text-xs rounded-md border px-2 py-1 hover:bg-slate-50 transition-colors"
            aria-expanded={open}
            aria-label="Toggle more info"
            title={open ? 'Hide details' : 'More info'}
          >
            {open ? 'Hide details ▲' : 'More info ▼'}
          </button>
        </div>

        {/* Details */}
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
            open ? 'opacity-100 max-h-[1200px]' : 'opacity-0 max-h-0'
          }`}
        >
          <div className="mt-3 border-t pt-3 space-y-4">
            {/* Materials list (v2) */}
            {materials.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1">Materials</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {materials
                    .filter((m) => toInt(m.subtotal_gbp) > 0 || toNum(m.qty) > 0)
                    .map((m, i) => {
                      const label = labelForItemKey(m.item_key);
                      const qty = toNum(m.qty);
                      const unit = (m.unit || '').trim();
                      const unitRate = toNum(m.unit_price_material_gbp);
                      const subtotal = toInt(m.subtotal_gbp);
                      return (
                        <li key={m.job_line_id || i}>
                          <span className="capitalize font-medium">{label}</span>
                          {` • ${formatGBP(subtotal || unitRate * qty)}`}
                          {qty ? ` (x${qty}${unit ? ` ${unit}` : ''})` : ''}
                          {m.notes ? ` — ${m.notes}` : ''}
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}

            {/* Labour list (v2) */}
            {labour.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1">Labour</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {labour
                    .filter((l) => toInt(l.labour_cost_gbp) > 0 || (toNum(l.total_hours) > 0 && toNum(l.hourly_rate_gbp) > 0))
                    .map((l, i) => {
                      const hours = toNum(l.total_hours);
                      const crew = Math.max(1, toNum(l.crew_size) || 1);
                      const ph = hours * crew; // do not persist; shown only
                      const rate = toNum(l.hourly_rate_gbp);
                      const cost = toInt(l.labour_cost_gbp || ph * rate);
                      const trade = (l.trade_key || 'trade').toLowerCase();
                      return (
                        <li key={l.job_line_id || i}>
                          <span className="capitalize font-medium">{trade}</span>
                          {` • ${formatGBP(cost)}`}
                          {hours ? ` (${hours}h x ${crew}${crew > 1 ? ' people' : ' person'})` : ''}
                          {rate ? ` @ £${rate}/h` : ''}
                          {l.notes ? ` — ${l.notes}` : ''}
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}

            {/* Legacy works list (only if provided) */}
            {legacyWorks.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1">Itemised (legacy)</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {legacyWorks
                    .filter((w) => toInt(w.subtotal_gbp) > 0)
                    .map((w, i) => {
                      const cat = (w.category || '').toLowerCase();
                      return (
                        <li key={i}>
                          <span className="capitalize font-medium">{cat || 'item'}</span>
                          {` • ${formatGBP(w.subtotal_gbp)}`}
                          {w.description ? ` — ${w.description}` : ''}
                          {w.qty ? ` (x${w.qty}${w.unit ? ` ${w.unit}` : ''})` : ''}
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}

            {/* Footer actions / info */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              {img && (
                <a
                  href={img}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs rounded-md border px-2 py-1 hover:bg-slate-50"
                >
                  View image
                </a>
              )}
              {p70Low != null && p70High != null && (
                <span className="text-[11px] text-slate-600">
                  p70 range: {formatGBP(p70Low)} – {formatGBP(p70High)}
                </span>
              )}
            </div>

            {/* Per-room feedback */}
            <FeedbackBar
              runId={runId ?? null}
              propertyId={propertyId ?? null}
              module="refurb"
              targetId={room.id ?? null}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
