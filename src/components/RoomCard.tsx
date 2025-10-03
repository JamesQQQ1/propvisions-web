'use client';

import { useMemo, useState } from 'react';
import FeedbackBar from './FeedbackBar';

/* =========================
   Types (v2, category/trade)
========================= */
export type MaterialCategory = {
  // category key, e.g. "cabinetry", "electrics", "tiling"
  item_key: string;
  // prefer gross if present; otherwise subtotal_gbp (gross) from API
  gross_gbp?: number | string | null;
  net_gbp?: number | string | null;
  vat_gbp?: number | string | null;
  subtotal_gbp?: number | string | null; // backwards compat (gross)
  lines?: number | null;
};

export type LabourTrade = {
  trade_key?: string | null;        // normalized key (optional)
  trade_name?: string | null;       // descriptive name
  total_hours?: number | string | null;
  crew_size?: number | string | null;
  hourly_rate_gbp?: number | string | null;
  labour_cost_gbp?: number | string | null; // total charge for this trade (for the room)
  ai_confidence?: number | string | null;
  notes?: string | null;
};

export type RefurbRoom = {
  id?: string;
  // room labels
  detected_room_type?: string | null;
  room_type?: string | null;

  // imagery
  image_url?: string | null;
  image_id?: string | null;
  image_index?: number | null;

  // v2 breakdown (already aggregated)
  materials?: MaterialCategory[] | string | null;
  labour?: LabourTrade[] | string | null;

  // v2 totals (prefer *_with_vat for UI)
  materials_total_with_vat_gbp?: number | string | null;
  materials_total_gbp?: number | string | null; // legacy name (gross)
  labour_total_gbp?: number | string | null;
  room_total_with_vat_gbp?: number | string | null;
  room_total_gbp?: number | string | null;      // legacy name (gross)
  room_confidence?: number | string | null;

  // optional p70s
  p70_total_low_gbp?: number | string | null;
  p70_total_high_gbp?: number | string | null;
  totals?: {
    p70_total_low_gbp?: number | string | null;
    p70_total_high_gbp?: number | string | null;
    estimated_total_gbp?: number | string | null;
  } | null;

  // misc meta
  confidence?: number | null;
  assumptions?: Record<string, any> | null;
  risk_flags?: Record<string, boolean> | null;
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
const titleCase = (s: string) =>
  s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

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

  // Title & image
  const title = titleCase(String(room.detected_room_type || room.room_type || 'Room'));
  const img = (room.image_url || '')?.trim() || null;

  // Risk flags (truthy only)
  const riskFlags = Object.entries(room.risk_flags || {}).filter(([, v]) => !!v);

  // Parse aggregated arrays
  const materials = useMemo<MaterialCategory[]>(
    () => parseArray<MaterialCategory>(room.materials),
    [room.materials]
  );
  const labour = useMemo<LabourTrade[]>(
    () => parseArray<LabourTrade>(room.labour),
    [room.labour]
  );

  // Totals – prefer explicit with_vat; fall back to legacy names or compute
  const matTotal =
    toInt(room.materials_total_with_vat_gbp) ||
    toInt(room.materials_total_gbp) ||
    materials.reduce(
      (a, m) => a + (toInt(m.gross_gbp) || toInt(m.subtotal_gbp) || 0),
      0
    );

  const labTotal = toInt(room.labour_total_gbp) ||
    labour.reduce((a, l) => a + toInt(l.labour_cost_gbp), 0);

  const grandTotal =
    toInt(room.room_total_with_vat_gbp) ||
    toInt(room.room_total_gbp) ||
    (matTotal + labTotal);

  const conf =
    room.room_confidence != null
      ? clamp01(room.room_confidence)
      : room.confidence != null
      ? clamp01(room.confidence)
      : null;

  const hasAnyLines = materials.length > 0 || labour.length > 0;
  const isZero = !grandTotal || grandTotal <= 0;

  // Optional p70 range
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

        {/* Top-right: total / or "no work" */}
        <div className="absolute top-2 right-2">
          <span
            className={`inline-block text-[11px] ${isZero ? 'bg-slate-700' : 'bg-black/70'} text-white px-2 py-1 rounded-full shadow-sm`}
          >
            {isZero ? 'No work required' : `Total ${formatGBP(grandTotal)}`}
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
        {/* Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {conf !== null && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
              Confidence {pct(conf)}
            </span>
          )}
          {!isZero && matTotal > 0 && (
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
              Materials {formatGBP(matTotal)}
            </span>
          )}
          {!isZero && labTotal > 0 && (
            <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-full">
              Labour {formatGBP(labTotal)}
            </span>
          )}
          {riskFlags.map(([k]) => (
            <span
              key={k}
              className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full"
              title="Potential risk"
            >
              {titleCase(k)}
            </span>
          ))}
          <span className="ml-auto text-[11px] text-slate-500" title="Regional cost basis">
            {room.assumptions?.location_basis || ''}
          </span>
        </div>

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
          <div className="mt-3 border-t pt-3 space-y-5">
            {/* Empty note */}
            {isZero && !hasAnyLines && (
              <div className="text-sm text-slate-600">
                No work required for this room based on our assessment.
              </div>
            )}

            {/* Materials by category (gross-first) */}
            {materials.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1">Materials (by category)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-right">Gross</th>
                        <th className="p-2 text-right">Net</th>
                        <th className="p-2 text-right">VAT</th>
                        <th className="p-2 text-right">Lines</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials
                        .map((m, i) => {
                          const gross = toInt(m.gross_gbp ?? m.subtotal_gbp);
                          const net = toInt(m.net_gbp);
                          const vat = toInt(m.vat_gbp);
                          if (gross <= 0 && net <= 0) return null;
                          return (
                            <tr key={(m.item_key || '') + i} className="border-t">
                              <td className="p-2">{titleCase(m.item_key || 'Category')}</td>
                              <td className="p-2 text-right">{formatGBP(gross)}</td>
                              <td className="p-2 text-right">{net ? formatGBP(net) : '—'}</td>
                              <td className="p-2 text-right">{vat ? formatGBP(vat) : '—'}</td>
                              <td className="p-2 text-right">{m.lines ?? '—'}</td>
                            </tr>
                          );
                        })
                        .filter(Boolean)}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-slate-50">
                        <td className="p-2 font-medium text-right">Materials total</td>
                        <td className="p-2 font-semibold text-right">{formatGBP(matTotal)}</td>
                        <td className="p-2" />
                        <td className="p-2" />
                        <td className="p-2" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Labour by trade */}
            {labour.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1">Labour (by trade)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2 text-left">Trade</th>
                        <th className="p-2 text-right">Cost</th>
                        <th className="p-2 text-right">Hours</th>
                        <th className="p-2 text-right">Crew</th>
                        <th className="p-2 text-right">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labour
                        .map((l, i) => {
                          const cost = toInt(l.labour_cost_gbp);
                          const hours = toNum(l.total_hours);
                          const crew = Math.max(1, toNum(l.crew_size) || 1);
                          const rate = toNum(l.hourly_rate_gbp);
                          if (cost <= 0 && (hours <= 0 || rate <= 0)) return null;

                          const trade =
                            l.trade_name ||
                            l.trade_key ||
                            'Labour';

                          return (
                            <tr key={(l.trade_key || l.trade_name || '') + i} className="border-t">
                              <td className="p-2">{titleCase(trade)}</td>
                              <td className="p-2 text-right">{formatGBP(cost || (hours * crew * rate))}</td>
                              <td className="p-2 text-right">{hours ? hours.toLocaleString() : '—'}</td>
                              <td className="p-2 text-right">{crew || '—'}</td>
                              <td className="p-2 text-right">
                                {rate ? `£${rate.toLocaleString()}/h` : '—'}
                              </td>
                            </tr>
                          );
                        })
                        .filter(Boolean)}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-slate-50">
                        <td className="p-2 font-medium text-right">Labour total</td>
                        <td className="p-2 font-semibold text-right">{formatGBP(labTotal)}</td>
                        <td className="p-2" />
                        <td className="p-2" />
                        <td className="p-2" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
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

      {/* Grand total footer */}
      <div className="px-4 pb-4">
        {!isZero && (
          <div className="text-xs text-slate-700 flex items-center justify-between border-t pt-2">
            <div>
              <span className="font-medium">Room total:</span> {formatGBP(grandTotal)}
            </div>
            <div className="text-slate-500">
              Materials {formatGBP(matTotal)} · Labour {formatGBP(labTotal)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
