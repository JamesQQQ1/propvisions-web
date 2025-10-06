'use client';

import { useState } from 'react';
import type { UiRoom } from '@/lib/rooms';
import { formatCurrency, getTopRoomsByCost, hasAnyCostSplit } from '@/lib/rooms';

interface RoomCardProps {
  room: UiRoom;
  allRooms?: UiRoom[];
  showCharts?: boolean;
}

const PLACEHOLDER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
    <rect width="100%" height="100%" fill="#f8fafc"/>
    <g transform="translate(160,120)">
      <circle r="20" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M-8,-8 L8,-8 L8,8 L-8,8 Z" fill="#94a3b8"/>
      <circle cx="-4" cy="-4" r="2" fill="#64748b"/>
      <text y="40" font-family="system-ui" font-size="12" fill="#64748b" text-anchor="middle">No image available</text>
    </g>
  </svg>
`)}`;

function MiniBarChart({ rooms, maxRooms = 5 }: { rooms: UiRoom[]; maxRooms?: number }) {
  const topRooms = getTopRoomsByCost(rooms, maxRooms);
  const maxValue = Math.max(...topRooms.map(r => r.total_with_vat));

  if (topRooms.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-700 mb-2">Top Rooms by Cost</div>
      {topRooms.map((room) => {
        const width = maxValue > 0 ? (room.total_with_vat / maxValue) * 100 : 0;
        return (
          <div key={room.room_name} className="flex items-center gap-2 text-xs">
            <div className="w-16 truncate text-slate-600">{room.display_name}</div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="w-12 text-right tabular-nums">{formatCurrency(room.total_with_vat)}</div>
          </div>
        );
      })}
    </div>
  );
}

function MiniDonutChart({ labour, materials }: { labour: number | null; materials: number | null }) {
  const labourVal = labour || 0;
  const materialsVal = materials || 0;
  const total = labourVal + materialsVal;

  if (total === 0) return null;

  const labourPerc = (labourVal / total) * 100;
  const materialsPerc = (materialsVal / total) * 100;

  const gradientStyle = {
    background: `conic-gradient(from 0deg, #3b82f6 0% ${labourPerc}%, #10b981 ${labourPerc}% 100%)`
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-700">Cost Breakdown</div>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
          style={gradientStyle}
        />
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Labour {labourPerc.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Materials {materialsPerc.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomCard({ room, allRooms = [], showCharts = false }: RoomCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = room.image_urls;
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[currentImageIndex] : null;
  const thumbnails = images.slice(1, 5); // Show up to 4 thumbnails

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Format room subtitle with area and windows
  const subtitle = [
    room.area_sqm ? `${room.area_sqm.toFixed(1)} m²` : null,
    room.area_sq_ft ? `${room.area_sq_ft.toFixed(1)} ft²` : null,
    room.window_count ? `${room.window_count} window${room.window_count !== 1 ? 's' : ''}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
      {/* Header */}
      <div className="p-4 pb-0">
        <h3 className="text-lg font-semibold text-slate-900">
          {room.display_name}
          {room.floor && <span className="text-sm font-normal text-slate-600 ml-1">({room.floor} Floor)</span>}
        </h3>
        {subtitle && (
          <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Image Section */}
      <div className="relative w-full h-48 bg-slate-50 overflow-hidden mx-4 mt-3 rounded-lg">
        <img
          className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-300"
          src={currentImage || PLACEHOLDER_SVG}
          alt={currentImage ? `${room.display_name}` : 'No image available'}
          loading="lazy"
        />

        {/* Image counter */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {hasImages && images.length > 1 && (
            <div className="bg-black/70 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
              {currentImageIndex + 1}/{images.length}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {hasImages && images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-700 hover:bg-white transition-colors shadow-sm"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-700 hover:bg-white transition-colors shadow-sm"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {thumbnails.length > 0 && (
        <div className="p-3 mx-1">
          <div className="flex gap-2 overflow-x-auto">
            {thumbnails.map((url, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i + 1)}
                className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors"
              >
                <img
                  src={url}
                  alt={`${room.display_name} view ${i + 2}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 pt-2">
        {/* Cost Information */}
        <div className="space-y-3">
          {/* Total Cost */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-sm font-medium text-slate-800 mb-1">Total (incl. VAT)</div>
            <div className="text-lg font-bold text-slate-900">
              {formatCurrency(room.total_with_vat)}
            </div>
            {room.total_without_vat && (
              <div className="text-xs text-slate-600 mt-1">
                Ex VAT: {formatCurrency(room.total_without_vat)}
              </div>
            )}
          </div>

          {/* Labour/Materials Split */}
          {room.has_cost_split ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-xs font-medium text-blue-800 mb-1">Labour</div>
                <div className="text-sm font-bold text-blue-900">
                  {formatCurrency(room.labour_total_gbp || 0)}
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <div className="text-xs font-medium text-emerald-800 mb-1">Materials</div>
                <div className="text-sm font-bold text-emerald-900">
                  {formatCurrency(room.materials_total_gbp || 0)}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
              <div
                className="text-xs text-amber-800 cursor-help"
                title="Granular labour/materials split was not included in the properties payload for this room."
              >
                Split unavailable
              </div>
            </div>
          )}
        </div>

        {/* Charts */}
        {showCharts && allRooms.length > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <MiniBarChart rooms={allRooms} />
            {hasAnyCostSplit(allRooms) && (
              <MiniDonutChart
                labour={room.labour_total_gbp}
                materials={room.materials_total_gbp}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}