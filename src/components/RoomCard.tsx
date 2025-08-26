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

export default function RoomCard({ room }: { room: RefurbRow }) {
  const [open, setOpen] = useState(true);

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

  const title = room.detected_room_type || room.room_type || 'room';
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
  const other = Math.max(0, total - catSum); // shows when itemised includes categories beyond the six

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <div className="w-full aspect-[16/9] bg-slate-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-semibold capitalize truncate">{title}</h4>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {room.confidence != null && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  Confidence {Math.round((room.confidence ?? 0) * 100)}%
                </span>
              )}
              {riskFlags.map(([k]) => (
                <span
                  key={k}
                  className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full"
                  title="Potential risk"
                >
                  {k.replace(/_/g, ' ')}
                </span>
              ))}
              {other > 0 && (
                <span
                  className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full"
                  title="Itemised work includes costs outside the six base categories"
                >
                  Other {formatGBP(other)}
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-sm text-slate-700">
              <strong>Total:</strong> {formatGBP(total)}
            </div>
            <button
              type="button"
              onClick={() => setOpen((x) => !x)}
              className="mt-2 text-xs rounded-md border px-2 py-1 hover:bg-slate-50"
              aria-expanded={open}
              aria-label="Toggle details"
              title={open ? 'Hide details' : 'Show details'}
            >
              {open ? 'Hide details' : 'Show details'}
            </button>
          </div>
        </div>

        {/* Subtotals strip */}
        <div className="text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
          <div>Paint: {formatGBP(paint)}</div>
          <div>Floor: {formatGBP(floor)}</div>
          <div>Plumbing: {formatGBP(plumb)}</div>
          <div>Electrics: {formatGBP(elec)}</div>
          <div>Damp/Mould: {formatGBP(damp)}</div>
          <div>Structure: {formatGBP(struct)}</div>
        </div>

        {/* Itemised works (collapsible) */}
        {open && (
          <>
            {works.length > 0 ? (
              <ul className="text-sm list-disc pl-5 space-y-1">
                {works.map((w, i) => {
                  const cat = (w.category || '').toLowerCase();
                  return (
                    <li key={i}>
                      <span className="capitalize font-medium">{cat || 'item'}</span>
                      {` • ${formatGBP(w.subtotal_gbp)}`}
                      {w.description ? ` — ${w.description}` : ''}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">No itemised breakdown provided.</div>
            )}
          </>
        )}

        {/* Footer actions */}
        <div className="pt-2 flex items-center gap-2">
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
          {room.assumptions?.location_basis && (
            <span className="ml-auto text-[11px] text-slate-500" title="Regional cost basis">
              {room.assumptions.location_basis}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
