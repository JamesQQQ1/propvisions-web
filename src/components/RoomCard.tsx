// src/components/RoomCard.tsx

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
};

function formatGBP(n?: number | string | null) {
  const v = typeof n === 'string' ? Number(n) : n;
  return Number.isFinite(v as number) ? `£${Math.round(v as number).toLocaleString()}` : '—';
}

export default function RoomCard({ room }: { room: RefurbRow }) {
  let works: Work[] = [];
  if (Array.isArray(room.works)) {
    works = room.works as Work[];
  } else if (typeof room.works === 'string') {
    try {
      const parsed = JSON.parse(room.works);
      if (Array.isArray(parsed)) works = parsed as Work[];
    } catch {
      // ignore
    }
  }

  const title = room.detected_room_type || room.room_type || 'room';
  const img = typeof room.image_url === 'string' && room.image_url.trim().length > 0 ? room.image_url : null;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <div className="w-full h-48 bg-slate-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 flex items-center justify-center text-slate-400">No image</div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold capitalize">{title}</h4>
          <span className="text-sm text-slate-700">
            <strong>Total:</strong> {formatGBP(room.estimated_total_gbp)}
          </span>
        </div>

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

        <div className="text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
          <div>Paint: {formatGBP(room.wallpaper_or_paint_gbp)}</div>
          <div>Floor: {formatGBP(room.flooring_gbp)}</div>
          <div>Plumbing: {formatGBP(room.plumbing_gbp)}</div>
          <div>Electrics: {formatGBP(room.electrics_gbp)}</div>
          <div>Damp/Mould: {formatGBP(room.mould_or_damp_gbp)}</div>
          <div>Structure: {formatGBP(room.structure_gbp)}</div>
        </div>
      </div>
    </div>
  );
}
