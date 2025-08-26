'use client';

import { useMemo, useState } from 'react';

type Work = {
  category: string;
  description?: string;
  unit?: string;
  qty?: number;
  unit_rate_gbp?: number;
  subtotal_gbp?: number;
};

export type RefurbRow = {
  id?: string;
  detected_room_type?: string;
  room_type?: string;
  image_url?: string | null;
  estimated_total_gbp?: number | string | null;

  wallpaper_or_paint_gbp?: number | string | null;
  flooring_gbp?: number | string | null;
  plumbing_gbp?: number | string | null;
  electrics_gbp?: number | string | null;
  mould_or_damp_gbp?: number | string | null;
  structure_gbp?: number | string | null;

  // NOTE: sometimes arrives as a JSON string; we’ll parse it
  works?: Work[] | string | null;

  confidence?: number | null;
  assumptions?: Record<string, any> | null;
  risk_flags?: Record<string, boolean> | null;
};

function formatGBP(n?: number | string | null) {
  const v = typeof n === 'string' ? Number(n) : n;
  return Number.isFinite(v as number) ? `£${Math.round(v as number).toLocaleString()}` : '—';
}
function toInt(n: unknown) {
  const v = Math.round(Number(n ?? 0));
  return Number.isFinite(v) && v > 0 ? v : 0;
}
function pct(n?: number | null) {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return '—';
  return `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`;
}

export default function RoomCard({ room }: { room: RefurbRow }) {
  const [open, setOpen] = useState(false);

  // Signature so we can confirm in console that this file is live
  console.log('RoomCard v2 loaded');

  // Parse works whether array or JSON string
  const works: Work[] = useMemo(() => {
    if (Array.isArray(room.works)) return room.works as Work[];
    if (typeof room.works === 'string') {
      try {
        const p = JSON.parse(room.works);
        return Array.isArray(p) ? (p as Work[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [room.works]);

  const title = (room.detected_room_type || room.room_type || 'room').replace(/_/g, ' ');
  const img =
    typeof room.image_url === 'string' && room.image_url.trim().length > 0
      ? room.image_url
      : null;

  // Risk flags (truthy only)
  const riskFlags = Object.entries(room.risk_flags || {}).filter(([, v]) => !!v);

  // Subtotals
  const paint = toInt(room.wallpaper_or_paint_gbp);
  const floor = toInt(room.flooring_gbp);
  const plumb = toInt(room.plumbing_gbp);
  const elec = toInt(room.electrics_gbp);
  const damp = toInt(room.mould_or_damp_gbp);
  const struct = toInt(room.structure_gbp);
  const catSum = paint + floor + plumb + elec + damp + struct;

  const worksSum = works.reduce((acc, w) => acc + toInt(w.subtotal_gbp), 0);
  const total = Math.max(toInt(room.estimated_total_gbp), catSum, worksSum);
  const other = Math.max(0, total - catSum);

  // Hide non-room/zero rows entirely
  if (!total || total <= 0) return null;

  const conf = typeof room.confidence === 'number' ? Math.max(0, Math.min(1, room.confidence)) : null;

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

        {/* Top-left chip: room */}
        <div className="absolute top-2 left-2">
          <span className="inline-block text-[11px] tracking-wide uppercase bg-white/85 backdrop-blur px-2 py-1 rounded-full border border-slate-200 shadow-sm">
            {title}
          </span>
        </div>

        {/* Top-right chip: total (with v2 label so we can see it live) */}
        <div className="absolute top-2 right-2">
          <span className="inline-block text-[11px] bg-black/70 text-white px-2 py-1 rounded-full shadow-sm">
            Total (v2) {formatGBP(total)}
          </span>
        </div>

        {/* Confidence bar (bottom overlay) */}
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
        {/* Tags row */}
        <div className="flex flex-wrap gap-2 text-xs">
          {conf !== null && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
              Confidence {pct(conf)}
            </span>
          )}
          {other > 0 && (
            <span
              className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-full"
              title="Itemised work includes costs outside the six base categories"
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

        {/* Compact subtotal strip */}
        <div className="text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
          <div>Paint: {formatGBP(paint)}</div>
          <div>Floor: {formatGBP(floor)}</div>
          <div>Plumbing: {formatGBP(plumb)}</div>
          <div>Electrics: {formatGBP(elec)}</div>
          <div>Damp/Mould: {formatGBP(damp)}</div>
          <div>Structure: {formatGBP(struct)}</div>
        </div>

        {/* Accordion toggle */}
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
            open ? 'opacity-100 max-h-[800px]' : 'opacity-0 max-h-0'
          }`}
        >
          <div className="mt-3 border-t pt-3">
            {works.length > 0 ? (
              <ul className="text-sm list-disc pl-5 space-y-1">
                {works
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
            ) : (
              <div className="text-sm text-slate-500">No itemised breakdown provided.</div>
            )}

            {/* Footer actions */}
            <div className="pt-3 flex items-center gap-2">
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
              {room.assumptions?.p70_total_low_gbp != null &&
                room.assumptions?.p70_total_high_gbp != null && (
                  <span className="text-[11px] text-slate-600">
                    p70 range: {formatGBP(room.assumptions.p70_total_low_gbp)} –{' '}
                    {formatGBP(room.assumptions.p70_total_high_gbp)}
                  </span>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
