'use client';

import { useState, useMemo } from 'react';
import type { AggregatedRoom } from '@/types/refurb';
import { formatCurrency } from '@/lib/rooms';

interface RoomCardProps {
  room: AggregatedRoom;
  showMiniCharts?: boolean;
  allRooms?: AggregatedRoom[];
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

function MiniBarChart({ rooms, maxRooms = 5 }: { rooms: AggregatedRoom[]; maxRooms?: number }) {
  const topRooms = useMemo(() =>
    rooms
      .filter(r => r.total_gbp > 0)
      .sort((a, b) => b.total_gbp - a.total_gbp)
      .slice(0, maxRooms),
    [rooms, maxRooms]
  );

  const maxValue = Math.max(...topRooms.map(r => r.total_gbp));

  if (topRooms.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-700 mb-2">Top Rooms by Cost</div>
      {topRooms.map((room, i) => {
        const width = maxValue > 0 ? (room.total_gbp / maxValue) * 100 : 0;
        return (
          <div key={room.identity} className="flex items-center gap-2 text-xs">
            <div className="w-16 truncate text-slate-600">{room.displayName}</div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="w-12 text-right tabular-nums">{formatCurrency(room.total_gbp)}</div>
          </div>
        );
      })}
    </div>
  );
}

function MiniDonutChart({ labour, materials }: { labour: number; materials: number }) {
  const total = labour + materials;
  if (total === 0) return null;

  const labourPerc = (labour / total) * 100;
  const materialsPerc = (materials / total) * 100;

  // Simple donut using conic-gradient
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

export default function RoomCard({ room, showMiniCharts = false, allRooms = [] }: RoomCardProps) {
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
      {/* Image Section */}
      <div className="relative w-full h-48 bg-slate-50 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-300"
          src={currentImage || PLACEHOLDER_SVG}
          alt={currentImage ? `${room.displayName}` : 'No image available'}
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

        {/* Floor badge */}
        {room.floor && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur text-slate-700 text-xs px-2 py-1 rounded-full font-medium">
              {room.floor} Floor
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {thumbnails.length > 0 && (
        <div className="p-3 border-b border-slate-100">
          <div className="flex gap-2 overflow-x-auto">
            {thumbnails.map((url, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i + 1)}
                className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${room.displayName} view ${i + 2}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Title */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {room.displayName}
          </h3>
        </div>

        {/* Cost Pills */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
            <div className="text-xs font-medium text-emerald-800 mb-1" title="Material costs including fixtures, fittings, and consumables">
              Materials
            </div>
            <div className="text-sm font-bold text-emerald-900">
              {formatCurrency(room.materials_total_gbp)}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-xs font-medium text-blue-800 mb-1" title="Labour costs including contractor fees and project management">
              Labour
            </div>
            <div className="text-sm font-bold text-blue-900">
              {formatCurrency(room.labour_total_gbp)}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-xs font-medium text-slate-800 mb-1" title="Total refurbishment cost for this room">
              Total
            </div>
            <div className="text-sm font-bold text-slate-900">
              {formatCurrency(room.total_gbp)}
            </div>
          </div>
        </div>

        {/* Mini charts */}
        {showMiniCharts && (room.total_gbp > 0) && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            {allRooms.length > 1 && <MiniBarChart rooms={allRooms} />}
            {(room.labour_total_gbp > 0 || room.materials_total_gbp > 0) && (
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